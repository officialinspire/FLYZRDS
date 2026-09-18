import {
  type Checkpoint,
  number,
  object,
  text,
  validateCheckpoint,
} from "@flyzrds/contracts";
import type { World } from "./world";
export interface Save {
  version: 1;
  pet: { id: string; name: string };
  world: World;
  controller: Checkpoint;
  settings: { reducedMotion: boolean; sound: boolean };
  cloud: null | { checkpointId: string; model: string };
}
export function validateSave(input: unknown): Save {
  const v = object(input);
  if (v.version !== 1)
    throw new Error("Unsupported save version; keep your backup");
  const p = object(v.pet),
    w = object(v.world),
    s = object(v.settings),
    c = validateCheckpoint(v.controller);
  if (c.mode !== "demo" || c.model !== "demo-wander-v1")
    throw new Error("This build only restores demo saves");
  const tick = number(w.tick, 0, Number.MAX_SAFE_INTEGER, true);
  if (tick !== c.tick || v.cloud !== null)
    throw new Error("Inconsistent or unsupported checkpoint");
  if (typeof s.reducedMotion !== "boolean" || typeof s.sound !== "boolean")
    throw new Error("Invalid settings");
  return {
    version: 1,
    pet: { id: text(p.id), name: text(p.name, 24) },
    world: {
      tick,
      x: number(w.x, 0.1, 0.9),
      direction: number(w.direction, -1, 1),
    },
    controller: c,
    settings: { reducedMotion: s.reducedMotion, sound: s.sound },
    cloud: null,
  };
}
export function parseImport(content: string): Save {
  if (content.length > 64_000) throw new Error("Save file is too large");
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
  async write(save: Save): Promise<void> {
    const checked = validateSave(save);
    await this.operation("readwrite", (store) => store.put(checked, "current"));
  }
}
