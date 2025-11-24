import { useMemo, useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Nation } from '@/types/game';
import type { CasusBelli, WarState, PeaceOffer } from '@/types/casusBelli';
import { getWarDeclarationSummary } from '@/lib/casusBelliIntegration';
import { WAR_JUSTIFICATION_THRESHOLDS } from '@/types/casusBelli';

const casusBelliTypeHints: Partial<Record<CasusBelli['type'], string>> = {
  'defensive-pact': 'Ally attacked — honor the pact and join their defense.',
  'liberation-war': 'Free occupied territories or populations under foreign control.',
  'regime-change': 'Dismantle a hostile or unstable regime before it escalates.',
  'punitive-expedition': 'Punish treaty breakers and deter further violations.',
  'council-authorized': 'Backed by an international council resolution.',
  'leader-special': 'Uniquely empowered by your leader’s special authority.',
};

interface WarCouncilPanelProps {
  player: Nation;
  nations: Nation[];
  currentTurn: number;
  onDeclareWar: (targetNationId: string, casusBelliId: string) => void;
  onOfferPeace: (warId: string) => void;
  onAcceptPeace: (offerId: string) => void;
  onRejectPeace: (offerId: string) => void;
}

function getNationName(nations: Nation[], nationId: string): string {
  return nations.find((nation) => nation.id === nationId)?.name ?? 'Unknown Nation';
}

function renderJustificationBadge(justification: number) {
  if (justification >= WAR_JUSTIFICATION_THRESHOLDS.VALID) {
    return <Badge className="bg-emerald-500/20 text-emerald-300">Valid</Badge>;
  }

  if (justification >= WAR_JUSTIFICATION_THRESHOLDS.WEAK) {
    return <Badge className="bg-yellow-500/20 text-yellow-300">Weak</Badge>;
  }

  return <Badge className="bg-red-500/20 text-red-300">Invalid</Badge>;
}

