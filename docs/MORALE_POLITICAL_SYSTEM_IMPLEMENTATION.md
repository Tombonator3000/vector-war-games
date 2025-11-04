# Morale & Political Events System - Implementation Plan (Phase 3)

## Executive Summary

This document outlines the implementation plan for the comprehensive Morale & Political Events System. This system adds critical realism and strategic depth by simulating domestic politics, public opinion, and their effects on national capabilities.

## Current State Analysis

### ✅ Already Implemented

1. **Core Governance Metrics System** (`useGovernance` hook)
   - Morale (0-100): National morale affecting production and military recruitment
   - Public Opinion (0-100): Population's view of government
   - Cabinet Approval (0-100): Leadership support from political elite
   - Election Timer: Countdown to next election cycle
   - Instability: Measure of political chaos

2. **Production & Military Effects**
   - `calculateMoraleProductionMultiplier()`: Morale affects production (0.7x to 1.25x)
   - `calculateMoraleRecruitmentModifier()`: Morale affects unit recruitment (0.75x to 1.2x)
   - Already integrated into game phase handlers

3. **Political Events System**
   - 6 major event types with branching outcomes
   - Events: Election Cycle, Morale Crisis, Cabinet Scandal, Mass Uprising, Government Crisis, Military Unrest
   - Each event has multiple player choices with probabilistic outcomes
   - Events affect governance metrics and can trigger cascading consequences

4. **UI Components**
   - `GovernanceEventDialog`: Modal for presenting political events and choices
   - Event cards showing current metrics and outcome probabilities
   - News ticker integration

5. **Political News & Media**
   - Dynamic news generation based on nation stability
   - AI personality-driven international commentary
   - Tension-building news for atmosphere
   - Flashpoint aftermath coverage

6. **Regime Change System**
   - AI nations can experience regime changes based on instability
   - New leaders and personalities assigned
   - Military losses during transitions
   - News coverage of regime changes

### ❌ Missing Features (To Implement)

1. **Regional Morale System**
   - Currently morale is per-nation, should be per-region/territory
   - Different regions can have different morale levels
   - Morale spreads and affects neighbors
   - Regional events and bonuses

2. **Enhanced Media Coverage System**
   - Media influence mechanic (propaganda campaigns)
   - Public perception management
   - Counter-propaganda operations
   - Media blackouts during crises

3. **Policy System**
   - Permanent policy choices (not just events)
   - Policy tree similar to research tree
   - Policies with ongoing costs and benefits
   - Policy conflicts and synergies

4. **Civil Stability Mechanics**
   - Protest system (intensity, spread, suppression)
   - Strike mechanics affecting production
   - Refugee/migration flows from unstable regions
   - Civil war risk in extremely unstable nations

5. **Domestic Political Factions**
   - Multiple political factions with different agendas
   - Faction support affects cabinet approval
   - Need to balance competing interests
   - Coalition management

6. **Enhanced Visual Feedback**
   - Political stability overlay on map
   - Color-coded regions by morale level
   - Animated protest markers
   - Stability trend graphs

7. **International Pressure System**
   - UN resolutions affecting legitimacy
   - Economic sanctions from low approval
   - International aid for stable democracies
   - Diplomatic isolation mechanics

## Phase 3 Implementation Roadmap

### Priority 1: Enhanced Visual Feedback & UI (Week 1)

**Goal**: Make political state immediately visible to players

**Tasks**:
1. Create `PoliticalStabilityOverlay` component
   - Heat map showing morale by region/nation
   - Color gradient: Red (crisis) → Yellow (unstable) → Green (stable)
   - Animated protest markers for nations below 40 morale

2. Add `PoliticalStatusWidget` to main UI
   - Current morale/approval/opinion with trend arrows
   - Stability level indicator (Stable/Unstable/Crisis)
   - Quick access to governance details

3. Create `GovernanceDetailPanel`
   - Detailed metrics breakdown
   - Historical trend graphs
   - Current active effects
   - Political risk assessment

4. Enhance `GovernanceEventDialog`
   - Better visual hierarchy
   - Outcome probability visualization
   - Expected value calculations shown
   - Previous event outcomes history

### Priority 2: Policy System (Week 2)

**Goal**: Give players long-term strategic choices

