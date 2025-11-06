# Phase 3: Economic Depth Implementation

**Date:** 2025-11-06
**Status:** ✅ Complete
**Based on:** HEARTS_OF_IRON_AUDIT.md Phase 3 Specification

---

## 📋 Overview

Phase 3 implements three interconnected economic systems inspired by Hearts of Iron IV:

1. **Enhanced Trade System** - Import/Export mechanics with multi-nation agreements
2. **Resource Refinement** - Convert raw resources into refined materials with strategic bonuses
3. **Infrastructure Development** - Economic buildings that boost production, trade, and resources

These systems add strategic economic depth to Vector War Games, making economic management as important as military might.

---

## 🎯 Implemented Features

### 1. Enhanced Trade System

**Types Defined:** `src/types/economicDepth.ts`

#### Trade Agreements
- **Bilateral** - Two-nation trade pacts
- **Multilateral** - Multiple nations trading together
- **Trade Blocs** - Regional economic alliances (e.g., EU-style)
- **Embargoes** - Trade restrictions and sanctions

#### Trade Routes
- Multi-turn resource transfers
- Route efficiency (0-100%) affected by infrastructure
- Vulnerability to disruption (combat, events, sanctions)
- Naval and air protection assignments
- Maintenance costs per turn

#### Trade Mechanics
- **Route Status:** Active, Disrupted, Embargoed, Suspended
- **Resource Exchanges:** Oil, Uranium, Rare Earths, Food
- **Trade Hubs:** Increase capacity and reduce costs
- **Economic Sanctions:** Full embargoes, resource restrictions, financial sanctions

**Hook:** `src/hooks/useEnhancedTradeSystem.ts`
**UI Component:** `src/components/EnhancedTradePanel.tsx`

---

### 2. Resource Refinement System

**Types Defined:** `src/types/economicDepth.ts`

#### Refinery Types
1. **Oil Refinery** - Oil → Fuel (+15% military effectiveness)
2. **Uranium Enrichment** - Uranium → Enriched Uranium (+25% nuclear damage)
3. **Rare Earth Processing** - Rare Earths → Advanced Materials (+20% research speed)
4. **Steel Mill** - Iron + Coal → Steel (+15% production)
5. **Electronics Factory** - Rare Earths + Steel → Electronics (+30% cyber attack)
6. **Food Processing** - Food → Processed Food (+10 morale)

#### Refinement Mechanics
- **Efficiency Ramp-Up:** Refineries start at 50% efficiency, improve +2% per turn (max 100%)
- **Throughput:** Maximum resources processed per turn (upgradeable)
- **Multi-Turn Conversion:** Some refinements take 1-2 turns per batch
- **Maintenance Costs:** Per-turn upkeep for each refinery
- **Upgrades:** 5 levels per refinery, increasing output and efficiency

#### Refined Resources Provide Bonuses
- **Fuel:** +15% combat effectiveness for armies and fleets
- **Enriched Uranium:** +25% damage for nuclear weapons
- **Advanced Materials:** +20% research speed
- **Steel:** +15% production capacity
- **Electronics:** +30% cyber warfare attack strength
- **Processed Food:** +10 morale for population

**Hook:** `src/hooks/useResourceRefinement.ts`
**UI Component:** `src/components/ResourceRefinementPanel.tsx`

---

### 3. Infrastructure Development System

**Types Defined:** `src/types/economicDepth.ts`

#### Economic Infrastructure Types
1. **Trade Port** - Enables overseas trade routes (+5 route capacity)
2. **Trade Hub** - Central trade node (+8 route capacity, +8% efficiency)
3. **Refinery Complex** - Houses multiple refineries (+4 refinery capacity)
4. **Economic Zone** - Special economic zone (+20% production)
5. **Stock Exchange** - Financial center (+25 gold/turn)
6. **Industrial Park** - Manufacturing cluster (+25% production)
7. **Logistics Center** - Reduces trade costs (+15% trade efficiency)
8. **Customs Office** - Tariff revenue collection (+5% tariff revenue)
9. **Commodity Exchange** - Resource market access (+15% market benefits)

#### Infrastructure Mechanics
- **Construction Time:** 4-12 turns depending on type
- **Construction Progress:** Track progress percentage (0-100%)
- **Upgrades:** 5 levels per building, increasing capacity and bonuses
- **Damage System:** Buildings can be damaged or destroyed in warfare
- **Maintenance Costs:** Per-turn upkeep
- **Capacity:** Maximum usage (trade routes, refineries, etc.)

