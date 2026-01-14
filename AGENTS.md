# Vector War Games Contributor Guide

## Project Overview
- **Purpose:** Vector War Games is a Vite-powered TypeScript/React experience that simulates Cold War crisis management across nuclear, diplomatic, and pandemic fronts. The gameplay loop stitches together strategic map interactions (`GlobeScene`), narrative events (`FlashpointModal`), and global condition trackers (pandemic, fog of war, diplomacy) to immerse players in high-stakes decision making.
- **Target Audience:** Designed for strategy enthusiasts and narrative-driven simulation fans who appreciate alternate-history techno-thrillers, along with educators or streamers showcasing systems-driven crisis management.
- **Design Pillars:**
  - **Data-driven simulations:** Core mechanics (flashpoints, pandemics, fog of war) are encapsulated as React hooks (`useFlashpoints`, `usePandemic`, `useFogOfWar`) that expose deterministic state transitions and side-effects for UI orchestration.
  - **Composable UI layers:** Gameplay renders through modular components (`GlobeScene`, `PandemicPanel`, `NewsTicker`, `TutorialOverlay`) coordinated by page-level containers like `pages/Index.tsx`. Each module owns its styling and state wiring.
  - **Player feedback first:** Hooks emit rich metadata (e.g., flashpoint advisor stances, pandemic stage thresholds, fog reveal states) so components can surface responsive toasts, overlays, and tutorial guidance.
  - **Deterministic React integration:** Hooks rely on `useCallback`, `useMemo`, and controlled refs to stabilise game loops and side effects, keeping render cycles predictable even with randomised event payloads.

## Coding Standards

### 🎯 Module-Based Architecture (MANDATORY)
**All code MUST be modular to minimize future refactoring.**

- ✅ **DO:** Create small, focused modules with single responsibilities
- ✅ **DO:** Keep files under 500 lines when possible
- ✅ **DO:** Keep functions under 50 lines
- ❌ **DON'T:** Create monolithic files with multiple concerns
- ❌ **DON'T:** Mix unrelated functionality in the same module

**Example Structure:**
```typescript
// ✅ GOOD: Modular approach
src/utils/calculations/
  ├── economicCalculations.ts    // Only economic math
  ├── combatCalculations.ts      // Only combat math
  └── resourceCalculations.ts    // Only resource math

// ❌ BAD: Monolithic approach
src/utils/allCalculations.ts     // 2000+ lines mixing everything
```

### 📂 Separation of Data and Logic (MANDATORY)
**Files MUST NOT mix data definitions and business logic.**

#### Data Files (Constants, Types, Configs)
- ✅ Store in dedicated `/data/`, `/constants/`, or `/types/` directories
- ✅ Use clear naming: `*.data.ts`, `*.constants.ts`, `*.types.ts`
- ✅ Keep data files pure (no logic, no side effects)

#### Logic Files (Functions, Classes, Utilities)
- ✅ Store in `/utils/`, `/services/`, or `/lib/` directories
- ✅ Import data from data files
- ✅ Keep functions pure and testable when possible

**Example:**
```typescript
// ✅ GOOD: Separated
// techTree.data.ts (ONLY DATA)
export const TECH_TREE_DATA = {
  "cybersecurity": { cost: 1000, prereqs: [] }
};

// techTree.utils.ts (ONLY LOGIC)
import { TECH_TREE_DATA } from './techTree.data';
export function canResearchTech(techId: string, nation: Nation): boolean {
  return nation.science >= TECH_TREE_DATA[techId].cost;
}

// ❌ BAD: Mixed data and logic in one file
```

### 🚨 Refactoring Red Flags
**If you encounter these patterns, REFACTOR IMMEDIATELY:**
- ❌ Files over 1000 lines
- ❌ Functions over 100 lines
- ❌ Duplicate code in 3+ places
- ❌ Data definitions mixed with logic
- ❌ Deep nesting (more than 3 levels)

### 📁 Directory Structure Standards
```
src/
├── components/          # React components ONLY
│   ├── ui/             # Pure UI components
│   ├── game/           # Game-specific components
│   └── layout/         # Layout components
├── data/               # Pure data definitions
├── types/              # TypeScript interfaces/types
├── utils/              # Pure utility functions
├── services/           # Business logic and services
├── hooks/              # React custom hooks
└── constants/          # App-wide constants
```

### 🔤 Naming Conventions
- **Data files:** `*.data.ts` (e.g., `techTree.data.ts`)
- **Type files:** `*.types.ts` (e.g., `game.types.ts`)
- **Utility files:** `*.utils.ts` (e.g., `combat.utils.ts`)
- **Hook files:** `use*.ts` (e.g., `useGameState.ts`)
- **Component files:** PascalCase (e.g., `TechTree.tsx`)

### 💻 TypeScript Practices
- Prefer explicit interfaces/types for gameplay entities (see `pages/Index.tsx` and hooks for patterns). Avoid `any`; if unavoidable, annotate with TODO to refine.
- Use discriminated unions for complex states (`PandemicStage`, `FlashpointEvent.category`, etc.) to enable exhaustive handling.
- Co-locate helper functions near their usage unless shared broadly; promote to `src/lib` when reused across domains.

