/**
 * IntelReportContent Component
 *
 * Displays intelligence reports for nations under satellite surveillance.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { createDefaultNationCyberProfile } from '@/hooks/useCyberWarfare';
import type { Nation } from '@/types/game';

// Local type extension
type LocalNation = Nation & {
  conventional?: any;
  controlledTerritories?: string[];
};

export interface IntelReportContentProps {
  player: LocalNation;
  nations: LocalNation[];
  onClose: () => void;
}

export function IntelReportContent({ player, nations, onClose }: IntelReportContentProps) {
  const visibleTargets = useMemo(() => {
    if (!player.satellites) return [] as LocalNation[];
    return nations.filter(nation => {
      if (nation.isPlayer) return false;
      if (!player.satellites?.[nation.id]) return false;
      if (nation.coverOpsTurns && nation.coverOpsTurns > 0) return false;
      return true;
    });
  }, [player, nations]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visibleTargets.length === 0 ? (
          <div className="rounded border border-cyan-500/60 bg-black/50 px-4 py-3 text-sm text-cyan-200/70">
            No active surveillance targets available. Deploy satellites to gather intelligence.
          </div>
        ) : (
          visibleTargets.map(nation => {
            const warheads = Object.entries(nation.warheads || {})
              .map(([yieldMT, count]) => `${yieldMT}MT×${count}`)
              .join(' ');
            const deepReconActive = !!player.deepRecon?.[nation.id];
            const cyberProfile = nation.cyber ?? createDefaultNationCyberProfile();

            return (
              <div
                key={nation.id}
                className="rounded border border-cyan-500/60 bg-black/60 px-4 py-3 text-sm text-cyan-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-200">{nation.name}</span>
                  <span className="text-xs text-cyan-300">POP {Math.floor(nation.population)}M</span>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-cyan-200/80">
                  <div>Missiles: {nation.missiles} • Defense: {nation.defense}</div>
                  <div>Warheads: {warheads || '—'}</div>
                  <div>
                    Production: {Math.floor(nation.production || 0)} • Uranium: {Math.floor(nation.uranium || 0)} • Intel: {Math.floor(nation.intel || 0)}
                  </div>
                  <div>
                    Instability: {Math.floor(nation.instability || 0)} • Cities: {nation.cities || 1}
                  </div>
                  <div>
                    Migrants (turn / total): {(nation.migrantsThisTurn || 0)} / {(nation.migrantsTotal || 0)}
                  </div>
                  <div>
                    Cyber readiness: {Math.round(cyberProfile.readiness)}/{cyberProfile.maxReadiness} • Detection: {Math.round(cyberProfile.detection)}%
                  </div>
                  {deepReconActive ? (
                    <>
                      <div>Doctrine: {nation.doctrine || 'Unknown'} • Personality: {nation.ai || 'Unknown'}</div>
                      <div>Tech: {Object.keys(nation.researched || {}).join(', ') || 'None'}</div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onClose} className="bg-cyan-500 text-black hover:bg-cyan-400">
          Close [ESC]
        </Button>
      </div>
    </div>
  );
}
