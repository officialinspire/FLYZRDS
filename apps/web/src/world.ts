import { type Controller, STEP_MS } from "@flyzrds/contracts";
import { BALANCE } from "./balance";
export type Animation =
  | "idle"
  | "walk"
  | "eat"
  | "play"
  | "rest"
  | "cast"
  | "ward"
  | "celebrate";
export type ItemKind = "food" | "toy";
export interface GardenItem {
  id: string;
  kind: ItemKind;
  x: number;
}
export interface Needs {
  food: number;
  energy: number;
  enrichment: number;
  bond: number;
}
export interface World {
  tick: number;
  x: number;
  direction: number;
  needs: Needs;
  items: GardenItem[];
  resting: boolean;
  animation: Animation;
  actionUntil: number;
  cooldown: { food: number; toy: number };
  scenery: "moonlit" | "mushrooms";
}
export function createWorld(): World {
  return {
    tick: 0,
    x: 0.5,
    direction: 1,
    needs: { ...BALANCE.initial },
    items: [],
    resting: false,
    animation: "idle",
    actionUntil: 0,
    cooldown: { food: 0, toy: 0 },
    scenery: "moonlit",
  };
}
const clamp = (n: number) => Math.max(BALANCE.min, Math.min(BALANCE.max, n));
export function placeItem(
  world: World,
  kind: ItemKind,
  x: number,
): { world: World; message: string } {
  if (!Number.isFinite(x) || x < 0.15 || x > 0.85)
    return { world, message: "Choose a position inside the garden." };
  if (world.items.some((item) => item.kind === kind))
    return {
      world,
      message:
        kind === "food"
          ? "Berries are already waiting."
          : "The toy is already in the garden.",
    };
  if (world.tick < world.cooldown[kind])
    return {
      world,
      message: `Ready again in ${Math.ceil(((world.cooldown[kind] - world.tick) * STEP_MS) / 1000)} active seconds.`,
    };
  return {
    world: {
      ...world,
      items: [...world.items, { id: `${kind}-${world.tick}`, kind, x }],
    },
    message:
      kind === "food"
        ? "Berries placed. Your companion will come over."
        : "Star toy placed. Time to explore!",
  };
}
export function advance(world: World, controller: Controller): World {
  const busy = world.tick + 1 < world.actionUntil;
  const rest = world.resting || world.needs.energy < BALANCE.autoRestBelow;
  const target = [...world.items].sort(
    (a, b) => Math.abs(a.x - world.x) - Math.abs(b.x - world.x),
  )[0];
  const action = controller.step({
    version: 1,
    tick: world.tick,
    dtMs: STEP_MS,
    x: world.x,
    cue: target ? 1 : 0,
    targetX: target?.x,
    rest: rest || busy,
  });
  const next: World = {
    ...world,
    tick: world.tick + 1,
    needs: { ...world.needs },
    items: [...world.items],
    cooldown: { ...world.cooldown },
    resting: rest,
  };
  const dt = STEP_MS / 1000;
  next.needs.food = clamp(next.needs.food - BALANCE.perSecond.food * dt);
  next.needs.enrichment = clamp(
    next.needs.enrichment - BALANCE.perSecond.enrichment * dt,
  );
  next.needs.energy = clamp(
    next.needs.energy +
      (rest ? BALANCE.perSecond.restEnergy : -BALANCE.perSecond.energy) * dt,
  );
  if (rest) {
    next.animation = "rest";
    return next;
  }
  if (busy) return next;
  if (world.animation === "eat" || world.animation === "play") {
    next.animation = "celebrate";
    next.actionUntil = next.tick + BALANCE.celebrationTicks;
    return next;
  }
  next.x = Math.max(
    0.1,
    Math.min(0.9, world.x + action.move * BALANCE.speedPerTick),
  );
  next.direction = action.move || world.direction;
  next.animation = action.move === 0 ? "idle" : "walk";
  if (
    target &&
    action.interact &&
    Math.abs(target.x - next.x) <= BALANCE.reach
  ) {
    next.items = next.items.filter((item) => item.id !== target.id);
    next.animation = target.kind === "food" ? "eat" : "play";
    next.actionUntil = next.tick + BALANCE.interactionTicks;
    next.cooldown[target.kind] =
      next.tick +
      (target.kind === "food"
        ? BALANCE.foodCooldownTicks
        : BALANCE.playCooldownTicks);
    if (target.kind === "food")
      next.needs.food = clamp(next.needs.food + BALANCE.foodGain);
    else {
      next.needs.enrichment = clamp(next.needs.enrichment + BALANCE.playGain);
      next.needs.energy = clamp(next.needs.energy - BALANCE.playEnergyCost);
    }
    next.needs.bond = clamp(next.needs.bond + BALANCE.bondGain);
  }
  return next;
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
