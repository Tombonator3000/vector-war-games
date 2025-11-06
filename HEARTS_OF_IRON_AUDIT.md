# Hearts of Iron IV → Vector War Games: Feature Audit

**Date:** 2025-11-06
**Purpose:** Identify Hearts of Iron IV mechanics that can enhance Vector War Games
**Game Context:** Grand strategy nuclear warfare game (Cold War era, turn-based, global scope)

---

## Executive Summary

Vector War Games already has **strong foundations** for Hearts of Iron-style gameplay:
- ✅ Territory control with bonuses
- ✅ Military units (Army/Navy/Air)
- ✅ Research & technology trees
- ✅ Diplomacy, alliances, and treaties
- ✅ War justification (Casus Belli) system
- ✅ Leader doctrines and abilities
- ✅ Economic resources and trade
- ✅ Intelligence operations

**Key Opportunity:** The game suffers from "feature creep" with overly complex bio-warfare and cyber systems. Hearts of Iron mechanics can help **streamline and focus** these systems while adding depth to core military/diplomatic gameplay.

---

## 🎯 TIER 1: HIGH-VALUE FEATURES (Implement These First)

### 1. **National Focus Trees** ⭐⭐⭐⭐⭐

**What HoI Does:**
- Each nation has a unique tree of focuses (35-day decisions)
- Focuses unlock bonuses, events, war goals, and narrative paths
- Provides clear gameplay direction and historical flavor

**Current State in Vector War Games:**
- ❌ No focus system
- ✅ Has leader doctrines and abilities (partial overlap)
- ✅ Has flashpoint events (175KB of crisis narratives!)

**Adaptation for Vector War Games:**

```typescript
interface NationalFocus {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Requirements
  prerequisites: string[]; // Other focus IDs
  mutuallyExclusive: string[];
  requiredTurn: number;
  requiredTech?: string[];

  // Duration (in turns instead of days)
  turnsToComplete: number;

  // Rewards
  effects: FocusEffect[];
  unlocksEvent?: string;
  unlocksWarGoal?: WarGoal;
}

interface FocusEffect {
  type: 'production_bonus' | 'research_speed' | 'military_readiness' |
        'diplomatic_influence' | 'unlock_building' | 'resource_bonus' |
        'alliance_requirement' | 'territory_claim';
  value: number | string;
  duration?: number; // Turns, or permanent if undefined
}

// Example Focus Trees per Nation
const USA_FOCUS_TREE: NationalFocus[] = [
  {
    id: 'ussr_containment',
    name: 'Containment Doctrine',
    description: 'Commit to containing Soviet expansion globally',
    turnsToComplete: 3,
    effects: [
      { type: 'diplomatic_influence', value: 10 },
      { type: 'alliance_requirement', value: 'nato_members' }
    ],
    unlocksWarGoal: { type: 'regime_change', target: 'communist_nations' }
  },
  {
    id: 'space_race',
    name: 'The Space Race',
    description: 'Compete for technological supremacy',
    prerequisites: ['scientific_funding'],
    turnsToComplete: 5,
    effects: [
      { type: 'research_speed', value: 0.25 }, // +25% research
      { type: 'unlock_building', value: 'advanced_satellite' }
    ]
  }
];
```

**Why It Works for Your Game:**
- Provides **turn-by-turn goals** (your game is turn-based!)
- Adds **narrative depth** to each nation (complement existing flashpoints)
- **Reduces analysis paralysis** - focuses guide players through complex systems
- **Replayability** - different focus paths each game
- **Diplomatic flavor** - focuses can unlock alliance/war options

**Implementation Priority:** 🔴 **HIGH** - Would solve the "too many systems" problem by providing guided progression

---

### 2. **Production Queue System** ⭐⭐⭐⭐⭐

**What HoI Does:**
- Factories assigned to produce specific equipment
- Production efficiency increases over time
- Queue management with priorities
- Conversion between civilian/military production

**Current State in Vector War Games:**
- ⚠️ **WEAK POINT** - Units/missiles appear to be instant or simple resource cost
- ✅ Has production resource
- ✅ Has research system (but no build times)
- ✅ Has territory improvements

**Adaptation for Vector War Games:**

```typescript
interface ProductionQueue {
  nationId: string;
  factories: ProductionFactory[];
  queue: ProductionOrder[];
}

interface ProductionFactory {
  id: string;
  location: ContinentId;
  type: 'civilian' | 'military' | 'nuclear';
  efficiency: number; // 0-1, increases over time producing same item
  assignedTo?: string; // ProductionOrder ID
}

interface ProductionOrder {
  id: string;
  itemType: 'missile' | 'warhead' | 'army' | 'navy' | 'air' | 'defense' | 'improvement';
  itemId: string;

  // Cost & Progress
  productionCost: number; // Total production points needed
  currentProgress: number;
  turnsRemaining: number;

  // Assignment
  factoriesAssigned: number;
  priority: number; // 1-10, affects factory allocation

  // Status
  status: 'queued' | 'in_progress' | 'paused' | 'completed';

  // Modifiers
  efficiencyBonus: number; // From repeated production
  researchBonus: number; // From tech unlocks
}

// Production per turn calculation
function calculateProductionProgress(order: ProductionOrder, factories: ProductionFactory[]): number {
  const assignedFactories = factories.filter(f => f.assignedTo === order.id);

  let totalOutput = 0;
  for (const factory of assignedFactories) {
    const baseOutput = 10; // Base production per factory per turn
    const efficiency = factory.efficiency; // 0.5 to 1.0
    const bonus = 1 + order.efficiencyBonus + order.researchBonus;

    totalOutput += baseOutput * efficiency * bonus;
  }

  return totalOutput;
}
```