#### Economic Zones
- **Multi-Territory Zones:** Combine multiple territories for bonuses
- **Zone Bonuses:** +15% production, +10% trade efficiency (upgradeable)
- **Investment System:** Invest resources to upgrade zone bonuses
- **Infrastructure Requirements:** Territories need minimum infrastructure level
- **Connectivity:** Territories must be connected

**Hook:** `src/hooks/useEconomicInfrastructure.ts`
**UI Component:** `src/components/EconomicInfrastructurePanel.tsx`

---

## 🏗️ Architecture

### Master Hook: `useEconomicDepth`

Located at: `src/hooks/useEconomicDepth.ts`

This is the main integration point that combines all three subsystems:

```typescript
const {
  state,              // Complete economic state
  trade,              // Trade system functions
  refinement,         // Refinement system functions
  infrastructure,     // Infrastructure system functions

  processEconomicTurn,         // Process all systems per turn
  calculateEconomicPower,      // Calculate nation scores
  getEconomicRecommendations,  // AI helper suggestions

  // Quick stats
  globalTradeVolume,
  nationTradeStats,
  nationRefineryStats,
  nationInfrastructureStats,
} = useEconomicDepth(nations, currentTurn, currentNationId);
```

### UI Dashboard: `EconomicDashboard`

Located at: `src/components/EconomicDashboard.tsx`

Unified dashboard with 4 tabs:
- **Overview** - Economic power, victory progress, AI recommendations
- **Trade** - Trade routes, agreements, proposals, sanctions
- **Refinement** - Refineries, refined resources, bonuses
- **Infrastructure** - Buildings, economic zones, development

---

## 🔌 Integration with Game Loop

### Step 1: Add to GameState

Update `src/types/game.ts`:

```typescript
import type { EconomicDepthState } from './economicDepth';

interface GameState {
  // ... existing fields ...

  // Phase 3: Economic Depth
  economicDepth?: EconomicDepthState;
}
```

### Step 2: Add to Nation Type

Update `Nation` type:

```typescript
interface Nation {
  // ... existing fields ...

  // Additional resources for refinement
  iron?: number;
  coal?: number;
}
```

### Step 3: Initialize in Game Start

```typescript
import { useEconomicDepth } from '@/hooks/useEconomicDepth';

// In your main game component
const economicSystem = useEconomicDepth(nations, currentTurn, currentNationId);

// Initialize stockpiles on game start
economicSystem.refinement.initializeStockpiles();
```

### Step 4: Process Each Turn

In your turn processing logic (e.g., `gamePhaseHandlers.ts`):

```typescript
function processTurn(gameState: GameState) {
  // ... existing turn processing ...

  // Process economic systems
  const nationStockpiles = new Map();
  gameState.nations.forEach(nation => {
    nationStockpiles.set(nation.id, {
      oil: nation.resourceStockpile?.oil || 0,
      uranium: nation.resourceStockpile?.uranium || 0,
      rare_earths: nation.resourceStockpile?.rare_earths || 0,
      food: nation.resourceStockpile?.food || 0,
      iron: nation.iron || 0,
      coal: nation.coal || 0,
    });
  });

  // Process all economic systems
  economicSystem.processEconomicTurn(nationStockpiles);

  // Update game state
  gameState.economicDepth = economicSystem.state;

  // Apply refinement bonuses to nations
  gameState.nations.forEach(nation => {
    const bonuses = economicSystem.refinement.getActiveRefinementBonuses(nation.id);
    applyRefinementBonuses(nation, bonuses);
  });
}
```

### Step 5: Apply Bonuses

Create helper function to apply refinement bonuses:

```typescript
import type { RefinementBonus } from '@/types/economicDepth';

function applyRefinementBonuses(nation: Nation, bonuses: RefinementBonus[]) {
  bonuses.forEach(bonus => {
    switch (bonus.bonusType) {
      case 'military_effectiveness':
        // Apply to conventional forces
        nation.armies?.forEach(army => {
          army.attackPower *= (1 + bonus.amount / 100);
        });
        break;

      case 'nuclear_damage':
        // Apply to nuclear weapons
        nation.missiles?.forEach(missile => {
          missile.damage *= (1 + bonus.amount / 100);
        });
        break;

      case 'research_speed':
        nation.researchSpeed = (nation.researchSpeed || 1) * (1 + bonus.amount / 100);
        break;

      case 'production_boost':
        nation.productionMultiplier = (nation.productionMultiplier || 1) * (1 + bonus.amount / 100);
        break;

      case 'cyber_attack':
        nation.cyberAttack = (nation.cyberAttack || 0) + bonus.amount;
        break;

      case 'morale_boost':
        nation.morale = Math.min(100, nation.morale + bonus.amount);
        break;
    }
  });
}
```

