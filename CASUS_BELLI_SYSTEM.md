# Casus Belli System Documentation

## Overview

The Casus Belli system adds formal war justification mechanics to Vector War Games. Nations now require legitimate reasons (Casus Belli) to declare war, or face severe diplomatic penalties. This system integrates with existing grievances, claims, trust, council, and leader ability systems.

## Core Concepts

### 1. Casus Belli (CB)

A **Casus Belli** is a legitimate reason for declaring war. Each CB has:

- **Type**: The category of justification (territorial claim, holy war, etc.)
- **Justification Score** (0-100): How legitimate the CB is
- **Public Support** (0-100): Domestic backing for the war
- **Expiration**: Some CBs expire after a certain number of turns

### 2. War Justification Thresholds

| Threshold | Score | Effect |
|-----------|-------|--------|
| **Valid CB** | 50+ | War can be declared without penalties |
| **Weak CB** | 30-49 | War possible but with diplomatic penalties |
| **Invalid CB** | <30 | Severe diplomatic and trust penalties |

### 3. War Goals

When declaring war, nations must define **War Goals** that specify what they want to achieve:

- Annex territory
- Regime change
- Reparations
- Disarmament
- Vassal status
- Ideology enforcement

Each goal requires a certain **War Score** to enforce in peace negotiations.

### 4. Peace Terms

Wars end with **Peace Terms** that can include:

- Territory transfers
- Resource reparations
- Military limitations
- Ideology changes
- Grievance resolutions
- Claim renunciations

## Casus Belli Types

### 1. Territorial Claim
- **Source**: Territorial/resource claims against another nation
- **Base Justification**: 10-50 (based on claim type and strength)
- **Public Support**: 40-70%
- **How to Get**: Create claims through diplomacy system

### 2. Grievance Retribution
- **Source**: Major or severe grievances against another nation
- **Base Justification**: 15-50 (based on grievance severity)
- **Public Support**: 50-80%
- **How to Get**: Accumulate grievances through broken promises, war crimes, etc.

### 3. Preemptive Strike
- **Source**: High threat level from target nation (60+)
- **Base Justification**: 20-40
- **Public Support**: 30-70%
- **How to Get**: Target nation must have high threat level against you
- **Expires**: 10 turns

### 4. Defensive Pact
- **Source**: Ally was attacked
- **Base Justification**: 40
- **Public Support**: 75%
- **How to Get**: Automatically granted when defensive ally is attacked
- **Expires**: 20 turns (duration of defensive war)

### 5. Liberation War
- **Source**: Free occupied territories
- **Base Justification**: 35
- **Public Support**: 70%
- **How to Get**: Another nation occupies territories

### 6. Holy War (Ideological Conflict)
- **Source**: Opposing ideologies (alignment difference 15+)
- **Base Justification**: 15-30 (based on ideology difference)
- **Public Support**: 50-90% (based on zealotry)
- **How to Get**: Have ideology with zealotry and target with opposing ideology

### 7. Regime Change
- **Source**: Hostile government
- **Base Justification**: Varies
- **How to Get**: Target must be hostile and threatening

### 8. Punitive Expedition
- **Source**: Treaty violations
- **Base Justification**: Based on severity
- **How to Get**: Target breaks treaties or agreements

### 9. Council-Authorized
- **Source**: International Council resolution
- **Base Justification**: 80 (very strong)
- **Public Support**: 65%
- **How to Get**: Council must pass resolution authorizing war

### 10. Leader Special
- **Source**: Leader ability
- **Base Justification**: 30+ (varies by leader)
- **Public Support**: 60-80%
- **How to Get**: Use specific leader abilities
- **Expires**: 15 turns

## Integration Points

### With Grievances & Claims

```typescript
// Grievances automatically create Casus Belli
// Major/severe grievances generate CB with 15-50 justification

// Claims generate territorial Casus Belli
// Press claims to activate war justification

// Example:
const casusBelli = createCasusBelliFromClaims(
  attacker.id,
  defender.id,
  claims,
  currentTurn
);
```

### With Trust & Relationships

```typescript
// Unjustified wars damage trust and relationships
// Valid CB: No penalty
// Weak CB: -15 relationship, -10 trust
// Invalid CB: -40 relationship, -30 trust

// Third-party nations also lose trust in aggressors
// Stronger penalty if target is ally
```

### With International Council

```typescript
// Council can:
// 1. Authorize wars (grants council-authorized CB)
// 2. Intervene in unjustified wars (ceasefire resolutions)
// 3. Condemn aggressors (legitimacy penalties)

// Council intervenes if:
// - War has CB justification < 30
// - Council legitimacy > 60
// - Aggressor not permanent member
```

### With Leader Abilities

```typescript
// Some leaders grant special Casus Belli:
// - JFK: Crisis Resolution (defensive wars, +20 justification)
// - Khrushchev: Iron Curtain Strike (preemptive, +25 justification)
// - Castro: Revolutionary Uprising (liberation, +30 justification)
// - Nyarlathotep: Master Deceiver (fabricate CB, +40 justification, bypass truces!)

// Use leader abilities to get special CB:
const leaderCB = createLeaderCasusBelli(
  leader,
  target,
  abilityId,
  currentTurn
);
```

