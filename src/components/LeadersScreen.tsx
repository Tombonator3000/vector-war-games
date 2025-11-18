/**
 * Leaders Screen - Civilization-style leader overview
 *
 * Displays all known nations and their leaders in a grid.
 * Players can click on any leader to open the LeaderContactModal
 * and initiate diplomacy.
 *
 * Similar to Civilization's leader screen where you see all
 * leader portraits and can interact with them directly.
 */

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LeaderAvatarWithTooltip } from './LeaderAvatar';
import type { Nation } from '@/types/game';
import { getRelationship } from '@/lib/relationshipUtils';
import { getTrust, getFavors } from '@/types/trustAndFavors';
import { getLeaderImage } from '@/lib/leaderImages';
import {
  Users,
  Globe,
  Swords,
  TrendingUp,
  Heart,
  Shield,
  Skull,
  Crown,
  Flag,
  MessageSquare,
} from 'lucide-react';

interface LeadersScreenProps {
  open: boolean;
  onClose: () => void;
  playerNation: Nation;
  allNations: Nation[];
  onContactLeader: (nationId: string) => void;
  onOpenCivStyleDiplomacy?: (nationId: string) => void;
}

/**
 * Get relationship status label and color
 */
function getRelationshipStatus(relationship: number): { label: string; color: string } {
  if (relationship >= 75) return { label: 'Allied', color: 'text-green-400' };
  if (relationship >= 50) return { label: 'Cordial', color: 'text-green-300' };
  if (relationship >= 25) return { label: 'Friendly', color: 'text-blue-400' };
  if (relationship >= 0) return { label: 'Neutral', color: 'text-gray-400' };
  if (relationship >= -25) return { label: 'Cautious', color: 'text-yellow-400' };
  if (relationship >= -50) return { label: 'Unfriendly', color: 'text-orange-400' };
  return { label: 'Hostile', color: 'text-red-400' };
}

/**
 * Calculate military power score
 */
function getMilitaryPower(nation: Nation): number {
  const missileCount = (nation.missiles || 0);
  const population = nation.population || 0;
  return missileCount * 10 + population;
}

/**
 * Sort nations by importance (relationship, then power)
 */
function sortNationsByImportance(
  nations: Nation[],
  playerNation: Nation
): Nation[] {
  return [...nations]
    .filter(n => !n.isPlayer && n.population > 0)
    .sort((a, b) => {
      // First by alliance status
      const aAllied = playerNation.treaties?.[a.id]?.alliance;
      const bAllied = playerNation.treaties?.[b.id]?.alliance;
      if (aAllied !== bAllied) return aAllied ? -1 : 1;

      // Then by relationship
      const aRel = getRelationship(playerNation, a.id);
      const bRel = getRelationship(playerNation, b.id);
      if (Math.abs(aRel - bRel) > 10) return bRel - aRel;

      // Finally by power
      return getMilitaryPower(b) - getMilitaryPower(a);
    });
}

type TreatyStatus = {
  state: 'alliance' | 'truce' | 'war' | 'peace';
  truceTurns?: number;
};

function getTreatyStatus(playerNation: Nation, targetNationId: string): TreatyStatus {
  const treaty = playerNation.treaties?.[targetNationId];

  if (treaty?.alliance) {
    return { state: 'alliance' };
  }

  const truceTurns = typeof treaty?.truceTurns === 'number' ? treaty.truceTurns : undefined;
  if (truceTurns && truceTurns > 0) {
    return { state: 'truce', truceTurns };
  }

  if (treaty && !treaty.alliance) {
    return { state: 'war' };
  }

  return { state: 'peace' };
}

