import { describe, expect, it, beforeEach } from 'vitest';
import { migrateGameSystems, needsMigration, getMigrationStatus, validateMigration } from '@/lib/unifiedGameMigration';
import type { Nation, GameState } from '@/types/game';

function createTestNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: overrides.id || 'test-nation',
    name: overrides.name || 'Test Nation',
    leader: overrides.leader || 'Test Leader',
    isPlayer: false,
    lon: 0,
    lat: 0,
    color: '#00ffff',
    population: 100,
    missiles: 10,
    defense: 5,
    production: 50,
    uranium: 10,
    intel: 20,
    warheads: {},
    morale: 70,
    publicOpinion: 60,
    electionTimer: 10,
    cabinetApproval: 55,
    cities: 0,
    ...overrides,
  };
}

function createTestGameState(): GameState {
  const testNation = createTestNation();
  return {
    turn: 1,
    phase: 'PLAYER' as const,
    defcon: 5,
    actionsRemaining: 3,
    paused: false,
    gameOver: false,
    selectedLeader: 'test',
    selectedDoctrine: 'convergence',
    nations: [testNation],
    missiles: [],
    bombers: [],
    submarines: [],
    explosions: [],
    particles: [],
    radiationZones: [],
    empEffects: [],
    rings: [],
    screenShake: 0,
    falloutMarks: [],
    satelliteOrbits: [],
  };
}

