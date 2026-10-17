# Smart Camera — final validation blocker

October 17, 2026. Milestone 1 only. This report supersedes the earlier integration-preparation automated HOLD finding and the earlier run counts in [implementation validation](smart-camera-validation.md). Merge and deployment remain **HOLD**. Physical-webcam acceptance remains **NOT RUN**.

## Cause and corrections

The ENERGY RUSH performance test clicked the page-wide `Keyboard / touch` locator immediately after launching the game. First-play guidance opens from a React effect, and both the background panel and tutorial have that label. The locator can resolve the background before the portal opens; its native click then waits behind the legitimate modal. During the portal/background-inert transition it can also match both controls. The saved failing complete run recorded pointer interception by the tutorial. The overlay correctly blocks background input.

This is a synchronization/target-selection defect in the test, not a Smart Camera regression. The benchmark sequence, tutorial lifecycle and pointer handling are unchanged between the integrated baseline and the approved Smart Camera commit. Each measured case creates a fresh browser context, so shared browser state is not the cause. Camera startup and segmentation warmup have already completed before this click.

`energyRushTutorial.js` now waits for the named, visible ENERGY RUSH dialog and selects its input control. The benchmark uses that helper; all original cadence, object-count and gameplay assertions remain. No test is disabled, no existing timeout is raised, and no force-click, blind retry or overlay bypass is used. A deterministic browser fixture recreates the duplicate-label transition and exercises the same helper: the old selection fails and the corrected selection passes.

The added real-app lifecycle cases also exposed lost focus on first-play Escape/BACK: the launch button unmounts on entry, so the tutorial cannot restore its original trigger. `GlowMode.jsx` now exits and restores focus to the remounted launch button on the next frame. This adds one scheduled focus callback, not an animation or inference loop. Review-only dismissal retains the existing explicit-resume behavior.

The first stability run then exposed a separate existing LAUNCH fixture defect: it spawned/teleported a free ball near a random target before sending native Space input. A free ball can legitimately score before it is grabbed. A controlled diagnostic reproduced **100 points, zero held balls, before any Space input**. The fixture now places the existing target away from the acquisition area before spawning and asserts positive geometric separation. It retains real physics/scoring, native keyboard input and every original assertion, including score exactly zero while holding. LAUNCH product code is unchanged.

## Tutorial coverage

Two actual-app cases cover normal and reduced motion: first display, initial heading focus, modal semantics, background inertness, Tab/Shift+Tab containment, Escape dismissal and restored focus, redisplay after unaccepted guidance, keyboard input selection and Enter to start, HOW TO PLAY review, frozen phase/time/score/session, explicit resume, results replay and accepted-guidance suppression on reentry. Active ENERGY RUSH time advances in 100ms steps on actual renderer frames with a held test clock; this preserves the existing >250ms interruption safety. Existing instruction/browser coverage additionally checks BACK, viewport layouts and input gates. Automated accessibility checks do not establish manual screen-reader acceptance.

## Exact validation ledger

All browser results below are headless Edge automation with synthetic camera input, not physical-webcam results. Complete suites use `npm.cmd run test:browser -- --workers=4` with configured retries unchanged (none added).

| Run | Passed | Failed | Result/detail |
|---|---:|---:|---|
| Prior integration-preparation complete suite | 200 | 1 | 4.2m; original ENERGY RUSH tutorial pointer interception |
| Fresh unchanged complete suite | 201 | 0 | 3.6m; confirms intermittency rather than erasing prior failure |
| Complete regression RED (old helper) | 201 | 3 | 3.8m; duplicate-label selection plus lost focus in both motion settings |
| Focused benchmark/tutorial attempt | 21 | 2 | 1.2m; new test's multi-second active clock jumps correctly triggered interruption safety |
| Corrected focused benchmark/tutorial suite | 23 | 0 | 1.2m; frame-stepped test clock |
| Complete stability run 1 | 203 | 1 | 3.7m; ENERGY RUSH passed; unrelated LAUNCH random-geometry fixture failed |
| Focused corrected LAUNCH fixture | 1 | 0 | 6.1s |
| Complete stability run 2 | 204 | 0 | 3.6m; final fixture |
| Complete stability run 3 | 204 | 0 | 3.6m; same source |
| Complete stability run 4 | 204 | 0 | 3.6m; same source; third consecutive clean complete suite |

