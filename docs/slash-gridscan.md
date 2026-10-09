# SLASH GridScan background

Combined development branch: feat/flow-repair-slash-gridscan. Includes the committed FLOW completion repair 49d7796; release approval remains separate.

Adapted the user-supplied React Bits GridScan shader for LUMEN's full-screen SLASH stage. Parameters match the supplied request: sensitivity 0.55, lineThickness 1, linesColor #2F293A, gridScale 0.1, scanColor #FF9FFC, scanOpacity 0.4, post effects enabled, bloomIntensity 0.6, chromaticAberration 0.002, noiseIntensity 0.01, lineJitter 0.1, scanGlow 0.5, scanSoftness 2. Webcam and preview stay disabled.

The background is lazy-loaded behind the transparent crystal Canvas and has pointer-events:none. The existing collision, gesture, combo, clock, scoring and echo systems are unchanged. No face-api dependency, remote face-model downloads, webcam calls or gyroscope permissions are present. One pinned dependency was added: postprocessing 6.39.5, whose peer range supports the existing Three 0.186.1.

Adapters: current Three automatically converts hexadecimal sRGB inputs, so the source's additional conversion was removed; otherwise it darkens the requested colors twice. New render buffers are capped 1280?900. Reduced motion draws a stationary grid without jitter, noise or chromatic animation. Game pause, document visibility and the synchronous ECHOES gate suspend rendering; time does not jump on resume. Resize updates buffers; unmount releases observers, listeners, frame callbacks, shader geometry/material, composer targets and WebGL resources. WebGL/import failure leaves the existing Canvas game playable. Stacking styles only affect the SLASH stage.

Verification: 135 unit tests passed; 84 full browser tests passed in 55.4 seconds. New browser tests cover actual background draws, no camera/model requests, layer order, buffer cap, ECHOES pause/back, reduced motion and WebGL failure. The existing resource test was updated to account for the deliberately active background context, still requiring all departed-mode resources to disappear and GridScan contexts/resources to return to zero after leaving SLASH. No tests were removed.

Desktop 1366?768 and mobile 390?480 captures were visually inspected. Production build/check are verified before commit. Existing Three shared-chunk size warning remains; GridScan/post effects are a separate lazy chunk (~76 kB, gzip 19 kB). This adds GPU work; real webcam/low-end device performance is not established by synthetic browser testing. The existing high-load gameplay and tracking regressions remain green.
