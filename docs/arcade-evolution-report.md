# Arcade Evolution verification

Implemented on feat/arcade-evolution from 9d11d66. Release approval is required separately; main remains 9d11d6635a5e10a94195032fc5695db8b3c24c54.

## Final rules

| Mode | Settings |
| --- | --- |
| FLOW | 90 seconds; completion 100, CLEAN +50 at 85% accuracy, PERFECT +100 at 95%; chain +5 per preceding completion capped at +25; SKIP resets chain only. Eight shapes include rounded triangle, double wave and ordered figure eight. |
| SLASH | 120 seconds; normal/parent/child 100, bonus 300; multipliers 1x for combo 1–2, 2x for 3–5, 3x for 6–9, 4x for 10+. Combo window 2 active seconds. After 15 seconds: bonus chance 8%, splitter chance 10% when capacity permits. One splitter with a reserved extra slot; two nonrecursive children, minimum 20 px radius, six-second lifetime. OVERLOAD begins at 100 seconds and ramps spawning to 0.28 seconds. |
| LAUNCH | 120 seconds; normal 100, bonus 200, bank +100 within three active seconds of an actual wall bounce. Every third eligible normal target moves after 45 seconds: amplitude at most 0.6 world units, eight-second period. Every sixth target after 20 seconds is a stationary bonus: 1.35 radius, eight active seconds. Reduced motion retains stationary targets. |

All LAUNCH targets require clear initial placement. Placement tries at most 24 candidates; bonus can fall back to normal, and crowded normal placement retries after 0.25 active seconds. Relative swept collision runs in the existing 60 Hz solver. Wall-bank metadata excludes held balls, resize artifacts, existing outside contacts, inward movement and resting contacts (incident axis floor 0.01 per solver step). This does not change solver coefficients or gesture thresholds.

Limits remain 150 balls, eight crystals, 192 particles, 24 fragments and 12 trails. Existing camera ownership, recognition, gravity, bouncing, ball collisions, grabbing and multi-ball throwing remain intact. Scores and counts are awarded atomically before round expiry. Versioned local personal bests independently retain score/count/accuracy for completed rounds, with an in-memory fallback for denied or malformed storage.

## Verification

- npm test: 117 passed, zero failed, skipped or cancelled.
- npm run test:browser -- --workers=4: 72 passed in 52.5 seconds; existing gesture-reference and physics regressions retained.
- Final responsive capture checks: two passed after allowing interface fades to settle. Ready/play/results reviewed at 1366×768, 390×480 and 667×375, with accessible replay controls.
- npm run build: passed; existing deferred Three.js chunk warning remains (LAUNCH about 580.67 kB, gzip 148.25 kB).
- npm run check:production: passed against the local /Lumen/ production build with live fonts, 12 assets, both tracking workers, lazy LAUNCH loading, five viewport sizes and zero console errors. Actual FLOW movement scored 200; an actual LAUNCH target hit scored 100; completed records and replay verified. Production diagnostics remain absent.
- Independent final review approved; 36 focused units independently passed. Earlier scoped reviews found and verified fixes for deadline award consistency and replacement-physics callback ownership.

## Performance

Headless Edge on this Windows machine at 1366×768; concurrent full-suite measurements. Values are CPU operation durations, not full-frame FPS or physical webcam latency.

| Measurement | Median ms | p95 ms |
| --- | ---: | ---: |
| SLASH overload update/draw, eight crystals and up to 192 particles | 0.100 | 0.300 |
| Moving-target collision scan, 150 balls | 0.005 | 0.011 |
| Current static-target comparison, 150 balls | 0.004 | 0.006 |
| Figure-eight evaluation | 0.001 | 0.003 |
| Current basic trace comparison | below timer resolution | 0.002 |
| React HUD commit, 19 commits including mount | 0.200 | 3.400 |

Historical baseline p95 was 0.014 ms for static target checks and 0.001 ms for trace evaluation; HUD median/p95 was 0.1/2.8 ms. Current same-suite moving versus static delta is approximately 0.005 ms p95, and figure-eight versus basic trace approximately 0.001 ms. HUD measurements include initial mount and scheduling noise, so they do not establish a frame-rate regression. No heavy postprocessing or per-frame React state updates were introduced.

## Remaining physical checks

Automated inputs, model initialization and inference are verified. Real webcam FLOW accuracy/comfort, LAUNCH rapid firing, grabbing, throwing, moving/bonus target reachability and bank-shot feel remain pending. These require real hand movements after a separately approved deployment. Browser/device performance beyond the tested Edge configuration also remains unverified. This development update has not been published.
