# LUMEN Phase 3: SLASH

**Goal:** A deliberate fast movement of the hand's edge cuts luminous abstract matter into fragments, preserving GLOW, FLOW and their shared camera.

## Existing repository

`useWebcam` owns one hidden video and stream. `useHandTracking(videoRef, enabled)` runs one classic HandLandmarker worker at up to 20 Hz, with a mutable `handRef`, status, errors and retry. Hand state includes mirrored fingertip/wrist, raw camera-space landmarks, velocity, timestamps, sequences and reset flags. FLOW mirrors once in `handPointer.js`, maps with `fitContain`, and consumes each result once. Body tracking is enabled only in GLOW. The repo is clean, deploys to GitHub Pages under `/Lumen/`, and has eight unit tests plus nine Edge browser checks.

## Shared architecture

Keep webcam ownership and all existing GLOW/FLOW effects unchanged. Extend App's hand-tracking enable condition to FLOW or SLASH. A FLOW→SLASH switch keeps the same hand worker and stream; GLOW switches stop hand tracking and resume body segmentation. Mount only the selected mode's renderer. Explicit Stop remains global. LAUNCH stays disabled.

Derive SLASH geometry in its own adapter; do not alter FLOW smoothing or velocity. The raw landmarks are not already mirrored: mirror those exactly once when deriving new palm geometry. Use the existing already mirrored wrist without mirroring it again. Preserve aspect ratio through the existing containment mapping.

## Gesture detector

Create a reusable `createSlashDetector()` with `update(hand, now)` and `reset()`. Consume each sequence only once. Approximate the cutting edge with wrist (0) and pinky MCP (17), using index MCP (5) and middle MCP (9) to stabilize palm-center movement. Use light time-aware smoothing, approximately 25 ms. Do not require a fragile precise hand pose.

Evaluate movement in camera-height units so aspect ratio does not bias direction. Initial tuning: require roughly 0.9 frame-heights/second and 0.06 frame-heights of travel across at least two consistent motion samples within 180 ms. Direction changes restart the candidate. A valid gesture returns start/end, previous/current edge, direction, speed, distance, duration and bounded strength. Continue a qualified stroke through successive valid segments, with brief hysteresis to prevent jitter-triggered bursts.

Reject missing/stale input, reset flags, non-finite landmarks, sequence repetition, excessive frame gaps and implausible displacement/speed. Reset the gesture on hand loss, reacquisition, mode/input changes and tab hiding. Never connect a stroke across missing tracking. Clamp effect strength independently of movement. Tune thresholds from measured behavior; unattended camera tests cannot establish natural feel.

## Collision and artwork

Use Canvas 2D; no dependencies, Three.js or new models. Render one coherent family of faceted violet crystals with thin lavender edges, soft internal light, restrained halos and slow rotation. Begin with a short pause, then one object; gradually allow at most four active objects. Drift across the central camera-mapped field so targets remain reachable even in portrait layouts. Expire untouched objects and keep UI margins clear.

Test a valid stroke's palm path and swept cutting edge against generous circular crystal bounds. Include the swept edge's interior so fast movement cannot tunnel through a target. Each object fractures only once. Collision uses the same artwork coordinates as rendering and trails.

Destruction produces a brief local flash, a few recognizable polygon fragments, and bounded short-lived sparks scattering along and perpendicular to the cut. A thin white-core/violet-glow slash trace fades in approximately 200 ms. Trails appear only for qualified movement, never as a permanent hand/cursor visualization. Bound objects, particles, fragments and trail history; recycle particle slots. No score, sound or arcade HUD.

## Input and interface

Enable SLASH alongside GLOW and FLOW. Retain the existing title, navigation and atmosphere; add “03 — DESTRUCTION.” Guidance is “Raise your hand,” then “Slash through the light.” Fade it after a valid slash and restore it after sustained loss.

An explicit mouse/touch fallback accepts fast pressed drags through the same detector/collision boundary. Hovering or clicking controls cannot cut. Pointer down/release resets the baseline. Hand input remains primary; show no camera, landmarks, skeleton or persistent cursor. Tracking failures retain retry and fallback, and never break other modes.

## Files and execution tasks

- [ ] Add `src/tracking/slashDetector.js` for edge derivation and gesture classification, and `src/effects/slashGeometry.js` for swept collision. Add focused tests in `tests/slash.test.js`: slow/jitter rejection, valid movement, direction changes, stale/reacquired/extreme input and tolerant segment/swept-edge collisions.
- [ ] Add `src/effects/slashScene.js` for bounded crystal spawning, movement, collision, fracture particles and drawing. Add `src/modes/SlashMode.jsx` to own Canvas resizing, input adaptation and animation. Pass slash activity to the UI only when necessary; keep per-frame state out of React.
- [ ] Modify `src/App.jsx` to enable SLASH, share hand tracking across FLOW/SLASH, select the renderer and expose minimal instructions/fallback. Add only necessary style rules in `src/styles.css`. Preserve six GLOW colors and FLOW's exact supplied fluid source.
- [ ] Add `tests/browser/slash.spec.js` for activation, explicit fallback, visible destruction and reset. Extend the existing single-stream/resource test through GLOW→FLOW→SLASH→GLOW→SLASH→FLOW, verifying correct worker count, Stop cleanup and no accumulating renderer/listener callbacks.
- [ ] Run `npm test`, `npm run test:browser`, `npm run build`, and the production `/Lumen/` check. Inspect the artwork and destruction screenshots. Extend `scripts/check-camera.mjs` to attempt SLASH with the physical camera; report separately whether an actual hand was detected.
- [ ] Update README and `docs/phase-3-progress.md` with files, gesture thresholds, verification, performance limits and hands-on checks. Commit/publish the verified update through the existing Pages workflow. Stop after Phase 3.

## Cleanup and performance

Use one animation callback, elapsed-time spawning instead of separate timers, capped Canvas resolution, a four-object ceiling and fixed particle/trail budgets. Cleanup cancels animation, removes input/visibility listeners, clears gesture and scene state, and releases the Canvas backing buffer. FLOW↔SLASH keeps the shared worker alive; Stop or switching to GLOW disables it. Only the selected renderer runs. Glow and fluid GPU resources continue to use their existing cleanup paths.

## Review and limits

Canvas bloom and particles can be expensive on large screens; cap resolution and blur passes. At 20 Hz, extremely fast hands may leave the frame or be rejected as tracking jumps; prioritize safe rejection and tune with a real viewer. Edge geometry is an approximation, not anatomical pose recognition. Automated tests establish gesture rules, collisions and lifecycle; real-hand alignment, immediacy and satisfaction require a person.

**Recommended execution:** implement in this session after plan approval. No additional source is required; no Phase 4 work.
