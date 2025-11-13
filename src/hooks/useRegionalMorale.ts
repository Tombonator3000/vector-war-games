/**
 * Regional Morale System Hook
 *
 * Manages morale at the territory level, including spread mechanics,
 * protests, strikes, and civil stability tracking.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  RegionalMorale,
  NationalMoraleCalculation,
  ProtestState,
  StrikeState,
  CivilWarRisk,
  ProtestCause,
  StrikeDemand,
  StrikeType,
} from '../types/regionalMorale';
import { calculateNationalMorale, shouldProtestSpread, calculateCivilWarRisk } from '../types/regionalMorale';

interface Territory {
  id: string;
  name: string;
  controllingNationId: string | null;
  neighbors: string[];
  strategicValue: number;
}

export interface UseRegionalMoraleOptions {
  territories: Territory[];
  currentTurn: number;
  onMoraleChange?: (territoryId: string, oldMorale: number, newMorale: number) => void;
  onProtestStart?: (territoryId: string, protest: ProtestState) => void;
  onStrikeStart?: (territoryId: string, strike: StrikeState) => void;
  onCivilWarRisk?: (nationId: string, risk: CivilWarRisk) => void;
}

export function useRegionalMorale(options: UseRegionalMoraleOptions) {
  const { territories, currentTurn, onMoraleChange, onProtestStart, onStrikeStart, onCivilWarRisk } = options;

  // Regional morale state for all territories
  const [regionalMorale, setRegionalMorale] = useState<Map<string, RegionalMorale>>(new Map());
  const [territoryUnrestDuration, setTerritoryUnrestDuration] = useState<Map<string, number>>(new Map());

  // Initialize morale for new territories
  useEffect(() => {
    setRegionalMorale((prev) => {
      const updated = new Map(prev);
      territories.forEach((territory) => {
        if (!updated.has(territory.id)) {
          updated.set(territory.id, {
            territoryId: territory.id,
            morale: 70, // Default starting morale
            lastEventTurn: 0,
            lastMoraleChange: 0,
            historicalMorale: [70],
            protests: null,
            strikes: null,
            refugeeInflux: 0,
          });
        }
      });
      return updated;
    });

    setTerritoryUnrestDuration((prev) => {
      const updated = new Map(prev);
      territories.forEach((territory) => {
        if (!updated.has(territory.id)) {
          updated.set(territory.id, 0);
        }
      });
      return updated;
    });
  }, [territories]);

  /**
   * Get morale for a specific territory
   */
  const getTerritoryMorale = useCallback(
    (territoryId: string): number => {
      return regionalMorale.get(territoryId)?.morale ?? 70;
    },
    [regionalMorale]
  );

  /**
   * Get full morale data for a territory
   */
  const getTerritoryMoraleData = useCallback(
    (territoryId: string): RegionalMorale | undefined => {
      return regionalMorale.get(territoryId);
    },
    [regionalMorale]
  );

  /**
   * Set morale for a specific territory
   */
  const setTerritoryMorale = useCallback(
    (territoryId: string, newMorale: number, reason?: string) => {
      setRegionalMorale((prev) => {
        const updated = new Map(prev);
        const current = updated.get(territoryId);

        if (current) {
          const oldMorale = current.morale;
          const clampedMorale = Math.max(0, Math.min(100, newMorale));
          const delta = clampedMorale - oldMorale;

          // Update historical data
          const history = [...current.historicalMorale, clampedMorale].slice(-5);

          updated.set(territoryId, {
            ...current,
            morale: clampedMorale,
            lastMoraleChange: delta,
            lastEventTurn: currentTurn,
            historicalMorale: history,
          });

          if (onMoraleChange) {
            onMoraleChange(territoryId, oldMorale, clampedMorale);
          }

          // Check for protest triggers
          if (clampedMorale < 40 && !current.protests && Math.random() < 0.3) {
            startProtest(territoryId, ['low_morale']);
          }
        }

        return updated;
      });
    },
    [currentTurn, onMoraleChange]
  );

  /**
   * Adjust morale by a delta
   */
  const adjustTerritoryMorale = useCallback(
    (territoryId: string, delta: number, reason?: string) => {
      const current = getTerritoryMorale(territoryId);
      setTerritoryMorale(territoryId, current + delta, reason);
    },
    [getTerritoryMorale, setTerritoryMorale]
  );

  /**
   * Calculate nation-wide morale from regions
   */
  const calculateNationalMoraleForNation = useCallback(
    (nationId: string): NationalMoraleCalculation => {
      const nationTerritories = territories.filter((t) => t.controllingNationId === nationId);
      const regionsMorale = nationTerritories
        .map((t) => regionalMorale.get(t.id))
        .filter((m): m is RegionalMorale => m !== undefined);

      return calculateNationalMorale(regionsMorale, nationTerritories);
    },
    [territories, regionalMorale]
  );

  /**
   * Start a protest in a territory
   */
  const startProtest = useCallback(
    (territoryId: string, causes: ProtestCause[]) => {
      setRegionalMorale((prev) => {
        const updated = new Map(prev);
        const current = updated.get(territoryId);

        if (current && !current.protests) {
          const intensity = Math.min(10, 3 + causes.length);
          const protest: ProtestState = {
            intensity,
            startTurn: currentTurn,
            duration: 0,
            causes,
            spreading: intensity >= 7,
            suppressionAttempts: 0,
            productionPenalty: intensity * 5, // 5-50% penalty
            moraleImpact: intensity * 0.5, // -0.5 to -5 per turn
            publicOpinionCost: intensity * 3, // Cost to suppress
          };

          updated.set(territoryId, {
            ...current,
            protests: protest,
          });

          if (onProtestStart) {
            onProtestStart(territoryId, protest);
          }
        }

        return updated;
      });
    },
    [currentTurn, onProtestStart]
  );

  /**
   * Start a strike in a territory
   */
  const startStrike = useCallback(
    (territoryId: string, strikeType: StrikeType, demands: StrikeDemand[]) => {
      setRegionalMorale((prev) => {
        const updated = new Map(prev);
        const current = updated.get(territoryId);

        if (current && !current.strikes) {
          const totalCost = demands.reduce((sum, d) => sum + d.cost, 0);
          const isGeneralStrike = strikeType === 'general_strike';

          const strike: StrikeState = {
            type: strikeType,
            startTurn: currentTurn,
            duration: 0,
            strikerDemands: demands,
            productionHalted: isGeneralStrike,
            productionPenalty: isGeneralStrike ? 100 : 30 + demands.length * 10,
            resolutionCost: totalCost,
            negotiationProgress: 0,
            forceSuppression: false,
          };

          updated.set(territoryId, {
            ...current,
            strikes: strike,
          });

          if (onStrikeStart) {
            onStrikeStart(territoryId, strike);
          }
        }

        return updated;
      });
    },
    [currentTurn, onStrikeStart]
  );

  /**
   * Suppress a protest with force
   */
  const suppressProtest = useCallback(
    (territoryId: string): { success: boolean; publicOpinionCost: number } => {
      let result = { success: false, publicOpinionCost: 0 };

      setRegionalMorale((prev) => {
        const updated = new Map(prev);
        const current = updated.get(territoryId);

        if (current?.protests) {
          const successChance = 60 - current.protests.intensity * 3;
          const success = Math.random() * 100 < successChance;

          if (success) {
            // Protest ended, but at a cost
            updated.set(territoryId, {
              ...current,
              protests: null,
              morale: Math.max(0, current.morale - 5),
            });
          } else {
            // Protest intensifies
            updated.set(territoryId, {
              ...current,
              protests: {
                ...current.protests,
                intensity: Math.min(10, current.protests.intensity + 1),
                suppressionAttempts: current.protests.suppressionAttempts + 1,
              },
              morale: Math.max(0, current.morale - 3),
            });
          }

          result = {
            success,
            publicOpinionCost: current.protests.publicOpinionCost,
          };
        }

        return updated;
      });

      return result;
    },
    []
  );

  /**
   * Negotiate to end a strike
   */
  const negotiateStrike = useCallback(
    (territoryId: string, meetDemands: boolean): { resolved: boolean; cost: number } => {
      let result = { resolved: false, cost: 0 };

      setRegionalMorale((prev) => {
        const updated = new Map(prev);
        const current = updated.get(territoryId);

        if (current?.strikes) {
          if (meetDemands) {
            // Pay the cost, end the strike, gain morale
            updated.set(territoryId, {
              ...current,
              strikes: null,
              morale: Math.min(100, current.morale + 5),
            });

            result = {
              resolved: true,
              cost: current.strikes.resolutionCost,
            };
          } else {
            // Partial negotiation, reduce penalty
            const progress = Math.min(100, current.strikes.negotiationProgress + 25);
            const resolved = progress >= 100;

            updated.set(territoryId, {
              ...current,
              strikes: resolved
                ? null
                : {
                    ...current.strikes,
                    negotiationProgress: progress,
                    productionPenalty: Math.max(10, current.strikes.productionPenalty - 10),
                  },
              morale: resolved ? Math.min(100, current.morale + 3) : current.morale,
            });

            result = {
              resolved,
              cost: 0,
            };
          }
        }

        return updated;
      });

      return result;
    },
    []
  );

  /**
   * Process morale spread between adjacent territories
   */
  const processMoraleSpread = useCallback(() => {
    setRegionalMorale((prev) => {
      const updated = new Map(prev);

      territories.forEach((territory) => {
        const current = updated.get(territory.id);
        if (!current) return;

        // Spread morale influence from neighbors
        const neighbors = territory.neighbors
          .map((nid) => updated.get(nid))
          .filter((m): m is RegionalMorale => m !== undefined);

        if (neighbors.length > 0) {
          const avgNeighborMorale =
            neighbors.reduce((sum, n) => sum + n.morale, 0) / neighbors.length;
          const diff = avgNeighborMorale - current.morale;

          // Morale slowly converges with neighbors (10% of difference)
          const spreadAmount = diff * 0.1;

          if (Math.abs(spreadAmount) > 0.5) {
            updated.set(territory.id, {
              ...current,
              morale: Math.max(0, Math.min(100, current.morale + spreadAmount)),
            });
          }
        }

        // Spread protests
        if (current.protests?.spreading) {
          territory.neighbors.forEach((neighborId) => {
            const neighbor = updated.get(neighborId);
            if (neighbor && !neighbor.protests) {
              if (shouldProtestSpread(current.protests!, neighbor.morale, territory.neighbors.length)) {
                const neighborUpdated = updated.get(neighborId);
                if (neighborUpdated) {
                  updated.set(neighborId, {
                    ...neighborUpdated,
                    protests: {
                      ...current.protests!,
                      intensity: Math.max(1, current.protests!.intensity - 2),
                      startTurn: currentTurn,
                      duration: 0,
                    },
                  });
                }
              }
            }
          });
        }
      });

      return updated;
    });
  }, [territories, currentTurn]);

  /**
   * Process turn updates for protests and strikes
   */
  const processTurnUpdates = useCallback(() => {
    const updatedUnrest = new Map(territoryUnrestDuration);

    setRegionalMorale((prev) => {
      const updated = new Map(prev);

      updated.forEach((morale, territoryId) => {
        let needsUpdate = false;
        const changes = { ...morale };

        // Update protest duration and effects
        if (morale.protests) {
          changes.protests = {
            ...morale.protests,
            duration: morale.protests.duration + 1,
          };

          // Apply morale impact
          changes.morale = Math.max(0, changes.morale - morale.protests.moraleImpact);

          // Protests can fade if morale improves and duration is long
          if (changes.morale > 60 && morale.protests.duration > 5) {
            const fadeChance = (changes.morale - 60) * 2 + morale.protests.duration * 5;
            if (Math.random() * 100 < fadeChance) {
              changes.protests = null;
            }
          }

          needsUpdate = true;
        }

        // Update strike duration
        if (morale.strikes) {
          changes.strikes = {
            ...morale.strikes,
            duration: morale.strikes.duration + 1,
          };

          // Strikes eventually resolve themselves (very slowly)
          if (morale.strikes.duration > 8 && Math.random() < 0.15) {
            changes.strikes = null;
            changes.morale = Math.min(100, changes.morale + 2);
          }

          needsUpdate = true;
        }

        const finalState = needsUpdate ? changes : morale;
        const hasUnrest = Boolean(finalState.protests || finalState.strikes);
        const previousDuration = updatedUnrest.get(territoryId) ?? 0;
        updatedUnrest.set(territoryId, hasUnrest ? previousDuration + 1 : 0);

        if (needsUpdate) {
          updated.set(territoryId, finalState);
        }
      });

      return updated;
    });

    setTerritoryUnrestDuration(updatedUnrest);

    // Process morale spread
    processMoraleSpread();
  }, [processMoraleSpread, territoryUnrestDuration]);

  /**
   * Calculate civil war risk for a nation
   */
  const calculateNationCivilWarRisk = useCallback(
    (nationId: string, publicOpinion: number, cabinetApproval: number): CivilWarRisk => {
      const nationMorale = calculateNationalMoraleForNation(nationId);
      const nationTerritories = territories.filter((t) => t.controllingNationId === nationId);

      let protestCount = 0;
      let strikeCount = 0;

      nationTerritories.forEach((t) => {
        const morale = regionalMorale.get(t.id);
        if (morale?.protests) protestCount++;
        if (morale?.strikes) strikeCount++;
      });

      const turnsAtRisk = nationTerritories.reduce((total, territory) => {
        return total + (territoryUnrestDuration.get(territory.id) ?? 0);
      }, 0);

      return calculateCivilWarRisk(
        nationMorale.weightedAverage,
        publicOpinion,
        cabinetApproval,
        protestCount,
        strikeCount,
        turnsAtRisk
      );
    },
    [territories, regionalMorale, territoryUnrestDuration, calculateNationalMoraleForNation]
  );

  /**
   * Get all territories with active protests
   */
  const getTerritoriesWithProtests = useCallback(
    (nationId?: string): Array<{ territoryId: string; protest: ProtestState }> => {
      const result: Array<{ territoryId: string; protest: ProtestState }> = [];

      regionalMorale.forEach((morale, territoryId) => {
        if (morale.protests) {
          const territory = territories.find((t) => t.id === territoryId);
          if (!nationId || territory?.controllingNationId === nationId) {
            result.push({ territoryId, protest: morale.protests });
          }
        }
      });

      return result;
    },
    [regionalMorale, territories]
  );

  /**
   * Get all territories with active strikes
   */
  const getTerritoriesWithStrikes = useCallback(
    (nationId?: string): Array<{ territoryId: string; strike: StrikeState }> => {
      const result: Array<{ territoryId: string; strike: StrikeState }> = [];

      regionalMorale.forEach((morale, territoryId) => {
        if (morale.strikes) {
          const territory = territories.find((t) => t.id === territoryId);
          if (!nationId || territory?.controllingNationId === nationId) {
            result.push({ territoryId, strike: morale.strikes });
          }
        }
      });

      return result;
    },
    [regionalMorale, territories]
  );

  /**
   * Get production penalty for a territory
   */
  const getTerritoryProductionPenalty = useCallback(
    (territoryId: string): number => {
      const morale = regionalMorale.get(territoryId);
      if (!morale) return 0;

      let totalPenalty = 0;

      // Protest penalty
      if (morale.protests) {
        totalPenalty += morale.protests.productionPenalty;
      }

      // Strike penalty
      if (morale.strikes) {
        totalPenalty += morale.strikes.productionPenalty;
      }

      // Low morale penalty (below 40)
      if (morale.morale < 40) {
        totalPenalty += (40 - morale.morale) * 0.5; // Up to 20% additional
      }

      return Math.min(100, totalPenalty);
    },
    [regionalMorale]
  );

  return {
    // State
    regionalMorale: Array.from(regionalMorale.values()),
    regionalMoraleMap: regionalMorale,
    territoryUnrestDuration,

    // Territory morale
    getTerritoryMorale,
    getTerritoryMoraleData,
    setTerritoryMorale,
    adjustTerritoryMorale,

    // National calculations
    calculateNationalMoraleForNation,
    calculateNationCivilWarRisk,

    // Protests
    startProtest,
    suppressProtest,
    getTerritoriesWithProtests,

    // Strikes
    startStrike,
    negotiateStrike,
    getTerritoriesWithStrikes,

    // Production effects
    getTerritoryProductionPenalty,

    // Turn processing
    processTurnUpdates,
    processMoraleSpread,
  };
}
