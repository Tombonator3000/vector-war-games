/**
 * Media & Propaganda Warfare System Hook
 *
 * Manages media campaigns, propaganda, censorship, and information warfare.
 * Priority 5 implementation.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  MediaCampaign,
  MediaCampaignType,
  MediaPower,
  MediaEvent,
  MediaEventType,
} from '../types/regionalMorale';

export interface UseMediaWarfareOptions {
  currentTurn: number;
  onCampaignStarted?: (campaign: MediaCampaign) => void;
  onCampaignExposed?: (campaign: MediaCampaign) => void;
  onMediaEvent?: (event: MediaEvent) => void;
}

export function useMediaWarfare(options: UseMediaWarfareOptions) {
  const { currentTurn, onCampaignStarted, onCampaignExposed, onMediaEvent } = options;

  const [campaigns, setCampaigns] = useState<Map<string, MediaCampaign>>(new Map());
  const [mediaPower, setMediaPower] = useState<Map<string, MediaPower>>(new Map());
  const [campaignIdCounter, setCampaignIdCounter] = useState(0);

  /**
   * Initialize media power for a nation
   */
  const initializeMediaPower = useCallback((nationId: string, basePower: number = 50) => {
    setMediaPower((prev) => {
      if (prev.has(nationId)) return prev;

      const updated = new Map(prev);
      updated.set(nationId, {
        nationId,
        power: basePower,
        researchBonus: 0,
        propagandaBonus: 0,
        censorship: false,
        activeCampaigns: [],
        maxConcurrentCampaigns: Math.floor(basePower / 20) + 1,
      });

      return updated;
    });
  }, []);

  /**
   * Get media power for a nation
   */
  const getMediaPower = useCallback(
    (nationId: string): MediaPower | undefined => {
      return mediaPower.get(nationId);
    },
    [mediaPower]
  );

  /**
   * Update media power
   */
  const updateMediaPower = useCallback(
    (
      nationId: string,
      updates: Partial<Pick<MediaPower, 'power' | 'researchBonus' | 'propagandaBonus' | 'censorship'>>
    ) => {
      setMediaPower((prev) => {
        const updated = new Map(prev);
        const current = updated.get(nationId);

        if (current) {
          updated.set(nationId, {
            ...current,
            ...updates,
            maxConcurrentCampaigns: Math.floor((updates.power ?? current.power) / 20) + 1,
          });
        }

        return updated;
      });
    },
    []
  );

  /**
   * Start a media campaign
   */
  const startCampaign = useCallback(
    (
      sourceNationId: string,
      targetNationId: string,
      type: MediaCampaignType,
      intensity: number,
      duration: number,
      targetTerritoryId?: string | null
    ): { success: boolean; reason?: string; campaign?: MediaCampaign } => {
      const sourcePower = mediaPower.get(sourceNationId);

      if (!sourcePower) {
        return { success: false, reason: 'Nation not initialized' };
      }

      // Check if at capacity
      if (sourcePower.activeCampaigns.length >= sourcePower.maxConcurrentCampaigns) {
        return { success: false, reason: 'Maximum concurrent campaigns reached' };
      }

      // Calculate costs and effects
      const intelCost = intensity * 3; // 3-30 intel per turn
      const detectionRisk = Math.max(10, intensity * 7 - (sourcePower.power - 50));

      const campaign: MediaCampaign = {
        id: `campaign_${campaignIdCounter}`,
        sourceNationId,
        targetNationId,
        targetTerritoryId: targetTerritoryId ?? null,
        type,
        intensity,
        turnsActive: 0,
        turnsRemaining: duration,
        effects: calculateCampaignEffects(type, intensity, sourcePower.power),
        exposed: false,
        exposedTurn: null,
      };

      setCampaigns((prev) => {
        const updated = new Map(prev);
        updated.set(campaign.id, campaign);
        return updated;
      });

      setMediaPower((prev) => {
        const updated = new Map(prev);
        const current = updated.get(sourceNationId);
        if (current) {
          updated.set(sourceNationId, {
            ...current,
            activeCampaigns: [...current.activeCampaigns, campaign.id],
          });
        }
        return updated;
      });

      setCampaignIdCounter((prev) => prev + 1);

      if (onCampaignStarted) {
        onCampaignStarted(campaign);
      }

      return { success: true, campaign };
    },
    [mediaPower, campaignIdCounter, onCampaignStarted]
  );

  /**
   * End a campaign
   */
  const endCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) => {
      const updated = new Map(prev);
      const campaign = updated.get(campaignId);

      if (campaign) {
        // Remove from media power tracking
        setMediaPower((prevPower) => {
          const updatedPower = new Map(prevPower);
          const sourcePower = updatedPower.get(campaign.sourceNationId);

          if (sourcePower) {
            updatedPower.set(campaign.sourceNationId, {
              ...sourcePower,
              activeCampaigns: sourcePower.activeCampaigns.filter((id) => id !== campaignId),
            });
          }

          return updatedPower;
        });

        updated.delete(campaignId);
      }

      return updated;
    });
  }, []);

  /**
   * Counter a propaganda campaign
   */
  const counterCampaign = useCallback(
    (
      targetCampaignId: string,
      counteringNationId: string,
      intensity: number,
      duration: number
    ): { success: boolean; reason?: string; counterCampaign?: MediaCampaign } => {
      const targetCampaign = campaigns.get(targetCampaignId);

      if (!targetCampaign) {
        return { success: false, reason: 'Campaign not found' };
      }

      // Start a counter-propaganda campaign
      const result = startCampaign(
        counteringNationId,
        targetCampaign.sourceNationId,
        'counter_propaganda',
        intensity,
        duration,
        null
      );

      if (result.success && result.campaign) {
        // Reduce effectiveness of target campaign
        setCampaigns((prev) => {
          const updated = new Map(prev);
          const target = updated.get(targetCampaignId);

          if (target) {
            const reductionFactor = Math.min(0.8, intensity / 10);
            updated.set(targetCampaignId, {
              ...target,
              effects: {
                ...target.effects,
                publicOpinionDelta: target.effects.publicOpinionDelta * (1 - reductionFactor),
                moraleBoost: target.effects.moraleBoost
                  ? target.effects.moraleBoost * (1 - reductionFactor)
                  : undefined,
                moralePenalty: target.effects.moralePenalty
                  ? target.effects.moralePenalty * (1 - reductionFactor)
                  : undefined,
              },
            });
          }

          return updated;
        });
      }

      return result;
    },
    [campaigns, startCampaign]
  );

  /**
   * Activate censorship for a nation
   */
  const activateCensorship = useCallback(
    (nationId: string, duration: number): { success: boolean } => {
      updateMediaPower(nationId, { censorship: true });

      // Censorship automatically expires
      setTimeout(() => {
        updateMediaPower(nationId, { censorship: false });
      }, duration * 1000); // In a real implementation, this would be turn-based

      return { success: true };
    },
    [updateMediaPower]
  );

  /**
   * Attempt to expose an enemy campaign
   */
  const attemptExposure = useCallback(
    (
      campaignId: string,
      exposingNationId: string
    ): { success: boolean; campaign?: MediaCampaign } => {
      const campaign = campaigns.get(campaignId);

      if (!campaign || campaign.exposed) {
        return { success: false };
      }

      const exposingPower = mediaPower.get(exposingNationId);
      if (!exposingPower) {
        return { success: false };
      }

      // Detection chance based on campaign's detection risk and exposing nation's power
      const detectionChance = campaign.effects.detectionRisk + (exposingPower.power - 50) / 2;
      const detected = Math.random() * 100 < detectionChance;

      if (detected) {
        setCampaigns((prev) => {
          const updated = new Map(prev);
          const target = updated.get(campaignId);

          if (target) {
            updated.set(campaignId, {
              ...target,
              exposed: true,
              exposedTurn: currentTurn,
            });

            if (onCampaignExposed) {
              onCampaignExposed(target);
            }

            // Generate media event
            const event: MediaEvent = {
              type: 'exposed_lies',
              nationId: target.sourceNationId,
              turn: currentTurn,
              severity: 'critical',
              effects: {
                approvalDelta: -15,
                moraleDelta: -10,
                opinionDelta: -20,
              },
            };

            if (onMediaEvent) {
              onMediaEvent(event);
            }
          }

          return updated;
        });

        return { success: true, campaign };
      }

      return { success: false };
    },
    [campaigns, mediaPower, currentTurn, onCampaignExposed, onMediaEvent]
  );

  /**
   * Process turn updates for all campaigns
   */
  const processTurnUpdates = useCallback(() => {
    const expiredCampaigns: string[] = [];
    const eventsToGenerate: MediaEvent[] = [];

    setCampaigns((prev) => {
      const updated = new Map(prev);

      updated.forEach((campaign, id) => {
        // Update duration
        const updatedCampaign = {
          ...campaign,
          turnsActive: campaign.turnsActive + 1,
          turnsRemaining: campaign.turnsRemaining - 1,
        };

        // Check for expiration
        if (updatedCampaign.turnsRemaining <= 0) {
          expiredCampaigns.push(id);
        } else {
          // Check for random detection
          if (!campaign.exposed && Math.random() * 100 < campaign.effects.detectionRisk / 10) {
            updatedCampaign.exposed = true;
            updatedCampaign.exposedTurn = currentTurn;

            eventsToGenerate.push({
              type: 'exposed_lies',
              nationId: campaign.sourceNationId,
              turn: currentTurn,
              severity: 'major',
              effects: {
                approvalDelta: -10,
                moraleDelta: -5,
                opinionDelta: -15,
              },
            });
          }

          // Chance of campaign success event
          if (campaign.turnsActive % 3 === 0 && Math.random() < 0.3) {
            eventsToGenerate.push({
              type: 'propaganda_success',
              nationId: campaign.sourceNationId,
              turn: currentTurn,
              severity: 'minor',
              effects: {
                moraleDelta: campaign.effects.moraleBoost,
              },
            });
          }

          updated.set(id, updatedCampaign);
        }
      });

      return updated;
    });

    // Remove expired campaigns
    expiredCampaigns.forEach((id) => endCampaign(id));

    // Trigger events
    if (onMediaEvent) {
      eventsToGenerate.forEach((event) => onMediaEvent(event));
    }
  }, [currentTurn, endCampaign, onMediaEvent]);

  /**
   * Get active campaigns for a nation
   */
  const getActiveCampaigns = useCallback(
    (nationId: string, asSource: boolean = true): MediaCampaign[] => {
      const result: MediaCampaign[] = [];

      campaigns.forEach((campaign) => {
        if (asSource && campaign.sourceNationId === nationId) {
          result.push(campaign);
        } else if (!asSource && campaign.targetNationId === nationId) {
          result.push(campaign);
        }
      });

      return result;
    },
    [campaigns]
  );

  /**
   * Get total intel cost for a nation's active campaigns
   */
  const getTotalIntelCost = useCallback(
    (nationId: string): number => {
      const nationCampaigns = getActiveCampaigns(nationId, true);
      return nationCampaigns.reduce((sum, c) => sum + c.intensity * 3, 0);
    },
    [getActiveCampaigns]
  );

  /**
   * Get net morale effect from campaigns targeting a nation
   */
  const getNetMoraleEffect = useCallback(
    (nationId: string): number => {
      const targetingCampaigns = getActiveCampaigns(nationId, false);

      return targetingCampaigns.reduce((sum, campaign) => {
        if (campaign.exposed) return sum; // Exposed campaigns have no effect

        const penalty = campaign.effects.moralePenalty || 0;
        return sum - penalty;
      }, 0);
    },
    [getActiveCampaigns]
  );

  /**
   * Get net public opinion effect from campaigns
   */
  const getNetOpinionEffect = useCallback(
    (nationId: string): number => {
      const targetingCampaigns = getActiveCampaigns(nationId, false);

      return targetingCampaigns.reduce((sum, campaign) => {
        if (campaign.exposed) return sum;
        return sum + campaign.effects.publicOpinionDelta;
      }, 0);
    },
    [getActiveCampaigns]
  );

  return {
    // State
    campaigns: Array.from(campaigns.values()),
    mediaPower: Array.from(mediaPower.values()),

    // Initialization
    initializeMediaPower,

    // Media power management
    getMediaPower,
    updateMediaPower,

    // Campaign management
    startCampaign,
    endCampaign,
    counterCampaign,
    getActiveCampaigns,

    // Censorship
    activateCensorship,

    // Detection and exposure
    attemptExposure,

    // Effects
    getTotalIntelCost,
    getNetMoraleEffect,
    getNetOpinionEffect,

    // Turn processing
    processTurnUpdates,
  };
}