const WarCouncilPanelComponent = ({
  player,
  nations,
  currentTurn,
  onDeclareWar,
  onOfferPeace,
  onAcceptPeace,
  onRejectPeace,
}: WarCouncilPanelProps) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCasusBelliId, setSelectedCasusBelliId] = useState<string | null>(null);

  const targets = useMemo(
    () => nations.filter((nation) => !nation.isPlayer && !nation.eliminated),
    [nations]
  );

  const availableCasusBelli = useMemo<CasusBelli[]>(() => {
    if (!selectedTargetId) {
      return (player.casusBelli || []).filter((cb) => !cb.used);
    }

    return (player.casusBelli || []).filter(
      (cb) => cb.againstNationId === selectedTargetId && !cb.used
    );
  }, [player.casusBelli, selectedTargetId]);

  const selectedTarget = selectedTargetId
    ? nations.find((nation) => nation.id === selectedTargetId)
    : undefined;

  const warSummary = useMemo(() => {
    if (!selectedTarget) return null;
    return getWarDeclarationSummary(player, selectedTarget, currentTurn);
  }, [player, selectedTarget, currentTurn]);

  const activeWars = player.activeWars || [];
  const peaceOffers = player.peaceOffers || [];

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/70 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-200">Declare War</CardTitle>
          <CardDescription className="text-slate-400">
            Select a nation and an available Casus Belli to formalize a declaration of war.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[2fr_3fr]">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Potential Targets
              </div>
              <ScrollArea className="h-52 rounded border border-cyan-500/20">
                <div className="p-2 space-y-2">
                  {targets.length === 0 ? (
                    <p className="text-sm text-slate-400">No eligible targets available.</p>
                  ) : (
                    targets.map((nation) => {
                      const isSelected = nation.id === selectedTargetId;
                      return (
                        <button
                          key={nation.id}
                          type="button"
                          onClick={() => {
                            setSelectedTargetId(nation.id);
                            setSelectedCasusBelliId(null);
                          }}
                          className={`w-full rounded border px-3 py-2 text-left transition ${
                            isSelected
                              ? 'border-cyan-400/80 bg-cyan-500/10 text-cyan-100'
                              : 'border-transparent bg-slate-800/60 text-slate-200 hover:border-cyan-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{nation.name}</span>
                            {nation.activeWars && nation.activeWars.length > 0 && (
                              <Badge className="bg-orange-500/20 text-orange-300">
                                {nation.activeWars.length} war
                                {nation.activeWars.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            DEFCON Impact: {nation.defense ?? 0} • Missiles: {nation.missiles}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Available Casus Belli
              </div>
              <ScrollArea className="h-52 rounded border border-cyan-500/20">
                <div className="p-2 space-y-2">
                  {availableCasusBelli.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No unused Casus Belli available for the selected target.
                    </p>
                  ) : (
                    availableCasusBelli.map((cb) => {
                      const isSelected = cb.id === selectedCasusBelliId;
                      return (
                        <button
                          key={cb.id}
                          type="button"
                          onClick={() => setSelectedCasusBelliId(cb.id)}
                          className={`w-full rounded border px-3 py-2 text-left transition ${
                            isSelected
                              ? 'border-cyan-400/80 bg-cyan-500/10 text-cyan-100'
                              : 'border-transparent bg-slate-800/60 text-slate-200 hover:border-cyan-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold capitalize">{cb.type.replace(/-/g, ' ')}</span>
                            {renderJustificationBadge(cb.justification)}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">{cb.description}</div>
                          {casusBelliTypeHints[cb.type] && (
                            <div className="text-[11px] text-cyan-200/70 mt-1">
                              {casusBelliTypeHints[cb.type]}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-1">
                            Public Support: {cb.publicSupport}%
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {selectedTarget && warSummary && (
            <div className="rounded border border-cyan-500/20 bg-slate-900/60 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-300 font-semibold">
                    Strategic Outlook vs {selectedTarget.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {warSummary.recommendedAction}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                    Justification: {Math.round(warSummary.validation.justificationScore)}
                  </Badge>
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                    Available CBs: {warSummary.validation.availableCasusBelli.length}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              disabled={!selectedTargetId || !selectedCasusBelliId}
              onClick={() => {
                if (selectedTargetId && selectedCasusBelliId) {
                  onDeclareWar(selectedTargetId, selectedCasusBelliId);
                  setSelectedCasusBelliId(null);
                }
              }}
            >
              Declare War
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/70 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-200">Active Wars</CardTitle>
          <CardDescription className="text-slate-400">
            Monitor war progress, war score, and manage peace negotiations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeWars.length === 0 ? (
            <p className="text-sm text-slate-400">You are not currently engaged in any wars.</p>
          ) : (
            activeWars.map((war: WarState) => {
              const opponentId =
                war.attackerNationId === player.id ? war.defenderNationId : war.attackerNationId;
              const opponentName = getNationName(nations, opponentId);
              const isAttacker = war.attackerNationId === player.id;
              const myScore = isAttacker ? war.attackerWarScore : war.defenderWarScore;
              const enemyScore = isAttacker ? war.defenderWarScore : war.attackerWarScore;

              return (
                <div
                  key={war.id}
                  className="rounded border border-cyan-500/20 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-semibold">
                        {opponentName}
                      </div>
                      <div className="text-xs text-slate-400">
                        War Goals: {war.warGoals.map((goal) => goal.description).join(', ') || 'Unspecified'}
                      </div>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-300 uppercase">
                      {war.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>Your War Score ({isAttacker ? 'Attacker' : 'Defender'})</span>
                      <span>{myScore}</span>
                    </div>
                    <Progress value={myScore} className="h-2 bg-slate-800" />

                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>Enemy War Score</span>
                      <span>{enemyScore}</span>
                    </div>
                    <Progress value={enemyScore} className="h-2 bg-slate-800" />
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOfferPeace(war.id)}>
                      Offer White Peace
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/70 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-200">Peace Offers</CardTitle>
          <CardDescription className="text-slate-400">
            Review incoming and outgoing peace offers related to current conflicts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {peaceOffers.length === 0 ? (
            <p className="text-sm text-slate-400">No active peace negotiations at this time.</p>
          ) : (
            peaceOffers.map((offer: PeaceOffer) => {
              const isIncoming = offer.toNationId === player.id;
              const counterpartyId = isIncoming ? offer.fromNationId : offer.toNationId;
              const counterpartyName = getNationName(nations, counterpartyId);
              const expiresIn = offer.expiresAt - currentTurn;

              return (
                <div
                  key={offer.id}
                  className="rounded border border-cyan-500/20 bg-slate-900/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-semibold">
                        {isIncoming ? 'Incoming' : 'Outgoing'} offer with {counterpartyName}
                      </div>
                      <div className="text-xs text-slate-400">
                        Terms: {offer.terms.type.replace(/-/g, ' ')}
                        {offer.terms.treatyDuration
                          ? ` • Truce Duration: ${offer.terms.treatyDuration} turns`
                          : ''}
                      </div>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-200">Expires in {Math.max(expiresIn, 0)} turns</Badge>
                  </div>

                  {offer.message && (
                    <div className="text-xs text-slate-300 border border-cyan-500/10 rounded p-2 bg-slate-900/80">
                      “{offer.message}”
                    </div>
                  )}

                  {isIncoming ? (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={() => onAcceptPeace(offer.id)}>
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRejectPeace(offer.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Badge className="bg-indigo-500/20 text-indigo-300">Awaiting response</Badge>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Separator className="bg-cyan-500/20" />

      <div className="text-xs text-slate-500">
        Casus Belli without sufficient justification may incur severe diplomatic penalties. Ensure
        domestic support and international legitimacy before committing to war.
      </div>
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const WarCouncilPanel = memo(WarCouncilPanelComponent);
export default WarCouncilPanel;
