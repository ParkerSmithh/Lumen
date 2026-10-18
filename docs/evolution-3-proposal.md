# LUMEN: EVOLUTION — Features + Quality of Life 3.0

Planning proposal, October 16, 2026. **Awaiting approval. Release HOLD.**

## Verified starting point

- Branch: `feat/quality-of-life-2`.
- HEAD: `2a9c6d8e564c1c18c20f257e6eb817665c5d99bf`.
- Working tree was clean before this proposal. No application changes, branch creation, commits, merge, or deployment performed.
- No `AGENTS.md` was found in the repository file inventory. Existing `.agents/skills` instructions were consulted for planning.
- Historical QoL 2 evidence: **308 unit tests, 168 browser tests, 3 standalone performance checks passed**. These are recorded results in `docs/quality-of-life-2-report.md`, not new executions against this planning session.
- Physical acceptance remains **0 PASS, 0 FAIL, 38 NOT RUN**. No webcam or physical touch testing occurred.

## Recommendation and alternatives

Build a small shared progression foundation, permanent missions across four games, a quiet MY JOURNEY archive, better results, and two variations: **LAUNCH TARGET PRACTICE** and **FLOW PRECISION**. Follow with persistent visual preferences and restrained celebrations. Reliability and data safety come first; physical feel changes must be evidence-driven.

Three approaches considered:

1. **Recommended: staged shared foundation.** A small pure event reducer and independent local store integrate with the existing engines. More initial lifecycle work, but consistent progress across all games and less repeated logic.
2. **Per-game feature patches.** Faster first mission, but three lifecycle implementations would independently handle persistence, duplicates, reset, and results. This increases divergence and replay bugs.
3. **Daily-first live-service style.** Gives a changing invitation to return, but date handling and reward rules add complexity before the basic experience is proven. Defer daily rotation and avoid streak pressure.

Keep FREE GLOW, BODYSHIFT, CHAOS, ECHOES, BEYOND, physics, standard scoring, FLOW CLEAN 85% / PERFECT 95%, SLASH speed thresholds, and ENERGY RUSH reachability/anti-jitter protections intact. Add no accounts, network dependencies, or sound in this update.

## Repository architecture and integration points

| System | Existing owner | Planning implication |
|---|---|---|
| FLOW / LAUNCH lifecycle | `src/game/useRound.js`, `roundClock.js`, `roundAward.js` | Use accepted hit callbacks and guarded result transitions; preserve readiness and input epochs. |
| SLASH lifecycle / scoring | `src/modes/SlashMode.jsx`, `slashGame.js`, `slashArcade.js` | Separate lifecycle adapter is required; keep `SLASH_CHAOS` and legacy bests distinct. |
| ENERGY RUSH | `src/game/useEnergyRush.js`, `energyRush.js`, `energyEvents.js` | Consume engine decisions, drain events once, preserve body/assisted identity and early shield-ending results. |
| Best scores | `src/game/personalBests.js` | Existing validated, memory-backed namespaces remain authoritative. New variations must never call the standard best recorder. |
| ECHOES | `src/echoes/echoRuntime.js`, `echoStore.js` | Current gallery is bounded, in-memory and geometry-dependent; ENERGY events are sampled. Do not use gallery observations as a complete progress stream or add persistence to ECHOES incidentally. |
| Camera / input | `src/App.jsx`, `hooks/useWebcam.js`, `useHandTracking.js`, `useBodyTracking.js`, `tracking/*` | Preserve one camera owner and existing inference gating. No additional tracking loops. |
| LAUNCH possession / hits | `effects/Ballpit.jsx`, `grabController.js`, `tracking/grabDetector.js`, `game/launchArcade.js` | Add scalar notifications at accepted acquisition, intentional release, and target award. Distinguish release from a target-hit success. |
| Pause / menus | `echoes/echoGate.js`, `useGameInstructions.jsx`, each lifecycle | Reuse named suspension reasons; new panels require explicit resume after closing. Do not replace the gate with a second pause system. |
| UI / accessibility | `App.jsx`, `game/GameHUD.jsx`, `SlashHUD.jsx`, `EnergyRushHUD.jsx`, `GameFeedback.jsx`, `qol.css` | Extend current cinematic surfaces and focus behavior. Existing six colors live in `colors.js`; no persistent global settings store exists here. |
| Automation / production | `tests/*.test.js`, `tests/browser/*`, `playwright.config.js`, `scripts/check-pages-build.mjs` | Extend deterministic clocks and input fixtures; retain production `/Lumen/` checks and lazy LAUNCH assertions. |

