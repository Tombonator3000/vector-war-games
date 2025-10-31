/**
 * Investigation Bureau AI System
 * Manages the human response to cult activities
 */

import type {
  InvestigatorUnit,
  InvestigatorAbility,
  RegionalState,
  GreatOldOnesState,
  CultistCell,
  RitualSite,
  SummonedEntity,
} from '../types/greatOldOnes';
import { addMissionLogEntry } from './greatOldOnesHelpers';

// ============================================================================
// INVESTIGATION HEAT SYSTEM
// ============================================================================

export interface InvestigationHeat {
  regionId: string;
  heatLevel: number; // 0-100
  raidMobilizationTimer: number; // Turns until raid
  activeInvestigations: ActiveInvestigation[];
}

export interface ActiveInvestigation {
  id: string;
  investigatorId: string;
  targetType: 'cultist_cell' | 'ritual_site' | 'corruption_network';
  targetId: string;
  progress: number; // 0-100
  turnsRemaining: number;
  discoveryRisk: number; // Chance of exposing target
}

export interface RaidOperation {
  id: string;
  regionId: string;
  investigatorIds: string[];
  targetType: 'cultist_cell' | 'ritual_site';
  targetId: string;
  strength: number; // Combined investigator power
  turnsUntilExecution: number;
}

// ============================================================================
// INVESTIGATOR AI
// ============================================================================

const INVESTIGATOR_NAMES = [
  'Agent Blackwood',
  'Dr. Sarah Chen',
  'Detective Marcus Webb',
  'Professor Elizabeth Harrow',
  'Agent David Pierce',
  'Dr. Yuki Tanaka',
  'Inspector James Moreau',
  'Dr. Amara Okafor',
  'Agent Thomas Gray',
  'Professor Michael Strand',
];

const INVESTIGATOR_TYPES: Array<InvestigatorUnit['type']> = [
  'detective',
  'occult_researcher',
  'government_agent',
  'psychic',
];

/**
 * Spawn new investigators based on veil status and corruption
 */
export function spawnInvestigators(state: GreatOldOnesState): void {
  // Calculate spawn chance based on veil integrity
  const veilSpawnModifier = 1 - state.veil.integrity / 100;
  const corruptionSpawnModifier = state.resources.corruptionIndex / 100;

  // Base spawn rate: 10% per turn
  let spawnChance = 0.1;

  // Increase spawn rate as veil weakens
  spawnChance += veilSpawnModifier * 0.3;

  // Increase spawn rate as corruption spreads
  spawnChance += corruptionSpawnModifier * 0.2;

  // Apply doctrine modifiers
  if (state.doctrine) {
    const doctrineModifiers = {
      domination: 1.3,
      corruption: 1.0,
      convergence: 0.7,
    };
    spawnChance *= doctrineModifiers[state.doctrine];
  }

  // Cap at 80% chance
  spawnChance = Math.min(0.8, spawnChance);

  // Roll for spawn
  if (Math.random() < spawnChance) {
    const investigator = createInvestigator(state);
    state.investigators.push(investigator);

    addMissionLogEntry(state, {
      category: 'investigation',
      title: 'New Investigator Appears',
      description: `${investigator.name}, a ${investigator.type.replace('_', ' ')}, has begun investigating cult activities in ${getRegionName(state, investigator.regionId)}.`,
      veilChange: 2,
    });
  }

  // Spawn more investigators if crisis level
  if (state.veil.status === 'crisis' && Math.random() < 0.5) {
    const investigator = createInvestigator(state);
    state.investigators.push(investigator);
  }
}

/**
 * Create a new investigator
 */
