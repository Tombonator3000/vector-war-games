import { ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, Shield, ScrollText } from 'lucide-react';
import WarCouncilPanel from '@/components/WarCouncilPanel';
import type { Nation } from '@/types/game';
import type { LocalNation } from '@/state';
import { PlayerManager } from '@/state';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { TerritoryMapPanel } from '@/components/TerritoryMapPanel';
import { BattleStrengthSummary } from '@/components/StrengthExchangeLog';
import { RESEARCH_LOOKUP } from '@/lib/gameConstants';
import type {
  TerritoryState,
  ConventionalUnitTemplate,
  EngagementLogEntry,
  NationConventionalProfile,
  StrengthExchangeLog,
} from '@/hooks/useConventionalWarfare';
import { createDefaultNationConventionalProfile } from '@/hooks/useConventionalWarfare';
import type { ArmyGroupSummary } from '@/types/militaryTemplates';
import { OrderOfBattlePanel } from './OrderOfBattlePanel';
import { StrategicOutliner, type StrategicOutlinerGroup } from './StrategicOutliner';

export interface ConsolidatedWarModalProps {
  // War Council props
  player: Nation;
  nations: Nation[];
  currentTurn: number;
  onDeclareWar: (targetNationId: string, casusBelliId: string) => void;
  onOfferPeace: (warId: string) => void;
  onAcceptPeace: (offerId: string) => void;
  onRejectPeace: (offerId: string) => void;

  // Military/Conventional props
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
  armyGroups?: ArmyGroupSummary[];
  strategicOutlinerGroups?: StrategicOutlinerGroup[];
  isOutlinerCollapsed?: boolean;
  onOutlinerToggle?: () => void;
}

/**
 * ConsolidatedWarModal - Unified interface for all warfare operations
 *
 * Combines:
 * - War Council (Casus Belli, war declarations, peace negotiations)
 * - Conventional Forces (Risk-style territorial warfare)
 * - War Summary (overview of all conflicts)
 */
