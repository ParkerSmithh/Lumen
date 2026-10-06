# LUMEN — Interaction Repair Plan

Date: 2026-10-06. Status: proposed; awaiting review before product implementation.

## Intent and scope

GLOW shows the viewer and their real environment while their body becomes colored light. FLOW creates light from the index finger. SLASH destroys colored matter through deliberate movement. LAUNCH begins empty, creates matter through a forward index-finger push, and retains local nudging and flicking. Red, orange, yellow, green, blue, and purple connect all four modes.

Preserve the supplied renderers, shared camera ownership and hand worker, stop/re-entry, guidance lifecycle, responsive controls, keyboard access, reduced motion, error isolation, lazy LAUNCH loading, cleanup, and `/Lumen/` paths. Add no dependencies or modes. Do not freeze the project or claim physical acceptance from synthetic inputs.

This plan is grounded in source inspection. No live person, webcam performance measurement, build, regression suite, or deployed-site verification has been performed during planning. Timing values below are configured limits, not measured throughput.

Change classifications:

- **REQUIRED:** behavior explicitly requested or necessary for safe implementation.
- **EXPERIMENTAL:** a candidate technique evaluated with measurements and real hands before becoming the default.
- **ONLY IF PHYSICAL TEST CONFIRMS:** additional complexity justified by demonstrated remaining failure.

## Approach

Recommend extending the existing renderer and input boundaries: camera compositing inside GLOW, shared color in App, diagnostics in the shared hand pipeline, bounded interpolation in FLOW, palm-motion tolerance in SLASH, and a capacity/active-count distinction plus push detector in LAUNCH.

A separate visible video with an overlay is simpler initially, but makes background-only treatment and fallback consistency harder. Replacing the tracking or Ballpit engines would create unnecessary lifecycle and regression risk. Keep the current engines and add focused interfaces instead.

## GLOW

### Current path and cause

`useWebcam.js` owns one stream, requesting ideal 640×480 at 30 fps; actual dimensions depend on the device. App keeps its video element hidden. `useBodyTracking.js` captures frames for `segmentation.worker.js`, with a 66 ms minimum submission interval and one inference in flight. The worker returns confidence-mask values and source dimensions.

`GlowMode.jsx` passes only mask, color, time, motion preference, and opacity to `glowRenderer.js`. Its WebGL shader samples only the mask and emits procedural light with opaque output. Its Canvas fallback fills black and draws a colored mask. Neither receives or samples webcam pixels. Consequently no face, clothing, chair, or room information can survive. This is a confirmed code-level cause.

### Proposed presentation — REQUIRED

Pass the shared video reference and live-camera state to GLOW. Fit a centered camera frame into the area between the top identity/navigation and bottom guidance/color controls. Use actual `videoWidth/videoHeight`, retaining the entire image with contain geometry and no crop or stretch. Recompute on camera metadata and viewport changes.

At 1366×768, aim for roughly 500–540 px of usable artwork height, yielding a roughly 667–720 px wide 4:3 frame; a 16:9 stream uses more horizontal space at the same available height. The exact safe area follows measured control bounds. Reserve more top space for mobile navigation and reduce margins on short screens. Keep the border on the actual fitted frame, avoiding a border around empty letterboxing.

Use a square-cornered 1 px neutral border with very low selected-color illumination. Keep navigation, color controls, and guidance outside the image. Prevent the existing atmosphere layer from darkening the camera artwork. Retain the illustrated preview as explicitly camera-off; do not portray it as a live scene.

### Compositing — REQUIRED

Add a webcam texture alongside the mask texture. Display the full original camera whenever ready, including before segmentation loads and when segmentation finds no person. A missing/stale mask fades the effect; it must never erase the live camera.

Use one shared source-coordinate mapping for camera, mask, body treatment, and halo. Mirror horizontally exactly once. Account explicitly for texture upload orientation. Camera and segmentation use the same contain rectangle even if their resolutions differ.

Start with the original image as the dominant contribution. Apply moderate hue tint and luminance-dependent emission only where the person mask is present. Avoid opaque color fills and high interior bloom. Derive a narrow edge band and restrained outer halo from the mask; clip the final artwork to its frame. Start with a small body tint contribution around 20–30%, then tune against a real face and clothing.

