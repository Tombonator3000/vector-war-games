# Doctrine System Documentation

## Overview

The Doctrine System enhances the base Cold War game by making military doctrines dynamic and impactful throughout gameplay. Instead of being a one-time choice at game start, doctrines now:

1. **Affect diplomatic relationships** - Compatible doctrines improve relations, incompatible ones hinder them
2. **Generate incidents** - Random events challenge your doctrine commitment and force meaningful choices
3. **Track doctrine drift** - Your actions can shift you toward different doctrines over time

---

## System Components

### 1. Doctrine Incidents & Crises

**What are they?**
Random events that occur during gameplay, challenging your doctrine commitment and forcing you to make difficult choices.

**How they work:**
- Each doctrine (MAD, Defense, First Strike, Détente) has 3-4 unique incidents
- Incidents have probability checks each turn based on game state
- When triggered, player must choose from 2-3 options
- Each choice has consequences (resources, relationships, doctrine shift, etc.)
- Minimum 3 turns between incidents to avoid overwhelming player

**Example Incidents:**

**MAD:**
- False Alarm at Early Warning Station (critical)
- Ally Requests Nuclear Umbrella (major)
- Aging Arsenal Reliability Concerns (major)

**Defense:**
- ABM Test Fails Publicly (major)
- Budget Crisis: Defense vs Offense (major)
- ABM Technology Breakthrough (opportunity)

**First Strike:**
- Intelligence: Enemy Preparing Strike (critical)
- General Advocates Immediate Attack (major)
- Public Ethics Debate on First Strike (major)

**Détente:**
- Hardliners Demand Tougher Stance (critical)
- Enemy Caught Cheating on Treaty (critical)
- Peace Dividend Opportunity (opportunity)

**Code Locations:**
- Types: `src/types/doctrineIncidents.ts`
- Incident Data: `src/lib/doctrineIncidentData.ts`
- System Logic: `src/lib/doctrineIncidentSystem.ts`
- UI Component: `src/components/DoctrineIncidentModal.tsx`

---

### 2. Doctrine Diplomacy Integration

**What is it?**
Military doctrines now affect how nations view each other diplomatically, influencing relationships and proposal acceptance.

**Doctrine Compatibility Matrix:**

| Your Doctrine | Their Doctrine | Modifier | Effect |
|---------------|----------------|----------|--------|
| MAD | MAD | +10 | Both understand mutual deterrence |
| MAD | Defense | 0 | Neutral - both defensive-minded |
| MAD | First Strike | -10 | Paranoid about each other |
| MAD | Détente | -15 | Conflicting worldviews |
| Defense | Defense | +5 | Both cautious and defensive |
| Defense | Détente | +10 | Both prefer stability |
| First Strike | First Strike | -20 | Both paranoid and aggressive |
| First Strike | Détente | -25 | Maximum incompatibility |
| Détente | Détente | +20 | Both peaceful and cooperative |

**How it affects diplomacy:**
- Compatibility modifier directly affects proposal acceptance scores
- Shown in UI as compatibility rating between nations
- Influences AI decision-making for treaties and alliances
- Different proposal types affected differently (e.g., alliance more affected than truce)

**Proposal Type Specific Modifiers:**

**Alliances:**
- Compatibility effect x1.5 (very important for alliances)
- Détente nations more likely to form alliances with each other

**Peace Offers:**
- Détente doctrine: +10 to acceptance
- First Strike doctrine: -15 to acceptance

**Joint Wars:**
- First Strike/MAD: +10 to acceptance
- Détente: -20 to acceptance

**Aid Requests:**
- Détente target: +12 to acceptance
- First Strike target: -10 to acceptance

**Code Locations:**
- Types: `src/types/doctrineDiplomacy.ts`
- Compatibility Logic: `src/lib/doctrineDiplomacyUtils.ts`
- Integration: `src/lib/aiDiplomacyEvaluator.ts` (lines 179-192)

---

### 3. Doctrine Shift System

**What is it?**
Your in-game actions accumulate "shift points" toward different doctrines. If you consistently act against your stated doctrine, you'll drift toward a different one.

**How it works:**
- Each incident choice has a doctrine alignment (MAD, Defense, First Strike, Détente, or Neutral)
- Choosing options that don't match your current doctrine adds shift points
- Shift threshold: 60 points (configurable)
- At 60% progress (36 points): Yellow warning displayed
- At 80% progress (48 points): Red critical warning displayed
- At 100% progress (60 points): Doctrine shift event triggers

