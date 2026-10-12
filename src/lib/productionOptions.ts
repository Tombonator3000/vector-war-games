import type { Nation } from '@/types/game';
import type { ProductionHandlers, ProductionOption } from '@/types/production';
import { COSTS, RESEARCH_LOOKUP, WARHEAD_YIELD_TO_ID } from '@/lib/gameConstants';
import { getCityCost, getCityBuildTime, getCityMaintenanceCosts } from '@/lib/gameUtils';
import { MAX_DEFENSE_LEVEL } from '@/lib/nuclearDamage';

export function getDeliveryOptions(player: Nation, handlers: ProductionHandlers): ProductionOption[] {
  const defenseGain = Math.max(0, Math.min(2, MAX_DEFENSE_LEVEL - (player.defense ?? 0)));
  return [
    { key: 'missile', label: 'Build missile', description: 'Add one ICBM to your strategic arsenal.', cost: COSTS.missile, onClick: handlers.buildMissile, statusLine: `${player.missiles ?? 0} missiles ready` },
    { key: 'bomber', label: 'Build bomber', description: 'Commission one strategic bomber wing.', cost: COSTS.bomber, onClick: handlers.buildBomber, statusLine: `${player.bombers ?? 0} bomber wings ready` },
    {
      key: 'defense', label: `Upgrade defense (+${defenseGain})`, description: 'Reinforce your ABM network.',
      cost: COSTS.defense, onClick: handlers.buildDefense, statusLine: `Defense ${player.defense ?? 0}/${MAX_DEFENSE_LEVEL}`,
      requirement: defenseGain === 0 ? 'Defense grid is at maximum capacity.' :
        !player.researched?.defense_grid ? `Complete ${RESEARCH_LOOKUP.defense_grid?.name ?? 'Orbital Defense Grid'} to unlock.` : null,
    },
  ];
}

export function getCityOption(player: Nation, handlers: ProductionHandlers): ProductionOption {
  const cityNumber = (player.cities ?? 1) + 1;
  const maintenance = Object.entries(getCityMaintenanceCosts(player))
    .map(([resource, amount]) => `${amount} ${resource.replaceAll('_', ' ')}`).join(' · ');
  return {
    key: 'city', label: `Build city #${cityNumber}`,
    description: `Expand your urban network. Construction takes ${getCityBuildTime(player)} turns.`,
    cost: getCityCost(player), onClick: handlers.buildCity,
    statusLine: `${player.cities ?? 1} cities · Current maintenance: ${maintenance}/turn`,
    requirement: player.cityConstructionQueue ? `City construction already running: ${player.cityConstructionQueue.turnsRemaining} turns left.` : null,
  };
}

export function getWarheadOptions(player: Nation, handlers: ProductionHandlers): ProductionOption[] {
  return [10, 20, 40, 50, 100, 200].map(yieldMT => {
    const researchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
    return {
      key: `warhead-${yieldMT}`, label: `Assemble ${yieldMT}MT warhead`,
      description: `Add one ${yieldMT}MT device to your stockpile.`,
      cost: COSTS[`warhead_${yieldMT}` as keyof typeof COSTS],
      onClick: () => handlers.buildWarhead(yieldMT),
      statusLine: `${player.warheads?.[yieldMT] ?? 0} in stock`,
      requirement: researchId && !player.researched?.[researchId] ?
        `Research ${RESEARCH_LOOKUP[researchId]?.name ?? `${yieldMT}MT program`} to unlock.` : null,
    };
  });
}
