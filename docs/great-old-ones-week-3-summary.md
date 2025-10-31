# Great Old Ones - Week 3 Implementation Summary

## Overview

Phase 1, Week 3 of the Great Old Ones campaign focuses on **Ritual Site Operations**, implementing the tactical and strategic layer that allows players to manage ritual sites, deploy hybrid unit rosters, and engage with procedurally generated missions.

## Implemented Features

### 1. Ritual Site Mechanics (`src/lib/ritualSiteMechanics.ts`)

#### Site Upgrade System
- **Four Tier Progression**: Shrine → Temple → Nexus → Gateway
- Each tier provides:
  - Increased power storage and generation
  - Higher-tier entity summoning capabilities
  - Enhanced defense bonuses
  - Unlocked special abilities

#### Biome-Based Bonuses
Six distinct biomes, each with unique strategic advantages:
- **Ocean**: Deep One summoning, excellent concealment (+50%), lower sanity harvesting
- **Mountain**: Maximum ritual power (+50%), stellar channeling, sky signs
- **Urban**: Maximum sanity harvesting (+80%), lower concealment
- **Ruins**: Ancient power resonance (+40%), artifact discovery, primordial connections
- **Desert**: Isolation for dangerous rituals (+60% concealment), buried temples
- **Forest**: Natural cover (+40%), druidic rituals, Shub-Niggurath affinity

#### Defensive Mechanics
- **Glamour Veil**: Reduces detection by up to 40% (requires Temple tier+)
- **Defensive Wards**: Reduces raid damage by up to 50% and ritual disruption by 60% (requires Nexus tier+)
- Biome concealment bonuses stack with defensive measures

#### Geostrategic Site Placement
Intelligent site placement system evaluating:
- Regional corruption levels
- Existing cultist presence
- Investigation heat risk
- Cultural compatibility with doctrine
- Biome availability

### 2. Hybrid Unit Roster (`src/lib/unitRoster.ts`)

#### Cultist Types
Three-tier progression system:

**Street-Level Initiates**
- Basic recruitment and reconnaissance
- Low ritual skill (1), moderate infiltration (2)
- 5 sanity fragments/turn harvesting
- Available for: recruiting, harvesting, defense

**Devoted Acolytes**
- Mid-tier rituals and combat support
- Moderate ritual skill (5), good infiltration (4)
- 15 sanity fragments/turn harvesting
- Training cost: 50 SF, 25 EP, 2 turns (requires Temple)

**High Priests**
- Elite ritual leaders, entity channeling
- High ritual skill (10), advanced infiltration (7)
- 30 sanity fragments/turn harvesting
- Training cost: 200 SF, 150 EP, 5 turns (requires Nexus)
- Special abilities: major rituals, psychic resistance, leadership

#### Infiltrator Units
Five specialized infiltrator types with doctrine affinities:

**Corporate Saboteur** (Corruption)
- Corrupts business empires, economic warfare
- Operations: stock manipulation, product corruption, monopoly creation
- Base recruitment: 100 SF, 50 EP

**Political Operative** (Corruption)
- Subverts governments, passes eldritch legislation
- Operations: suppress investigations, pass laws, install puppet governments
- Base recruitment: 150 SF, 75 EP

**Media Prophet** (Convergence)
- Spreads eldritch gospels through mass media
- Operations: memetic warfare, documentary propaganda, celebrity conversion
- Base recruitment: 80 SF, 60 EP

**Academic Agent** (Convergence)
- Infiltrates universities, teaches forbidden knowledge
- Operations: publish eldritch papers, curriculum changes, research grants
- Base recruitment: 120 SF, 80 EP

**Military Mole** (Domination)
- Corrupts military to defend Order operations
- Operations: false flags, weapons diversion, military protection
- Base recruitment: 180 SF, 100 EP

Each infiltrator has:
- Infiltration depth (0-100%)
- Influence level (0-100%)
- Progressive operation unlocks based on depth
- Risk of exposure

#### Summoned Entities
Hierarchical summoning system across 5 tiers:

**Tier 1 - Servitors**
- Weak but expendable (Power: 10)
- Minimal cost: 50 SF, 30 EP, 1 turn
- Low backlash risk (10% control difficulty)

**Tier 2 - Horrors**
- Combat-capable entities
  - Nightgaunts (mountain biome): Flying abductors, can capture investigators
  - Whispering Horrors: Invisible madness spreaders, low veil damage
- Cost: ~100-120 SF, ~75-90 EP, 2 turns
- Moderate control difficulty (30-35%)

**Tier 3 - Star Spawn**
- Powerful entities requiring Nexus sites
  - Star Spawn of Cthulhu: Massive combat power, reality distortion
  - Deep Ones (ocean biome): Aquatic horrors, hybrid breeding, coastal invasion
- Cost: 250-300 SF, 200-250 EP, 3-4 turns
- High control difficulty (50-60%)

**Tier 4 - Avatars**
- Physical manifestations of Great Old Ones
  - Avatar of Nyarlathotep: Perfect shapeshifting, master manipulation
- Cost: 800 SF, 600 EP, 8 turns
- Extreme control difficulty (85%)
- Requires Gateway + ritual power modifier 2.0+

