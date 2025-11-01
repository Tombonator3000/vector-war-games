# Diplomacy Enhancement - Phase 3

This document describes the Phase 3 diplomacy improvements implemented in the game, building on Phase 1's Trust, Favors, and Promises systems and Phase 2's Grievances, Claims, and Specialized Alliances to add advanced diplomacy features.

## Overview

Phase 3 adds sophisticated diplomatic mechanics that enable complex international relations:

1. **Diplomatic Currency (DIP)** - Tradeable influence points earned through diplomatic actions
2. **International Council** - Global governance with voting and resolutions
3. **Dynamic Incidents** - Random diplomatic crises that can escalate to war
4. **Peace Conferences** - Multi-party negotiations for ending wars
5. **Advanced Espionage** - Covert operations affecting diplomacy

These systems work together with Phase 1 and Phase 2 features to create a comprehensive diplomatic simulation.

## Diplomatic Currency System

### What are Diplomatic Influence Points (DIP)?

DIP is a tradeable currency that represents a nation's diplomatic capital and influence on the world stage. Unlike favors (which are bilateral), DIP is a universal resource that can be spent on various diplomatic actions.

### DIP Scale

- **Capacity**: 200 points (default)
- **Starting DIP**: 50 points
- **Per-turn Income**: 5-30+ DIP based on various factors

### Earning DIP

**Base Income:**
- Base per turn: 5 DIP
- High-level alliances (Level 3+): +2 DIP per alliance
- Council membership (permanent/elected): +10 DIP
- Peace years (5+ consecutive peace turns): +1 DIP

**One-Time Rewards:**
- Successful mediation: +15 DIP
- Broker peace between nations: +20 DIP
- Resolve diplomatic incident: +10 DIP
- Host peace conference: +25 DIP
- Successful council resolution: +15 DIP

**DIP Income Example:**
```
Nation with:
- Base income: 5 DIP
- 2 high-level alliances: +4 DIP
- Council membership: +10 DIP
- Recent mediation: +15 DIP (one-time)
Total: 19 DIP per turn + bonuses
```

### Spending DIP

**Council Actions:**
- Call council vote: 30 DIP
- Propose resolution: 20 DIP
- Veto resolution (if permanent member): 50 DIP
- Influence undecided voters: 25 DIP

**Diplomatic Actions:**
- Call peace conference: 40 DIP
- Join peace conference: 10 DIP
- Trade for favors (15 DIP = 5 favors): 15 DIP
- Emergency mediation: 30 DIP
- Diplomatic immunity (temporary protection): 35 DIP

**Sanctions:**
- Issue sanction through council: 20 DIP
- Lift sanction: 15 DIP

### DIP Strategy

**Building DIP:**
- Maintain high-level alliances (Level 3+)
- Join the International Council
- Act as mediator in conflicts
- Avoid wars (peace years bonus)
- Pass council resolutions

**Spending DIP:**
- Use council influence to pass favorable resolutions
- Call peace conferences to end costly wars
- Convert to favors with specific nations when needed
- Protect yourself from hostile actions temporarily

## International Council System

### What is the International Council?

The International Council is a global governance body where nations can propose and vote on resolutions affecting all players. It provides a mechanism for collective action and international law.

### Council Membership Types

**Permanent Members:**
- **Veto Power**: Can veto any resolution
- **Voting Weight**: 2.0x
- **Income**: +10 DIP per turn
- **Cannot be removed** from council

**Elected Members:**
- **Term Length**: 20 turns (default)
- **Voting Weight**: 1.5x
- **Income**: +10 DIP per turn
- **Can be voted out** after term expires

**Observers:**
- **Voting Weight**: 1.0x
- **Can vote** but no special powers
- **Limited influence** on proceedings

**Non-Members:**
- **No voting rights**
- **Affected by resolutions** but cannot influence them

### Council Resolutions

**Resolution Types:**

1. **Sanctions** - Economic sanctions against a nation
   - Reduces target's production
   - Hurts diplomatic standing
   - Can be escalated to full embargo

2. **Embargo** - Full trade embargo
   - Severe economic impact
   - Isolates target diplomatically
   - Harder to pass than sanctions

