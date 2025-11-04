/**
 * Ideology System Integration
 *
 * Integrates ideology mechanics with the game's turn processing,
 * diplomacy, cultural warfare, and other systems.
 */

import type { Nation, GameState } from '../types/game';
import type { IdeologyEvent } from '../types/ideology';
import {
  initializeIdeologyState,
  initializeRevolutionState,
  applyIdeologyBonuses,
  processIdeologyTurn,
  calculateIdeologyDiplomacyBonus,
  areIdeologiesCompatible,
  getIdeologyPropagandaMultiplier,
  getIdeologyCulturalDefense,
  getIdeologyHappinessBonus,
  applyIdeologyMoraleEffects,
} from './ideologyManager';

/**
 * Initialize ideology system for all nations
 */
export function initializeIdeologySystem(nations: Nation[]): void {
  nations.forEach((nation) => {
    if (!nation.ideologyState) {
      // Default ideology based on nation characteristics or random
      const defaultIdeology = determineDefaultIdeology(nation);
      nation.ideologyState = initializeIdeologyState(defaultIdeology);
    }

    if (!nation.revolutionState) {
      nation.revolutionState = initializeRevolutionState();
    }
  });
}

/**
 * Determine default ideology for a nation (can be customized)
 */
function determineDefaultIdeology(nation: Nation): 'democracy' | 'authoritarianism' | 'communism' | 'theocracy' | 'technocracy' {
  // For now, assign democracy to player, others get varied ideologies
  if (nation.isPlayer) return 'democracy';

  // Assign based on AI personality or doctrine
  if (nation.doctrine === 'isolationist') return 'authoritarianism';
  if (nation.doctrine === 'expansionist') return 'authoritarianism';
  if (nation.doctrine === 'diplomatic') return 'democracy';
  if (nation.doctrine === 'scientific') return 'technocracy';

  // Random assignment for others
  const ideologies: Array<'democracy' | 'authoritarianism' | 'communism' | 'theocracy' | 'technocracy'> = [
    'democracy',
    'authoritarianism',
    'communism',
    'theocracy',
    'technocracy',
  ];
  return ideologies[Math.floor(Math.random() * ideologies.length)];
}

/**
 * Process ideology mechanics for all nations in a turn
 */
export function processIdeologySystemTurn(nations: Nation[], gameState: GameState): IdeologyEvent[] {
  const allEvents: IdeologyEvent[] = [];

  nations.forEach((nation) => {
    if (nation.population <= 0 || nation.eliminated) return;

    // Ensure ideology state exists
    if (!nation.ideologyState) {
      nation.ideologyState = initializeIdeologyState();
    }
    if (!nation.revolutionState) {
      nation.revolutionState = initializeRevolutionState();
    }

    // Process ideology turn mechanics
    const events = processIdeologyTurn(nation, gameState.turn);
    allEvents.push(...events);
  });

  return allEvents;
}

/**
 * Apply ideology bonuses during production phase
 * Should be called BEFORE resource generation
 */
export function applyIdeologyBonusesForProduction(nations: Nation[]): void {
  nations.forEach((nation) => {
    if (nation.population <= 0 || nation.eliminated) return;
    if (!nation.ideologyState) return;

    // Reset bonuses that are applied fresh each turn
    // (Don't reset if they're cumulative from other sources)

    // Apply ideology bonuses
    applyIdeologyBonuses(nation);
  });
}

/**
 * Apply ideology effects to diplomacy relationships
 */
export function applyIdeologyDiplomacyEffects(nations: Nation[]): void {
  nations.forEach((nation1) => {
    if (!nation1.ideologyState || !nation1.relationships) return;

    nations.forEach((nation2) => {
      if (nation1.id === nation2.id) return;
      if (!nation2.ideologyState) return;

      // Calculate ideology compatibility bonus
      const ideologyBonus = calculateIdeologyDiplomacyBonus(nation1, nation2);

      // Apply to relationship (only if not already applied this turn)
      if (nation1.relationships && ideologyBonus !== 0) {
        const currentRelationship = nation1.relationships[nation2.id] || 0;

        // Apply a small gradual shift based on ideology compatibility
        const adjustment = ideologyBonus * 0.1; // Small incremental change per turn
        nation1.relationships[nation2.id] = Math.max(
          -100,
          Math.min(100, currentRelationship + adjustment)
        );
      }
    });
  });
}

/**
 * Check if alliance is possible between two nations based on ideology
 */
