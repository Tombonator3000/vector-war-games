/**
 * Ideology Manager
 *
 * Manages ideology mechanics including bonuses, spreading, revolutions,
 * and integration with other game systems.
 */

import type { Nation } from '../types/game';
import type {
  IdeologyType,
  IdeologyState,
  RevolutionState,
  IdeologicalPressure,
  IdeologyEvent,
} from '../types/ideology';
import {
  IDEOLOGY_BONUSES,
  IDEOLOGY_COMPATIBILITY,
  REVOLUTION_THRESHOLDS,
  DEFAULT_IDEOLOGY_SPREAD_CONFIG,
  getInitialIdeologicalSupport,
  getIdeologyRelationshipModifier,
} from '../data/ideologies';

/**
 * Initialize ideology state for a new nation
 */
export function initializeIdeologyState(
  primaryIdeology: IdeologyType = 'democracy'
): IdeologyState {
  return {
    currentIdeology: primaryIdeology,
    ideologyStability: 80,
    ideologicalSupport: getInitialIdeologicalSupport(primaryIdeology),
    ideologicalPressures: [],
    ideologicalExport: false,
    ideologicalDefense: 50,
  };
}

/**
 * Initialize revolution state
 */
export function initializeRevolutionState(): RevolutionState {
  return {
    revolutionRisk: 0,
    revolutionaryFactions: [],
  };
}

/**
 * Apply ideology bonuses to a nation
 */
export function applyIdeologyBonuses(nation: Nation): void {
  if (!nation.ideologyState) return;

  const ideology = nation.ideologyState.currentIdeology;
  const bonuses = IDEOLOGY_BONUSES[ideology];

  // Apply production multiplier
  if (bonuses.productionMultiplier !== 1.0) {
    nation.productionMultiplier = (nation.productionMultiplier || 1.0) * bonuses.productionMultiplier;
  }

  // Apply unit bonuses
  if (bonuses.unitAttackBonus !== 0) {
    nation.unitAttackBonus = (nation.unitAttackBonus || 0) + bonuses.unitAttackBonus;
  }
  if (bonuses.unitDefenseBonus !== 0) {
    nation.unitDefenseBonus = (nation.unitDefenseBonus || 0) + bonuses.unitDefenseBonus;
  }

  // Apply cultural bonuses
  if (bonuses.culturalPowerBonus !== 0) {
    nation.culturalPower = (nation.culturalPower || 0) + bonuses.culturalPowerBonus;
  }

  // Apply intel bonus
  if (bonuses.intelBonus !== 0) {
    nation.intel = Math.max(0, nation.intel + bonuses.intelBonus);
  }

  // Apply immigration modifier
  if (bonuses.immigrationModifier !== 1.0) {
    nation.immigrationBonus = (nation.immigrationBonus || 0) + (bonuses.immigrationModifier - 1.0) * 100;
  }

  // Apply cyber warfare bonus
  if (bonuses.cyberWarfareBonus !== 0 && nation.cyber) {
    nation.cyber.offense = Math.max(0, nation.cyber.offense + bonuses.cyberWarfareBonus);
    nation.cyber.defense = Math.max(0, nation.cyber.defense + bonuses.cyberWarfareBonus);
  }
}

/**
 * Calculate and apply morale effects from ideology
 */
export function applyIdeologyMoraleEffects(nation: Nation, moraleLoss: number): number {
  if (!nation.ideologyState) return moraleLoss;

  const ideology = nation.ideologyState.currentIdeology;
  const bonuses = IDEOLOGY_BONUSES[ideology];

  // Reduce morale loss based on ideology
  const reducedLoss = moraleLoss * (1 - bonuses.moraleLossReduction);

  return Math.max(0, reducedLoss);
}

/**
 * Calculate population happiness modifier from ideology
 */
export function getIdeologyHappinessBonus(nation: Nation): number {
  if (!nation.ideologyState) return 0;

  const ideology = nation.ideologyState.currentIdeology;
  const bonuses = IDEOLOGY_BONUSES[ideology];

  return bonuses.populationHappinessBonus;
}

