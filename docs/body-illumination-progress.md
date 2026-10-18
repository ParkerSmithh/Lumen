# SDD ledger — plan: docs/plans/2026-10-16-body-illumination.md

Baseline 9975a53e7f01f9c0d9786cea65a09285c4c82287. Branch feat/body-illumination. No merge/deploy authorization.

Pre-flight: shader/profile parameters are consumed by both backends and App/GlowMode; settings defaults must agree. Bloom R is exterior and must remain unchanged; G is interior coverage scatter. Gameplay mask code is outside scope.

Ruling: use the explicitly requested feature branch in this checkout, preserving the unrelated untracked proposal; no additional worktree or dependency installation needed. Baseline unit suite: 315/315 passed.

Task 1: baseline frozen in tests/fixtures/deployedNeon; approved plan saved.
Task 2: rendered brightness tests RED on both backends (ratio 1.0), then implemented linear-light curves. Initial aggressive lift failed facial detail; added local detail preservation and highlight shoulder rather than weakening contrast acceptance.
Task 3: Ruling: cache camera-independent coverage scatter in G and gate it using current camera luminance in final composite. This avoids camera-dependent cache invalidation and stepped 30Hz lighting while preserving existing exterior R and pass/resource counts. Camera relighting stays per draw at all quality tiers.
Task 4: control test RED (missing Body brightness group), then independent state/wiring and controls implemented. Defaults RADIANT/NEON.
Task 5: Ruling: Canvas uses bounded native SVG component-transfer LUTs and local detail preservation, plus one <=128px emission canvas. This preserves tone-curve consistency without pixel readbacks. Native filter intermediates are browser-managed, not counted as explicit application canvases/textures. Filter DOM nodes are owned and disposed.
Task 6: Expanded tests caught Canvas facial clipping and dark-skin BLAZING contrast loss. Added soft shoulder and adjusted BLAZING before proceeding. Seven scene categories x six colors x three glow presets x three body presets x two backends; includes dark/light skin, bright room, shadowed faces, low light and dark/light clothing. Further validation in progress.

Physical-webcam acceptance: NOT RUN. Existing outstanding checks unchanged. No reference-match claim.

Final review: fresh read-only reviewer (gpt-6-astra). Four Important findings: camera-pixel detail radius, mask-aware neighbor sampling, compact ENERGY RUSH HUD overlap, and matched-quality performance comparison. All addressed. Edge and HUD regressions were observed RED before fixes. The original scale test was too insensitive; strengthened to compare deterministic texture over a region at 1x/3x output. Comparative profiler now forces identical high quality for both renderers.

Additional review concern: a textured near-white patch caught highlight flattening despite endpoint clipping counters passing. Preserving source highlights with a local luminance envelope passes >=70% highlight-detail contrast on both backends. The BEFORE fixture now includes frozen dependencies, Canvas lifecycle tests count actual filter roots, and body preset lookup rejects inherited properties.

Ruling: replace the former test that required subject brightness to rise after a background exposure change. The new approved contract explicitly prohibits this pumping; its replacement requires stable subject brightness while background adaptation continues. Broad interior-detail/mirroring tests retain their previous thresholds and pass.

Ruling: allow up to two summed RGB quantization levels between adjacent one-level Canvas input steps; larger jumps and nonresponse still fail. This is below a visible flicker step and accommodates native filter rounding.

Declined-to-judge rulings: physical appearance, webcam comfort, browser-managed filter memory and Safari/Firefox compatibility remain unverified rather than accepted. Native filter intermediate storage cannot be inferred from explicit canvas counters. Final timing compliance is assessed from the completed matched-quality profile, not from concurrent full-suite timing diagnostics.

Task 6: complete — 318 unit tests and 206 browser tests passed; production build/check passed (12 assets, real worker initialization, 0 console errors). Comparison fixtures cover 756 AFTER renders and 252 BEFORE renders across seven scenes. WebGL/Canvas face contrast minima 95.29%/81.41%; clothing contrast minima 115.24%/126.41%; zero sampled interior/facial endpoint clipping. Highlight contrast minima 15/14 for source contrast 15. Performance reporting and final commit pending.