3. **Peacekeeping** - Deploy peacekeepers to region
   - Prevents military action in area
   - Protects weaker nations
   - Requires cooperation from involved parties

4. **No-Fly Zone** - Restrict military operations
   - Prevents air/missile strikes in region
   - Can be enforced by council members
   - Violation triggers consequences

5. **Arms Limitation** - Limit weapon development
   - Caps missile/bomber production
   - Requires verification
   - Common for aggressive nations

6. **Humanitarian Aid** - Coordinate aid delivery
   - Helps struggling nations
   - Improves council legitimacy
   - Low controversy

7. **Condemnation** - Formal disapproval
   - Diplomatic penalty
   - Damages reputation
   - Easy to pass

8. **Recognize Claim** - Legitimize territorial claim
   - Makes claim stronger
   - Justifies future action
   - Controversial

9. **Ceasefire** - Demand end to war
   - Requires all parties to agree
   - Enforced by guarantors
   - Violation triggers council response

10. **Nuclear Ban** - Ban nuclear weapons use
    - Global impact
    - Severe penalties for violation
    - Difficult to pass

11. **Environmental** - Environmental protection
    - Limits pollution
    - Protects shared resources
    - Moderate support

12. **Expand Council** - Add new members
    - Changes power balance
    - Requires broad support
    - Rare but impactful

### Voting Process

**Proposal Phase:**
1. Member proposes resolution (costs 20 DIP)
2. Resolution enters voting queue
3. Voting period begins (3 turns default)

**Voting Phase:**
1. All members cast votes: For, Against, or Abstain
2. Permanent members can veto (costs 50 DIP)
3. Votes weighted by membership type

**Resolution Phase:**
1. Votes tallied after voting period
2. Simple majority needed (weighted)
3. Single veto defeats resolution
4. If passed, resolution becomes active

**Example Vote:**
```
Resolution: Sanction Nation X
Votes For: 5 nations (3 elected, 2 observers) = 3*1.5 + 2*1.0 = 6.5 weight
Votes Against: 2 nations (1 permanent, 1 elected) = 1*2.0 + 1*1.5 = 3.5 weight
Abstentions: 1 observer = no weight
Vetoes: None
Result: PASSED (6.5 > 3.5)
```

### Council Legitimacy

The council has a legitimacy score (0-100) that affects:
- Resolution effectiveness
- Compliance by nations
- Respect for council authority

**Increasing Legitimacy:**
- High voter participation (+1 per vote with >70% participation)
- Successful resolutions
- Humanitarian actions
- Fair enforcement

**Decreasing Legitimacy:**
- Low voter participation (-1 per vote with <70% participation)
- Failed resolutions
- Biased enforcement
- Abuse of veto power

### Council Strategy

**As a Permanent Member:**
- Use veto sparingly (expensive and damages legitimacy)
- Propose resolutions aligned with your interests
- Build coalitions for important votes
- Protect allies from hostile resolutions

**As an Elected Member:**
- Vote strategically to maintain good relations
- Propose popular resolutions to boost standing
- Seek renewal when term expires
- Leverage temporary power effectively

**As an Observer:**
- Participate actively to show engagement
- Build alliances with permanent members
- Seek elected membership
- Vote on principle to build reputation

**As a Non-Member:**
- Lobby members to vote favorably
- Seek observer status as first step
- Comply with resolutions to show good faith
- Build alliances with council members

## Dynamic Incidents System

### What are Diplomatic Incidents?

Incidents are random events that create tension between nations. If not properly managed, they can escalate to war. They add unpredictability and require active diplomatic engagement.

### Incident Types and Severity

**Minor Incidents:**
- Diplomatic Insult (-10 relationship, -5 trust)
  - Public statements offend national honor
  - Easy to resolve with apology

**Moderate Incidents:**
- Border Skirmish (-15 relationship, -10 trust)
  - Military clash on border
  - Requires compensation or negotiation

- Trade Dispute (-12 relationship, -8 trust)
  - Disagreement over trade terms
  - Economic solution usually works

- Environmental Damage (-15 relationship, -10 trust)
  - Cross-border pollution
  - Compensation and prevention needed

- Cultural Offense (-18 relationship, -12 trust)
  - Actions offend cultural/religious sensibilities
  - Apology and respect required

