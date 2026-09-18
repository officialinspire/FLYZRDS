/** All needs are game mechanics, never measurements of subjective feelings. */
export const BALANCE = {
  min: 0,
  max: 100,
  initial: { food: 75, energy: 80, enrichment: 65, bond: 10 },
  perSecond: { food: 0.08, energy: 0.06, enrichment: 0.1, restEnergy: 2 },
  foodGain: 25,
  playGain: 30,
  bondGain: 2,
  playEnergyCost: 3,
  foodCooldownTicks: 400,
  playCooldownTicks: 600,
  interactionTicks: 40,
  celebrationTicks: 20,
  speedPerTick: 0.003,
  reach: 0.018,
  autoRestBelow: 5,
} as const;
