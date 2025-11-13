import { describe, expect, it } from 'vitest';
import { createHolyWarCB, validateWarDeclaration } from '../casusBelliUtils';
import { WAR_JUSTIFICATION_THRESHOLDS } from '../../types/casusBelli';
import type { Nation } from '../../types/game';

const baseNation: Omit<Nation, 'id' | 'name' | 'leader' | 'color' | 'lon' | 'lat'> = {
  isPlayer: false,
  leaderName: 'Leader',
  aiPersonality: 'balanced',
  doctrine: 'standard',
  ai: 'standard',
  population: 10_000_000,
  missiles: 10,
  defense: 50,
  production: 100,
  uranium: 20,
  intel: 40,
  morale: 60,
  publicOpinion: 55,
  electionTimer: 12,
  cabinetApproval: 60,
  warheads: {},
};

describe('validateWarDeclaration', () => {
  it('treats extreme ideological divergence as a valid holy war CB', () => {
    const attacker: Nation = {
      id: 'attacker',
      name: 'Attacker Nation',
      leader: 'Attacker Leader',
      lon: 0,
      lat: 0,
      color: '#FF0000',
      ...baseNation,
      ideologyState: {
        currentIdeology: 'democracy',
        ideologyStability: 80,
        ideologicalSupport: {
          democracy: 95,
          authoritarianism: 1,
          communism: 1,
          theocracy: 1,
          technocracy: 2,
        },
        ideologicalPressures: [],
        ideologicalExport: true,
        ideologicalDefense: 70,
      },
    };

    const defender: Nation = {
      id: 'defender',
      name: 'Defender Nation',
      leader: 'Defender Leader',
      lon: 10,
      lat: 10,
      color: '#0000FF',
      ...baseNation,
      ideologyState: {
        currentIdeology: 'theocracy',
        ideologyStability: 65,
        ideologicalSupport: {
          democracy: 5,
          authoritarianism: 10,
          communism: 5,
          theocracy: 75,
          technocracy: 5,
        },
        ideologicalPressures: [],
        ideologicalExport: false,
        ideologicalDefense: 50,
      },
    };

    const holyWarCB = createHolyWarCB(attacker, defender, 5);

    expect(holyWarCB.type).toBe('holy-war');
    expect(holyWarCB.justification).toBeGreaterThanOrEqual(
      WAR_JUSTIFICATION_THRESHOLDS.VALID
    );

    const validation = validateWarDeclaration(
      attacker,
      defender,
      [],
      [],
      [holyWarCB],
      undefined,
      5
    );

    expect(validation.validity).toBe('valid');
    expect(validation.justificationScore).toBeGreaterThanOrEqual(
      WAR_JUSTIFICATION_THRESHOLDS.VALID
    );
    expect(validation.canDeclareWar).toBe(true);
  });
});