**Tasks**:
1. Create policy data structure
   - Policy categories: Economic, Military, Social, Foreign
   - Each policy has cost, benefits, and prerequisites
   - Conflicting policies (can't have both)
   - Policy synergies

2. Implement `PolicySelectionPanel`
   - Tree-like interface showing available policies
   - Current active policies display
   - Policy change mechanics (costs to switch)

3. Add policy effects to game loop
   - Continuous modifiers from active policies
   - Policy-triggered events
   - Policy satisfaction/dissatisfaction

4. Create policy events
   - "Policy Backfire" events
   - "Policy Success" events
   - Pressure to change policies

### Priority 3: Regional Morale System (Week 3)

**Goal**: Make morale location-based for strategic depth

**Tasks**:
1. Refactor morale to be regional
   - Each territory has its own morale value
   - Nation morale = weighted average of territories
   - Conquered territories have lower starting morale

2. Implement morale spread mechanics
   - Morale diffuses to adjacent territories
   - Borders with unstable neighbors reduce morale
   - Successful military victories boost regional morale

3. Add regional bonuses/penalties
   - High morale regions: bonus production
   - Low morale regions: risk of uprising
   - Regional capitals matter more

4. Regional event system
   - Events can target specific regions
   - Regional crises can spread to nation-level
   - Local protests vs national unrest

### Priority 4: Civil Stability Mechanics (Week 4)

**Goal**: Add consequences for extreme instability

**Tasks**:
1. Protest System
   - Protest intensity scale (1-10)
   - Protests affect production in region
   - Can suppress with force (reduces approval) or negotiate (costs resources)
   - Protests can spread to other regions

2. Strike Mechanics
   - Labor strikes in low morale regions
   - Strikes halt production until resolved
   - Resolution options: pay demands, crack down, wait it out

3. Civil War Risk
   - Nations below 20 morale/approval for 5+ turns risk civil war
   - Civil war creates breakaway faction
   - Must reconquer own territory
   - Devastating to all metrics

4. Migration System Enhancement
   - Refugees flee unstable nations
   - Accepting refugees: morale cost, population gain
   - Closing borders: approval cost, prevents brain drain

### Priority 5: Media & Propaganda (Week 5)

**Goal**: Add information warfare dimension

**Tasks**:
1. Media Influence System
   - Each nation has media power rating
   - Can run propaganda campaigns (costs intel)
   - Campaigns affect target nation's public opinion
   - Counter-propaganda operations

2. Media Events
   - Media scandals (reduce approval)
   - Successful propaganda (boost morale)
   - Exposed lies (massive approval hit)

3. Censorship Mechanics
   - Can suppress bad news (costs approval, reduces morale hit)
   - Media blackouts during crises
   - Internet shutdowns (modern era)

4. International Media
   - Global media attention on crisis nations
   - Media pressure for humanitarian action
   - War correspondents affecting morale

### Priority 6: Faction System (Week 6)

**Goal**: Internal politics simulation

**Tasks**:
1. Political Faction Data
   - 3-5 factions per nation (Military, Civilian, Hardliners, Reformers, etc.)
   - Each faction has agenda and influence level
   - Factions gain/lose power based on events

2. Faction Management
   - Must maintain coalition support (>50% faction power)
   - Faction demands and ultimatums
   - Appointing faction leaders to cabinet

3. Faction Events
   - Coups from military faction
   - Reform demands from civilians
   - Faction splits and realignments

### Priority 7: International Pressure (Week 7)

**Goal**: Global political consequences

**Tasks**:
1. UN/International Council
   - Resolutions condemning actions
   - Peace-keeping forces
   - Observer missions

2. Sanctions System
   - Economic sanctions reduce trade
   - Arms embargos prevent military builds
   - Travel bans affect diplomacy

3. International Aid
   - Aid packages for stable democracies
   - Conditional support
   - Aid dependency risks

## Technical Implementation Details

### Data Structures

```typescript
// Regional Morale
interface RegionalMorale {
  territoryId: string;
  morale: number;
  protests: ProtestState | null;
  lastEventTurn: number;
}

interface ProtestState {
  intensity: number; // 1-10
  startTurn: number;
  causes: string[];
  spreading: boolean;
}

// Policy System
interface Policy {
  id: string;
  name: string;
  category: 'economic' | 'military' | 'social' | 'foreign';
  description: string;
  costs: ResourceCost;
  effects: PolicyEffects;
  prerequisites: string[];
  conflictsWith: string[];
  synergiesWith: string[];
}

interface PolicyEffects {
  productionModifier?: number;
  moraleModifier?: number;
  approvalModifier?: number;
  intelModifier?: number;
  // etc
}

// Faction System
interface PoliticalFaction {
  id: string;
  name: string;
  influence: number; // 0-100
  agenda: FactionAgenda;
  satisfaction: number; // 0-100
  demands: FactionDemand[];
}

interface FactionAgenda {
  priorities: string[];
  redLines: string[]; // Actions that will cause faction to revolt
  preferredPolicies: string[];
}

// Media System
interface MediaCampaign {
  id: string;
  source: string; // Nation conducting campaign
  target: string; // Nation being targeted
  type: 'propaganda' | 'counter-propaganda' | 'censorship';
  intensity: number;
  turnsRemaining: number;
  effects: {
    publicOpinionDelta: number;
    moraleBoost?: number;
  };
}
```

### Integration Points

1. **Game State**: Add to `src/types/game.ts`
   - `regionalMorale?: Record<string, RegionalMorale>`
   - `activePolicies?: string[]`
   - `politicalFactions?: PoliticalFaction[]`
   - `mediaCampaigns?: MediaCampaign[]`

2. **Nation Type**: Extend `Nation` interface
   - Regional data already in territories
   - Add faction support tracking
   - Add media power rating

3. **Turn Processing**: Update `gamePhaseHandlers.ts`
   - Process regional morale spread
   - Apply policy effects
   - Update faction satisfaction
   - Resolve protests/strikes

4. **UI Integration**: Update `Index.tsx`
   - Add political overlay toggle
   - Add policy panel modal
   - Add faction management interface

## Success Metrics

1. **Depth**: Players must consider domestic politics in strategic decisions
2. **Realism**: Nations with low morale feel genuinely disadvantaged
3. **Tension**: Risk of domestic collapse adds urgency
4. **Recovery**: Possible to recover from political crisis through smart choices
5. **AI Behavior**: AI nations respond realistically to political pressure

## Testing Plan

1. Unit tests for all calculation functions
2. Integration tests for event chains
3. UI tests for new components
4. Balance testing for policy effects
5. Stress testing for civil war scenarios

## Conclusion

This system will transform the game from pure military strategy to grand strategy where domestic politics matter as much as military might. Players must balance external threats with internal stability, creating rich emergent gameplay.

The phased approach allows incremental deployment and testing, with each phase adding value independently while building toward the complete vision.
