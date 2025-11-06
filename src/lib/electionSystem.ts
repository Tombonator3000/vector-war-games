/**
 * Election System
 * Manages elections, public opinion, and political consequences
 */

import type { Nation } from '../types/game';
import type { ElectionConfig } from '../types/scenario';

export interface ElectionResult {
  winner: 'incumbent' | 'opposition';
  margin: number; // Percentage points
  playerVoteShare: number;
  oppositionVoteShare: number;
  turnout: number;
  swingFactors: string[];
}

export interface PublicOpinionFactors {
  economicPerformance: number;
  militaryStrength: number;
  diplomaticSuccess: number;
  warStatus: number;
  stability: number;
  foreignInfluence: number;
}

/**
 * Calculate public opinion based on various factors
 */
const weights = {
  economicPerformance: 0.3,
  militaryStrength: 0.15,
  diplomaticSuccess: 0.2,
  warStatus: 0.15,
  stability: 0.15,
  foreignInfluence: 0.05,
} as const;

const expectedMaximums = {
  economicPerformance: 50,
  militaryStrength: 40,
  diplomaticSuccess: 35,
  warStatus: 30,
  stability: 40,
  foreignInfluence: 15,
} as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const computeWeightedScore = (factors: PublicOpinionFactors) =>
  factors.economicPerformance * (weights.economicPerformance / expectedMaximums.economicPerformance) +
  factors.militaryStrength * (weights.militaryStrength / expectedMaximums.militaryStrength) +
  factors.diplomaticSuccess * (weights.diplomaticSuccess / expectedMaximums.diplomaticSuccess) +
  factors.warStatus * (weights.warStatus / expectedMaximums.warStatus) +
  factors.stability * (weights.stability / expectedMaximums.stability) +
  factors.foreignInfluence * (weights.foreignInfluence / expectedMaximums.foreignInfluence);

const publicOpinionDriftMap = new WeakMap<Nation, number>();

export function calculatePublicOpinion(
  nation: Nation,
  allNations: Nation[],
  config: ElectionConfig
): number {
  const factors = getPublicOpinionFactors(nation, allNations, config);

  const weightedScore = computeWeightedScore(factors);

  const weightedScores = allNations.map(currentNation =>
    computeWeightedScore(getPublicOpinionFactors(currentNation, allNations, config))
  );
  const averageWeightedScore =
    weightedScores.length > 0
      ? weightedScores.reduce((total, score) => total + score, 0) / weightedScores.length
      : 0;

  const moraleValues = allNations.map(currentNation => currentNation.morale ?? 50);
  const averageMorale =
    moraleValues.length > 0
      ? moraleValues.reduce((total, morale) => total + morale, 0) / moraleValues.length
      : 50;

  const weightedDelta = (weightedScore - averageWeightedScore) * 16 * (config.actionInfluenceMultiplier ?? 1);
  const moraleDelta = ((nation.morale ?? 50) - averageMorale) * 0.035;
  const storedOpinion = nation.publicOpinion ?? 50;
  const previousDrift = publicOpinionDriftMap.get(nation) ?? 0;
  const baseOpinion = storedOpinion - previousDrift;
  const nextDrift = weightedDelta + moraleDelta;

  const finalOpinion = clamp(baseOpinion + nextDrift, 0, 100);

  publicOpinionDriftMap.set(nation, nextDrift);

  return finalOpinion;
}

/**
 * Get detailed public opinion factors
 */