**Tracking:**
- Last 10 actions tracked and displayed
- Each action shows: turn number, shift direction, amount
- Visual progress bar shows how close you are to shifting

**Example:**
```
You have MAD doctrine
→ Choose "Stand Down" during false alarm (+15 Defense)
→ Choose "Negotiate Terms" for umbrella (+8 Détente)
→ Choose "Emergency Funding" for budget crisis (0, neutral)
Total: 15 Defense, 8 Détente accumulated

If Defense reaches 60, you'll get warning about shift to Defense doctrine
```

**Code Locations:**
- Types: `src/types/doctrineIncidents.ts` (DoctrineShiftState interface)
- Logic: `src/lib/doctrineIncidentSystem.ts`
- UI Display: `src/components/DoctrineStatusPanel.tsx`

---

## Integration with Game State

### GameState Extensions

Added to `src/types/game.ts`:

```typescript
export interface GameState {
  // ... existing fields ...

  /** Doctrine Incident System state */
  doctrineIncidentState?: DoctrineIncidentState;

  /** Doctrine Shift Tracking state */
  doctrineShiftState?: DoctrineShiftState;
}
```

### Initialization

On game start, initialize doctrine systems:

```typescript
import { initializeDoctrineIncidentState, initializeDoctrineShiftState } from '@/lib/doctrineIncidentSystem';

// When player selects doctrine
const doctrineIncidentState = initializeDoctrineIncidentState();
const doctrineShiftState = initializeDoctrineShiftState(selectedDoctrine);

// Add to game state
gameState.doctrineIncidentState = doctrineIncidentState;
gameState.doctrineShiftState = doctrineShiftState;
```

### Per-Turn Updates

Each turn, update doctrine systems:

```typescript
import { updateDoctrineIncidentSystem } from '@/lib/doctrineIncidentSystem';

// During turn resolution
gameState.doctrineIncidentState = updateDoctrineIncidentSystem(
  gameState,
  playerNation,
  gameState.doctrineIncidentState
);
```

### Displaying Active Incidents

```typescript
import { DoctrineIncidentModal } from '@/components/DoctrineIncidentModal';

// In main game component
{gameState.doctrineIncidentState?.activeIncident && (
  <DoctrineIncidentModal
    incident={gameState.doctrineIncidentState.activeIncident}
    onChoose={(choiceId) => handleIncidentChoice(choiceId)}
  />
)}
```

---

## UI Components

### DoctrineIncidentModal
**File:** `src/components/DoctrineIncidentModal.tsx`

Displays active incident with:
- Incident title, description, severity badge
- Color-coded urgency (red=critical, yellow=high, blue=medium)
- 2-3 choice buttons with consequences preview
- Icons showing resource costs, relationship changes, doctrine shifts
- Doctrine alignment indicator for each choice

**Props:**
```typescript
interface DoctrineIncidentModalProps {
  incident: DoctrineIncident;
  onChoose: (choiceId: string) => void;
  onDismiss?: () => void;
}
```

### DoctrineStatusPanel
**File:** `src/components/DoctrineStatusPanel.tsx`

Shows current doctrine status:
- Current doctrine name and color
- Doctrine shift warning (if drifting)
- Progress bar toward shift (0-100%)
- Compatibility with other nations (top 3)
- Recent actions affecting doctrine (last 3)

**Props:**
```typescript
interface DoctrineStatusPanelProps {
  playerNation: Nation;
  allNations: Nation[];
  shiftState?: DoctrineShiftState;
  onShowDetails?: () => void;
}
```

**Usage:**
```typescript
<DoctrineStatusPanel
  playerNation={playerNation}
  allNations={gameState.nations}
  shiftState={gameState.doctrineShiftState}
/>
```

---

## Advanced Features (Not Yet Implemented)

### Doctrine-Specific Diplomacy Proposals

**File:** `src/types/doctrineDiplomacy.ts` contains configs for:

1. **Mutual Deterrence Pact** (MAD only)
   - +15 relationship, +20 deterrence
   - Requires both nations have MAD doctrine

2. **No First Use Treaty** (MAD/Defense)
   - +20 relationship, +15 trust
   - Reduces first strike chance by 50%

3. **ABM Technology Sharing** (Defense only)
   - +25 relationship, +2 defense for both
   - Requires ABM research

4. **Preemptive Strike Alliance** (First Strike only)
   - +10 relationship, +30 deterrence
   - Enables coordinated first strikes

5. **Nuclear Arms Reduction** (Détente only)
   - +30 relationship, +5 production for both
   - Requires mutual missile reduction

