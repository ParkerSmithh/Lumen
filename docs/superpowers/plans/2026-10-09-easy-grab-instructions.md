# Easy Grab and Game Instructions Implementation Plan

> For agentic workers: use executing-plans for integration; dispatching-parallel-agents for isolated modules. Steps are test-first and individually reviewed.

Goal: forgiving one-ball acquisition with unchanged throwing skill, and accessible first-play tutorials for all four games.
Architecture: projected grab selector and LAUNCH-specific buffered gesture state machine; reuse held physics and scoring. Shared instruction provider/config/dialog coordinates per-game start adapters and a reason-aware suspension gate. Existing camera and rendering infrastructure remains.
Tech stack: React, Three.js, Canvas/SVG/CSS, Node test runner, Playwright.
Spec: user-approved chat plan and pasted request bef6e8d2-a8a2-4060-ba1c-a855de21933b. Baseline0da574ff6163a65a35ccde6ce51543b00a138a10; feature branch feat/easy-grab-instructions.

Global constraints: no merge/deploy;150-ball cap, unchanged target/bank/best/timer rules; one held ball; no new camera/model; bounded effects and no per-frame React state; transient visit-only tutorial history; physical acceptance not claimed from synthetic tests.
Review focus: stale tracking cannot generate throw; recycled slots cannot inherit holding; keyboard focus cannot trigger game input; nested suspension cannot unpause gallery; first-start BACK must not start/reset a round.

- [ ] Grab modules: RED/GREEN projected candidate selection/visibility/depth/stickiness, closure hysteresis/time confirmation/150ms buffer/120ms gap; adapt existing intentional multi-grab tests to one-ball contract.
- [ ] LAUNCH integration: selected-depth plane, stable palm, bounded following/release, candidate feedback, mouse/touch/keyboard acquisition and creation separation; meaningful component/physics/scoring regressions.
- [ ] Tutorial UI: shared per-game configs and demonstrations, semantic dialog/focus/Escape/readiness, reduced motion/mobile styles, unit/browser tests.
- [ ] Lifecycle integration: first PLAY instructions, START GAME countdown/calibration, visit-only replay skip, HOW TO PLAY active-game pause/explicit resume, reason-aware independent suspension and input blocking.
- [ ] Verify: focused RED/GREEN, full units/default-concurrency browser/resource/build/offline-production; comparative synthetic acquisition/performance, batched desktop/mobile visual inspection; independent code review; commit clean snapshot and release-readiness/manual checklist.
