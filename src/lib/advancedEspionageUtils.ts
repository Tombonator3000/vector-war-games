/**
 * Advanced Espionage Utilities
 *
 * Handles covert operations that affect diplomacy:
 * - False flag attacks
 * - Smear campaigns
 * - Sabotaging peace talks
 * - Counter-intelligence and detection
 */

import type { Nation } from '@/types/game';
import type {
  CovertOperation,
  CovertOperationType,
  CovertOperationEffect,
  CounterIntelligence,
  Investigation,
  InvestigationFindings,
  EspionageCosts,
} from '@/types/diplomacyPhase3';
import { generateId } from './idGenerator';

/**
 * Plan a covert operation
 */
export function planCovertOperation(
  operatorId: string,
  targetNationId: string,
  type: CovertOperationType,
  currentTurn: number,
  secondaryTargets: string[] = []
): CovertOperation {
  const costs = getOperationCosts(type);
  const difficulty = getOperationDifficulty(type);
  const detectionRisk = getDetectionRisk(type);

  return {
    id: generateId(),
    type,
    name: getOperationName(type),
    description: getOperationDescription(type),
    operatorId,
    targetNationId,
    secondaryTargets,
    plannedTurn: currentTurn,
    executionTurn: currentTurn + 2, // 2 turns to prepare
    intelCost: costs.intel,
    dipCost: costs.dip,
    economicCost: costs.economic,
    baseDifficulty: difficulty,
    detectionRisk,
    blowbackRisk: Math.min(50, detectionRisk * 0.7),
    status: 'planning',
    effects: [],
    evidence: 0,
  };
}

/**
 * Get operation costs based on type
 */
function getOperationCosts(type: CovertOperationType): {
  intel: number;
  dip: number;
  economic: number;
} {
  return EspionageCosts[
    type.toUpperCase().replace(/-/g, '_') as keyof typeof EspionageCosts
  ];
}

/**
 * Get operation difficulty
 */
function getOperationDifficulty(type: CovertOperationType): number {
  const difficulties: Record<CovertOperationType, number> = {
    'false-flag-attack': 80,
    'smear-campaign': 40,
    'sabotage-talks': 60,
    'influence-election': 75,
    'fabricate-evidence': 55,
    'character-assassination': 50,
    'diplomatic-theft': 65,
    'bribe-officials': 45,
    'create-incident': 50,
    'leak-classified': 40,
    'coup-support': 90,
    'propaganda-campaign': 45,
  };

  return difficulties[type];
}

/**
 * Get detection risk
 */
function getDetectionRisk(type: CovertOperationType): number {
  const risks: Record<CovertOperationType, number> = {
    'false-flag-attack': 70,
    'smear-campaign': 30,
    'sabotage-talks': 50,
    'influence-election': 60,
    'fabricate-evidence': 55,
    'character-assassination': 45,
    'diplomatic-theft': 65,
    'bribe-officials': 40,
    'create-incident': 55,
    'leak-classified': 50,
    'coup-support': 80,
    'propaganda-campaign': 35,
  };

  return risks[type];
}

/**
 * Get operation name
 */
function getOperationName(type: CovertOperationType): string {
  const names: Record<CovertOperationType, string> = {
    'false-flag-attack': 'Operation False Banner',
    'smear-campaign': 'Operation Tarnish',
    'sabotage-talks': 'Operation Breakdown',
    'influence-election': 'Operation Democracy',
    'fabricate-evidence': 'Operation Forgery',
    'character-assassination': 'Operation Defame',
    'diplomatic-theft': 'Operation Intercept',
    'bribe-officials': 'Operation Payoff',
    'create-incident': 'Operation Provoke',
    'leak-classified': 'Operation Exposure',
    'coup-support': 'Operation Regime Change',
    'propaganda-campaign': 'Operation Narrative',
  };

  return names[type];
}

/**
 * Get operation description
 */
