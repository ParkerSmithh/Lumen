# Smart Camera — implementation and validation

October 17, 2026. Milestone 1 only. Feature branch `feat/smart-camera`, based on integrated `9975a53e7f01f9c0d9786cea65a09285c4c82287`. Final commit SHA is reported in the completion message. No merge, push or deployment authorized/performed.

## Isolation and scope

Work is in `.test-artifacts/worktrees/smart-camera`, a linked Git worktree. The original `feat/body-illumination` checkout retains all its existing edits and untracked files. No stashing, moving or resetting of that work was needed. This branch deliberately contains the integrated neon baseline, not uncommitted body-illumination changes. It will require normal integration with those shared App changes later; this milestone does not perform that integration.

The [approved roadmap](next-level-audit-proposal-2026-10-17.md) is preserved as an historical proposal; its baseline/status statements describe the audit, not the completed Smart Camera branch. [Implementation plan and ledger](smart-camera-plan.md). Milestones 2–5 have not started.

## Delivered behavior

- One App-owned video/camera controller, adapted through the existing `useWebcam` hook. Body, hand, pose, rendering and game ownership remain with their existing components/hooks.
- Remember My Camera and Auto-Reconnect are both off by default. Auto requires Remember. Saving is local and versioned: opt-in booleans, device identifier and facing preference only. Labels are transient picker text; no group identifiers, footage, images, landmarks or calibration are persisted.
- A permitted return starts the remembered camera only after positively confirming granted permission. The first render shows restoration rather than the first-time entry invitation. Prompt/denied/unsupported permission checks, missing devices and policy restrictions expose manual reconnection. There is no permission bypass or speculative prompt on unknown permission.
- The camera-settings icon next to Fullscreen opens a native modal with Change Camera, front/rear preference, Connect/Reconnect, Disconnect and Forget. The modal traps focus, restores trigger focus on close and scrolls on short screens. It reuses the reason-based suspension gate; closing does not auto-resume a round.
- Camera live, tracker initializing/searching/active and tracker failure remain distinct. Camera settings report tracker availability; the existing per-mode readiness and calibration gates still decide whether gameplay can begin.
- Device changes are serialized, successful actual device/facing selection is saved, failed selections retain the last successful saved choice, and missing devices never silently select another webcam.
- Disconnect stops capture, clears the video element and tears down tracking through existing enabled-state cleanup. It suppresses automatic recovery for the current page session until an explicit reconnect. A reload is a new page session and follows the saved opt-in again.
- One unexpected-loss recovery attempt is allowed with opt-in, visible page and granted permission. Another loss falls back to manual recovery; no retry loop. Hardware-change events refresh the picker rather than restarting capture. Revocation to denied or prompt cancels initialization and releases capture.
- Stale permission, stream and playback results cannot establish a new session. The 15-second watchdog remains; a cancelled browser request must settle before its replacement may request capture, so repeated clicks cannot stack permission prompts. A browser permission request cannot itself be cancelled by JavaScript; late streams are stopped.
- Storage corruption/denial does not break manual capture. UI changes remain usable in memory. If storage writes/removal fail, the dialog explains that previous saved choices may remain and how to clear site data. LUMEN cannot promise to erase browser storage that the browser refuses to modify.

## Test design and review findings

Deterministic controller tests use injected media, permissions, storage, clock and timers while exercising the real controller. Browser tests mount the real hook/settings against synthetic canvas MediaStreams and controlled permission/worker boundaries. They cover reload and retained storage in a newly created browser context, camera selection, absent devices, revocation, denied/prompt states, unavailable storage, intentional stop, cancelled capture and navigation, all-mode stream ownership, gallery suspension, modal keyboard behavior and 50 lifecycle cycles. A new browser context with copied storage is a simulation, not proof of permission persistence across physical browser restarts.

The test-first development cycle caught and fixed: unconfirmed device persistence during a pending switch; manual startup cancelled by enabling Remember; automatic startup after the page becomes hidden; stale repeated same-device selection rollback; a healthy camera timing out while optional device enumeration stalls; forgotten preference re-enable failing to remember a still-live device; rear preference remaining selected after actual front-camera fallback; and permission revocation back to prompt. Independent read-only review identified the visibility race and trailing-enumeration timeout and confirmed their review scope. No gameplay/detector thresholds were changed.

The camera dialog was moved into a conditionally mounted portal to avoid inherited footer hit-testing rules and hidden duplicate controls/text. This preserves existing layout and recovery tests. One existing camera-race fixture was updated to resolve the cancelled request before its replacement: the new implementation intentionally forbids two simultaneous pending camera requests. Original stale-stream stop/current-stream identity/stop cleanup assertions remain, with new assertions for request serialization.

Initial worktree unit baseline: **315 passed**, 0 failed/skipped. Original dirty checkout had 318 tests because it includes uncommitted body-illumination tests, which were not moved into this branch.

