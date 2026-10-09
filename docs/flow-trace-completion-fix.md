# FLOW webcam completion repair

Base:63349e363f9c1857ff75cbbf2141591fb656421c. Branch:fix/flow-trace-completion. No publication until release approval.

Reproduced through updateHand and predictHandPoint: all eight target paths complete in the original order; reversed line/circle/wave/figure-eight paths fail despite following the entire guide. Closed curves also reject natural starting points. A full synthetic-camera browser regression exposed the next target anchoring to the finger position left over from the previous shape.

The existing ordered evaluator remains unchanged internally. A bounded pair of forward/reverse candidates permits either tracing direction. Closed paths rotate to a nearby natural starting point. Before2% meaningful coverage, the provisional start may relocate when the finger moves to a distant part of the curve; afterward ordered progress remains fixed. First accepted completion latches one winner and awards once. Tracking-gap, stale sequence, jump and minimum travel checks remain intact. No hand detector, camera, gesture threshold, fluid renderer, scoring formula, timer or echo capture change.

The FLOW HUD now shows tracing progress in5% increments and clarifies that the visitor traces the guide in either direction. Updates use the existing drawing loop with no per-frame React state.

New tests: webcam-filtered traces for all eight shapes in both directions; arbitrary-start closed curves; lingering finger transition; full synthetic-camera capture/filter/prediction/render/evaluator/count/next-shape regression completing a reversed line and a reversed side-start circle.

Verification:135 unit tests passed; full browser suite81 passed in54.9 seconds. Production build/check are verified before commit. Existing accuracy and figure-eight shortcut/tracking-gap tests retained. Independent read-only review found no blocking issues.

Live human webcam testing remains unverified. The fix addresses reproduced direction/start-selection failures; it does not recognize arbitrary freeform drawings away from the displayed guide.