### ⚛️ React & Hooks
- Keep hook signatures focused on a single domain and expose imperative handlers via callbacks rather than mutating shared state.
- Memoize expensive computations (`useMemo`) and event handlers (`useCallback`) to align with existing performance expectations in `GlobeScene` and custom hooks.
- Prefer composition over prop drilling: wrap shared providers (React Query, Tooltip, Toaster) at `App.tsx` level.
- Use `React.memo()` for expensive components to prevent unnecessary re-renders.

### 🎨 Tailwind CSS Usage
- Compose utility classes directly in JSX; extract shared patterns into helper components when repeated.
- Use design tokens consistent with current neon vector aesthetic (e.g., `bg-slate-900`, `text-cyan-300`).
- Avoid inline style objects unless interacting with three.js or canvas APIs.

### 🧩 shadcn-ui Patterns
- Import via `@/components/ui/*` barrel exports.
- Keep dialog/sheet primitives declarative; stateful logic lives in parent components.
- When extending primitives, respect shadcn UI's variant props and className merging patterns.

### 📖 Documentation Standards
- Add JSDoc comments for complex functions
- Document parameters, return types, and side effects
- Update log.md with significant changes

**Example:**
```typescript
/**
 * Calculates combat damage between attacker and defender
 * @param attacker - The attacking nation's stats
 * @param defender - The defending nation's stats
 * @param terrain - Battlefield terrain type
 * @returns Damage dealt to defender (0-100)
 */
export function calculateCombatDamage(
  attacker: Nation,
  defender: Nation,
  terrain: TerrainType
): number {
  // Implementation
}
```

## Testing Expectations
- Primary test framework is **Vitest** with **React Testing Library**.
- Ensure new hooks/components include unit or integration tests under `src/hooks/__tests__/` or parallel component test folders.
- Tests should validate deterministic outcomes for randomised systems by seeding/mocking randomness when feasible (e.g., flashpoint resolution odds, pandemic mutations).
- Run `npm run test` locally before opening a PR; CI mirrors this command.

## Review & PR Checklist
- [ ] Confirm TypeScript passes `tsc --noEmit` (implicit via Vite build) or local IDE diagnostics.
- [ ] Run `npm run lint` if lint rules are added/updated.
- [ ] Execute `npm run test` and ensure coverage for new gameplay logic.
- [ ] Validate UI changes across dark/high-contrast themes when relevant.
- [ ] Update documentation or tutorial overlays if mechanics shift.
- [ ] Seek review from gameplay & UX maintainers for balance-affecting changes.

## Game Design Guidance
- **Core Mechanics:**
  - Flashpoints present branching crisis events with probabilistic outcomes and advisor feedback; resolve via `useFlashpoints`' template-driven options.
  - Pandemic system escalates through stages driven by infection/mutation thresholds in `usePandemic`; countermeasures adjust containment, lethality, and news output.
  - Fog of war and reconnaissance are governed by `useFogOfWar`, revealing map intel progressively and interacting with DEFCON/game phase states from `pages/Index.tsx`.
  - Globe interactions funnel through `GlobeScene` using `@react-three/fiber` to render territories, city lights, and selectable nations.
- **Balance Goals:**
  - Maintain tension between immediate crisis response and long-term stability (DEFCON, diplomacy, production). Adjust odds and timers to keep failure states possible but recoverable.
  - Ensure advisor recommendations meaningfully inform decision making; probabilities should reward diverse playstyles without trivialising optimal paths.
  - Pandemic and flashpoint escalations should interplay—e.g., high infection rates reducing available actions—without creating unwinnable spirals.
- **UX Expectations:**
  - Keep overlays (tutorial, flashpoint modals, pandemic alerts) non-blocking unless critical decisions are required.
  - Surface feedback through toasts (`use-toast`) and ticker updates to narrate systemic changes.
  - Preserve accessibility: keyboard navigable dialogs, sufficient color contrast, descriptive aria labels when adding interactive controls.
- **Asset Pipeline:**
  - Vector-styled assets live under `public/` or are generated procedurally (e.g., globe textures). Supply new assets as optimized SVG/GLTF where possible.
  - Integrate media via Vite static imports or dynamic loaders compatible with React Suspense used in `GlobeScene`.
- **Introducing New Features/Levels:**
  - Extend domain hooks with new state fields and pure helpers; expose them through typed return objects rather than mutating external data.
  - Add new crisis templates or pandemic events by appending to existing constant arrays to reuse balancing logic.
  - When adding map layers or missions, implement dedicated components under `src/components/` and wire them into page containers with feature flags or tutorial updates to maintain narrative continuity.

## Strategic Map Engine Directive
- The strategic 2D world view must default to the Three.js tactical engine using the flat-realistic high-resolution satellite texture.
- Cesium integrations are experimental test maps only; do not promote Cesium beyond optional/testing contexts.

Adhere to this guide for all future contributions; update sections if gameplay pillars evolve.

## Logging Requirement
- Record every action related to this repository in `log.md` with precise timestamps.