export function getPublicOpinionFactors(
  nation: Nation,
  allNations: Nation[],
  config: ElectionConfig
): PublicOpinionFactors {
  const factors: PublicOpinionFactors = {
    economicPerformance: 0,
    militaryStrength: 0,
    diplomaticSuccess: 0,
    warStatus: 0,
    stability: 0,
    foreignInfluence: 0,
  };

  // Economic Performance (based on production and population)
  const productionPerCapita = nation.production / (nation.population || 1);
  factors.economicPerformance = Math.min(50, productionPerCapita * 10);

  // Military Strength (perceived security)
  const militaryScore = (nation.missiles * 5) + (nation.defense * 3) + ((nation.bombers || 0) * 4);
  factors.militaryStrength = Math.min(40, militaryScore * 0.1);

  // Diplomatic Success (alliances and treaties)
  const allianceCount = nation.alliances?.length || 0;
  const treatyCount = Object.keys(nation.treaties || {}).length;
  factors.diplomaticSuccess = Math.min(35, (allianceCount * 8) + (treatyCount * 3));

  // War Status (are we at war? winning or losing?)
  const threatLevel = Object.values(nation.threats || {}).reduce((a, b) => a + b, 0);
  const isAtWar = threatLevel > 50;
  if (isAtWar) {
    // Public opinion drops during war
    factors.warStatus = -20 + (nation.defense * 2); // But good defense helps
  } else {
    // Peace is generally good
    factors.warStatus = 15;
  }

  // Stability (low instability is good)
  const stabilityScore = 40 - ((nation.instability || 0) * 2);
  factors.stability = Math.max(-30, Math.min(40, stabilityScore));

  // Foreign Influence (if enabled in config)
  if (config.foreignInfluenceEnabled) {
    const enemyNations = allNations.filter(n =>
      !n.isPlayer &&
      !n.eliminated &&
      (n.threats?.[nation.id] || 0) > 20
    );

    // Enemy nations with high intel can influence elections
    const totalEnemyIntel = enemyNations.reduce((sum, n) => sum + (n.intel || 0), 0);
    const influencePenalty = Math.min(15, totalEnemyIntel * 0.05);
    factors.foreignInfluence = -influencePenalty;
  }

  return factors;
}

/**
 * Run an election and return results
 */
export function runElection(
  nation: Nation,
  allNations: Nation[],
  config: ElectionConfig
): ElectionResult {
  // Calculate base vote share from public opinion
  const publicOpinion = calculatePublicOpinion(nation, allNations, config);

  // Convert opinion to vote share (50% base + opinion modifier)
  let playerVoteShare = 50 + (publicOpinion * 0.4);

  // Morale affects turnout and vote share
  const moraleMod = (nation.morale - 50) * 0.1;
  playerVoteShare += moraleMod;

  // Cabinet approval matters
  const cabinetMod = (nation.cabinetApproval - 50) * 0.15;
  playerVoteShare += cabinetMod;

  // Add some randomness (election uncertainty)
  const randomSwing = (Math.random() - 0.5) * 10;
  playerVoteShare += randomSwing;

  // Clamp to valid range
  playerVoteShare = Math.max(0, Math.min(100, playerVoteShare));
  const oppositionVoteShare = 100 - playerVoteShare;

  // Calculate turnout (affected by morale and stability)
  const turnout = Math.max(40, Math.min(85, 60 + nation.morale * 0.2 - (nation.instability || 0) * 0.5));

  // Determine winner
  const winner = playerVoteShare > 50 ? 'incumbent' : 'opposition';
  const margin = Math.abs(playerVoteShare - oppositionVoteShare);

  // Identify swing factors
  const factors = getPublicOpinionFactors(nation, allNations, config);
  const swingFactors: string[] = [];

  if (factors.economicPerformance < 20) swingFactors.push('Poor economic performance');
  if (factors.militaryStrength < 15) swingFactors.push('Weak military');
  if (factors.warStatus < -10) swingFactors.push('Unpopular war');
  if (factors.stability < 0) swingFactors.push('Political instability');
  if (factors.foreignInfluence < -5) swingFactors.push('Foreign interference');
  if (nation.morale < 30) swingFactors.push('Low morale');
  if (nation.cabinetApproval < 35) swingFactors.push('Cabinet disapproval');

  return {
    winner,
    margin,
    playerVoteShare,
    oppositionVoteShare,
    turnout,
    swingFactors,
  };
}

/**
 * Apply election consequences
 */