- Airspace Violation (-15 relationship, -10 trust)
  - Aircraft enters sovereign airspace
  - Show of force or diplomatic protest

**Serious Incidents:**
- Refugee Crisis (-18 relationship, -10 trust)
  - Mass migration creates tensions
  - Requires humanitarian response

- Territory Dispute (-25 relationship, -15 trust)
  - Competing territorial claims
  - May require concessions

- Arms Buildup (-20 relationship, -15 trust)
  - Threatening military expansion
  - De-escalation or confidence-building needed

- Cyberattack (-22 relationship, -18 trust)
  - Infrastructure targeted
  - Retaliation risk high

- Maritime Incident (-18 relationship, -12 trust)
  - Naval clash in disputed waters
  - Requires clear boundaries

**Severe Incidents:**
- False Flag Attack (-35 relationship, -25 trust)
  - Suspected staged attack
  - Extremely difficult to resolve

- Hostage Crisis (-30 relationship, -20 trust)
  - Citizens held hostage
  - High-stakes negotiation

**Catastrophic Incidents:**
- Assassination Attempt (-40 relationship, -30 trust)
  - Attack on high official
  - War highly likely without intervention

- Spy Caught (severity varies) (-20 relationship, -15 trust)
  - Espionage exposed
  - Trust severely damaged

### Incident Mechanics

**Escalation:**
- Each incident has an escalation level (0-100)
- Escalates by escalation rate per turn if not addressed
- At 100 escalation, automatically triggers war
- Severity affects starting escalation and rate

**Resolution Options:**

1. **Apologize** (Minor/Moderate)
   - Public apology and responsibility
   - +10 relationship, +5 trust
   - -30 escalation
   - 70% acceptance

2. **Compensate** (All severities)
   - Economic compensation for damages
   - Cost: 20-50 production
   - +15 relationship, +8 trust
   - -40 escalation
   - 80% acceptance

3. **Negotiate** (All severities)
   - Diplomatic talks
   - Cost: 20 DIP
   - +12 relationship, +10 trust
   - -50 escalation
   - 75% acceptance

4. **Concede** (Serious+)
   - Major concessions
   - Cost: 30 DIP, 25 production
   - +20 relationship, +15 trust
   - -70 escalation
   - 90% acceptance
   - May require council approval

5. **Mediation** (All severities)
   - Third-party mediation
   - Cost: 25 DIP
   - +8 relationship, +12 trust
   - -60 escalation
   - 85% acceptance

6. **Threaten** (Risky)
   - Counter-threat and show of force
   - -10 relationship, -15 trust
   - +20 escalation (increases!)
   - 30% acceptance
   - May trigger war

7. **Ignore** (Risky)
   - Take no action
   - -5 relationship, -8 trust
   - +10 escalation
   - 50% chance situation improves

**Deadline:**
- Incidents have deadlines (usually 10 turns)
- If not resolved by deadline, escalation goes to 100
- War becomes nearly inevitable

### Incident Probability

**Base Chance**: 5% per turn between any two nations

**Modifiers:**
- Low relationship (<-30): 2.0x multiplier
- Active grievances: 1.3x multiplier
- Low trust (<30): 1.4x multiplier
- Border adjacency: 1.5x multiplier

**Example Probability:**
```
Two nations with:
- Relationship: -40
- Grievances: Yes
- Trust: 25
- Neighbors: Yes

Probability = 5% * 2.0 * 1.3 * 1.4 * 1.5 = 27.3% per turn
```

### Incident Strategy

**Prevention:**
- Maintain good relationships
- Resolve grievances quickly
- Keep trust high
- Avoid aggressive posturing

**Management:**
- Address incidents immediately
- Choose appropriate resolution option
- Use mediation for difficult cases
- Spend DIP if necessary to prevent war

**Exploitation:**
- Some incidents can justify war
- Build claims while incident active
- Rally allies around incident
- Use council to condemn perpetrator

## Peace Conference System

### What are Peace Conferences?

Peace conferences are multi-party negotiations to end wars and establish lasting peace. They allow complex deals involving multiple nations, mediators, and guarantors.

### Conference Participants

**Roles:**

1. **Belligerents**
   - Nations at war
   - Primary negotiators
   - Must agree to final treaty

