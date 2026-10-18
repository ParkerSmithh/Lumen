# LUMEN submission polish - approved bounded plan

Baseline: e290aef (remote main verified 2026-10-18; live Pages HTTP 200 and matching title/asset paths). Smart Camera c4e5945 is an ancestor. Original BODY checkout stays at 9975a53.

Constraints: no dependencies, camera policy changes, gameplay rewrites, merge/push/deploy; original 37 paths/status/index preserved. Physical webcam checks NOT RUN unless user-confirmed on this exact candidate.

Checkpoints:
- [x] Isolated branch polish/submission-20261018; BODY overlay combined with latest approved camera/title source.
- [x] Landscape/navigation/gallery/focus fixes with reproducing browser tests.
- [x] Cinematic entry, descriptive mode cards, shared controls, onboarding/status and About/privacy.
- [x] Existing results polish if safe; otherwise defer.
- [x] Full units/browser/build/production/camera smoke, preservation check and final report.

Ruling: original checkout is immutable; carry BODY changes into this candidate only. App and GlowMode overlap is resolved by preserving Smart Camera disclosure/focus behavior and adding BODY brightness state/wiring. No renderer changes beyond original BODY work.
Baseline: 354 unit tests passed. Original state evidence lives in root .test-artifacts/submission-20261018.
Ruling: preserve direct mode navigation and camera entry. Cinematic welcome enhances existing entry; ENTER LUMEN opens mode selection rather than adding a blocking splash or triggering capture. Existing saved-camera startup behavior is unchanged.

Checkpoint 2: reproducing tests failed for both landscape sizes, gallery Escape/focus and blocked gallery chunk. Fix reserves space, adds gallery failure fallback and focus restoration; existing gallery gameplay/export/suspension and layout cases passed.
Checkpoint 3: new native modal reuses suspension gate and existing mode selection; no capture on exploration. One authored wordmark reveal, static atmosphere, descriptive cards, quick-start details and About/privacy. No renderer/physics/audio/performance system changes. Fixed CSS import ordering after focused tests caught clipping. Final visual check flagged disclosure reachability on compact screens; preserve visible preconnection disclosure by using the header wordmark on short screens.

Final regression findings: first complete run 227 passed / 7 failed (5.9m). Causes were toolbar covering unlocked CORE, changed first Tab order, hidden entry reminder, and Preview falling below initial scroll region. Restored nav-first DOM order and entry reminder; separated toolbar from CORE; compact entry exposes camera disclosure and actions. Existing guide test retains footer/bounds checks; old empty-camera-field geometry comparison is conditional on non-entry state because welcome replaces that field. Follow-up independent review found no important findings.

Final: 355 units and 234 browser cases passed (3.9m); build, production /Lumen/ check, real-worker synthetic camera smoke and polish diff check passed; full staged diff retains four inherited BODY EOF blank-line warnings. No runtime source edits after these checks. Results behavior expansion deferred; existing result styling polished. Physical webcam NOT RUN. Keep isolated candidate; no merge/push/deploy.
