import { describe, it, expect } from 'vitest';
import {
  calculatePublicOpinion,
  buildPublicOpinionAggregates,
  runElection,
  type PublicOpinionFactors,
} from '../electionSystem';
import type { Nation } from '../../types/game';
import { SCENARIOS } from '../../types/scenario';

const coldWarConfig = SCENARIOS.coldWar.electionConfig;

const usa: Nation = {
  id: 'player',
  isPlayer: true,
  name: 'United States',
  leader: 'John F. Kennedy',
  lon: -95,
  lat: 39,
  color: '#0047AB',
  population: 186,
  missiles: 25,
  bombers: 15,
  submarines: 5,
  defense: 8,
  instability: 0,
  production: 40,
  uranium: 30,
  intel: 15,
  cities: 2,
  warheads: { 20: 15, 50: 10, 100: 5 },
  treaties: {},
  threats: {},
  morale: 72,
  publicOpinion: 68,
  electionTimer: 0,
  cabinetApproval: 64,
  alliances: [],
};

const ussr: Nation = {
  id: 'ussr',
  isPlayer: false,
  name: 'Soviet Union',
  leader: 'Nikita Khrushchev',
  lon: 37,
  lat: 55,
  color: '#CC0000',
  population: 220,
  missiles: 10,
  bombers: 12,
  submarines: 4,
  defense: 10,
  instability: 5,
  production: 35,
  uranium: 25,
  intel: 12,
  cities: 2,
  warheads: { 20: 8, 50: 12, 100: 8 },
  treaties: {},
  threats: {},
  morale: 68,
  publicOpinion: 60,
  electionTimer: 0,
  cabinetApproval: 55,
  alliances: ['cuba'],
};

const cuba: Nation = {
  id: 'cuba',
  isPlayer: false,
  name: 'Cuba',
  leader: 'Fidel Castro',
  lon: -79,
  lat: 21,
  color: '#0BDA51',
  population: 7,
  missiles: 2,
  bombers: 1,
  submarines: 0,
  defense: 4,
  instability: 10,
  production: 8,
  uranium: 5,
  intel: 8,
  cities: 1,
  warheads: { 20: 2 },
  treaties: {},
  threats: {},
  morale: 65,
  publicOpinion: 70,
  electionTimer: 0,
  cabinetApproval: 58,
  alliances: ['ussr'],
};

const coldWarNations = [usa, ussr, cuba];

describe('calculatePublicOpinion', () => {
  it('keeps the United States near its seeded Cold War opinion on the first turn', () => {
    const aggregates = buildPublicOpinionAggregates(coldWarNations, coldWarConfig);
    const opinion = calculatePublicOpinion(usa, coldWarConfig, aggregates[usa.id]);
    expect(Math.abs(opinion - usa.publicOpinion)).toBeLessThanOrEqual(10);
  });

  it('keeps the Soviet Union near its seeded Cold War opinion on the first turn', () => {
    const aggregates = buildPublicOpinionAggregates(coldWarNations, coldWarConfig);
    const opinion = calculatePublicOpinion(ussr, coldWarConfig, aggregates[ussr.id]);
    expect(Math.abs(opinion - ussr.publicOpinion)).toBeLessThanOrEqual(15);
  });
});

