import type { Nation } from '@/types/game';

export const MIRV_SPLIT_BASE_CHANCE = 0.5;
export const STEALTH_INTERCEPT_MODIFIER = 0.5;

export function getMirvSplitChance(
  from?: Nation | null,
  isMirvPayload: boolean = false
): number {
  if (!from?.researched?.mirv || isMirvPayload) {
    return 0;
  }
  return MIRV_SPLIT_BASE_CHANCE;
}

export function getBomberStealthModifier(from?: Nation | null): number {
  return from?.researched?.stealth ? STEALTH_INTERCEPT_MODIFIER : 1;
}

export function calculateBomberInterceptChance(
  targetDefense: number,
  from?: Nation | null
): number {
  const stealthModifier = getBomberStealthModifier(from);
  return (targetDefense / 12) * stealthModifier;
}
