# Phase 3 – Economic Depth Implementation

_Last updated: 2025-11-06_

This document describes the concrete implementation of the economic depth systems introduced in Phase 3 of the Hearts of Iron audit track. The goal of this phase is to provide playable mechanics—trade, refinement, and infrastructure—that can be surfaced in the UI, exercised during turn resolution, and extended by follow-up tasks.

---

## 1. Type System

All domain contracts for Phase 3 live in `src/types/economicDepth.ts`. The file defines:

- **Nations & goods** – `NationSummary`, `TradeGood`
- **Trade** – `TradeRoute`, `TradeAgreement`, `TradeProposal`, `EconomicSanction`, and `TradeStatistics`
- **Refinement** – `Refinery`, `RefinementOrder`, `RefineryConversionRate`, and `RefinementBonus`
- **Infrastructure** – `BuildingProject`, `EconomicZone`, and `InfrastructureStatistics`
- **Master Interfaces** – Shared hook contracts (`EnhancedTradeSystem`, `ResourceRefinementSystem`, `EconomicInfrastructureSystem`, `EconomicDepthSystem`)

The module provides the canonical shapes used by hooks, UI, and any turn-processing logic. Future work should extend these interfaces rather than redefining ad‑hoc types elsewhere in the codebase.

---

## 2. Hooks (Business Logic)

### `useEnhancedTradeSystem`
Location: `src/hooks/useEnhancedTradeSystem.ts`

- Stores trade routes, agreements, proposals, and sanctions in React state.
- Calculates aggregate statistics (capacity, average efficiency, disruption count).
- Exposes imperative helpers to propose/finalise trades, adjust protection, and manage sanctions.
- Provides a `processTurn` method that decays disruption, renews agreements, and expires sanctions.

### `useResourceRefinement`
Location: `src/hooks/useResourceRefinement.ts`

- Tracks refinery instances and queued refinement orders.
- Merges built‑in conversion recipes with optional overrides passed from callers.
- Increments refinery efficiency and resolves queued orders each turn.
- Returns baseline strategic bonuses representing the narrative benefits of refined goods.

### `useEconomicInfrastructure`
Location: `src/hooks/useEconomicInfrastructure.ts`

- Maintains construction projects and economic zones.
- Calculates infrastructure statistics (average level, damaged structures, maintenance load).
- Handles project progress, repairs, and zone lifecycle operations.

### `useEconomicDepth`
Location: `src/hooks/useEconomicDepth.ts`

- Composes the three subsystem hooks into a single façade.
- Produces a `snapshot` describing the current economic power, trade, refinement, and infrastructure state.
- Supplies recommendation strings for a focus nation based on subsystem heuristics.
- Tracks the most recently processed turn and exposes setters for the focus nation.

Each hook is deterministic given its inputs and avoids side effects outside of React state, matching existing gameplay hook patterns in the repository.

---

## 3. UI Components

The UI layer lives under `src/components/`:

- **`EnhancedTradePanel.tsx`** – Visualises trade routes, agreements, and sanctions with capacity/efficiency readouts.
- **`ResourceRefinementPanel.tsx`** – Lists refineries, queued orders, and the strategic bonuses unlocked by refined resources.
- **`EconomicInfrastructurePanel.tsx`** – Shows construction progress and economic zones with maintenance and bonus summaries.
- **`EconomicDashboard.tsx`** – A master dashboard that wires `useEconomicDepth`, renders tabbed sub-panels, and surfaces high-level metrics plus advisor recommendations.

All components follow the neon vector design language used elsewhere (slate backgrounds, cyan/emerald/amber accents) and require only the data returned by the hooks.

---

## 4. Integration Pattern

To integrate the economic systems inside a page or game loop:

```tsx
import { EconomicDashboard } from "@/components/EconomicDashboard";
import type { NationSummary } from "@/types/economicDepth";

const nations: NationSummary[] = [
  { id: "usa", name: "United States" },
  { id: "urs", name: "Soviet Union" },
];

function EconomicScreen() {
  return (
    <EconomicDashboard
      nations={nations}
      currentTurn={42}
      focusNationId="usa"
    />
  );
}
```

The dashboard internally instantiates `useEconomicDepth`, so callers only need to supply the participating nations and turn index. More advanced scenarios can pass `tradeParams`, `refinementParams`, or `infrastructureParams` to seed the hooks with saved state.

---

## 5. Testing Considerations

- Unit-test the hooks by rendering them in isolation with React Testing Library’s `renderHook` utility and asserting state transitions (`processTurn`, `finalizeTrade`, etc.).
- When integrating into the wider game loop, call `processEconomicTurn` during turn resolution and persist the updated hook state back into your store.
- Snapshot tests for the dashboard ensure the three panels render the expected counts/values for representative data sets.

---

## 6. Future Extensions

The current implementation focuses on providing deterministic scaffolding. Suggested next steps:

1. **Trade proposals UI** – Surface pending proposals and acceptance flows in `EnhancedTradePanel`.
2. **AI scripting** – Use `getEconomicRecommendations` to drive non-player economic behaviour.
3. **Persistence** – Serialise hook state between sessions (e.g., to Supabase) to enable long campaigns.
4. **Balance iteration** – Tune efficiency deltas, disruption decay, and economic power weighting based on playtesting feedback.

These enhancements can be layered on top of the existing types and hooks without breaking their contracts.

---

## 7. Changelog

- **2025-11-06** – Initial playable implementation of Phase 3 systems (trade, refinement, infrastructure, dashboard UI).
