import { useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PHASE_LABELS } from '@/data/commandActions';
import type { TurnControlProps } from '@/types/command';

export function TurnControl(props: TurnControlProps) {
  const [reviewTurn, setReviewTurn] = useState<number | null>(null);
  const { turn, phase, actionsRemaining, paused, gameOver, revealPending, researchIdle, onEndTurn } = props;
  const canEnd = !!revealPending || (!gameOver && !paused && phase === 'PLAYER');
  const phaseLabel = gameOver ? 'Conflict concluded' : paused ? 'Simulation paused' : PHASE_LABELS[phase];
  const finish = () => {
    setReviewTurn(null);
    if (canEnd) onEndTurn();
  };
  const requestEnd = () => {
    if (!canEnd) return;
    if (!revealPending && actionsRemaining > 0) setReviewTurn(turn);
    else finish();
  };

  return (
    <div className="turn-control">
      <div className="turn-control__status" role="status" aria-label="Turn status">
        <strong>Turn {turn}</strong>
        <span>{phaseLabel}{phase === 'PLAYER' && !gameOver ? ` · ${actionsRemaining} actions left` : ''}</span>
      </div>
      <Button type="button" className="turn-control__button" disabled={!canEnd} onClick={requestEnd}>
        {!gameOver && phase !== 'PLAYER' ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        {revealPending ? 'Show outcome' : 'End turn'}
      </Button>
      <Dialog open={reviewTurn === turn && canEnd} onOpenChange={open => { if (!open) setReviewTurn(null); }}>
        <DialogContent className="command-review">
          <DialogHeader>
            <DialogTitle>End turn {turn}?</DialogTitle>
            <DialogDescription>
              You have {actionsRemaining} unused {actionsRemaining === 1 ? 'action' : 'actions'}. Remaining actions will be lost.
              Opponents will act, then production, research and construction will advance.
            </DialogDescription>
          </DialogHeader>
          {researchIdle && <p className="command-review__hint">No research is running. You can return to your orders to choose a program.</p>}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Continue planning</Button></DialogClose>
            <Button onClick={finish}>End turn anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
