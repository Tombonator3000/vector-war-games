# Government Selection System Implementation

**Date:** 2025-11-19
**Status:** ✅ Complete - Ready for Integration

## Overview

This implementation adds a **Civilization-style government selection system** to Vector War Games, where players unlock new government types through research and can switch between them strategically.

---

## Features Implemented

### 1. **Civics Research Tree** ✅
- **Location:** `src/lib/researchData.ts`
- **New Category:** `civics` added to research system
- 7 new research technologies that unlock government types:

| Technology | Turns | Cost | Unlocks |
|-----------|-------|------|---------|
| Constitutional Monarchy | 3 | 15 prod, 10 intel | Constitutional Monarchy |
| Technocracy | 4 | 20 prod, 15 intel | Technocracy |
| Absolute Monarchy | 4 | 25 prod, 15 intel | Absolute Monarchy (requires Constitutional Monarchy) |
| One-Party State | 4 | 30 prod, 20 intel | One-Party State |
| Theocracy | 5 | 35 prod, 25 intel | Theocracy |
| Dictatorship | 5 | 40 prod, 30 intel | Dictatorship (requires One-Party State) |
| Military Junta | 6 | 50 prod, 35 intel | Military Junta (requires Dictatorship) |

**Tech Tree Structure:**
```
Democracy (default)
├── Constitutional Monarchy (Tier 1)
│   └── Absolute Monarchy (Tier 2)
├── Technocracy (Tier 1)
├── One-Party State (Tier 1)
│   └── Dictatorship (Tier 2)
│       └── Military Junta (Tier 3)
└── Theocracy (Tier 1)
```

### 2. **Government Selection Panel** ✅
- **Location:** `src/components/GovernmentSelectionPanel.tsx`
- **Features:**
  - Visual grid showing all 8 government types
  - Current government highlighted with ✓ badge
  - Locked governments displayed with 🔒 icon
  - Each card shows:
    - Government icon and name
    - Description
    - Key bonuses (Production, Research, Stability, Recruitment)
    - Election information
  - Confirmation dialog before switching
  - Shows transition costs and cooldowns
  - Responsive design (2-column grid on desktop, 1-column on mobile)

### 3. **Government Switching Logic** ✅
- **Location:** `src/lib/governmentSwitching.ts`
- **Mechanics:**
  - **Base Stability Cost:** -15% stability
  - **Cooldown:** 10 turns between changes
  - **Minimum Stability:** 30% required to change
  - **Radical Changes:** +10% extra cost (e.g., democracy → dictatorship)
  - **Transition Time:** 1 turn
  - **Side Effects:**
    - Legitimacy: -10%
    - Coup Risk: +5% during transition
    - Government support shifts for old/new governments

### 4. **Type System Updates** ✅
- **Location:** `src/types/game.ts`
- **Added Property:** `unlockedGovernments?: GovernmentType[]`
  - Tracks which governments each nation has unlocked
  - Initialized to `['democracy']` by default

### 5. **Integration with Existing Systems** ✅
- **Location:** `src/lib/governmentIntegration.ts`
- **Updates:**
  - `initializeGovernmentSystem()` now initializes `unlockedGovernments` for all nations
  - Ensures backward compatibility with existing save games

### 6. **AI Government Selection** ✅
- **Location:** `src/lib/aiGovernmentSelection.ts`
- **AI Decision-Making:**
  - Evaluates civics research priority based on personality
  - Selects optimal government based on:
    - AI personality (aggressive → military junta, defensive → monarchy, etc.)
    - Current situation (at war, low stability, high production)
    - Available unlocked governments
  - 15% chance per turn to consider government change
  - Only changes if score improvement is significant (>15 points)

**AI Personality Preferences:**
| Personality | Preferred Governments |
|------------|----------------------|
| Aggressive | Military Junta, Dictatorship |
| Defensive | Constitutional/Absolute Monarchy |
| Balanced | Technocracy, One-Party State |
| Trickster | Dictatorship, One-Party State (intel bonuses) |
| Isolationist | Absolute Monarchy, Technocracy (stability) |

---

## Integration Guide

### For Game Developers

#### 1. **Add Government Panel to UI**

In `src/pages/Index.tsx`, add the Government Selection Panel to the game interface:

```typescript
import { GovernmentSelectionPanel } from '@/components/GovernmentSelectionPanel';

// In your component state:
const [showGovernmentPanel, setShowGovernmentPanel] = useState(false);

// Add button to open panel (e.g., in diplomacy tab or governance menu):
<Button onClick={() => setShowGovernmentPanel(true)}>
  🏛️ Government
</Button>

// Render the panel:
{showGovernmentPanel && playerNation && (
  <GovernmentSelectionPanel
    currentGovernmentState={playerNation.governmentState!}
    unlockedGovernments={playerNation.unlockedGovernments || ['democracy']}
    nationName={playerNation.name}
    currentTurn={S.turn}
    lastGovernmentChangeTurn={playerNation.governmentState?.lastGovernmentChangeTurn}
    onSelectGovernment={(govType) => {
      const result = transitionGovernment(playerNation, govType, S.turn);
      if (result.success && result.newGovernmentState) {
        playerNation.governmentState = result.newGovernmentState;
        toast({
          title: 'Government Changed',
          description: result.message,
        });
      } else {
        toast({
          title: 'Cannot Change Government',
          description: result.message,
          variant: 'destructive',
        });
      }
    }}
    onClose={() => setShowGovernmentPanel(false)}
  />
)}
```