2. **Mediators**
   - Neutral third parties
   - 1.5x voting power
   - Help broker agreement
   - Earn +15 DIP if successful

3. **Observers**
   - Interested parties
   - Can vote on proposals
   - Limited influence

4. **Guarantors**
   - Nations that enforce treaty
   - Obligated to punish violations
   - Add credibility to agreement

### Conference Process

**Assembling Phase:**
1. Convener calls conference (costs 40 DIP)
2. Invites participants
3. Sets agenda items
4. Conference begins when ready

**Negotiating Phase:**
1. Participants propose peace terms
2. Debate and amend proposals
3. Build coalitions for support
4. Multiple rounds of negotiation

**Voting Phase:**
1. Vote on proposals (weighted by role)
2. Proposals need majority support
3. Can amend and revote
4. Failed proposals can be revised

**Conclusion Phase:**
1. Accepted proposal becomes treaty
2. All parties sign
3. Guarantors commit to enforcement
4. Conference concludes

### Agenda Items

**Priority Levels:**
- Critical: Must be addressed
- Important: Should be addressed
- Desirable: Nice to resolve
- Optional: Can be deferred

**Common Topics:**
- Territorial adjustments
- War reparations
- Prisoner exchanges
- Future relations
- Demilitarized zones
- Sanctions and embargos

### Peace Terms

**Term Types:**

1. **Ceasefire** - Immediate end to hostilities
2. **Territory Exchange** - Lands change hands
3. **Reparations** - Economic compensation
4. **Disarmament** - Reduce military forces
5. **Demilitarization** - Create buffer zones
6. **Guarantee** - Promise of protection
7. **Prisoner Exchange** - Return captives
8. **Border Adjustment** - Clarify boundaries
9. **Sanctions Lift** - Remove economic penalties
10. **Alliance Dissolution** - End military pacts
11. **Non-Aggression Pact** - Promise not to attack

### Treaty Compliance

**Compliance Tracking:**
- Each signatory has compliance score (0-100)
- Starts at 100 (full compliance)
- Decreases with violations
- Below 50 = treaty in jeopardy

**Violations:**

**Minor Violation:**
- Small breach of terms
- -10 compliance
- Warning issued

**Moderate Violation:**
- Significant breach
- -25 compliance
- Demands for explanation

**Major Violation:**
- Serious breach
- -50 compliance
- Treaty endangered

**Complete Breach:**
- Total violation
- Treaty nullified
- War may resume
- Guarantors intervene

### Conference Success Factors

**Helps Success:**
- Multiple mediators (+10% per mediator)
- Few participants (easier consensus)
- Low walkout risk
- Accepted proposals (+15% per accepted)
- Guarantor involvement

**Hurts Success:**
- Many participants (-5% per participant)
- High walkout risk (-0.5% per walkout risk point)
- No mediators
- Hardline positions (red lines)
- Past treaty violations

### Conference Strategy

**As Belligerent:**
- Define clear objectives
- Know your red lines
- Be willing to compromise
- Build support for your proposals
- Use walkout threat carefully (can backfire)

**As Mediator:**
- Stay neutral
- Propose balanced terms
- Build consensus
- Earn trust of all parties
- Gain DIP and influence

**As Guarantor:**
- Only guarantee if you can enforce
- Support reasonable terms
- Be prepared to intervene
- Enhance treaty credibility

## Advanced Espionage System

### Covert Operations

Covert operations are secret actions that can manipulate diplomacy, damage rivals, or create opportunities. If discovered, they cause severe diplomatic backlash.

### Operation Types

**Influence Operations:**

1. **Propaganda Campaign**
   - Cost: 40 intel, 30 DIP, 20 economic
   - Effect: -18 public opinion for 10 turns
   - Detection Risk: 35%
   - Difficulty: 45

2. **Smear Campaign**
   - Cost: 30 intel, 25 DIP, 15 economic
   - Effect: -25 reputation for 20 turns
   - Detection Risk: 30%
   - Difficulty: 40

3. **Character Assassination**
   - Cost: 35 intel, 30 DIP, 10 economic
   - Effect: -20 public opinion
   - Detection Risk: 45%
   - Difficulty: 50

**Political Operations:**

