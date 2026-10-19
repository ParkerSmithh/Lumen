# Experience launcher upgrade

Feature branch: `feat/experience-launcher`, isolated under `.tools/experience-launcher`.
Baseline: `d0be2425761443a4e37985cb78091808e1ad6e75`, verified remote main on October 18, 2026. Its [Pages deployment workflow](https://github.com/ParkerSmithh/Lumen/actions/runs/39165699536) completed successfully, and the public `/Lumen/` page returned HTTP 200. This baseline includes submission polish, Smart Camera, and BODY ILLUMINATION.

## Design and implementation

Visitors browse five equal-weight neon experience cards before any artwork mounts. GLOW is creative body illumination; ENERGY RUSH is its body/keyboard/touch game. FLOW includes LIGHT TRACE, SLASH keeps its existing mode, and KINETIC belongs to LAUNCH. ECHOES is a session gallery, BEYOND is progression within existing experiences, and CONVERGENCE retains its completion gate.

The existing dark neon identity carries into the launcher through distinct violet, mint, blue, coral, and amber accents, geometric CSS previews, readable descriptions, and direct actions. Desktop exposes five cards together; narrower screens use three, two, or one column within an independently scrollable surface. The top artwork navigation stays available. Setup names the selected experience and explains local camera use before an explicit connection action.

The pending choice stays separate from the active artwork until setup completes. Browsing uses the existing reason-based suspension gate, retaining the previous paused round for cancellation. Tracking hooks are disabled while browsing; the first visit mounts no mode renderer. Returning visitors always see selection, even when an approved remembered camera reconnects.

Smart Camera's controller, hook, preferences, and settings retain their existing implementation. Setup stages device/facing selection locally and delegates connection to `start` or `selectCamera`; no second stream owner is introduced. Canceling a pending connection delegates cleanup to `stop`. Camera-free entry explicitly disconnects capture and retains the controller's intentional-disconnect behavior. Remember/auto-reconnect controls use existing preference APIs. Missing labels and unavailable saved devices remain understandable without extra capture requests. Successful capture opens the selected experience, whose existing readiness and instructions handle tracking/calibration.

Top tabs use a CSS light sweep/underline for hover and a separate 340 ms activation pulse. Keyboard activation uses the same buttons and handlers. Reduced motion removes animation. No dependencies, tracking algorithms, scoring, physics, renderers, or production base-path configuration change.

## Checkpoints

1. Selection: five experience cards, gallery discovery, no implicit first capture or artwork launch.
2. Setup: explicit connection, staged devices, existing preferences, cancellation and alternate input.
3. Navigation: existing mode transition handlers, distinct CSS feedback, active state and return to browsing.
4. Validation: new launcher browser cases, existing gameplay suite explicitly enters its starting artwork, production path and synthetic camera smoke.

## Verification record

| Check | Final result |
| --- | --- |
| Full unit suite | 355 passed; exit 0 |
| Full browser suite, headless Edge, 4 workers | 256 passed; 5.2 minutes; exit 0 |
| Production build | Passed; existing large Three.js chunk warning remains |
| Production `/Lumen/` check | Passed; 12 assets, real segmentation/hand worker initialization, all modes at five viewport sizes, gameplay/results/replay, gallery and PNG export, zero console errors |
| Built Smart Camera smoke | Passed; 2 synthetic capture attempts, peak 1 stream, final 0 streams and 0 workers, zero page errors |
| Launcher responsiveness | Automated desktop, tablet, 390/320 portrait and 667/844 landscape cases passed; final desktop/portrait/landscape screenshots and header hit tests passed |
| Accessibility and input | Keyboard, Escape, emulated touch selection, focus return, reduced motion and hover/activation cleanup cases passed |
| Independent code review | Findings reproduced and fixed; final read-only review has no remaining important findings |
| Design detector and diff whitespace check | No detector findings; diff check passed |

Raw logs and screenshots are in the original checkout's ignored `.tools/launcher-evidence` directory. Key logs: `final-unit.log`, `final-browser-verified.log`, `final-build.log`, `final-production-verified.log`, and `final-camera-smoke.log`.

Earlier validation found setup input retention, pending-capture cancellation, restored-camera fallback, premature ENERGY RUSH tutorial mounting, setup scroll retention, and a redundant stage fade affecting stacking. These are resolved and covered by the final passing suites. Existing gameplay tests now explicitly enter their starting artwork through the public launcher. Production drag automation delivers actual pointer samples at render cadence so software GPU scheduling does not cause coalesced or implausibly fast gestures; the hit assertion remains intact. The production checker also explicitly enters the launcher in its separate gameplay page. No gameplay assertion was removed to obtain a passing result.

Benchmark suites write measurement files. Tracked baseline measurement documents were restored without changing the original checkout; timing summaries printed by the suites remain in ignored run logs.

All 37 original changed/added paths in the original checkout retain their original byte hashes, index entries and working-tree statuses. That checkout remains `feat/body-illumination` at `9975a53`. Feature changes were kept in the isolated branch until release approval; camera controller/hook/preferences/settings, mode implementations, renderer files, scoring/physics, dependency lockfile, and `/Lumen/` configuration have no feature diff.

Tests simulate camera streams and permission/device boundaries; they do not establish physical webcam appearance, physical touch behavior, manual screen-reader acceptance, or Safari/Firefox behavior. Remote writes were withheld during validation pending separate release approval.

## FLOW-first navigation follow-up

Top tabs now follow FLOW, GLOW, SLASH, KINETIC. Launcher cards follow FLOW, GLOW, ENERGY RUSH, SLASH, KINETIC. ENERGY RUSH remains a discovery card delegating to the existing GLOW game, with no duplicated implementation. The legacy picker also places FLOW first and assigns its existing START HERE recommendation to FLOW. Navigation numbers and concept labels follow the new order; existing game identifiers and mode logic retain their names and behavior.

Desktop and mobile tests assert exact tab/card order, normal keyboard traversal, no initially selected tab, and no mounted first-visit artwork. Hover and activation checks exercise every top tab. The existing keyboard integration check now moves backward from its explicitly selected GLOW artwork to FLOW.

Follow-up verification: 355 unit tests passed; 37 targeted launcher/integration/presentation browser tests passed; production build and complete `/Lumen/` production checks passed; diff whitespace check passed. The 256-test full-suite result above belongs to the launcher validation before this ordering-only follow-up. No camera or gameplay source changed in this follow-up. The local preview at `http://127.0.0.1:5188/Lumen/` serves the rebuilt FLOW-first candidate.

## Whole-card selection follow-up

Every game card now extends its existing native selection button across the complete card, including artwork, title, description and padding. This keeps one action and keyboard tab stop per card. The normal button press filter is disabled for these buttons so it cannot shrink the extended hit area while pressed; the existing card press and focus treatments remain in use. Selection continues to open the existing setup flow without starting camera capture.

Mouse and emulated-touch regression cases exercise all four card areas for all five experiences, alongside the existing launcher and presentation browser checks. Run evidence is in `whole-card-browser-verified.log`, `whole-card-unit.log`, and `whole-card-build.log` in the ignored evidence directory. Only launcher CSS, tests and this report changed for this follow-up.

The startup card and setup heading use FLOW; LIGHT TRACE remains the existing game name within that mode. No gameplay identifier or implementation was renamed.

The top tab's visible and accessible label is now KINETIC. A presentation-only label maps the existing LAUNCH mode to that name, preserving its transition handler, tracking, physics and game state. Browser and production-check selectors use the displayed label while retaining internal LAUNCH identifiers for gameplay fixtures. Follow-up evidence is in `kinetic-tab-browser-verified.log`, `kinetic-tab-unit.log`, `kinetic-tab-build.log` and `kinetic-tab-production.log`.

## ENERGY RUSH navigation tab

The top navigation now follows FLOW, GLOW, ENERGY RUSH, SLASH, KINETIC. ENERGY RUSH has a distinct selected state and the same hover/activation feedback as the other tabs. It delegates to the existing GLOW-hosted game without duplicating a mode, stream or tracking controller. For first-time visitors it opens ENERGY RUSH setup; from an entered experience it uses the existing mode transition and game instructions. Exiting the game returns the active tab to GLOW.

The five-tab layout keeps 44px touch targets and fits compact portrait screens. At short portrait sizes it reserves space for the existing Core indicator. Automated tests cover direct tab entry, camera-off behavior, GLOW/ENERGY RUSH selection separation, keyboard order, hover feedback and tab hit testing at six viewport sizes. Final desktop, 390px/320px portrait and short-landscape screenshots/hit checks also passed.

Validation: 355 unit tests, 41 targeted browser tests, production build and complete `/Lumen/` checks passed. Logs are `energy-nav-unit.log`, `energy-nav-browser-verified.log`, `energy-nav-build.log` and `energy-nav-production-verified.log`. An initial 320px Core/tab collision was fixed before the final passing run. No gameplay or camera implementation source changed.

## Reload behavior and published-version diagnosis

The reported once-only selection screen was observed on the published GitHub Pages site. Public release verification on October 18, 2026 showed the successful deployed commit was still `d0be242`, before this isolated launcher upgrade. None of these launcher changes had been merged, pushed or deployed.

The candidate already initializes to the experience browser on every fresh page load; it does not persist a flag to skip selection. Two new browser regressions verify reload after entering each of the five experiences, and reload after entering KINETIC with an approved remembered camera. Both pass: cards return, no artwork mounts, no tab starts selected, and an approved camera reconnect does not start tracking or bypass selection. No startup-policy change was needed.

The user explicitly approved committing, pushing, merging and deploying the accumulated launcher changes on October 18, 2026. Reload evidence is in `reload-selection-browser.log`; the final candidate validation uses `release-candidate-*.log`.

The accumulated candidate passed a fresh complete run: **355 unit tests and 263 browser tests**, with zero failures. The existing production build and full `/Lumen/` check passed on this runtime source. A fresh built-camera smoke check passed with two synthetic capture attempts, peak one stream, final zero streams/workers, and zero page errors. The original 37-file preservation check again found zero byte/index/status changes; tracked benchmark documents were restored after the suite. Those checks completed before release approval. Physical-webcam acceptance remains outside this automated validation.

## Authorized release

The release uses the existing GitHub Pages workflow on main. The feature commit is merged into the latest fetched main and the merged source is revalidated before push. The final deployed commit, workflow result and public-asset verification are recorded in Git history, GitHub Actions and the release response. The original BODY ILLUMINATION checkout remains protected.
