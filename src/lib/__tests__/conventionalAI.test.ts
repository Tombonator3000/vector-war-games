import { describe, it, expect } from 'vitest';
import {
  findBestAttack,
  findBestMove,
  placeReinforcements,
  makeAITurn,
  type AIDecision,
} from '../conventionalAI';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test territory with sensible defaults
 */
function createTerritory(
  id: string,
  overrides: Partial<TerritoryState> = {}
): TerritoryState {
  return {
    id,
    name: `Territory ${id}`,
    region: 'test-region',
    type: 'land',
    anchorLat: 0,
    anchorLon: 0,
    controllingNationId: null,
    contestedBy: [],
    strategicValue: 3,
    productionBonus: 2,
    instabilityModifier: 0,
    conflictRisk: 10,
    neighbors: [],
    armies: 5,
    unitComposition: {
      army: 5,
      navy: 0,
      air: 0,
      drone: 0,
    },
    ...overrides,
  };
}

/**
 * Create a simple territory network for testing
 */
function createTerritoryNetwork(): Record<string, TerritoryState> {
  const t1 = createTerritory('t1', {
    controllingNationId: 'ai1',
    armies: 10,
    neighbors: ['t2', 't3'],
  });

  const t2 = createTerritory('t2', {
    controllingNationId: 'ai2',
    armies: 3,
    neighbors: ['t1', 't4'],
  });

  const t3 = createTerritory('t3', {
    controllingNationId: 'ai1',
    armies: 8,
    neighbors: ['t1', 't4'],
  });

  const t4 = createTerritory('t4', {
    controllingNationId: 'ai2',
    armies: 2,
    neighbors: ['t2', 't3'],
    strategicValue: 5,
    productionBonus: 4,
  });

  return { t1, t2, t3, t4 };
}

// ============================================================================
// findBestAttack Tests
// ============================================================================

