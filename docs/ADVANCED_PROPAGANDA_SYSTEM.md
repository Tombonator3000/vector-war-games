# Advanced Propaganda System

A comprehensive propaganda warfare system for Vector War Games featuring psychological operations, infiltration networks, and ideological weaponization.

## Overview

The Advanced Propaganda System extends the existing cultural warfare mechanics with three sophisticated subsystems:

1. **Useful Idiots** - Recruit influential individuals to unwittingly spread your propaganda
2. **Phobia Campaigns** - Weaponize fear to destabilize enemy populations
3. **Religious Weapons** - Deploy ideological narratives to unite your people and divide theirs

## System Components

### 1. Useful Idiots System

Recruit influential individuals from target nations who unwittingly become propaganda assets.

#### Idiot Types

| Type | Credibility | Influence | Cost | Description |
|------|------------|-----------|------|-------------|
| **Academic** | 85 | 60 | 70 | University professors, intellectuals |
| **Journalist** | 70 | 80 | 60 | Media personalities, reporters |
| **Politician** | 50 | 90 | 80 | Local politicians, activists |
| **Celebrity** | 40 | 95 | 75 | Entertainers, influencers |
| **Business Leader** | 75 | 70 | 85 | CEOs, industry leaders |
| **Religious Leader** | 80 | 85 | 90 | Clergy, spiritual guides |
| **Influencer** | 35 | 85 | 50 | Social media personalities |

#### Mechanics

**Recruitment Process:**
- Base cost: 50 intel (modified by type)
- Takes 2-4 turns to complete
- Success chance: 20-90% (based on relationships, cultural influence, intel strength)
- Discovery risk: 10% per turn during recruitment

**Active Operations:**
- Generate propaganda value each turn based on: `(influence × credibility × alignment) / 10000`
- Maintenance cost: `influence × 0.1` intel per turn
- Effects on target nation:
  - Increases instability by propaganda value × 0.1
  - Reduces morale by propaganda value × 0.05
  - Increases cultural influence by propaganda value × 0.2
  - Reduces pop loyalty by 1 per turn (random pops)

**Exposure Risk:**
- Base risk: 5% per turn
- Increases by 0.5% each turn
- Suspicion level increases by risk/10 each turn
- When exposed: -30 relationship penalty with target nation

**Actions:**
- **Amplify**: +15 influence, +10 exposure risk, costs 3× maintenance
- **Protect**: -15 exposure risk, -20 suspicion, costs 2× maintenance
- **Burn**: Deliberately expose for maximum impact (causes major instability)
- **Extract**: Remove from operation safely (costs 1.5× maintenance)

#### AI Strategy
- **Infiltration Network**: Build diverse networks of 2-3 idiots per target
- **Aggressive Subversion**: Focus on politicians and journalists for destabilization
- **Ideological Warfare**: Recruit religious leaders and academics for conversion

### 2. Phobia Campaign System

Deploy fear-based propaganda to paralyze and destabilize enemy nations.

#### Phobia Types

| Type | Primary Effect | Secondary Effect |
|------|---------------|------------------|
| **Xenophobia** | -1.5 stability | -2.0 diplomacy |
| **Technophobia** | -1.0 production | -1.5 research |
| **Economic Anxiety** | -1.5 production | -1.0 stability |
| **Existential Dread** | -2.0 morale | -1.0 stability |
| **Enemy Fear** | -1.0 morale | +1.5 militancy |
| **Cultural Erasure** | -1.0 stability | +2.0 cultural defense |
| **Surveillance Fear** | -1.0 intel | -0.5 stability |
| **Apocalypse Fear** | -2.5 morale | -1.0 production |

#### Intensity Levels

| Intensity | Intel Cost | Detection Risk | Spread Rate |
|-----------|------------|----------------|-------------|
| **Subtle** | 20/turn | 5% | 3/turn |
| **Moderate** | 40/turn | 15% | 7/turn |
| **Aggressive** | 70/turn | 35% | 15/turn |
| **Panic** | 120/turn | 60% | 30/turn |

#### Mechanics

**Campaign Effects:**
- Fear level: 0-100 (increases by spread rate each turn)
- Paranoia: 0-100 (increases by spread rate × 0.5)
- Duration: 5-10 turns (randomly determined)

**Consequences:**
- Radicalization chance: `fear_level / 10` per turn
- Violent incidents: `paranoia / 10` chance if radicalized
- Each violent incident: +5 instability

**Discovery:**
- When discovered: -25 relationship penalty
- Campaign narrative generated for player

#### AI Strategy
- **Psychological Ops**: Launch multiple fear campaigns simultaneously
- **Aggressive Subversion**: Use aggressive intensity on vulnerable targets
- **Opportunistic**: Use subtle campaigns to avoid detection

