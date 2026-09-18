# Practice arena: prompt 07 demo scope

The hatched companion can duel Echo, a practice projection using the same sci-fi
dinosaur art. Spark, Ward and Bloom affect shields only; companions never die or
lose garden needs. A new match restores shields, charge and cooldowns fully.
`apps/web/src/duel.ts` centralizes costs, cooldowns, outcomes, rewards and levels.

Each explicit round resolves both legal actions simultaneously. Rest replenishes
charge when spells are unavailable. After 20 rounds, remaining shields decide the
outcome; equal shields draw. Broad forward/guard/recover instructions become
observations for an isolated fork of the existing demo controller. A fixed adapter
selects a legal spell from its output. Inspectable logs record observation/output
separately from rule effects. This is scripted behavior, not learned combat.
Garden controller state and needs remain unchanged during a match.

Matches pause when closed or hidden and resume from the last saved round.
Version 3 saves contain match state, trace, XP and the rewarded match ID together.
An IndexedDB transaction completes before the visible round installs. Pending
writes block further round actions; failed writes stop mutations. Completed
matches cannot award XP again on reload. Version 1/2 saves migrate with a preserved
pre-upgrade backup; unsupported/corrupt imports cannot overwrite a good save.

Local demo rewards are win 50, draw 30 and loss 20 XP, capped at 700. Level
thresholds are 0/100/250/450/700; accents and star effects unlock through levels
1–5. Rewards are editable local game state, not authoritative online rewards.
There is no PvP, currency, cloud leaderboard or server combat reward service.
Online idempotent rewards and server validation remain unimplemented.

# Prompt 06 remains blocked

The development prompt explicitly requires working live closed-loop control
before training. Prompt 05 still fails that gate: measured full-network windows
exceed the interactive budget, cue/navigation decoding is not established, and
persistent neural/world/RNG restart acceptance is absent. See
[the gate](PROMPT-05-GATE.md) and [readiness evidence](NEURAL-TRAINING-READINESS.md).
No adapter was trained, no associations or combat were learned, and no retention,
reversal, held-out-seed or baseline success is claimed. The training protocol and
offline research reports remain preparation only. This demo arena does not satisfy
the neural prerequisite or complete the online portion of prompt 07.

Verification covers legal actions, simultaneous win/draw/loss, full recovery,
round-limit outcomes, deterministic resume, malformed-save rejection, v2 backup,
one-time persisted XP, and the UI flow including rapid duplicate clicks. Physical
phones, real-browser visual layouts and live neural deployment remain untested.
