import { getResourceAmount } from '@/lib/commandPresentation';
import type { Nation } from '@/types/game';

export function ResourceBudget({ nation }: { nation: Nation }) {
  return (
    <dl className="resource-budget" aria-label="Available resources">
      <div><dt>Production</dt><dd>{Math.floor(nation.production ?? 0)}</dd></div>
      <div><dt>Uranium</dt><dd>{Math.floor(getResourceAmount(nation, 'uranium'))}</dd></div>
      <div><dt>Intel</dt><dd>{Math.floor(nation.intel ?? 0)}</dd></div>
      {nation.resourceStockpile && <>
        <div><dt>Rare earths</dt><dd>{Math.floor(nation.resourceStockpile.rare_earths)}</dd></div>
        <div><dt>Oil</dt><dd>{Math.floor(nation.resourceStockpile.oil)}</dd></div>
        <div><dt>Food</dt><dd>{Math.floor(nation.resourceStockpile.food)}</dd></div>
      </>}
    </dl>
  );
}
