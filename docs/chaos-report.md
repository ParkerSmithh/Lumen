# LUMEN CHAOS ENGINE

Implemented on feat/chaos-engine, based on 095d69b. No merge, push or deployment has been performed. Separate release approval is required.

## Visual and gameplay changes

CALM / WILD / MAX controls presentation independently of the six-color selection. WILD is the default. The preference persists with safe fallback when storage is unavailable. Reduced motion replaces moving sparks, orbiters and ball trails with restrained local fades.

The existing BEYOND runtime owns CHAOS effects and visual fluid commands. There is no additional rendering loop, inference model or artwork-history store. GLOW gains stronger exterior illumination, sparks and directional ribbons while retaining foreground exclusion and facial detail. FLOW gains layered strands, orbiters, completion rings, chain vortices and bounded fluid accents; its evaluator, immediate input and persistent dye behavior are unchanged. LAUNCH gains a selected subset of generation-safe moving-ball trails, collision sparks, hit waves, bonus waves and bank arcs. Visual code does not write physics arrays or create balls automatically.

PULSE and resonances share bounded CHAOS decorations without earning energy. Decorations never emit ECHOES records or CORE participation. Gallery/finale export and all BEYOND navigation remain intact.

## Meter and SURGE rules

Each mode has BUILDING ? SURGE ? COOLDOWN states. The meter reaches 100, drains to zero and starts six active seconds of SURGE, followed by eight active seconds of cooldown. Actions during SURGE/cooldown do not bank another activation.

- GLOW: four points per fresh significant coarse movement sample, capped at twelve per second. Preview and stationary noise cannot qualify.
- FLOW: three points per newly accepted 5% coverage milestone, plus twenty per accepted completion. High-water bookkeeping cannot re-award prior coverage after CLEAR.
- SLASH: eight per unique accepted destruction, with bounded bonuses for new combo crossings.
- LAUNCH: twenty-five per accepted hit; fifteen per meaningful release gesture, independent of the number of grabbed balls.

Camera interruption, pause, visibility changes and gallery suspension immediately deactivate clocks and clear live decorations. SURGE/cooldown time freezes. Mode exit clears temporary geometry and acquisition baselines; replay resets that mode. CLEAR ECHOES resets all CHAOS meters/cooldowns alongside CORE and artwork, without resetting gameplay scores or crystals.

## Approved SLASH gameplay profile

Density progresses 3 ? 6 ? 8 ? 10, with an absolute ceiling of twelve during FRACTURE STORM. Density is identical in all presentation settings. CLUSTER, ARC and CROSSFIRE use the existing scheduled spawn opportunities and validate capacity, spacing and playable-field containment.

Special probabilities, crystal rewards, the combo scoring formula, gesture detection and 120-second round remain unchanged. Splitter capacity includes reserved additional child slots. Children retain their original collision radius and two independent 100-point rewards. Placement checks nearby orientations, then a bounded grid; impossibly small fields preserve the scoring objects with the existing clamped-overlap fallback.

FRACTURE STORM lasts four active seconds, triggers at the first combo-ten crossing in a chain, and has an eight-second cooldown after it ends. OVERLOAD remains the final twenty seconds. Storm, OVERLOAD and SURGE use the strongest applicable visual amplification rather than multiplying particle counts. Storm-born crystals finish their natural lifetime after the storm; ordinary spawning waits until occupancy fits the ten-object cap.

New records use lumen.arcade.bests.chaos.v1.SLASH. Previous lumen.arcade.bests.v1.SLASH records remain separate and are displayed as legacy bests.

## Limits, cleanup and privacy

Shared transient records: 12 / 32 / 48, with at most sixteen geometry points per record. GLOW sparks: 12 / 32 / 48. FLOW orbiters: 8 / 24 / 40. SLASH particles: 96 / 256 / 320 pooled slots; fragments: 12 / 32 / 48; flashes and slash trails: twelve each. LAUNCH selects 4 / 10 / 16 ball trails with 8 / 12 / 16 points. Its slot map and wall throttle map cap at 150. Switching MAX to CALM trims all excess points.

