# Smart Camera implementation plan

**Approved October 17, 2026:** roadmap direction approved; implement and commit Smart Camera only. Milestones 2–5, merge and deployment are not authorized.

**Goal:** restore an explicitly remembered webcam on return when browser permission is known granted, with one camera owner and safe manual recovery.

**Architecture:** retain App's video and tracking hooks. Extract a framework-independent camera controller with injected browser dependencies, generation cancellation, preference validation, subscription snapshots and diagnostics. `useWebcam` adapts it to React. A small accessible camera-settings dialog supplies controls without redesigning the shell.

**Stack:** existing React/Vite/MediaPipe, node:test and Playwright; no new dependencies.

**Spec:** `next-level-audit-proposal-2026-10-17.md`, A0 and Smart Camera design; user's explicit implementation approval supersedes further planning approval gates.

## Baseline and isolation

`feat/smart-camera` linked worktree at `.test-artifacts/worktrees/smart-camera`, based on integrated `9975a53e7f01f9c0d9786cea65a09285c4c82287`. Original `feat/body-illumination` dirty checkout is untouched. No stash, reset or copying of its application edits. Baseline unit tests: 315 passed, 0 failed/skipped. Body illumination's three additional tests are uncommitted and deliberately outside this branch. Existing ignored model/vision assets copied for local validation; dependencies resolve from the original node_modules.

## Constraints and review focus

- Remember and Auto-Reconnect default off; auto requires remember. Persist only schema version, flags, device ID and facing mode; never imagery, labels or tracking data.
- Automatic requests require positive `granted` permission, visible page, opt-in and no intentional session stop. Unsupported permission query uses manual fallback. No retry loop.
- One controller/video stream; preserve inference rates, game scoring, masks and round pause/resume behavior.
- Cancellation cannot abort browser permission UI: stop late streams and ignore stale permission/enumeration/playback results.
- Switching while another request is unresolved waits for it to settle before replacement; timeout never opens a second pending browser request.
- Forget/disable auto invalidates automatic work; disconnect suppresses return/recovery for this session. Manual reconnect clears suppression.
- Selected camera unavailable must never silently fall back to another device.
- Camera live is distinct from tracker initializing/searching/tracking. Tracking failure does not automatically restart capture.

## Task 1 — preferences and controller

Files: create `src/camera/cameraPreferences.js`, `src/camera/cameraController.js`, `tests/smartCamera.test.js`.

Interface: `createCameraController({getVideo, media, permissions, storage, now, timers, visible, secure})` produces subscribe/getSnapshot, initialize/dispose, start/stop, selectCamera, setPreferences, forget and refreshDevices. Snapshots retain legacy `idle/loading/ready/error` camera status and add detail/preferences/devices/storage/diagnostics fields. Actual media/permission calls are injected only at platform boundaries.

- [x] Write deterministic tests before implementation: default manual connect, minimal persisted preference, new-controller granted restoration, denied/prompt/unsupported states, missing selected device, change/multiple/front-rear devices, opt-outs/forget, corrupt/throwing storage, manual stop, device removal and permission revocation, repeated starts/late request/switch/unmount, playback timeout, listener cleanup and bounded recovery.
- [x] Run `node --test tests/smartCamera.test.js` and confirm missing-feature failures.
- [x] Implement sanitized schema, single-owner asynchronous controller and resource/timing counters; run focused tests and full unit suite.

## Task 2 — React and settings integration

Files: replace hook internals in `src/hooks/useWebcam.js`; add `src/camera/CameraSettings.jsx`, `cameraSettings.css`; modify `src/App.jsx` only at camera integration seams.

- [x] Add Playwright settings/return-flow tests first and demonstrate absence of Camera settings control.
- [x] Hook uses one stable controller, effect initialize/dispose and `useSyncExternalStore`; initialize must tolerate StrictMode setup/cleanup/setup.
- [x] Dialog includes remembered camera/device selection, facing choice, opt-in checkboxes, explicit Connect/Reconnect/Disconnect/Forget, storage limitation and browser-permission copy. Native modal focus trap/Escape and explicit focus restore; touch-sized controls and reduced-motion support.
- [x] Preserve existing ENABLE CAMERA, Stop camera, mode and tutorial action names for regressions. Add Camera settings button; render checking-permission state without first-time invitation flash; leave tracking status authority intact.

## Task 3 — browser integration, measurement and review

Files: `tests/browser/smartCamera.spec.js`, helper mock media/permission adapter under tests only, `docs/smart-camera-validation.md` and measurement JSON.

- [x] Exercise actual hook/settings against synthetic capture streams and controlled permission/device boundaries; test reload, retained storage in new context, device selection/removal, mode navigation, intentional stop, revoked permission, disabled storage and stale initialization. No test API in production.
- [x] Measure navigation→video live and video→tracking-ready separately using synthetic worker responses; report mocked nature, attempts, live streams, workers and cleanup. Run repeated connect/disconnect cycles; do not call these physical results.
- [x] Inspect settings at desktop/portrait/landscape and keyboard focus. Run complete `npm.cmd test`, `npm.cmd run test:browser -- --workers=4`, `npm.cmd run build`, `npm.cmd run check:production` sequentially; record failures and remedies honestly. Preserve existing Three.js chunk warning.
- [x] Review whole diff for privacy, races and scope. Verify original checkout unchanged via file hashes/status; stage explicit owned files only and commit feature branch. Record SHA and stop for review.

## Physical acceptance

All physical webcam/browser checks remain **NOT RUN**: Chrome/Edge/Firefox/Safari permission persistence and restart; desktop multiple/removed/busy webcams; Android/iOS front/rear and orientation; real tracking, lighting, startup latency, thermal and long-session behavior. Existing acceptance checklists remain pending. No merge or deploy.

## Execution ledger

- Isolation created without moving/stashing user changes; Git metadata write required sandbox escalation, approved by automatic review.
- Approved roadmap copied into this branch without modifying the original proposal.
- Ruling: implement inline; user explicitly authorized execution and requested completion, so no additional plan-approval pause. Final review remains required.
- Controller and integration delivered with 30 additional unit cases and 13 browser cases; test-first regressions caught visibility, cancellation, same-device selection, actual-facing and persistence races.
- Final unit suite: 345 passed. Final browser suite: 201 passed in 3.6 minutes. Build, offline-font production validation and the added `scripts/check-smart-camera-build.mjs` built-app camera smoke pass. Isolated synthetic timing/resource report is saved separately.
- Ruling: direct dependency URLs in older LAUNCH fixtures require an ignored local Three.js junction in this linked worktree. No LAUNCH product changes or assertion relaxation; the first full run's environment failure is recorded in validation.
- Review complete: independent read-only review findings resolved with regressions; no remaining important findings. Settings captures inspected; mechanical detector reports no findings.
- Original checkout remains on `feat/body-illumination` at `9975a53` with its existing dirty status; it has not been stashed, moved, staged, reset or committed by this milestone.
- Commit includes only Smart Camera implementation/tests/scripts and the approved planning/validation documents. Keep branch/worktree for review; no merge, push, deployment or Milestones 2–5.
