/** Versioned boundary. Distance: normalized habitat units; time: milliseconds. */
export const VERSION = 1 as const;
export const STEP_MS = 50;
export type Mode = "demo" | "reduced-model" | "live-neural";
export type Lifecycle =
  | "ready"
  | "running"
  | "paused"
  | "disconnected"
  | "error";
export interface Observation {
  version: 1;
  tick: number;
  dtMs: number;
  x: number;
  cue: number;
}
export interface Action {
  version: 1;
  tick: number;
  move: number;
  interact: boolean;
}
export interface RewardEvent {
  id: string;
  tick: number;
  value: number;
}
export interface Checkpoint {
  version: 1;
  model: string;
  mode: Mode;
  tick: number;
  seed: number;
  rng: number;
}
export interface Controller {
  readonly mode: Mode;
  readonly model: string;
  readonly state: Lifecycle;
  start(): void;
  pause(): void;
  step(observation: Observation): Action;
  reward(event: RewardEvent): void;
  checkpoint(): Checkpoint;
  restore(checkpoint: Checkpoint): void;
  dispose(): void;
}
export interface BrainTransport {
  connect(signal: AbortSignal): Promise<void>;
  exchange(observation: Observation, signal: AbortSignal): Promise<Action>;
  restore(checkpointId: string, signal: AbortSignal): Promise<void>;
  checkpoint(
    signal: AbortSignal,
  ): Promise<{ checkpointId: string; model: string; tick: number }>;
  close(): void;
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object");
  return value as Record<string, unknown>;
}
export function number(
  value: unknown,
  min: number,
  max: number,
  integer = false,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new Error("Number out of range");
  return value;
}
export function text(value: unknown, max = 80): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error("Invalid text");
  return value;
}
export function validateObservation(value: unknown): Observation {
  const v = object(value);
  if (v.version !== VERSION) throw new Error("Unsupported observation version");
  return {
    version: VERSION,
    tick: number(v.tick, 0, Number.MAX_SAFE_INTEGER, true),
    dtMs: number(v.dtMs, 1, 100),
    x: number(v.x, 0, 1),
    cue: number(v.cue, 0, 1),
  };
}
export function validateAction(value: unknown, tick: number): Action {
  const v = object(value);
  if (
    v.version !== VERSION ||
    v.tick !== tick ||
    typeof v.interact !== "boolean"
  )
    throw new Error("Invalid or stale action");
  return {
    version: VERSION,
    tick,
    move: number(v.move, -1, 1),
    interact: v.interact,
  };
}
export function validateCheckpoint(value: unknown): Checkpoint {
  const v = object(value);
  if (
    v.version !== VERSION ||
    !["demo", "reduced-model", "live-neural"].includes(String(v.mode))
  )
    throw new Error("Unsupported checkpoint");
  return {
    version: VERSION,
    mode: v.mode as Mode,
    model: text(v.model),
    tick: number(v.tick, 0, Number.MAX_SAFE_INTEGER, true),
    seed: number(v.seed, 1, 0xffffffff, true),
    rng: number(v.rng, 1, 0xffffffff, true),
  };
}
