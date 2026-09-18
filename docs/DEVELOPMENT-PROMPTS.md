# FLYZRDS — Wizard Lizard Flies

INSPIRE • MVP development brief and sequential implementation prompts • September 17, 2026

## Identity and product

**FLYZRDS** (pronounced “fly-zerds”). Wizard Lizard Flies. Raise a little magic.

A mobile-first virtual pet game starring original cartoon, 16-bit-style chibi dinosaurs. Care for a long-neck wizard, teach it associations, explore together, and enter friendly magic duels. A FlyWire-derived neural controller is the experimental foundation. A velociraptor becomes the second body after the first is working.

Repository: `officialinspire/FLYZRDS`. Description: `Wizard Lizard Flies — a mobile-first pixel-art virtual pet PWA with experimental FlyWire-derived neural control, magic duels, and walking adventures.` Repository created by the user; foundation implementation tracked in docs/STATUS.md.

### Platform commitment

Deliver an installable progressive web app (PWA), targeting Android Chrome and iPhone Safari first. It should launch from a home-screen icon in standalone mode. This is not an App Store/Play Store native binary. Store packaging is a later option.

Use an INSPIRE website landing page as the entry point; a dedicated subdomain is the preferred eventual app origin. Do not change Shopify, DNS, or hosting merely by applying development prompts. GitHub Pages can serve a frontend preview, but cannot execute the Python simulation service. Keep URLs and base paths configurable.

### Visual direction

- Original chibi long-neck: oversized head, short body, expressive eyes, curled wizard hat, tiny cape, glowing staff or floating spellbook.
- Palette: midnight ink, deep violet, mint, warm cream, and gold; coral used sparingly for alerts.
- Crisp pixel-art silhouettes, limited shading, consistent pixel scale. Pixel font for short titles; readable system font for settings and instructions.
- Cozy enchanted garden, magical mushrooms, rune stones, sparkles, berries, and a miniature nest.
- Thumb-friendly controls, portrait-first layouts, safe-area insets, accessible DOM menus around the game canvas.
- Original characters, terminology, artwork, and audio. Pokémon and Tamagotchi are genre references, not asset sources.

### MVP boundaries

One pet, one habitat, one association task, levels 1–5, three spells, one practice opponent, foreground walking expeditions, and a stationary camera companion overlay. No multiplayer, trading, breeding, store billing, background GPS, permanent death, or claimed sentience.

Food, energy, enrichment, bond, and magic shields are game mechanics. A connectome does not establish transferred consciousness, retained biological memories, or subjective feelings. The fantasy can celebrate kindness without telling players the software is proven sentient or suffering.

The genuine neural milestone requires real versioned data, documented sensory and motor mappings, measurable influence on behavior, and retained learning. A scripted demo is acceptable for UI development only when explicitly labeled. Do not quietly substitute it for a disconnected neural pet.

## How to use this pack

Apply one numbered prompt per coding session, in order. Paste the shared instruction below followed by the selected prompt. Do not apply all prompts at once. The agent must inspect the repository before editing; these are build requests, not claims that anything is already implemented.

Keep `docs/STATUS.md` current so each subsequent session reads a short factual handoff. Each phase should produce a reviewable commit or PR. Pushing the phase branch is authorized when repository access exists; never force-push, bypass branch protections, or claim a merge/deployment that has not happened. Merge and deployment follow the user's current session instructions.

If a research gate fails, record the evidence and stop dependent neural work. Independent UI work may proceed in labeled demo mode; the scientific acceptance criteria must not be relaxed to make a release appear complete.

### Shared instruction — prepend to each prompt

```text
Work in officialinspire/FLYZRDS. Read AGENTS.md, README.md, docs/STATUS.md,
and the relevant specification before editing. Implement only the selected phase.
Preserve working behavior and unrelated user changes; use a focused phase branch.
Prefer small modules and existing dependencies. Recheck current official docs
when selecting APIs/dependency versions; commit lockfiles and pin research inputs.
Never include credentials, exact user routes, downloaded brain datasets, or large
model checkpoints in normal git history. Never invent scientific results.
Keep demo, reduced-model, and live neural modes distinguishable. Sentience is
unproven; XP/bond are game mechanics. Suspend safely when hidden/disconnected.
Run relevant checks, record actual results and unavailable device tests, update
docs/STATUS.md with changed files, commands, limitations, and next phase, then
commit and push the phase branch when access is available. Open a PR if supported.
Do not bypass required checks, buy services, or deploy/change DNS without current
authorization. End with a concise result, verification evidence, and remaining gate.
```

## Prompt 00 — Repository foundation and engineering contract

