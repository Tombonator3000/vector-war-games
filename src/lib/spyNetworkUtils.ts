/**
 * Spy Network System Utilities
 *
 * Functions for managing individual spy agents, missions, and counter-intelligence
 */

import type { Nation, GameState } from '@/types/game';
import type {
  SpyAgent,
  SpyMission,
  SpyMissionType,
  SpyNetworkState,
  SpyRecruitmentOptions,
  CompletedMission,
  MissionResult,
  MissionReward,
  CounterIntelOperation,
  SpyIncident,
  SpyIncidentResolution,
  SpyStatus,
  SpyTrainingLevel,
} from '@/types/spySystem';
import {
  SPY_COSTS,
  MISSION_DURATIONS,
  BASE_DETECTION_RISKS,
  SPY_CAUGHT_PENALTIES,
  SKILL_PROGRESSION,
  COUNTER_INTEL_EFFECTIVENESS,
} from '@/types/spySystem';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize spy network for a nation
 */
export function initializeSpyNetwork(): SpyNetworkState {
  return {
    spies: [],
    activeMissions: [],
    completedMissions: [],
    incidents: [],
    counterIntelOps: [],
    recruitmentCooldown: 0,
    totalSpiesCaptured: 0,
    totalSpiesLost: 0,
    totalSuccessfulMissions: 0,
    reputation: 'unknown',
  };
}

// ============================================================================
// SPY RECRUITMENT
// ============================================================================

/**
 * Generate a random spy name based on cover
 */