**Why It Works for Your Game:**
- Adds **strategic depth** to resource management (production is already a core resource)
- Creates **meaningful turn-to-turn decisions** (what to build next?)
- Enables **trade-offs** (missiles vs conventional forces vs defenses)
- **Balances nuclear gameplay** - can't spam missiles instantly, must plan ahead
- **Territory matters more** - factories in different continents = distributed production

**Implementation Priority:** 🔴 **HIGH** - Critical missing piece for strategic gameplay

---

### 3. **Supply Lines & Logistics** ⭐⭐⭐⭐

**What HoI Does:**
- Units need supply from capital/supply hubs
- Supply lines can be cut by enemy control
- Attrition for units without supply
- Naval convoys for overseas supply

**Current State in Vector War Games:**
- ❌ No supply system
- ✅ Has conventional units (Army, Navy, Air)
- ✅ Has territory control
- ✅ Has "readiness" mechanic (could be supply-based)

**Adaptation for Vector War Games:**

```typescript
interface SupplyNetwork {
  nationId: string;
  supplyHubs: SupplyHub[];
  supplyRoutes: SupplyRoute[];
  convoyRoutes: ConvoyRoute[];
}

interface SupplyHub {
  continentId: ContinentId;
  supplyCapacity: number; // Max units that can be supplied
  connectedTerritories: ContinentId[];
  level: number; // 1-3, upgradeable via territory improvements
}

interface SupplyRoute {
  from: ContinentId;
  to: ContinentId;
  isActive: boolean; // Can be cut by enemy control
  supplyFlow: number; // 0-100%
}

interface ConvoyRoute {
  from: ContinentId;
  to: ContinentId;
  navalProtection: number; // Naval units assigned
  vulnerabilityToRaiding: number; // 0-100%
  isOverseas: boolean;
}

// Unit supply calculation
function getUnitSupply(unit: ConventionalUnit, network: SupplyNetwork): number {
  const territory = unit.location;
  const nearestHub = findNearestSupplyHub(territory, network);

  if (!nearestHub) return 0; // No supply

  const route = findRoute(nearestHub.continentId, territory, network);
  if (!route || !route.isActive) return 0; // Supply line cut

  return route.supplyFlow; // 0-100%
}

// Apply supply effects to combat
function applySupplyModifiers(unit: ConventionalUnit, supply: number): ConventionalUnit {
  return {
    ...unit,
    attackPower: unit.attackPower * (supply / 100),
    defensePower: unit.defensePower * (supply / 100),
    readiness: Math.min(unit.readiness, supply), // Can't be more ready than supplied
    attrition: supply < 50 ? (50 - supply) / 10 : 0 // Units take damage if undersupplied
  };
}
```

**Why It Works for Your Game:**
- **Adds territorial depth** - controlling continents now matters for logistics
- **Naval gameplay enhancement** - navy protects convoy routes
- **Prevents "teleport armies"** - units need supply to be effective
- **Strategic bombing targets** - supply hubs are key infrastructure
- **Complements existing readiness system** - readiness could depend on supply

**Implementation Priority:** 🔴 **HIGH** - Critical for balanced conventional warfare

---

### 4. **Political Power System** ⭐⭐⭐⭐

**What HoI Does:**
- Political power (PP) is a resource that accumulates per day
- Spent on: hiring advisors, changing laws, justifying wars, diplomatic actions
- Caps at 2000 (prevents hoarding)
- Base generation + modifiers from leaders/laws

**Current State in Vector War Games:**
- ❌ No political power equivalent
- ✅ Has diplomatic influence (DIP points) - similar but narrower
- ✅ Has leader abilities with cooldowns
- ✅ Has morale (could be PP-affected)

**Adaptation for Vector War Games:**

```typescript
interface PoliticalPowerState {
  nationId: string;
  currentPP: number; // Current political power
  maxPP: number; // Cap (default 2000)
  perTurnGeneration: number; // Base + modifiers

  // Sources of PP generation
  baseGeneration: number; // 2-5 per turn based on government type
  leaderBonus: number; // From leader traits
  stabilityBonus: number; // From high morale
  ideologyBonus: number; // From aligned ideology
}

// Political Power costs (examples)
const PP_COSTS = {
  // Diplomatic Actions
  justify_war: 50,
  guarantee_independence: 25,
  improve_relations: 10,
  break_alliance: 100,

  // Internal Actions
  change_policy: 150,
  suppress_faction: 75,
  propaganda_campaign: 30,
  emergency_production: 100, // Bonus factories for 3 turns

  // Intelligence
  expand_spy_network: 50,
  launch_operation: 25,

  // Military
  mobilize_reserves: 100, // Instant readiness boost
  promote_general: 50,
  change_doctrine: 200,

  // Research
  research_boost: 50, // +50% speed on one project for 3 turns

  // Governance
  change_immigration_policy: 100,
  change_trade_policy: 75,
  appoint_advisor: 150
};

// PP generation calculation
function calculatePPGeneration(nation: Nation, gameState: GameState): number {
  let generation = 2; // Base

  // Leader modifier
  if (nation.leader === 'JFK') generation += 1; // Charismatic leader

  // Stability (morale-based)
  if (nation.morale > 70) generation += 1;
  else if (nation.morale < 30) generation -= 1;

  // Ideology alignment
  const alignedNations = countAlignedNations(nation, gameState);
  if (alignedNations > 5) generation += 0.5;

  // War exhaustion
  const atWar = gameState.wars.some(w => w.participants.includes(nation.id));
  if (atWar) generation -= 0.5;

  return Math.max(1, generation); // Minimum 1 per turn
}
```

