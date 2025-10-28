import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useMultiplayer } from '@/contexts/MultiplayerProvider';

export const CoopStatusPanel = () => {
  const { players, role, ready, setReady, sessionId } = useMultiplayer();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateReady = async (next: boolean) => {
    setIsUpdating(true);
    try {
      await setReady(next);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleReadyToggle = () => updateReady(!ready);

  return (
    <div className="rounded-lg border border-cyan-500/40 bg-slate-950/70 p-4 text-cyan-100 shadow-lg">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold uppercase tracking-wider">Co-op Command</span>
        </div>
        <div className="text-xs text-cyan-300/70">Session {sessionId.slice(0, 6).toUpperCase()}</div>
      </div>
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between rounded border border-cyan-500/20 bg-slate-900/70 px-3 py-2">
          <div>
            <div className="font-semibold text-cyan-200">You are {role ?? 'Assigning…'}</div>
            <div className="text-cyan-300/70">Coordinate with your co-commander</div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={ready} disabled={isUpdating} onCheckedChange={updateReady} />
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={handleReadyToggle}
              className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10"
            >
              {ready ? 'Set Standby' : 'Mark Ready'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {players.length === 0 ? (
            <div className="rounded border border-cyan-500/20 bg-slate-900/60 p-2 text-cyan-300/70">
              Waiting for commanders to connect…
            </div>
          ) : (
            players.map(player => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded border px-3 py-2 ${
                  player.isSelf
                    ? 'border-cyan-400/70 bg-cyan-500/10'
                    : 'border-cyan-500/20 bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="text-cyan-100">
                    {player.displayName || (player.isSelf ? 'You' : 'Commander')} · {player.role}
                  </div>
                  <div className="text-xs text-cyan-300/60">Last seen {new Date(player.lastSeen).toLocaleTimeString()}</div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    player.ready ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/10 text-yellow-200'
                  }`}
                >
                  {player.ready ? 'Ready' : 'Reviewing'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CoopStatusPanel;
