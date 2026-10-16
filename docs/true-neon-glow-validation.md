# TRUE NEON GLOW validation and release report

Report date: October 16, 2026 (America/Chicago). Baseline: `2a9c6d8e564c1c18c20f257e6eb817665c5d99bf`. Initial implementation commit: `c694868bab8d593af7e316552af08b4c0a78e116`; subsequent release work includes the mobile control layout fix, fractional-confidence Canvas rim correction, and these measurements. Feature branch: `feat/true-neon-glow`. The final release SHA is reported with deployment evidence in the release response.

## Result and authorization

TRUE NEON uses a private visual confidence mask, narrow emissive rim, three GPU bloom scales, selective subject lighting and background contrast. NEON is the recommended default; SOFT and SUPERNOVA are independent of CHAOS. Existing camera, worker and animation-loop ownership remain in place. Gameplay receives the original segmentation mask; grid equality tests and existing gameplay suites pass.

The user subsequently explicitly requested “merge push commit deploy”. That authorizes release operations after automated verification. Physical acceptance remains incomplete; historical HOLD reports are unchanged and none of their physical checks were marked PASS.

## Exact automated results

| Command | Result |
|---|---|
| `npm.cmd test` | Exit 0; 315 passed, 0 failed |
| `npm.cmd run test:browser -- --workers=4` | Exit 0; 188 passed, 0 failed |
| Additional compact landscape regression, 667×375 | Exit 0; 1 passed |
| `npm.cmd run build` | Exit 0; existing shared Three.js chunk-size warning retained |
| `$env:LUMEN_OFFLINE_FONTS='1'; npm.cmd run check:production` | Exit 0; 12 assets, real worker initialization, 0 console errors |
| `$env:LUMEN_NEON_PROFILE='1'; npx.cmd playwright test tests/browser/neonGlowPerformance.spec.js --workers=1` | Exit 0; 2 passed; 17.0 minutes |
| Canvas-only isolated recheck after confidence correction | Exit 0; 1 passed; three 5s/30s timing runs |

The earlier serial full run passed 182 tests before the responsive regression additions; the next full run passed 186. An initial concurrent run had 174 passes and one SLASH frame-motion failure; the unchanged SLASH test passed on isolated rerun and subsequent full runs. No existing assertions were weakened. A mobile overlap found in screenshot review was reproduced with a failing bounding-box check and fixed; five portrait/landscape sizes are covered. An encoding-only whitespace-cleanup mistake was discarded by restoring the exact committed UTF-8 source bytes before release verification. A late confidence-plateau check caught alpha-union/product masquerading as a Canvas rim; true min/max extraction now writes into reusable RGBA storage and has unit and browser regressions. Canvas timing was measured again after that correction; WebGL behavior and soak results are unchanged.

## Timing measurements

Three sequential runs per renderer/backend: five-second warmup and thirty-second sample, 960×720 output. Sample counts ranged 7,200–7,200 frames per run. RAF scheduled at approximately 240 Hz on this host; fresh synthetic masks every fourth frame therefore exercise approximately 60 updates/second, rather than the production segmentation cadence. Camera imagery is synthetic/static. CPU values time renderer submission, not GPU completion. WebGL GPU values use asynchronous non-disjoint EXT_disjoint_timer_query samples; no synchronous gl.finish/readPixels timing is used.

| Renderer | CPU p95 range, ms | GPU p95 range, ms |
|---|---:|---:|
| OLD WebGL | 1.400–1.500 | 0.050–0.102 |
| OLD Canvas | 1.400–1.500 | Unavailable |
| NEON WebGL | 0.500–0.500 | 0.051–0.055 |
| NEON Canvas | 1.500–1.500 | Unavailable |

WebGL visual-mask preparation p95 was 0.500 ms in all three runs. Legacy and Canvas per-mask preparation were not separately instrumented; their CPU renderer timings include that work. Canvas GPU timing is unavailable. Browser RAF interval p95 was approximately 4.3 ms; this is scheduling evidence, not physical camera/display FPS.

Mounted OLD/NEW FREE GLOW and ENERGY RUSH comparisons used the actual segmentation worker/model and synthetic camera, with forty returned masks after warmup at each CALM/WILD/MAX setting. Maximum absolute median cadence change was 0.301%; maximum synchronous RAF p95 increase was 0.100 ms. These comparisons measure scheduling, not real-person segmentation quality. Supplemental pose was off.

