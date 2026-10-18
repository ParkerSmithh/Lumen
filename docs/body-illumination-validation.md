# LUMEN BODY ILLUMINATION validation

Date: 2026-10-16. Branch: `feat/body-illumination`. Baseline: deployed `9975a53e7f01f9c0d9786cea65a09285c4c82287`. Final commit SHA is supplied in the completion response. **Release HOLD; no merge, push or deployment performed. Physical-webcam acceptance remains pending.**

## Implementation

RADIANT is the default BODY BRIGHTNESS, independent of NEON/SOFT/SUPERNOVA and gameplay/CHAOS settings. NATURAL is subtle; BLAZING adds more illumination. Linear-light shadow/midtone curves, calibrated colored fill, luminance-preserving hue emphasis, local detail reinforcement and protected highlights replace the former faint tint. Very bright material retains source highlight texture. Visual-mask and gameplay-mask ownership are unchanged.

The existing WebGL bloom targets carry neutral coverage scatter in their previously unused G channel; exterior bloom stays in R with its previous calculation. Camera-dependent illumination is computed from current camera pixels on every draw, so cached mask/bloom updates cannot cause stepped camera relighting. Palette/body settings and loss opacity apply immediately in the final composite. Reduced quality retains responsive lighting and the narrow rim. Detail sampling uses camera pixels and coverage-weighted neighbors to exclude outside background.

Canvas uses native bounded SVG tone-curve/filter operations with a masked camera source, plus one <=128px emission canvas. The working subject canvas remains capped at 640x480. No new production pixel readbacks, camera streams, inference workers or animation loops were added. The existing small background meter remains; it no longer modulates subject illumination. Compact landscape ENERGY RUSH hides visual settings to reserve the HUD; selections persist and remain available in FREE GLOW.

Approved plan: [plan](plans/2026-10-16-body-illumination.md). Decisions and review fixes: [ledger](body-illumination-progress.md).

## Automated results

| Command / check | Result |
|---|---|
| `npm.cmd test` | 318 passed, 0 failed, 0 skipped |
| `npm.cmd run test:browser -- --workers=4` | 206 passed, 0 failed (3.8 minutes) |
| `npm.cmd run build` | Passed; existing shared Three.js >500 kB chunk warning |
| `LUMEN_OFFLINE_FONTS=1 npm.cmd run check:production` | Passed; 12 local assets, actual workers initialize/process frames, 0 console errors; all modes and five viewport sizes |
| `LUMEN_BODY_PROFILE=1 npx.cmd playwright test tests/browser/bodyIlluminationPerformance.spec.js --workers=1` | 1 passed; 12 sequential timing runs, 7.1 minutes |
| Highlight texture regression | Both backends passed all six palettes and all three body levels |
| Lifecycle | Existing 50 WebGL cycles plus 50 Canvas/filter DOM cycles; owned resources zero after disposal |

The first full browser run had 192 passes and seven failures. The fixed broad-detail tests retain their original mirroring/detail thresholds. One old requirement intentionally changed: instead of demanding that the subject brighten when the background darkens, the regression now requires stable subject lighting while background adaptation continues. Native Canvas step tests allow two summed RGB quantization levels between adjacent single-level inputs. No gameplay acceptance assertions were weakened.

Fresh review identified output-dependent detail radius, background leakage into detail sampling, compact HUD overlap and unpinned benchmark quality. All were addressed. The added highlight test caught flattening hidden by endpoint clipping counts; dedicated source-relative highlight contrast now protects against it. A strengthened textured resolution regression was also checked against the deliberately reintroduced wrong-radius implementation before restoring the fix.

## BEFORE / AFTER brightness

These are weighted **display RGB luma**, 0–255, on a fixed dark-clothing interior patch at NEON, not physical luminance or light flux. BEFORE is the frozen deployed TRUE NEON renderer, including its dependencies. Every value uses identical camera/mask/framing. Each tuple is NATURAL / RADIANT / BLAZING.

| Palette | WebGL BEFORE | WebGL AFTER N / R / B | Canvas BEFORE | Canvas AFTER N / R / B |
|---|---:|---:|---:|---:|
| Red | 65.3 | 83.4 / 162.3 / 171.7 | 74.2 | 82.8 / 163.0 / 172.3 |
| Orange | 77.3 | 85.4 / 163.9 / 173.5 | 86.2 | 84.9 / 163.9 / 174.1 |
| Yellow | 97.2 | 87.5 / 165.5 / 175.3 | 99.5 | 87.2 / 165.3 / 175.4 |
| Green | 99.0 | 87.3 / 165.6 / 175.4 | 99.2 | 86.5 / 165.5 / 175.3 |
| Blue | 74.2 | 84.9 / 163.4 / 173.3 | 84.7 | 84.2 / 163.3 / 173.3 |
| Purple | 69.3 | 84.1 / 162.9 / 172.7 | 80.7 | 83.9 / 163.7 / 172.5 |

NATURAL can be dimmer than the prior yellow/green overlay; the recommended RADIANT substantially exceeds it. All three AFTER levels increase monotonically. Across all tested dark/midtone scenes and exterior presets, minimum RADIANT/BEFORE factors were **1.522x WebGL** and **1.517x Canvas**; maximums were 5.218x and 4.209x in very dark inputs. The 1.5x target is a minimum, not an intensity cap. Already-bright clothing is excluded from that brightness-ratio requirement and retains detail instead.