export function canFormAllianceIdeology(nation1: Nation, nation2: Nation): boolean {
  return areIdeologiesCompatible(nation1, nation2, 40);
}

/**
 * Get alliance bonus for same ideology
 */
export function getSameIdeologyAllianceBonus(nation1: Nation, nation2: Nation): number {
  if (!nation1.ideologyState || !nation2.ideologyState) return 0;

  if (nation1.ideologyState.currentIdeology === nation2.ideologyState.currentIdeology) {
    return 10; // +10 relationship bonus for same ideology allies
  }

  return 0;
}

/**
 * Modify propaganda effectiveness based on ideology
 */
export function modifyPropagandaEffectiveness(nation: Nation, baseEffectiveness: number): number {
  const multiplier = getIdeologyPropagandaMultiplier(nation);
  return baseEffectiveness * multiplier;
}

/**
 * Get total cultural defense including ideology bonus
 */
export function getTotalCulturalDefense(nation: Nation): number {
  let defense = 0;

  // Base cultural defense (from other systems)
  if (nation.activeCulturalDefenses) {
    defense += nation.activeCulturalDefenses.length * 5;
  }

  // Ideology cultural defense bonus
  defense += getIdeologyCulturalDefense(nation);

  return defense;
}

/**
 * Modify population happiness based on ideology
 */
export function modifyPopulationHappiness(nation: Nation, baseHappiness: number): number {
  const ideologyBonus = getIdeologyHappinessBonus(nation);
  return Math.max(0, Math.min(100, baseHappiness + ideologyBonus));
}

/**
 * Apply ideology morale loss reduction
 */
export function applyIdeologyMoraleReduction(nation: Nation, moraleLoss: number): number {
  return applyIdeologyMoraleEffects(nation, moraleLoss);
}

/**
 * Check for ideological grievances between nations
 */
export function checkIdeologicalGrievances(nation1: Nation, nation2: Nation, turn: number): void {
  if (!nation1.ideologyState || !nation2.ideologyState) return;
  if (!areIdeologiesCompatible(nation1, nation2, 30)) {
    // Create grievance if ideologies are highly incompatible
    if (!nation1.grievances) {
      nation1.grievances = [];
    }

    // Check if grievance already exists
    const existingGrievance = nation1.grievances.find(
      (g) => g.againstNation === nation2.id && g.type === 'ideological'
    );

    if (!existingGrievance) {
      nation1.grievances.push({
        id: `ideology-${nation1.id}-${nation2.id}-${turn}`,
        type: 'ideological',
        againstNation: nation2.id,
        severity: 30,
        description: `${nation1.name} disapproves of ${nation2.name}'s ${nation2.ideologyState.currentIdeology} ideology`,
        createdTurn: turn,
        resolved: false,
      });
    }
  }
}

/**
 * Generate ideological grievances for all incompatible nations
 */
export function generateIdeologicalGrievances(nations: Nation[], turn: number): void {
  nations.forEach((nation1) => {
    nations.forEach((nation2) => {
      if (nation1.id !== nation2.id) {
        checkIdeologicalGrievances(nation1, nation2, turn);
      }
    });
  });
}

/**
 * Update ideology preferences for population groups
 */
export function updatePopGroupIdeologyPreferences(nation: Nation): void {
  if (!nation.popGroups || !nation.ideologyState) return;

  nation.popGroups.forEach((popGroup) => {
    // Higher loyalty and assimilation = more support for current ideology
    if (popGroup.loyalty > 70 && popGroup.assimilation > 60) {
      // Pop group supports current ideology
      const currentSupport = nation.ideologyState!.ideologicalSupport[nation.ideologyState!.currentIdeology];

      // Slightly increase support
      nation.ideologyState!.ideologicalSupport[nation.ideologyState!.currentIdeology] = Math.min(
        100,
        currentSupport + 0.5
      );
    } else if (popGroup.loyalty < 30) {
      // Disloyal pop groups reduce support for current ideology
      const currentSupport = nation.ideologyState!.ideologicalSupport[nation.ideologyState!.currentIdeology];

      nation.ideologyState!.ideologicalSupport[nation.ideologyState!.currentIdeology] = Math.max(
        0,
        currentSupport - 0.3
      );
    }

    // Happiness affects ideology support
    if (popGroup.happiness < 40) {
      // Unhappy pops are more revolutionary
      if (nation.revolutionState) {
        nation.revolutionState.revolutionRisk += 0.5;
      }
    }
  });
}
