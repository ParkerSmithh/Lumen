# ENERGY RUSH implementation ledger

Approved in-chat plan, 2026-10-09. Branch: feat/energy-rush. Base: 8e89e81.
Scope: GLOW submode; preserve FREE GLOW, one camera/segmentation pipeline, no merge/push/deploy.

Baseline: 217/217 unit tests pass. Browser baseline running.
Existing BODYSHIFT modifications are preserved, not claimed as this feature's work.
Starting src snapshot and binary tracked diff: .test-artifacts/energy-rush-before/.

Ruling: Execute inline, then obtain an independent final review as required by executing-plans. The user approved the complete in-chat plan; no additional design gate is needed.
Ruling: Work on the dedicated branch in this checkout to preserve the approved uncommitted BODYSHIFT dependency and IDE preview. Do not stash, reset, or commit the user's pre-existing work.
Ruling: The supplied neon arcade brief and approved integration plan define the UI; preserve incumbent LUMEN styling instead of introducing a brand exercise.

Tasks: A baseline; B grid/calibration; C round/objects; D progression/inputs; E UI/effects/integration; F accessibility/performance/regression; G review/readiness.
Interfaces: grid -> calibration/game: borrowed transient occupancy, timestamp, bounds, centroid, changed-contact query. Calibration -> game: scalar baseline/envelope/capabilities. Game -> UI/renderer/events: snapshot and bounded accepted events. Adapter -> engine: explicit monotonic time and blocking reasons. No renderer can award points.

Physical webcam acceptance remains required; automated synthetic inputs cannot establish reliability.

A: complete — baseline 217 unit / 107 browser tests passed. Dedicated branch created; no user changes reset/stashed/committed.
B: complete — reusable mirrored silhouette sampling; strict 64x48 collision grid; calibration, demonstrated lateral envelope, scale rejection and stable reacquisition.
C: complete — deterministic 90-second state machine, bounded pools, spawn grace/warnings, one-shot contacts, shields/invulnerability, nested pause blockers and replay cleanup.
D: complete — 1x..5x combo, earned eight-active-second FEVER, relative capability-gated challenges and keyboard/touch field.
E: complete — preserved GLOW camera/color/aura, HUD, shared CHAOS feedback budget, abstract ECHOES capped at16 collection +8 bonus marks, CORE physical-presence semantics, dedicated body/assist bests.
F: in progress — full browser116/116 passed before final small-range spawn refinement. Unit255/255 passed before that additional regression; final recheck pending. CALM/WILD/MAX real-segmentation painted-camera benchmark retained in energy-rush-performance.json; not real-person acceptance.
G: independent read-only review completed. Two Important findings reproduced RED then fixed GREEN: cached pose could earn reach bonus; 200ms render cadence truncated active clock. Pose signals now expose the actual poseTimestamp; calibration/bonus holds require fresh distinct pose evidence. Active clocks use accepted full delta independently of bounded physics catch-up.
Additional review fix: short-screen shell/HUD overlap corrected. Restrained shield/FEVER live announcements added.
Additional fairness regression: six-percent seated lateral range originally could produce no orbs because of a fixed clearance margin. Adaptive core radius and translated real-silhouette reachability now pass a real-grid collection test.
Production check first attempt failed solely on remote Google Fonts network access; rerun uses its existing LUMEN_OFFLINE_FONTS=1 supported fallback option.

Final identity regression: distinct mounted engines now use echoSession.allocateScope namespaces; returning from another mode cannot deduplicate a new round's legitimate events against a prior instance. RED -> GREEN verified for object and accepted-event IDs.
Final verification:257/257 unit tests pass. Full browser suite116/116 passed; subsequent affected-area recheck16/16 passed after reach/time/fairness fixes; final scoped identity recheck8/8 passed. Vite build exits0; existing production check passes with offline-font fallback. Separate /Lumen/ production game probe verifies no development diagnostics, full assisted round expiry, results, versioned best, replay and EXIT, with0 page errors.
Thirty-round pure-engine soak preserves6 orb slots /2 hazard slots and bounded events. Forced-GC heap delta +162048 bytes is diagnostic only, not a browser memory guarantee. Mounted renderer cleanup and real segmentation performance are separately tested.
Final CALM/WILD/MAX painted-camera benchmark shows effectively0% median cadence change and at most0.100001ms extra p95 synchronous RAF CPU in this headless run. No real-person, GPU-completion or device-comfort claim is made.
Release state: keep the development branch/working tree in place; no merge, push, deployment or commit of pre-existing BODYSHIFT work. Real webcam acceptance remains outstanding.

F: automated accessibility/performance/regression checks complete; physical webcam acceptance pending.
G: independent review and deterministic fixes verified; development delivery ready for physical-play review, not release approval.
Compared all pre-existing src files against the starting snapshot: only App, GlowMode, BodyControl, bodySignals, CHAOS, ECHOES store/presence helper and personal-best storage changed for this feature. FLOW/SLASH/LAUNCH source and camera/model scheduling are unchanged from the user's starting working tree.
