# Agent Development Guidelines - NORAD VECTOR

**Purpose:** This document provides mandatory guidelines for AI agents and developers working on this codebase to ensure maintainable, modular, and high-quality code.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Principles & Architecture](#core-principles)
3. [Code Quality Standards](#code-quality-standards)
4. [Refactoring Guidelines](#refactoring-red-flags)
5. [Testing Expectations](#testing-expectations)
6. [Game Design Guidance](#game-design-guidance)
7. [AI Advisor System](#ai-advisor-system)
8. [Commit and Logging Standards](#commit-and-logging-standards)

---

## Project Overview

### Purpose & Target Audience
- **Purpose:** Vector War Games is a Vite-powered TypeScript/React experience that simulates Cold War crisis management across nuclear, diplomatic, and pandemic fronts. The gameplay loop stitches together strategic map interactions (`GlobeScene`), narrative events (`FlashpointModal`), and global condition trackers (pandemic, fog of war, diplomacy) to immerse players in high-stakes decision making.
- **Target Audience:** Designed for strategy enthusiasts and narrative-driven simulation fans who appreciate alternate-history techno-thrillers, along with educators or streamers showcasing systems-driven crisis management.

### Design Pillars
- **Data-driven simulations:** Core mechanics (flashpoints, pandemics, fog of war) are encapsulated as React hooks (`useFlashpoints`, `usePandemic`, `useFogOfWar`) that expose deterministic state transitions and side-effects for UI orchestration.
- **Composable UI layers:** Gameplay renders through modular components (`GlobeScene`, `PandemicPanel`, `NewsTicker`, `TutorialOverlay`) coordinated by page-level containers like `pages/Index.tsx`. Each module owns its styling and state wiring.
- **Player feedback first:** Hooks emit rich metadata (e.g., flashpoint advisor stances, pandemic stage thresholds, fog reveal states) so components can surface responsive toasts, overlays, and tutorial guidance.
- **Deterministic React integration:** Hooks rely on `useCallback`, `useMemo`, and controlled refs to stabilise game loops and side effects, keeping render cycles predictable even with randomised event payloads.

### Strategic Map Engine Directive
- The strategic 2D world view must default to the Three.js tactical engine using the flat-realistic high-resolution satellite texture.
- Cesium integrations are experimental test maps only; do not promote Cesium beyond optional/testing contexts.

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

### 5. **TypeScript Practices**

- ✅ **DO:** Prefer explicit interfaces/types for gameplay entities
- ✅ **DO:** Use discriminated unions for complex states
- ✅ **DO:** Use `type` for unions and simple aliases
- ✅ **DO:** Use `interface` for object shapes and classes
- ✅ **DO:** Avoid `any` type (use `unknown` if type is truly unknown)
- ❌ **DON'T:** Use implicit types or `any`

---

### 6. **React & Hooks Best Practices**

- ✅ **DO:** Keep hook signatures focused on a single domain
- ✅ **DO:** Use `React.memo()` for expensive components
- ✅ **DO:** Use `useMemo()` and `useCallback()` for expensive calculations
- ✅ **DO:** Expose imperative handlers via callbacks rather than mutating shared state
- ✅ **DO:** Memoize expensive computations to align with performance expectations
- ✅ **DO:** Prefer composition over prop drilling
- ❌ **DON'T:** Mutate state directly
- ❌ **DON'T:** Store derived values in state (calculate on render instead)

---

### 7. **Import Organization**

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

## Testing Expectations

### Primary Framework
- **Test Framework:** Vitest with React Testing Library
- **Location:** Tests under `src/hooks/__tests__/` or parallel component test folders

### Test Requirements
- ✅ Ensure new hooks/components include unit or integration tests
- ✅ Validate deterministic outcomes for randomised systems by seeding/mocking randomness
- ✅ Test flashpoint resolution odds, pandemic mutations, and other probabilistic systems
- ✅ Run `npm run test` locally before opening a PR
- ✅ CI mirrors this command

---

## Game Design Guidance

### Core Mechanics

#### Flashpoints
- Present branching crisis events with probabilistic outcomes and advisor feedback
- Resolve via `useFlashpoints`' template-driven options
- Maintain tension between immediate crisis response and long-term stability

#### Pandemic System
- Escalates through stages driven by infection/mutation thresholds in `usePandemic`
- Countermeasures adjust containment, lethality, and news output
- Should interplay with flashpoints (e.g., high infection rates reducing available actions)

#### Fog of War
- Governed by `useFogOfWar`, revealing map intel progressively
- Interacts with DEFCON/game phase states from `pages/Index.tsx`

#### Globe Interactions
- Funnel through `GlobeScene` using `@react-three/fiber`
- Render territories, city lights, and selectable nations

### Balance Goals
- Maintain tension between immediate crisis response and long-term stability (DEFCON, diplomacy, production)
- Adjust odds and timers to keep failure states possible but recoverable
- Ensure advisor recommendations meaningfully inform decision making
- Probabilities should reward diverse playstyles without trivialising optimal paths
- Pandemic and flashpoint escalations should interplay without creating unwinnable spirals

### UX Expectations
- Keep overlays (tutorial, flashpoint modals, pandemic alerts) non-blocking unless critical decisions are required
- Surface feedback through toasts (`use-toast`) and ticker updates to narrate systemic changes
- Preserve accessibility: keyboard navigable dialogs, sufficient color contrast, descriptive aria labels

### Asset Pipeline
- Vector-styled assets live under `public/` or are generated procedurally
- Supply new assets as optimized SVG/GLTF where possible
- Integrate media via Vite static imports or dynamic loaders compatible with React Suspense

### Introducing New Features
- Extend domain hooks with new state fields and pure helpers
- Expose them through typed return objects rather than mutating external data
- Add new crisis templates or pandemic events by appending to existing constant arrays
- Implement dedicated components under `src/components/`
- Wire into page containers with feature flags or tutorial updates

---

## 🎭 AI Advisor System

### Overview
The Agent System provides intelligent, voice-enabled advisors that guide players through strategic decisions, react to game events, and provide dynamic commentary. This system uses ElevenLabs for text-to-speech and implements an adaptive personality framework.

---

### Advisor Personalities

#### 1. General Marcus "Iron" Stone (Military Advisor)
**Voice:** Roger (EXAVITQu4vr4xnSDxMaL) - Deep, authoritative
**Personality:** Hawkish, direct, action-oriented
**Triggers:**
- DEFCON changes
- Military buildups detected
- Combat engagements
- Defense system failures

**Sample Lines:**
```
"DEFCON 3 confirmed, Mr. President. Recommend immediate alert posture."
"Enemy missile silos operational. We should strike first while we have the advantage."
"Our ABM systems intercepted 12 warheads. Defense grid holding... for now."
"Intelligence shows massive troop movements. This is it."
```

**Personality Traits:**
- Favors military solutions
- Impatient with diplomacy
- Respects strength
- Dislikes indecision

---

#### 2. Dr. Eleanor Vance (Science Advisor)
**Voice:** Sarah (EXAVITQu4vr4xnSDxMaL) - Calm, analytical
**Personality:** Rational, cautious, long-term thinker
**Triggers:**
- Research completions
- Environmental catastrophes
- Radiation warnings
- Tech breakthroughs

**Sample Lines:**
```
"Research complete: Titan-Class Weaponization. I pray we never use it."
"Nuclear winter projections are... catastrophic. 80% crop failure within six months."
"Radiation levels in sector 7 are lethal. Evacuation recommended immediately."
"Our satellite network is now operational. Knowledge is our greatest weapon."
```

**Personality Traits:**
- Emphasizes consequences
- Fears nuclear escalation
- Values knowledge
- Warns of environmental collapse

---

#### 3. Ambassador Katherine Wei (Diplomatic Advisor)
**Voice:** Charlotte (XB0fDUnXU5powFXDhCwa) - Diplomatic, measured
**Personality:** Patient, persuasive, idealistic
**Triggers:**
- Treaty negotiations
- Alliance formations
- International incidents
- UN actions

**Sample Lines:**
```
"Mr. President, the UN General Secretary is on the line. They're proposing a ceasefire."
"Breaking a treaty now would destroy our credibility. We must honor our word."
"I've secured a non-aggression pact with France. It's fragile, but it holds."
"The world is watching. How we respond here defines our legacy."
```

**Personality Traits:**
- Prefers negotiation
- Values reputation
- Builds coalitions
- Avoids unnecessary conflict

---

#### 4. Director James "Shadow" Garrett (Intelligence)
**Voice:** Daniel (onwK4e9ZLuTAKqWW03F9) - Measured, cryptic
**Personality:** Paranoid, secretive, pragmatic
**Triggers:**
- Intel operations success/failure
- Espionage detected
- Cover ops missions
- Satellite data

**Sample Lines:**
```
"Our asset in Moscow confirms: they're preparing a first strike."
"Sir, we've been compromised. Someone leaked our launch codes."
"Satellite recon shows something... unusual. Underground construction, massive scale."
"Trust no one, Mr. President. Even our allies have secrets."
```

**Personality Traits:**
- Sees threats everywhere
- Values intelligence over force
- Distrusts everyone
- Operates in shadows

---

#### 5. Secretary Hayes (Economic Advisor)
**Voice:** Bill (pqHfZKP75CvOlQylNhV4) - Practical, numbers-focused
**Personality:** Pragmatic, cautious with resources
**Triggers:**
- Resource shortages
- Economic warfare
- Production milestones
- Budget crises

**Sample Lines:**
```
"Mr. President, we're burning through uranium reserves at an unsustainable rate."
"The economy is in freefall. We need trade agreements, not more missiles."
"Production quotas exceeded. Our industrial might is unmatched."
"Sanctions are crippling their economy. Another month and they'll collapse."
```

**Personality Traits:**
- Bottom-line oriented
- Opposes expensive wars
- Supports economic warfare
- Warns of overextension

---

#### 6. Press Secretary Morgan (Public Relations)
**Voice:** Jessica (cgSgspJ2msm6clMCkdW9) - Urgent, media-savvy
**Personality:** Image-conscious, politically aware
**Triggers:**
- Morale changes
- Political events
- Public protests
- Media scandals

**Sample Lines:**
```
"Mr. President, the press is going wild. We need a statement NOW."
"Public approval just dropped 15 points. The people want peace."
"Protests in every major city. They're burning flags and calling for your resignation."
"Our propaganda campaign is working. National morale is soaring."
```

**Personality Traits:**
- Obsessed with optics
- Fears public backlash
- Spins everything
- Monitors polls constantly

---

### Adaptive Commentary System

#### Dynamic Context Awareness
Advisors comment based on:
- **Game State:** DEFCON, turn number, resources, threats
- **Recent Actions:** Last 3 player decisions
- **Trends:** Rising/falling metrics
- **Personality:** Each advisor's bias filters their advice

#### Interruption System
**Priority Levels:**
1. **CRITICAL:** Nuclear launch detected, capital under attack
2. **URGENT:** DEFCON change, treaty broken, resource crisis
3. **IMPORTANT:** Research done, intel report, morale event
4. **ROUTINE:** Turn summary, advisor musings

**Rules:**
- CRITICAL interrupts everything, plays immediately
- URGENT waits for current line to finish
- IMPORTANT queues (max 3)
- ROUTINE only plays during idle moments

#### Conflict Resolution
When multiple advisors want to speak:
```typescript
// Priority: Military > Intel > Diplomatic > Science > Economic > PR
if (multiplePendingLines) {
  const priorityOrder = ['military', 'intel', 'diplomatic', 'science', 'economic', 'pr'];
  const selectedAdvisor = priorityOrder.find(role => hasPendingLine(role));
  playLine(selectedAdvisor);
}
```

---

### ElevenLabs Integration

#### Voice Configuration
```typescript
const ADVISOR_VOICES = {
  military: {
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger
    model: 'eleven_turbo_v2_5',
    stability: 0.7,
    similarityBoost: 0.8,
    style: 0.6, // More expressive
  },
  science: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    model: 'eleven_turbo_v2_5',
    stability: 0.9,
    similarityBoost: 0.7,
    style: 0.3, // More neutral
  },
  diplomatic: {
    voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte
    model: 'eleven_turbo_v2_5',
    stability: 0.8,
    similarityBoost: 0.8,
    style: 0.5,
  },
  intel: {
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    model: 'eleven_turbo_v2_5',
    stability: 0.8,
    similarityBoost: 0.6,
    style: 0.4,
  },
  economic: {
    voiceId: 'pqHfZKP75CvOlQylNhV4', // Bill
    model: 'eleven_turbo_v2_5',
    stability: 0.85,
    similarityBoost: 0.7,
    style: 0.35,
  },
  pr: {
    voiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica
    model: 'eleven_turbo_v2_5',
    stability: 0.75,
    similarityBoost: 0.8,
    style: 0.7, // Very expressive
  }
};
```

#### Audio Playback System
```typescript
class AdvisorVoice {
  private audioQueue: AudioBuffer[] = [];
  private currentlyPlaying: boolean = false;

  async speak(text: string, advisorRole: string, priority: 'critical' | 'urgent' | 'important' | 'routine') {
    const voiceConfig = ADVISOR_VOICES[advisorRole];

    // Generate speech via ElevenLabs API
    const audioBuffer = await this.generateSpeech(text, voiceConfig);

    if (priority === 'critical') {
      this.interrupt();
      this.playImmediately(audioBuffer);
    } else {
      this.enqueue(audioBuffer, priority);
    }
  }

  private async generateSpeech(text: string, config: VoiceConfig): Promise<AudioBuffer> {
    // Call ElevenLabs API through edge function
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text, ...config })
    });
    return await response.arrayBuffer();
  }
}
```

---

### Advice Trigger Matrix

| Event | Military | Science | Diplomatic | Intel | Economic | PR |
|-------|----------|---------|------------|-------|----------|-----|
| **DEFCON Change** | ✅ Primary | ⚠️ Warns | ⚠️ Urges calm | ℹ️ Context | ❌ | ℹ️ Public |
| **Research Done** | ℹ️ Military tech | ✅ Primary | ❌ | ℹ️ Applications | ℹ️ Costs | ❌ |
| **Treaty Signed** | ⚠️ Skeptical | ℹ️ Benefits | ✅ Primary | ⚠️ Verification | ℹ️ Trade | ✅ PR win |
| **Intel Success** | ℹ️ Strategic | ❌ | ℹ️ Diplomatic use | ✅ Primary | ❌ | ℹ️ Leak risk |
| **Resource Low** | ⚠️ Readiness | ⚠️ Limits | ℹ️ Trade | ❌ | ✅ Primary | ⚠️ Rationing |
| **Morale Drop** | ⚠️ Unrest | ℹ️ Causes | ⚠️ Stability | ℹ️ Threats | ⚠️ Economy | ✅ Primary |
| **Nuclear Launch** | ✅ Tactical | ✅ Consequences | ⚠️ War crime | ℹ️ Counterstrike | ❌ | ✅ Crisis |
| **Enemy Buildup** | ✅ Primary | ⚠️ Arms race | ℹ️ Negotiate | ✅ Primary | ℹ️ Costs | ℹ️ Spin |

Legend:
- ✅ Primary advisor for this event
- ⚠️ Strong opinion/warning
- ℹ️ Informational commentary
- ❌ Silent on this event

---

### Dynamic Dialogue Generation

#### Template System
```typescript
const DIALOGUE_TEMPLATES = {
  defconEscalation: {
    military: [
      "DEFCON ${level}. All forces on alert. Ready to strike on your command.",
      "We've moved to DEFCON ${level}. Our response time is now ${seconds} seconds.",
      "Escalation to DEFCON ${level} complete. God help us all."
    ],
    science: [
      "DEFCON ${level}... the probability of nuclear exchange just jumped to ${percent}%.",
      "We're at DEFCON ${level}. At this rate, we'll trigger nuclear winter by month's end.",
    ],
    diplomatic: [
      "DEFCON ${level} sends a dangerous message. We should pursue de-escalation immediately.",
      "Mr. President, going to DEFCON ${level} closes diplomatic doors. Reconsider."
    ]
  },
  // ... 100+ event templates
};
```

#### Context Injection
Advisors reference specific game state:
```typescript
function generateAdvice(event: GameEvent, advisor: Advisor): string {
  const template = DIALOGUE_TEMPLATES[event.type][advisor.role];
  const selected = selectRandomWeighted(template, advisor.personality);

  // Inject dynamic data
  return selected
    .replace('${level}', event.data.defcon)
    .replace('${nation}', event.data.nationName)
    .replace('${count}', event.data.missileCount)
    .replace('${percent}', Math.round(event.data.probability * 100));
}
```

---

### Advisor Influence System

#### Trust & Credibility
```typescript
interface AdvisorState {
  role: string;
  trustLevel: number; // 0-100
  correctPredictions: number;
  wrongPredictions: number;
  timesIgnored: number;
  timesFollowed: number;
}
```

**Trust Affects:**
- Frequency of advice (high trust = more vocal)
- Tone of delivery (low trust = more desperate/defensive)
- Quality of intelligence (low trust intel = less accurate)

**Trust Changes:**
- Following advice that succeeds: +5 trust
- Following advice that fails: -10 trust
- Ignoring advice that would have succeeded: -3 trust
- Ignoring advice that would have failed: +2 trust

#### Advisor Conflicts
Advisors can disagree publicly:
```
MILITARY: "We must strike now while we have superiority!"
DIPLOMATIC: "General, that's madness. Negotiations are progressing."
MILITARY: "Negotiations are stalling tactics. They're buying time to build more warheads!"
SCIENCE: "Both of you are ignoring the real threat: nuclear winter. ANY major exchange ends civilization."
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
- ✅ **MANDATORY:** Include ISO-8601 timestamp (UTC) for every session log entry
- ✅ Record relative paths of all files touched

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

## 📋 Review & PR Checklist

- [ ] Confirm TypeScript passes `tsc --noEmit` (implicit via Vite build) or local IDE diagnostics
- [ ] Run `npm run lint` if lint rules are added/updated
- [ ] Execute `npm run test` and ensure coverage for new gameplay logic
- [ ] Validate UI changes across dark/high-contrast themes when relevant
- [ ] Update documentation or tutorial overlays if mechanics shift
- [ ] Seek review from gameplay & UX maintainers for balance-affecting changes

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
- See recent PRs for modular code patterns (e.g., #861, #862, #863, #864)
- TypeScript best practices: https://www.typescriptlang.org/docs/handbook/

---

**Last Updated:** 2026-01-14
**Maintained By:** Development Team
**Status:** Living Document (update as project evolves)
