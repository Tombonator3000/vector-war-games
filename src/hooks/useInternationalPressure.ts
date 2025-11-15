/**
 * International Pressure System Hook
 *
 * Manages UN resolutions, sanctions, international aid, and diplomatic isolation.
 * Priority 7 implementation.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  InternationalResolution,
  ResolutionType,
  ResolutionEffects,
  SanctionPackage,
  SanctionType,
  SanctionEffects,
  AidPackage,
  AidType,
  AidCondition,
  InternationalPressure,
} from '../types/regionalMorale';

export interface UseInternationalPressureOptions {
  currentTurn: number;
  onResolutionPassed?: (resolution: InternationalResolution) => void;
  onSanctionsImposed?: (sanctions: SanctionPackage) => void;
  onAidGranted?: (aid: AidPackage) => void;
  onLegitimacyChange?: (nationId: string, oldValue: number, newValue: number) => void;
}

export function useInternationalPressure(options: UseInternationalPressureOptions) {
  const { currentTurn, onResolutionPassed, onSanctionsImposed, onAidGranted, onLegitimacyChange } = options;

  const [resolutions, setResolutions] = useState<Map<string, InternationalResolution>>(new Map());
  const [sanctions, setSanctions] = useState<Map<string, SanctionPackage>>(new Map());
  const [aidPackages, setAidPackages] = useState<Map<string, AidPackage>>(new Map());
  const [pressureState, setPressureState] = useState<Map<string, InternationalPressure>>(new Map());

  const [resolutionIdCounter, setResolutionIdCounter] = useState(0);
  const [sanctionIdCounter, setSanctionIdCounter] = useState(0);
  const [aidIdCounter, setAidIdCounter] = useState(0);

  /**
   * Initialize international pressure tracking for a nation
   */
  const initializePressure = useCallback((nationId: string) => {
    setPressureState((prev) => {
      if (prev.has(nationId)) return prev;

      const updated = new Map(prev);
      updated.set(nationId, {
        nationId,
        legitimacy: 80, // Default legitimacy
        isolationLevel: 0,
        activeResolutions: [],
        activeSanctions: [],
        activeAid: [],
        warCrimes: 0,
        nuclearStrikes: 0,
        treatyViolations: 0,
        humanRights: 70,
        totalDiplomaticPenalty: 0,
        totalEconomicPenalty: 0,
        totalStabilityImpact: 0,
      });

      return updated;
    });
  }, []);

  /**
   * Get international pressure state for a nation
   */
  const getPressure = useCallback(
    (nationId: string): InternationalPressure | undefined => {
      return pressureState.get(nationId);
    },
    [pressureState]
  );

  /**
   * Propose a UN resolution
   */
  const proposeResolution = useCallback(
    (
      type: ResolutionType,
      targetNationId: string,
      sponsors: string[],
      effects: ResolutionEffects,
      duration: number = -1
    ): InternationalResolution => {
      const resolution: InternationalResolution = {
        id: `resolution_${resolutionIdCounter}`,
        type,
        targetNationId,
        sponsors,
        turn: currentTurn,
        votesFor: [...sponsors],
        votesAgainst: [],
        abstentions: [],
        passed: false,
        effects,
        duration,
        turnsRemaining: duration,
      };

      setResolutions((prev) => {
        const updated = new Map(prev);
        updated.set(resolution.id, resolution);
        return updated;
      });

      setResolutionIdCounter((prev) => prev + 1);

      return resolution;
    },
    [currentTurn, resolutionIdCounter]
  );

  /**
   * Vote on a resolution
   */
  const voteOnResolution = useCallback(
    (resolutionId: string, nationId: string, vote: 'for' | 'against' | 'abstain') => {
      setResolutions((prev) => {
        const updated = new Map(prev);
        const resolution = updated.get(resolutionId);

        if (resolution && !resolution.passed) {
          // Remove from other vote arrays if already voted
          const votesFor = resolution.votesFor.filter((id) => id !== nationId);
          const votesAgainst = resolution.votesAgainst.filter((id) => id !== nationId);
          const abstentions = resolution.abstentions.filter((id) => id !== nationId);

          // Add to appropriate array
          if (vote === 'for') votesFor.push(nationId);
          else if (vote === 'against') votesAgainst.push(nationId);
          else abstentions.push(nationId);

          updated.set(resolutionId, {
            ...resolution,
            votesFor,
            votesAgainst,
            abstentions,
          });
        }

        return updated;
      });
    },
    []
  );

  /**
   * Finalize a resolution vote
   */
  const finalizeResolution = useCallback(
    (resolutionId: string): { passed: boolean } => {
      let passed = false;

      setResolutions((prev) => {
        const updated = new Map(prev);
        const resolution = updated.get(resolutionId);

        if (resolution && !resolution.passed) {
          // Simple majority for most resolutions
          const totalVotes = resolution.votesFor.length + resolution.votesAgainst.length;

          if (totalVotes === 0) {
            updated.set(resolutionId, {
              ...resolution,
              passed: false,
            });

            return updated;
          }

          const forPercentage = (resolution.votesFor.length / totalVotes) * 100;

          passed = forPercentage > 50;

          updated.set(resolutionId, {
            ...resolution,
            passed,
          });

          if (passed) {
            // Apply resolution effects
            setPressureState((prevPressure) => {
              const updatedPressure = new Map(prevPressure);
              const targetPressure = updatedPressure.get(resolution.targetNationId);

              if (targetPressure) {
                const newLegitimacy = Math.max(
                  0,
                  Math.min(100, targetPressure.legitimacy + (resolution.effects.legitimacy || 0))
                );

                updatedPressure.set(resolution.targetNationId, {
                  ...targetPressure,
                  activeResolutions: [...targetPressure.activeResolutions, resolutionId],
                  legitimacy: newLegitimacy,
                });

                if (onLegitimacyChange) {
                  onLegitimacyChange(resolution.targetNationId, targetPressure.legitimacy, newLegitimacy);
                }
              }

              return updatedPressure;
            });

            if (onResolutionPassed) {
              onResolutionPassed(resolution);
            }
          }
        }

        return updated;
      });

      return { passed };
    },
    [onResolutionPassed, onLegitimacyChange]
  );

  /**
   * Impose sanctions on a nation
   */
  const imposeSanctions = useCallback(
    (
      targetNationId: string,
      imposingNations: string[],
      sanctionTypes: SanctionType[],
      severity: number,
      duration: number
    ): SanctionPackage => {
      const effects = calculateSanctionEffects(sanctionTypes, severity);

      const sanctions: SanctionPackage = {
        id: `sanction_${sanctionIdCounter}`,
        targetNationId,
        imposingNations,
        type: sanctionTypes,
        severity,
        turn: currentTurn,
        duration,
        turnsRemaining: duration,
        effects,
        compliance: 70 + Math.random() * 20, // 70-90% compliance
        bypassAttempts: 0,
      };

      setSanctions((prev) => {
        const updated = new Map(prev);
        updated.set(sanctions.id, sanctions);
        return updated;
      });

      setPressureState((prev) => {
        const updated = new Map(prev);
        const targetPressure = updated.get(targetNationId);

        if (targetPressure) {
          updated.set(targetNationId, {
            ...targetPressure,
            activeSanctions: [...targetPressure.activeSanctions, sanctions.id],
            isolationLevel: Math.min(100, targetPressure.isolationLevel + severity * 5),
          });
        }

        return updated;
      });

      setSanctionIdCounter((prev) => prev + 1);

      if (onSanctionsImposed) {
        onSanctionsImposed(sanctions);
      }

      return sanctions;
    },
    [currentTurn, sanctionIdCounter, onSanctionsImposed]
  );

  /**
   * Lift sanctions
   */
  const liftSanctions = useCallback((sanctionId: string) => {
    const sanction = sanctions.get(sanctionId);
    if (!sanction) return;

    setSanctions((prev) => {
      const updated = new Map(prev);
      updated.delete(sanctionId);
      return updated;
    });

    setPressureState((prev) => {
      const updated = new Map(prev);
      const targetPressure = updated.get(sanction.targetNationId);

      if (targetPressure) {
        updated.set(sanction.targetNationId, {
          ...targetPressure,
          activeSanctions: targetPressure.activeSanctions.filter((id) => id !== sanctionId),
          isolationLevel: Math.max(0, targetPressure.isolationLevel - sanction.severity * 5),
        });
      }

      return updated;
    });
  }, [sanctions]);

  /**
   * Grant international aid to a nation
   */
  const grantAid = useCallback(
    (
      recipientNationId: string,
      donors: string[],
      aidTypes: AidType[],
      duration: number,
      conditions: AidCondition[]
    ): AidPackage => {
      const benefits = calculateAidBenefits(aidTypes, donors.length);

      const aid: AidPackage = {
        id: `aid_${aidIdCounter}`,
        recipientNationId,
        donors,
        type: aidTypes,
        turn: currentTurn,
        duration,
        turnsRemaining: duration,
        conditions,
        conditionsMet: true, // Initially assumed met
        benefits,
      };

      setAidPackages((prev) => {
        const updated = new Map(prev);
        updated.set(aid.id, aid);
        return updated;
      });

      setPressureState((prev) => {
        const updated = new Map(prev);
        const recipientPressure = updated.get(recipientNationId);

        if (recipientPressure) {
          updated.set(recipientNationId, {
            ...recipientPressure,
            activeAid: [...recipientPressure.activeAid, aid.id],
            legitimacy: Math.min(100, recipientPressure.legitimacy + 5),
          });
        }

        return updated;
      });

      setAidIdCounter((prev) => prev + 1);

      if (onAidGranted) {
        onAidGranted(aid);
      }

      return aid;
    },
    [currentTurn, aidIdCounter, onAidGranted]
  );

  /**
   * Check aid conditions and suspend if violated
   */
  const checkAidConditions = useCallback(
    (aidId: string, conditionChecks: Record<string, boolean>) => {
      setAidPackages((prev) => {
        const updated = new Map(prev);
        const aid = updated.get(aidId);

        if (aid) {
          let allMet = true;

          const updatedConditions = aid.conditions.map((condition) => {
            const met = conditionChecks[condition.type] ?? condition.met;
            if (!met) allMet = false;

            return {
              ...condition,
              met,
            };
          });

          updated.set(aidId, {
            ...aid,
            conditions: updatedConditions,
            conditionsMet: allMet,
          });

          // If conditions violated, reduce legitimacy
          if (!allMet && aid.conditionsMet) {
            setPressureState((prevPressure) => {
              const updatedPressure = new Map(prevPressure);
              const recipientPressure = updatedPressure.get(aid.recipientNationId);

              if (recipientPressure) {
                updatedPressure.set(aid.recipientNationId, {
                  ...recipientPressure,
                  legitimacy: Math.max(0, recipientPressure.legitimacy - 10),
                });
              }

              return updatedPressure;
            });
          }
        }

        return updated;
      });
    },
    []
  );

  /**
   * Record a violation (war crime, treaty breach, etc.)
   */
  const recordViolation = useCallback(
    (
      nationId: string,
      violationType: 'war_crime' | 'nuclear_strike' | 'treaty_violation'
    ) => {
      setPressureState((prev) => {
        const updated = new Map(prev);
        const pressure = updated.get(nationId);

        if (pressure) {
          const changes: Partial<InternationalPressure> = {};

          switch (violationType) {
            case 'war_crime':
              changes.warCrimes = (pressure.warCrimes || 0) + 1;
              changes.legitimacy = Math.max(0, pressure.legitimacy - 15);
              changes.humanRights = Math.max(0, pressure.humanRights - 20);
              break;

            case 'nuclear_strike':
              changes.nuclearStrikes = (pressure.nuclearStrikes || 0) + 1;
              changes.legitimacy = Math.max(0, pressure.legitimacy - 10);
              break;

            case 'treaty_violation':
              changes.treatyViolations = (pressure.treatyViolations || 0) + 1;
              changes.legitimacy = Math.max(0, pressure.legitimacy - 8);
              break;
          }

          updated.set(nationId, {
            ...pressure,
            ...changes,
          });

          if (onLegitimacyChange && changes.legitimacy !== undefined) {
            onLegitimacyChange(nationId, pressure.legitimacy, changes.legitimacy);
          }
        }

        return updated;
      });
    },
    [onLegitimacyChange]
  );

  /**
   * Calculate total economic impact from all international pressure
   */
  const getTotalEconomicImpact = useCallback(
    (nationId: string): { productionPenalty: number; goldPenalty: number } => {
      const pressure = pressureState.get(nationId);
      if (!pressure) return { productionPenalty: 0, goldPenalty: 0 };

      let productionPenalty = 0;
      let goldPenalty = 0;

      // Sanctions
      pressure.activeSanctions.forEach((sanctionId) => {
        const sanction = sanctions.get(sanctionId);
        if (sanction) {
          productionPenalty += sanction.effects.productionPenalty || 0;
          goldPenalty += sanction.effects.goldPenalty;
        }
      });

      // Resolutions
      pressure.activeResolutions.forEach((resolutionId) => {
        const resolution = resolutions.get(resolutionId);
        if (resolution?.passed && resolution.effects.tradePenalty) {
          productionPenalty += resolution.effects.tradePenalty;
        }
        if (resolution?.passed && resolution.effects.goldPerTurn && resolution.effects.goldPerTurn < 0) {
          goldPenalty += -resolution.effects.goldPerTurn;
        }
      });

      return { productionPenalty: Math.round(productionPenalty), goldPenalty: Math.round(goldPenalty) };
    },
    [pressureState, sanctions, resolutions]
  );

  /**
   * Calculate total diplomatic penalties
   */
  const getTotalDiplomaticPenalty = useCallback(
    (nationId: string): number => {
      const pressure = pressureState.get(nationId);
      if (!pressure) return 0;

      let totalPenalty = 0;

      // Base penalty from legitimacy
      totalPenalty += (80 - pressure.legitimacy) / 4;

      // Isolation penalty
      totalPenalty += pressure.isolationLevel / 2;

      // Sanctions
      pressure.activeSanctions.forEach((sanctionId) => {
        const sanction = sanctions.get(sanctionId);
        if (sanction) {
          totalPenalty += sanction.effects.diplomaticPenalty;
        }
      });

      // Resolutions
      pressure.activeResolutions.forEach((resolutionId) => {
        const resolution = resolutions.get(resolutionId);
        if (resolution?.passed && resolution.effects.diplomaticIsolation) {
          totalPenalty += resolution.effects.diplomaticIsolation;
        }
      });

      return Math.round(totalPenalty);
    },
    [pressureState, sanctions, resolutions]
  );

  /**
   * Get aid benefits for a nation
   */
  const getAidBenefits = useCallback(
    (nationId: string): AidPackage['benefits'] => {
      const pressure = pressureState.get(nationId);
      if (!pressure) return {};

      const totalBenefits: AidPackage['benefits'] = {
        productionBonus: 0,
        goldPerTurn: 0,
        stabilityBonus: 0,
        researchBonus: 0,
        militarySupport: 0,
      };

      pressure.activeAid.forEach((aidId) => {
        const aid = aidPackages.get(aidId);
        if (aid && aid.conditionsMet) {
          totalBenefits.productionBonus! += aid.benefits.productionBonus || 0;
          totalBenefits.goldPerTurn! += aid.benefits.goldPerTurn || 0;
          totalBenefits.stabilityBonus! += aid.benefits.stabilityBonus || 0;
          totalBenefits.researchBonus! += aid.benefits.researchBonus || 0;
          totalBenefits.militarySupport! += aid.benefits.militarySupport || 0;
        }
      });

      return totalBenefits;
    },
    [pressureState, aidPackages]
  );

  /**
   * Process turn updates
   */
  const processTurnUpdates = useCallback(() => {
    // Update resolution durations
    setResolutions((prev) => {
      const updated = new Map(prev);
      const toRemove: string[] = [];

      updated.forEach((resolution, id) => {
        if (resolution.passed && resolution.duration > 0) {
          const newRemaining = resolution.turnsRemaining - 1;

          if (newRemaining <= 0) {
            toRemove.push(id);
          } else {
            updated.set(id, {
              ...resolution,
              turnsRemaining: newRemaining,
            });
          }
        }
      });

      toRemove.forEach((id) => updated.delete(id));
      return updated;
    });

    // Update sanctions
    setSanctions((prev) => {
      const updated = new Map(prev);
      const toRemove: string[] = [];

      updated.forEach((sanction, id) => {
        const newRemaining = sanction.turnsRemaining - 1;

        if (newRemaining <= 0) {
          toRemove.push(id);
        } else {
          // Escalate if maintained
          const newEffects = {
            ...sanction.effects,
            productionPenalty: Math.min(
              90,
              sanction.effects.productionPenalty * (1 + sanction.effects.escalationRate / 100)
            ),
            goldPenalty: Math.floor(sanction.effects.goldPenalty * (1 + sanction.effects.escalationRate / 100)),
          };

          updated.set(id, {
            ...sanction,
            turnsRemaining: newRemaining,
            effects: newEffects,
          });
        }
      });

      toRemove.forEach((id) => liftSanctions(id));
      return updated;
    });

    // Update aid packages
    setAidPackages((prev) => {
      const updated = new Map(prev);
      const toRemove: string[] = [];

      updated.forEach((aid, id) => {
        const newRemaining = aid.turnsRemaining - 1;

        if (newRemaining <= 0) {
          toRemove.push(id);
        } else {
          updated.set(id, {
            ...aid,
            turnsRemaining: newRemaining,
          });
        }
      });

      toRemove.forEach((id) => updated.delete(id));
      return updated;
    });

    // Recalculate pressure totals
    setPressureState((prev) => {
      const updated = new Map(prev);

      updated.forEach((pressure, nationId) => {
        const economic = getTotalEconomicImpact(nationId);
        const diplomatic = getTotalDiplomaticPenalty(nationId);

        updated.set(nationId, {
          ...pressure,
          totalEconomicPenalty: economic.productionPenalty,
          totalDiplomaticPenalty: diplomatic,
        });
      });

      return updated;
    });
  }, [getTotalEconomicImpact, getTotalDiplomaticPenalty, liftSanctions]);

  const reset = useCallback(() => {
    setResolutions(new Map());
    setSanctions(new Map());
    setAidPackages(new Map());
    setPressureState(new Map());
    setResolutionIdCounter(0);
    setSanctionIdCounter(0);
    setAidIdCounter(0);
  }, []);

  return {
    // State
    resolutions: Array.from(resolutions.values()),
    sanctions: Array.from(sanctions.values()),
    aidPackages: Array.from(aidPackages.values()),
    pressureState: Array.from(pressureState.values()),

    // Initialization
    initializePressure,

    // Reset
    reset,

    // Pressure queries
    getPressure,

    // Resolutions
    proposeResolution,
    voteOnResolution,
    finalizeResolution,

    // Sanctions
    imposeSanctions,
    liftSanctions,

    // Aid
    grantAid,
    checkAidConditions,
    getAidBenefits,

    // Violations
    recordViolation,

    // Calculations
    getTotalEconomicImpact,
    getTotalDiplomaticPenalty,

    // Turn processing
    processTurnUpdates,
  };
}

