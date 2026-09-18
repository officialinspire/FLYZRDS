import { type Controller, STEP_MS } from "@flyzrds/contracts";
export interface World {
  tick: number;
  x: number;
  direction: number;
}
export function advance(world: World, controller: Controller): World {
  const action = controller.step({
    version: 1,
    tick: world.tick,
    dtMs: STEP_MS,
    x: world.x,
    cue: 0,
  });
  return {
    tick: world.tick + 1,
    x: Math.max(0.1, Math.min(0.9, world.x + action.move * 0.002)),
    direction: action.move || world.direction,
  };
}
/** Drop background/stall elapsed time, never charge catch-up needs. */
export class FixedClock {
  private last: number | null = null;
  private accumulator = 0;
  reset() {
    this.last = null;
    this.accumulator = 0;
  }
  frame(now: number, step: () => void) {
    if (this.last === null) {
      this.last = now;
      return;
    }
    const delta = now - this.last;
    this.last = now;
    if (delta < 0 || delta > 250) {
      this.accumulator = 0;
      return;
    }
    this.accumulator += delta;
    while (this.accumulator >= STEP_MS) {
      step();
      this.accumulator -= STEP_MS;
    }
  }
}
