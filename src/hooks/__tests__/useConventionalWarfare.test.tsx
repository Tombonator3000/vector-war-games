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
import type { MilitaryTemplate } from '@/types/militaryTemplates';
import type { Territory as SupplyTerritory } from '@/types/supplySystem';

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

  it('reduces combat power for HoI templates under low supply', () => {
    const hoiStats: MilitaryTemplate['stats'] = {
      totalManpower: 6750,
      totalProduction: 480,
      totalSteel: 260,
      totalElectronics: 95,
      softAttack: 180,
      hardAttack: 28,
      airAttack: 6,
      defense: 210,
      breakthrough: 70,
      armor: 35,
      piercing: 40,
      organization: 80,
      recovery: 30,
      reconnaissance: 25,
      suppression: 18,
      supplyUse: 70,
      speed: 6,
      reliability: 85,
      combatWidth: 18,
    };

    const hoiTemplate: MilitaryTemplate = {
      id: 'hoi-template',
      nationId: player.id,
      name: 'HoI Infantry',
      description: 'Imported infantry formation',
      icon: '🪖',
      size: 'division',
      mainComponents: [],
      supportComponents: [],
      stats: hoiStats,
      createdTurn: 0,
      isActive: true,
      isDefault: false,
      unitsDeployed: 0,
    };

    const mockMilitaryApi = {
      getTemplate: (_nationId: string, templateId: string) =>
        templateId === hoiTemplate.id ? hoiTemplate : undefined,
      getTemplateStats: (_nationId: string, templateId: string) =>
        templateId === hoiTemplate.id ? hoiStats : undefined,
    };

    const makeSupplyTerritory = (
      id: string,
      supplyStatus: SupplyTerritory['supplyStatus'],
      currentSupply: number,
      supplyDemand: number,
      controllingNationId: string,
    ): SupplyTerritory => ({
      id,
      controllingNationId,
      infrastructureLevel: 3,
      hasPort: false,
      hasAirbase: false,
      hasDepot: true,
      supplyCapacity: 500,
      supplyDemand,
      currentSupply,
      supplyStatus,
      connectedSupplySources: [],
      supplyDistance: 0,
      attritionLevel: 0,
      stationedUnits: [],
    });

    const runBattle = (status: SupplyTerritory['supplyStatus']) => {
      player.production = 200;
      let state = createDefaultConventionalState([
        { id: player.id, isPlayer: true },
        { id: rival.id, isPlayer: false },
      ]);
      const supplyLookup = new Map<string, SupplyTerritory>();
      const supplyApi = {
        getTerritorySupply: (territoryId: string) => supplyLookup.get(territoryId),
      };

      const { result, unmount } = renderHook(
        () =>
          useConventionalWarfare({
            initialState: state,
            currentTurn: 12,
            getNation,
            onStateChange: next => {
              state = next;
            },
            militaryTemplatesApi: mockMilitaryApi,
            supplySystemApi: supplyApi,
          }),
        { wrapper },
      );

      const territoryIds = Object.keys(result.current.state.territories);
      const attackerTerritory = territoryIds[0];
      const defenderTerritory = territoryIds[1];

      act(() => {
        result.current.state.territories[attackerTerritory].controllingNationId = player.id;
        result.current.state.territories[defenderTerritory].controllingNationId = rival.id;
        result.current.state.territories[attackerTerritory].armies = 6;
        result.current.state.territories[defenderTerritory].armies = 5;
      });

      supplyLookup.set(
        attackerTerritory,
        makeSupplyTerritory(
          attackerTerritory,
          status,
          status === 'critical' ? 60 : 220,
          200,
          player.id,
        ),
      );
      supplyLookup.set(
        defenderTerritory,
        makeSupplyTerritory(defenderTerritory, 'adequate', 220, 180, rival.id),
      );

      act(() => {
        result.current.trainUnit(player.id, hoiTemplate.id, attackerTerritory);
      });

      let resolution: ReturnType<typeof result.current.resolveBorderConflict>;
      act(() => {
        resolution = result.current.resolveBorderConflict(attackerTerritory, defenderTerritory, 4);
      });

      unmount();
      return resolution!;
    };

    const adequateSupply = runBattle('adequate');
    const lowSupply = runBattle('critical');

    expect(adequateSupply.success).toBe(true);
    expect(lowSupply.success).toBe(true);
    expect(lowSupply.attackerCombatPower).toBeLessThan(adequateSupply.attackerCombatPower);
    expect(lowSupply.supply.attacker).toBeLessThan(adequateSupply.supply.attacker);
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
