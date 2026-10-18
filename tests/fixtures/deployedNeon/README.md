# Deployed TRUE NEON baseline

Frozen from commit `9975a53e7f01f9c0d9786cea65a09285c4c82287` for BODY ILLUMINATION before/after tests. The renderer, shaders, Canvas fallback, mask, profiles, targets, exposure meter and tracking utilities are copied here; only import paths were rewritten to local fixture modules. They do not import live renderer dependencies. These modules are test-only and are not production entry points.

Do not update this fixture when changing the current renderer. The older `legacyGlowRenderer.js` fixture serves a different comparison, predating TRUE NEON.