Event deduplication sets cap at 512, FLOW progress bookkeeping at 64 shapes and pending fluid commands at four. Only intensity and versioned personal bests persist. No webcam pixels, segmentation contours or identifiable tracking histories are added to session artwork or storage. Existing ECHOES limits remain unchanged.

## Verification

182 unit tests passed. The complete 97-test browser suite passed, including original camera, gesture, tracing, physics, scoring, ECHOES and BEYOND regressions. Build passed; the existing shared Three.js chunk warning remains. An additional actual-model GLOW benchmark passed separately, bringing verified browser coverage to 98 tests. Production verification passed with zero console errors: actual FLOW/LAUNCH scoring and artwork, 2048 PNG export, pause/back/clear, game timers/results/replay, lazy assets and five viewport sizes.

Review caught and corrected child-collider changes, immediate hidden-tab clock suspension, prior-coverage farming after CLEAR, remount-safe throw identities and trail downshift limits. Visual inspection covered desktop and short mobile entry layouts, WILD/MAX active workloads and control readability.

## Performance

Fresh baseline was captured before product changes in chaos-baseline.json and chaos-tracking-baseline.json. Matched OFF / WILD / MAX runs keep the approved new SLASH density identical, isolating presentation overhead from the intentional gameplay change. Headless Edge measured sixty warmup frames, 180 measured frames per mode (360 for LAUNCH), at 1366?768.

| Mode | CPU p95 OFF / WILD / MAX | Frame p95 OFF / WILD / MAX |
|---|---:|---:|
| GLOW | 1.0 / 1.2 / 0.9 ms | 4.3 / 4.3 / 4.3 ms |
| FLOW | 0.5 / 0.5 / 0.5 ms | 4.3 / 4.3 / 4.2 ms |
| SLASH | 0.9 / 0.9 / 1.0 ms | 8.4 / 12.4 / 12.5 ms |
| LAUNCH | 0.5 / 0.6 / 0.5 ms | 4.3 / 4.3 / 4.3 ms |

Incremental p95 synchronous RAF CPU was at most 0.2 ms WILD and 0.1 ms MAX in this run, within the proposed 1 / 2 ms budgets. Negative differences reflect scheduling variation, not claimed speedups. SLASH MAX p95 frame interval was 12.5 ms, below the 16.7 ms target on this machine. The separate twelve-crystal storm/OVERLOAD/SURGE Canvas workload reached 320 particles, 48 fragments and twelve flashes, with CPU median 0.5 ms / p95 0.9 ms; reset emptied all pools. LAUNCH retained 150 finite-physics balls and entered SURGE through real accepted target hits.

The CHAOS control committed once over 120 idle frames, then once for a preference change. Meter updates use DOM refs at 4 Hz, rather than frame-by-frame React state. Actual hand-worker cadence remained within 1% of baseline; p95 capture-to-result latency rose approximately 4?8%, below the proposed 10% guard, with no backlog. This uses synthetic camera input and the real CPU worker, not a human hand.

GLOW decorative stress uses synthetic masks. A separate mounted GLOW test kept the native MediaPipe worker/model unchanged and measured forty returned masks after five warmup results per profile. Capture cadence was 66.7 ms for OFF/WILD/MAX; returned-mask cadence was 66.6 / 66.7 / 66.6 ms. Capture-to-result p95 latency was 7.8 / 8.3 / 7.8 ms, within the 10% guard. Main-thread RAF CPU p95 was 0.3 / 0.4 / 0.3 ms. Camera input was painted scenery, not a person: this verifies inference scheduling separately from synthetic-mask active-decoration stress. RAF CPU excludes asynchronous tasks, GPU completion and compositor work. Memory checks cover bounded occupancy, generation isolation, resets and repeated lifecycle regressions; hardware GPU memory is not directly measured. These results are diagnostic, not classroom-device acceptance.

## Remaining limitations

Real webcam comfort, human visual clarity and representative classroom hardware testing remain necessary. The isolated twelve-crystal overlap test forces public visual flags; mounted-mode tests separately verify actual cuts and scoring. Sparse sessions and supported hardware vary in appearance and performance. No tracking thresholds, solver accuracy or scoring were reduced to accommodate effects.
