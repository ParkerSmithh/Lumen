# Phase 1 execution ledger

Plan: docs/superpowers/plans/2026-10-05-glow.md

Ruling: use ImageSegmenter with the general selfie segmentation model instead of PoseLandmarker, per the user's artistic priority. Whole visible person masks do not depend on successful pose landmarks. Real-camera quality remains to be evaluated.
Ruling: work in place; this folder is not a Git repository. Keep proportional utility and browser checks, as requested, instead of per-task review infrastructure.
Pre-flight: camera hook supplies one hidden video to tracking; tracking supplies timestamped confidence masks to rendering. Fit and mirroring are applied only by rendering.
Baseline: four existing utility tests failed because exported functions were missing.

Task 1: complete — portable Node 22.23.3, exact npm dependencies and lockfile, four utility tests pass; local model and WASM downloaded.
Task 2: complete — shared hidden-video camera hook, late-permission cancellation, worker inference. Ruling: installed MediaPipe returned "ModuleFactory not set" in a module worker; classic worker with the installed Vision IIFE resolves this, verified by actual inference.
Task 3: complete — GLOW shell, six colors, layered WebGL emission and bloom, Canvas fallback, labeled preview, disabled later modes, aspect-preserving mirrored rendering. Reviewed desktop screenshot. Reviewer fixes cap canvas at 1280×900 and terminate failed tracking with direct retry.
Task 4: verification complete — four unit tests, five Edge checks and production build pass. Physical webcam opened at 640×480, segmentation initialized, no person detected, stream release confirmed. Live human silhouette quality and other browsers remain unverified. Dev server is running at http://127.0.0.1:5173.
Ruling: keep preview simple, proportional tests and no phase-two work, per user's priorities. Tests do not cover every item in the original plan; missing-model UI, real-person movement and multi-browser checks remain manual follow-ups.
