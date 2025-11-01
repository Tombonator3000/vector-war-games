import { describe, it, expect, vi } from 'vitest';
import { aiFormAlliance, aiSignMutualTruce, aiSignNonAggressionPact } from '@/lib/aiDiplomacyActions';
import type { Nation } from '@/types/game';

const makeNation = (overrides: Partial<Nation> = {}): Nation => ({
  id: overrides.id ?? 'alpha',
  isPlayer: overrides.isPlayer ?? false,
  name: overrides.name ?? 'Alpha',
  leader: overrides.leader ?? 'Leader Alpha',
  doctrine: overrides.doctrine,
  ai: overrides.ai,
  lon: overrides.lon ?? 0,
  lat: overrides.lat ?? 0,
  color: overrides.color ?? '#ffffff',
  population: overrides.population ?? 100,
  missiles: overrides.missiles ?? 0,
  bombers: overrides.bombers,
  submarines: overrides.submarines,
  defense: overrides.defense ?? 0,
  instability: overrides.instability,
  production: overrides.production ?? 50,
  uranium: overrides.uranium ?? 25,
  intel: overrides.intel ?? 50,
  cities: overrides.cities,
  warheads: overrides.warheads ?? {},
  researched: overrides.researched,
  researchQueue: overrides.researchQueue ?? null,
  treaties: overrides.treaties,
  satellites: overrides.satellites,
  bordersClosedTurns: overrides.bordersClosedTurns,
  greenShiftTurns: overrides.greenShiftTurns,
  threats: overrides.threats,
  migrantsThisTurn: overrides.migrantsThisTurn,
  migrantsTotal: overrides.migrantsTotal,
  migrantsLastTurn: overrides.migrantsLastTurn,
  immigrants: overrides.immigrants,
  coverOpsTurns: overrides.coverOpsTurns,
  deepRecon: overrides.deepRecon,
  sanctionTurns: overrides.sanctionTurns,
  sanctioned: overrides.sanctioned,
  sanctionedBy: overrides.sanctionedBy,
  environmentPenaltyTurns: overrides.environmentPenaltyTurns,
  cyber: overrides.cyber,
  morale: overrides.morale ?? 50,
  publicOpinion: overrides.publicOpinion ?? 50,
  electionTimer: overrides.electionTimer ?? 10,
  cabinetApproval: overrides.cabinetApproval ?? 50,
  productionMultiplier: overrides.productionMultiplier,
  uraniumPerTurn: overrides.uraniumPerTurn,
  hasASATCapability: overrides.hasASATCapability,
  orbitalStrikesAvailable: overrides.orbitalStrikesAvailable,
  sabotageDetectionReduction: overrides.sabotageDetectionReduction,
  unitAttackBonus: overrides.unitAttackBonus,
  unitDefenseBonus: overrides.unitDefenseBonus,
  combinedArmsBonus: overrides.combinedArmsBonus,
  immigrationBonus: overrides.immigrationBonus,
  satelliteIntelBonus: overrides.satelliteIntelBonus,
  treatyLockDuration: overrides.treatyLockDuration,
  alliances: overrides.alliances,
  relationships: overrides.relationships,
  relationshipHistory: overrides.relationshipHistory,
  trustRecords: overrides.trustRecords,
  favorBalances: overrides.favorBalances,
  diplomaticPromises: overrides.diplomaticPromises,
  grievances: overrides.grievances,
  claims: overrides.claims,
  specializedAlliances: overrides.specializedAlliances,
  diplomaticInfluence: overrides.diplomaticInfluence,
  councilMembership: overrides.councilMembership,
  readinessRegen: overrides.readinessRegen,
  detectionReduction: overrides.detectionReduction,
  buildCostReduction: overrides.buildCostReduction,
  maxProduction: overrides.maxProduction,
  maxIntel: overrides.maxIntel,
  maxUranium: overrides.maxUranium,
  cultureBombCostReduction: overrides.cultureBombCostReduction,
  maxTreaties: overrides.maxTreaties,
  stolenPopConversionRate: overrides.stolenPopConversionRate,
  maxSatellites: overrides.maxSatellites,
  enemyMissileAccuracyReduction: overrides.enemyMissileAccuracyReduction,
  memeWaveEffectiveness: overrides.memeWaveEffectiveness,
  autoRevealEnemyResearch: overrides.autoRevealEnemyResearch,
  hasRegimeDestabilization: overrides.hasRegimeDestabilization,
  eliminated: overrides.eliminated,
  intelligence: overrides.intelligence,
  bioLab: overrides.bioLab,
  plagueState: overrides.plagueState,
  bioStrategy: overrides.bioStrategy,
});

describe('diplomacy proposal acceptance', () => {
  it('passes the log callback when forming alliances', () => {
    const proposer = makeNation({ id: 'proposer', name: 'Proposer' });
    const target = makeNation({ id: 'target', name: 'Target' });
    const logFn = vi.fn();

    const result = aiFormAlliance(proposer, target, logFn);

    expect(result).toBe(true);
    expect(logFn).toHaveBeenCalledWith('Proposer enters an alliance with Target.');
  });

  it('passes the log callback and reason when signing truces', () => {
    const proposer = makeNation({ id: 'proposer', name: 'Proposer' });
    const target = makeNation({ id: 'target', name: 'Target' });
    const logFn = vi.fn();

    aiSignMutualTruce(proposer, target, 4, logFn, 'Diplomatic agreement');

    expect(logFn).toHaveBeenCalledWith(
      'Proposer agrees to a 4-turn truce with Target (Diplomatic agreement).'
    );
  });

  it('signs non-aggression pacts without throwing and logs via callback', () => {
    const proposer = makeNation({ id: 'proposer', name: 'Proposer' });
    const target = makeNation({ id: 'target', name: 'Target' });
    const logFn = vi.fn();

    const result = aiSignNonAggressionPact(proposer, target, logFn);

    expect(result).toBe(true);
    expect(logFn).toHaveBeenCalledWith(
      'Proposer agrees to a 5-turn truce with Target (non-aggression pact).'
    );
  });
});
