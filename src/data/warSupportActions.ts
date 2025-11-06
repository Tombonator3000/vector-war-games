/**
 * War Support Actions Data
 *
 * Actions players can take to influence war support and stability.
 */

import { WarSupportAction } from '../types/warSupport';

export const WAR_SUPPORT_ACTIONS: WarSupportAction[] = [
  // Propaganda actions
  {
    id: 'war_propaganda',
    name: 'War Propaganda',
    description: 'Launch propaganda campaign to boost public support for military action',
    category: 'propaganda',
    ppCost: 50,
    warSupportChange: 15,
    stabilityChange: -5,
    duration: 5,
    cooldownTurns: 10,
  },
  {
    id: 'victory_celebration',
    name: 'Victory Celebration',
    description: 'Celebrate military victories to boost morale',
    category: 'propaganda',
    ppCost: 30,
    warSupportChange: 10,
    stabilityChange: 5,
    duration: 3,
    minWarSupport: 40,
    cooldownTurns: 5,
  },
  {
    id: 'nationalist_rhetoric',
    name: 'Nationalist Rhetoric',
    description: 'Appeal to nationalism to increase war support',
    category: 'propaganda',
    ppCost: 40,
    warSupportChange: 20,
    stabilityChange: -10,
    duration: 5,
    cooldownTurns: 15,
  },
  {
    id: 'peace_movement',
    name: 'Peace Movement Support',
    description: 'Support peace movements to reduce war tension',
    category: 'propaganda',
    ppCost: 40,
    warSupportChange: -15,
    stabilityChange: 10,
    duration: 5,
    atWar: false,
    cooldownTurns: 10,
  },

  // Policy actions
  {
    id: 'economic_stimulus',
    name: 'Economic Stimulus',
    description: 'Invest in economy to improve stability',
    category: 'economic',
    ppCost: 75,
    productionCost: 200,
    warSupportChange: 0,
    stabilityChange: 15,
    duration: 10,
    cooldownTurns: 20,
  },
  {
    id: 'war_bonds',
    name: 'War Bonds Program',
    description: 'Sell war bonds to fund military and boost support',
    category: 'economic',
    ppCost: 50,
    warSupportChange: 10,
    stabilityChange: 5,
    duration: 10,
    minWarSupport: 30,
    cooldownTurns: 15,
  },
  {
    id: 'rationing_program',
    name: 'Rationing Program',
    description: 'Implement rationing to support war effort',
    category: 'policy',
    ppCost: 60,
    warSupportChange: -10,
    stabilityChange: -5,
    duration: -1, // Permanent until cancelled
    atWar: true,
    cooldownTurns: 5,
  },
  {
    id: 'welfare_expansion',
    name: 'Welfare Expansion',
    description: 'Expand welfare programs to improve stability',
    category: 'policy',
    ppCost: 80,
    productionCost: 150,
    warSupportChange: -5,
    stabilityChange: 20,
    duration: -1, // Permanent
    minStability: 20,
    cooldownTurns: 30,
  },

  // Military actions
  {
    id: 'military_parade',
    name: 'Military Parade',
    description: 'Display military strength to boost confidence',
    category: 'military',
    ppCost: 40,
    warSupportChange: 8,
    stabilityChange: 3,
    duration: 2,
    cooldownTurns: 8,
  },
  {
    id: 'veterans_support',
    name: "Veterans' Support Program",
    description: 'Support veterans to improve morale',
    category: 'military',
    ppCost: 60,
    productionCost: 100,
    warSupportChange: 12,
    stabilityChange: 8,
    duration: -1, // Permanent
    cooldownTurns: 20,
  },
  {
    id: 'draft_expansion',
    name: 'Expand Draft',
    description: 'Expand military draft, reduces support but increases recruitment',
    category: 'military',
    ppCost: 70,
    warSupportChange: -15,
    stabilityChange: -10,
    duration: -1, // Permanent
    minWarSupport: 40,
    cooldownTurns: 15,
  },
  {
    id: 'demobilization',
    name: 'Partial Demobilization',
    description: 'Reduce military presence to improve public opinion',
    category: 'military',
    ppCost: 50,
    warSupportChange: -10,
    stabilityChange: 15,
    duration: 10,
    atWar: false,
    cooldownTurns: 20,
  },

  // Crisis management
  {
    id: 'emergency_powers',
    name: 'Emergency Powers',
    description: 'Declare emergency to suppress unrest (risky)',
    category: 'policy',
    ppCost: 100,
    warSupportChange: 0,
    stabilityChange: -20,
    duration: 5,
    minStability: 0,
    cooldownTurns: 30,
  },
  {
    id: 'reconciliation_efforts',
    name: 'National Reconciliation',
    description: 'Attempt to heal divisions and restore stability',
    category: 'policy',
    ppCost: 120,
    warSupportChange: -10,
    stabilityChange: 30,
    duration: 10,
    minStability: 0,
    cooldownTurns: 25,
  },
  {
    id: 'media_control',
    name: 'Media Control',
    description: 'Control media narrative to manage public opinion',
    category: 'propaganda',
    ppCost: 80,
    warSupportChange: 10,
    stabilityChange: -15,
    duration: -1, // Permanent until cancelled
    cooldownTurns: 20,
  },
  {
    id: 'free_press',
    name: 'Free Press Protection',
    description: 'Protect press freedom to improve legitimacy',
    category: 'policy',
    ppCost: 60,
    warSupportChange: -5,
    stabilityChange: 15,
    duration: -1, // Permanent
    cooldownTurns: 25,
  },
];

/**
 * Get available actions for a nation based on current state
 */
export function getAvailableWarSupportActions(
  currentWarSupport: number,
  currentStability: number,
  atWar: boolean,
  currentTurn: number
): WarSupportAction[] {
  return WAR_SUPPORT_ACTIONS.filter((action) => {
    // Check war support requirement
    if (action.minWarSupport && currentWarSupport < action.minWarSupport) {
      return false;
    }

    // Check stability requirement
    if (action.minStability && currentStability < action.minStability) {
      return false;
    }

    // Check war status requirement
    if (action.atWar !== undefined && action.atWar !== atWar) {
      return false;
    }

    // Check cooldown
    if (action.lastUsedTurn && currentTurn - action.lastUsedTurn < action.cooldownTurns) {
      return false;
    }

    return true;
  });
}

/**
 * Get action by ID
 */
export function getWarSupportAction(actionId: string): WarSupportAction | undefined {
  return WAR_SUPPORT_ACTIONS.find((a) => a.id === actionId);
}