## Usage Examples

### Example 1: Declaring War with Valid CB

```typescript
import { processWarDeclaration } from './lib/casusBelliIntegration';
import { getBestCasusBelli } from './lib/casusBelliUtils';

// Get best available Casus Belli
const bestCB = getBestCasusBelli(
  attacker,
  defender,
  attacker.casusBelli || [],
  currentTurn
);

if (bestCB && bestCB.justification >= 50) {
  // Declare war
  const result = processWarDeclaration(
    attacker,
    defender,
    bestCB,
    allNations,
    gameState,
    currentTurn
  );

  if (result.success) {
    console.log(result.message);
    // War declared successfully
    // Apply updates to game state
  }
}
```

### Example 2: Building Casus Belli Through Grievances

```typescript
import { createGrievance } from './lib/grievancesAndClaimsUtils';
import { generateAutomaticCasusBelli } from './lib/casusBelliUtils';

// Create grievances when opponent breaks treaty
const grievance = createGrievance(
  'broken-treaty',
  'major',
  yourNation.id,
  enemyNation.id,
  'Broke non-aggression pact',
  currentTurn,
  30, // Lasts 30 turns
  -20, // Relationship penalty
  -15  // Trust penalty
);

// Add to your nation's grievances
yourNation.grievances.push(grievance);

// On next turn update, system auto-generates CB
const newCBs = generateAutomaticCasusBelli(
  yourNation,
  enemyNation,
  yourNation.grievances,
  yourNation.claims,
  currentTurn
);

// Now you have a valid CB based on grievances
```

### Example 3: AI War Decision Making

```typescript
import { aiShouldDeclareWar, aiPrioritizeWarTargets } from './lib/aiCasusBelliDecisions';

// AI evaluates all potential targets
const targets = aiPrioritizeWarTargets(aiNation, allNations, currentTurn);

// Check top target
if (targets.length > 0) {
  const topTarget = targets[0];

  const decision = aiShouldDeclareWar(
    aiNation,
    topTarget.target,
    allNations,
    currentTurn
  );

  if (decision.shouldDeclare && decision.bestCasusBelli) {
    // AI declares war
    console.log('AI reasoning:', decision.reasoning);
    processWarDeclaration(
      aiNation,
      topTarget.target,
      decision.bestCasusBelli,
      allNations,
      gameState,
      currentTurn
    );
  }
}
```

### Example 4: Peace Negotiations

```typescript
import { createPeaceOffer, evaluatePeaceOffer } from './lib/peaceTermsUtils';
import { createPeaceTermsFromWarGoals } from './lib/peaceTermsUtils';

// Attacker winning, offers peace based on war goals
const peaceTerms = createPeaceTermsFromWarGoals(warState, false);

const peaceOffer = createPeaceOffer(
  attacker,
  defender,
  warState,
  peaceTerms,
  currentTurn,
  'Surrender and accept these terms'
);

// Defender evaluates peace offer
const evaluation = evaluatePeaceOffer(
  defender,
  attacker,
  warState,
  peaceOffer,
  currentTurn
);

if (evaluation.shouldAccept) {
  // Accept peace
  const result = applyPeaceTerms(
    attacker,
    defender,
    warState,
    peaceTerms,
    grievances,
    claims
  );

  // Update nations with peace treaty
}
```

### Example 5: Council Intervention

```typescript
import { shouldCouncilIntervene, generateCouncilWarIntervention } from './lib/casusBelliIntegration';

// Check if council should intervene
if (shouldCouncilIntervene(warState, attacker, defender, councilLegitimacy)) {
  const resolution = generateCouncilWarIntervention(warState, attacker, defender);

  // Propose resolution to council
  const councilResolution = proposeCouncilResolution(
    resolution.type,
    resolution.title,
    resolution.description,
    resolution.targetNationId,
    resolution.parameters,
    currentTurn
  );

  // Council votes on ceasefire
}
```

## Turn Update Integration

```typescript
// In your main turn update logic:

import { updateCasusBelliForAllNations } from './lib/casusBelliIntegration';

function onTurnEnd(gameState: GameState, nations: Nation[]) {
  // Update Casus Belli for all nations
  const updatedNations = updateCasusBelliForAllNations(nations, gameState.turn);

  // Expire old CBs and generate new ones based on grievances/claims

  // AI nations evaluate war declarations
  for (const nation of updatedNations) {
    if (!nation.isPlayer && !nation.eliminated) {
      // AI decision making
      const targets = aiPrioritizeWarTargets(nation, updatedNations, gameState.turn);

      if (targets.length > 0) {
        const decision = aiShouldDeclareWar(
          nation,
          targets[0].target,
          updatedNations,
          gameState.turn
        );

        if (decision.shouldDeclare && decision.bestCasusBelli) {
          // Process AI war declaration
        }
      }
    }
  }

  // Check active wars for peace opportunities
  for (const war of gameState.casusBelliState?.allWars || []) {
    // Check if any side should offer peace
    // Evaluate pending peace offers
  }
}
```

