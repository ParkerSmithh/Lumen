# LUMEN: Next Level — audit, design proposal, and roadmap

October 17, 2026. Planning only; application changes require explicit approval. No branch switch, commit, merge, push, or deployment performed.

## A. Repository audit

### Verified baseline and evidence

- Current branch: `feat/body-illumination`.
- HEAD: `9975a53e7f01f9c0d9786cea65a09285c4c82287` (`fix: harden neon fallback and record full renderer validation`). Local `main` and cached `origin/main` point here. Remote freshness was not checked by fetching; this is a local-workspace audit, not certification of the live deployment.
- Working tree is dirty: App, GLOW controls/renderers/shaders, GLOW mode, fixtures and browser tests have existing edits; body-illumination implementation, tests, measurements, plans and reports include untracked files. Preserve all of them. Do not stash, reset, overwrite, or include them in a new milestone commit without resolving ownership first.
- No repository `AGENTS.md` was found by file search. Read package/config, App, camera/tracking hooks, shared HUD/round logic, event/persistence systems, styles and relevant feature/validation reports.
- `docs/evolution-3-proposal.md` describes the older `2a9c6d8` baseline. It is historical input, not current implementation authority.
- Fresh validation: `npm.cmd test`: **318 passed, 0 failed, 0 skipped**, approximately 903 ms reported test duration. Full browser suite, production check and build were not rerun in this planning pass. Prior report results remain historical evidence.
- Rendered the current working tree in headless Edge through Vite. Inspected GLOW entry at 1440×900, 390×844 and 844×390, plus FLOW entry at 1440×900. Captures: `.test-artifacts/next-level-audit-{desktop,mobile,landscape,flow}.png`. These are camera-off entry captures, not physical-webcam or active-game acceptance.

### Feature inventory

| System | Current implementation | Opportunity / boundary |
|---|---|---|
| TRUE NEON GLOW | Integrated in HEAD: WebGL silhouette glow, intensity presets, Canvas fallback, measured lifecycle/visual fixtures | Preserve target bounds, visual/gameplay mask separation, fallback and context-loss coverage |
| BODY ILLUMINATION | Present as uncommitted work: independent NATURAL/RADIANT/BLAZING, default RADIANT, linear-light/detail/highlight work, Canvas filter support | Treat as existing work, not a new feature; physical appearance and browser filter compatibility remain pending |
| FREE GLOW / BODYSHIFT | Free body artwork, optional pose support and bounded body-driven visual interactions | Explain controls without adding hand inference to GLOW |
| ENERGY RUSH | Calibrated body/assisted game, accepted orb/damage/challenge events, reachability, shields, combo/fever, separate input records | Add optional missions only after authoritative event bridge; retain calibration and anti-jitter rules |
| FLOW / LIGHT TRACE | Timed ordered tracing, accuracy, direction handling, arcade paths and combo behavior | Improve path previews, precision explanations and results; do not build a duplicate tracing engine |
| SLASH / DESTRUCTION | Timed crystal destruction, combos, special formations, frame-motion fallback and CHAOS variation | Improve hierarchy; preserve collision, child reservations and independent round lifecycle |
| LAUNCH / KINETIC | Three.js physics, target challenges, moving/bonus targets, bank-hit detection, assisted grabbing and possession grace | Target practice can reuse existing accepted hits; preserve throwing semantics and 150-ball configuration |
| CHAOS ENGINE | CALM/WILD/MAX, bounded effects, SURGE and mode-specific behavior | Separate visual intensity from rendering quality and game difficulty in copy and settings |
| ECHOES | Session-only deterministic artwork, actual accepted geometry, bounded storage, PNG export, clear confirmation, suspension gate | Gallery browsing and feedback polish; no need to introduce persistent artwork storage |
| BEYOND | Atmospheres, PULSE, resonance, CORE participation and CONVERGENCE | Explain what participation unlocks; retain manual gesture alternatives and conflict safeguards |
| HOW TO PLAY | Shared provider/dialogs, first-play gates, input selection and instructional demos | Preserve tutorial content and pause semantics; improve navigation and focus consistently |
| QoL / recovery | Named status regions, tracking-loss feedback, 44px targets, responsive overrides, pause/resume, readiness gates, camera watchdog/stale-start protection | Strong foundation, but no remembered-camera return flow; responsive overrides still conflict |

