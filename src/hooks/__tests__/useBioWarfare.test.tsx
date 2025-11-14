import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { RNGProvider } from '@/contexts/RNGContext';
import { useBioWarfare } from '../useBioWarfare';
import type { Nation } from '@/types/game';
import type { PandemicTurnEffect } from '../usePandemic';
import { SCENARIOS } from '@/types/scenario';
import { PLAGUE_TYPES } from '@/lib/evolutionData';

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
    const { result } = renderHook(() => useBioWarfare(addNews, SCENARIOS.coldWar), { wrapper });

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
    const { result } = renderHook(() => useBioWarfare(addNews, SCENARIOS.coldWar), { wrapper });

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
    const { result } = renderHook(() => useBioWarfare(addNews, SCENARIOS.coldWar), { wrapper });
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

  it('seeds pandemic scenario with advanced lab and available plague types while keeping research locked', () => {
    const addNews = vi.fn();
    const { result } = renderHook(
      () => useBioWarfare(addNews, SCENARIOS.pandemic2020),
      { wrapper },
    );

    expect(result.current.labFacility.tier).toBe(4);
    expect(result.current.labFacility.active).toBe(true);
    expect(result.current.labFacility.underConstruction).toBe(false);
    expect(result.current.plagueState.unlockedNodes.size).toBe(0);
    expect(result.current.plagueState.activeTransmissions.length).toBe(0);
    expect(result.current.plagueState.activeSymptoms.length).toBe(0);
    expect(result.current.plagueState.activeAbilities.length).toBe(0);
    expect(result.current.plagueState.unlockedPlagueTypes.size).toBe(PLAGUE_TYPES.length);
    expect(result.current.plagueState.dnaPoints).toBe(69);
  });

  it('allows Pandemic 2020 scenario to select advanced plague types', () => {
    const addNews = vi.fn();
    const { result } = renderHook(
      () => useBioWarfare(addNews, SCENARIOS.pandemic2020),
      { wrapper },
    );

    act(() => {
      result.current.selectPlagueType('bio-weapon');
    });

    expect(result.current.plagueState.selectedPlagueType).toBe('bio-weapon');
  });

  it('blocks advanced plague types until unlocked in progression campaigns', () => {
    const addNews = vi.fn();
    const { result } = renderHook(
      () => useBioWarfare(addNews, SCENARIOS.coldWar),
      { wrapper },
    );

    act(() => {
      result.current.selectPlagueType('bio-weapon');
    });

    expect(result.current.plagueState.selectedPlagueType).not.toBe('bio-weapon');
    expect(result.current.plagueState.unlockedPlagueTypes.has('bio-weapon')).toBe(false);
  });

  it('awards DNA milestones based on the updated pandemic state after a turn', () => {
    const addNews = vi.fn();
    const { result } = renderHook(
      () => useBioWarfare(addNews, SCENARIOS.coldWar),
      { wrapper },
    );

    act(() => {
      result.current.selectPlagueType('virus');
    });
    act(() => {
      result.current.triggerBioWarfare({
        severity: 'contained',
        origin: 'bio-terror',
        initialInfection: 6,
        initialContainment: 0,
      });
    });

    const dnaBefore = result.current.plagueState.dnaPoints;
    const infectionBefore = result.current.pandemicState.globalInfection;

    expect(infectionBefore).toBeGreaterThan(0);

    act(() => {
      result.current.advanceBioWarfareTurn(
        { turn: 1, defcon: 3, playerPopulation: 600, plagueOwnerId: 'player' },
        [],
      );
    });

    const dnaAfter = result.current.plagueState.dnaPoints;
    const outbreaksAfter = result.current.pandemicState.outbreaks.length;
    const infectionAfter = result.current.pandemicState.globalInfection;
    const dnaGain = dnaAfter - dnaBefore;
    const milestoneDelta = Math.floor(infectionAfter / 10) - Math.floor(infectionBefore / 10);
    const expectedGain = outbreaksAfter + (milestoneDelta > 0 ? 2 : 0);

    expect(result.current.pandemicState.globalInfection).toBeGreaterThan(infectionBefore);
    expect(dnaGain).toBeGreaterThanOrEqual(expectedGain);

  });

  it('gates parasite cure progression until the updated infection threshold is met', () => {
    const addNews = vi.fn();
    const { result } = renderHook(
      () => useBioWarfare(addNews, SCENARIOS.pandemic2020),
      { wrapper },
    );

    act(() => {
      result.current.selectPlagueType('parasite');
    });
    act(() => {
      result.current.triggerBioWarfare({
        severity: 'contained',
        origin: 'bio-terror',
        initialInfection: 28,
        initialContainment: 0,
      });
    });

    expect(result.current.plagueState.selectedPlagueType).toBe('parasite');

    expect(result.current.plagueState.cureProgress).toBe(0);

    act(() => {
      result.current.advanceBioWarfareTurn(
        { turn: 1, defcon: 3, playerPopulation: 600, plagueOwnerId: 'player' },
        [],
      );
    });

    expect(result.current.pandemicState.globalInfection).toBeGreaterThan(28);
    expect(result.current.plagueState.cureProgress).toBeGreaterThan(0);

  });
});
