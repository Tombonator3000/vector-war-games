import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMultiplayer } from '@/contexts/MultiplayerProvider';

export const ConflictResolutionDialog = () => {
  const { conflict, clearConflict, publishState } = useMultiplayer();

  if (!conflict) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center">
      <div className="flex max-w-md items-start gap-3 rounded-lg border border-rose-500/60 bg-slate-950/95 p-4 text-rose-100 shadow-2xl">
        <AlertTriangle className="mt-1 h-5 w-5 text-rose-400" />
        <div className="space-y-2 text-sm">
          <div className="font-semibold uppercase tracking-wide">Sync conflict detected</div>
          <p className="text-rose-100/80">
            Another commander updated the session while you were issuing orders. Refresh tactical data to continue.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-slate-500/60 text-slate-200" onClick={clearConflict}>
              Dismiss
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 text-white hover:bg-rose-500"
              onClick={() => publishState({})}
            >
              Retry Sync
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionDialog;