describe('unifiedGameMigration', () => {
  describe('needsMigration', () => {
    it('detects nation needing diplomacy migration', () => {
      const nation = createTestNation();
      const result = needsMigration(nation);

      expect(result.needsDiplomacyMigration).toBe(true);
      expect(result.needsAnyMigration).toBe(true);
    });

    it('detects nation needing pop migration', () => {
      const nation = createTestNation({
        relationships: { 'nation-2': 50 },
      });
      const result = needsMigration(nation);

      expect(result.needsPopMigration).toBe(true);
      expect(result.needsAnyMigration).toBe(true);
    });

    it('detects fully migrated nation', () => {
      const nation = createTestNation({
        relationships: { 'nation-2': 50 },
        popGroups: [
          {
            id: 'pop-1',
            size: 100,
            origin: 'Test Nation',
            loyalty: 90,
            culture: 'Test Culture',
            skills: 'medium',
            assimilation: 100,
            happiness: 80,
            yearsSinceArrival: 0,
          },
        ],
      });
      const result = needsMigration(nation);

      expect(result.needsDiplomacyMigration).toBe(false);
      expect(result.needsPopMigration).toBe(false);
      expect(result.needsAnyMigration).toBe(false);
    });
  });

  describe('getMigrationStatus', () => {
    it('correctly counts nations needing migration', () => {
      const nations = [
        createTestNation({ id: 'nation-1', name: 'Nation 1' }),
        createTestNation({
          id: 'nation-2',
          name: 'Nation 2',
          relationships: { 'nation-1': 50 },
        }),
        createTestNation({
          id: 'nation-3',
          name: 'Nation 3',
          relationships: { 'nation-1': 30 },
          popGroups: [
            {
              id: 'pop-1',
              size: 50,
              origin: 'Nation 3',
              loyalty: 85,
              culture: 'Culture 3',
              skills: 'high',
              assimilation: 95,
              happiness: 75,
              yearsSinceArrival: 0,
            },
          ],
        }),
      ];

      const status = getMigrationStatus(nations);

      expect(status.totalNations).toBe(3);
      expect(status.needingDiplomacyMigration).toBe(1);
      expect(status.needingPopMigration).toBe(2);
      expect(status.fullyMigrated).toBe(1);
    });

    it('ignores eliminated nations', () => {
      const nations = [
        createTestNation({ id: 'nation-1', eliminated: true }),
        createTestNation({ id: 'nation-2' }),
      ];

      const status = getMigrationStatus(nations);

      expect(status.needingDiplomacyMigration).toBe(1);
      expect(status.needingPopMigration).toBe(1);
    });
  });

  describe('validateMigration', () => {
    it('validates successful migration', () => {
      const nation = createTestNation({
        relationships: { 'nation-2': 0 },
        popGroups: [
          {
            id: 'pop-1',
            size: 100,
            origin: 'Test Nation',
            loyalty: 90,
            culture: 'Test Culture',
            skills: 'medium',
            assimilation: 100,
            happiness: 80,
            yearsSinceArrival: 0,
          },
        ],
        culturalIdentity: 'Test Culture',
        currentImmigrationPolicy: 'selective',
      });

      const validation = validateMigration([nation]);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('detects missing relationships', () => {
      const nation = createTestNation({
        popGroups: [
          {
            id: 'pop-1',
            size: 100,
            origin: 'Test Nation',
            loyalty: 90,
            culture: 'Test Culture',
            skills: 'medium',
            assimilation: 100,
            happiness: 80,
            yearsSinceArrival: 0,
          },
        ],
      });
      delete (nation as any).relationships;

      const validation = validateMigration([nation]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Test Nation: Missing relationships object');
    });

    it('detects missing popGroups', () => {
      const nation = createTestNation({
        relationships: { 'nation-2': 0 },
      });
      delete (nation as any).popGroups;

      const validation = validateMigration([nation]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Test Nation: Missing popGroups array');
    });

    it('generates warnings for incomplete data', () => {
      const nation = createTestNation({
        relationships: {},
        popGroups: [],
      });

      const validation = validateMigration([nation]);

      expect(validation.isValid).toBe(true); // No errors, just warnings
      expect(validation.warnings).toContain('Test Nation: No relationships initialized');
      expect(validation.warnings).toContain('Test Nation: No pop groups initialized');
      expect(validation.warnings).toContain('Test Nation: Missing culturalIdentity');
      expect(validation.warnings).toContain('Test Nation: Missing currentImmigrationPolicy');
    });
  });

  describe('migrateGameSystems', () => {
    it('initializes popGroups for nations without them', () => {
      const nations = [
        createTestNation({
          id: 'nation-1',
          name: 'USA',
          population: 100,
        }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      expect(result.nations[0].popGroups).toBeDefined();
      expect(result.nations[0].popGroups!.length).toBeGreaterThan(0);
    });

    it('initializes relationships for nations without them', () => {
      const nations = [
        createTestNation({ id: 'nation-1', name: 'USA' }),
        createTestNation({ id: 'nation-2', name: 'Russia' }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      expect(result.nations[0].relationships).toBeDefined();
      expect(result.nations[1].relationships).toBeDefined();
    });

    it('sets default immigration policy', () => {
      const nations = [
        createTestNation({
          id: 'nation-1',
          name: 'USA',
          population: 100,
        }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      expect(result.nations[0].currentImmigrationPolicy).toBeDefined();
      expect(['closed_borders', 'selective', 'humanitarian', 'open_borders', 'cultural_exchange', 'brain_drain_ops'])
        .toContain(result.nations[0].currentImmigrationPolicy);
    });

    it('sets cultural identity from nation name', () => {
      const nations = [
        createTestNation({
          id: 'nation-1',
          name: 'France',
          population: 80,
        }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      expect(result.nations[0].culturalIdentity).toBe('France');
    });

    it('initializes cultural power based on nation size and intel', () => {
      const nations = [
        createTestNation({
          id: 'nation-1',
          name: 'USA',
          population: 200,
          intel: 100,
        }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      expect(result.nations[0].culturalPower).toBeGreaterThan(0);
      expect(result.nations[0].culturalPower).toBeLessThanOrEqual(100);
    });

    it('does not re-migrate already migrated nations', () => {
      const existingPopGroups = [
        {
          id: 'existing-pop',
          size: 150,
          origin: 'USA',
          loyalty: 95,
          culture: 'American',
          skills: 'high' as const,
          assimilation: 100,
          happiness: 85,
          yearsSinceArrival: 10,
        },
      ];

      const nations = [
        createTestNation({
          id: 'nation-1',
          name: 'USA',
          population: 150,
          popGroups: existingPopGroups,
          relationships: { 'nation-2': 50 },
          culturalIdentity: 'American',
          currentImmigrationPolicy: 'open_borders',
        }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      // Should keep existing data
      expect(result.nations[0].popGroups).toEqual(existingPopGroups);
      expect(result.nations[0].culturalIdentity).toBe('American');
      expect(result.nations[0].currentImmigrationPolicy).toBe('open_borders');
    });

    it('handles eliminated nations gracefully', () => {
      const nations = [
        createTestNation({
          id: 'nation-1',
          name: 'Eliminated',
          eliminated: true,
        }),
        createTestNation({
          id: 'nation-2',
          name: 'Active',
          population: 100,
        }),
      ];

      const gameState = createTestGameState();
      const result = migrateGameSystems(nations, gameState);

      // Eliminated nation should not have popGroups initialized
      expect(result.nations[0].popGroups).toBeUndefined();

      // Active nation should be migrated
      expect(result.nations[1].popGroups).toBeDefined();
    });
  });
});
