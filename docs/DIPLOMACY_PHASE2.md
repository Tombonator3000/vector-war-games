# Diplomacy Enhancement - Phase 2

This document describes the Phase 2 diplomacy improvements implemented in the game, building on Phase 1's Trust, Favors, and Promises systems to add Grievances & Claims and Specialized Alliances.

> **⚠️ INTEGRATION REQUIRED:** The code for Phase 2 features is fully implemented, but requires integration into game events. See **[DIPLOMACY_PHASE2_INTEGRATION.md](./DIPLOMACY_PHASE2_INTEGRATION.md)** for a complete integration guide.

## Overview

Phase 2 adds depth to diplomatic relationships through:

1. **Grievances System** - Historical wrongs that complicate diplomacy
2. **Claims System** - Territorial and resource claims that justify conflicts
3. **Specialized Alliance Types** - Four distinct alliance types with unique benefits

These systems work together with Phase 1 features to create a rich, multi-layered diplomatic experience.

## Grievances System

### What are Grievances?

Grievances are historical wrongs or complaints that one nation holds against another. They represent lasting diplomatic damage from past actions and make cooperation more difficult.

### Grievance Types

**Severe Grievances:**
- **Betrayed Ally** (-45 relationship, -50 trust, 60 turns)
- **War Crimes** (-50 relationship, -45 trust, 80 turns)
- **Surprise Attack** (-35 relationship, -40 trust, 40 turns)
- **Civilian Casualties** (-40 relationship, -30 trust, 60 turns)
- **Broken Treaty** (-30 relationship, -35 trust, 50 turns)

**Major Grievances:**
- **Broken Promise** (-15 relationship, -20 trust, 30 turns)
- **Territorial Seizure** (-25 relationship, -15 trust, 50 turns)

**Moderate Grievances:**
- **Sanction Harm** (-10 relationship, -5 trust, 25 turns)
- **Espionage Caught** (-12 relationship, -10 trust, 20 turns)

**Minor Grievances:**
- **Refused Aid** (-5 relationship, -8 trust, 15 turns)

### How Grievances Work

**Creation:**
- Grievances are automatically created when certain actions occur
- Each grievance applies immediate trust and relationship penalties
- Severity determines the magnitude and duration of effects

**Duration:**
- Most grievances decay over time (shown in turns)
- Some severe grievances can be permanent (0 turns remaining)
- Grievances can be resolved through diplomacy, reparations, or concessions

**Effects:**
- **Diplomatic Penalty:** Up to -50 modifier on proposal acceptance
- **Trust Penalty:** Ongoing reduction in trust score
- **Relationship Penalty:** Continuous negative pressure on relations

**Resolution:**
- Paying reparations or making concessions can resolve grievances
- Resolution restores 50% of the trust penalty
- Resolved grievances remain in history for 100 turns

### Grievance Strategy

**Avoiding Grievances:**
- Keep promises and honor treaties
- Avoid surprise attacks (declare wars openly)
- Don't use nuclear weapons or bioweapons (creates grievances with multiple nations)
- Help allies when they call for assistance

**Managing Grievances:**
- Small gifts or favors can help offset grievance penalties
- Time heals most wounds (grievances decay naturally)
- Formal resolution through diplomacy is faster
- Multiple severe grievances make alliance nearly impossible

## Claims System

### What are Claims?

Claims represent a nation's assertion of rights to territory, resources, or reparations from another nation. Claims provide justification for war and increase domestic support for conflict.

### Claim Types

**Historical Claims:**
- Base war justification: 15
- Public support: 60%
- "This territory has always belonged to us"

**Cultural Claims:**
- Base war justification: 18
- Public support: 70%
- "Our people live there and deserve protection"

**Liberation Claims:**
- Base war justification: 20
- Public support: 65%
- "We must free the oppressed peoples"

**Strategic Claims:**
- Base war justification: 10
- Public support: 40%
- "This region is vital to our security"

**Resource Claims:**
- Base war justification: 12
- Public support: 50%
- "We need access to these resources"

