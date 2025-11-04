import { useCallback, useEffect, useState } from 'react';
import type { ActivePolicy, PolicyState, Policy, PolicyEffects } from '@/types/policy';
import { getPolicyById, checkPolicyConflict, calculatePolicySynergies } from '@/lib/policyData';

interface UsePolicySystemOptions {
  currentTurn: number;
  nationId: string;
  availableGold: number;
  availableProduction: number;
  availableIntel: number;
  onResourceCost: (gold: number, production: number, intel: number) => void;
  onAddNewsItem?: (category: string, text: string, priority: string) => void;
}

interface PolicySystemReturn {
  policyState: PolicyState;
  activePolicies: ActivePolicy[];
  totalEffects: PolicyEffects;
  enactPolicy: (policyId: string) => { success: boolean; reason?: string };
  repealPolicy: (policyId: string) => { success: boolean; reason?: string };
  canAffordPolicy: (policyId: string) => boolean;
  checkConflict: (policyId: string) => string | null;
}

export function usePolicySystem({
  currentTurn,
  nationId,
  availableGold,
  availableProduction,
  availableIntel,
  onResourceCost,
  onAddNewsItem
}: UsePolicySystemOptions): PolicySystemReturn {
  
  const [policyState, setPolicyState] = useState<PolicyState>({
    activePolicies: [],
    availablePolicies: [],
    policyHistory: []
  });

  // Calculate total effects from all active policies including synergies
  const calculateTotalEffects = useCallback((): PolicyEffects => {
    const activePolicyIds = policyState.activePolicies.map(p => p.policyId);
    const synergies = calculatePolicySynergies(activePolicyIds);

    const baseEffects: PolicyEffects = {
      productionModifier: 1.0,
      moraleModifier: 0,
      publicOpinionModifier: 0,
      cabinetApprovalModifier: 0,
      instabilityModifier: 0,
      goldPerTurn: 0,
      uraniumPerTurn: 0,
      intelPerTurn: 0,
      militaryRecruitmentModifier: 1.0,
      defenseBonus: 0,
      missileAccuracyBonus: 0,
      diplomaticInfluenceModifier: 1.0,
      relationshipDecayModifier: 1.0,
      espionageSuccessBonus: 0,
      counterIntelBonus: 0
    };

    // Apply base effects from all active policies
    for (const activePolicy of policyState.activePolicies) {
      const policy = getPolicyById(activePolicy.policyId);
      if (!policy) continue;

      applyEffectsToBase(baseEffects, policy.effects);
    }

    // Apply synergy bonuses
    for (const [policyId, synergyEffects] of synergies.entries()) {
      applyEffectsToBase(baseEffects, synergyEffects);
    }

    return baseEffects;
  }, [policyState.activePolicies]);

  // Check if policy can be afforded
  const canAffordPolicy = useCallback((policyId: string): boolean => {
    const policy = getPolicyById(policyId);
    if (!policy) return false;

    const cost = policy.enactmentCost;
    if (cost.gold && availableGold < cost.gold) return false;
    if (cost.production && availableProduction < cost.production) return false;
    if (cost.intel && availableIntel < cost.intel) return false;
    
    return true;
  }, [availableGold, availableProduction, availableIntel]);

  // Check for policy conflicts
  const checkConflict = useCallback((policyId: string): string | null => {
    const activePolicyIds = policyState.activePolicies.map(p => p.policyId);
    return checkPolicyConflict(policyId, activePolicyIds);
  }, [policyState.activePolicies]);

  // Enact a new policy
  const enactPolicy = useCallback((policyId: string): { success: boolean; reason?: string } => {
    const policy = getPolicyById(policyId);
    if (!policy) {
      return { success: false, reason: 'Policy not found' };
    }

    // Check if already active
    if (policyState.activePolicies.some(p => p.policyId === policyId)) {
      return { success: false, reason: 'Policy already active' };
    }

    // Check conflicts
    const conflict = checkConflict(policyId);
    if (conflict) {
      return { success: false, reason: `Conflicts with ${conflict}` };
    }

    // Check affordability
    if (!canAffordPolicy(policyId)) {
      return { success: false, reason: 'Insufficient resources' };
    }

    // Check prerequisites
    for (const prereq of policy.prerequisites) {
      if (prereq.type === 'turn' && currentTurn < (prereq.value as number)) {
        return { success: false, reason: prereq.description };
      }
      // Add other prerequisite checks as needed
    }

    // Deduct costs
    const cost = policy.enactmentCost;
    onResourceCost(
      cost.gold || 0,
      cost.production || 0,
      cost.intel || 0
    );

    // Add to active policies
    const newActivePolicy: ActivePolicy = {
      policyId,
      enactedTurn: currentTurn,
      turnsActive: 0
    };

    setPolicyState(prev => ({
      ...prev,
      activePolicies: [...prev.activePolicies, newActivePolicy],
      policyHistory: [
        ...prev.policyHistory,
        {
          policyId,
          action: 'enacted',
          turn: currentTurn
        }
      ]
    }));

    onAddNewsItem?.(
      'governance',
      `New policy enacted: ${policy.name}`,
      'important'
    );

    return { success: true };
  }, [policyState, currentTurn, checkConflict, canAffordPolicy, onResourceCost, onAddNewsItem]);

  // Repeal an active policy
  const repealPolicy = useCallback((policyId: string): { success: boolean; reason?: string } => {
    const policy = getPolicyById(policyId);
    if (!policy) {
      return { success: false, reason: 'Policy not found' };
    }

    // Check if policy is active
    const activePolicy = policyState.activePolicies.find(p => p.policyId === policyId);
    if (!activePolicy) {
      return { success: false, reason: 'Policy not active' };
    }

    // Check if policy can be repealed
    if (!policy.canRepeal) {
      return { success: false, reason: 'Policy cannot be repealed' };
    }

    // Check repeal cost
    if (policy.repealCost) {
      const canAfford = 
        (policy.repealCost.gold === undefined || availableGold >= policy.repealCost.gold) &&
        (policy.repealCost.production === undefined || availableProduction >= policy.repealCost.production) &&
        (policy.repealCost.intel === undefined || availableIntel >= policy.repealCost.intel);

      if (!canAfford) {
        return { success: false, reason: 'Cannot afford repeal cost' };
      }

      // Deduct repeal costs
      onResourceCost(
        policy.repealCost.gold || 0,
        policy.repealCost.production || 0,
        policy.repealCost.intel || 0
      );
    }

    // Remove from active policies
    setPolicyState(prev => ({
      ...prev,
      activePolicies: prev.activePolicies.filter(p => p.policyId !== policyId),
      policyHistory: [
        ...prev.policyHistory,
        {
          policyId,
          action: 'repealed',
          turn: currentTurn
        }
      ]
    }));

    onAddNewsItem?.(
      'governance',
      `Policy repealed: ${policy.name}`,
      'routine'
    );

    return { success: true };
  }, [policyState, currentTurn, availableGold, availableProduction, availableIntel, onResourceCost, onAddNewsItem]);

  // Update policy turn counters each turn
  useEffect(() => {
    setPolicyState(prev => ({
      ...prev,
      activePolicies: prev.activePolicies.map(policy => ({
        ...policy,
        turnsActive: currentTurn - policy.enactedTurn
      }))
    }));
  }, [currentTurn]);

  const totalEffects = calculateTotalEffects();

  return {
    policyState,
    activePolicies: policyState.activePolicies,
    totalEffects,
    enactPolicy,
    repealPolicy,
    canAffordPolicy,
    checkConflict
  };
}