Proposed modules: `src/journey/journeyEvents.js` for validated event reduction; `journeyStore.js` for persistence; `missions.js` for fixed definitions; `JourneyProvider.jsx` for subscriptions; `JourneyPanel.jsx` and `MissionPanel.jsx` for UI. Separate `src/preferences/*` and `src/feedback/*` own preferences and optional presentation. Engine adapters stay beside their existing lifecycle owners. Extract only the boundaries needed for this work, without rewriting the large renderers.

## P0 — Core improvements

### P0.1 Authoritative events and safe lifecycle integration — high complexity

**Adds / player value:** trustworthy objectives, round statistics, and replay behavior. A player should never earn phantom progress or lose time by opening a menu.

**Integration:** one application-owned journey service; three adapters for shared rounds, SLASH, and ENERGY RUSH. Events contain a generated session identifier, monotonic sequence, mode/ruleset, variation, input category, event kind, active elapsed time, and validated scalar payload. No geometry, frames, landmarks, or movement histories. Call it only after the engine accepts a decision. Emit an immutable final summary once; repeated results renders cannot increment totals.

Per-session duplicate protection rejects sequence numbers at or below the accepted high-water mark; adapters issue sequences synchronously. Scope object IDs by generation/session, including reused LAUNCH slots. Stale sessions, unsupported kinds, malformed numbers, countdown/paused actions, and post-finish events are rejected. Reset invalidates the active journey epoch. Optional observers cannot interrupt gameplay if they fail.

Earned action progress survives an abandoned round; abandoned rounds do not count as completed, survival, or best-score achievements. A shield-ending ENERGY RUSH round counts as completed but not survived. Returning from a menu clears stale inputs and requires explicit RESUME. Opening one panel cannot release another panel's suspension reason.

**Risks:** double accounting around result transitions, dropped last-frame ENERGY events, React remounts, duplicate LAUNCH target events. Existing LAUNCH hit acceptance and arcade deduplication must be verified together before notifications are added.

**Automated:** new `tests/journeyEvents.test.js`, `tests/browser/evolutionLifecycle.spec.js`; duplicate/out-of-order/stale events, finish twice, abort, replay, reset while paused, frame-boundary completion, gallery/tutorial/panel nesting, no actions behind menus. Retain `roundAward`, `qolResume`, `qolCycles`, and camera recovery tests.

**Physical:** P10, P17, D14–D17 plus E01 below. No unverified reliability defect is claimed: P0 begins with targeted reproduction and baseline checks, not speculative changes to controls.

### P0.2 Versioned local data and precise reset — medium complexity

**Adds / player value:** returning progress that is private, resilient, and understandable.

**Integration:** independent `lumen.journey.v1` and `lumen.preferences.v1` keys. Schema version, whitelisted rulesets, nonnegative safe counters, accuracy in 0–100 only when samples exist, capped mission IDs and compact aggregates. Discard unknown fields; reject unsupported versions without overwriting their data. Corrupt/unavailable storage falls back to a bounded in-memory session with a quiet “Progress is saved for this visit” notice. Persist only on accepted state changes, coalesced outside rendering, flushing pending changes on safe lifecycle boundaries; never write every frame. State remains usable when quota is exhausted.

RESET PROGRESS confirmation explicitly clears journey totals, mission progress and titles, invalidates pre-reset session rewards, and leaves personal bests, ECHOES, and preferences intact. Explain these boundaries before confirmation. Show existing bests as existing records, not invented historical rounds. Settings have a separate restore-defaults action. Optional journey tracking defaults on with an obvious off control; off stops new progress and persistence without changing play. Re-enabling starts a fresh journey session boundary.

