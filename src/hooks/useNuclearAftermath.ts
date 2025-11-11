import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NuclearAftermathEvent } from '@/state/nuclearAftermathEvents';
import { registerNuclearAftermathListener } from '@/state/nuclearAftermathEvents';

export interface NuclearAftermathEntry extends NuclearAftermathEvent {
  id: string;
  readyTurn: number;
  turnsUntilReveal: number;
}

export interface UseNuclearAftermathOptions {
  delay?: number;
}

export interface UseNuclearAftermathReturn {
  queue: NuclearAftermathEntry[];
  visible: NuclearAftermathEntry[];
  activeAftermath: NuclearAftermathEntry | null;
  enqueueAftermath: (event: NuclearAftermathEvent) => void;
  advanceTurn: (currentTurn: number) => void;
  dismissActiveAftermath: () => void;
}

export const DEFAULT_NUCLEAR_AFTERMATH_DELAY = 3;

function coerceDelay(delay?: number): number {
  if (typeof delay !== 'number' || Number.isNaN(delay)) {
    return DEFAULT_NUCLEAR_AFTERMATH_DELAY;
  }
  return Math.max(0, Math.floor(delay));
}

function ensureId(event: NuclearAftermathEvent): string {
  if (event.id) {
    return event.id;
  }
  const suffix = `${event.nationId ?? 'unknown'}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return `aftermath-${suffix}`;
}

export function useNuclearAftermath(options: UseNuclearAftermathOptions = {}): UseNuclearAftermathReturn {
  const delay = useMemo(() => coerceDelay(options.delay), [options.delay]);
  const [queue, setQueue] = useState<NuclearAftermathEntry[]>([]);
  const [visible, setVisible] = useState<NuclearAftermathEntry[]>([]);
  const [activeAftermath, setActiveAftermath] = useState<NuclearAftermathEntry | null>(null);

  const enqueueAftermath = useCallback((event: NuclearAftermathEvent) => {
    const baseTurn = Math.max(0, event.turnCreated ?? 0);
    const readyTurn = baseTurn + delay;
    const turnsUntilReveal = readyTurn - baseTurn;
    const entry: NuclearAftermathEntry = {
      ...event,
      id: ensureId(event),
      readyTurn,
      turnsUntilReveal,
    };

    if (entry.turnsUntilReveal <= 0) {
      setVisible(prev => [...prev, { ...entry, turnsUntilReveal: 0 }]);
      return;
    }

    setQueue(prev => [...prev, entry]);
  }, [delay]);

  const advanceTurn = useCallback((currentTurn: number) => {
    setQueue(prev => {
      const next: NuclearAftermathEntry[] = [];
      const readyEntries: NuclearAftermathEntry[] = [];

      prev.forEach(entry => {
        const turnsRemaining = Math.max(0, entry.readyTurn - currentTurn);
        if (turnsRemaining <= 0) {
          readyEntries.push({ ...entry, turnsUntilReveal: 0 });
        } else {
          next.push({ ...entry, turnsUntilReveal: turnsRemaining });
        }
      });

      if (readyEntries.length > 0) {
        setVisible(prevVisible => [...prevVisible, ...readyEntries]);
      }

      return next;
    });
  }, []);

  const dismissActiveAftermath = useCallback(() => {
    setVisible(prev => prev.slice(1));
    setActiveAftermath(null);
  }, []);

  useEffect(() => {
    if (!activeAftermath && visible.length > 0) {
      setActiveAftermath(visible[0]);
    }
  }, [visible, activeAftermath]);

  useEffect(() => {
    const unsubscribe = registerNuclearAftermathListener(enqueueAftermath);
    return () => {
      unsubscribe();
    };
  }, [enqueueAftermath]);

  return {
    queue,
    visible,
    activeAftermath,
    enqueueAftermath,
    advanceTurn,
    dismissActiveAftermath,
  };
}
