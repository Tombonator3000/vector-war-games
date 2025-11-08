# Diplomacy System Architecture

## Canonical Relationship Model
- **Source of truth:** `src/lib/relationshipUtils.ts` exports all thresholds, modifiers, and helpers.
- **Scale:** Relationships range from -100 to +100 with neutral at 0.
- **Alliance threshold:** Alliances require a score of **+60** (`RELATIONSHIP_ALLIED`).
- **Categories:** Hostile (-100 to -60), Unfriendly (-59 to -31), Neutral (-30 to +29), Friendly (+30 to +59), Allied (≥ +60).
- **Decay:** `calculateRelationshipDecay` applies a dynamic drift of 1 point per turn toward neutral, increasing to 2 points once a relationship crosses the allied threshold (in either direction).
- **Proposal acceptance:** `getAcceptanceModifier` provides linear scaling (relationship 100 = 2.0x) to avoid runaway acceptance probabilities while rewarding strong diplomacy.

## Phase System Integration
- **Phase 1 (Trust/Favors)** and **Phase 2 (Grievances/Alliances)** persist as *input modifiers*.
  - `unifiedDiplomacyMigration` converts legacy trust/favor/grievance data into unified relationship values and keeps trust histories synchronized for AI use.
  - Relationship updates invoke trust adjustments at one quarter of the relationship delta to preserve slower strategic drift.
- **Phase 3 (Council / DIP currency)** still exists for council gameplay, but all outward-facing relationship checks defer to the unified metrics.
- **Authoritative flow:**
  1. Phase subsystems calculate modifiers.
  2. Modifiers funnel into `modifyRelationship`/`updateRelationship`.
  3. UI, AI, and game rules read relationships only via `relationshipUtils` helpers.
- **Deprecation note:** Older per-phase relationship lookups are deprecated; use the unified helpers instead. Migration scripts upgrade legacy saves automatically, but backward compatibility with pre-unified saves is no longer maintained.

## Proposal Lifecycle
- **Creation:** AI proposals and player-initiated requests instantiate `DiplomaticProposal` objects with the current turn index.
- **Queueing:** Incoming proposals pass through `enqueueAIProposalRef`, which filters out entries older than 10 turns before enqueueing them.
- **Expiry:** On each turn transition the queue drops aged proposals, and any active modal is dismissed with a toast explaining the expiry.
- **Validation:** Attempting to surface a proposal older than 10 turns is rejected so stale diplomacy does not clog the UI or memory.

## Alliance Logic
- **Eligibility:** Always consult `canFormAlliance` to determine if the alliance threshold is met.
- **UI consistency:** `UnifiedDiplomacyPanel` and `Index.tsx` both rely on the same helpers, ensuring buttons and backend checks stay aligned.
- **Obligations:** Alliance-related penalties (e.g., from conventional warfare) now supply explicit reasons and turn indices, keeping history consistent for future grievance tracking.

## Operational Tips
- Import thresholds or relationship helpers from `@/lib/relationshipUtils` whenever gameplay logic depends on diplomacy values.
- When adding new diplomacy events, ensure they emit a reason string and the active turn so `modifyRelationship` can maintain history.
- For save migrations, reuse `migrateGameDiplomacy` to populate unified relationship fields before reading them in new systems.
