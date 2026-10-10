# ENERGY RUSH final acceptance stage

Branch: feat/energy-rush. Starting committed snapshot:7f73acfb5e651c5f72f5af7c89b741550ae238f2. Source and executable diagnostic fixtures are preserved; no merge or deployment. Real-webcam acceptance remains NOT RUN; release HOLD.

## Concurrent SLASH investigation

The failing fixtures advanced countdown/round time but paced pointer events with wall-clock Playwright delays. The detector measures pointer timestamp differences, requires mouse speed0.9 and corroborating travel, and consumes samples during RAF. Thus host scheduling changed the intended gesture itself while scene objects continued moving from previously inspected positions.

Evidence before correction:
- Camera-free isolated arcade fixture:12 repetitions/6workers passed12/12;24 repetitions/12workers passed18 and failed6. Recorded pointer gaps reached123.1ms and normalized speed dropped to0.30–0.88 on rejected portions, below the unchanged0.9 threshold. Target positions and recognized-segment counts were captured, without camera data.
- BEYOND reduced-motion fixture with fake canvas camera/segmentation:12 concurrent repetitions passed1, failed10 at SLASH activation and timed out1 before starting the drag. Its SLASH drag suffered the same wall-clock pacing assumption.
- Playwright supplies separate page/context/storage per test; these fixtures have independent offset/random/camera stubs. The camera-free reproduction establishes camera/worker contention is unnecessary. Host CPU/GPU scheduling contention may contribute to lateness but its individual share was not measured. No allocation growth, shared-state contamination, or product collision regression was demonstrated by these failures.

Correction: shared test-only arcadeClock.js retains native RAF/real pointer events, holds simulated time during driver I/O, advances1/60 second per pointer sample, and waits a native renderer frame before issuing another sample/releasing the pointer. Clock resumes afterward; expiry, combo, overload, participation, storage and convergence assertions remain unchanged. Product code, scoring, detector thresholds, timeouts and default concurrency are unchanged. New arcade variant and BEYOND reduced-motion setup deliberately insert150ms driver latency per sample. Corrected concurrent stress:12/12 passed, including those latency regressions.

Instrumented old fixtures and traces are preserved in ignored .test-artifacts/slashTimingDiagnostic.spec.js, beyondTimingDiagnostic.spec.js, slash-timing-stress.log and beyond-timing-stress.log. They are not included in the normal test suite. This correction stabilizes deterministic intended gestures; it does not establish low-frame-rate physical-camera or device performance. Actual wall-clock pointer SLASH coverage in the other unchanged browser tests remains part of the full suite.

## Physical session

Use energy-rush-webcam-acceptance.md for the committed-production-preview commands and18 practical checks. Every physical check is NOT RUN. Each has procedure, correct behavior, failure criteria and written/scalar evidence only. No raw-camera recording, screenshots, tracking grids or landmark histories are requested. Local loopback camera secure context is required; another device requires a trusted local HTTPS origin, not a release deployment.

## Verification

Final command outputs and independent review are recorded below. Release HOLD remains until real-webcam acceptance and separate final release approval.

Independent review found no Critical/Important issue. The150ms tests model automation-driver delay, not a physically slow gesture accepted by lowering thresholds. Native timers remain real while simulated gesture time is held; this helper is intentionally limited to short controlled test gestures.

Final automated verification: npm test281/281 passed; npm run test:browser with default concurrency119/119 passed; repeated resource-release test3/3 passed (three switches per repetition; exact six resources and one connected GLOW owner). npm run build passed; LUMEN_OFFLINE_FONTS=1 npm run check:production passed on http://127.0.0.1:4173/Lumen/, zero console errors. Full logs: ignored .test-artifacts/acceptance-{unit,browser,resource,build,production}.log. Nonblocking build chunk-size/headless shader precision warnings remain. All physical-camera checks remain NOT RUN. No merge, push or deployment performed.
