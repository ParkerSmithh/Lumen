# TRUE NEON GLOW Implementation Plan

Approved in conversation on 2026-10-16. Execution: native, task by task.

Goal: visibly emissive silhouettes with recognizable faces and clothing.
Architecture: existing camera/confidence mask/RAF; separate bounded visual mask; narrow rim; three GPU bloom scales; luminance-aware lighting; Canvas fallback.
Spec: user-provided TRUE NEON BODY GLOW brief and approved technical design in this conversation.

## Global constraints
- Baseline 2a9c6d8e564c1c18c20f257e6eb817665c5d99bf; branch feat/true-neon-glow.
- No gameplay mask mutation, extra inference, streams, or animation loops.
- Preserve FREE GLOW, BODYSHIFT, ENERGY RUSH, CHAOS, HOW TO PLAY and QoL 2.0.
- Release HOLD; physical acceptance NOT RUN until performed; no merge/deploy.

## Tasks
1. Baseline and comparison: tests/fixtures/{legacyGlowRenderer,neonGlowScene}.js and tests/browser/neonGlow{Performance,Visual}.spec.js. Preserve old renderer, deterministic hair/arms/face/clothing/background fixtures and movement/loss sequences. Measure before changes.
2. Visual contracts: src/effects/glow{Mask,Profiles}.js; tests/glowMask.test.js. Test invalid inputs, bounded 512-pixel visual mask, reusable storage, time-based history with movement rejection; presets SOFT/NEON(default)/SUPERNOVA independent of CHAOS.
3. GPU: glowRenderer.js, glowShaders.js, glowTargets.js. Edge/coverage extraction at <=512; horizontal/vertical inner blur <=256, mid <=128, outer <=64; final camera/halo/subject/rim composite. Fixed taps, saturated bloom, narrow highlights, six-color gains, preserved detail.
4. Lifecycle/fallback: glowCanvasRenderer.js. At most nine textures/seven framebuffer attachments; no depth/mipmaps; no same-size reallocations. Partial-init cleanup/idempotent disposal. Preserve fresh-canvas context-loss fallback. Canvas uses bounded mask and bloom work at <=30Hz; filters have graceful fallback.
5. Integration: App.jsx, GlowMode.jsx, GlowIntensityControl.jsx, glowControls.css. Accessible recommended NEON default; retain session selection; existing settings ref; time-based loss fade after existing 500ms freshness window; clear history on source discontinuity; reduced-motion static lower-cost rendering; preserve game exclusions and overlays.
6. Tests: all 18 palette/preset combinations on both backends, old/new screenshots; exterior glow >=2x baseline NEON dark fixture; interior detail contrast >=70%; newly clipped interior <=2%. Invalid/full/empty/partial/noisy masks, fast motion, loss/reacquisition, resize/rotation, context loss, repeated lifecycle; existing regression assertions unchanged.
7. Performance: 5s warmup/30s sample/three runs; CPU and optional asynchronous disjoint GPU queries separately; mounted FREE/RUSH under CALM/WILD/MAX; 10-minute soak and 50 lifecycle cycles. CPU renderer p95 <=4ms, mask <=2ms/update, GPU <=6ms if available, RAF p95 delta <=3ms, segmentation cadence degradation <=10%, low-tier p95 frame interval <=33.3ms. Auxiliary GPU storage <=4MiB; plateau/zero on disposal. Hysteretic quality reduction preserves rim. Record actual results and unmet budgets.
8. Validate: npm test; npm run test:browser; npm run build; LUMEN_OFFLINE_FONTS=1 npm run check:production (PowerShell syntax). Inspect visual artifacts, review branch, commit; report exact results and remaining physical checks.

## Review focus
- Palette/preset/quality changes with unchanged mask: neutral caches plus fresh composite parameters.
- Fade without new masks: fade every visual contribution during composition.
- Exposure transitions: bounded temporal adaptation, no frame-rate-dependent jumps.
- Movement/resize/recovery: reject stale visual history without altering gameplay masks.
- Init/context failures: release partial resources and retain existing Canvas recovery.

## Physical webcam acceptance — NOT RUN
Compare OLD/NEW; all six colors and three presets; narrow hair/shoulder/arm rim; face/eyes/shadows/clothing texture; bright/dark rooms and clothing; fast movement/dropout/recovery; FREE GLOW/BODYSHIFT/RUSH; reduced motion; device performance/thermal stability/rotation. All previous physical release checks remain outstanding.
