import { ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, Shield, ScrollText } from 'lucide-react';
import WarCouncilPanel from '@/components/WarCouncilPanel';
import type { Nation } from '@/types/game';
import type { LocalNation } from '@/state';
import { PlayerManager } from '@/state';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { TerritoryMapPanel } from '@/components/TerritoryMapPanel';
import { BattleResultDisplay } from '@/components/DiceRoller';
import { RESEARCH_LOOKUP } from '@/lib/gameConstants';
import type {
  TerritoryState,
  ConventionalUnitTemplate,
  EngagementLogEntry,
  NationConventionalProfile,
  DiceRollResult,
} from '@/hooks/useConventionalWarfare';
import { createDefaultNationConventionalProfile } from '@/hooks/useConventionalWarfare';

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
}: ConsolidatedWarModalProps): ReactNode {
  const [activeTab, setActiveTab] = useState('council');
  const localPlayer = PlayerManager.get() as LocalNation | null;
  const [lastBattleResult, setLastBattleResult] = useState<{
    diceRolls: DiceRollResult[];
    attackerName: string;
    defenderName: string;
    territory: string;
  } | null>(null);

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
    if (result?.success && result?.diceRolls) {
      const from = conventionalTerritories[fromTerritoryId];
      const to = conventionalTerritories[toTerritoryId];
      const attackerNation = nations.find(n => n.id === from?.controllingNationId);
      const defenderNation = nations.find(n => n.id === to?.controllingNationId);

      setLastBattleResult({
        diceRolls: result.diceRolls,
        attackerName: attackerNation?.name || 'Unknown',
        defenderName: defenderNation?.name || 'Unknown',
        territory: to?.name || 'Unknown Territory',
      });
    }
  };

  const handleMove = (fromTerritoryId: string, toTerritoryId: string, count: number) => {
    moveConventionalArmies(fromTerritoryId, toTerritoryId, count);
  };

  const handleProxyEngagement = (territoryId: string, sponsorId: string, opposingId: string) => {
    resolveConventionalProxyEngagement(territoryId, sponsorId, opposingId);
  };

  const handlePlaceReinforcements = (territoryId: string, count: number) => {
    placeConventionalReinforcements(localPlayer.id, territoryId, count);
  };

  // Count active conflicts for badge
  const activeWarsCount = player.activeWars?.length || 0;
  const unreadPeaceOffers = player.peaceOffers?.filter(offer => offer.toNationId === player.id).length || 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-slate-900/80 border border-cyan-500/30 mb-6">
        <TabsTrigger
          value="council"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 relative"
        >
          <ScrollText className="h-4 w-4 mr-2" />
          <span className="font-mono">WAR COUNCIL</span>
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
          <span className="font-mono">CONVENTIONAL</span>
        </TabsTrigger>
        <TabsTrigger
          value="summary"
          className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100"
        >
          <Swords className="h-4 w-4 mr-2" />
          <span className="font-mono">SUMMARY</span>
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
              <BattleResultDisplay
                diceRolls={lastBattleResult.diceRolls}
                attackerName={lastBattleResult.attackerName}
                defenderName={lastBattleResult.defenderName}
              />
            </div>
          )}

          <ConventionalForcesPanel
            templates={templates}
            profile={profile}
            availableReinforcements={availableReinforcements}
            playerTerritories={playerTerritories}
            onTrain={handleTrain}
            onPlaceReinforcements={handlePlaceReinforcements}
          />

          <TerritoryMapPanel
            territories={territoryList}
            onAttack={handleAttack}
            onMove={handleMove}
            onProxyEngagement={handleProxyEngagement}
            playerNationId={localPlayer.id}
            nations={nations}
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
                        Casualties: Attacker {log.attackerCasualties} | Defender {log.defenderCasualties}
                        {log.rounds && ` • ${log.rounds} rounds`}
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
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Available Reinforcements:</span>
                <span className="text-cyan-300 font-mono">{availableReinforcements}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Casus Belli Available:</span>
                <span className="text-cyan-300 font-mono">
                  {player.casusBelli?.filter(cb => !cb.used).length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
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
                        Casualties: {log.attackerCasualties + log.defenderCasualties} total
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
    </Tabs>
  );
}

export default ConsolidatedWarModal;
