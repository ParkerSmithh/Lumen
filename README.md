# LUMEN

An interactive artwork in body, light, and digital matter. The body becomes both subject and interface: presence becomes creation, destruction, and force.

## Four modes

| Mode | State | Interaction |
| --- | --- | --- |
| 01 - GLOW | Presence | Your full camera scene stays visible while a six-color filter illuminates your body. |
| 02 - FLOW | Creation | LIGHT TRACE: follow normalized glowing paths during a 90-second round; fluid trails linger. |
| 03 - SLASH | Destruction | Start a two-minute session, slash luminous crystals as intensity rises, then review your count and play again. |
| 04 - LAUNCH | Force | KINETIC: a two-minute target challenge. Point and rapidly push to fire colored balls. Close your hand near balls to grab a cluster, move to carry it, then open to throw. Balls retain gravity, collisions and wall bounce; slow movement nudges and flicks apply stronger force. |

## Enter the work

Select **ENABLE CAMERA** from any mode, allow access, and step into view. For GLOW, move back until your whole body, fits, or remain seated to see yourself and your room. For the other modes, bring your hand into view. Guidance recedes after interaction and returns after sustained tracking loss.

The modes share one camera stream. **Stop camera** releases capture; you can enter again without refreshing. GLOW intentionally displays the full live camera scene. Other modes show a compact webcam preview. Video is processed on your device; LUMEN does not record or upload it. FLOW, SLASH, and LAUNCH offer a secondary **Mouse / touch fallback**. In KINETIC, click/tap empty space to fire; hold and drag an existing ball, then release to throw. GLOW has an explicitly labeled illustrated preview.

## Technology

FLOW, SLASH, and LAUNCH open at **START** and share a monotonic countdown and pause/resume clock. FLOW lasts 90 seconds; SLASH and LAUNCH last 120 seconds. Leaving a game resets it to READY. LIGHT TRACE counts only fresh ordered movement, with accuracy measured from distance to the guide. KINETIC uses stationary Three.js targets and swept ball collisions; existing overlaps are excluded until balls leave the target.

SLASH opens at **START**, counts down **3–2–1**, then runs for **2:00**. Every destroyed object counts once, including multiple objects in one swipe. **PLAY AGAIN** clears the scene and restarts the countdown. Leaving SLASH resets the session. A hidden tab or interrupted camera pauses the clock; restore input and select **RESUME**. Missed hand detections alone do not pause camera-motion interaction.

The game controller owns elapsed time and progression; Canvas owns objects, collision and effects. Intensity uses smooth spawn-interval anchors of 1.8 / 1.2 / 0.8 / 0.45 / 0.35 seconds, and active caps of 3 / 5 / 7 / 8 / 8 at 0 / 30 / 60 / 90 / 120 seconds. These are measured initial limits, with live physical tuning still required. See [SLASH game verification](docs/slash-game-v1-report.md).

React and Vite provide the artwork shell. MediaPipe runs body segmentation and hand tracking off the main thread. GLOW uses WebGL with a Canvas fallback; FLOW uses the supplied SplashCursor fluid simulation; SLASH uses Canvas; LAUNCH uses the supplied Ballpit and Three.js. LAUNCH loads only when selected.

## Run locally

Use Node.js 22.12 or newer:

```sh
npm ci
npm run setup:assets
npm run dev
```

Browser checks default to Edge. Linux/cloud runners can set `LUMEN_BROWSER_EXECUTABLE` to an installed Chromium path; optional `LUMEN_BROWSER_ARGS` is a JSON array of launch arguments. `LUMEN_TEST_TIMEOUT` and `LUMEN_EXPECT_TIMEOUT` can accommodate slower verification machines without changing the defaults. `LUMEN_REFERENCE_CLOCK=1` lets production verification replay gestures at a consistent render cadence on software GPU workers; target-device timing still needs validation. `LUMEN_OFFLINE_FONTS=1` verifies the documented system-font fallback when optional external fonts cannot load in the runner.

Open http://127.0.0.1:5173. Asset setup requires internet; afterward tracking assets are served locally. Fonts load from Google Fonts with system fallbacks. The included portable runtime can also be used through `run-lumen.ps1` where PowerShell script execution is allowed.

## Production deployment

The existing GitHub Pages workflow builds and publishes main at **/Lumen/** after installing dependencies, preparing tracking assets, and running unit tests. Dynamic chunks, workers, and tracking assets use that same deployment path.

```sh
npm test
npm run test:browser
npm run build
npm run check:production
```

FLOW, SLASH, and LAUNCH show a compact, mirrored webcam preview in the top-left corner while the camera is running, so you can check your hand position. The preview uses the existing tracking feed and disappears when you stop the camera.

The production check owns and closes its local preview server. To verify the published build, pass its URL:

```sh
npm run check:production -- https://parkersmithh.github.io/Lumen/
```

The browser suite owns Vite through its API and closes it after the run, including on Windows. Test screenshots and logs are kept locally in `.test-artifacts/`.

## Browser and camera requirements

Camera capture requires HTTPS or localhost and browser permission. Use an up-to-date browser, even lighting, and a background distinct from clothing. FLOW and LAUNCH require suitable WebGL support; other modes remain available when rendering or tracking fails. Controls support keyboard focus and activation. Reduced motion removes interface fades and retains existing renderer accommodations.

## Known limitations

Automated checks verify rendering, input math, recovery, cleanup, and production loading. They cannot establish how the artwork feels with a real body or hand. Physical alignment, gesture comfort, and live tracking performance require hands-on testing. Dim scenes, occlusion, distant bodies, and very fast motion can reduce detection quality. Edge is the verified browser; other browsers and devices require manual testing. The deferred Three.js chunk remains large, and LAUNCH physics cost increases with sphere count. A failed LAUNCH download offers **Reload artwork**, because browsers can retain a failed import until the page reloads; other modes remain available.

The repair build was physically tested: full-camera GLOW and body color work, but luminosity and movement needed further tuning. The [physical tuning pass](docs/physical-tuning-report.md) is implemented and awaits another real-person test. The project remains unfrozen. Engineering history and verification records live in [docs](docs/), including [implementation history](docs/implementation-history.md) and the Phase 5 progress record.

## Arcade Evolution development update

FLOW adds movement-based quality, chains, SKIP and eight shapes. SLASH adds combos, bonus/splitting crystals and the final twenty-second OVERLOAD. LAUNCH adds moving targets, timed bonuses and wall-bank scoring. Completed rounds retain local personal bests; storage denial safely falls back to memory. Durations remain 90/120/120 seconds. See [final rules and verification](docs/arcade-evolution-report.md). This update requires separate release approval.
