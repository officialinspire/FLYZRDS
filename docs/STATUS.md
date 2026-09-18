# Status — prompts 00–04

Updated 2026-09-18. Phase branch: feat/phases-3-4.

## Delivered this phase

- Hatch and name one long-neck; existing pets stay hatched after upgrade.
- Place food and star toy through accessible placement controls; demo controller
  approaches/stops/interacts. One object per kind, single consumption, persisted
  cooldowns and bounded gains prevent rapid-tap duplication.
- Central care balance: food, energy, enrichment, bond. Manual rest restores
  energy; low energy triggers rest. Zero needs never cause death; absence pauses.
- Habitat chooser (moonlit/mushrooms), persisted objects/scenery/needs.
- Schema v2 with explicit v1 migration preserving identity/PRNG/position, atomic
  original-v1 backup, and pre-upgrade backup export. Invalid imports fail closed.
- Two generated original source sheets, normalized atlases, eight pet animations,
  16 garden sprites, UI icons and app icons. Sources/prompts/recipe committed.
- Sprite workshop at sprites.html; all frames and animations; cast/ward art is
  reserved for future combat. Runtime PNGs total 100,226 bytes.

## Verification

- Strict typecheck, recommended Biome lint, 31 Vitest tests, production multi-page
  build passed locally. Care tests cover food approach/one-time consumption,
  toy gains/celebration, rest/bounds/low energy, hidden-clock gaps, rapid placement,
  invalid inputs, exact v1 backup and animation key lookup. DOM tests exercise
  hatching, care placement/rest, scenery, settings, and confirmed reset.
- Existing Python provenance test passes; no neural model changes in this phase.
- verify-assets.py passes: 32 nonempty sprites, eight animation keys, transparent
  safe borders, identical integer-scale alpha bounds at 1×/2×/3×, icons and hashes.
- Normalized pet montage visually inspected. Source crop boundary checks pass;
  generated source grid imperfections are documented and corrected by rectangles.

## Limitations and next step

The pet is still a deterministic scripted demo. Headless brain smoke previously
passed, but warmed performance, biological decoder and data licensing gates remain
open before prompt 05 live integration. No learning, XP, battles, sensors, PWA
installation/offline or deployment is claimed. Cast/Ward are preview artwork only.

Physical iPhone/Android checks and rendered browser viewport/DPR checks remain
pending. Integer-scale image tests and jsdom do not replace those checks; the
previous environment blocked localhost browser access. No Shopify/DNS changes.

Next phase: resolve neural feasibility gates before connecting a live controller.
For development: npm ci && npm run check; python scripts/verify-assets.py (Pillow);
python -m unittest discover -s services/brain -p 'test_*.py'.

## Sci-fi creature redesign — 2026-09-18

- Replaced all 16 long-neck frames with original jade sci-fi dinosaur artwork:
  ivory horns/claws, indigo natural armor, amber eyes and cyan dorsal plates.
  No wizard hat, cape or staff. Existing care behavior and garden props retained.
- Regenerated app icons, both manifests and review montage; runtime PNGs total
  95,872 bytes. Built-in generator prompts and new source committed; old source archived.
- Visually inspected source and normalized 3× montage. All 16 full silhouettes
  clear source crop boundaries; all 32 runtime sprites pass alpha-safe margins,
  integer-scale bounds and SHA-256 verification.
- npm ci and npm run check passed: typecheck, Biome, 31 Vitest tests and production
  build. Python brain provenance unittest passed (1 test).
- Actual phone/browser visual acceptance remains pending. Cast/ward keys remain
  preview-only and now depict bioelectric breath and an energy barrier.
- Rebuild recipe: python scripts/normalize-assets.py, then npx biome format --write
  apps/web/public/assets/manifest.json apps/web/src/asset-manifest.json.

## Prompt 05 prerequisite review — 2026-09-18

**Blocked; not implemented.** The attached prompt pack requires a successful
Prompt 01 gate and stops dependent neural work when a research gate fails.
Existing headless propagation passes, but interactive performance, a validated
output decoder and licensing decisions remain open. See PROMPT-05-GATE.md for
acceptance evidence and the ordered unblocking work. No new model execution or
latency measurement was performed; no upstream checkout is present locally.

Changed files: docs/PROMPT-05-GATE.md, README.md, docs/STATUS.md. The requested
merge also incorporates the previously completed sci-fi sprite redesign.
Verification: npm ci && npm run check (typecheck, Biome, 31 tests, production
build), python scripts/verify-assets.py (32 sprites, bounds and hashes), and
python -m unittest discover -s services/brain -p 'test_*.py' (1 test) passed.
No neural-service acceptance or physical-device checks are claimed.
Next: resolve the research gate before implementing Prompt 05 or Prompt 06.

## Neural training preparation — 2026-09-18

- Downloaded and checksum-verified the pinned full FAFB v783-derived network.
  Data and Python environments stay ignored under research/.
- Added services/brain/readiness.py, readout-mapping.json, a separate
  requirements-compiled.txt profile, training-protocol.json and test_readiness.py.
  The mapping pins and verifies the upstream example notebook; downstream outputs
  exclude directly stimulated neurons and actions are bounded with no steering
  inferred from bilateral names. No adapter/connectome parameters were trained.
- Ran 8 full-network NumPy intervention/control conditions (sugar/P9, seeds 7/23),
  4 NumPy food-feedback conditions and 8 compiled-profile conditions. All 20 pass
  exact in-process neural state replay. Food consumption disables subsequent
  sensory drive; controls remain inactive. All 8 final full spike-count hashes
  agree across NumPy/compiled profiles for the short tested conditions.
- Both CPU profiles remain too slow for 20Hz. See NEURAL-TRAINING-READINESS.md
  and three small neural-*.json reports for actual repeated-window timing,
  readout counts, traces, dependency versions, failures/workarounds and limits.
- README.md, BRAIN-FEASIBILITY.md and PROMPT-05-GATE.md link the new evidence.
  Offline feeding feedback is not an online service; in-process replay is not
  restart/reconnect acceptance. Prompt 05/06 remain incomplete.
- Verification: npm ci && npm run check passed (31 tests, typecheck, Biome,
  production build); python -m unittest discover -s services/brain -p 'test_*.py'
  passed (5 tests); python scripts/verify-assets.py passed (32 sprites and hashes).
  Physical-device checks and full online end-to-end latency remain untested.
- Next: assess an optimized backend's interactive state/control boundary;
  validate cue/navigation mappings, local authoritative sessions and persistent
  neural/world/RNG restoration, then run the predeclared adapter training protocol.
  Code/data usage decisions remain open before a public/commercial release.
