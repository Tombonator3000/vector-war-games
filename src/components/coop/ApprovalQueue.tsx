import { Button } from '@/components/ui/button';
import { useMultiplayer } from '@/contexts/MultiplayerProvider';

export const ApprovalQueue = () => {
  const { approvals, respondToApproval, role } = useMultiplayer();
  const actionable = approvals.filter(item => item.status === 'pending');

  if (actionable.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-yellow-400/40 bg-slate-950/80 p-4 text-xs text-yellow-100 shadow-lg">
      <div className="mb-3 font-semibold uppercase tracking-wide text-yellow-200">Pending approvals</div>
      <div className="space-y-3">
        {actionable.map(item => (
          <div key={item.request.id} className="space-y-2 rounded border border-yellow-400/30 bg-yellow-500/5 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-yellow-200/80">
              <span>{item.request.action}</span>
              <span>{new Date(item.request.requestedAt).toLocaleTimeString()}</span>
            </div>
            <div className="text-yellow-100/80">
              {item.request.description || 'Awaiting co-commander review.'}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-yellow-200/60">
              <span>Requested by {item.actorId.slice(0, 4).toUpperCase()}</span>
              <span>·</span>
              <span>{role === 'STRATEGIST' ? 'Strategic oversight required' : 'Tactical confirmation required'}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/10"
                onClick={() => respondToApproval(item.request.id, true)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-rose-400/60 text-rose-200 hover:bg-rose-500/10"
                onClick={() => respondToApproval(item.request.id, false)}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalQueue;