function getOperationDescription(type: CovertOperationType): string {
  const descriptions: Record<CovertOperationType, string> = {
    'false-flag-attack':
      'Stage an attack and frame another nation to create conflict.',
    'smear-campaign': "Launch coordinated campaign to damage nation's reputation.",
    'sabotage-talks': 'Covertly disrupt ongoing peace negotiations.',
    'influence-election': 'Interfere with democratic processes to install favorable regime.',
    'fabricate-evidence': 'Create false intelligence to justify hostile actions.',
    'character-assassination': 'Spread damaging information about foreign leaders.',
    'diplomatic-theft': 'Steal sensitive diplomatic communications and documents.',
    'bribe-officials': 'Corrupt foreign officials to gain influence and information.',
    'create-incident': 'Manufacture a diplomatic crisis to shift blame.',
    'leak-classified': 'Expose classified information to damage credibility.',
    'coup-support': 'Provide support for regime change attempt.',
    'propaganda-campaign': 'Deploy mass disinformation to sway public opinion.',
  };

  return descriptions[type];
}

/**
 * Execute a covert operation
 */
export function executeCovertOperation(
  operation: CovertOperation,
  operator: Nation,
  target: Nation
): {
  operation: CovertOperation;
  success: boolean;
  detected: boolean;
  effects: CovertOperationEffect[];
} {
  // Calculate success chance
  const baseSuccess = 100 - operation.baseDifficulty;
  const intelBonus = Math.min(20, (operator.intel || 0) / 5);
  const successChance = Math.min(95, baseSuccess + intelBonus);

  const success = Math.random() * 100 < successChance;

  // Calculate detection
  const detectionModifier = (target.cyber?.detection || 0) / 10;
  const finalDetectionRisk = Math.min(
    95,
    operation.detectionRisk + detectionModifier
  );
  const detected = Math.random() * 100 < finalDetectionRisk;

  let effects: CovertOperationEffect[] = [];

  if (success) {
    effects = generateOperationEffects(operation);
  }

  const newStatus = detected
    ? 'exposed'
    : success
    ? 'succeeded'
    : 'failed';

  const updatedOperation: CovertOperation = {
    ...operation,
    status: newStatus,
    effects,
    evidence: detected ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30),
    exposedTurn: detected ? operation.executionTurn : undefined,
    exposedBy: detected ? target.id : undefined,
  };

  return {
    operation: updatedOperation,
    success,
    detected,
    effects,
  };
}

/**
 * Generate effects based on operation type
 */
function generateOperationEffects(
  operation: CovertOperation
): CovertOperationEffect[] {
  const effects: CovertOperationEffect[] = [];

  switch (operation.type) {
    case 'false-flag-attack':
      // Creates incident between target and secondary target
      if (operation.secondaryTargets && operation.secondaryTargets.length > 0) {
        effects.push({
          type: 'incident',
          targetNationId: operation.targetNationId,
          value: 1,
          description: 'Fabricated border incident',
        });
        effects.push({
          type: 'relationship',
          targetNationId: operation.secondaryTargets[0],
          value: -30,
          description: 'Blamed for false flag attack',
        });
      }
      break;

    case 'smear-campaign':
      effects.push({
        type: 'reputation',
        targetNationId: operation.targetNationId,
        value: -25,
        duration: 20,
        description: 'Damaged international reputation',
      });
      effects.push({
        type: 'public-opinion',
        targetNationId: operation.targetNationId,
        value: -15,
        description: 'Negative propaganda campaign',
      });
      break;

    case 'sabotage-talks':
      effects.push({
        type: 'trust',
        targetNationId: operation.targetNationId,
        value: -20,
        description: 'Disrupted peace negotiations',
      });
      break;

    case 'influence-election':
      effects.push({
        type: 'instability',
        targetNationId: operation.targetNationId,
        value: 15,
        duration: 10,
        description: 'Political instability from election interference',
      });
      break;

    case 'fabricate-evidence':
      effects.push({
        type: 'relationship',
        targetNationId: operation.targetNationId,
        value: -20,
        description: 'False intelligence created tensions',
      });
      break;

    case 'character-assassination':
      effects.push({
        type: 'public-opinion',
        targetNationId: operation.targetNationId,
        value: -20,
        description: 'Leader credibility damaged',
      });
      break;

    case 'diplomatic-theft':
      effects.push({
        type: 'trust',
        targetNationId: operation.targetNationId,
        value: -15,
        duration: 15,
        description: 'Diplomatic communications compromised',
      });
      break;

    case 'bribe-officials':
      effects.push({
        type: 'council-vote',
        targetNationId: operation.targetNationId,
        value: 1,
        duration: 5,
        description: 'Favorable votes secured through bribery',
      });
      break;

    case 'create-incident':
      effects.push({
        type: 'incident',
        targetNationId: operation.targetNationId,
        value: 1,
        description: 'Manufactured diplomatic crisis',
      });
      break;

    case 'leak-classified':
      effects.push({
        type: 'reputation',
        targetNationId: operation.targetNationId,
        value: -20,
        duration: 15,
        description: 'Classified information leaked',
      });
      break;

    case 'coup-support':
      effects.push({
        type: 'instability',
        targetNationId: operation.targetNationId,
        value: 30,
        duration: 20,
        description: 'Regime destabilization attempt',
      });
      break;

    case 'propaganda-campaign':
      effects.push({
        type: 'public-opinion',
        targetNationId: operation.targetNationId,
        value: -18,
        duration: 10,
        description: 'Mass disinformation campaign',
      });
      break;
  }

  return effects;
}

