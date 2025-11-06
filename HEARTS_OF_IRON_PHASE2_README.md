# Hearts of Iron Phase 2: Military Management

## Overview

Phase 2 of the Hearts of Iron integration adds advanced military management systems inspired by HoI4. This phase builds upon Phase 1's core systems (Production, Political Power, and National Focuses) to provide deeper military gameplay.

## Systems Implemented

### 1. Military Templates (Division Designer)

A customizable unit designer allowing players to create custom military divisions from individual components.

#### Features
- **Unit Components**: 11 different unit types (infantry, armor, artillery, etc.)
- **Main Components**: Up to 10 combat battalions per template
- **Support Components**: Up to 5 support companies per template
- **Combat Width System**: Optimal width of 25 for best performance
- **Calculated Stats**: Automatic stat calculation from components
- **Default Templates**: 4 pre-made templates for quick use

#### Components Available

**Main Components (Combat Units):**
- Infantry Battalion: Standard troops, good defense
- Mechanized Battalion: Mobile armored infantry
- Armor Battalion: Heavy tanks, high breakthrough
- Artillery Battalion: Long-range fire support
- Anti-Air Battalion: Air defense
- Anti-Tank Battalion: Armor penetration

**Support Components:**
- Reconnaissance Company: Intelligence and scouting
- Engineer Company: Mobility and terrain bonuses
- Signal Company: Coordination and command
- Logistics Company: Reduces supply consumption
- Military Police Company: Occupation and suppression

#### Template Stats
Each template calculates:
- **Combat Stats**: Soft Attack, Hard Attack, Air Attack, Defense, Breakthrough, Armor, Piercing
- **Support Stats**: Organization, Recovery, Reconnaissance, Suppression
- **Logistics**: Supply Use, Speed, Reliability, Combat Width
- **Costs**: Manpower, Production, Steel, Electronics

#### Deployed Units
- Units based on templates with individual status tracking
- Health (0-100%)
- Organization (0-100%) - combat readiness
- Experience (0-100%) - improves performance
- Supply Level (0-100%) - affects effectiveness
- Veterancy: Green → Regular → Veteran → Elite

### 2. Supply System

Logistics and supply management system ensuring units are properly supplied for combat effectiveness.

#### Features
- **Supply Sources**: Capital, Depots, Ports, Airbases
- **Supply Distribution**: Automatic supply flow from sources to territories
- **Infrastructure**: 10 levels affecting supply capacity and flow
- **Supply Range**: Distance limits for supply distribution
- **Attrition**: Units without supply suffer damage and organization loss

#### Supply Sources

**Types:**
- **Capital**: 1000 capacity, 10 range (automatic)
- **Depot**: 500 capacity, 5 range (buildable)
- **Port**: 400 capacity, 8 range (buildable)
- **Airbase**: 300 capacity, 15 range (buildable)

**Supply Mechanics:**
- Supply flows from sources to nearby territories
- Distance reduces supply efficiency
- Infrastructure improves supply flow
- Damaged sources operate at reduced capacity

#### Territory Supply Status
- **Oversupplied**: 120%+ of demand met
- **Adequate**: 80-120% of demand met
- **Low**: 50-80% of demand met
- **Critical**: 1-50% of demand met
- **None**: 0% - severe attrition

#### Attrition Effects
Units in undersupplied territories suffer:
- Health damage per turn (up to 10%)
- Organization loss per turn (up to 20%)
- Combat effectiveness penalties
- Morale damage

### 3. War Support & Stability

Public opinion and national stability mechanics that affect military and economic capabilities.

#### War Support (0-100%)

**Levels:**
- **Fanatic** (80-100%): Maximum military effectiveness
- **Eager** (60-79%): Strong military support
- **Willing** (40-59%): Moderate support
- **Reluctant** (20-39%): Limited support
- **Pacifist** (0-19%): Minimal military capability

**Effects on Gameplay:**
- Recruitment Speed: 0.5x to 1.5x
- Division Recovery: 0.5x to 1.5x
- Surrender Limit: 20% to 80% losses
- War Goal Cost: 0.5x to 2.0x PP
- Command Power Gain: 0.5x to 1.5x
- Conscription Laws: Limited by war support level

#### Stability (0-100%)

**Levels:**
- **Unshakeable** (80-100%): Peak efficiency
- **Very Stable** (60-79%): High efficiency
- **Stable** (40-59%): Normal efficiency
- **Unstable** (20-39%): Reduced efficiency
- **Crisis** (0-19%): Severe penalties, risk of collapse

