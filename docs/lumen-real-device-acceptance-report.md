# LUMEN real-device acceptance report — HOLD

Report date: October 10, 2026 (America/Chicago).

Reviewed application commit: `b96356d61ea741bfbb80243738bf7f3ee640c74f`.
Branch: `feat/how-to-play-all-games`.

**Decision: HOLD. Physical acceptance is incomplete. No merge or deployment is authorized.**

This report records the evidence available now; it is not a completed physical test session. No real person/webcam or physical touchscreen test observations were supplied or performed in this session. Device, browser version, webcam, lighting and physical tester are therefore **not recorded**. Automated camera streams, recorded landmark fixtures, model initialization and browser touch emulation do not establish physical acceptance.

Status definitions: **PASS** requires an executed check with evidence of the expected result; **FAIL** requires an executed check with an observed mismatch; **NOT RUN** means physical execution or its evidence is missing. An unavailable capability or an event that never occurred remains NOT RUN, with its reason recorded. Automated results appear separately below.

## Existing acceptance checklist

The 18 checks and detailed procedures in [ENERGY RUSH webcam acceptance](energy-rush-webcam-acceptance.md) remain applicable. Its old branch guard and commit references are superseded for this report by the application commit and branch above. Do not switch to the older branch to test these tutorials.

All rows below are **NOT RUN because no physical-session evidence is available**.

| ID | Physical check | Status |
|---|---|---|
| P01 | Standing body calibration, reachable targets, full round and replay | NOT RUN |
| P02 | Seated calibration with partial upper-body visibility | NOT RUN |
| P03 | Limited movement range and rejection of unusable calibration | NOT RUN |
| P04 | Optional pose tracking and reach-only challenges | NOT RUN |
| P05 | Expansion-only calibration, collection and challenges | NOT RUN |
| P06 | Stationary behavior under normal, dim and changing lighting | NOT RUN |
| P07 | Slow deliberate orb entry, once-only collection and combo scoring | NOT RUN |
| P08 | Moving target reachability and changed camera framing | NOT RUN |
| P09 | Hazard warning, shield loss, combo reset and invulnerability | NOT RUN |
| P10 | Tracking loss, camera loss, tab hiding, gallery suspension and recovery | NOT RUN |
| P11 | ENERGY FEVER activation, eight active seconds, pause and rearm | NOT RUN |
| P12 | ENERGY RUSH keyboard/touch movement and hold/release controls | NOT RUN |
| P13 | Reduced motion, portrait/short screens and keyboard navigation | NOT RUN |
| P14 | CALM/WILD/MAX readability and stable physical play | NOT RUN |
| P15 | Simultaneous FEVER/SURGE/OVERDRIVE readability and bounded effects | NOT RUN |
| P16 | FREE GLOW, color preservation, CORE and ECHOES after round exit | NOT RUN |
| P17 | FLOW/SLASH/LAUNCH gestures, bests and switching back to GLOW | NOT RUN |
| P18 | BODYSHIFT physical response and mode-transition preservation | NOT RUN |

## Four-game and HOW TO PLAY acceptance

These rows expand the existing four-game checklist. Perform shared checks in **every game** and record each game's outcome separately before marking the combined row PASS. Physical touchscreen checks require a touch-capable device; mouse events or emulation alone are insufficient.

| ID | Exercise and expected result | Status |
|---|---|---|
| D01 | FLOW: trace the line with a real fingertip in either direction; progress follows the ordered path, rather than random waving | NOT RUN |
| D02 | FLOW: compare close and inaccurate traces; CLEAN starts at 85%, PERFECT at 95%; ordered paths, chain and SKIP behave as explained | NOT RUN |
| D03 | FLOW: trace using a mouse and a physical touchscreen; no keyboard movement is advertised | NOT RUN |
| D04 | SLASH: compare slow hovering with fast deliberate hand swipes; only qualifying cuts destroy intersected crystals | NOT RUN |
| D05 | SLASH: observe combos, bonus/splitting crystals, 10-hit FRACTURE STORM and final-20-second OVERLOAD | NOT RUN |
| D06 | SLASH: hold/drag with mouse and swipe with physical touch; no keyboard movement is advertised | NOT RUN |
| D07 | LAUNCH: point/push to create, approach a ball and close a fist; the candidate highlights and exactly one ball is acquired | NOT RUN |
| D08 | LAUNCH: carry while moving, then open the hand; release is intentional and lost tracking does not invent a throw | NOT RUN |
| D09 | LAUNCH: vary direction/speed, push with an open hand and hit targets; momentum, bank shots and bonus scoring behave as explained | NOT RUN |
| D10 | LAUNCH: click/tap creation, pointer hold/release, arrows/WASD, Space grab/release and C creation; C cannot erase a held ball | NOT RUN |
| D11 | All four: first PLAY displays the correct title, three steps and demo: body collect/dodge, fingertip trace/trail, swipe/fragments, highlight/grab/carry/throw | NOT RUN |
| D12 | All four: START GAME alone begins the normal start flow; GLOW body play calibrates before countdown, assisted GLOW and other games count down | NOT RUN |
| D13 | All four: BACK and Escape on first-play instructions leave the round unstarted; GLOW returns to FREE GLOW | NOT RUN |
| D14 | All four: complete a round and replay without forced instructions; HOW TO PLAY remains reachable throughout the visit | NOT RUN |
| D15 | All four: reopen during countdown and play; record timer, score and relevant shields/combo/FEVER/objects before and after 10 seconds of gestures; no progression or damage occurs; closing requires explicit RESUME | NOT RUN |
| D16 | All four: deny actual browser camera permission; instructions explain the error and supported fallback, without claiming tracking is ready | NOT RUN |
| D17 | All four: interrupt the physical camera, then reconnect; time/scoring pause, no stale-input hit/throw occurs, and recovery follows normal readiness/resume requirements | NOT RUN |
| D18 | All four: navigate with Tab/Shift+Tab, activate with keyboard, close with Escape after clicking the backdrop; focus stays contained and returns to the trigger | NOT RUN |
| D19 | All four: enable OS reduced motion; demonstrations become static while all instructions and actions remain understandable | NOT RUN |
| D20 | All four: use physical phone/tablet portrait and landscape; readable text, reachable controls, touch interaction and rotation without unintended starts | NOT RUN |

