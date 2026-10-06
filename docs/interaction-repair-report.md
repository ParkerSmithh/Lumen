# LUMEN interaction repair � implementation record

Date: 2026-10-06. Status: implementation and local engineering verification complete; physical acceptance pending. Published GitHub Pages verification passed; details below.

The approved [repair plan](interaction-repair-plan.md) remains the acceptance specification. The project is unfrozen. No real person/webcam/hand session was available during implementation. Synthetic camera frames, real model inference on synthetic scenes, generated landmarks, and mouse events are engineering checks only.

## Resulting behavior

1. **GLOW layout:** centered, large, square-cornered camera artwork fits the safe area between navigation and controls. Actual video aspect ratio sets the frame. At 1366�768 a 4:3 camera occupies approximately 657�493 px. Mobile/short-screen insets preserve controls. The atmosphere no longer overlays this artwork.
2. **GLOW compositing:** the WebGL renderer uploads and samples the original webcam plus segmentation mask; the Canvas fallback draws the same original scene with masked transparent light layers. Camera remains visible before segmentation or when no person is found. A stale mask fades the effect rather than erasing the room.
3. **Background:** original camera pixels remain visible. No background removal, room recoloring, heavy blur, or exposure reduction was introduced. A narrow low-strength halo may cross the person boundary.
4. **Face/body:** original pixel structure remains dominant. Multiplicative tint plus luminance-dependent emission preserve internal shading; highlight headroom limits clipping. Canvas uses translucent, masked multiply/screen compositing. A synthetic dark-feature regression passes both renderers. Real facial readability and perceived luminous strength still require acceptance.
5. **Border:** 1 px translucent neutral line and restrained selected-color illumination around the actual image; no rounded card or thick RGB border.
6. **Shared color state:** one six-color palette in `src/colors.js`, existing App selection retained while switching modes, identical keyboard-accessible selector in all modes. No dependency changes.
7. **Mode colors:** GLOW changes person light, FLOW changes new ink without rebuilding its simulation, SLASH stores each spawned object's palette for matching fragments/sparks, LAUNCH writes individual instance creation colors. Older balls retain their colors; shared LAUNCH lighting is neutral.
8. **Tracking findings:** the old pipeline enforced a 50 ms submission interval, fixed 35 ms smoothing, 0.5 detection/presence/tracking confidence, and ideal 640�480 camera capture at 30 fps. It had one inference in flight but no latency instrumentation. No measured real-hand bottleneck is claimed.
9. **Cadence:** default submission target changes from 20 to 30 Hz. Fresh frames use `requestVideoFrameCallback` when available; one bitmap/inference operation remains in flight. Actual synthetic-camera measurements below support this conservative target; uncapped mode remains a development comparison.
10. **Filtering:** fixed 35 ms smoothing and confidence remain unchanged because no physical experiment justified changing them. Prediction and adaptive smoothing remain experimental/unselected. Raw index, palm and palm velocity are available; outlier/reset protections remain. Results older than 250 ms are discarded. Development-only diagnostics distinguish capture, inference, round trip, age, current hand age, dimensions, loss/reacquisition and reset reasons. Explicit `?debugTracking` or `?trackingHz=20|30|max` enables collection; no diagnostic overlay/global/collection in production.
11. **FLOW:** accepted segments generate up to 24 interpolated splats. Full accepted geometry is preserved separately from capped force. Total force and dye divide across the points. Baselines/re-entry do not bridge a stroke or cause a large splat. Perceptual attachment remains pending real-hand testing.
12. **SLASH:** shared palm is used for motion; a modest palm/velocity blade approximation supports briefly missing edge landmarks. Existing slow-motion rejection, coherent swipe qualification, collision sweeps and reacquisition protections remain. The 0.9 speed/0.06 travel threshold is retained pending real-hand evidence. No claim of physically tuned reliability.
13. **LAUNCH empty state:** 201 slots are allocated, including hidden controller index 0; no visible balls initially. Physics, collision, force and matrix loops use active count. No renderer rebuild on creation. Active cap is 150 visible balls, with oldest-slot recycling.
14. **Forward push:** a conservative prototype combines pointing pose, palm scale history and relative index depth; scale can qualify without depending exclusively on Z. A stable baseline is required before arming. Thresholds are provisional and explicitly not physically tuned.
15. **Spawn behavior:** READY ? one creation ? WAIT_FOR_RETRACTION ? READY. Holding forward cannot rearm from a timer alone; retract/reset is required. Acquisition works at 20/30/60 Hz. Creation retains its captured index position and color until the renderer acknowledges it, preventing lost gestures/taps between frames. Loss, stale data and visibility changes cancel pending hand creation.
16. **Force:** existing ray-plane projection, invisible controller nudge and bounded local flick impulses remain. Creation and developing forward gestures suppress flick force. Spawn velocity is modest and reduced-motion aware; positions have wall clearance. Coincident-sphere collision normals have a finite fallback.
17. **Physical testing actually performed:** none. No mouse or synthetic tests are described as real-hand verification.
18. **Remaining imperfections:** live segmentation has inference delay relative to the current webcam, so fast body movement may produce edge lag. Real pointing orientation, scale/depth push false positives, comfortable slash thresholds and fingertip smoothing require physical tuning. Higher camera detail and adaptive smoothing were not guessed into production. Performance is device-specific; 150 is conservative for this machine, not a universal guarantee.
19. **Automated regressions:** 28 unit tests and 28 browser tests passed, including Phase 5 camera/worker ownership, stop/re-entry, errors, guidance lifecycle, lazy import recovery, responsive controls, keyboard and reduced motion. Added tests cover scene/detail compositing, shared colors, bounded FLOW budget, palm approximation, push hold/retraction and 20/30/60 Hz acquisition, empty/recycling/instance colors, quick tap retention, metrics and real-worker cadence. The independent reviewer found no remaining Critical/Important issue after fixes.
20. **Production build:** succeeded. Entry JS about 278.26 kB (87.94 kB gzip); lazy LAUNCH about 563.69 kB (142.23 kB gzip). Existing large Three.js chunk warning remains. `npm run check:production` passed locally at `/Lumen/`, with 12 assets, actual segmentation/hand worker inference, lazy loading, all-mode controls at five viewport sizes, shared color and no production diagnostics/console errors. First sandbox attempt could not fetch existing Google Fonts; rerun with authorized network access passed.
21. **GitHub Pages:** repair commit `a2176de5f674c1771168b17039aab20bc40e8ee4` deployed successfully through [the existing workflow](https://github.com/ParkerSmithh/Lumen/actions/runs/37474315695). The published `https://parkersmithh.github.io/Lumen/` passed `node scripts/check-pages-build.mjs https://parkersmithh.github.io/Lumen/`: entry hash matches the local build; all 12 assets, segmentation and hand inference, lazy LAUNCH, shared selected color, responsive controls in all modes at five sizes, no production diagnostics, zero console errors.
22. **Performance:** see reproducible measurements below. GLOW adds camera texture upload and narrow mask edge sampling. FLOW has bounded additional GPU splat passes. LAUNCH's existing quadratic collision solver now runs only active spheres; empty space skips visible sphere work. No live combined-camera/hand/GPU benchmark was performed.
23. **Files changed:** App/styles, all four mode components, existing GLOW/SplashCursor/slashScene/Ballpit renderers, hand hook/worker, handPointer/slashDetector; added shared colors, diagnostics, metrics, FLOW stroke and push helpers; focused tests, production checker, README, approved plan, this record and measurement JSONs. Package manifests and engine dependencies are unchanged.

## Measurements

These are headless Edge runs on the available machine. Tracking uses a synthetic 640�480 scene, the actual CPU MediaPipe model, and no real hand. Latency is bitmap dispatch/capture-to-result elapsed time, not measured camera exposure-to-photon latency. See [raw tracking results](repair-measurements/repair-tracking-cadence.json).

| Submission target | Effective result cadence | Median result age | p95 result age | Median inference |
| --- | ---: | ---: | ---: | ---: |
| 20 Hz | 19.82 Hz | 17.50 ms | 19.90 ms | 16.90 ms |
| 30 Hz | 27.93 Hz | 17.00 ms | 18.30 ms | 16.40 ms |
| Fresh-frame maximum | 30.77 Hz | 17.60 ms | 18.80 ms | 17.00 ms |

No stale-result drops occurred in these scenes. Capture median was approximately 0.3 ms. Worker time dominates bitmap capture; real hand detection/landmark and exposure costs may differ. A previous uncapped run incorrectly counted repeated display-time samples; switching to actual video-frame callbacks corrected that measurement before selecting the default.

Standalone Ballpit uses a 1000�560 renderer with no hand inference. Frame intervals stayed near 4.2 ms on this high-refresh/headless environment at 0/50/100/150/200 visible spheres. Input/physics callback p95 was approximately 0/0.1/0.1/0.1/0.2 ms respectively. The 60 Hz fixed solver does not integrate on every high-refresh render, so callback medians near zero do not imply zero solver cost. These are CPU submission/callback observations and frame intervals, not GPU timer measurements. Keep 150 active balls to leave inference/rendering headroom. See [raw Ballpit results](repair-measurements/repair-launch-performance.json).

## Execution rulings and review

- The user explicitly approved implementation in this workspace and requested deployment via the existing main-branch Pages workflow. Work remained in the supplied checkout; no additional worktree/approval cycle was introduced.
- The approved plan is the brief; implementation follows its ordered subsystems. Confidence/smoothing/prediction and more aggressive slash/push thresholds remain pending physical experiments.
- A fresh read-only reviewer identified creation-event loss between frames, high-cadence acquisition starvation, inaccurate guidance and incomplete diagnostics. Focused failing tests reproduced the event race, 60 Hz starvation and acquisition-counter error; all pass after the fixes. Neutral lighting and production diagnostic gating were corrected too.
- Physical acceptance and broad device suitability were explicitly outside the reviewer's evidence. Those remain required before freezing the project.

## Physical acceptance session

Run locally with `npm run dev`. Use `http://127.0.0.1:5173/?debugTracking&trackingHz=30` for diagnostics and compare `trackingHz=20` and `trackingHz=max` one at a time. The production URL intentionally has no debugger.

Check GLOW seated face/hair/clothes/hands/chair/room, all six colors and body-edge alignment; FLOW line/circle/S at slow/fast/diagonal motion and re-entry; SLASH normal motion versus natural quick horizontal/vertical/diagonal swipes; LAUNCH point/push/one creation/hold/retract/repeat, colors, nudge/flick and hand loss. Record actual camera dimensions, cadence/latency and false positives. Change one variable per comparison, keep or revert from those observations.

## Exact changed files

- `README.md`
- `docs/interaction-repair-plan.md`
- `docs/interaction-repair-report.md`
- `docs/repair-measurements/repair-launch-performance.json`
- `docs/repair-measurements/repair-tracking-cadence.json`
- `public/hand-tracking.worker.js`
- `scripts/check-pages-build.mjs`
- `src/App.jsx`
- `src/TrackingDiagnostics.jsx`
- `src/colors.js`
- `src/effects/Ballpit.jsx`
- `src/effects/SplashCursor.jsx`
- `src/effects/glowRenderer.js`
- `src/effects/slashScene.js`
- `src/hooks/useHandTracking.js`
- `src/modes/FlowMode.jsx`
- `src/modes/GlowMode.jsx`
- `src/modes/LaunchMode.jsx`
- `src/modes/SlashMode.jsx`
- `src/styles.css`
- `src/tracking/flowStroke.js`
- `src/tracking/handPointer.js`
- `src/tracking/metrics.js`
- `src/tracking/pushDetector.js`
- `src/tracking/slashDetector.js`
- `tests/browser/launch.spec.js`
- `tests/browser/launchCreationRace.spec.js`
- `tests/browser/launchPerformance.spec.js`
- `tests/browser/repairColors.spec.js`
- `tests/browser/repairGlow.spec.js`
- `tests/browser/repairLaunch.spec.js`
- `tests/browser/trackingMetrics.spec.js`
- `tests/flowStroke.test.js`
- `tests/metrics.test.js`
- `tests/metricsLifecycle.test.js`
- `tests/pushCadence.test.js`
- `tests/pushDetector.test.js`
- `tests/slashRepair.test.js`
