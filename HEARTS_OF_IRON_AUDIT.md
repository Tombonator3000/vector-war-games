# Hearts of Iron IV - Feature Implementation Plan

This document outlines the implementation of Hearts of Iron IV-inspired features for Vector War Games. These systems add strategic depth through production management, political decision-making, and national objectives.

---

## 🎯 Overview

Hearts of Iron IV is renowned for its:
- **Production Queue System**: Manage military and civilian production over time
- **Political Power**: Currency for making national decisions and taking focus actions
- **National Focus Trees**: Tech-tree-like system for national development paths
- **Military Templates**: Customizable unit compositions
- **Supply System**: Logistics and supply lines matter
- **Trade System**: Import/export resources with other nations

This implementation focuses on adapting these systems for Vector War Games' nuclear cold war setting.

---

## 📋 Implementation Phases

### Phase 1: Core Systems ⭐⭐⭐ (PRIORITY)
**Systems:**
1. Production Queue System
2. Political Power System
3. National Focus Tree System

**Why Phase 1:**
- These are the foundation of Hearts of Iron gameplay
- Other systems depend on these core mechanics
- Provides immediate strategic depth

---

### Phase 2: Military Management ⭐⭐
**Systems:**
4. Military Templates (Division Designer)
5. Supply System
6. War Support & Stability

**Dependencies:** Requires Phase 1 (Political Power, Production)

---

### Phase 3: Economic Depth ⭐⭐
**Systems:**
7. Trade System (Import/Export)
8. Resource Refinement
9. Infrastructure Development

**Dependencies:** Requires Phase 1 (Production Queue)

---

### Phase 4: Advanced Features ⭐
**Systems:**
10. Intelligence Agency Operations
11. Resistance & Occupation
12. Peace Conference System

**Dependencies:** Requires all previous phases

---

## 🏭 PHASE 1: CORE SYSTEMS

### 1. Production Queue System

#### Overview
Players queue up production orders that take multiple turns to complete. Similar to HoI4's production interface but adapted for Vector War Games.

#### Key Features

**Production Lines:**
- Each nation has multiple production lines (default: 5, expandable to 15)
- Each line can produce one type of item at a time
- Production lines can be reassigned but lose progress (50% loss)

**Production Categories:**
1. **Military Equipment**
   - Nuclear missiles (ICBMs, SLBMs)
   - Conventional forces (armies, air wings, naval fleets)
   - Defense systems (ABM, radar, bunkers)

2. **Infrastructure**
   - Factories (increase production lines)
   - Research labs (boost research speed)
   - Intelligence facilities (boost intel generation)

3. **Special Projects**
   - Nuclear submarines
   - Satellite networks
   - Bio-weapon facilities
   - Wonder projects (Manhattan Project equivalents)

**Production Mechanics:**
- **Progress Tracking**: Each item shows progress bar (0-100%)
- **Production Cost**: Measured in Production Points per turn
- **Time to Complete**: Calculated from cost and production allocation
- **Queue Management**: Pause, cancel, or prioritize orders
- **Efficiency**: Factories have efficiency rating (50-100%) that ramps up over time

**Resource System:**
- **Production**: General manufacturing capacity
- **Uranium**: Required for nuclear weapons
- **Electronics**: Required for cyber/satellite systems
- **Steel**: Required for conventional military

#### Data Structures
```typescript
interface ProductionLine {
  id: string;
  nationId: string;
  currentItem: ProductionItem | null;
  efficiency: number; // 50-100%
  isActive: boolean;
}

interface ProductionItem {
  id: string;
  type: ProductionItemType;
  name: string;
  category: 'military' | 'infrastructure' | 'special';

  // Costs
  productionCost: number; // Total production points needed
  resourceCosts: {
    uranium?: number;
    electronics?: number;
    steel?: number;
  };

  // Progress
  progress: number; // 0-100%
  productionPerTurn: number; // How much progress per turn
  turnsRemaining: number;

  // Completion
  onComplete: (nationId: string) => void;
}

type ProductionItemType =
  | 'icbm'
  | 'slbm'
  | 'army'
  | 'air_wing'
  | 'naval_fleet'
  | 'abm_system'
  | 'factory'
  | 'research_lab'
  | 'intel_facility'
  | 'nuclear_submarine'
  | 'satellite'
  | 'bio_facility';
```

#### UI Requirements
- **Production Queue Panel**: Shows all active production lines
- **Available Projects**: Catalog of buildable items with costs
- **Resource Dashboard**: Shows available resources and income
- **Progress Indicators**: Visual progress bars for each line
- **Queue Management**: Drag-and-drop to reorder, pause/cancel buttons

#### Game Balance
- Starting production lines: 5
- Max production lines: 15
- Factory cost: 150 Production, 5 turns
- Each factory adds: +1 production line
- Production ramp-up: 50% efficiency day 1, +10% per turn to 100%

