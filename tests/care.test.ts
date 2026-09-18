import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { frameFor, manifest } from "../apps/web/src/assets";
import { BALANCE } from "../apps/web/src/balance";
import { DemoController } from "../apps/web/src/controller";
import { freshProgress } from "../apps/web/src/duel";
import { freshExploration } from "../apps/web/src/expedition";
import { type Save, SaveStore, validateSave } from "../apps/web/src/storage";
import {
  advance,
  createWorld,
  FixedClock,
  placeItem,
} from "../apps/web/src/world";

function seedSave(): Save {
  return {
    version: 4,
    exploration: freshExploration(),
    progress: freshProgress(),
    pet: { id: "care-pet", name: "Fern", hatched: true },
    world: createWorld(),
    controller: new DemoController().checkpoint(),
    settings: { reducedMotion: false, sound: false },
    cloud: null,
  };
}
describe("care loop", () => {
  it("approaches placed food, consumes exactly once and persists cooldown", async () => {
    const c = new DemoController();
    c.start();
    let w = placeItem(createWorld(), "food", 0.8).world;
    const initial = w.needs.bond;
    for (let i = 0; i < 150; i++) w = advance(w, c);
    expect(w.items).toHaveLength(0);
    expect(w.needs.food).toBeGreaterThan(90);
    expect(w.needs.bond).toBe(initial + BALANCE.bondGain);
    expect(placeItem(w, "food", 0.5).world).toBe(w);
    const store = new SaveStore(new IDBFactory());
    await store.write({ ...seedSave(), world: w, controller: c.checkpoint() });
    const loaded = await store.load();
    expect(loaded?.world).toEqual(w);
    expect(
      placeItem(loaded?.world ?? createWorld(), "food", 0.5).world.items,
    ).toHaveLength(0);
  });
  it("rapid placement cannot duplicate a food/toy or award bond", () => {
    let w = createWorld();
    for (let i = 0; i < 200; i++) {
      w = placeItem(w, "food", 0.3).world;
      w = placeItem(w, "toy", 0.7).world;
    }
    expect(w.items).toHaveLength(2);
    expect(w.needs.bond).toBe(BALANCE.initial.bond);
  });
  it("toy interaction increases enrichment once and celebrates", () => {
    const c = new DemoController();
    c.start();
    let w = placeItem(createWorld(), "toy", 0.5).world;
    w.needs.enrichment = 20;
    w = advance(w, c);
    expect(w.animation).toBe("play");
    expect(w.needs.enrichment).toBeGreaterThan(49);
    expect(w.items).toHaveLength(0);
    for (let i = 0; i < BALANCE.interactionTicks; i++) w = advance(w, c);
    expect(w.animation).toBe("celebrate");
    expect(w.needs.bond).toBe(BALANCE.initial.bond + 2);
  });
  it("rest restores energy without movement and stats stay bounded", () => {
    const c = new DemoController();
    c.start();
    let w = createWorld();
    w.resting = true;
    w.needs.energy = 40;
    const x = w.x;
    for (let i = 0; i < 1000; i++) w = advance(w, c);
    expect(w.x).toBe(x);
    expect(w.needs.energy).toBe(100);
    expect(w.animation).toBe("rest");
    for (const value of Object.values(w.needs))
      expect(value).toBeGreaterThanOrEqual(0);
  });
  it("low energy enters forgiving rest and zero food cannot cause death", () => {
    const c = new DemoController();
    c.start();
    const w = createWorld();
    w.needs.energy = 1;
    w.needs.food = 0;
    const next = advance(w, c);
    expect(next.resting).toBe(true);
    expect(next.needs.food).toBe(0);
    expect(next.needs.energy).toBeGreaterThan(1);
  });
  it("hidden/resume clock gaps do not change needs", () => {
    const c = new DemoController();
    c.start();
    let w = createWorld();
    const clock = new FixedClock();
    clock.frame(0, () => {
      w = advance(w, c);
    });
    clock.reset();
    clock.frame(900000, () => {
      w = advance(w, c);
    });
    expect(w).toEqual(createWorld());
  });
  it("rejects invalid placement without moving pet", () => {
    const w = createWorld();
    for (const x of [NaN, Infinity, -1, 1])
      expect(placeItem(w, "food", x).world).toBe(w);
    expect(w.x).toBe(0.5);
  });
});
describe("save upgrade", () => {
  function legacy() {
    return {
      version: 1,
      pet: { id: "old-pet", name: "Sprout" },
      world: { tick: 0, x: 0.7, direction: -1 },
      controller: {
        ...new DemoController().checkpoint(),
        model: "demo-wander-v1",
      },
      settings: { reducedMotion: true, sound: false },
      cloud: null,
    };
  }
  it("retains v1 identity, PRNG and position and marks pet hatched", () => {
    const old = legacy(),
      v2 = validateSave(old);
    expect(v2.version).toBe(4);
    expect(v2.pet).toEqual({ ...old.pet, hatched: true });
    expect(v2.world.x).toBe(0.7);
    expect(v2.controller.rng).toBe(old.controller.rng);
  });
  it("backs up original v1 atomically before saving migrated data", async () => {
    const factory = new IDBFactory(),
      store = new SaveStore(factory);
    await store.write(seedSave());
    const old = legacy();
    await new Promise<void>((resolve, reject) => {
      const req = factory.open("flyzrds-v1", 1);
      req.onsuccess = () => {
        const db = req.result,
          tx = db.transaction("saves", "readwrite");
        tx.objectStore("saves").put(old, "current");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    const loaded = await store.load();
    expect(loaded?.pet.id).toBe("old-pet");
    await store.write(loaded as Save);
    expect(await store.legacyBackup()).toEqual(old);
    expect((await store.load())?.version).toBe(4);
  });
  it("rejects duplicated objects and invalid needs without replacing save", () => {
    const s = seedSave();
    s.world.items = [
      { id: "a", kind: "food", x: 0.3 },
      { id: "b", kind: "food", x: 0.7 },
    ];
    expect(() => validateSave(s)).toThrow();
    s.world.items = [];
    s.world.needs.energy = 101;
    expect(() => validateSave(s)).toThrow();
  });
});
describe("atlas animation contract", () => {
  it("resolves all eight states and freezes reduced motion at first frame", () => {
    for (const key of Object.keys(manifest.animations) as Array<
      keyof typeof manifest.animations
    >) {
      const a = manifest.animations[key];
      expect(frameFor(key, 0, false)).toBe(a.frames[0]);
      expect(a.frames).toContain(frameFor(key, 50, false));
      expect(frameFor(key, 900, true)).toBe(a.frames[0]);
    }
  });
});
