import { IDBFactory } from "fake-indexeddb";
import { expect, it } from "vitest";
import { DemoController } from "../apps/web/src/controller";
import {
  DUEL,
  freshProgress,
  legal,
  level,
  playRound,
  resolveRound,
  settle,
  startDuel,
  validateProgress,
} from "../apps/web/src/duel";
import { freshExploration } from "../apps/web/src/expedition";
import { type Save, SaveStore } from "../apps/web/src/storage";
import { createWorld } from "../apps/web/src/world";

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Missing fixture");
  return value;
}
const checkpoint = new DemoController().checkpoint();
function save(): Save {
  return {
    version: 4,
    exploration: freshExploration(),
    progress: startDuel(freshProgress()),
    pet: { id: "arena-pet", name: "Fern", hatched: true },
    world: createWorld(),
    controller: checkpoint,
    settings: { reducedMotion: false, sound: false },
    cloud: null,
  };
}
it("enforces mana, cooldowns and simultaneous shield outcomes without injury", () => {
  const match = required(startDuel(freshProgress()).duel);
  const ward = resolveRound(match, "Ward", "Spark");
  expect(ward.player.shield).toBe(30);
  expect(ward.player.mana).toBe(5);
  expect(legal(ward.player, ward.round)).not.toContain("Ward");
  expect(() => resolveRound(ward, "Ward", "Spark")).toThrow();
  expect(legal(match.player, 0)).not.toContain("Bloom");
  match.player.shield = match.opponent.shield = 8;
  expect(resolveRound(match, "Spark", "Spark").outcome).toBe("draw");
  match.player.shield = 9;
  expect(resolveRound(match, "Spark", "Spark").outcome).toBe("win");
  match.player.shield = 7;
  match.opponent.shield = 9;
  const defeat = resolveRound(match, "Spark", "Spark");
  expect(defeat.outcome).toBe("loss");
  const recovered = startDuel(
    settle({ ...freshProgress(), matches: 1, duel: defeat }),
  );
  expect(recovered.duel?.player.shield).toBe(DUEL.shield);
  expect(recovered.xp).toBe(20);
  match.round = 19;
  expect(resolveRound(match, "Rest", "Rest").outcome).toBe("loss");
});
it("resumes deterministic rounds and awards XP once in the same durable save", async () => {
  const store = new SaveStore(new IDBFactory());
  const original = save();
  original.progress = playRound(original.progress, "attack", checkpoint);
  await store.write(original);
  const loaded = required(await store.load());
  expect(playRound(loaded.progress, "guard", checkpoint)).toEqual(
    playRound(original.progress, "guard", checkpoint),
  );
  for (let i = 0; i < DUEL.rounds; i++)
    loaded.progress = playRound(loaded.progress, "attack", checkpoint);
  expect(loaded.progress.duel?.outcome).not.toBe("active");
  await store.write(loaded);
  const completed = required(await store.load());
  expect(settle(completed.progress)).toEqual(completed.progress);
  expect(playRound(completed.progress, "attack", checkpoint)).toEqual(
    completed.progress,
  );
  expect(completed.world).toEqual(original.world);
  expect(completed.controller).toEqual(checkpoint);
  expect(completed.progress.xp).toBeGreaterThan(0);
  expect(DUEL.levels.map(level)).toEqual([1, 2, 3, 4, 5]);
  expect(JSON.parse(required(completed.progress.duel).trace[0])).toHaveProperty(
    "controller.output",
  );
});
it("rejects malformed progress and preserves the prior save", async () => {
  const store = new SaveStore(new IDBFactory());
  const original = save();
  await store.write(original);
  for (const mutation of [
    (s: Save) => {
      s.progress.xp = Number.NaN;
    },
    (s: Save) => {
      s.progress.rewardedMatch = 1;
    },
    (s: Save) => {
      required(s.progress.duel).outcome = "win";
    },
    (s: Save) => {
      required(s.progress.duel).trace.push("invalid");
    },
  ]) {
    const corrupt = structuredClone(original);
    mutation(corrupt);
    await expect(store.write(corrupt)).rejects.toThrow();
    expect(await store.load()).toEqual(original);
  }
  expect(() => validateProgress({ ...freshProgress(), matches: 1 })).toThrow();
});
it("backs up v2 before migration while preserving pet, world and controller", async () => {
  const factory = new IDBFactory();
  const store = new SaveStore(factory);
  const current = save();
  const { progress: _progress, ...rest } = current;
  const legacy = { ...rest, version: 2 };
  await new Promise<void>((resolve, reject) => {
    const request = factory.open("flyzrds-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("saves");
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(legacy, "current");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
  const migrated = required(await store.load());
  expect(migrated.progress).toEqual(freshProgress());
  expect(migrated.controller).toEqual(checkpoint);
  await store.write(migrated);
  expect(await store.previousBackup()).toEqual(legacy);
  expect((await store.load())?.pet).toEqual(current.pet);
});