For two tabs, use an exclusive journey writer lease via Web Locks when available; a secondary tab remains playable with journey recording disabled and explained. Where coordination is unavailable, use visit-only progress rather than silently overwrite another tab. Do not attempt additive merging of snapshots, which would duplicate awards.

**Risks:** destructive broad localStorage clearing, counterfeit imported counters, stale writes after reset, silent cross-tab losses.

**Automated:** `tests/journeyStore.test.js`, `tests/browser/evolutionStorage.spec.js`; malformed JSON, arrays/null, negatives, fractions, Infinity, oversized input, future versions, throwing storage, quota failure, reload, canceled/confirmed reset, pending-write cancellation, two-tab ownership and best/ECHOES preservation.

**Physical:** E02, E03; confirm privacy and reset copy is understandable on small screens and assistive technology.

### P0.3 Focused gameplay usability and readiness audit — medium complexity

**Adds / player value:** clearer preparation, intentional actions and recovery with fewer unnecessary decisions.

**Integration:** retain first-visit HOW TO PLAY, readiness gates, calibration and three-second countdown. Make supported fallback choice available within the existing preparation flow; show preparation/failure status. Replay uses the current input and variation without forcing tutorials again. Tracking status distinguishes camera-ready/no hand from hand present/not drawing where existing signals support that distinction. Never infer body visibility or gesture confidence from unavailable data. Use delayed loss warnings and stable restoration; keep SLASH frame-motion readiness independent of landmarks.

LAUNCH retains 350ms possession grace, zero-momentum safety release and confirmed opening; measure acquisition/release before changing filter constants. FLOW preserves observed trace segments only, breaks continuity on loss, and retains unfinished-path restart on rotation. SLASH hints explain qualifying swipes and special crystals without changing thresholds. ENERGY RUSH keeps red hazard identity and comfortable seated/standing range guidance; no new mission requires optional pose capability.

**Risks:** eager starts, status flicker, synthetic traces/throws, input carryover, misleading full-body advice during seated ENERGY RUSH.

**Automated:** extend `qolReliability`, `qolLaunchPipeline`, `qolUsability`, `flowWebcamCompletion`, `slashMotionFallback`, `energyRushTracking`; retain unit suites for grab, stroke interruptions, slash thresholds, calibration, anti-jitter and inference dispatch. Add camera-ready/gesture-unrecognized distinctions only where supported.

**Physical:** existing P01–P12, D01–D10, D16–D17; E04 and E05. Gesture tuning remains conditional on measured evidence.

## P1 — High-value new features

### P1.1 Permanent LUMEN MISSIONS — medium complexity after P0

**Adds / enjoyment:** purposeful short goals across four games, without daily expiry or grind.

Initial catalog (12 fixed, versioned definitions):

| Game | Missions | Source |
|---|---|---|
| ENERGY RUSH | Collect 12 orbs across play; activate FEVER once; survive a timed round with at least one shield | Accepted orb/milestone decisions and final engine end reason |
| FLOW | Complete 3 consecutive paths in one round; earn CLEAN-or-better on 3 paths across play; complete one PERFECT trace | Accepted completion accuracy and chain; SKIP resets consecutive progress |
| SLASH | Slice 20 crystals across play; reach combo 6 in one round; cut one bonus or splitting crystal | Deduplicated scored crystal decisions and authoritative combo |
| LAUNCH | Hit 5 targets across play; complete one bank shot; hit a target with a ball intentionally released after acquisition | Accepted target awards, bank classification, acquisition/release lineage |

**Integration:** optional compact MISSIONS panel, available before play and through MY JOURNEY. Player can pin one objective; one small text/progress line appears during play. No automatic expanded panel. Completed missions award archive marks and cosmetic title progress once. All are possible through each game's supported fallback. Variation-only sessions do not satisfy the standard mission catalog; practice offers feedback without accelerated unlock farming.

**Risks:** confusing round versus lifetime scope, counting an ungrabbed collision as a throw, noisy or duplicate inputs, inaccessible requirements.

**Automated:** `tests/missions.test.js`, `tests/browser/evolutionMissions.spec.js`; exact boundaries, 84.99/85/94.99/95 accuracy, duplicate crystal/target events, pause/skip/replay, reload mid-objective, 12 once-only awards, camera and fallback fixtures, unsupported optional pose absent.