Retain background pixels. Initially leave them faithful; **EXPERIMENTAL:** a slight background-only exposure/saturation reduction if this improves luminous separation in a bright room. Never use the mask to remove the environment. Selected color changes tint, emission, edge, halo, and optional faint border illumination, without applying the hue to the room.

Implement equivalent detail-preserving compositing in the Canvas fallback using the original video plus masked transparent treatment layers. On camera stop, clear retained camera imagery. Release both textures and fallback buffers on cleanup/context loss.

**ONLY IF PHYSICAL TEST CONFIRMS:** temporal mask-edge stabilization or capture-aligned camera/mask pairing if fast body motion causes objectionable halo displacement. The mask currently represents an older inference frame than the latest video; matching geometry alone cannot eliminate temporal offset. Measure this before accepting added buffering and latency.

### Validation

Use a deterministic synthetic scene with distinct person detail and background landmarks to test original-scene visibility, masking, six colors, orientation, missing-mask behavior, fallback, stop, and re-entry. Check frame bounds/aspect ratio at 1366×768, desktop, portrait mobile, and short landscape sizes.

Physical acceptance requires a real face, clothing, chair, and room, including a bright room: recognizable facial features and clothing, primarily body-only colored light, aligned edges, restrained bloom, and all six colors. Synthetic scenes cannot establish that aesthetic acceptance.

## Shared colors — REQUIRED

App already holds six swatches and a selected color, retained across mode switches. Only GLOW receives it; the selector is rendered only in GLOW and the shell uses purple elsewhere.

Promote that existing state into a shared palette module and pass the selected color to all modes. Show the same keyboard-accessible selector in every mode, with fallback controls arranged beside it responsively. Preserve selection across switches; persistence across reloads is unnecessary for this brief.

- GLOW: update body-only treatment and faint frame illumination.
- FLOW: replace hard-coded purple; update the live fluid color through a ref/config path without rebuilding the simulation. Rainbow remains off. Existing dye can dissipate naturally after a color change.
- SLASH: derive face shades, outlines, halo, trail, sparks, and fragments from the chosen hue. Capture each object's palette at spawn so its destruction remains visually coherent if selection changes before the cut.
- LAUNCH: capture selected color when each sphere is created. `InstancedMesh.setColorAt` already exists in Ballpit, so individual creation colors need no renderer replacement. Write only the new/recycled instance color and mark the instance-color buffer dirty. Avoid calling global `setColors` on selection changes because that recolors existing instances. Preserve materials and use restrained/neutral shared lighting so older ball colors remain readable.

## Shared hand tracking

### Current findings

`useHandTracking.js` uses requestAnimationFrame polling, rejects repeated video timestamps, and enforces one outstanding bitmap/inference operation. Its 50 ms minimum interval caps submissions at 20 Hz; display scheduling can lower actual cadence. The worker uses CPU MediaPipe, one hand, and detection/presence/tracking confidence thresholds of 0.5. Capture uses actual camera dimensions without downsampling.

There is no capture, worker, inference-duration, result-age, or effective-cadence instrumentation. Those values and the actual physical bottleneck remain unknown. `updateHand` mirrors the index and wrist, uses a fixed 35 ms smoothing time constant, suppresses movement below 0.0015 normalized units, clamps velocity to ±3, and treats a >0.25 normalized jump or >250 ms gap as a reset. Consumers expire samples at 250 ms. FLOW further caps movement at 0.08 per sample. These limits can suppress deliberate fast motion, but their real-world contribution is a hypothesis.

All three modes use contain mapping from camera aspect to artwork space. Raw SLASH landmarks are mirrored separately while the shared wrist is already mirrored; preserve exactly-once mirroring when consolidating palm data.

### Diagnostics — REQUIRED

Record bitmap capture duration, dispatch-to-result time, worker inference duration, effective result Hz, source dimensions, frame/result age, stale rejection counts, detection/loss/reacquisition, raw versus filtered index position, palm position, speed, and reset reasons. Use monotonic elapsed durations measured within each context; do not assume worker clock origins match the main thread.

Gate diagnostics and the overlay behind `import.meta.env.DEV` and an explicit debug switch; production must not display it. Keep bounded histories and no video recording/upload. Show slash qualification and LAUNCH push signals/state alongside tracking data.

### Responsiveness — EXPERIMENTAL

