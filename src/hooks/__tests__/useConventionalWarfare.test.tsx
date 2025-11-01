import React from 'react';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useConventionalWarfare,
  createDefaultConventionalState,
  createDefaultNationConventionalProfile,
  type ConventionalState,
} from '../useConventionalWarfare';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { TerritoryMapPanel } from '@/components/TerritoryMapPanel';
import { RNGProvider } from '@/contexts/RNGContext';

interface MockNation {
  id: string;
  name: string;
  production: number;
  instability: number;
  conventional: ReturnType<typeof createDefaultNationConventionalProfile>;
  controlledTerritories: string[];
  intel?: number;
  uranium?: number;
  researched?: Record<string, boolean>;
}

describe('useConventionalWarfare', () => {
  let player: MockNation;
  let rival: MockNation;
  let latestState: ConventionalState;
  let consumeSpy: ReturnType<typeof vi.fn>;
  let updateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    player = {
      id: 'player',
      name: 'Player',
      production: 50,
      instability: 10,
      conventional: createDefaultNationConventionalProfile('army'),
      controlledTerritories: [],
      intel: 20,
      uranium: 10,
      researched: {},
    };
    rival = {
      id: 'ai_0',
      name: 'Rival',
      production: 40,
      instability: 15,
      conventional: createDefaultNationConventionalProfile('army'),
      controlledTerritories: [],
      intel: 15,
      uranium: 8,
      researched: {},
    };
    latestState = createDefaultConventionalState([
      { id: player.id, isPlayer: true },
      { id: rival.id, isPlayer: false },
    ]);
    consumeSpy = vi.fn();
    updateSpy = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getNation = (id: string) => {
    if (id === player.id) return player;
    if (id === rival.id) return rival;
    return undefined;
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RNGProvider initialSeed={42}>{children}</RNGProvider>
  );

  it('resolves border conflicts and updates territorial ownership', () => {
    const { result } = renderHook(() =>
      useConventionalWarfare({
        initialState: latestState,
        currentTurn: 3,
        getNation,
        onStateChange: state => {
          latestState = state;
        },
        onConsumeAction: consumeSpy,
        onUpdateDisplay: updateSpy,
      }),
      { wrapper },
    );

    const playerUnit = Object.values(result.current.state.units).find(unit => unit.ownerId === player.id);
    const rivalUnit = Object.values(result.current.state.units).find(unit => unit.ownerId === rival.id);
    expect(playerUnit).toBeDefined();
    expect(rivalUnit).toBeDefined();

    act(() => {
      result.current.deployUnit(playerUnit!.id, 'eastern_bloc');
      result.current.deployUnit(rivalUnit!.id, 'eastern_bloc');
    });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

    let resolution;
    act(() => {
      resolution = result.current.resolveBorderConflict('eastern_bloc', player.id, rival.id);
    });

    expect(randomSpy).toHaveBeenCalled();
    expect(resolution.success).toBe(true);
    expect(resolution.attackerVictory).toBe(true);
    expect(result.current.state.territories['eastern_bloc'].controllingNationId).toBe(player.id);
    expect(player.production).toBeGreaterThan(50);
    expect(rival.production).toBeLessThan(40);
    expect(player.controlledTerritories).toContain('eastern_bloc');
    expect(consumeSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('modifies instability and production during proxy engagements', () => {
    const { result } = renderHook(() =>
      useConventionalWarfare({
        initialState: latestState,
        currentTurn: 8,
        getNation,
        onStateChange: state => {
          latestState = state;
        },
        onConsumeAction: consumeSpy,
        onUpdateDisplay: updateSpy,
      }),
      { wrapper },
    );

    const initialPlayerInstability = player.instability;
    const initialRivalInstability = rival.instability;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

    act(() => {
      result.current.resolveProxyEngagement('proxy_middle_east', player.id, rival.id);
    });

    expect(randomSpy).toHaveBeenCalled();
    expect(player.instability).toBeLessThan(initialPlayerInstability);
    expect(rival.instability).toBeGreaterThan(initialRivalInstability);
    expect(consumeSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('requires prerequisite research before training advanced formations', () => {
    const { result } = renderHook(() =>
      useConventionalWarfare({
        initialState: latestState,
        currentTurn: 5,
        getNation,
        onStateChange: state => {
          latestState = state;
        },
        onConsumeAction: consumeSpy,
        onUpdateDisplay: updateSpy,
      }),
      { wrapper },
    );

    let response;
    act(() => {
      response = result.current.trainUnit(player.id, 'air_wing');
    });

    expect(response.success).toBe(false);
    expect(response.reason).toBe('Requires research unlock');
    expect('requiresResearchId' in response ? response.requiresResearchId : undefined).toBe(
      'conventional_expeditionary_airframes',
    );
    expect(player.production).toBe(50);

    player.researched = { conventional_expeditionary_airframes: true };

    act(() => {
      response = result.current.trainUnit(player.id, 'air_wing');
    });

    expect(response.success).toBe(true);
    expect(consumeSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });
});

describe('Conventional warfare panels', () => {
  it('queues formations when the train action is triggered', () => {
    const handleTrain = vi.fn();
    render(
      <ConventionalForcesPanel
        templates={[
          {
            id: 'armored_corps',
            type: 'army',
            name: 'Armored Corps',
            description: 'Heavy armour task force',
            attack: 7,
            defense: 5,
            support: 2,
            cost: { production: 10 },
            readinessImpact: 5,
          },
        ]}
        units={[]}
        territories={[]}
        profile={{ readiness: 80, reserve: 1, focus: 'army', deployedUnits: [] }}
        onTrain={handleTrain}
        onDeploy={vi.fn()}
        researchUnlocks={{ conventional_armored_doctrine: true }}
      />,
    );

    fireEvent.click(screen.getByText(/Queue/i));
    expect(handleTrain).toHaveBeenCalledWith('armored_corps');
  });

  it('disables queue buttons when research prerequisites are unmet', () => {
    const handleTrain = vi.fn();
    render(
      <ConventionalForcesPanel
        templates={[
          {
            id: 'carrier_fleet',
            type: 'navy',
            name: 'Carrier Strike Group',
            description: 'Carrier task force',
            attack: 6,
            defense: 8,
            support: 3,
            cost: { production: 16 },
            readinessImpact: 8,
            requiresResearch: 'conventional_carrier_battlegroups',
          },
        ]}
        units={[]}
        territories={[]}
        profile={{ readiness: 70, reserve: 1, focus: 'navy', deployedUnits: [] }}
        onTrain={handleTrain}
        onDeploy={vi.fn()}
        researchUnlocks={{}}
      />,
    );

    expect(screen.getByRole('button', { name: /Queue NAVY/i }).hasAttribute('disabled')).toBe(true);
  });

  it('invokes engagement callbacks from the territory panel', () => {
    const handleBorder = vi.fn();
    const handleProxy = vi.fn();
    render(
      <TerritoryMapPanel
        territories={[
          {
            id: 'eastern_bloc',
            name: 'Eurasian Frontier',
            region: 'Europe',
            type: 'land',
            controllingNationId: 'ai_0',
            contestedBy: [],
            strategicValue: 5,
            productionBonus: 3,
            instabilityModifier: -4,
            conflictRisk: 20,
            neighbors: [],
          },
        ]}
        units={[]}
        playerId="player"
        onBorderConflict={handleBorder}
        onProxyEngagement={handleProxy}
      />,
    );

    fireEvent.click(screen.getByText(/Border Conflict/i));
    expect(handleBorder).toHaveBeenCalledWith('eastern_bloc', 'ai_0');

    fireEvent.click(screen.getByText(/Proxy Engagement/i));
    expect(handleProxy).toHaveBeenCalledWith('eastern_bloc', 'ai_0');
  });
});