function createInvestigator(state: GreatOldOnesState): InvestigatorUnit {
  const type = INVESTIGATOR_TYPES[Math.floor(Math.random() * INVESTIGATOR_TYPES.length)];
  const name = INVESTIGATOR_NAMES[Math.floor(Math.random() * INVESTIGATOR_NAMES.length)];

  // Select region with highest corruption or most cultist activity
  const targetRegion = selectInvestigatorStartRegion(state);

  const abilities: InvestigatorAbility[] = [];
  let psychicResistance = 50;
  let hasArtifactDetection = false;

  // Type-specific abilities
  switch (type) {
    case 'detective':
      abilities.push('cult_infiltration');
      psychicResistance = 40;
      break;
    case 'occult_researcher':
      abilities.push('ritual_disruption', 'artifact_detection');
      psychicResistance = 60;
      hasArtifactDetection = true;
      break;
    case 'government_agent':
      abilities.push('true_sight');
      psychicResistance = 50;
      break;
    case 'psychic':
      abilities.push('psychic_resistance', 'true_sight');
      psychicResistance = 90;
      break;
  }

  return {
    id: `investigator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    abilities,
    regionId: targetRegion.regionId,
    investigationProgress: 0,
    psychicResistance,
    hasArtifactDetection,
  };
}

/**
 * Select starting region for investigator (targets most problematic areas)
 */
function selectInvestigatorStartRegion(state: GreatOldOnesState): RegionalState {
  // Score regions by threat level
  const scoredRegions = state.regions.map(region => {
    let score = 0;
    score += region.corruption * 2;
    score += region.cultistCells * 10;
    score += region.ritualSites.length * 15;
    score += (100 - region.sanitySanity);
    return { region, score };
  });

  // Sort by score descending
  scoredRegions.sort((a, b) => b.score - a.score);

  // Pick one of top 3 regions (with some randomness)
  const topRegions = scoredRegions.slice(0, 3);
  return topRegions[Math.floor(Math.random() * topRegions.length)].region;
}

// ============================================================================
// INVESTIGATOR AI BEHAVIOR
// ============================================================================

/**
 * Update all investigators' actions
 */
export function updateInvestigatorAI(state: GreatOldOnesState): void {
  state.investigators.forEach(investigator => {
    // Check if investigator is already investigating something
    if (investigator.targetRegionId) {
      investigator.investigationProgress += 10;

      // Complete investigation
      if (investigator.investigationProgress >= 100) {
        completeInvestigation(state, investigator);
      }
    } else {
      // Start new investigation
      startInvestigation(state, investigator);
    }

    // Update regional investigation heat
    const region = state.regions.find(r => r.regionId === investigator.regionId);
    if (region) {
      region.investigationHeat = Math.min(100, region.investigationHeat + 5);
    }
  });

  // Check for raid mobilization
  checkForRaids(state);
}

/**
 * Start a new investigation
 */
function startInvestigation(state: GreatOldOnesState, investigator: InvestigatorUnit): void {
  const currentRegion = state.regions.find(r => r.regionId === investigator.regionId);
  if (!currentRegion) return;

  // Prioritize targets based on investigator type
  let target: { type: 'cultist_cell' | 'ritual_site'; id: string } | null = null;

  // Look for ritual sites in current region
  if (currentRegion.ritualSites.length > 0) {
    const site = currentRegion.ritualSites[0];
    target = { type: 'ritual_site', id: site.id };
  }
  // Look for cultist cells
  else if (currentRegion.cultistCells > 0) {
    const cell = state.cultistCells.find(c => c.regionId === investigator.regionId && !c.compromised);
    if (cell) {
      target = { type: 'cultist_cell', id: cell.id };
    }
  }
  // Move to adjacent high-threat region
  else {
    const targetRegion = selectInvestigatorStartRegion(state);
    investigator.regionId = targetRegion.regionId;
    return;
  }

  if (target) {
    investigator.targetRegionId = investigator.regionId;
    investigator.investigationProgress = 0;

    addMissionLogEntry(state, {
      category: 'investigation',
      title: 'Investigation Initiated',
      description: `${investigator.name} has begun investigating a ${target.type.replace('_', ' ')} in ${getRegionName(state, investigator.regionId)}.`,
    });
  }
}

/**
 * Complete an investigation and apply consequences
 */
function completeInvestigation(state: GreatOldOnesState, investigator: InvestigatorUnit): void {
  const region = state.regions.find(r => r.regionId === investigator.regionId);
  if (!region) return;

  // Determine what was discovered
  const discoveredCultistCell = state.cultistCells.find(
    c => c.regionId === investigator.regionId && !c.compromised
  );

  const discoveredRitualSite = region.ritualSites.find(
    s => !s.hasGlamourVeil
  );

  if (discoveredCultistCell) {
    // Mark cell as compromised
    discoveredCultistCell.compromised = true;

    // Chance to destroy cell
    const destructionChance = 0.3 + (investigator.abilities.length * 0.1);
    if (Math.random() < destructionChance) {
      // Remove cell
      state.cultistCells = state.cultistCells.filter(c => c.id !== discoveredCultistCell.id);
      region.cultistCells = Math.max(0, region.cultistCells - 1);

      addMissionLogEntry(state, {
        category: 'investigation',
        title: 'Cultist Cell Destroyed',
        description: `${investigator.name} has successfully destroyed a ${discoveredCultistCell.tier} cell in ${getRegionName(state, investigator.regionId)}. The Order suffers a setback.`,
        veilChange: 5,
        corruptionChange: -5,
      });
    } else {
      addMissionLogEntry(state, {
        category: 'investigation',
        title: 'Cultist Cell Exposed',
        description: `${investigator.name} has exposed a ${discoveredCultistCell.tier} cell in ${getRegionName(state, investigator.regionId)}, but cultists escaped.`,
        veilChange: 3,
      });
    }

    // Increase veil damage
    state.resources.veilIntegrity = Math.max(0, state.resources.veilIntegrity - 5);
  }

  if (discoveredRitualSite) {
    // Increase exposure risk
    discoveredRitualSite.exposureRisk += 30;

    // Chance to disrupt ritual
    if (investigator.abilities.includes('ritual_disruption') && discoveredRitualSite.activeRitual) {
      if (Math.random() < 0.5) {
        discoveredRitualSite.activeRitual = undefined;

        addMissionLogEntry(state, {
          category: 'investigation',
          title: 'Ritual Disrupted',
          description: `${investigator.name} has disrupted an active ritual at ${discoveredRitualSite.name}!`,
          veilChange: 8,
          sanityChange: -20,
        });
      }
    }

    // Chance to destroy site if no defensive wards
    if (!discoveredRitualSite.hasDefensiveWards && Math.random() < 0.2) {
      region.ritualSites = region.ritualSites.filter(s => s.id !== discoveredRitualSite.id);

      addMissionLogEntry(state, {
        category: 'investigation',
        title: 'Ritual Site Destroyed',
        description: `${investigator.name} has destroyed ${discoveredRitualSite.name}!`,
        veilChange: 10,
        sanityChange: -30,
      });
    }

    state.resources.veilIntegrity = Math.max(0, state.resources.veilIntegrity - 8);
  }

  // Reset investigation
  investigator.targetRegionId = undefined;
  investigator.investigationProgress = 0;
}

// ============================================================================
// RAID OPERATIONS
// ============================================================================

/**
 * Check if any regions should launch raids
 */
function checkForRaids(state: GreatOldOnesState): void {
  state.regions.forEach(region => {
    // High investigation heat triggers raids
    if (region.investigationHeat > 80) {
      const investigatorsInRegion = state.investigators.filter(
        inv => inv.regionId === region.regionId
      );

      if (investigatorsInRegion.length >= 2 && Math.random() < 0.3) {
        executeRaid(state, region, investigatorsInRegion);
        region.investigationHeat = Math.max(0, region.investigationHeat - 40);
      }
    }
  });
}

/**
 * Execute a coordinated raid on cult assets
 */
function executeRaid(
  state: GreatOldOnesState,
  region: RegionalState,
  investigators: InvestigatorUnit[]
): void {
  const raidStrength = investigators.length * 20;

  // Target priority: ritual sites > cultist cells
  const ritualSite = region.ritualSites[0];
  const cultistCell = state.cultistCells.find(c => c.regionId === region.regionId);

  if (ritualSite && !ritualSite.hasDefensiveWards) {
    // Raid ritual site
    const success = Math.random() * 100 < raidStrength;

    if (success) {
      region.ritualSites = region.ritualSites.filter(s => s.id !== ritualSite.id);

      addMissionLogEntry(state, {
        category: 'investigation',
        title: 'MAJOR RAID: Ritual Site Destroyed',
        description: `Coordinated raid by ${investigators.length} investigators has destroyed ${ritualSite.name} in ${region.regionName}. The Order suffers a major blow.`,
        veilChange: 15,
        sanityChange: -50,
      });

      state.resources.veilIntegrity = Math.max(0, state.resources.veilIntegrity - 15);
    } else {
      addMissionLogEntry(state, {
        category: 'investigation',
        title: 'Raid Repelled',
        description: `A coordinated raid on ${ritualSite.name} was repelled by cultist defenses. Casualties on both sides.`,
        veilChange: 5,
      });
    }
  } else if (cultistCell && !cultistCell.compromised) {
    // Raid cultist cell
    const success = Math.random() * 100 < raidStrength;

    if (success) {
      state.cultistCells = state.cultistCells.filter(c => c.id !== cultistCell.id);
      region.cultistCells = Math.max(0, region.cultistCells - 1);

      addMissionLogEntry(state, {
        category: 'investigation',
        title: 'RAID: Cultist Cell Eliminated',
        description: `Raid by ${investigators.length} investigators eliminated a ${cultistCell.tier} cell in ${region.regionName}.`,
        veilChange: 10,
        corruptionChange: -8,
      });

      state.resources.veilIntegrity = Math.max(0, state.resources.veilIntegrity - 10);
      state.resources.corruptionIndex = Math.max(0, state.resources.corruptionIndex - 8);
    }
  }
}

// ============================================================================
// COUNTER-RITUAL OPERATIONS
// ============================================================================

export interface CounterRitualOperation {
  id: string;
  investigatorId: string;
  targetSiteId: string;
  type: 'disruption' | 'banishment' | 'ward_placement';
  progress: number;
  successChance: number;
}

/**
 * Investigators attempt counter-rituals
 */
export function executeCounterRituals(state: GreatOldOnesState): void {
  // Only occult researchers can perform counter-rituals
  const occultInvestigators = state.investigators.filter(
    inv => inv.type === 'occult_researcher' && inv.abilities.includes('ritual_disruption')
  );

  occultInvestigators.forEach(investigator => {
    const region = state.regions.find(r => r.regionId === investigator.regionId);
    if (!region) return;

    // Find active ritual sites
    const activeSites = region.ritualSites.filter(s => s.activeRitual && !s.hasDefensiveWards);

    if (activeSites.length > 0 && Math.random() < 0.2) {
      const targetSite = activeSites[0];

      // Attempt to disrupt
      const success = Math.random() < (investigator.psychicResistance / 100);

      if (success) {
        targetSite.activeRitual = undefined;

        addMissionLogEntry(state, {
          category: 'investigation',
          title: 'Counter-Ritual Successful',
          description: `${investigator.name} performed a counter-ritual at ${targetSite.name}, disrupting the cult's working!`,
          veilChange: 5,
          sanityChange: -15,
        });
      } else {
        addMissionLogEntry(state, {
          category: 'investigation',
          title: 'Counter-Ritual Failed',
          description: `${investigator.name} attempted a counter-ritual but was overwhelmed by eldritch forces.`,
        });

        // Chance to harm investigator
        if (Math.random() < 0.3) {
          state.investigators = state.investigators.filter(inv => inv.id !== investigator.id);

          addMissionLogEntry(state, {
            category: 'investigation',
            title: 'Investigator Lost',
            description: `${investigator.name} was consumed by the ritual's backlash. Their mind is shattered beyond recovery.`,
            veilChange: -3,
          });
        }
      }
    }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRegionName(state: GreatOldOnesState, regionId: string): string {
  const region = state.regions.find(r => r.regionId === regionId);
  return region ? region.regionName : 'Unknown Region';
}

