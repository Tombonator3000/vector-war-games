# Diplomacy Phase 2 - Integration Guide

## Overview

This document explains how to integrate Phase 2 diplomacy features (Grievances, Claims, and Specialized Alliances) into gameplay. The code for these features exists but requires proper integration into game events.

## Current Status

✅ **Implemented:**
- Type definitions (grievancesAndClaims.ts, specializedAlliances.ts)
- Utility functions (grievancesAndClaimsUtils.ts, specializedAlliancesUtils.ts)
- UI components (GrievancesAndClaimsDisplay.tsx, SpecializedAllianceDisplay.tsx)
- Game state support (Nation interface updated)
- Integration module (diplomacyPhase2Integration.ts)
- AI actions updated (aiDiplomacyActions.ts)

⚠️ **Needs Integration:**
- Hook into attack/nuke handlers
- Call per-turn updates
- Display in UI

## Integration Points

### 1. Attack Events

When a nation attacks another, create appropriate grievances:

```typescript
import { onSurpriseAttack, onCivilianCasualties } from '@/lib/diplomacyPhase2Integration';

// After an attack is executed:
onSurpriseAttack(victim, attacker, currentTurn);

// After nuclear strike causing casualties:
const casualties = oldPopulation - newPopulation;
onCivilianCasualties(victim, attacker, casualties, currentTurn);
```

**Location:** `src/pages/Index.tsx` around lines 2948-2951 (nuclear detonation handler)

### 2. Diplomacy Actions

The AI diplomacy functions have been updated to support Phase 2. To enable:

```typescript
import { aiFormAlliance, aiBreakTreaties, aiImposeSanctions } from '@/lib/aiDiplomacyActions';

// When calling these functions, pass currentTurn:
aiFormAlliance(actor, target, logFn, currentTurn, 'military');
aiBreakTreaties(actor, target, logFn, reason, currentTurn);
aiImposeSanctions(actor, target, logFn, currentTurn);
```

**Location:** `src/pages/Index.tsx` around line 3346-3367 (AI decision tree)

### 3. Per-Turn Updates

Each turn, update grievances, claims, and alliances:

```typescript
import { updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';
import { updateAllianceLevels } from '@/lib/diplomacyPhase2Integration';

// For each nation at turn end:
nations.forEach(nation => {
  const updated = updateGrievancesAndClaimsPerTurn(nation, currentTurn);
  nation.grievances = updated.grievances;
  nation.claims = updated.claims;

  updateAllianceLevels(nation, currentTurn);
});
```

**Location:** End of AI turn or start of new turn

### 4. Alliance Formation

When player forms alliance, use specialized alliance:

```typescript
import { formSpecializedAlliance } from '@/lib/diplomacyPhase2Integration';

// Instead of just setting treaty.alliance = true:
formSpecializedAlliance(player, target, 'military', currentTurn);
// Or let player choose: 'defensive', 'economic', 'research'
```

**Location:** Player diplomacy UI/handlers

## Quick Start Integration

### Minimal Integration (30 minutes)

Add to Index.tsx:

```typescript
// At top with other imports:
import {
  onSurpriseAttack,
  onCivilianCasualties,
  updatePhase2PerTurn
} from '@/lib/diplomacyPhase2Integration';
import { updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';

// In nuclear strike handler (around line 2948):
const oldPopulation = target.population;
target.population = Math.max(0, target.population - damage);

// ADD THIS:
if (attacker) {  // attacker should be passed to this function
  const casualties = oldPopulation - target.population;
  onCivilianCasualties(target, attacker, casualties, S.turn);
  onSurpriseAttack(target, attacker, S.turn);
}

// In AI diplomacy calls (around line 3346):
if (aiHandleDiplomaticUrgencies(n, nations, log, S.turn)) {
  return;
}

if (aiAttemptDiplomacy(n, nations, log, S.turn)) {
  return;
}

// At turn end, add:
nations.forEach(nation => {
  updatePhase2PerTurn(nation, S.turn);
  const updated = updateGrievancesAndClaimsPerTurn(nation, S.turn);
  nation.grievances = updated.grievances;
  nation.claims = updated.claims;
});
```

### Full Integration (2-3 hours)

1. **Update all attack/combat handlers** to create grievances
2. **Add UI components** to diplomacy panel
3. **Implement player alliance selection** (choose alliance type)
4. **Add alliance benefit calculations** to combat/production/research
5. **Create claims generation** for territory loss events
6. **Add grievance display** in nation tooltips

## Testing

After integration, verify:

1. **Grievances are created** when treaties are broken
2. **Grievances appear** after nuclear strikes
3. **Alliances level up** over time
4. **Claims age** and lose support
5. **AI considers grievances** in diplomacy evaluator
6. **Sanctions create grievances** after prolonged use

## Alliance Benefits

Once integrated, alliances provide:

- **Military Alliance:** +5-25% combat bonus, +5-25% defense
- **Defensive Alliance:** +10-50% defense bonus
- **Economic Alliance:** +5-25% production boost
- **Research Alliance:** +10-50% research speed

Benefits scale with alliance level (1-5).

## Common Issues

### Grievances not appearing
- Ensure `currentTurn` is passed to all diplomacy functions
- Check that `nation.grievances` array is initialized
- Verify integration functions are actually called

### Alliances not leveling up
- Call `updateAllianceLevels` each turn
- Ensure cooperation score increases with positive actions
- Check that sufficient time has passed (level × 5 turns)

### Claims not working
- Initialize `nation.claims` array
- Call `updateClaims` each turn for aging
- Use `createClaim` when creating new claims

## Next Steps

Phase 3 features (Diplomatic Currency, International Council, etc.) are also implemented but need similar integration. See DIPLOMACY_PHASE3.md for details.

## Support

If grievances/claims/alliances are not working:
1. Check browser console for errors
2. Verify Nation interface has grievances/claims/specializedAlliances arrays
3. Ensure integration functions are imported and called
4. Check that currentTurn is being passed correctly
