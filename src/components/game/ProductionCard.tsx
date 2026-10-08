import { useId } from 'react';
import { Button } from '@/components/ui/button';
import type { Nation } from '@/types/game';
import type { ProductionOption } from '@/types/production';
import { formatResourceCost, getResourceShortfall } from '@/lib/commandPresentation';

interface ProductionCardProps {
  option: ProductionOption;
  player: Nation;
  unavailableReason: string | null;
}

export function ProductionCard({ option, player, unavailableReason }: ProductionCardProps) {
  const reasonId = useId();
  const reason = option.requirement || unavailableReason || getResourceShortfall(player, option.cost);
  return (
    <article className="production-card">
      <h4>{option.label}</h4>
      <p>{option.description}</p>
      <div className="production-card__cost">{formatResourceCost(option.cost)} · 1 action</div>
      <div className="production-card__status">{option.statusLine}</div>
      {reason && <div id={reasonId} className="production-card__reason">{reason}</div>}
      <Button type="button" disabled={!!reason} aria-describedby={reason ? reasonId : undefined} onClick={option.onClick}>
        {option.label}
      </Button>
    </article>
  );
}