**Reparations Claims:**
- Base war justification: 8
- Public support: 55%
- "They must pay for past wrongs"

### Claim Strength

Claims can have different strength levels that multiply their effects:

- **Weak** (1.0x): Tenuous or disputed claims
- **Moderate** (1.2x): Reasonable claims with some basis
- **Strong** (1.5x): Well-founded claims with clear justification
- **Absolute** (2.0x): Undeniable claims with overwhelming justification

### How Claims Work

**Creation:**
```typescript
import { createClaim } from '@/lib/grievancesAndClaimsUtils';

const nation = createClaim(
  nation,
  'target-nation-id',
  'historical',      // Claim type
  'strong',          // Claim strength
  currentTurn,
  'Custom description (optional)'
);
```

**Effects:**
- **War Justification:** Reduces instability/morale penalty for declaring war
- **Public Support:** Increases domestic approval for military action
- **Diplomatic Pressure:** Can be used to negotiate territorial concessions

**Aging:**
- Claims lose 5% public support every 10 turns if not pressed
- Minimum public support is 20%
- This represents declining public interest in old claims

**Renunciation:**
- Claims can be renounced to improve relations
- Renouncing a claim grants +5 trust with the target nation
- Useful for peace negotiations or alliance building

### Claim Strategy

**Using Claims:**
- Establish claims before declaring war for reduced penalties
- Stronger claims = more justification and public support
- Multiple claims stack for maximum effect
- Press claims diplomatically before resorting to war

**Managing Claims Against You:**
- Negotiate to have claims renounced
- Offer concessions or territory swaps
- Build strong alliance to deter claimant
- High trust can make claimant less likely to press claim

## Specialized Alliance Types

### Overview

Phase 2 replaces generic alliances with four specialized types, each offering unique benefits and obligations. Alliances can level up (1-5) over time, unlocking more powerful bonuses.

### Alliance Types

#### Military Alliance ⚔️

**Focus:** Offensive and defensive military cooperation

**Obligations:**
- Must join offensive wars when called (MANDATORY)
- Must defend ally when attacked (MANDATORY)
- Share military intelligence and coordinate operations

**Benefits by Level:**
- **Level 1:** +5% unit attack when fighting together, automatic intel sharing
- **Level 2:** +10% unit attack, +10% combined arms bonus
- **Level 3:** +15% unit attack, can launch coordinated nuclear strikes
- **Level 4:** +20% unit attack, access to ally military bases
- **Level 5:** +25% unit attack, unified military command structure

**Best For:** Aggressive nations planning joint military campaigns

#### Defensive Alliance 🛡️

**Focus:** Mutual defense without offensive obligations

**Obligations:**
- Must defend ally when attacked (MANDATORY)
- Cannot attack each other (MANDATORY)

**Benefits by Level:**
- **Level 1:** +10% unit defense when defending together, early warning system
- **Level 2:** +15% unit defense, +5% missile interception rate
- **Level 3:** +20% unit defense, faster ally reinforcement
- **Level 4:** +25% unit defense, +10% missile interception rate
- **Level 5:** +30% unit defense, unified air defense network

**Best For:** Nations seeking security without military entanglements

#### Economic Alliance 💰

**Focus:** Trade benefits and resource sharing

**Obligations:**
- Prioritize trade with ally
- Cannot impose sanctions on ally (MANDATORY)
- Share critical resources during shortage

**Benefits by Level:**
- **Level 1:** +5% production from trade, free uranium trading
- **Level 2:** +10% production, share 5% of resources each turn
- **Level 3:** +15% production, automatic aid during economic crisis
- **Level 4:** +20% production, share 10% of resources each turn
- **Level 5:** +25% production, unified economic zone (major bonuses)

**Best For:** Nations focused on economic growth and resource development

#### Research Alliance 🔬

**Focus:** Technology sharing and collaborative research

**Obligations:**
- Must share new technologies with ally (MANDATORY)
- Participate in joint research projects
- Protect ally research from espionage

