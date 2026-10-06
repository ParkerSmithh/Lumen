# LUMEN — GLOW + FLOW + SLASH

An interactive experiment in body, light, and digital matter. GLOW turns the camera's person segmentation into layered luminous matter, internal light and soft bloom. Raw webcam pixels are never displayed.

## Run

With Node 22.12 or newer:

```sh
npm install
npm run setup:assets
npm run dev
```

Open http://127.0.0.1:5173. This folder also includes a portable Node runtime; `./run-lumen.ps1` uses it. First-time asset setup needs internet; thereafter the model, worker and WASM are served locally. Fonts are downloaded from Google Fonts with system fallbacks.

Select **Enter with camera**, allow access, and step back until your entire body—including feet—fits in the camera frame. Use even lighting and a background distinct from your clothing. Six color dots change emission; each is keyboard accessible and labeled. **Stop camera** releases capture. The explicitly labeled illustrated preview shows the light treatment without tracking. FLOW, SLASH and LAUNCH are disabled future phases.

Camera capture requires localhost or HTTPS. Denied, missing, busy and disconnected cameras show guidance. A tracking failure offers a retry. Camera frames are processed on your device in a worker; the application does not upload or record them. One stream and hidden video are owned by `useWebcam`, ready to be reused by later modes.

## Implementation

- `src/App.jsx`, `src/styles.css`: minimal artwork shell and controls.
- `src/hooks/useWebcam.js`: capture, cancellation and stream cleanup.
- `src/hooks/useBodyTracking.js`, `public/segmentation.worker.js`: throttled MediaPipe person segmentation; no pose prerequisite.
- `src/modes/GlowMode.jsx`, `src/effects/glowRenderer.js`: mirrored aspect-preserving rendering, emission, highlights and bloom; Canvas fallback.
- `scripts/setup-assets.mjs`: locally hosted model and runtime preparation.

Dependencies: React, React DOM, MediaPipe Tasks Vision; development uses Vite, its React plugin and Playwright. Exact versions are in package.json and package-lock.json. No Three.js or other modes are implemented.

## Verification

```sh
npm test
npm run build
npm run test:browser
```

The tests cover geometry/mask utilities, six color controls, responsive layout, camera denial, late permission cancellation, Canvas fallback, and actual model initialization/inference. Edge is required by the browser configuration. With the dev server running, `node scripts/check-camera.mjs` attempts physical camera capture and stops it afterward; it saves only the rendered artwork screenshot.

Physical camera verification opened a 640×480 stream, initialized tracking and confirmed stream release. No person was detected during that unattended check, so live silhouette quality, foot separation, fast movement and performance with a person remain unverified. Only Edge was checked; other browsers and devices need hands-on testing. The lightweight segmentation model can misclassify dim scenes, small distant bodies or backgrounds similar to clothing. GPU rendering cost is capped; inference runs at up to roughly 15 FPS independently of rendering.

## Phase 2 — FLOW

Select **FLOW**, enter with camera if it is not already running, raise your index finger, and move it to paint purple fluid. No camera image, hand skeleton, fingertip marker or cursor is drawn. Guidance fades after movement begins and returns after sustained hand loss. **Use mouse / touch** explicitly enables camera-free fluid input; controls do not inject fluid.

GLOW and FLOW share the same video and stream. Switching stops the inactive worker and renderer without reopening capture. Global Stop releases camera tracks. SLASH and LAUNCH remain deferred.

The exact user-supplied React Bits SplashCursor source is in `src/effects/SplashCursor.jsx`. Its shader and fluid simulation passes are preserved. LUMEN adds a normalized ref input, one update per new sequence, bounded forces, WebGL capability/error handling and GPU disposal. Original mouse/touch event handling is consolidated through that same boundary by `FlowMode`.

New files: `src/modes/FlowMode.jsx`, `src/hooks/useHandTracking.js`, `src/tracking/handPointer.js`, `public/hand-tracking.worker.js`, hand-pointer and FLOW browser tests, `scripts/check-pages-build.mjs`, and Phase 2 plan/progress documents. Modified: `src/App.jsx`, small additions to `src/styles.css`, asset setup, camera-check script, the FLOW-enabled navigation assertion, and this README. GLOW's renderer, segmentation and webcam hook are unchanged.