4. **Influence Election**
   - Cost: 60 intel, 35 DIP, 25 economic
   - Effect: +15 instability for 10 turns
   - Detection Risk: 60%
   - Difficulty: 75

5. **Bribe Officials**
   - Cost: 25 intel, 20 DIP, 30 economic
   - Effect: Favorable votes for 5 turns
   - Detection Risk: 40%
   - Difficulty: 45

6. **Coup Support**
   - Cost: 80 intel, 50 DIP, 40 economic
   - Effect: +30 instability for 20 turns
   - Detection Risk: 80%
   - Difficulty: 90
   - Extremely risky

**Diplomatic Operations:**

7. **Sabotage Talks**
   - Cost: 40 intel, 30 DIP, 10 economic
   - Effect: -20 trust
   - Detection Risk: 50%
   - Difficulty: 60

8. **Diplomatic Theft**
   - Cost: 40 intel, 15 DIP, 5 economic
   - Effect: -15 trust for 15 turns
   - Detection Risk: 65%
   - Difficulty: 65

9. **Leak Classified**
   - Cost: 30 intel, 10 DIP, 5 economic
   - Effect: -20 reputation for 15 turns
   - Detection Risk: 50%
   - Difficulty: 40

**Provocation Operations:**

10. **Create Incident**
    - Cost: 35 intel, 25 DIP, 15 economic
    - Effect: Manufactured diplomatic crisis
    - Detection Risk: 55%
    - Difficulty: 50

11. **False Flag Attack**
    - Cost: 50 intel, 40 DIP, 20 economic
    - Effect: Incident blamed on third party
    - Detection Risk: 70%
    - Difficulty: 80
    - Very dangerous

12. **Fabricate Evidence**
    - Cost: 45 intel, 20 DIP, 15 economic
    - Effect: -20 relationship
    - Detection Risk: 55%
    - Difficulty: 55

### Operation Execution

**Planning Phase (2 turns):**
- Allocate resources
- Prepare operation
- Can abort without penalty

**Active Phase (1 turn):**
- Operation executes
- Success check vs. difficulty
- Detection check vs. risk

**Results:**
- **Success + Not Detected**: Effects apply, secret maintained
- **Success + Detected**: Effects apply, but operation exposed
- **Failure + Not Detected**: No effects, wasted resources
- **Failure + Detected**: No effects, operation exposed, wasted resources

### Detection and Blowback

**If Exposed:**
- Relationship damage: -40 to -100 (severity dependent)
- Trust damage: -30 to -75
- Reputation damage: -25 to -60
- DIP cost: 50 to 125
- Grievance created
- Council condemnation possible

**Severity Multipliers:**
- Normal operations: 1.0x
- Sabotage talks: 1.5x
- Influence election: 1.8x
- False flag attack: 2.0x
- Coup support: 2.5x

### Counter-Intelligence

**Detection Level (0-100):**
- Base detection: 30
- Cyber defense bonus: +0 to +10
- CI investment: Variable

**Active Investigations:**
- Target specific nation or operation type
- Takes 5 turns to complete
- Costs CI assets
- Can expose operations

**Investigation Success:**
- Based on detection level
- Higher evidence = higher certainty
- Can gather proof for council

**Recommended Responses:**
- High certainty (70%+): Expose publicly, demand reparations
- Medium certainty (40-70%): Gather more evidence, private confrontation
- Low certainty (<40%): Continue investigation

### Espionage Strategy

**Offensive:**
- Target rivals and threats
- Use low-risk operations frequently
- Save high-risk for critical moments
- Have plausible deniability ready
- Build CI to detect counter-operations

**Defensive:**
- Invest in counter-intelligence
- Run investigations on suspicious nations
- Expose operations to damage perpetrator
- Use council to condemn espionage
- Retaliate proportionally if attacked

**Risk Management:**
- Never run operations you can't afford to have exposed
- Avoid operations against council members
- Balance risk vs. reward
- Maintain diplomatic options if exposed

## Integration with Phase 1 & 2

### Trust Interactions

- **DIP affects trust**: High DIP nations seen as more diplomatically sophisticated
- **Council membership**: Provides trust bonus in negotiations
- **Incidents damage trust**: Can destroy years of trust-building
- **Espionage exposure**: Severe trust penalty if caught