### 3. Religious Weapons System

Deploy ideological narratives as weapons to boost your nation and destabilize enemies.

#### Weapon Types

| Type | Fervor Bonus | Ideology Compatibility |
|------|-------------|------------------------|
| **Holy War** | +15 morale, +20 combat | Theocracy, Authoritarianism |
| **Heresy Accusation** | -20 target stability | Theocracy |
| **Prophetic Narrative** | +20 morale, +10 production | Theocracy, Authoritarianism |
| **Martyrdom Cult** | +30 combat, -10 morale | Theocracy, Communism |
| **Sacred Mission** | +15 morale, +15 production | All except Technocracy |
| **Apocalyptic Theology** | +25 morale, 40% extremism risk | Theocracy |
| **Ideological Purity** | +20 stability, 30% extremism risk | Communism, Authoritarianism, Theocracy |
| **Enemy Demonization** | +15 combat, -25 diplomacy | Authoritarianism, Theocracy, Communism |

#### Mechanics

**Deployment:**
- Base cost: 50-110 intel (varies by type)
- Maintenance: 20% of base cost per turn
- Can target multiple nations simultaneously

**Effects on Source Nation:**
- Population morale bonus (applied each turn)
- Unit combat effectiveness bonus
- Production bonus (for some types)
- Stability bonus (for some types)

**Effects on Target Nations:**
- Destabilization effect (applied each turn)
- Ideological conversion chance
- Resistance movement spawning
- Pop loyalty and happiness reduction

**Risks:**
- Backlash risk: Chance per turn to create extremism
- When extremism > 50: Risk of internal violence
- When extremism > 70: Violent extremism events
- Backfire: +15 instability to source nation

#### AI Strategy
- **Ideological Warfare**: Theocracies deploy extensively
- **Aggressive Subversion**: Use enemy demonization against rivals

## Integration with Existing Systems

### Cultural Warfare
- Useful idiots amplify cultural influence
- Phobia campaigns reduce cultural defense
- Religious weapons enhance ideological export

### Ideology System
- Religious weapons require compatible ideology
- Ideological alignment affects useful idiot effectiveness
- Phobia campaigns exploit ideological divisions

### Population System
- All systems affect pop loyalty and happiness
- Useful idiots can target specific pop groups
- Radicalization creates extremist pops

### Diplomacy
- Discovery damages relationships significantly
- Religious weapons affect diplomatic standing
- Phobia campaigns reduce diplomatic influence

## AI Strategies

The AI uses five distinct strategies:

### 1. Aggressive Subversion
- **Goal**: Total destabilization of enemies
- **Methods**: All three systems simultaneously
- **Targets**: Nations with relationship < -20
- **Intel Threshold**: 200+

### 2. Ideological Warfare
- **Goal**: Spread ideology and convert populations
- **Methods**: Religious weapons + useful idiots (religious leaders/academics)
- **Targets**: Nations with different ideologies
- **Intel Threshold**: 250+
- **Personality**: Theocracy required

### 3. Psychological Operations
- **Goal**: Spread fear to weaken multiple enemies
- **Methods**: Mass phobia campaigns + journalists
- **Targets**: 3+ nations simultaneously
- **Intel Threshold**: 100+
- **Personality**: Aggressive, Paranoid

### 4. Infiltration Network
- **Goal**: Build comprehensive intelligence networks
- **Methods**: Diverse useful idiot recruitment
- **Targets**: High-value nations (high population/production)
- **Intel Threshold**: 500+
- **Structure**: 2-3 idiots per target of different types

### 5. Opportunistic
- **Goal**: Exploit vulnerabilities as they arise
- **Methods**: Mixed tactics based on opportunity
- **Targets**: Vulnerable nations (high instability, low morale)
- **Intel Threshold**: 100+

### 6. Defensive
- **Goal**: No active propaganda
- **Methods**: Focus on counter-propaganda
- **Personality**: Defensive, Isolationist

## Player UI

### Advanced Propaganda Panel

Three tabbed interface:

**1. Useful Idiots Tab**
- Active idiots display with stats
- Ongoing recruitment operations
- Recruitment interface (select target, type)
- Action buttons (Amplify, Protect, Burn, Extract)

**2. Phobia Campaigns Tab**
- Active campaigns with metrics
- Launch new campaign interface
- Select intensity and phobia type
- Real-time fear level tracking

**3. Religious Weapons Tab**
- Active weapons with bonuses/effects
- Deployment interface
- Ideology compatibility checking
- Extremism risk warnings

**Statistics Dashboard:**
- Active idiots count
- Phobia campaigns count
- Religious weapons count
- Available intel

