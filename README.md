# LUMEN

An interactive artwork in body, light, and digital matter. The body becomes both subject and interface: presence becomes creation, destruction, and force.

## Four modes

| Mode | State | Interaction |
| --- | --- | --- |
| 01 - GLOW | Presence | Your full camera scene stays visible while a six-color filter illuminates your body. |
| 02 - FLOW | Creation | Your index finger releases selected-color light. |
| 03 - SLASH | Destruction | A deliberate fast hand movement cuts through luminous crystals. |
| 04 - LAUNCH | Force | Point and push forward to create one colored ball; retract to reset. Slow movement nudges it; a flick applies stronger force. |

## Enter the work

Select **Enter with camera**, allow access, and step into view. For GLOW, move back until your whole body, fits, or remain seated to see yourself and your room. For the other modes, bring your hand into view. Guidance recedes after interaction and returns after sustained tracking loss.

The modes share one camera stream. **Stop camera** releases capture; you can enter again without refreshing. GLOW intentionally displays the full live camera scene. Other modes keep camera pixels hidden. Video is processed on your device; LUMEN does not record or upload it. FLOW, SLASH, and LAUNCH offer a secondary **Mouse / touch fallback**. GLOW has an explicitly labeled illustrated preview.

## Technology

React and Vite provide the artwork shell. MediaPipe runs body segmentation and hand tracking off the main thread. GLOW uses WebGL with a Canvas fallback; FLOW uses the supplied SplashCursor fluid simulation; SLASH uses Canvas; LAUNCH uses the supplied Ballpit and Three.js. LAUNCH loads only when selected.

## Run locally

Use Node.js 22.12 or newer:

```sh
npm ci
npm run setup:assets
npm run dev
```

Open http://127.0.0.1:5173. Asset setup requires internet; afterward tracking assets are served locally. Fonts load from Google Fonts with system fallbacks. The included portable runtime can also be used through `run-lumen.ps1` where PowerShell script execution is allowed.

## Production deployment

The existing GitHub Pages workflow builds and publishes main at **/Lumen/** after installing dependencies, preparing tracking assets, and running unit tests. Dynamic chunks, workers, and tracking assets use that same deployment path.

```sh
npm test
npm run test:browser
npm run build
npm run check:production
```

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