### Current camera and tracking ownership

`App.jsx` calls `useWebcam()` once and owns one persistent video element. Mode navigation shares that stream. `useWebcam.js` owns capture, a connecting guard, generation token, 15-second watchdog, track-ended handler and cleanup. Stale getUserMedia results are stopped. Live streams block duplicate starts. Stop releases tracks and clears the video element.

Capture currently requests 640×480 ideal, 30fps ideal, `facingMode: 'user'`, audio off. Startup is user initiated. There is **no camera preference storage, device enumeration/picker, permission query, automatic visit restoration, permission-change subscription, or device-change handling**. An ended track releases capture and presents an error; it does not reconnect. This is the direct reason each reload requires a click, even when browser permission persists.

Body and hand tracking are separate hooks enabled by the active mode, camera status, gallery suspension and input selection. Body segmentation has a worker and bounded optional pose scheduling; hand modes use the existing hand pipeline. Camera `ready` currently means video playback started, not that tracking is ready. `TrackingStatus` already combines input state; retain that distinction in the redesigned UI. Tracking retry for GLOW currently stops/restarts capture: separate tracker recovery from camera recovery where possible.

### Rendered UI findings

- Desktop has a clear large GLOW headline, but small top navigation does not explain the four experiences. ENERGY RUSH is a secondary text action; the creative/game distinction is hard to discover.
- CHAOS choices are prominent before camera entry, while the relationship between CHAOS, PULSE, BODYSHIFT and BEYOND is unclear.
- Mobile portrait spreads controls across the full viewport; the hero crosses the bordered stage and privacy copy crosses its bottom edge. Secondary controls compete with entry guidance.
- At 844×390, the headline overlaps navigation/CHAOS and guidance crowds preview/ENERGY RUSH actions. This is an observed defect, not a speculative concern.
- FLOW entry shows an extremely subdued game title/PLAY action while camera connection is elsewhere. Make the reason PLAY is unavailable explicit and offer the alternate input nearby.
- Secondary labels are visually tiny and faint in inspected captures. Measure contrast before asserting WCAG compliance; no formal contrast or screen-reader audit was completed.
- Active HUDs, results, populated gallery, tracking states and permissions UI still require a rendered review. Code inspection alone does not establish their visual quality.

## B. Prioritized feature proposal

1. **Smart Camera:** highest recurring benefit; isolated, testable reliability work.
2. **A coherent entry and settings shell:** explain creative experiences versus games; preserve immediate entry for returning users.
3. **Optional missions and better results:** one useful objective at a time, drawn from accepted collections, completed traces, slices and confirmed hits. Missions never independently inspect tracking coordinates.
4. **MY JOURNEY:** local XP, mode milestones, titles and cosmetic choices, with validated versioned storage and memory fallback. Persist scalar summaries, not movement histories.
5. **Cosmetics:** palette/rim/trail/particle presentation within existing budgets. Never alter silhouettes used for collision, detection thresholds, target size, scoring or visibility needed for fair play.
6. **ENERGY PAINT:** strongest creative candidate. Reuse FLOW input and rendering for free drawing, with explicit Draw/Clear controls and pointer/touch support. It fills a distinct expressive gap beside guided LIGHT TRACE.
7. **MOTION MIRROR:** second candidate, reusing bounded GLOW mask history. Use temporary low-resolution masks and an explicit enable control; no stored footage or extra inference.

Defer ENERGY RUSH survival until reachable patterns and comparable difficulty can be validated. Defer FLOW precision and SLASH combo variants until missions demonstrate replay value; current games already contain accuracy and combo systems. LAUNCH target practice is the lowest-risk first variant, with its own records and no standard achievement awards. Defer LIGHT SCULPT (unclear depth/control), AURA PULSE (overlaps PULSE), and gesture COLOR FUSION (gesture ambiguity); a simple color control can be evaluated later. Avoid permanent ECHOES history and heavy assets in this expansion.

## C. Concrete UI/UX proposal

### Direction and alternatives

Recommended: **an instrument for making light**. A dark, quiet shell frames vivid body and motion artwork; precision typography and one bright action establish hierarchy. Keep six-color identity and mode-specific previews. Alternatives: retain the current artwork-first full-screen shell with a settings drawer (smaller change, weaker discovery), or build a game-first dashboard (strong replay discovery, risks burying creative expression). Choose the instrument direction because it supports both uses.

