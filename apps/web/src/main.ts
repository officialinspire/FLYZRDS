import "./style.css";
import { DemoController } from "./controller";
import { Ownership } from "./ownership";
import { paint } from "./render";
import { parseImport, type Save, SaveStore } from "./storage";
import { advance, FixedClock } from "./world";

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
let replaceAction: (() => Promise<void>) | null = null;
function fresh(): Save {
  const c = new DemoController();
  return {
    version: 1,
    pet: { id: crypto.randomUUID(), name: "Sprout" },
    world: { tick: 0, x: 0.5, direction: 1 },
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
    !settings.open &&
    !confirmation.open;
  if (running) controller.start();
  else controller.pause();
  clock.reset();
  el("state-label").textContent = running
    ? "EXPLORING • DEMO"
    : "RESTING • DEMO";
  el("pause").textContent = wantsRun ? "Pause" : "Resume";
}
function persist(): Promise<void> {
  if (!safe || !owns) return writes;
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
    if (!loaded) await store.write(save);
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
    const reduced = save.settings.reducedMotion;
    if (inHabitat)
      paint(
        el<HTMLCanvasElement>("habitat-canvas"),
        save.world.x,
        save.world.tick,
        reduced,
        save.world.direction,
      );
    else paint(el<HTMLCanvasElement>("title-canvas"), 0.5, 0, true);
    if (now - lastSave > 2000) {
      lastSave = now;
      if (controller.state === "running") void persist();
    }
  }
  requestAnimationFrame(frame);
}
void boot();
requestAnimationFrame(frame);