export function ConsolidatedWarModal({
  player,
  nations,
  currentTurn,
  onDeclareWar,
  onOfferPeace,
  onAcceptPeace,
  onRejectPeace,
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
  armyGroups = [],
  strategicOutlinerGroups = [],
  isOutlinerCollapsed = false,
  onOutlinerToggle = () => {},
}: ConsolidatedWarModalProps): ReactNode {
  const [activeTab, setActiveTab] = useState('council');
  const localPlayer = PlayerManager.get() as LocalNation | null;
  const [lastBattleResult, setLastBattleResult] = useState<{
    exchanges: StrengthExchangeLog[];
    attackerName: string;
    defenderName: string;
    territory: string;
  } | null>(null);
  const [actionRefreshKey, setActionRefreshKey] = useState(0);

  if (!localPlayer) {
    return <div className="text-sm text-cyan-200">No player nation data available.</div>;
  }

  const territoryList = Object.values(conventionalTerritories);
  const templates = Object.values(conventionalTemplatesMap);
  const recentLogs = [...conventionalLogs].slice(-6).reverse();

  const playerTerritories = territoryList.filter(t => t.controllingNationId === localPlayer.id);
  const totalArmies = playerTerritories.reduce((sum, t) => sum + t.armies, 0);

  const profile: NationConventionalProfile = {
    ...(localPlayer.conventional ?? createDefaultNationConventionalProfile()),
    reserve: 0,
    deployedUnits: [],
  };

  const availableReinforcements = getConventionalReinforcements(localPlayer.id);

  const handleTrain = (templateId: string, territoryId?: string) => {
    const result = trainConventionalUnit(localPlayer.id, templateId, territoryId);
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
    } else {
      addNewsItem('military', `Training ${result.unitName || 'unit'} formation initiated`, 'important');
    }
  };

  const handleAttack = (fromTerritoryId: string, toTerritoryId: string, armies: number) => {
    const result = resolveConventionalAttack(fromTerritoryId, toTerritoryId, armies);
    setActionRefreshKey(prev => prev + 1);

    const from = conventionalTerritories[fromTerritoryId];
    const to = conventionalTerritories[toTerritoryId];
    const attackerNation = nations.find(n => n.id === from?.controllingNationId);
    const defenderNation = nations.find(n => n.id === to?.controllingNationId);

    if (!result?.success) {
      toast({
        title: 'Assault aborted',
        description: result?.reason || 'Unable to resolve the attack order.',
      });
      return;
    }

    const territoryName = to?.name || 'Unknown Territory';
    const attackerName = attackerNation?.name || 'Unknown';
    const defenderName = defenderNation?.name || 'Unknown';

    toast({
      title: result.attackerVictory ? 'Assault successful' : 'Assault repelled',
      description: `${attackerName} vs ${defenderName} at ${territoryName}`,
    });

    addNewsItem(
      'military',
      result.attackerVictory
        ? `${attackerName} seized ground at ${territoryName}`
        : `${defenderName} held the line at ${territoryName}`,
      result.attackerVictory ? 'important' : 'notable',
    );

    if (result?.strengthExchanges?.length) {
      setLastBattleResult({
        exchanges: result.strengthExchanges,
        attackerName,
        defenderName,
        territory: territoryName,
      });
    }
  };

  const handleMove = (fromTerritoryId: string, toTerritoryId: string, count: number) => {
    const result = moveConventionalArmies(fromTerritoryId, toTerritoryId, count);
    setActionRefreshKey(prev => prev + 1);

    const from = conventionalTerritories[fromTerritoryId];
    const to = conventionalTerritories[toTerritoryId];

    if (!result?.success) {
      toast({
        title: 'Movement failed',
        description: result?.reason || 'Unable to redeploy forces between territories.',
      });
      return;
    }

    const origin = from?.name || 'Unknown Territory';
    const destination = to?.name || 'Unknown Territory';

    toast({
      title: 'Armies redeployed',
      description: `Moved ${count} forces from ${origin} to ${destination}`,
    });

    addNewsItem('military', `${origin} forces repositioned to ${destination}`, 'notable');
  };

  const handleProxyEngagement = (territoryId: string, opposingId: string) => {
    resolveConventionalProxyEngagement(territoryId, localPlayer.id, opposingId);
  };

  const handlePlaceReinforcements = (territoryId: string, count: number) => {
    placeConventionalReinforcements(localPlayer.id, territoryId, count);
  };

  // Count active conflicts for badge
  const activeWarsCount = player.activeWars?.length || 0;
  const unreadPeaceOffers = player.peaceOffers?.filter(offer => offer.toNationId === player.id).length || 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-slate-900/80 border border-cyan-500/30 mb-6">
        <TabsTrigger
          value="council"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 relative"
        >
          <ScrollText className="h-4 w-4 mr-2" />
          <span className="font-mono text-xs">COUNCIL</span>
          {(activeWarsCount > 0 || unreadPeaceOffers > 0) && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
              {activeWarsCount + unreadPeaceOffers}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="conventional"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
        >
          <Shield className="h-4 w-4 mr-2" />
          <span className="font-mono text-xs">CONV</span>
        </TabsTrigger>
        <TabsTrigger
          value="order-of-battle"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
        >
          <Swords className="h-4 w-4 mr-2" />
          <span className="font-mono text-xs">OOB</span>
        </TabsTrigger>
        <TabsTrigger
          value="outliner"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
        >
          <ScrollText className="h-4 w-4 mr-2" />
          <span className="font-mono text-xs">OUTLINER</span>
        </TabsTrigger>
        <TabsTrigger
          value="summary"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
        >
          <Swords className="h-4 w-4 mr-2" />
          <span className="font-mono text-xs">SUMMARY</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="council" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <WarCouncilPanel
          player={player}
          nations={nations}
          currentTurn={currentTurn}
          onDeclareWar={onDeclareWar}
          onOfferPeace={onOfferPeace}
          onAcceptPeace={onAcceptPeace}
          onRejectPeace={onRejectPeace}
        />
      </TabsContent>

      <TabsContent value="conventional" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="space-y-6">
          {lastBattleResult && (
            <div className="rounded-lg border border-orange-500/40 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-orange-300 uppercase tracking-wider">
                  Last Battle: {lastBattleResult.territory}
                </div>
                <button
                  onClick={() => setLastBattleResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors uppercase"
                >
                  Clear
                </button>
              </div>
              <BattleStrengthSummary
                exchanges={lastBattleResult.exchanges}
                attackerName={lastBattleResult.attackerName}
                defenderName={lastBattleResult.defenderName}
              />
            </div>
          )}

        <ConventionalForcesPanel
          templates={templates}
          territories={territoryList}
          profile={profile}
          onTrain={handleTrain}
          researchUnlocks={localPlayer.researched}
          playerPopulation={localPlayer.population}
          availableReinforcements={availableReinforcements}
          playerId={localPlayer.id}
        />

        <TerritoryMapPanel
          key={actionRefreshKey}
          territories={territoryList}
          onAttack={handleAttack}
          onMove={handleMove}
          onProxyEngagement={handleProxyEngagement}
          availableReinforcements={availableReinforcements}
          onPlaceReinforcements={handlePlaceReinforcements}
          playerId={localPlayer.id}
        />

          {recentLogs.length > 0 && (
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4">
              <div className="text-sm font-semibold text-cyan-300 uppercase tracking-wider mb-3">
                Recent Engagements
              </div>
              <div className="space-y-2">
                {recentLogs.map((log, idx) => {
                  const attackerNation = nations.find(n => n.id === log.attackerNationId);
                  const defenderNation = nations.find(n => n.id === log.defenderNationId);
                  const territory = conventionalTerritories[log.territoryId];
                  const attackerCasualties = log.attackerCasualties ?? (log.attackerNationId
                    ? log.casualties?.[log.attackerNationId]
                    : 0) ?? 0;
                  const defenderCasualties = log.defenderCasualties ?? (log.defenderNationId
                    ? log.casualties?.[log.defenderNationId]
                    : 0) ?? 0;
                  const rounds = log.rounds ?? log.strengthExchanges?.length;

                  return (
                    <div
                      key={idx}
                      className="text-xs border border-cyan-500/10 bg-slate-900/40 rounded p-2"
                      >
                      <div className="text-slate-300">
                        <span className="text-orange-300 font-semibold">
                          {attackerNation?.name || 'Unknown'}
                        </span>
                        {' vs '}
                        <span className="text-cyan-300 font-semibold">
                          {defenderNation?.name || 'Unknown'}
                        </span>
                        {' at '}
                        <span className="text-slate-400">{territory?.name || 'Unknown Territory'}</span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Casualties: Attacker {attackerCasualties} | Defender {defenderCasualties}
                        {rounds ? ` • ${rounds} rounds` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="summary" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4">
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                {activeWarsCount}
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Active Wars</div>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4">
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                {playerTerritories.length}
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Controlled Territories</div>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4">
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                {totalArmies}
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">Total Armies</div>
            </div>
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4">
            <div className="text-sm font-semibold text-cyan-300 uppercase tracking-wider mb-4">
              Military Overview
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reinforcements Remaining (Turn {currentTurn}):</span>
                <span className="text-cyan-300 font-mono">{availableReinforcements}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Casus Belli Available:</span>
                <span className="text-cyan-300 font-mono">
                  {player.casusBelli?.filter(cb => !cb.used).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Peace Offers Pending:</span>
                <span className="text-cyan-300 font-mono">
                  {player.peaceOffers?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {recentLogs.length > 0 && (
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4">
              <div className="text-sm font-semibold text-cyan-300 uppercase tracking-wider mb-3">
                Recent Military Activity
              </div>
              <div className="space-y-2">
                {recentLogs.slice(0, 5).map((log, idx) => {
                  const attackerNation = nations.find(n => n.id === log.attackerNationId);
                  const defenderNation = nations.find(n => n.id === log.defenderNationId);
                  const territory = conventionalTerritories[log.territoryId];
                  const attackerCasualties = log.attackerCasualties ?? (log.attackerNationId
                    ? log.casualties?.[log.attackerNationId]
                    : 0) ?? 0;
                  const defenderCasualties = log.defenderCasualties ?? (log.defenderNationId
                    ? log.casualties?.[log.defenderNationId]
                    : 0) ?? 0;
                  const totalCasualties = attackerCasualties + defenderCasualties;
                  const rounds = log.rounds ?? log.strengthExchanges?.length;
                  const isPlayerInvolved =
                    log.attackerNationId === localPlayer.id ||
                    log.defenderNationId === localPlayer.id;

                  return (
                    <div
                      key={idx}
                      className={`text-xs border rounded p-2 ${
                        isPlayerInvolved
                          ? 'border-cyan-500/30 bg-cyan-500/5'
                          : 'border-cyan-500/10 bg-slate-900/40'
                      }`}
                    >
                      <div className="text-slate-300">
                        <span className="text-orange-300 font-semibold">
                          {attackerNation?.name || 'Unknown'}
                        </span>
                        {' attacked '}
                        <span className="text-cyan-300 font-semibold">
                          {defenderNation?.name || 'Unknown'}
                        </span>
                        {' at '}
                        <span className="text-slate-400">{territory?.name || 'Unknown'}</span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Casualties: {totalCasualties} total
                        {rounds ? ` • ${rounds} rounds` : ''}
                        {log.outcome && ` • ${log.outcome}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Order of Battle Tab */}
      <TabsContent value="order-of-battle" className="mt-4">
        <div className="max-h-[60vh] overflow-y-auto">
          {armyGroups.length > 0 ? (
            <OrderOfBattlePanel groups={armyGroups} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No army groups organized yet.</p>
              <p className="text-sm mt-2">Create groups to follow frontlines and supply status.</p>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Strategic Outliner Tab */}
      <TabsContent value="outliner" className="mt-4">
        <div className="max-h-[60vh] overflow-y-auto">
          {strategicOutlinerGroups.length > 0 ? (
            <StrategicOutliner
              groups={strategicOutlinerGroups}
              collapsed={isOutlinerCollapsed}
              onToggleCollapse={onOutlinerToggle}
              hotkeys={{ toggle: 'O', focus: 'Shift+O' }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No strategic overview available.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default ConsolidatedWarModal;
