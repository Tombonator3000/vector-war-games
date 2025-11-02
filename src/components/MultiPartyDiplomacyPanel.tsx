/**
 * Multi-Party Diplomacy Panel - FASE 3.4
 *
 * Interface for proposing and voting on multi-nation agreements.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Nation } from '@/types/game';
import type {
  MultiPartyAgreement,
  MultiPartyAgreementType,
  AgreementVote,
} from '@/types/multiPartyDiplomacy';
import {
  Users,
  Vote,
  Plus,
  Check,
  X,
  Clock,
  Shield,
  Swords,
  Handshake,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface MultiPartyDiplomacyPanelProps {
  playerNation: Nation;
  allNations: Nation[];
  agreements: MultiPartyAgreement[];
  currentTurn: number;
  onProposeAgreement: (type: MultiPartyAgreementType, participantIds: string[], targetIds?: string[]) => void;
  onVote: (agreementId: string, vote: 'yes' | 'no' | 'abstain') => void;
  className?: string;
}

/**
 * Multi-Party Diplomacy Panel Component
 */
export function MultiPartyDiplomacyPanel({
  playerNation,
  allNations,
  agreements,
  currentTurn,
  onProposeAgreement,
  onVote,
  className,
}: MultiPartyDiplomacyPanelProps) {
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<MultiPartyAgreementType>('multi-lateral-alliance');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([playerNation.id]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  // Filter agreements
  const activeAgreements = agreements.filter(a => a.status === 'passed');
  const pendingAgreements = agreements.filter(a =>
    (a.status === 'proposed' || a.status === 'voting') &&
    a.participantIds.includes(playerNation.id)
  );

  // Available nations for participation
  const availableNations = allNations.filter(n => !n.eliminated && n.id !== playerNation.id);

  // Get agreement type icon
  const getAgreementIcon = (type: MultiPartyAgreementType) => {
    switch (type) {
      case 'multi-lateral-alliance':
        return <Shield className="h-5 w-5 text-blue-400" />;
      case 'joint-war-declaration':
        return <Swords className="h-5 w-5 text-red-400" />;
      case 'coalition-pact':
        return <Users className="h-5 w-5 text-purple-400" />;
      case 'non-aggression-bloc':
        return <Handshake className="h-5 w-5 text-green-400" />;
      case 'trade-agreement':
        return <TrendingUp className="h-5 w-5 text-yellow-400" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'voting':
      case 'proposed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'failed':
      case 'broken':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Calculate vote progress
  const getVoteProgress = (agreement: MultiPartyAgreement) => {
    const yesVotes = Object.values(agreement.votes).filter(v => v.vote === 'yes').length;
    const totalVotes = agreement.participantIds.length;
    return {
      yesVotes,
      totalVotes,
      required: agreement.requiredVotes,
      percentage: (yesVotes / totalVotes) * 100,
    };
  };

  // Handle propose agreement
  const handlePropose = () => {
    if (selectedParticipants.length < 3) {
      alert('Multi-party agreements require at least 3 participants');
      return;
    }

    onProposeAgreement(selectedType, selectedParticipants, selectedTargets.length > 0 ? selectedTargets : undefined);
    setProposeDialogOpen(false);
    setSelectedParticipants([playerNation.id]);
    setSelectedTargets([]);
  };

  // Toggle participant selection
  const toggleParticipant = (nationId: string) => {
    if (selectedParticipants.includes(nationId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== nationId));
    } else {
      setSelectedParticipants([...selectedParticipants, nationId]);
    }
  };

  // Toggle target selection
  const toggleTarget = (nationId: string) => {
    if (selectedTargets.includes(nationId)) {
      setSelectedTargets(selectedTargets.filter(id => id !== nationId));
    } else {
      setSelectedTargets([...selectedTargets, nationId]);
    }
  };

  // Check if agreement needs target
  const needsTarget = (type: MultiPartyAgreementType) => {
    return ['joint-war-declaration', 'joint-embargo'].includes(type);
  };

  return (
    <>
      <Card className={cn('border-2', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-400" />
              Multi-Party Diplomacy
            </CardTitle>
            <Button size="sm" onClick={() => setProposeDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Propose Agreement
            </Button>
          </div>
          <CardDescription>
            Coordinate with multiple nations on joint agreements
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Pending Votes ({pendingAgreements.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeAgreements.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Votes */}
            <TabsContent value="pending" className="space-y-3 mt-4">
              {pendingAgreements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending agreements to vote on
                </div>
              ) : (
                pendingAgreements.map(agreement => {
                  const voteProgress = getVoteProgress(agreement);
                  const playerVote = agreement.votes[playerNation.id];
                  const turnsRemaining = agreement.votingDeadline - currentTurn;

                  return (
                    <Card key={agreement.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getAgreementIcon(agreement.type)}
                            {agreement.title}
                          </CardTitle>
                          <Badge variant="outline" className={cn('text-xs', getStatusColor(agreement.status))}>
                            {agreement.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {agreement.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Participants */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Participants ({agreement.participantIds.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {agreement.participantIds.map(id => {
                              const nation = allNations.find(n => n.id === id);
                              return nation ? (
                                <Badge key={id} variant="secondary" className="text-xs">
                                  {nation.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>

                        {/* Targets (if any) */}
                        {agreement.terms.targetNationIds && agreement.terms.targetNationIds.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Target Nations:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {agreement.terms.targetNationIds.map(id => {
                                const nation = allNations.find(n => n.id === id);
                                return nation ? (
                                  <Badge key={id} variant="destructive" className="text-xs">
                                    {nation.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Vote Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Vote Progress</span>
                            <span className="font-medium">
                              {voteProgress.yesVotes} / {voteProgress.required} needed
                            </span>
                          </div>
                          <Progress value={voteProgress.percentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {turnsRemaining} turns left
                            </span>
                            <span>
                              {Object.values(agreement.votes).length} / {voteProgress.totalVotes} voted
                            </span>
                          </div>
                        </div>

                        {/* Player's vote status */}
                        {playerVote ? (
                          <Alert className="py-2">
                            <Check className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              You voted: <strong>{playerVote.vote.toUpperCase()}</strong>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="default" className="py-2 bg-yellow-500/10 border-yellow-500/50">
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            <AlertDescription className="text-xs text-yellow-400">
                              Your vote is needed!
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>

                      {/* Vote buttons */}
                      {!playerVote && (
                        <CardFooter className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => onVote(agreement.id, 'yes')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Vote Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => onVote(agreement.id, 'no')}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Vote No
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onVote(agreement.id, 'abstain')}
                          >
                            Abstain
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Active Agreements */}
            <TabsContent value="active" className="space-y-3 mt-4">
              {activeAgreements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active multi-party agreements
                </div>
              ) : (
                activeAgreements.map(agreement => (
                  <Card key={agreement.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getAgreementIcon(agreement.type)}
                          {agreement.title}
                        </CardTitle>
                        <Badge variant="outline" className={cn('text-xs', getStatusColor(agreement.status))}>
                          Active
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {/* Participants */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Members:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {agreement.participantIds.map(id => {
                            const nation = allNations.find(n => n.id === id);
                            return nation ? (
                              <Badge key={id} variant="secondary" className="text-xs">
                                {nation.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {/* Duration */}
                      {agreement.terms.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {agreement.terms.duration} turns
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Propose Agreement Dialog */}
      <Dialog open={proposeDialogOpen} onOpenChange={setProposeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propose Multi-Party Agreement</DialogTitle>
            <DialogDescription>
              Create an agreement involving 3 or more nations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Agreement Type */}
            <div className="space-y-2">
              <Label>Agreement Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'multi-lateral-alliance' as const, label: 'Alliance', icon: <Shield className="h-4 w-4" /> },
                  { type: 'joint-war-declaration' as const, label: 'Joint War', icon: <Swords className="h-4 w-4" /> },
                  { type: 'non-aggression-bloc' as const, label: 'Non-Aggression', icon: <Handshake className="h-4 w-4" /> },
                  { type: 'trade-agreement' as const, label: 'Trade Deal', icon: <TrendingUp className="h-4 w-4" /> },
                ].map(({ type, label, icon }) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="justify-start"
                  >
                    {icon}
                    <span className="ml-2">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Select Participants */}
            <div className="space-y-2">
              <Label>Select Participants (minimum 3, including you)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox checked disabled />
                  <label className="text-sm font-medium">
                    {playerNation.name} (You)
                  </label>
                </div>
                {availableNations.map(nation => (
                  <div key={nation.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedParticipants.includes(nation.id)}
                      onCheckedChange={() => toggleParticipant(nation.id)}
                    />
                    <label className="text-sm cursor-pointer" onClick={() => toggleParticipant(nation.id)}>
                      {nation.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {selectedParticipants.length} nations
              </p>
            </div>

            {/* Select Targets (if needed) */}
            {needsTarget(selectedType) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Select Target Nations</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {availableNations
                      .filter(n => !selectedParticipants.includes(n.id))
                      .map(nation => (
                        <div key={nation.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedTargets.includes(nation.id)}
                            onCheckedChange={() => toggleTarget(nation.id)}
                          />
                          <label className="text-sm cursor-pointer" onClick={() => toggleTarget(nation.id)}>
                            {nation.name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Warning */}
            {selectedParticipants.length < 3 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  You need at least 3 participants for a multi-party agreement
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePropose} disabled={selectedParticipants.length < 3}>
              <Users className="h-4 w-4 mr-2" />
              Propose Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
