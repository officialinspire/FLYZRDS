# Camera companion (prompt 09)

Camera companion opens a stationary garden preview without requesting any sensor.
Enable rear camera explains the request and calls getUserMedia only after that
explicit gesture in a secure HTTPS/localhost context. It requests rear-facing
video with `facingMode: { exact: "environment" }` and `audio: false`; devices
without that rear-camera capability use the explicit garden fallback. An
unexpected audio track or reported front-facing feed is rejected and stopped.
There is no microphone request, plane detection, WebXR or surface anchoring.
The original animated dinosaur is a camera companion overlay, labeled scripted.

The same composition canvas displays and exports the unmirrored contained camera
frame. Native camera aspect ratios determine preview dimensions; portrait and
landscape remain proportionate. Drag/touch positions account for contained-frame
letterboxing. Keyboard-accessible sliders control position and size, and the
full sprite stays in bounds. Reduced motion uses a static idle frame. Garden
simulation pauses during the camera experience; overlay animation is cosmetic.

Compose local photo snapshots a transient canvas and encodes PNG using toBlob.
Same-origin loaded atlases avoid external image taint. Nothing uploads frames or
photos automatically. The player explicitly chooses Download PNG or the browser's
open/long-press save/share controls. Null/failed/tainted encodes give actionable
fallback text. Object URLs and in-memory previews are revoked/cleared on hide,
close, fallback selection or replacement. Photos never enter IndexedDB saves.

All stream tracks stop on close, hide, page exit, explicit fallback, playback or
render/export errors, ended tracks and inactive streams. Late permission grants
after cancellation are stopped immediately; returning never automatically
reacquires camera access. Permission revocation is detected through ended/inactive
media events, without requiring inconsistent browser camera-permission queries.

Automated DOM/module tests cover opt-in requests, denial/no-camera/playback errors,
late grants, reported front-camera rejection, track cleanup on revocation/hide,
portrait/landscape sprite bounds and PNG encoding failures. They are not hardware
camera-indicator or real photo-download acceptance. Actual iPhone Safari and
Android Chrome preview/export/rotation/indicator checks remain pending. Localhost
visual testing in the cloud browser was blocked with ERR_BLOCKED_BY_CLIENT.

References checked during implementation:
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
