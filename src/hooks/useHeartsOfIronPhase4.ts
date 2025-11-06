/**
 * Hearts of Iron Phase 4 Hook
 *
 * Manages Intelligence Agencies, Occupation, and Enhanced Peace Conferences
 */

import { useState, useCallback, useEffect } from 'react';
import type { Nation, GameState } from '@/types/game';
import type {
  HeartsOfIronPhase4State,
  IntelligenceAgency,
  IntelOperation,
  AgencyUpgrade,
  IntelOperationType,
  OccupiedTerritory,
  OccupationPolicyType,
  UprisingEvent,
  EnhancedPeaceConference,
  PeaceDemandType,
  PeaceDemandDetails,
} from '@/types/heartsOfIronPhase4';
import type { SpyAgent } from '@/types/spySystem';

import {
  createIntelligenceAgency,
  calculateAgencyReputation,
  canUpgradeAgencyLevel,
  upgradeAgencyLevel,
  canPurchaseUpgrade,
  purchaseAgencyUpgrade,
  launchIntelOperation,
  progressIntelOperation,
  executeIntelOperation,
  awardAgencyExperience,
} from '@/lib/intelligenceAgencyUtils';

import {
  createOccupiedTerritory,
  calculateRequiredGarrison,
  updateResistanceState,
  applySabotageToResources,
  checkForUprising,
  resolveUprising,
  changeOccupationPolicy,
  addForeignResistanceSupport,
  updateGarrison,
  updateGarrisonMorale,
  updateOccupationStatus,
  extractResources,
} from '@/lib/occupationUtils';

import {
  createEnhancedPeaceConference,
  addConferenceParticipant,
  createPeaceDemand,
  supportDemand,
  opposeDemand,
  voteOnDemand,
  finalizeDemand,
  advanceConferenceRound,
  createPeaceTreatyFromDemands,
  concludeConferenceWithTreaty,
  updateWalkoutRisk,
  calculateConferenceSuccessProbability,
} from '@/lib/enhancedPeaceConferenceUtils';

