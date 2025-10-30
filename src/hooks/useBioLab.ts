import { useState, useCallback, useMemo } from 'react';
import type { BioLabFacility, BioLabTier, BioLabConstructionOption } from '@/types/bioLab';
import {
  BIO_LAB_TIERS,
  getBioLabTierDefinition,
  getNextTierDefinition,
  canAffordLabTier,
  hasPrerequisitesForTier,
} from '@/types/bioLab';
import type { NewsItem } from '@/components/NewsTicker';

type AddNewsItem = (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;

const INITIAL_LAB: BioLabFacility = {
  tier: 0,
  active: false,
  underConstruction: false,
  constructionProgress: 0,
  constructionTarget: 0,
  targetTier: 0,
  productionInvested: 0,
  uraniumInvested: 0,
  suspicionLevel: 0,
  knownByNations: [],
  lastIntelAttempt: 0,
  researchSpeed: 1.0,
  sabotaged: false,
  sabotageTurnsRemaining: 0,
};

export function useBioLab(addNewsItem: AddNewsItem) {
  const [labFacility, setLabFacility] = useState<BioLabFacility>(INITIAL_LAB);

  /**
   * Start construction of a new tier
   */
  const startConstruction = useCallback(
    (
      tier: BioLabTier,
      production: number,
      uranium: number
    ): { success: boolean; message: string } => {
      const def = getBioLabTierDefinition(tier);

      // Check if already at or above this tier
      if (labFacility.tier >= tier) {
        return {
          success: false,
          message: `Already have ${BIO_LAB_TIERS[labFacility.tier].name}`,
        };
      }

      // Check if already constructing
      if (labFacility.underConstruction) {
        return {
          success: false,
          message: 'Construction already in progress',
        };
      }

      // Check prerequisites
      if (!hasPrerequisitesForTier(tier, labFacility.tier)) {
        return {
          success: false,
          message: `Must complete ${def.requiresTier !== null ? BIO_LAB_TIERS[def.requiresTier].name : 'prerequisites'} first`,
        };
      }

      // Check costs
      if (!canAffordLabTier(tier, production, uranium)) {
        return {
          success: false,
          message: `Insufficient resources (need ${def.productionCost} production, ${def.uraniumCost} uranium)`,
        };
      }

      // Start construction
      setLabFacility((prev) => ({
        ...prev,
        underConstruction: true,
        constructionProgress: 0,
        constructionTarget: def.constructionTurns,
        targetTier: tier,
        productionInvested: def.productionCost,
        uraniumInvested: def.uraniumCost,
      }));

      addNewsItem(
        'science',
        `${def.name} construction initiated - ${def.constructionTurns} turns to completion`,
        'important'
      );

      return {
        success: true,
        message: `${def.name} construction started`,
      };
    },
    [labFacility, addNewsItem]
  );

  /**
   * Cancel ongoing construction (lose resources)
   */
  const cancelConstruction = useCallback(() => {
    if (!labFacility.underConstruction) {
      return { success: false, message: 'No construction in progress' };
    }

    const refundPercent = 0.5; // 50% refund
    const productionRefund = Math.floor(labFacility.productionInvested * refundPercent);
    const uraniumRefund = Math.floor(labFacility.uraniumInvested * refundPercent);

    setLabFacility((prev) => ({
      ...prev,
      underConstruction: false,
      constructionProgress: 0,
      constructionTarget: 0,
      targetTier: prev.tier,
      productionInvested: 0,
      uraniumInvested: 0,
    }));

    addNewsItem(
      'science',
      `Bio lab construction cancelled - refunded ${productionRefund} production, ${uraniumRefund} uranium`,
      'routine'
    );

    return {
      success: true,
      message: 'Construction cancelled',
      refunds: { production: productionRefund, uranium: uraniumRefund },
    };
  }, [labFacility, addNewsItem]);

  /**
   * Advance construction by one turn
   */
  const advanceConstruction = useCallback((): {
    completed: boolean;
    newTier?: BioLabTier;
  } => {
    if (!labFacility.underConstruction) {
      return { completed: false };
    }

    setLabFacility((prev) => {
      const newProgress = prev.constructionProgress + 1;

      if (newProgress >= prev.constructionTarget) {
        // Construction complete!
        const newTier = prev.targetTier;
        const def = getBioLabTierDefinition(newTier);

        addNewsItem(
          'science',
          `${def.name} construction COMPLETE - New capabilities unlocked`,
          'critical'
        );

        // Show unlocks
        def.unlocks.forEach((unlock) => {
          addNewsItem('science', `Unlocked: ${unlock}`, 'important');
        });

        return {
          ...prev,
          tier: newTier,
          active: true,
          underConstruction: false,
          constructionProgress: 0,
          constructionTarget: 0,
          targetTier: newTier,
          researchSpeed: def.researchSpeedBonus,
        };
      }

      return {
        ...prev,
        constructionProgress: newProgress,
      };
    });

    const stillBuilding = labFacility.constructionProgress + 1 < labFacility.constructionTarget;
    const completed = !stillBuilding;

    return {
      completed,
      newTier: completed ? labFacility.targetTier : undefined,
    };
  }, [labFacility, addNewsItem]);

  /**
   * Enemy intel discovers lab
   */
  const detectLab = useCallback((nationId: string) => {
    setLabFacility((prev) => {
      if (prev.knownByNations.includes(nationId)) {
        return prev;
      }

      const tierDef = getBioLabTierDefinition(prev.tier);
      addNewsItem(
        'intel',
        `INTEL BREACH: ${nationId} has discovered our ${tierDef.name}`,
        'urgent'
      );

      return {
        ...prev,
        knownByNations: [...prev.knownByNations, nationId],
        suspicionLevel: Math.min(100, prev.suspicionLevel + 30),
      };
    });
  }, [addNewsItem]);

  /**
   * Sabotage lab (delays construction or disables for N turns)
   */
  const sabotage = useCallback((turns: number = 3) => {
    setLabFacility((prev) => {
      const tierDef = getBioLabTierDefinition(prev.tier);

      addNewsItem(
        'crisis',
        `SABOTAGE: ${tierDef.name} compromised - operations disrupted for ${turns} turns`,
        'critical'
      );

      return {
        ...prev,
        sabotaged: true,
        sabotageTurnsRemaining: turns,
        constructionProgress: Math.max(0, prev.constructionProgress - 2), // Lose progress
      };
    });
  }, [addNewsItem]);

  /**
   * Advance sabotage timer
   */
  const advanceSabotage = useCallback(() => {
    setLabFacility((prev) => {
      if (!prev.sabotaged || prev.sabotageTurnsRemaining <= 0) {
        return prev;
      }

      const newRemaining = prev.sabotageTurnsRemaining - 1;

      if (newRemaining === 0) {
        addNewsItem('science', 'Bio lab operations restored after sabotage', 'important');
      }

      return {
        ...prev,
        sabotageTurnsRemaining: newRemaining,
        sabotaged: newRemaining > 0,
      };
    });
  }, [addNewsItem]);

  /**
   * Get available construction options
   */
  const getConstructionOptions = useCallback(
    (production: number, uranium: number): BioLabConstructionOption[] => {
      const options: BioLabConstructionOption[] = [];

      for (let tier = 1; tier <= 4; tier++) {
        const t = tier as BioLabTier;
        const def = getBioLabTierDefinition(t);
        const hasPrereqs = hasPrerequisitesForTier(t, labFacility.tier);
        const canAfford = canAffordLabTier(t, production, uranium);

        let available = true;
        let reason: string | undefined;

        if (labFacility.tier >= t) {
          available = false;
          reason = 'Already constructed';
        } else if (!hasPrereqs) {
          available = false;
          reason = `Requires ${def.requiresTier !== null ? BIO_LAB_TIERS[def.requiresTier].name : 'prerequisites'}`;
        } else if (!canAfford) {
          available = false;
          reason = 'Insufficient resources';
        } else if (labFacility.underConstruction) {
          available = false;
          reason = 'Construction already in progress';
        }

        options.push({
          tier: t,
          definition: def,
          available,
          reason,
          canAfford,
          hasPrerequisites: hasPrereqs,
        });
      }

      return options;
    },
    [labFacility]
  );

  /**
   * Check if plague type is unlocked by lab tier
   */
  const isPlagueTypeUnlocked = useCallback(
    (plagueTypeId: string): boolean => {
      if (labFacility.tier < 3) {
        return false; // Need at least BioForge
      }

      // Basic plagues unlocked at tier 3
      const basicPlagues = ['bacteria', 'virus', 'fungus'];
      if (basicPlagues.includes(plagueTypeId)) {
        return labFacility.tier >= 3;
      }

      // Advanced plagues need tier 4
      const advancedPlagues = ['parasite', 'prion', 'nano-virus', 'bio-weapon'];
      if (advancedPlagues.includes(plagueTypeId)) {
        return labFacility.tier >= 4;
      }

      return false;
    },
    [labFacility.tier]
  );

  /**
   * Get evolution cost multiplier based on lab tier
   */
  const getEvolutionCostMultiplier = useCallback(() => {
    const def = getBioLabTierDefinition(labFacility.tier);
    return 1.0 - def.evolutionCostReduction / 100;
  }, [labFacility.tier]);

  return {
    labFacility,
    startConstruction,
    cancelConstruction,
    advanceConstruction,
    detectLab,
    sabotage,
    advanceSabotage,
    getConstructionOptions,
    isPlagueTypeUnlocked,
    getEvolutionCostMultiplier,
  };
}
