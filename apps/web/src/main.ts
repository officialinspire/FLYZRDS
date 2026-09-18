import "./style.css";
import { loadArt } from "./assets";
import { DemoController } from "./controller";
import {
  DUEL,
  freshProgress,
  type Instruction,
  level,
  type Progress,
  playRound,
  startDuel,
} from "./duel";
import { paintDuel } from "./duel-render";
import { freshExploration } from "./expedition";
import { setupExpeditions } from "./expedition-ui";
import { Ownership } from "./ownership";
import { paint } from "./render";
import { parseImport, type Save, SaveStore } from "./storage";
import {
  advance,
  createWorld,
  FixedClock,
  type ItemKind,
  placeItem,
} from "./world";

function el<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing ${id}`);
  return value as T;
}
const title = el("title-screen"),
  habitat = el("habitat-screen"),
  start = el<HTMLButtonElement>("start"),
  message = el("message");
const settings = el<HTMLDialogElement>("settings"),
  confirmation = el<HTMLDialogElement>("confirm");
const motion = el<HTMLInputElement>("motion"),
  status = el("settings-message");
const controller = new DemoController(),
  store = new SaveStore(),
  ownership = new Ownership(),
  clock = new FixedClock();
let save: Save,
  owns = false,
  safe = false,
  inHabitat = false,
  wantsRun = true,
  writes: Promise<void> = Promise.resolve();
let commitBusy = false;
let replaceAction: (() => Promise<void>) | null = null;
function fresh(): Save {
  const c = new DemoController();
  return {
    version: 4,
    exploration: freshExploration(),
    progress: freshProgress(),
    pet: { id: crypto.randomUUID(), name: "Sprout", hatched: false },
    world: createWorld(),
    controller: c.checkpoint(),
    settings: {
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      sound: false,
    },
    cloud: null,
  };
}
function displayError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
function sync() {
  const running =
    safe &&
    owns &&
    inHabitat &&
    wantsRun &&
    !document.hidden &&
    !commitBusy &&
    !el<HTMLDialogElement>("duel-dialog").open &&
    !el<HTMLDialogElement>("expedition-dialog").open &&
    !settings.open &&
    !confirmation.open &&
    !el<HTMLDialogElement>("habitat-settings").open &&
    save.pet.hatched;
  if (running) controller.start();
  else controller.pause();
  clock.reset();
  el("state-label").textContent = running
    ? "EXPLORING • DEMO"
    : "RESTING • DEMO";
  el("pause").textContent = wantsRun ? "Pause" : "Resume";
  updateCare();
  updateDuel();
  expeditions.update();
}
function persist(): Promise<void> {
  if (!safe || !owns || commitBusy) return writes;
  save.controller = controller.checkpoint();
  const snapshot = structuredClone(save);
  writes = writes
    .then(() => store.write(snapshot))
    .catch((error) => {
      safe = false;
      sync();
      start.disabled = true;
      message.textContent = `Saving stopped: ${displayError(error)}. Export your pet before reloading.`;
      status.textContent = message.textContent;
    });
  return writes;
}
function install(next: Save) {
  save = next;
  controller.restore(save.controller);
  motion.checked = save.settings.reducedMotion;
  el("pet-name").textContent = save.pet.name;
  el("hatch-panel").hidden = save.pet.hatched;
  el("care-panel").hidden = !save.pet.hatched;
  el<HTMLInputElement>("hatch-name").value = save.pet.name;
}
function openSettings() {
  settings.showModal();
  sync();
}
el("settings-open").onclick = openSettings;
el("recovery-settings").onclick = openSettings;
settings.addEventListener("close", () => {
  sync();
  void persist();
});
confirmation.addEventListener("close", () => {
  replaceAction = null;
  sync();
});
start.onclick = () => {
  inHabitat = true;
  title.hidden = true;
  habitat.hidden = false;
  wantsRun = true;
  sync();
};
function home() {
  inHabitat = false;
  title.hidden = false;
  habitat.hidden = true;
  sync();
  void persist();
}
el("back").onclick = home;
el("home-link").onclick = (event) => {
  event.preventDefault();
  home();
};
el("pause").onclick = () => {
  wantsRun = !wantsRun;
  sync();
  void persist();
};
motion.onchange = () => {
  save.settings.reducedMotion = motion.checked;
  void persist();
};
el("export").onclick = () => {
  if (!save) return;
  save.controller = controller.checkpoint();
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "flyzrds-demo-save.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = "Backup exported.";
};
function askReplace(next: Save) {
  if (!owns) {
    status.textContent =
      "This tab is read-only. Close the active tab and reload.";
    return;
  }
  replaceAction = async () => {
    try {
      await writes;
      await store.write(next);
      install(next);
      safe = true;
      el<HTMLButtonElement>("export").disabled = false;
      start.disabled = false;
      el("recovery").hidden = true;
      message.textContent = "Demo pet saved.";
      status.textContent = "Save replaced.";
      home();
    } catch (error) {
      status.textContent = `Could not replace save: ${displayError(error)}`;
    }
  };
  confirmation.showModal();
  sync();
}
el("reset").onclick = () => askReplace(fresh());
el("confirm-cancel").onclick = () => confirmation.close();
el("confirm-replace").onclick = async () => {
  const action = replaceAction;
  el<HTMLButtonElement>("confirm-replace").disabled = true;
  await action?.();
  el<HTMLButtonElement>("confirm-replace").disabled = false;
  confirmation.close();
};
el<HTMLInputElement>("import").onchange = async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  try {
    if (file) {
      if (file.size > 64000) throw new Error("Save file is too large");
      askReplace(parseImport(await file.text()));
    }
  } catch (error) {
    status.textContent = `Restore rejected: ${displayError(error)}. Current save is unchanged.`;
  }
  input.value = "";
};
document.addEventListener("visibilitychange", () => {
  sync();
  if (document.hidden) void persist();
});
window.addEventListener("pagehide", () => {
  controller.pause();
  void persist().finally(() => ownership.dispose());
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
async function boot() {
  install(fresh());
  try {
    owns = await ownership.claim();
    const loaded = await store.load();
    if (loaded) install(loaded);
    if (!owns) {
      message.textContent =
        "Read-only garden: another tab is active, or secure browser locking is unavailable. Close the other tab and reload using HTTPS or localhost.";
      start.textContent = "Garden open elsewhere";
      motion.disabled = true;
      el<HTMLButtonElement>("reset").disabled = true;
      el<HTMLInputElement>("import").disabled = true;
      return;
    }
    // Older records are backed up atomically before writing the current schema.
    await store.write(save);
    safe = true;
    start.disabled = false;
    start.innerHTML = "Enter the garden <span>↗</span>";
  } catch (error) {
    message.textContent = `Save unavailable: ${displayError(error)}.`;
    el<HTMLButtonElement>("export").disabled = true;
    el("recovery").hidden = false;
    start.textContent = "Restore your garden";
  }
  sync();
}
let lastSave = 0;
function frame(now: number) {
  if (controller.state === "running")
    clock.frame(now, () => {
      save.world = advance(save.world, controller);
    });
  if (save) {
    updateCare();
    if (!document.hidden) expeditions.update();
    if (el<HTMLDialogElement>("duel-dialog").open)
      paintDuel(
        el<HTMLCanvasElement>("duel-canvas"),
        save.progress,
        save.settings.reducedMotion,
      );
    const reduced = save.settings.reducedMotion;
    if (inHabitat)
      paint(
        el<HTMLCanvasElement>("habitat-canvas"),
        save.world,
        reduced,
        save.pet.hatched,
      );
    else paint(el<HTMLCanvasElement>("title-canvas"));
    if (now - lastSave > 2000) {
      lastSave = now;
      if (controller.state === "running") void persist();
    }
  }
  requestAnimationFrame(frame);
}
function editable() {
  return safe && owns;
}
function activeCare() {
  return (
    editable() &&
    inHabitat &&
    wantsRun &&
    !document.hidden &&
    save.pet.hatched &&
    !commitBusy &&
    !el<HTMLDialogElement>("duel-dialog").open &&
    !el<HTMLDialogElement>("expedition-dialog").open &&
    !settings.open &&
    !confirmation.open &&
    !el<HTMLDialogElement>("habitat-settings").open
  );
}
function updateCare() {
  if (!save) return;
  for (const key of ["food", "energy", "enrichment", "bond"] as const) {
    const value = Math.round(save.world.needs[key]);
    const output = el(`${key}-value`);
    if (output.textContent !== String(value))
      output.textContent = String(value);
    el<HTMLMeterElement>(`${key}-meter`).value = value;
  }
  for (const key of ["feed", "play", "rest"])
    el<HTMLButtonElement>(key).disabled = !activeCare();
  el<HTMLButtonElement>("hatch").disabled = !editable();
  el<HTMLButtonElement>("habitat-open").disabled = !editable();
  el("rest-text").textContent = save.world.resting ? "Wake" : "Rest";
  if (controller.state === "running")
    el("state-label").textContent =
      `${save.world.animation.toUpperCase()} • DEMO`;
}
function place(kind: ItemKind) {
  if (!activeCare()) return;
  const result = placeItem(
    save.world,
    kind,
    Number(el<HTMLInputElement>("place-x").value) / 100,
  );
  const changed = save.world !== result.world;
  save.world = result.world;
  el("care-message").textContent = result.message;
  if (changed) void persist();
}
el("feed").onclick = () => place("food");
el("play").onclick = () => place("toy");
el("rest").onclick = () => {
  if (!activeCare()) return;
  save.world = {
    ...save.world,
    resting: !save.world.resting,
    animation: save.world.resting ? "idle" : "rest",
    actionUntil: save.world.tick,
  };
  el("care-message").textContent = save.world.resting
    ? "A cozy rest. Energy will recover while the garden is open."
    : "Ready to explore again.";
  updateCare();
  void persist();
};
el("hatch").onclick = () => {
  if (!editable() || save.pet.hatched) return;
  const name = el<HTMLInputElement>("hatch-name").value.trim();
  if (!name || name.length > 24) {
    el("message").textContent = "Choose a name from 1 to 24 characters.";
    return;
  }
  save.pet = { ...save.pet, name, hatched: true };
  install({ ...save, controller: controller.checkpoint() });
  el("care-message").textContent =
    `Welcome, ${name}! Place berries or a toy to get acquainted.`;
  sync();
  void persist();
};
el<HTMLInputElement>("place-x").oninput = () => {
  const x = Number(el<HTMLInputElement>("place-x").value);
  el("place-label").textContent = x < 40 ? "Left" : x > 60 ? "Right" : "Center";
};
el("habitat-open").onclick = () => {
  if (!editable()) return;
  el<HTMLSelectElement>("scenery").value = save.world.scenery;
  el<HTMLDialogElement>("habitat-settings").showModal();
  sync();
};
el<HTMLSelectElement>("scenery").onchange = () => {
  if (!editable()) return;
  save.world.scenery =
    el<HTMLSelectElement>("scenery").value === "mushrooms"
      ? "mushrooms"
      : "moonlit";
  void persist();
};
el("habitat-close").onclick = () =>
  el<HTMLDialogElement>("habitat-settings").close();
el("habitat-settings").addEventListener("close", () => {
  sync();
  void persist();
});
el("export-legacy").onclick = async () => {
  try {
    const backup = await store.previousBackup();
    if (!backup) {
      status.textContent = "No older save needed migration on this device.";
      return;
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "flyzrds-pre-upgrade-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    status.textContent = `Backup unavailable: ${displayError(error)}`;
  }
};
const arena = el<HTMLDialogElement>("duel-dialog");
function updateDuel() {
  if (!save) return;
  const p = save.progress,
    m = p.duel;
  const current = level(p.xp);
  el("level-value").textContent = `Level ${current} / 5 · ${p.xp} demo XP`;
  el("duel-unlock").textContent =
    ["Jade", "Amber", "Cyan", "Violet", "Gold"][current - 1] +
    " accent unlocked";
  el<HTMLButtonElement>("duel-open").disabled =
    !editable() || !save.pet.hatched;
  el<HTMLButtonElement>("duel-new").disabled =
    !editable() || commitBusy || m?.outcome === "active";
  el<HTMLButtonElement>("duel-next").disabled =
    !editable() || commitBusy || document.hidden || m?.outcome !== "active";
  el<HTMLButtonElement>("duel-close").disabled = commitBusy;
  el<HTMLSelectElement>("duel-instruction").disabled = commitBusy;
  for (const side of ["player", "opponent"] as const) {
    const f = m?.[side];
    el(`${side}-shield`).textContent =
      `${f?.shield ?? DUEL.shield} / ${DUEL.shield} shield · ${f?.mana ?? DUEL.mana} / ${DUEL.mana} charge · ${f?.barrier ?? 0} barrier`;
  }
  el("duel-result").textContent = !m
    ? "Start a friendly practice duel."
    : m.outcome === "active"
      ? `Round ${m.round} / ${DUEL.rounds}. Choose an instruction, then advance one round.`
      : `${m.outcome.toUpperCase()} · ${DUEL.rewards[m.outcome]} demo XP (saved once). Both companions recover fully for the next match.`;
  el("duel-log").textContent =
    m?.trace.join("\n\n") ?? "No tactical decisions yet.";
}
async function duelChange(change: (p: Progress) => Progress) {
  if (
    !editable() ||
    commitBusy ||
    document.hidden ||
    !inHabitat ||
    !save.pet.hatched ||
    !arena.open
  )
    return;
  await commitSave((next) => {
    next.progress = change(next.progress);
    return next;
  });
}
async function commitSave(change: (s: Save) => Save): Promise<boolean> {
  if (!editable() || commitBusy || document.hidden) return false;
  commitBusy = true;
  sync();
  try {
    await writes;
    if (!safe) return false;
    const next = structuredClone(save);
    next.controller = controller.checkpoint();
    const changed = change(next);
    // Aggregate progress and any reward commit before visible state installation.
    writes = store.write(changed);
    await writes;
    install(changed);
    return true;
  } catch (error) {
    safe = false;
    writes = Promise.resolve();
    start.disabled = true;
    message.textContent = `Activity saving stopped: ${displayError(error)}. Export your pet before reloading.`;
    status.textContent = message.textContent;
    expeditions.stop("Saving stopped. Export your save before reloading.");
    return false;
  } finally {
    commitBusy = false;
    sync();
  }
}

el("duel-open").onclick = () => {
  if (!editable() || !save.pet.hatched || !inHabitat) return;
  arena.showModal();
  sync();
  void persist();
};
el("duel-new").onclick = () => void duelChange(startDuel);
el("duel-next").onclick = () =>
  void duelChange((p) =>
    playRound(
      p,
      el<HTMLSelectElement>("duel-instruction").value as Instruction,
      controller.checkpoint(),
    ),
  );
el("duel-close").onclick = () => {
  if (!commitBusy) arena.close();
};
arena.addEventListener("cancel", (event) => {
  if (commitBusy) event.preventDefault();
});
arena.addEventListener("close", () => {
  sync();
  void persist();
});
const expeditions = setupExpeditions({
  getSave: () => save,
  editable,
  busy: () => commitBusy,
  sync,
  commit: commitSave,
});
void loadArt().catch((error) => {
  message.textContent = displayError(error);
});
void boot();
requestAnimationFrame(frame);