No additional npm dependencies. `npm run setup:assets` now also downloads the official hand model. HandLandmarker runs off-thread at up to 20 Hz with one frame in flight. Coordinates mirror once and use roughly 35 ms smoothing. First detection/reacquisition sets a zero-movement baseline. Large jumps and stale results cannot inject giant splats. The fluid engine consumes each result once, with a bounded speed multiplier. Dye resolution is 512 and the display buffer is capped to reduce GPU cost.

Phase 2 physical-camera verification opened a 640×480 stream, initialized hand tracking, reported no hand, and confirmed cleanup. It did **not** verify real-hand artistic responsiveness or finger accuracy. Test slow/fast motion, direction, hand loss/reacquisition and repeated switching yourself. Automated checks verify pointer math, actual empty-frame model inference, mode lifecycle and fallback; they do not establish interaction feel. Only Edge has been tested. Devices without suitable floating-point WebGL rendering get clear guidance; GLOW's Canvas fallback remains available.

Actual Phase 2 results: **8 unit tests passed, 9 Edge browser tests passed, production build passed**. The production `/Lumen/` check also rendered FLOW and ran empty-frame hand inference with local assets.

To check the production Pages path locally, run `npm run build`, `npm run preview`, then `node scripts/check-pages-build.mjs`. The existing GitHub Actions workflow downloads both models before building for `/Lumen/`.

## Phase 3 — SLASH

Select **SLASH**, enter with camera if needed, raise your hand, then make a deliberate fast slicing motion through a crystal with the side of your hand. Ordinary slow movement should leave objects intact. A qualified cut emits a sharp 200 ms violet-white trace; intersecting crystals flash, split into recognizable triangular facets and scatter sparks. **Mouse fallback** accepts fast pressed drags; hovering does not cut. Switching back to hand input resets gesture history.

SLASH uses the existing hand worker and camera. FLOW↔SLASH keeps both alive, while only the selected renderer runs. GLOW resumes segmentation when selected. Global Stop still releases camera tracks. GLOW/FlowMode/SplashCursor core files remain unchanged. LAUNCH remains disabled; no Three.js, sound, score or Phase 4 work.

Created: `src/tracking/slashDetector.js`, `src/effects/slashGeometry.js`, `src/effects/slashScene.js`, `src/modes/SlashMode.jsx`, `tests/slash.test.js`, `tests/browser/slash.spec.js`, and Phase 3 plan/progress documents. Modified: `src/App.jsx`, small additions to `src/styles.css`, repeated-switch browser checks, camera/production check scripts, and this README. No dependencies or model assets added.

Palm motion derives from wrist (0), index MCP (5), middle MCP (9), and pinky MCP (17); wrist-to-pinky approximates the cutting edge. Raw MCP coordinates mirror once and share the camera's aspect-preserving mapping. Initial thresholds require two consistent samples, approximately 0.9 camera-heights/second, and 0.06 camera-heights of travel within 180 ms. Center rendering uses light 25 ms smoothing. Brief continuation hysteresis prevents one small speed dip from breaking a qualified cut. Hand loss, reacquisition, stale results, gaps above 140 ms, impossible speed and center/edge jumps reset the baseline without generating a cut.

Collision checks the center path and full swept edge against generous crystal bounds. Fragments scatter along/perpendicular to the slash with bounded strength. Canvas rendering uses one animation loop and capped resolution, at most four objects, 192 recycled spark slots, 24 fragments and 12 short trails. Spawning uses elapsed time, not independent timers. Leaving the mode removes listeners, cancels animation, clears scene/detector state and releases the Canvas buffer.

Actual Phase 3 verification: **15 unit tests passed, 10 Edge browser tests passed, production build passed**, and `/Lumen/` production fallback collision succeeded. Regression checks covered slow/jitter rejection, valid cuts, loss/reacquisition, stale/jump rejection, brief speed dips, swept collision, existing modes, one camera stream, shared worker reuse, renderer-resource recovery, animation-loop counts and Stop cleanup. Before/after destruction screenshots were visually inspected.

Physical webcam verification opened a 640×480 stream and initialized SLASH tracking, but **no real hand was detected**. Stream release was confirmed. Gesture comfort, threshold sensitivity, intuitive physical alignment and satisfaction still require your hand/visual evaluation. Test a slow sweep, a fast cut, sudden direction changes, leaving/reentering the frame, and repeated mode switching. Only Edge has been checked. At roughly 20 Hz, very fast or occluded motion can be rejected safely rather than cut.

Phase 3 is the current stopping point. LAUNCH remains deferred.
