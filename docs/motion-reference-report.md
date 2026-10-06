# SLASH and LAUNCH motion reference tuning

The user's motion-reference request authorizes this pass. The two local MP4 recordings are reference evidence; footage has not been committed or published. FLOW and GLOW source, shared hand filtering, inference cadence, and model confidence settings are unchanged. The shared hook exposes raw landmarks for mode-specific consumers only.

## Recorded evidence

BallGesture.mp4: 7.45 seconds, 1080 × 1920. The seated viewer repeatedly points and makes small forward/release movements, with index articulation and modest wrist movement. The active sequence contains approximately 17 impulses, typically 0.28–0.40 seconds apart. MediaPipe detected a hand in 172 of 223 frames sampled at 30 Hz. Median offline inference was 36.6 ms on resized 640 × 1138 portrait frames.

SlashGameGesture.mp4: approximately 9.5 seconds, 1080 × 1920. The viewer makes rapid vertical edge-on chops, then diagonal/lateral strokes; the moving hand becomes blurred or leaves the frame. MediaPipe detected a hand in only 14 of 285 frames. Median offline inference was 38.3 ms. Temporary confidence experiments found 41/285 detections at 0.25 and 76/285 at 0.10, still missing complete strokes. Those confidence changes were discarded.

These are sequential recorded-video measurements, not live camera latency or achieved inference cadence. The existing browser capture benchmark measured approximately 27.7 Hz at a requested 30 Hz, median capture-to-result age 17.5 ms on a synthetic landscape camera without a hand. It does not establish real-hand responsiveness.

## Implementation and replay

LAUNCH uses a bounded combination of hand scale and relative depth, fast signal filtering, a rising-edge firing threshold, and two valid samples of a small local release. It has no long cooldown or full-return requirement. Holding forward cannot fire again; rejected tracking samples cannot fire or rearm. Creation temporarily suppresses manipulation forces. Balls start at the raw fingertip's contained world mapping, retain creation color, and launch with bounded speed approximately 0.11–0.145 (old initial Z speed 0.035). The 150-active cap, empty initial state, instance renderer, physics, and local nudge/flick system remain.

The final full hand-consumer replay creates 17 balls during the reference sequence. The prior detector created six. A separate generated ten-pulse test creates ten balls; held-forward and single noisy release tests do not repeat. This is recorded/synthetic evidence, not a claim of live physical acceptance.

SLASH preserves MediaPipe and adds a low-resolution frame-motion fallback only while this mode and the shared camera are active. It uses connected moving regions, elongated-arm evidence, temporal continuity, limited median filtering, and rejection of quiet/small motion and global exposure changes. This fallback is image-motion evidence, not anatomical hand recognition; other large elongated moving foreground objects can still trigger it. Live testing must assess false positives in the actual room.

Deliberate strong single segments can qualify; curved strokes retain each accepted segment for collision rather than cutting a first-to-last shortcut. Recognized strokes show an immediate trail even on a miss. The final fallback replay recognizes motion in 10 of 11 annotated chop windows, with 53 continuation segments, and stays quiet outside the active reference interval. The missed window remains a limitation, not a passed physical attempt. No camera-segment throttle drops collision coverage.

## Acceptance and verification

Live physical acceptance remains pending. No live tester was available. Retest normal horizontal/vertical/diagonal swipes, quiet head/body movement, rapid small-release firing, held-forward non-repeat, slow local nudges and fast flicks, including acquisition and frame-edge loss. Automated camera and reduced numeric fixture tests establish wiring and safeguards only.

The performance browser run measured physics/input p95 approximately 0.20 ms at 150 active spheres and 0.30 ms at 200 in this headless environment. It retains the previously chosen 150 cap; these figures do not establish mobile GPU performance. Development diagnostics are guarded from production.
