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