**Physical:** E06: complete representative missions through real camera and each supported physical fallback; verify progress line does not obstruct targets or trace paths.

### P1.2 MY JOURNEY archive — medium complexity

**Adds / enjoyment:** a quiet record of mastery rather than a conventional statistics dashboard.

**Integration:** a luminous archive with four mode marks and focused details: total completed rounds, per-ruleset bests, FLOW weighted completed-path average and best single-path accuracy, highest SLASH/ENERGY combo, intentional LAUNCH releases and target hits as separate counts, ENERGY timed survival and no-shield-loss survival, completed missions. No “throw accuracy” or successful-throw percentage without an authoritative attempt-ending definition. New lifetime counters begin with this update; existing bests are displayed without backfilling nonexistent history.

Cosmetic titles derive from distinct missions: SPARK on the first, IGNITION at 3, RADIANCE at 6, ASCENDANT at 9, LUMINARY at all 12. They grant no gameplay advantage, never require repeat grinding, and remain optional. Check physical mission difficulty before fixing these as final thresholds.

One JOURNEY entry houses archive, missions, and settings, avoiding three new persistent gameplay buttons. Reuse the named suspension gate and accessible modal focus containment, Escape, backdrop and focus-return patterns. Short screens scroll inside the archive.

**Risks:** overstated historical totals, mixing rulesets/input bests, interrupted sessions presented as completed, trapped or lost focus.

**Automated:** `tests/journeyStats.test.js`, `tests/browser/evolutionJourney.spec.js`; weighted aggregates, null empty accuracy, input/ruleset separation, aborted/early-loss rounds, unlock boundaries, reload, keyboard/screen-reader semantics and focus restoration.

**Physical:** E02, E03, E07; screen reader, keyboard and phone archive review.

### P1.3 LAUNCH TARGET PRACTICE — high complexity

**Adds / enjoyment:** unhurried acquisition, carrying and intentional release practice.

**Integration:** select STANDARD or TARGET PRACTICE before starting; variation locks until exit. Reuse Ballpit, grab controller, targets and readiness pipeline. Add an explicit untimed practice lifecycle option to `roundClock`/`useRound`, with active elapsed time and bounded target progression; do not fake an enormous duration or allow unbounded difficulty. Keep existing standard duration and physics unchanged. END PRACTICE produces a practice summary and REPLAY. No standard best writes, standard mission awards, or completed-standard-round increments.

Feedback shows candidate → acquired → intentional release → target hit, with bank feedback when authoritative. Optional text guidance explains direction/speed; no predicted guaranteed trajectory, auto-aim or hit guarantee. Count valid releases separately from target hits, including hits caused by ordinary nonthrow collisions. All camera, mouse, touch and keyboard controls remain supported.

**Risks:** time-based target rules accidentally growing forever, resource accumulation, practice best leakage, loss-triggered throws.

**Automated:** `tests/practiceClock.test.js`, `tests/browser/evolutionPractice.spec.js`; untimed active elapsed/pause, explicit finish, no standard best writes, standard round unchanged, slot generation reuse, acquisition/release interruption, all input fixtures, repeated practice exit/reentry and resource bounds.

**Physical:** E04 and E08; real fist/opening, mouse/keyboard and touchscreen practice, short/sustained loss, explicit exit.

### P1.4 FLOW PRECISION — medium complexity

**Adds / enjoyment:** focused accuracy practice with clearer feedback about drifting from the guide.

**Integration:** reuse evaluator, path order, chain and standard scoring thresholds. Show an accessible “ON GUIDE / RETURN TO GUIDE” hint from observed evaluator distance and the existing tolerance, plus honest completed-path error/accuracy information. Do not feed predicted display points into the evaluator or bridge missing samples. Standard visual path remains unchanged; precision feedback is opt-in and its recorded bests use a new explicit variation namespace, even with unchanged score arithmetic. Initially exclude variation sessions from standard missions and progression, as with TARGET PRACTICE.

**Risks:** distracting per-frame status announcements, confusing prediction with accuracy, feedback obscuring the trace.

