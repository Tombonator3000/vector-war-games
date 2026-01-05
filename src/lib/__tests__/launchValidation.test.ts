/**
 * Tests for Launch Validation Module
 *
 * Ensures validation logic is correct and maintains behavior from original implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateTreaty,
  validateAlliance,
  validateDefcon,
  validateWarheads,
  validateResearch,
  validateMissiles,
  validateLaunch,
} from '../launchValidation';
import type { Nation } from '@/types/Nation';

// Helper function to create a minimal nation for testing
function createNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'test-nation',
    name: 'Test Nation',
    color: '#FF0000',
    lon: 0,
    lat: 0,
    gdp: 1000,
    nukes: 10,
    missiles: 5,
    warheads: { 5: 3, 50: 2, 100: 1 },
    researched: {},
    treaties: {},
    alliances: [],
    isPlayer: false,
    ...overrides,
  } as Nation;
}

describe('launchValidation', () => {
  describe('validateTreaty', () => {
    it('should allow launch when no truce is active', () => {
      const from = createNation();
      const to = createNation({ id: 'target' });

      const result = validateTreaty(from, to);

      expect(result.valid).toBe(true);
    });

    it('should block launch when truce is active', () => {
      const to = createNation({ id: 'target', name: 'Target Nation' });
      const from = createNation({
        treaties: {
          target: { truceTurns: 5 },
        },
      });

      const result = validateTreaty(from, to);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('truce active');
    });
  });

  describe('validateAlliance', () => {
    it('should allow launch when no alliance exists', () => {
      const from = createNation();
      const to = createNation({ id: 'target' });

      const result = validateAlliance(from, to);

      expect(result.valid).toBe(true);
    });

    it('should block launch when treaty alliance exists (from -> to)', () => {
      const to = createNation({ id: 'target', name: 'Target Nation' });
      const from = createNation({
        treaties: {
          target: { alliance: true },
        },
      });

      const result = validateAlliance(from, to);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('alliance active');
    });

    it('should block launch when treaty alliance exists (to -> from)', () => {
      const from = createNation({ id: 'attacker' });
      const to = createNation({
        id: 'target',
        name: 'Target Nation',
        treaties: {
          attacker: { alliance: true },
        },
      });

      const result = validateAlliance(from, to);

      expect(result.valid).toBe(false);
    });

    it('should block launch when alliance exists in alliances array', () => {
      const to = createNation({ id: 'target', name: 'Target Nation' });
      const from = createNation({
        alliances: ['target'],
      });

      const result = validateAlliance(from, to);

      expect(result.valid).toBe(false);
    });

    it('should require toast for player', () => {
      const to = createNation({ id: 'target', name: 'Target Nation' });
      const from = createNation({
        isPlayer: true,
        alliances: ['target'],
      });

      const result = validateAlliance(from, to);

      expect(result.valid).toBe(false);
      expect(result.requiresToast).toBe(true);
      expect(result.toastConfig).toBeDefined();
    });
  });

  describe('validateDefcon', () => {
    it('should allow strategic weapons at DEFCON 1', () => {
      const result = validateDefcon(100, 1);
      expect(result.valid).toBe(true);
    });

    it('should block strategic weapons at DEFCON 2', () => {
      const result = validateDefcon(100, 2);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('DEFCON 1');
    });

    it('should allow tactical nukes at DEFCON 2', () => {
      const result = validateDefcon(50, 2);
      expect(result.valid).toBe(true);
    });

    it('should allow tactical nukes at DEFCON 1', () => {
      const result = validateDefcon(50, 1);
      expect(result.valid).toBe(true);
    });

    it('should block tactical nukes at DEFCON 3', () => {
      const result = validateDefcon(50, 3);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('DEFCON 2');
    });
  });

  describe('validateWarheads', () => {
    it('should allow launch when warheads available', () => {
      const from = createNation({
        warheads: { 50: 5 },
      });

      const result = validateWarheads(from, 50);

      expect(result.valid).toBe(true);
    });

    it('should block launch when warheads not available', () => {
      const from = createNation({
        warheads: { 50: 0 },
      });

      const result = validateWarheads(from, 50);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('No warheads');
    });

    it('should block launch when warhead type does not exist', () => {
      const from = createNation({
        warheads: { 50: 5 },
      });

      const result = validateWarheads(from, 100);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateResearch', () => {
    it('should allow launch when no research required', () => {
      const from = createNation();
      const warheadYieldToId = new Map();
      const researchLookup = {};

      const result = validateResearch(from, 50, warheadYieldToId, researchLookup);

      expect(result.valid).toBe(true);
    });

    it('should allow launch when research is completed', () => {
      const from = createNation({
        researched: { 'research-100mt': true },
      });
      const warheadYieldToId = new Map([[100, 'research-100mt']]);
      const researchLookup = { 'research-100mt': { name: '100MT Program' } };

      const result = validateResearch(from, 100, warheadYieldToId, researchLookup);

      expect(result.valid).toBe(true);
    });

    it('should block launch when research is not completed', () => {
      const from = createNation({
        researched: {},
      });
      const warheadYieldToId = new Map([[100, 'research-100mt']]);
      const researchLookup = { 'research-100mt': { name: '100MT Program' } };

      const result = validateResearch(from, 100, warheadYieldToId, researchLookup);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('100MT Program');
    });

    it('should require toast for player', () => {
      const from = createNation({
        isPlayer: true,
        researched: {},
      });
      const warheadYieldToId = new Map([[100, 'research-100mt']]);
      const researchLookup = { 'research-100mt': { name: '100MT Program' } };

      const result = validateResearch(from, 100, warheadYieldToId, researchLookup);

      expect(result.valid).toBe(false);
      expect(result.requiresToast).toBe(true);
      expect(result.toastConfig).toBeDefined();
    });
  });

  describe('validateMissiles', () => {
    it('should allow launch when missiles available', () => {
      const from = createNation({ missiles: 5 });

      const result = validateMissiles(from);

      expect(result.valid).toBe(true);
    });

    it('should block launch when no missiles available', () => {
      const from = createNation({ missiles: 0 });

      const result = validateMissiles(from);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('No missiles');
    });
  });

  describe('validateLaunch', () => {
    it('should validate successful launch', () => {
      const from = createNation({
        missiles: 5,
        warheads: { 50: 3 },
        researched: {},
      });
      const to = createNation({ id: 'target' });

      const result = validateLaunch({
        from,
        to,
        yieldMT: 50,
        defcon: 2,
        warheadYieldToId: new Map(),
        researchLookup: {},
      });

      expect(result.valid).toBe(true);
    });

    it('should fail on first validation error (truce)', () => {
      const to = createNation({ id: 'target', name: 'Target Nation' });
      const from = createNation({
        missiles: 5,
        warheads: { 50: 3 },
        treaties: {
          target: { truceTurns: 5 },
        },
      });

      const result = validateLaunch({
        from,
        to,
        yieldMT: 50,
        defcon: 2,
        warheadYieldToId: new Map(),
        researchLookup: {},
      });

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('truce');
    });

    it('should fail on DEFCON check', () => {
      const from = createNation({
        missiles: 5,
        warheads: { 100: 3 },
      });
      const to = createNation({ id: 'target' });

      const result = validateLaunch({
        from,
        to,
        yieldMT: 100,
        defcon: 2, // Strategic weapons require DEFCON 1
        warheadYieldToId: new Map(),
        researchLookup: {},
      });

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('DEFCON 1');
    });

    it('should fail on missing missiles', () => {
      const from = createNation({
        missiles: 0,
        warheads: { 50: 3 },
      });
      const to = createNation({ id: 'target' });

      const result = validateLaunch({
        from,
        to,
        yieldMT: 50,
        defcon: 2,
        warheadYieldToId: new Map(),
        researchLookup: {},
      });

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('No missiles');
    });
  });
});
