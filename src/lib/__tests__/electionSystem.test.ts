import { describe, it, expect } from 'vitest';
import { calculatePublicOpinion } from '../electionSystem';
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
    const opinion = calculatePublicOpinion(usa, coldWarNations, coldWarConfig);
    expect(opinion).toBeCloseTo(usa.publicOpinion, 0);
  });

  it('keeps the Soviet Union near its seeded Cold War opinion on the first turn', () => {
    const opinion = calculatePublicOpinion(ussr, coldWarNations, coldWarConfig);
    expect(opinion).toBeCloseTo(ussr.publicOpinion, 0);
  });
});