Proposed tokens, subject to contrast and rendered review:

| Token family | Starting specification |
|---|---|
| Surfaces | base `#07090E`, raised `#111620`, overlay `#19212D`; restrained borders `#344153` |
| Text | primary `#F4F7FC`, secondary `#B4BFCE`; avoid tiny low-opacity utility text |
| Accent | existing user-selected six-color palette; use light text on dark controls; test colored CTA text/background combinations |
| Type | reuse current font assets/stack; display clamp 48–96px, title 28–40px, body 16px, utility minimum 12–14px; tabular numerals for scores |
| Space / shape | 4/8/12/16/24/32/48/64px; 8px controls, 16px cards, 24px sheets; minimum 44×44px actions |
| Focus | visible 2px high-contrast ring with offset; status always includes text/icon |
| Motion | 120ms controls, 220ms panels, 360ms scene fade; ease-out; reduced motion removes movement and milestone bursts |
| Glow | reserve for artwork, selection and accomplishments; neutral panels need no bloom |

### Screen concepts

**Home, desktop:** header with LUMEN, Explore, My Journey and Settings; accurate camera chip at the right. Hero explains “Move. Make light. Play.” beside a bounded illustrative preview labelled as a preview. Primary action continues the selected experience. Four concise mode cards form one row below; each offers an artwork/game choice where supported. GLOW card distinguishes FREE GLOW and ENERGY RUSH. Avoid a large animated background competing with the artwork. At shorter desktop heights reduce preview height; allow scrolling rather than clipping.

**Home, mobile:** header and camera status; short hero; two-column cards when readable, one column on narrow screens; natural page scrolling. No absolute positioning of hero and navigation. A compact landscape entry panel uses two columns and hides secondary decoration. Use dynamic viewport units and safe-area padding.

**Mode selection:** GLOW silhouette, FLOW sampled path, SLASH crystal fragments, LAUNCH throw arc. These are bounded static/idle previews, not four active renderers. Each card states interaction and available input. Keep one selected mode and a clear back action.

**Gameplay:** full stage with compact top score/timer/combo, relevant shield/progress indicator, pause and exit. Tracking chip stays at a safe edge. Bottom shows a single contextual instruction or mission; settings live in a sheet opened while paused. In compact landscape, retain only score/time/pause and error recovery. Preserve mode-specific metrics behind shared layout primitives.

**Results:** final score and personal-best comparison first; then accuracy/best combo where meaningful, completed mission and XP earned. Replay is primary; change mode is secondary. Unlock celebration is brief, skippable and reduced-motion aware; no animation gates replay.

**Settings:** sections for Camera, Appearance, Performance and Accessibility. Camera picker, front/rear alternative, Remember My Camera, Auto-Reconnect, Connect/Disconnect and Forget Preference. Explain external browser permission control. Separate glow intensity, body brightness, CHAOS intensity and quality with plain descriptions. Reset appearance independently from camera and journey resets.

**MY JOURNEY:** level/next milestone, four mode summaries, titles and cosmetic previews. Optional progress never blocks creative modes. Reset uses a named confirmation and does not delete camera settings or ECHOES unless explicitly selected.

**ECHOES / BEYOND:** preserve truthful event-derived artwork; add mode filters, count/empty state, export progress and cancellation feedback. Explain session-only lifetime. A small CORE progress panel explains participation and CONVERGENCE; atmospheres remain in-stage with bounded feedback.

**Onboarding:** concise first-visit explanation with Explore without camera, Connect camera and How it works. Store completion separately; HOW TO PLAY remains available. Auto-restoring visitors see a compact connection state, not flashing first-visit onboarding.

### Smart Camera interaction and architecture

After a successful intentional connection, offer unchecked **Remember this camera** and **Reconnect automatically on future visits** with clear copy. Auto-Reconnect requires remembering; both default off. Save only version, booleans, useful device ID and facing mode. Do not save device labels, group IDs, calibration or frames. Turning remembering off deletes device preference and disables auto-start. Forget also clears opt-in and cancels pending automatic work; it need not stop the current camera, which has a separate Disconnect action.

