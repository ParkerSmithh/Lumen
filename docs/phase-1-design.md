# LUMEN Phase 1 design

Scope: implement foundation and GLOW only, following the supplied master prompt. Preserve the existing JavaScript React/Vite entry point, configuration, launcher and tests. The current src directory contains no implementation files and package.json declares no dependencies.

## Architecture

Use React and Vite with a reusable webcam hook owning one hidden video element and one stream. Start capture only after the viewer selects Enter. Stop and unmount release every media track. Handle denied permission, missing or busy cameras, insecure contexts, interrupted capture and pending initialization.

Use MediaPipe Image Segmenter with its general selfie segmentation model to obtain a confidence mask for the whole visible person. This follows the user's approval to prioritize silhouette quality over PoseLandmarker. Run inference in a classic worker, throttle input and allow only one pending frame. Transfer results into mutable rendering state instead of updating React every frame. Preserve the input aspect ratio and mirror the mask consistently. Hide stale masks when tracking is lost. Locally serve the model and WASM assets.

Render the mask as filled luminous matter against black, with soft bloom and restrained internal variation. Prefer WebGL; provide a Canvas fallback. Never render camera pixels. Cap resolution and inference frequency for responsiveness. Dispose workers, frames, model resources, graphics contexts and animation callbacks.

## Experience

Keep a small LUMEN title, secondary mode selector, full-screen artwork and six labeled color dots: red, orange, yellow, green, blue and purple. GLOW is active; FLOW, SLASH and LAUNCH indicate future phases and do not pretend to work. Camera status and retry guidance remain subtle but readable. Keyboard controls, visible focus, responsive layout and reduced-motion settings are supported.

An optional explicitly labeled preview may illustrate the effect without a camera; it must never be described as tracking. The live result transforms the entire visible body, including feet when within the camera frame. Instructions explain that the viewer must step back far enough to fit.

## Alternatives considered

Recommended: pose segmentation, which supplies both person detection and a whole-person mask and provides useful foundations for later tracking. A dedicated image segmenter is simpler but does not provide pose information. A raw-video filter is unsuitable because it does not isolate or transform the body.

## Verification

Retain existing unit tests for aspect-preserving fit, mask confidence conversion, mirroring and camera errors. Run the production build and browser checks for startup, color selection, keyboard use, resizing, preview labeling, denied capture, missing model, fallback rendering and stream cleanup. Use synthetic frames to test the pipeline where feasible. Report real-camera accuracy and any unavailable browser checks explicitly; automated checks cannot prove the artistic quality of live body tracking.

## Dependencies and next phase

Add React, React DOM, Vite, its React plugin and MediaPipe Tasks Vision; use Playwright for browser verification. No Three.js is needed in Phase 1. Stop after GLOW is verified. FLOW later requires the supplied SplashCursor source, and LAUNCH requires the supplied Ballpit source; neither component appears in the current project or attachment.