Seven scene categories cover dark/light clothing, shadowed face, low light, three face tones and bright room. Six palettes x three exterior presets x three body presets x two backends = **756 AFTER renders**, with 252 matching BEFORE renders. All combinations passed. RADIANT interior palette channel separation is at least 25 RGB levels on the designated dark patch, preventing a merely neutral exposure boost.

| Metric across all AFTER levels / scenes / palettes / glow presets | WebGL | Canvas |
|---|---:|---:|
| Minimum facial contrast / source | 95.29% | 81.41% |
| Minimum clothing contrast / source | 115.24% | 126.41% |
| Maximum sampled interior endpoint clipping | 0% | 0% |
| Maximum sampled face endpoint clipping | 0% | 0% |
| Maximum exterior brightness difference from BEFORE | 0.073% | 0.084% |
| Minimum near-white texture contrast (source: 15 levels) | 15 | 14 |

The >=70% detail, <=2% clipping and <=5% exterior-change targets pass. Contrast above 100% reflects local detail enhancement, not additional source information. The highlighted 235/250 texture test assesses detail as well as final clipping, so mapping a clipped plateau just below 254 cannot alone pass it.

Inspected comparison sheets: [WebGL](body-illumination-comparison-webgl.png), [Canvas](body-illumination-comparison-canvas.png). They show substantially brighter colored interiors and consistent exterior glow. Hard synthetic facial boundaries show visible local detail reinforcement; real skin/noise/ringing and natural-shadow appearance require webcam evaluation. No reference-match or physical-quality claim follows from these fixtures. Full [visual measurements](body-illumination-visual-metrics.json) and [highlight measurements](body-illumination-highlights.json) are retained.

## Performance and resources

Measurements used Edge, 960x720 output, a static 320x240 synthetic camera, identical forced high quality and NEON exterior, default body settings. Three sequential runs per renderer/backend used 5 seconds warmup plus 30 seconds sampling, each with 7,200 sampled frames. Approximately 240Hz headless RAF means a fresh mask every fourth frame exercises about 60Hz, above the usual segmentation cadence. CPU times measure renderer submission; GPU times use asynchronous non-disjoint timer queries. Timer quantization can yield a zero CPU median; this does not mean zero work. These figures are not real-webcam FPS or low-end-device acceptance.

| Backend / statistic | BEFORE range, ms | AFTER range, ms | Largest paired increase, ms | Added-cost budget, ms |
|---|---:|---:|---:|---:|
| WebGL CPU p95 | 0.500–0.600 | 0.500–0.600 | 0.000 | 0.500 |
| WebGL GPU p95 | 0.052736–0.056384 | 0.049088–0.063520 | 0.008128 | 0.500 |
| WebGL GPU median | 0.009216–0.009344 | 0.016992–0.017056 | 0.007840 | — |
| Canvas CPU p95 | 1.600–1.700 | 1.600–1.800 | 0.200 | 2.000 |

All measured added-cost budgets pass. Canvas GPU duration is unavailable. RAF p95 stayed approximately 4.3 ms in these synthetic runs. See [raw timing data](body-illumination-performance.json) and [paired budget calculations](body-illumination-budget.json). Concurrent full-suite timing output is diagnostic only; budget claims use the isolated matched-quality runs.

WebGL remains at **9 textures, 7 framebuffers, 3 programs, 6 shaders and 1 buffer**, with nine lifetime texture allocations per renderer. Auxiliary mask/target storage at the tested mask dimensions is **1,130,496 bytes (1.08 MiB)**, unchanged. All tracked object counts and owned visual/target storage reach zero on disposal. Counts include camera textures; auxiliary byte estimates exclude the camera texture, browser default framebuffer and driver overhead.

Canvas changes from **7 to 8 renderer canvases**, plus the existing 24x18 ambient-meter canvas in each implementation. The emission canvas is 128x96 at this input, adding **49,152 bytes (48 KiB)**. Renderer target estimates rise from 2,214,912 to 2,264,064 bytes. The owned filter tree contains **21 DOM nodes**. Fifty lifecycle cycles confirmed one active filter root, zero after each dispose, stable target-byte peaks and zero renderer canvases/visual storage after disposal. See [Canvas lifecycle evidence](body-illumination-canvas-lifecycle.json). Native SVG/filter intermediate memory is browser-managed and not measured by these logical counters; driver VRAM and total-heap cleanup are not claimed.

## Remaining acceptance and limits

No measured numeric budget was missed. Physical-webcam appearance, sensor-noise amplification, real camera latency/cadence, thermal/battery behavior, low-end-device performance and Safari/Firefox Canvas filter compatibility are **NOT RUN**. Verification was on Edge. Canvas is a bounded approximation; it does not promise pixel parity with WebGL. Local detail enhancement and highlight transitions need real-person review, especially shadowed faces and dark clothing during motion.

All previously outstanding physical checks remain unchanged. The additional [BODY ILLUMINATION webcam checklist](body-illumination-webcam-acceptance.md) remains entirely NOT RUN. Release stays HOLD pending separate user decisions; this work does not authorize merging or deployment.