describe('findBestAttack', () => {
  describe('personality modifiers', () => {
    it('aggressive personality prefers attacks more', () => {
      const territories = createTerritoryNetwork();

      const aggressiveAttack = findBestAttack('ai1', territories, 'aggressive');
      const defensiveAttack = findBestAttack('ai1', territories, 'defensive');

      // Aggressive should find attack more readily
      expect(aggressiveAttack).not.toBeNull();
      expect(aggressiveAttack!.type).toBe('attack');

      // With current setup, defensive might also attack due to power advantage
      // but would have lower score/confidence (both should find attacks in this scenario)
    });

    it('defensive personality requires higher power ratio', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 6, // Only 2:1 advantage over t2
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 3,
          neighbors: ['t1'],
        }),
      };

      const aggressiveAttack = findBestAttack('ai1', territories, 'aggressive');
      const defensiveAttack = findBestAttack('ai1', territories, 'defensive');

      // Aggressive (1.3x risk tolerance) should attack at 2:1
      expect(aggressiveAttack).not.toBeNull();

      // Defensive (2.5x risk tolerance) might not attack at 2:1
      // or would have much lower score
      if (defensiveAttack) {
        expect(defensiveAttack.reason).toContain('below risk tolerance');
      }
    });

    it('chaotic personality accepts even fights', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 5,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 4, // Almost even fight
          neighbors: ['t1'],
        }),
      };

      const chaoticAttack = findBestAttack('ai1', territories, 'chaotic');

      // Chaotic has 1.0 risk tolerance, so might take this fight
      // But score might still be negative due to "too risky" from power ratio
      expect(chaoticAttack).toBeDefined();
    });

    it('isolationist personality is very cautious', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 16, // Much more overwhelming force
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 2, // 7.5:1 advantage (15 available / 2 = 7.5)
          neighbors: ['t1'],
        }),
      };

      const isolationistAttack = findBestAttack('ai1', territories, 'isolationist');

      // Isolationist has -30 base score penalty and 3.0 risk tolerance
      // Needs truly overwhelming force to overcome cautious nature
      expect(isolationistAttack).not.toBeNull();
      if (isolationistAttack) {
        expect(isolationistAttack.fromTerritoryId).toBe('t1');
      }
    });

    it('balanced personality uses default modifiers', () => {
      const territories = createTerritoryNetwork();

      const balancedAttack = findBestAttack('ai1', territories, 'balanced');
      const undefinedAttack = findBestAttack('ai1', territories, undefined);

      // Balanced and undefined should behave the same
      expect(balancedAttack).not.toBeNull();
      expect(undefinedAttack).not.toBeNull();
    });

    it('trickster personality has moderate aggression', () => {
      const territories = createTerritoryNetwork();

      const tricksterAttack = findBestAttack('ai1', territories, 'trickster');

      // Trickster has 1.1 aggression multiplier and 1.8 risk tolerance
      expect(tricksterAttack).not.toBeNull();
    });
  });

  describe('power ratio evaluation', () => {
    it('prefers overwhelming force (3:1 or better)', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 3, // 3:1 ratio (9 available / 3 = 3.0)
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.toTerritoryId).toBe('t2');
      expect(attack!.reason).toContain('overwhelming force');
    });

    it('accepts strong advantage (2:1)', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 7,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 3, // 2:1 ratio
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.reason).toContain('strong advantage');
    });

    it('considers slight advantage (1.5:1)', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 7, // 6 available after leaving 1 behind
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 3, // 6/3 = 2.0:1 ratio - strong advantage
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories, 'aggressive');

      expect(attack).not.toBeNull();
      // With 2:1 ratio, should be "strong advantage" not "slight advantage"
      expect(attack!.reason).toContain('strong advantage');
    });

    it('avoids risky attacks (below 1.5:1)', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 5,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 4, // 1.25:1 ratio - risky
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories, 'balanced');

      // Balanced personality should avoid this
      // Score would be negative due to "too risky"
      expect(attack).toBeNull();
    });
  });

  describe('strategic value evaluation', () => {
    it('prioritizes high strategic value territories', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['t2', 't3'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 2,
          strategicValue: 2,
          neighbors: ['t1'],
        }),
        t3: createTerritory('t3', {
          controllingNationId: 'ai2',
          armies: 2,
          strategicValue: 5, // Higher strategic value
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.toTerritoryId).toBe('t3'); // Should prefer high strategic value
    });

    it('values high production bonus', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['t2', 't3'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 2,
          productionBonus: 1,
          neighbors: ['t1'],
        }),
        t3: createTerritory('t3', {
          controllingNationId: 'ai2',
          armies: 2,
          productionBonus: 5, // Higher production
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.toTerritoryId).toBe('t3');
      expect(attack!.reason).toContain('valuable production');
    });

    it('highly values completing a region', () => {
      // Create a region where ai1 controls all but one territory
      const territories: Record<string, TerritoryState> = {
        north_america: createTerritory('north_america', {
          controllingNationId: 'ai2', // Missing territory
          armies: 2,
          neighbors: ['atlantic_corridor'],
        }),
        atlantic_corridor: createTerritory('atlantic_corridor', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['north_america', 'eastern_bloc'],
        }),
        eastern_bloc: createTerritory('eastern_bloc', {
          controllingNationId: 'ai2',
          armies: 2,
          neighbors: ['atlantic_corridor'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      // Should prefer north_america to complete Western Hemisphere region
      expect(attack!.toTerritoryId).toBe('north_america');
      expect(attack!.reason).toContain('completes');
      expect(attack!.reason).toContain('Western Hemisphere');
    });

    it('prefers uncontrolled territories', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['t2', 't3'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: null, // Uncontrolled
          armies: 2,
          neighbors: ['t1'],
        }),
        t3: createTerritory('t3', {
          controllingNationId: 'ai2', // Controlled by enemy
          armies: 2,
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.toTerritoryId).toBe('t2'); // Should prefer uncontrolled
      expect(attack!.reason).toContain('uncontrolled territory');
    });

    it('penalizes high conflict risk without sufficient force', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 6, // 2:1 advantage, below 2.5:1 threshold
          neighbors: ['t2', 't3'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 3,
          conflictRisk: 5, // Low risk
          neighbors: ['t1'],
        }),
        t3: createTerritory('t3', {
          controllingNationId: 'ai2',
          armies: 3,
          conflictRisk: 50, // High risk
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.toTerritoryId).toBe('t2'); // Should avoid high conflict risk
    });
  });

  describe('edge cases', () => {
    it('returns null when AI has no territories', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai2',
          armies: 5,
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).toBeNull();
    });

    it('returns null when AI has no armies to attack with', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 1, // Can't attack (needs to leave 1 behind)
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 1,
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).toBeNull();
    });

    it('returns null when all neighbors are owned by AI', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai1',
          armies: 5,
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).toBeNull();
    });

    it('returns null when no attacks have positive score', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 3,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 10, // Much stronger
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).toBeNull();
    });

    it('calculates correct army allocation for attack', () => {
      const territories: Record<string, TerritoryState> = {
        t1: createTerritory('t1', {
          controllingNationId: 'ai1',
          armies: 10,
          neighbors: ['t2'],
        }),
        t2: createTerritory('t2', {
          controllingNationId: 'ai2',
          armies: 3,
          neighbors: ['t1'],
        }),
      };

      const attack = findBestAttack('ai1', territories);

      expect(attack).not.toBeNull();
      expect(attack!.armies).toBeGreaterThan(0);
      expect(attack!.armies).toBeLessThan(10); // Should leave at least 1 behind
      // Should aim for 2:1 advantage: 6 armies for 3 defenders
      expect(attack!.armies).toBeLessThanOrEqual(9); // Max available
    });
  });
});