export function LeadersScreen({
  open,
  onClose,
  playerNation,
  allNations,
  onContactLeader,
  onOpenCivStyleDiplomacy,
}: LeadersScreenProps) {
  // Sort nations by importance
  const sortedNations = useMemo(
    () => sortNationsByImportance(allNations, playerNation),
    [allNations, playerNation]
  );

  // Count relationships
  const relationshipCounts = useMemo(() => {
    const counts = { allies: 0, friendly: 0, neutral: 0, hostile: 0 };
    sortedNations.forEach(nation => {
      const relationship = getRelationship(playerNation, nation.id);
      const treatyStatus = getTreatyStatus(playerNation, nation.id);
      if (treatyStatus.state === 'alliance') counts.allies++;
      else if (treatyStatus.state === 'war') counts.hostile++;
      else if (relationship >= 25) counts.friendly++;
      else if (relationship >= -25) counts.neutral++;
      else counts.hostile++;
    });
    return counts;
  }, [sortedNations, playerNation]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-400" />
            <div>
              <DialogTitle className="text-2xl">World Leaders</DialogTitle>
              <DialogDescription className="text-base">
                Contact and negotiate with other nations
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Relationship Summary */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm">Diplomatic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {relationshipCounts.allies}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" />
                  Allies
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {relationshipCounts.friendly}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Heart className="h-3 w-3" />
                  Friendly
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {relationshipCounts.neutral}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Flag className="h-3 w-3" />
                  Neutral
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {relationshipCounts.hostile}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Swords className="h-3 w-3" />
                  Hostile
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Leaders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedNations.map(nation => {
            const relationship = getRelationship(playerNation, nation.id);
            const trust = getTrust(playerNation, nation.id);
            const favors = getFavors(playerNation, nation.id);
            const treatyStatus = getTreatyStatus(playerNation, nation.id);
            const isAllied = treatyStatus.state === 'alliance';
            const isTruce = treatyStatus.state === 'truce';
            const isAtWar = treatyStatus.state === 'war';
            const truceTurnsRemaining = treatyStatus.truceTurns || 0;
            const { label: relLabel, color: relColor } = getRelationshipStatus(relationship);
            const militaryPower = getMilitaryPower(nation);

            return (
              <Card
                key={nation.id}
                className={cn(
                  'transition-all hover:border-blue-500/50 cursor-pointer bg-slate-800/30 border-slate-700',
                  isAllied && 'border-green-500/50 bg-green-900/10',
                  isTruce && 'border-amber-400/60 bg-amber-900/10',
                  isAtWar && 'border-red-500/50 bg-red-900/10'
                )}
                onClick={() => {
                  onContactLeader(nation.id);
                  onClose();
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {/* Leader Image - Prominent Display */}
                    <div className="flex-shrink-0">
                      <LeaderAvatarWithTooltip
                        leaderName={nation.leaderName || nation.leader || 'Unknown'}
                        nationName={nation.name}
                        mood={relationship >= 0 ? 'friendly' : 'hostile'}
                        size="lg"
                        relationship={relationship}
                        trust={trust}
                        showTooltip={false}
                        imageUrl={getLeaderImage(nation.leaderName || nation.leader)}
                      />
                    </div>

                    {/* Leader Info */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {nation.leaderName || nation.leader || 'Unknown Leader'}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {nation.name}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {nation.aiPersonality || 'Balanced'}
                        </Badge>
                        {isAllied && (
                          <Badge className="text-xs bg-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Allied
                          </Badge>
                        )}
                        {isTruce && (
                          <Badge className="text-xs bg-amber-600">
                            <Flag className="h-3 w-3 mr-1" />
                            Truce ({truceTurnsRemaining} turns)
                          </Badge>
                        )}
                        {isAtWar && (
                          <Badge className="text-xs bg-red-600">
                            <Swords className="h-3 w-3 mr-1" />
                            At War
                          </Badge>
                        )}
                        {!isAllied && !isTruce && !isAtWar && (
                          <Badge className="text-xs bg-slate-700 text-slate-100 border-slate-600">
                            <Globe className="h-3 w-3 mr-1" />
                            Peace
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Relationship Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Relationship</span>
                      <span className={cn('text-sm font-bold', relColor)}>
                        {relLabel} ({relationship > 0 ? '+' : ''}{relationship})
                      </span>
                    </div>
                    <Progress
                      value={((relationship + 100) / 200) * 100}
                      className="h-1.5"
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-slate-900/50">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Globe className="h-3 w-3" />
                      </div>
                      <div className="font-bold">{nation.population}M</div>
                      <div className="text-muted-foreground">Territories</div>
                    </div>
                    <div className="text-center p-2 rounded bg-slate-900/50">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-3 w-3" />
                      </div>
                      <div className="font-bold">{nation.population}M</div>
                      <div className="text-muted-foreground">Population</div>
                    </div>
                    <div className="text-center p-2 rounded bg-slate-900/50">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Swords className="h-3 w-3" />
                      </div>
                      <div className="font-bold">
                        {(nation.missiles || 0)}
                      </div>
                      <div className="text-muted-foreground">Missiles</div>
                    </div>
                  </div>

                  {/* Trust & Favors Quick View */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground">Trust:</span>
                      <span className="ml-1 font-medium">{trust}/100</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Favors:</span>
                      <span
                        className={cn(
                          'ml-1 font-medium',
                          favors > 0 ? 'text-green-400' : favors < 0 ? 'text-red-400' : ''
                        )}
                      >
                        {favors > 0 ? '+' : ''}{favors}
                      </span>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <div className="space-y-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContactLeader(nation.id);
                        onClose();
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Leader
                    </Button>
                    {onOpenCivStyleDiplomacy && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCivStyleDiplomacy(nation.id);
                          onClose();
                        }}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Diplomatic Actions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedNations.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No other nations discovered yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Explore the world to meet other leaders
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
