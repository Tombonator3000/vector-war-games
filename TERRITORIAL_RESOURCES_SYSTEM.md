# Territorial Resources System

## Overview

The Territorial Resources System adds strategic depth to the game by tying resource production to territorial control. Nations must control specific territories to access strategic resources, creating meaningful motivations for territorial conquest and diplomatic resource trading.

## Strategic Resources

### Four New Resource Types

1. **Oil 🛢️**
   - Required for: Training and maintaining conventional armies
   - Consumption: 0.5 oil per army per turn
   - Key producers: Middle East, Russia, Arctic, North America
   - Effect of shortage: Up to 50% combat penalty, -10 morale

2. **Uranium ☢️** (now territorial)
   - Required for: Nuclear weapons and nuclear-powered units
   - Previously generic, now tied to territorial control
   - Key producers: Australia, Kazakhstan, Middle East, Africa
   - Effect of shortage: Up to 30% production penalty

3. **Rare Earths 💎**
   - Required for: Advanced technology research and cyber warfare
   - Key technologies: Advanced AI, Cyber Superweapon, Expeditionary Air Wings
   - Key producers: China, Russia, Africa
   - Effect of shortage: Up to 20% production penalty

4. **Food 🌾**
   - Required for: Population growth and stability
   - Consumption: 1 food per 10 population per turn
   - Key producers: North America, South America, China
   - Effect of shortage: Halted population growth, up to -20 morale
   - **Special**: Can be destroyed by bio-warfare attacks

## Territory Resource Mapping

Each territory now has resource deposits that generate specific resources:

### Example Territory Configurations

- **Middle East**: Rich in Oil (20/turn) and moderate Uranium (5/turn)
- **North America**: High Food production (25/turn) and moderate Oil (10/turn)
- **Indo-Pacific**: Rich in Uranium (15/turn) and Rare Earths (10/turn)
- **Equatorial Belt**: Balanced Rare Earths (12/turn) and Uranium (8/turn)
- **Arctic**: Strategic Oil (10/turn) and Uranium (6/turn)

### Resource Richness System

Each deposit has a richness multiplier (0.5 - 2.0) that affects base generation:
- **Poor deposits**: 0.5x - 0.8x multiplier
- **Standard deposits**: 1.0x - 1.3x multiplier
- **Rich deposits**: 1.5x - 2.0x multiplier

## Integration Points

### 1. Conventional Warfare (Oil-Driven)

**Unit Training Costs Updated**:
- Armored Corps: 12 production + **5 oil**
- Carrier Strike Group: 16 production + 2 uranium + **6 oil**
- Expeditionary Air Wing: 14 production + 4 intel + **4 oil + 2 rare earths**

**Army Maintenance**:
- Each deployed army consumes 0.5 oil per turn
- Oil shortages reduce combat effectiveness by up to 50%

### 2. Technology Research (Rare Earths)

**Advanced Technologies Now Require Rare Earths**:
- Advanced Offensive Algorithms: +8 rare earths
- AI-Driven Cyber Defenses: +10 rare earths
- Cyber Superweapon: +15 rare earths
- Expeditionary Air Wing units: 2 rare earths per unit

### 3. Nuclear Program (Territorial Uranium)

- Uranium generation now tied to controlled territories
- Nations without uranium-rich territories must trade for it
- Creates strategic value for territories like Kazakhstan, Australia, and Middle East

### 4. Bio-Warfare Integration

**Food Production Destruction**:
- Each active bio-attack reduces food production by 10% per turn
- Multiple bio-attacks can devastate a nation's food supply
- Affects all controlled territories of the victim nation
- Creates cascading effects: food shortage → population decline → morale loss

### 5. Resource Trade System

**Creating Trades**:
```typescript
const trade = createResourceTrade(
  fromNationId,     // Exporter
  toNationId,       // Importer
  'oil',           // Resource type
  10,              // Amount per turn
  20,              // Duration in turns
  currentTurn,
  50               // Optional: Payment per turn (production)
);
```

**Trade Disruption**:
- Trades automatically cancel if relationship drops below -50
- Trades break if either nation is eliminated
- Creates diplomatic incentive to maintain good relations

## Resource Shortage Effects