**Tier 5 - Great Old Ones**
- Campaign-ending summonings
  - Cthulhu: Requires ocean biome, Gateway, "The Stars Are Right" event (5.0 modifier)
- Cost: 2000 SF, 1500 EP, 15 turns
- Near-impossible control (99%)
- Instant victory for Domination doctrine

All entities have:
- Binding strength that decays over time
- Rampage risk if binding drops below 30%
- Terror radius affecting regional sanity
- Doctrine-specific bonuses

### 3. Mission Generator (`src/lib/missionGenerator.ts`)

#### Mission Categories
Eight procedural mission types:

**Harvest Sanity**
- Deploy cultists to extract sanity fragments
- Difficulty: 2-5
- Preferred doctrine: Domination
- Base rewards: 80 SF, 20 EP

**Perform Ritual**
- Channel cosmic energies at ritual sites
- Difficulty: 3-7
- Base rewards: 150 EP, 10 doctrine points
- Celestial alignment bonuses apply

**Spread Corruption**
- Corrupt cultural institutions and populations
- Difficulty: 3-6
- Preferred doctrine: Corruption
- Base rewards: +15% corruption, 40 SF, 2 cultist cells

**Silence Witnesses**
- Eliminate those who've seen too much
- Difficulty: 4-8
- Preferred doctrine: Domination
- High investigation risk but prevents exposure

**Infiltrate Institution**
- Place operative within key organizations
- Difficulty: 5-8
- Preferred doctrine: Corruption
- Rewards: +20% corruption, new infiltrator

**Summon Entity**
- Manifest beings from beyond
- Difficulty: 6-10
- Preferred doctrine: Domination
- High risk, high reward

**Defend Site**
- Repel investigator raids on ritual sites
- Difficulty: 7-10
- Reactive mission, high cultist loss risk

**Counter Investigation**
- Misdirect hunters, reduce investigation heat
- Difficulty: 5-7
- Preferred doctrine: Corruption
- Special reward: -20 investigation heat

#### Mission Modifiers
Dynamic difficulty and reward scaling based on:

**Lunar Phase**
- Full moon: +20% rewards
- New moon: +10% rewards

**Planetary Alignment**
- High alignment (>70): +15% rewards

**Doctrine Match**
- Preferred doctrine: +25% rewards

**Cultural Traits**
- Rationalist: -10% effectiveness
- Superstitious: +10% effectiveness
- Faithful: -5% effectiveness

**Investigation Heat**
- High heat: increased difficulty, reduced success chance

#### Mission Outcome Scoring
Comprehensive grading system (S/A/B/C/D/F):

**Score Factors**
- Objective completion (0-100 base)
- Time bonus: <50% time = +20 points
- Time penalty: >100% time = -30 points
- No veil damage: +15 points
- No casualties: +10 points
- Difficulty multiplier: ×(1 + difficulty/20)

**Rewards/Penalties**
- Success: Full rewards
- Partial success: Scaled rewards (objective% × 0.5)
- Failure: 1.5× penalties
- Doctrine impact: ±3 to ±10 points
- Elder One favor: ±3 to ±20 points

### 4. Human Counter-Operations

Reactive AI system generating threats based on investigation heat:

**Raid** (Threat: varies)
- Targets specific ritual sites
- Can destroy sites if threat level >7
- Cultist casualties, veil damage

**Investigation** (Threat: varies)
- Intensive task force scrutiny
- Raises regional investigation heat
- Major veil damage risk

**Counter-Ritual** (Threat: varies)
- Occult researchers attempt banishment
- Disrupts active rituals
- Can banish summoned entities
- Actually helps veil integrity (-10 veil damage)

**Media Exposure** (Threat: varies)
- Journalists preparing exposé
- Massive veil damage (threat × 8)
- Cultist cells compromised

All counter-ops have:
- Turn countdown (2-8 turns)
- Counterable flag (can be stopped via missions)
- Threat level determining damage
- Regional targeting

### 5. UI Components

#### Ritual Site Panel (`RitualSitePanel.tsx`)
- Visual site management across all regions
- Tier-based color coding
- Power storage and generation tracking
- Exposure risk meters
- Upgrade buttons with cost display
- Defense status (glamour veil, wards)
- Biome benefit tooltips
- Active ritual progress bars

#### Mission Board Panel (`MissionBoardPanel.tsx`)
- Three-tab interface: Available / Active / Completed
- Mission cards with:
  - Difficulty color coding
  - Category icons
  - Objective checklists
  - Reward previews
  - Modifier displays (lunar, doctrine, investigation)
  - Time limit counters
- Active mission progress tracking
- Mission outcome display with grade visualization

#### Unit Roster Panel (`UnitRosterPanel.tsx`)
- Three-tab interface: Cultists / Infiltrators / Entities
- Cultist management:
  - Grouped by tier
  - Assignment controls
  - Training buttons
  - Attunement progress bars
  - Compromise warnings
- Infiltrator management:
  - Recruitment interface
  - Depth/influence tracking
  - Available operations list
  - Exposure status