/**
 * Start an investigation into suspected operations
 */
export function startInvestigation(
  ci: CounterIntelligence,
  targetNationId: string,
  focusArea: CovertOperationType | 'general',
  currentTurn: number
): CounterIntelligence {
  const investigation: Investigation = {
    id: generateId(),
    targetNationId,
    focusArea,
    progress: 0,
    evidenceGathered: 0,
    startedTurn: currentTurn,
    estimatedCompletion: currentTurn + 5, // 5 turns to complete
  };

  return {
    ...ci,
    activeInvestigations: [...ci.activeInvestigations, investigation],
  };
}

/**
 * Progress an investigation
 */
export function progressInvestigation(
  ci: CounterIntelligence,
  investigationId: string,
  allOperations: CovertOperation[]
): CounterIntelligence {
  const updatedInvestigations = ci.activeInvestigations.map((inv) => {
    if (inv.id !== investigationId) return inv;

    const progressIncrease = 15 + ci.detectionLevel / 5;
    const newProgress = Math.min(100, inv.progress + progressIncrease);

    // Check for operations to discover
    if (newProgress >= 100) {
      const discoveries = discoverOperations(inv, allOperations, ci);
      return {
        ...inv,
        progress: 100,
        evidenceGathered: discoveries.evidence,
        findings: discoveries,
      };
    }

    return {
      ...inv,
      progress: newProgress,
    };
  });

  return {
    ...ci,
    activeInvestigations: updatedInvestigations,
  };
}

/**
 * Discover operations during investigation
 */
function discoverOperations(
  investigation: Investigation,
  allOperations: CovertOperation[],
  ci: CounterIntelligence
): InvestigationFindings {
  const suspectOperations = allOperations.filter(
    (op) =>
      op.operatorId === investigation.targetNationId &&
      op.targetNationId === ci.nationId &&
      (investigation.focusArea === 'general' || op.type === investigation.focusArea)
  );

  const discovered: string[] = [];
  const evidence: string[] = [];
  let totalEvidence = 0;

  for (const op of suspectOperations) {
    // Higher chance to discover if operation left evidence
    const discoveryChance = ci.detectionLevel + op.evidence;
    if (Math.random() * 100 < discoveryChance) {
      discovered.push(op.id);
      evidence.push(
        `Evidence of ${op.name} operation conducted by ${op.operatorId}`
      );
      totalEvidence += op.evidence;
    }
  }

  const certainty = Math.min(100, totalEvidence / discovered.length || 0);

  return {
    operationsDiscovered: discovered,
    certainty,
    evidence,
    recommendedResponse: generateRecommendedResponses(discovered.length, certainty),
  };
}

/**
 * Generate recommended responses based on findings
 */
