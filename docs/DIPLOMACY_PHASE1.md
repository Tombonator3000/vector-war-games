# Diplomacy Enhancement - Phase 1

This document describes the Phase 1 diplomacy improvements implemented in the game, including Trust, Favors, and Diplomatic Promises systems.

## Overview

Phase 1 adds three interconnected diplomatic systems that create deeper, more meaningful relationships between nations:

1. **Trust System** - Long-term relationship reliability (0-100)
2. **Favors System** - Short-term diplomatic obligations
3. **Diplomatic Promises** - Binding commitments that build or destroy trust

## Trust System

### What is Trust?

Trust represents the long-term reliability and trustworthiness between two nations. Unlike the relationship score (which represents current sentiment), trust measures whether a nation keeps its word and honors commitments.

### Trust Scale
- **0-100 scale** (starts at 50 - neutral)
- **80+**: Trusted Partner (won't be rivaled, best trade deals)
- **60-79**: Reliable (good diplomatic terms)
- **40-59**: Neutral (standard diplomacy)
- **20-39**: Untrustworthy (expensive proposals, alliance unlikely)
- **0-19**: Treacherous (won't ally, poor terms)

### How Trust Changes

**Trust Increases:**
- Honoring treaties (+5)
- Keeping promises (+10)
- Defending allies (+8)
- Long alliances (+0.5 per turn)
- Rejecting enemy offers (+3)

**Trust Decreases:**
- Breaking treaties (-25)
- Breaking promises (-20)
- Surprise attacks (-40)
- Betraying allies (-35)
- Refusing to help when called (-15)

**Natural Decay:**
- Trust slowly drifts toward neutral (50) over time
- Above 50: -0.5 per turn
- Below 50: +0.5 per turn

### Trust Effects

**High Trust (80+)**
- Nations won't rival you
- Better trade deals
- Cheaper diplomatic proposals
- AI more likely to accept your proposals
- +25 bonus to proposal acceptance scores

**Low Trust (30-)**
- Nations won't form alliances
- Expensive diplomatic actions
- AI unlikely to accept proposals
- -25 penalty to proposal acceptance scores

## Favors System

### What are Favors?

Favors represent short-term diplomatic obligations - who owes whom for recent assistance. Unlike trust, favors are a currency that can be earned and spent.

### Favor Balance
- **Positive favors**: They owe you (you can make requests)
- **Negative favors**: You owe them (they can make requests of you)
- **Range**: -100 to +100

### Earning Favors

**War Participation:**
- Low contribution (<20%): +5 favors
- Medium contribution (20-50%): +10 favors
- High contribution (>50%): +20 favors

**Other Actions:**
- Send economic aid: +2 favors
- Share intelligence: +3 favors
- Give territory in peace deal: +10 favors
- Not calling ally to war: +1 favor per turn
- Broker peace: +5 favors

### Spending Favors

**Available Actions:**
- **Call to War** (10 favors): Guarantee ally joins your war
- **Request Aid** (5 favors): Ask for economic assistance
- **Request Military Access** (3 favors): Ask for passage rights
- **Demand Territory** (15 favors): Claim provinces in peace deal
- **Increase Trust** (10 favors): Convert favors to +5 trust
- **Request Sanction Lift** (5 favors): Ask them to remove sanctions
- **Request Intel Share** (4 favors): Get intelligence on enemies

### Favor Strategy

**Building Favors:**
- Help allies in wars (high contribution = more favors)
- Send aid to struggling nations
- Share intelligence regularly
- Give territory in peace deals when appropriate

**Spending Favors:**
- Call allies to important wars (10 favors)
- Convert to trust for long-term relationship (10 favors = +5 trust)
- Request aid when unstable (5 favors)
- Get sanctions lifted (5 favors)

## Diplomatic Promises

### What are Promises?

Promises are binding diplomatic commitments that nations can make to each other. Keeping promises builds trust; breaking them destroys it.

### Promise Types

**1. No-Attack Promise**
- Duration: Customizable (typically 10 turns)
- Effect: Won't attack the target nation
- Trust reward if kept: +10
- Trust penalty if broken: -20
- Relationship penalty if broken: -25

**2. Help-if-Attacked Promise**
- Duration: Customizable (typically 15 turns)
- Effect: Will defend target if they're attacked
- Trust reward if kept: +8
- Trust penalty if broken: -25
- Relationship penalty if broken: -30

**3. No-Ally-With Promise**
- Duration: Customizable (typically 10 turns)
- Effect: Won't ally with specified nation
- Trust reward if kept: +5
- Trust penalty if broken: -15
- Relationship penalty if broken: -20

**4. No-Nuclear-Weapons Promise**
- Duration: Customizable (typically 20 turns)
- Effect: Won't use nuclear weapons (GLOBAL)
- Trust reward if kept: +15
- Trust penalty if broken: -40
- Relationship penalty if broken: -50 (all nations)

**5. Neutral-Mediator Promise**
- Duration: Customizable (typically 20 turns)
- Effect: Won't declare wars, acts as mediator (GLOBAL)
- Trust reward if kept: +12
- Trust penalty if broken: -30
- Relationship penalty if broken: -35 (all nations)

### Promise Management

**Making Promises:**
```typescript
import { promiseNoAttack, promiseDefenseSupport } from '@/lib/promiseActions';

// Make a no-attack promise
const updatedNation = promiseNoAttack(
  nation,
  targetNationId,
  10, // duration in turns
  currentTurn
);

// Make a defense promise
const updatedNation = promiseDefenseSupport(
  nation,
  targetNationId,
  15, // duration in turns
  currentTurn
);
```

**Checking for Violations:**
```typescript
import { checkAttackBreaksPromise, checkNukeBreaksPromises } from '@/lib/promiseActions';

// Before attacking
const brokenPromise = checkAttackBreaksPromise(attacker, defenderId, currentTurn);
if (brokenPromise) {
  // Handle promise breaking
}

// Before using nukes
const brokenPromises = checkNukeBreaksPromises(nation, currentTurn);
if (brokenPromises.length > 0) {
  // Handle multiple broken promises
}
```

**Handling Broken Promises:**
```typescript
import { handleBrokenPromises } from '@/lib/promiseActions';

const result = handleBrokenPromises(
  nation,
  brokenPromises,
  currentTurn,
  allNations
);

// result.updatedNation has trust penalties applied
// result.affectedNations has relationship penalties applied
```

## Integration with Existing Systems

### AI Diplomacy Evaluation

The AI now considers trust and favors when evaluating proposals:

**Trust Bonus:** -25 to +25 points based on trust level
**Favor Bonus:** Up to +20 points based on favors owed
**Promise History:** -10 to +10 points based on promise keeping

Total maximum bonus: +55 points (makes proposals much more likely to succeed)

### UI Integration

The new `TrustAndFavorsDisplay` component shows:
- Trust level with color-coded bar
- Favor balance with +/- indicators
- Active promises with expiration times
- Promise history (kept vs broken)

**Compact Mode:**
```tsx
<TrustAndFavorsInline nation={nation} targetNation={target} />
```

**Full Display:**
```tsx
<TrustAndFavorsDisplay nation={nation} targetNation={target} />
```

## Usage Examples

### Example 1: Building a Strong Alliance

```typescript
// Step 1: Build trust over time
// - Keep treaties (don't attack)
// - Honor alliances (defend when called)
// - Keep promises

// Step 2: Earn favors
const [helper, ally] = awardWarFavors(nation, ally, 60, currentTurn); // Helped in war
const [sender, receiver] = awardAidFavors(nation, ally, currentTurn); // Sent aid

// Step 3: Spend favors to build trust
const result = spendFavorsForTrust(nation, ally, currentTurn);
// Converts 10 favors to +5 trust

// Step 4: Make promises to show commitment
const updatedNation = promiseDefenseSupport(nation, ally.id, 20, currentTurn);

// Result: High trust (70+) makes alliance proposals much more likely to succeed
```

### Example 2: Recovering from Betrayal

```typescript
// After breaking a treaty, trust is very low (-25 from break)

// Step 1: Make peace promises
const nation1 = promiseNoAttack(nation, formerAlly.id, 10, currentTurn);

// Step 2: Send aid to earn favors
const [sender, receiver] = awardAidFavors(nation1, formerAlly, currentTurn);

// Step 3: Share intelligence
const [sharer, recipient] = awardIntelFavors(nation1, formerAlly, currentTurn);

// Step 4: Convert favors to trust
const nation2 = spendFavorsForTrust(nation1, formerAlly, currentTurn);

// Step 5: Keep all promises (trust naturally decays toward 50)
// Over 10-15 turns, trust recovers to neutral
```

### Example 3: Calling in Favors

```typescript
// After helping ally in several wars, you have 25 favors

// Call them to join your war (guaranteed)
const result = spendFavorsForWarCall(nation, ally, currentTurn);
if (result) {
  // ally.caller has updated favor balance
  // ally.ally has updated favor balance
  // Ally is now obligated to join the war
}

// Still have 15 favors left
// Request territory in peace deal (costs 15)
const result2 = spendFavorsForTerritory(nation, ally, currentTurn);
```

## File Structure

```
src/
├── types/
│   ├── trustAndFavors.ts          # Type definitions and constants
│   └── game.ts                     # Updated with trust/favor fields
├── lib/
│   ├── trustAndFavorsUtils.ts     # Core trust/favor management
│   ├── favorActions.ts            # Favor earning/spending functions
│   ├── promiseActions.ts          # Promise creation and management
│   └── aiDiplomacyEvaluator.ts    # Enhanced with trust/favors
└── components/
    ├── TrustAndFavorsDisplay.tsx  # UI component
    └── DiplomacyProposalOverlay.tsx # Updated with trust display
```

## Next Steps (Phase 2 & 3)

**Phase 2 - Depth:**
- Grievances & claims system
- Specialized alliance types (Military, Economic, Research, Defensive)
- Enhanced diplomacy UI with detailed breakdowns

**Phase 3 - Advanced:**
- Diplomatic favor currency (tradeable)
- International Council with voting
- Dynamic diplomatic incidents

## API Reference

### Trust Functions
- `getTrust(nation, targetId)` - Get trust level (0-100)
- `modifyTrust(nation, targetId, delta, reason, turn)` - Change trust
- `applyTrustDecay(nation, turn)` - Apply natural decay
- `getTrustModifier(trust)` - Get multiplier for proposals

### Favor Functions
- `getFavors(nation, targetId)` - Get favor balance
- `modifyFavors(nation, targetId, delta, reason, turn)` - Change favors
- `spendFavors(nation, targetId, cost, reason, turn)` - Spend favors
- `hasEnoughFavorsForAction(nation, targetId, action)` - Check if can afford

### Promise Functions
- `createPromise(nation, targetId, type, terms, turn)` - Make promise
- `fulfillPromise(nation, promiseId, turn)` - Mark as fulfilled
- `breakPromise(nation, promiseId, turn)` - Mark as broken (applies penalties)
- `getActivePromises(nation, targetId)` - Get active promises
- `hasPromise(nation, targetId, type)` - Check for specific promise

## Testing

To test the new systems:

1. Start a new game
2. Trust should initialize at 50 for all nations
3. Favor balances should start at 0
4. Form alliances and observe trust increasing
5. Help allies in war to earn favors
6. Spend favors on diplomatic actions
7. Break a promise and observe trust plummeting
8. Check the diplomacy overlay to see trust/favor display

## Balance Considerations

**Trust:**
- Builds slowly (+5-10 per positive action)
- Destroyed quickly (-20-40 per negative action)
- Decays slowly toward neutral (prevents permanent relationships)

**Favors:**
- Easier to earn than trust (war participation gives 5-20)
- Can be spent immediately
- Limited to -100/+100 range

**Promises:**
- High risk, high reward
- Breaking promises has severe penalties
- Keeping promises provides moderate trust boost
- Global promises affect all nations

This creates a balanced system where:
- Trust must be earned over time
- Favors provide short-term flexibility
- Promises are commitments with real consequences
