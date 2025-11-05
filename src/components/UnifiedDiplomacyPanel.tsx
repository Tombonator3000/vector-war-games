/**
 * UNIFIED DIPLOMACY PANEL
 *
 * Replaces complex multi-phase diplomacy with simple relationship system
 * - Single relationship score (-100 to +100) per nation
 * - Simple treaty options: Alliance, Truce, Aid
 * - Clear visual feedback
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Handshake,
  Shield,
  Gift,
  Heart,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  FileX,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Nation } from '@/types/game';
import type { ProposalType } from '@/types/unifiedDiplomacy';
import type { Grievance } from '@/types/grievancesAndClaims';
import {
  getRelationshipCategory,
  getRelationshipColor,
  canFormAlliance,
  RELATIONSHIP_ALLIED,
  RELATIONSHIP_FRIENDLY,
  RELATIONSHIP_NEUTRAL,
  RELATIONSHIP_UNFRIENDLY,
  RELATIONSHIP_HOSTILE,
} from '@/types/unifiedDiplomacy';
import { getRelationship } from '@/lib/unifiedDiplomacyMigration';
import { getGrievanceSeverityColor } from '@/types/grievancesAndClaims';

interface UnifiedDiplomacyPanelProps {
  player: Nation;
  nations: Nation[];
  onProposal?: (type: ProposalType, targetId: string, terms?: any) => void;
  onResolveGrievance?: (targetId: string, method: 'apologize' | 'reparations') => void;
  onClose?: () => void;
}

export function UnifiedDiplomacyPanel({
  player,
  nations,
  onProposal,
  onResolveGrievance,
  onClose,
}: UnifiedDiplomacyPanelProps) {
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);

  const livingNations = nations.filter(n => !n.eliminated && n.id !== player.id);
  const selectedNation = selectedNationId ? nations.find(n => n.id === selectedNationId) : null;

  const getRelationshipWithPlayer = (nationId: string): number => {
    return getRelationship(player, nationId, nations);
  };

  const hasAlliance = (nationId: string): boolean => {
    return player.alliances?.includes(nationId) || false;
  };

  // Get grievances player has against selected nation
  const getPlayerGrievancesAgainst = (nationId: string): Grievance[] => {
    if (!player.grievances) return [];
    return player.grievances.filter(
      g => g.againstNationId === nationId && !g.resolved
    );
  };

  // Get grievances selected nation has against player
  const getGrievancesAgainstPlayer = (nationId: string): Grievance[] => {
    const nation = nations.find(n => n.id === nationId);
    if (!nation?.grievances) return [];
    return nation.grievances.filter(
      g => g.againstNationId === player.id && !g.resolved
    );
  };

  const renderRelationshipBar = (relationship: number) => {
    // Convert -100 to +100 => 0 to 100 for progress bar
    const progressValue = ((relationship + 100) / 2);

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Hostile</span>
          <span className={getRelationshipColor(relationship)}>
            {relationship > 0 ? '+' : ''}{relationship}
          </span>
          <span className="text-gray-400">Allied</span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-gray-500 to-green-500" />
          {/* Progress indicator */}
          <div
            className="absolute top-0 left-0 h-full bg-black/40"
            style={{ width: `${Math.max(0, 100 - progressValue)}%`, right: 0 }}
          />
          {/* Marker */}
          <div
            className="absolute top-0 w-1 h-full bg-white shadow-lg"
            style={{ left: `${progressValue}%` }}
          />
        </div>
        {/* Thresholds */}
        <div className="flex justify-between text-[10px] text-gray-500 px-1">
          <span>-100</span>
          <span>-60</span>
          <span>-30</span>
          <span>0</span>
          <span>+30</span>
          <span>+60</span>
          <span>+100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Nation List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Nations</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {livingNations.map(nation => {
              const relationship = getRelationshipWithPlayer(nation.id);
              const category = getRelationshipCategory(relationship);
              const isAllied = hasAlliance(nation.id);
              const isSelected = selectedNationId === nation.id;

              return (
                <motion.div
                  key={nation.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedNationId(nation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{nation.name}</span>
                      {isAllied && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          <Handshake className="w-3 h-3 mr-1" />
                          Allied
                        </Badge>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${getRelationshipColor(relationship)}`}>
                      {category}
                    </span>
                  </div>
                  <Progress
                    value={((relationship + 100) / 2)}
                    className="h-1.5 bg-gray-700"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Details & Actions */}
        <div className="space-y-4">
          {selectedNation ? (
            <>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold mb-4">{selectedNation.name}</h3>

                {renderRelationshipBar(getRelationshipWithPlayer(selectedNation.id))}

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-900/50 p-2 rounded">
                    <span className="text-gray-400">Population:</span>
                    <span className="ml-2 font-semibold">{Math.round(selectedNation.population / 1000000)}M</span>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <span className="text-gray-400">Cities:</span>
                    <span className="ml-2 font-semibold">{selectedNation.cities || 0}</span>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <span className="text-gray-400">Missiles:</span>
                    <span className="ml-2 font-semibold">{selectedNation.missiles}</span>
                  </div>
                </div>
              </div>

              {/* Diplomatic Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">Diplomatic Actions</h4>

                {/* Build Trust */}
                <Button
                  onClick={() => onProposal?.('build-trust' as ProposalType, selectedNation.id)}
                  className="w-full justify-start bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Build Trust</div>
                    <div className="text-xs text-gray-400">Costs 10 DIP. +10 trust, +5 relationship. Demonstrate goodwill.</div>
                  </div>
                </Button>

                {/* Grant Favor */}
                <Button
                  onClick={() => onProposal?.('grant-favor' as ProposalType, selectedNation.id)}
                  className="w-full justify-start bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Grant Favor</div>
                    <div className="text-xs text-gray-400">Costs 12 DIP. +3 relationship. They owe you a favor.</div>
                  </div>
                </Button>

                {/* Call in Favor */}
                <Button
                  onClick={() => onProposal?.('call-favor' as ProposalType, selectedNation.id)}
                  disabled={getPlayerGrievancesAgainst(selectedNation.id).length === 0}
                  className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Call in Favor</div>
                    <div className="text-xs text-gray-400">Costs 5 DIP. Requires favor owed. Request assistance.</div>
                  </div>
                </Button>

                {/* Make Promise */}
                <Button
                  onClick={() => onProposal?.('make-promise' as ProposalType, selectedNation.id)}
                  className="w-full justify-start bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Make Promise</div>
                    <div className="text-xs text-gray-400">Costs 10 DIP. +10-15 trust. Breaking it: -25 to -40 trust.</div>
                  </div>
                </Button>

                {/* Alliance */}
                <Button
                  onClick={() => onProposal?.('alliance', selectedNation.id)}
                  disabled={hasAlliance(selectedNation.id) || !canFormAlliance(getRelationshipWithPlayer(selectedNation.id))}
                  className="w-full justify-start bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Handshake className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Propose Alliance</div>
                    <div className="text-xs text-gray-400">
                      {hasAlliance(selectedNation.id)
                        ? 'Already allied'
                        : `Requires ${RELATIONSHIP_ALLIED}+ relationship`}
                    </div>
                  </div>
                </Button>

                {/* Truce */}
                <Button
                  onClick={() => onProposal?.('truce', selectedNation.id, { duration: 10 })}
                  disabled={hasAlliance(selectedNation.id)}
                  className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 disabled:opacity-50"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Propose Truce</div>
                    <div className="text-xs text-gray-400">10 turns of peace. No attacks allowed.</div>
                  </div>
                </Button>

                {/* Aid */}
                <Button
                  onClick={() => onProposal?.('aid', selectedNation.id, { resourceAmount: 50 })}
                  className="w-full justify-start bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Send Aid</div>
                    <div className="text-xs text-gray-400">Costs 50 production. +10 relationship.</div>
                  </div>
                </Button>

                {/* Peace (if at war) */}
                {getRelationshipWithPlayer(selectedNation.id) < RELATIONSHIP_UNFRIENDLY && (
                  <Button
                    onClick={() => onProposal?.('peace', selectedNation.id)}
                    className="w-full justify-start bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Propose Peace</div>
                      <div className="text-xs text-gray-400">End hostilities. Reset to neutral relations.</div>
                    </div>
                  </Button>
                )}
              </div>

              {/* Grievances Section */}
              {(() => {
                const theirGrievances = getGrievancesAgainstPlayer(selectedNation.id);
                const ourGrievances = getPlayerGrievancesAgainst(selectedNation.id);
                const hasGrievances = theirGrievances.length > 0 || ourGrievances.length > 0;

                if (!hasGrievances) return null;

                return (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                      <FileX className="w-4 h-4" />
                      Diplomatic Grievances
                    </h4>

                    {/* Their grievances against us */}
                    {theirGrievances.length > 0 && (
                      <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-red-400">
                            {selectedNation.name}'s Grievances Against You
                          </span>
                          <Badge className="bg-red-500/20 text-red-400 text-xs">
                            {theirGrievances.length}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-3">
                          {theirGrievances.map(g => (
                            <div key={g.id} className="bg-gray-900/50 p-2 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold ${getGrievanceSeverityColor(g.severity)}`}>
                                  {g.severity.toUpperCase()}
                                </span>
                                <span className="text-gray-500">
                                  Expires: {g.expiresIn} turns
                                </span>
                              </div>
                              <p className="text-gray-300">{g.description}</p>
                              <div className="flex gap-2 mt-1 text-gray-500">
                                <span>Trust: {g.trustPenalty}</span>
                                <span>•</span>
                                <span>Relations: {g.relationshipPenalty}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Grievance Resolution Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => onResolveGrievance?.(selectedNation.id, 'apologize')}
                            size="sm"
                            className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Apologize
                          </Button>
                          <Button
                            onClick={() => onResolveGrievance?.(selectedNation.id, 'reparations')}
                            size="sm"
                            className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-xs"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Pay Reparations
                          </Button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                          Resolving grievances improves trust and relationships
                        </p>
                      </div>
                    )}

                    {/* Our grievances against them */}
                    {ourGrievances.length > 0 && (
                      <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-orange-400">
                            Your Grievances Against {selectedNation.name}
                          </span>
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                            {ourGrievances.length}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {ourGrievances.map(g => (
                            <div key={g.id} className="bg-gray-900/50 p-2 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold ${getGrievanceSeverityColor(g.severity)}`}>
                                  {g.severity.toUpperCase()}
                                </span>
                                <span className="text-gray-500">
                                  Expires: {g.expiresIn} turns
                                </span>
                              </div>
                              <p className="text-gray-300">{g.description}</p>
                              <div className="flex gap-2 mt-1 text-gray-500">
                                <span>Trust: {g.trustPenalty}</span>
                                <span>•</span>
                                <span>Relations: {g.relationshipPenalty}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                          These will fade over time or when {selectedNation.name} makes amends
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Relationship Tips */}
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div className="text-xs text-gray-400">
                    <p className="font-semibold text-gray-300 mb-1">Relationship Tips:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Send aid to improve relations (+10)</li>
                      <li>Honor treaties to build trust (+5/turn)</li>
                      <li>Attacks reduce relationship (-25 to -50)</li>
                      <li>Resolve grievances to repair damaged relations</li>
                      <li>Relationships slowly decay toward neutral</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a nation to view details</p>
                <p className="text-sm">and perform diplomatic actions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