Physical acceptance totals: **0 PASS, 0 FAIL, 38 NOT RUN**. A zero FAIL count does not imply acceptance when nothing was physically executed.

## Separate automated and repository evidence

These PASS results are recorded automated/static evidence, **not physical-device results**. They were completed before this documentation-only report; no new gameplay fixes were made here.

| Check | Status | Recorded evidence |
|---|---|---|
| Unit suite | PASS | 297 tests; `.test-artifacts/final-integration-unit.log` |
| Full browser suite | PASS | 140 tests; `.test-artifacts/how-to-play-browser-verified.log` |
| Final focused integration review | PASS | 49 tests covering tutorials, camera simulations, ENERGY RUSH, BODYSHIFT, CHAOS, ECHOES and grab assistance; `.test-artifacts/final-integration-review.log` |
| Production build | PASS | `.test-artifacts/how-to-play-build-final.log`; existing Three.js chunk-size warning |
| Offline-font production check | PASS | Zero console errors; `.test-artifacts/how-to-play-production-final.log` |
| Existing feature-branch inclusion | PASS | Every local feature-branch tip and recorded remote-tracking ref is an ancestor of the reviewed application commit; `git log --all --not b96356d61ea741bfbb80243738bf7f3ee640c74f` returned no commits |

## Problems, reproduction and evidence gaps

**No physical product failures can be reported: no physical session was executed.** No unresolved important code issue was identified in the preceding integration review. Existing bundle-size and headless shader warnings are not physical acceptance results.

The release blocker is missing physical evidence for all 38 checks, including calibration, real gesture acquisition/speed, throwing, physical touch and actual camera interruption. There are no observed physical failure steps to invent.

To resolve the evidence gap:

1. Use the current feature branch and verify a clean working tree. Record the full HEAD and confirm the application files match the reviewed candidate. If HEAD contains this report as a documentation-only follow-up, record both identities; do not assume a rebuilt preview matches a previously running server.
2. Prepend the existing `.tools/node-v22.23.3-win-x64` directory to PATH if needed. Run `npm.cmd run build`, then `npm.cmd run preview -- --port 4173 --strictPort`. Stop if either fails or the port belongs to an unidentified process.
3. Open `http://127.0.0.1:4173/Lumen/` on that computer with a physical webcam and execute P01–P18 and D01–D20. Another phone cannot use this computer's loopback address; phone testing needs an available trusted local HTTPS origin. If unavailable, leave D20's phone portion NOT RUN. This does not authorize deployment or hosting changes.
4. Record browser/version, OS, viewport, webcam type, input method, lighting category and observed scalar results. Keep written observations; raw webcam captures and tracking histories are unnecessary.
5. For any FAIL, record: check ID/game; exact commit; starting state/input; numbered actions; expected versus actual behavior; score/time/shields/combo before and after; repeatability (attempts/failures). Reproduce once after suitable recalibration when relevant and retain both observations. Distinguish a fallback recovery from a passed physical gesture check.
6. Stop the preview and close/revoke the camera session; verify the webcam indicator turns off. Apply any gameplay fixes on the feature branch, rerun all four automated commands, and repeat the affected physical checks.

## Release decision

**HOLD. Do not merge into main or deploy.** A final release summary and approved deployment commit cannot be declared while physical checks are NOT RUN. The application candidate under review is `b96356d61ea741bfbb80243738bf7f3ee640c74f`; it is **not release-approved**. After the required acceptance checks pass, identify the exact fully tested commit and request the user's separate release approval.
