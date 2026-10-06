# LUMEN Phase 4: LAUNCH

**Goal:** The viewer's index fingertip gently displaces luminous spheres; deliberate fast motion launches nearby matter with bounded force.

## Actual repository and supplied source

GLOW, FLOW and SLASH are implemented. App owns one `useWebcam` instance and hidden video. One `useHandTracking` hook is enabled for FLOW/SLASH, preserving its worker between those modes. It supplies already mirrored fingertip/wrist, velocity, timestamp, sequence and reset flags. GLOW alone enables segmentation. `fitContain` provides aspect-preserving mapping. GitHub Pages builds under `/Lumen/` and serves local model/WASM assets. Three.js is not installed.

The exact 22,336-byte Ballpit attachment is available at `a165123f-a897-4362-a532-22aa7e0ab6c8/Pasted text.txt`. It includes renderer helper `x`, shared pointer helper `S`, physics `W`, material `Y`, instanced spheres `Z`, `createBallpit`, and the React wrapper. Imports require only Three.js and its RoomEnvironment helper. Preserve these systems; do not fetch another component or introduce another physics/3D framework.

Source-specific observations: physics velocity is expressed per simulation step, gravity uses elapsed time, and friction applies per update. The control sphere is index 0 and follows a raycast plane. `followCursor=false` hides this instance but does not by itself disable its physics. Renderer teardown already stops callbacks/listeners and forces context loss. Environment setup currently discards ownership of the PMREM generator/target and room scene, requiring explicit lifecycle repairs. StrictMode reuses canvases, so initialization/disposal must be verified under the existing React setup.

## Architecture

Add `LaunchMode` around the adapted source at `src/effects/Ballpit.jsx`. App enables its existing hand hook for FLOW, SLASH or LAUNCH. Moving among those modes preserves the same worker and camera; moving to GLOW resumes segmentation. Only the selected renderer runs. Leave GLOW, SplashCursor, FLOW, SLASH, tracking workers and existing hand processing untouched.

LaunchMode feeds a mutable normalized `pointerRef` through a LAUNCH-specific adapter. Reuse the already mirrored fingertip without another x mirror. Map the camera frame into the artwork with `fitContain`, then convert to normalized device coordinates for Ballpit's existing raycaster and stable z=0 interaction plane. No depth reconstruction, hand visualization or finger cursor.

## Input and force

`consumeLaunchInput(state, pointer, now)` produces a new physical input only for a new sequence. Separate slow position following from one-shot velocity impulses. Repeated render frames may integrate physics and follow a stable control target, but never reapply the same tracking velocity.

First detection, input-source changes, hand loss, reset flags, stale input, excessive gaps, non-finite coordinates and impossible displacement establish/reset a baseline. On reacquisition snap the hidden control sphere to the new baseline and suppress launch impulse; do not move it through the old-to-new path. Inactive controller geometry must not produce phantom collisions while hidden.

Slow movement uses the existing control-sphere collision to nudge nearby balls. A deliberate faster sample, initially around 1.2 camera-heights/second, adds a local velocity impulse with smooth falloff around the control point. Derive a direction from the raycast displacement, add a modest radial component, and clamp both input strength and the resulting sphere velocity. Use the existing physics arrays and maximum-velocity safeguards, not a second solver. Raycast/map failures produce no force. Do not store movement in React state.

Keep units explicit: convert tracked movement/second into the source's per-step velocity scale. Limit long simulation deltas after tab suspension and ensure collision adjustments cannot bypass the final velocity ceiling. Start with the source's gentle configuration—gravity approximately .01, friction .9975 and wall bounce .95—then tune from measured behavior. Reduced motion lowers ambient/maximum velocity and impulse strength while retaining interaction.

## Visual direction and quality

Use the existing physical material, lights, environment mapping and instancing. Restrained deep-violet, lavender and blue-violet colors, dark surroundings, bright reflections and dimensional shadows. Hide the control sphere with `followCursor=false`; sphere movement itself communicates force. No HUD, meters, score, audio, added modes or final redesign.

Start with approximately 200 spheres, 120 on small/weaker devices if initial measurements warrant it. Cap display pixel ratio and total resolution. The source's pairwise collision loop scales quadratically, so responsive interaction takes priority over count. Keep the first implementation free of a new postprocessing framework; tune emission/highlights within its existing material/light system.

## Lifecycle and failures

Track and dispose renderer, sphere geometry/material, instanced resources, environment render target, PMREM generator and temporary RoomEnvironment resources. Remove pointer listeners, resize/visibility hooks, observers, timeouts and animation callbacks. Handle initialization failures after partial allocation and context loss without disabling navigation. Repeated mounting must not accumulate contexts or listeners. Use a fresh mount canvas if required by the source's forceContextLoss behavior.

Catch LAUNCH initialization/render failure and show “LAUNCH requires WebGL on this device.” Retain hand retry and explicit fallback; do not create a fake Canvas Ballpit. Other modes remain usable.

## Interface and fallback

Enable all four mode buttons. Add “04 — FORCE” and subtle instructions: “Raise your index finger,” then “Move slowly. Then flick.” Fade guidance after meaningful interaction and restore it after sustained hand loss.

Explicit mouse/touch fallback shares the same normalized input and bounded force boundary. UI controls never apply force; source changes and pointer leave/release reset motion. Validate slow nudges and fast drags separately from physical hand feel.

## Files and execution tasks

- [ ] Add focused tests in `tests/launchInput.test.js` for mapping, one-sequence consumption, bounded force/falloff, repeated/invalid/stale input, and zero-impulse reacquisition. Implement `src/tracking/launchInput.js` without changing FLOW's hand processing.
- [ ] Copy the exact Ballpit attachment into `src/effects/Ballpit.jsx`, isolate LUMEN input/lifecycle modifications, and retain instancing, material, collision and raycast architecture. Install only `three` with an exact compatible version; update package.json and lockfile. Verify its Timer/material APIs against the installed package.
- [ ] Add `src/modes/LaunchMode.jsx` to map shared hand/fallback input, own rendering/error boundaries and cap quality. Modify `src/App.jsx` to enable LAUNCH, retain the shared worker and show mode-specific guidance. Add only necessary styling.
- [ ] Add proportional `tests/browser/launch.spec.js` for activation, fallback physics, WebGL failure isolation, repeated unmount/remount and all four modes. Extend existing single-stream/resource checks through GLOW→FLOW→SLASH→LAUNCH→FLOW→LAUNCH→GLOW, verifying worker reuse, callback/listener cleanup and Stop.
- [ ] Run unit tests, Edge browser checks, production build and the `/Lumen/` production script. Inspect reflective sphere screenshots; compare slow and fast mouse responses. Extend physical camera verification to LAUNCH and record whether an actual hand was detected. Report frame-rate observations as measured, not guaranteed.
- [ ] Document source adaptation, changed files, dependencies, input units, disposal, limitations and actual validation in README and `docs/phase-4-progress.md`. Publish the verified change through the existing Pages workflow. Stop after Phase 4.

## Acceptance and limits

Automated checks must verify valid impulses, local influence, baseline reset, one camera/worker, navigation and cleanup. Physical hand alignment, intuitive nudging/flick force, perceived responsiveness and artistic satisfaction require a real viewer. Ballpit's existing solver can need tuning under dense overlap and variable frame rate; preserve it and make the smallest stability changes supported by evidence.

**Recommended execution:** implement in this session after plan approval. The exact source is available; no additional source is required. Final polish remains deferred.
