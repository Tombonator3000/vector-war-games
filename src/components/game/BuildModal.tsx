import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { canAfford, getCityCost, getCityBuildTime, getCityMaintenanceCosts } from '@/lib/gameUtils';
import { PlayerManager, GameStateManager } from '@/state';
import { COSTS, RESEARCH_LOOKUP, WARHEAD_YIELD_TO_ID, type ResourceCost } from '@/lib/gameConstants';

export interface BuildModalProps {
  isGameStarted: boolean;
  buildMissile: () => void;
  buildBomber: () => void;
  buildDefense: () => void;
  buildCity: () => void;
  buildWarhead: (yieldMT: number) => void;
}

/**
 * BuildModal - Strategic production and construction interface
 *
 * Displays available build options organized by category:
 * - Delivery & Defense: Missiles, bombers, defense systems
 * - Infrastructure: City construction
 * - Warhead Production: Various yield warheads (10-200MT)
 */
export function BuildModal({
  isGameStarted,
  buildMissile,
  buildBomber,
  buildDefense,
  buildCity,
  buildWarhead,
}: BuildModalProps): ReactNode {
  const player = PlayerManager.get();
  const S = GameStateManager.getState();

  if (!player) {
    return <div className="text-sm text-cyan-200">No nation data available.</div>;
  }

  const actionAvailable =
    isGameStarted && !S.gameOver && S.phase === 'PLAYER' && S.actionsRemaining > 0;

  let actionMessage: { tone: 'info' | 'warning'; text: string } | null = null;
  if (!isGameStarted) {
    actionMessage = {
      tone: 'warning',
      text: 'Begin the simulation to issue strategic production orders.',
    };
  } else if (S.gameOver) {
    actionMessage = {
      tone: 'warning',
      text: 'The conflict has concluded. Production lines stand down.',
    };
  } else if (S.phase !== 'PLAYER') {
    actionMessage = {
      tone: 'warning',
      text: 'Await the player phase before issuing new build directives.',
    };
  } else if (S.actionsRemaining <= 0) {
    actionMessage = {
      tone: 'warning',
      text: 'Command capacity exhausted. End the turn or adjust DEFCON to regain actions.',
    };
  }

  const formatCost = (cost: ResourceCost) => {
    const parts = Object.entries(cost)
      .filter(([, amount]) => (amount || 0) > 0)
      .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`);
    return parts.length > 0 ? parts.join(' • ') : 'No cost';
  };

  type PlayerResourceKey = 'production' | 'intel' | 'uranium';

  const resourceGapText = (cost: ResourceCost) => {
    const missing = Object.entries(cost)
      .map(([resource, amount]) => {
        const required = amount || 0;
        const key = resource as PlayerResourceKey;
        const current = player[key] ?? 0;
        const deficit = required - current;
        if (deficit <= 0) return null;
        return `${deficit} ${resource.toUpperCase()}`;
      })
      .filter(Boolean) as string[];
    return missing.length ? `Requires ${missing.join(' & ')}` : null;
  };

  const cityCost = getCityCost(player);
  const nextCityNumber = (player.cities || 1) + 1;
  const cityBuildTime = getCityBuildTime(player);
  const cityMaintenanceCosts = getCityMaintenanceCosts(player);

  const defenseResearchId = 'defense_grid';
  const defenseResearchName = RESEARCH_LOOKUP[defenseResearchId]?.name ?? 'Orbital Defense Grid';
  const hasDefenseGridResearch = !!player.researched?.[defenseResearchId];

  type BuildOption = {
    key: string;
    label: string;
    description: string;
    cost: ResourceCost;
    onClick: () => void;
    statusLine?: string;
    requirementMessage?: string | null;
  };

  const deliveryOptions: BuildOption[] = [
    {
      key: 'missile',
      label: 'Build Missile',
      description: 'Add an ICBM to your strategic arsenal.',
      cost: COSTS.missile,
      onClick: buildMissile,
      statusLine: `Ready missiles: ${player.missiles || 0}`,
    },
    {
      key: 'bomber',
      label: 'Build Bomber',
      description: 'Deploy a strategic bomber wing for flexible delivery.',
      cost: COSTS.bomber,
      onClick: buildBomber,
      statusLine: `Available bombers: ${player.bombers || 0}`,
    },
    {
      key: 'defense',
      label: 'Upgrade Defense (+2)',
      description: 'Invest in ABM systems to harden your defenses.',
      cost: COSTS.defense,
      onClick: buildDefense,
      statusLine: `Current defense: ${player.defense || 0}`,
      requirementMessage: hasDefenseGridResearch
        ? null
        : `Complete ${defenseResearchName} research to unlock.`,
    },
  ];

  // Format maintenance costs for display
  const maintenanceText = Object.entries(cityMaintenanceCosts)
    .map(([resource, amount]) => `${amount} ${resource.toUpperCase().replace('_', ' ')}`)
    .join(' • ');

  const infrastructureOptions: BuildOption[] = [
    {
      key: 'city',
      label: player.cityConstructionQueue
        ? `City #${nextCityNumber} Under Construction`
        : `Build City #${nextCityNumber}`,
      description: player.cityConstructionQueue
        ? `Construction progress: ${player.cityConstructionQueue.turnsRemaining} turns remaining`
        : `Construction time: ${cityBuildTime} turns. Maintenance: ${maintenanceText}/turn`,
      cost: cityCost,
      onClick: buildCity,
      statusLine: `Existing cities: ${player.cities || 1} • Total maintenance: ${maintenanceText}/turn`,
    },
  ];

  const warheadYields = [10, 20, 40, 50, 100, 200];
  const warheadOptions: BuildOption[] = warheadYields
    .map(yieldMT => {
      const costKey = `warhead_${yieldMT}` as keyof typeof COSTS;
      const cost = COSTS[costKey];
      if (!cost) return null;

      const researchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
      const hasResearch = !researchId || !!player.researched?.[researchId];
      const requirementMessage = hasResearch
        ? null
        : `Research ${RESEARCH_LOOKUP[researchId!]?.name ?? `${yieldMT}MT program`} to unlock.`;

      return {
        key: `warhead-${yieldMT}`,
        label: `Assemble ${yieldMT}MT Warhead`,
        description: `Increase your nuclear stockpile with a ${yieldMT}MT device.`,
        cost,
        onClick: () => buildWarhead(yieldMT),
        statusLine: `Stock: ${player.warheads?.[yieldMT] || 0}`,
        requirementMessage,
      } satisfies BuildOption;
    })
    .filter(Boolean) as BuildOption[];

  const renderOption = (option: BuildOption) => {
    const affordable = canAfford(player, option.cost);
    const requirement = option.requirementMessage || null;
    const disabled = !actionAvailable || !affordable || !!requirement;

    const reasons: string[] = [];
    if (!actionAvailable && actionMessage) {
      reasons.push(actionMessage.text);
    }
    if (requirement) {
      reasons.push(requirement);
    }
    if (!affordable) {
      const gap = resourceGapText(option.cost);
      if (gap) {
        reasons.push(gap);
      }
    }

    const disabledReason = reasons.join(' • ');

    return (
      <button
        key={option.key}
        onClick={option.onClick}
        disabled={disabled}
        className={`w-full text-left p-4 rounded-lg border transition-all ${
          disabled
            ? 'bg-slate-900/30 border-gray-700/30 opacity-50 cursor-not-allowed'
            : 'bg-slate-800/50 border-cyan-500/30 hover:bg-slate-700/50 hover:border-cyan-500/50 cursor-pointer'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-cyan-300 font-mono">{option.label}</h4>
            <p className="text-sm text-gray-400 mt-1">{option.description}</p>
            <div className="text-xs text-cyan-400 mt-2 uppercase tracking-wide">Cost: {formatCost(option.cost)}</div>
            {option.statusLine ? (
              <div className="text-xs text-gray-500 mt-1">{option.statusLine}</div>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            {!disabled && (
              <span className="text-sm font-semibold text-cyan-400">Available</span>
            )}
          </div>
        </div>
        {disabledReason ? (
          <div className="mt-3 text-xs text-yellow-400">{disabledReason}</div>
        ) : null}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {actionMessage ? (
        <div
          className={`rounded-lg border p-4 text-sm ${
            actionMessage.tone === 'warning'
              ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery & Defense</h3>
          <div className="space-y-4">
            {deliveryOptions.map(renderOption)}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Infrastructure</h3>
          <div className="space-y-4">
            {infrastructureOptions.map(renderOption)}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Warhead Production</h3>
          <div className="space-y-4">
            {warheadOptions.map(renderOption)}
          </div>
        </div>
      </div>
    </div>
  );
}
