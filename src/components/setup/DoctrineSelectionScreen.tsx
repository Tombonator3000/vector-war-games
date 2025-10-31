/**
 * DoctrineSelectionScreen Component
 *
 * Screen for selecting a military doctrine after choosing a leader.
 *
 * Phase 7 Refactoring: Extracted from Index.tsx
 */

import { Button } from '@/components/ui/button';
import type { RefObject } from 'react';

export interface Doctrine {
  name: string;
  desc: string;
  effects: string;
}

export interface DoctrineSelectionScreenProps {
  /** Ref to interface element */
  interfaceRef: RefObject<HTMLDivElement>;
  /** Available doctrines to choose from */
  doctrines: Record<string, Doctrine>;
  /** Selected leader name (displayed for context) */
  selectedLeader: string | null;
  /** Handler for doctrine selection */
  onSelectDoctrine: (doctrineKey: string) => void;
  /** Handler for going back to leader selection */
  onBack: () => void;
}

export function DoctrineSelectionScreen({
  interfaceRef,
  doctrines,
  selectedLeader,
  onSelectDoctrine,
  onBack,
}: DoctrineSelectionScreenProps) {
  return (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          <h2 className="text-3xl font-mono text-neon-magenta text-center mb-2 tracking-widest uppercase glow-text">
            Select Doctrine
          </h2>
          <p className="text-center text-cyan font-mono mb-8">Commander: {selectedLeader}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(doctrines).map(([key, doctrine]) => (
              <div
                key={key}
                onClick={() => onSelectDoctrine(key)}
                className="bg-card border border-neon-magenta/30 p-6 rounded-lg cursor-pointer hover:border-neon-magenta hover:bg-neon-magenta/10 transition-all duration-300 hover:shadow-lg hover:shadow-neon-magenta/20 synthwave-card"
              >
                <h3 className="text-xl font-mono text-neon-yellow mb-2">{doctrine.name}</h3>
                <p className="text-sm text-cyan mb-3">{doctrine.desc}</p>
                <p className="text-xs text-neon-green font-mono">{doctrine.effects}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={onBack}
              className="px-6 py-2 bg-transparent border border-muted-foreground text-muted-foreground hover:border-neon-magenta hover:text-neon-magenta transition-all duration-300 font-mono uppercase tracking-wide"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
