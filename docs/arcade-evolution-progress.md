# Arcade Evolution implementation ledger

Approved specification: user Arcade Evolution brief and approval; base 9d11d66.
Branch: feat/arcade-evolution. Publishing main is not authorized.

Phases: A shared scores/bests; B FLOW; C SLASH; D LAUNCH; E integration/performance.
Independent pure rules are prepared by scoped agents; mode integrations and verification remain sequential.
Constraints: unchanged gesture thresholds, shared camera, 90/120/120-second clocks,
SplashCursor persistence, fixed-step Ballpit solver, 150 balls, eight slash objects,
192 particles/24 fragments/12 trails, one target. Real physical testing is pending.

Initial tuning: FLOW 100 + 0/50/100 quality + capped 25 chain;
SLASH normal/parent/child 100, bonus 300, combos 1/2/3/4x at 1/3/6/10;
LAUNCH normal100/bonus200 + bank100 within3 active seconds.

Phase A: completed-session storage, score/result HUD and optional storage fallback. Unit suite 103 passed; existing game/camera lifecycle browser checks 17 passed; build passed.

Phase B: ordered path-segment accuracy, eight normalized shapes, quality/chain scoring, SKIP, independent fluid pulse. FLOW/creation regression browser checks 5 passed; focused FLOW units 8 passed.

Phase C: combo scoring, bonus/splitting geometry, reserved child capacity, six-second child expiry, eight-object OVERLOAD. 45 focused units and 7 browser regressions passed. Shared/FLOW review deadline inconsistency fixed using atomic round award; regression passed. SLASH review: no blocking findings.

Phase D: fixed-step relative target sweeps, strict clear placement, bounded retries/bonus fallback, moving and timed bonus targets, actual wall-bank metadata. Existing creation/grab/boundary browser regressions 19 passed; new bank/moving/bonus + physics checks 5 passed. Review callback ownership/count reset fixed RED→GREEN; no solver coefficients or gesture thresholds changed.
Ruling: all arcade targets require clear initial placement (stronger final user constraint); normal targets retry at .25 active-second intervals if crowded. Bank incident axis speed floor .01 per-step prevents resting wall contacts from earning banks; does not change physics or gestures.

Phase E: all 117 unit and 72 browser tests passed; build and local production checks passed. Final visual/layout checks two passed. Independent final review approved with 36 focused tests passing. Performance measurements and physical-testing limits are recorded in arcade-evolution-report.md. Main verified unchanged at 9d11d66; no publication authorized or attempted.
