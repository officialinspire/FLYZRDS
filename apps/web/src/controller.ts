import {
  type Action,
  type BrainTransport,
  type Checkpoint,
  type Controller,
  type Lifecycle,
  number,
  type Observation,
  type RewardEvent,
  text,
  validateAction,
  validateCheckpoint,
  validateObservation,
} from "@flyzrds/contracts";
export class DemoController implements Controller {
  readonly mode = "demo" as const;
  readonly model = "demo-wander-v1";
  state: Lifecycle = "ready";
  private tick = 0;
  private rng: number;
  constructor(private seed = 777) {
    this.rng = number(seed, 1, 0xffffffff, true);
  }
  start() {
    this.state = "running";
  }
  pause() {
    if (this.state === "running") this.state = "paused";
  }
  step(input: Observation): Action {
    const o = validateObservation(input);
    if (this.state !== "running" || o.tick !== this.tick)
      throw new Error("Controller is paused or tick is stale");
    // Hold each seeded wandering choice for two seconds; avoid visual jitter.
    if (this.tick % 40 === 0) {
      this.rng ^= this.rng << 13;
      this.rng ^= this.rng >>> 17;
      this.rng ^= this.rng << 5;
      this.rng >>>= 0;
    }
    const move =
      o.x < 0.15 ? 1 : o.x > 0.85 ? -1 : this.rng / 0xffffffff > 0.5 ? 1 : -1;
    this.tick++;
    return { version: 1, tick: o.tick, move, interact: false };
  }
  reward(event: RewardEvent) {
    text(event.id);
    number(event.tick, 0, this.tick, true);
    number(event.value, -1, 1); /* No learning or XP in demo foundation. */
  }
  checkpoint(): Checkpoint {
    return {
      version: 1,
      model: this.model,
      mode: this.mode,
      tick: this.tick,
      seed: this.seed,
      rng: this.rng,
    };
  }
  restore(input: Checkpoint) {
    const c = validateCheckpoint(input);
    if (c.model !== this.model || c.mode !== this.mode)
      throw new Error("Checkpoint model mismatch");
    this.tick = c.tick;
    this.seed = c.seed;
    this.rng = c.rng;
    this.state = "paused";
  }
  dispose() {
    this.state = "disconnected";
  }
}
/** Async transport boundary only. No actual neural backend is bundled. */
export class BrainController {
  state: Lifecycle = "disconnected";
  private abort = new AbortController();
  private busy = false;
  private generation = 0;
  constructor(
    readonly model: string,
    private transport: BrainTransport,
  ) {
    text(model);
  }
  async connect() {
    this.abort = new AbortController();
    try {
      await this.transport.connect(this.abort.signal);
      if (!this.abort.signal.aborted) this.state = "ready";
    } catch (error) {
      this.state = "error";
      throw error;
    }
  }
  start() {
    if (this.state !== "ready" && this.state !== "paused")
      throw new Error("Brain is not connected");
    this.state = "running";
  }
  pause() {
    this.generation++;
    if (this.state === "running") this.state = "paused";
  }
  async step(input: Observation): Promise<Action> {
    const o = validateObservation(input);
    if (this.state !== "running" || this.busy)
      throw new Error("Brain is paused or request in flight");
    this.busy = true;
    const generation = this.generation;
    try {
      const action = await this.transport.exchange(o, this.abort.signal);
      if (
        generation !== this.generation ||
        this.abort.signal.aborted ||
        this.state !== "running"
      )
        throw new Error("Discarded response after pause/disconnect");
      return validateAction(action, o.tick);
    } catch (error) {
      if (generation === this.generation && this.state === "running")
        this.state = "error";
      throw error;
    } finally {
      this.busy = false;
    }
  }
  dispose() {
    this.generation++;
    this.abort.abort();
    this.transport.close();
    this.state = "disconnected";
  }
}