Compare 20 Hz, 30 Hz, and uncapped fresh-frame submission on the same device/lighting. Maintain one operation in flight including bitmap creation. Skip stale frames and results; never queue. Record cadence and median/p95 latency, loss rate, and perceived control for each setting. Keep the highest stable setting based on measured results, not the nominal target.

Evaluate adaptive smoothing separately: stronger filtering for small stationary jitter, weaker filtering for deliberate motion. Preserve immediate reacquisition baselines with zero initial velocity. Change cadence first, smoothing second; retain a bounded 3–5 sample history for gesture estimates.

**ONLY IF PHYSICAL TEST CONFIRMS:** lower confidence, downsample inference capture, change reset-distance limits, or add short capped prediction. Test one variable at a time; prediction can overshoot turns and must reset on loss. Camera resolution increases for GLOW are also conditional on measured readability and tracking/performance cost.

## FLOW — REQUIRED

`FlowMode.jsx` maps the index into camera-contained artwork coordinates. `consumePointer` accepts each sequence once, creates safe baselines, and bounds displacement/force. `SplashCursor.jsx` currently injects one splat at the final sample position, allowing spatial gaps between tracking results.

Return both segment endpoints for each accepted movement. Interpolate a bounded number of splats according to segment length and brush radius. Divide the total velocity and dye budget across those points; do not apply full force at every point. Preserve the complete accepted stroke geometry while capping the force independently. Baseline/reacquisition produces no connecting stroke or giant splat. Keep sample consumption once per sequence.

Test continuity, budget bounds, color updates without remount, duplicates, stale results, source changes, and reacquisition. Physical tests: line, circle, S, slow/fast/diagonal motion, loss and re-entry, six colors.

## SLASH

Current `handEdge` computes raw palm center from wrist and three knuckles, using wrist-to-pinky as the blade. The detector smooths center with a 25 ms time constant, requires speed ≥0.9 normalized height units/second, two qualifying samples and 0.06 travel within 180 ms, and resets on >140 ms gaps, edge jumps, or outlier speed. Collision already sweeps geometry with padding. At sparse inference cadence, sample qualification and edge instability can reject a natural swipe.

**REQUIRED:** use the shared robust palm signal/history for movement qualification, retain slow-motion rejection, swept collisions, and loss/reacquisition baselines. Color the complete destruction effect from the object palette.

**EXPERIMENTAL:** qualify short coherent palm swipes with measured speed/travel, tolerating a temporarily unstable hand edge by synthesizing a modest blade extent from palm position, hand scale, and movement direction. Compare to the original detector using real horizontal, vertical, and diagonal swipes. Avoid silently reducing all thresholds at once.

**ONLY IF PHYSICAL TEST CONFIRMS:** increase collision padding or lower travel/speed thresholds after the tracking cadence change. Record false cuts during normal motion as well as successful intended cuts.

## LAUNCH

### Current initialization

`LaunchMode.jsx` allocates 120 instances on small screens or 200 elsewhere. Ballpit randomizes all initial positions and sizes; index 0 is a hidden controller and the rest are immediately visible/simulated. Raycasting projects the index onto the existing plane. Slow movement follows the controller, and fast movement adds bounded local impulses. There is no forward-push signal or spawn state.

### Empty state and activation — REQUIRED

Separate allocated capacity from active sphere count. Reserve index 0 for the existing invisible controller and allocate capacity for up to 200 visible balls plus that controller. Begin with zero visible instances. Limit physics/collision, force, and matrix loops to active indices; inactive capacity must neither render nor collide. Use the existing 60 Hz solver, sizes, materials, gravity, friction, bounce, raycasting, lighting, and cleanup.

Activate one slot per gesture by assigning a valid position, size, bounded velocity, matrix, and creation color. Advance mesh draw count to include that slot and the hidden controller. Do not use `setCount` for spawning: it reconstructs the engine and resets existing matter. At capacity, recycle the oldest visible slot and reset all of its state. Verify no inactive spheres influence collisions and no allocation/reinitialization occurs per spawn.

### Forward push — REQUIRED behavior; EXPERIMENTAL detection

Add a pure gesture detector with bounded history. Compare apparent palm scale (wrist-to-knuckle distances and palm width), index configuration/orientation, and index depth relative to palm. Palm scale growth is a primary candidate; relative Z is corroborating evidence, not the sole trigger. A finger pointing toward the camera may be foreshortened, so do not require only a flat-camera extended-finger test.

