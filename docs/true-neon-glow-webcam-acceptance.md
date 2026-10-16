# TRUE NEON GLOW physical-webcam acceptance

Status: **NOT RUN**. No physical person/webcam, touchscreen, device FPS, thermal,
battery, or real-room segmentation evidence has been collected for this upgrade.
Synthetic images and automated tests are separate evidence.

The 38 outstanding checks in [the existing real-device acceptance report](lumen-real-device-acceptance-report.md)
and focused QoL 2.0 retests in [the QoL report](quality-of-life-2-report.md) remain
NOT RUN. This checklist adds checks; it does not replace or close those checks.

Record tester, date, application commit, device/OS, browser/version, webcam,
capture resolution, room lighting, clothing, preset, quality, and any camera
permission/recovery conditions. Attach short recordings and timing evidence.

| ID | Procedure and expected observation | Status |
|---|---|---|
| N01 | Compare OLD versus NEON using the same person, framing, color and room. NEON has immediately stronger exterior light and a narrow bright rim. | NOT RUN |
| N02 | RED in normal/dim rooms: saturated red halo, luminous shoulders/hair, recognizable face and dark clothing texture. | NOT RUN |
| N03 | All six colors × SOFT/NEON/SUPERNOVA: distinct strength levels, comparable perceptual impact, no broad skin/white-clothing clipping. | NOT RUN |
| N04 | Look straight ahead, turn, wear glasses, move hair: eyes, nose, mouth, shadows and texture remain visible. | NOT RUN |
| N05 | Slowly raise/lower arms; stand, sit, move partly outside frame: rim follows actual silhouette without fabricated body regions. | NOT RUN |
| N06 | Rapid hands/turns and ordinary movement: bounded jitter, no long ghost trails or objectionable edge lag. | NOT RUN |
| N07 | Brief occlusion and sustained exit: short dropout is stable, glow fades completely, reacquisition has no frozen silhouette. | NOT RUN |
| N08 | Switch room lights and move past bright windows: background adaptation is smooth without visible brightness pumping. | NOT RUN |
| N09 | Change color/preset without moving; let tracking fade; rotate/resize: cached halos immediately match the selected appearance and fade. | NOT RUN |
| N10 | FREE GLOW plus BODYSHIFT skin/field/waves/trails/magnetic light/OVERDRIVE remain visible and responsive. | NOT RUN |
| N11 | ENERGY RUSH calibrated and assisted rounds: reachability, anti-jitter, shields, FEVER, scores, timers, instructions, pause/resume stay intact. | NOT RUN |
| N12 | Stop/restart camera, revoke/regrant permission, change camera, hide tab/open gallery, force context loss where supported: clear recovery without extra streams or loops. | NOT RUN |
| N13 | Reduced motion and low-performance device: stable static emission; reduced bloom retains the bright narrow rim. | NOT RUN |
| N14 | Ten-minute physical run: record FPS/frame times, mask cadence, thermal/battery observations, resource stability and quality changes. | NOT RUN |

Do not claim reference parity until these observations are recorded. The visual
reference image itself was not available to this implementation session; the
provided written artistic description guided the rendering.

## Release authorization

The original task held merging/deployment. The user's subsequent explicit
instruction, “merge push commit deploy”, authorizes those release operations
after automated verification. It does **not** mark any physical check PASS.
Historical HOLD reports remain intact as records of their original decisions.
