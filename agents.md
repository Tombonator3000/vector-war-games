# Agent Development Guidelines - NORAD VECTOR

**Purpose:** This document provides mandatory guidelines for AI agents and developers working on this codebase to ensure maintainable, modular, and high-quality code.

---

## 🎯 Core Principles

### 1. **Module-Based Architecture (MANDATORY)**

**All code MUST be modular to minimize future refactoring.**

- ✅ **DO:** Create small, focused modules with single responsibilities
- ✅ **DO:** Export functions and types that can be imported and reused
- ✅ **DO:** Keep files under 500 lines when possible
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
src/utils/
  └── allCalculations.ts         // 2000+ lines mixing everything
```

---

### 2. **Separation of Data and Logic (MANDATORY)**

**Files MUST NOT mix data definitions and business logic.**

#### Data Files (Constants, Types, Configs)
- ✅ **DO:** Store in dedicated `/data/`, `/constants/`, or `/types/` directories
- ✅ **DO:** Use clear naming: `*.data.ts`, `*.constants.ts`, `*.types.ts`
- ✅ **DO:** Keep data files pure (no logic, no side effects)

#### Logic Files (Functions, Classes, Utilities)
- ✅ **DO:** Store in `/utils/`, `/services/`, or `/lib/` directories
- ✅ **DO:** Import data from data files
- ✅ **DO:** Keep functions pure and testable when possible

**Example:**
```typescript
// ✅ GOOD: Separated data and logic

// techTree.data.ts (ONLY DATA)
export const TECH_TREE_DATA = {
  "cybersecurity": { cost: 1000, prereqs: [] },
  "quantum": { cost: 2000, prereqs: ["cybersecurity"] }
};

// techTree.utils.ts (ONLY LOGIC)
import { TECH_TREE_DATA } from './techTree.data';

export function canResearchTech(techId: string, nation: Nation): boolean {
  const tech = TECH_TREE_DATA[techId];
  return nation.science >= tech.cost;
}

// ❌ BAD: Mixed data and logic in one file
export const TECH_TREE_DATA = { /* ... */ };
export function canResearchTech() { /* ... */ }
export function researchTech() { /* ... */ }
export function getTechCost() { /* ... */ }
```

---

### 3. **File Organization Standards**

#### Directory Structure
```
src/
├── components/          # React components ONLY
│   ├── ui/             # Pure UI components (buttons, cards, etc.)
│   ├── game/           # Game-specific components
│   └── layout/         # Layout components
│
├── data/               # Pure data definitions
│   ├── techTree.data.ts
│   ├── units.data.ts
│   └── nations.data.ts
│
├── types/              # TypeScript interfaces and types
│   ├── game.types.ts
│   └── api.types.ts
│
├── utils/              # Pure utility functions
│   ├── calculations/   # Math and calculation functions
│   ├── validation/     # Validation functions
│   └── formatting/     # Formatting functions
│
├── services/           # Business logic and services
│   ├── gameEngine/
│   ├── api/
│   └── state/
│
├── hooks/              # React custom hooks
│
└── constants/          # App-wide constants
```

#### Naming Conventions
- **Data files:** `*.data.ts` (e.g., `techTree.data.ts`)
- **Type files:** `*.types.ts` (e.g., `game.types.ts`)
- **Utility files:** `*.utils.ts` (e.g., `combat.utils.ts`)
- **Hook files:** `use*.ts` (e.g., `useGameState.ts`)
- **Component files:** PascalCase (e.g., `TechTree.tsx`)

---

## 📏 Code Quality Standards

### 4. **Function Size and Complexity**

- ✅ **DO:** Keep functions under 50 lines
- ✅ **DO:** Extract complex logic into helper functions
- ✅ **DO:** Use descriptive function names that explain purpose
- ❌ **DON'T:** Create 500+ line functions that do multiple things

**Example:**
```typescript
// ✅ GOOD: Modular functions
export function processEndTurn(gameState: GameState): GameState {
  const afterEconomy = processEconomy(gameState);
  const afterCombat = processCombat(afterEconomy);
  const afterDiplomacy = processDiplomacy(afterCombat);
  return afterDiplomacy;
}

function processEconomy(state: GameState): GameState { /* ... */ }
function processCombat(state: GameState): GameState { /* ... */ }
function processDiplomacy(state: GameState): GameState { /* ... */ }

// ❌ BAD: Monolithic function
export function processEndTurn(gameState: GameState): GameState {
  // 500 lines of mixed economy, combat, and diplomacy logic
}
```

---

### 5. **Import Organization**

Order imports logically:
```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';

// 2. Internal types
import type { GameState, Nation } from '@/types/game.types';

// 3. Internal data
import { TECH_TREE_DATA } from '@/data/techTree.data';

// 4. Internal utilities
import { calculateCombat } from '@/utils/calculations/combat.utils';

