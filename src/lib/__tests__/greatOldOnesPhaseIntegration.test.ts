import { describe, expect, it, vi } from 'vitest';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import type { Phase3State } from '@/types/phase3Types';
import { initializePhase2State, updatePhase2Systems } from '../phase2Integration';
import { updatePhase3Systems } from '../phase3Integration';
import { SeededRandom } from '../seededRandom';

vi.mock('../week9CounterOccult', () => ({ calculateGlobalUnity: () => 0 }));
vi.mock('../week10Endgame', () => ({ checkVictoryConditions: () => [] }));

function campaign(): GreatOldOnesState {
  return {
    doctrine: 'corruption',
    regions: [{ regionId: 'test', corruption: 0, sanitySanity: 80 }],
    resources: { corruptionIndex: 0, sanityFragments: 0 },
    veil: { integrity: 100 },
    summonedEntities: [],
  } as unknown as GreatOldOnesState;
}

describe('Great Old Ones phase effects', () => {
  it('applies ongoing nightmare losses to the campaign rather than the Phase 2 subsystem', () => {
    const state = campaign();
    const phase2 = initializePhase2State();
    phase2.unlocked = true;
    phase2.corruption.dreamRituals = [{ remainingTurns: 2, intensity: 20, targetRegionId: 'test' }] as typeof phase2.corruption.dreamRituals;
    expect(updatePhase2Systems(state, phase2, new SeededRandom(1))).toBe(phase2);
    expect(state.regions[0].sanitySanity).toBe(76);
    expect(phase2.corruption.dreamRituals[0].remainingTurns).toBe(1);
  });

  it('handles a Phase 2 turn with no campaign effects', () => {
    const state = campaign();
    const phase2 = initializePhase2State();
    phase2.unlocked = true;
    expect(() => updatePhase2Systems(state, phase2, new SeededRandom(1))).not.toThrow();
    expect(state.regions[0].sanitySanity).toBe(80);
  });

  it('applies schism damage to the campaign veil rather than the Phase 3 subsystem', () => {
    const state = campaign();
    const phase2 = initializePhase2State();
    phase2.unlocked = true;
    const phase3 = {
      unlocked: true,
      narrative: {
        greatTruth: { revelationLevel: 100 }, rivalCults: [],
        orderFactions: [{ playerRelation: 0 }],
        activeSchisms: [{ severity: 90, name: 'Schism', cause: 'Doctrine dispute' }],
      },
      counterOccult: {
        resistanceResearch: [], globalUnity: { alliances: [], jointOperations: [], unityScore: 0 },
        sanityRestoration: [], taskForces: [],
      },
      endgame: {},
    } as unknown as Phase3State;
    expect(updatePhase3Systems(state, phase2, phase3)).toBe(phase3);
    expect(state.veil.integrity).toBe(90);
  });
});
