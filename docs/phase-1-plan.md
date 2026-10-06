# LUMEN Phase 1 implementation plan

Goal: turn the whole visible body into light, in an immersive one-page artwork.
Spec: the user's LUMEN master prompt, especially sections 37 and 40.

Architecture: React + Vite in JavaScript. A reusable webcam hook owns one invisible video and stream. A MediaPipe Image Segmenter classic worker produces whole-person segmentation masks; the render loop consumes a ref rather than React state. A WebGL effect produces luminous matter and bloom from the mask, with a Canvas 2D fallback. The future hand tracking pipeline will reuse the same video. See progress.md for actual verification and deviations from the initial checklist.

Visual direction: black/deep violet, sparse interface, central embodied light, six small color dots, deliberate negative space. Preview is labeled and uses an illustrated full-body mask, never presented as camera tracking.

- [ ] Set up React/Vite, portable Node, locally hosted fonts/model/WASM.
- [ ] Verify failing tests for aspect ratio, confidence-mask conversion, mirroring and camera errors; implement the utilities.
- [ ] Implement cancellable webcam lifecycle, permissions, loading and cleanup.
- [ ] Implement throttled off-thread segmentation; transfer masks and dispose task resources.
- [ ] Implement GLOW, six colors, reduced-motion handling and Canvas fallback.
- [ ] Add keyboard access, fullscreen, camera stop/retry and honest future-mode states.
- [ ] Run unit tests, production build and Edge browser tests (preview, camera failures, synthetic camera, resize, model failures, stop/restart and fallback).
- [ ] Document launch instructions and remaining real-camera/multiple-browser checks. Stop after Phase 1.

Constraints: no FLOW/SLASH/LAUNCH implementations; preserve the installed Codex skills; no .claude folder; no unnecessary Three.js dependency yet. No raw camera video is displayed or uploaded.
