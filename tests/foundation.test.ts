import {
  type BrainTransport,
  type Observation,
  validateAction,
  validateObservation,
} from "@flyzrds/contracts";
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { BrainController, DemoController } from "../apps/web/src/controller";
import { Ownership } from "../apps/web/src/ownership";
import {
  parseImport,
  type Save,
  SaveStore,
  validateSave,
} from "../apps/web/src/storage";
import { advance, FixedClock } from "../apps/web/src/world";

function fixture(): Save {
  return {
    version: 1,
    pet: { id: "pet-123", name: "Sprout" },
    world: { tick: 0, x: 0.5, direction: 1 },
    controller: new DemoController().checkpoint(),
    settings: { sound: false, reducedMotion: false },
    cloud: null,
  };
}
const observation: Observation = {
  version: 1,
  tick: 0,
  dtMs: 50,
  x: 0.5,
  cue: 0,
};
describe("contract trust boundary", () => {
  it.each([NaN, Infinity, -0.1, 1.1])("rejects invalid coordinate %s", (x) =>
    expect(() => validateObservation({ ...observation, x })).toThrow(),
  );
  it("rejects stale actions and out-of-range movement", () => {
    expect(() =>
      validateAction({ version: 1, tick: 1, move: 0, interact: false }, 0),
    ).toThrow();
    expect(() =>
      validateAction({ version: 1, tick: 0, move: 9, interact: false }, 0),
    ).toThrow();
  });
  it("rejects a future save version without migrating destructively", () =>
    expect(() => validateSave({ ...fixture(), version: 2 })).toThrow());
  it("rejects inconsistent world/checkpoint ticks", () => {
    const s = fixture();
    s.world.tick = 1;
    expect(() => validateSave(s)).toThrow();
  });
  it("rejects neural checkpoints in demo import", () => {
    const s = fixture();
    s.controller.mode = "live-neural";
    expect(() => validateSave(s)).toThrow();
  });
  it("rejects oversized and malformed import", () => {
    expect(() => parseImport(" ".repeat(64001))).toThrow();
    expect(() => parseImport("{bad")).toThrow();
  });
});
describe("deterministic demo and fixed clock", () => {
  it("continues exact trajectory after restore", () => {
    const a = new DemoController(23);
    a.start();
    let world = { tick: 0, x: 0.5, direction: 1 };
    for (let i = 0; i < 123; i++) world = advance(world, a);
    const b = new DemoController();
    b.restore(a.checkpoint());
    b.start();
    let restored = { ...world };
    for (let i = 0; i < 100; i++) {
      world = advance(world, a);
      restored = advance(restored, b);
    }
    expect(restored).toEqual(world);
    expect(b.checkpoint()).toEqual(a.checkpoint());
  });
  it("does not advance while paused or accept a replayed tick", () => {
    const c = new DemoController();
    expect(() => c.step(observation)).toThrow();
    c.start();
    c.step(observation);
    expect(() => c.step(observation)).toThrow();
    c.pause();
    expect(() => c.step({ ...observation, tick: 1 })).toThrow();
  });
  it("drops long gaps and resumes without catch-up ticks", () => {
    const clock = new FixedClock();
    let ticks = 0;
    const step = () => ticks++;
    clock.frame(0, step);
    clock.frame(100, step);
    expect(ticks).toBe(2);
    clock.frame(100000, step);
    expect(ticks).toBe(2);
    clock.reset();
    clock.frame(100050, step);
    expect(ticks).toBe(2);
    clock.frame(100100, step);
    expect(ticks).toBe(3);
  });
});
describe("IndexedDB saves", () => {
  it("retains identity and controller state after reopening", async () => {
    const factory = new IDBFactory();
    const store = new SaveStore(factory);
    const save = fixture();
    await store.write(save);
    expect(await new SaveStore(factory).load()).toEqual(save);
  });
  it("rejects invalid replacements without destroying the old save", async () => {
    const store = new SaveStore(new IDBFactory());
    const save = fixture();
    await store.write(save);
    await expect(
      store.write({ ...save, version: 2 } as unknown as Save),
    ).rejects.toThrow();
    expect(await store.load()).toEqual(save);
  });
  it("reports corruption instead of returning a new pet", async () => {
    const factory = new IDBFactory();
    const store = new SaveStore(factory);
    await store.write(fixture());
    await new Promise<void>((resolve, reject) => {
      const req = factory.open("flyzrds-v1", 1);
      req.onsuccess = () => {
        const db = req.result,
          tx = db.transaction("saves", "readwrite");
        tx.objectStore("saves").put({ version: 99 }, "current");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    await expect(store.load()).rejects.toThrow();
  });
  it("surfaces denied storage access", async () => {
    const denied = {
      open() {
        throw new DOMException("Denied", "SecurityError");
      },
    } as unknown as IDBFactory;
    await expect(new SaveStore(denied).load()).rejects.toThrow("Denied");
  });
});
describe("exclusive ownership", () => {
  it("grants only one tab until release", async () => {
    let held = false;
    const locks = {
      async request(
        _name: string,
        _options: unknown,
        callback: (lock: object | null) => Promise<void>,
      ) {
        if (held) return callback(null);
        held = true;
        try {
          await callback({});
        } finally {
          held = false;
        }
      },
    } as unknown as LockManager;
    const first = new Ownership(),
      second = new Ownership();
    expect(await first.claim(locks)).toBe(true);
    expect(await second.claim(locks)).toBe(false);
    first.dispose();
    await Promise.resolve();
    await Promise.resolve();
    expect(await second.claim(locks)).toBe(true);
    second.dispose();
  });
});
describe("brain transport scaffold", () => {
  function transport(exchange: BrainTransport["exchange"]): BrainTransport {
    return {
      async connect() {},
      exchange,
      async restore() {},
      async checkpoint() {
        return { checkpointId: "server-id", model: "test", tick: 0 };
      },
      close() {},
    };
  }
  it("never falls back to demo on a stale response", async () => {
    const b = new BrainController(
      "test",
      transport(async () => ({
        version: 1,
        tick: 9,
        move: 0,
        interact: false,
      })),
    );
    await b.connect();
    b.start();
    await expect(b.step(observation)).rejects.toThrow();
    expect(b.state).toBe("error");
  });
  it("discards a response after disconnect", async () => {
    let finish:
      | ((value: {
          version: 1;
          tick: number;
          move: number;
          interact: boolean;
        }) => void)
      | undefined;
    const b = new BrainController(
      "test",
      transport(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    await b.connect();
    b.start();
    const pending = b.step(observation);
    b.dispose();
    finish?.({ version: 1, tick: 0, move: 0, interact: false });
    await expect(pending).rejects.toThrow();
    expect(b.state).toBe("disconnected");
  });
});