#### 2. **Integrate AI Government Decisions**

In `src/pages/Index.tsx`, add to AI turn processing:

```typescript
import { aiConsiderGovernmentChange } from '@/lib/aiGovernmentSelection';

// In the aiTurn() function, add after research section:
function aiTurn(n: Nation) {
  // ... existing AI logic ...

  // GOVERNMENT CHANGE - AI considers switching government
  if (aiConsiderGovernmentChange(n, S.turn, nations, log)) {
    return; // Government changed, end turn
  }

  // ... rest of AI logic ...
}
```

#### 3. **Update AI Research Priority**

In the AI research selection logic (around line 5832 in `Index.tsx`), add civics weighting:

```typescript
import { getAICivicsResearchWeight } from '@/lib/aiGovernmentSelection';

// In the research selection logic:
const project = availableResearch.sort((a, b) => {
  // Existing priority logic...

  // Add civics weighting
  if (a.category === 'civics') {
    const weight = getAICivicsResearchWeight(n, n.aiPersonality);
    return -weight; // Higher weight = higher priority
  }
  if (b.category === 'civics') {
    const weight = getAICivicsResearchWeight(n, n.aiPersonality);
    return weight;
  }

  // ... rest of sorting logic
})[0];
```

---

## Testing Checklist

### Player Functionality
- [ ] Start new game - player begins with democracy unlocked
- [ ] Research civics technologies to unlock new governments
- [ ] Open government selection panel
- [ ] View all government types (locked/unlocked)
- [ ] Attempt to change government (should work if conditions met)
- [ ] Verify stability cost is applied (-15%)
- [ ] Verify cooldown prevents immediate re-change (10 turns)
- [ ] Try to change with low stability (<30%) - should be blocked
- [ ] Verify government bonuses apply after change

### AI Functionality
- [ ] AI researches civics technologies based on personality
- [ ] Aggressive AI prefers military junta path
- [ ] Defensive AI prefers monarchy path
- [ ] AI changes government when optimal
- [ ] AI respects cooldown and stability requirements

### Edge Cases
- [ ] Loading old save games (should initialize unlockedGovernments)
- [ ] Multiple government changes in sequence
- [ ] Changing government during war
- [ ] Changing government with active treaties

---

## Files Created/Modified

### New Files ✨
1. `src/components/GovernmentSelectionPanel.tsx` - Main UI component
2. `src/lib/governmentSwitching.ts` - Core switching logic
3. `src/lib/aiGovernmentSelection.ts` - AI decision-making
4. `GOVERNMENT_SELECTION_IMPLEMENTATION.md` - This documentation

### Modified Files 📝
1. `src/lib/researchData.ts` - Added civics research tree
2. `src/types/game.ts` - Added `unlockedGovernments` property
3. `src/lib/governmentIntegration.ts` - Initialize unlocked governments

---

## Future Enhancements

### Potential Additions
1. **Government Reform Events**
   - Random events that can change government forcefully (revolutions, coups)
   - Special events for certain government transitions

2. **Government-Specific Abilities**
   - Unique actions for each government type
   - Example: Military Junta can declare martial law

3. **Coalition Governments**
   - Hybrid governments with mixed bonuses
   - Requires researching multiple civics branches

4. **Historical Government Events**
   - Flavor text and events based on real-world government transitions
   - Special achievements for specific government paths

5. **Government Victory Condition**
   - Win by converting all nations to your government type
   - Diplomatic victory through ideological influence

---

## Notes

- All government bonuses are defined in `src/types/government.ts`
- Government state is tracked per-nation in `Nation.governmentState`
- System is fully backward compatible with existing saves
- Default government for all nations is democracy
- Player can see government status in existing `GovernmentStatusPanel.tsx`

---

## Example Gameplay Flow

1. **Turn 1:** Player starts with Democracy
2. **Turn 5:** Research "Constitutional Monarchy" (3 turns, 15 prod + 10 intel)
3. **Turn 8:** Research complete - Constitutional Monarchy unlocked
4. **Turn 9:** Open Government Panel, switch to Constitutional Monarchy
   - Cost: -15% stability (e.g., 70% → 55%)
   - Benefit: +15 stability bonus, +20 diplomatic influence
5. **Turn 19:** Cooldown expires (10 turns)
6. **Turn 20:** Can research/switch again if desired

---

## Support

For questions or issues:
- Check existing government system in `src/types/government.ts`
- Review `GovernmentStatusPanel.tsx` for display patterns
- Consult `governmentIntegration.ts` for initialization logic

**Implementation complete!** 🎉
