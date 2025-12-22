import type {
  ActionConsequences,
  ConsequenceCalculationContext,
  Consequence,
} from '@/types/consequences';
import type { Nation } from '@/types/game';
import { safePercentage } from '@/lib/safeMath';
import { canFormAlliance, getRelationship, RELATIONSHIP_ALLIED } from '@/lib/relationshipUtils';
import { calculateMissileInterceptChance } from '@/lib/missileDefense';

// ============================================================================
// Probability Configuration Constants
// ============================================================================

/** Probability calculation configuration for missile strike consequences */
const PROBABILITY_CONFIG = {
  retaliation: { max: 95, base: 35, capacityMultiplier: 8, yieldMultiplier: 2 },
  radiation: { max: 100, base: 50, yieldMultiplier: 4, populationMultiplier: 0.5 },
  healthCollapse: { max: 95, base: 30, yieldMultiplier: 3, instabilityMultiplier: 0.5 },
  famine: { max: 90, base: 15, yieldMultiplier: 2.5, winterMultiplier: 20, radiationMultiplier: 15 },
  diplomaticCollapse: { max: 95, base: 25, allyMultiplier: 10, capacityMultiplier: 5, defconBonus: 20 },
  environmental: { max: 90, base: 20, yieldMultiplier: 3.5, radiationMultiplier: 25, winterMultiplier: 25 },
  civilUnrest: { max: 85, base: 20, instabilityMultiplier: 5, yieldMultiplier: 2 },
} as const;

/** Warning thresholds for generating critical warnings */
const WARNING_THRESHOLDS = {
  diplomaticCollapse: 50,
  environmental: 45,
  civilUnrest: 40,
  minAlliesForWarning: 2,
  weakDefense: 10,
} as const;

/** Casualty calculation constants */
const CASUALTY_CONFIG = {
  baseMultiplier: 1000000,
  randomVariance: 0.5,
  rangeVariance: 0.3,
} as const;

// ============================================================================
// Types for Missile Launch Calculations
// ============================================================================

interface StrikeProbabilities {
  retaliation: number;
  radiation: number;
  healthCollapse: number;
  famine: number;
  diplomaticCollapse: number;
  environmental: number;
  civilUnrest: number;
}

interface StrikeContext {
  retaliationCapacity: number;
  alliedCount: number;
  averageInstability: number;
  populationPressure: number;
  globalRadiation: number;
  nuclearWinterLevel: number;
  playerInstability: number;
  defconIsCritical: boolean;
}

interface CasualtyRange {
  min: number;
  max: number;
}

interface DefconChange {
  from: number;
  to: number;
  delta: number;
}

// ============================================================================
// Helper Functions for Missile Launch Calculations
// ============================================================================

/**
 * Gather contextual data needed for probability calculations
 */
function gatherStrikeContext(
  context: ConsequenceCalculationContext,
  targetNation: Nation
): StrikeContext {
  const { playerNation, allNations } = context;

  const retaliationCapacity =
    (targetNation.missiles || 0) + (targetNation.bombers || 0) + (targetNation.submarines || 0);

  const averageInstability =
    allNations.length > 0
      ? allNations.reduce((sum, nation) => sum + (nation.instability ?? 0), 0) / allNations.length
      : 0;

  return {
    retaliationCapacity,
    alliedCount: targetNation.alliances?.length ?? 0,
    averageInstability,
    populationPressure: safePercentage(targetNation.population, 1500, 0),
    globalRadiation: context.gameState?.globalRadiation ?? 0,
    nuclearWinterLevel: context.gameState?.nuclearWinterLevel ?? 0,
    playerInstability: playerNation.instability ?? 0,
    defconIsCritical: context.currentDefcon <= 2,
  };
}

/**
 * Calculate all strike-related probabilities based on context and warhead yield
 */
