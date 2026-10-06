# LUMEN — Physical Interaction Tuning Pass

Date: 2026-10-06. Status: local engineering verification passed; new physical acceptance remains pending. The project is unfrozen.

## Physical evidence and diagnosis

The user physically tested the deployed Interaction Repair build. Their findings are the baseline: GLOW's full webcam scene, segmentation and selected body color work, but luminosity is too weak. FLOW, SLASH and LAUNCH detect the hand better, yet movement is difficult to follow and interpret. This pass treats detection and movement separately and keeps MediaPipe and the supplied engines.

Confirmed source-level problems:

- Shared motion used a fixed 35 ms smoothing constant and a hard 0.0015 dead zone. Any fingertip displacement over 0.25 normalized units reset motion, even when the wrist and palm moved with it.
- FLOW independently rejected travel over 0.25. Its interpolation divided a relatively weak ink budget across the stroke, making rapid long strokes faint.
- SLASH could veto a moving palm because the wrist/pinky edge moved inconsistently; it used another center filter and a 140 ms maximum gap.
- LAUNCH discarded movement above 0.3 aspect-corrected units, above speed 6, or after a 140 ms gap. Forward-push coherence was evaluated only across the latest five samples, excluding gradual pushes. After creation, WAIT_FOR_RETRACTION suppressed manipulation force indefinitely while the finger remained forward.
- GLOW's interior emission was heavily luminance-dependent, so dark camera pixels received little light.

These are measured/code-level findings. They do not establish the actual camera exposure, moving-hand inference cadence, blur, or missing-landmark rate on the user's device. No new real-person session was available to this agent.

## Implemented changes

### GLOW

Increased shadow emission from a 0.06 floor to 0.24, with a larger luminance contribution. The original image remains the base, and emission uses available highlight headroom rather than replacing pixels. Strengthened the narrow edge and local halo; added a restrained outer contribution sampled at 28 canvas pixels. Canvas fallback likewise increases masked screen emission and local bloom.

The room is still drawn from the original camera; no global tint, black background replacement, heavy blur, or stronger background dimming. Frame, aspect ratio, mirroring, color selection, face/clothing detail and cleanup remain intact. A dark-scene pixel regression improved the selected red body channel from 30 to above 70 while preserving internal contrast and unchanged distant room pixels. Real-face appearance and perceived brightness need the physical retest.

### Shared movement

- Adaptive smoothing: 28 ms for small/stationary movement, approaching 6 ms for deliberate movement. Removed the hard fingertip dead zone.
- Compare raw movement against accepted raw samples, not the delayed filtered point.
- Corroborate large fingertip movement with palm/wrist travel. Coordinated travel of 0.3 over 66 ms is accepted instead of reset. A hard 0.65 displacement still establishes a new baseline.
- Hold isolated large fingertip spikes; if a changed location is confirmed, establish a baseline rather than drawing or applying force across it.
- Keep a bounded five-sample motion history and a bounded velocity vector. Applied mode forces remain independently capped.
- Add short prediction to compensate for result age: at most 45 ms and 0.04 normalized displacement. Presence expires at the existing common 250 ms threshold; prediction does not prematurely reset accepted tracking.

MediaPipe confidence, ideal 640×480 camera settings, 30 Hz submission target, frame freshness, single inference in flight and worker ownership are unchanged. No inference queue or detector replacement.

### FLOW

Retains SplashCursor and its existing bounded interpolation. Accepted long segments keep their geometry; force remains capped at 0.08 displacement and total ink is divided across interpolated points. Ink energy now scales within a bounded 1–4 range according to movement, with brighter selected-color injection and density dissipation reduced from 3.5 to 1.8.

A short selected-color light filament and luminous source make the newest accepted position visible immediately, even while fluid advects. This is a transparent Canvas layer updated within the existing mode RAF; it adds no animation loop, tracking worker or input backlog. It fades after 170 ms, uses bounded prediction, resets on reacquisition, and is disposed with the mode. It is artistic light, with no conventional cursor/crosshair.

### SLASH

Preserves the slash detector, scene, fragments and swept collision system. Real-hand input derives a moderate blade from palm motion and direction, removing precise wrist/pinky geometry as a qualification requirement. Hand-only thresholds are 0.65 speed and 0.045 travel, with up to 220 ms sample gaps and a 280 ms coherent gesture window. Brief small jitter can pause a candidate; slow movement alone cannot initiate one. Hand collisions have modest extra padding.

Mouse qualification remains on its existing thresholds. Loss, source changes, outliers and reacquisition still establish baselines. Rough horizontal, vertical and diagonal generated swipes now qualify despite unstable edge geometry; slow movement tests still reject cuts. Physical miss and false-cut rates remain unmeasured.

### LAUNCH

Preserves zero visible balls initially, individual creation colors, 150 active-ball cap/recycling, instancing, materials and existing 60 Hz physics.

The pointing approximation accepts a reasonably extended index using chain straightness and orientation without requiring two precisely curled neighboring fingers. A sustained scale increase can create matter without Z change; relative depth can corroborate a smaller scale change. A short uncertain pointing sample no longer discards the baseline. Larger combined evidence can qualify a quick push; gentler pushes require sustained evidence across samples.

