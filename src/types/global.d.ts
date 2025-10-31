/**
 * Global type definitions for window object extensions
 * and other ambient declarations
 */

import type { Nation } from './game';
import type { NewsItem } from '@/components/NewsTicker';

declare global {
  interface Window {
    /**
     * Applies cyber research unlocks to a nation
     */
    __applyCyberResearchUnlock?: (
      nation: Nation,
      unlockType: 'firewalls' | 'intrusion_detection' | 'advanced_offense' |
                   'stealth_protocols' | 'attribution_obfuscation' | 'ai_defense' |
                   'cyber_superweapon'
    ) => void;

    /**
     * Adds a news item to the game's news ticker
     */
    __gameAddNewsItem?: (
      category: NewsItem['category'],
      text: string,
      priority: NewsItem['priority']
    ) => void;

    /**
     * Triggers a flashpoint event
     */
    __gameTriggerFlashpoint?: (
      turn: number,
      defcon: number
    ) => { title: string } | null;

    /**
     * Banter system for AI dialogue
     */
    banterSay?: (
      pool: string,
      nation: Nation,
      variant: number
    ) => void;

    /**
     * Conventional warfare system
     */
    __conventionalWarfare?: {
      templates?: any;
      trainUnit?: (nationId: string, templateId: string) => void;
      deployUnit?: (unitId: string, territoryId: string) => void;
      resolveBorderConflict?: (attackerId: string, defenderId: string, territoryId: string) => void;
      getUnitsForNation?: (nationId: string) => any[];
    };

    /**
     * Cyber warfare system
     */
    __cyberWarfare?: {
      launchCyberAttack?: (attackerId: string, targetId: string, attackType: string) => void;
    };

    /**
     * Cyber AI planning
     */
    __cyberAiPlan?: (nationId: string) => any;

    /**
     * Advance cyber warfare turn
     */
    __cyberAdvance?: () => void;

    /**
     * Advance pandemic turn
     */
    __pandemicAdvance?: (context: any) => any;

    /**
     * Trigger pandemic event
     */
    __pandemicTrigger?: (payload: unknown) => void;

    /**
     * Apply pandemic countermeasure
     */
    __pandemicCountermeasure?: (payload: unknown) => void;

    /**
     * Current defensive research status from the player's bio warfare program
     */
    __bioDefenseStats?: {
      vaccineAcceleration: number;
      radiationMitigation: number;
    };

    /**
     * WebKit prefixed AudioContext for legacy browser support
     */
    webkitAudioContext?: typeof AudioContext;
  }
}

export {};
