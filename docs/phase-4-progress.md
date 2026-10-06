# Phase 4 execution record

Plan: docs/phase-4-plan.md. User approved implementation and publication in this session.

Exact source: the 22,336-byte Ballpit attachment was copied directly and adapted. InstancedMesh, the physical scattering material, source collision solver, gravity/friction/bounce, RoomEnvironment, camera sizing and raycast plane remain its foundation. No alternate Ballpit or physics/3D framework was fetched.

Added Three.js 0.186.1, the sole new dependency. The source's custom scattering expression needed `vColor.rgb` for the installed version's vec4 vertex color. A blank-scene screenshot exposed this incompatibility; the diagnostic shader error identified it, and rendering/console checks verified the fix. Shader compilation failure now surfaces as mode-specific guidance.

LAUNCH-specific input uses the shared already mirrored fingertip, aspect containment, existing raycasting and z=0 plane. Only new sequences update physical input. Baselines suppress impulse and snap the invisible controller instead of traversing old-to-new positions. Loss, stale input, gaps above 140 ms, source changes, invalid coordinates and impossible motion reset the baseline. The inactive hidden sphere is excluded from ordinary physics.

Slow movement uses the original controller collision with a gentler coefficient .35; faster movement above approximately 1.2 camera-heights/second adds one local, quadratically attenuated impulse. Influence radius is approximately 2.125 world units. Impulse tops out at .12 per solver step; final velocity is clamped to .15 after collisions. Reduced motion lowers ceilings and force. The actual solver fixture verifies stronger fast response, zero far-field direct force and no repeat impulse.

Ruling: fixed 60 Hz solver scheduling with display-rate rendering. A 200-sphere headless Edge measurement reported approximately 4.17 ms frame callbacks (240 Hz), without hand inference. A regression demonstrated the source moving .24 units over four 240 Hz frames instead of the intended .06. The unchanged integration/collision algorithm now runs once per 1/60-second step; the regression passes. Long deltas and accumulated work are capped. This is a scheduling repair, not a replacement solver.

Lifecycle: fresh canvas per React effect survives StrictMode forceContextLoss. PMREM generator and temporary room resources dispose after environment generation; the retained target, texture, sphere geometry/material/instanced resources, renderer, listeners, observers, resize timeout, Timer and animation callbacks dispose at teardown. Context-loss-aware instrumentation confirms LAUNCH contexts and allocations are released. Review also found a missing pointerup reset; fallback now resets on release and every new pointerdown.

Visuals: 200 violet/lavender reflective spheres on desktop, 120 below 700 px width; capped display buffer and restrained lighting/emission. No visible controller, camera, landmarks or HUD. Inspected the rendered scene and mouse-response screenshots. No core GLOW, FLOW, SplashCursor, SLASH, camera or hand-tracker changes.

Verification: 19 unit tests and 13 Edge browser tests passed. Actual source-solver tests cover local impulses, repeated samples, gentle versus fast response, final velocity ceiling and refresh independence. All-mode tests cover navigation, repeated mounts, shared worker/stream, context/resource recovery, animation callbacks, missing models, no WebGL and global Stop. Production build and `/Lumen/` checks passed, including LAUNCH rendering. Build emits Vite's large initial chunk warning due to Three.js; bundle splitting is deferred.

Physical webcam opened at 640×480, tracking initialized and reported no hand; camera release confirmed. Natural nudging/flicking, physical mapping, tracking-loss feel, live performance with a person and other browsers remain unverified. Automated mouse/solver checks cannot establish artistic responsiveness with a real hand.

Stop at Phase 4. No final polish, audio, transitions, additional modes or redesign.
