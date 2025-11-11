import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { calculateMissileLaunchConsequences } from '@/lib/consequenceCalculator';
import type { ActionConsequences, ConsequenceCalculationContext } from '@/types/consequences';
import type { Nation, GameState } from '@/types/game';

const createContext = (overrides?: Partial<Nation>): ConsequenceCalculationContext => {
  const playerNation: Nation = {
    id: 'player',
    isPlayer: true,
    name: 'Player State',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#fff',
    population: 150,
    missiles: 8,
    bombers: 4,
    submarines: 2,
    defense: 12,
    instability: 12,
    production: 200,
    uranium: 50,
    intel: 40,
    warheads: { 5: 2, 10: 1 },
    alliances: ['Ally One'],
    morale: 70,
    publicOpinion: 60,
    electionTimer: 0,
    cabinetApproval: 65,
  };

  const targetNation: Nation = {
    id: 'target',
    isPlayer: false,
    name: 'Target Nation',
    leader: 'Target Leader',
    lon: 10,
    lat: 20,
    color: '#f00',
    population: 180,
    missiles: 3,
    bombers: 1,
    submarines: 0,
    defense: 14,
    instability: 22,
    production: 140,
    uranium: 30,
    intel: 25,
    warheads: { 5: 3, 15: 1 },
    alliances: ['Bloc One', 'Bloc Two', 'Bloc Three'],
    morale: 65,
    publicOpinion: 55,
    electionTimer: 0,
    cabinetApproval: 60,
    ...overrides,
  };

  const neutralNation: Nation = {
    id: 'neutral',
    isPlayer: false,
    name: 'Neutral Observer',
    leader: 'Neutral Leader',
    lon: -5,
    lat: -12,
    color: '#0f0',
    population: 90,
    missiles: 2,
    bombers: 1,
    submarines: 0,
    defense: 8,
    instability: 18,
    production: 110,
    uranium: 15,
    intel: 18,
    warheads: { 5: 1 },
    alliances: ['Bloc Two'],
    morale: 72,
    publicOpinion: 68,
    electionTimer: 0,
    cabinetApproval: 70,
  };

  const gameState = {
    globalRadiation: 0.3,
    nuclearWinterLevel: 0.25,
  } as unknown as GameState;

  return {
    playerNation,
    targetNation,
    allNations: [playerNation, targetNation, neutralNation],
    currentDefcon: 3,
    currentTurn: 12,
    gameState,
  };
};

describe('calculateMissileLaunchConsequences', () => {
  const originalRandom = Math.random;

  beforeEach(() => {
    Math.random = () => 0.42;
  });

  afterEach(() => {
    Math.random = originalRandom;
  });

  it('injects harrowing long-term fallout and emotionally charged warnings', () => {
    const context = createContext();
    const consequences = calculateMissileLaunchConsequences(context, 12, 'missile');

    const radiation = consequences.longTerm.find((entry) =>
      entry.description.includes('Radiation burns')
    );
    expect(radiation).toBeDefined();
    expect(radiation?.probability).toBeGreaterThan(50);

    const healthCollapse = consequences.longTerm.find((entry) =>
      entry.description.includes("health system collapses")
    );
    expect(healthCollapse).toBeDefined();
    expect(healthCollapse?.probability).toBeGreaterThan(30);

    const famine = consequences.longTerm.find((entry) =>
      entry.description.includes('famine')
    );
    expect(famine).toBeDefined();
    expect(famine?.probability).toBeGreaterThan(15);

    expect(
      consequences.risks.some((risk) => risk.description.includes('Diplomatic collapse looms'))
    ).toBe(true);
    expect(
      consequences.risks.some((risk) => risk.description.includes('Environmental catastrophe'))
    ).toBe(true);

    expect(consequences.warnings).toContain(
      'Diplomatic backchannels are shattering—ambassadors are calling for evacuations in tears.'
    );
    expect(consequences.warnings).toContain(
      'Scientists whisper about black rain and poisoned oceans—this launch could make their nightmares real.'
    );
  });

  it('scales horror probabilities with warhead yield and nation stats', () => {
    const context = createContext();

    const modestStrike = calculateMissileLaunchConsequences(context, 5, 'missile');
    const doomsdayStrike = calculateMissileLaunchConsequences(context, 20, 'missile');

    const modestRadiation = modestStrike.longTerm.find((entry) =>
      entry.description.includes('Radiation burns')
    ) as ActionConsequences['longTerm'][number];
    const apocalypticRadiation = doomsdayStrike.longTerm.find((entry) =>
      entry.description.includes('Radiation burns')
    ) as ActionConsequences['longTerm'][number];

    expect(apocalypticRadiation.probability ?? 0).toBeGreaterThan(
      modestRadiation.probability ?? 0
    );

    const modestEnvironmental = modestStrike.risks.find((entry) =>
      entry.description.includes('Environmental catastrophe')
    );
    const apocalypticEnvironmental = doomsdayStrike.risks.find((entry) =>
      entry.description.includes('Environmental catastrophe')
    );

    expect(apocalypticEnvironmental?.probability ?? 0).toBeGreaterThan(
      modestEnvironmental?.probability ?? 0
    );
  });
});

