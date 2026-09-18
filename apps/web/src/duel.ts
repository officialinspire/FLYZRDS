import type { Checkpoint } from "@flyzrds/contracts";
import { number, object } from "@flyzrds/contracts";
import { DemoController } from "./controller";

export const DUEL = {
  shield: 30,
  mana: 6,
  rounds: 20,
  maxXp: 700,
  levels: [0, 100, 250, 450, 700],
  rewards: { win: 50, draw: 30, loss: 20 },
  spells: {
    Spark: { cost: 2, cooldown: 0, damage: 8, barrier: 0, heal: 0 },
    Ward: { cost: 2, cooldown: 1, damage: 0, barrier: 8, heal: 0 },
    Bloom: { cost: 3, cooldown: 2, damage: 0, barrier: 0, heal: 7 },
  },
} as const;
export type Spell = keyof typeof DUEL.spells;
export type Choice = Spell | "Rest";
export type Instruction = "attack" | "guard" | "recover";
type Outcome = "active" | "win" | "draw" | "loss";
interface Fighter {
  shield: number;
  mana: number;
  barrier: number;
  ready: Record<Spell, number>;
}
export interface Duel {
  id: number;
  round: number;
  outcome: Outcome;
  player: Fighter;
  opponent: Fighter;
  trace: string[];
}
export interface Progress {
  xp: number;
  matches: number;
  rewardedMatch: number;
  duel: Duel | null;
}
export function freshProgress(): Progress {
  return { xp: 0, matches: 0, rewardedMatch: 0, duel: null };
}
export function level(xp: number) {
  return DUEL.levels.filter((threshold) => xp >= threshold).length;
}
function fighter(): Fighter {
  return {
    shield: DUEL.shield,
    mana: DUEL.mana,
    barrier: 0,
    ready: { Spark: 0, Ward: 0, Bloom: 0 },
  };
}
export function startDuel(progress: Progress): Progress {
  if (progress.duel?.outcome === "active") return progress;
  const id = number(progress.matches + 1, 1, 1000000, true);
  return {
    ...progress,
    matches: id,
    duel: {
      id,
      round: 0,
      outcome: "active",
      player: fighter(),
      opponent: fighter(),
      trace: [],
    },
  };
}
export function legal(f: Fighter, round: number): Spell[] {
  return (Object.keys(DUEL.spells) as Spell[]).filter(
    (spell) =>
      f.mana >= DUEL.spells[spell].cost &&
      f.ready[spell] <= round &&
      (spell !== "Bloom" || f.shield < DUEL.shield),
  );
}
export function chooseTactic(
  match: Duel,
  instruction: Instruction,
  checkpoint: Checkpoint,
) {
  if (!["attack", "guard", "recover"].includes(instruction))
    throw new Error("Invalid instruction");
  const controller = new DemoController();
  controller.restore(checkpoint);
  controller.start();
  const observation = {
    version: 1 as const,
    tick: checkpoint.tick,
    dtMs: 50,
    x: match.player.shield / DUEL.shield,
    cue: 0,
    targetX:
      instruction === "attack" ? 0.2 : instruction === "guard" ? 0.8 : 0.5,
  };
  const output = controller.step(observation);
  const preferred: Spell[] =
    instruction === "attack"
      ? ["Spark", "Ward", "Bloom"]
      : instruction === "guard"
        ? ["Ward", "Spark", "Bloom"]
        : ["Bloom", "Ward", "Spark"];
  const options = preferred.filter((spell) =>
    legal(match.player, match.round).includes(spell),
  );
  const choice: Choice = options.length
    ? options[output.move > 0 && options.length > 1 ? 1 : 0]
    : "Rest";
  return { choice, observation, output, adapter: "scripted-demo-duel-v1" };
}
function cast(f: Fighter, choice: Choice, round: number) {
  if (choice === "Rest") {
    f.mana = Math.min(DUEL.mana, f.mana + 2);
    return;
  }
  if (!legal(f, round).includes(choice))
    throw new Error("Spell unavailable: mana or cooldown");
  const spell = DUEL.spells[choice];
  f.mana -= spell.cost;
  f.ready[choice] = round + spell.cooldown + 1;
  f.shield = Math.min(DUEL.shield, f.shield + spell.heal);
  f.barrier = Math.min(16, f.barrier + spell.barrier);
}
function hit(f: Fighter, damage: number) {
  const absorbed = Math.min(damage, f.barrier);
  f.barrier -= absorbed;
  f.shield = Math.max(0, f.shield - damage + absorbed);
}
export function resolveRound(
  match: Duel,
  playerChoice: Choice,
  opponentChoice: Choice,
): Duel {
  if (match.outcome !== "active") return match;
  const next = structuredClone(match);
  cast(next.player, playerChoice, match.round);
  cast(next.opponent, opponentChoice, match.round);
  const damage = (choice: Choice) =>
    choice === "Rest" ? 0 : DUEL.spells[choice].damage;
  hit(next.player, damage(opponentChoice));
  hit(next.opponent, damage(playerChoice));
  next.player.mana = Math.min(DUEL.mana, next.player.mana + 1);
  next.opponent.mana = Math.min(DUEL.mana, next.opponent.mana + 1);
  next.round++;
  if (
    !next.player.shield ||
    !next.opponent.shield ||
    next.round === DUEL.rounds
  ) {
    next.outcome =
      next.player.shield === next.opponent.shield
        ? "draw"
        : next.player.shield > next.opponent.shield
          ? "win"
          : "loss";
  }
  return next;
}
export function playRound(
  progress: Progress,
  instruction: Instruction,
  checkpoint: Checkpoint,
): Progress {
  const match = progress.duel;
  if (match?.outcome !== "active") return progress;
  const tactic = chooseTactic(match, instruction, checkpoint);
  const cycle: Spell[] = ["Spark", "Spark", "Ward", "Bloom"];
  const options = legal(match.opponent, match.round);
  const opponentChoice: Choice = options.includes(cycle[match.round % 4])
    ? cycle[match.round % 4]
    : (options[0] ?? "Rest");
  const next = resolveRound(match, tactic.choice, opponentChoice);
  next.trace.push(
    JSON.stringify({
      round: next.round,
      controller: tactic,
      rules: {
        player: tactic.choice,
        opponent: opponentChoice,
        playerShield: next.player.shield,
        opponentShield: next.opponent.shield,
      },
    }),
  );
  return settle({ ...progress, duel: next });
}
export function settle(progress: Progress): Progress {
  const match = progress.duel;
  if (
    !match ||
    match.outcome === "active" ||
    match.id <= progress.rewardedMatch
  )
    return progress;
  return {
    ...progress,
    rewardedMatch: match.id,
    xp: Math.min(DUEL.maxXp, progress.xp + DUEL.rewards[match.outcome]),
  };
}
export function validateProgress(input: unknown): Progress {
  const p = object(input);
  const matches = number(p.matches, 0, 1000000, true);
  const rewardedMatch = number(p.rewardedMatch, 0, matches, true);
  const result: Progress = {
    xp: number(p.xp, 0, DUEL.maxXp, true),
    matches,
    rewardedMatch,
    duel: null,
  };
  if (p.duel === null) {
    if (matches !== 0 || rewardedMatch !== 0 || result.xp !== 0)
      throw new Error("Missing duel history");
    return result;
  }
  const d = object(p.duel);
  if (!["active", "win", "draw", "loss"].includes(String(d.outcome)))
    throw new Error("Invalid duel outcome");
  const read = (value: unknown): Fighter => {
    const f = object(value),
      r = object(f.ready);
    return {
      shield: number(f.shield, 0, DUEL.shield, true),
      mana: number(f.mana, 0, DUEL.mana, true),
      barrier: number(f.barrier, 0, 16, true),
      ready: {
        Spark: number(r.Spark, 0, DUEL.rounds + 3, true),
        Ward: number(r.Ward, 0, DUEL.rounds + 3, true),
        Bloom: number(r.Bloom, 0, DUEL.rounds + 3, true),
      },
    };
  };
  const round = number(d.round, 0, DUEL.rounds, true);
  if (
    !Array.isArray(d.trace) ||
    d.trace.length !== round ||
    d.trace.some((t) => typeof t !== "string" || t.length > 1200)
  )
    throw new Error("Invalid duel trace");
  result.duel = {
    id: number(d.id, matches, matches, true),
    round,
    outcome: d.outcome as Outcome,
    player: read(d.player),
    opponent: read(d.opponent),
    trace: [...d.trace],
  };
  const m = result.duel;
  const ended = !m.player.shield || !m.opponent.shield || round === DUEL.rounds;
  const expected = ended
    ? m.player.shield === m.opponent.shield
      ? "draw"
      : m.player.shield > m.opponent.shield
        ? "win"
        : "loss"
    : "active";
  if (
    m.outcome !== expected ||
    rewardedMatch !== (ended ? matches : matches - 1)
  )
    throw new Error("Inconsistent duel completion/reward");
  return result;
}