export function applyElectionConsequences(
  nation: Nation,
  result: ElectionResult,
  config: ElectionConfig,
  leaders: Array<{ name: string; ai: string; color: string }>
): { gameOver?: boolean; newLeader?: string; message: string } {
  if (result.winner === 'incumbent') {
    // Player won - boost morale and stability
    const marginBonus = Math.floor(result.margin / 10);
    nation.morale = Math.min(100, nation.morale + 5 + marginBonus);
    nation.instability = Math.max(0, (nation.instability || 0) - 3);
    nation.cabinetApproval = Math.min(100, nation.cabinetApproval + 10);

    return {
      message: `ELECTION VICTORY! You won with ${result.playerVoteShare.toFixed(1)}% of the vote. Morale and stability improved.`,
    };
  } else {
    // Player lost
    const consequence = config.loseElectionConsequence;

    switch (consequence) {
      case 'gameOver':
        nation.eliminated = true;
        return {
          gameOver: true,
          message: `ELECTION DEFEAT! You lost with only ${result.playerVoteShare.toFixed(1)}% of the vote. Your government has been voted out. GAME OVER.`,
        };

      case 'leaderChange':
        // Change to random leader
        const newLeader = leaders[Math.floor(Math.random() * leaders.length)];
        const oldLeader = nation.leader;
        nation.leader = newLeader.name;
        nation.ai = newLeader.ai;
        nation.morale = Math.max(20, nation.morale - 15);
        nation.instability = Math.min(100, (nation.instability || 0) + 20);
        nation.cabinetApproval = 50; // Reset to neutral

        return {
          newLeader: newLeader.name,
          message: `ELECTION DEFEAT! ${oldLeader} lost to ${newLeader.name}. New leadership brings instability and low morale.`,
        };

      case 'instability':
        nation.morale = Math.max(10, nation.morale - 20);
        nation.instability = Math.min(100, (nation.instability || 0) + 30);
        nation.cabinetApproval = Math.max(0, nation.cabinetApproval - 25);
        nation.production = Math.floor(nation.production * 0.8); // Economic disruption

        return {
          message: `ELECTION DEFEAT! Your party clings to power but the country is in turmoil. Major stability and production losses.`,
        };

      case 'none':
      default:
        nation.morale = Math.max(20, nation.morale - 10);
        return {
          message: `ELECTION DEFEAT! You lost with ${result.playerVoteShare.toFixed(1)}% of the vote. Morale decreased.`,
        };
    }
  }
}

/**
 * Modify public opinion based on player action
 */
export function modifyOpinionFromAction(
  nation: Nation,
  actionType: string,
  success: boolean,
  config: ElectionConfig
): number {
  const multiplier = config.actionInfluenceMultiplier;
  let change = 0;

  switch (actionType) {
    case 'LAUNCH_MISSILE':
      change = success ? -5 : -10; // Nuclear strikes are unpopular
      break;
    case 'DIPLOMACY_ALLIANCE':
      change = success ? 3 : -1;
      break;
    case 'DIPLOMACY_TREATY':
      change = success ? 2 : 0;
      break;
    case 'RESEARCH':
      change = 1; // Research is generally popular
      break;
    case 'BUILD_DEFENSE':
      change = 2; // Defense is popular
      break;
    case 'BUILD_MILITARY':
      change = 1; // Military buildup mildly popular
      break;
    case 'CULTURE_BOMB':
      change = success ? -2 : -4; // Cultural warfare is controversial
      break;
    case 'CYBER_ATTACK':
      change = success ? -1 : -3; // Cyber ops are secretive but risky
      break;
    case 'BIO_WARFARE':
      change = -8; // Bio weapons are very unpopular
      break;
    case 'IMMIGRATION':
      change = 1; // Immigration can be positive
      break;
    case 'SANCTIONS':
      change = -1; // Sanctions have mixed reception
      break;
    default:
      change = 0;
  }

  const finalChange = change * multiplier;
  nation.publicOpinion = Math.max(-20, Math.min(100, nation.publicOpinion + finalChange));

  return finalChange;
}

/**
 * Get election status message
 */
export function getElectionStatusMessage(
  turnsUntilElection: number,
  publicOpinion: number,
  config: ElectionConfig
): string {
  if (!config.enabled) return 'Elections: DISABLED';
  if (turnsUntilElection < 0) return 'Elections: DISABLED';

  const status = publicOpinion >= config.minPublicOpinionThreshold ? 'LEADING' : 'TRAILING';

  if (turnsUntilElection === 0) {
    return `ELECTION DAY! Current polling: ${status}`;
  } else if (turnsUntilElection <= 3) {
    return `Election in ${turnsUntilElection} turns! Current polling: ${status}`;
  } else {
    return `Next election: ${turnsUntilElection} turns. Polling: ${status}`;
  }
}
