import { describe, expect, it } from 'vitest';
import { initializeNationPopSystem } from './immigrationCultureTurnProcessor';
import type { Nation } from '../types/game';

describe('initializeNationPopSystem', () => {
  it('defaults optional numeric fields when calculating cultural power', () => {
    const nation = {
      id: 'test',
      isPlayer: false,
      name: 'Testland',
      leader: 'Leader',
      lon: 0,
      lat: 0,
      color: '#ffffff',
      population: 100,
      missiles: 0,
      defense: 0,
      production: 0,
      uranium: 0,
      morale: 50,
      publicOpinion: 50,
      electionTimer: 10,
      cabinetApproval: 50,
    } as unknown as Nation;

    initializeNationPopSystem(nation);

    expect(Number.isFinite(nation.culturalPower)).toBe(true);
  });
});
