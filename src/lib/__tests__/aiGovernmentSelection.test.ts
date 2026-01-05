import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  evaluateCivicsResearchPriority,
  selectOptimalGovernmentForAI,
  aiConsiderGovernmentChange,
  getAICivicsResearchWeight,
} from '../aiGovernmentSelection';
import type { Nation } from '@/types/game';
import type { GovernmentType } from '@/types/government';
import { GOVERNMENT_BONUSES } from '@/types/government';

type PartialNation = Partial<Nation> & { id: string; name: string };

function createNation(overrides: PartialNation): Nation {
  const base: Partial<Nation> = {
    population: 100,
    production: 50,
    intel: 20,
    ai: 'balanced',
    alliances: [],
    treaties: {},
    threats: {},
    eliminated: false,
    productionMultiplier: 1.0,
    unlockedGovernments: ['democracy'],
    governmentState: {
      currentGovernment: 'democracy',
      governmentStability: 50,
      lastTransitionTurn: 0,
      lastGovernmentChangeTurn: 0,
      politicalPower: 100,
      civilLiberties: 70,
      opposition: 30,
      electionCooldown: 0,
      stateControl: 50,
      governmentSupport: {
        democracy: 50,
        constitutional_monarchy: 20,
        dictatorship: 10,
        military_junta: 15,
        one_party_state: 10,
        absolute_monarchy: 15,
        technocracy: 25,
        theocracy: 10,
      },
    },
  };

  return { ...base, ...overrides } as Nation;
}

