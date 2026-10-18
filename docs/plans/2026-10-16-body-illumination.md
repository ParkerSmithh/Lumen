# LUMEN BODY ILLUMINATION — approved implementation plan

Baseline: `9975a53e7f01f9c0d9786cea65a09285c4c82287`. Branch: `feat/body-illumination`.
Approved by the user on 2026-10-16. No merge or deployment authorized. Physical webcam acceptance remains pending.

1. Freeze deployed TRUE NEON as deterministic BEFORE; leave evolution-3-proposal.md untouched.
2. Replace gentle subject tint with linear-light shadow/midtone exposure lift, colored illumination and soft highlight rolloff. Fixed curves avoid background exposure pumping; preserve facial features and clothing texture.
3. Pack bounded interior emission into the unused green channel of existing bloom targets. Preserve exterior red-channel calculations, nine textures and seven framebuffers. Refresh camera-dependent lighting in the existing draw loop; prioritize responsive lighting at reduced quality.
4. Add independent NATURAL / RADIANT / BLAZING body brightness, default RADIANT. Preserve SOFT / NEON / SUPERNOVA, default NEON. Calibrate all six palettes independently of CHAOS and gameplay.
5. Canvas approximation: bounded native compositing, at most one new canvas capped at 128px long edge, no pixel readbacks or per-frame resource allocation. Include reset/dispose diagnostics.
6. Deterministic before/after fixtures: dark clothing, shadowed faces, low light, multiple skin tones, bright highlights. Test six palettes x three glow levels x three body levels x two backends. RADIANT minimum 1.5x brightness on dark/midtone patches; monotonic levels; retain >=70% source detail contrast; <=2% clipping; exterior within 5% at fixed glow/mask. Keep existing regression coverage.
7. Full unit/browser suites, build/production validation, visual inspection, lifecycle and comparable CPU/GPU profiling. Added p95 budgets: GPU <=0.5ms, WebGL CPU <=0.5ms, Canvas CPU <=2ms. Report measured results and missed targets, then commit.

Affected areas: src/effects/glowShaders.js, glowRenderer.js, glowCanvasRenderer.js, shared body profiles, glow controls, App/GlowMode settings wiring, test fixtures/browser tests, validation reports.

Global constraints: no extra camera streams, workers or animation loops; visual masks never alter gameplay confidence/scoring/collisions; preserve all modes, recovery, reduced motion and existing lifecycle behavior. Physical checks stay NOT RUN until performed.
