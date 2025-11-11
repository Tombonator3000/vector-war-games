import type { FalloutSeverity } from '@/lib/falloutEffects';

export interface NuclearAftermathMedia {
  src: string;
  alt: string;
  caption: string;
}

export interface NuclearAftermathEvent {
  id?: string;
  nationId?: string;
  nationName: string;
  humanitarianSummary: string;
  environmentalSummary: string;
  stageSummaries: string[];
  severity: number;
  falloutSeverity?: FalloutSeverity;
  totalRefugees?: number;
  turnCreated: number;
  imagery?: NuclearAftermathMedia[];
}

type NuclearAftermathListener = (event: NuclearAftermathEvent) => void;

const listeners = new Set<NuclearAftermathListener>();

export function registerNuclearAftermathListener(listener: NuclearAftermathListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitNuclearAftermathEvent(event: NuclearAftermathEvent): void {
  listeners.forEach(listener => listener(event));
}

export function resetNuclearAftermathListeners(): void {
  listeners.clear();
}