- Entity management:
  - Summoning interface
  - Binding strength warnings
  - Rampage alerts
  - Ability displays
  - Task assignment

### 6. Integration System (`greatOldOnesWeek3Integration.ts`)

#### Extended State Management
- Infiltrator tracking (not in base state)
- Mission lifecycle (available → active → completed)
- Counter-operation tracking
- Doctrine points accumulation
- Elder One favor tracking

#### Turn Update Pipeline
1. Update ritual sites (power generation, upgrade progress)
2. Update entity bindings (decay, rampage checks)
3. Update infiltrator depth/influence
4. Progress active missions
5. Check mission expirations
6. Generate new missions (maintain pool of 3)
7. Generate counter-ops (based on investigation heat)
8. Progress counter-ops (execute when countdown reaches 0)

#### Mission Completion Flow
1. Score outcome based on objectives and time
2. Apply rewards to state (SF, EP, corruption, cultists)
3. Apply penalties (veil, heat, casualties)
4. Update doctrine points and Elder One favor
5. Move mission to completed list

## Strategic Depth

### Site Placement Strategy
Players must balance:
- **Power Generation**: Mountain biomes for maximum ritual power
- **Concealment**: Ocean/ruins/desert for hiding from investigators
- **Harvesting**: Urban centers for sanity fragment extraction
- **Summoning**: Biome requirements for specific entities (Deep Ones need ocean, etc.)

### Unit Composition
- **Initiates**: Cheap labor for harvesting and recruitment
- **Acolytes**: Versatile mid-tier for rituals and infiltration
- **High Priests**: Elite ritual leaders worth the investment
- **Infiltrators**: Long-term corruption investments
- **Entities**: High-risk, high-reward power projection

### Mission Prioritization
- **Early game**: Harvest sanity, establish sites, spread corruption
- **Mid game**: Infiltrate institutions, perform rituals, counter investigations
- **Late game**: Summon entities, defend sites, silence witnesses

### Risk Management
- High investigation heat triggers more counter-ops
- Low veil integrity increases investigator spawns
- Entity rampages cause massive veil damage
- Compromised cultists become liabilities
- Failed missions reduce doctrine morale

## Technical Architecture

### Type Safety
- Comprehensive TypeScript types for all entities
- Strict null checking on state access
- Enum-based constants for safety

### Modularity
- Separate files for each major system
- Clear interfaces between systems
- Minimal coupling with base game state

### Performance
- Efficient filtering and mapping
- Minimal state mutation
- Progress bar calculations cached

### Extensibility
- Easy to add new mission types
- Simple entity/infiltrator additions
- Biome system extensible
- Mission modifiers composable

## Integration with Existing Systems

Week 3 builds on Week 1 & 2:
- Uses existing resource system (SF, EP, Veil, Corruption)
- Leverages doctrine bonuses/penalties
- Integrates with cosmic alignment calendar
- Works with High Priest Council system
- Extends regional state management
- Utilizes investigation heat mechanics

## Next Steps (Future Weeks)

### Week 4: Path of Domination
- Advanced summoning minigames
- Terror propagation mechanics
- Military confrontation system
- Legendary beast awakening chains

### Week 5: Path of Corruption
- Infiltration network visualization
- Memetic warfare system
- Dream invasion mechanics
- Puppet government management

### Week 6-7: Path of Convergence
- Enlightenment engine
- True intentions meter
- Cultural transformation tracking
- Voluntary sacrifice economy

## Files Created

### Core Libraries
- `src/lib/ritualSiteMechanics.ts` - Site upgrade, biome bonuses, defenses
- `src/lib/unitRoster.ts` - Cultists, infiltrators, entity summoning
- `src/lib/missionGenerator.ts` - Procedural missions, counter-ops, scoring
- `src/lib/greatOldOnesWeek3Integration.ts` - System integration and turn updates

### UI Components
- `src/components/greatOldOnes/RitualSitePanel.tsx` - Site management UI
- `src/components/greatOldOnes/MissionBoardPanel.tsx` - Mission interface
- `src/components/greatOldOnes/UnitRosterPanel.tsx` - Unit management
- `src/components/greatOldOnes/index.ts` - Updated exports

### Documentation
- `docs/great-old-ones-week-3-summary.md` - This file

## Testing Recommendations

### Unit Tests
- Mission generation with various state inputs
- Site upgrade cost calculations
- Entity binding decay mechanics
- Infiltrator progression rates
- Mission scoring edge cases

### Integration Tests
- Turn update pipeline
- Mission lifecycle (generation → active → completion)
- Counter-op execution and damage application
- Doctrine bonus stacking
- Cosmic alignment modifiers

### UI Tests
- Ritual site card rendering
- Mission card interactions
- Unit roster tab switching
- Progress bar accuracy
- Button enable/disable states

## Conclusion

Week 3 provides a complete tactical layer for the Great Old Ones campaign, giving players meaningful choices in site management, unit deployment, and mission prioritization. The procedural mission system ensures replayability, while the counter-operation system provides dynamic challenge scaling. The integration with existing systems maintains consistency while adding substantial new depth.

The foundation is now set for doctrine-specific specializations in Weeks 4-7.

*Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.*