## Usage Examples

### Example 1: Destabilizing a Rival

```typescript
// 1. Launch phobia campaign
launchPhobiaCampaign(gameState, 'USA', 'China', 'economic_anxiety', 'aggressive');

// 2. Recruit useful idiot
initiateRecruitment(gameState, 'USA', 'China', 'politician');

// 3. Deploy religious weapon (if compatible)
deployReligiousWeapon(gameState, 'USA', ['China'], 'enemy_demonization');
```

### Example 2: Ideological Conversion

```typescript
// Theocracy converting democracy
deployReligiousWeapon(gameState, 'Iran', ['France'], 'prophetic_narrative');
initiateRecruitment(gameState, 'Iran', 'France', 'religious_leader');
initiateRecruitment(gameState, 'Iran', 'France', 'academic');
```

### Example 3: Psychological Warfare

```typescript
// Spread fear across multiple targets
for (const enemy of enemies) {
  launchPhobiaCampaign(gameState, myNation, enemy.id, 'apocalypse_fear', 'moderate');
}
```

## Configuration

### Useful Idiot Config
```typescript
USEFUL_IDIOT_CONFIG = {
  RECRUITMENT_BASE_COST: 50,
  MAINTENANCE_COST_MULTIPLIER: 0.1,
  BASE_EXPOSURE_RISK: 5,
  INFLUENCE_DECAY_RATE: 2,
}
```

### Phobia Campaign Config
```typescript
PHOBIA_CAMPAIGN_CONFIG = {
  INTENSITY_COSTS: { subtle: 20, moderate: 40, aggressive: 70, panic: 120 },
  DETECTION_RISKS: { subtle: 5, moderate: 15, aggressive: 35, panic: 60 },
  SPREAD_RATES: { subtle: 3, moderate: 7, aggressive: 15, panic: 30 },
}
```

### Religious Weapon Config
```typescript
RELIGIOUS_WEAPON_CONFIG = {
  BASE_COSTS: { holy_war: 100, ... },
  FERVOR_BONUSES: { holy_war: { morale: 15, combat: 20 }, ... },
  IDEOLOGY_COMPATIBILITY: { holy_war: ['theocracy', 'authoritarianism'], ... },
}
```

## Files

### Type Definitions
- `src/types/advancedPropaganda.ts` - All type definitions, configs, and interfaces

### Core Logic
- `src/lib/advancedPropagandaManager.ts` - Main processing logic
- `src/lib/aiAdvancedPropagandaStrategies.ts` - AI decision making

### Integration
- `src/lib/immigrationCultureTurnProcessor.ts` - Turn processing integration
- `src/lib/aiCulturalStrategies.ts` - AI cultural strategy integration
- `src/types/game.ts` - GameState integration

### UI
- `src/components/AdvancedPropagandaPanel.tsx` - Player interface

## Implementation Status

✅ **Complete:**
- Type definitions with full configuration
- Useful idiots recruitment and management
- Phobia campaign mechanics
- Religious weapons system
- Turn-by-turn processing
- AI strategies and decision making
- Integration with existing systems
- Player UI component

🔄 **Needs Integration:**
- UI component needs to be added to main game interface
- AI strategy calls need to be connected to AI turn execution
- Testing with real game scenarios

## Future Enhancements

### Phase 2 Potential Features
1. **Counter-Propaganda**
   - Detect and neutralize enemy operations
   - Public exposure campaigns
   - Counter-useful idiots

2. **Advanced Targeting**
   - Target specific pop groups with phobia campaigns
   - Demographic-specific useful idiots
   - Regional religious movements

3. **Synergy Bonuses**
   - Integrated operations with cross-system bonuses
   - Objective-based campaigns
   - Victory conditions

4. **Historical Events**
   - Generated narratives for propaganda operations
   - Public opinion tracking
   - Media coverage simulation

5. **Espionage Integration**
   - Spy missions to recruit idiots
   - Intelligence gathering on enemy propaganda
   - Covert operation coordination

## Balance Considerations

### Intel Costs
- Useful idiots: 50-90 intel to recruit, 3-10 per turn to maintain
- Phobia campaigns: 20-120 intel per turn based on intensity
- Religious weapons: 50-110 intel initial, 10-22 per turn maintenance

### Risk vs Reward
- Higher intensity = More effective but higher detection risk
- Multiple operations = Multiplied effects but exponential costs
- Extremism = Powerful bonuses but dangerous backlash

### Counter-Play
- High cultural defense reduces effectiveness
- Strong relationships reduce recruitment success
- Secularization reduces religious weapon impact
- Detection ends campaigns and damages relationships

## Credits

Designed for Vector War Games as part of the cultural warfare and psychological operations systems.