**Automated:** `tests/precisionFeedback.test.js`, `tests/browser/evolutionPrecision.spec.js`; distance boundaries, same source samples produce same score, 85/95 thresholds, no sample on loss, resume/rotation, separate bests and throttled announcements. Existing FLOW fixtures remain unchanged.

**Physical:** E05 and E09; actual fingertip, mouse and physical touch responsiveness and error readability.

### P1.5 Results that explain the round — medium complexity

**Adds / enjoyment:** clear achievement, honest comparison, and a quick next round.

**Integration:** shared result-summary presentation used by all three HUD owners. Show score and pre-round best comparison in the correct ruleset/input bucket, highest combo or chain where recorded, actual FLOW accuracy, LAUNCH target hits/banks/intentional releases, ENERGY collections/shields/survival reason, missions earned this round and newly unlocked title. Capture the previous best before recording the result. Zero/no-sample values stay honest. Add MODE SELECTION focus navigation and preserve one-action replay. Practice ends with a clearly labeled noncompetitive summary.

**Risks:** comparing a score to the newly updated best, invented hit ratios, repeated unlocks when rerendering, cumbersome replay.

**Automated:** `tests/resultSummary.test.js`, `tests/browser/evolutionResults.spec.js`; first result, tie/new best, no hits, early ENERGY loss, previous-best delta, exactly-once unlocks, replay/mode actions, variation separation and short-screen layouts.

**Physical:** E07; results and replay through keyboard, touchscreen and screen reader.

## P2 — Premium polish

### P2.1 Personalization and responsive UI — medium complexity

**Adds / enjoyment:** remembered emission color, comfortable effects and optional guidance.

**Integration:** settings inside JOURNEY; persist the existing six-color choice, effects NORMAL/REDUCED, tips visibility and journey tracking preference. Effective reduced effects is system reduced motion OR the user's reduce-effects setting; never override the system preference. Apply to JavaScript renderers as well as CSS, including live preference changes, with no altered scoring, reachability or intentional gameplay mechanics. CHAOS remains separate and controls its existing systems. Essential hazards, readiness, pause and error guidance cannot be hidden. Keep purple as the existing default.

Use existing dark typography, palette and soft borders. Primary controls stay at least 44px; support safe-area insets, portrait/landscape, text zoom, contained scrolling and compact pinned missions. No full-screen archive opens automatically after a round.

**Risks:** changing material visibility, red emission hiding red hazards, CSS-only reduced effects, guidance setting hiding essential instructions.

**Automated:** `tests/preferences.test.js`, `tests/browser/evolutionSettings.spec.js`; whitelist validation, persistence/defaults, storage failure, OS motion live changes, settings across all modes, no gameplay balance changes, six-color hazard contrast, 200% text zoom and existing viewport/layout fixtures.

**Physical:** E03 and E10; OS reduced motion, zoom, notched phones, real rotation/fullscreen and red-emission hazard readability.

### P2.2 Bounded celebrations — medium complexity

**Adds / enjoyment:** a restrained acknowledgement of meaningful success.

**Integration:** reuse existing local feedback for calibration, grabs, throws, FEVER, CLEAN/PERFECT, and combos. A shared arbiter adds one text/glow celebration at a time for mission/title/new-best events, merging same-action awards. At most one queued message, 1.2 active seconds displayed and 3 active seconds between presentations. Results collect remaining achievements instead of replaying a backlog. Clear stale messages on exit/reset; freeze visibility/duration while paused. Reduced effects uses static text only. No screen shake, new audio, full-screen flashes or extra particle systems.

**Risks:** duplicate live regions, old events replaying after menus, masking targets, costly rerenders during bursts.

**Automated:** `tests/celebrations.test.js`, `tests/browser/evolutionFeedback.spec.js`; bursts, priorities, queue bounds, active-time pause, reset/exit, live-region deduplication and reduced-motion static behavior.

**Physical:** E11; dense FEVER/STORM/SURGE play, legibility and distraction review.

### P2.3 Measured performance and cleanup — medium complexity; optimizations conditional

**Adds / enjoyment:** retains responsiveness through repeated rounds and menus.

