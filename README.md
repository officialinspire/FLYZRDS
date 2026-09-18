# FLYZRDS ✦

**Wizard Lizard Flies — Raise a little magic.**

INSPIRE's mobile-first virtual pet experiment: original cute-but-fierce sci-fi dinosaurs, an enchanted pixel garden, and research toward FlyWire-derived neural control.

## Current build: care, arena, expeditions and camera companion

- Hatch/name a long-neck; place berries and a toy; feed, play, rest, and decorate.
- Bounded care stats, one-use interactions, active-time cooldowns, forgiving absence.
- Generated cartoon dinosaur sprites: eight animations, props, tiles, effects and app icons.
- Sprite workshop at `sprites.html`; all frames and animations at 1×/2×/3×.
- Responsive title screen, settings, pause/resume, reduced motion.
- Deterministic scripted dinosaur controller, 50ms world ticks, validated contracts.
- IndexedDB saves, export/import, confirmed replacement, corruption handling, and one-tab ownership.
- Shield-only practice duels against Echo: Spark, Ward, Bloom, local XP and five cosmetic levels.
- Resumable rounds and atomic match/XP saves; clearly labeled scripted tactics.
- Foreground-only walking expeditions, filtered GPS, equivalent indoor quests and capped local supplies.
- Optional stationary rear-camera overlay, touch/keyboard positioning, garden fallback and local PNG composition.
- Reproducible real-data brain propagation smoke test and recorded measurements.

**The visible pet is a scripted demo.** It is not connected to the brain runner, does not learn yet, and is not claimed to be conscious. The research run succeeded, but interactive neural deployment is **NO-GO on the tested path**. See [feasibility results](docs/BRAIN-FEASIBILITY.md).

## Run locally

Node 22.12+ (Node 24 tested):

```sh
npm ci
npm run dev
```

Open the printed localhost URL. To test on another device, explicitly use `npm run dev -w @flyzrds/web -- --host 0.0.0.0` with a secure HTTPS development origin. Web Locks must be available; insecure LAN HTTP cannot guarantee the save-ownership requirement and is deliberately read-only.

```sh
npm run check
npm run preview
python -m unittest discover -s services/brain -p 'test_*.py'
```

The production frontend is `apps/web/dist/`. Assets use relative paths for subdirectory hosting. CI builds and tests; it does not publish a site.

## Research runner

Python 3.12/Linux, approximately 3 GiB working memory plus dependency overhead observed:

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install -r services/brain/requirements.txt
python services/brain/fetch.py
python services/brain/benchmark.py
```

The fetch command downloads the pinned public upstream repository into ignored `research/fly-brain`, including about 100 MiB of processed connectivity data. The runner verifies checksums before importing upstream model code. Four bounded subprocesses compare 0/200 Hz stimulation with seeds 7/23. Results go to ignored `research/benchmark.json`. Committed [measurement summary](docs/brain-benchmark.json) contains no brain data or personal information.

## Neural training preparation

The full pinned FAFB v783 model has new offline intervention/readout, repeated-window
performance, food-feedback and in-process replay evidence. See the
[measured research report](docs/NEURAL-TRAINING-READINESS.md). The protocol in
`services/brain/training-protocol.json` is planned, not trained; the visible pet
remains a scripted demo.

## What is next

Prompt 05 is **blocked**, not implemented; see the [prerequisite review](docs/PROMPT-05-GATE.md). Neural integration remains gated on interactive performance, an evidenced decoder, and licensing review. Care and generated sprite production are implemented. Prompt 06 training remains blocked by that live-control prerequisite. Prompt 07 has a [local scripted practice arena](docs/DUELS.md); its online neural control and authoritative rewards remain unavailable. Cast and Ward art now appears in the arena. [Expeditions](docs/EXPEDITIONS.md) and the optional [camera companion](docs/CAMERA.md) are implemented in demo scope, with target-phone testing pending.

**Installation/offline PWA support is planned, not implemented in this build.** Android/iPhone are target platforms; no physical phone or visual-browser acceptance is claimed. No web deployment, Shopify change, or app-store publication has occurred.

## Save behavior

State is checkpointed every two seconds while running and on pause/settings/background transitions. Closing or killing a browser may lose the last unsaved interval; it never causes catch-up progression. A second tab remains read-only until the first closes and it reloads. Export backups before clearing browser data. Cloud checkpoint references are a separate reserved field; this demo rejects neural imports.

Schema v1–v3 saves migrate to v4, preserving pet identity, position, PRNG checkpoint and existing duel progress; old pets are already hatched. The original pre-upgrade record is backed up atomically before the first upgraded write. Expedition saves contain aggregates, never coordinates; camera streams and photos are never saved. Settings includes an export of this pre-upgrade backup. New pets start as eggs. Needs change only during active garden ticks, and automatic rest protects low energy.

## Documentation

- [Product](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md)
- [Art direction](docs/ART-DIRECTION.md) · [Status](docs/STATUS.md)
- [Prompt pack](docs/DEVELOPMENT-PROMPTS.md) · [Licensing](docs/LICENSING.md)

No project-wide open-source license has been selected. Upstream research code is fetched separately and carries its own terms.

## Artwork pipeline

Source prompts/originals are in `art/`; the built-in image generator produced both sheets. `python scripts/normalize-assets.py` (Pillow) reproduces the checked atlases and icons. `python scripts/verify-assets.py` validates dimensions, safe margins, integer scaling and hashes. Runtime PNGs total 95,872 bytes. Source sheets are not included in the frontend build. See [asset contract](docs/ASSET-MANIFEST.md) and [attribution](art/SOURCES.md).
