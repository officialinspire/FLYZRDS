import {
  boolean,
  type Checkpoint,
  number,
  object,
  text,
  validateCheckpoint,
} from "@flyzrds/contracts";
import { freshProgress, type Progress, validateProgress } from "./duel";
import {
  type Animation,
  createWorld,
  type ItemKind,
  type World,
} from "./world";
export interface Save {
  version: 3;
  progress: Progress;
  pet: { id: string; name: string; hatched: boolean };
  world: World;
  controller: Checkpoint;
  settings: { reducedMotion: boolean; sound: boolean };
  cloud: null | { checkpointId: string; model: string };
}
export function validateSave(input: unknown): Save {
  const v = object(input);
  if (v.version !== 1 && v.version !== 2 && v.version !== 3)
    throw new Error("Unsupported save version; keep your backup");
  const p = object(v.pet),
    w = object(v.world),
    s = object(v.settings),
    c = validateCheckpoint(v.controller);
  const legacy = v.version === 1;
  if (
    c.mode !== "demo" ||
    c.model !== (legacy ? "demo-wander-v1" : "demo-care-v2")
  )
    throw new Error("This build only restores compatible demo saves");
  const tick = number(w.tick, 0, Number.MAX_SAFE_INTEGER, true);
  if (tick !== c.tick || v.cloud !== null)
    throw new Error("Inconsistent or unsupported checkpoint");
  const world: World = {
    ...createWorld(),
    tick,
    x: number(w.x, 0.1, 0.9),
    direction: number(w.direction, -1, 1),
  };
  if (!legacy) {
    const needs = object(w.needs),
      cooldown = object(w.cooldown);
    world.needs = {
      food: number(needs.food, 0, 100),
      energy: number(needs.energy, 0, 100),
      enrichment: number(needs.enrichment, 0, 100),
      bond: number(needs.bond, 0, 100),
    };
    world.cooldown = {
      food: number(cooldown.food, 0, tick + 600, true),
      toy: number(cooldown.toy, 0, tick + 600, true),
    };
    world.resting = boolean(w.resting);
    world.actionUntil = number(w.actionUntil, 0, tick + 40, true);
    if (
      !["idle", "walk", "eat", "play", "rest", "celebrate"].includes(
        String(w.animation),
      )
    )
      throw new Error("Invalid care animation");
    world.animation = w.animation as Animation;
    if (w.scenery !== "moonlit" && w.scenery !== "mushrooms")
      throw new Error("Invalid habitat");
    world.scenery = w.scenery;
    if (!Array.isArray(w.items) || w.items.length > 2)
      throw new Error("Invalid garden items");
    const ids = new Set<string>(),
      kinds = new Set<string>();
    world.items = w.items.map((raw) => {
      const i = object(raw);
      const id = text(i.id);
      if (
        (i.kind !== "food" && i.kind !== "toy") ||
        ids.has(id) ||
        kinds.has(String(i.kind))
      )
        throw new Error("Duplicate or invalid item");
      ids.add(id);
      kinds.add(String(i.kind));
      return { id, kind: i.kind as ItemKind, x: number(i.x, 0.15, 0.85) };
    });
  }
  return {
    version: 3,
    progress: v.version === 3 ? validateProgress(v.progress) : freshProgress(),
    pet: {
      id: text(p.id),
      name: text(p.name, 24),
      hatched: legacy ? true : boolean(p.hatched),
    },
    world,
    controller: { ...c, model: "demo-care-v2" },
    settings: {
      reducedMotion: boolean(s.reducedMotion),
      sound: boolean(s.sound),
    },
    cloud: null,
  };
}
export function parseImport(content: string): Save {
  if (content.length > 64000) throw new Error("Save file is too large");
  return validateSave(JSON.parse(content));
}
export class SaveStore {
  constructor(
    private factory: IDBFactory = indexedDB,
    private name = "flyzrds-v1",
  ) {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const r = this.factory.open(this.name, 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("saves");
      };
      r.onerror = () => reject(r.error);
      r.onblocked = () =>
        reject(new Error("Close other FLYZRDS tabs to update storage"));
      r.onsuccess = () => {
        r.result.onversionchange = () => r.result.close();
        resolve(r.result);
      };
    });
  }
  private async operation<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("saves", mode);
      const request = action(tx.objectStore("saves"));
      tx.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      tx.onabort = tx.onerror = () => {
        db.close();
        reject(tx.error ?? request.error ?? new Error("Storage failed"));
      };
    });
  }
  async load(): Promise<Save | null> {
    const raw = await this.operation("readonly", (store) =>
      store.get("current"),
    );
    return raw === undefined ? null : validateSave(raw);
  }
  async legacyBackup(): Promise<unknown> {
    return this.operation("readonly", (store) => store.get("backup-v1"));
  }
  async previousBackup(): Promise<unknown> {
    const v2 = await this.operation("readonly", (store) =>
      store.get("backup-v2"),
    );
    return v2 ?? this.legacyBackup();
  }
  async write(save: Save): Promise<void> {
    const checked = validateSave(save);
    await this.operation("readwrite", (store) => {
      const request = store.get("current");
      request.onsuccess = () => {
        const previous = request.result;
        if (previous?.version === 1) store.put(previous, "backup-v1");
        if (previous?.version === 2) store.put(previous, "backup-v2");
        store.put(checked, "current");
      };
      return request;
    });
  }
}
