# TRUE NEON GLOW execution ledger

Plan: docs/superpowers/plans/2026-10-16-true-neon-glow.md
Baseline: 2a9c6d8; 308/308 unit tests pass. Dedicated requested feature branch in existing checkout; unrelated untracked proposal untouched.
Task 1: baseline renderer copied into test-only fixture; deterministic scene and short timing harness captured before renderer changes.
Task 2 RED: tests fail with missing glowMask module, as expected.
Ruling: use npm.cmd/npx.cmd because PowerShell execution policy blocks npm.ps1. No policy changes.
Ruling: neutral scalar bloom caches exclude color/intensity/fade; those inputs are composited every draw. Quality/geometry/mask changes invalidate bloom. This prevents stale cached colors and fade.
Task 2: visual mask/preset tests pass; raw mask immutability and unchanged gameplay anti-jitter grid covered.
Tasks 3–5: GPU rim/three scales/composite, Canvas fallback, intensity control, timed fade and source-history reset implemented in existing rendering lifecycle.
Task 6: all 18 combinations on both backends meet halo/detail/clipping checks; difficult masks have numeric rim/detail assertions and screenshot artifacts. Shader/FBO/context failures covered.
Review: fresh reviewer found preview base opacity omission, fixed with regression coverage. Re-review found no remaining important source issue; additional difficult-case assertions added following coverage observation.
Ruling: the fixture initially painted clothing over its background due to source-in against an opaque canvas. A failing explicit bright/dark pixel test caught this; corrected before final comparison/profile runs.
Validation: initial full browser run 174 pass/1 SLASH motion failure; isolated rerun passed unchanged. Final serial suite scheduled to remove competing browser workloads.
Release authorization changed: user explicitly requested merge, push, commit and deploy. Physical acceptance remains NOT RUN; historical reports untouched.

Ruling: default Canvas low tier uses two halo buffers plus the narrow rim; standard GPU quality retains all three bloom scales. This follows the approved cheaper fallback/quality exception.
Final automated validation: 315 unit, 188 browser plus compact-landscape regression, build and offline production pass. Full isolated timing/soak: 2 pass, 17.0m; 144003 frames/600.001s, 50 lifecycle cycles, zero tracked resources after disposal. Five responsive viewports pass. Confidence-plateau Canvas morphology corrected with true neighbor min/max and reusable storage, then reprofiled in three isolated runs. Numeric measured budgets met on this host; unavailable/physical measurements remain explicit in validation report.
