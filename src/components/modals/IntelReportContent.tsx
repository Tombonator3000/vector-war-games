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
    <div className="space-y-6">
      <div className="space-y-4">
        {visibleTargets.length === 0 ? (
          <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 px-6 py-4 text-sm text-gray-400">
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
                className="rounded-lg border border-cyan-500/30 bg-slate-800/50 px-6 py-4"
              >
                <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
                  <span className="text-lg font-semibold text-cyan-300 font-mono">{nation.name}</span>
                  <span className="text-sm text-cyan-400">POP {Math.floor(nation.population)}M</span>
                </div>
                <div className="grid gap-2 text-sm text-gray-300">
                  <div className="flex gap-4">
                    <span className="text-gray-400">Missiles:</span>
                    <span className="text-cyan-300">{nation.missiles}</span>
                    <span className="text-gray-400 ml-4">Defense:</span>
                    <span className="text-cyan-300">{nation.defense}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">Warheads:</span>
                    <span className="text-cyan-300">{warheads || '—'}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">Production:</span>
                    <span className="text-cyan-300">{Math.floor(nation.production || 0)}</span>
                    <span className="text-gray-400 ml-4">Uranium:</span>
                    <span className="text-cyan-300">{Math.floor(nation.uranium || 0)}</span>
                    <span className="text-gray-400 ml-4">Intel:</span>
                    <span className="text-cyan-300">{Math.floor(nation.intel || 0)}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">Instability:</span>
                    <span className="text-cyan-300">{Math.floor(nation.instability || 0)}</span>
                    <span className="text-gray-400 ml-4">Cities:</span>
                    <span className="text-cyan-300">{nation.cities || 1}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">Migrants (turn / total):</span>
                    <span className="text-cyan-300">{(nation.migrantsThisTurn || 0)} / {(nation.migrantsTotal || 0)}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">Cyber readiness:</span>
                    <span className="text-cyan-300">{Math.round(cyberProfile.readiness)}/{cyberProfile.maxReadiness}</span>
                    <span className="text-gray-400 ml-4">Detection:</span>
                    <span className="text-cyan-300">{Math.round(cyberProfile.detection)}%</span>
                  </div>
                  {deepReconActive ? (
                    <>
                      <div className="flex gap-4 mt-2 pt-2 border-t border-cyan-500/20">
                        <span className="text-gray-400">Doctrine:</span>
                        <span className="text-cyan-300">{nation.doctrine || 'Unknown'}</span>
                        <span className="text-gray-400 ml-4">Personality:</span>
                        <span className="text-cyan-300">{nation.ai || 'Unknown'}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-gray-400">Tech:</span>
                        <span className="text-cyan-300">{Object.keys(nation.researched || {}).join(', ') || 'None'}</span>
                      </div>
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
