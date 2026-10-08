# LIGHT TRACE and KINETIC verification

Implementation follows the approved five phases. App remains the camera owner; connection is manual and idempotent. SLASH delegates only monotonic timing to the shared clock and retains its scoring and progression. FLOW and LAUNCH add independent scoring, ready/countdown/playing/results, explicit pause/resume, and replay.

The existing MediaPipe worker, hand prediction, push/grab/slash detectors, SplashCursor and Ballpit solver remain in use. Six shared colors, lingering fluid, per-ball creation colors, zero-ball starts, the 150-ball cap, collisions and cluster throws are retained.

LIGHT TRACE measures ordered path coverage from fresh input, not pixels in the fluid. Distance-weighted deviation within a viewport-scaled tolerance determines completed-shape accuracy. Invalid jumps and stale sequences do not bridge the path. KINETIC checks swept ball movement against a world-space disc volume in the fixed-step loop. Held balls cannot score until released; existing overlaps must exit before entering again. Targets regenerate within new bounds after resize.

Independent review found and verified fixes for stationary pointer holds, queued grab intent, and target resize reachability. No combos, moving targets, bonus scoring, or new physics engine were added.

## Verification

- Unit suite: 84 passed.
- Production build: passed; lazy LAUNCH chunk remains above Vite's 500 kB warning threshold.
- Local /Lumen/ production check: passed, including local worker/model inference and all three game lifecycles. Optional Google Fonts are blocked in the sandbox; the documented system-font fallback was explicitly checked with LUMEN_OFFLINE_FONTS=1.
- Full browser suite: 64 passed, including real pointer tracing, rapid-push fixtures, multi-ball physics/grabbing, camera pause/reconnect, replay, and responsive layout.
- Deployment uses the existing GitHub Pages workflow on main. Live verification compares the deployed entry hash with the verified local build and checks /Lumen/ workers, models, dynamic chunks, layout, and all three game lifecycles.

## Performance

Headless Edge, 1366×768, CPU microbenchmarks (100 batches of 100 calls): target check with 150 balls median 0.005 ms, p95 0.014 ms; tracing evaluator p95 0.001 ms. The shared HUD measured 20 React commits: median 0.1 ms, p95 2.8 ms including initial mount. These measure incremental evaluation work, not end-to-end physical hand responsiveness. Existing physics and tracking benchmarks also run in the complete browser suite.

## Physical testing

Automated tests use synthetic camera capture, recorded landmark fixtures, and real pointer/physics/rendering pipelines. Live human webcam tracing, rapid firing, reachability and throw comfort have not been physically verified. Camera jitter, gesture comfort and target depth should receive a real-person tuning pass before treating these initial settings as final.