// Helper functions

function calculateSanctionEffects(types: SanctionType[], severity: number): SanctionEffects {
  const effects: SanctionEffects = {
    productionPenalty: 0,
    goldPenalty: 0,
    researchPenalty: 0,
    diplomaticPenalty: 0,
    moraleImpact: 0,
    escalationRate: 5, // 5% increase per turn
  };

  types.forEach((type) => {
    switch (type) {
      case 'trade':
        effects.productionPenalty += severity * 3;
        effects.goldPenalty += severity * 2;
        break;

      case 'financial':
        effects.goldPenalty += severity * 5;
        effects.productionPenalty += severity * 1;
        break;

      case 'military':
        effects.productionPenalty += severity * 2;
        break;

      case 'diplomatic':
        effects.diplomaticPenalty += severity * 4;
        break;

      case 'technology':
        effects.researchPenalty += severity * 3;
        break;

      case 'travel':
        effects.diplomaticPenalty += severity * 2;
        break;
    }
  });

  effects.moraleImpact = -(severity * 0.5);

  return effects;
}

function calculateAidBenefits(types: AidType[], donorCount: number): AidPackage['benefits'] {
  const multiplier = 1 + (donorCount - 1) * 0.3; // More donors = more aid

  const benefits: AidPackage['benefits'] = {
    productionBonus: 0,
    goldPerTurn: 0,
    stabilityBonus: 0,
    researchBonus: 0,
    militarySupport: 0,
  };

  types.forEach((type) => {
    switch (type) {
      case 'economic':
        benefits.productionBonus! += Math.round(20 * multiplier);
        benefits.goldPerTurn! += Math.round(15 * multiplier);
        break;

      case 'humanitarian':
        benefits.stabilityBonus! += Math.round(10 * multiplier);
        benefits.goldPerTurn! += Math.round(5 * multiplier);
        break;

      case 'military':
        benefits.militarySupport! += Math.round(2 * multiplier);
        break;

      case 'technical':
        benefits.researchBonus! += Math.round(15 * multiplier);
        break;

      case 'reconstruction':
        benefits.productionBonus! += Math.round(15 * multiplier);
        benefits.stabilityBonus! += Math.round(5 * multiplier);
        break;
    }
  });

  return benefits;
}
