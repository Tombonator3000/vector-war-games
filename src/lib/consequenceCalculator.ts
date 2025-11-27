import type {
  ActionConsequences,
  ConsequenceCalculationContext,
  Consequence,
} from '@/types/consequences';
import type { Nation } from '@/types/game';
import { safePercentage } from '@/lib/safeMath';
import { canFormAlliance, getRelationship, RELATIONSHIP_ALLIED } from '@/lib/relationshipUtils';
import { calculateMissileInterceptChance } from '@/lib/missileDefense';

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

  // Calculate interception probability
  const defenseStrength = targetNation.defense || 0;
  const alliedInterceptors = allNations
    .filter(
      (nation) =>
        nation.id !== targetNation.id && nation.treaties?.[targetNation.id]?.alliance && nation.defense > 0
    )
    .map((nation) => nation.defense || 0);
  const interceptBreakdown = calculateMissileInterceptChance(defenseStrength, alliedInterceptors);
  const interceptionChance = Math.round(interceptBreakdown.totalChance * 100);
  const successProbability = 100 - interceptionChance;

  const retaliationCapacity =
    (targetNation.missiles || 0) + (targetNation.bombers || 0) + (targetNation.submarines || 0);
  const alliedCount = targetNation.alliances?.length ?? 0;
  const averageInstability =
    allNations.length > 0
      ? allNations.reduce((sum, nation) => sum + (nation.instability ?? 0), 0) / allNations.length
      : 0;
  const populationPressure = safePercentage(targetNation.population, 1500, 0);
  const globalRadiation = context.gameState?.globalRadiation ?? 0;
  const nuclearWinterLevel = context.gameState?.nuclearWinterLevel ?? 0;

  const retaliationProbability = Math.min(95, 35 + retaliationCapacity * 8 + Math.round(warheadYield * 2));
  const radiationHellProbability = Math.min(
    100,
    50 + Math.round(warheadYield * 4) + Math.round(populationPressure / 2)
  );
  const healthCollapseProbability = Math.min(
    95,
    30 + Math.round(warheadYield * 3) + Math.max(0, Math.round(averageInstability / 2))
  );
  const famineProbability = Math.min(
    90,
    15 + Math.round(warheadYield * 2.5) + Math.round(nuclearWinterLevel * 20) + Math.round(globalRadiation * 15)
  );
  const diplomaticCollapseChance = Math.min(
    95,
    25 + alliedCount * 10 + Math.round(retaliationCapacity * 5) + (context.currentDefcon <= 2 ? 20 : 0)
  );
  const environmentalMeltdownChance = Math.min(
    90,
    20 + Math.round(warheadYield * 3.5) + Math.round(globalRadiation * 25) + Math.round(nuclearWinterLevel * 25)
  );
  const civilUnrestChance = Math.min(
    85,
    20 + Math.round((playerNation.instability ?? 0) * 5) + Math.round(warheadYield * 2)
  );

  // Calculate casualties
  const estimatedCasualties = Math.floor(warheadYield * 1000000 * (1 + Math.random() * 0.5));
  const casualtyRange = {
    min: Math.floor(estimatedCasualties * 0.7),
    max: Math.floor(estimatedCasualties * 1.3),
  };

  // Calculate DEFCON change
  let defconChange = 0;
  if (currentDefcon > 2) defconChange = -1;
  if (currentDefcon > 3 && warheadYield >= 10) defconChange = -2;
  const newDefcon = Math.max(1, currentDefcon + defconChange);

  // Calculate relationship impacts
  const relationshipChanges = allNations
    .filter((n) => n.name !== playerNation.name && n.name !== targetNation.name)
    .map((nation) => {
      // Allies of target are angry
      if (targetNation.alliances?.includes(nation.name)) {
        return { nation: nation.name, change: -30 };
      }
      // Enemies of target might approve
      if (nation.alliances?.includes(playerNation.name)) {
        return { nation: nation.name, change: +10 };
      }
      // Neutral nations condemn nuclear use
      return { nation: nation.name, change: -15 };
    });

  const immediate: Consequence[] = [
    {
      description: `DEFCON ${currentDefcon} → ${newDefcon} (${defconChange < 0 ? 'ESCALATION' : 'Unchanged'})`,
      severity: defconChange < 0 ? 'critical' : 'neutral',
      icon: '⚠️',
    },
    {
      description: `Estimated casualties: ${casualtyRange.min.toLocaleString()}-${casualtyRange.max.toLocaleString()}`,
      severity: 'negative',
      icon: '💀',
    },
  ];

  if (successProbability < 100) {
    immediate.push({
      description: `${interceptionChance}% chance of interception`,
      severity: 'negative',
      probability: interceptionChance,
      icon: '🛡️',
    });
  }

  const longTerm: Consequence[] = [
    {
      description: `${targetNation.name} will lash back with whatever nuclear fire survives—retaliatory launches are almost certain`,
      severity: 'critical',
      probability: retaliationProbability,
      icon: '☢️',
    },
    {
      description: 'Radiation burns will flay survivors alive; field hospitals drown in screams and melted flesh',
      severity: 'critical',
      probability: radiationHellProbability,
      icon: '🔥',
    },
    {
      description: `${targetNation.name}'s health system collapses as doctors triage in blacked-out corridors and supplies run dry`,
      severity: 'negative',
      probability: healthCollapseProbability,
      icon: '🚑',
    },
    {
      description: 'Ash-choked skies poison harvests—the world staggers toward synchronized famine and ration riots',
      severity: 'critical',
      probability: famineProbability,
      icon: '🌍',
    },
  ];

  const risks: Consequence[] = [
    {
      description: `Diplomatic collapse looms—alliances fracture and neutral states spit venom at ${playerNation.name}`,
      severity: 'critical',
      probability: diplomaticCollapseChance,
      icon: '💔',
    },
    {
      description: 'Environmental catastrophe kindles: black rain, toxic seas, and choking fallout storms',
      severity: 'critical',
      probability: environmentalMeltdownChance,
      icon: '🌪️',
    },
    {
      description: `${playerNation.name} may erupt in civil unrest as terrified citizens flood the streets and demand answers`,
      severity: 'negative',
      probability: civilUnrestChance,
      icon: '🔥',
    },
  ];

  // Check if this blocks diplomatic victory
  const victoryImpact =
    newDefcon <= 2
      ? {
          victoryType: 'Diplomatic Victory',
          impact: 'BLOCKED - Peace requirement violated',
        }
      : undefined;

  const warnings: string[] = [];
  if (targetNation.alliances && targetNation.alliances.length > 2) {
    warnings.push(`${targetNation.name} has ${targetNation.alliances.length} allies who may join the war!`);
  }
  if (newDefcon === 1) {
    warnings.push('DEFCON 1: Total nuclear war imminent - mutual destruction likely!');
  }
  if ((playerNation.defense || 0) < 10) {
    warnings.push('Your defense is weak - expect heavy retaliation casualties!');
  }
  if (diplomaticCollapseChance >= 50) {
    warnings.push('Diplomatic backchannels are shattering—ambassadors are calling for evacuations in tears.');
  }
  if (environmentalMeltdownChance >= 45) {
    warnings.push('Scientists whisper about black rain and poisoned oceans—this launch could make their nightmares real.');
  }
  if (civilUnrestChance >= 40) {
    warnings.push(`${playerNation.name} faces riots and candlelight vigils collapsing into chaos once the sirens wail.`);
  }


  return {
    actionType: 'launch_missile',
    actionTitle: `Launch ${warheadYield}MT Nuclear ${deliveryMethod === 'missile' ? 'Missile' : deliveryMethod === 'bomber' ? 'Bomber' : 'Submarine'}`,
    actionDescription: `Strike ${targetNation.name} with nuclear weapons`,
    targetName: targetNation.name,
    immediate,
    longTerm,
    risks,
    defconChange: { from: currentDefcon, to: newDefcon },
    relationshipChanges,
    victoryImpact,
    successProbability,
    successDescription: `${successProbability}% chance of successful strike`,
    costs: {
      uranium: warheadYield,
      production: deliveryMethod === 'missile' ? 10 : deliveryMethod === 'bomber' ? 20 : 30,
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
