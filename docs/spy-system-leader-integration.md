# Spy System - Leader Ability Integration

This document describes how leader abilities can interact with the spy system to provide unique strategic advantages.

## Leader Ability Categories for Espionage

### 1. Spy Enhancement Abilities
These abilities directly improve spy performance:

- **Spymaster's Network** - All spies gain +20 skill and +15% success chance for 5 turns
- **Perfect Cover** - Next recruited spy starts at Elite level with perfect cover identity
- **Ghost Protocol** - All active spies become undetectable for 3 turns
- **Master Recruiter** - Recruit 3 spies instantly with no cooldown or cost

### 2. Counter-Intelligence Abilities
These abilities protect against enemy spies:

- **Paranoid Security** - Automatic detection of all enemy spies for 4 turns
- **Counter-Espionage Sweep** - Instantly capture all enemy spies in your territory
- **Diplomatic Immunity** - Your spies cannot be caught for 3 turns
- **Deep Cover** - One spy becomes permanent double agent in enemy nation

### 3. Intelligence Manipulation
These abilities affect intelligence and information:

- **Disinformation Campaign** - Feed false intel to all enemy spies (causes their missions to fail)
- **Signal Intelligence** - Reveal all active enemy spy missions and their targets
- **Cryptographic Breakthrough** - Read all diplomatic communications for 5 turns
- **Intelligence Sharing** - Gain copies of all intelligence gathered by allied nations

### 4. Sabotage & Assassination
Enhanced versions of spy missions:

- **Coordinated Strike** - Launch 3 sabotage missions simultaneously with guaranteed success
- **Wetwork Authorization** - Next assassination mission has 100% success, 0% detection
- **Industrial Espionage** - Steal all completed research from target nation at once
- **Regime Change** - Rig election and assassinate leader in single mission

## Implementation Examples

### Example 1: Existing Leader with Spy Enhancement

```typescript
// Nyarlathotep already has 'Master Deceiver' false-flag ability
// This can be enhanced to also provide spy bonuses:

'Nyarlathotep': {
  id: 'nyarlathotep_spy_master',
  name: '🎭 Master of Shadows',
  description: 'All spies gain +30 skill, false-flag missions have 100% success, and you can recruit spies with no cooldown for 5 turns.',
  icon: '🎭',
  maxUses: 2,
  usesRemaining: 2,
  cooldownTurns: 8,
  currentCooldown: 0,
  lastUsedTurn: null,
  effect: {
    type: 'spy-enhancement',
    duration: 5,
    value: 30,
    metadata: {
      removeCooldown: true,
      falseFlagBonus: true,
    }
  },
  targetType: 'self',
  category: 'intelligence',
  requirements: [],
}
```

### Example 2: New Leader with Counter-Intelligence Focus

```typescript
// Proposed: Add "James Angleton" (CIA Counter-Intelligence Chief)

'James Angleton': {
  id: 'angleton_paranoia',
  name: '🔍 Counterintelligence Master',
  description: 'Automatically detect and capture all enemy spies. Your own spies gain +50% detection resistance for 4 turns.',
  icon: '🔍',
  maxUses: 1,
  usesRemaining: 1,
  cooldownTurns: 0,
  currentCooldown: 0,
  lastUsedTurn: null,
  effect: {
    type: 'counter-intel-sweep',
    duration: 4,
    value: 50,
    metadata: {
      autoCapture: true,
      detectionResistance: 50,
    }
  },
  targetType: 'self',
  category: 'intelligence',
  requirements: [],
}
```

### Example 3: Leader with Diplomatic Espionage

```typescript
// Proposed: Add "Kim Philby" (Famous Double Agent)

'Kim Philby': {
  id: 'philby_double_agent',
  name: '🕵️ Master Double Agent',
  description: 'Turn one captured enemy spy into a double agent. They feed false intel to their home nation and provide you with intelligence.',
  icon: '🕵️',
  maxUses: 2,
  usesRemaining: 2,
  cooldownTurns: 10,
  currentCooldown: 0,
  lastUsedTurn: null,
  effect: {
    type: 'turn-double-agent',
    duration: 0, // Permanent until spy dies
    value: 1,
    metadata: {
      falseIntelPerTurn: 20,
      trueIntelPerTurn: 15,
    }
  },
  targetType: 'single-nation', // Target whose spy to turn
  category: 'intelligence',
  requirements: [
    {
      type: 'other',
      value: 'captured-spy',
      description: 'Must have captured at least one enemy spy',
    }
  ],
}
```