**Why It Works for Your Game:**
- **Unifies disparate actions** under one resource (reduces UI complexity)
- **Adds strategic choices** - "Do I justify war or boost research?"
- **Prevents spam** - can't do everything at once
- **Rewards stability** - high morale nations get more PP
- **Time-gates powerful actions** - prevents turn 1 all-out war

**Could Replace/Consolidate:**
- Diplomatic Influence (DIP) - merge into PP system
- Some leader abilities - convert to PP-based actions
- Some turn-based cooldowns - use PP costs instead

**Implementation Priority:** 🔴 **HIGH** - Would simplify game UI and add strategic resource management

---

### 5. **Resistance & Occupation System** ⭐⭐⭐⭐

**What HoI Does:**
- Occupied territories have resistance levels
- Requires garrison troops to suppress
- Resistance reduces resource output
- Compliance increases over time (or with harsh policies)
- Can spawn resistance uprisings

**Current State in Vector War Games:**
- ❌ No occupation system
- ✅ Has territory ownership
- ✅ Has population and morale
- ✅ Has grievance system (partially relevant)

**Adaptation for Vector War Games:**

```typescript
interface OccupiedTerritory {
  continentId: ContinentId;
  occupier: string; // Nation ID
  formerOwner: string;

  // Resistance
  resistanceLevel: number; // 0-100
  complianceLevel: number; // 0-100

  // Garrison
  garrisonUnits: string[]; // Unit IDs assigned to suppress
  requiredGarrison: number; // Based on resistance & population

  // Effects
  resourcePenalty: number; // 0-1 multiplier (lower = less resources extracted)
  uprisingRisk: number; // 0-100 chance per turn

  // Policies
  occupationPolicy: 'lenient' | 'moderate' | 'harsh' | 'brutal';

  // Duration
  occupiedSince: number; // Turn number
}

// Occupation policies
const OCCUPATION_POLICIES = {
  lenient: {
    complianceGain: 2, // Per turn
    resistanceReduction: 1,
    resourcePenalty: 0.5, // Get 50% of resources
    garrisonRequirement: 1.5, // Multiplier
    grievanceGeneration: 5, // Small grievance
    internationalPenalty: -5 // Small diplomatic penalty
  },
  moderate: {
    complianceGain: 1,
    resistanceReduction: 2,
    resourcePenalty: 0.7,
    garrisonRequirement: 1.0,
    grievanceGeneration: 10,
    internationalPenalty: -10
  },
  harsh: {
    complianceGain: 0.5,
    resistanceReduction: 4,
    resourcePenalty: 0.85,
    garrisonRequirement: 0.75,
    grievanceGeneration: 25,
    internationalPenalty: -25
  },
  brutal: {
    complianceGain: 0,
    resistanceReduction: 6,
    resourcePenalty: 0.95,
    garrisonRequirement: 0.5,
    grievanceGeneration: 50,
    internationalPenalty: -50 // Major diplomatic consequences
  }
};

// Resistance effects
function applyResistanceEffects(territory: OccupiedTerritory, nation: Nation): void {
  // Resource penalty
  const baseProduction = getTerritoryProduction(territory.continentId);
  const actualProduction = baseProduction * (1 - territory.resourcePenalty) *
                          (1 - territory.resistanceLevel / 100);

  // Garrison requirement
  const populationInTerritory = getTerritoryPopulation(territory.continentId);
  territory.requiredGarrison = Math.ceil(
    (populationInTerritory / 1000000) * // 1 unit per 1M pop
    OCCUPATION_POLICIES[territory.occupationPolicy].garrisonRequirement *
    (1 + territory.resistanceLevel / 100) // More resistance = more garrison needed
  );

  // Uprising check
  if (territory.garrisonUnits.length < territory.requiredGarrison) {
    territory.uprisingRisk = Math.min(100, territory.resistanceLevel +
                             (territory.requiredGarrison - territory.garrisonUnits.length) * 10);
  }
}
```

**Why It Works for Your Game:**
- **Makes conquest meaningful** - can't just paint the map, must maintain control
- **Adds depth to conventional warfare** - need troops for occupation
- **Diplomatic consequences** - brutal occupation angers other nations
- **Complements grievance system** - occupation generates grievances
- **Guerrilla warfare flavor** - resistance = proxy war opportunities for rivals

**Implementation Priority:** 🟡 **MEDIUM-HIGH** - Important for post-war gameplay

---

## 🎯 TIER 2: MEDIUM-VALUE FEATURES (Strong Additions)

### 6. **Division Designer (Unit Templates)** ⭐⭐⭐

**What HoI Does:**
- Players design custom division templates
- Mix different battalions (infantry, tanks, artillery, etc.)
- Combat width, organization, stats calculated from composition
- Can upgrade existing divisions

**Current State in Vector War Games:**
- ⚠️ Units are fixed types: Armored Corps, Carrier Strike Groups, Expeditionary Air Wings
- ✅ Has attack/defense stats
- ✅ Has readiness mechanic

**Adaptation for Vector War Games:**

Instead of full HoI complexity, implement **Unit Doctrines** (lighter version):