---

## 🎮 Usage Examples

### Example 1: Create a Trade Agreement

```typescript
// Create bilateral trade agreement
const exchanges: TradeExchange[] = [
  {
    fromNationId: 'USA',
    toNationId: 'UK',
    resource: 'oil',
    amountPerTurn: 20,
    pricePerUnit: 10,
  },
  {
    fromNationId: 'UK',
    toNationId: 'USA',
    resource: 'uranium',
    amountPerTurn: 5,
  }
];

const agreement = economicSystem.trade.proposeTradeAgreement(
  ['USA', 'UK'],
  'bilateral',
  exchanges,
  20 // duration: 20 turns
);

economicSystem.trade.acceptTradeAgreement(agreement.id);
```

### Example 2: Build and Operate a Refinery

```typescript
// Build oil refinery
const refinery = economicSystem.refinement.buildRefinery(
  'USA',
  'north_america',
  'oil_refinery'
);

// Process refinement each turn
const nationStockpiles = new Map([
  ['USA', { oil: 100, uranium: 20, rare_earths: 30, food: 50 }]
]);

economicSystem.refinement.processAllRefineries(nationStockpiles);

// Get active bonuses
const bonuses = economicSystem.refinement.getActiveRefinementBonuses('USA');
// bonuses will include: { bonusType: 'military_effectiveness', amount: 15 }
```

### Example 3: Build Infrastructure

```typescript
// Build trade port
const port = economicSystem.infrastructure.buildInfrastructure(
  'USA',
  'north_america',
  'trade_port'
);

// Upgrade to level 2
economicSystem.infrastructure.upgradeInfrastructure(port.id);

// Create economic zone
const zone = economicSystem.infrastructure.createEconomicZone(
  'USA',
  'Atlantic Economic Zone',
  ['north_america', 'europe']
);

economicSystem.infrastructure.activateEconomicZone(zone.id);
```

### Example 4: Impose Economic Sanctions

```typescript
// USA imposes full embargo on adversary
const sanction = economicSystem.trade.imposeSanction(
  'ADVERSARY',
  'full_embargo',
  ['oil', 'uranium', 'rare_earths', 'food'],
  10 // duration: 10 turns
);

// Other nations join the sanctions
economicSystem.trade.joinSanction(sanction.id, 'UK');
economicSystem.trade.joinSanction(sanction.id, 'FRANCE');
```

---

## 📊 Economic Power & Victory

### Economic Power Calculation

Economic power is calculated from three components:

1. **Trade Score** (40%)
   - Active trade routes × 10
   - Trade partners × 20
   - Trade balance × 0.1

2. **Refinement Score** (30%)
   - Active refineries × 10
   - Refined resource stockpile × 0.1
   - Average efficiency × 20

3. **Infrastructure Score** (30%)
   - Operational buildings × 10
   - Infrastructure value × 0.01
   - Active economic zones × 50
   - Maintenance efficiency penalty

### Economic Victory Conditions

To achieve Economic Victory, a nation must reach 100% progress across:

- **Trade Routes:** 15 active routes (25% of victory)
- **Trade Volume:** 500 resources/turn (20% of victory)
- **Refineries:** 10 operational refineries (20% of victory)
- **Infrastructure:** 20 operational buildings (20% of victory)
- **Gold Reserves:** 5,000 gold accumulated (15% of victory)

Track progress via:
```typescript
const power = economicSystem.calculateEconomicPower();
const nationalPower = power.get('USA');
console.log(`Economic Victory Progress: ${nationalPower.economicVictoryProgress}%`);
```

---

## 🤖 AI Recommendations

The system provides AI-powered recommendations:

```typescript
const recommendations = economicSystem.getEconomicRecommendations('USA');

// Example recommendations:
// - "Establish more trade routes to boost economic growth"
// - "Trade deficit detected - consider exporting more resources"
// - "Build refineries to convert raw resources into valuable materials"
// - "Upgrade refineries to improve efficiency and output"
// - "Invest in economic infrastructure to boost production and trade"
```

---

## 🔧 Configuration & Balancing

### Trade System Balance

```typescript
// Trade route vulnerability
const BASE_VULNERABILITY = 20; // 20% base disruption chance
const NAVAL_PROTECTION_REDUCTION = 5; // -5% per naval unit
const AIR_COVER_REDUCTION = 3; // -3% per air unit

// Trade efficiency bonuses
const TRADE_HUB_BONUS = 0.05; // +5% per hub level
const TRADE_AGREEMENT_BONUS = 0.1; // +10% for active agreement
```

### Refinement Balance

