# Gameplay and interaction expansion

## Final settings

SLASH uses `u = clamp(elapsed / 45, 0, 1)` and smoothstep `s = u²(3 − 2u)`. Its spawn interval is `3.0 − 2.3s` seconds, reaching 0.7 seconds at 45 seconds. The first target appears at one second. Population limits are one before five seconds, two before ten seconds, then `min(8, 2 + floor(6s))`. At capacity it waits for cuts or expired targets, without accumulating a spawn queue. Leaving/re-entering creates a fresh scene and resets progression. Object speeds, lifetimes, forgiving recognition, camera-motion fallback, curved paths and swept collision are preserved.

FLOW dye dissipation changes from **1.8 to 0.25**. Velocity dissipation stays **2**; tracking, interpolation, splats, color and force are unchanged. The shader retains dye using `dye / (1 + dissipation × dt)`. At 60 Hz, an ideal isolated dye sample falls to 5% in approximately 1.69 seconds before and 12.01 seconds now: an estimated **10.32 additional seconds**. Actual advection and display visibility vary. Browser captures show recognizable broad S/circle shapes at ten seconds, faint at thirteen, while baseline dye is gone by ten. No geometry/history buffer was added. See [measured persistence and SLASH performance](expansion-spawn-flow.md).

LAUNCH uses an **open → closed hand** grab, matching the 6.3167-second supplied recording. Closure requires an index tip-to-wrist distance shorter than 0.95 times the index PIP-to-wrist distance, plus at least three of four fingers below that ratio, for two valid samples. Release requires at least three fingers, including index, above **1.12**, for two valid samples. Acquisition in a closed pose must open before grabbing. Rejected frames cannot transition or move a held group; loss, invalid input, source reset, hidden state and stale tracking safely drop control. Tracking remains unchanged.

The mapped grab center is the average wrist/index/middle/pinky MCP position, mirrored once. Grab radius is **1.6 world units plus each sphere's radius**, using depth-weighted proximity (`z × 0.35`) to match apparent screen distance. Up to **12 nearest active spheres** can attach; the hidden controller is excluded. Saved 3D offsets move with the group through an exponential response of **36/s**, constrained to the existing walls. Grabbed instances scale to **1.04×** for feedback while retaining creation color. The original solver handles free balls and collisions; controlled balls bypass gravity integration and do not collide with each other while held.

Release uses recent mapped hand motion with a 45 ms velocity response, converted into the existing solver's per-step units. Speed is bounded by the current `maxVelocity`: **0.15**, or **0.075** under reduced motion. Slow release is gentle; fast release throws. Loss releases with zero added throw momentum. Normal physics resumes on release.

Grab, open-hand presence and release block creation and reset its baseline. Pointing creation additionally requires two other fingertips to remain within **0.65×** the index's wrist distance, distinguishing pointing from open-hand carrying. The full recorded rapid-fire pipeline still produces **17 creations**; the new grabbing recording produces **zero accidental creations**. Its 109/189 detected frames support three safe grab starts and one explicit open-hand release; two carried gestures end in tracking loss. The first demonstrated closure and some later actions cannot be recovered without valid tracking. These figures describe replay, not live acceptance.

## Guidance

| Mode | Gesture label | Explanation |
| --- | --- | --- |
| GLOW | SHOW YOURSELF | Step into view |
| FLOW | POINT + MOVE | Draw with your finger |
| SLASH | SWIPE TO SLASH | Swipe your hand through objects |
| LAUNCH | POINT + RAPID PUSH | Fire balls |
| LAUNCH | CLOSE HAND | Grab nearby balls |
| LAUNCH | MOVE + RELEASE | Carry and throw |

Custom outline SVGs depict presence, finger movement, flat hand-edge swiping, bidirectional pushing, a closed fist and release. Text remains accessible and persistent. Interaction reduces guide opacity to 0.48; errors restore prominence. Mouse/touch fallback displays accurate pointer guidance instead of promising hand grabbing. There is no added HUD, dependency or instruction panel.

Screenshots and browser layout checks cover **1366×768**, 480×640 and 800×500. The GLOW guide is below the framed artwork and guides remain above footer controls. GLOW's renderers and camera/segmentation work are unchanged. The mobile invitation previously intercepted mode navigation; giving navigation a stacking level keeps those controls clickable.

## Verification and limitations

Unit and browser coverage includes progression/reset/cap, recorded pose classification, gesture separation, rejected frames, one/multiple/remote captures, group offsets, bounded fast/gentle release, color retention, held scale feedback, loss cleanup and actual LaunchMode state wiring. The full suites pass **65 unit tests and 38 browser tests**. Production build and `/Lumen/` verification check exact bundle identity, 12 runtime assets, actual model-worker inference, lazy LAUNCH loading, all mode guides, five viewport sizes and no production diagnostics.

Local Edge measured eight-target SLASH update/draw median/p95 **0.20/0.30 ms**. The full Ballpit performance run at 150 active spheres measured physics/input p95 about **0.20 ms**; the existing active cap remains **150**. Measurements are from headless desktop runs and do not establish low-end device or real-camera performance.

**Live physical acceptance remains pending.** No new live tester was available. Validate closed-hand capture radius, carrying attachment, ordinary release versus throw, false grabs, rapid-fire coexistence, late SLASH playability, and perceived FLOW persistence in the actual environment. Original videos and images stay local; committed reference fixtures contain only reduced hand-motion numbers.
