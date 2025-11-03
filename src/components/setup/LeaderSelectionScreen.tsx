/**
 * LeaderSelectionScreen Component
 *
 * Screen for selecting a leader/commander for the game.
 * Phase 4: Added biography and strategy tips display
 *
 * Phase 7 Refactoring: Extracted from Index.tsx
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Info, Lightbulb } from 'lucide-react';
import type { RefObject } from 'react';
import { useState } from 'react';
import { getLeaderBiography } from '@/data/leaderBiographies';
import { getLeaderDefaultDoctrine, getDoctrineName, getDoctrineDescription } from '@/data/leaderDoctrines';

export interface Leader {
  name: string;
  ai: string;
}

export interface LeaderSelectionScreenProps {
  /** Ref to interface element */
  interfaceRef: RefObject<HTMLDivElement>;
  /** Available leaders to choose from */
  leaders: Leader[];
  /** Handler for leader selection */
  onSelectLeader: (leaderName: string) => void;
  /** Handler for going back to intro */
  onBack: () => void;
}

export function LeaderSelectionScreen({
  interfaceRef,
  leaders,
  onSelectLeader,
  onBack,
}: LeaderSelectionScreenProps) {
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);

  const toggleLeaderInfo = (leaderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLeader(expandedLeader === leaderName ? null : leaderName);
  };

  return (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-6xl w-full py-8">
          <h2 className="text-3xl font-mono text-cyan text-center mb-8 tracking-widest uppercase glow-text">
            Select Commander
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {leaders.map((leader) => {
              const bio = getLeaderBiography(leader.name);
              const isExpanded = expandedLeader === leader.name;
              const defaultDoctrine = getLeaderDefaultDoctrine(leader.name);
              const doctrineName = getDoctrineName(defaultDoctrine);
              const doctrineDescription = getDoctrineDescription(defaultDoctrine);

              return (
                <div
                  key={leader.name}
                  className={`bg-card border border-cyan/30 rounded-lg transition-all duration-300 ${
                    isExpanded
                      ? 'col-span-1 md:col-span-2 lg:col-span-3 border-cyan'
                      : 'hover:border-cyan hover:bg-cyan/10 hover:shadow-lg hover:shadow-cyan/20'
                  }`}
                >
                  <div
                    onClick={() => !isExpanded && onSelectLeader(leader.name)}
                    className={`p-6 ${!isExpanded && 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-mono text-neon-green mb-1">{leader.name}</h3>
                        <p className="text-sm text-muted-foreground uppercase tracking-wide">
                          {leader.ai}
                        </p>
                        {bio && (
                          <p className="text-xs text-cyan/60 mt-1">{bio.title}</p>
                        )}
                        {!isExpanded && (
                          <div className="mt-2">
                            <Badge className="text-xs bg-neon-green/20 text-neon-green border-neon-green">
                              {doctrineName}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {bio && (
                        <button
                          onClick={(e) => toggleLeaderInfo(leader.name, e)}
                          className="ml-2 p-2 hover:bg-cyan/20 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-cyan" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-cyan" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Biography and Strategy Tips (Expanded) */}
                    {isExpanded && bio && (
                      <div className="mt-6 space-y-4 border-t border-cyan/30 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Biography */}
                          <div className="md:col-span-2 space-y-3">
                            <div className="flex items-center gap-2 text-cyan">
                              <Info className="w-4 h-4" />
                              <h4 className="font-mono font-bold">Biography</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {bio.biography}
                            </p>
                          </div>

                          {/* Quick Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-cyan">
                              <Info className="w-4 h-4" />
                              <h4 className="font-mono font-bold text-sm">Quick Info</h4>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs text-muted-foreground">Playstyle:</span>
                                <Badge className="ml-2 text-xs bg-cyan/20 text-cyan border-cyan">
                                  {bio.playstyle}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Difficulty:</span>
                                <Badge className="ml-2 text-xs bg-amber/20 text-amber border-amber">
                                  {bio.difficulty}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Doctrine:</span>
                                <Badge className="ml-2 text-xs bg-neon-green/20 text-neon-green border-neon-green">
                                  {doctrineName}
                                </Badge>
                                <p className="text-xs text-cyan/60 mt-1">
                                  {doctrineDescription}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Strategy Tips */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber">
                            <Lightbulb className="w-4 h-4" />
                            <h4 className="font-mono font-bold">Strategy Tips</h4>
                          </div>
                          <ul className="space-y-1">
                            {bio.strategyTips.map((tip, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-amber mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-cyan/30">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLeader(null);
                            }}
                            className="bg-transparent border border-muted-foreground text-muted-foreground hover:border-cyan hover:text-cyan"
                          >
                            Close
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLeader(leader.name);
                            }}
                            className="bg-cyan border border-cyan text-background hover:bg-cyan/80"
                          >
                            Select {leader.name}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              onClick={onBack}
              className="px-6 py-2 bg-transparent border border-muted-foreground text-muted-foreground hover:border-cyan hover:text-cyan transition-all duration-300 font-mono uppercase tracking-wide"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