### Favor Interactions

- **Trade DIP for favors**: 15 DIP = 5 favors with specific nation
- **Council favors**: Support in council votes can be traded for favors
- **Conference participation**: Mediators earn favors from parties
- **Incident resolution**: Helping resolve incidents earns favors

### Promise Interactions

- **Council resolutions**: Similar to promises but global
- **Treaty compliance**: Like promise-keeping but formalized
- **Incident deadlines**: Implicit promise to resolve peacefully

### Grievance Interactions

- **Incidents create grievances**: Especially if unresolved
- **Exposed espionage**: Creates severe grievances
- **Treaty violations**: Major grievances with all signatories
- **Council condemnation**: Formal grievance mechanism

### Claim Interactions

- **Council recognition**: Makes claims much stronger
- **Incidents justify claims**: Can establish claim during crisis
- **Peace conferences**: Claims can be pressed or renounced
- **Espionage**: Can fabricate evidence for false claims

### Alliance Interactions

- **DIP from alliances**: High-level alliances generate DIP
- **Council voting blocs**: Allies vote together
- **Conference cooperation**: Allies support each other's proposals
- **Shared intelligence**: Allies share counter-intel findings

## AI Diplomacy Integration

Phase 3 factors automatically affect AI decision-making:

**DIP Bonus:**
- High DIP: Up to +15 bonus on proposal acceptance
- Shows diplomatic sophistication

**Council Membership Bonus:**
- Permanent member: +20 bonus (significant respect)
- Elected member: +10 bonus (moderate respect)
- Observer: +5 bonus (slight respect)

**Incident Penalty:**
- Active incidents: Makes proposals much harder
- Escalating incidents: AI less likely to cooperate
- Recent resolution: Slight bonus for cooperation

**Espionage Backlash:**
- Exposed operations: Severe penalty for all proposals
- Recent exposure: Makes alliances nearly impossible
- Counter-intel success: Bonus when exposing others

## File Structure

```
src/
├── types/
│   ├── diplomacyPhase3.ts         # Phase 3 type definitions
│   └── game.ts                     # Updated with Phase 3 fields
├── lib/
│   ├── diplomaticCurrencyUtils.ts # DIP management
│   ├── internationalCouncilUtils.ts # Council operations
│   ├── diplomaticIncidentsUtils.ts # Incident handling
│   ├── peaceConferenceUtils.ts    # Conference mechanics
│   ├── advancedEspionageUtils.ts  # Covert operations
│   └── aiDiplomacyEvaluator.ts    # Enhanced with Phase 3
└── components/
    └── DiplomacyPhase3Display.tsx # UI component
```

## Usage Examples

### Example 1: Using DIP to Influence Council Vote

```typescript
import { spendDIP, getDIP } from '@/lib/diplomaticCurrencyUtils';
import { castVote } from '@/lib/internationalCouncilUtils';

// Check if nation has enough DIP to influence voters
if (getDIP(nation) >= 25) {
  // Spend DIP to influence undecided voters
  const updatedNation = spendDIP(nation, 25, 'Influence council voters', currentTurn);

  // Cast your vote
  const updatedCouncil = castVote(council, resolutionId, nation.id, 'for');

  // Result: Your resolution more likely to pass
}
```

### Example 2: Resolving a Diplomatic Incident

```typescript
import { resolveIncident } from '@/lib/diplomaticIncidentsUtils';

// Get the incident
const incident = activeIncidents.find(i => i.id === incidentId);

// Choose resolution option (negotiate)
const negotiateOption = incident.resolutionOptions.find(
  opt => opt.type === 'negotiate'
);

// Attempt resolution
const { incident: updatedIncident, accepted } = resolveIncident(
  incident,
  negotiateOption,
  currentTurn
);

if (accepted) {
  // Incident de-escalated!
  // Escalation reduced by 50
  // Relationship improved by +12
  // Trust improved by +10
} else {
  // Resolution rejected, escalation increases by +15
  // Try different approach or spend more resources
}
```

### Example 3: Hosting a Peace Conference