```text
Initialize the FLYZRDS foundation without implementing the entire game. If the
repository is empty, create README.md, AGENTS.md, docs/PRODUCT.md,
docs/ARCHITECTURE.md, docs/ART-DIRECTION.md, docs/STATUS.md, and a .gitignore.
Use this product: mobile-first installable PWA; 16-bit chibi wizard dinosaurs;
FlyWire-derived neural control; kind care; training; magic duels; expeditions.
Scaffold apps/web using TypeScript, Vite, and a lightweight Canvas 2D scene;
accessible menus remain HTML. Reserve services/brain for Python and
packages/contracts for versioned messages. Use an npm workspace and lockfile.
Add dev, build, typecheck, lint, and meaningful test commands plus CI checks.
Do not choose a project-wide open-source license until imported code/data license
compatibility is assessed; document this pending decision.
Create a clean title screen with FLYZRDS / Wizard Lizard Flies, Start, Settings,
and an explicitly labeled demo habitat placeholder. Support safe areas, dynamic
viewport height, 44px minimum controls, keyboard focus, reduced motion, and
320px-wide screens. No brain or camera/location request on startup.
Acceptance: clean install/build/typecheck; title-to-demo navigation works without
overflow in phone and desktop viewports; README states what is not implemented.
```

## Prompt 01 — Real brain feasibility gate

```text
Investigate and reproduce a minimal FlyWire FAFB-derived simulation before
promising a brain-powered pet. Start from https://codex.flywire.ai/?dataset=fafb
and documented upstream simulation repositories, including
https://github.com/eonsystemspbc/fly-brain as a candidate, not an assumed fit.
Determine actual data access, export route, dataset release, model compatibility,
licenses, and hardware needs. Do not bypass sign-in or substitute another dataset
silently. Record neuron and connection definitions; do not confuse aggregated
edges with individual synapses. Download only authorized needed tables, using
documented commands with checksums and ignored local data paths.
Create a reproducible headless runner and a provenance manifest with source URLs,
versions, commit SHAs, hashes, filtering rules, model assumptions, and licenses.
Stimulate documented input populations; record downstream activity. Propose a
bounded action decoder and state which mappings are biological versus engineered.
Measure wall time per simulated second, startup, peak memory, hardware, and data
size. Include a no-stimulation/control condition and repeatable random seeds.
Write docs/BRAIN-FEASIBILITY.md with an honest go/no-go recommendation for one
active pet. No fabricated benchmark or visual demo masquerading as a full model.
If data/auth/hardware blocks execution, document the exact blocker and leave this
gate incomplete. Do not claim live neural behavior or proceed to neural release.
```

## Prompt 02 — Controller interface and persistent pet state

```text
Implement a versioned controller contract independent of rendering: observations,
bounded actions, reward events, mode/model identity, simulation tick, seed,
checkpoint, and lifecycle methods. Use finite/range validation and explicit units.
Provide a deterministic DemoController and a BrainController transport interface;
the demo label must remain visible. Define states for ready, running, paused,
disconnected, and error. No silent mode switching.
Create a fixed-step world loop separate from animation frames. Pause hidden tabs
without catch-up hunger. Persist the pet and settings in versioned IndexedDB
records; validate imports, handle quota/corrupt saves, and provide export/restore.
Design cloud checkpoint IDs separately from local game data; do not put a whole
brain checkpoint into a browser save by accident. Prevent two tabs advancing the
same pet concurrently. Reset requires an explicit UI confirmation.
Acceptance: deterministic replay, save/reload identity, pause/resume, corrupt-save
recovery, and duplicate-tab handling. Browser refresh must not duplicate rewards.
```

## Prompt 03 — Habitat and forgiving care

```text
Build the playable garden around the existing controller interface. Hatch and
name one long-neck; place food and enrichment objects; support approach, turn,
stop, interact/feed, and rest. The player changes the environment, not the pet's
position. Use the labeled demo controller until the real integration passes.
Define food, energy, enrichment, and bond in a centralized balance config with
bounds, rates, and effects. Describe these as game state, not measured feelings.
Use kindness-first care: rest/stasis when absent, no death or neglect spiral,
no guilt notifications, and no unlimited resource duplication from repeated taps.
Provide accessible Feed, Play, Rest, and Habitat controls and clear feedback.
Make collision and interaction results independent of rendering frame rate.
Acceptance: a full care loop survives reload; hidden/background time does not
drain needs; rapid input does not duplicate objects or rewards; short screens fit.
```

## Prompt 04 — Chibi pixel-art production and integration