/**
 * Calculate effects for a media campaign
 */
function calculateCampaignEffects(
  type: MediaCampaignType,
  intensity: number,
  mediaPower: number
): MediaCampaign['effects'] {
  const powerMultiplier = 1 + (mediaPower - 50) / 100;

  switch (type) {
    case 'propaganda':
      return {
        publicOpinionDelta: Math.round(-intensity * 0.5 * powerMultiplier),
        moraleBoost: Math.round(intensity * 0.3 * powerMultiplier),
        moralePenalty: Math.round(intensity * 0.2 * powerMultiplier),
        detectionRisk: Math.max(10, intensity * 6),
      };

    case 'counter_propaganda':
      return {
        publicOpinionDelta: Math.round(intensity * 0.3 * powerMultiplier),
        detectionRisk: Math.max(5, intensity * 4),
      };

    case 'censorship':
      return {
        publicOpinionDelta: Math.round(-intensity * 0.4 * powerMultiplier),
        moralePenalty: Math.round(intensity * 0.1 * powerMultiplier),
        detectionRisk: Math.max(15, intensity * 8),
      };

    case 'disinformation':
      return {
        publicOpinionDelta: Math.round(-intensity * 0.6 * powerMultiplier),
        moralePenalty: Math.round(intensity * 0.4 * powerMultiplier),
        detectionRisk: Math.max(20, intensity * 9),
      };

    case 'truth_campaign':
      return {
        publicOpinionDelta: Math.round(intensity * 0.8 * powerMultiplier),
        moraleBoost: Math.round(intensity * 0.5 * powerMultiplier),
        detectionRisk: Math.max(30, intensity * 10),
      };

    default:
      return {
        publicOpinionDelta: 0,
        detectionRisk: 50,
      };
  }
}
