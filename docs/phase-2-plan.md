# LUMEN Phase 2: FLOW

**Goal:** Paint luminous purple fluid with the tracked index fingertip while preserving GLOW and one shared camera stream.

**Scope:** FLOW only. SLASH and LAUNCH remain disabled. Preserve GLOW's renderer, six colors, Canvas fallback, camera behavior and visual identity.

## Existing implementation

React 19.3, Vite 8.3 and MediaPipe Tasks Vision 1.0.1 are installed. `useWebcam` owns the hidden video and stream, cancels late permission requests and releases capture on Stop/unmount. `useBodyTracking` runs throttled segmentation in `public/segmentation.worker.js`, exposing timestamped masks through a ref. `App.jsx` currently has one active mode and disabled future buttons. Nine unit/browser checks cover GLOW, camera failure/cancellation, fallback and real segmentation inference. GitHub Pages deploys from main with `/Lumen/` asset paths.

The required supplied SplashCursor source is absent. Obtain it from the user before implementing the fluid engine. Do not substitute, recreate or silently fetch a different version.

## Architecture and interaction

Keep `useWebcam` mounted at the App level. Mode changes never call camera start/stop. Enable body tracking only in GLOW and hand tracking only in FLOW. The inactive worker and renderer dispose their resources; the shared video and stream remain alive until explicit Stop or unmount.

Add a classic MediaPipe HandLandmarker worker using the already locally served Vision bundle and WASM. Start around 20 Hz with one pending frame; use one hand. Close input bitmaps in finally, copy landmarks before transferring results, terminate workers and clear timeouts/pending input when switching or stopping. Frame watchdogs prevent stuck inference from silently freezing input. Support direct retry without reopening the camera.

`useHandTracking(videoRef, enabled)` exposes `{handRef,status,error,retry}`. Mutable hand state contains `handDetected`, mirrored normalized `indexFinger` and `wrist`, landmarks, normalized-per-second velocity, capture timestamp and a sequence number. Mirror x exactly once in the tracking adapter. Account for the camera aspect ratio when mapping into the artwork; never crop or stretch the coordinate field.

Use time-aware lightweight smoothing with a roughly 40 ms response, bounded velocity and a dead zone for tiny jitter. First detection and reacquisition establish a new baseline with zero movement. Immediately deactivate splats when a result reports no hand; stale results also deactivate input. Brief dropout may preserve smoothing context, but cannot bridge a slash-like jump when the hand returns.

Adapt the supplied component's input boundary, preserving its simulation/shader passes. `SplashCursor` receives `pointerRef` with `{x,y,active,velocityX,velocityY,timestamp,sequence}` in normalized artwork coordinates. A new sequence injects one movement update; never repeat one inference delta every render frame. Mouse/touch use the same adapter in explicit fallback mode. Hand input takes precedence, and pointer events over UI controls never inject fluid.

Start with the requested dissipation, pressure, curl, radius and force settings. Use fixed #A855F7 with rainbow disabled. Clamp movement and velocity-derived force; reset the pointer baseline across input-source changes. Preserve dark composition and existing typography. No camera image, skeleton, finger dot or cursor appears in camera mode.

Subtle messages cover loading, no hand, movement and errors. Fade the movement guidance after drawing begins, restoring it after sustained loss. Retain mouse/touch fallback with a small explicit control. WebGL failure shows minimal guidance and leaves navigation/GLOW usable; do not fake fluid with Canvas.

## Tasks and files

- [ ] Inspect the supplied SplashCursor source, license, input logic and resource lifecycle. Add it to `src/effects/SplashCursor.jsx`; isolate the external pointer changes and add proper disposal of shader programs, buffers, textures, framebuffers and listeners. Do not change unrelated simulation architecture.
- [ ] Add `public/hand-tracking.worker.js`, `src/hooks/useHandTracking.js` and `src/tracking/handPointer.js`. Extend `scripts/setup-assets.mjs` to download the official hand model locally; retain Pages-aware URLs. No new runtime dependency is expected.
- [ ] Add `src/modes/FlowMode.jsx` to own fluid input/render lifecycle and fallback choice. Update `src/App.jsx` with GLOW/FLOW selection and mode-specific status; apply only small layout additions to `src/styles.css`. Preserve global camera ownership and GLOW's color state.
- [ ] Add proportional pointer utility tests in `tests/handPointer.test.js`: mirrored movement, elapsed-time velocity, reacquisition without deltas and extreme jump limits. Update existing navigation assertions because FLOW becomes enabled. Add focused browser checks in `tests/browser/flow.spec.js` for activation, fallback, missing hand/model, switching, one capture stream and Stop cleanup.
- [ ] Run `npm test`, `npm run build`, and `npm run test:browser`. Verify hand-model worker inference independently. Check the production `/Lumen/` path and repeat GLOW→FLOW→GLOW switching. Attempt physical webcam testing and record whether a real hand was actually detected; do not infer feel or mapping quality from empty-camera checks.
- [ ] Update README with FLOW instructions, source attribution, assets, validation and limitations. Report results and stop after Phase 2.

## Performance and verification limits

Run only the selected mode's inference, separate inference and fluid render frequency, cap rendering resolution and use refs for frequent updates. Retain the component's capability checks and tune simulation resolution on measured performance. Live finger responsiveness, smoothness and artistic quality require a viewer in front of the camera; synthetic tests establish correctness but cannot establish feel.

## Execution

Recommended: implement in this session after plan approval and receipt of the exact supplied SplashCursor source. Preserve current Git history; no GLOW redesign or Phase 3 work. Publishing can use the existing Pages workflow when the completed changes are pushed.