**Benefits by Level:**
- **Level 1:** +10% research speed, see ally research progress
- **Level 2:** +15% research speed, instantly share completed research
- **Level 3:** +20% research speed, joint projects (30% faster together)
- **Level 4:** +25% research speed, +20% spy defense for both nations
- **Level 5:** +30% research speed, unlock special joint research projects

**Best For:** Nations pursuing technological superiority

### Alliance Mechanics

#### Cooperation Score (0-100)

Cooperation measures how well allies work together:

- **80-100:** Excellent cooperation (green)
- **60-79:** Good cooperation (light green)
- **40-59:** Fair cooperation (yellow)
- **20-39:** Poor cooperation (orange)
- **0-19:** Failing cooperation (red)

**Increasing Cooperation:**
- Fighting together in wars: +5-10 per war
- Fulfilling obligations: +2-5 per turn
- Sharing resources/intel: +1-3 per action
- Natural growth: +0.5 per turn for active alliances

**Decreasing Cooperation:**
- Violating obligations: -10 to -30 depending on severity
- Refusing to help: -5 to -15
- Natural decay: -0.5 per turn after 5 turns of no interaction

#### Alliance Levels (1-5)

Alliances level up based on:
- Time active (10 turns per level minimum)
- Cooperation threshold (50% for L2, 60% for L3, 70% for L4, 80% for L5)

Higher levels unlock more powerful benefits and make the alliance harder to break.

#### Obligation Violations

Violating alliance obligations has consequences:

**Mandatory Obligation Violation:**
- Trust penalty: -30 to -40
- Relationship penalty: -30 to -40
- Cooperation penalty: -25 to -30
- May cause alliance dissolution

**Optional Obligation Violation:**
- Trust penalty: -5 to -10
- Relationship penalty: -5 to -15
- Cooperation penalty: -10 to -20

### Creating Specialized Alliances

```typescript
import { createSpecializedAlliance } from '@/lib/specializedAlliancesUtils';

const result = createSpecializedAlliance(
  nation1,
  nation2,
  'military',  // Type: 'military' | 'defensive' | 'economic' | 'research'
  currentTurn
);

// result.nation1 and result.nation2 now have the alliance
```

### Converting Existing Alliances

```typescript
import { convertToSpecializedAlliance } from '@/lib/specializedAlliancesUtils';

const result = convertToSpecializedAlliance(
  nation1,
  nation2,
  'economic',  // Choose the type
  currentTurn
);
```

## Integration with Phase 1

Phase 2 builds on Phase 1 systems:

### Trust Interactions

- **Grievances affect trust:** Each grievance applies trust penalties
- **Resolving grievances:** Restores partial trust
- **Specialized alliances:** High cooperation increases trust growth
- **Claims:** Renouncing claims grants trust bonus

### Favor Interactions

- **Resolving grievances:** Can cost favors
- **Pressing claims:** Can spend favors to increase claim strength
- **Alliance cooperation:** Helping allies earns favors as before

### Promise Interactions

- **Breaking promises:** Creates "broken promise" grievance
- **Keeping promises:** Helps offset grievance penalties
- **Alliance obligations:** Similar to promises but with different mechanics

## UI Components

### Grievances and Claims Display

```tsx
import { GrievancesAndClaimsDisplay } from '@/components/GrievancesAndClaimsDisplay';

<GrievancesAndClaimsDisplay
  nation={nation}
  targetNation={target}
  compact={false}  // true for inline display
/>
```

Shows:
- Active grievances with severity and duration
- Active claims with strength and justification
- Total grievance weight and claim justification

### Specialized Alliance Display

```tsx
import { SpecializedAllianceDisplay } from '@/components/SpecializedAllianceDisplay';

<SpecializedAllianceDisplay
  nation={nation}
  targetNation={target}
  compact={false}  // true for inline display
/>
```

Shows:
- Alliance type and level
- Cooperation score with bar
- Active benefits at current level
- Alliance obligations

## File Structure

