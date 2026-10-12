import type { Nation } from '@/types/game';
import type { StrategyResourceType } from '@/types/territorialResources';

export function formatResourceCost(cost: Readonly<Record<string, number>>): string {
  return Object.entries(cost)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([resource, amount]) => `${amount} ${resource.replaceAll('_', ' ')}`)
    .join(' · ') || 'No resource cost';
}

export function getResourceAmount(nation: Nation, resource: string): number {
  if (resource === 'production' || resource === 'intel') return nation[resource] ?? 0;
  if (['oil', 'uranium', 'rare_earths', 'food'].includes(resource)) {
    return nation.resourceStockpile?.[resource as StrategyResourceType] ?? (resource === 'uranium' ? nation.uranium ?? 0 : 0);
  }
  return 0;
}

export function getResourceShortfall(nation: Nation, cost: Readonly<Record<string, number>>): string | null {
  const deficits = Object.keys(cost)
    .map(resource => ({ resource, amount: Math.max(0, (cost[resource] ?? 0) - getResourceAmount(nation, resource)) }))
    .filter(({ amount }) => amount > 0);
  return deficits.length ? `Need ${deficits.map(({ resource, amount }) => `${amount} more ${resource.replaceAll('_', ' ')}`).join(' and ')}` : null;
}

export function getQueueProgress(queue: { turnsRemaining: number; totalTurns: number }): number {
  if (queue.totalTurns <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, 1 - queue.turnsRemaining / queue.totalTurns)) * 100);
}

/** Keep map hotkeys out of text fields, menus and modal decisions. */
export function shouldIgnoreGameShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey) return true;
  const target = event.target;
  if (target instanceof Element && target.closest('input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="menu"], [role="dialog"], [role="alertdialog"]')) return true;
  return !!document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [data-command-overlay="true"]');
}