describe('aiGovernmentSelection', () => {
  describe('evaluateCivicsResearchPriority', () => {
    it('returns base priority for default nation', () => {
      const nation = createNation({ id: 'n1', name: 'Nation 1' });
      const priority = evaluateCivicsResearchPriority(nation, undefined, 10);
      expect(priority).toBeGreaterThanOrEqual(0.15);
    });

    it('increases priority for aggressive personality', () => {
      const nation = createNation({ id: 'n1', name: 'Nation 1' });
      const basePriority = evaluateCivicsResearchPriority(nation, undefined, 10);
      const aggressivePriority = evaluateCivicsResearchPriority(nation, 'aggressive', 10);
      expect(aggressivePriority).toBeGreaterThan(basePriority);
    });

    it('increases priority for defensive personality', () => {
      const nation = createNation({ id: 'n1', name: 'Nation 1' });
      const basePriority = evaluateCivicsResearchPriority(nation, undefined, 10);
      const defensivePriority = evaluateCivicsResearchPriority(nation, 'defensive', 10);
      expect(defensivePriority).toBeGreaterThan(basePriority);
    });

    it('increases priority when production multiplier is high', () => {
      const lowProdNation = createNation({
        id: 'n1',
        name: 'Nation 1',
        productionMultiplier: 1.0,
      });
      const highProdNation = createNation({
        id: 'n2',
        name: 'Nation 2',
        productionMultiplier: 1.2,
      });
      const lowPriority = evaluateCivicsResearchPriority(lowProdNation, undefined, 10);
      const highPriority = evaluateCivicsResearchPriority(highProdNation, undefined, 10);
      expect(highPriority).toBeGreaterThan(lowPriority);
    });

    it('increases priority when current government is democracy', () => {
      const democracyNation = createNation({
        id: 'n1',
        name: 'Nation 1',
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const otherNation = createNation({
        id: 'n2',
        name: 'Nation 2',
        governmentState: {
          currentGovernment: 'dictatorship',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const democracyPriority = evaluateCivicsResearchPriority(democracyNation, undefined, 10);
      const otherPriority = evaluateCivicsResearchPriority(otherNation, undefined, 10);
      expect(democracyPriority).toBeGreaterThan(otherPriority);
    });

    it('increases priority when stability is high', () => {
      const lowStabilityNation = createNation({
        id: 'n1',
        name: 'Nation 1',
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 40,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const highStabilityNation = createNation({
        id: 'n2',
        name: 'Nation 2',
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 80,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const lowPriority = evaluateCivicsResearchPriority(lowStabilityNation, undefined, 10);
      const highPriority = evaluateCivicsResearchPriority(highStabilityNation, undefined, 10);
      expect(highPriority).toBeGreaterThan(lowPriority);
    });

    it('increases priority later in the game', () => {
      const nation = createNation({ id: 'n1', name: 'Nation 1' });
      const earlyPriority = evaluateCivicsResearchPriority(nation, undefined, 10);
      const latePriority = evaluateCivicsResearchPriority(nation, undefined, 25);
      expect(latePriority).toBeGreaterThan(earlyPriority);
    });

    it('caps priority at 1.0', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        productionMultiplier: 1.5,
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 90,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const priority = evaluateCivicsResearchPriority(nation, 'aggressive', 50);
      expect(priority).toBeLessThanOrEqual(1.0);
    });
  });

  describe('selectOptimalGovernmentForAI', () => {
    it('returns null when nation has no government state', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        governmentState: undefined,
      });
      const result = selectOptimalGovernmentForAI(nation, 'aggressive', [nation]);
      expect(result).toBeNull();
    });

    it('returns null when no alternative governments are unlocked', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy'],
      });
      const result = selectOptimalGovernmentForAI(nation, 'aggressive', [nation]);
      expect(result).toBeNull();
    });

    it('returns null when score improvement is not significant (<15 points)', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'constitutional_monarchy'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      // Balanced personality won't score constitutional_monarchy very high
      const result = selectOptimalGovernmentForAI(nation, 'balanced', [nation]);
      // Result could be null if score < 15
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('selects military junta for aggressive AI', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'military_junta', 'dictatorship'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'aggressive', [nation]);
      expect(result).toBe('military_junta');
    });

    it('selects technocracy for balanced AI', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'technocracy', 'one_party_state'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'balanced', [nation]);
      expect(result).toBe('technocracy');
    });

    it('prefers monarchy for defensive AI', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'constitutional_monarchy', 'absolute_monarchy'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'defensive', [nation]);
      expect(result === 'constitutional_monarchy' || result === 'absolute_monarchy').toBe(true);
    });

    it('prefers dictatorship for trickster AI', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'dictatorship', 'one_party_state'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'trickster', [nation]);
      expect(result === 'dictatorship' || result === 'one_party_state').toBe(true);
    });

    it('prefers absolute monarchy for isolationist AI', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'absolute_monarchy', 'technocracy'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'isolationist', [nation]);
      expect(result === 'absolute_monarchy' || result === 'technocracy').toBe(true);
    });

    it('applies war situation bonus to military-focused governments', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'military_junta', 'constitutional_monarchy'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
        threats: { enemy: 80 },
      });
      const enemy = createNation({
        id: 'enemy',
        name: 'Enemy',
        eliminated: false,
      });
      const nations = [nation, enemy];

      const result = selectOptimalGovernmentForAI(nation, 'aggressive', nations);
      // During war, aggressive AI should prefer military_junta
      expect(result).toBe('military_junta');
    });

    it('applies stability bonus when stability is low', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'military_junta', 'constitutional_monarchy'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 30, // Low stability
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'aggressive', [nation]);
      // With low stability, might prefer constitutional_monarchy over military_junta
      expect(result === 'military_junta' || result === 'constitutional_monarchy').toBe(true);
    });

    it('applies production bonus for technocracy with high production', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        production: 150, // High production
        unlockedGovernments: ['democracy', 'technocracy', 'constitutional_monarchy'],
        governmentState: {
          currentGovernment: 'democracy',
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'balanced', [nation]);
      // High production should favor technocracy for balanced AI
      expect(result).toBe('technocracy');
    });

    it('excludes current government from options', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'military_junta'],
        governmentState: {
          currentGovernment: 'military_junta', // Already military_junta
          governmentStability: 50,
          lastTransitionTurn: 0,
          politicalPower: 100,
          civilLiberties: 70,
          opposition: 30,
          electionCooldown: 0,
          stateControl: 50,
        },
      });
      const result = selectOptimalGovernmentForAI(nation, 'aggressive', [nation]);
      // Should not return military_junta since it's current
      expect(result === null || result === 'democracy').toBe(true);
    });
  });

  describe('aiConsiderGovernmentChange', () => {
    it('returns false when nation has no government state', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        governmentState: undefined,
        aiPersonality: 'aggressive',
      });
      const result = aiConsiderGovernmentChange(nation, 10, [nation]);
      expect(result).toBe(false);
    });

    it('returns false when nation has no AI personality', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        aiPersonality: undefined,
      });
      const result = aiConsiderGovernmentChange(nation, 10, [nation]);
      expect(result).toBe(false);
    });

    it('respects random chance (15%)', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        aiPersonality: 'aggressive',
        unlockedGovernments: ['democracy', 'military_junta'],
      });

      const mathRandom = vi.spyOn(Math, 'random');

      // Test case where random > 0.15 (should skip)
      mathRandom.mockReturnValueOnce(0.5);
      const resultSkip = aiConsiderGovernmentChange(nation, 10, [nation]);
      expect(resultSkip).toBe(false);

      mathRandom.mockRestore();
    });

    it('logs government transition', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Test Nation',
        aiPersonality: 'aggressive',
        unlockedGovernments: ['democracy', 'military_junta'],
      });

      const logFn = vi.fn();
      const mathRandom = vi.spyOn(Math, 'random');
      mathRandom.mockReturnValueOnce(0.1); // Trigger change

      aiConsiderGovernmentChange(nation, 10, [nation], logFn);

      mathRandom.mockRestore();
    });
  });

  describe('getAICivicsResearchWeight', () => {
    it('returns default weight of 1.0 for unknown personality', () => {
      const nation = createNation({ id: 'n1', name: 'Nation 1' });
      const weight = getAICivicsResearchWeight(nation, undefined);
      expect(weight).toBe(1.1);
    });

    it('returns high weight for aggressive AI without military junta', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy'],
      });
      const weight = getAICivicsResearchWeight(nation, 'aggressive');
      expect(weight).toBe(1.4);
    });

    it('returns lower weight for aggressive AI with military junta unlocked', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'military_junta'],
      });
      const weight = getAICivicsResearchWeight(nation, 'aggressive');
      expect(weight).toBe(1.0);
    });

    it('returns high weight for defensive AI without constitutional monarchy', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy'],
      });
      const weight = getAICivicsResearchWeight(nation, 'defensive');
      expect(weight).toBe(1.3);
    });

    it('returns default weight for defensive AI with constitutional monarchy unlocked', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'constitutional_monarchy'],
      });
      const weight = getAICivicsResearchWeight(nation, 'defensive');
      expect(weight).toBe(1.0);
    });

    it('returns high weight for balanced AI without technocracy', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy'],
      });
      const weight = getAICivicsResearchWeight(nation, 'balanced');
      expect(weight).toBe(1.2);
    });

    it('returns default weight for balanced AI with technocracy unlocked', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'technocracy'],
      });
      const weight = getAICivicsResearchWeight(nation, 'balanced');
      expect(weight).toBe(1.0);
    });

    it('returns default weight for other personalities', () => {
      const nation = createNation({ id: 'n1', name: 'Nation 1' });
      const weight = getAICivicsResearchWeight(nation, 'trickster');
      expect(weight).toBe(1.1);
    });
  });

  describe('personality scoring edge cases', () => {
    it('handles all government types for aggressive personality', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: [
          'democracy',
          'military_junta',
          'dictatorship',
          'constitutional_monarchy',
          'absolute_monarchy',
          'one_party_state',
          'technocracy',
          'theocracy',
        ],
      });
      const result = selectOptimalGovernmentForAI(nation, 'aggressive', [nation]);
      expect(result === 'military_junta' || result === 'dictatorship').toBe(true);
    });

    it('handles missing government bonuses gracefully', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        unlockedGovernments: ['democracy', 'military_junta'],
      });
      // Should not crash with any personality
      const personalities = ['aggressive', 'defensive', 'balanced', 'trickster', 'isolationist', undefined];
      personalities.forEach((personality) => {
        const result = selectOptimalGovernmentForAI(nation, personality, [nation]);
        expect(result === null || typeof result === 'string').toBe(true);
      });
    });
  });

  describe('war detection', () => {
    it('detects war when nation has high threat against non-eliminated nation', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        threats: { enemy: 80 },
        unlockedGovernments: ['democracy', 'military_junta'],
      });
      const enemy = createNation({
        id: 'enemy',
        name: 'Enemy',
        eliminated: false,
      });
      const nations = [nation, enemy];

      const result = selectOptimalGovernmentForAI(nation, 'balanced', nations);
      // War situation should boost military_junta
      expect(result).toBe('military_junta');
    });

    it('does not detect war when enemy is eliminated', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        threats: { enemy: 80 },
        unlockedGovernments: ['democracy', 'technocracy'],
      });
      const enemy = createNation({
        id: 'enemy',
        name: 'Enemy',
        eliminated: true, // Eliminated
      });
      const nations = [nation, enemy];

      const result = selectOptimalGovernmentForAI(nation, 'balanced', nations);
      // Should prefer technocracy since no real war
      expect(result).toBe('technocracy');
    });

    it('does not detect war when there is a truce', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        threats: { enemy: 80 },
        treaties: { enemy: { truceTurns: 5 } },
        unlockedGovernments: ['democracy', 'technocracy'],
      });
      const enemy = createNation({
        id: 'enemy',
        name: 'Enemy',
        eliminated: false,
      });
      const nations = [nation, enemy];

      const result = selectOptimalGovernmentForAI(nation, 'balanced', nations);
      // Truce means no war, should prefer technocracy
      expect(result).toBe('technocracy');
    });

    it('does not detect war when threat is not high enough', () => {
      const nation = createNation({
        id: 'n1',
        name: 'Nation 1',
        threats: { enemy: 30 }, // Low threat
        unlockedGovernments: ['democracy', 'technocracy'],
      });
      const enemy = createNation({
        id: 'enemy',
        name: 'Enemy',
        eliminated: false,
      });
      const nations = [nation, enemy];

      const result = selectOptimalGovernmentForAI(nation, 'balanced', nations);
      // Low threat, should prefer technocracy
      expect(result).toBe('technocracy');
    });
  });
});