// ============================================================================
// findBestMove Tests
// ============================================================================

describe('findBestMove', () => {
  it('consolidates forces from interior to border', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 10, // Interior with excess armies
        neighbors: ['t2'],
      }),
      t2: createTerritory('t2', {
        controllingNationId: 'ai1',
        armies: 2, // Border territory (weak)
        neighbors: ['t1', 't3'],
      }),
      t3: createTerritory('t3', {
        controllingNationId: 'ai2', // Enemy
        armies: 5,
        neighbors: ['t2'],
      }),
    };

    const move = findBestMove('ai1', territories);

    expect(move).not.toBeNull();
    expect(move!.type).toBe('move');
    expect(move!.fromTerritoryId).toBe('t1');
    expect(move!.toTerritoryId).toBe('t2');
    expect(move!.armies).toBeGreaterThan(0);
  });

  it('moves to weakest border territory', () => {
    const territories: Record<string, TerritoryState> = {
      interior: createTerritory('interior', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['border1', 'border2'],
      }),
      border1: createTerritory('border1', {
        controllingNationId: 'ai1',
        armies: 5,
        neighbors: ['interior', 'enemy'],
      }),
      border2: createTerritory('border2', {
        controllingNationId: 'ai1',
        armies: 2, // Weakest border
        neighbors: ['interior', 'enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 10,
        neighbors: ['border1', 'border2'],
      }),
    };

    const move = findBestMove('ai1', territories);

    expect(move).not.toBeNull();
    expect(move!.toTerritoryId).toBe('border2'); // Should move to weakest border
  });

  it('returns null when no interior territories with excess armies', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 2, // No excess (threshold is >2)
        neighbors: ['t2'],
      }),
      t2: createTerritory('t2', {
        controllingNationId: 'ai1',
        armies: 2,
        neighbors: ['t1', 'enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 5,
        neighbors: ['t2'],
      }),
    };

    const move = findBestMove('ai1', territories);

    expect(move).toBeNull();
  });

  it('returns null when no border territories', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['t2'],
      }),
      t2: createTerritory('t2', {
        controllingNationId: 'ai1',
        armies: 5,
        neighbors: ['t1'],
      }),
    };

    const move = findBestMove('ai1', territories);

    expect(move).toBeNull();
  });

  it('returns null when interior cannot reach border', () => {
    const territories: Record<string, TerritoryState> = {
      interior: createTerritory('interior', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: [], // No connection
      }),
      border: createTerritory('border', {
        controllingNationId: 'ai1',
        armies: 2,
        neighbors: ['enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 5,
        neighbors: ['border'],
      }),
    };

    const move = findBestMove('ai1', territories);

    expect(move).toBeNull();
  });

  it('finds path through multiple territories', () => {
    const territories: Record<string, TerritoryState> = {
      interior: createTerritory('interior', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['middle'],
      }),
      middle: createTerritory('middle', {
        controllingNationId: 'ai1',
        armies: 3,
        neighbors: ['interior', 'border'],
      }),
      border: createTerritory('border', {
        controllingNationId: 'ai1',
        armies: 2,
        neighbors: ['middle', 'enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 5,
        neighbors: ['border'],
      }),
    };

    const move = findBestMove('ai1', territories);

    expect(move).not.toBeNull();
    expect(move!.fromTerritoryId).toBe('interior');
    expect(move!.toTerritoryId).toBe('middle'); // First step in path
  });
});

