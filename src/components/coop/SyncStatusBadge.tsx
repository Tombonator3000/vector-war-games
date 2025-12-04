import { SignalHigh, SignalLow, RefreshCcw } from 'lucide-react';
import { useMultiplayer, MULTIPLAYER_ENABLED } from '@/contexts/MultiplayerProvider';

const STATUS_COPY: Record<string, { label: string; tone: string; icon: typeof SignalHigh }> = {
  idle: { label: 'Idle', tone: 'text-cyan-300/70', icon: SignalLow },
  connecting: { label: 'Linking…', tone: 'text-yellow-300', icon: RefreshCcw as typeof SignalHigh },
  ready: { label: 'Live Sync', tone: 'text-emerald-300', icon: SignalHigh },
  error: { label: 'Offline', tone: 'text-rose-400', icon: SignalLow },
  unavailable: { label: 'Multiplayer Off', tone: 'text-slate-400', icon: SignalLow },
};

export const SyncStatusBadge = () => {
  const { connection, sessionId } = useMultiplayer();

  // Don't render anything when multiplayer feature is disabled
  if (!MULTIPLAYER_ENABLED) {
    return null;
  }

  const copy = STATUS_COPY[connection] ?? STATUS_COPY.idle;
  const Icon = copy.icon;

  return (
    <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
      <Icon className={`h-3 w-3 ${copy.tone}`} />
      <span className={`tracking-wide ${copy.tone}`}>{copy.label}</span>
      <span className="text-cyan-400/60">#{sessionId.slice(0, 4).toUpperCase()}</span>
    </div>
  );
};

export default SyncStatusBadge;