**Integration:** measure the baseline and final candidate using existing arcade, solver, inference and resource fixtures; add journey-enabled comparisons and 20 replay/menu/variation cycles. Record frame interval median/p95, tracking dispatch/latency, solver CPU, renderer geometry/texture counts, owned canvases/workers/listeners and persistence writes. Sample bounded JS heap where supported, clearly identifying GC limitations. Compare paused activity, not only visible FPS. No new progression RAF or worker.

Historical baseline: assisted hand dispatches **0 per 500ms**, active **13**, 150-ball solver p95 **0.20ms**, main bundle about **431.03kB / 141.69kB gzip**, Three.js **541.60kB / 134.40kB gzip**. Re-measure on the current environment rather than assuming identical timings. Respect the actual 12-object storm cap; do not derive caps from an older overload benchmark alone.

Investigate repeatable >10% frame/solver p95 regressions with matched runs; require zero assisted hand dispatches, bounded allocations after warmup and zero progress writes while paused/idle. Report noisy timings honestly. Lazy-load archive UI if size measurements justify it; LAUNCH and GridScan are already lazy. Preserve warning thresholds and renderer architecture.

**Risks:** noisy headless comparisons, counting cached resources as leaks, excessive instrumentation, duplicate listeners after remounts.

**Automated:** extend `qolInference`, `qolCycles`, `gamePerformance`, `launchSolverPerformance`, `energyRushPerformance`, `echoPerformance`; new `tests/browser/evolutionPerformance.spec.js` covers 20 cycles, steady resource counts and bounded persistence activity. Production check must still verify lazy LAUNCH and clean console.

**Physical:** E12; sustained camera/touch sessions on recorded desktop and phone hardware, including thermal/frame observations. Automated CPU timing cannot establish physical FPS or battery improvements.

## Deferred deliberately

- Daily/rotating rewards: permanent missions first. A future daily design needs pinned local-date identity, rollback/timezone travel policy and once-only awards before implementation.
- ZEN ENERGY: changes hazards, failure, timing and survival semantics. TARGET PRACTICE gives a lower-risk relaxed entry point first.
- COMBO CHALLENGE: current combo/STORM/OVERLOAD already supply depth; improve combo readability before adding another ruleset.
- Consecutive successful throws / throw hit-rate: defer until each throw can be assigned one authoritative success/miss outcome across multiple balls and repeated contacts.
- Optional-pose-only missions, no-shield-loss missions and full-STORM survival missions: keep as achievement/telemetry candidates until physical accessibility and event semantics are validated. Timed ENERGY survival and existing combo goals provide attainable alternatives.
- Audio, new currencies, accounts, leaderboards, remote analytics and export/import: unnecessary scope for this release.
- Preferred camera auto-start: do not add permission surprises. Remembering input preference can follow after per-game fallback semantics are validated.
- Heavy bundle or rendering rewrites: only separately propose changes supported by measured user-facing benefit.

## Practical implementation order after approval

Each stage adds focused failing tests before behavior, runs its affected unit/browser checks, and produces a small reviewable commit. Execute inline by default unless a different method is requested.

1. Verify HEAD/working tree again; create `feat/evolution-qol-3` from the approved HEAD. Run and record baseline suites/performance. Stop on unexplained baseline failures before layering features.
2. P0 event contract, lifecycle adapters, storage, reset and isolation tests. Review accepted-event lineage before UI consumes it.
3. P1 permanent missions and basic MY JOURNEY; validate all 12 through deterministic fixtures and fallback paths.
4. P1 results integration; snapshot prior bests and per-round unlocks.
5. P1 TARGET PRACTICE, then PRECISION, each independently tested against unchanged standard behavior and bests.
6. P0 targeted usability fixes supported by audit evidence, P2 settings/accessibility and shared celebrations. Preserve existing controls and visual authority.
7. Matched performance/resource checks, full validation, documentation and final branch review. Fix reproducible regressions without weakening tests.
8. Commit completed implementation and report exact final HEAD, scope, pass/fail/skip counts, timings, bundle measurements, unresolved failures and physical limitations. Keep release HOLD; no merge, push or deployment is implied.

