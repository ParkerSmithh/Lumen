# Throwing and intensity tuning

LAUNCH retains the supplied Ballpit solver, fixed at 60 Hz. Every active created sphere is integrated, collides with other spheres and the container, receives gravity, and responds to nudges/flicks. Only held spheres bypass free integration; they return to that same solver immediately upon release. No replacement engine or static sphere layer was added.

## Final physics values

| Setting | Value |
| --- | --- |
| Simulation cadence | 60 Hz fixed step; accumulator capped at 50 ms |
| Gravity configuration | 0.01; 0.004 with reduced motion; existing size-scaled solver units |
| Friction/damping | 0.9975 per step (~0.861 velocity retention per second without other forces) |
| Wall bounce | 0.95 velocity restitution |
| Final velocity ceiling | 0.15 world units/step (9 units/s); reduced motion 0.075 (4.5 units/s) |
| Throw history | Most recent 120 ms of mapped palm samples |
| Noise handling | Segment velocities capped at 0.3 before component medians; segments shorter than 12 ms ignored |
| Throw gain | 1.6× before final velocity clamp |
| Cluster variation | Outward radial 6% of shared release speed, then individually clamped |
| Carry response | Exponential 36/s, saved 3D relative offsets |
| Grab radius | 1.6 + sphere radius, depth weighted by 0.35 |
| Grab cap | 12 nearest spheres |
| Active population cap | 150 created spheres; existing slot recycling retained |
| Creation velocity | 0.10–0.145 depth units/step, small 8% upward component, vector clamped; reduced-motion attenuation retained |
| Sphere radii/depth | 0.25–0.55; depth boundaries ±3 |

Release derives momentum from several recent samples rather than the final tracking frame. An isolated high spike plus its return cannot dictate the median when three or more usable segments exist. Short histories still receive bounded momentum. Stationary history clears the throw; gaps exceeding 250 ms discard history. Tracking loss/context loss/visibility loss releases without added throw momentum. Normal pointing/push recognition remains unchanged.

Left/right/top/bottom walls now apply regardless of gravity, along with both depth walls. Penetrating spheres are clamped inside the boundary and their velocity points inward, avoiding an accidental outward reflection when collision separation pushes an already inward-moving sphere into a wall.

Custom SVG guidance teaches POINT + RAPID PUSH / Fire balls, CLOSE HAND / Grab nearby balls, and MOVE + RELEASE / Throw balls. The THROW symbol depicts a closed hand, movement arrow, open hand, and moving ball. GLOW code and FLOW tracking are unchanged. FLOW keeps density dissipation 0.25 and velocity dissipation 2: the preceding approved change provides approximately 10.32 additional seconds to idealized 5% dye intensity compared with density dissipation 1.8.

The original solver CPU benchmark, with production radii and physics settings, uses 30 warmup steps and 600 measured 60 Hz steps per population. At 150 balls, median/p95 are **0.20/0.30 ms**; at 200, p95 is **0.50 ms**. It excludes rendering and camera/input mapping. Raw records are in [solver measurements](tuning-measurements/throwing-solver-performance.json) and [SLASH measurements](tuning-measurements/slash-intensity.json).

## SLASH progression

With `u = clamp(elapsed / 35, 0, 1)` and `s = u²(3 − 2u)`, the interval is `2.0 − 1.6s` seconds, bounded at 0.4 seconds. The first object appears at one second. Progression uses elapsed time independently of the capped 40 ms animation step, so slower rendering does not stretch the 35-second ramp. Visibility changes reset the frame clock to exclude time spent hidden. Caps are one before three seconds, two before seven seconds, then `min(8, 2 + floor(6s))`. There is no accumulated spawn queue; re-entering creates a fresh scene.

| Elapsed | Interval | Population cap |
| --- | ---: | ---: |
| 0 s | 2.000 s | 1 |
| 10 s | 1.683 s | 3 |
| 20 s | 1.030 s | 5 |
| 30 s | 0.489 s | 7 |
| 35+ s | 0.400 s | 8 |

Camera-motion fallback, curved paths, swept/forgiving collision, reacquisition protection, target movement and lifetimes are unchanged. Continuous-cut tests verify the minimum interval. A headless 1000×560 Chromium run reached 3/5/7/8 objects at 10/20/30/40 seconds; a curved camera-motion swept path cut all eight peak targets. Update/draw CPU measured 0.30 ms median and 0.70 ms p95 (excluding deferred raster/GPU work and real camera inference). The eight-object cap is retained to prioritize responsiveness and visual clarity.

## Verification

The production build passes. Local `/Lumen/` verification passes with the explicitly reported `referenceClock: true` and `offlineFonts: true` options: exact entry-bundle identity, all 12 runtime assets, actual segmentation and hand-worker inference, deferred LAUNCH loading, all four gesture guides, five viewport sizes, and zero console errors. The runner exercises the supported system-font fallback because its browser does not trust the cloud proxy certificate for Google Fonts; TLS verification is retained. These runner options do not alter the shipped artwork.

Unit verification passes all 69 individual cases. All 40 functional/CPU browser cases pass across the full run and targeted retries. The separate fully rendered Ballpit performance case times out even with a 300-second budget on the software GPU; this remains an environment limitation requiring target-GPU validation, and is not reported as a pass. The initial complete 40-case run passed 33 cases; longer lifecycle budgets, coherent fixture clocks, and polling the rendered emitter resolved the functional failures. One additional CPU-only solver benchmark brings the final exercised case count to 41. The runner supports installed Chromium through LUMEN_BROWSER_EXECUTABLE while retaining Edge as its default. This cloud machine uses Chromium 151.0.7922.173 on Debian 13 with software rendering; launch arguments and longer assertion waits are selected only for the verification command, not for the artwork. The default production mouse sweep cannot qualify reliably on this software GPU and fails its cut assertion. Optional `LUMEN_REFERENCE_CLOCK=1` verifies production gesture/asset/layout wiring with a coherent fixture cadence; it does not establish live performance. Gesture fixtures use coherent render clocks so GPU stalls do not redefine their input cadence. Real model inference, lifecycle and performance measurements retain wall-clock timing.

The real CPU-worker cadence measurement in this cloud renderer was approximately 1.9 Hz, with roughly 0.49-second median inference; those samples exceeded the existing 250 ms freshness threshold. This does not establish target-device tracking performance. The reference-fixture clocks validate input wiring without relaxing production freshness or recognition thresholds.

Live physical validation remains required for palm attachment, slow/fast throw feel and direction, multi-ball spread, creation/grab transitions, rapid-fire comfort, peak SLASH camera responsiveness, late-stage readability, FLOW perceived persistence, and performance on target hardware. Synthetic/reference replay and desktop software rendering cannot establish those experiences.
