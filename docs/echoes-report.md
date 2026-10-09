# LUMEN ? ECHOES

Implemented on feat/echoes from 188ffebb324e9b353422589f17b521e329eb5014. Release requires separate approval. No push, main merge, or Pages deployment was performed.

## Delivered behavior

GLOW creates up to 3 soft segmentation-only body afterimages lasting 0.8 seconds, subtracting the current foreground. No webcam pixels enter an echo. Presence gallery records contain one coarse movement centroid, never body contours.
FLOW records actual fresh drawing positions on accepted completion, preserving input gaps; it never copies guide geometry into the gallery. Up to3 live copies dissolve over 2.5 seconds.
SLASH uses accepted destruction events with the actual transformed crystal vertices and creation color. Parents and children have independently scoped IDs. Up to8 short constellations reuse Canvas drawing without new particle simulation.
LAUNCH tracks actual corrected simulation positions at 10 Hz and forces samples at boundary turns. Explicit throws start at the current release position; camera-loss drops cannot create throws. Six bounded pending paths appear during motion; completed throw/hit arcs fade over 3 seconds. Slot generations isolate recycled balls.

The deterministic gallery uses only these events, preserves captured source proportions and six-color values, and fits their geometry without fabricated decoration. Display and 2048?2048 PNG use the same Canvas composition function. Export has allocation/blob/download error handling, cancellation after clear/unmount and object-URL cleanup.

## Lifecycle safeguards

ECHOES opens through a synchronous gate, pausing the actual round clock before gameplay input can run. Rendering, physics, gesture processing and inference are suspended while mounted rounds retain score/time/state. Pointerdown suspension safely releases held balls without a pointerup-generated throw. Returning requires explicit RESUME. The manually connected camera stream is retained without permission requests.
Delayed resize callbacks defer during gallery viewing; unchanged world bounds cannot discard a target. CLEAR removes completed records and transient paths through an epoch change without resetting gameplay or personal bests. Existing balls retain only slot/color/generation metadata and can produce new echoes after clearing.

## Bounds and privacy

256 total records, 64 per mode, 64 points per record;256-point FLOW scratch;16-point rolling history per active ball, at most 150 balls; six 32-point throw buffers; three 32?24 segmentation buffers. Deduplication metadata is bounded. Tests enforce a serialized gallery payload below 1 MiB; JavaScript object overhead and fixed render canvases are separate. New LAUNCH echo canvas is capped 1280?900 and GLOW overlay 640?480.
All echo data lives in App-owned memory and disappears on reload/tab closure. No storage API, cloud upload, analytics, video frames, identifiable landmarks, exact tracking timestamps or hand history is used for echoes. Existing personal-best storage is unchanged. Reduced motion uses stationary fades.

## Changed files

- New src/echoes: echoStore, echoGeometry, echoGate, echoRuntime, presenceEcho, forceEcho, echoComposition, EchoGallery, gallery.css, echoExport.
- App.jsx: session ownership, optional gallery navigation, suspended tracking and development-only read-only echo diagnostics.
- Four mode components: accepted capture and existing-loop live drawing.
- useRound.js: synchronous pause/award gating; independent SLASH controller retains its own lifecycle.
- Ballpit.jsx and grabController.js: observational release/motion hooks and render suspension; original solver/gesture coefficients unchanged.
- slashScene.js: actual crystal geometry in existing lifecycle events.
- SplashCursor.jsx: suspension gate only; fluid engine and persistence retained.
- styles.css: gallery entry and echo overlay; existing navigation keyboard order retained.
- scripts/check-pages-build.mjs: real FLOW/LAUNCH gallery, PNG decoding/dimensions, pause/back/clear and diagnostics exclusion.
- New unit/browser tests and this report, implementation ledger and benchmark JSON. Existing tests were retained unchanged.

## Verification

npm test: 132 passed, zero failed/skipped/cancelled.
Full npm run test:browser -- --workers=4: 80 passed in 53.9 seconds. After final source-aspect preservation, all 12 affected echo/SLASH/LAUNCH browser tests passed again.
npm run build: passed. Gallery (~3.3 kB) and export (~0.8 kB) remain lazy chunks. Existing deferred LAUNCH chunk warning remains (~584 kB, gzip 149 kB).
npm run check:production: final result verified before commit; includes actual worker/model inference, 12 assets,/Lumen/ paths, all game lifecycles, gallery records from real pointer/physics events,2048 PNG, pause/back/clear, no diagnostics and zero console errors.
Desktop 1366?768 and mobile 390?480 gallery captures reviewed; existing suite also covers 667?375 and other mode layouts.
One existing moving-emitter pixel assertion failed while production verification was also running; it passed in isolation, and the subsequent full suite passed without concurrent production work. No gesture or timing threshold was changed to accommodate it.
Independent source review found no remaining blocking defects after lifecycle fixes.

## Performance

Headless Edge CPU fixtures; 60 warmup + 600 measured frames per enabled/disabled case. SLASH reached 8 crystals/192 particles and 440 identical destruction events. LAUNCH tested 150 balls in airborne/crowded/resting layouts, rolling histories, six pending throws and accepted-hit fixtures. Final physics positions match exactly in enabled/disabled runs.

| CPU work | Disabled median/p95 ms | Enabled median/p95 ms |
| --- | --- | --- |
| SLASH update/cut/draw |0.30/0.40|0.30/0.50|
| LAUNCH 150, all three layouts |0.10/0.20|0.10/0.20|

Raw measurements: echoes-performance.json. These are incremental CPU measurements, not full-frame FPS, GPU rendering or webcam latency. Timer resolution limits interpretation of differences near 0.1 ms.

## Remaining limitations

Automated tests use synthetic segmentation/camera streams, pointer paths and actual simulation, plus real model initialization/inference. Human webcam readability/comfort, low-end devices and end-to-end GPU/webcam performance remain unverified. Gallery records evict oldest events at their per-mode bound. Long or dense sessions intentionally retain a bounded selection rather than a complete history. Export failure handling preserves session records but cannot guarantee every browser honors a download click.