## Automated acceptance and reporting

Retain all existing tests; add the focused files described per feature. New tests must exercise real adapters and UI lifecycle as well as pure reducer fixtures. Production smoke should include journey, saved settings, modifiers, results and no development-only diagnostics. Test unknown/corrupt data, duplicate events, standard/variation separation, reset during pause, storage refusal, two-tab ownership, touch cancel, camera loss and renderer disposal explicitly.

Run the requested commands serially, recording exit codes and logs:

```powershell
npm.cmd test
npm.cmd run test:browser
npm.cmd run build
$env:LUMEN_OFFLINE_FONTS = '1'
npm.cmd run check:production
```

If Node is unavailable in the shell, use the existing `.tools/node-v22.23.3-win-x64` PATH provision described in the acceptance report. Inspect occupied preview/test ports and reuse only an identified matching server. Record exact executed pass/fail/skipped counts, not anticipated counts. Builds and production smoke report exit status and checks separately from test counts. No full validation was run for this planning-only change.

## Physical acceptance carried forward and expanded

Carry forward **P01–P18 and D01–D20, all 38 NOT RUN**, from `docs/lumen-real-device-acceptance-report.md`, plus QoL 2 focused retests for brief/sustained LAUNCH loss, confirmed release after reacquisition, held-key/touch resume, SLASH frame-motion readiness and FLOW rotation during play/already paused. Those retests remain NOT RUN; do not count them as covered by the older combined rows without observations.

The following are additional EVOLUTION requirements, currently **12 NOT RUN**:

| ID | Physical exercise and expected result | Status |
|---|---|---|
| E01 | Open JOURNEY, MISSIONS and SETTINGS during every game's play/countdown; verify frozen time, events and feedback; explicit resume admits fresh input only. | NOT RUN |
| E02 | Reload/return after real rounds; verify honest archive totals, unchanged existing bests/ECHOES, once-only titles and visit-only storage notice where applicable. | NOT RUN |
| E03 | Keyboard and screen-reader navigation through archive/settings/reset; cancel preserves data; confirmed reset clears only its stated scope and returns focus. | NOT RUN |
| E04 | Real LAUNCH acquisition/carry/opening across speeds, framing and brief/sustained tracking loss; intentional releases counted once; tracking loss never throws. | NOT RUN |
| E05 | FLOW fingertip responsiveness, interrupted tracking and rotation; no fabricated segments or inflated quality; completed paths preserved. | NOT RUN |
| E06 | Representative missions completed with physical camera and each supported fallback; progress remains readable and reachable for seated/limited-range play. | NOT RUN |
| E07 | All result types, no-hit rounds, early ENERGY loss, replay and mode selection on phone/desktop; meaningful real values, compact layout and focus. | NOT RUN |
| E08 | Extended TARGET PRACTICE with real webcam, mouse, keyboard and physical touch; guidance useful, pause safe, explicit end and standard bests unaffected. | NOT RUN |
| E09 | PRECISION with fingertip, mouse and touchscreen; off-guide feedback understandable, nonobstructive, and consistent with completed accuracy. | NOT RUN |
| E10 | Six colors, red hazard visibility, reduced effects, OS reduced motion, 200% text, safe areas, physical rotation and fullscreen across shipped device classes. | NOT RUN |
| E11 | Simultaneous dense gameplay and awards; bounded, readable celebrations without distraction, overlapping speech, flashing or hidden targets. | NOT RUN |
| E12 | Sustained desktop/phone sessions and 20 replay/menu/variation cycles; record device/browser/lighting, responsiveness, heat, camera ownership and cleanup. | NOT RUN |

Total explicitly numbered physical checks after expansion: **50 NOT RUN**, plus the carried-forward QoL 2 focused retests. Record actual device/input/browser and observations per game before changing statuses. Automated fixtures do not satisfy these rows. Release remains **HOLD** until physical acceptance and separate explicit release approval.

## Approval requested

Approve or revise this staged scope, including the two selected modifiers, permanent rather than daily missions, reset boundaries and deferred features. Approval permits branch creation and implementation; it does not approve merging, deploying, or changing HOLD.