### Oil Shortage
- **Severity 0-100%**: Based on shortfall
- **Effects**:
  - Combat effectiveness reduced by up to 50%
  - Morale penalty up to -10
  - Army maintenance becomes difficult

### Uranium Shortage
- **Effects**:
  - Production penalty up to 30%
  - Cannot build new nuclear weapons
  - Strategic deterrence weakened

### Rare Earths Shortage
- **Effects**:
  - Production penalty up to 20%
  - Cannot research advanced technologies
  - Cyber warfare capabilities limited

### Food Shortage
- **Effects**:
  - Population growth halted completely
  - Morale penalty up to -20
  - Civil unrest increases
  - Can lead to mass starvation events

## Resource Caps

To prevent unlimited stockpiling:
- Oil: 500 maximum
- Uranium: 300 maximum
- Rare Earths: 400 maximum
- Food: 600 maximum

## Production Phase Integration

Every turn, the following happens:

1. **Initialize**: Set up territorial resources if first time
2. **Process Trades**: Execute all active resource trades
3. **Generate Resources**: Calculate generation from controlled territories
4. **Apply Modifiers**: Morale, technology, bio-warfare damage
5. **Consume Resources**: Deduct military, technology, and population costs
6. **Check Shortages**: Calculate and apply shortage penalties
7. **Update UI**: Display current stockpiles and generation rates

## Strategic Implications

### Territorial Control Motivation
- Territories are no longer just about production bonuses
- Resource-rich territories become high-value targets
- Proxy wars may emerge over contested resource zones

### Diplomatic Complexity
- Resource trading creates mutual dependencies
- Nations may form alliances to secure resource access
- Trade disruption becomes a diplomatic weapon

### Military Planning
- Oil scarcity limits offensive capabilities
- Must plan conventional campaigns around oil reserves
- Bio-warfare becomes a strategic resource denial weapon

### Technology Race
- Rare earth control enables technological superiority
- Nations without rare earths fall behind technologically
- Creates incentive to control China, Russia, or Africa

### Population Management
- Food security becomes critical for large populations
- Bio-warfare threatens food supplies
- Agricultural territories gain strategic value

## Files Modified/Created

### New Files
1. `src/types/territorialResources.ts` - Type definitions
2. `src/lib/territorialResourcesSystem.ts` - Core logic
3. `src/components/ResourceStockpileDisplay.tsx` - UI component
4. `TERRITORIAL_RESOURCES_SYSTEM.md` - This documentation

### Modified Files
1. `src/types/game.ts` - Added resource fields to Nation and GameState
2. `src/hooks/useConventionalWarfare.ts` - Added oil/rare earth requirements
3. `src/lib/researchData.ts` - Added rare earth costs to tech
4. `src/lib/gamePhaseHandlers.ts` - Integrated resource generation
5. `src/lib/simplifiedBioWarfareLogic.ts` - Added food production damage

## Future Enhancements

Potential additions to the system:

1. **Resource Market Fluctuations**: Dynamic pricing for resources
2. **Resource Depletion**: Deposits can be exhausted over time
3. **Alternative Sources**: Synthetic resources via advanced tech
4. **Strategic Reserves**: Emergency stockpiles for crises
5. **Resource Sanctions**: Block enemy access to specific resources
6. **Resource Victory Condition**: Control X% of global resources

## Usage Example

```typescript
// In production phase
const result = processNationResources(
  nation,
  territories,
  territoryResources,
  activeTrades,
  currentTurn
);

// Check for shortages
if (result.shortages.length > 0) {
  result.shortages.forEach(shortage => {
    console.log(`${shortage.resource} shortage: ${shortage.severity * 100}%`);
    // Apply effects automatically
  });
}

// Display to player
<ResourceStockpileDisplay nation={playerNation} />
```

## Testing

The system has been built and validated:
- ✅ TypeScript compilation successful
- ✅ No build errors
- ✅ Type safety maintained
- ✅ Integration with existing systems verified

## Conclusion

The Territorial Resources System transforms the game from generic production-based to territory-specific resource economy. It creates strategic depth through:

- **Territorial warfare motivation** (control resources)
- **Diplomatic complexity** (trade dependencies)
- **Military constraints** (oil for armies)
- **Technology gates** (rare earths for advancement)
- **Bio-warfare impact** (food destruction)

This system integrates seamlessly with existing mechanics while adding a compelling new strategic layer.