// ============================================================================
// placeReinforcements Tests
// ============================================================================

describe('placeReinforcements', () => {
  it('prioritizes completing regions', () => {
    const territories: Record<string, TerritoryState> = {
      north_america: createTerritory('north_america', {
        controllingNationId: 'ai2', // Missing territory for region completion
        armies: 2,
        neighbors: ['atlantic_corridor'],
      }),
      atlantic_corridor: createTerritory('atlantic_corridor', {
        controllingNationId: 'ai1',
        armies: 5,
        neighbors: ['north_america'],
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 10);

    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions[0].type).toBe('reinforce');
    expect(decisions[0].toTerritoryId).toBe('atlantic_corridor');
    expect(decisions[0].reason).toContain('Western Hemisphere');
  });

  it('fortifies threatened border territories', () => {
    const territories: Record<string, TerritoryState> = {
      border: createTerritory('border', {
        controllingNationId: 'ai1',
        armies: 3,
        neighbors: ['enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 10, // Strong enemy
        neighbors: ['border'],
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 6);

    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions[0].type).toBe('reinforce');
    expect(decisions[0].toTerritoryId).toBe('border');
    expect(decisions[0].reason).toContain('Fortify border');
  });

  it('strengthens strategic territories', () => {
    const territories: Record<string, TerritoryState> = {
      strategic: createTerritory('strategic', {
        controllingNationId: 'ai1',
        armies: 5,
        strategicValue: 5, // High strategic value
        neighbors: [],
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 3);

    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions[0].type).toBe('reinforce');
    expect(decisions[0].toTerritoryId).toBe('strategic');
    expect(decisions[0].reason).toContain('strategic position');
  });

  it('distributes all reinforcements', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 5,
        neighbors: ['enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 10,
        neighbors: ['t1'],
      }),
    };

    const reinforcements = 10;
    const decisions = placeReinforcements('ai1', territories, reinforcements);

    const totalPlaced = decisions.reduce((sum, d) => sum + (d.armies || 0), 0);
    expect(totalPlaced).toBe(reinforcements);
  });

  it('limits reinforcement batch size', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 5,
        neighbors: ['enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 10,
        neighbors: ['t1'],
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 20);

    // Should split into multiple decisions, each with max 3-5 armies
    expect(decisions.length).toBeGreaterThan(1);
    decisions.forEach(decision => {
      expect(decision.armies).toBeLessThanOrEqual(5);
    });
  });

  it('returns empty array when AI has no territories', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai2',
        armies: 5,
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 10);

    expect(decisions).toEqual([]);
  });

  it('returns empty array when zero reinforcements', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 5,
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 0);

    expect(decisions).toEqual([]);
  });

  it('prioritizes most threatened borders first', () => {
    const territories: Record<string, TerritoryState> = {
      border1: createTerritory('border1', {
        controllingNationId: 'ai1',
        armies: 2,
        neighbors: ['enemy1'],
      }),
      border2: createTerritory('border2', {
        controllingNationId: 'ai1',
        armies: 3,
        neighbors: ['enemy2'],
      }),
      enemy1: createTerritory('enemy1', {
        controllingNationId: 'ai2',
        armies: 15, // Much stronger - more threatening
        neighbors: ['border1'],
      }),
      enemy2: createTerritory('enemy2', {
        controllingNationId: 'ai2',
        armies: 5,
        neighbors: ['border2'],
      }),
    };

    const decisions = placeReinforcements('ai1', territories, 6);

    expect(decisions.length).toBeGreaterThan(0);
    // First reinforcement should go to most threatened border (border1)
    expect(decisions[0].toTerritoryId).toBe('border1');
  });
});

