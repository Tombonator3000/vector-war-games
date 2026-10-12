import { getQueueProgress } from '@/lib/commandPresentation';

interface QueueProgressProps {
  label: string;
  queue: { turnsRemaining: number; totalTurns: number };
}

export function QueueProgress({ label, queue }: QueueProgressProps) {
  const progress = getQueueProgress(queue);
  return (
    <div className="queue-progress">
      <div className="queue-progress__heading">
        <span>{label}</span>
        <span>{queue.turnsRemaining} {queue.turnsRemaining === 1 ? 'turn' : 'turns'} left</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="queue-progress__track">
        <div style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