| Budget | Measured result on this host |
|---|---|
| NEON WebGL CPU p95 ≤4 ms | 0.500 ms |
| Canvas renderer CPU p95 ≤4 ms | 1.500 ms |
| Visual-mask preparation p95 ≤2 ms | 0.500 ms, WebGL instrumentation |
| WebGL GPU p95 ≤6 ms | Maximum 0.055 ms |
| Mounted RAF p95 increase ≤3 ms | 0.100 ms |
| Median segmentation cadence degradation ≤10% | Absolute change ≤0.301% |
| Canvas fallback RAF interval p95 ≤33.3 ms | Approximately 4.3 ms on this host; low-end-device acceptance NOT RUN |
| Auxiliary GPU texture storage ≤4 MiB | 1,130,496 bytes (1.08 MiB) at the tested mask size |

No measured numeric budget was exceeded. Unavailable/unmet measurement coverage: separate Canvas GPU/per-mask timings, actual driver VRAM usage, physical-webcam latency/FPS, low-end-device and thermal/battery acceptance. Logical texture bytes are estimates from allocated dimensions; allocation object counts are tracked directly. Available hardware and browser versions are in [environment data](true-neon-glow-environment.json); listed adapters do not identify the active WebGL adapter.

## Resources and sustained rendering

OLD WebGL allocated two textures, no framebuffer attachments, one program, two shaders and one buffer. TRUE NEON allocates nine textures, seven framebuffer attachments, three programs, six shaders and one buffer. Neutral bloom caches are reused: palette/intensity strength/fade compose every draw; mask, geometry, radius, and quality changes refresh derived buffers. Quality reduction retains the original rim resolution. Canvas uses bounded mask processing and ≤128-pixel bloom buffers, updating cached bloom at ≤30 Hz; its default low tier uses two halo buffers plus the narrow rim, while reduced motion also disables modulation.

The sustained run lasted 600.001 seconds and rendered 144,003 frames with fresh masks and repeated preset changes. 599 resource snapshots and fifty create/draw/dispose cycles showed fixed allocation counts, bounded target storage and zero tracked textures/framebuffers/programs/shaders/buffers/visual storage after disposal. Sampled total JavaScript heap ranged 13.11–32.45 MiB with garbage collection; it is not claimed to be zero or a leak-proof total-heap plateau. The counters support the GPU-resource plateau claim.

See [full timing data](true-neon-glow-performance.json), [mounted comparisons](true-neon-glow-mounted-performance.json), and [soak samples](true-neon-glow-soak.json).

## Visual comparisons

All six palettes × three intensity presets were inspected on WebGL and Canvas. Synthetic fixtures exercise hair, raised arms, dark/light clothing, bright/dark backgrounds, partial visibility, rapid displacement, confidence noise, loss and reacquisition. Metrics retain at least 70% of source facial/clothing luminance contrast and limit newly clipped interior patches to 2%; all combinations passed. Exterior brightness below compares the fixed outside-body patch; it is not a physical light-flux measurement.

| Backend | NEON exterior brightness versus OLD | Minimum face contrast retained, all presets | Minimum clothing contrast retained | Clipped interior patch |
|---|---:|---:|---:|---:|
| webgl | 2.110–2.148× | 74.7% | 79.2% | 0.0% |
| canvas | 2.638–2.751× | 71.5% | 71.8% | 0.0% |

Comparison sheets show a substantially brighter narrow rim and exterior halo, with deeper subject texture than the old tint. Low-tier bloom is visibly less smooth than full quality on the small synthetic fixture. These observations do not establish reference parity or real-webcam edge quality. The reference image itself was not available in this session; the written artistic target was used.

Reproduce with `npx.cmd playwright test tests/browser/neonGlowVisual.spec.js tests/browser/neonGlowRenderer.spec.js`. Outputs: `.test-artifacts/neon-comparison-{webgl,canvas}.png`, `neon-difficult-{webgl,canvas}.png`, and `neon-controls-<width>x<height>.png`. The preserved legacy renderer and scene generator live under tests/fixtures and are not production entry points. [Visual metrics](true-neon-glow-visual-metrics.json) retain the numeric evidence.

## Remaining physical acceptance

All 38 existing real-device checks remain NOT RUN, alongside the fourteen entries in [the neon webcam checklist](true-neon-glow-webcam-acceptance.md). Real people must evaluate glow strength, edge quality, facial visibility, tracking stability, physical performance and thermal behavior. No reference-parity claim is made. The user's release authorization changes the merge/deploy restriction; it does not complete physical acceptance.
