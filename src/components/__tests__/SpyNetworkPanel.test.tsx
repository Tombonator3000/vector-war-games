import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpyNetworkPanel } from '../SpyNetworkPanel';
import type { Nation } from '@/types/game';
import type { SpyAgent, SpyNetworkState } from '@/types/spySystem';

describe('SpyNetworkPanel interactions', () => {
  const createPlayer = (): Nation => {
    const spy: SpyAgent = {
      id: 'spy-1',
      name: 'Agent Zero',
      nationId: 'player',
      targetNationId: null,
      skill: 70,
      experience: 5,
      cover: 'diplomat',
      status: 'active',
      recruitedTurn: 1,
      missionHistory: [],
      discoveryRisk: 15,
      morale: 80,
      trainingLevel: 'operative',
    };

    const spyNetwork: SpyNetworkState = {
      spies: [spy],
      activeMissions: [],
      completedMissions: [],
      incidents: [],
      counterIntelOps: [],
      recruitmentCooldown: 0,
      totalSpiesCaptured: 0,
      totalSpiesLost: 0,
      totalSuccessfulMissions: 0,
      reputation: 'competent',
    };

    return {
      id: 'player',
      isPlayer: true,
      name: 'Player Nation',
      leader: 'Leader',
      lon: 0,
      lat: 0,
      color: '#fff',
      population: 100,
      missiles: 0,
      defense: 10,
      production: 100,
      uranium: 50,
      intel: 100,
      warheads: {},
      morale: 60,
      publicOpinion: 55,
      electionTimer: 12,
      cabinetApproval: 70,
      spyNetwork,
    };
  };

  const createEnemies = (): Nation[] => [
    {
      id: 'enemy-1',
      isPlayer: false,
      name: 'Enemy One',
      leader: 'Leader One',
      lon: 10,
      lat: 20,
      color: '#f00',
      population: 80,
      missiles: 5,
      defense: 8,
      production: 90,
      uranium: 30,
      intel: 40,
      warheads: {},
      morale: 50,
      publicOpinion: 40,
      electionTimer: 20,
      cabinetApproval: 45,
    },
    {
      id: 'enemy-2',
      isPlayer: false,
      name: 'Enemy Two',
      leader: 'Leader Two',
      lon: -10,
      lat: -20,
      color: '#0ff',
      population: 70,
      missiles: 4,
      defense: 7,
      production: 85,
      uranium: 25,
      intel: 35,
      warheads: {},
      morale: 48,
      publicOpinion: 38,
      electionTimer: 22,
      cabinetApproval: 42,
    },
  ];

  it('keeps the spy selected and opens missions tab when assigning a mission', async () => {
    const player = createPlayer();
    const enemies = createEnemies();

    render(<SpyNetworkPanel player={player} enemies={enemies} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /spies/i }));
    await user.click(await screen.findByText('Agent Zero'));

    const assignButton = await screen.findByRole('button', { name: /assign mission/i });
    await user.click(assignButton);

    const missionHeader = await screen.findByText(/Assign Mission for Agent Zero/i);
    expect(missionHeader).toBeTruthy();
    expect(screen.queryByText(/Select an available spy/)).toBeNull();

    expect(screen.getByRole('button', { name: /Enemy One/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Enemy Two/i })).toBeTruthy();
  });
});
