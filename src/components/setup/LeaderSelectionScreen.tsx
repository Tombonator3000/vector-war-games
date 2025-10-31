/**
 * LeaderSelectionScreen Component
 *
 * Screen for selecting a leader/commander for the game.
 *
 * Phase 7 Refactoring: Extracted from Index.tsx
 */

import { Button } from '@/components/ui/button';
import type { RefObject } from 'react';

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
  return (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-mono text-cyan text-center mb-8 tracking-widest uppercase glow-text">
            Select Commander
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {leaders.map((leader) => (
              <div
                key={leader.name}
                onClick={() => onSelectLeader(leader.name)}
                className="bg-card border border-cyan/30 p-6 rounded-lg cursor-pointer hover:border-cyan hover:bg-cyan/10 transition-all duration-300 hover:shadow-lg hover:shadow-cyan/20"
              >
                <h3 className="text-xl font-mono text-neon-green mb-2">{leader.name}</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">{leader.ai}</p>
              </div>
            ))}
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
