# Globe lighting and city map audit — 2026-10-08

Session (UTC): 2026-10-08T12:28:10.936Z

## Corrected behavior

- Globe and border normals point outward. The day surface is shaded; night pixels are emissive, with correct display color conversion. Flat view has even lighting.
- The four-turn cycle is day, dusk, night, dawn. Previously the cycle used 0, 0.5, 0.5, 0 and never reached full night.
- CPU geometry matches the shader throughout morphing. The active surface mesh is registered after texture loading, and clicks use the hit UV instead of interpolating incompatible inverses. This also corrects the mirrored globe longitude.
- Labels and city lights use CSS dimensions rather than dividing a capped renderer buffer by the device DPR. Projection revisions continue increasing as the map changes; clipped and back-facing points are hidden.
- The full flat map fits portrait screens. Marker elevation is preserved for 3D territory markers; canvas overlays project directly onto the surface.
- Gameplay city lights are rendered in the unified morphing view. Deterministic clusters represent the actual city count, respond to player and AI construction, retain blast blackouts, and reset between sessions.
- Border segments crossing the date line are split at the seam.

## Structure

MorphingGlobe is reduced from about 800 lines to about 235. Shader definitions, dimensions, geometry, borders, city data, city state, rendering and turn lighting have separate modules. The unused duplicate city-light implementation is removed from Index.tsx.

## Validation

Regression tests exercise actual Three.js raycasting at four morph positions, date-line borders, city construction/destruction/reset/snapshots, visibility, and the turn lighting cycle.

The Chromium smoke fixture compiles the real shaders, checks rendered pixels for day shading and night emission, changes day/night/vector modes without resetting the flat map, and checks the production GlobeScene projector/picker at desktop and DPR-3 portrait sizes. Screenshots are uploaded as a CI artifact. The normal CI also runs the complete Vitest suite and the GitHub Pages production build.

The local shell's Node/git executables are unavailable and the Node tool is denied by the environment's approval policy, so execution validation runs in GitHub Actions.

## Limits

Gameplay city clusters are visual representations around national map anchors, not a dataset of named real-world cities. Satellite night imagery remains the source of real geographic city lights. Combat population/city losses retain their existing gameplay contracts. This change does not complete the production/refinement stockpile integration gaps documented in the earlier gameplay audit.
