// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { IDBFactory } from "fake-indexeddb";
import { expect, it, vi } from "vitest";
import { SaveStore } from "../apps/web/src/storage";

it("connects title, habitat, pause, settings and confirmed reset without requesting sensors", async () => {
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
  const store = new SaveStore(factory);
  await import("../apps/web/src/main");
  await vi.waitFor(() =>
    expect(get<HTMLButtonElement>("start").disabled).toBe(false),
  );
  const original = await store.load();
  expect(original?.pet.name).toBe("Sprout");
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
  get("home-link").click();
  get("settings-open").click();
  const motion = get<HTMLInputElement>("motion");
  motion.checked = true;
  motion.dispatchEvent(new Event("change"));
  await vi.waitFor(async () =>
    expect((await store.load())?.settings.reducedMotion).toBe(true),
  );
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