Maintain one App-owned camera controller through the existing hook. Add a small validated preferences module and injectable permission/media adapters for testing; do not introduce a second camera provider. States: off, checking permission, connecting, camera live, initializing tracking, tracking ready/searching, recovering, blocked/unavailable. Keep capture and tracking state separate internally; “Ready” requires current-mode tracking readiness and relevant gameplay calibration gates.

Return flow: read validated opt-in → query camera permission when supported → if granted, start saved camera once → wait for playable video → initialize only selected tracking → show actual readiness. If prompt/denied/unsupported permission query, offer one Reconnect action; no speculative getUserMedia call that might prompt. This conservative unsupported-API fallback may require one click even where browser capture would otherwise work.

Use exact saved device selection when supported; if absent/unavailable, offer “Use another camera” rather than silently switching to an unintended device. Device enumeration can be restricted by permissions; browser capture remains permission-controlled and secure-context dependent. See [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) and [enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices).

Serialize device switching: stop old stream, invalidate old generation, request replacement, stop stale returned streams. Persist the actual successful selection, never a failed attempt. Reuse same-device in-flight startup promise. Disconnect sets a session suppression flag before cleanup; only explicit manual reconnect clears it. Unexpected track end may perform one recovery attempt if auto-reconnect is enabled, permission is positively granted and the page is visible; failure becomes a manual action. No polling loop. Permission revocation cancels pending work, stops capture and pauses gameplay. Device changes refresh choices without restarting capture. Register/clean up supported listeners and ignore stale permission results. Do not restart gameplay or reset scores during recovery; require existing explicit resume.

## D. Cleanup proposal

- Extract shell navigation, CameraStatus, camera settings and mode cards from App when touched. Consolidate connection/start/retry decisions there; retain one video owner.
- Introduce shared HUD frame, pause panel, results panel and settings field primitives while preserving Energy Rush and SLASH controllers. Existing GameHUD already supplies reusable behavior; extend it rather than replace every HUD at once.
- Add a documented gameplay event contract: version, round ID, event ID, mode, variant, input class, accepted event type and scalar payload. Emit only after controller acceptance. Deduplicate by round/event; invalidate on restart/leave; bound queues. Observer errors cannot interrupt gameplay.
- Do not use ECHOES as the mission source. Its geometry events are sampled/capped (ENERGY RUSH records at most 16 orb artwork marks), so it cannot count every accepted action reliably. Fan out gameplay events independently to missions/progression and artwork.
- Validate persisted camera/settings/journey independently; retain existing versioned personal-best separation. Storage failure becomes a visible “this session only” state where useful.
- Consolidate base shell rules and `qol.css` overrides into tokens and layout ownership by surface. Audit computed styles before deleting selectors; keep legitimate mode-specific rules.
- Largest files include Ballpit (~44KB), SplashCursor (~39KB), styles (~20KB), App (~16KB), SLASH/LAUNCH/FLOW (~15–16KB). Size alone does not justify refactoring mature physics/fluid engines. Extract only lifecycle/interface seams relevant to a milestone.
- Preserve renderer loops, texture caps, context recovery, canvas fallback and ML cadence. No dependency removal or dead-code deletion is justified by this pass alone; verify imports, dynamic loads and validation fixtures first. No large UI framework proposed.

## E. Independently reviewable roadmap

Complexity is relative engineering effort, not a delivery-date promise. Every milestone ends with a working build and its own review/commit after approval.