/**
 * Start spreading ideology to another nation
 */
export function startIdeologicalPressure(
  fromNation: Nation,
  toNation: Nation,
  intelCost: number = DEFAULT_IDEOLOGY_SPREAD_CONFIG.baseIntelCost
): IdeologicalPressure | null {
  if (!fromNation.ideologyState || !toNation.ideologyState) return null;

  // Check if fromNation has enough intel
  if (fromNation.intel < intelCost) return null;

  // Calculate pressure strength based on cultural power
  const culturalPowerMultiplier =
    (fromNation.culturalPower || 0) * DEFAULT_IDEOLOGY_SPREAD_CONFIG.culturalPowerMultiplier;
  const strength = DEFAULT_IDEOLOGY_SPREAD_CONFIG.baseStrength + culturalPowerMultiplier;

  const pressure: IdeologicalPressure = {
    fromNation: fromNation.id,
    ideology: fromNation.ideologyState.currentIdeology,
    strength: Math.min(100, strength),
    duration: 0,
    intelCost,
  };

  // Deduct intel cost
  fromNation.intel -= intelCost;

  // Add pressure to target nation
  if (!toNation.ideologyState.ideologicalPressures) {
    toNation.ideologyState.ideologicalPressures = [];
  }
  toNation.ideologyState.ideologicalPressures.push(pressure);

  // Mark as actively exporting ideology
  fromNation.ideologyState.ideologicalExport = true;

  return pressure;
}

/**
 * Process ideological pressures for a nation
 */
export function processIdeologicalPressures(nation: Nation): void {
  if (!nation.ideologyState || !nation.ideologyState.ideologicalPressures) return;

  const { ideologicalSupport, ideologicalDefense } = nation.ideologyState;
  const pressures = nation.ideologyState.ideologicalPressures;

  pressures.forEach((pressure) => {
    pressure.duration += 1;

    // Calculate effectiveness based on defense
    const effectiveness = Math.max(0, pressure.strength - ideologicalDefense / 2);

    // Increase support for the pressure's ideology
    const currentSupport = ideologicalSupport[pressure.ideology] || 0;
    const supportIncrease = Math.min(5, effectiveness / 10);

    ideologicalSupport[pressure.ideology] = Math.min(100, currentSupport + supportIncrease);

    // Decrease support for current ideology
    const currentIdeologySupport = ideologicalSupport[nation.ideologyState.currentIdeology];
    ideologicalSupport[nation.ideologyState.currentIdeology] = Math.max(
      0,
      currentIdeologySupport - supportIncrease / 2
    );
  });

  // Remove expired pressures (after 10 turns)
  nation.ideologyState.ideologicalPressures = pressures.filter((p) => p.duration < 10);
}

/**
 * Check and process potential revolution
 */
