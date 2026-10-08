import type { NationConventionalProfile } from '@/hooks/useConventionalWarfare';
import type { GameState as CoreGameState, Nation, DiplomacyState } from '@/types/game';

export type GameState = CoreGameState;
export type { DiplomacyState };

export type LocalNation = Nation & {
  conventional?: NationConventionalProfile;
};

export type LocalGameState = Omit<CoreGameState, 'nations'> & {
  nations: LocalNation[];
  showEndGameScreen?: boolean;
  endGameStatistics?: unknown;
  pendingEndGameReveal?: {
    initiatedAt: number;
    minRevealAt: number;
  };
  endGameRevealRequiresConfirmation?: boolean;
  victoryProgressNotifications?: {
    economic: boolean;
    demographic: boolean;
    cultural: boolean;
    survival: boolean;
    domination: boolean;
  };
};

