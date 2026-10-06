# Phase 2 execution record

Plan: docs/phase-2-plan.md. Approved by the user with explicit authorization to proceed after receipt of the exact source.

The 36,352-byte supplied SplashCursor attachment was used directly. No replacement was fetched. Its 11 shader blocks were independently compared and match after normalizing line endings. The input boundary now consumes a mutable normalized pointer once per new sequence, using the original movement/splat path. GPU allocations, capability probes and superseded resize targets now dispose correctly.

Ruling: use a 512 dye resolution and cap display canvas dimensions at 1280×900 for responsiveness; keep 128 simulation resolution and the requested dissipation/force defaults. No new runtime dependency or separate camera pipeline.

HandLandmarker uses locally served model/WASM in a classic worker. Tracking runs at up to 20 Hz, with one pending bitmap, timeout recovery and cleanup. One x mirror, 35 ms smoothing, zero-delta reacquisition, jump rejection, sequence consumption, stale input cutoff and bounded forces are tested. An aspect-preserving adapter maps the tracked camera field into the artwork.

GLOW renderer, camera hook, segmentation hook/worker and six-color settings remain intact. App-level mode selection activates only the selected tracker; camera capture remains global. Mouse/touch fallback is explicit and excludes UI controls.

Verification: eight utility tests pass. Browser checks cover FLOW fallback, GLOW regressions, no WebGL, no hand, missing hand model, one stream across repeated switching, inactive worker termination, GPU allocation recovery and global Stop. Physical webcam opened at 640×480; hand tracking initialized but no real hand was detected during the unattended check. Stream release was confirmed. Live mapping, responsiveness, fast/slow force contrast and hand-loss feel still require a viewer.

Independent review found one guidance issue: brief pauses restored text too early. Fixed so guidance remains faded through pauses and returns after sustained hand loss. No Phase 3 or LAUNCH implementation.

Final results: eight unit tests and nine Edge browser tests passed; production build passed. Production /Lumen/ validation rendered FLOW and successfully loaded the hand worker, model and WASM and processed an empty frame. Vite preview now shares the build's Pages base path. No live hand detected in the physical camera check.
