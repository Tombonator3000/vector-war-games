import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { LocalNation } from '@/state';
import { PlayerManager } from '@/state';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { BattleResultDisplay } from '@/components/DiceRoller';
import { RESEARCH_LOOKUP } from '@/lib/gameConstants';
import type {
  TerritoryState,
  ConventionalUnitTemplate,
  EngagementLogEntry,
  NationConventionalProfile,
  BorderConflictSuccessPayload,
} from '@/hooks/useConventionalWarfare';
import { createDefaultNationConventionalProfile } from '@/hooks/useConventionalWarfare';
import MapBasedWarfare, { type ProjectedPoint } from '@/components/warfare/MapBasedWarfare';

export interface MilitaryModalProps {
  conventionalTerritories: Record<string, TerritoryState>;
  conventionalTemplatesMap: Record<string, ConventionalUnitTemplate>;
  conventionalLogs: EngagementLogEntry[];
  trainConventionalUnit: (nationId: string, templateId: string, territoryId?: string) => any;
  resolveConventionalAttack: (fromTerritoryId: string, toTerritoryId: string, armies: number) => any;
  moveConventionalArmies: (fromTerritoryId: string, toTerritoryId: string, count: number) => any;
  resolveConventionalProxyEngagement: (
    territoryId: string,
    sponsorId: string,
    opposingId: string
  ) => any;
  placeConventionalReinforcements: (nationId: string, territoryId: string, count: number) => any;
  getConventionalReinforcements: (nationId: string) => number;
  toast: (options: { title: string; description: string }) => void;
  addNewsItem: (category: string, text: string, importance: string) => void;
}

/**
 * MilitaryModal - Strength-based conventional warfare command interface
 *
 * Displays:
 * - Conventional forces panel (training, deployment)
 * - Territory map with army counts and actions
 * - Battle results with deterministic strength reports
 * - Recent engagement logs
 */