/**
 * Remove investigators that have been corrupted or driven mad
 */
export function removeCorruptedInvestigators(state: GreatOldOnesState): void {
  const initialCount = state.investigators.length;

  state.investigators = state.investigators.filter(inv => {
    // Investigators in highly corrupted regions may be converted
    const region = state.regions.find(r => r.regionId === inv.regionId);
    if (region && region.corruption > 70) {
      const corruptionChance = (region.corruption - 70) / 100;
      if (Math.random() < corruptionChance) {
        addMissionLogEntry(state, {
          category: 'investigation',
          title: 'Investigator Converted',
          description: `${inv.name} has succumbed to the corruption in ${region.regionName}. They now serve the Order.`,
          sanityChange: 10, // Gain sanity from converted investigator
        });
        return false;
      }
    }

    // Investigators in low-sanity regions may go mad
    if (region && region.sanitySanity < 30) {
      const madnessChance = (30 - region.sanitySanity) / 100;
      if (Math.random() < madnessChance) {
        addMissionLogEntry(state, {
          category: 'investigation',
          title: 'Investigator Driven Mad',
          description: `${inv.name} has been driven insane by what they witnessed in ${region.regionName}. They are no longer a threat.`,
        });
        return false;
      }
    }

    return true;
  });

  const removed = initialCount - state.investigators.length;
  if (removed > 0) {
    state.resources.veilIntegrity = Math.min(100, state.resources.veilIntegrity + removed * 2);
  }
}