---

### 2. Political Power System

#### Overview
Political Power (PP) is a resource that accumulates over time and is spent on national decisions, focus actions, and policy changes. Directly inspired by HoI4.

#### Key Features

**Political Power Accumulation:**
- **Base Generation**: +2 PP per turn (base rate)
- **Leader Bonuses**: Different leaders provide PP bonuses
- **Ideology Bonuses**: Democracy (+1 PP), Authoritarianism (+2 PP), etc.
- **Advisors**: Can hire political advisors for bonuses (costs PP upfront)
- **Events**: Some events grant or cost PP

**Political Power Spending:**

1. **National Decisions** (25-150 PP)
   - Mobilize Economy (100 PP): +20% production for 10 turns
   - War Propaganda (50 PP): +10 morale
   - Diplomatic Push (75 PP): +20 influence
   - Emergency Powers (150 PP): Take actions without faction approval
   - Research Grant (60 PP): +30% research speed for 5 turns

2. **Focus Tree Actions** (35-100 PP)
   - Unlock and complete national focus items
   - Each focus costs PP to activate

3. **Advisors & Cabinet** (150-300 PP)
   - Hire political advisors (one-time cost, permanent bonus)
   - Replace cabinet members
   - Appoint military leaders

4. **Justifying Wars** (25-100 PP)
   - Create Casus Belli
   - Justify war goals
   - Influence diplomatic opinion

5. **Laws & Policies** (100-200 PP)
   - Change conscription laws
   - Change economic laws (civilian/military balance)
   - Change trade laws

**Political Power Capacity:**
- Max storage: 300 PP (expandable to 500 with focuses)
- Can't accumulate beyond cap
- Strategic decision: spend or bank for big decisions

#### Data Structures
```typescript
interface PoliticalPowerState {
  nationId: string;
  currentPP: number; // Current political power
  maxPP: number; // Storage capacity (default 300)
  generationRate: number; // PP per turn (default 2)

  // Modifiers
  baseGeneration: number; // 2
  leaderBonus: number; // From leader traits
  ideologyBonus: number; // From ideology
  advisorBonuses: AdvisorBonus[];
  temporaryModifiers: PPModifier[];

  // History
  lastTurnGeneration: number;
  totalGenerated: number;
  totalSpent: number;
}

interface NationalDecision {
  id: string;
  name: string;
  description: string;
  ppCost: number;

  // Requirements
  requirements: DecisionRequirement[];

  // Effects
  effects: DecisionEffect[];

  // Cooldown
  cooldownTurns?: number;
  lastUsedTurn?: number;

  // Availability
  eraRequirement?: number; // Minimum turn
  researchRequirement?: string[]; // Tech required
  territoryRequirement?: number; // Minimum territories
}

type DecisionEffect =
  | { type: 'production_boost'; amount: number; duration: number }
  | { type: 'morale_boost'; amount: number }
  | { type: 'research_boost'; amount: number; duration: number }
  | { type: 'influence_boost'; amount: number }
  | { type: 'military_boost'; category: string; amount: number; duration: number };
```

#### UI Requirements
- **Political Power Display**: Always-visible PP counter with generation rate
- **Decisions Panel**: Available national decisions with costs and effects
- **Advisor Management**: Hire/fire advisors
- **PP History**: Track spending and generation over time

#### Game Balance
- Base generation: 2 PP/turn
- Starting PP: 50
- Max storage: 300 (500 with focuses)
- Advisor costs: 150-300 PP (one-time)
- Decision costs: 25-150 PP
- Focus costs: 35-100 PP

---

### 3. National Focus Tree System

#### Overview
A branching tech-tree-like system where players choose national development paths. Each nation has unique focuses reflecting their strategic position and ideology.

#### Key Features

**Focus Structure:**
- **Tree Layout**: Vertical columns representing different paths
- **Prerequisites**: Focuses require previous focuses to unlock
- **Mutual Exclusivity**: Some focuses lock out alternatives
- **Completion Time**: Each focus takes 5-10 turns to complete
- **Political Power Cost**: 35-100 PP to begin a focus

**Focus Paths:**

1. **Military Path** (Right side)
   - Nuclear Doctrine (+2 missile capacity, +15% missile damage)
   - Expanded Arsenal (+3 production lines)
   - First Strike Capability (reduce missile build time 25%)
   - Total War Mobilization (+30% military production)

2. **Diplomatic Path** (Left side)
   - Non-Proliferation Treaty (+20 influence, diplomacy bonus)
   - Alliance Network (form alliances easier, +10% ally military)
   - United Nations Founding (enables diplomatic victory path)
   - Global Leadership (+2 PP/turn, +30 influence)