```typescript
interface UnitDoctrine {
  id: string;
  name: string;
  type: 'army' | 'navy' | 'air';

  // Composition modifiers
  composition: {
    infantry: number; // 0-100%
    armor: number;
    artillery: number;
  };

  // Stat modifiers
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  costModifier: number; // Production cost

  // Special abilities
  terrainBonus?: { terrain: string; bonus: number }[];
  combatWidth: number; // How many can fight simultaneously
}

// Example doctrines
const ARMY_DOCTRINES = {
  combined_arms: {
    name: 'Combined Arms',
    composition: { infantry: 40, armor: 40, artillery: 20 },
    attackBonus: 15,
    defenseBonus: 10,
    costModifier: 1.3, // 30% more expensive
    combatWidth: 10
  },
  infantry_mass: {
    name: 'Mass Infantry',
    composition: { infantry: 70, armor: 10, artillery: 20 },
    attackBonus: 5,
    defenseBonus: 20,
    costModifier: 0.8, // 20% cheaper
    combatWidth: 15 // More units can fight
  },
  armored_spearhead: {
    name: 'Armored Spearhead',
    composition: { infantry: 20, armor: 70, artillery: 10 },
    attackBonus: 25,
    defenseBonus: 5,
    speedBonus: 15,
    costModifier: 1.5,
    combatWidth: 8
  }
};
```

**Why It Works for Your Game:**
- **Simpler than HoI** - pre-made doctrines instead of full designer
- **Strategic choices** - different doctrines for different scenarios
- **Research integration** - unlock better doctrines via tech
- **Combat variety** - not all armies are identical

**Implementation Priority:** 🟡 **MEDIUM** - Nice depth addition without overwhelming complexity

---

### 7. **Generals & Field Marshals** ⭐⭐⭐

**What HoI Does:**
- Named military leaders with traits
- Gain experience from combat
- Provide bonuses to assigned units
- Skill levels (1-5) in attack, defense, planning, logistics

**Current State in Vector War Games:**
- ⚠️ Has nation leaders with doctrines, but no military commanders
- ✅ Has unit system that could use leader assignments

**Adaptation for Vector War Games:**

```typescript
interface MilitaryCommander {
  id: string;
  name: string;
  nationId: string;
  rank: 'general' | 'admiral' | 'air_marshal';

  // Skills (1-5)
  attack: number;
  defense: number;
  planning: number; // Affects readiness buildup
  logistics: number; // Reduces supply requirements

  // Experience
  level: number; // 1-10
  experience: number; // 0-100 per level

  // Traits (max 3)
  traits: CommanderTrait[];

  // Assignment
  assignedUnits: string[]; // Unit IDs
  maxUnits: number; // Based on rank
}

interface CommanderTrait {
  id: string;
  name: string;
  effect: TraitEffect[];

  // Acquisition
  type: 'earned' | 'personality' | 'background';
  requiresExperience?: number;
}

// Example traits
const COMMANDER_TRAITS = {
  aggressive: {
    name: 'Aggressive',
    effect: [
      { stat: 'attack', modifier: 1.15 },
      { stat: 'defense', modifier: 0.95 }
    ]
  },
  defensive_doctrine: {
    name: 'Defensive Doctrine',
    effect: [
      { stat: 'defense', modifier: 1.2 },
      { stat: 'entrenchment_speed', modifier: 1.3 }
    ]
  },
  logistics_wizard: {
    name: 'Logistics Wizard',
    effect: [
      { stat: 'supply_consumption', modifier: 0.8 },
      { stat: 'readiness_recovery', modifier: 1.25 }
    ]
  },
  naval_tactician: {
    name: 'Naval Tactician',
    type: 'admiral',
    effect: [
      { stat: 'convoy_raiding', modifier: 1.3 },
      { stat: 'submarine_detection', modifier: 1.2 }
    ]
  }
};
```

**Why It Works for Your Game:**
- **Personalization** - players get attached to commanders
- **RPG elements** - commanders level up through combat
- **Historical flavor** - use real Cold War generals (Patton, Zhukov, etc.)
- **Strategic layer** - assigning right commander to right front

**Implementation Priority:** 🟡 **MEDIUM** - Adds flavor without being essential

---

### 8. **Air Superiority & Air Doctrine** ⭐⭐⭐

**What HoI Does:**
- Air zones with contested air superiority
- Missions: air superiority, CAS, strategic bombing, interception
- Air doctrines affecting effectiveness
- Anti-air reducing enemy air effectiveness

**Current State in Vector War Games:**
- ⚠️ Has Expeditionary Air Wings but limited air combat
- ✅ Has bomber units for nuclear delivery
- ✅ Has defense stat (could include anti-air)

**Adaptation for Vector War Games:**