```text
First inspect the renderer and write an exact asset manifest before creating art.
Use original 16-bit-style chibi wizard dinosaurs: long-neck MVP, raptor reserved.
Specify logical frame size, padding, pivot, directions, animation keys, frame
counts, and durations. Target 64x64 logical pet frames if the current renderer
supports that cleanly; allocate room for hats/tails and avoid cropped silhouettes.
Required states: idle, walk, eat, play, rest, cast, ward, celebrate. Make a compact
garden tileset, food/enrichment props, spell effects, UI icons, and app icon.
Use image generation for raster concept/assets when available, but do not assume
an AI-generated sprite sheet has exact geometry. Normalize/validate transparency,
frame bounds, pivots, and animation continuity before integration. Never stretch
frames unevenly. If generation is unavailable, retain labeled placeholders and
record the production task rather than claiming finished art.
Use nearest-neighbor scaling for pixel art; keep text legible and screens calm.
Include source/license attribution and a sprite preview page showing every frame.
Acceptance: all animation keys resolve; no clipping/jitter/bleed at device pixel
ratios 1, 2, and 3; mobile controls remain usable; asset sizes are reported.
```

## Prompt 05 — Live neural service and closed-loop behavior

```text
Prerequisite: Prompt 01 succeeded. Implement the chosen, measured model behind
the existing contract in services/brain, with documented Python dependencies.
Encode local observations into the documented input populations; decode output
activity into bounded movement/actions; feed resulting world observations back.
Do not train the action adapter yet. Record mappings and biological limitations.
Keep physics and state authority explicit. For this online mode the server owns
the neural session and validated world outcomes; the client renders snapshots.
Sequence messages and make repeated requests idempotent. Isolate pets, authenticate
ownership before public access, enforce one active session per pet, rate-limit
inputs, restrict origins, and keep secrets on the server. Provide a local-only
development mode rather than a publicly exposed unauthenticated simulation.
Persist model/decoder version, neural state, random generator state, world state,
and progress together at safe boundaries. Disconnect pauses; reconnect restores
the same checkpoint, never a silently reset brain or scripted replacement.
Acceptance: a logged stimulus/action/feedback trace, controls demonstrating neural
influence, bounded invalid input, session isolation, checkpoint restoration, and
measured end-to-end latency. Report if interactive speed is not yet viable.
```

## Prompt 06 — Association learning with evidence

```text
Prerequisite: live closed-loop control works. Add two cue stations, one rewarding
food, with balanced randomized positions and reproducible seeds. Then reverse
which cue predicts reward. Train a small explicit readout/adapter initially while
keeping the imported connectome fixed; document exactly which parameters learn.
Do not imply biological synaptic learning or access to the original fly's memories.
Separate training and held-out evaluation seeds. Prevent target/reward location
leakage into observations, and do not update parameters during evaluation.
Compare trained, learning-disabled, random, and simple heuristic baselines across
multiple seeds using a predetermined trial budget. Record accuracy, latency,
learning curves, reversal performance, variability, and saved parameter hashes.
Show the player a short playful training session; retain detailed diagnostics in
Brain View. XP is a separate progression mechanic. Prove learning persists after
service restart. If trained behavior does not improve, report the negative result
and investigate; do not replace it with a scripted correct-choice rule.
```

## Prompt 07 — Magic duels and levels

```text
Add one practice opponent and levels 1–5. Implement Spark, Ward, and Bloom with
centralized costs, cooldowns, shield effects, and clear win/draw/loss rules.
Duels use magic shields, with no injury or death. Let the player give a broad
instruction while the existing controller influences a bounded tactical choice.
Log controller input/output separately from game rules. Do not claim the brain
learned combat strategy merely because a decoder maps spikes to spells.
If a combat adapter is necessary, keep it separate from food learning and explain
its status. Server-authoritative online rewards, idempotent match completion, and
a defined disconnect pause/timeout policy must prevent duplicate XP.
Unlock cosmetic accents and spell effects as levels rise. No monetization/PvP.
Acceptance: deterministic combat rules; legal costs/cooldowns; defeat recovery;
reload/disconnect cannot duplicate rewards; all outcomes are accessible without
color alone; neural versus scripted decisions can be inspected.
```

## Prompt 08 — Foreground walking expeditions

```text
Add Start Expedition, Pause, and Finish. Request geolocation only after Start
and an explanation. Use HTTPS and current official API guidance. Award capped
resources from accepted foreground distance samples, filtering low accuracy,
stationary jitter, implausible jumps/speeds, stale samples, and long gaps.
Do not promise steps, background tracking, or continued tracking when locked.
Stop tracking on exit/hidden state and explain pauses. Avoid competitive rewards
that would require invasive anti-cheat. Provide an equivalent indoor quest for
denied permission, accessibility needs, or unavailable GPS.
Process route samples transiently; store aggregate progress instead of raw routes
by default. Never put coordinates into analytics/logs/git. Use idempotent reward
claims, with server caps for online progression and clearly scoped demo rewards.
Encourage phone-away walking; interactions occur at stops.
Acceptance: synthetic traces cover jitter, gaps, fast travel and normal walking;
permission denial is graceful; watches are cleaned up; real-device testing is
reported separately from simulation. No background-distance claims from mocks.
```

