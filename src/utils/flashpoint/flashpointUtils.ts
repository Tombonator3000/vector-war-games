/**
 * Flashpoint utility functions
 *
 * Pure helper functions extracted from useFlashpoints hook to improve
 * modularity, testability, and maintainability.
 */

import type {
  FlashpointEvent,
  FlashpointOption,
  FlashpointHistoryEntry,
  PlayerReputation,
} from '@/hooks/useFlashpoints';

/**
 * Helper function to get flashpoint category key from title
 * Provides reliable mapping for follow-up lookups
 */
export function getFlashpointCategoryKeyFromTitle(title: string): string | null {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('nuclear materials')) return 'nuclear_materials';
  if (titleLower.includes('coup')) return 'military_coup';
  if (titleLower.includes('rogue ai')) return 'rogue_ai';
  if (titleLower.includes('accidental launch')) return 'accidental_launch';
  if (titleLower.includes('extraterrestrial')) return 'alien_contact';
  if (titleLower.includes('bio-terror') || titleLower.includes('bioterror')) return 'bio_terror';

  return null;
}

/**
 * Determines the category key for a flashpoint, used for follow-up lookups.
 * This replaces the complex ternary chain with a cleaner fallback mechanism.
 *
 * @param flashpoint - The flashpoint event to categorize
 * @returns Category key string or null if no match found
 */
export function determineCategoryKey(flashpoint: FlashpointEvent): string | null {
  // Priority 1: Use explicit follow-up ID if provided
  if (flashpoint.followUpId) {
    return flashpoint.followUpId;
  }

  // Priority 2: Use the helper function for reliable title-based mapping
  const categoryKey = getFlashpointCategoryKeyFromTitle(flashpoint.title);
  if (categoryKey) {
    return categoryKey;
  }

  // Priority 3: Fallback to explicit title matching for edge cases
  const title = flashpoint.title;
  if (title.includes('Nuclear Materials')) return 'nuclear_materials';
  if (title.includes('COUP')) return 'military_coup';
  if (title.includes('ROGUE AI')) return 'rogue_ai';
  if (title.includes('ACCIDENTAL LAUNCH')) return 'accidental_launch';
  if (title.includes('EXTRATERRESTRIAL')) return 'alien_contact';
  if (title.includes('BIO-TERROR')) return 'bio_terror';

  return null;
}

/**
 * Calculates reputation updates based on the player's choice.
 * Returns an update object that can be merged with the previous reputation.
 *
 * @param option - The flashpoint option chosen by the player
 * @param success - Whether the chosen option was successful
 * @param flashpointHistory - Complete history of previous flashpoint resolutions
 * @param currentReputation - Current player reputation scores
 * @returns Updated reputation object
 */
export function calculateReputationUpdates(
  option: FlashpointOption,
  success: boolean,
  flashpointHistory: FlashpointHistoryEntry[],
  currentReputation: PlayerReputation
): PlayerReputation {
  const totalChoices = flashpointHistory.length + 1;
  const successCount = flashpointHistory.filter(h => h.result === 'success').length + (success ? 1 : 0);

  const reputationUpdate = { ...currentReputation };

  // Update aggressive score (military options)
  if (option.advisorSupport.includes('military')) {
    reputationUpdate.aggressive = Math.min(100, currentReputation.aggressive + 2);
  }

  // Update diplomatic score
  if (option.advisorSupport.includes('diplomatic')) {
    reputationUpdate.diplomatic = Math.min(100, currentReputation.diplomatic + 2);
  }

  // Update cautious score (high probability options)
  if (option.outcome.probability >= 0.7) {
    reputationUpdate.cautious = Math.min(100, currentReputation.cautious + 2);
  }

  // Update reckless score (low probability options)
  if (option.outcome.probability <= 0.4) {
    reputationUpdate.reckless = Math.min(100, currentReputation.reckless + 2);
  }

  // Update overall success rate
  reputationUpdate.successRate = Math.round((successCount / totalChoices) * 100);

  return reputationUpdate;
}

/**
 * Calculates DNA points awarded for flashpoint resolution.
 * Awards based on bio-warfare events and intel gained.
 *
 * @param flashpoint - The flashpoint event that was resolved
 * @param success - Whether resolution was successful
 * @param outcome - The outcome object containing rewards/penalties
 * @returns Number of DNA points awarded
 */
export function calculateDnaAward(
  flashpoint: FlashpointEvent,
  success: boolean,
  outcome: Record<string, any>
): number {
  let dnaAwarded = 0;

  // Bio-terror events award DNA points
  if (flashpoint.category === 'blackswan' && flashpoint.title.includes('BIO-TERROR')) {
    dnaAwarded = success ? 3 : 1; // More DNA for successful handling
  }
  // Intel-based DNA awards
  else if (success && outcome.intel && outcome.intel > 0) {
    dnaAwarded = Math.floor(outcome.intel / 10); // 1 DNA per 10 intel gained
  }

  return dnaAwarded;
}

/**
 * Interface for the follow-up scheduling dependencies.
 * Separated to make the function more testable.
 */
export interface FollowUpCheckResult {
  shouldSchedule: boolean;
  hint?: string;
  followUpData?: {
    parentId: string;
    category: string;
    outcome: string;
    triggerAtTurn: number;
  };
}

/**
 * Checks if a follow-up flashpoint should be scheduled for the given outcome.
 * This is a pure function that determines scheduling logic without side effects.
 *
 * @param flashpoint - The parent flashpoint event
 * @param optionId - The option chosen by the player
 * @param success - Whether the resolution was successful
 * @param categoryKey - The category key for follow-up lookup
 * @param currentTurn - Current game turn
 * @param triggerDelay - Number of turns to wait before triggering
 * @param followUpTemplates - Available follow-up templates
 * @returns Object indicating whether to schedule and what data to use
 */
export function checkFollowUpScheduling(
  flashpoint: FlashpointEvent,
  optionId: string,
  success: boolean,
  categoryKey: string | null,
  currentTurn: number,
  triggerDelay: number,
  followUpTemplates: Record<string, Record<string, any>>
): FollowUpCheckResult {
  if (!categoryKey) {
    return { shouldSchedule: false };
  }

  const followUpKey = `${optionId}_${success ? 'success' : 'failure'}`;

  // Check if a follow-up template exists for this outcome
  if (followUpTemplates[categoryKey]?.[followUpKey]) {
    const followUpData = {
      parentId: flashpoint.id,
      category: categoryKey,
      outcome: followUpKey,
      triggerAtTurn: currentTurn + triggerDelay
    };

    // Debug logging for follow-up scheduling
    console.log(`Follow-up scheduled: ${categoryKey}/${followUpKey} for turn ${currentTurn + triggerDelay}`);

    return {
      shouldSchedule: true,
      hint: 'Intelligence suggests this situation may have further developments. Remain vigilant.',
      followUpData
    };
  } else {
    // Category key found but no matching follow-up template
    console.log(`No follow-up template found for ${categoryKey}/${followUpKey}`);
    return { shouldSchedule: false };
  }
}