// Helper function to merge policy effects
function applyEffectsToBase(base: PolicyEffects, effects: PolicyEffects): void {
  // Multipliers stack multiplicatively
  if (effects.productionModifier) {
    base.productionModifier = (base.productionModifier || 1.0) * effects.productionModifier;
  }
  if (effects.militaryRecruitmentModifier) {
    base.militaryRecruitmentModifier = (base.militaryRecruitmentModifier || 1.0) * effects.militaryRecruitmentModifier;
  }
  if (effects.diplomaticInfluenceModifier) {
    base.diplomaticInfluenceModifier = (base.diplomaticInfluenceModifier || 1.0) * effects.diplomaticInfluenceModifier;
  }
  if (effects.relationshipDecayModifier) {
    base.relationshipDecayModifier = (base.relationshipDecayModifier || 1.0) * effects.relationshipDecayModifier;
  }

  // Flat bonuses stack additively
  if (effects.moraleModifier) {
    base.moraleModifier = (base.moraleModifier || 0) + effects.moraleModifier;
  }
  if (effects.publicOpinionModifier) {
    base.publicOpinionModifier = (base.publicOpinionModifier || 0) + effects.publicOpinionModifier;
  }
  if (effects.cabinetApprovalModifier) {
    base.cabinetApprovalModifier = (base.cabinetApprovalModifier || 0) + effects.cabinetApprovalModifier;
  }
  if (effects.instabilityModifier) {
    base.instabilityModifier = (base.instabilityModifier || 0) + effects.instabilityModifier;
  }
  if (effects.goldPerTurn) {
    base.goldPerTurn = (base.goldPerTurn || 0) + effects.goldPerTurn;
  }
  if (effects.uraniumPerTurn) {
    base.uraniumPerTurn = (base.uraniumPerTurn || 0) + effects.uraniumPerTurn;
  }
  if (effects.intelPerTurn) {
    base.intelPerTurn = (base.intelPerTurn || 0) + effects.intelPerTurn;
  }
  if (effects.defenseBonus) {
    base.defenseBonus = (base.defenseBonus || 0) + effects.defenseBonus;
  }
  if (effects.missileAccuracyBonus) {
    base.missileAccuracyBonus = (base.missileAccuracyBonus || 0) + effects.missileAccuracyBonus;
  }
  if (effects.espionageSuccessBonus) {
    base.espionageSuccessBonus = (base.espionageSuccessBonus || 0) + effects.espionageSuccessBonus;
  }
  if (effects.counterIntelBonus) {
    base.counterIntelBonus = (base.counterIntelBonus || 0) + effects.counterIntelBonus;
  }
}

export type { PolicyEffects } from '@/types/policy';
