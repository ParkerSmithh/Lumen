# Smart Camera — approved defaults update

October 17, 2026. User approved both camera options ON by default, with first connection manual, visible future-reconnection disclosure, explicit OFF/Forget/disconnect respected and browser permission always required. Smart Camera milestone only; no merge/push/deployment or Milestones 2–5 work. This supersedes the historical OFF-default statements in the earlier plan/reports; those reports retain their original validation evidence.

## Implemented behavior

- Unconfigured browser: Remember My Camera and Auto-Reconnect ON, but no automatic capture even when browser permission was already granted. The initial action remains ENABLE CAMERA / Connect Camera.
- A successful manual connection records `startupConfirmed:true` and the actual selected device. Only confirmed, enabled, visible-page return flows may attempt automatic startup, with positively granted browser permission. Settings edits or failed/pending playback cannot authorize first capture.
- Clear disclosure appears at initial GLOW/mode connection prompts, Camera settings, preview/assisted footer camera controls and tutorial/ENERGY RUSH camera controls. Footer controls expose the notice through `aria-describedby`; exact action names remain stable.
- Existing saved enabled/disabled v1 settings migrate without overriding their values. Legacy enabled records without the new confirmation field retain their prior return behavior. Missing/corrupt/unavailable storage uses fresh defaults with the manual-first safeguard; legacy absence of a record cannot distinguish an old erased opt-out from an unconfigured browser.
- Remember OFF and Forget clear the saved device/facing preference and persist only an anonymous OFF record. This prevents ON defaults from re-enabling those choices on return. Forget leaves a live stream running; Disconnect stops it and suppresses recovery for the current page session. No footage, labels, group IDs, tracking data or calibration are stored.
- Existing cancellation, request serialization, bounded recovery, permission revocation and single-stream/tracking ownership remain in the existing controller. No additional stream, worker, inference or animation loop.

## Validation ledger

Six new deterministic unit cases cover ON/manual-first defaults, manual confirmation and returning device, pre-capture setting edits, persistent OFF/Forget, legacy enabled records and failed-playback edits. New browser cases cover pre-capture setting edits, persistent opt-outs, and visible/accessibly described disclosure through preview/tutorial/fallback. Existing expectations were updated only where the approved defaults/storage contract changed; request serialization, stream counts, cleanup and other assertions remain.

- New controller regressions before implementation: **4 failed**, as expected.
- Initial full controller run after implementation: **30 passed, 4 failed** on the old OFF/no-record contract; expectations updated to the approved ON/anonymous-OFF contract, with device-clearing assertions.
- Final controller suite: **36 passed**, 0 failed.
- Full unit suite: **351 passed**, 0 failed/cancelled/skipped; initial 910.9863ms; final rerun **351 passed**, 870.5365ms.
- Focused camera browser suite: **15 passed** (33.9s), then **18 passed** (35.0s) after added disclosure-path coverage. Independent review identified and resolved missing alternate-path disclosure and footer accessible-description association.
- First complete browser run: **197 passed, 12 failed** (7.8m). Disclosure as a flex child enlarged the footer button and caused layout/hit-testing failures; old reconnect fixtures expected ENABLE after default remembering; an error-guidance fixture assumed automatic recovery off; timing cases reused newly persistent preferences. Corrected the notice's layout and test preconditions/labels, retaining every geometry/stream/recovery assertion. Targeted affected-suite rerun: **40 passed** (1.2m).
- Final complete browser suite: **209 passed, 0 failed** (3.7m). No retries, forced clicks, timeout inflation or assertion relaxation.
- Build: passed, 124 modules, 214ms; main JS 452.11kB / 148.46kB gzip; CSS 50.91kB / 10.79kB gzip. Existing shared Three.js 541.60kB warning retained.
- Offline-font production validation: passed; built `/Lumen/`, 12 assets, real segmentation/hand workers, all modes/five viewports, gameplay/results/replay/gallery/PNG, **0 console errors**.
- Built-camera smoke: passed; synthetic camera/permission, real tracking worker, **2 attempts, peak 1 stream, final 0 streams/0 workers, 0 page errors**. Ignored copy uses port 4178 to leave user acceptance port 4174 free; assertions unchanged.
- Updated disposable combined BODY candidate: **354 units passed** (873.9872ms), **227 browser cases passed** (3.9m), build/production/camera smoke passed; 126 modules, 205ms, JS 459.49kB / 150.75kB gzip, CSS 51.21kB / 10.83kB gzip; 0 production console/page errors, peak 1 camera stream and final 0 streams/0 workers. One App text conflict was resolved only in scratch, retaining BODY brightness and all camera disclosure packets; original files were never the patch destination. No combined failure occurred.

Synthetic final Smart-only timing: navigation→video 229.6ms; video→mocked first mask 10.6ms; loss→video 18.5ms; loss→first mask 26.1ms. After 50 stop/start cycles plus initial return/recovery: 52 attempts, peak one stream, zero live streams/workers. These are diagnostic samples, not physical-webcam latency or quality measurements.

Generated timing JSON and raw logs are retained in ignored `.test-artifacts/defaults-*` evidence; reviewed tracked benchmark JSON is restored rather than committed as unrelated output. Production validation uses the documented offline font fallback. No existing timeout, retry, assertion threshold or scoring/detector rule was relaxed.

## Review and acceptance boundaries

The user accepted capture-release observations and explicitly stopped further physical testing. Earlier user-confirmed Chrome hardware checks describe `dfd09b09f7d4d615ead4feb195cadfe75f2342bd`; **this defaults update has no new physical acceptance run**, and unverified original check-1/worker/combined-device details remain unverified. No additional hardware tests are requested.

All **37 original BODY files**, exact status/index/branch/HEAD were reverified unchanged. Local and read-only remote main remain `9975a53e7f01f9c0d9786cea65a09285c4c82287`. Updated combined source identifier: `1df4c5916588fd92ad5c7d9c6d617c687208a5e55f9645b7957daa118de654ae` (281-file SHA256 manifest, not a Git commit). It is reconstructed from the earlier BODY snapshot plus this Smart update; the App conflict and resolved diff are saved under ignored integration `defaults-evidence/`. Source manifest was verified unchanged after automation. Independent read-only review findings were resolved; no important issue remains in its reviewed scope. Final commit SHA is reported in the completion message. Merge/push/deployment remain HOLD for separate approval.
