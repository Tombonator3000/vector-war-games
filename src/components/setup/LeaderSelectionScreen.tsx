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
import { Info, Lightbulb, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RefObject } from 'react';
import { useState } from 'react';
import { getLeaderBiography } from '@/data/leaderBiographies';
import { getLeaderImage } from '@/lib/leaderImages';

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
  const [selectedLeader, setSelectedLeader] = useState<string>(leaders[0]?.name || '');
  
  const currentLeader = leaders.find(l => l.name === selectedLeader) || leaders[0];
  const bio = currentLeader ? getLeaderBiography(currentLeader.name) : null;
  const leaderImage = currentLeader ? getLeaderImage(currentLeader.name) : null;

  return (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex flex-col p-4 md:p-8">
        <h2 className="text-3xl font-mono text-cyan text-center mb-4 md:mb-6 tracking-widest uppercase glow-text">
          Select Commander
        </h2>

        <div className="flex-1 flex gap-4 md:gap-6 overflow-hidden">
          {/* Sidebar with leader portraits */}
          <div className="w-32 md:w-40 flex-shrink-0 bg-card/50 border border-cyan/30 rounded-lg p-3">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-2">
                {leaders.map((leader) => {
                  const isSelected = leader.name === selectedLeader;
                  const image = getLeaderImage(leader.name);
                  
                  return (
                    <button
                      key={leader.name}
                      onClick={() => setSelectedLeader(leader.name)}
                      className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-cyan shadow-lg shadow-cyan/50 scale-110'
                          : 'border-cyan/30 hover:border-cyan/60 hover:scale-105'
                      }`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={leader.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-cyan/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-cyan" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main detail panel */}
          <div className="flex-1 bg-card/50 border border-cyan/30 rounded-lg overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 md:p-8">
                {currentLeader && (
                  <div className="space-y-6">
                    {/* Header with large portrait */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Large portrait */}
                      <div className="flex-shrink-0 w-full md:w-64">
                        {leaderImage ? (
                          <img
                            src={leaderImage}
                            alt={currentLeader.name}
                            className="w-full aspect-square object-cover rounded-lg border-4 border-cyan/50 shadow-2xl shadow-cyan/30"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-lg bg-cyan/20 border-4 border-cyan/50 flex items-center justify-center">
                            <User className="w-32 h-32 text-cyan" />
                          </div>
                        )}
                      </div>

                      {/* Leader info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-3xl md:text-4xl font-mono text-neon-green mb-2">
                            {currentLeader.name}
                          </h3>
                          {bio && (
                            <p className="text-lg text-cyan/80 mb-3">{bio.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground uppercase tracking-wide">
                            AI Type: {currentLeader.ai}
                          </p>
                        </div>

                        {/* Quick stats */}
                        {bio && (
                          <div className="flex flex-wrap gap-3">
                            <Badge className="bg-cyan/20 text-cyan border-cyan">
                              {bio.playstyle}
                            </Badge>
                            <Badge className="bg-amber/20 text-amber border-amber">
                              Difficulty: {bio.difficulty}
                            </Badge>
                            {bio.recommendedDoctrine && (
                              <Badge className="bg-neon-green/20 text-neon-green border-neon-green">
                                {bio.recommendedDoctrine}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Biography */}
                    {bio && (
                      <div className="space-y-4 border-t border-cyan/30 pt-6">
                        <div className="flex items-center gap-2 text-cyan">
                          <Info className="w-5 h-5" />
                          <h4 className="font-mono font-bold text-lg">Biography</h4>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {bio.biography}
                        </p>
                      </div>
                    )}

                    {/* Strategy Tips */}
                    {bio && bio.strategyTips.length > 0 && (
                      <div className="space-y-3 border-t border-cyan/30 pt-6">
                        <div className="flex items-center gap-2 text-amber">
                          <Lightbulb className="w-5 h-5" />
                          <h4 className="font-mono font-bold text-lg">Strategy Tips</h4>
                        </div>
                        <ul className="space-y-2">
                          {bio.strategyTips.map((tip, index) => (
                            <li
                              key={index}
                              className="text-muted-foreground flex items-start gap-3"
                            >
                              <span className="text-amber mt-1 flex-shrink-0">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="border-t border-cyan/30 p-4 bg-card/80 flex justify-between gap-3">
              <Button
                onClick={onBack}
                className="px-6 bg-transparent border border-muted-foreground text-muted-foreground hover:border-cyan hover:text-cyan font-mono uppercase tracking-wide"
              >
                Back
              </Button>
              <Button
                onClick={() => onSelectLeader(currentLeader.name)}
                className="px-8 bg-cyan border border-cyan text-background hover:bg-cyan/80 font-mono uppercase tracking-wide"
              >
                Select {currentLeader.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
