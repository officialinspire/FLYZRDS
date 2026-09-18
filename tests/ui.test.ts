// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { IDBFactory } from "fake-indexeddb";
import { expect, it, vi } from "vitest";
import { SaveStore } from "../apps/web/src/storage";

it("connects title, habitat, pause, settings and confirmed reset with opt-in expeditions and camera cleanup", async () => {
  document.body.innerHTML = readFileSync("apps/web/index.html", "utf8")
    .split("<body>")[1]
    .split("</body>")[0];
  const factory = new IDBFactory();
  vi.stubGlobal("indexedDB", factory);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("requestAnimationFrame", () => 0);
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: async (
        _name: string,
        _options: unknown,
        callback: (lock: object) => Promise<void>,
      ) => callback({}),
    },
  });
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
  const get = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  let gpsError: PositionErrorCallback = () => {};
  const clearWatch = vi.fn();
  const watchPosition = vi.fn(
    (_success: PositionCallback, error: PositionErrorCallback) => {
      gpsError = error;
      return 8;
    },
  );
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { watchPosition, clearWatch },
  });
  const cameraTrack = Object.assign(new EventTarget(), {
    stop: vi.fn(),
    getSettings: () => ({ facingMode: "environment" }),
  });
  const cameraStream = Object.assign(new EventTarget(), {
    getTracks: () => [cameraTrack],
    getVideoTracks: () => [cameraTrack],
    getAudioTracks: () => [],
  });
  const getUserMedia = vi.fn(
    async () => cameraStream as unknown as MediaStream,
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  vi.stubGlobal("isSecureContext", true);
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
  HTMLMediaElement.prototype.pause = vi.fn();
  const store = new SaveStore(factory);
  await import("../apps/web/src/main");
  await vi.waitFor(() =>
    expect(get<HTMLButtonElement>("start").disabled).toBe(false),
  );
  const original = await store.load();
  expect(original?.pet.name).toBe("Sprout");
  expect(watchPosition).not.toHaveBeenCalled();
  expect(getUserMedia).not.toHaveBeenCalled();
  get("start").click();
  get("hatch").click();
  expect(get("title-screen").hidden).toBe(true);
  expect(get("habitat-screen").hidden).toBe(false);
  expect(get("state-label").textContent).toContain("DEMO");
  get("pause").click();
  expect(get("state-label").textContent).toContain("RESTING");
  get("pause").click();
  expect(get("state-label").textContent).toContain("DEMO");
  get("feed").click();
  get("feed").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.world.items).toHaveLength(1),
  );
  get("rest").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.world.resting).toBe(true),
  );
  get("habitat-open").click();
  const scenery = get<HTMLSelectElement>("scenery");
  scenery.value = "mushrooms";
  scenery.dispatchEvent(new Event("change"));
  get("habitat-close").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.world.scenery).toBe("mushrooms"),
  );
  const careBeforeDuel = (await store.load())?.world;
  get("duel-open").click();
  expect(get("state-label").textContent).toContain("RESTING");
  get("duel-new").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.progress.matches).toBe(1),
  );
  get("duel-next").click();
  get("duel-next").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.progress.duel?.round).toBe(1),
  );
  get("duel-close").click();
  get("duel-open").click();
  expect(get("duel-result").textContent).toContain("Round 1");
  for (let i = 0; i < 20; i++) {
    const previous = await store.load();
    if (!previous) throw new Error("Missing saved match");
    if (previous.progress.duel?.outcome !== "active") break;
    get("duel-next").click();
    await vi.waitFor(async () =>
      expect((await store.load())?.progress.duel?.round).toBe(
        (previous.progress.duel?.round ?? 0) + 1,
      ),
    );
  }
  const completed = await store.load();
  if (!completed) throw new Error("Missing completed match");
  expect(completed.progress.xp).toBeGreaterThan(0);
  expect(completed.world).toEqual(careBeforeDuel);
  get("duel-next").click();
  expect((await store.load())?.progress.xp).toBe(completed.progress.xp);
  get("duel-close").click();
  get("expedition-open").click();
  get("expedition-indoor").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.exploration.journey?.mode).toBe("indoor"),
  );
  expect(watchPosition).not.toHaveBeenCalled();
  get("expedition-station").click();
  expect((await store.load())?.exploration.journey?.stations).toBe(0);
  const time = vi.spyOn(performance, "now");
  time.mockReturnValue(performance.now() + 20001);
  document.dispatchEvent(new Event("visibilitychange"));
  get("expedition-station").click();
  get("expedition-station").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.exploration.journey?.stations).toBe(1),
  );
  get("expedition-finish").click();
  get("expedition-finish").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.exploration.supplies).toBe(1),
  );
  get("expedition-start").click();
  await vi.waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1));
  gpsError({ code: 1 } as GeolocationPositionError);
  expect(clearWatch).toHaveBeenCalledWith(8);
  expect(get("expedition-status").textContent).toContain("denied");
  get("expedition-indoor").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.exploration.journey?.mode).toBe("indoor"),
  );
  get("expedition-close").click();
  time.mockRestore();
  get("camera-open").click();
  expect(get("state-label").textContent).toContain("RESTING");
  expect(getUserMedia).not.toHaveBeenCalled();
  get("camera-enable").click();
  await vi.waitFor(() =>
    expect(get("camera-status").textContent).toContain("active"),
  );
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(cameraTrack.stop).toHaveBeenCalled();
  expect(get<HTMLVideoElement>("camera-video").srcObject).toBe(null);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(getUserMedia).toHaveBeenCalledTimes(1);
  get("camera-garden").click();
  expect(get("camera-status").textContent).toContain("off");
  get("camera-close").click();
  get("home-link").click();
  get("settings-open").click();
  const motion = get<HTMLInputElement>("motion");
  motion.checked = true;
  motion.dispatchEvent(new Event("change"));
  await vi.waitFor(async () =>
    expect((await store.load())?.settings.reducedMotion).toBe(true),
  );
  get("start").click();
  get("expedition-open").click();
  const beforeFailure = (await store.load())?.exploration;
  const failedWrite = vi
    .spyOn(SaveStore.prototype, "write")
    .mockRejectedValueOnce(new Error("Quota exceeded"));
  get("expedition-finish").click();
  await vi.waitFor(() =>
    expect(get("expedition-status").textContent).toContain("Saving stopped"),
  );
  expect((await store.load())?.exploration).toEqual(beforeFailure);
  expect(get<HTMLButtonElement>("expedition-start").disabled).toBe(true);
  failedWrite.mockRestore();
  get("expedition-close").click();
  get("home-link").click();
  get("reset").click();
  expect(get<HTMLDialogElement>("confirm").open).toBe(true);
  expect((await store.load())?.pet.id).toBe(original?.pet.id);
  get("confirm-cancel").click();
  expect((await store.load())?.pet.id).toBe(original?.pet.id);
  get("reset").click();
  get("confirm-replace").click();
  await vi.waitFor(async () =>
    expect((await store.load())?.pet.id).not.toBe(original?.pet.id),
  );
  expect(get("message").textContent).toContain("saved");
});