function generateSpyName(cover: string): string {
  const firstNames = ['Alex', 'Morgan', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Blake', 'Quinn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

/**
 * Calculate recruitment cost based on training level
 */
export function getRecruitmentCost(trainingLevel: SpyTrainingLevel = 'operative'): { intel: number; production: number } {
  switch (trainingLevel) {
    case 'recruit':
      return SPY_COSTS.RECRUIT_BASE;
    case 'operative':
    case 'agent':
      return SPY_COSTS.RECRUIT_TRAINED;
    case 'elite':
    case 'master':
      return SPY_COSTS.RECRUIT_ELITE;
    default:
      return SPY_COSTS.RECRUIT_BASE;
  }
}

/**
 * Recruit a new spy agent
 */
export function recruitSpy(
  nation: Nation,
  turn: number,
  options: SpyRecruitmentOptions
): SpyAgent {
  const { cover, targetNation, specialization, trainingLevel = 'operative' } = options;

  // Determine initial skill based on training level
  let initialSkill = 30;
  switch (trainingLevel) {
    case 'recruit':
      initialSkill = 15;
      break;
    case 'operative':
      initialSkill = 35;
      break;
    case 'agent':
      initialSkill = 55;
      break;
    case 'elite':
      initialSkill = 75;
      break;
    case 'master':
      initialSkill = 90;
      break;
  }

  const spy: SpyAgent = {
    id: uuidv4(),
    name: generateSpyName(cover),
    nationId: nation.id,
    targetNationId: targetNation || null,
    skill: initialSkill + Math.floor(Math.random() * 10),
    experience: 0,
    cover,
    status: targetNation ? 'active' : 'idle',
    recruitedTurn: turn,
    missionHistory: [],
    discoveryRisk: 10,
    morale: 80 + Math.floor(Math.random() * 20),
    trainingLevel,
    specializations: specialization ? [specialization] : undefined,
  };

  return spy;
}

/**
 * Check if nation can recruit a spy
 */
export function canRecruitSpy(
  nation: Nation,
  trainingLevel: SpyTrainingLevel = 'operative'
): { canRecruit: boolean; reason?: string } {
  const cost = getRecruitmentCost(trainingLevel);

  if (nation.intel < cost.intel) {
    return { canRecruit: false, reason: `Insufficient Intel (need ${cost.intel})` };
  }

  if (nation.production < cost.production) {
    return { canRecruit: false, reason: `Insufficient Production (need ${cost.production})` };
  }

  const network = nation.spyNetwork;
  if (network && network.recruitmentCooldown > 0) {
    return { canRecruit: false, reason: `Recruitment on cooldown (${network.recruitmentCooldown} turns)` };
  }

  return { canRecruit: true };
}

// ============================================================================
// SPY MISSIONS
// ============================================================================

/**
 * Get mission cost
 */
export function getMissionCost(missionType: SpyMissionType): { intel: number; production?: number } {
  const cost: { intel: number; production?: number } = {
    intel: SPY_COSTS.STEAL_TECH,
  };

  switch (missionType) {
    case 'steal-tech':
      cost.intel = SPY_COSTS.STEAL_TECH;
      break;
    case 'sabotage-production':
      cost.intel = SPY_COSTS.SABOTAGE_PRODUCTION;
      cost.production = SPY_COSTS.SABOTAGE_PRODUCTION_PROD;
      break;
    case 'sabotage-military':
      cost.intel = SPY_COSTS.SABOTAGE_MILITARY;
      break;
    case 'rig-election':
      cost.intel = SPY_COSTS.RIG_ELECTION;
      break;
    case 'sow-dissent':
      cost.intel = SPY_COSTS.SOW_DISSENT;
      break;
    case 'assassination':
      cost.intel = SPY_COSTS.ASSASSINATION;
      cost.production = SPY_COSTS.ASSASSINATION_PROD;
      break;
    case 'gather-intel':
      cost.intel = SPY_COSTS.GATHER_INTEL;
      break;
    case 'counter-intel':
      cost.intel = SPY_COSTS.COUNTER_INTEL;
      break;
    case 'propaganda':
      cost.intel = SPY_COSTS.PROPAGANDA;
      break;
    case 'recruit-asset':
      cost.intel = SPY_COSTS.RECRUIT_ASSET;
      break;
    case 'cyber-assist':
      cost.intel = SPY_COSTS.CYBER_ASSIST;
      break;
    case 'false-flag':
      cost.intel = SPY_COSTS.FALSE_FLAG;
      break;
    case 'exfiltrate':
      cost.intel = SPY_COSTS.EXFILTRATE;
      break;
  }

  return cost;
}

/**
 * Calculate mission success chance
 */
export function calculateMissionSuccessChance(
  spy: SpyAgent,
  target: Nation,
  missionType: SpyMissionType,
  spyNation: Nation
): number {
  // Base success chance from spy skill
  let successChance = spy.skill;

  // Morale affects performance
  const moraleModifier = (spy.morale - 50) * 0.2;
  successChance += moraleModifier;

  // Experience bonus
  const experienceBonus = Math.min(spy.experience * 0.5, 20);
  successChance += experienceBonus;

  // Specialization bonus
  if (spy.specializations) {
    const relevantSpec = getRelevantSpecialization(missionType, spy.specializations);
    if (relevantSpec) {
      successChance += 15;
    }
  }

  // Target's cyber defense reduces success
  const targetDefense = target.cyber?.defense || 0;
  successChance -= targetDefense * 0.3;

  // Relationship affects suspicion level
  const relationship = spyNation.relationships?.[target.id] || 0;
  if (relationship > 50) {
    successChance += 10; // Trusted, less suspicious
  } else if (relationship < -50) {
    successChance -= 15; // Hostile, more vigilant
  }

  // Mission difficulty
  const baseDifficulty = getMissionDifficulty(missionType);
  successChance -= baseDifficulty;

  // Cyber warfare bonus
  if (spyNation.cyber?.offense) {
    successChance += spyNation.cyber.offense * 0.2;
  }

  // Clamp between 5 and 95
  return Math.max(5, Math.min(95, successChance));
}

/**
 * Calculate detection risk for mission
 */
export function calculateDetectionRisk(
  spy: SpyAgent,
  target: Nation,
  missionType: SpyMissionType,
  spyNation: Nation
): number {
  // Base risk for mission type
  let detectionRisk = getBaseDetectionRisk(missionType);

  // Spy skill reduces risk
  detectionRisk -= spy.skill * 0.3;

  // Cover quality affects risk
  const coverBonus = getCoverQuality(spy.cover, target);
  detectionRisk -= coverBonus;

  // Discovery risk accumulation
  detectionRisk += spy.discoveryRisk * 0.5;

  // Target's counter-intel capabilities
  const targetCounterIntel = target.cyber?.detection || 0;
  detectionRisk += targetCounterIntel * 0.4;

  // Relationship affects vigilance
  const relationship = spyNation.relationships?.[target.id] || 0;
  if (relationship < -50) {
    detectionRisk += 10; // Hostile nations watch closely
  }

  // Leader abilities (simplified - would integrate with leader system)
  // Some leaders provide counter-espionage bonuses

  // Cyber warfare integration
  if (spyNation.cyber?.attribution) {
    detectionRisk -= spyNation.cyber.attribution * 0.15;
  }

  // Clamp between 5 and 95
  return Math.max(5, Math.min(95, detectionRisk));
}

/**
 * Get base detection risk for mission type
 */
function getBaseDetectionRisk(missionType: SpyMissionType): number {
  switch (missionType) {
    case 'steal-tech': return BASE_DETECTION_RISKS.STEAL_TECH;
    case 'sabotage-production': return BASE_DETECTION_RISKS.SABOTAGE_PRODUCTION;
    case 'sabotage-military': return BASE_DETECTION_RISKS.SABOTAGE_MILITARY;
    case 'rig-election': return BASE_DETECTION_RISKS.RIG_ELECTION;
    case 'sow-dissent': return BASE_DETECTION_RISKS.SOW_DISSENT;
    case 'assassination': return BASE_DETECTION_RISKS.ASSASSINATION;
    case 'gather-intel': return BASE_DETECTION_RISKS.GATHER_INTEL;
    case 'counter-intel': return BASE_DETECTION_RISKS.COUNTER_INTEL;
    case 'propaganda': return BASE_DETECTION_RISKS.PROPAGANDA;
    case 'recruit-asset': return BASE_DETECTION_RISKS.RECRUIT_ASSET;
    case 'cyber-assist': return BASE_DETECTION_RISKS.CYBER_ASSIST;
    case 'false-flag': return BASE_DETECTION_RISKS.FALSE_FLAG;
    case 'exfiltrate': return BASE_DETECTION_RISKS.EXFILTRATE;
    default: return 50;
  }
}

/**
 * Get mission difficulty modifier
 */
function getMissionDifficulty(missionType: SpyMissionType): number {
  // Higher = harder
  const difficulties: Record<SpyMissionType, number> = {
    'gather-intel': 5,
    'propaganda': 10,
    'recruit-asset': 15,
    'cyber-assist': 15,
    'sow-dissent': 20,
    'sabotage-production': 25,
    'sabotage-military': 30,
    'steal-tech': 30,
    'counter-intel': 20,
    'false-flag': 35,
    'rig-election': 35,
    'exfiltrate': 30,
    'assassination': 40,
  };

  return difficulties[missionType] || 25;
}

/**
 * Get cover quality bonus
 */
function getCoverQuality(cover: string, target: Nation): number {
  // Different covers are better in different contexts
  // This is simplified - could be more sophisticated
  const baseQuality: Record<string, number> = {
    'diplomat': 10,
    'trader': 8,
    'businessman': 8,
    'journalist': 7,
    'scientist': 7,
    'military-attache': 6,
    'student': 5,
    'aid-worker': 5,
    'tourist': 3,
    'refugee': 2,
  };

  return baseQuality[cover] || 5;
}

/**
 * Get relevant specialization for mission
 */
function getRelevantSpecialization(
  missionType: SpyMissionType,
  specializations: string[]
): string | null {
  const relevantSpecs: Record<SpyMissionType, string[]> = {
    'steal-tech': ['tech-theft', 'infiltration', 'hacking'],
    'sabotage-production': ['sabotage', 'infiltration'],
    'sabotage-military': ['sabotage', 'combat'],
    'rig-election': ['infiltration', 'seduction'],
    'sow-dissent': ['infiltration', 'seduction'],
    'assassination': ['assassination', 'combat'],
    'gather-intel': ['infiltration', 'hacking'],
    'counter-intel': ['counter-intel', 'infiltration'],
    'propaganda': ['infiltration', 'seduction'],
    'recruit-asset': ['seduction', 'infiltration'],
    'cyber-assist': ['hacking', 'tech-theft'],
    'false-flag': ['infiltration', 'counter-intel'],
    'exfiltrate': ['infiltration', 'combat'],
  };

  const relevant = relevantSpecs[missionType] || [];

  for (const spec of specializations) {
    if (relevant.includes(spec)) {
      return spec;
    }
  }

  return null;
}

/**
 * Launch a spy mission
 */
export function launchSpyMission(
  spy: SpyAgent,
  targetNation: Nation,
  missionType: SpyMissionType,
  spyNation: Nation,
  turn: number
): SpyMission {
  const duration = getMissionDuration(missionType);
  const successChance = calculateMissionSuccessChance(spy, targetNation, missionType, spyNation);
  const detectionRisk = calculateDetectionRisk(spy, targetNation, missionType, spyNation);
  const cost = getMissionCost(missionType);

  const mission: SpyMission = {
    id: uuidv4(),
    type: missionType,
    spyId: spy.id,
    targetNationId: targetNation.id,
    startTurn: turn,
    duration,
    completionTurn: turn + duration,
    status: 'in-progress',
    successChance,
    detectionRisk,
    intelCost: cost.intel,
    productionCost: cost.production,
  };

  return mission;
}

/**
 * Get mission duration
 */
function getMissionDuration(missionType: SpyMissionType): number {
  switch (missionType) {
    case 'steal-tech': return MISSION_DURATIONS.STEAL_TECH;
    case 'sabotage-production': return MISSION_DURATIONS.SABOTAGE_PRODUCTION;
    case 'sabotage-military': return MISSION_DURATIONS.SABOTAGE_MILITARY;
    case 'rig-election': return MISSION_DURATIONS.RIG_ELECTION;
    case 'sow-dissent': return MISSION_DURATIONS.SOW_DISSENT;
    case 'assassination': return MISSION_DURATIONS.ASSASSINATION;
    case 'gather-intel': return MISSION_DURATIONS.GATHER_INTEL;
    case 'counter-intel': return MISSION_DURATIONS.COUNTER_INTEL;
    case 'propaganda': return MISSION_DURATIONS.PROPAGANDA;
    case 'recruit-asset': return MISSION_DURATIONS.RECRUIT_ASSET;
    case 'cyber-assist': return MISSION_DURATIONS.CYBER_ASSIST;
    case 'false-flag': return MISSION_DURATIONS.FALSE_FLAG;
    case 'exfiltrate': return MISSION_DURATIONS.EXFILTRATE;
    default: return 2;
  }
}

// ============================================================================
// MISSION EXECUTION
// ============================================================================

/**
 * Execute mission when it completes
 */
export function executeMission(
  mission: SpyMission,
  spy: SpyAgent,
  target: Nation,
  spyNation: Nation,
  turn: number,
  gameState: GameState
): MissionResult {
  // Roll for success
  const successRoll = Math.random() * 100;
  const success = successRoll < mission.successChance;

  // Roll for detection
  const detectionRoll = Math.random() * 100;
  const discovered = detectionRoll < mission.detectionRisk;

  // Determine spy fate if discovered
  let spyCaught = false;
  let spyEliminated = false;
  let coverBlown = false;

  if (discovered) {
    // Chance spy is caught
    const catchChance = 60 - spy.skill * 0.3;
    spyCaught = Math.random() * 100 < catchChance;

    if (spyCaught) {
      // Chance spy is eliminated
      const killChance = mission.type === 'assassination' ? 70 : 30;
      spyEliminated = Math.random() * 100 < killChance;
    } else {
      // Escaped but cover may be blown
      coverBlown = Math.random() * 100 < 50;
    }
  }

  // Generate rewards if successful
  let rewards: MissionReward | undefined;
  if (success) {
    rewards = generateMissionRewards(mission.type, target, spyNation, gameState);
  }

  // Generate narrative
  const narrative = generateMissionNarrative(
    mission,
    spy,
    target,
    success,
    discovered,
    spyCaught,
    spyEliminated
  );

  const result: MissionResult = {
    success,
    discovered,
    spyCaught,
    spyEliminated,
    coverBlown,
    rewards,
    narrative,
    evidenceLeft: discovered,
  };

  return result;
}

/**
 * Generate mission rewards based on type
 */
function generateMissionRewards(
  missionType: SpyMissionType,
  target: Nation,
  spyNation: Nation,
  gameState: GameState
): MissionReward {
  const rewards: MissionReward = {};

  switch (missionType) {
    case 'steal-tech':
      // Steal random research from target
      if (target.researched) {
        const completedResearch = Object.keys(target.researched).filter(
          (key) => target.researched![key] && !spyNation.researched?.[key]
        );
        if (completedResearch.length > 0) {
          const stolen = completedResearch[Math.floor(Math.random() * completedResearch.length)];
          rewards.techStolen = stolen;
        }
      }
      rewards.intelGained = 30;
      break;

    case 'sabotage-production':
      rewards.productionDamage = Math.floor(target.production * 0.3);
      break;

    case 'sabotage-military':
      rewards.otherEffects = ['Destroyed military equipment', 'Reduced readiness'];
      break;

    case 'rig-election':
      rewards.moraleImpact = -15;
      rewards.otherEffects = ['Election results influenced', 'Political instability'];
      break;

    case 'sow-dissent':
      // Reduce trust with other nations
      const trustImpact: Record<string, number> = {};
      const nations = gameState.nations.filter((n) => n.id !== target.id && !n.eliminated);
      nations.slice(0, 2).forEach((nation) => {
        trustImpact[nation.id] = -10;
      });
      rewards.trustImpact = trustImpact;
      break;

    case 'assassination':
      rewards.leaderAssassinated = true;
      rewards.otherEffects = ['Leader assassinated', 'Political chaos', 'Emergency elections'];
      break;

    case 'gather-intel':
      rewards.intelGained = 40;
      rewards.otherEffects = ['Valuable intelligence gathered'];
      break;

    case 'propaganda':
      rewards.moraleImpact = -10;
      break;

    case 'recruit-asset':
      rewards.otherEffects = ['Local asset recruited', 'Future operations easier'];
      break;

    case 'cyber-assist':
      rewards.otherEffects = ['Cyber defenses weakened'];
      break;

    case 'false-flag':
      rewards.otherEffects = ['False flag operation successful', 'Another nation implicated'];
      break;

    case 'exfiltrate':
      rewards.intelGained = 25;
      rewards.otherEffects = ['Asset exfiltrated successfully'];
      break;

    case 'counter-intel':
      rewards.otherEffects = ['Counter-intelligence operation successful'];
      break;
  }

  return rewards;
}

/**
 * Generate mission narrative
 */
function generateMissionNarrative(
  mission: SpyMission,
  spy: SpyAgent,
  target: Nation,
  success: boolean,
  discovered: boolean,
  spyCaught: boolean,
  spyEliminated: boolean
): string {
  let narrative = `Agent ${spy.name} `;

  if (spyEliminated) {
    narrative += `was caught and eliminated by ${target.name} during ${mission.type} mission.`;
  } else if (spyCaught) {
    narrative += `was captured by ${target.name} during ${mission.type} mission.`;
  } else if (discovered) {
    narrative += `was discovered but escaped from ${target.name}.`;
  } else if (success) {
    narrative += `successfully completed ${mission.type} mission in ${target.name}.`;
  } else {
    narrative += `failed ${mission.type} mission in ${target.name} but remained undetected.`;
  }

  return narrative;
}

// ============================================================================
// COUNTER-INTELLIGENCE
// ============================================================================

/**
 * Launch counter-intelligence operation
 */
export function launchCounterIntelOperation(
  nation: Nation,
  turn: number,
  targetNation?: string
): CounterIntelOperation {
  const duration = 2;
  const baseChance = COUNTER_INTEL_EFFECTIVENESS.BASE_DETECTION_CHANCE;

  let successChance = baseChance;

  // Cyber defense bonus
  if (nation.cyber?.detection) {
    successChance += nation.cyber.detection * COUNTER_INTEL_EFFECTIVENESS.CYBER_DEFENSE_MODIFIER;
  }

  const operation: CounterIntelOperation = {
    id: uuidv4(),
    nationId: nation.id,
    targetNationId: targetNation,
    startTurn: turn,
    duration,
    intelCost: SPY_COSTS.COUNTER_INTEL_BASE,
    successChance: Math.min(85, successChance),
    status: 'active',
  };

  return operation;
}

/**
 * Execute counter-intelligence operation
 */
export function executeCounterIntel(
  operation: CounterIntelOperation,
  nation: Nation,
  gameState: GameState
): string[] {
  const detectedSpies: string[] = [];

  // Find all spies targeting this nation
  const allNations = gameState.nations;

  for (const otherNation of allNations) {
    if (otherNation.id === nation.id || !otherNation.spyNetwork) continue;

    const spies = otherNation.spyNetwork.spies.filter(
      (spy) => spy.targetNationId === nation.id && spy.status === 'active'
    );

    for (const spy of spies) {
      // Roll for detection
      const detectionChance = operation.successChance * COUNTER_INTEL_EFFECTIVENESS.PER_SPY_DETECTION_ROLL;

      if (Math.random() * 100 < detectionChance) {
        detectedSpies.push(spy.id);
      }
    }
  }

  return detectedSpies;
}

// ============================================================================
// SPY INCIDENTS & CONSEQUENCES
// ============================================================================

/**
 * Create spy incident when spy is caught
 */
export function createSpyIncident(
  spy: SpyAgent,
  mission: SpyMission,
  spyNation: Nation,
  targetNation: Nation,
  turn: number,
  spyEliminated: boolean
): SpyIncident {
  const evidenceQuality: 'weak' | 'moderate' | 'strong' | 'conclusive' =
    spy.cover === 'diplomat' ? 'strong' :
    spy.cover === 'military-attache' ? 'conclusive' :
    Math.random() > 0.5 ? 'strong' : 'moderate';

  const spyFate = spyEliminated ? 'executed' :
    Math.random() > 0.7 ? 'imprisoned' : 'imprisoned';

  const incident: SpyIncident = {
    id: uuidv4(),
    spyId: spy.id,
    spyNationId: spyNation.id,
    targetNationId: targetNation.id,
    turn,
    missionType: mission.type,
    spyFate,
    evidenceQuality,
    publicized: Math.random() > 0.3, // 70% chance made public
  };

  return incident;
}

/**
 * Calculate diplomatic consequences of caught spy
 */
export function calculateSpyConsequences(
  incident: SpyIncident,
  spyNation: Nation,
  targetNation: Nation
): SpyIncidentResolution {
  const relationshipPenalty = SPY_CAUGHT_PENALTIES.RELATIONSHIP;
  const trustPenalty = SPY_CAUGHT_PENALTIES.TRUST;
  const reputationPenalty = SPY_CAUGHT_PENALTIES.REPUTATION;

  // Severity depends on evidence quality and mission type
  let severityMultiplier = 1.0;

  if (incident.evidenceQuality === 'conclusive') {
    severityMultiplier = 1.5;
  } else if (incident.evidenceQuality === 'weak') {
    severityMultiplier = 0.5;
  }

  // Assassination and sabotage are worse
  if (incident.missionType === 'assassination') {
    severityMultiplier *= 2.0;
  } else if (incident.missionType === 'sabotage-military' || incident.missionType === 'sabotage-production') {
    severityMultiplier *= 1.5;
  }

  const resolution: SpyIncidentResolution = {
    type: severityMultiplier > 1.5 ? 'sanctions' : 'compensation',
    relationshipPenalty: Math.floor(relationshipPenalty * severityMultiplier),
    trustPenalty: Math.floor(trustPenalty * severityMultiplier),
    reputationPenalty: Math.floor(reputationPenalty * severityMultiplier),
    compensationPaid: incident.publicized ? SPY_CAUGHT_PENALTIES.DIP_COST : 0,
    councilSanctions: severityMultiplier > 2.0,
    narrative: `${targetNation.name} demands accountability for espionage.`,
  };

  return resolution;
}

// ============================================================================
// SPY MANAGEMENT
// ============================================================================

/**
 * Update spy status after mission
 */
export function updateSpyAfterMission(
  spy: SpyAgent,
  result: MissionResult
): SpyAgent {
  const updated: SpyAgent = { ...spy };

  if (result.spyEliminated) {
    updated.status = 'eliminated';
  } else if (result.spyCaught) {
    updated.status = 'captured';
  } else if (result.coverBlown) {
    updated.status = 'burned';
  } else {
    updated.status = 'active';

    if (result.success) {
      // Gain experience and skill
      updated.experience += SKILL_PROGRESSION.EXPERIENCE_PER_MISSION;
      updated.skill = Math.min(100, updated.skill + SKILL_PROGRESSION.SKILL_GAIN_PER_MISSION);

      // Update training level based on skill
      if (updated.skill >= SKILL_PROGRESSION.TRAINING_LEVELS.master) {
        updated.trainingLevel = 'master';
      } else if (updated.skill >= SKILL_PROGRESSION.TRAINING_LEVELS.elite) {
        updated.trainingLevel = 'elite';
      } else if (updated.skill >= SKILL_PROGRESSION.TRAINING_LEVELS.agent) {
        updated.trainingLevel = 'agent';
      } else if (updated.skill >= SKILL_PROGRESSION.TRAINING_LEVELS.operative) {
        updated.trainingLevel = 'operative';
      }

      // Morale boost
      updated.morale = Math.min(100, updated.morale + 10);
    } else {
      // Failed mission reduces morale
      updated.morale = Math.max(0, updated.morale - 15);
    }

    // Increase discovery risk slightly
    updated.discoveryRisk = Math.min(50, updated.discoveryRisk + 2);
  }

  return updated;
}

/**
 * Check if spy can be assigned to mission
 */
export function canAssignSpyToMission(
  spy: SpyAgent,
  missionType: SpyMissionType,
  targetNation: Nation
): { canAssign: boolean; reason?: string } {
  if (spy.status !== 'active' && spy.status !== 'idle') {
    return { canAssign: false, reason: `Spy is ${spy.status}` };
  }

  if (spy.currentMission) {
    return { canAssign: false, reason: 'Spy is already on a mission' };
  }

  if (spy.morale < 20) {
    return { canAssign: false, reason: 'Spy morale too low' };
  }

  return { canAssign: true };
}

/**
 * Update spy network reputation based on activities
 */
export function updateSpyNetworkReputation(network: SpyNetworkState): SpyNetworkState {
  const updated = { ...network };

  const totalMissions = network.totalSuccessfulMissions;
  const totalLost = network.totalSpiesLost;
  const successRate = totalMissions > 0 ? (totalMissions / (totalMissions + totalLost)) : 0;

  if (totalMissions === 0) {
    updated.reputation = 'unknown';
  } else if (totalMissions < 5) {
    updated.reputation = 'novice';
  } else if (totalMissions < 15) {
    updated.reputation = successRate > 0.7 ? 'competent' : 'novice';
  } else if (totalMissions < 30) {
    updated.reputation = successRate > 0.75 ? 'professional' : 'competent';
  } else if (totalMissions < 50) {
    updated.reputation = successRate > 0.8 ? 'elite' : 'professional';
  } else {
    updated.reputation = successRate > 0.85 ? 'legendary' : 'elite';
  }

  // Many caught spies = notorious
  if (totalLost > totalMissions * 0.5) {
    updated.reputation = 'notorious';
  }

  return updated;
}

/**
 * Can nation afford mission
 */
export function canAffordMission(
  nation: Nation,
  missionType: SpyMissionType
): { canAfford: boolean; reason?: string } {
  const cost = getMissionCost(missionType);

  if (nation.intel < cost.intel) {
    return { canAfford: false, reason: `Insufficient Intel (need ${cost.intel})` };
  }

  if (cost.production && nation.production < cost.production) {
    return { canAfford: false, reason: `Insufficient Production (need ${cost.production})` };
  }

  return { canAfford: true };
}
