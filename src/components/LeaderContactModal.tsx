/**
 * Leader Contact Modal
 *
 * Main interface for contacting and interacting with a nation's leader.
 * Features:
 * - Leader information display
 * - Relationship, trust, and favor metrics
 * - Known agendas
 * - Recent diplomatic events
 * - Action buttons (Propose Deal, Make Request, etc.)
 * - Launches NegotiationInterface for deals
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LeaderAvatarWithTooltip } from './LeaderAvatar';
import { NegotiationInterface } from './NegotiationInterface';
import { getLeaderImage } from '@/lib/leaderImages';
import type { Nation } from '@/types/game';
import type {
  LeaderContactState,
  LeaderMood,
  VisibleLeaderInfo,
  DiplomaticAction,
  DiplomaticEvent,
  Agenda,
  NegotiationState,
  CounterOffer,
} from '@/types/negotiation';
import { createNegotiation } from '@/lib/negotiationUtils';
import { getRelationship } from '@/lib/relationshipUtils';
import { getTrust, getFavors } from '@/types/trustAndFavors';
import {
  getNationAgendas,
  checkAgendaViolations,
  getAgendaFeedback,
} from '@/lib/agendaSystem';
import {
  Handshake,
  TrendingUp,
  TrendingDown,
  Heart,
  Shield,
  Star,
  AlertTriangle,
  Clock,
  MessageSquare,
  Scale,
  Gift,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';

interface LeaderContactModalProps {
  open: boolean;
  onClose: () => void;
  playerNation: Nation;
  targetNation: Nation;
  allNations: Nation[];
  currentTurn: number;
  onProposeDeal?: (negotiation: NegotiationState) => void;
  onMakeRequest?: (action: string) => void;
  onDiscuss?: () => void;
}

/**
 * Calculate leader mood based on relationship
 */
function calculateMood(relationship: number): LeaderMood {
  if (relationship < -50) return 'hostile';
  if (relationship < -25) return 'unfriendly';
  if (relationship < 0) return 'cautious';
  if (relationship < 25) return 'neutral';
  if (relationship < 50) return 'friendly';
  if (relationship < 75) return 'cordial';
  return 'allied';
}

/**
 * Get mood description
 */
function getMoodDescription(mood: LeaderMood): string {
  switch (mood) {
    case 'hostile':
      return 'This leader is openly hostile towards you';
    case 'unfriendly':
      return 'Relations are strained and tense';
    case 'cautious':
      return 'This leader is wary and cautious';
    case 'neutral':
      return 'Relations are neutral';
    case 'friendly':
      return 'This leader views you favorably';
    case 'cordial':
      return 'Relations are warm and cordial';
    case 'allied':
      return 'You are close allies';
  }
}

/**
 * Format diplomatic event for display
 */
function formatEvent(event: DiplomaticEvent): string {
  return `Turn ${event.turn}: ${event.description}`;
}

/**
 * LeaderContactModal Component
 */