function calculateStrikeProbabilities(
  warheadYield: number,
  strikeContext: StrikeContext
): StrikeProbabilities {
  const cfg = PROBABILITY_CONFIG;
  const ctx = strikeContext;

  return {
    retaliation: Math.min(
      cfg.retaliation.max,
      cfg.retaliation.base +
        ctx.retaliationCapacity * cfg.retaliation.capacityMultiplier +
        Math.round(warheadYield * cfg.retaliation.yieldMultiplier)
    ),
    radiation: Math.min(
      cfg.radiation.max,
      cfg.radiation.base +
        Math.round(warheadYield * cfg.radiation.yieldMultiplier) +
        Math.round(ctx.populationPressure * cfg.radiation.populationMultiplier)
    ),
    healthCollapse: Math.min(
      cfg.healthCollapse.max,
      cfg.healthCollapse.base +
        Math.round(warheadYield * cfg.healthCollapse.yieldMultiplier) +
        Math.max(0, Math.round(ctx.averageInstability * cfg.healthCollapse.instabilityMultiplier))
    ),
    famine: Math.min(
      cfg.famine.max,
      cfg.famine.base +
        Math.round(warheadYield * cfg.famine.yieldMultiplier) +
        Math.round(ctx.nuclearWinterLevel * cfg.famine.winterMultiplier) +
        Math.round(ctx.globalRadiation * cfg.famine.radiationMultiplier)
    ),
    diplomaticCollapse: Math.min(
      cfg.diplomaticCollapse.max,
      cfg.diplomaticCollapse.base +
        ctx.alliedCount * cfg.diplomaticCollapse.allyMultiplier +
        Math.round(ctx.retaliationCapacity * cfg.diplomaticCollapse.capacityMultiplier) +
        (ctx.defconIsCritical ? cfg.diplomaticCollapse.defconBonus : 0)
    ),
    environmental: Math.min(
      cfg.environmental.max,
      cfg.environmental.base +
        Math.round(warheadYield * cfg.environmental.yieldMultiplier) +
        Math.round(ctx.globalRadiation * cfg.environmental.radiationMultiplier) +
        Math.round(ctx.nuclearWinterLevel * cfg.environmental.winterMultiplier)
    ),
    civilUnrest: Math.min(
      cfg.civilUnrest.max,
      cfg.civilUnrest.base +
        Math.round(ctx.playerInstability * cfg.civilUnrest.instabilityMultiplier) +
        Math.round(warheadYield * cfg.civilUnrest.yieldMultiplier)
    ),
  };
}

/**
 * Calculate casualty estimates based on warhead yield
 */
function calculateCasualtyRange(warheadYield: number): CasualtyRange {
  const { baseMultiplier, randomVariance, rangeVariance } = CASUALTY_CONFIG;
  const estimatedCasualties = Math.floor(
    warheadYield * baseMultiplier * (1 + Math.random() * randomVariance)
  );
  return {
    min: Math.floor(estimatedCasualties * (1 - rangeVariance)),
    max: Math.floor(estimatedCasualties * (1 + rangeVariance)),
  };
}

/**
 * Calculate DEFCON level changes based on current level and warhead yield
 */
function calculateDefconChange(currentDefcon: number, warheadYield: number): DefconChange {
  let delta = 0;
  if (currentDefcon > 2) delta = -1;
  if (currentDefcon > 3 && warheadYield >= 10) delta = -2;

  return {
    from: currentDefcon,
    to: Math.max(1, currentDefcon + delta),
    delta,
  };
}

/**
 * Calculate interception probability using missile defense systems
 */
function calculateInterceptionData(
  targetNation: Nation,
  allNations: Nation[]
): { interceptionChance: number; successProbability: number } {
  const defenseStrength = targetNation.defense || 0;
  const alliedInterceptors = allNations
    .filter(
      (nation) =>
        nation.id !== targetNation.id &&
        nation.treaties?.[targetNation.id]?.alliance &&
        nation.defense > 0
    )
    .map((nation) => nation.defense || 0);

  const interceptBreakdown = calculateMissileInterceptChance(defenseStrength, alliedInterceptors);
  const interceptionChance = Math.round(interceptBreakdown.totalChance * 100);

  return {
    interceptionChance,
    successProbability: 100 - interceptionChance,
  };
}

/**
 * Calculate relationship changes with other nations after a nuclear strike
 */
function calculateRelationshipChanges(
  playerNation: Nation,
  targetNation: Nation,
  allNations: Nation[]
): Array<{ nation: string; change: number }> {
  return allNations
    .filter((n) => n.name !== playerNation.name && n.name !== targetNation.name)
    .map((nation) => {
      if (targetNation.alliances?.includes(nation.name)) {
        return { nation: nation.name, change: -30 }; // Allies of target are angry
      }
      if (nation.alliances?.includes(playerNation.name)) {
        return { nation: nation.name, change: +10 }; // Player's allies might approve
      }
      return { nation: nation.name, change: -15 }; // Neutral nations condemn nuclear use
    });
}

