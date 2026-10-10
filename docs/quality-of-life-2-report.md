# LUMEN Quality of Life 2.0 — release HOLD

Implemented on `feat/quality-of-life-2`, based on clean commit
`14eca38a8f7a644bcd84c8df19bef7da0b794b6b`. No merge or deployment is authorized.

## Completed changes

**P0 reliability:** camera acquisition and playback watchdogs, safe retry and late-stream cleanup; renderer and supported-input readiness gates; explicit pause/resume on focus, visibility, camera and sustained tracking interruptions; fresh input epochs on resume. Round progress survives legitimate pauses. Hand landmarks are not required for SLASH frame-motion input or valid assisted controls.

- **LAUNCH:** bounded 350ms possession grace across brief tracking loss; reacquisition rebases movement and gesture confirmation. Sustained loss releases safely without throwing momentum. Only confirmed opening produces a camera throw. Keyboard repeats and stale movement samples cannot become fresh actions.
- **FLOW:** rotation pauses safely and explains that the unfinished trace restarts. Completed paths and score survive. A rotation during an existing pause retains its explanation; no unverified coordinate remapping is attempted.
- **SLASH:** explicit pause/resume and fresh motion baselines prevent slices across interruptions. Camera-frame motion works independently of hand detection.
- **ENERGY RUSH:** pause/resume invalidates held keys, repeated keydown and old touch pointers. Readiness publishes immediately even while simulation time is held. Calibration, reachability, stationary anti-jitter and FEVER timing protections remain intact.

**P1 usability:** compact friendly input status with a short search-message grace; clearer preparation and renderer-failure guidance; directional FLOW trace progress; four-step LAUNCH grab/throw teaching; SLASH fast-swipe guidance; bounded shield/FEVER feedback and explicit successful body-range confirmation in ENERGY RUSH. Original artwork gesture reminders and all HOW TO PLAY flows remain available.

**P2 polish and measured performance:** 44px control targets, responsive reservations for HUD/footer/tutorial controls, readable overlays and contained focus scrolling on short screens. Camera preview remains live when requested, while unused hand inference stops in assisted input and restarts on camera input. No dependencies, scoring thresholds, physics balance or difficulty settings changed. CHAOS, BODYSHIFT, ECHOES and BEYOND remain integrated.

## Verification

Verified application commit: `b35131f8131db647c917952d802659e61c64e0f7`. Logs live in `.test-artifacts`; portable measurements are in [quality-of-life-2-performance.json](quality-of-life-2-performance.json).

| Final check | Result | Evidence log |
|---|---|---|
| `npm test` | 308 passed, 0 failed, 0 skipped | `qol-final-unit.log` |
| `npm run test:browser` | 168 passed, 0 failed; 1.8 minutes | `qol-full-browser-verified.log` |
| Standalone arcade/solver/inference measurements | 3 passed, 0 failed | `qol-after-performance.log` |
| `npm run build` | Exit 0; existing chunk warning | `qol-final-build.log` |
| Production check, existing local preview, offline fonts | Exit 0; 12 assets, 0 console errors | `qol-final-production-verified.log` |

Production verification included real worker initialization, lazy LAUNCH loading, four interaction guides, five viewport sizes, full SLASH/FLOW/KINETIC round expiry and replay, saved bests, and actual FLOW/LAUNCH ECHOES artwork with 2048px PNG export. The existing preview server was reused and left running.

| Measurement | Before | After |
|---|---:|---:|
| Assisted hand-worker dispatches / 500ms | 14 | 0 |
| Active hand-worker dispatches / 500ms | 13 | 13 |
| SLASH overload CPU median / p95 | 0.10 / 0.20ms | 0.10 / 0.20ms |
| 150-ball solver CPU median / p95 | 0.10 / 0.20ms | 0.10 / 0.20ms |
| Moving-target evaluation median / p95 | 0.004 / 0.006ms | 0.005 / 0.008ms |
| Figure-eight evaluation median / p95 | 0.001 / 0.002ms | 0.001 / 0.003ms |
| 200-ball stress solver p95 | 0.20ms | 0.30ms |

The solver used 30 warmup and 600 measured updates per population at 60Hz without rendering or real tracking. Submillisecond differences are subject to timing noise; there is no claim of solver speedup. Object/particle caps remain 8/192 and gameplay retains its 150-ball configuration. The actual optimization removes unused dispatches while retaining the requested live camera. Final main bundle is approximately 431.03kB (141.69kB gzip); shared Three.js is 541.60kB (134.40kB gzip).

The review identified stale repeat/touch actions and incomplete FLOW renderer readiness; both received fixes and focused regressions. The first full suite exposed two real guidance regressions, which were repaired. Existing status assertions now target the named original Artwork guidance region. The existing rotation test asserts frozen time and explicitly resumes, matching the approved behavior.

## Limitations and release acceptance

All **38 outstanding physical acceptance checks remain NOT RUN** in [the real-device acceptance report](lumen-real-device-acceptance-report.md). Synthetic streams, recorded landmarks, browser touch emulation and automated worker initialization do not substitute for people using webcams or touchscreens.

Run the existing 38 checks on recorded devices/browsers/lighting conditions, plus focused physical retests for brief and sustained LAUNCH loss, confirmed opening after reacquisition, held-key/touch resume, SLASH frame-motion readiness, and FLOW rotation during active play and an existing pause. Record observations and evidence before changing acceptance status.

The existing shared Three.js chunk exceeds Vite's 500kB warning threshold. LAUNCH and GridScan already load lazily. Further chunk splitting may improve caching and request scheduling but does not establish a reduction in total bytes; defer it until measured on target devices. The warning threshold was not increased. No real-device FPS, thermal, battery or model-latency improvement is claimed.

Release remains **HOLD** pending physical acceptance and separate explicit approval to merge or deploy to GitHub Pages.