## Prompt 09 — Camera companion

```text
Add an optional stationary camera experience using getUserMedia over HTTPS.
After a user gesture and explanation, request rear camera only, never microphone.
Overlay the animated pixel pet with touch controls for scale and position.
Describe it as a camera companion overlay, not surface-anchored AR. True WebXR
plane detection is out of scope and must not be required for iPhone support.
Allow local photo composition/export with permission-respecting browser fallbacks;
do not upload camera frames or saved photos automatically. Use loaded same-origin
assets to avoid tainted canvas export. Stop all media tracks on exit, hide,
permission revocation, and error. Supply a garden-background fallback.
Acceptance: denied/no-camera paths, portrait/landscape preview, no mirrored rear
camera mismatch, export where supported, and camera indicator cleanup. Document
actual iPhone/Android results and do not equate desktop emulation with device QA.
```

## Prompt 10 — Installable PWA, offline boundary, and device polish

```text
Make FLYZRDS installable with a valid manifest, standalone display, app identity,
192/512 PNG icons, maskable icon, Apple touch icon, theme colors, HTTPS, and
correct start_url/scope/base-path behavior. Add feature-detected Android install
promotion and concise iPhone Add to Home Screen guidance; do not assume the
beforeinstallprompt event exists on iOS. Keep browser play fully usable.
Precache the application shell and required local assets with a versioned service
worker. Handle navigation fallback and offer a safe update after checkpointing;
never overwrite active state or cache authenticated API responses as public data.
Offline: show the last saved habitat and allow non-simulation decoration/settings;
pause the online neural pet. Demo play must be a separately identified save/mode.
Do not claim the full brain runs offline or merge demo rewards into neural saves.
Handle safe areas, virtual keyboards, back navigation, audio unlock, mute/volume,
optional feature-detected haptics, reduced motion, battery-sensitive animation,
text zoom, focus, and landscape. Avoid permission requests at launch.
Acceptance: installed cold launch after a prior successful cache, airplane mode,
reconnect, stale-cache update, and no save loss. Test production build; document
which tests were real iPhone/Android hardware and which remain pending.
```

## Prompt 11 — Release audit and INSPIRE integration preparation

```text
Audit the production build without adding new features. Verify hatch/care,
training evidence, neural-mode honesty, duels, walking fallback, camera cleanup,
install/offline behavior, save migration/export/restore, and service reconnection.
Inspect authorization, input validation, idempotency, rate limits, resource caps,
secret handling, coordinate/photo privacy, and imported code/data licensing.
Run relevant automated checks and real-device sessions where available. Measure
frontend loading, frame time, memory, backend latency and per-session compute.
Do not estimate operating costs as measured facts; document assumptions and a
small-alpha concurrency limit derived from benchmarks. Mark unavailable tests.
Create a deployment runbook separating static frontend and persistent simulation
service, backups/restore, rollback, TLS/origins, environment variables, and health
checks. Prepare an INSPIRE landing-page integration specification and proposed
subdomain; do not change Shopify/DNS or publish without current authorization.
Produce a release checklist and unresolved blockers. A demo can ship explicitly
as a demo; a fly-brain alpha requires the real neural and learning gates to pass.
```

## Launch acceptance

- FLYZRDS installs and launches as a standalone PWA on tested target phones.
- The pet's live controller mode is accurately represented; offline behavior is explicit.
- Versioned real inputs demonstrably affect behavior; the learning claim has comparison evidence.
- Save/restore retains the pet and learned state; disconnects cannot silently reset it.
- Camera/location are optional, requested just in time, and cleaned up on exit.
- No secrets, raw routes, personal camera media, or oversized datasets are committed.
- Licensing, alpha capacity, real-device gaps, and operating cost assumptions are documented.

## Primary references

- FlyWire Codex: https://codex.flywire.ai/?dataset=fafb
- Candidate simulation implementation (inspect license and pinned revision): https://github.com/eonsystemspbc/fly-brain
- NeuroMechFly (optional research reference; not required for our 2D dinosaur body): https://neuromechfly.org/
- PWA installability and platform differences: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Geolocation: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Camera: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- WebXR limitations for later true AR: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API

Research references inform a plan; they are not evidence that FLYZRDS has already
downloaded data, run a model, learned a task, or passed device testing.
