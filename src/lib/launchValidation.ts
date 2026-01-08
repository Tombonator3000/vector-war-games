/**
 * Launch Validation Module
 *
 * Extracted from gamePhaseHandlers.ts to improve testability and maintainability.
 * Contains all validation logic for missile launches.
 */

import type { Nation, GameState } from '@/types/game';

export interface LaunchValidationContext {
  from: Nation;
  to: Nation;
  yieldMT: number;
  defcon: number;
  warheadYieldToId: Map<number, string>;
  researchLookup: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
  errorType?: 'warning' | 'error';
  requiresToast?: boolean;
  toastConfig?: {
    title: string;
    description: string;
  };
}

const SUCCESS: ValidationResult = { valid: true };

/**
 * Validates that no truce is active between nations
 */
export function validateTreaty(from: Nation, to: Nation): ValidationResult {
  if (from.treaties?.[to.id]?.truceTurns > 0) {
    return {
      valid: false,
      errorMessage: `Cannot attack ${to.name} - truce active!`,
      errorType: 'warning',
    };
  }
  return SUCCESS;
}

/**
 * Validates that no alliance exists between nations
 */
export function validateAlliance(from: Nation, to: Nation): ValidationResult {
  const allianceActive = Boolean(
    from.treaties?.[to.id]?.alliance ||
    to.treaties?.[from.id]?.alliance ||
    from.alliances?.includes(to.id) ||
    to.alliances?.includes(from.id)
  );

  if (allianceActive) {
    return {
      valid: false,
      errorMessage: `Cannot attack ${to.name} - alliance active!`,
      errorType: 'warning',
      requiresToast: from.isPlayer,
      toastConfig: {
        title: 'Alliance prevents strike',
        description: `Cannot attack ${to.name} - alliance active!`,
      },
    };
  }
  return SUCCESS;
}

/**
 * Validates DEFCON level requirements for weapon yield
 */
export function validateDefcon(yieldMT: number, defcon: number): ValidationResult {
  // Strategic weapons (>50MT) require DEFCON 1
  if (yieldMT > 50 && defcon > 1) {
    return {
      valid: false,
      errorMessage: 'Strategic weapons require DEFCON 1',
      errorType: 'warning',
    };
  }

  // Tactical nukes (<=50MT) require DEFCON 2 or lower
  if (yieldMT <= 50 && defcon > 2) {
    return {
      valid: false,
      errorMessage: 'Tactical nukes require DEFCON 2 or lower',
      errorType: 'warning',
    };
  }

  return SUCCESS;
}

/**
 * Validates warhead availability
 */
export function validateWarheads(from: Nation, yieldMT: number): ValidationResult {
  if (!from.warheads?.[yieldMT] || from.warheads[yieldMT] <= 0) {
    return {
      valid: false,
      errorMessage: 'No warheads of that yield!',
      errorType: 'warning',
    };
  }
  return SUCCESS;
}

/**
 * Validates required research technology
 */
export function validateResearch(
  from: Nation,
  yieldMT: number,
  warheadYieldToId: Map<number, string>,
  researchLookup: Record<string, any>
): ValidationResult {
  const requiredResearchId = warheadYieldToId.get(yieldMT);

  if (requiredResearchId && !from.researched?.[requiredResearchId]) {
    const projectName = researchLookup[requiredResearchId]?.name || `${yieldMT}MT program`;

    return {
      valid: false,
      errorMessage: from.isPlayer
        ? `Research ${projectName} before deploying this warhead.`
        : `${from.name} lacks the ${projectName} technology and aborts the launch.`,
      errorType: 'warning',
      requiresToast: from.isPlayer,
      toastConfig: {
        title: 'Technology unavailable',
        description: `Research ${projectName} before deploying this warhead.`,
      },
    };
  }

  return SUCCESS;
}

/**
 * Validates missile availability
 */
export function validateMissiles(from: Nation): ValidationResult {
  if (from.missiles <= 0) {
    return {
      valid: false,
      errorMessage: 'No missiles available!',
      errorType: 'warning',
    };
  }
  return SUCCESS;
}

/**
 * Orchestrates all launch validations
 */
export function validateLaunch(context: LaunchValidationContext): ValidationResult {
  const validators = [
    () => validateTreaty(context.from, context.to),
    () => validateAlliance(context.from, context.to),
    () => validateDefcon(context.yieldMT, context.defcon),
    () => validateWarheads(context.from, context.yieldMT),
    () => validateResearch(context.from, context.yieldMT, context.warheadYieldToId, context.researchLookup),
    () => validateMissiles(context.from),
  ];

  // Run validators in sequence, return first failure
  for (const validator of validators) {
    const result = validator();
    if (!result.valid) {
      return result;
    }
  }

  return SUCCESS;
}
