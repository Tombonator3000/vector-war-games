# Gameplay code audit — 2026-10-08

## Fixed behavior

- Research and city construction advance once per production phase instead of twice per round. Restored queues with zero turns remaining finish safely.
- Production commands use immutable queue snapshots. Completion results return synchronously, occupied lines cannot be overwritten by batched commands, and a round cannot be processed twice. Production requires actual capacity instead of finishing on a countdown alone.
- Government production modifiers replace their previous multiplier instead of compounding every turn. Valid zero values remain zero.
- Static ideology combat, immigration and cyber contributions are replaced when reapplied or changed, while intended per-turn income remains additive.
- A paid resource trade's final delivery reaches the receiving nation before the expired agreement is removed.
- Diplomacy retains returned grievance/alliance updates while preserving shared Nation identities. Eliminated nations no longer receive income, research or elections.
- Reset and partial/co-op imports retain safe state defaults and authoritative player references. Cloned snapshots isolate nested data while preserving relationships within the snapshot. Reset advances a session token to invalidate old action previews.
- Strike confirmation is single-use and checks current inventory, live targets, actions, session, turn, DEFCON, technology and treaties for every delivery platform. Failed strikes restore inventory and queued weapons.
- ICBM effects use an ESM election-system import and record player launch statistics. Confirmation dependencies and React callback storage are wired correctly.
- Camera visibility no longer decides missile damage. MIRV deployment creates three payloads once and conserves the original total yield. Bomber/submarine removal does not skip neighboring entries. Pause freezes weapon progress.
- Double-clicking End Turn no longer cancels an active round's timers. Survival checks use population in millions. Nuclear casualty feedback uses subscribed events rather than a React setter outside its scope. Animation frames and turn timers are cancelled when the page unmounts.
- Great Old Ones updates run through a component-registered callback. Phase 2/3 effect batches are applied to campaign state with the correct argument types.
- Negotiation feedback tests use controlled randomness and check every valid message and probability boundary.
- Advisor readiness, speech and playback work discards stale async completions after unmount or Strict Mode cleanup; failed readiness/playback requests are handled.

## Structure

The former 1,300-line phase handler is a small public facade with separate production, diplomacy, election, timer, resource and resolution modules. State types, defaults and snapshot normalization are separate from the manager. Production queue transitions are pure helpers. Deployment/PWA configuration is separate from Vitest configuration, and CI verifies the Pages build as well as tests.

## Remaining gaps

- Production templates emit `add_building` completion effects, but no canonical building/army completion contract applies those effects to the Nation or conventional-warfare state. The existing behavior is retained; correcting it needs a defined mapping between templates and simulation entities.
- Resource refinement currently removes finished orders without depositing output into stockpiles. The hook's stockpile arguments are unused. It needs explicit integration with the resource ownership system before enabling reliable processing.
- `src/pages/Index.tsx` and `useFlashpoints.ts` still contain large amounts of UI, data and simulation orchestration. Their remaining responsibilities should be extracted in tested steps.
- Existing repository-wide typing and lint debt is outside the focused modules repaired here. Vite production builds do not substitute for TypeScript checking.

## Validation

Deterministic regressions cover phase progression, state resets/imports, production batching, launch previews, inventories, MIRV yield, hidden impacts, pause, survival units and casualty feedback. Native Node checks exercised actual modules locally. The PR's GitHub Actions run is the authoritative full-suite and Pages-build result.