## Diplomatic Penalties Reference

### Invalid CB Penalties (Justification < 30)

**Against Defender:**
- Relationship: -40
- Trust: -30
- New Grievance: "surprise-attack" (severe, permanent)

**Against Third Parties:**
- Relationship: -15 (x2 if ally of defender)
- Trust: -10 (x2 if ally of defender)
- Council legitimacy hit: 15

### Weak CB Penalties (Justification 30-49)

**Against Defender:**
- Relationship: -15
- Trust: -10
- New Grievance: "broken-treaty" (major, 30 turns)

**Against Third Parties:**
- Relationship: -5
- Trust: 0
- Council legitimacy hit: 5

### Valid CB (Justification 50+)

**No penalties applied**

## War Score System

Wars are tracked with **War Score** (0-100 for each side) that determines victory:

| Event | War Score Gain |
|-------|----------------|
| Occupy Territory | +10 |
| Major Battle Win | +15 |
| Minor Battle Win | +5 |
| Destroy Army | +20 |
| Nuclear Strike | +30 |
| Blockade Success | +8 |
| Capital Occupation | +40 |
| Defensive Victory | +12 |

**War Goals** require specific war scores to enforce in peace terms.

## Peace Term Costs

| Peace Term | War Score Required |
|------------|-------------------|
| Annex Territory | 20 per territory |
| Total Annexation | 100 |
| Regime Change | 60 |
| Minor Reparations | 15 |
| Major Reparations | 35 |
| Disarmament | 45 |
| Vassal Status | 80 |
| Humiliation | 25 |
| Enforce Ideology | 50 |
| Demilitarize Zone | 10 per territory |

## Files Reference

### Core Types
- `/src/types/casusBelli.ts` - All type definitions

### Core Logic
- `/src/lib/casusBelliUtils.ts` - CB creation, validation, justification
- `/src/lib/warDeclarationUtils.ts` - War declaration, war goals, war score
- `/src/lib/peaceTermsUtils.ts` - Peace offers, peace terms, negotiations

### Integration
- `/src/lib/casusBelliIntegration.ts` - System integration layer
- `/src/lib/casusBelliLeaderAbilities.ts` - Leader special CBs
- `/src/lib/aiCasusBelliDecisions.ts` - AI decision making

### Game State
- `/src/types/game.ts` - Updated Nation and GameState interfaces

## FAQ

**Q: Can I declare war without Casus Belli?**
A: Yes, but you'll face severe diplomatic penalties (-40 relationship, -30 trust, council condemnation).

**Q: How do I get valid Casus Belli?**
A: Build claims through diplomacy, accumulate grievances through opponent actions, wait for high threat, use leader abilities, or get council authorization.

**Q: Do truces prevent war?**
A: Yes, unless you're Nyarlathotep who can bypass truces with leader ability.

**Q: Can I attack allies?**
A: No, alliances block war declarations completely.

**Q: What happens if I lose a war?**
A: Defender can enforce peace terms based on their war score, including territory loss, reparations, disarmament, or regime change.

**Q: How long do Casus Belli last?**
A: Depends on type. Claim-based CBs are permanent until used. Preemptive strike expires in 10 turns. Leader CBs expire in 15 turns.

**Q: Can the Council stop wars?**
A: Yes, if legitimacy is high (>60) and war is unjustified (<30 justification), council can pass ceasefire resolutions.

**Q: How do AI nations decide to declare war?**
A: AI uses personality traits (aggression, patience, honor-bound) combined with CB availability, military strength, relationships, and strategic factors.

## Best Practices

1. **Build CBs before declaring war** - Use claims and grievances to build justification
2. **Respect valid CB threshold (50+)** - Avoid diplomatic penalties
3. **Define clear war goals** - Know what you want before declaring war
4. **Monitor war score** - Track progress toward enforcing peace terms
5. **Consider third-party reactions** - Other nations will penalize unjustified aggression
6. **Use leader abilities strategically** - Special CBs can bypass normal requirements
7. **Negotiate peace when winning** - Don't drag out wars unnecessarily
8. **Accept fair peace when losing** - Avoid total defeat

## Future Enhancements

Potential additions to the system:

- **Coalition wars** - Multiple attackers with shared war goals
- **War exhaustion effects** - Production penalties, morale loss during long wars
- **War propaganda** - Influence public support for wars
- **War crimes tracking** - Severe penalties for excessive force
- **Conditional peace enforcement** - Monitor compliance with peace terms
- **Rebellion after conquest** - Occupied territories can revolt
- **War debts** - Economic costs of warfare

---

*For implementation details, see the source files in `/src/lib/casusBelli*.ts` and `/src/types/casusBelli.ts`*