export function checkRevolutionRisk(nation: Nation, turn: number): IdeologyEvent | null {
  if (!nation.ideologyState || !nation.revolutionState) return null;

  const { revolutionRisk, targetIdeology, turnsUntilRevolution } = nation.revolutionState;
  const { morale, cabinetApproval } = nation;

  // Calculate revolution risk factors
  let newRisk = revolutionRisk;

  // Low morale increases risk
  if (morale < REVOLUTION_THRESHOLDS.MORALE_THRESHOLD) {
    newRisk += 5 + (REVOLUTION_THRESHOLDS.MORALE_THRESHOLD - morale) / 5;
  }

  // Low cabinet approval increases risk
  if (cabinetApproval < REVOLUTION_THRESHOLDS.APPROVAL_THRESHOLD) {
    newRisk += 3 + (REVOLUTION_THRESHOLDS.APPROVAL_THRESHOLD - cabinetApproval) / 10;
  }

  // High instability increases risk
  if (nation.instability && nation.instability > 60) {
    newRisk += nation.instability / 10;
  }

  // Ideological pressure increases risk
  if (nation.ideologyState.ideologicalPressures.length > 0) {
    const totalPressure = nation.ideologyState.ideologicalPressures.reduce(
      (sum, p) => sum + p.strength,
      0
    );
    newRisk += totalPressure / 20;
  }

  // Stability decreases risk
  newRisk -= nation.ideologyState.ideologyStability / 10;

  // Clamp between 0-100
  newRisk = Math.max(0, Math.min(100, newRisk));
  nation.revolutionState.revolutionRisk = newRisk;

  // Determine target ideology if not set
  if (!targetIdeology && newRisk > 50) {
    const support = nation.ideologyState.ideologicalSupport;
    const currentIdeology = nation.ideologyState.currentIdeology;

    // Find ideology with highest support (excluding current)
    let maxSupport = 0;
    let maxIdeology: IdeologyType | undefined;

    for (const [ideology, supportValue] of Object.entries(support)) {
      if (ideology !== currentIdeology && supportValue > maxSupport) {
        maxSupport = supportValue;
        maxIdeology = ideology as IdeologyType;
      }
    }

    if (maxIdeology) {
      nation.revolutionState.targetIdeology = maxIdeology;
      nation.revolutionState.turnsUntilRevolution = REVOLUTION_THRESHOLDS.TURNS_UNTIL_REVOLUTION;
    }
  }

  // Check if revolution triggers
  if (
    newRisk >= REVOLUTION_THRESHOLDS.REVOLUTION_TRIGGER &&
    targetIdeology &&
    turnsUntilRevolution !== undefined
  ) {
    if (turnsUntilRevolution <= 0) {
      // Revolution occurs!
      return executeRevolution(nation, targetIdeology, turn);
    } else {
      nation.revolutionState.turnsUntilRevolution = turnsUntilRevolution - 1;
    }
  } else if (newRisk < REVOLUTION_THRESHOLDS.REVOLUTION_TRIGGER) {
    // Reset revolution countdown if risk drops
    nation.revolutionState.turnsUntilRevolution = undefined;
    nation.revolutionState.targetIdeology = undefined;
  }

  return null;
}

/**
 * Execute an ideological revolution
 */
export function executeRevolution(
  nation: Nation,
  newIdeology: IdeologyType,
  turn: number
): IdeologyEvent {
  if (!nation.ideologyState) {
    throw new Error('Cannot execute revolution without ideology state');
  }

  const oldIdeology = nation.ideologyState.currentIdeology;

  // Change ideology
  nation.ideologyState.currentIdeology = newIdeology;
  nation.ideologyState.lastIdeologyChangeTurn = turn;

  // Adjust support
  nation.ideologyState.ideologicalSupport[newIdeology] = 70;
  nation.ideologyState.ideologicalSupport[oldIdeology] = 15;

  // Reset stability (revolutions are disruptive)
  nation.ideologyState.ideologyStability = 40;

  // Reset revolution state
  if (nation.revolutionState) {
    nation.revolutionState.revolutionRisk = 0;
    nation.revolutionState.targetIdeology = undefined;
    nation.revolutionState.turnsUntilRevolution = undefined;
    nation.revolutionState.revolutionaryFactions = [];
  }

  // Morale and approval take a hit
  nation.morale = Math.max(20, nation.morale - 20);
  nation.cabinetApproval = Math.max(15, nation.cabinetApproval - 25);

  // Increase instability
  nation.instability = Math.min(100, (nation.instability || 0) + 30);

  return {
    type: 'revolution',
    affectedNations: [nation.id],
    ideology: newIdeology,
    description: `${nation.name} has undergone a revolution! ${oldIdeology} → ${newIdeology}`,
    turn,
  };
}

/**
 * Manually change a nation's ideology (for player choice)
 */