export function useHeartsOfIronPhase4() {
  const [phase4State, setPhase4State] = useState<HeartsOfIronPhase4State>({
    agencies: {},
    occupations: [],
    uprisings: [],
    peaceConferences: [],
    treaties: [],
  });

  // ============================================================================
  // INTELLIGENCE AGENCIES
  // ============================================================================

  /**
   * Initialize agency for a nation
   */
  const initializeAgency = useCallback((nationId: string) => {
    setPhase4State(prev => {
      if (prev.agencies[nationId]) return prev; // Already exists

      return {
        ...prev,
        agencies: {
          ...prev.agencies,
          [nationId]: createIntelligenceAgency(nationId),
        },
      };
    });
  }, []);

  /**
   * Get agency for nation
   */
  const getAgency = useCallback(
    (nationId: string): IntelligenceAgency | null => {
      return phase4State.agencies[nationId] || null;
    },
    [phase4State.agencies]
  );

  /**
   * Upgrade agency level
   */
  const upgradeAgency = useCallback((nationId: string) => {
    setPhase4State(prev => {
      const agency = prev.agencies[nationId];
      if (!agency || !canUpgradeAgencyLevel(agency)) return prev;

      const upgraded = upgradeAgencyLevel(agency);
      const updatedAgency = {
        ...upgraded,
        reputation: calculateAgencyReputation(upgraded),
      };

      return {
        ...prev,
        agencies: {
          ...prev.agencies,
          [nationId]: updatedAgency,
        },
      };
    });
  }, []);

  /**
   * Purchase agency upgrade
   */
  const purchaseUpgrade = useCallback(
    (nationId: string, upgrade: AgencyUpgrade, nation: Nation): Nation | null => {
      const agency = phase4State.agencies[nationId];
      if (!agency) return null;

      const check = canPurchaseUpgrade(agency, upgrade, nation);
      if (!check.canPurchase) return null;

      const { agency: updatedAgency, nation: updatedNation } = purchaseAgencyUpgrade(
        agency,
        upgrade,
        nation
      );

      setPhase4State(prev => ({
        ...prev,
        agencies: {
          ...prev.agencies,
          [nationId]: updatedAgency,
        },
      }));

      return updatedNation;
    },
    [phase4State.agencies]
  );

  /**
   * Launch intelligence operation
   */
  const launchOperation = useCallback(
    (
      nationId: string,
      type: IntelOperationType,
      targetNationId: string,
      operatives: SpyAgent[],
      currentTurn: number
    ) => {
      const agency = phase4State.agencies[nationId];
      if (!agency) return;

      const operation = launchIntelOperation(agency, type, targetNationId, operatives, currentTurn);

      setPhase4State(prev => ({
        ...prev,
        agencies: {
          ...prev.agencies,
          [nationId]: {
            ...agency,
            activeOperations: [...agency.activeOperations, operation],
            activeOperatives: agency.activeOperatives + operatives.length,
          },
        },
      }));
    },
    [phase4State.agencies]
  );

  /**
   * Progress all active operations (called each turn)
   */
  const progressOperations = useCallback((currentTurn: number) => {
    setPhase4State(prev => {
      const updatedAgencies = { ...prev.agencies };
      let hasChanges = false;

      Object.keys(updatedAgencies).forEach(nationId => {
        const agency = updatedAgencies[nationId];
        const updatedOperations = agency.activeOperations.map(op =>
          progressIntelOperation(op, currentTurn)
        );

        if (JSON.stringify(updatedOperations) !== JSON.stringify(agency.activeOperations)) {
          hasChanges = true;
          updatedAgencies[nationId] = {
            ...agency,
            activeOperations: updatedOperations,
          };
        }
      });

      return hasChanges ? { ...prev, agencies: updatedAgencies } : prev;
    });
  }, []);

  // ============================================================================
  // OCCUPATION SYSTEM
  // ============================================================================

  /**
   * Create occupied territory
   */
  const occupyTerritory = useCallback(
    (
      territoryId: string,
      occupierId: string,
      formerOwnerId: string,
      currentTurn: number,
      policy: OccupationPolicyType = 'moderate'
    ) => {
      const occupation = createOccupiedTerritory(
        territoryId,
        occupierId,
        formerOwnerId,
        currentTurn,
        policy
      );

      setPhase4State(prev => ({
        ...prev,
        occupations: [...prev.occupations, occupation],
      }));
    },
    []
  );

  /**
   * Update all occupations (called each turn)
   */
  const updateOccupations = useCallback((currentTurn: number) => {
    setPhase4State(prev => {
      const updatedOccupations = prev.occupations.map(occ => {
        let updated = updateResistanceState(occ, currentTurn);
        updated = applySabotageToResources(updated);
        updated = updateGarrisonMorale(updated, currentTurn);
        updated = updateOccupationStatus(updated);
        return updated;
      });

      // Check for uprisings
      const newUprisings: UprisingEvent[] = [];
      updatedOccupations.forEach(occ => {
        const uprising = checkForUprising(occ, currentTurn);
        if (uprising) {
          newUprisings.push(uprising);
        }
      });

      return {
        ...prev,
        occupations: updatedOccupations,
        uprisings: [...prev.uprisings, ...newUprisings],
      };
    });
  }, []);

  /**
   * Change occupation policy
   */
  const setOccupationPolicy = useCallback(
    (territoryId: string, newPolicy: OccupationPolicyType) => {
      setPhase4State(prev => ({
        ...prev,
        occupations: prev.occupations.map(occ =>
          occ.territoryId === territoryId ? changeOccupationPolicy(occ, newPolicy) : occ
        ),
      }));
    },
    []
  );

  /**
   * Assign garrison to territory
   */
  const assignGarrison = useCallback(
    (territoryId: string, unitIds: string[], totalStrength: number) => {
      setPhase4State(prev => ({
        ...prev,
        occupations: prev.occupations.map(occ =>
          occ.territoryId === territoryId ? updateGarrison(occ, unitIds, totalStrength) : occ
        ),
      }));
    },
    []
  );

  /**
   * Resolve an uprising
   */
  const resolveUprisingEvent = useCallback((uprisingId: string) => {
    setPhase4State(prev => {
      const uprising = prev.uprisings.find(u => u.id === uprisingId);
      if (!uprising) return prev;

      const occupation = prev.occupations.find(o => o.territoryId === uprising.territoryId);
      if (!occupation) return prev;

      const result = resolveUprising(uprising, occupation);

      return {
        ...prev,
        occupations: prev.occupations.map(occ =>
          occ.territoryId === uprising.territoryId ? result.occupation : occ
        ),
        uprisings: prev.uprisings.map(u => (u.id === uprisingId ? result.uprising : u)),
      };
    });
  }, []);

  /**
   * Get occupation by territory
   */
  const getOccupation = useCallback(
    (territoryId: string): OccupiedTerritory | null => {
      return phase4State.occupations.find(o => o.territoryId === territoryId) || null;
    },
    [phase4State.occupations]
  );

  // ============================================================================
  // ENHANCED PEACE CONFERENCES
  // ============================================================================

  /**
   * Create peace conference
   */
  const createPeaceConference = useCallback(
    (convenedBy: string, currentTurn: number, warIds: string[]) => {
      const conference = createEnhancedPeaceConference(convenedBy, currentTurn, warIds);

      setPhase4State(prev => ({
        ...prev,
        peaceConferences: [...prev.peaceConferences, conference],
      }));

      return conference.id;
    },
    []
  );

  /**
   * Add participant to conference
   */
  const addParticipant = useCallback(
    (conferenceId: string, participantData: any) => {
      setPhase4State(prev => ({
        ...prev,
        peaceConferences: prev.peaceConferences.map(conf =>
          conf.id === conferenceId
            ? addConferenceParticipant(
                conf,
                participantData.nationId,
                participantData.side,
                participantData.contribution
              )
            : conf
        ),
      }));
    },
    []
  );

  /**
   * Make peace demand
   */
  const makePeaceDemand = useCallback(
    (
      conferenceId: string,
      demandingNation: string,
      demandType: PeaceDemandType,
      target: string,
      details: PeaceDemandDetails,
      justification: string
    ) => {
      setPhase4State(prev => {
        const conference = prev.peaceConferences.find(c => c.id === conferenceId);
        if (!conference) return prev;

        const result = createPeaceDemand(
          conference,
          demandingNation,
          demandType,
          target,
          details,
          justification
        );

        if (!result.demand) return prev; // Failed to create demand

        return {
          ...prev,
          peaceConferences: prev.peaceConferences.map(c =>
            c.id === conferenceId ? result.conference : c
          ),
        };
      });
    },
    []
  );

  /**
   * Support or oppose demand
   */
  const voteOnPeaceDemand = useCallback(
    (conferenceId: string, demandId: string, nationId: string, support: boolean) => {
      setPhase4State(prev => ({
        ...prev,
        peaceConferences: prev.peaceConferences.map(conf => {
          if (conf.id !== conferenceId) return conf;
          return support ? supportDemand(conf, demandId, nationId) : opposeDemand(conf, demandId, nationId);
        }),
      }));
    },
    []
  );

  /**
   * Advance conference round
   */
  const advanceRound = useCallback((conferenceId: string) => {
    setPhase4State(prev => ({
      ...prev,
      peaceConferences: prev.peaceConferences.map(conf =>
        conf.id === conferenceId ? advanceConferenceRound(conf) : conf
      ),
    }));
  }, []);

  /**
   * Conclude conference with treaty
   */
  const concludeConference = useCallback((conferenceId: string, currentTurn: number) => {
    setPhase4State(prev => {
      const conference = prev.peaceConferences.find(c => c.id === conferenceId);
      if (!conference) return prev;

      const treaty = createPeaceTreatyFromDemands(conference, currentTurn);
      if (!treaty) return prev; // No treaty possible

      const concluded = concludeConferenceWithTreaty(conference, treaty);

      return {
        ...prev,
        peaceConferences: prev.peaceConferences.map(c => (c.id === conferenceId ? concluded : c)),
        treaties: [...prev.treaties, treaty],
      };
    });
  }, []);

  /**
   * Get conference by ID
   */
  const getConference = useCallback(
    (conferenceId: string): EnhancedPeaceConference | null => {
      return phase4State.peaceConferences.find(c => c.id === conferenceId) || null;
    },
    [phase4State.peaceConferences]
  );

  // ============================================================================
  // GENERAL
  // ============================================================================

  /**
   * Get full Phase 4 state
   */
  const getPhase4State = useCallback(() => phase4State, [phase4State]);

  /**
   * Update Phase 4 state (for loading saved games)
   */
  const setPhase4StateDirectly = useCallback((newState: HeartsOfIronPhase4State) => {
    setPhase4State(newState);
  }, []);

  return {
    // State
    phase4State,
    getPhase4State,
    setPhase4StateDirectly,

    // Intelligence Agencies
    initializeAgency,
    getAgency,
    upgradeAgency,
    purchaseUpgrade,
    launchOperation,
    progressOperations,

    // Occupation System
    occupyTerritory,
    updateOccupations,
    setOccupationPolicy,
    assignGarrison,
    resolveUprisingEvent,
    getOccupation,

    // Peace Conferences
    createPeaceConference,
    addParticipant,
    makePeaceDemand,
    voteOnPeaceDemand,
    advanceRound,
    concludeConference,
    getConference,
  };
}
