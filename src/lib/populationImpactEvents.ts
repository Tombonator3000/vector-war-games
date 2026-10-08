import { POPULATION_IMPACT_EVENT } from '@/constants/events.constants';
import type { PopulationImpact } from '@/types/populationImpact';

/** Module-level combat code reports casualties without reaching into React state. */
export function reportPopulationImpact(casualties: number, targetName: string): void {
  if (typeof window === 'undefined' || !Number.isFinite(casualties) || casualties <= 0) return;
  const timestamp = Date.now();
  const detail: PopulationImpact = {
    id: `impact-${timestamp}-${Math.random()}`,
    casualties,
    targetName,
    timestamp,
  };
  window.dispatchEvent(new CustomEvent<PopulationImpact>(POPULATION_IMPACT_EVENT, { detail }));
}

export function subscribePopulationImpacts(listener: (impact: PopulationImpact) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<PopulationImpact>).detail);
  window.addEventListener(POPULATION_IMPACT_EVENT, handler);
  return () => window.removeEventListener(POPULATION_IMPACT_EVENT, handler);
}
