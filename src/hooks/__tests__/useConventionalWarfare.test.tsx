import React from 'react';
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

interface MockNation {
  id: string;
  name: string;
  production: number;
  instability: number;
  conventional: ReturnType<typeof createDefaultNationConventionalProfile>;
  controlledTerritories: string[];
  intel?: number;
  uranium?: number;
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
      />,
    );

    fireEvent.click(screen.getByText(/Queue/i));
    expect(handleTrain).toHaveBeenCalledWith('armored_corps');
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