```
src/
├── types/
│   ├── grievancesAndClaims.ts      # Grievance and claim type definitions
│   ├── specializedAlliances.ts     # Specialized alliance type definitions
│   └── game.ts                      # Updated with Phase 2 fields
├── lib/
│   ├── grievancesAndClaimsUtils.ts # Grievance and claim management
│   ├── specializedAlliancesUtils.ts # Alliance management and benefits
│   └── aiDiplomacyEvaluator.ts     # Enhanced with Phase 2 factors
└── components/
    ├── GrievancesAndClaimsDisplay.tsx  # UI for grievances and claims
    └── SpecializedAllianceDisplay.tsx  # UI for specialized alliances
```

## Usage Examples

### Example 1: Creating a Grievance After Attack

```typescript
import { createGrievance } from '@/lib/grievancesAndClaimsUtils';

// Defender creates grievance against attacker
const defender = createGrievance(
  defender,
  attacker.id,
  'surprise-attack',  // If no warning was given
  currentTurn
);

// This automatically:
// - Reduces trust by 40
// - Reduces relationship by 35
// - Creates grievance lasting 40 turns
```

### Example 2: Establishing Territorial Claim

```typescript
import { createClaim } from '@/lib/grievancesAndClaimsUtils';

// Nation establishes historical claim on neighbor
const nation = createClaim(
  nation,
  neighbor.id,
  'historical',
  'strong',      // 1.5x multiplier
  currentTurn,
  'The ancient province of Oldlandia rightfully belongs to us'
);

// Before declaring war:
import { getClaimWarJustification } from '@/lib/grievancesAndClaimsUtils';
const justification = getClaimWarJustification(nation, neighbor.id);
// Reduces war declaration penalties based on justification
```

### Example 3: Building a Research Alliance

```typescript
import { createSpecializedAlliance } from '@/lib/specializedAlliancesUtils';

// Create research alliance
const result = createSpecializedAlliance(
  nation1,
  nation2,
  'research',
  currentTurn
);

// Both nations now get +10% research speed (Level 1)
// As they cooperate, alliance levels up:
// - Share research: +2 cooperation
// - Fight together: +5 cooperation
// - Natural growth: +0.5 per turn

// At Level 3 (20+ turns, 60+ cooperation):
// - +20% research speed
// - Joint research projects (30% faster)
// - Instant tech sharing
```

### Example 4: Managing Alliance Cooperation

```typescript
import { modifyCooperation, updateAllianceLevel } from '@/lib/specializedAlliancesUtils';

// After ally helps in war
nation = modifyCooperation(nation, ally.id, +10, currentTurn);

// Check for level up
nation = updateAllianceLevel(nation, ally.id, currentTurn);

// After ally violates obligation
nation = modifyCooperation(nation, ally.id, -20, currentTurn);
```

## AI Diplomacy Integration

Phase 2 factors are automatically considered in AI diplomacy evaluations:

**Grievance Impact:**
- Up to -50 penalty on proposal acceptance
- Makes alliance formation nearly impossible with severe grievances
- AI less likely to help nations with grievances against them

**Claim Impact:**
- AI more likely to accept territorial concessions if you have strong claims
- AI may press their own claims against you
- Claims affect AI war targeting decisions

**Specialized Alliance Impact:**
- High-level alliances get up to +55 bonus on proposals
- Cooperation score affects willingness to help
- Obligation violations cause trust penalties and relationship damage

## Balance Considerations

**Grievances:**
- Easy to create (one bad action)
- Severe penalties (-50 diplomacy modifier max)
- Long-lasting (20-80 turns)
- Can be resolved but requires effort/concessions

**Claims:**
- Strategic tool for justifying conflicts
- Reduces domestic penalty for war
- Can be renounced for diplomatic gains
- Aging mechanic prevents indefinite claims

**Specialized Alliances:**
- More powerful than generic alliances
- Require active maintenance (cooperation score)
- Violating obligations has real consequences
- Leveling provides long-term progression

## Testing Scenarios

### Test 1: Grievance Creation and Resolution