export function LeaderContactModal({
  open,
  onClose,
  playerNation,
  targetNation,
  allNations,
  currentTurn,
  onProposeDeal,
  onMakeRequest,
  onDiscuss,
}: LeaderContactModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'negotiate'>('overview');
  const [activeNegotiation, setActiveNegotiation] = useState<NegotiationState | null>(null);

  // Calculate relationship metrics
  const relationship = getRelationship(playerNation, targetNation.id);
  const trust = getTrust(playerNation, targetNation.id);
  const favors = getFavors(playerNation, targetNation.id);
  const mood = calculateMood(relationship);

  // Get nation's agendas and check for violations (Phase 4: Agenda System)
  const { agendas, violations, agendaFeedback } = useMemo(() => {
    const nationAgendas = getNationAgendas(targetNation);
    const gameState = { nations: allNations, turn: currentTurn } as any;
    const agendaViolations = checkAgendaViolations(playerNation, targetNation, gameState);
    const feedback = getAgendaFeedback(playerNation, targetNation, gameState);

    return {
      agendas: nationAgendas,
      violations: agendaViolations,
      agendaFeedback: feedback,
    };
  }, [targetNation, playerNation, allNations, currentTurn]);

  const feedbackMessages = useMemo(() => agendaFeedback.all, [agendaFeedback]);
  const violationAgendaIds = useMemo(
    () => new Set(violations.map(v => v.agenda.id)),
    [violations]
  );

  // Mock recent events (in real implementation, get from diplomatic history)
  const recentEvents: DiplomaticEvent[] = useMemo(() => {
    // This would come from the actual diplomatic history
    return [];
  }, [playerNation, targetNation]);

  // Get player's diplomatic influence points
  const playerDIP = playerNation.diplomaticInfluence?.points || 0;

  // Available actions - comprehensive diplomatic action list with clear descriptions
  const availableActions: DiplomaticAction[] = useMemo(() => {
    const actions: DiplomaticAction[] = [
      {
        id: 'propose-deal',
        label: 'Propose Deal',
        type: 'propose-deal',
        enabled: true,
        description: 'Open multi-item negotiation interface to propose trades, treaties, and agreements.',
      },
      {
        id: 'build-trust',
        label: 'Build Trust',
        type: 'build-trust',
        enabled: playerDIP >= 10,
        cost: { diplomaticInfluence: 10 },
        description: 'Costs 10 DIP. Increases trust by +10 and relationship by +5. Demonstrates goodwill and reliability to strengthen diplomatic ties.',
      },
      {
        id: 'grant-favor',
        label: 'Grant Favor',
        type: 'grant-favor',
        enabled: playerDIP >= 12,
        cost: { diplomaticInfluence: 12 },
        description: 'Costs 12 DIP. Grants a favor that they can call in later. Increases relationship by +3. Build leverage for future negotiations.',
      },
      {
        id: 'call-favor',
        label: 'Call in Favor',
        type: 'make-request',
        enabled: favors > 0 && playerDIP >= 5,
        cost: { diplomaticInfluence: 5, favors: 1 },
        description: `Costs 5 DIP. Requires ${favors} favor(s) owed to you. Request assistance based on past help you provided.`,
      },
      {
        id: 'make-promise',
        label: 'Make Promise',
        type: 'make-promise',
        enabled: playerDIP >= 10,
        cost: { diplomaticInfluence: 10 },
        description: 'Costs 10 DIP. Make a binding promise (no attack, defense support, no nukes, etc.). Increases trust by +10-15. WARNING: Breaking promises damages trust by -25 to -40.',
      },
      {
        id: 'verify-promise',
        label: 'Verify Promise',
        type: 'verify-promise',
        enabled: playerDIP >= 15,
        cost: { diplomaticInfluence: 15 },
        description: 'Costs 15 DIP. Request proof that they are honoring their promises to you. Ensures accountability and builds confidence.',
      },
      {
        id: 'apologize',
        label: 'Formal Apology',
        type: 'apologize',
        enabled: playerDIP >= 25,
        cost: { diplomaticInfluence: 25 },
        description: 'Costs 25 DIP. Formally apologize for past wrongdoings. Resolves active grievances and improves relationship by +15-25. Shows willingness to reconcile.',
      },
      {
        id: 'reparations',
        label: 'Offer Reparations',
        type: 'reparations',
        enabled: playerDIP >= 30,
        cost: { diplomaticInfluence: 30 },
        description: 'Costs 30 DIP + resources. Provide material compensation for harm done. Resolves severe grievances and restores trust by +20-30. Demonstrates commitment to making amends.',
      },
      {
        id: 'discuss',
        label: 'Discuss Relations',
        type: 'discuss',
        enabled: true,
        description: 'General diplomatic discussion. Learn about their concerns, interests, and stance on various issues. No cost.',
      },
    ];

    return actions;
  }, [relationship, favors, playerDIP]);

  // Handle start negotiation
  const handleStartNegotiation = () => {
    const negotiation = createNegotiation(
      playerNation.id,
      targetNation.id,
      currentTurn
    );
    setActiveNegotiation(negotiation);
    setActiveTab('negotiate');
  };

  // Handle propose deal
  const handleProposeDeal = () => {
    if (activeNegotiation && onProposeDeal) {
      onProposeDeal(activeNegotiation);
      setActiveNegotiation(null);
      onClose();
    }
  };

  // Handle accept counter offer
  const handleAcceptCounterOffer = (counterOffer: CounterOffer) => {
    if (activeNegotiation) {
      const updatedNegotiation: NegotiationState = {
        ...activeNegotiation,
        offerItems: counterOffer.offerItems,
        requestItems: counterOffer.requestItems,
      };
      setActiveNegotiation(updatedNegotiation);
    }
  };

  // Handle cancel negotiation
  const handleCancelNegotiation = () => {
    setActiveNegotiation(null);
    setActiveTab('overview');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <LeaderAvatarWithTooltip
              leaderName={targetNation.leaderName || targetNation.leader || 'Unknown Leader'}
              nationName={targetNation.name}
              mood={mood}
              size="xl"
              relationship={relationship}
              trust={trust}
              showTooltip={false}
              imageUrl={getLeaderImage(targetNation.leaderName || targetNation.leader)}
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {targetNation.leaderName || targetNation.leader || 'Unknown Leader'}
              </DialogTitle>
              <DialogDescription className="text-base">
                Leader of {targetNation.name}
              </DialogDescription>
              <Badge variant="outline" className="mt-1">
                {targetNation.aiPersonality || 'Balanced'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="negotiate" disabled={!activeNegotiation}>
              {activeNegotiation ? 'Negotiate' : 'Negotiate'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Mood & Relationship */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Relationship Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mood */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Mood</span>
                    <Badge variant="outline" className="capitalize">
                      {mood}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getMoodDescription(mood)}
                  </p>
                </div>

                <Separator />

                {/* Relationship */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Relationship</span>
                    <span className={cn(
                      'text-lg font-bold',
                      relationship > 50 ? 'text-green-400' :
                      relationship > 0 ? 'text-blue-400' :
                      relationship > -50 ? 'text-yellow-400' :
                      'text-red-400'
                    )}>
                      {relationship > 0 ? '+' : ''}{relationship}
                    </span>
                  </div>
                  <Progress
                    value={((relationship + 100) / 200) * 100}
                    className="h-2"
                  />
                </div>

                {/* Trust */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Trust</span>
                    <span className="text-lg font-bold">{trust}/100</span>
                  </div>
                  <Progress value={trust} className="h-2" />
                </div>

                {/* Favors */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Favor Balance</span>
                    <span className={cn(
                      'text-lg font-bold',
                      favors > 0 ? 'text-green-400' :
                      favors < 0 ? 'text-red-400' :
                      'text-gray-400'
                    )}>
                      {favors > 0 ? `+${favors}` : favors}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {favors > 0
                      ? `${targetNation.name} owes you ${favors} favor(s)`
                      : favors < 0
                      ? `You owe ${targetNation.name} ${Math.abs(favors)} favor(s)`
                      : 'No outstanding favors'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Leader Traits (Agendas) - Phase 4 */}
            {agendas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Leader Traits
                  </CardTitle>
                  <CardDescription>
                    Understanding their values helps in diplomacy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agendas.map((agenda) => {
                    const agendaSpecificFeedback = agendaFeedback.byAgenda[agenda.id] || {
                      positive: [],
                      negative: [],
                      neutral: [],
                    };
                    const isViolated = violationAgendaIds.has(agenda.id);
                    const hasBonus = agendaSpecificFeedback.positive.length > 0;
                    const violationDetail = agendaSpecificFeedback.negative[0];
                    const positiveDetail = agendaSpecificFeedback.positive[0];

                    if (!agenda.isRevealed) {
                      // Hidden agenda - show placeholder with reveal progress
                      // Calculate progress towards revelation
                      const firstContact = targetNation.firstContactTurn?.[playerNation.id] || currentTurn;
                      const turnsKnown = currentTurn - firstContact;
                      const relationship = getRelationship(targetNation, playerNation.id);
                      const trust = getTrust(targetNation, playerNation.id);
                      const hasAlliance = targetNation.alliances?.includes(playerNation.id) || false;

                      // Calculate progress based on multiple conditions (max 100%)
                      let progress = 0;
                      let progressLabel = 'Unknown';
                      let progressHint = '';

                      // Condition 1: High relationship + good trust + time (relationship > 25 && trust > 60 && turnsKnown > 10)
                      if (relationship > 25 && trust > 60) {
                        progress = Math.min(100, (turnsKnown / 10) * 100);
                        progressLabel = `${Math.round(progress)}% - ${turnsKnown}/10 turns`;
                        progressHint = 'Keep building trust and relationship!';
                      }
                      // Condition 2: Alliance exists for sufficient time (turnsKnown > 15)
                      else if (hasAlliance) {
                        progress = Math.min(100, (turnsKnown / 15) * 100);
                        progressLabel = `${Math.round(progress)}% - ${turnsKnown}/15 turns with alliance`;
                        progressHint = 'Alliance will reveal traits over time';
                      }
                      // Condition 3: Very long contact (turnsKnown > 30)
                      else {
                        progress = Math.min(100, (turnsKnown / 30) * 100);
                        progressLabel = `${Math.round(progress)}% - ${turnsKnown}/30 turns known`;
                        progressHint = 'Build relationship (+25) or trust (+60) to speed up';
                      }

                      return (
                        <div
                          key={agenda.id}
                          className="p-3 rounded-lg border-2 border-dashed bg-accent/20 opacity-80"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">
                              Unknown Trait
                            </span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              Hidden
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Build a stronger relationship to discover this trait
                          </p>

                          {/* Progress towards revelation */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Discovery Progress</span>
                              <span className="font-medium text-foreground">{progressLabel}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground italic">
                              {progressHint}
                            </p>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Tips: High relationship (25+), trust (60+), or alliance (15 turns)
                          </p>
                        </div>
                      );
                    }

                    // Revealed agenda - show full details
                    return (
                      <div
                        key={agenda.id}
                        className={cn(
                          "p-3 rounded-lg border-2",
                          isViolated
                            ? "bg-red-900/20 border-red-500/50"
                            : hasBonus
                            ? "bg-green-900/20 border-green-500/50"
                            : "bg-accent/50 border-accent"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4" />
                          <span className="font-medium">{agenda.name}</span>
                          <Badge
                            variant={agenda.type === 'primary' ? 'default' : 'secondary'}
                            className="ml-auto text-xs"
                          >
                            {agenda.type === 'primary' ? '⭐ Primary' : '🔍 Revealed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {agenda.description}
                        </p>

                        {/* Show violation warning */}
                        {isViolated && (
                          <div className="flex items-start gap-2 mt-2 p-2 rounded bg-red-500/20">
                            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-red-400">
                                Violation Detected
                              </p>
                              <p className="text-xs text-red-300 mt-0.5">
                                {violationDetail || "Your actions conflict with this leader's values"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Show positive status */}
                        {hasBonus && !isViolated && (
                          <div className="flex items-start gap-2 mt-2 p-2 rounded bg-green-500/20">
                            <Star className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-green-300">
                              {positiveDetail || 'Your actions align with this leader\'s values'}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Show feedback messages if any */}
                  {feedbackMessages.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-900/20 border border-blue-500/50">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-blue-300 mb-1">
                            Leader's Perspective:
                          </p>
                          {feedbackMessages.map((msg, i) => (
                            <p key={i} className="text-xs text-blue-200 italic">
                              "{msg}"
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Diplomatic Actions
                </CardTitle>
                <CardDescription>
                  Available: {playerDIP} DIP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableActions.map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      "border rounded-lg p-3 transition-all",
                      action.enabled
                        ? "bg-accent/50 hover:bg-accent cursor-pointer border-accent"
                        : "bg-muted/30 border-muted cursor-not-allowed opacity-50"
                    )}
                    onClick={() => {
                      if (!action.enabled) return;
                      if (action.type === 'propose-deal') {
                        handleStartNegotiation();
                      } else if (action.type === 'make-request' && onMakeRequest) {
                        onMakeRequest(action.id);
                      } else if (action.type === 'discuss' && onDiscuss) {
                        onDiscuss();
                      } else if (onMakeRequest) {
                        // Handle other diplomatic actions
                        onMakeRequest(action.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-sm">{action.label}</span>
                      {action.cost && (
                        <div className="flex gap-2 text-xs">
                          {action.cost.diplomaticInfluence && (
                            <Badge
                              variant="outline"
                              className={cn(
                                playerDIP >= action.cost.diplomaticInfluence
                                  ? "border-green-500/50 text-green-400"
                                  : "border-red-500/50 text-red-400"
                              )}
                            >
                              {action.cost.diplomaticInfluence} DIP
                            </Badge>
                          )}
                          {action.cost.favors && (
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              {action.cost.favors} Favor(s)
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                    {!action.enabled && action.cost?.diplomaticInfluence && playerDIP < action.cost.diplomaticInfluence && (
                      <p className="text-xs text-red-400 mt-2">
                        Insufficient DIP (need {action.cost.diplomaticInfluence}, have {playerDIP})
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Events
                </CardTitle>
                <CardDescription>
                  Diplomatic events between you and {targetNation.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent diplomatic events
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentEvents.map((event, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 rounded-lg bg-accent/30"
                      >
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Turn {event.turn}
                          </p>
                        </div>
                        {event.relationshipChange !== undefined && (
                          <Badge
                            variant={event.relationshipChange > 0 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {event.relationshipChange > 0 ? '+' : ''}
                            {event.relationshipChange}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Negotiate Tab */}
          <TabsContent value="negotiate" className="mt-4">
            {activeNegotiation && (
              <NegotiationInterface
                negotiation={activeNegotiation}
                playerNation={playerNation}
                otherNation={targetNation}
                allNations={allNations}
                currentTurn={currentTurn}
                onUpdateNegotiation={setActiveNegotiation}
                onProposeDeal={handleProposeDeal}
                onAcceptCounterOffer={handleAcceptCounterOffer}
                onCancel={handleCancelNegotiation}
                isPlayerInitiator={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
