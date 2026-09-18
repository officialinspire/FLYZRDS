import {
  beginJourney,
  EXPEDITION,
  ForegroundWatch,
  finishJourney,
  pendingSupplies,
} from "./expedition";
import type { Save } from "./storage";
export interface ActivityHost {
  getSave(): Save;
  editable(): boolean;
  busy(): boolean;
  sync(): void;
  commit(change: (save: Save) => Save): Promise<boolean>;
}
export function setupExpeditions(host: ActivityHost) {
  const get = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const dialog = get<HTMLDialogElement>("expedition-dialog");
  let running = false,
    indoorSince = 0;
  let feedback = "Choose a foreground walk or an indoor observation quest.";
  const watch = new ForegroundWatch(
    navigator.geolocation,
    (meters, reason) => {
      if (!running || document.hidden || !dialog.open || !host.editable()) {
        pause();
        return;
      }
      feedback = reason;
      if (meters > 0 && !host.busy())
        void host
          .commit((s) => {
            const j = s.exploration.journey;
            if (j && !j.finished && j.mode === "walk")
              j.meters = Math.min(EXPEDITION.goalMeters, j.meters + meters);
            return s;
          })
          .then(() => {
            if (
              (host.getSave().exploration.journey?.meters ?? 0) >=
              EXPEDITION.goalMeters
            )
              pause("Walking goal reached. Stop safely, then finish.");
          });
      update();
    },
    () =>
      pause(
        "GPS unavailable or permission denied. You can switch to the indoor quest.",
      ),
  );
  function pause(
    reason = "Paused. No distance is tracked until you explicitly resume.",
  ) {
    running = false;
    indoorSince = 0;
    watch.stop();
    feedback = reason;
    update();
  }
  function update() {
    const e = host.getSave()?.exploration;
    if (!e) return;
    const j = e.journey;
    const active = j && !j.finished;
    const ready =
      running &&
      j?.mode === "indoor" &&
      performance.now() - indoorSince >= EXPEDITION.stationMs;
    get<HTMLButtonElement>("expedition-open").disabled =
      !host.editable() || !host.getSave().pet.hatched || host.busy();
    get<HTMLButtonElement>("expedition-start").disabled =
      !host.editable() ||
      host.busy() ||
      running ||
      (active && j.mode !== "walk") ||
      document.hidden;
    get<HTMLButtonElement>("expedition-indoor").disabled =
      !host.editable() || host.busy() || running || document.hidden;
    get<HTMLButtonElement>("expedition-pause").disabled = !running;
    get<HTMLButtonElement>("expedition-finish").disabled =
      !host.editable() || host.busy() || !active;
    get<HTMLButtonElement>("expedition-close").disabled = host.busy();
    get<HTMLButtonElement>("expedition-station").disabled =
      !ready ||
      host.busy() ||
      !active ||
      (j?.stations ?? 0) >= EXPEDITION.stations;
    get("supplies-value").textContent =
      `${e.supplies} exploration supplies · ${e.earnedToday} / ${EXPEDITION.dailyCap} earned on the last claim day`;
    get("expedition-progress").textContent = !j
      ? "No expedition yet."
      : `${j.finished ? "Finished" : running ? "Active" : "Paused"} · ${j.mode === "walk" ? `${Math.floor(j.meters)} / 500 accepted meters` : `${j.stations} / 5 observations`} · ${pendingSupplies(e)} potential demo supplies (daily/inventory caps apply).`;
    get("expedition-status").textContent = feedback;
    get("indoor-prompt").textContent =
      j?.mode === "indoor" && active
        ? [
            "Observe your companion's armor shapes.",
            "Look for three shades in the garden.",
            "Notice the companion's idle movement.",
            "Observe the silhouette of its tail.",
            "Notice one detail you missed before.",
          ][Math.min(j.stations, 4)] +
          (running
            ? ready
              ? " Ready to record this observation."
              : ` Observe for ${Math.max(0, Math.ceil((EXPEDITION.stationMs - (performance.now() - indoorSince)) / 1000))} more seconds.`
            : " Resume the indoor quest when ready.")
        : "Indoor observations offer the same maximum reward without walking or GPS.";
  }
  async function start(mode: "walk" | "indoor") {
    if (
      !host.editable() ||
      host.busy() ||
      running ||
      document.hidden ||
      !dialog.open
    )
      return;
    if (mode === "walk" && !window.isSecureContext) {
      feedback =
        "Location requires HTTPS or localhost. Use the indoor quest here.";
      update();
      return;
    }
    const current = host.getSave().exploration.journey;
    if (
      mode === "walk" &&
      current &&
      !current.finished &&
      current.mode !== mode
    )
      return;
    const ok = await host.commit((s) => {
      s.exploration = beginJourney(s.exploration, mode);
      // The explicit indoor control explains that switching resets unclaimed distance.
      if (mode === "indoor" && s.exploration.journey?.mode === "walk")
        s.exploration.journey = {
          ...s.exploration.journey,
          mode: "indoor",
          meters: 0,
          stations: 0,
        };
      return s;
    });
    if (!ok || !dialog.open || document.hidden) return;
    running = true;
    indoorSince = performance.now();
    feedback =
      mode === "walk"
        ? "Waiting for GPS. Put the phone away; use controls only at stops. Hidden/locked screens pause tracking."
        : "Indoor quest active. Observe each prompt; no location or movement required.";
    if (mode === "walk") watch.start();
    update();
  }
  get("expedition-open").onclick = () => {
    if (!host.editable() || !host.getSave().pet.hatched) return;
    dialog.showModal();
    host.sync();
    update();
  };
  get("expedition-start").onclick = () => void start("walk");
  get("expedition-indoor").onclick = () => void start("indoor");
  get("expedition-pause").onclick = () => pause();
  get("expedition-station").onclick = async () => {
    if (
      !running ||
      document.hidden ||
      !dialog.open ||
      performance.now() - indoorSince < EXPEDITION.stationMs ||
      host.busy()
    )
      return;
    const ok = await host.commit((s) => {
      const j = s.exploration.journey;
      if (j?.mode === "indoor" && !j.finished)
        j.stations = Math.min(EXPEDITION.stations, j.stations + 1);
      return s;
    });
    if (ok) indoorSince = performance.now();
    if (host.getSave().exploration.journey?.stations === EXPEDITION.stations)
      pause("Indoor goal reached. Finish to save your capped reward.");
    update();
  };
  get("expedition-finish").onclick = async () => {
    if (host.busy() || !host.editable() || document.hidden || !dialog.open)
      return;
    pause();
    const before = host.getSave().exploration.supplies;
    const ok = await host.commit((s) => {
      s.exploration = finishJourney(s.exploration, Date.now());
      return s;
    });
    feedback = ok
      ? `Finished. ${host.getSave().exploration.supplies - before} demo supplies saved once.`
      : "Saving stopped. Your previous saved expedition is preserved. Export your save before reloading.";
    update();
  };
  get("expedition-close").onclick = () => {
    if (!host.busy()) dialog.close();
  };
  dialog.addEventListener("cancel", (e) => {
    if (host.busy()) e.preventDefault();
  });
  dialog.addEventListener("close", () => {
    pause();
    host.sync();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden)
      pause(
        "Page hidden or phone locked: expedition paused; no background tracking. Resume explicitly.",
      );
  });
  window.addEventListener("pagehide", () => pause());
  return { update, stop: pause };
}