| Additional final command | Exact result |
|---|---|
| `npm.cmd test` | **345 passed**, 0 failed/cancelled/skipped/todo; 839.6036ms reported duration (earlier run also 345 passed, 856.5522ms) |
| `npm.cmd run build` | Passed; 124 modules; main JS 450.48kB / 148.08kB gzip; CSS 50.61kB / 10.73kB gzip; built in 204ms; existing shared Three.js 541.60kB chunk warning retained |
| `LUMEN_OFFLINE_FONTS=1 npm.cmd run check:production` | Passed on built `/Lumen/`; 12 local assets; real segmentation/hand workers; all modes and five viewports; gameplay/results/replay/gallery/PNG; **0 console errors** |
| `node scripts/check-smart-camera-build.mjs` | Passed on built `/Lumen/`; synthetic permission/camera, **real tracking worker**; opt-in restoration, settings, stop suppression, reconnect, forget and cleanup; **2 capture attempts, peak 1 stream, final 0 streams/0 workers, 0 page errors** |
| `git diff --check` | Passed |

Raw logs and generated measurements are retained in the isolated worktree's ignored `.test-artifacts/blocker-*` files. Generated tracked measurement JSON is preserved separately and restored to its reviewed contents rather than committed as unrelated benchmark noise. Expected failure-path/model tests emit diagnostic warnings; existing shader precision/MediaPipe/duplicate-Three development warnings and the build chunk warning are not new regressions. Remote Google-font delivery was not tested.

### Synthetic camera timing and cleanup

One sample per complete run, milliseconds rounded to one decimal. These use canvas capture, mocked granted permission and a mocked tracker; they are useful lifecycle diagnostics, **not hardware latency measurements or performance guarantees**. The separate production smoke above runs the real tracking worker.

| Complete run | Navigation → video | Video → first mask | Loss → video | Recovery video → mask | Loss → first mask |
|---|---:|---:|---:|---:|---:|
| 2 | 225.6 | 10.1 | 19.3 | 7.5 | 26.8 |
| 3 | 215.5 | 9.6 | 19.3 | 6.7 | 26.0 |
| 4 | 226.4 | 10.3 | 19.1 | 7.6 | 26.7 |

Each starts with one capture attempt, peak one stream/one tracking worker. After the initial return/recovery plus 50 stop/start cycles, each reports **52 total capture attempts, peak one stream, zero active streams and zero workers**. Exact floating-point values are saved as `.test-artifacts/blocker-stability-{2,3,4}-timing.json`; all three complete suites also exercise the real-worker mounted ENERGY RUSH benchmark.

## Files in the blocker-fix commit

- `src/modes/GlowMode.jsx`: return focus after first-play dismissal.
- `tests/browser/energyRushPerformance.spec.js`: use tutorial-scoped selection.
- `tests/browser/energyRushTutorial.js`: shared visible-dialog input helper.
- `tests/browser/energyRushTutorialLifecycle.spec.js`: deterministic selection and two actual-app lifecycle/accessibility cases.
- `tests/browser/launchEasyGrab.spec.js`: deterministic separated acquisition/target fixture, retaining original assertions.
- `docs/smart-camera-final-validation.md`: this evidence and remaining gates.

No dependency, camera-controller, tracking, shader, collision, scoring or inference-rate changes. Independent read-only review found no remaining important issue in these fixes. The added LAUNCH separation assertion deliberately fails if future viewport/geometry changes invalidate its setup.

## Integration, preservation and outstanding acceptance

Local and remote `main` were rechecked with `git rev-parse`/read-only `git ls-remote`: `9975a53e7f01f9c0d9786cea65a09285c4c82287`. It is an ancestor of the feature. The tested feature source is therefore the proposed main + Smart Camera integration source; no actual merge is required to construct that candidate. Reverify remote main before any separately authorized integration.

The original checkout remains `feat/body-illumination` at that baseline. All **37** existing changed/untracked files retain their exact byte hashes and working-tree status. No original file was edited, moved, stashed, reset, staged or committed. Temporary, normalized three-way text merges of the overlapping `src/App.jsx` and `src/modes/GlowMode.jsx` completed without conflicts. This establishes current text compatibility; unfinished BODY ILLUMINATION runtime behavior is outside the tested candidate. An overlapping untracked roadmap document was previously verified identical.

The [saved plan](smart-camera-plan.md), original implementation report and pending [hardware checklist](smart-camera-webcam-acceptance.md) remain applicable. Permission persistence across real browser closure/reopening, actual preferred-device identity, two-camera switching, unplug/unavailable/busy devices, OS/browser revocation, real tracking quality/readiness, hardware resource release, mobile front/rear behavior and long-session performance remain **NOT RUN**. The concise integration checklist also remains wholly NOT RUN. Offline-font production validation does not verify remote Google-font delivery.

**Readiness: automated blocker resolved; three consecutive complete suites pass; physical acceptance NOT RUN; merge/deployment HOLD pending real-device acceptance and separate authorization.** No merge, push, deployment or Milestones 2–5 work was performed. Final commit SHA is reported with the completion response.
