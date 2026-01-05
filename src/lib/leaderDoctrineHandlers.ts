/**
 * Leader & Doctrine Handlers
 * Extracted from Index.tsx to reduce file size and improve maintainability
 *
 * This module handles:
 * - Applying leader-specific bonuses to nations
 * - Applying doctrine effects to nations
 * - Mapping ability categories to news categories
 */

import type { Nation } from '@/types/game';
import type { NewsItem } from '@/components/NewsTicker';
import type { DoctrineKey } from '@/types/doctrineIncidents';
import { leaderBonuses } from '@/data/leaderBonuses';
import { clampDefenseValue } from '@/lib/nuclearDamage';

/**
 * Applies leader-specific bonuses to a nation
 * @param nation - The nation to apply bonuses to
 * @param leaderName - Name of the leader whose bonuses to apply
 */
export function applyLeaderBonuses(nation: Nation, leaderName: string): void {
  const bonuses = leaderBonuses[leaderName];
  if (!bonuses) {
    console.warn(`No bonuses defined for leader: ${leaderName}`);
    return;
  }

  console.log(`Applying leader bonuses for ${leaderName}:`);
  bonuses.forEach(bonus => {
    console.log(`  - ${bonus.name}: ${bonus.description}`);
    bonus.effect(nation);
  });
}

/**
 * Applies doctrine effects to a nation based on selected doctrine
 * @param nation - The nation to apply doctrine effects to
 * @param doctrineKey - The doctrine to apply
 */
export function applyDoctrineEffects(nation: Nation, doctrineKey?: DoctrineKey): void {
  if (!doctrineKey) return;

  switch (doctrineKey) {
    case 'mad': {
      nation.missiles = Math.max(0, (nation.missiles || 0) + 2);
      nation.defense = Math.max(0, (nation.defense || 0) - 1);
      break;
    }
    case 'defense': {
      nation.defense = clampDefenseValue((nation.defense || 0) + 3);
      nation.missiles = Math.max(0, (nation.missiles || 0) - 1);
      break;
    }
    case 'firstStrike': {
      nation.warheads = nation.warheads || {};
      nation.warheads[100] = (nation.warheads[100] || 0) + 1;
      nation.researched = nation.researched || {};
      nation.researched.warhead_100 = true;
      if (window.__gameAddNewsItem) {
        window.__gameAddNewsItem('military', `${nation.name} adopts First Strike Doctrine`, 'critical');
      }
      break;
    }
    case 'detente': {
      nation.intel = (nation.intel || 0) + 10;
      nation.production = (nation.production || 0) + 2;
      break;
    }
    default:
      break;
  }
}

/**
 * Maps ability category to news category for news ticker integration
 * @param category - The ability category
 * @returns The corresponding news category
 */
export function mapAbilityCategoryToNewsCategory(category: string): NewsItem['category'] {
  switch (category) {
    case 'diplomatic':
      return 'diplomatic';
    case 'military':
      return 'military';
    case 'economic':
      return 'economic';
    case 'intelligence':
      return 'intel';
    default:
      return 'science';
  }
}