## Leader Ability Effect Types for Spies

Add these new effect types to `LeaderAbilityEffectType`:

```typescript
export type LeaderAbilityEffectType =
  // ... existing types ...

  // Spy-specific effects
  | 'spy-enhancement'          // Boost spy skills/success rates
  | 'spy-protection'           // Protect spies from detection
  | 'counter-intel-sweep'      // Auto-detect enemy spies
  | 'turn-double-agent'        // Turn captured spy
  | 'perfect-recruitment'      // Recruit elite spies
  | 'mission-guarantee'        // Guarantee mission success
  | 'reveal-enemy-spies'       // Show all enemy spy operations
  | 'disinformation'           // Feed false intel
  | 'assassination-boost'      // Enhance assassination missions
  | 'sabotage-coordination';   // Coordinate multiple sabotage ops
```

## Integration with Spy Network Calculations

Leader abilities should modify spy calculations in `spyNetworkUtils.ts`:

```typescript
export function calculateMissionSuccessChance(
  spy: SpyAgent,
  target: Nation,
  missionType: SpyMissionType,
  spyNation: Nation
): number {
  let successChance = spy.skill;

  // ... existing calculation ...

  // CHECK FOR LEADER ABILITIES
  if (spyNation.leaderAbilityState) {
    const activeAbilities = getActiveAbilities(spyNation);

    for (const ability of activeAbilities) {
      if (ability.effect.type === 'spy-enhancement') {
        successChance += ability.effect.value || 0;
      }

      if (ability.effect.type === 'mission-guarantee' &&
          ability.effect.metadata?.missionType === missionType) {
        successChance = 100; // Guaranteed success
      }
    }
  }

  return Math.max(5, Math.min(95, successChance));
}
```

## Integration with Counter-Intelligence

Leader abilities that affect counter-intelligence:

```typescript
export function executeCounterIntel(
  operation: CounterIntelOperation,
  nation: Nation,
  gameState: GameState
): string[] {
  const detectedSpies: string[] = [];

  let detectionBonus = 0;

  // CHECK FOR LEADER ABILITIES
  if (nation.leaderAbilityState) {
    const activeAbilities = getActiveAbilities(nation);

    for (const ability of activeAbilities) {
      if (ability.effect.type === 'counter-intel-sweep') {
        // Auto-detect all spies
        detectionBonus = 100;
      }

      if (ability.effect.type === 'spy-protection') {
        // Makes detection harder for enemies
        // (applies when OTHER nations try to detect YOUR spies)
      }
    }
  }

  // ... rest of detection logic with detectionBonus ...
}
```

## Recommended Leader Ability Additions

### Existing Leaders to Enhance

1. **Nyarlathotep** (Master Deceiver) → Add spy enhancement
2. **Kim Jong-un** (Juche Self-Reliance) → Add counter-intel bonus
3. **Mao Zedong** (Cultural Revolution) → Add propaganda mission boost
4. **Vladimir Putin** (KGB Training) → Add perfect spy recruitment
5. **Xi Jinping** (Social Credit) → Add counter-espionage sweep

### New Espionage-Focused Leaders to Add

1. **Markus Wolf** (East German Spymaster)
   - Ability: "Romeo Spies" - Recruit spies with seduction specialization

2. **Allen Dulles** (CIA Director)
   - Ability: "MKULTRA" - Mind control one enemy spy to become double agent

3. **Mata Hari** (Famous Spy)
   - Ability: "Fatal Attraction" - Female spy with guaranteed success on intelligence missions

4. **Sidney Reilly** (Ace of Spies)
   - Ability: "The Trust" - Create fake spy network that feeds disinformation

