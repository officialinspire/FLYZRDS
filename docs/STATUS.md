# Status — prompts 00–02

Updated 2026-09-17. Branch: `feat/phases-0-2`.

## Implemented

- 00: npm workspace, TypeScript/Vite frontend, accessible title/settings/demo garden, Canvas placeholder art, CI, documentation and unselected-license record.
- 01: actual processed FAFB v783 data acquired from pinned public upstream; checksum-verifying fetch and headless benchmark runner; two seeds with no-stimulation controls; source/model changes and results committed as metadata only. Research smoke PASS; live-pet performance/decoder/license gate remains NO-GO/OPEN.
- 02: versioned runtime-validated contracts; deterministic demo and separate async brain transport scaffold; 20Hz fixed-step loop; visibility pause; IndexedDB save/restore/export; confirmed replacement; corruption/denial handling; same-origin exclusive ownership using Web Locks.

## Verification performed

- `npm install` and `npm run check`: passed. TypeScript strict checking, recommended Biome rules, 20 Vitest tests and production build.
- Tests include deterministic checkpoint continuation; stale/invalid actions; version/mode/tick import checks; oversized import rejection; clock stalls; IndexedDB reopen/corruption/denial; exclusive lock handoff with a mocked LockManager; brain disconnect handling; and DOM title/habitat/pause/settings/reset flow using jsdom.
- `python -m unittest discover -s services/brain -p 'test_*.py'`: 1 test passed (tampered-data rejection).
- Python modules compiled; `fetch.py` verified all five pinned checksums against downloaded input.
- Real Brian2/FAFB benchmark: four 0.1s simulated trials completed; stimulated runs had 1092/1129 downstream spikes, controls zero. About 2.6GiB peak RSS. See BRAIN-FEASIBILITY.md for timings and their limitations.
- Production build: HTML ~4.3kB, CSS ~4.8kB, JS ~10.3kB before compression; dependencies are bundled, no network fonts/assets.
- Development server reached Vite ready state on explicit localhost binding. A 0.0.0.0 startup failed on this environment's network-interface enumeration, so default dev/preview bind to localhost.

## Explicitly unverified / not shipped

Cloud browser could not access localhost (ERR_BLOCKED_BY_CLIENT). Thus screenshot/visual overflow checks at 320px/desktop and physical Android/iPhone tests remain pending. jsdom tests do not establish visual fidelity, browser Web Locks support, or device performance.

No live neural connection, learning, care interactions, rewards/XP, combat, final sprite atlas, sensors, install manifest, service worker, offline play, hosting deployment or Shopify/DNS change. No sentience claim. Online authentication/session isolation belongs to the future backend phase.

## Next

Prompt 03 can add care mechanics using the labeled demo controller. Before prompt 05, resolve warmed interactive performance, biological input/output evidence and upstream data licensing/preprocessing. Do not silently replace the neural goal with demo behavior.

Run `npm ci && npm run check` for future clean verification. Restore/import currently accepts schema v1 demo only; future migrations must preserve backups. Export a save before clearing browser data.
