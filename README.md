# LUMEN — Phase 1

An interactive experiment in body, light, and digital matter. GLOW turns the camera's person segmentation into layered luminous matter, internal light and soft bloom. Raw webcam pixels are never displayed.

## Run

With Node 22.12 or newer:

```sh
npm install
npm run setup:assets
npm run dev
```

Open http://127.0.0.1:5173. This folder also includes a portable Node runtime; `./run-lumen.ps1` uses it. First-time asset setup needs internet; thereafter the model, worker and WASM are served locally. Fonts are downloaded from Google Fonts with system fallbacks.

Select **Enter with camera**, allow access, and step back until your entire body—including feet—fits in the camera frame. Use even lighting and a background distinct from your clothing. Six color dots change emission; each is keyboard accessible and labeled. **Stop camera** releases capture. The explicitly labeled illustrated preview shows the light treatment without tracking. FLOW, SLASH and LAUNCH are disabled future phases.

Camera capture requires localhost or HTTPS. Denied, missing, busy and disconnected cameras show guidance. A tracking failure offers a retry. Camera frames are processed on your device in a worker; the application does not upload or record them. One stream and hidden video are owned by `useWebcam`, ready to be reused by later modes.

## Implementation

- `src/App.jsx`, `src/styles.css`: minimal artwork shell and controls.
- `src/hooks/useWebcam.js`: capture, cancellation and stream cleanup.
- `src/hooks/useBodyTracking.js`, `public/segmentation.worker.js`: throttled MediaPipe person segmentation; no pose prerequisite.
- `src/modes/GlowMode.jsx`, `src/effects/glowRenderer.js`: mirrored aspect-preserving rendering, emission, highlights and bloom; Canvas fallback.
- `scripts/setup-assets.mjs`: locally hosted model and runtime preparation.

Dependencies: React, React DOM, MediaPipe Tasks Vision; development uses Vite, its React plugin and Playwright. Exact versions are in package.json and package-lock.json. No Three.js or other modes are implemented.

## Verification

```sh
npm test
npm run build
npm run test:browser
```

The tests cover geometry/mask utilities, six color controls, responsive layout, camera denial, late permission cancellation, Canvas fallback, and actual model initialization/inference. Edge is required by the browser configuration. With the dev server running, `node scripts/check-camera.mjs` attempts physical camera capture and stops it afterward; it saves only the rendered artwork screenshot.

Physical camera verification opened a 640×480 stream, initialized tracking and confirmed stream release. No person was detected during that unattended check, so live silhouette quality, foot separation, fast movement and performance with a person remain unverified. Only Edge was checked; other browsers and devices need hands-on testing. The lightweight segmentation model can misclassify dim scenes, small distant bodies or backgrounds similar to clothing. GPU rendering cost is capped; inference runs at up to roughly 15 FPS independently of rendering.

Next: test GLOW with a viewer in a well-lit full-body frame, then integrate the supplied SplashCursor source for Phase 2 after Phase 1 acceptance.