Holding forward does not rearm creation. Actual retraction or a sustained, explicitly closed-index reset is required; general pose uncertainty cannot reset the waiting state. Closure has its own 200 ms timer so one bad sample cannot rearm it. Hand loss/outliers still reset safely.

After creation settles, WAIT_FOR_RETRACTION allows lateral nudging and flicking while continuing to block another spawn. Forward/creation motion suppresses force. Pointer baselines now tolerate accepted travel up to 0.65, speed up to 12, and gaps up to 250 ms; impulses still have the supplied velocity ceiling. Local gentle nudges also reach screen-near balls at different depths; lateral flicks use stronger bounded force. The hidden controller's response is increased through configuration, without changing the solver.

## Measurements and limitations

Generated sinusoidal landmark replay at 30 Hz:

| Measurement | Previous motion filter | New motion filter |
| --- | ---: | ---: |
| Mean raw-to-filtered position error | 0.05034 normalized units | 0.000693 normalized units |
| Approximate horizontal error for 640 px source width | 32.2 px | 0.44 px |
| Resets in this continuous trajectory | 0 | 0 |

See [before](tuning-measurements/tuning-motion-before.json) and [after](tuning-measurements/tuning-motion-after.json). A separate fast-step regression demonstrates the old 0.25 reset incorrectly rejecting coordinated 0.3 travel. The replay is generated input, not a real moving hand, and does not measure camera or model latency.

Actual CPU MediaPipe worker on a synthetic 640×480 camera scene with no hand:

| Target | Effective result Hz | Median capture-to-result age | p95 age |
| --- | ---: | ---: | ---: |
| 20 Hz | 20.01 | 17.4 ms | 20.1 ms |
| 30 Hz | 27.90 | 16.9 ms | 18.4 ms |
| Fresh-frame max | 30.17 | 17.4 ms | 19.1 ms |

See [worker measurements](tuning-measurements/repair-tracking-cadence.json). Moving-hand cadence is deliberately null in this dataset. The new development debugger measures it during actual movement, along with result/current-hand age, raw/filtered/predicted position, smoothing and estimated filter lag, rejected spikes and reset reasons. Empty search frames do not inflate actual loss-reset events. Its **Copy motion report** button exports only aggregate on-device metrics, with no video or image capture.

Standalone Ballpit measurements remain near 4.2 ms frame intervals on this high-refresh/headless machine at 0/50/100/150/200 balls; input/physics callback p95 stays around 0.1 ms at 150 and 0.2 ms at 200. See [performance](tuning-measurements/repair-launch-performance.json). These exclude real hand inference and are not universal device guarantees. Active cap remains 150.

GLOW has additional mask sampling; FLOW adds a short Canvas drawing layer and brighter bounded ink, without another RAF. Main production JS is about 281.51 kB (89.14 kB gzip); lazy LAUNCH is about 564.52 kB (142.56 kB gzip). The existing large Three.js chunk warning remains.

## Verification

- 45 unit tests passed, including coordinated movement, dead-zone removal, spike rejection, bounded prediction, rough slash samples, gradual pushes, pose uncertainty, held-forward force, retraction/reset and diagnostic counters.
- 31 browser tests passed, including existing Phase 5 reliability, body-detail/background compositing, dark-body emission, generated-camera FLOW emitter and push/retract cycles, colors, cleanup, error recovery, keyboard and reduced motion.
- Production build passed.
- Local `/Lumen/` production check passed: matching entry hash, 12 assets, both real workers, deferred LAUNCH chunk, shared selected color, responsive controls across all modes/five viewport sizes, zero console errors and no production diagnostics.
- Read-only review found two important issues (pose uncertainty rearming creation and prediction expiry invalidating fresh samples). Failing safety regressions reproduced both; fixes and focused reviewer verification passed. A separate closure timer resolves the additional one-sample reset concern.

Published deployment verification is reported after the existing Pages workflow runs. New physical acceptance remains pending, regardless of these automated results.

## Physical retest

Use the new published build for the artwork. For motion diagnosis, run the development server and open `http://127.0.0.1:5173/?debugTracking&trackingHz=30`. The debugger is absent from production.

1. GLOW: seated face/hair/clothing/hands/chair/room, each color, normal and dim room lighting. Check brighter emission without losing features.
2. FLOW: slow/fast lines, circles, S curves and diagonal movement; confirm the bright source and fluid stay perceptually attached. Watch for prediction overshoot at turns.
3. SLASH: natural horizontal/vertical/diagonal swipes versus ordinary motion. Count misses and false cuts.
4. LAUNCH: point briefly, push once, hold, move/flick the existing ball, retract and push again. Check brief pose uncertainty does not cause spamming and creating never applies an accidental flick.
5. Copy the development motion report during movement. Record browser/device, camera distance, result/movement Hz, result age, filter lag, spikes and reset counts. Change one variable at a time for further tuning.

This agent performed no new real-person test. The user's earlier hands-on failure is acknowledged as physical evidence; generated landmarks, mouse events, synthetic video and automated checks are engineering validation only. Missing landmarks during real motion, camera exposure/blur and prediction overshoot require the next physical session. Do not freeze the project until that session passes.