3. **Economic Path** (Center-left)
   - Industrial Expansion (+2 production lines, +15% production)
   - Research Investment (+20% research speed, unlock research labs)
   - Trade Network (+20 gold/turn, enable trade routes)
   - Economic Superpower (+25% production, +3 PP/turn)

4. **Intelligence Path** (Center-right)
   - Intelligence Agency (+10 intel/turn, unlock spy operations)
   - Cyber Warfare Division (+20 cyber attack, +15 cyber defense)
   - Satellite Network (reveal enemy territories, +20 intel/turn)
   - Total Information Awareness (see all enemy actions, +40 intel/turn)

5. **Special Paths** (Nation-specific)
   - USA: "Manhattan Project II" (reduce nuke costs 50%, +3 missile capacity)
   - USSR: "Sputnik Program" (unlock satellites early, +30 science)
   - China: "Belt and Road" (+4 trade routes, +30 influence)

**Focus Mechanics:**
- **Active Focus**: Only one focus can be active at a time
- **Completion Time**: 5-10 turns depending on focus importance
- **PP Cost**: Must pay 35-100 PP to start a focus
- **Cancellation**: Can cancel focus but lose all progress and PP
- **Completion Bonuses**: Permanent buffs, unlocks, or one-time bonuses

**Branching Decisions:**
Some focuses present choices:
- "Arms Race" vs "Détente" (military vs diplomatic paths)
- "Offensive Doctrine" vs "Defensive Doctrine"
- "Isolationism" vs "Interventionism"

#### Data Structures
```typescript
interface NationalFocus {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Tree position
  column: number; // 0-4 (left to right)
  row: number; // 0-10 (top to bottom)

  // Requirements
  prerequisites: string[]; // Focus IDs that must be completed
  mutuallyExclusive: string[]; // Focus IDs that lock out this one
  ppCost: number; // Political power to start
  completionTime: number; // Turns to complete

  // Effects
  effects: FocusEffect[];

  // Availability
  nationSpecific?: string[]; // Only for certain nations
  ideologyRequirement?: IdeologyType;
  eraRequirement?: number; // Minimum turn
}

interface FocusEffect {
  type: 'stat_bonus' | 'unlock' | 'resource_bonus' | 'unique_action';

  // Stat bonuses
  statChanges?: {
    productionMultiplier?: number;
    researchMultiplier?: number;
    ppPerTurn?: number;
    influenceBonus?: number;
    intelPerTurn?: number;
    missileCapacity?: number;
  };

  // Unlocks
  unlocks?: {
    buildings?: string[];
    units?: string[];
    decisions?: string[];
    victoryPaths?: string[];
  };
}

interface FocusTreeState {
  nationId: string;
  activeFocus: string | null; // Currently active focus ID
  completedFocuses: string[]; // List of completed focus IDs
  lockedFocuses: string[]; // Focuses locked due to mutual exclusivity

  // Progress
  activeProgress: number; // 0-100% for active focus
  turnsRemaining: number;
}
```

#### UI Requirements
- **Focus Tree View**: Large tree diagram showing all focuses
- **Focus Details**: Hover/click to see costs, effects, and requirements
- **Progress Indicator**: Shows active focus progress
- **Path Highlighting**: Show available next steps
- **Completed Visual**: Completed focuses have checkmark/glow

#### Game Balance
- Focus completion time: 5-10 turns
- Focus PP cost: 35-100 PP
- Total focuses in tree: 30-40 per nation
- Only 1 active focus at a time
- Some focuses unlock after turn 10, 20, 30

---

## 🎮 Phase 1 Implementation Files

### Type Definitions
- `/src/types/production.ts` - Production queue types
- `/src/types/politicalPower.ts` - Political power types
- `/src/types/nationalFocus.ts` - National focus types

### Hooks
- `/src/hooks/useProductionQueue.ts` - Production management
- `/src/hooks/usePoliticalPower.ts` - PP management
- `/src/hooks/useNationalFocus.ts` - Focus tree management

### Data Files
- `/src/data/productionItems.ts` - All buildable items
- `/src/data/nationalDecisions.ts` - All national decisions
- `/src/data/nationalFocuses.ts` - Focus trees for all nations

### Components
- `/src/components/ProductionQueuePanel.tsx` - Production UI
- `/src/components/PoliticalPowerDashboard.tsx` - PP UI
- `/src/components/NationalFocusTree.tsx` - Focus tree UI
- `/src/components/ProductionLineItem.tsx` - Individual production line
- `/src/components/FocusNode.tsx` - Individual focus node

### Integration Points
- `gamePhaseHandlers.ts` - Process production, PP generation, focus progress
- `Index.tsx` - Add new panels to main UI

---

## 📊 Expected Impact

### Strategic Depth
- **Before**: Immediate build actions, no long-term planning
- **After**: Multi-turn production planning, strategic focus choices

