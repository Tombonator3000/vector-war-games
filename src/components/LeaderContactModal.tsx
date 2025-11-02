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

  // Mock agendas (in real implementation, get from nation.agendas)
  const knownAgendas: Agenda[] = useMemo(() => {
    // This would come from the actual agenda system
    return [];
  }, [targetNation]);

  // Mock recent events (in real implementation, get from diplomatic history)
  const recentEvents: DiplomaticEvent[] = useMemo(() => {
    // This would come from the actual diplomatic history
    return [];
  }, [playerNation, targetNation]);

  // Available actions
  const availableActions: DiplomaticAction[] = useMemo(() => {
    const actions: DiplomaticAction[] = [
      {
        id: 'propose-deal',
        label: 'Propose Deal',
        type: 'propose-deal',
        enabled: true,
      },
    ];

    if (favors > 0) {
      actions.push({
        id: 'call-favor',
        label: 'Call in Favor',
        type: 'make-request',
        enabled: true,
        cost: { favors: 1 },
      });
    }

    if (relationship < -25) {
      actions.push({
        id: 'apologize',
        label: 'Apologize',
        type: 'apologize',
        enabled: true,
        cost: { diplomaticInfluence: 20 },
      });
    }

    actions.push({
      id: 'discuss',
      label: 'Discuss Relations',
      type: 'discuss',
      enabled: true,
    });

    return actions;
  }, [relationship, favors]);

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
              leaderName={targetNation.leaderName || 'Unknown Leader'}
              nationName={targetNation.name}
              mood={mood}
              size="lg"
              relationship={relationship}
              trust={trust}
              showTooltip={false}
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {targetNation.leaderName || 'Unknown Leader'}
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

            {/* Known Agendas */}
            {knownAgendas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Known Agendas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {knownAgendas.map((agenda) => (
                    <div
                      key={agenda.id}
                      className="p-3 rounded-lg border bg-accent/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{agenda.name}</span>
                        <Badge variant={agenda.type === 'primary' ? 'default' : 'secondary'}>
                          {agenda.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agenda.description}
                      </p>
                    </div>
                  ))}
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
              </CardHeader>
              <CardContent className="space-y-2">
                {availableActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full justify-between"
                    disabled={!action.enabled}
                    onClick={() => {
                      if (action.type === 'propose-deal') {
                        handleStartNegotiation();
                      } else if (action.type === 'make-request' && onMakeRequest) {
                        onMakeRequest(action.id);
                      } else if (action.type === 'discuss' && onDiscuss) {
                        onDiscuss();
                      }
                    }}
                  >
                    <span>{action.label}</span>
                    {action.cost && (
                      <span className="text-xs text-muted-foreground">
                        {action.cost.favors && `${action.cost.favors} favor(s)`}
                        {action.cost.diplomaticInfluence && `${action.cost.diplomaticInfluence} DIP`}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
