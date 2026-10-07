# SLASH game v1 verification — October 7, 2026

## Implemented architecture

`src/game/slashGame.js` is the authoritative monotonic clock and progression source. State is `ready → countdown → playing → results`; a paused flag preserves the current phase. Countdown is three seconds and play is exactly 120 seconds. Clock advancement happens before spawning/collision, so the deadline rejects scoring immediately. Paused time is excluded, and restoring visibility or camera input requires explicit Resume.

`SlashMode` holds the controller and scene outside React state. React receives only display changes (phase, pause, countdown numeral, remaining second, count, input availability). The scene consumes the controller snapshot; it has no independent progression clock. Physical simulation retains its existing bounded delta, velocities, collision width, reconstruction, and destruction effects.

Every object has a stable scene-lifetime ID, `type: normal`, and `value: 1`. Destroyed/expired events carry those fields; no missed-object or additional scoring system is implemented. `cut()` removes objects before reporting their individual hit count, preventing repeat awards. Replay resets the timer, count, spawn scheduler, scene effects and detector histories. IDs are not reused within the scene. Leaving SLASH disposes the session and returns to ready on re-entry.

## Exact initial progression

| Elapsed play time | Spawn interval | Active-object cap |
| --- | --- | --- |
| 0 seconds | 1.8 seconds | 3 |
| 30 seconds | 1.2 seconds | 5 |
| 60 seconds | 0.8 seconds | 7 |
| 90 seconds | 0.45 seconds | 8 |
| 120 seconds | 0.35 seconds | 8 |

Intervals interpolate with smoothstep between anchors. Caps use the floor of the same interpolation. The first target appears one second after play begins. A due opportunity schedules its successor from current game elapsed time whether capacity is available or not; stalls and full capacity never accumulate a birth backlog. No targets spawn at 120 seconds. Existing targets fade over 0.6 seconds, effects finish, and no additional hits score.

## Automated verification

- Complete unit suite: **78 passed**, zero failures.
- Complete browser suite: **49 passed**, zero failures, exit code 0.
- Production build: passed. The existing large deferred LAUNCH chunk warning remains.
- Local production verification: passed under `/Lumen/`, including 12 assets, actual worker initialization/inference, lazy LAUNCH loading, five viewport sizes, gesture guides, keyboard countdown, expiry/results, replay and mode reset.
- Production checks use the documented offline font fallback in this restricted environment.
- Gesture recognition, camera-motion reconstruction, shared hand tracking and swept geometry source files are unchanged.
- Independent review found one interrupted-video case; the new browser regression failed before the fix and passed after it. Camera availability now checks ready status, usable video data, paused state and ended state.
- Ready, playing and results layouts inspected on desktop and phone, including a short 390×480 viewport. Non-error live captions recede during the overlay phases to avoid overlapping the Start button; errors remain visible.

The original pointer fixture used a 60 Hz reference clock on a 240 Hz host, making its synthetic input too slow. The SLASH pointer and camera-motion browser fixtures now use real timestamps; no physical gesture thresholds were changed. Recorded-motion unit fixtures and curved/swept regression tests remain intact.

## High-intensity measurements

Windows, headless Edge, 1366×768 viewport, synthetic 640×480 canvas camera at 30 fps, actual MediaPipe worker, visible webcam preview. A dedicated scene workload runs at 100–110 seconds (three seconds at full capacity, then seven seconds of repeated multi-object cuts). Integrated actual SLASH gameplay runs at approximately 103.5–113.5 seconds with camera-motion processing enabled. Measurements ran separately from the test suite.

| Measurement | Result |
| --- | --- |
| Maximum active targets | 8 |
| Integrated frame callback CPU median / p95 | 0.10 / 0.80 ms |
| Integrated animation-frame interval median / p95 | 4.2 / 4.3 ms |
| Scene update + draw + sampled cut CPU median / p95 | 0.10 / 0.20 ms |
| Sampled multi-target cut CPU p95 | 0.60 ms |
| Integrated tracking delivery | 27.63 Hz |
| Integrated inference median / p95 | 17.4 / 18.3 ms |
| Capture-to-result age p95 | 20.4 ms |
| Hand packet age observed by render loop p95 | 54.4 ms |
| Dropped tracking packets | 0 |
| Maximum particles in destruction workload | 192 |

Timer resolution rounds some short operations to zero. CPU measurements exclude deferred GPU work. Animation-frame cadence reflects this machine's approximately 240 Hz environment, not a portable FPS guarantee. Raw measurements: `docs/slash-game-v1-performance.json`. Reproduce with `node scripts/measure-slash-game.mjs`.

## Live physical verification still required

Synthetic camera input contains no physical hand. Automated checks establish timing, lifecycle, scoring, rendering cost, worker delivery and regression behavior, not physical playability. Test a full two-minute round with real hands, including fast curved slashes, reacquisition, lighting variations, camera interruption/resume, and the final 30 seconds. Confirm preview alignment, comfort and tracking responsiveness on target devices before increasing the cap or tuning recognition.

## Release

Deployment target: the existing `ParkerSmithh/Lumen` GitHub Pages workflow at `https://parkersmithh.github.io/Lumen/`. Release verification is recorded after publishing the verified build.