export function changeIdeology(
  nation: Nation,
  newIdeology: IdeologyType,
  turn: number
): IdeologyEvent | null {
  if (!nation.ideologyState) return null;
  if (nation.ideologyState.currentIdeology === newIdeology) return null;

  const oldIdeology = nation.ideologyState.currentIdeology;

  // Change ideology
  nation.ideologyState.currentIdeology = newIdeology;
  nation.ideologyState.lastIdeologyChangeTurn = turn;

  // Adjust support (peaceful transition is less disruptive)
  nation.ideologyState.ideologicalSupport[newIdeology] = 60;
  nation.ideologyState.ideologicalSupport[oldIdeology] = 25;

  // Reduce stability but not as much as revolution
  nation.ideologyState.ideologyStability = Math.max(30, nation.ideologyState.ideologyStability - 20);

  // Minor morale impact
  nation.morale = Math.max(30, nation.morale - 10);
  nation.cabinetApproval = Math.max(25, nation.cabinetApproval - 15);

  return {
    type: 'ideology_change',
    affectedNations: [nation.id],
    ideology: newIdeology,
    description: `${nation.name} has peacefully transitioned from ${oldIdeology} to ${newIdeology}`,
    turn,
  };
}

/**
 * Calculate diplomacy bonus between two nations based on ideology
 */
export function calculateIdeologyDiplomacyBonus(nation1: Nation, nation2: Nation): number {
  if (!nation1.ideologyState || !nation2.ideologyState) return 0;

  const ideology1 = nation1.ideologyState.currentIdeology;
  const ideology2 = nation2.ideologyState.currentIdeology;

  return getIdeologyRelationshipModifier(ideology1, ideology2);
}

/**
 * Check if two nations have compatible ideologies for alliance
 */
export function areIdeologiesCompatible(
  nation1: Nation,
  nation2: Nation,
  threshold: number = 50
): boolean {
  if (!nation1.ideologyState || !nation2.ideologyState) return true;

  const ideology1 = nation1.ideologyState.currentIdeology;
  const ideology2 = nation2.ideologyState.currentIdeology;

  const compatibility = IDEOLOGY_COMPATIBILITY[ideology1][ideology2];

  return compatibility >= threshold;
}

/**
 * Get propaganda effectiveness multiplier based on ideology
 */
export function getIdeologyPropagandaMultiplier(nation: Nation): number {
  if (!nation.ideologyState) return 1.0;

  const ideology = nation.ideologyState.currentIdeology;
  const bonuses = IDEOLOGY_BONUSES[ideology];

  return bonuses.propagandaEffectiveness;
}

/**
 * Get cultural defense bonus from ideology
 */
export function getIdeologyCulturalDefense(nation: Nation): number {
  if (!nation.ideologyState) return 0;

  const ideology = nation.ideologyState.currentIdeology;
  const bonuses = IDEOLOGY_BONUSES[ideology];

  return bonuses.culturalDefenseBonus;
}

/**
 * Update ideology stability over time
 */
export function updateIdeologyStability(nation: Nation): void {
  if (!nation.ideologyState) return;

  const { ideologyStability, currentIdeology, ideologicalSupport } = nation.ideologyState;

  // Base stability recovery
  let stabilityChange = 1;

  // High support for current ideology increases stability
  const currentSupport = ideologicalSupport[currentIdeology];
  if (currentSupport > 70) {
    stabilityChange += 2;
  } else if (currentSupport < 40) {
    stabilityChange -= 2;
  }

  // High morale helps stability
  if (nation.morale > 70) {
    stabilityChange += 1;
  } else if (nation.morale < 30) {
    stabilityChange -= 2;
  }

  // Low instability helps
  if (nation.instability && nation.instability < 20) {
    stabilityChange += 1;
  }

  // Apply change
  nation.ideologyState.ideologyStability = Math.max(
    0,
    Math.min(100, ideologyStability + stabilityChange)
  );
}

/**
 * Process all ideology mechanics for a turn
 */
export function processIdeologyTurn(nation: Nation, turn: number): IdeologyEvent[] {
  const events: IdeologyEvent[] = [];

  if (!nation.ideologyState) return events;

  // Process ideological pressures
  processIdeologicalPressures(nation);

  // Update stability
  updateIdeologyStability(nation);

  // Check revolution risk
  const revolutionEvent = checkRevolutionRisk(nation, turn);
  if (revolutionEvent) {
    events.push(revolutionEvent);
  }

  return events;
}
