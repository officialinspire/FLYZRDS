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

IndexedDB database `flyzrds-v1`, `saves` store, `current` key. DB completion—not request success—resolves writes. Save schema v1 includes pet ID, world state, controller PRNG/seed/tick, settings and a separate `cloud` reference slot. Unknown schemas/models and mismatched ticks fail closed. No neural arrays fit this schema. No destructive implicit migration; future versions must implement an explicit migration with backup.

A same-origin Web Lock `flyzrds:active-pet:v1` is held across the owning tab's lifetime. Contending tabs cannot advance or replace the save. Unsupported locks fail closed. Read-only tabs may inspect/export the last valid save. Close the owning tab then reload the other to acquire ownership. Pagehide saves best-effort before releasing the lock; browser process death releases it automatically. Pages restored from bfcache reload to reacquire ownership. Cross-device concurrency is not implemented.

Writes serialize. Settings dialogs pause simulation. Invalid imports leave current storage untouched. Restore/reset display confirmation and persist the replacement before installing it. Errors stop advancement and offer backup/recovery; a corrupt original is not silently overwritten. Last unsaved two-second interval may be lost if a browser is killed abruptly.

## Hosting

Vite relative base supports a static subdirectory preview. Eventual standalone HTTPS app on an INSPIRE subdomain is preferred over embedding the app within Shopify. The Python research CLI cannot run on GitHub Pages. No live deploy or DNS change is included. Manifest/service-worker cache management, online sessions, authentication and production resource caps are future phases.