| Milestone | Features / benefit | Likely files and architecture | Dependencies / risks | Testing and acceptance | Complexity / performance |
|---|---|---|---|---|---|
| A0 — Smart Camera | Remember, device picker, opt-in auto-return, disconnect/forget and honest readiness | `useWebcam.js`, App, TrackingStatus; new preference/controller tests and compact camera settings | Resolve existing dirty work ownership; browser permission/device differences and late async results | All camera cases below; ≤1 active stream, no duplicate workers, no prompt on denied/unknown auto-return, stop suppression survives mode changes | Medium–high; retain capture size/cadence, instrument startup phases |
| A1 — UI foundation | Tokens, home/mode cards, navigation, responsive entry and settings | App, styles/qol, new shell primitives; existing instruction integration | A0 state contract; landscape overlap and focus regressions | Render all specified viewports/states; keyboard/modal focus, no overlap or hidden actions; existing game tests pass | High; static previews, no extra live renderers |
| B1 — Events, missions, results | Authoritative event contract, optional objectives, reusable results | game controllers, useRound, energy events; new mission reducer and result components | Maintain distinct SLASH lifecycle; event dedup/session attribution | Exact progress from accepted events; no awards on pause/rejected/stale/practice events; replay remains immediate | High; bounded events and UI updates on changes only |
| B2 — One challenge pilot | LAUNCH target practice with isolated records | launchArcade, LaunchMode, personalBests, instructions | B1; reuse physics and hand semantics | Practice cannot modify standard records/unlocks; verified target/hit/reset behavior | Medium; unchanged solver population/cadence |
| C — Journey and cosmetics | Local XP, titles, cosmetic selection, reset | new journey/settings storage; results and palette/effect adapters | B1; abuse/double-awards, schema migration, visual fairness | Deduped completed-round awards, separate variants/input classes, corruption/disabled storage/reset tests; gameplay invariant comparison | Medium–high; scalar bounded storage, existing effects only |
| D — Creative and gallery | ENERGY PAINT first; optional MOTION MIRROR later; ECHOES/BEYOND clarity | FlowMode/SplashCursor adapter, echo gallery, beyond controls; GLOW only if mirror approved | A1; inference and privacy boundaries; creative input conflicts | Pointer/touch and camera paths, explicit clear/exit; suspension/export bounds; no camera data persistence | High; mirror separately budgeted, reuse existing loops |
| E — Consolidation | Remaining accessibility, CSS/lifecycle cleanup and measured AUTO quality | touched hooks/renderers/styles and docs | Regression evidence from earlier milestones; quality oscillation | Full regression, cycles/context loss/soak, physical acceptance matrix | Medium–high; AUTO visual-only with dwell/hysteresis, no scoring/inference changes |

Accessibility, cleanup and performance checks accompany every milestone; E is remaining consolidation, not deferred responsibility. Do not implement all challenge variants in B2 without pilot evidence.

## F. Risk assessment

| Risk | Mitigation / release evidence |
|---|---|
| Overwriting body-illumination work or using stale baseline | Preserve dirty tree; reconcile its intended commit/branch before feature branch creation; record actual SHA per milestone |
| Unexpected startup / repeated permission prompts | Explicit opt-in; granted-only automatic path; unsupported API manual fallback; no repeated retries |
| Wrong camera / unstable identifiers | Confirm actual selected device; minimal validated local preference; clear unavailable-device fallback and front/rear controls |
| Concurrent streams / stale async completion | One controller, serialized switch, generation invalidation, stale-stream stop and teardown assertions |
| “Ready” before tracking/calibration | Separate phase reporting; current pipeline gates gameplay; tracker failure does not trigger camera loops |
| Mission double-counts / unfair practice rewards | Controller events, round/event dedup, variant/input/rules metadata, separate records and explicit eligibility |
| Persistent data corruption / storage denial | Versioned sanitized schemas, memory fallback, bounded aggregates, independent reset scopes |
| UI obscures play / focus lost on transitions | Reserved HUD regions, compact landscape layout, focus restoration, keyboard/touch and reduced-motion checks |
| GPU or ML regressions | Same capture/inference ownership, no new loops; fixed-scene matched-quality benchmarks and allocation bounds |
| Browser-specific Canvas illumination | Existing uncommitted filter work needs real Safari/Firefox checks; synthetic Edge success is insufficient |

## G. Exact validation plan

### Automation

Run existing `npm.cmd test`, `npm.cmd run test:browser -- --workers=4`, `npm.cmd run build`, and `npm.cmd run check:production` for implemented milestones. Preserve thresholds and fixtures; record environment and actual command results. Use `LUMEN_OFFLINE_FONTS=1` only when necessary and disclose it. Keep existing Three.js bundle warning visible; no threshold increase to hide it.