Acquire a stable pointing baseline before arming. States: READY → PUSH → one spawn → WAIT_FOR_RETRACTION/COOLDOWN → READY. Require coherent forward evidence over a short measured window, a cooldown, and actual retraction toward the baseline before rearming. Do not let a timer alone rearm a held-forward hand. Tracking loss or a reset cancels motion history; reacquisition establishes a fresh baseline and never spawns immediately. No trigger from pointing alone, resizing, source switches, or stale input.

Starting threshold candidates must be chosen from diagnostic recordings of normal pointing, deliberate pushes, retractions, and lateral flicks. No claim of robust detection until physically compared. If an initial combined detector fails, evaluate scale and orientation separately before adding complexity.

### Location, velocity, color, and force — REQUIRED

Reuse the existing index mapping/ray-plane projection for spawn location. Clamp the center within walls with radius clearance. Give the sphere a small capped velocity into the world, respecting reduced motion and solver units. Ensure repeated creation near existing balls has safe separation, including a deterministic collision-normal fallback for coincident centers.

Capture the current selected color at spawn. Preserve existing balls' colors. Keep gentle controller-based local nudging and stronger speed-dependent impulses from `consumeLaunchInput`/`localImpulse`. Creation must not also inject a spurious flick from depth/scale changes. Baselines, loss, tab hiding, and re-entry disable the controller and force history.

For fallback testing, pointer press creates one ball and movement nudges/flicks; label fallback instructions accurately. This is an accessible alternate input, not physical gesture verification.

Test empty initialization, each active-count boundary, 200-ball recycling, retained instance colors, held-forward suppression, retraction, stale/duplicate/outlier inputs, loss, spawn bounds, bounded velocity, physics preservation, and cleanup.

## Execution and acceptance sequence

1. Implement framed full-camera GLOW, compositing, detail preservation, and fallback. Validate scene geometry before adjusting glow strength.
2. Promote the six-color system and integrate all modes without renderer remounts.
3. Add shared diagnostics and establish the current real-hand baseline.
4. Compare cadence options, then adaptive smoothing independently; retain measurements and chosen values.
5. Add bounded FLOW interpolation; physically compare continuous strokes.
6. Repair SLASH qualification; physically compare successful swipes and false positives.
7. Add LAUNCH empty active-count architecture, push creation, then force integration.
8. Tune push/retraction and flick separately with a real hand. Run the brief's full acceptance checklist for all four modes.
9. Run `npm test`, `npm run test:browser`, `npm run build`, and `npm run check:production`. Update tests that assume silhouette-only GLOW or prepopulated LAUNCH.
10. Verify the published `/Lumen/` build matches the new entry hash, deferred LAUNCH chunk, workers, and models using the existing checker against the published URL after deployment. Local build verification does not establish published-site verification.

The current environment offers shell/automated browser testing but no demonstrated live desktop/webcam inspection capability. A real person must participate in the physical tuning loop; explicitly record their observations and actual device/cadence results. If unavailable, deliver implementation as awaiting physical acceptance and leave the project unfrozen.

## Performance and reporting

Measure GLOW frame cost with video texture uploads and mask edge sampling, capture/inference latency at each tested cadence, and LAUNCH frame time at 0/50/100/150/200 balls. The supplied collision solver remains quadratic in active balls, making active-count restriction important. Choose a cap within 150–200 based on measurements; do not label 200 safe without evidence. Compare on the same device before/after and note camera dimensions.

Expected touched files: `src/App.jsx`, `src/styles.css`, all four mode components, `src/effects/glowRenderer.js`, `SplashCursor.jsx`, `slashScene.js`, `Ballpit.jsx`, `src/hooks/useHandTracking.js`, `public/hand-tracking.worker.js`, `src/tracking/handPointer.js`, `slashDetector.js`, `launchInput.js`; focused new shared palette/diagnostic/push-detector helpers as needed; relevant unit/browser tests, production checker, README, and progress records. Change body tracking/webcam constraints only when evidence requires it.

The final report will cover camera layout, compositing, background/face/body preservation, border, all four color behaviors, tracking findings and measured cadence/latency before and after, smoothing, FLOW/SLASH changes, zero-ball architecture, push states/spawning/forces, actual physical testing, imperfections, regression/build results, published Pages verification, performance, and exact changed files. Remove the README's feature-complete assertion while physical acceptance remains outstanding.