**Effects on Gameplay:**
- Production Efficiency: 0.5x to 1.3x
- Factory Output: 0.5x to 1.2x
- Construction Speed: 0.5x to 1.2x
- Political Power Gain: 0.5x to 1.5x
- Focus Completion Speed: 0.7x to 1.3x
- Decision Costs: 0.5x to 2.0x PP
- Risk of Coup: If stability < 20%
- Risk of Civil War: If stability < 10%

#### War Support Actions

Players can execute actions to influence war support and stability:

**Propaganda Actions:**
- War Propaganda (50 PP): +15 war support, -5 stability, 5 turns
- Victory Celebration (30 PP): +10 war support, +5 stability, 3 turns
- Nationalist Rhetoric (40 PP): +20 war support, -10 stability, 5 turns
- Peace Movement Support (40 PP): -15 war support, +10 stability, 5 turns

**Economic Actions:**
- Economic Stimulus (75 PP + 200 Prod): +15 stability, 10 turns
- War Bonds Program (50 PP): +10 war support, +5 stability, 10 turns

**Policy Actions:**
- Rationing Program (60 PP): -10 war support, -5 stability, permanent
- Welfare Expansion (80 PP + 150 Prod): -5 war support, +20 stability, permanent
- Emergency Powers (100 PP): -20 stability, 5 turns (crisis management)
- National Reconciliation (120 PP): -10 war support, +30 stability, 10 turns

**Military Actions:**
- Military Parade (40 PP): +8 war support, +3 stability, 2 turns
- Veterans' Support Program (60 PP + 100 Prod): +12 war support, +8 stability, permanent
- Expand Draft (70 PP): -15 war support, -10 stability, permanent
- Partial Demobilization (50 PP): -10 war support, +15 stability, 10 turns

#### Event-Based Changes

War support and stability automatically respond to events:
- **War Declared**: -5 war support, -5 stability
- **Victory**: +20 war support, +10 stability
- **Defeat**: -30 war support, -20 stability
- **Territory Captured**: +5 war support, +2 stability
- **Territory Lost**: -10 war support, -5 stability
- **Nuclear Strike Launched**: -15 war support, -10 stability
- **Nuclear Strike Received**: -25 war support, -30 stability

#### National Crises

When stability drops too low, crises can occur:
- **Coup Attempt**: Stability < 20%
- **Civil War**: Stability < 10%
- **Government Collapse**: Stability < 10%
- **Military Mutiny**: Stability < 15%

**Crisis Effects:**
- Leader may be overthrown
- Ideology may change
- Territory loss (percentage)
- Production penalties
- Alliance breaks

## File Structure

### Type Definitions
```
src/types/
├── militaryTemplates.ts    # Military template types
├── supplySystem.ts          # Supply and logistics types
└── warSupport.ts            # War support and stability types
```

### Hooks
```
src/hooks/
├── useMilitaryTemplates.ts  # Military template management
├── useSupplySystem.ts       # Supply system management
└── useWarSupport.ts         # War support management
```

### Data Files
```
src/data/
├── militaryTemplates.ts     # Unit components and default templates
└── warSupportActions.ts     # Available war support actions
```

### Components
```
src/components/
├── MilitaryTemplatesPanel.tsx   # Division designer UI
├── SupplySystemPanel.tsx        # Supply network visualization
└── WarSupportDashboard.tsx      # War support & stability dashboard
```

### Integration
```
src/lib/
└── heartsOfIronPhase2Integration.ts  # Game loop integration
```

## Usage

### Initializing Systems

```typescript
import { useMilitaryTemplates } from '@/hooks/useMilitaryTemplates';
import { useSupplySystem } from '@/hooks/useSupplySystem';
import { useWarSupport } from '@/hooks/useWarSupport';

// In your main game component
const militaryTemplates = useMilitaryTemplates({ currentTurn, nations });
const supplySystem = useSupplySystem({ currentTurn, nations });
const warSupport = useWarSupport({ currentTurn, nations });
```

### Turn Processing

```typescript
import { processHeartsOfIronPhase2 } from '@/lib/heartsOfIronPhase2Integration';

// In production phase
processHeartsOfIronPhase2(
  nations,
  currentTurn,
  militaryTemplates,
  supplySystem,
  warSupport,
  log
);
```

### Creating a Military Template

```typescript
const result = militaryTemplates.createTemplate(
  nationId,
  'Elite Strike Division',
  'Fast-moving armored force',
  'division',
  ['armor_battalion', 'armor_battalion', 'mechanized_battalion'],
  ['reconnaissance_company', 'logistics_company']
);
```

### Deploying a Unit

```typescript
const result = militaryTemplates.deployUnit(
  nationId,
  templateId,
  'Alpha Division',
  territoryId
);
```

### Executing War Support Action