1. Start new game
2. Break a treaty → Creates "broken treaty" grievance (severe)
3. Check diplomacy penalty (-30 relationship, -35 trust)
4. Try to make peace → Harder due to grievance penalty
5. Resolve grievance through reparations → Partial trust restoration
6. Verify grievance marked as resolved

### Test 2: Claims and War Justification

1. Create historical claim on neighbor (strong)
2. Check war justification: +15 * 1.5 = +22.5 ≈ +23
3. Declare war → Reduced instability penalty
4. Check public support: 60% * 1.5 = 90%
5. Renounce claim → +5 trust with neighbor

### Test 3: Alliance Leveling

1. Create military alliance between two nations
2. Initial state: Level 1, 50 cooperation, +5% attack bonus
3. Fight war together → Cooperation increases to 60
4. Wait 10 turns → Can level up to Level 2 at 60+ cooperation
5. Level 2 → +10% attack, +10% combined arms bonus
6. Continue cooperation → Eventually reach Level 5 for maximum bonuses

### Test 4: Obligation Violation

1. Create defensive alliance
2. Ally is attacked
3. Refuse to help → Violates mandatory obligation
4. Check penalties: -35 trust, -30 relationship, -25 cooperation
5. Alliance cooperation drops significantly
6. May lead to alliance dissolution if cooperation falls too low

## Next Steps (Phase 3)

**Phase 3 - Advanced Diplomacy:**
- Diplomatic currency system (tradeable influence points)
- International Council with voting mechanics
- Dynamic diplomatic incidents and crises
- Peace conference system for multi-party negotiations
- Espionage and covert operations affecting diplomacy
- Proxy wars and indirect conflict

## API Reference

### Grievance Functions

- `createGrievance(nation, againstId, type, turn, desc?, severity?)` - Create grievance
- `resolveGrievance(nation, grievanceId, turn)` - Resolve grievance
- `decayGrievances(nation, turn)` - Apply natural decay
- `getActiveGrievances(nation, againstId)` - Get active grievances
- `hasActiveGrievances(nation, againstId)` - Check for any grievances
- `getGrievanceDiplomacyPenalty(nation, targetId)` - Get total penalty

### Claim Functions

- `createClaim(nation, onId, type, strength, turn, desc?)` - Create claim
- `renounceClaim(nation, claimId, turn)` - Renounce claim
- `pressClaim(nation, claimId, turn)` - Press claim (returns justification)
- `getActiveClaims(nation, onId)` - Get active claims
- `hasActiveClaims(nation, onId)` - Check for any claims
- `getClaimWarJustification(nation, targetId)` - Get total justification
- `getClaimPublicSupport(nation, targetId)` - Get average public support

### Alliance Functions

- `createSpecializedAlliance(nation1, nation2, type, turn)` - Create alliance
- `dissolveAlliance(nation1, nation2, turn)` - Break alliance
- `modifyCooperation(nation, partnerId, delta, turn)` - Change cooperation
- `updateAllianceLevel(nation, partnerId, turn)` - Check for level up
- `violateObligation(violator, partnerId, obligationType, turn)` - Handle violation
- `getMilitaryAllianceBonus(nation, type)` - Get attack/defense bonus
- `getProductionBonus(nation)` - Get economic alliance production bonus
- `getResearchSpeedBonus(nation)` - Get research alliance speed bonus
- `getAllianceBetween(nation, targetId)` - Get alliance if exists

## Summary

Phase 2 significantly deepens the diplomacy system by:

1. **Adding Consequences**: Grievances make bad actions matter long-term
2. **Providing Justification**: Claims give legitimate reasons for conflict
3. **Specializing Alliances**: Four distinct alliance types with unique strategies
4. **Encouraging Cooperation**: Alliance leveling rewards long-term partnerships
5. **Creating Complexity**: Multiple interacting systems create emergent gameplay

Combined with Phase 1 (Trust, Favors, Promises), Phase 2 creates a rich diplomatic landscape where relationships have depth, history matters, and alliances are strategic choices rather than simple yes/no decisions.