The first completed full browser run had **200 passed, 1 failed** (3.7 minutes). Failure: `launchGrab.spec.js` could not fetch `/node_modules/three/build/three.module.js`, because CLI dependencies resolved from the ancestor checkout while that older test uses a direct browser URL. An ignored local `node_modules/three` junction to the same installed dependency fixed worktree asset resolution; no LAUNCH assertion/product code was changed. Existing ignored model/vision assets were copied for local validation. Test artifacts and full command logs are retained under the worktree's `.test-artifacts` directory.

## Final validation results

| Command | Exact result |
|---|---|
| `npm.cmd test` | **345 passed, 0 failed, 0 cancelled, 0 skipped**, 855.4237 ms reported duration |
| `npm.cmd run test:browser -- --workers=4` | **201 passed, 0 failed**, 3.6 minutes, headless Edge; final complete rerun after fixing worktree dependency resolution |
| `npm.cmd run build` | Passed; 124 modules; main JS 450.37 kB / 148.05 kB gzip, main CSS 50.61 kB / 10.73 kB gzip; existing shared Three.js 541.60 kB warning retained |
| `LUMEN_OFFLINE_FONTS=1 npm.cmd run check:production` | Passed on built `/Lumen/`; 12 local assets; actual segmentation and hand workers return mask/hand results; all modes/five viewport sizes, gameplay/galleries/PNG, 0 console errors |
| `node scripts/check-smart-camera-build.mjs` | Passed on built `/Lumen/`; synthetic camera and permission boundary, **real tracking worker**; opted-in startup, settings, stop suppression across modes, reconnect, forget, cleanup; 2 capture attempts, peak 1 stream, final 0 streams/0 workers, 0 page errors |
| `npx.cmd playwright test tests/browser/smartCamera.spec.js --workers=1 --grep 'synthetic return timing'` | **1 passed**, 6.6 seconds; isolated run used for the measurements below |
| Impeccable detector on new camera settings JSX/CSS | Empty findings (`[]`); not a substitute for screen-reader/device acceptance |

Production checks used the supported offline/system-font fallback. Remote Google-font delivery was not validated. Development runs include existing MediaPipe initialization, shader precision and test-only duplicate-Three warnings; full suites pass. Expected failure-path tests deliberately exercise blocked renderers/models. No warning threshold, scoring, collision, inference frequency or rendering acceptance threshold was relaxed.

Inspected actual camera-settings captures at 1440×900, 390×844 and 844×390. Native dialog scroll keeps short landscape controls reachable. Existing layout tests also pass at 320×568, 768×1024 and other tested sizes. The wider cinematic/mobile-landscape redesign remains Milestone 2 and is not part of this change.

## Isolated synthetic camera measurements

[Raw measurement JSON](smart-camera-synthetic-timing.json). One cold-navigation sample and one unexpected-loss recovery event, followed by 50 disconnect/reconnect cycles. This is a functional/resource measurement, not a latency distribution or physical-device benchmark.

| Measurement | Result |
|---|---:|
| Navigation → playable synthetic video | 446.6 ms |
| Playable video → first synthetic valid mask | 9.1 ms |
| Unexpected loss → playable replacement video | 17.3 ms |
| Replacement video → first synthetic valid mask | 6.5 ms |
| Unexpected loss → first synthetic valid mask | 23.8 ms |
| Normal automatic-return capture attempts | 1 |
| Peak simultaneously live streams | 1 |
| Peak tracking workers in default GLOW case | 1 |
| Total attempts: initial + recovery + 50 manual cycles | 52 |
| Final live streams / tracking workers | 0 / 0 |

The prior implementation had no automatic-return path; no matched manual-start before/after speedup benchmark was performed. Browser startup, permission decisions and real neural inference can dominate physical timing, so these values establish neither a guaranteed startup budget nor a real-webcam improvement factor. The additional built-app smoke confirms actual local worker initialization and termination without substituting fake workers. Existing optional pose scheduling and its worker budget remain unchanged.

## Limits and physical acceptance

All [20 Smart Camera physical checks](smart-camera-webcam-acceptance.md) are **NOT RUN**. Existing outstanding physical acceptance remains unchanged. No actual webcam, real phone/tablet, browser-restart permission persistence, Safari/Firefox camera behavior, OS-level revocation, device-label restrictions, thermal/battery results or physical tracking-quality acceptance is claimed.

Automatic startup intentionally falls back to one manual action when camera permission cannot be positively queried. A missing preferred camera requires explicit selection; browser-default fallback is never silently substituted for it. Browser policy may reject playback even after a stream is granted; that stream is released and a manual retry is offered.

Synthetic startup timings include page/browser scheduling and synthetic capture; mock tracking does not measure neural inference latency. Resource counts are logical stream/worker ownership, not browser heap or driver VRAM. This milestone adds no GPU render work or inference cadence; no GPU speedup, real-device FPS or latency improvement is claimed.
