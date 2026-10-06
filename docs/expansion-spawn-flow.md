# Earlier SLASH progression and FLOW persistence

This records the preceding expansion measurements. The current 2.0→0.4-second, 35-second SLASH curve and current verification are in [throwing and intensity tuning](throwing-intensity-report.md). FLOW retains the values measured here.

SLASH previously eases its spawn interval from 3.0 seconds to 0.7 seconds over 45 seconds using smoothstep. The first target still appears at one second. Active targets are capped at one before five seconds, two through the opening ten seconds, and progressively up to eight. Existing target speeds, lifetimes, crystal rendering, collision geometry, and curved camera sweep stay unchanged. A newly created scene starts the progression again.

FLOW uses the existing fluid dye decay with density dissipation **0.25**, down from **1.8**. Velocity dissipation remains **2**. No pointer, tracking, force, separate stroke history, or simulation changes were needed.

## Browser measurements

Reproduce with `.tools/node-v22.23.3-win-x64/node.exe scripts/measure-expansion-spawn-flow.mjs`. The script creates an isolated Vite server on an ephemeral port and closes the browser/server afterward. It mounts the real SplashCursor with FLOW's existing configuration, feeds S/circle strokes through the existing pointer consumer, and captures actual wall-clock decay. Raw data and screenshots are in `.test-artifacts/expansion-spawn-flow/`.

Environment: local headless Microsoft Edge, 1000 × 560 canvas, no camera inference. Samples were taken approximately 0.07–0.11 seconds after stroke completion and within 0.10 seconds of the requested later times. Mean brightness is luminance on a 0–255 scale over the whole canvas, downsampled to 100 × 56. Shape similarity is the normalized cosine between the initial and subsequent brightness maps; it measures spatial retention, not a recognition classifier.

| Shape | Dye decay | 0s brightness | 3s | 10s | 13s | 10s shape similarity |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| S | 1.8 baseline | 29.92 | 0.31 | 0.00 | 0.00 | 0.00 |
| S | 0.25 | 34.95 | 29.60 | 3.65 | 1.43 | 0.43 |
| Circle | 1.8 baseline | 38.51 | 0.27 | 0.00 | 0.00 | 0.00 |
| Circle | 0.25 | 45.78 | 30.67 | 3.64 | 1.43 | 0.59 |

Visual review of the screenshots shows the S's broad curved stroke and circle outline still identifiable at ten seconds; both are faint at thirteen seconds. The baseline has vanished at ten seconds. Advection still curls and shifts the dye, so this retains fluid artwork rather than freezing the original shape. Exact brightness varies with stroke speed, display, GPU, and frame cadence. The thirteen-second samples should not be represented as bright or perfectly preserved drawings.

SLASH's actual rendered population in a no-cut run was:

| Elapsed seconds | 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Targets | 0 | 2 | 2 | 3 | 4 | 5 | 6 | 7 | 7 | 8 | 8 | 8 | 8 |

After unmounting FLOW, 180 actual browser frames with eight targets measured median/p95 SLASH update-and-draw cost **0.20 / 0.30 ms**, and median/p95 frame intervals **4.20 / 4.30 ms**. A fresh scene had zero targets before one second and one at one second. The measured maximum was eight. These measurements support the provisional cap of eight on this machine; they do not establish performance with camera inference or across low-end devices. The draw measurement excludes deferred browser raster/compositing work; frame intervals include the browser's observed rendering cadence.

## Verification

`tests/slashProgression.test.js` covers eased bounded cadence and the opening/late population limits. `tests/slashPopulation.test.js` exercises real scene updates and crystal drawing, including first spawn, late density, disposal, and a fresh scene. All three targeted tests passed after expected failures against the old behavior. The isolated browser experiment completed without page errors. Full project verification is performed by the coordinating agent.
