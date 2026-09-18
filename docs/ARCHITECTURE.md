# Architecture

## Boundaries

- `apps/web`: Canvas presentation, accessible HTML UI, fixed-step demo world, settings, persistence.
- `packages/contracts`: version-1 observations, actions, rewards, checkpoints, lifecycle types and runtime guards.
- `services/brain`: offline Python research CLI only. No server/API is currently exposed.
- `research/`: ignored upstream checkout, data and raw local output. Never bundle with the browser app.

Rendering can run at display refresh rate; world advances at 20 Hz. A delayed frame over 250ms is dropped. Hidden pages pause and reset elapsed time. Restored controllers begin paused. Coordinates use normalized habitat units; time inputs are milliseconds. All numerical imports reject NaN, infinity and invalid ranges.

`DemoController` implements the synchronous local Controller contract. Its seeded PRNG state and tick are checkpointed. No rewards change XP or learned weights in this foundation, so replaying a reward has no side effects. Future authoritative reward processing needs durable event-ID deduplication.

`BrainController` is an asynchronous adapter scaffold for `BrainTransport`, deliberately distinct from the synchronous world controller. It validates responses, prevents concurrent requests and drops paused/disconnected responses. No transport implementation, biological action decoder, online checkpoint store, or production authentication is present. A future async scheduler must connect it; changing a mode label cannot activate a neural pet.

## Persistence and ownership

IndexedDB database `flyzrds-v1`, `saves` store, `current` key. DB completion—not request success—resolves writes. Save schema v2 includes pet ID, world state, controller PRNG/seed/tick, settings and a separate `cloud` reference slot. Unknown schemas/models and mismatched ticks fail closed. No neural arrays fit this schema. Schema v1 has an explicit identity-preserving migration; the original record is backed up in the same transaction as the first v2 write. Unknown versions are rejected.

A same-origin Web Lock `flyzrds:active-pet:v1` is held across the owning tab's lifetime. Contending tabs cannot advance or replace the save. Unsupported locks fail closed. Read-only tabs may inspect/export the last valid save. Close the owning tab then reload the other to acquire ownership. Pagehide saves best-effort before releasing the lock; browser process death releases it automatically. Pages restored from bfcache reload to reacquire ownership. Cross-device concurrency is not implemented.

Writes serialize. Settings dialogs pause simulation. Invalid imports leave current storage untouched. Restore/reset display confirmation and persist the replacement before installing it. Errors stop advancement and offer backup/recovery; a corrupt original is not silently overwritten. Last unsaved two-second interval may be lost if a browser is killed abruptly.

## Hosting

Vite relative base supports a static subdirectory preview. Eventual standalone HTTPS app on an INSPIRE subdomain is preferred over embedding the app within Shopify. The Python research CLI cannot run on GitHub Pages. No live deploy or DNS change is included. Manifest/service-worker cache management, online sessions, authentication and production resource caps are future phases.


## Care phase

`balance.ts` centralizes all bounds/rates, interaction gains, cooldowns, and movement.
`world.ts` advances needs and interactions exclusively through fixed 50ms steps.
Observations gained optional validated targetX and rest fields; the local model
identifier is now demo-care-v2. The controller chooses approach/stop/interact;
world rules clamp the walking lane, consume an object once, and update bounded
needs. Decorations remain outside the walking lane. One food and one toy maximum;
consumption starts a persisted active-tick cooldown. No care XP, currency, learned
weights or claim of biological behavior. Rest restores energy; low energy enters
auto-rest; zero food never kills a pet. No timestamp-driven absence decay.

Hatching/naming happens once. Existing v1 saves are treated as already hatched.
Fresh eggs do not advance ticks. Player placement uses a keyboard-accessible range
slider; it never changes pet position. Storage errors and contending tabs disable
care mutations. Habitat modal pauses progression; scenery persists.

Runtime atlases and manifest are loaded from same-origin static assets. Scene
rendering uses logical 320px canvases and nearest-neighbor sampling; sprite
workshop demonstrates integer scales. Physical DPR/viewport checks remain pending.

## Local practice arena

`duel.ts` provides deterministic shield rules, a fixed adapter over an isolated
demo-controller fork, and local progression. `duel-render.ts` draws the Echo
projection and level cosmetics. The garden pauses while the arena is open.
Version 3 saves atomically persist round state, trace and one-time local rewards
before UI installation. Existing v1/v2 state is preserved in pre-upgrade backups.
This is not a live brain session or an authoritative online reward service.
See DUELS.md for the implemented scope and the blocked prompt 06 prerequisite.