describe('runElection foreign influence parity', () => {
  const config = {
    interval: 4,
    enabled: true,
    minMoraleThreshold: 30,
    minPublicOpinionThreshold: 25,
    actionInfluenceMultiplier: 1,
    foreignInfluenceEnabled: true,
    loseElectionConsequence: 'leaderChange' as const,
  };

  const playerNation: Nation = {
    id: 'player',
    isPlayer: true,
    name: 'Player Nation',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#fff',
    population: 100,
    missiles: 5,
    bombers: 3,
    submarines: 1,
    defense: 6,
    instability: 10,
    production: 40,
    uranium: 15,
    intel: 20,
    cities: 2,
    warheads: { 20: 5 },
    treaties: {},
    threats: {},
    morale: 60,
    publicOpinion: 55,
    electionTimer: 0,
    cabinetApproval: 55,
    alliances: [],
  };

  const hostileNation: Nation = {
    id: 'hostile',
    isPlayer: false,
    name: 'Hostile Power',
    leader: 'Rival',
    lon: 10,
    lat: 10,
    color: '#f00',
    population: 120,
    missiles: 4,
    bombers: 4,
    submarines: 1,
    defense: 5,
    instability: 5,
    production: 35,
    uranium: 10,
    intel: 40,
    cities: 1,
    warheads: { 20: 4 },
    treaties: {},
    threats: { player: 80 },
    morale: 55,
    publicOpinion: 50,
    electionTimer: 0,
    cabinetApproval: 50,
    alliances: [],
  };

  const neutralNation: Nation = {
    id: 'neutral',
    isPlayer: false,
    name: 'Neutral Ally',
    leader: 'Friend',
    lon: -10,
    lat: 5,
    color: '#0f0',
    population: 80,
    missiles: 2,
    bombers: 1,
    submarines: 0,
    defense: 3,
    instability: 12,
    production: 25,
    uranium: 8,
    intel: 10,
    cities: 1,
    warheads: { 20: 2 },
    treaties: {},
    threats: {},
    morale: 58,
    publicOpinion: 52,
    electionTimer: 0,
    cabinetApproval: 54,
    alliances: ['player'],
  };

  const nations = [playerNation, hostileNation, neutralNation];

  const legacyGetPublicOpinionFactors = (
    nation: Nation,
    allNations: Nation[],
    electionConfig: typeof config
  ): PublicOpinionFactors => {
    const factors: PublicOpinionFactors = {
      economicPerformance: 0,
      militaryStrength: 0,
      diplomaticSuccess: 0,
      warStatus: 0,
      stability: 0,
      foreignInfluence: 0,
    };

    const productionPerCapita = nation.production / (nation.population || 1);
    factors.economicPerformance = Math.min(50, productionPerCapita * 10);

    const militaryScore = nation.missiles * 5 + nation.defense * 3 + (nation.bombers || 0) * 4;
    factors.militaryStrength = Math.min(40, militaryScore * 0.1);

    const allianceCount = nation.alliances?.length || 0;
    const treatyCount = Object.keys(nation.treaties || {}).length;
    factors.diplomaticSuccess = Math.min(35, allianceCount * 8 + treatyCount * 3);

    const threatLevel = Object.values(nation.threats || {}).reduce((a, b) => a + b, 0);
    const isAtWar = threatLevel > 50;
    if (isAtWar) {
      factors.warStatus = -20 + nation.defense * 2;
    } else {
      factors.warStatus = 15;
    }

    const stabilityScore = 40 - (nation.instability || 0) * 2;
    factors.stability = Math.max(-30, Math.min(40, stabilityScore));

    if (electionConfig.foreignInfluenceEnabled) {
      const enemyNations = allNations.filter(
        n => !n.isPlayer && !n.eliminated && (n.threats?.[nation.id] || 0) > 20
      );
      const totalEnemyIntel = enemyNations.reduce((sum, n) => sum + (n.intel || 0), 0);
      const influencePenalty = Math.min(15, totalEnemyIntel * 0.05);
      factors.foreignInfluence = -influencePenalty;
    }

    return factors;
  };

  const legacyCalculatePublicOpinion = (
    nation: Nation,
    allNations: Nation[],
    electionConfig: typeof config
  ) => {
    const factors = legacyGetPublicOpinionFactors(nation, allNations, electionConfig);
    const weights = {
      economicPerformance: 0.3,
      militaryStrength: 0.15,
      diplomaticSuccess: 0.2,
      warStatus: 0.15,
      stability: 0.15,
      foreignInfluence: 0.05,
    } as const;
    const expectedMaximums = {
      economicPerformance: 50,
      militaryStrength: 40,
      diplomaticSuccess: 35,
      warStatus: 30,
      stability: 40,
      foreignInfluence: 15,
    } as const;

    const normalize = (value: number, max: number) => {
      if (max === 0) return 0;
      const normalized = value / max;
      return Math.max(-1, Math.min(1, normalized));
    };

    const normalizedScores = {
      economicPerformance: normalize(factors.economicPerformance, expectedMaximums.economicPerformance),
      militaryStrength: normalize(factors.militaryStrength, expectedMaximums.militaryStrength),
      diplomaticSuccess: normalize(factors.diplomaticSuccess, expectedMaximums.diplomaticSuccess),
      warStatus: normalize(factors.warStatus, expectedMaximums.warStatus),
      stability: normalize(factors.stability, expectedMaximums.stability),
      foreignInfluence: normalize(factors.foreignInfluence, expectedMaximums.foreignInfluence),
    };

    const weightedScore =
      normalizedScores.economicPerformance * weights.economicPerformance +
      normalizedScores.militaryStrength * weights.militaryStrength +
      normalizedScores.diplomaticSuccess * weights.diplomaticSuccess +
      normalizedScores.warStatus * weights.warStatus +
      normalizedScores.stability * weights.stability +
      normalizedScores.foreignInfluence * weights.foreignInfluence;

    const baseline = 55;
    const scaledScore = baseline + weightedScore * 45;

    const moraleNormalized = Math.max(-1, Math.min(1, (nation.morale - 50) / 50));
    const moraleInfluence = moraleNormalized * 12;

    const finalOpinion = scaledScore + moraleInfluence;

    return Math.max(0, Math.min(100, finalOpinion));
  };

  const legacyRunElection = (nation: Nation, allNations: Nation[], electionConfig: typeof config) => {
    const publicOpinion = legacyCalculatePublicOpinion(nation, allNations, electionConfig);
    let playerVoteShare = 50 + publicOpinion * 0.4;
    const moraleMod = (nation.morale - 50) * 0.1;
    playerVoteShare += moraleMod;
    const cabinetMod = (nation.cabinetApproval - 50) * 0.15;
    playerVoteShare += cabinetMod;
    const randomSwing = (Math.random() - 0.5) * 10;
    playerVoteShare += randomSwing;
    playerVoteShare = Math.max(0, Math.min(100, playerVoteShare));
    const oppositionVoteShare = 100 - playerVoteShare;
    const turnout = Math.max(40, Math.min(85, 60 + nation.morale * 0.2 - (nation.instability || 0) * 0.5));
    const winner = playerVoteShare > 50 ? 'incumbent' : 'opposition';
    const margin = Math.abs(playerVoteShare - oppositionVoteShare);
    const factors = legacyGetPublicOpinionFactors(nation, allNations, electionConfig);
    const swingFactors: string[] = [];
    if (factors.economicPerformance < 20) swingFactors.push('Poor economic performance');
    if (factors.militaryStrength < 15) swingFactors.push('Weak military');
    if (factors.warStatus < -10) swingFactors.push('Unpopular war');
    if (factors.stability < 0) swingFactors.push('Political instability');
    if (factors.foreignInfluence < -5) swingFactors.push('Foreign interference');
    if (nation.morale < 30) swingFactors.push('Low morale');
    if (nation.cabinetApproval < 35) swingFactors.push('Cabinet disapproval');

    return {
      winner,
      margin,
      playerVoteShare,
      oppositionVoteShare,
      turnout,
      swingFactors,
    };
  };

  it('matches legacy election outcome calculations when hostile influence is present', () => {
    const aggregates = buildPublicOpinionAggregates(nations, config);
    const originalRandom = Math.random;
    Math.random = () => 0.42;

    const newResult = runElection(playerNation, config, aggregates);
    const legacyResult = legacyRunElection(playerNation, nations, config);

    Math.random = originalRandom;

    expect(newResult).toEqual(legacyResult);
  });
});
