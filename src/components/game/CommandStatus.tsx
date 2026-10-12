import type { ReactNode } from 'react';
import type { GameState, Nation } from '@/types/game';
import { getResourceAmount } from '@/lib/commandPresentation';
import { getDefconIndicatorClasses } from '@/lib/gameUtilityFunctions';

interface CommandStatusProps {
  state: Pick<GameState, 'defcon' | 'turn' | 'actionsRemaining' | 'phase'>;
  nation: Nation | null;
  date: string;
  extra?: ReactNode;
  minimal?: boolean;
}

export function CommandStatus({ state, nation, date, extra, minimal }: CommandStatusProps) {
  const classes = getDefconIndicatorClasses(state.defcon);
  const maxActions = state.defcon >= 4 ? 1 : state.defcon >= 2 ? 2 : 3;
  return (
    <div className="game-top-bar__metrics command-status">
      <div id="defconBadge" className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border ${classes.badge}`}>
        <span className="text-xs">DEFCON</span><strong id="defcon" className={`text-xl ${classes.value}`}>{state.defcon}</strong>
      </div>
      {extra}
      <div className="command-status__metric"><span>Turn</span><strong id="turn">{state.turn}</strong></div>
      <div className="command-status__metric"><span>Actions</span><strong id="actionsDisplay">{state.actionsRemaining}/{maxActions}</strong></div>
      {!minimal && <div className="command-status__date"><span id="gameTimeDisplay">{date}</span></div>}
      {nation && (
        <dl className="command-status__resources" aria-label="Strategic resources">
          <div><dt>Prod</dt><dd id="productionDisplay">{Math.floor(nation.production ?? 0)}</dd></div>
          <div><dt>Uranium</dt><dd id="uraniumDisplay">{Math.floor(getResourceAmount(nation, 'uranium'))}</dd></div>
          <div><dt>Intel</dt><dd id="intelDisplay">{Math.floor(nation.intel ?? 0)}</dd></div>
          {!minimal && <div><dt>Gold</dt><dd id="goldDisplay">{Math.floor(nation.gold ?? 0)}</dd></div>}
        </dl>
      )}
    </div>
  );
}