function generateRecommendedResponses(
  operationsFound: number,
  certainty: number
): string[] {
  const responses: string[] = [];

  if (operationsFound === 0) {
    responses.push('Continue monitoring for suspicious activity');
    return responses;
  }

  if (certainty >= 70) {
    responses.push('Expose operations publicly for international condemnation');
    responses.push('Launch counter-operations in retaliation');
    responses.push('Demand formal apology and reparations');
  } else if (certainty >= 40) {
    responses.push('Gather more evidence before taking action');
    responses.push('Privately confront the nation with evidence');
    responses.push('Increase counter-intelligence efforts');
  } else {
    responses.push('Insufficient evidence for formal accusations');
    responses.push('Continue investigation');
  }

  return responses;
}

/**
 * Expose a covert operation
 */
export function exposeOperation(
  operation: CovertOperation,
  exposedBy: string,
  currentTurn: number
): CovertOperation {
  return {
    ...operation,
    status: 'exposed',
    exposedTurn: currentTurn,
    exposedBy,
  };
}

/**
 * Get counter-intelligence effectiveness
 */
export function getCounterIntelEffectiveness(ci: CounterIntelligence): number {
  return ci.detectionLevel + ci.assets * 2;
}

/**
 * Improve counter-intelligence
 */
export function improveCounterIntel(
  ci: CounterIntelligence,
  investmentAmount: number
): CounterIntelligence {
  const detectionIncrease = Math.min(10, investmentAmount / 5);
  const assetIncrease = Math.floor(investmentAmount / 10);

  return {
    ...ci,
    detectionLevel: Math.min(100, ci.detectionLevel + detectionIncrease),
    assets: ci.assets + assetIncrease,
  };
}

/**
 * Calculate blowback from exposed operation
 */
export function calculateBlowback(
  operation: CovertOperation
): {
  relationshipDamage: number;
  trustDamage: number;
  reputationDamage: number;
  dipCost: number;
} {
  const relationshipDamage = -40;
  const trustDamage = -30;
  const reputationDamage = -25;
  const dipCost = 50;

  // More severe operations cause worse blowback
  const severityMultiplier = {
    'false-flag-attack': 2.0,
    'coup-support': 2.5,
    'assassination-attempt': 2.0,
    'sabotage-talks': 1.5,
    'influence-election': 1.8,
    'default': 1.0,
  };

  const multiplier =
    severityMultiplier[operation.type as keyof typeof severityMultiplier] ||
    severityMultiplier.default;

  return {
    relationshipDamage: Math.floor(relationshipDamage * multiplier),
    trustDamage: Math.floor(trustDamage * multiplier),
    reputationDamage: Math.floor(reputationDamage * multiplier),
    dipCost: Math.floor(dipCost * multiplier),
  };
}

/**
 * Get operation status description
 */
export function getOperationStatusDescription(status: CovertOperation['status']): string {
  switch (status) {
    case 'planning':
      return 'Planning - Preparing operation';
    case 'active':
      return 'Active - Operation in progress';
    case 'succeeded':
      return 'Succeeded - Mission accomplished';
    case 'failed':
      return 'Failed - Mission unsuccessful';
    case 'exposed':
      return 'Exposed - Operation compromised!';
    case 'aborted':
      return 'Aborted - Mission cancelled';
  }
}

/**
 * Get operation status color for UI
 */
export function getOperationStatusColor(status: CovertOperation['status']): string {
  switch (status) {
    case 'planning':
      return 'text-blue-400';
    case 'active':
      return 'text-yellow-400';
    case 'succeeded':
      return 'text-green-500';
    case 'failed':
      return 'text-orange-500';
    case 'exposed':
      return 'text-red-600';
    case 'aborted':
      return 'text-gray-400';
  }
}

/**
 * Abort a covert operation
 */
export function abortOperation(operation: CovertOperation): CovertOperation {
  return {
    ...operation,
    status: 'aborted',
  };
}

/**
 * Check if nation has enough resources for operation
 */
export function canAffordOperation(
  nation: Nation,
  operation: CovertOperation
): boolean {
  return (
    (nation.intel || 0) >= operation.intelCost &&
    (nation.production || 0) >= operation.economicCost
  );
}