export function MilitaryModal({
  conventionalTerritories,
  conventionalTemplatesMap,
  conventionalLogs,
  trainConventionalUnit,
  resolveConventionalAttack,
  moveConventionalArmies,
  resolveConventionalProxyEngagement,
  placeConventionalReinforcements,
  getConventionalReinforcements,
  toast,
  addNewsItem,
}: MilitaryModalProps): ReactNode {
  const player = PlayerManager.get() as LocalNation | null;
  const [lastBattleResult, setLastBattleResult] = useState<{
    report: BorderConflictSuccessPayload;
    attackerName: string;
    defenderName: string;
    territory: string;
  } | null>(null);

  if (!player) {
    return <div className="text-sm text-cyan-200">No player nation data available.</div>;
  }

  const territoryList = Object.values(conventionalTerritories);
  const templates = Object.values(conventionalTemplatesMap);
  const recentLogs = [...conventionalLogs].slice(-6).reverse();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapDimensions, setMapDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const node = mapContainerRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const next = { width: node.clientWidth, height: node.clientHeight };
      setMapDimensions(prev =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const modalProjector = useCallback(
    (lon: number, lat: number): ProjectedPoint => {
      if (mapDimensions.width <= 0 || mapDimensions.height <= 0) {
        return { x: 0, y: 0, visible: false };
      }
      const x = ((lon + 180) / 360) * mapDimensions.width;
      const y = ((90 - lat) / 180) * mapDimensions.height;
      return { x, y, visible: true };
    },
    [mapDimensions.height, mapDimensions.width],
  );

  const playerTerritories = territoryList.filter(t => t.controllingNationId === player.id);
  const totalArmies = playerTerritories.reduce((sum, t) => sum + t.armies, 0);

  const profile: NationConventionalProfile = {
    ...(player.conventional ?? createDefaultNationConventionalProfile()),
    reserve: 0, // Not used in new army-based system
    deployedUnits: [], // Not used in new army-based system
  };

  const availableReinforcements = getConventionalReinforcements(player.id);

  const handleTrain = (templateId: string, territoryId?: string) => {
    const result = trainConventionalUnit(player.id, templateId, territoryId);
    if (!result.success) {
      let description = 'Requested formation template is unavailable.';
      if (result.reason === 'Insufficient resources') {
        description = 'Production, intel, or uranium shortfall for this formation.';
      } else if (result.reason === 'Requires research unlock') {
        const researchId = 'requiresResearchId' in result ? result.requiresResearchId : undefined;
        const researchName = researchId ? RESEARCH_LOOKUP[researchId]?.name ?? 'required research unlock' : 'required research unlock';
        description = `Complete ${researchName} before queuing this formation.`;
      } else if (result.reason === 'Unknown nation') {
        description = 'Unable to identify the requesting command authority.';
      }

      toast({
        title: 'Unable to queue formation',
        description,
      });
      return;
    }

    const template = conventionalTemplatesMap[templateId];
    toast({
      title: 'Formation deployed',
      description: result.territorySummary || `${template?.name ?? 'New unit'} deployed.`
    });
    addNewsItem('military', `${player.name} mobilises ${template?.name ?? 'new forces'}`, 'important');
  };

  const handleAttack = (fromTerritoryId: string, toTerritoryId: string, armies: number) => {
    const fromTerritory = conventionalTerritories[fromTerritoryId];
    const toTerritory = conventionalTerritories[toTerritoryId];

    if (!fromTerritory || !toTerritory) {
      toast({ title: 'Attack failed', description: 'Invalid territories selected.' });
      return;
    }

    const result = resolveConventionalAttack(fromTerritoryId, toTerritoryId, armies);
    if (!result.success) {
      toast({ title: 'Attack failed', description: result.reason || 'Unable to execute attack.' });
      return;
    }

    if (result.success) {
      const defenderName = toTerritory.controllingNationId || 'Neutral';
      setLastBattleResult({
        report: result,
        attackerName: player.name,
        defenderName,
        territory: toTerritory.name,
      });

      const strengthSummary = `Strength ${result.attackerStrength.toFixed(0)} vs ${result.defenderStrength.toFixed(0)} (ratio ${result.strengthRatio.toFixed(2)})`;
      const baseDescription = `${strengthSummary}. Losses: ${result.attackerLosses} attacker • ${result.defenderLosses} defender.`;

      const title = result.outcome === 'attacker'
        ? '🎯 Territory secured!'
        : result.outcome === 'stalemate'
          ? '⚔️ Assault bogged down'
          : '❌ Attack repelled';

      toast({
        title,
        description: baseDescription,
      });

      addNewsItem(
        'military',
        result.outcome === 'attacker'
          ? `${player.name} captures ${toTerritory.name} (ratio ${result.strengthRatio.toFixed(2)})`
          : result.outcome === 'stalemate'
            ? `${player.name} locked in stalemate at ${toTerritory.name}`
            : `${player.name} fails to take ${toTerritory.name}`,
        result.outcome === 'attacker' ? 'critical' : 'urgent'
      );
    }
  };

  const handleMove = (fromTerritoryId: string, toTerritoryId: string, count: number) => {
    const fromTerritory = conventionalTerritories[fromTerritoryId];
    const toTerritory = conventionalTerritories[toTerritoryId];

    const result = moveConventionalArmies(fromTerritoryId, toTerritoryId, count);
    if (!result.success) {
      toast({ title: 'Movement failed', description: result.reason || 'Unable to move armies.' });
      return;
    }

    toast({
      title: 'Armies repositioned',
      description: `Moved ${count} armies from ${fromTerritory?.name} to ${toTerritory?.name}.`,
    });
  };

  const handleProxyEngagement = (territoryId: string, opposingId: string) => {
    const territory = conventionalTerritories[territoryId];
    const result = resolveConventionalProxyEngagement(territoryId, player.id, opposingId);
    if (!result.success) {
      toast({ title: 'Proxy engagement failed', description: 'Unable to project forces into this theatre.' });
      return;
    }

    toast({
      title: result.sponsorSuccess ? 'Proxy victory' : 'Proxy setback',
      description: `${territory?.name ?? 'Region'} influence shifted ${(result.odds * 100).toFixed(0)}% odds.`,
    });
    addNewsItem(
      'military',
      result.sponsorSuccess
        ? `${player.name} proxy gains in ${territory?.name ?? territoryId}`
        : `${player.name} proxy loses ground in ${territory?.name ?? territoryId}`,
      result.sponsorSuccess ? 'important' : 'urgent'
    );
  };

  const handlePlaceReinforcements = (territoryId: string, count: number) => {
    const territory = conventionalTerritories[territoryId];
    const result = placeConventionalReinforcements(player.id, territoryId, count);

    if (!result.success) {
      toast({ title: 'Reinforcement failed', description: result.reason || 'Unable to place reinforcements.' });
      return;
    }

    toast({
      title: 'Reinforcements deployed',
      description: `Placed ${count} armies in ${territory?.name}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Battle Results Display */}
      {lastBattleResult && (
        <section className="rounded-lg border-2 border-yellow-500/50 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-yellow-300">
              Battle Report: {lastBattleResult.territory}
            </h3>
            <button
              onClick={() => setLastBattleResult(null)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Clear
            </button>
          </div>
          <BattleResultDisplay
            report={lastBattleResult.report}
            attackerName={lastBattleResult.attackerName}
            defenderName={lastBattleResult.defenderName}
          />
        </section>
      )}

      <ConventionalForcesPanel
        templates={templates}
        territories={territoryList}
        profile={profile}
        onTrain={handleTrain}
        researchUnlocks={player.researched ?? {}}
        playerPopulation={player.population}
        availableReinforcements={availableReinforcements}
        playerId={player.id}
      />

      <section className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-6">
        <header className="mb-6 flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Theatre Overview</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-cyan-400">{playerTerritories.length} territories</span>
            <span className="text-cyan-400">{totalArmies} total armies</span>
          </div>
        </header>
        <div
          ref={mapContainerRef}
          className="relative h-[420px] overflow-hidden rounded-lg border border-cyan-500/20 bg-slate-900/40"
        >
          <MapBasedWarfare
            territories={territoryList}
            playerId={player.id}
            projector={modalProjector}
            onAttack={handleAttack}
            onMove={handleMove}
            onProxyEngagement={handleProxyEngagement}
            availableReinforcements={availableReinforcements}
            onPlaceReinforcements={handlePlaceReinforcements}
          />
        </div>
      </section>

      <section className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-6">
        <header className="mb-4 flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Engagements</h3>
          <span className="text-sm text-cyan-400">{recentLogs.length} events</span>
        </header>
        <div className="space-y-3">
          {recentLogs.length === 0 && (
            <p className="text-sm text-gray-500">No conventional engagements recorded this campaign.</p>
          )}
          {recentLogs.map(logEntry => (
            <div key={logEntry.id} className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between text-sm text-cyan-300">
                <span>{logEntry.summary}</span>
                <span className="text-gray-400">Turn {logEntry.turn}</span>
              </div>
              {logEntry.combatStrength && (
                <div className="mt-2 text-xs text-cyan-400">
                  ⚖️ {Math.round(logEntry.combatStrength.attackerStrength)} vs {Math.round(logEntry.combatStrength.defenderStrength)} (ratio {logEntry.combatStrength.ratio.toFixed(2)})
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Casualties: {Object.entries(logEntry.casualties)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