5. **Richard Sorge** (Soviet Spy in Japan)
   - Ability: "Deep Cover" - Place spy in enemy nation permanently with no detection risk

## UI Integration

The SpyNetworkPanel should display active leader ability effects:

```typescript
// In SpyNetworkPanel.tsx, show active bonuses
{leaderAbilityActive && (
  <div className="bg-purple-900/20 p-3 rounded border border-purple-700">
    <div className="flex items-center gap-2 mb-2">
      <Award className="w-4 h-4 text-purple-400" />
      <span className="text-sm font-bold text-purple-300">
        Active: {abilityName}
      </span>
    </div>
    <div className="text-xs text-purple-200">
      • All spies: +{bonusValue} skill
      • Success chance: +{bonusPercent}%
      • Detection risk: -{reductionPercent}%
    </div>
  </div>
)}
```

## Example Ability Execution Flow

1. **Player activates leader ability** (e.g., "Ghost Protocol")
2. **Ability applied to nation state:**
   ```typescript
   nation.leaderAbilityState.activeEffects.push({
     abilityId: 'ghost_protocol',
     type: 'spy-protection',
     duration: 3,
     turnsRemaining: 3,
     value: 100, // 100% detection resistance
   });
   ```

3. **When calculating spy detection risk:**
   ```typescript
   let detectionRisk = baseRisk;

   // Check for active spy protection abilities
   const protection = getActiveEffect(spyNation, 'spy-protection');
   if (protection) {
     detectionRisk -= protection.value; // Reduce by 100%
   }

   detectionRisk = Math.max(0, detectionRisk); // Can't go below 0
   ```

4. **At turn end, decrement ability duration:**
   ```typescript
   for (const effect of nation.leaderAbilityState.activeEffects) {
     effect.turnsRemaining--;
     if (effect.turnsRemaining <= 0) {
       // Remove effect
       nation.leaderAbilityState.activeEffects =
         nation.leaderAbilityState.activeEffects.filter(e => e !== effect);
     }
   }
   ```

## Testing Scenarios

### Test 1: Spy Enhancement Ability
1. Recruit spy with 40 skill
2. Activate "Spymaster's Network" (+20 skill)
3. Launch mission - should calculate with 60 skill
4. Verify success chance is higher
5. Wait 5 turns - effect should expire

### Test 2: Counter-Intelligence Sweep
1. Have enemy nation place spy in your territory
2. Activate "Counterintelligence Master"
3. Verify enemy spy is immediately detected and captured
4. Verify diplomatic consequences are applied

### Test 3: Mission Guarantee
1. Recruit spy for high-risk mission (assassination)
2. Activate "Wetwork Authorization"
3. Launch assassination mission
4. Verify mission succeeds with 0% detection
5. Verify leader is assassinated

### Test 4: Double Agent
1. Capture enemy spy via counter-intel
2. Activate "Master Double Agent" ability
3. Verify spy status changes to 'double-agent'
4. Verify spy provides intel each turn
5. Verify enemy nation receives false intel

## Balance Considerations

**Cooldowns:**
- Powerful abilities (guaranteed success): 1 use per game
- Strong abilities (+30 skill bonus): 2 uses, 10 turn cooldown
- Moderate abilities (counter-intel): 2 uses, 8 turn cooldown

**Requirements:**
- Late-game abilities: Require turn 15+
- Situational abilities: Require specific conditions (at war, spy captured, etc.)
- Resource costs: Some abilities could cost Intel or DIP

**Effectiveness:**
- Abilities should be powerful but not game-breaking
- Time-limited bonuses are preferable to permanent effects
- Should provide strategic choices, not automatic wins

## Implementation Priority

1. **High Priority:** Add spy-protection and spy-enhancement effect types
2. **Medium Priority:** Enhance Nyarlathotep and Putin with spy bonuses
3. **Low Priority:** Add new espionage-focused leaders
4. **Future:** Complex double agent mechanics and disinformation campaigns

---

This integration allows leaders to specialize in espionage, providing unique strategic options and making the spy system more varied and interesting. Each leader's personality and historical role can inform their spy-related abilities.
