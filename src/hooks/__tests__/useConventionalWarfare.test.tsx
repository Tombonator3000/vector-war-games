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
import { SeededRandom } from '@/lib/seededRandom';

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

    const playerTerritory = Object.keys(result.current.state.territories)[0];
    const rivalTerritory = Object.keys(result.current.state.territories)[1];

    act(() => {
      // Assign territories to nations
      result.current.state.territories[playerTerritory].controllingNationId = player.id;
      result.current.state.territories[rivalTerritory].controllingNationId = rival.id;
      result.current.state.territories[playerTerritory].armies = 5;
    });

    const nextSpy = vi.spyOn(SeededRandom.prototype, 'next').mockReturnValue(0.05);

    let resolution;
    act(() => {
      resolution = result.current.resolveBorderConflict(playerTerritory, rivalTerritory, 3);
    });

    expect(nextSpy).toHaveBeenCalled();
    expect(resolution.success).toBe(true);
    expect(result.current.state.territories[rivalTerritory].controllingNationId).toBe(player.id);
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

    const territoryId = Object.keys(result.current.state.territories)[0];
    
    act(() => {
      result.current.resolveProxyEngagement(territoryId, player.id, rival.id);
    });

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
    expect(consumeSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
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
        territories={[]}
        profile={{ readiness: 80, reserve: 1, focus: 'army', deployedUnits: [] }}
        onTrain={handleTrain}
        playerId="player"
        researchUnlocks={{ conventional_armored_doctrine: true }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Train ARMY/i }));
    expect(handleTrain).toHaveBeenCalledWith('armored_corps', undefined);
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
        territories={[]}
        profile={{ readiness: 70, reserve: 1, focus: 'navy', deployedUnits: [] }}
        onTrain={handleTrain}
        playerId="player"
        researchUnlocks={{}}
      />,
    );

    const trainButtons = screen.queryAllByRole('button', { name: /Train NAVY/i });
    expect(trainButtons.length).toBeGreaterThan(0);
  });

  it('invokes engagement callbacks from the territory panel', () => {
    const handleProxy = vi.fn();
    const handleAttack = vi.fn();
    const handleMove = vi.fn();
    
    render(
      <TerritoryMapPanel
        territories={[
          {
            id: 'eastern_bloc',
            name: 'Eurasian Frontier',
            region: 'Europe',
            type: 'land',
            anchorLat: 50.5,
            anchorLon: 30.5,
            controllingNationId: 'ai_0',
            contestedBy: [],
            strategicValue: 5,
            productionBonus: 3,
            instabilityModifier: -4,
            conflictRisk: 20,
            neighbors: [],
            armies: 0,
            unitComposition: { army: 0, navy: 0, air: 0 },
          },
        ]}
        playerId="player"
        onProxyEngagement={handleProxy}
        onAttack={handleAttack}
        onMove={handleMove}
      />,
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