/**
 * Build immediate consequences for the strike
 */
function buildImmediateConsequences(
  defconChange: DefconChange,
  casualtyRange: CasualtyRange,
  interceptionChance: number,
  successProbability: number
): Consequence[] {
  const consequences: Consequence[] = [
    {
      description: `DEFCON ${defconChange.from} → ${defconChange.to} (${defconChange.delta < 0 ? 'ESCALATION' : 'Unchanged'})`,
      severity: defconChange.delta < 0 ? 'critical' : 'neutral',
      icon: '⚠️',
    },
    {
      description: `Estimated casualties: ${casualtyRange.min.toLocaleString()}-${casualtyRange.max.toLocaleString()}`,
      severity: 'negative',
      icon: '💀',
    },
  ];

  if (successProbability < 100) {
    consequences.push({
      description: `${interceptionChance}% chance of interception`,
      severity: 'negative',
      probability: interceptionChance,
      icon: '🛡️',
    });
  }

  return consequences;
}

/**
 * Build long-term consequences for the strike
 */
function buildLongTermConsequences(
  targetNationName: string,
  probabilities: StrikeProbabilities
): Consequence[] {
  return [
    {
      description: `${targetNationName} will lash back with whatever nuclear fire survives—retaliatory launches are almost certain`,
      severity: 'critical',
      probability: probabilities.retaliation,
      icon: '☢️',
    },
    {
      description: 'Radiation burns will flay survivors alive; field hospitals drown in screams and melted flesh',
      severity: 'critical',
      probability: probabilities.radiation,
      icon: '🔥',
    },
    {
      description: `${targetNationName}'s health system collapses as doctors triage in blacked-out corridors and supplies run dry`,
      severity: 'negative',
      probability: probabilities.healthCollapse,
      icon: '🚑',
    },
    {
      description: 'Ash-choked skies poison harvests—the world staggers toward synchronized famine and ration riots',
      severity: 'critical',
      probability: probabilities.famine,
      icon: '🌍',
    },
  ];
}

/**
 * Build risk consequences for the strike
 */
function buildRiskConsequences(
  playerNationName: string,
  probabilities: StrikeProbabilities
): Consequence[] {
  return [
    {
      description: `Diplomatic collapse looms—alliances fracture and neutral states spit venom at ${playerNationName}`,
      severity: 'critical',
      probability: probabilities.diplomaticCollapse,
      icon: '💔',
    },
    {
      description: 'Environmental catastrophe kindles: black rain, toxic seas, and choking fallout storms',
      severity: 'critical',
      probability: probabilities.environmental,
      icon: '🌪️',
    },
    {
      description: `${playerNationName} may erupt in civil unrest as terrified citizens flood the streets and demand answers`,
      severity: 'negative',
      probability: probabilities.civilUnrest,
      icon: '🔥',
    },
  ];
}

/**
 * Generate warnings based on calculated probabilities and context
 */
function generateWarnings(
  playerNation: Nation,
  targetNation: Nation,
  newDefcon: number,
  probabilities: StrikeProbabilities
): string[] {
  const warnings: string[] = [];
  const thresholds = WARNING_THRESHOLDS;

  if (targetNation.alliances && targetNation.alliances.length > thresholds.minAlliesForWarning) {
    warnings.push(`${targetNation.name} has ${targetNation.alliances.length} allies who may join the war!`);
  }
  if (newDefcon === 1) {
    warnings.push('DEFCON 1: Total nuclear war imminent - mutual destruction likely!');
  }
  if ((playerNation.defense || 0) < thresholds.weakDefense) {
    warnings.push('Your defense is weak - expect heavy retaliation casualties!');
  }
  if (probabilities.diplomaticCollapse >= thresholds.diplomaticCollapse) {
    warnings.push('Diplomatic backchannels are shattering—ambassadors are calling for evacuations in tears.');
  }
  if (probabilities.environmental >= thresholds.environmental) {
    warnings.push('Scientists whisper about black rain and poisoned oceans—this launch could make their nightmares real.');
  }
  if (probabilities.civilUnrest >= thresholds.civilUnrest) {
    warnings.push(`${playerNation.name} faces riots and candlelight vigils collapsing into chaos once the sirens wail.`);
  }

  return warnings;
}

/**
 * Get the display name for a delivery method
 */