### Player Engagement
- **Before**: Reactive gameplay (respond to attacks)
- **After**: Proactive gameplay (build toward objectives)

### Replayability
- Different focus paths create unique playthroughs
- Production choices create strategic trade-offs
- PP management creates meaningful decisions

### Complexity
- **Early Game**: Simple (1-2 production lines, basic focuses)
- **Mid Game**: Moderate (5+ production lines, branching focuses)
- **Late Game**: Complex (10+ production lines, advanced focuses)

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [x] Production queue system functional (5 lines minimum)
- [x] Can queue military and infrastructure items
- [x] Items complete over multiple turns
- [x] Political power generates each turn
- [x] Can spend PP on decisions
- [x] National focus tree displayed
- [x] Can activate and complete focuses
- [x] Focus bonuses apply correctly
- [x] All systems integrated with main game loop

### Quality Metrics:
- Zero TypeScript errors
- All types properly defined
- UI components render correctly
- Turn processing works smoothly
- Save/load compatible

---

## 🚀 Next Steps

### Phase 1 Implementation Order:
1. **Types & Data** (2-3 hours)
   - Define all TypeScript types
   - Create data files with sample items/decisions/focuses

2. **Production Queue** (3-4 hours)
   - Implement useProductionQueue hook
   - Create ProductionQueuePanel component
   - Integrate with turn processing

3. **Political Power** (2-3 hours)
   - Implement usePoliticalPower hook
   - Create decisions system
   - Create PP dashboard component

4. **National Focus** (4-5 hours)
   - Implement useNationalFocus hook
   - Create focus tree component
   - Design focus trees for each nation

5. **Integration & Testing** (2-3 hours)
   - Wire up all systems to main game loop
   - Test turn processing
   - Test save/load
   - Balance testing

**Total Estimated Time: 13-18 hours**

---

## 🎯 Future Phases Preview

### Phase 2: Military Management
- Military Templates: Design custom divisions
- Supply System: Logistics matter for conventional warfare
- War Support: Public opinion affects military actions

### Phase 3: Economic Depth
- Trade System: Import/export resources with other nations
- Resource Refinement: Convert raw materials
- Infrastructure: Build factories, labs, ports

### Phase 4: Advanced Features
- Intelligence Agency: Hire spies, run operations
- Resistance & Occupation: Manage conquered territories
- Peace Conference: Divide spoils of war

---

## 📚 Hearts of Iron IV Inspiration

### What We're Adapting:
✅ Production queue system (core mechanic)
✅ Political power currency (enables strategic decisions)
✅ National focus trees (long-term strategic paths)
✅ Branching focus paths (multiple playstyles)
✅ Time-based progression (multi-turn commitment)

### What We're NOT Including (Yet):
❌ Complex division designer (too detailed for turn-based game)
❌ Detailed supply lines (too micro-management heavy)
❌ Province-level economy (we use territory-level)
❌ Real-time combat (we're turn-based)
❌ Historical focus trees (we're alt-history cold war)

### Adaptations for Vector War Games:
- **Faster pace**: HoI4 focuses take months, ours take 5-10 turns
- **Nuclear focus**: HoI4 is WW2, we're cold war nuclear strategy
- **Simpler economy**: 4 resources (Production, Uranium, Electronics, Steel) vs HoI4's 20+
- **Turn-based**: All actions resolve per turn, not real-time

---

## 🎮 Example Gameplay Flow

### Turn 1-5: Early Game
- Start with 50 PP, generate +2 PP/turn
- Queue first national focus: "Industrial Expansion" (35 PP, 5 turns)
- Queue 2 ICBMs in production (5 turns each)
- Build 1 factory (5 turns)

### Turn 6-10: Mid Game
- Complete "Industrial Expansion" focus (+2 production lines, +15% production)
- Start "Alliance Network" focus (50 PP, 7 turns)
- ICBMs complete, queue 2 ABM systems
- Use decision "Diplomatic Push" (75 PP) to boost influence

### Turn 11-20: Late Game
- Complete "Alliance Network" focus (easier alliances, +10% ally military)
- Start "Economic Superpower" focus (100 PP, 10 turns)
- Now have 7 production lines running
- Queue nuclear submarine project (15 turns)
- Use "War Propaganda" decision (50 PP) to boost morale

This flow shows how systems interlock: PP enables focuses, focuses unlock bonuses, bonuses improve production, production enables victory.

---

## 📝 Notes

- **Compatibility**: All Phase 1 systems designed to work with existing game mechanics
- **Modularity**: Each system can be implemented and tested independently
- **Extensibility**: Design allows for Phase 2-4 additions without refactoring
- **Balance**: Values tuned for ~50 turn game length
- **UI/UX**: All interfaces designed for clarity and ease of use

**Document Version**: 1.0
**Last Updated**: November 6, 2025
**Status**: Phase 1 Ready for Implementation