```typescript
interface AirZone {
  continentId: ContinentId;
  airSuperiority: Record<string, number>; // Nation ID -> superiority %

  // Assigned air units
  airUnitsPresent: AirUnitAssignment[];

  // Effects
  contestedLevel: 'none' | 'low' | 'medium' | 'high' | 'total'; // Based on enemy air
  antiAirStrength: number; // From ground-based AA and enemy fighters
}

interface AirUnitAssignment {
  unitId: string;
  nationId: string;
  mission: AirMission;
  efficiency: number; // 0-100%, affected by air superiority
}

type AirMission =
  | 'air_superiority' // Contest the skies
  | 'close_air_support' // Support ground troops (+attack bonus)
  | 'strategic_bombing' // Damage production/supply
  | 'interception' // Shoot down enemy bombers
  | 'reconnaissance' // Reveal enemy positions
  | 'nuclear_delivery'; // Bomber mission

// Air superiority effects on combat
function applyAirSuperiorityEffects(
  attacker: ConventionalUnit,
  defender: ConventionalUnit,
  airZone: AirZone
): CombatModifiers {
  const attackerAir = airZone.airSuperiority[attacker.ownerId] || 0;
  const defenderAir = airZone.airSuperiority[defender.ownerId] || 0;

  return {
    attackerBonus: attackerAir > 50 ? (attackerAir - 50) / 2 : 0, // Up to +25% at 100% superiority
    defenderBonus: defenderAir > 50 ? (defenderAir - 50) / 2 : 0,

    // Additional effects
    attackerReconBonus: attackerAir > 70 ? 0.1 : 0, // +10% attack from good recon
    bomberEffectiveness: Math.max(0, attackerAir - defenderAir) / 100 // Nuclear bomber survival rate
  };
}
```

**Why It Works for Your Game:**
- **Adds depth to conventional warfare** - air power matters
- **Nuclear gameplay integration** - air superiority affects bomber missions
- **Combines with existing bombers** - bomber units gain strategic bombing mission
- **Defense investment** - anti-air becomes valuable

**Implementation Priority:** 🟡 **MEDIUM** - Enhances existing air units

---

### 9. **Lend-Lease System** ⭐⭐⭐⭐

**What HoI Does:**
- Send equipment, resources, or units to allies
- Builds trust and maintains alliances
- Can request lend-lease from others
- Historical accuracy (US → UK, USSR)

**Current State in Vector War Games:**
- ❌ No equipment transfer system
- ✅ Has alliances
- ✅ Has trust system
- ✅ Has trade routes (partial overlap)

**Adaptation for Vector War Games:**

```typescript
interface LendLeaseAgreement {
  id: string;
  sender: string; // Nation ID
  recipient: string;

  // What's being sent
  transfers: LendLeaseTransfer[];

  // Terms
  duration: number; // Turns
  startTurn: number;
  endTurn: number;

  // Conditions
  requiresWar?: boolean; // Only while recipient is at war
  requiresAlliance: boolean;

  // Diplomatic effects
  trustGain: number; // Per turn
  influenceGain: number; // Diplomatic influence with recipient
}

interface LendLeaseTransfer {
  type: 'equipment' | 'resources' | 'units' | 'technology';
  itemId: string;
  amountPerTurn: number;
  totalDelivered: number;
}

// Example lend-lease
const USA_TO_UK_LENDLEASE: LendLeaseAgreement = {
  sender: 'USA',
  recipient: 'UK',
  transfers: [
    { type: 'equipment', itemId: 'army_division', amountPerTurn: 2 },
    { type: 'resources', itemId: 'production', amountPerTurn: 50 },
    { type: 'equipment', itemId: 'air_wing', amountPerTurn: 1 }
  ],
  duration: 10,
  requiresAlliance: true,
  trustGain: 5, // +5 trust per turn
  influenceGain: 2
};

// Requesting lend-lease (AI or player)
function requestLendLease(
  requester: string,
  potential Donor: string,
  items: LendLeaseTransfer[]
): LendLeaseRequest {

  const relationship = getTrust(requester, potentialDonor);
  const likelihood = calculateLendLeaseLikelihood(relationship, items);

  return {
    requester,
    potentialDonor,
    items,
    likelihood, // AI decision weight
    diplomaticCost: 25 // Political power to request
  };
}
```

**Why It Works for Your Game:**
- **Alliance depth** - gives meaning to alliances beyond defensive pacts
- **Asymmetric gameplay** - superpowers support smaller allies
- **Historical accuracy** - Cold War was full of proxy support
- **Trust system integration** - lend-lease builds trust (already exists in game)
- **Resource management** - meaningful use of excess production

**Implementation Priority:** 🟡 **MEDIUM-HIGH** - Excellent diplomatic/economic feature

---

### 10. **Peace Conference System (Enhanced)** ⭐⭐⭐

**What HoI Does:**
- Winners divide spoils based on war participation
- Warscore determines "purchase power"
- Can take territory, puppets, disarmament, reparations
- Other participants can contest decisions

**Current State in Vector War Games:**
- ✅ Has war goals and peace terms in Casus Belli system
- ✅ Has war score (0-100)
- ⚠️ Seems to be bilateral (winner/loser), not multi-party

**Adaptation for Vector War Games:**

```typescript
interface PeaceConference {
  warId: string;
  participants: PeaceParticipant[];
  defeatedNations: string[];

  // Conference state
  currentRound: number;
  maxRounds: number; // Prevents infinite conferences

  // Available "points" for demands
  warscorePool: Record<string, number>; // Nation ID -> warscore

  // Demands made
  demandHistory: PeaceDemand[];
  contestedDemands: PeaceDemand[];

  // Status
  status: 'in_progress' | 'completed' | 'collapsed';
}

interface PeaceParticipant {
  nationId: string;
  side: 'winner' | 'loser';
  warContribution: number; // 0-100, determines warscore share
  remainingPoints: number;

  // Priorities (AI)
  priorities: DemandPriority[];
}

interface PeaceDemand {
  demandingNation: string;
  demandType: 'territory' | 'disarmament' | 'reparations' | 'regime_change' | 'puppet';
  target: string; // Defeated nation
  specificItem?: string; // Territory ID, etc.

  cost: number; // Warscore points
  contested: boolean;
  supporters: string[];
  opponents: string[];
}

// Calculate war contribution (determines warscore)
function calculateWarContribution(nationId: string, war: War): number {
  let contribution = 0;

  // Combat participation
  const territoriesCaptured = war.combatLog.filter(
    log => log.attacker === nationId && log.result === 'victory'
  ).length;
  contribution += territoriesCaptured * 10;

  // Casualties inflicted
  const enemyCasualties = war.casualties[`inflicted_by_${nationId}`] || 0;
  contribution += enemyCasualties / 10000; // 10k casualties = 1 point

  // Lend-lease support
  const lendLeaseValue = war.lendLease.filter(
    ll => ll.sender === nationId
  ).reduce((sum, ll) => sum + ll.totalValue, 0);
  contribution += lendLeaseValue / 1000;

  // Time in war
  const turnsInWar = war.currentTurn - war.joinedOnTurn[nationId];
  contribution += turnsInWar * 2;

  return contribution;
}
```