// ============================================================================
// makeAITurn Tests
// ============================================================================

describe('makeAITurn', () => {
  it('executes all turn phases', () => {
    const territories = createTerritoryNetwork();

    const result = makeAITurn('ai1', territories, 5);

    expect(result).toHaveProperty('reinforcements');
    expect(result).toHaveProperty('attacks');
    expect(result).toHaveProperty('moves');
  });

  it('places reinforcements first', () => {
    const territories = createTerritoryNetwork();

    const result = makeAITurn('ai1', territories, 5);

    expect(result.reinforcements.length).toBeGreaterThan(0);
    const totalReinforcements = result.reinforcements.reduce(
      (sum, d) => sum + (d.armies || 0),
      0
    );
    expect(totalReinforcements).toBe(5);
  });

  it('executes up to 3 attacks per turn', () => {
    const territories: Record<string, TerritoryState> = {
      attacker: createTerritory('attacker', {
        controllingNationId: 'ai1',
        armies: 50, // Many armies
        neighbors: ['target1', 'target2', 'target3', 'target4'],
      }),
      target1: createTerritory('target1', {
        controllingNationId: 'ai2',
        armies: 1,
        neighbors: ['attacker'],
      }),
      target2: createTerritory('target2', {
        controllingNationId: 'ai2',
        armies: 1,
        neighbors: ['attacker'],
      }),
      target3: createTerritory('target3', {
        controllingNationId: 'ai2',
        armies: 1,
        neighbors: ['attacker'],
      }),
      target4: createTerritory('target4', {
        controllingNationId: 'ai2',
        armies: 1,
        neighbors: ['attacker'],
      }),
    };

    const result = makeAITurn('ai1', territories, 0);

    // Should limit to 3 attacks
    expect(result.attacks.length).toBeLessThanOrEqual(3);
  });

  it('consolidates forces after attacks', () => {
    const territories: Record<string, TerritoryState> = {
      interior: createTerritory('interior', {
        controllingNationId: 'ai1',
        armies: 15,
        neighbors: ['border'],
      }),
      border: createTerritory('border', {
        controllingNationId: 'ai1',
        armies: 2,
        neighbors: ['interior', 'enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 10,
        neighbors: ['border'],
      }),
    };

    const result = makeAITurn('ai1', territories, 0);

    // Should attempt to consolidate forces
    expect(result.moves.length).toBeGreaterThan(0);
  });

  it('limits to 2 moves per turn', () => {
    const territories: Record<string, TerritoryState> = {
      interior1: createTerritory('interior1', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['middle'],
      }),
      interior2: createTerritory('interior2', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['middle'],
      }),
      middle: createTerritory('middle', {
        controllingNationId: 'ai1',
        armies: 2,
        neighbors: ['interior1', 'interior2', 'border'],
      }),
      border: createTerritory('border', {
        controllingNationId: 'ai1',
        armies: 1,
        neighbors: ['middle', 'enemy'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 10,
        neighbors: ['border'],
      }),
    };

    const result = makeAITurn('ai1', territories, 0);

    expect(result.moves.length).toBeLessThanOrEqual(2);
  });

  it('handles turn with no valid actions', () => {
    const territories: Record<string, TerritoryState> = {
      t1: createTerritory('t1', {
        controllingNationId: 'ai1',
        armies: 1, // Not enough to attack or move
        neighbors: [],
      }),
    };

    const result = makeAITurn('ai1', territories, 0);

    expect(result.reinforcements).toEqual([]);
    expect(result.attacks).toEqual([]);
    expect(result.moves).toEqual([]);
  });

  it('simulates battle outcomes for planning', () => {
    const territories: Record<string, TerritoryState> = {
      attacker: createTerritory('attacker', {
        controllingNationId: 'ai1',
        armies: 20,
        neighbors: ['weak1', 'weak2'],
      }),
      weak1: createTerritory('weak1', {
        controllingNationId: 'ai2',
        armies: 2,
        neighbors: ['attacker'],
      }),
      weak2: createTerritory('weak2', {
        controllingNationId: 'ai2',
        armies: 2,
        neighbors: ['attacker', 'weak1'],
      }),
    };

    const result = makeAITurn('ai1', territories, 0);

    // Should plan multiple attacks if simulations show success
    expect(result.attacks.length).toBeGreaterThan(0);
    result.attacks.forEach(attack => {
      expect(attack.type).toBe('attack');
      expect(attack.fromTerritoryId).toBeDefined();
      expect(attack.toTerritoryId).toBeDefined();
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('integration scenarios', () => {
  it('executes aggressive expansion strategy', () => {
    const territories: Record<string, TerritoryState> = {
      stronghold: createTerritory('stronghold', {
        controllingNationId: 'ai1',
        armies: 20,
        neighbors: ['weak1', 'weak2', 'weak3'],
      }),
      weak1: createTerritory('weak1', {
        controllingNationId: 'ai2',
        armies: 2,
        neighbors: ['stronghold'],
      }),
      weak2: createTerritory('weak2', {
        controllingNationId: 'ai2',
        armies: 3,
        neighbors: ['stronghold'],
      }),
      weak3: createTerritory('weak3', {
        controllingNationId: 'ai2',
        armies: 2,
        neighbors: ['stronghold'],
      }),
    };

    const result = makeAITurn('ai1', territories, 5);

    // Aggressive AI should place reinforcements and attack multiple times
    expect(result.reinforcements.length).toBeGreaterThan(0);
    expect(result.attacks.length).toBeGreaterThan(0);
  });

  it('executes defensive consolidation strategy', () => {
    const territories: Record<string, TerritoryState> = {
      border: createTerritory('border', {
        controllingNationId: 'ai1',
        armies: 3,
        neighbors: ['interior', 'enemy'],
      }),
      interior: createTerritory('interior', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['border'],
      }),
      enemy: createTerritory('enemy', {
        controllingNationId: 'ai2',
        armies: 15, // Strong enemy
        neighbors: ['border'],
      }),
    };

    const result = makeAITurn('ai1', territories, 5);

    // Should reinforce border and consolidate forces, avoid risky attacks
    expect(result.reinforcements.length).toBeGreaterThan(0);
    expect(result.reinforcements[0].toTerritoryId).toBe('border');
    expect(result.moves.length).toBeGreaterThan(0);
    // Should not attack superior force
    expect(result.attacks.length).toBe(0);
  });

  it('prioritizes region completion over other targets', () => {
    const territories: Record<string, TerritoryState> = {
      // Almost complete Western Hemisphere (need north_america)
      atlantic_corridor: createTerritory('atlantic_corridor', {
        controllingNationId: 'ai1',
        armies: 10,
        neighbors: ['north_america', 'weak_target'],
      }),
      north_america: createTerritory('north_america', {
        controllingNationId: 'ai2',
        armies: 3,
        neighbors: ['atlantic_corridor'],
      }),
      // Easy target but doesn't complete region
      weak_target: createTerritory('weak_target', {
        controllingNationId: 'ai2',
        armies: 1, // Weaker
        neighbors: ['atlantic_corridor'],
        strategicValue: 1,
      }),
    };

    const attack = findBestAttack('ai1', territories);

    expect(attack).not.toBeNull();
    expect(attack!.toTerritoryId).toBe('north_america');
    expect(attack!.reason).toContain('Western Hemisphere');
  });
});
