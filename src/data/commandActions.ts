import { Factory, Microscope, Radar, Handshake, Radio, Users, Shield, Swords, UserRound, FlaskConical, Crosshair, BarChart3 } from 'lucide-react';
import type { CommandActionDefinition, CommandActionId } from '@/types/command';

export const PRIMARY_COMMANDS: readonly CommandActionId[] = ['build', 'research', 'intel', 'diplomacy'];

export const COMMAND_ACTIONS: readonly CommandActionDefinition[] = [
  { id: 'build', label: 'Build', description: 'Production and city construction', icon: Factory, shortcut: '1', tutorial: 'build-button' },
  { id: 'research', label: 'Research', description: 'Technology and development', icon: Microscope, shortcut: '2', tutorial: 'research-button' },
  { id: 'intel', label: 'Intel', description: 'Intelligence and spy operations', icon: Radar, shortcut: '3', tutorial: 'intel-button' },
  { id: 'diplomacy', label: 'Diplomacy', description: 'Treaties and international relations', icon: Handshake, shortcut: '6' },
  { id: 'satcom', label: 'Satcom', description: 'Satellite communications and signals', icon: Radio, tutorial: 'satcom-button' },
  { id: 'culture', label: 'Culture', description: 'Cultural influence and NGO operations', icon: Users, shortcut: '4' },
  { id: 'policy', label: 'Policy', description: 'National strategic policies', icon: Shield },
  { id: 'war', label: 'War', description: 'Conventional forces, declarations and peace', icon: Swords },
  { id: 'empire', label: 'Empire', description: 'Nation status and strategic ledger', icon: BarChart3, shortcut: 'I' },
  { id: 'leader', label: 'Leader', description: 'Biography and leader abilities', icon: UserRound },
  { id: 'bio', label: 'Bioforge', description: 'Advanced biological operations', icon: FlaskConical },
  { id: 'attack', label: 'Strike', description: 'Open strike planner; launches require confirmation', icon: Crosshair, shortcut: '7' },
];

export const PHASE_LABELS = {
  PLAYER: 'Your orders',
  AI: 'Opponents acting',
  RESOLUTION: 'Resolving operations',
  PRODUCTION: 'Production and research',
} as const;
