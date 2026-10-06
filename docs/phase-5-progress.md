# Phase 5 integration and final polish

User approved the repository-based plan and publication through the existing Pages workflow. This completes the four-mode artwork: presence, creation, destruction, force. No additional feature phase is planned.

## Scope and changes

Reliability took precedence over visual refinements. Guidance now has a separate lifecycle for each mode, input source, camera state, preview and error state. Cleanup invalidates callbacks as well as clearing timers. Successful presence/movement begins a two-second instruction fade; pending fades cancel on tracking loss, and guidance returns after 1.5 seconds of sustained loss. Errors override fading. FLOW fallback reports movement at its input boundary, without changing fluid simulation.

Body-tracking construction and initialization failures are caught. A five-second in-flight inference watchdog recovers from a stalled response; teardown cancels it and terminates the inactive tracker. Production messages contain no setup commands or tracking implementation details. A mode error boundary keeps navigation available. Renderer failures offer remounting; a failed LAUNCH import offers an explicit reload, because repeating its URL does not clear the browser module map.

The entry composition retains its title and camera action, with a short camera/privacy explanation. Mode numbers and conceptual labels remain integrated into the existing navigation. All hand-driven modes use the same secondary Mouse / touch fallback action with a pressed state. Entry errors flow inside the invitation; redundant idle captions no longer obstruct the short-window preview action. Focus and hover treatment remain restrained.

The full-viewport shell no longer imposes a 550px minimum height. Short-window and narrow layouts retain the immersive field while fitting controls. One 350ms CSS emergence fade applies to the selected renderer. Mode changes unmount the old renderer immediately; no expensive renderers overlap, no simulation state crosses modes, and cleanup is not delayed. Reduced motion removes interface animation and fading.

LAUNCH loads through a simple React lazy import and Suspense boundary. No bundler customization was added. Its Three.js payload is fetched only on selection. README now describes the finished artwork; the former engineering narrative is preserved in implementation-history.md.

## Preserved systems

GLOW segmentation algorithm and renderer, SplashCursor shaders/fluid engine, SLASH detector/collision/scene, Ballpit solver/materials/lighting, shared webcam ownership and shared hand-worker architecture are unchanged. No gesture thresholds or visual physics were retuned. GLOW retains six body colors. No dependencies were added or removed. No audio, new modes or new visual systems were introduced. Optional decoration was omitted.

## Browser-runner investigation

The previous baseline printed all 13 successful cases but did not exit. OS process inspection showed the original runner waiting with its npm/cmd/Vite server tree still alive; browser test workers were gone. Playwright's Windows server teardown uses taskkill, which returned Access denied in the sandbox. A run reusing that server exited normally, isolating the problem to server teardown rather than app animation/worker ownership.

The browser suite now starts Vite through createServer in global setup and returns an awaited server.close teardown. It owns port 5175, independently of the development server. Full runs exit normally with a final summary and status 0. The original orphaned server tree was cleaned up only after diagnosis and successful API teardown verification. The suite is not force-terminated and no open handles are ignored.

## Automated verification

- Production build passed. Initial JavaScript: 274.30 kB, 86.72 kB gzip, versus 831.61 kB / 225.90 kB gzip at baseline. Initial size fell about 67% (gzip about 62%). Deferred LAUNCH: 559.72 kB / 140.79 kB gzip. Its remaining large-chunk warning is expected; no further bundling complexity was introduced.
- All 19 unit tests passed. Existing input math, reset, collision and solver behavior remains covered.
- All 21 Edge browser tests passed in 39.6 seconds, with normal runner exit. New regression checks cover guidance scope changes, error visibility, GLOW fading, body construction/stall recovery, Stop/re-entry, deferred/import-failure loading and reload recovery, keyboard/reduced-motion behavior, viewport bounds and actual preview hit-testing.
- Existing repeated-switch checks verify one camera, one appropriate tracking worker, shared hand-worker reuse, released WebGL resources/contexts, bounded animation callback counts and global Stop cleanup. PMREM/renderer ownership remains unchanged and these checks pass.
- Local production preview at /Lumen/ passed. All 12 assets resolve: two workers, both tracking files, the vision bundle, all supplied JS/WASM variants, and the favicon. Actual body and hand inference run on empty frames through production workers. LAUNCH is absent from initial requests and its generated dynamic chunk resolves under /Lumen/ on selection. The served entry filename is compared with the locally built HTML.
- Production browser inspection reports zero actionable console errors and no missing HTTP assets. MediaPipe's known CPU-initialization INFO notice is identified as informational; forced negative tests intentionally generate renderer/import errors.
- Layout checks cover all modes at 1366x768, 1440x900, 1920x1080, 390x480 and 800x400. Desktop artwork and entry screenshots, narrow/short entry screenshots, and existing mobile captures were inspected. 1366x768 was the primary critique viewport.
- Git diff whitespace check passed. No core-engine tuning or performance promises were inferred from these checks.

## Independent review

Read-only review found two Important issues, both fixed and covered by failing-then-passing regressions: identical-URL LAUNCH retry could not recover; the 800x400 caption obstructed Preview light. The full suite and production check passed after both fixes. No Critical issues or deferred Minor findings were reported.

## Actual camera verification and its limits

Six video-input devices were reported. A real 640x480 stream opened; GLOW and the shared hand tracking initialized. No real body was detected in GLOW, and no real hand was detected in FLOW, SLASH or LAUNCH. Stop cleared the video stream, re-entry opened a live track, and final Stop released capture. The camera-check script closes its context, browser and owned preview server normally.

This establishes actual camera startup/re-entry/release, not physical artistic quality. Body alignment, full-body readability with a viewer, fingertip mapping, slow versus fast slash rejection, deliberate cuts, gentle nudges/flicks and frame rate with a real viewer still require hands-on evaluation. Automated mouse, empty-frame and solver checks cannot replace that evaluation. No physical threshold changes were made.

## Publication and critique checks

Publication uses the existing main-branch Pages workflow. The completion report records the workflow result and verification against the actual live https://parkersmithh.github.io/Lumen/ path; the same production script accepts that URL and compares the served entry with the verified local build, then exercises tracking assets and the dynamic chunk.

Before critique, use the intended laptop/browser, allow camera access and test the four embodied interactions in order. Use even lighting and enough distance for the full body. Other browsers/devices remain unverified; floating-point WebGL requirements, tracking occlusion and LAUNCH's sphere-count physics cost remain limitations. Failure recovery preserves navigation; a failed module download explicitly requires reload.

Stop at Phase 5. Further changes should address hands-on problems, presentation, documentation or submission requirements only.
