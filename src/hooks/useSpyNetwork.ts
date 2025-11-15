/**
 * Spy Network Management Hook
 *
 * Main interface for managing spy agents, missions, and counter-intelligence
 */

import { useCallback } from 'react';
import type { Nation, GameState } from '@/types/game';
import type {
  SpyAgent,
  SpyMission,
  SpyMissionType,
  SpyNetworkState,
  SpyRecruitmentOptions,
  SpyTrainingLevel,
  CounterIntelOperation,
  SpyIncident,
  SpyStatus,
} from '@/types/spySystem';
import {
  initializeSpyNetwork,
  recruitSpy,
  canRecruitSpy,
  getRecruitmentCost,
  launchSpyMission,
  canAffordMission,
  canAssignSpyToMission,
  getMissionCost,
  calculateMissionSuccessChance,
  calculateDetectionRisk,
  executeMission,
  updateSpyAfterMission,
  updateSpyNetworkReputation,
  launchCounterIntelOperation,
  executeCounterIntel,
  createSpyIncident,
  calculateSpyConsequences,
} from '@/lib/spyNetworkUtils';
import { applyMissionRewards } from '@/lib/spyMissionExecutor';
import { applyAllSpyConsequences } from '@/lib/spyDiplomaticIntegration';

export interface UseSpyNetworkOptions {
  currentTurn: number;
  getNation: (id: string) => Nation | undefined;
  getNations: () => Nation[];
  updateNation: (id: string, updates: Partial<Nation>) => void;
  updateNations: (updates: Map<string, Partial<Nation>>) => void;
  getGameState: () => GameState;
  onLog?: (message: string, tone?: 'normal' | 'warning' | 'success' | 'alert') => void;
  onToast?: (payload: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  onMissionResult?: (result: {
    spyName: string;
    missionType: string;
    targetNation: string;
    success: boolean;
    discovered: boolean;
    spyCaught: boolean;
    spyEliminated: boolean;
    coverBlown: boolean;
    narrative: string;
    rewards?: any;
    discoveryDetails?: any;
  }) => void;
}

/**
 * Spy Network Management Hook
 */
export function useSpyNetwork(options: UseSpyNetworkOptions) {
  const {
    currentTurn,
    getNation,
    getNations,
    updateNation,
    updateNations,
    getGameState,
    onLog,
    onToast,
    onMissionResult,
  } = options;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const ensureSpyNetwork = useCallback((nation: Nation): Nation => {
    if (!nation.spyNetwork) {
      return {
        ...nation,
        spyNetwork: initializeSpyNetwork(),
      };
    }
    return nation;
  }, []);

  // ============================================================================
  // SPY RECRUITMENT
  // ============================================================================

  const handleRecruitSpy = useCallback(
    (
      nationId: string,
      recruitmentOptions: SpyRecruitmentOptions
    ): { success: boolean; spy?: SpyAgent; message: string } => {
      let nation = getNation(nationId);
      if (!nation) {
        return { success: false, message: 'Nation not found' };
      }

      nation = ensureSpyNetwork(nation);

      // Check if can recruit
      const canRecruit = canRecruitSpy(nation, recruitmentOptions.trainingLevel);
      if (!canRecruit.canRecruit) {
        return { success: false, message: canRecruit.reason || 'Cannot recruit spy' };
      }

      // Deduct costs
      const cost = getRecruitmentCost(recruitmentOptions.trainingLevel);
      const updatedNation = {
        ...nation,
        intel: nation.intel - cost.intel,
        production: nation.production - cost.production,
      };

      // Recruit spy
      const newSpy = recruitSpy(updatedNation, currentTurn, recruitmentOptions);

      // Add to spy network
      const updatedNetwork: SpyNetworkState = {
        ...updatedNation.spyNetwork!,
        spies: [...updatedNation.spyNetwork!.spies, newSpy],
        recruitmentCooldown: 2, // 2 turn cooldown
      };

      updateNation(nationId, {
        intel: updatedNation.intel,
        production: updatedNation.production,
        spyNetwork: updatedNetwork,
      });

      onLog?.(
        `Recruited spy: ${newSpy.name} (${newSpy.cover}) - Skill: ${newSpy.skill}`,
        'success'
      );

      onToast?.({
        title: 'Spy Recruited',
        description: `${newSpy.name} has been recruited as ${newSpy.cover}`,
        variant: 'default',
      });

      return {
        success: true,
        spy: newSpy,
        message: `Successfully recruited ${newSpy.name}`,
      };
    },
    [currentTurn, getNation, ensureSpyNetwork, updateNation, onLog, onToast]
  );

  // ============================================================================
  // SPY MISSIONS
  // ============================================================================

  const handleLaunchMission = useCallback(
    (
      nationId: string,
      spyId: string,
      targetNationId: string,
      missionType: SpyMissionType
    ): { success: boolean; mission?: SpyMission; message: string } => {
      let nation = getNation(nationId);
      const targetNation = getNation(targetNationId);

      if (!nation || !targetNation) {
        return { success: false, message: 'Nation not found' };
      }

      nation = ensureSpyNetwork(nation);

      // Find spy
      const spy = nation.spyNetwork!.spies.find((s) => s.id === spyId);
      if (!spy) {
        return { success: false, message: 'Spy not found' };
      }

      // Check if spy can be assigned
      const canAssign = canAssignSpyToMission(spy, missionType, targetNation);
      if (!canAssign.canAssign) {
        return { success: false, message: canAssign.reason || 'Cannot assign spy' };
      }

      // Check if can afford
      const canAfford = canAffordMission(nation, missionType);
      if (!canAfford.canAfford) {
        return { success: false, message: canAfford.reason || 'Cannot afford mission' };
      }

      // Launch mission
      const mission = launchSpyMission(spy, targetNation, missionType, nation, currentTurn);

      // Deduct costs
      const cost = getMissionCost(missionType);
      const updatedNation = {
        ...nation,
        intel: nation.intel - cost.intel,
        production: cost.production ? nation.production - cost.production : nation.production,
      };

      // Update spy status
      const updatedSpies = updatedNation.spyNetwork!.spies.map((s) =>
        s.id === spyId
          ? {
              ...s,
              status: 'on-mission' as SpyStatus,
              currentMission: mission,
              targetNationId: targetNation.id,
            }
          : s
      );

      // Update network
      const updatedNetwork: SpyNetworkState = {
        ...updatedNation.spyNetwork!,
        spies: updatedSpies,
        activeMissions: [...updatedNation.spyNetwork!.activeMissions, mission],
      };

      updateNation(nationId, {
        intel: updatedNation.intel,
        production: updatedNation.production,
        spyNetwork: updatedNetwork,
      });

      onLog?.(
        `Mission launched: ${spy.name} → ${missionType} in ${targetNation.name} (${mission.duration} turns)`,
        'normal'
      );

      onToast?.({
        title: 'Mission Launched',
        description: `${spy.name} is conducting ${missionType} in ${targetNation.name}`,
        variant: 'default',
      });

      return {
        success: true,
        mission,
        message: `Mission launched successfully`,
      };
    },
    [currentTurn, getNation, ensureSpyNetwork, updateNation, onLog, onToast]
  );

  // ============================================================================
  // MISSION COMPLETION
  // ============================================================================

  const handleProcessCompletedMissions = useCallback(() => {
    const nations = getNations();
    const gameState = getGameState();
    const updates = new Map<string, Partial<Nation>>();

    for (const nation of nations) {
      if (!nation.spyNetwork || nation.spyNetwork.activeMissions.length === 0) {
        continue;
      }

      const completedMissions = nation.spyNetwork.activeMissions.filter(
        (mission) => mission.completionTurn <= currentTurn
      );

      if (completedMissions.length === 0) {
        continue;
      }

      let updatedNetwork = { ...nation.spyNetwork };

      for (const mission of completedMissions) {
        const spy = updatedNetwork.spies.find((s) => s.id === mission.spyId);
        const target = getNation(mission.targetNationId);

        if (!spy || !target) {
          continue;
        }

        // Execute mission
        const result = executeMission(mission, spy, target, nation, currentTurn, gameState);

        // Prepare reward information for modal
        let rewardInfo = result.rewards;
        let effectMessages: string[] = [];

        // Apply mission rewards if successful
        if (result.success && result.rewards) {
          const rewardResult = applyMissionRewards(
            result.rewards,
            mission,
            nation,
            target,
            gameState
          );

          // Update nations with rewards
          const existingNationRewardUpdate = updates.get(nation.id) ?? {};
          updates.set(nation.id, {
            ...existingNationRewardUpdate,
            ...rewardResult.updatedSpyNation,
          });

          const existingTargetRewardUpdate = updates.get(target.id) ?? {};
          updates.set(target.id, {
            ...existingTargetRewardUpdate,
            ...rewardResult.updatedTargetNation,
          });

          // Store effect messages for modal
          effectMessages = rewardResult.effectMessages;

          // Log reward messages
          rewardResult.effectMessages.forEach((msg) => {
            onLog?.(msg, 'success');
          });
        }

        // Trigger modal with detailed mission result
        onMissionResult?.({
          spyName: spy.name,
          missionType: mission.type,
          targetNation: target.name,
          success: result.success,
          discovered: result.discovered,
          spyCaught: result.spyCaught,
          spyEliminated: result.spyEliminated,
          coverBlown: result.coverBlown,
          narrative: result.narrative || '',
          rewards: result.success && rewardInfo ? {
            intel: rewardInfo.intelGained,
            production: rewardInfo.resourcesStolen?.production,
            technology: rewardInfo.techStolen,
            effectMessages,
          } : undefined,
          discoveryDetails: result.discoveryDetails,
        });

        // Log results
        if (result.spyEliminated) {
          onLog?.(`💀 ${spy.name} was eliminated in ${target.name}`, 'alert');
        } else if (result.spyCaught) {
          onLog?.(`🚨 ${spy.name} was captured in ${target.name}`, 'warning');
        } else if (result.discovered) {
          onLog?.(`⚠️ ${spy.name} was discovered but escaped`, 'warning');
        } else if (result.success) {
          onLog?.(`✓ ${spy.name} completed mission successfully`, 'success');
        } else {
          onLog?.(`✗ ${spy.name} failed mission`, 'warning');
        }

        // Handle diplomatic consequences if discovered
        if (result.discovered && result.evidenceLeft) {
          const incident = createSpyIncident(
            spy,
            mission,
            nation,
            target,
            currentTurn,
            result.spyEliminated
          );

          const resolution = calculateSpyConsequences(incident, nation, target);

          const consequences = applyAllSpyConsequences(
            nation,
            target,
            incident,
            resolution,
            gameState,
            currentTurn
          );

          // Update nations with consequences
          const existingNationConsequenceUpdate = updates.get(nation.id) ?? {};
          updates.set(nation.id, {
            ...existingNationConsequenceUpdate,
            ...consequences.updatedSpyNation,
          });

          const existingTargetConsequenceUpdate = updates.get(target.id) ?? {};
          updates.set(target.id, {
            ...existingTargetConsequenceUpdate,
            ...consequences.updatedTargetNation,
          });

          // Update other nations affected by reputation damage
          for (const otherNation of consequences.updatedOtherNations) {
            const previousOtherUpdate = updates.get(otherNation.id) ?? {};
            updates.set(otherNation.id, {
              ...previousOtherUpdate,
              ...otherNation,
            });
          }

          // Add incident to network
          updatedNetwork.incidents = [...updatedNetwork.incidents, incident];

          // Log consequences
          consequences.messages.forEach((msg) => {
            onLog?.(msg, 'warning');
          });
        }

        // Update spy after mission
        const updatedSpy = updateSpyAfterMission(spy, result);
        updatedNetwork.spies = updatedNetwork.spies.map((s) =>
          s.id === spy.id ? { ...updatedSpy, currentMission: undefined } : s
        );

        // Add to completed missions
        updatedNetwork.completedMissions = [
          ...updatedNetwork.completedMissions,
          {
            missionId: mission.id,
            type: mission.type,
            targetNationId: mission.targetNationId,
            completedTurn: currentTurn,
            result,
          },
        ].slice(-50); // Keep last 50

        // Update stats
        if (result.success) {
          updatedNetwork.totalSuccessfulMissions++;
        }
        if (result.spyEliminated) {
          updatedNetwork.totalSpiesLost++;
        }
        if (result.spyCaught) {
          updatedNetwork.totalSpiesCaptured++;
        }

        // Remove from active missions
        updatedNetwork.activeMissions = updatedNetwork.activeMissions.filter(
          (m) => m.id !== mission.id
        );
      }

      // Update reputation
      updatedNetwork = updateSpyNetworkReputation(updatedNetwork);

      // Add network update to batch
      const previousNationUpdate = updates.get(nation.id) ?? {};
      const previousSpyNetworkUpdate =
        (previousNationUpdate.spyNetwork as SpyNetworkState | undefined) ?? {};
      updates.set(nation.id, {
        ...previousNationUpdate,
        spyNetwork: {
          ...previousSpyNetworkUpdate,
          ...updatedNetwork,
        },
      });
    }

    // Apply all updates in batch
    if (updates.size > 0) {
      updateNations(updates);
    }
  }, [currentTurn, getNations, getNation, getGameState, updateNations, onLog, onToast, onMissionResult]);

  // ============================================================================
  // COUNTER-INTELLIGENCE
  // ============================================================================

  const handleLaunchCounterIntel = useCallback(
    (nationId: string, targetNationId?: string): { success: boolean; message: string } => {
      let nation = getNation(nationId);
      if (!nation) {
        return { success: false, message: 'Nation not found' };
      }

      nation = ensureSpyNetwork(nation);

      // Check if can afford
      if (nation.intel < 30) {
        return { success: false, message: 'Insufficient Intel (need 30)' };
      }

      // Launch counter-intel
      const operation = launchCounterIntelOperation(nation, currentTurn, targetNationId);

      // Deduct cost
      const updatedNetwork: SpyNetworkState = {
        ...nation.spyNetwork!,
        counterIntelOps: [...nation.spyNetwork!.counterIntelOps, operation],
      };

      updateNation(nationId, {
        intel: nation.intel - operation.intelCost,
        spyNetwork: updatedNetwork,
      });

      onLog?.('Counter-intelligence operation launched', 'success');

      return {
        success: true,
        message: 'Counter-intelligence operation launched',
      };
    },
    [currentTurn, getNation, ensureSpyNetwork, updateNation, onLog]
  );

  const handleProcessCounterIntel = useCallback(() => {
    const nations = getNations();
    const gameState = getGameState();
    const updates = new Map<string, Partial<Nation>>();

    for (const nation of nations) {
      if (!nation.spyNetwork || nation.spyNetwork.counterIntelOps.length === 0) {
        continue;
      }

      const completedOps = nation.spyNetwork.counterIntelOps.filter(
        (op) => op.startTurn + op.duration <= currentTurn && op.status === 'active'
      );

      if (completedOps.length === 0) {
        continue;
      }

      let updatedNetwork = { ...nation.spyNetwork };

      for (const op of completedOps) {
        // Execute counter-intel
        const detectedSpies = executeCounterIntel(op, nation, gameState);

        if (detectedSpies.length > 0) {
          onLog?.(
            `Counter-intelligence detected ${detectedSpies.length} enemy spies!`,
            'success'
          );

          // Process detected spies
          for (const spyId of detectedSpies) {
            // Find the spy's nation
            for (const otherNation of nations) {
              if (!otherNation.spyNetwork) continue;

              const spy = otherNation.spyNetwork.spies.find((s) => s.id === spyId);
              if (spy) {
                // Update spy status to captured
                const updatedSpies = otherNation.spyNetwork.spies.map((s) =>
                  s.id === spyId ? { ...s, status: 'captured' as SpyStatus } : s
                );

                const previousOtherUpdate = updates.get(otherNation.id) ?? {};
                const previousOtherSpyNetwork =
                  (previousOtherUpdate.spyNetwork as SpyNetworkState | undefined) ??
                  otherNation.spyNetwork ?? {};
                updates.set(otherNation.id, {
                  ...previousOtherUpdate,
                  spyNetwork: {
                    spies: [],
                    activeMissions: [],
                    completedMissions: [],
                    incidents: [],
                    counterIntelOps: [],
                    recruitmentCooldown: 0,
                    totalSpiesCaptured: 0,
                    totalSpiesLost: 0,
                    totalSuccessfulMissions: 0,
                    reputation: 'unknown' as const,
                    ...previousOtherSpyNetwork,
                    spies: updatedSpies,
                  },
                });

                onLog?.(`Captured enemy spy: ${spy.name} from ${otherNation.name}`, 'success');
                break;
              }
            }
          }

          // Mark operation as completed with spies detected
          op.status = 'completed';
          op.spiesDetected = detectedSpies;
        } else {
          onLog?.('Counter-intelligence operation completed - no spies detected', 'normal');
          op.status = 'completed';
        }
      }

      const previousNationUpdate = updates.get(nation.id) ?? {};
      const previousSpyNetworkUpdate =
        (previousNationUpdate.spyNetwork as SpyNetworkState | undefined) ?? {};
      updates.set(nation.id, {
        ...previousNationUpdate,
        spyNetwork: {
          ...previousSpyNetworkUpdate,
          ...updatedNetwork,
        },
      });
    }

    if (updates.size > 0) {
      updateNations(updates);
    }
  }, [currentTurn, getNations, getGameState, updateNations, onLog]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getSpyNetwork = useCallback(
    (nationId: string): SpyNetworkState | null => {
      const nation = getNation(nationId);
      if (!nation || !nation.spyNetwork) {
        return null;
      }
      return nation.spyNetwork;
    },
    [getNation]
  );

  const getActiveMissions = useCallback(
    (nationId: string): SpyMission[] => {
      const network = getSpyNetwork(nationId);
      return network?.activeMissions || [];
    },
    [getSpyNetwork]
  );

  const getSpies = useCallback(
    (nationId: string): SpyAgent[] => {
      const network = getSpyNetwork(nationId);
      return network?.spies || [];
    },
    [getSpyNetwork]
  );

  const getSpyById = useCallback(
    (nationId: string, spyId: string): SpyAgent | null => {
      const spies = getSpies(nationId);
      return spies.find((s) => s.id === spyId) || null;
    },
    [getSpies]
  );

  // ============================================================================
  // TURN PROCESSING
  // ============================================================================

  const processTurnStart = useCallback(() => {
    const nations = getNations();
    const updates = new Map<string, Partial<Nation>>();

    for (const nation of nations) {
      if (!nation.spyNetwork) continue;

      const updatedNetwork = { ...nation.spyNetwork };

      // Decrease recruitment cooldown
      if (updatedNetwork.recruitmentCooldown > 0) {
        updatedNetwork.recruitmentCooldown--;
      }

      updates.set(nation.id, { spyNetwork: updatedNetwork });
    }

    if (updates.size > 0) {
      updateNations(updates);
    }

    // Process completed missions
    handleProcessCompletedMissions();

    // Process counter-intel operations
    handleProcessCounterIntel();
  }, [getNations, updateNations, handleProcessCompletedMissions, handleProcessCounterIntel]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // Recruitment
    recruitSpy: handleRecruitSpy,
    canRecruitSpy: (nationId: string, trainingLevel?: SpyTrainingLevel) => {
      const nation = getNation(nationId);
      if (!nation) return { canRecruit: false, reason: 'Nation not found' };
      return canRecruitSpy(nation, trainingLevel);
    },
    getRecruitmentCost,

    // Missions
    launchMission: handleLaunchMission,
    canAffordMission: (nationId: string, missionType: SpyMissionType) => {
      const nation = getNation(nationId);
      if (!nation) return { canAfford: false, reason: 'Nation not found' };
      return canAffordMission(nation, missionType);
    },
    getMissionCost,
    calculateMissionSuccessChance: (
      spyId: string,
      nationId: string,
      targetNationId: string,
      missionType: SpyMissionType
    ) => {
      const nation = getNation(nationId);
      const target = getNation(targetNationId);
      const spy = getSpyById(nationId, spyId);
      if (!nation || !target || !spy) return 0;
      return calculateMissionSuccessChance(spy, target, missionType, nation);
    },
    calculateDetectionRisk: (
      spyId: string,
      nationId: string,
      targetNationId: string,
      missionType: SpyMissionType
    ) => {
      const nation = getNation(nationId);
      const target = getNation(targetNationId);
      const spy = getSpyById(nationId, spyId);
      if (!nation || !target || !spy) return 0;
      return calculateDetectionRisk(spy, target, missionType, nation);
    },

    // Counter-intelligence
    launchCounterIntel: handleLaunchCounterIntel,

    // Queries
    getSpyNetwork,
    getActiveMissions,
    getSpies,
    getSpyById,

    // Turn processing
    processTurnStart,
  };
}