Camera unit/controller tests with deterministic adapters: first connect; successful preference save; reload and newly constructed browser session; granted auto-return; prompt/denied/revoked permission; rejected/unsupported permission query; absent media APIs/insecure context; unavailable saved camera; multiple devices; successful/failed selection changes; front/rear constraints; manual stop; both opt-outs; forget during pending startup; corrupt/malformed/oversized storage values and throwing storage; rapid navigation/unmount; concurrent starts; late resolution after timeout/stop; video.play failure; tracker failure; track-ended recovery; hardware removal; permission/device listener teardown. Assert request count, constraint choice, stopped-track count, max active streams and worker ownership, not merely UI text.

Browser tests: connect with mocked media adapter; reload same context; reopen with retained storage state (label as a simulation of a returning session); permission-state transitions, settings keyboard use, focus trap/restore, opt-in copy, status ordering, no onboarding flash, disconnect suppression across mode changes, isolated tracking retry, no gameplay reset/automatic resume, all-mode integration including BODYSHIFT and ENERGY RUSH. Mocked browser tests do not prove permission persistence across actual browser restarts.

Mission/journey tests: every accepted event kind, duplicate/stale round IDs, pause/resume, replay/exit, practice eligibility, distinct standard/challenge records, exact threshold crossing, deterministic XP/unlocks, corrupted save recovery and independent resets. Verify sampled artwork does not reduce mission counts.

UI matrix: 1440×900, 1366×768, 1024×768, 768×1024, 390×844, 320×568, 844×390 and 667×375; entry, selected mode, playing, countdown, pause, results, settings, empty/populated ECHOES, permissions and tracking errors. Add 200% zoom, long messages, keyboard-only, screen-reader announcements, visible focus, measured text/control contrast, safe areas and reduced motion. Review actual screenshots and interactive transitions.

Regressions: ENERGY RUSH anti-jitter/calibration/reachability; FLOW ordered scoring/accuracy/rotation; SLASH accepted collision/combo/children/frame-motion fallback; LAUNCH push/grab/grace/throw/bank-hit; BODYSHIFT; GLOW neon/body illumination/Canvas/WebGL/context recovery; gallery suspension and HOW TO PLAY.

### Measurements

Before/after use the same machine/browser, viewport, scene, quality and warmup. Record CPU median/p95, frame intervals, allocation/resource counts and model cadence. Record GPU timings only with valid non-disjoint timer queries; Canvas GPU timing remains unavailable if no mechanism exists. Existing body-illumination report gives historical matched-scene WebGL CPU p95 0.5–0.6ms and GPU p95 0.049–0.064ms after its change; these are synthetic renderer measurements, not a new whole-app baseline or real-camera FPS.

For camera work record navigation→live video, live video→tracking initialized, tracking initialized→first valid detection, capture attempt count, max simultaneous live streams, worker count and unexpected-loss→recovered tracking. Keep permission/user-decision time separate. One attempt on normal granted return, max one live stream; unavailable hardware can remain manual recovery. Establish timing budgets from repeat baseline measurements rather than inventing a startup guarantee.

Run existing renderer lifecycle checks, 50 camera start/stop/switch cycles, repeated mode/gallery navigation, context loss and a 30-minute camera/game soak. Check logical resource counts after teardown; do not equate those counts with measured driver VRAM or total browser heap.

### Physical acceptance — all NOT RUN

Desktop Chrome/Edge/Firefox and macOS Safari where available; Android Chrome and iOS/iPadOS Safari. Record exact OS/browser/camera. Test real first permission, reload, close/reopen browser, multiple cameras, USB removal/reinsert, camera-in-use, OS/browser revocation, front/rear switch, orientation changes, tab backgrounding, autoplay restrictions and permission recovery. Test standing/seated and different lighting, body/hand reacquisition, long-session comfort/thermal behavior and real touch controls. Unsupported hardware/browser combinations remain NOT RUN with reason. Retain all existing outstanding physical checklists; no mocked test changes their status.

## H. Implementation recommendation and approval boundary

Approve **A0 — Smart Camera** first, including its small settings panel and status improvements. It fixes the most frequent frustration, has clear ownership, and can be reviewed independently of visual redesign and scoring changes. Implement A1 next using the stable camera-state contract. A combined A0+A1 branch would make camera regressions harder to isolate; a single expansion branch would be excessively broad.

This proposal does not authorize application edits. After approval, resolve the existing uncommitted body-illumination baseline, create a dedicated feature branch from the agreed state, implement/test one milestone, and commit only its owned changes. Merge and deployment require separate authorization.
