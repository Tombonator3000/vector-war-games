# Spy System - Implementation Guide

This guide explains how to integrate the spy system into the Vector War Games application.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Hook Integration](#hook-integration)
3. [UI Integration](#ui-integration)
4. [Turn Processing](#turn-processing)
5. [Notification System](#notification-system)
6. [Testing](#testing)
7. [Balancing](#balancing)

---

## Quick Start

### 1. Install Dependencies
The spy system uses existing dependencies. No new packages required.

### 2. Import Required Modules

```typescript
// In your main game component (e.g., Index.tsx)
import { useSpyNetwork } from '@/hooks/useSpyNetwork';
import { SpyNetworkPanel } from '@/components/SpyNetworkPanel';
import { initializeSpyNetwork } from '@/lib/spyNetworkUtils';
```

### 3. Initialize Spy Network for New Games

```typescript
// When creating a new nation or starting a game
const initializeNation = (nation: Nation): Nation => {
  return {
    ...nation,
    spyNetwork: initializeSpyNetwork(),
  };
};
```

---

## Hook Integration

### Basic Setup

```typescript
// In your main game component
const spyNetwork = useSpyNetwork({
  currentTurn: gameState.turn,
  getNation: (id: string) => nations.find(n => n.id === id),
  getNations: () => nations,
  updateNation: (id: string, updates: Partial<Nation>) => {
    setNations(prev => prev.map(n =>
      n.id === id ? { ...n, ...updates } : n
    ));
  },
  updateNations: (updates: Map<string, Partial<Nation>>) => {
    setNations(prev => prev.map(nation => {
      const update = updates.get(nation.id);
      return update ? { ...nation, ...update } : nation;
    }));
  },
  getGameState: () => gameState,
  onLog: (message, tone) => {
    // Log to game log
    addGameLog(message, tone);
  },
  onToast: (payload) => {
    // Show toast notification
    toast(payload);
  },
});
```

### Available Methods

```typescript
// Recruitment
spyNetwork.recruitSpy(playerNationId, {
  cover: 'diplomat',
  targetNation: 'enemy-nation-id', // Optional
  specialization: 'infiltration', // Optional
});

// Launch Mission
spyNetwork.launchMission(
  playerNationId,
  spyId,
  targetNationId,
  'steal-tech'
);

// Launch Counter-Intelligence
spyNetwork.launchCounterIntel(playerNationId);

// Query Methods
const network = spyNetwork.getSpyNetwork(playerNationId);
const spies = spyNetwork.getSpies(playerNationId);
const missions = spyNetwork.getActiveMissions(playerNationId);
const spy = spyNetwork.getSpyById(playerNationId, spyId);

// Calculations
const successChance = spyNetwork.calculateMissionSuccessChance(
  spyId,
  playerNationId,
  targetNationId,
  'sabotage-production'
);

const detectionRisk = spyNetwork.calculateDetectionRisk(
  spyId,
  playerNationId,
  targetNationId,
  'assassination'
);
```

---

## UI Integration

### Add SpyNetworkPanel to Game UI

```typescript
// In your main game UI component
<SpyNetworkPanel
  player={playerNation}
  enemies={enemyNations}
  onRecruitSpy={(cover, targetNation, specialization) => {
    spyNetwork.recruitSpy(playerNation.id, {
      cover,
      targetNation,
      specialization,
    });
  }}
  onLaunchMission={(spyId, targetNationId, missionType) => {
    spyNetwork.launchMission(
      playerNation.id,
      spyId,
      targetNationId,
      missionType
    );
  }}
  onLaunchCounterIntel={() => {
    spyNetwork.launchCounterIntel(playerNation.id);
  }}
  calculateMissionSuccessChance={(spyId, targetNationId, missionType) =>
    spyNetwork.calculateMissionSuccessChance(
      spyId,
      playerNation.id,
      targetNationId,
      missionType
    )
  }
  calculateDetectionRisk={(spyId, targetNationId, missionType) =>
    spyNetwork.calculateDetectionRisk(
      spyId,
      playerNation.id,
      targetNationId,
      missionType
    )
  }
/>
```

### Conditional Display

Only show the spy panel when the feature is unlocked or when the player has recruited spies:

```typescript
{(hasSpyNetworkUnlock || playerNation.spyNetwork) && (
  <SpyNetworkPanel {...props} />
)}
```

---

## Turn Processing

### Call at Turn Start

```typescript
const handleTurnStart = () => {
  // ... existing turn start logic ...

  // Process spy missions and counter-intel
  spyNetwork.processTurnStart();

  // This will:
  // - Decrease recruitment cooldowns
  // - Execute completed missions
  // - Apply mission effects
  // - Handle caught spies
  // - Create diplomatic incidents
  // - Process counter-intel operations
};
```

### Manual Processing (Advanced)

If you need more control over turn processing:

```typescript
// Decrease cooldowns
nations.forEach(nation => {
  if (nation.spyNetwork && nation.spyNetwork.recruitmentCooldown > 0) {
    updateNation(nation.id, {
      spyNetwork: {
        ...nation.spyNetwork,
        recruitmentCooldown: nation.spyNetwork.recruitmentCooldown - 1,
      }
    });
  }
});

// Process completed missions manually
const processCompletedMissions = () => {
  nations.forEach(nation => {
    if (!nation.spyNetwork) return;

    const completedMissions = nation.spyNetwork.activeMissions.filter(
      mission => mission.completionTurn <= currentTurn
    );

    completedMissions.forEach(mission => {
      // Execute mission logic
      // Apply rewards
      // Handle consequences
      // Update spy status
    });
  });
};
```

---

## Notification System

### Mission Completion Notifications

```typescript
// Setup notification listener
useEffect(() => {
  const handleMissionComplete = (event: CustomEvent) => {
    const { spy, mission, result } = event.detail;

    if (result.success) {
      toast({
        title: 'Mission Success',
        description: `${spy.name} completed ${mission.type}`,
        variant: 'default',
      });
    } else if (result.spyCaught) {
      toast({
        title: 'Spy Captured',
        description: `${spy.name} was captured!`,
        variant: 'destructive',
      });
    }
  };

  window.addEventListener('spy-mission-complete', handleMissionComplete);

  return () => {
    window.removeEventListener('spy-mission-complete', handleMissionComplete);
  };
}, []);
```

### Spy Incident Notifications

```typescript
// When spies are caught
if (incident.publicized) {
  addNewsEvent({
    title: 'International Incident',
    description: `${spyNation.name} caught conducting espionage in ${targetNation.name}`,
    category: 'diplomatic',
    priority: 'urgent',
    turn: currentTurn,
  });
}
```

---

## Testing

### Unit Tests

```typescript
// Test spy recruitment
describe('Spy Recruitment', () => {
  it('should deduct correct costs', () => {
    const nation = createTestNation();
    const initialIntel = nation.intel;
    const initialProduction = nation.production;

    recruitSpy(nation, currentTurn, { cover: 'diplomat' });

    expect(nation.intel).toBe(initialIntel - SPY_COSTS.RECRUIT_BASE.intel);
    expect(nation.production).toBe(initialProduction - SPY_COSTS.RECRUIT_BASE.production);
  });

  it('should apply recruitment cooldown', () => {
    const nation = createTestNation();
    recruitSpy(nation, currentTurn, { cover: 'diplomat' });

    expect(nation.spyNetwork.recruitmentCooldown).toBe(2);
  });
});

// Test mission execution
describe('Mission Execution', () => {
  it('should apply tech theft rewards correctly', () => {
    const spy = createTestSpy();
    const target = createTestNation();
    const spyNation = createTestNation();

    target.researched = { 'advanced-missiles': true };
    spyNation.researched = {};

    const mission = createTestMission('steal-tech');
    const result = executeMission(mission, spy, target, spyNation, currentTurn, gameState);

    if (result.success && result.rewards?.techStolen) {
      expect(spyNation.researched[result.rewards.techStolen]).toBe(true);
    }
  });
});
```

### Integration Tests

```typescript
describe('Spy System Integration', () => {
  it('should create grievance when spy caught', () => {
    const spyNation = createTestNation();
    const targetNation = createTestNation();
    const spy = createTestSpy();
    const mission = createTestMission('sabotage-production');

    const incident = createSpyIncident(spy, mission, spyNation, targetNation, currentTurn, false);
    const resolution = calculateSpyConsequences(incident, spyNation, targetNation);

    const consequences = applyAllSpyConsequences(
      spyNation,
      targetNation,
      incident,
      resolution,
      gameState,
      currentTurn
    );

    const grievances = consequences.updatedTargetNation.grievances || [];
    const espionageGrievances = grievances.filter(g => g.type === 'espionage-caught');

    expect(espionageGrievances.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing Checklist

- [ ] Recruit spy with different covers
- [ ] Launch each mission type
- [ ] Verify mission effects apply correctly
- [ ] Test spy capture and elimination
- [ ] Test counter-intelligence detection
- [ ] Verify diplomatic consequences
- [ ] Test with cyber warfare bonuses
- [ ] Test recruitment cooldown
- [ ] Test spy skill progression
- [ ] Test network reputation updates

---

## Balancing

### Initial Balance Values

The system is pre-balanced with the following values:

**Recruitment Costs:**
- Base spy: 40 Intel, 20 Production
- Trained spy: 60 Intel, 35 Production
- Elite spy: 80 Intel, 50 Production

**Mission Costs:**
- Low risk (gather-intel): 25 Intel
- Medium risk (sabotage): 40-45 Intel
- High risk (assassination): 80 Intel + 25 Production

**Detection Risks:**
- Low (20-30%): gather-intel, propaganda
- Medium (35-45%): sabotage, steal-tech
- High (50-60%): assassination, rig-election

**Skill Progression:**
- +10 experience per successful mission
- +5 skill per mission
- Auto-upgrade at skill thresholds

### Balancing Tips

1. **If spies are too powerful:**
   - Increase detection risks
   - Increase recruitment costs
   - Add more severe diplomatic penalties
   - Reduce mission rewards

2. **If spies are too weak:**
   - Decrease detection risks
   - Decrease costs
   - Increase skill gains
   - Boost mission rewards

3. **If missions complete too quickly:**
   - Increase mission durations
   - Add preparation turns

4. **If counter-intel is too effective:**
   - Reduce base detection chance
   - Make cyber defense less impactful
   - Increase cost

### Monitoring Metrics

Track these values during playtesting:

```typescript
interface SpyBalanceMetrics {
  averageSpiesPerNation: number;
  missionSuccessRate: number;
  spyCaptureRate: number;
  averageSkillGainPerTurn: number;
  mostUsedMissionType: SpyMissionType;
  averageDiplomaticPenalty: number;
  resourceSpentOnSpies: {
    intel: number;
    production: number;
  };
}
```

### Recommended Adjustments by Game Phase

**Early Game (Turns 1-10):**
- Recruitment should be accessible (40 Intel is achievable)
- Low-risk missions should have high success (70%+)
- Penalties should be moderate

**Mid Game (Turns 11-30):**
- Elite spies should be available
- Mission variety should increase
- Counter-intel becomes viable
- Penalties escalate

**Late Game (Turns 31+):**
- Spy networks should be established
- High-risk missions become necessary
- Leader abilities interact with spies
- Diplomatic consequences are severe

---

## Common Pitfalls

### 1. Forgetting Turn Processing
**Problem:** Missions never complete
**Solution:** Call `spyNetwork.processTurnStart()` at turn start

### 2. Not Initializing Spy Network
**Problem:** Cannot recruit spies
**Solution:** Initialize `spyNetwork` when creating nations

### 3. Missing Diplomatic Integration
**Problem:** No consequences when caught
**Solution:** Ensure diplomatic systems are enabled

### 4. Incorrect Cost Calculations
**Problem:** Wrong costs displayed/charged
**Solution:** Use `getMissionCost()` and `getRecruitmentCost()`

### 5. State Synchronization Issues
**Problem:** UI shows stale data
**Solution:** Use proper React state management and `updateNations()` batch updates

---

## Performance Considerations

### Large Number of Spies

If you have many nations with many spies:

```typescript
// Optimize mission processing
const processMissionsOptimized = () => {
  const updates = new Map<string, Partial<Nation>>();

  // Batch all updates
  for (const nation of nations) {
    if (!nation.spyNetwork) continue;

    // Process all missions for this nation
    const updatedNetwork = processNationMissions(nation, gameState);

    if (updatedNetwork) {
      updates.set(nation.id, { spyNetwork: updatedNetwork });
    }
  }

  // Apply all updates at once
  updateNations(updates);
};
```

### Reduce Calculation Frequency

Cache success chance calculations:

```typescript
const [missionStats, setMissionStats] = useState<Map<string, MissionStats>>(new Map());

const getMissionStats = useMemo(() => {
  return (spyId: string, targetId: string, missionType: SpyMissionType) => {
    const key = `${spyId}-${targetId}-${missionType}`;

    if (missionStats.has(key)) {
      return missionStats.get(key);
    }

    const stats = {
      successChance: calculateMissionSuccessChance(...),
      detectionRisk: calculateDetectionRisk(...),
    };

    setMissionStats(prev => new Map(prev).set(key, stats));
    return stats;
  };
}, [spyId, targetId, missionType, nations, currentTurn]);
```

---

## Example: Complete Integration

```typescript
// Complete example in Index.tsx
const GameComponent = () => {
  const [nations, setNations] = useState<Nation[]>([]);
  const [gameState, setGameState] = useState<GameState>(initialState);

  // Initialize spy network hook
  const spyNetwork = useSpyNetwork({
    currentTurn: gameState.turn,
    getNation: (id) => nations.find(n => n.id === id),
    getNations: () => nations,
    updateNation: (id, updates) => {
      setNations(prev => prev.map(n =>
        n.id === id ? { ...n, ...updates } : n
      ));
    },
    updateNations: (updates) => {
      setNations(prev => prev.map(nation => {
        const update = updates.get(nation.id);
        return update ? { ...nation, ...update } : nation;
      }));
    },
    getGameState: () => gameState,
    onLog: (message, tone) => addGameLog(message, tone),
    onToast: (payload) => toast(payload),
  });

  // Process turn
  const handleNextTurn = () => {
    // Process spy operations
    spyNetwork.processTurnStart();

    // ... other turn logic ...

    setGameState(prev => ({ ...prev, turn: prev.turn + 1 }));
  };

  // Render
  return (
    <div>
      {/* ... other game UI ... */}

      <SpyNetworkPanel
        player={playerNation}
        enemies={enemyNations}
        onRecruitSpy={(cover, target, spec) => {
          spyNetwork.recruitSpy(playerNation.id, { cover, targetNation: target, specialization: spec });
        }}
        onLaunchMission={(spyId, targetId, missionType) => {
          spyNetwork.launchMission(playerNation.id, spyId, targetId, missionType);
        }}
        onLaunchCounterIntel={() => {
          spyNetwork.launchCounterIntel(playerNation.id);
        }}
        calculateMissionSuccessChance={(spyId, targetId, missionType) =>
          spyNetwork.calculateMissionSuccessChance(spyId, playerNation.id, targetId, missionType)
        }
        calculateDetectionRisk={(spyId, targetId, missionType) =>
          spyNetwork.calculateDetectionRisk(spyId, playerNation.id, targetId, missionType)
        }
      />
    </div>
  );
};
```

---

## Next Steps

1. Follow this guide to integrate the spy system
2. Test thoroughly with different scenarios
3. Balance based on playtesting feedback
4. Add leader ability integration (see spy-system-leader-integration.md)
5. Enhance UI with animations and better feedback
6. Add advanced features (double agents, safe houses, etc.)

---

For questions or issues, refer to:
- Type definitions: `/src/types/spySystem.ts`
- Utilities: `/src/lib/spyNetworkUtils.ts`
- Mission executor: `/src/lib/spyMissionExecutor.ts`
- Diplomatic integration: `/src/lib/spyDiplomaticIntegration.ts`
- Hook: `/src/hooks/useSpyNetwork.ts`
- UI Component: `/src/components/SpyNetworkPanel.tsx`
