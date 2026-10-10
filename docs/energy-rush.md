# ENERGY RUSH

ENERGY RUSH is an optional arcade submode of GLOW. Choose PLAY ENERGY RUSH; EXIT returns to FREE GLOW with the camera illumination and emission color preserved. No second camera or segmentation model is introduced.

## Playing

Body play uses the real mirrored silhouette. START asks for a stable neutral position, then comfortable lateral movement. USE THIS RANGE begins a three-second countdown; a demonstrated range may also finish automatically after six calibration seconds. Seated and partial-body play are supported. Small movement ranges produce smaller collectible cores. Calibration can wait indefinitely for usable movement instead of inventing a reach envelope.

Collect light by entering a target with fresh silhouette geometry. Moving targets cannot award points merely by drifting into an unchanged body. Danger objects use warning rings, diamonds, exclamation marks and DANGER text before activating. Three shields, ninety active seconds. Accepted damage resets combo and grants 1.5 seconds of invulnerability.

PAUSE, gallery/CONVERGENCE, camera loss, hidden tabs and tracking failure freeze gameplay. Recovery requires one second of distinct stable observations plus explicit RESUME. Large framing changes require RECALIBRATE. Recalibration preserves score and elapsed active time, clears unsafe objects and returns through a paused state. EXIT abandons the round without recording a best.

Keyboard / touch is an explicit alternative with a visible interaction field. Arrows/WASD move it; the touch pad maps the arena. HOLD TO REACH / EXPAND appears only for the corresponding assisted challenge. Body and assisted personal bests use separate storage keys.

## Rules v1

- Orb: 100 points multiplied by the collection's resulting combo tier.
- Collections 1–2: 1x; 3–4: 2x; 5–6: 3x; 7–8: 4x; 9+: 5x.
- Supported, calibration-relative movement challenge:250 points, once, no orb combo increment.
- FEVER: crossing nine collections earns eight active seconds of extra orbs and shared visual energy. Further collections cannot recursively extend it.
- Normal orb target cap4; FEVER cap6; absolute cap6. Existing extra orbs can expire after FEVER.
- Hazards: cap2, at least1.2 seconds warning, two distinct fresh contact samples for damage.
- Orb grace:500ms. No collection from a newly acquired or stale segmentation mask.

Storage: `lumen.arcade.bests.energy-rush.v1.body` and `.assist`. Only timer/shield-ended rounds record bests. Existing FLOW/SLASH/LAUNCH bests and GLOW CORE participation remain separate.

## Technical boundaries

- `silhouetteGrid.js`:64x48 reused transient binary buffers, confidence threshold0.6, bounded multisampling, monotonic validation and250ms capture-age limit. Collision queries inspect relevant local cells. Shared decorative coarse sampling preserves FREE GLOW's existing threshold and32x24 afterimages.
- `energyCalibration.js`:scalar baseline, noise-relative movement targets, demonstrated bounds and capability checks. Pose reach calibration requires distinct, fresh pose observations.
- `energyRush.js`:seeded deterministic engine, fixed object pools, accepted-event queue capped16, active clock independent of bounded physical integration. Render intervals above250ms pause safely.
- `useEnergyRush.js`:camera/session lifecycle and storage adapter. GLOW's existing RAF advances the engine; React HUD publication is limited to10Hz except state changes.
- `energyInput.js`:explicit assisted interaction geometry, separate from physical tracking and CORE semantics.
- `energyRushRenderer.js`:bounded arena drawing; object trails4/8/12 samples for CALM/WILD/MAX; reduced motion disables trails and moving rings.
- Accepted collection/challenge/milestone feedback uses the shared CHAOS record/particle budget. FEVER/SURGE/OVERDRIVE select a clamped glow strength rather than multiplying counts.
- ECHOES:at most16 collection marks plus8 challenge/milestone marks per round, quantized abstract points only. No webcam frames, collision grids, contours or landmark histories are stored.
- CORE continues to require real sustained GLOW presence. Assisted controls and decorative effects cannot activate it. During ENERGY RUSH, accepted game actions replace duplicate CHAOS presence-meter awards.

## Verification and remaining acceptance

Deterministic tests cover mirrored collision, freshness, deduplication, calibration, actual small-range grid collection, spawn exclusions, challenge evidence, FEVER, invulnerability, pause/recovery, slow-render active time, storage isolation, ECHOES limits and visual budgets. Browser tests exercise camera denial/loss, one-camera ownership, keyboard/touch, gallery suspension, Canvas fallback, replay/exit cleanup and mobile/short screens.

Performance measurements in `energy-rush-performance.json` compare mounted FREE GLOW and ENERGY RUSH under CALM/WILD/MAX using the actual segmentation worker/model with a painted canvas camera. The reports explicitly distinguish real inference measurements from real-person mask quality. These are diagnostic headless measurements, not human-play acceptance.

Verified: 257 unit tests; 116 full-suite browser tests, followed by 16 affected-area and 8 final identity/lifecycle browser tests; production build and `/Lumen/` checks. The production check uses its supported offline-font option because this environment blocks Google Fonts. An additional production game probe verifies full assisted-round expiry, storage, replay and exit. A thirty-round pure-engine soak is recorded in `energy-rush-soak.json`.

Real webcam testing remains required: seated/standing, partial visibility, different body sizes, small movement ranges, dim lighting, fast motion, camera approach, loss/reacquisition and sustained rounds. Tune collision thresholds, warning comfort and calibration noise from that evidence before claiming physical-play reliability.

Development branch only. No merge or GitHub Pages deployment without separate release approval. The starting BODYSHIFT work remains preserved in the working tree.
