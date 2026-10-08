import { SURVIVAL_MIN_POPULATION, SURVIVAL_VICTORY_TURN, SURVIVAL_WARNING_TURN } from '@/constants/victory.constants';

export function hasSurvivalPopulation(population: number): boolean {
  return Number.isFinite(population) && population >= SURVIVAL_MIN_POPULATION;
}

export function isApproachingSurvivalVictory(turn: number, population: number): boolean {
  return turn >= SURVIVAL_WARNING_TURN && turn < SURVIVAL_VICTORY_TURN && hasSurvivalPopulation(population);
}

export function hasSurvivedCampaign(turn: number, population: number): boolean {
  return turn >= SURVIVAL_VICTORY_TURN && hasSurvivalPopulation(population);
}
