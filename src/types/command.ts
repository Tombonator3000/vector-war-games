import type { LucideIcon } from 'lucide-react';
import type { GameState } from '@/types/game';

export type CommandActionId = 'build' | 'research' | 'intel' | 'diplomacy' | 'satcom' | 'culture' | 'policy' | 'war' | 'leader' | 'bio' | 'attack';

export interface CommandAction {
  id: CommandActionId;
  onSelect: () => void;
  roleLocked?: boolean;
  disabled?: boolean;
}

export interface CommandActionDefinition {
  id: CommandActionId;
  label: string;
  description: string;
  icon: LucideIcon;
  shortcut?: string;
  tutorial?: string;
}

export interface TurnControlProps {
  turn: number;
  phase: GameState['phase'];
  actionsRemaining: number;
  paused: boolean;
  gameOver: boolean;
  revealPending?: boolean;
  researchIdle?: boolean;
  onEndTurn: () => void;
}