```typescript
const result = warSupport.executeWarSupportAction(
  nationId,
  warSupportAction
);
```

### Handling War Events

```typescript
import { handleWarEvent } from '@/lib/heartsOfIronPhase2Integration';

// When territory is captured
handleWarEvent(nationId, 'territory_captured', warSupport, log);

// When war is won
handleWarEvent(nationId, 'war_won', warSupport, log);
```

## Integration with Existing Systems

### Production System Integration
- Supply sources can be queued in production
- Infrastructure upgrades use production capacity
- Military templates affect production costs

### Political Power Integration
- War support actions cost PP
- Low stability increases PP costs
- Crisis management requires PP expenditure

### Combat System Integration
- Unit stats from templates affect combat effectiveness
- Supply level modifies combat performance
- War support affects combat morale and recovery

### Territory System Integration
- Supply flows through controlled territories
- Infrastructure levels per territory
- Units stationed in territories consume supply

## Balance Considerations

### Military Templates
- Combat width penalty if > 25
- Speed limited by slowest component
- Supply consumption scales with unit complexity
- Elite units cost more but perform better

### Supply System
- Infrastructure upgrades are expensive but crucial
- Supply sources can be targeted/damaged
- Oversupplying is wasteful, undersupplying is fatal
- Distance matters - forward bases needed for expansion

### War Support & Stability
- Actions have cooldowns to prevent spam
- Some actions have conflicting effects (war support vs stability)
- Events create natural fluctuations
- Crisis management is expensive but necessary
- Recovery is slow, decline is fast

## Future Enhancements (Phase 3+)

### Planned Features
- **Trade System**: Import/export resources between nations
- **Resource Refinement**: Convert raw materials to advanced resources
- **Intelligence Operations**: Spy networks and sabotage
- **Naval & Air Templates**: Extend division designer to all unit types
- **Experience System**: Units gain bonuses from combat
- **Commander System**: Generals and field marshals with traits
- **Front Line Management**: Automated battle planning

### Potential Improvements
- **Visual Supply Lines**: Draw supply routes on map
- **Combat Predictions**: Calculate combat odds before engagement
- **Template Variants**: Save multiple configurations
- **Auto-Upgrade**: Automatically improve templates with new tech
- **Unit Attachments**: Assign units to fronts/armies
- **Battle History**: Track unit combat performance

## Testing

### Unit Tests
- Template creation validation
- Supply distribution calculations
- War support effect calculations
- Attrition damage calculations

### Integration Tests
- Turn processing with all systems
- Event handling cascades
- Resource consumption tracking
- Save/load compatibility

### Manual Testing Checklist
- [ ] Create custom military template
- [ ] Deploy units from template
- [ ] Observe supply distribution
- [ ] Test undersupply attrition
- [ ] Execute war support actions
- [ ] Trigger and resolve national crisis
- [ ] Verify production multipliers from stability
- [ ] Confirm recruitment effects from war support
- [ ] Test save/load with Phase 2 data

## Performance Considerations

### Optimization Strategies
- Lazy loading of UI panels
- Memoized stat calculations
- Efficient supply pathfinding
- Debounced updates for real-time displays

### Memory Management
- Unit cleanup when destroyed
- Template pruning when unused
- Modifier expiration tracking
- History log rotation

## Known Issues

None at implementation time. Please report issues to the development team.

## Credits

**Designed by**: Development Team
**Inspired by**: Hearts of Iron IV by Paradox Interactive
**Implementation Date**: November 6, 2025
**Phase**: 2 of 4

---

## Quick Reference

### Command Cheat Sheet
```typescript
// Military Templates
createTemplate(nationId, name, desc, size, main, support)
deployUnit(nationId, templateId, name, territoryId)
updateUnitStatus(nationId, unitId, updates)

// Supply System
createSupplySource(nationId, type, territoryId)
upgradeInfrastructure(nationId, territoryId, targetLevel)
getSupplyNetwork(nationId)

// War Support
addWarSupportModifier(nationId, name, desc, amount, duration, source)
addStabilityModifier(nationId, name, desc, amount, duration, source)
executeWarSupportAction(nationId, action)
handleWarEvent(nationId, eventType)
```

### Key Numbers
- **Max Combat Width**: 25
- **Max Main Components**: 10
- **Max Support Components**: 5
- **Supply Decay with Distance**: 50%
- **Max Infrastructure**: Level 10
- **Crisis Threshold**: Stability < 20%
- **Civil War Threshold**: Stability < 10%
- **Action Cooldown**: 5-30 turns
- **Modifier Duration**: 2-10 turns (or permanent)

---

**Version**: 1.0.0
**Last Updated**: November 6, 2025
**Status**: Implementation Complete
