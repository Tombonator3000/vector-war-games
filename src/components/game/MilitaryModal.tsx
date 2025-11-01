import { ReactNode } from 'react';
import type { LocalNation } from '@/state';
import { PlayerManager } from '@/state';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { TerritoryMapPanel } from '@/components/TerritoryMapPanel';
import { RESEARCH_LOOKUP } from '@/lib/gameConstants';
import type {
  ConventionalUnitState,
  TerritoryState,
  ConventionalUnitTemplate,
  EngagementLogEntry,
  NationConventionalProfile,
} from '@/hooks/useConventionalWarfare';
import { createDefaultNationConventionalProfile } from '@/hooks/useConventionalWarfare';

export interface MilitaryModalProps {
  conventionalUnits: Record<string, ConventionalUnitState>;
  conventionalTerritories: Record<string, TerritoryState>;
  conventionalTemplatesMap: Record<string, ConventionalUnitTemplate>;
  conventionalLogs: EngagementLogEntry[];
  trainConventionalUnit: (nationId: string, templateId: string) => any;
  deployConventionalUnit: (unitId: string, territoryId: string) => any;
  getConventionalUnitsForNation: (nationId: string) => ConventionalUnitState[];
  resolveConventionalBorderConflict: (
    territoryId: string,
    attackerId: string,
    defenderId: string
  ) => any;
  resolveConventionalProxyEngagement: (
    territoryId: string,
    sponsorId: string,
    opposingId: string
  ) => any;
  toast: (options: { title: string; description: string }) => void;
  addNewsItem: (category: string, text: string, importance: string) => void;
}

/**
 * MilitaryModal - Conventional warfare command interface
 *
 * Displays:
 * - Conventional forces panel (training, deployment)
 * - Theatre overview map
 * - Recent engagement logs
 */
export function MilitaryModal({
  conventionalUnits,
  conventionalTerritories,
  conventionalTemplatesMap,
  conventionalLogs,
  trainConventionalUnit,
  deployConventionalUnit,
  getConventionalUnitsForNation,
  resolveConventionalBorderConflict,
  resolveConventionalProxyEngagement,
  toast,
  addNewsItem,
}: MilitaryModalProps): ReactNode {
  const player = PlayerManager.get() as LocalNation | null;

  if (!player) {
    return <div className="text-sm text-cyan-200">No player nation data available.</div>;
  }

  const playerUnits = getConventionalUnitsForNation(player.id);
  const territoryList = Object.values(conventionalTerritories);
  const templates = Object.values(conventionalTemplatesMap);
  const recentLogs = [...conventionalLogs].slice(-6).reverse();

  const profile: NationConventionalProfile = {
    ...(player.conventional ?? createDefaultNationConventionalProfile()),
    reserve: playerUnits.filter(unit => unit.status === 'reserve').length,
    deployedUnits: playerUnits.filter(unit => unit.status === 'deployed').map(unit => unit.id),
  };

  const handleTrain = (templateId: string) => {
    const result = trainConventionalUnit(player.id, templateId);
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
    toast({ title: 'Formation queued', description: `${template?.name ?? 'New unit'} added to reserves.` });
    addNewsItem('military', `${player.name} mobilises ${template?.name ?? 'new forces'}`, 'important');
  };

  const handleDeployUnit = (unitId: string, territoryId: string) => {
    const result = deployConventionalUnit(unitId, territoryId);
    if (!result.success) {
      toast({ title: 'Deployment failed', description: result.reason ?? 'Unable to deploy selected unit.' });
      return;
    }

    const territory = conventionalTerritories[territoryId];
    toast({
      title: 'Unit deployed',
      description: `${player.name} reinforces ${territory?.name ?? 'forward position'}.`,
    });
    addNewsItem('military', `${player.name} deploys assets to ${territory?.name ?? territoryId}`, 'important');
  };

  const handleBorderConflict = (territoryId: string, defenderId: string) => {
    const territory = conventionalTerritories[territoryId];
    const result = resolveConventionalBorderConflict(territoryId, player.id, defenderId);
    if (!result.success) {
      toast({ title: 'Conflict aborted', description: 'Border offensive could not be executed.' });
      return;
    }

    toast({
      title: result.attackerVictory ? 'Border seized' : 'Advance repelled',
      description: `${territory?.name ?? 'Target region'} engagement odds ${(result.odds * 100).toFixed(0)}%.`,
    });
    addNewsItem(
      'military',
      result.attackerVictory
        ? `${player.name} captures ${territory?.name ?? territoryId}`
        : `${player.name} fails to secure ${territory?.name ?? territoryId}`,
      result.attackerVictory ? 'critical' : 'urgent'
    );
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

  return (
    <div className="space-y-6">
      <ConventionalForcesPanel
        templates={templates}
        units={playerUnits}
        territories={territoryList}
        profile={profile}
        onTrain={handleTrain}
        onDeploy={handleDeployUnit}
        researchUnlocks={player.researched ?? {}}
        playerPopulation={player.population}
      />

      <section className="rounded border border-cyan-500/40 bg-black/60 p-4">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-[0.3em] text-cyan-300">Theatre Overview</h3>
          <span className="text-[11px] font-mono text-cyan-300/80">{territoryList.length} theatres monitored</span>
        </header>
        <TerritoryMapPanel
          territories={territoryList}
          units={Object.values(conventionalUnits)}
          playerId={player.id}
          onBorderConflict={handleBorderConflict}
          onProxyEngagement={handleProxyEngagement}
          playerPopulation={player.population}
        />
      </section>

      <section className="rounded border border-cyan-500/30 bg-black/60 p-4">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-[0.3em] text-cyan-300">Recent Engagements</h3>
          <span className="text-[11px] font-mono text-cyan-300/80">{recentLogs.length} events</span>
        </header>
        <div className="space-y-2">
          {recentLogs.length === 0 && (
            <p className="text-[11px] text-cyan-300/70">No conventional engagements recorded this campaign.</p>
          )}
          {recentLogs.map(logEntry => (
            <div key={logEntry.id} className="rounded border border-cyan-500/20 bg-black/40 p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300/90">
                <span>{logEntry.summary}</span>
                <span>Turn {logEntry.turn}</span>
              </div>
              <div className="mt-1 text-[10px] text-cyan-300/70">
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