**To implement:**
- Add proposal types to diplomacy system
- Add UI for doctrine-specific proposals
- Add acceptance logic using `calculateDoctrineProposalAcceptance()`

---

## Balance Considerations

### Incident Probability
- Base chance: 5-15% per turn per incident
- Modified by game tension, turn count, time since last incident
- Minimum 3 turns between incidents
- Critical incidents less frequent than minor ones

### Consequence Magnitudes
- Resource costs: 15-40 (significant but not crippling)
- Relationship changes: 10-40 (meaningful impact)
- Doctrine shift: 8-25 points (multiple actions needed to shift)
- Military impacts: 1-3 units (noticeable but recoverable)

### Compatibility Impact
- Range: -25 to +20
- Average proposal acceptance: 50-60 points
- Compatibility represents 20-40% of total acceptance score
- Balanced so incompatible nations can still cooperate if other factors strong

---

## Testing Checklist

### Incident System
- [ ] Incidents appear at appropriate frequency (not too often/rare)
- [ ] All 12+ incidents can trigger with correct conditions
- [ ] Incident choices apply consequences correctly
- [ ] Incident history tracked properly
- [ ] Non-repeatable incidents don't re-trigger

### Diplomacy Integration
- [ ] Doctrine compatibility correctly calculated for all pairs
- [ ] Compatibility visible in diplomacy UI
- [ ] Proposal acceptance affected by compatibility
- [ ] AI nations respect doctrine compatibility in decisions

### Doctrine Shift
- [ ] Shift points accumulate correctly from choices
- [ ] Warning appears at 60% threshold
- [ ] Critical warning appears at 80% threshold
- [ ] Recent actions displayed correctly
- [ ] Shift progress bar updates visually

### UI Components
- [ ] DoctrineIncidentModal displays all info clearly
- [ ] Consequence icons show correct costs/benefits
- [ ] DoctrineStatusPanel shows current status
- [ ] Compatibility ratings displayed for all nations
- [ ] Color coding matches doctrine types

---

## Future Enhancements

### Priority 1 (High Value)
1. **Doctrine Shift Event** - When shift threshold reached, trigger major event
2. **Doctrine-Specific Proposals** - Implement 9 doctrine-based treaty types
3. **AI Doctrine Selection** - AI chooses doctrines based on personality

### Priority 2 (Medium Value)
4. **Doctrine Reputation** - Track credibility, predictability globally
5. **Doctrine Currency (DCP)** - Spend points on doctrine actions
6. **Multi-Doctrine Events** - Incidents involving multiple nations

### Priority 3 (Long-term)
7. **Advanced Doctrine Variants** - Unlock enhanced doctrines at turn 20+
8. **Doctrine Victory Conditions** - Win by doctrine-specific objectives
9. **Doctrine Policies** - Activate 4-6 policies per doctrine
10. **Doctrine vs Doctrine Mechanics** - Counter-doctrine bonuses

---

## API Reference

### Core Functions

```typescript
// Incident System
initializeDoctrineIncidentState(): DoctrineIncidentState
initializeDoctrineShiftState(doctrine: DoctrineKey): DoctrineShiftState
tryGenerateIncident(gameState, playerNation, incidentState): DoctrineIncident | null
resolveIncident(incident, choiceId, gameState, playerNation, incidentState, shiftState): Results
updateDoctrineIncidentSystem(gameState, playerNation, incidentState): DoctrineIncidentState

// Diplomacy Integration
getDoctrineCompatibilityModifier(doctrine1: DoctrineKey, doctrine2: DoctrineKey): number
getDoctrineDiplomacyModifier(proposerNation, targetNation, proposalType): { modifier, reason }
getDoctrineRelationshipDescription(doctrine1, doctrine2): string

// Shift Tracking
getDoctrineShiftSummary(shiftState): ShiftSummary
```

---

## Credits

**Design:** Based on Great Old Ones Doctrine system, adapted for Cold War gameplay
**Implementation:** Doctrine Incidents & Diplomacy Integration (2025)
**Inspiration:** Diplomacy system's Trust/Favors/Incidents mechanics

---

## Questions?

See code comments in:
- `src/types/doctrineIncidents.ts` - Type definitions
- `src/lib/doctrineIncidentData.ts` - All 12+ incident definitions
- `src/lib/doctrineIncidentSystem.ts` - Core system logic
- `src/lib/doctrineDiplomacyUtils.ts` - Diplomacy integration
