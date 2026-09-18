# Foreground expeditions (prompt 08)

Start Expedition explains the permission and then calls geolocation only on the
explicit start/resume control. HTTPS (or secure localhost) is required. GPS stops
on pause, finish, dialog close, page hide, page exit, denial and API error. Returning
never automatically restarts it. There are no steps, background tracking or
locked-screen distance claims. Controls are intended for safe stops; phone-away
walking is encouraged. Garden needs pause while this activity is open.

The transient distance filter rejects nonfinite/out-of-range coordinates,
accuracy worse than 25 m, samples older than 10 s or more than 2 s ahead,
nonincreasing timestamps, gaps beyond 30 s, speeds above 3 m/s and jitter below
max(6 m, average endpoint accuracy). Poor fixes, pauses and jumps reset the anchor;
gaps establish a new starting point without awarding the gap. Accepted distance
is capped at 500 m per journey. This is conservative casual filtering, not an
anti-cheat system. No raw coordinates are stored, logged, uploaded or exported.

The equivalent indoor quest requires no movement or permissions: observe five
art prompts for 20 visible seconds apiece, then record each observation. Hiding
or closing pauses and resets partial station time. Completed stations survive
reload. Explicit switching to indoor resets unclaimed walking distance.

Walking grants one exploration supply per 100 accepted meters; indoor grants one
per completed station. Both cap at 5 per journey, 20 per claim day, and 1,000 in
inventory. Supplies are a separate noncompetitive local demo resource. Completion
and supplies persist atomically with an idempotent journey ID. Failed writes stop
mutations. Reloaded expeditions are always paused. Local device-day caps are not
server authority and cannot resist edited saves or clocks; there is no online
progression/reward service. No precise routes or personal GPS traces are in git.

Version 4 adds only aggregate journey and resource state. Earlier versions migrate
without altering pet identity, world/controller state or duel XP and retain atomic
pre-upgrade backups. Camera/media state is not part of the schema.

Synthetic filter, lifecycle, reward and storage tests are separate from actual
hardware GPS acceptance. iPhone/Android field testing remains pending.

API references checked during implementation:
- [Geolocation watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
- [Geolocation specification](https://w3c.github.io/geolocation/)
