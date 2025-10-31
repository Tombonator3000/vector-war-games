import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { RNGProvider } from '@/contexts/RNGContext';
import { useBioWarfare } from '../useBioWarfare';
import type { Nation } from '@/types/game';
import type { PandemicTurnEffect } from '../usePandemic';

describe('useBioWarfare defensive research', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      window.__bioDefenseStats = undefined;
    }
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RNGProvider initialSeed={42}>{children}</RNGProvider>
  );

  it('applies vaccine countermeasure when vaccine research unlocks', () => {
    const addNews = vi.fn();
    const { result } = renderHook(() => useBioWarfare(addNews), { wrapper });

    act(() => {
      result.current.selectPlagueType('bacteria');
      result.current.addDNAPoints({ amount: 30, reason: 'milestone' });
      result.current.triggerBioWarfare({ severity: 'moderate', origin: 'bio-terror' });
    });

    act(() => {
      result.current.evolveNode({ nodeId: 'drug-resistance-1' });
    });
    act(() => {
      result.current.evolveNode({ nodeId: 'vaccine-prototyping' });
    });

    expect(result.current.plagueState.calculatedStats.vaccineAcceleration).toBe(12);
    expect(window.__bioDefenseStats?.vaccineAcceleration ?? 0).toBe(12);
  });

  it('updates fallout mitigation when shielding research unlocks', () => {
    const addNews = vi.fn();
    const { result } = renderHook(() => useBioWarfare(addNews), { wrapper });

    act(() => {
      result.current.selectPlagueType('bacteria');
      result.current.addDNAPoints({ amount: 40, reason: 'milestone' });
    });

    act(() => {
      result.current.evolveNode({ nodeId: 'genetic-hardening-1' });
      result.current.evolveNode({ nodeId: 'radiation-shielding-1' });
    });

    expect(result.current.plagueState.calculatedStats.radiationMitigation).toBeCloseTo(0.2, 5);
    expect(window.__bioDefenseStats?.radiationMitigation ?? 0).toBeCloseTo(
      result.current.plagueState.calculatedStats.radiationMitigation,
      5,
    );
  });

  it('applies per-nation casualties to infected AI populations', () => {
    const addNews = vi.fn();
    const { result } = renderHook(() => useBioWarfare(addNews), { wrapper });

    const createNation = (id: string, isPlayer: boolean, population: number): Nation => ({
      id,
      isPlayer,
      name: `${id}-nation`,
      leader: 'Leader',
      lon: 0,
      lat: 0,
      color: '#fff',
      population,
      missiles: 0,
      defense: 0,
      production: 0,
      uranium: 0,
      intel: 0,
      warheads: {},
      morale: 50,
      publicOpinion: 50,
      electionTimer: 0,
      cabinetApproval: 50,
    });

    const nations: Nation[] = [
      createNation('player', true, 120),
      createNation('ai', false, 80),
    ];

    act(() => {
      result.current.selectPlagueType('virus');
      result.current.triggerBioWarfare({ severity: 'moderate', origin: 'bio-terror' });
      result.current.deployBioWeapon([
        {
          nationId: 'ai',
          nationName: 'ai-nation',
          deploymentMethod: 'covert',
          useFalseFlag: false,
          falseFlagNationId: null,
        },
      ], 1);

      const infection = result.current.plagueState.countryInfections.get('ai');
      if (infection) {
        infection.infectionLevel = 25;
      }
      result.current.plagueState.calculatedStats.totalLethality = 40;
      result.current.plagueState.calculatedStats.totalInfectivity = 30;
    });

    let effect: PandemicTurnEffect | null = null;
    act(() => {
      effect = result.current.advanceBioWarfareTurn(
        { turn: 2, defcon: 3, playerPopulation: nations[0].population, plagueOwnerId: 'player' },
        nations,
      );
    });

    const infectionAfter = result.current.plagueState.countryInfections.get('ai');
    const casualties = infectionAfter?.deathRate ?? 0;
    expect(casualties).toBeGreaterThan(0);

    if (effect?.casualtyTotals?.ai !== undefined) {
      expect(effect.casualtyTotals.ai).toBe(casualties);
    }

    const beforePopulation = nations[1].population;
    nations[1].population = Math.max(0, nations[1].population - casualties / 1_000_000);

    expect(nations[1].population).toBeLessThan(beforePopulation);
  });
});
