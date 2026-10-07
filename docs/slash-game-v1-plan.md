# SLASH game v1 — approved implementation

Authority: user's October 7, 2026 approved in-chat plan and implementation priorities.

Implement in the current checkout on feature/slash-game-v1. No changes to slashDetector, slashFrameMotion, hand tracking or swept collision geometry. No additional scoring systems or persistence.

1. Deterministic game controller: ready/countdown/playing/results; one monotonic clock with excluded paused time; exact 120-second end; score actual destroyed objects; smooth progression at 0/30/60/90/120 seconds with intervals 1.8/1.2/.8/.45/.35 and caps 3/5/7/8/8.
2. Scene contract: consume controller snapshot; explicit spawn scheduling without catch-up bursts; stable object IDs, normal type/value=1, destroyed/expired events, reusable reset and end fade; retain bounded effects and physical collision.
3. Mode/HUD: keyboard Start, 3-2-1, quiet edge timer/count, results/replay; visibility/camera pause with explicit Resume and motion-history reset; maintain existing gesture symbol and camera preview.
4. Verification: deterministic controller/scene tests, real browser flow and recorded-motion regressions, deliberate final-phase performance measurement with actual tracking worker; complete unit/browser suites and production build/check.
5. Independent review, fix any important findings, deploy approved payload to existing ParkerSmithh/Lumen Pages destination and verify the build served there.

## Execution ledger

- Baseline: 69 unit tests passed.
- Ruling: use dedicated branch in current checkout — user explicitly requested implementation in this IDE workspace and continuous execution.
- Ruling: missed landmarks do not pause; unavailable camera does. Fallback motion detection does not depend on MediaPipe detecting a hand.
- Tests and measured results will be recorded in docs/slash-game-v1-report.md.
- Controller and scene: deterministic tests verified, 78 total unit tests pass.
- HUD/mode integration: complete; four game browser tests cover keyboard, multi-hit, replay/mode reset, visibility pause, camera stop and paused-video recovery. Complete browser suite: 49 passed.
- Review: independent review complete; interrupted-video finding reproduced RED and fixed GREEN. No recognition retuning.
- Visual QA: short-phone caption overlap corrected and regression verified; desktop/phone ready and results inspected.
- Production build and local production verification passed. High-intensity measurements retained eight-target cap; actual worker synthetic-input run recorded in the report.