```typescript
// Efficiency progression
const STARTING_EFFICIENCY = 0.5; // 50%
const EFFICIENCY_GAIN_PER_TURN = 0.02; // +2% per turn
const MAX_EFFICIENCY = 1.0; // 100%

// Refinery costs
const OIL_REFINERY_COST = 100; // production
const URANIUM_ENRICHMENT_COST = 200; // production
const RARE_EARTH_PROCESSING_COST = 150; // production
```

### Infrastructure Balance

See `INFRASTRUCTURE_COSTS` in `src/types/economicDepth.ts` for full cost tables.

---

## 🎨 UI Components

### 1. EnhancedTradePanel
- **Location:** `src/components/EnhancedTradePanel.tsx`
- **Features:** Trade routes, agreements, proposals, sanctions
- **Tabs:** Routes, Agreements, Proposals, Sanctions
- **Props:** Nations, trade data, callback functions

### 2. ResourceRefinementPanel
- **Location:** `src/components/ResourceRefinementPanel.tsx`
- **Features:** Refineries list, refined stockpiles, active bonuses
- **Actions:** Build, upgrade, pause/resume refineries
- **Props:** Nation, refineries, stockpile, callbacks

### 3. EconomicInfrastructurePanel
- **Location:** `src/components/EconomicInfrastructurePanel.tsx`
- **Features:** Buildings list, economic zones, construction progress
- **Tabs:** Buildings, Economic Zones
- **Props:** Nation, infrastructure, zones, callbacks

### 4. EconomicDashboard (Master UI)
- **Location:** `src/components/EconomicDashboard.tsx`
- **Features:** Unified dashboard with all three systems
- **Tabs:** Overview, Trade, Refinement, Infrastructure
- **Props:** All economic state + all callbacks

**Usage:**
```tsx
<EconomicDashboard
  currentNation={currentNation}
  allNations={allNations}
  economicState={economicSystem.state}
  economicPower={economicSystem.calculateEconomicPower().get(currentNation.id)!}
  recommendations={economicSystem.getEconomicRecommendations(currentNation.id)}
  onClose={() => setShowEconomicDashboard(false)}
  // ... callbacks ...
/>
```

---

## ✅ Testing Checklist

- [ ] Trade agreements can be proposed and accepted
- [ ] Trade routes transfer resources each turn
- [ ] Trade routes can be disrupted by combat/sanctions
- [ ] Economic sanctions reduce trade effectiveness
- [ ] Refineries convert resources correctly
- [ ] Refined resources provide stated bonuses
- [ ] Refinery efficiency improves over time
- [ ] Infrastructure buildings construct over multiple turns
- [ ] Infrastructure provides stated effects
- [ ] Economic zones activate when requirements met
- [ ] Economic power calculates correctly
- [ ] Economic victory progress tracks accurately
- [ ] AI recommendations are relevant and helpful
- [ ] All UI components render without errors
- [ ] Turn processing integrates smoothly

---

## 🚀 Future Enhancements

### Phase 3.1: Economic Events
- Market crashes affecting resource prices
- Resource cartels (OPEC-style)
- Trade wars between nations
- Economic booms and recessions

### Phase 3.2: Advanced Trade
- Trade route piracy and protection
- Smuggling operations
- Black market trading
- Trade route insurance

### Phase 3.3: Advanced Infrastructure
- Infrastructure networks (roads, rails)
- Resource pipelines
- Trade ports with ship docking
- Automated trade AI

---

## 📚 Related Documentation

- **Hearts of Iron Audit:** `HEARTS_OF_IRON_AUDIT.md`
- **Phase 1 Implementation:** Production Queue, Political Power, National Focus
- **Phase 2 Implementation:** Military Templates, Supply System, War Support
- **Phase 4 Specification:** Intelligence Agency, Resistance, Peace Conferences

---

## 🤝 Contributing

When extending Phase 3 systems:

1. **Add new refinery types** to `REFINERY_RECIPES` in `economicDepth.ts`
2. **Add new infrastructure types** to `INFRASTRUCTURE_COSTS`
3. **Update UI components** to display new features
4. **Test integration** with game loop thoroughly
5. **Balance costs and benefits** carefully

---

## 📝 Version History

- **v1.0.0** (2025-11-06) - Initial Phase 3 implementation complete
  - Enhanced Trade System
  - Resource Refinement
  - Infrastructure Development
  - Economic Power & Victory calculations
  - Complete UI dashboard

---

**Implementation Status:** ✅ COMPLETE
**Next Phase:** Phase 4 (Advanced Features)
**Estimated Integration Time:** 2-3 hours