**Why It Works for Your Game:**
- **Multi-lateral wars** - allies divide spoils realistically
- **Diplomatic tension** - allies can disagree on peace terms
- **Prevents "victor takes all"** - more nuanced than binary outcomes
- **Historical flavor** - Yalta Conference, Potsdam Conference vibes
- **Integrates with existing Casus Belli** - expands war goals system

**Implementation Priority:** 🟡 **MEDIUM** - Enhances existing war resolution

---

## 🎯 TIER 3: NICE-TO-HAVE FEATURES (Lower Priority)

### 11. **Volunteers & Expeditionary Forces** ⭐⭐

Send units to fight in other nations' wars without formal declaration. Great for proxy wars (perfect for Cold War theme!).

**Implementation:** Allow "loaning" units to allies. Units fight under ally's command but retain owner's identity. If discovered, generates grievances.

---

### 12. **Stability & War Support** ⭐⭐⭐

**What HoI Does:** Separate stability (internal) and war support (population's will to fight) meters.

**Current State:** You have **morale** which seems to combine these.

**Recommendation:** Split morale into:
- **Stability** (domestic politics, economy, disasters)
- **War Support** (willingness to fight, affected by victories/defeats)

---

### 13. **Ideologies & Civil Wars** ⭐⭐

**What HoI Does:** Ideology drift, coups, civil wars spawning new nations.

**Current State:** You have ideology system and political factions already!

**Recommendation:** Add civil war mechanics where low stability + faction support triggers civil wars, splitting the nation temporarily.

---

### 14. **Battle Plans** ⭐⭐

**What HoI Does:** Draw front lines and offensive arrows, AI executes.

**Current State:** Your game is turn-based, not real-time.

**Recommendation:** **Skip this** - doesn't fit turn-based gameplay. HoI needs this because it's real-time.

---

### 15. **Radar & Detection Systems** ⭐⭐⭐

**What HoI Does:** Radar stations detect enemy ships/planes.

**Current State:** You have satellites and spy networks for detection.

**Recommendation:** Expand satellite system to provide "detection range" - uncovers enemy missile sites, troop movements, etc. Adds intel mini-game.

---

### 16. **Fuel System** ⭐

**What HoI Does:** Tanks, planes, ships need fuel. Fuel is a strategic resource.

**Current State:** You have oil in resource stockpiles but it's not actively used.

**Recommendation:** **Skip this** - your game already has enough resource complexity. Oil is tracked but adding fuel mechanics is overkill.

---

### 17. **Intelligence Agencies & Operations** ⭐⭐⭐⭐

**What HoI Does:** Build spy networks, run operations (steal tech, boost resistance, etc.)

**Current State:** ✅ **Already have this!** SpyNetworkPanel, espionage operations, satellites.

**Recommendation:** **Keep as-is** but could add HoI-style operation variety:
- Steal blueprints (copy enemy research)
- Fake intelligence (mislead enemy)
- Targeted sabotage (damage specific production)
- Assassinations (kill commanders or leaders)

---

### 18. **Terrain & Weather** ⭐⭐

**What HoI Does:** Different terrain types affect combat, weather affects operations.

**Current State:** Game uses continent-level granularity, not province-level.

**Recommendation:** **Skip detailed terrain** - but could add continent-wide terrain modifiers:
- Asia = mountainous (defense bonus)
- Europe = plains (tank bonus)
- Africa = desert (supply penalty)

---

## ❌ TIER 4: AVOID THESE (Don't Fit Your Game)

### 19. **Real-Time Combat** ❌
HoI is pausable real-time. Your game is turn-based. Don't change this.

---

### 20. **Province-Level Granularity** ❌
HoI has thousands of provinces. Your game uses continents (7-10 regions). Keep it simple - continent-level works for nuclear/grand strategy.

---

### 21. **Detailed Naval Combat** ❌
HoI has complex naval battles with task forces, screening, etc. Your game has carrier strike groups which is sufficient. Nuclear war games don't need detailed naval tactics.

---

### 22. **Manpower Pools** ❌
HoI tracks manpower for recruitment. Your game has population but uses production for unit building. Simpler = better.

---

### 23. **Equipment Stockpiles** ❌
HoI tracks rifles, artillery, tanks individually. Too granular for your game. Your production queue system (recommended above) is sufficient abstraction.

---

## 📊 PRIORITY IMPLEMENTATION ROADMAP

### Phase 1: Core Strategic Systems (Weeks 1-2)
1. ✅ **Production Queue System** - Makes unit/missile building strategic
2. ✅ **Political Power System** - Unifies actions under one resource
3. ✅ **National Focus Trees** - Provides guided progression

**Why these first?** They solve your "feature creep" problem by adding structure and resource constraints.

---

### Phase 2: Military Depth (Weeks 3-4)
4. ✅ **Supply Lines & Logistics** - Balances conventional warfare
5. ✅ **Lend-Lease System** - Enhances alliances
6. ✅ **Resistance & Occupation** - Post-war gameplay

**Why these second?** Build on Phase 1's structure to make military gameplay more strategic.

---

### Phase 3: Polish & Flavor (Weeks 5-6)
7. ✅ **Generals & Field Marshals** - Personalization
8. ✅ **Air Superiority System** - Enhances air combat
9. ✅ **Enhanced Peace Conferences** - Better war resolution
10. ✅ **Unit Doctrines** - Army customization

**Why these last?** Nice-to-haves that add depth without being essential.

---

## 🎮 WHAT MAKES THIS ADAPTATION WORK

### Your Game's Unique Strengths (Keep These!)
1. ✅ **Nuclear Focus** - HoI doesn't have nukes as core mechanic
2. ✅ **Turn-Based** - Better for strategic thinking than HoI's real-time
3. ✅ **3D Globe (Cesium)** - Visually stunning, HoI is 2D map
4. ✅ **Flashpoint Events** - Narrative depth (HoI has this too, but yours are extensive)
5. ✅ **Cold War Theme** - More focused than HoI's WW2
6. ✅ **Cyber & Bio Warfare** - Modern twist HoI lacks

### What HoI Does Better (Steal These!)
1. ❌ **Production Queues** - HoI's factory system >>> your instant builds
2. ❌ **National Focuses** - HoI's guided progression >>> your open-ended systems
3. ❌ **Supply Lines** - HoI's logistics >>> your unlimited range units
4. ❌ **Political Power** - HoI's unified resource >>> your scattered action costs
5. ❌ **Occupation Mechanics** - HoI's resistance >>> your simple territory ownership

---

## 💡 DESIGN PHILOSOPHY LESSONS FROM HoI

### 1. **Complexity Through Depth, Not Breadth**
- **HoI Approach:** Few systems, but each very deep
  - Production (factories, efficiency, conversion, bombing)
  - Combat (terrain, width, organization, planning)
  - Diplomacy (factions, guarantees, war goals)

- **Your Current Approach:** Many systems, each medium-depth
  - Nuclear + Conventional + Bio + Cyber + Culture + Economy + Diplomacy + Intel

- **Recommendation:** **Consolidate systems**
  - Merge bio/cyber into intelligence operations
  - Make culture part of diplomacy/stability
  - Focus on Production → Military → Diplomacy triangle

---

### 2. **Guided Freedom**
- **HoI Approach:** National focuses provide clear goals, but player chooses path
- **Your Current Approach:** Total freedom, but can be overwhelming
- **Recommendation:** Implement focus trees to guide players through your complex systems

---

### 3. **Asymmetric Balance**
- **HoI Approach:** Nations are NOT balanced - USA is stronger than Luxembourg
  - But each has unique paths to victory
  - Small nations can punch above weight through diplomacy/alliances

- **Your Game:** Seems to have this (superpowers vs smaller nations)
- **Recommendation:** Embrace asymmetry further - give small nations unique focuses/abilities

---

### 4. **Emergent Storytelling**
- **HoI Approach:** Systems interact to create memorable moments
  - "I held the Maginot Line for 2 years!"
  - "My spy network stole German jet technology"

- **Your Game:** Has flashpoint events (scripted stories)
- **Recommendation:** Let systems create stories
  - "My lend-lease to Cuba triggered US intervention"
  - "Resistance in occupied Europe tied down my armies"

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Database Schema Additions

```sql
-- National Focuses
CREATE TABLE national_focuses (
  id TEXT PRIMARY KEY,
  nation_id TEXT REFERENCES nations(id),
  focus_id TEXT,
  completed BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  started_turn INTEGER
);

-- Production Queue
CREATE TABLE production_queue (
  id TEXT PRIMARY KEY,
  nation_id TEXT REFERENCES nations(id),
  item_type TEXT,
  item_id TEXT,
  factories_assigned INTEGER,
  progress INTEGER,
  priority INTEGER,
  status TEXT
);

-- Military Commanders
CREATE TABLE commanders (
  id TEXT PRIMARY KEY,
  nation_id TEXT REFERENCES nations(id),
  name TEXT,
  rank TEXT,
  attack INTEGER,
  defense INTEGER,
  planning INTEGER,
  logistics INTEGER,
  traits JSONB
);

-- Lend-Lease Agreements
CREATE TABLE lend_lease (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES nations(id),
  recipient_id TEXT REFERENCES nations(id),
  transfers JSONB,
  start_turn INTEGER,
  end_turn INTEGER
);

-- Occupied Territories
CREATE TABLE occupations (
  id TEXT PRIMARY KEY,
  continent_id TEXT,
  occupier_id TEXT REFERENCES nations(id),
  former_owner_id TEXT REFERENCES nations(id),
  resistance_level INTEGER,
  compliance_level INTEGER,
  policy TEXT,
  occupied_since INTEGER
);
```

---

### React Component Structure

```
/src/components/
├── hearts-of-iron-inspired/
│   ├── NationalFocusTree.tsx
│   ├── ProductionQueuePanel.tsx
│   ├── SupplyLinesMap.tsx (overlay on Cesium globe)
│   ├── PoliticalPowerDisplay.tsx
│   ├── LendLeaseManager.tsx
│   ├── OccupationPanel.tsx
│   ├── CommanderAssignment.tsx
│   ├── AirSuperiorityMap.tsx
│   └── PeaceConferenceModal.tsx
```

---

### State Management

```typescript
// Extend GameState interface
interface GameState {
  // ... existing properties ...

  // New HoI-inspired systems
  nationalFocuses: Record<string, NationalFocusState>;
  productionQueues: Record<string, ProductionQueue>;
  politicalPower: Record<string, PoliticalPowerState>;
  supplyNetworks: Record<string, SupplyNetwork>;
  lendLeaseAgreements: LendLeaseAgreement[];
  occupiedTerritories: OccupiedTerritory[];
  militaryCommanders: MilitaryCommander[];
  airZones: Record<ContinentId, AirZone>;
}
```

---

## 📈 EXPECTED OUTCOMES

### Gameplay Improvements
- ✅ **Reduced Analysis Paralysis** - Focuses guide decisions
- ✅ **Strategic Depth** - Production queues force planning ahead
- ✅ **Resource Management** - Political power limits spam
- ✅ **Military Tactics** - Supply lines add logistics puzzle
- ✅ **Alliance Meaning** - Lend-lease makes allies useful
- ✅ **Post-War Gameplay** - Occupation adds "after victory" phase

### Player Experience
- ✅ **Clearer Goals** - Focus trees show next objectives
- ✅ **More Decisions** - "What to produce?" "Where to assign generals?"
- ✅ **Emergent Stories** - System interactions create memorable moments
- ✅ **Replayability** - Different focus paths = different games

### Development Benefits
- ✅ **System Consolidation** - PP replaces scattered costs
- ✅ **UI Simplification** - Fewer panels, more focused interfaces
- ✅ **Proven Design** - HoI mechanics are battle-tested
- ✅ **Modular Implementation** - Can add piece-by-piece

---

## 🚨 WARNINGS & PITFALLS TO AVOID

### 1. **Don't Copy HoI Directly**
Your game is turn-based, nuclear-focused, Cold War. HoI is real-time, conventional, WW2. Adapt, don't clone.

### 2. **Don't Add Everything**
Pick 5-7 features max. More = feature creep returns.

### 3. **Don't Over-Granularize**
HoI works at province level. You work at continent level. Keep your scale.

### 4. **Don't Lose Your Identity**
Your nuclear focus, 3D globe, and Cold War theme are unique. HoI features should enhance these, not replace them.

### 5. **Don't Ignore Existing Systems**
You have flashpoints, bio-warfare, cyber-warfare. Integrate HoI features with these, don't orphan them.

---

## ✅ FINAL RECOMMENDATIONS

### Must-Implement (Tier 1)
1. **Production Queue System** - Solves instant-build problem
2. **National Focus Trees** - Guides players through complexity
3. **Political Power** - Unifies action costs
4. **Supply Lines** - Adds military logistics
5. **Lend-Lease** - Makes alliances meaningful

### Should-Implement (Tier 2)
6. **Occupation & Resistance** - Post-war gameplay
7. **Air Superiority** - Enhances existing air units
8. **Generals** - Personalization & flavor
9. **Enhanced Peace Conferences** - Better war resolution

### Nice-to-Have (Tier 3)
10. **Unit Doctrines** - Army customization
11. **Stability Split** - Separate internal/war support
12. **Intelligence Operations** - Expand existing spy network

### Skip Entirely (Tier 4)
- Real-time mechanics
- Province-level detail
- Manpower pools
- Equipment stockpiles
- Complex naval battles

---

## 📚 IMPLEMENTATION RESOURCES

### Code Examples Available In:
- `/src/lib/research.ts` - Existing tech tree (adapt for focuses)
- `/src/lib/casusBelliUtils.ts` - War mechanics (adapt for peace conferences)
- `/src/lib/aiDiplomacyActions.ts` - AI behavior (extend for lend-lease)
- `/src/hooks/useConventionalWarfare.ts` - Military units (extend for supply/commanders)

### Hearts of Iron IV Wikis:
- https://hoi4.paradoxwikis.com/ - Full mechanic documentation
- Focus on: National Focus, Production, Supply, Occupation sections

---

## 🎯 SUCCESS METRICS

After implementing Tier 1 features, you should see:

1. **Player Session Length** ↑ (more engaging)
2. **Turn Decision Time** ↓ (clearer goals via focuses)
3. **Unit Spam** ↓ (production queues limit instant builds)
4. **Alliance Formation** ↑ (lend-lease makes alliances useful)
5. **Conventional Warfare Use** ↑ (supply lines make it strategic)
6. **Feature Usage Balance** ↑ (PP system forces trade-offs)

---

## 🏁 CONCLUSION

Hearts of Iron IV has **decades of refined grand strategy design**. Your game already has strong foundations - you're 90% there. The key is not to copy HoI, but to **steal its best structural ideas**:

1. **Guide players** with focus trees
2. **Constrain actions** with political power
3. **Add production depth** with queues
4. **Make territory matter** with supply lines
5. **Reward alliances** with lend-lease

These five features will transform Vector War Games from "complex sandbox" to "guided strategic experience" while keeping your unique nuclear warfare identity.

**The nuclear war game market is yours to dominate. HoI gives you the blueprint. Now build it.** ☢️

---

**Document Version:** 1.0
**Last Updated:** 2025-11-06
**Next Review:** After Phase 1 implementation