// 5. Internal components
import { TechTree } from '@/components/game/TechTree';
```

---

### 6. **State Management**

- ✅ **DO:** Use React hooks for component-local state
- ✅ **DO:** Use context for shared state across components
- ✅ **DO:** Keep state updates pure and predictable
- ❌ **DON'T:** Mutate state directly
- ❌ **DON'T:** Store derived values in state (calculate on render instead)

---

### 7. **Type Safety**

- ✅ **DO:** Define explicit TypeScript interfaces for all data structures
- ✅ **DO:** Use `type` for unions and simple aliases
- ✅ **DO:** Use `interface` for object shapes and classes
- ✅ **DO:** Avoid `any` type (use `unknown` if type is truly unknown)
- ❌ **DON'T:** Use implicit types or `any`

---

### 8. **Error Handling**

- ✅ **DO:** Handle errors gracefully with try-catch
- ✅ **DO:** Provide meaningful error messages
- ✅ **DO:** Log errors for debugging
- ✅ **DO:** Return default values or null instead of throwing when appropriate
- ❌ **DON'T:** Let errors crash the app silently

---

### 9. **Performance Considerations**

- ✅ **DO:** Use `React.memo()` for expensive components
- ✅ **DO:** Use `useMemo()` and `useCallback()` for expensive calculations
- ✅ **DO:** Lazy-load large modules with dynamic imports
- ✅ **DO:** Debounce/throttle frequent updates
- ❌ **DON'T:** Render thousands of DOM elements (use virtualization)
- ❌ **DON'T:** Run expensive calculations on every render

---

### 10. **Documentation**

- ✅ **DO:** Add JSDoc comments for complex functions
- ✅ **DO:** Document parameters, return types, and side effects
- ✅ **DO:** Update log.md with significant changes
- ✅ **DO:** Keep README.md up to date
- ❌ **DON'T:** Over-comment obvious code

**Example:**
```typescript
/**
 * Calculates combat damage between attacker and defender
 *
 * @param attacker - The attacking nation's stats
 * @param defender - The defending nation's stats
 * @param terrain - Battlefield terrain type
 * @returns Damage dealt to defender (0-100)
 *
 * @example
 * const damage = calculateCombatDamage(usa, china, 'mountain');
 */
export function calculateCombatDamage(
  attacker: Nation,
  defender: Nation,
  terrain: TerrainType
): number {
  // Implementation
}
```

---

## 🚨 Refactoring Red Flags

**If you encounter these patterns, REFACTOR IMMEDIATELY:**

1. ❌ Files over 1000 lines
2. ❌ Functions over 100 lines
3. ❌ Duplicate code in 3+ places
4. ❌ Data definitions mixed with logic
5. ❌ Deep nesting (more than 3 levels)
6. ❌ Global mutable state
7. ❌ Tight coupling between unrelated modules
8. ❌ Circular dependencies

---

## 🔧 Refactoring Process

When refactoring large files:

1. **Analyze:** Identify distinct concerns/responsibilities
2. **Plan:** Create directory structure for new modules
3. **Extract Data:** Move constants/types to data files first
4. **Extract Utils:** Move pure functions to utility modules
5. **Extract Components:** Split large components into smaller ones
6. **Test:** Verify functionality after each extraction
7. **Document:** Update log.md with changes

**Example workflow:**
```bash
# Before refactoring
src/components/Game.tsx (3000 lines)

# After refactoring
src/components/Game.tsx (200 lines - main component)
src/data/game.data.ts (data definitions)
src/types/game.types.ts (interfaces)
src/utils/game/
  ├── combat.utils.ts
  ├── economy.utils.ts
  └── diplomacy.utils.ts
src/components/game/
  ├── CombatPanel.tsx
  ├── EconomyPanel.tsx
  └── DiplomacyPanel.tsx
```

---

## 📝 Commit and Logging Standards

### Git Commits
- ✅ Use clear, descriptive commit messages
- ✅ Follow format: `<type>: <description>`
- ✅ Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

**Examples:**
```
feat: Add quantum computing tech tree branch
fix: Resolve RNG undefined error in endTurn callback
refactor: Split canvasDrawingFunctions.ts into modular components
docs: Update agents.md with modular code guidelines
```

### Log.md Updates
- ✅ Document ALL significant changes in log.md
- ✅ Include: problem, root cause, fix applied, files changed
- ✅ Use clear date headers (YYYY-MM-DD format)
- ✅ Reference issue numbers when applicable

---

## ✅ Checklist for New Code

Before submitting new code, verify:

- [ ] Code is modular (single responsibility per file)
- [ ] Data and logic are separated
- [ ] File is under 500 lines
- [ ] Functions are under 50 lines
- [ ] All types are explicitly defined
- [ ] No duplicate code
- [ ] Imports are organized
- [ ] Error handling is present
- [ ] Performance is acceptable
- [ ] Documentation is added where needed
- [ ] log.md is updated
- [ ] Tests pass (if applicable)

---

## 🎓 Philosophy

**"Write code that is easy to delete, not easy to extend."**

The goal is to create small, independent modules that can be:
- Understood in isolation
- Tested independently
- Replaced without breaking other code
- Reused across the project

Modular code is maintainable code. When each file has a single, clear purpose, bugs are easier to find, features are easier to add, and refactoring becomes rare.

---

## 📚 Additional Resources

- See `log.md` for refactoring examples and lessons learned
- See recent PRs for modular code patterns (e.g., #861, #862, #863)
- TypeScript best practices: https://www.typescriptlang.org/docs/handbook/

---

**Last Updated:** 2026-01-14
**Maintained By:** Development Team
**Status:** Living Document (update as project evolves)
