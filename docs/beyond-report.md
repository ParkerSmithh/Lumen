# LUMEN BEYOND implementation

Development branch: feat/beyond. Base: d97c11504a902c827d37b12c1f992c062f2029d9. Separate release approval required; no merge, push or deployment performed.

## Implemented

The existing ECHOES session owns BEYOND participation, bounded transient atmosphere/PULSE/resonance effects, and the suspension gate. Accepted gameplay remains authoritative. Living atmospheres use GLOW coarse presence summaries, FLOW accepted motion, SLASH accepted destruction, and LAUNCH projected meaningful wall bounces/hits. Effects use existing canvases and FLOW fluid infrastructure.

Manual PULSE uses the P key or button. Automatic recognition is enabled only in SLASH, with fresh distinct samples, deliberate neutral rearming, stable open hand for 1.2 seconds, and a three-second cooldown. GLOW has no added hand inference. FLOW and LAUNCH automatic recognition are disabled because existing drawing and grab/release gestures conflict; manual activation retains strict activity guards. PULSE never emits an artwork record, awards points, advances coverage or applies physics forces.

Resonances observe sustained GLOW movement, accepted FLOW accuracy >=95%, first SLASH combo-10 crossing per chain, and accepted LAUNCH bank hits. CORE records participation once per mode; GLOW requires sustained fresh segmentation plus movement and excludes illustrated previews.

CORE completion offers optional CONVERGENCE. Its four phases last 20 seconds, use actual ECHOES geometry/colors, and select at most 16 records per mode (64 total, 4096 points). Navigation retains the existing suspension gate across gallery-to-finale transitions; returning leaves interrupted rounds paused. Hidden tabs require intentional animation resume. Reduced motion shows the final composition immediately. Signature export reuses the 2048-square artwork-only PNG pipeline, cancellation and URL cleanup.

CLEAR ECHOES explicitly confirms artwork plus CORE reset and clears BEYOND cooldowns. Data is memory-only and reset on reload. No raw webcam frames, body contours or landmark histories are retained. The existing 256-record/64-per-mode/64-point ECHOES limits remain; transient atmospheres cap at four per mode, resonances at two, PULSE at one, and deduplication at 512 IDs.

## Performance measurement

Isolated benchmark: headless Edge, 1366x768, 60 warmup frames and 180 measured frames per enabled/disabled mode pair. The mounted renderers and existing gameplay systems were exercised: synthetic GLOW camera/masks, actual FLOW pointer/fluid, SLASH Overload with eight crystals and real cuts over GridScan, LAUNCH with 150 finite-physics balls. Enabled cases include actual manual PULSE.

| Mode | Aggregate RAF CPU median off/on | CPU p95 off/on |
|---|---:|---:|
| GLOW | 0.2 / 0.2 ms | 0.6 / 0.7 ms |
| FLOW | 0.1 / 0.1 ms | 0.3 / 0.4 ms |
| SLASH | 0.3 / 0.3 ms | 0.4 / 0.5 ms |
| LAUNCH | 0.1 / 0.1 ms | 0.3 / 0.3 ms |

Native frame intervals were median 4.2 ms / p95 4.3 ms for all pairs, with no measurable median delta. Clock resolution is approximately 0.1 ms. These are diagnostic measurements, not causal hardware acceptance: masks exclude neural inference; synchronous RAF CPU excludes async/GPU completion and compositor work. No real human webcam or visual acceptance testing was performed. The full-suite repeat measured CPU median/p95 off/on: GLOW 0.4/1.0 versus 0.4/1.0 ms; FLOW 0.2/0.5 versus 0.2/0.5 ms; SLASH 0.5/0.7 versus 0.5/0.7 ms; LAUNCH 0.2/0.5 versus 0.1/0.4 ms. Scheduling variation explains differences between runs; no causal speedup is claimed. Benchmark source is tests/browser/beyondPerformance.spec.js; the full-suite measurement is preserved in docs/beyond-performance.json.

## Validation

All 160 unit tests and 90 browser tests pass. Production build and check:production pass. Production checks verified actual FLOW/LAUNCH artwork, 2048 PNG, pause/back/clear, game scoring/timers/replay, lazy assets and five viewport sizes with zero console errors. Existing Three.js chunk warning remains. Unit tests cover fresh tracking/conflicts/rearming, accepted-event dedup, CORE/reset, resonance cooldowns, bounded memory and deterministic timeline/composition. Browser integration uses actual accepted interactions to unlock CORE and checks manual PULSE, gallery/finale suspension, physics freeze, hidden-tab resume, skip, reduced motion, reload reset and 2048 PNG output. Existing ECHOES regressions now exercise the approved explicit reset confirmation.

## Remaining limitations

Real webcam calibration and human visual acceptance are required, especially SLASH automatic PULSE and sustained GLOW movement. Automatic PULSE in FLOW/LAUNCH is intentionally disabled. Existing shared Three.js bundle warning remains. Artwork complexity reflects captured interaction density; sparse sessions produce sparse compositions.
