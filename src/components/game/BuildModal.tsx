import { PlayerManager, GameStateManager } from '@/state';
import type { ProductionHandlers } from '@/types/production';
import { getDeliveryOptions, getCityOption, getWarheadOptions } from '@/lib/productionOptions';
import { ResourceBudget } from './ResourceBudget';
import { ProductionCard } from './ProductionCard';
import { QueueProgress } from './QueueProgress';

export interface BuildModalProps extends ProductionHandlers {
  isGameStarted: boolean;
}

export function BuildModal(props: BuildModalProps) {
  const player = PlayerManager.get();
  const state = GameStateManager.getState();
  if (!player) return <p>No nation data available.</p>;
  const unavailableReason = !props.isGameStarted ? 'Start the simulation to issue orders.' :
    state.gameOver ? 'The conflict has concluded.' :
    state.phase !== 'PLAYER' ? 'Wait for your orders phase.' :
    state.actionsRemaining <= 0 ? 'No actions left. End the turn to regain command capacity.' : null;
  const groups = [
    { label: 'Delivery & defense', options: getDeliveryOptions(player, props) },
    { label: 'Infrastructure', options: [getCityOption(player, props)] },
    { label: 'Warhead production', options: getWarheadOptions(player, props) },
  ];
  return (
    <div className="space-y-6">
      <ResourceBudget nation={player} />
      <p className="text-sm text-cyan-100">Each order costs one action. Resources are paid when you issue the order.</p>
      {unavailableReason && <p role="status" className="rounded border border-yellow-500/40 p-3 text-sm text-yellow-200">{unavailableReason}</p>}
      {player.cityConstructionQueue && <QueueProgress label={`City #${(player.cities ?? 1) + 1}`} queue={player.cityConstructionQueue} />}
      {groups.map(group => (
        <section key={group.label} className="space-y-3">
          <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">{group.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {group.options.map(option => <ProductionCard key={option.key} option={option} player={player} unavailableReason={unavailableReason} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