```typescript
import {
  createPeaceConference,
  addParticipant,
  addAgendaItem,
  createProposal
} from '@/lib/peaceConferenceUtils';

// Create conference (costs 40 DIP)
let conference = createPeaceConference(
  nation.id,  // Convener
  currentTurn,
  ['war-1', 'war-2'],  // Wars to resolve
  10  // Max 10 rounds
);

// Add participants
conference = addParticipant(
  conference,
  belligerent1.id,
  'belligerent',
  ['Territorial integrity', 'Security guarantees'],  // Objectives
  ['Peace with honor'],  // Acceptable outcomes
  ['Complete surrender']  // Red lines
);

conference = addParticipant(
  conference,
  mediator.id,
  'mediator'
);

// Add agenda items
conference = addAgendaItem(
  conference,
  'Territorial Settlement',
  'Resolve disputed territories',
  nation.id,
  'critical'
);

// Propose peace terms
const terms: PeaceTerm[] = [
  {
    type: 'ceasefire',
    description: 'Immediate ceasefire along current lines',
    enforceable: true,
    guarantors: [guarantor.id],
  },
  {
    type: 'territory-exchange',
    description: 'Return of occupied territories',
    fromNationId: belligerent1.id,
    toNationId: belligerent2.id,
    territoryIds: ['region-1'],
    enforceable: true,
  }
];

conference = createProposal(conference, nation.id, terms);
```

### Example 4: Running a Covert Operation

```typescript
import {
  planCovertOperation,
  executeCovertOperation
} from '@/lib/advancedEspionageUtils';

// Plan operation
const operation = planCovertOperation(
  nation.id,  // Operator
  target.id,  // Target
  'smear-campaign',
  currentTurn,
  []  // No secondary targets
);

// Wait 2 turns for planning
// ...

// Execute operation
const result = executeCovertOperation(operation, nation, target);

if (result.success && !result.detected) {
  // Success! Secret maintained
  // Target's reputation reduced by -25 for 20 turns
  // Target's public opinion reduced by -15
} else if (result.success && result.detected) {
  // Success but exposed!
  // Effects still apply, but severe backlash
  // -40 relationship, -30 trust, -25 reputation for operator
} else if (!result.success && result.detected) {
  // Worst case: Failed and exposed
  // No effects, wasted resources, diplomatic damage
}
```

## Balance Considerations

**Diplomatic Currency:**
- Scarce enough to force choices
- Abundant enough for active play
- Rewards diplomatic engagement
- Punishes warmongering (less income)

**International Council:**
- Veto expensive but powerful
- Resolutions can be ignored (with penalty)
- Legitimacy prevents abuse
- Rotating membership creates dynamics

**Diplomatic Incidents:**
- Common enough to be relevant (5% base)
- Rare enough not to overwhelm
- Escalation gives time to respond
- Consequences meaningful but not instant death

**Peace Conferences:**
- Complex but rewarding
- Multiple paths to agreement
- Failure is possible
- Mediators incentivized

**Advanced Espionage:**
- High risk, high reward
- Detection risk prevents spam
- Blowback severe if caught
- Counter-intelligence meaningful

## Testing Scenarios

### Test 1: DIP Economy

1. Start new game
2. Check starting DIP (should be 50)
3. Form high-level alliances → +2 DIP/turn each
4. Join council as elected member → +10 DIP/turn
5. Mediate conflict → +15 DIP one-time
6. Verify income calculation
7. Spend DIP on actions
8. Check capacity limits (200 max)

### Test 2: Council Resolution

1. Initialize council with permanent members
2. Elect temporary members
3. Propose sanction resolution against nation
4. Cast votes (for, against, abstain)
5. Attempt veto by permanent member
6. Finalize voting after 3 turns
7. Check if resolution passed
8. Verify compliance tracking
9. Test resolution effects on target

### Test 3: Incident Escalation

1. Create border skirmish incident
2. Check initial escalation (20)
3. Let 5 turns pass without action
4. Verify escalation increases (20 + 5*5 = 45)
5. Choose negotiation resolution
6. Check if accepted
7. Verify de-escalation (-50 = -5 final)
8. Test deadline trigger at turn 10

### Test 4: Peace Conference