function getDeliveryMethodDisplayName(deliveryMethod: 'missile' | 'bomber' | 'submarine'): string {
  const displayNames: Record<typeof deliveryMethod, string> = {
    missile: 'Missile',
    bomber: 'Bomber',
    submarine: 'Submarine',
  };
  return displayNames[deliveryMethod];
}

/**
 * Get the production cost for a delivery method
 */
function getDeliveryMethodCost(deliveryMethod: 'missile' | 'bomber' | 'submarine'): number {
  const costs: Record<typeof deliveryMethod, number> = {
    missile: 10,
    bomber: 20,
    submarine: 30,
  };
  return costs[deliveryMethod];
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Calculate consequences for launching a nuclear missile
 */
export function calculateMissileLaunchConsequences(
  context: ConsequenceCalculationContext,
  warheadYield: number,
  deliveryMethod: 'missile' | 'bomber' | 'submarine'
): ActionConsequences {
  const { playerNation, targetNation, allNations, currentDefcon } = context;

  if (!targetNation) {
    throw new Error('Target nation required for missile launch');
  }

  // Gather context and calculate core data
  const strikeContext = gatherStrikeContext(context, targetNation);
  const probabilities = calculateStrikeProbabilities(warheadYield, strikeContext);
  const { interceptionChance, successProbability } = calculateInterceptionData(targetNation, allNations);
  const casualtyRange = calculateCasualtyRange(warheadYield);
  const defconChange = calculateDefconChange(currentDefcon, warheadYield);

  // Build consequences
  const relationshipChanges = calculateRelationshipChanges(playerNation, targetNation, allNations);
  const immediate = buildImmediateConsequences(defconChange, casualtyRange, interceptionChance, successProbability);
  const longTerm = buildLongTermConsequences(targetNation.name, probabilities);
  const risks = buildRiskConsequences(playerNation.name, probabilities);
  const warnings = generateWarnings(playerNation, targetNation, defconChange.to, probabilities);

  // Determine victory impact
  const victoryImpact =
    defconChange.to <= 2
      ? { victoryType: 'Diplomatic Victory', impact: 'BLOCKED - Peace requirement violated' }
      : undefined;

  return {
    actionType: 'launch_missile',
    actionTitle: `Launch ${warheadYield}MT Nuclear ${getDeliveryMethodDisplayName(deliveryMethod)}`,
    actionDescription: `Strike ${targetNation.name} with nuclear weapons`,
    targetName: targetNation.name,
    immediate,
    longTerm,
    risks,
    defconChange: { from: defconChange.from, to: defconChange.to },
    relationshipChanges,
    victoryImpact,
    successProbability,
    successDescription: `${successProbability}% chance of successful strike`,
    costs: {
      uranium: warheadYield,
      production: getDeliveryMethodCost(deliveryMethod),
      actions: 1,
    },
    warnings,
  };
}

/**
 * Calculate consequences for forming an alliance
 */
export function calculateAllianceConsequences(
  context: ConsequenceCalculationContext,
  targetNation: Nation
): ActionConsequences {
  const { playerNation, allNations } = context;

  // Calculate success probability based on relations
  const currentRelation = getRelationship(playerNation, targetNation.id);
  const successProbability = Math.min(90, Math.max(10, currentRelation + 20));

  const blockedReasons: string[] = [];
  if (!canFormAlliance(currentRelation)) {
    blockedReasons.push(
      `Requires relationship of +${RELATIONSHIP_ALLIED}. Current: ${currentRelation}`
    );
  }

  const immediate: Consequence[] = [
    {
      description: `+20 Global Influence (→ ${(context.gameState?.diplomacy?.influenceScore || 0) + 20})`,
      severity: 'positive',
      icon: '📈',
    },
    {
      description: `${targetNation.name} will defend you in wars`,
      severity: 'positive',
      icon: '🛡️',
    },
    {
      description: 'Access to their controlled territories',
      severity: 'positive',
      icon: '🗺️',
    },
  ];

  const longTerm: Consequence[] = [
    {
      description: 'Permanent 50 Production upkeep cost',
      severity: 'negative',
      icon: '💰',
    },
  ];

  // Find enemies of target
  const targetEnemies = allNations.filter(
    (n) =>
      n.name !== playerNation.name &&
      n.name !== targetNation.name &&
      targetNation.alliances &&
      !targetNation.alliances.includes(n.name)
  );

  const risks: Consequence[] = [];
  const relationshipChanges = targetEnemies.slice(0, 3).map((nation) => ({
    nation: nation.name,
    change: -15,
  }));

  if (relationshipChanges.length > 0) {
    risks.push({
      description: `${relationshipChanges.length} nations may view you as hostile`,
      severity: 'negative',
      probability: 60,
      icon: '😠',
    });
  }

  // Calculate progress toward diplomatic victory
  const currentAlliances = playerNation.alliances?.length || 0;
  const totalNations = allNations.filter((n) => n.population > 0).length - 1;
  const requiredAlliances = Math.ceil(totalNations * 0.6);
  const newProgress = Math.min(100, safePercentage(currentAlliances + 1, requiredAlliances, 0));

  const victoryImpact = {
    victoryType: 'Diplomatic Victory',
    impact: `${Math.round(newProgress)}% progress (+${Math.round(safePercentage(1, requiredAlliances, 0))}%)`,
  };

  return {
    actionType: 'form_alliance',
    actionTitle: `Form Alliance with ${targetNation.name}`,
    actionDescription: 'Permanent diplomatic and military partnership',
    targetName: targetNation.name,
    immediate,
    longTerm,
    risks,
    relationshipChanges,
    victoryImpact,
    successProbability,
    successDescription: `${successProbability}% chance of acceptance`,
    costs: {
      production: 50,
      actions: 1,
    },
    blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined,
    warnings:
      successProbability < 50
        ? ['Low acceptance chance - improve relations first']
        : [],
  };
}

/**
 * Calculate consequences for cyber attack
 */
export function calculateCyberAttackConsequences(
  context: ConsequenceCalculationContext,
  targetNation: Nation,
  attackType: 'intrusion' | 'sabotage' | 'false_flag'
): ActionConsequences {
  const { currentDefcon } = context;

  const detectionChance = 40; // Base detection chance
  const successProbability = 100 - detectionChance;

  const immediate: Consequence[] = [
    {
      description: 'Steal 30-50 Intel from target',
      severity: 'positive',
      icon: '🔍',
      probability: successProbability,
    },
    {
      description: `Reduce target readiness by ${attackType === 'sabotage' ? '20%' : '10%'}`,
      severity: 'positive',
      icon: '⚡',
    },
  ];

  const risks: Consequence[] = [
    {
      description: `${detectionChance}% chance of attribution`,
      severity: 'negative',
      probability: detectionChance,
      icon: '🔍',
    },
  ];

  if (detectionChance > 0) {
    risks.push({
      description: 'If detected: Relations drop by -25',
      severity: 'critical',
      probability: detectionChance,
      icon: '😠',
    });
    if (currentDefcon <= 3) {
      risks.push({
        description: 'If detected: May trigger military response',
        severity: 'critical',
        probability: 30,
        icon: '⚔️',
      });
    }
  }

  return {
    actionType: 'cyber_attack',
    actionTitle: `Cyber ${attackType === 'false_flag' ? 'False Flag' : attackType === 'sabotage' ? 'Sabotage' : 'Intrusion'}`,
    actionDescription: `Hack ${targetNation.name}'s systems`,
    targetName: targetNation.name,
    immediate,
    longTerm: [],
    risks,
    successProbability,
    successDescription: `${successProbability}% chance to remain undetected`,
    costs: {
      intel: attackType === 'false_flag' ? 35 : 30,
      actions: 1,
    },
  };
}

/**
 * Calculate consequences for building a city
 */
export function calculateBuildCityConsequences(
  context: ConsequenceCalculationContext
): ActionConsequences {
  const { playerNation, allNations } = context;

  const currentCities = playerNation.cities || 0;
  const requiredCities = 10;
  const newProgress = Math.min(100, safePercentage(currentCities + 1, requiredCities, 0));

  const immediate: Consequence[] = [
    {
      description: '+15 Production per turn (permanent)',
      severity: 'positive',
      icon: '🏭',
    },
    {
      description: '+5M Population capacity',
      severity: 'positive',
      icon: '👥',
    },
    {
      description: 'New strategic economic hub',
      severity: 'positive',
      icon: '🏙️',
    },
  ];

  const longTerm: Consequence[] = [
    {
      description: 'Vulnerable to nuclear strikes',
      severity: 'negative',
      icon: '🎯',
    },
    {
      description: 'Increases enemy targeting priority',
      severity: 'negative',
      icon: '⚠️',
    },
  ];

  return {
    actionType: 'build_city',
    actionTitle: 'Build City',
    actionDescription: 'Construct new economic center',
    immediate,
    longTerm,
    risks: [],
    victoryImpact: {
      victoryType: 'Economic Victory',
      impact: `${Math.round(newProgress)}% progress (+${Math.round(safePercentage(1, requiredCities, 0))}%)`,
    },
    costs: {
      production: 150,
    },
  };
}

/**
 * Calculate consequences for deploying conventional forces
 */
export function calculateConventionalDeploymentConsequences(
  context: ConsequenceCalculationContext,
  targetTerritory: string,
  forceType: 'army' | 'navy' | 'air'
): ActionConsequences {
  const { playerNation, currentDefcon } = context;

  const immediate: Consequence[] = [
    {
      description: `Deploy ${forceType} unit to ${targetTerritory}`,
      severity: 'positive',
      icon: forceType === 'army' ? '⚔️' : forceType === 'navy' ? '⚓' : '✈️',
    },
    {
      description: 'Increases territorial control',
      severity: 'positive',
      icon: '🗺️',
    },
  ];

  const longTerm: Consequence[] = [
    {
      description: 'Unit requires 5 Production/turn upkeep',
      severity: 'negative',
      icon: '💰',
    },
  ];

  const risks: Consequence[] = [];
  if (currentDefcon <= 3) {
    risks.push({
      description: 'May trigger border conflicts',
      severity: 'negative',
      probability: 40,
      icon: '⚔️',
    });
  }

  return {
    actionType: 'deploy_conventional',
    actionTitle: `Deploy ${forceType.toUpperCase()} Unit`,
    actionDescription: `Station forces in ${targetTerritory}`,
    immediate,
    longTerm,
    risks,
    costs: {
      production: 30,
      actions: 1,
    },
  };
}

/**
 * Calculate consequences for breaking an alliance
 */
export function calculateBreakAllianceConsequences(
  context: ConsequenceCalculationContext,
  targetNation: Nation
): ActionConsequences {
  const { allNations } = context;

  const immediate: Consequence[] = [
    {
      description: `${targetNation.name} relations drop to HOSTILE`,
      severity: 'critical',
      icon: '😠',
    },
    {
      description: 'Lose access to their territories',
      severity: 'negative',
      icon: '🗺️',
    },
    {
      description: 'No longer receive defensive support',
      severity: 'negative',
      icon: '🛡️',
    },
  ];

  const risks: Consequence[] = [
    {
      description: `${targetNation.name} may declare war`,
      severity: 'critical',
      probability: 60,
      icon: '⚔️',
    },
    {
      description: 'Other nations lose trust (-10 global influence)',
      severity: 'negative',
      icon: '📉',
    },
  ];

  const alliedNations = allNations.filter(
    (n) => targetNation.alliances?.includes(n.name)
  );

  if (alliedNations.length > 0) {
    risks.push({
      description: `${targetNation.name}'s ${alliedNations.length} allies may turn hostile`,
      severity: 'critical',
      probability: 50,
      icon: '💔',
    });
  }

  return {
    actionType: 'break_alliance',
    actionTitle: `Break Alliance with ${targetNation.name}`,
    actionDescription: 'Terminate diplomatic partnership',
    immediate,
    longTerm: [],
    risks,
    victoryImpact: {
      victoryType: 'Diplomatic Victory',
      impact: 'Significant setback to progress',
    },
    costs: {
      actions: 1,
    },
    warnings: ['This action cannot be undone and will severely damage relations'],
  };
}

/**
 * Calculate consequences for declaring war
 */
export function calculateDeclareWarConsequences(
  context: ConsequenceCalculationContext,
  targetNation: Nation
): ActionConsequences {
  const { allNations, currentDefcon } = context;

  let defconChange = 0;
  if (currentDefcon > 2) defconChange = -1;
  const newDefcon = Math.max(1, currentDefcon + defconChange);

  const targetAllies = allNations.filter(
    (n) => targetNation.alliances?.includes(n.name)
  );

  const immediate: Consequence[] = [
    {
      description: 'State of war declared',
      severity: 'critical',
      icon: '⚔️',
    },
    {
      description: `DEFCON ${currentDefcon} → ${newDefcon}`,
      severity: 'critical',
      icon: '⚠️',
    },
  ];

  if (targetAllies.length > 0) {
    immediate.push({
      description: `${targetAllies.length} allied nations join the war`,
      severity: 'critical',
      icon: '🌍',
    });
  }

  const longTerm: Consequence[] = [
    {
      description: 'Global opinion decreases by 15',
      severity: 'negative',
      icon: '📉',
    },
    {
      description: 'War economy: +20% Production, -10% Morale',
      severity: 'neutral',
      icon: '⚖️',
    },
  ];

  return {
    actionType: 'declare_war',
    actionTitle: `Declare War on ${targetNation.name}`,
    actionDescription: 'Formal state of hostilities',
    immediate,
    longTerm,
    risks: [
      {
        description: 'May escalate to nuclear conflict',
        severity: 'critical',
        probability: 30,
        icon: '☢️',
      },
    ],
    defconChange: { from: currentDefcon, to: newDefcon },
    victoryImpact: {
      victoryType: 'Diplomatic Victory',
      impact: 'BLOCKED - Cannot achieve while at war',
    },
    costs: {
      actions: 1,
    },
    warnings:
      targetAllies.length > 2
        ? [`${targetNation.name} has ${targetAllies.length} allies who will join the war!`]
        : [],
  };
}

/**
 * Calculate consequences for bio-weapon deployment
 */
export function calculateBioWeaponDeploymentConsequences(
  context: ConsequenceCalculationContext,
  targetNations: Nation[],
  plagueType: string
): ActionConsequences {
  const { currentDefcon } = context;

  const totalPopulation = targetNations.reduce((sum, n) => sum + n.population, 0);
  const estimatedCasualties = Math.floor(totalPopulation * 0.3); // 30% infection rate

  const defconChange = currentDefcon > 2 ? -1 : 0;
  const newDefcon = Math.max(1, currentDefcon + defconChange);

  const immediate: Consequence[] = [
    {
      description: `Deploy ${plagueType} to ${targetNations.length} nation${
        targetNations.length > 1 ? 's' : ''
      }`,
      severity: 'critical',
      icon: '🦠',
    },
    {
      description: `Estimated casualties: ${estimatedCasualties.toLocaleString()}`,
      severity: 'critical',
      icon: '💀',
    },
  ];

  const risks: Consequence[] = [
    {
      description: '40% chance of detection and attribution',
      severity: 'critical',
      probability: 40,
      icon: '🔍',
    },
    {
      description: 'If detected: All nations declare war',
      severity: 'critical',
      probability: 40,
      icon: '⚔️',
    },
    {
      description: 'Plague may spread to your population',
      severity: 'critical',
      probability: 25,
      icon: '🦠',
    },
  ];

  return {
    actionType: 'deploy_bio_weapon',
    actionTitle: `Deploy ${plagueType}`,
    actionDescription: `Biological attack on ${targetNations.map((n) => n.name).join(', ')}`,
    immediate,
    longTerm: [
      {
        description: 'Global pandemic may destabilize all nations',
        severity: 'critical',
        icon: '🌍',
      },
    ],
    risks,
    defconChange: { from: currentDefcon, to: newDefcon },
    costs: {
      intel: 50,
      actions: 1,
    },
    warnings: [
      'Bio-weapons are considered crimes against humanity',
      'Detection will result in global condemnation',
    ],
  };
}

/**
 * Main consequence calculator - routes to specific calculators
 */
export function calculateActionConsequences(
  actionType: string,
  context: ConsequenceCalculationContext,
  actionParams: any
): ActionConsequences | null {
  switch (actionType) {
    case 'launch_missile':
      return calculateMissileLaunchConsequences(
        context,
        actionParams.warheadYield,
        actionParams.deliveryMethod
      );
    case 'form_alliance':
      return calculateAllianceConsequences(context, actionParams.targetNation);
    case 'break_alliance':
      return calculateBreakAllianceConsequences(context, actionParams.targetNation);
    case 'cyber_attack':
      return calculateCyberAttackConsequences(
        context,
        actionParams.targetNation,
        actionParams.attackType
      );
    case 'declare_war':
      return calculateDeclareWarConsequences(context, actionParams.targetNation);
    case 'deploy_conventional':
      return calculateConventionalDeploymentConsequences(
        context,
        actionParams.territory,
        actionParams.forceType
      );
    case 'deploy_bio_weapon':
      return calculateBioWeaponDeploymentConsequences(
        context,
        actionParams.targetNations,
        actionParams.plagueType
      );
    case 'build_city':
      return calculateBuildCityConsequences(context);
    default:
      return null;
  }
}
