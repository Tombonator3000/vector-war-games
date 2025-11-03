/**
 * UNIFIED GAME MIGRATION
 *
 * Central migration system that handles converting old game data to new unified systems:
 * - Diplomacy system (Trust/Favors → Unified Relationships)
 * - Immigration & Culture system (simple population → PopGroups)
 */

import type { Nation, GameState } from '@/types/game';
import { migrateGameDiplomacy } from './unifiedDiplomacyMigration';
import { initializeNationPopSystem } from './immigrationCultureTurnProcessor';

/**
 * Migrate all game systems to latest versions
 *
 * This function should be called when:
 * - Loading a saved game
 * - Starting a new game
 * - After any major system update
 */
export function migrateGameSystems(nations: Nation[], gameState: GameState): {
  nations: Nation[];
  gameState: GameState;
} {
  console.log('🔄 Starting unified game migration...');

  let migratedNations = [...nations];

  // Step 1: Migrate diplomacy system (Trust/Favors → Relationships)
  try {
    console.log('  → Migrating diplomacy system...');
    migratedNations = migrateGameDiplomacy(migratedNations);
    console.log('  ✓ Diplomacy migration complete');
  } catch (error) {
    console.error('  ✗ Diplomacy migration failed:', error);
  }

  // Step 2: Migrate immigration & culture system (population → PopGroups)
  try {
    console.log('  → Migrating immigration & culture system...');
    for (const nation of migratedNations) {
      if (!nation.eliminated) {
        initializeNationPopSystem(nation);
      }
    }
    console.log('  ✓ Immigration & culture migration complete');
  } catch (error) {
    console.error('  ✗ Immigration & culture migration failed:', error);
  }

  console.log('✓ Unified game migration complete');

  return {
    nations: migratedNations,
    gameState,
  };
}

/**
 * Check if a nation needs migration
 */
export function needsMigration(nation: Nation): {
  needsDiplomacyMigration: boolean;
  needsPopMigration: boolean;
  needsAnyMigration: boolean;
} {
  const needsDiplomacyMigration = !nation.relationships || Object.keys(nation.relationships).length === 0;
  const needsPopMigration = !nation.popGroups || nation.popGroups.length === 0;

  return {
    needsDiplomacyMigration,
    needsPopMigration,
    needsAnyMigration: needsDiplomacyMigration || needsPopMigration,
  };
}

/**
 * Get migration status for all nations
 */
export function getMigrationStatus(nations: Nation[]): {
  totalNations: number;
  needingDiplomacyMigration: number;
  needingPopMigration: number;
  fullyMigrated: number;
} {
  const status = {
    totalNations: nations.length,
    needingDiplomacyMigration: 0,
    needingPopMigration: 0,
    fullyMigrated: 0,
  };

  for (const nation of nations) {
    if (nation.eliminated) continue;

    const migrationNeeds = needsMigration(nation);

    if (migrationNeeds.needsDiplomacyMigration) {
      status.needingDiplomacyMigration++;
    }

    if (migrationNeeds.needsPopMigration) {
      status.needingPopMigration++;
    }

    if (!migrationNeeds.needsAnyMigration) {
      status.fullyMigrated++;
    }
  }

  return status;
}

/**
 * Validate that migration was successful
 */
export function validateMigration(nations: Nation[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const nation of nations) {
    if (nation.eliminated) continue;

    // Check diplomacy system
    if (!nation.relationships) {
      errors.push(`${nation.name}: Missing relationships object`);
    } else if (Object.keys(nation.relationships).length === 0) {
      warnings.push(`${nation.name}: No relationships initialized`);
    }

    // Check pop system
    if (!nation.popGroups) {
      errors.push(`${nation.name}: Missing popGroups array`);
    } else if (nation.popGroups.length === 0) {
      warnings.push(`${nation.name}: No pop groups initialized`);
    }

    // Check cultural identity
    if (!nation.culturalIdentity) {
      warnings.push(`${nation.name}: Missing culturalIdentity`);
    }

    // Check immigration policy
    if (!nation.currentImmigrationPolicy) {
      warnings.push(`${nation.name}: Missing currentImmigrationPolicy`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log migration status to console
 */
export function logMigrationStatus(nations: Nation[]): void {
  const status = getMigrationStatus(nations);
  const validation = validateMigration(nations);

  console.group('📊 Migration Status Report');
  console.log(`Total nations: ${status.totalNations}`);
  console.log(`Fully migrated: ${status.fullyMigrated} (${Math.round(status.fullyMigrated / status.totalNations * 100)}%)`);
  console.log(`Needing diplomacy migration: ${status.needingDiplomacyMigration}`);
  console.log(`Needing pop migration: ${status.needingPopMigration}`);

  if (validation.errors.length > 0) {
    console.error('❌ Errors:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:', validation.warnings);
  }

  if (validation.isValid) {
    console.log('✅ Migration validation passed');
  } else {
    console.error('❌ Migration validation failed');
  }

  console.groupEnd();
}
