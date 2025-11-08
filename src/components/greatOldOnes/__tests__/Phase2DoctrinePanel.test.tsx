import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Phase2DoctrinePanel } from '../Phase2DoctrinePanel';
import { initializePhase2State } from '@/lib/phase2Integration';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import type { InfluenceNode } from '@/lib/corruptionPath';

const createGreatOldOnesState = (): GreatOldOnesState => ({
  active: true,
  doctrine: 'corruption',
  resources: {
    sanityFragments: 120,
    eldritchPower: 180,
    veilIntegrity: 75,
    corruptionIndex: 55,
  },
  limits: {
    maxSanityFragments: 500,
    maxEldritchPower: 500,
    eldritchPowerDecayRate: 5,
  },
  regions: [],
  council: { members: [], currentAgenda: null, pendingVotes: [], unity: 80 },
  cultistCells: [],
  summonedEntities: [],
  investigators: [],
  veil: {
    integrity: 75,
    status: 'hidden',
    publicAwareness: 10,
    emergencyPowers: false,
    mediaCoverage: 15,
  },
  alignment: {
    turn: 1,
    lunarPhase: 0,
    planetaryAlignment: 20,
    celestialEvents: [],
    ritualPowerModifier: 0,
  },
  activeOperations: [],
  missionLog: [],
  campaignProgress: {
    currentAct: 1,
    missionsCompleted: [],
    actUnlocked: [true, false, false],
  },
});

describe('Phase2DoctrinePanel corruption overview', () => {
  it('renders influence node benefits for quick player reference', () => {
    const state = createGreatOldOnesState();
    const phase2State = initializePhase2State();

    phase2State.unlocked = true;
    phase2State.currentWeek = 5;
    phase2State.doctrinePoints = 3;
    phase2State.corruption.influenceNetwork.nodes = [
      {
        id: 'node-1',
        institutionType: 'government',
        regionId: 'r-core',
        name: 'Central Governance Bloc',
        corruptionLevel: 58,
        compromisedIndividuals: [],
        sleeperCells: 3,
        benefits: [
          {
            type: 'resource_generation',
            value: 15,
            description: 'Divert funds into cult caches',
          },
          {
            type: 'veil_protection',
            value: 12,
            description: 'Hide occult ops behind secrecy acts',
          },
        ],
        exposureRisk: 12,
        underInvestigation: false,
      } satisfies InfluenceNode,
    ];

    render(<Phase2DoctrinePanel state={state} phase2State={phase2State} />);

    expect(screen.getByText('Resource Generation +15')).toBeDefined();
    expect(screen.getByText('Divert funds into cult caches')).toBeDefined();
    expect(screen.getByText('Veil Protection +12')).toBeDefined();
  });
});