1. Create war between 2 nations
2. Convene peace conference (40 DIP cost)
3. Add belligerents, mediator, guarantor
4. Set agenda items
5. Create peace proposal with terms
6. Vote on proposal
7. Finalize into treaty
8. Track compliance
9. Test violation response

### Test 5: Espionage Detection

1. Plan smear campaign operation
2. Execute after 2 turns
3. Roll for success (60% chance)
4. Roll for detection (30% risk)
5. If detected:
   - Apply blowback penalties
   - Create grievance
   - Damage relationship/trust
6. If not detected:
   - Apply effects
   - Maintain secrecy
7. Run counter-intel investigation
8. Test discovery mechanics

## API Reference

### Diplomatic Currency Functions

- `getDIP(nation)` - Get DIP balance
- `spendDIP(nation, cost, reason, turn)` - Spend DIP
- `earnDIP(nation, amount, reason, turn)` - Earn DIP
- `hasEnoughDIP(nation, cost)` - Check if can afford
- `calculateDIPIncome(nation, allNations, turn)` - Calculate income
- `applyDIPIncome(nation, turn)` - Apply per-turn income
- `tradeDIPForFavors(nation, targetId, turn)` - Convert DIP to favors

### Council Functions

- `initializeInternationalCouncil(turn, permanentMembers)` - Create council
- `electCouncilMember(council, nationId, turn)` - Elect member
- `addObserver(council, nationId)` - Add observer
- `createResolution(council, type, title, ...)` - Create resolution
- `startVoting(council, resolutionId, turn)` - Begin vote
- `castVote(council, resolutionId, nationId, vote)` - Cast vote
- `finalizeVoting(council, resolutionId, turn)` - Complete vote
- `isNationSanctioned(council, nationId)` - Check sanctions

### Incident Functions

- `createIncident(type, primary, target, turn)` - Create incident
- `escalateIncident(incident, turn)` - Increase escalation
- `deEscalateIncident(incident, amount)` - Reduce escalation
- `resolveIncident(incident, option, turn)` - Attempt resolution
- `calculateIncidentProbability(n1, n2, neighbors)` - Get chance
- `getIncidentsForNation(incidents, nationId)` - Get nation's incidents
- `processIncidents(incidents, turn)` - Update all incidents

### Peace Conference Functions

- `createPeaceConference(convenedBy, turn, wars)` - Create conference
- `addParticipant(conf, nationId, role, ...)` - Add participant
- `addAgendaItem(conf, topic, desc, ...)` - Add agenda item
- `createProposal(conf, proposedBy, terms)` - Create proposal
- `supportProposal(conf, proposalId, nationId)` - Support proposal
- `voteOnProposal(conf, proposalId)` - Vote on proposal
- `createTreatyFromProposal(conf, proposalId, turn)` - Make treaty
- `updateTreatyCompliance(treaty, nationId, level)` - Update compliance
- `recordViolation(treaty, violator, term, ...)` - Record violation

### Espionage Functions

- `planCovertOperation(operator, target, type, turn)` - Plan operation
- `executeCovertOperation(op, operator, target)` - Execute operation
- `startInvestigation(ci, target, focus, turn)` - Begin investigation
- `progressInvestigation(ci, invId, ops)` - Progress investigation
- `exposeOperation(op, exposedBy, turn)` - Expose operation
- `improveCounterIntel(ci, investment)` - Improve CI
- `calculateBlowback(op)` - Calculate exposure penalty

## Summary

Phase 3 completes the diplomacy system by adding:

1. **Economic Dimension**: DIP provides a diplomatic economy
2. **Global Governance**: Council enables collective action
3. **Dynamic Events**: Incidents create ongoing challenges
4. **Complex Negotiations**: Peace conferences allow nuanced deals
5. **Shadow Diplomacy**: Espionage adds covert layer

Combined with Phase 1 (Trust, Favors, Promises) and Phase 2 (Grievances, Claims, Specialized Alliances), Phase 3 creates a comprehensive diplomatic simulation where:

- Every action has consequences
- Relationships have depth and history
- Diplomacy is a viable path to victory
- Peaceful and aggressive strategies both work
- International law and shadow operations coexist
- Multi-lateral diplomacy is possible and rewarding

The system supports diverse play styles from peaceful mediator to aggressive warmonger, with diplomatic tools available for all approaches.
