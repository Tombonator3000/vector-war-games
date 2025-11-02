/**
 * Investigation Bureau AI System
 * Handles investigator spawning, AI behavior, and counter-operations
 */

import type {
  GreatOldOnesState,
  InvestigatorUnit,
  InvestigatorAbility,
  RegionalState,
  RitualSite,
  CultistCell,
} from '../types/greatOldOnes';
import { addMissionLogEntry } from './greatOldOnesHelpers';

// ============================================================================
// INVESTIGATOR SPAWNING
// ============================================================================

export interface InvestigatorSpawnConditions {
  /** Base spawn chance per turn (0-1) */
  baseSpawnChance: number;

  /** Modifiers based on game state */
  veilModifier: number; // Lower veil = more investigators
  corruptionModifier: number; // Higher corruption = more investigators
  manifestationModifier: number; // Recent manifestations increase spawn
  exposureModifier: number; // Exposed ritual sites increase spawn

  /** Final spawn chance after all modifiers */
  finalSpawnChance: number;
}

/**
 * Calculate investigator spawn conditions
 */
export function calculateInvestigatorSpawnChance(gooState: GreatOldOnesState): InvestigatorSpawnConditions {
  let baseSpawnChance = 0.1; // 10% base chance per turn

  // Veil modifier (lower veil = more investigators)
  const veilModifier = (100 - gooState.veil.integrity) / 200; // 0-0.5

  // Corruption modifier (higher corruption = more investigators)
  const corruptionModifier = gooState.resources.corruptionIndex / 200; // 0-0.5

  // Manifestation modifier (check recent mission log for manifestations)
  const recentManifestations = gooState.missionLog
    .slice(-10)
    .filter(e => e.category === 'event' && e.title.includes('Manifestation')).length;
  const manifestationModifier = Math.min(0.3, recentManifestations * 0.1);

  // Exposure modifier (exposed ritual sites)
  const exposedSites = gooState.regions
    .flatMap(r => r.ritualSites)
    .filter(s => s.exposureRisk > 70).length;
  const exposureModifier = Math.min(0.3, exposedSites * 0.05);

  const finalSpawnChance = Math.min(
    0.9,
    baseSpawnChance + veilModifier + corruptionModifier + manifestationModifier + exposureModifier
  );

  return {
    baseSpawnChance,
    veilModifier,
    corruptionModifier,
    manifestationModifier,
    exposureModifier,
    finalSpawnChance,
  };
}

/**
 * Attempt to spawn a new investigator
 */
export function attemptInvestigatorSpawn(gooState: GreatOldOnesState): InvestigatorUnit | null {
  const spawnConditions = calculateInvestigatorSpawnChance(gooState);

  if (Math.random() < spawnConditions.finalSpawnChance) {
    return spawnInvestigator(gooState);
  }

  return null;
}

/**
 * Spawn a new investigator
 */
export function spawnInvestigator(gooState: GreatOldOnesState): InvestigatorUnit {
  // Determine investigator type based on game state
  const type = determineInvestigatorType(gooState);

  // Generate investigator profile
  const investigator = generateInvestigator(type, gooState);

  // Add to state
  gooState.investigators.push(investigator);

  // Increase investigation heat in spawn region
  const region = gooState.regions.find(r => r.regionId === investigator.regionId);
  if (region) {
    region.investigationHeat = Math.min(100, region.investigationHeat + 20);
  }

  // Log spawn
  addMissionLogEntry(gooState, {
    category: 'investigation',
    title: `New Investigator: ${investigator.name}`,
    description: `${investigator.name}, a ${investigator.type.replace('_', ' ')}, has begun investigating your operations in ${region?.regionName || 'unknown region'}.`,
  });

  return investigator;
}

/**
 * Determine what type of investigator should spawn
 */
function determineInvestigatorType(
  gooState: GreatOldOnesState
): InvestigatorUnit['type'] {
  const veil = gooState.veil.integrity;
  const corruption = gooState.resources.corruptionIndex;

  // High corruption = more government agents
  if (corruption > 70) {
    return 'government_agent';
  }

  // Low veil = more occult researchers
  if (veil < 30) {
    return 'occult_researcher';
  }

  // Medium veil = detectives and researchers
  if (veil < 60) {
    return Math.random() > 0.5 ? 'detective' : 'occult_researcher';
  }

  // High veil = mostly detectives
  if (Math.random() > 0.8) {
    return 'psychic'; // Rare psychic investigators
  }

  return 'detective';
}

/**
 * Generate investigator profile
 */
function generateInvestigator(
  type: InvestigatorUnit['type'],
  gooState: GreatOldOnesState
): InvestigatorUnit {
  // Generate name
  const firstName = [
    'Sarah', 'Marcus', 'Elena', 'Thomas', 'Rachel', 'David',
    'Jennifer', 'Michael', 'Amanda', 'Christopher',
  ][Math.floor(Math.random() * 10)];

  const lastName = [
    'Chen', 'Rodriguez', 'Smith', 'Patel', 'Johnson', 'Kim',
    'Anderson', 'Martinez', 'Taylor', 'Brown',
  ][Math.floor(Math.random() * 10)];

  const name = `${firstName} ${lastName}`;

  // Determine abilities based on type
  const abilities = determineInvestigatorAbilities(type);

  // Select spawn region (region with highest corruption or most ritual sites)
  const targetRegion = selectInvestigationTarget(gooState);

  // Base stats
  const psychicResistance = type === 'psychic' ? 90 : type === 'occult_researcher' ? 60 : 30;
  const hasArtifactDetection = type === 'occult_researcher' || type === 'psychic';

  return {
    id: `investigator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    abilities,
    regionId: targetRegion.regionId,
    targetRegionId: targetRegion.regionId,
    investigationProgress: 0,
    psychicResistance,
    hasArtifactDetection,
  };
}

/**
 * Determine investigator abilities
 */
function determineInvestigatorAbilities(type: InvestigatorUnit['type']): InvestigatorAbility[] {
  const abilities: InvestigatorAbility[] = [];

  switch (type) {
    case 'detective':
      abilities.push('cult_infiltration');
      if (Math.random() > 0.5) abilities.push('artifact_detection');
      break;

    case 'occult_researcher':
      abilities.push('artifact_detection');
      abilities.push('ritual_disruption');
      if (Math.random() > 0.7) abilities.push('psychic_resistance');
      break;

    case 'government_agent':
      abilities.push('cult_infiltration');
      if (Math.random() > 0.6) abilities.push('ritual_disruption');
      break;

    case 'psychic':
      abilities.push('psychic_resistance');
      abilities.push('true_sight');
      abilities.push('artifact_detection');
      break;
  }

  return abilities;
}

/**
 * Select which region investigator should target
 */
function selectInvestigationTarget(gooState: GreatOldOnesState): RegionalState {
  // Priority: regions with high corruption and many ritual sites
  const scored = gooState.regions.map(region => ({
    region,
    score:
      region.corruption * 0.5 +
      region.ritualSites.length * 20 +
      region.cultistCells * 10 -
      region.investigationHeat * 0.3, // Avoid saturated regions
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored[0].region;
}

// ============================================================================
// INVESTIGATOR AI BEHAVIOR
// ============================================================================

export type InvestigatorAction =
  | 'investigate_region'
  | 'infiltrate_cult'
  | 'raid_ritual_site'
  | 'disrupt_ritual'
  | 'gather_evidence'
  | 'recruit_allies'
  | 'request_backup';

export interface InvestigatorBehavior {
  investigator: InvestigatorUnit;
  chosenAction: InvestigatorAction;
  targetSite?: RitualSite;
  targetCell?: CultistCell;
  successChance: number;
}

/**
 * Determine what action an investigator takes this turn
 */
export function determineInvestigatorAction(
  investigator: InvestigatorUnit,
  gooState: GreatOldOnesState
): InvestigatorBehavior {
  const region = gooState.regions.find(r => r.regionId === investigator.regionId);

  if (!region) {
    // Default to investigation if region not found
    return {
      investigator,
      chosenAction: 'investigate_region',
      successChance: 0.5,
    };
  }

  // Assess threats in region
  const ritualSites = region.ritualSites.filter(s => !s.hasGlamourVeil || investigator.hasArtifactDetection);
  const cultistCells = gooState.cultistCells.filter(c => c.regionId === region.regionId && !c.compromised);

  // Psychics can see through veils
  const visibleSites =
    investigator.abilities.includes('true_sight') ? region.ritualSites : ritualSites;

  // Decision tree based on investigation progress and abilities
  let chosenAction: InvestigatorAction;
  let targetSite: RitualSite | undefined;
  let targetCell: CultistCell | undefined;
  let successChance = 0.5;

  if (investigator.investigationProgress < 30) {
    // Early stage: gather evidence
    chosenAction = 'investigate_region';
    successChance = 0.7;
  } else if (investigator.investigationProgress < 60) {
    // Mid stage: infiltrate or disrupt
    if (cultistCells.length > 0 && investigator.abilities.includes('cult_infiltration')) {
      chosenAction = 'infiltrate_cult';
      targetCell = cultistCells[0];
      successChance = 0.5;
    } else if (visibleSites.length > 0) {
      chosenAction = 'gather_evidence';
      targetSite = visibleSites[0];
      successChance = 0.6;
    } else {
      chosenAction = 'investigate_region';
      successChance = 0.7;
    }
  } else {
    // Late stage: raid or disrupt
    if (visibleSites.length > 0 && visibleSites[0].activeRitual) {
      // Active ritual - try to disrupt
      if (investigator.abilities.includes('ritual_disruption')) {
        chosenAction = 'disrupt_ritual';
        targetSite = visibleSites[0];
        successChance = 0.4;
      } else {
        chosenAction = 'request_backup';
        successChance = 0.8;
      }
    } else if (visibleSites.length > 0) {
      // Raid the site
      chosenAction = 'raid_ritual_site';
      targetSite = visibleSites[0];
      successChance = 0.5;
    } else {
      // Recruit allies for major operation
      chosenAction = 'recruit_allies';
      successChance = 0.6;
    }
  }

  return {
    investigator,
    chosenAction,
    targetSite,
    targetCell,
    successChance,
  };
}

/**
 * Execute investigator actions
 */
export function executeInvestigatorActions(gooState: GreatOldOnesState): void {
  gooState.investigators.forEach(investigator => {
    const behavior = determineInvestigatorAction(investigator, gooState);
    const success = Math.random() < behavior.successChance;

    executeInvestigatorAction(behavior, success, gooState);
  });
}

/**
 * Execute a single investigator action
 */
function executeInvestigatorAction(
  behavior: InvestigatorBehavior,
  success: boolean,
  gooState: GreatOldOnesState
): void {
  const { investigator, chosenAction, targetSite, targetCell } = behavior;

  switch (chosenAction) {
    case 'investigate_region':
      if (success) {
        investigator.investigationProgress += 15;
        const region = gooState.regions.find(r => r.regionId === investigator.regionId);
        if (region) {
          region.investigationHeat += 10;
        }

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Investigation Progress',
          description: `${investigator.name} has uncovered more evidence of cult activity.`,
          veilChange: -2,
        });
      }
      break;

    case 'infiltrate_cult':
      if (success && targetCell) {
        targetCell.compromised = true;
        investigator.investigationProgress += 25;

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Cult Cell Infiltrated',
          description: `${investigator.name} has infiltrated a cultist cell. Operations are compromised.`,
          veilChange: -5,
          corruptionChange: -3,
        });

        // Apply effects
        gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 5);
        gooState.resources.veilIntegrity = gooState.veil.integrity;
      } else {
        // Failed infiltration - investigator exposed
        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Infiltration Failed',
          description: `${investigator.name}'s infiltration attempt was detected. They are exposed but still active.`,
        });
      }
      break;

    case 'raid_ritual_site':
      if (success && targetSite) {
        // Destroy the site
        const region = gooState.regions.find(r => r.regionId === investigator.regionId);
        if (region) {
          region.ritualSites = region.ritualSites.filter(s => s.id !== targetSite.id);
        }

        investigator.investigationProgress += 30;

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Ritual Site Raided',
          description: `${investigator.name} led a raid on ${targetSite.name}. The site has been destroyed.`,
          veilChange: -10,
          corruptionChange: -5,
        });

        // Apply effects
        gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 10);
        gooState.resources.veilIntegrity = gooState.veil.integrity;
        gooState.resources.corruptionIndex = Math.max(
          0,
          gooState.resources.corruptionIndex - 5
        );
      } else {
        // Raid failed - site defenses held
        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Raid Repelled',
          description: `${investigator.name}'s raid on ${targetSite?.name} was repelled by cult defenses.`,
        });
      }
      break;

    case 'disrupt_ritual':
      if (success && targetSite?.activeRitual) {
        // Cancel the ritual
        targetSite.activeRitual = undefined;

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Ritual Disrupted',
          description: `${investigator.name} disrupted the ${targetSite.activeRitual.ritualName} ritual at ${targetSite.name}.`,
          veilChange: -5,
        });

        // Return invested power to global pool
        gooState.resources.eldritchPower += targetSite.activeRitual.powerInvested * 0.5;
      } else {
        // Disruption failed - investigator may be harmed
        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Disruption Failed',
          description: `${investigator.name} attempted to disrupt a ritual but failed. They are shaken but still active.`,
        });
        investigator.psychicResistance = Math.max(0, investigator.psychicResistance - 10);
      }
      break;

    case 'gather_evidence':
      if (success && targetSite) {
        investigator.investigationProgress += 20;
        targetSite.exposureRisk += 20;

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Evidence Gathered',
          description: `${investigator.name} has gathered evidence at ${targetSite.name}. The site is now more exposed.`,
          veilChange: -3,
        });

        gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 3);
        gooState.resources.veilIntegrity = gooState.veil.integrity;
      }
      break;

    case 'recruit_allies':
      if (success) {
        // Spawn another investigator
        spawnInvestigator(gooState);

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Investigator Recruited Ally',
          description: `${investigator.name} has recruited another investigator to the cause. Opposition grows.`,
        });
      }
      break;

    case 'request_backup':
      if (success) {
        // Increase investigation heat
        const region = gooState.regions.find(r => r.regionId === investigator.regionId);
        if (region) {
          region.investigationHeat += 30;
        }

        addMissionLogEntry(gooState, {
          category: 'investigation',
          title: 'Backup Requested',
          description: `${investigator.name} has requested government backup. Investigation pressure intensifies.`,
        });
      }
      break;
  }

  // Cap investigation progress at 100
  investigator.investigationProgress = Math.min(100, investigator.investigationProgress);
}

// ============================================================================
// COUNTER-OPERATIONS
// ============================================================================

export interface CounterOperation {
  id: string;
  name: string;
  type: 'raid' | 'surveillance' | 'arrest' | 'media_campaign' | 'quarantine';
  targetRegionId: string;
  leadInvestigator?: InvestigatorUnit;

  /** Operation strength (0-100) */
  strength: number;

  /** Turns until operation executes */
  turnsUntilExecution: number;

  /** Can be detected by the Order? */
  detectable: boolean;

  /** Has been detected? */
  detected: boolean;
}

/**
 * Check if investigators should launch a counter-operation
 */
export function checkForCounterOperations(gooState: GreatOldOnesState): CounterOperation | null {
  // Counter-ops triggered by high investigation heat or multiple investigators
  const highHeatRegions = gooState.regions.filter(r => r.investigationHeat > 70);

  if (highHeatRegions.length === 0) return null;

  // Check if multiple investigators in same region
  const regionInvestigatorCount: Record<string, number> = {};
  gooState.investigators.forEach(inv => {
    regionInvestigatorCount[inv.regionId] = (regionInvestigatorCount[inv.regionId] || 0) + 1;
  });

  const multiInvestigatorRegions = Object.entries(regionInvestigatorCount).filter(
    ([_, count]) => count >= 2
  );

  if (multiInvestigatorRegions.length > 0) {
    // Launch coordinated counter-op
    const targetRegionId = multiInvestigatorRegions[0][0];
    const leadInvestigator = gooState.investigators.find(inv => inv.regionId === targetRegionId);

    return {
      id: `counter_op_${Date.now()}`,
      name: 'Coordinated Investigator Strike',
      type: 'raid',
      targetRegionId,
      leadInvestigator,
      strength: 80,
      turnsUntilExecution: 2,
      detectable: true,
      detected: false,
    };
  }

  // Single investigator high-heat region
  if (highHeatRegions.length > 0 && Math.random() > 0.7) {
    const targetRegion = highHeatRegions[0];
    return {
      id: `counter_op_${Date.now()}`,
      name: 'Investigation Sweep',
      type: 'surveillance',
      targetRegionId: targetRegion.regionId,
      strength: 50,
      turnsUntilExecution: 3,
      detectable: true,
      detected: false,
    };
  }

  return null;
}

/**
 * Execute a counter-operation
 */
export function executeCounterOperation(op: CounterOperation, gooState: GreatOldOnesState): void {
  const region = gooState.regions.find(r => r.regionId === op.targetRegionId);
  if (!region) return;

  switch (op.type) {
    case 'raid':
      // Destroy 1-2 ritual sites
      const sitesToDestroy = Math.min(2, region.ritualSites.length);
      region.ritualSites = region.ritualSites.slice(sitesToDestroy);

      // Compromise cultist cells
      const cellsInRegion = gooState.cultistCells.filter(c => c.regionId === region.regionId);
      cellsInRegion.forEach(cell => {
        if (Math.random() < 0.5) {
          cell.compromised = true;
        }
      });

      addMissionLogEntry(gooState, {
        category: 'investigation',
        title: 'Major Raid Executed',
        description: `A coordinated raid in ${region.regionName} has destroyed ${sitesToDestroy} ritual sites and compromised multiple cells.`,
        veilChange: -15,
        corruptionChange: -10,
      });

      gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 15);
      gooState.resources.veilIntegrity = gooState.veil.integrity;
      gooState.resources.corruptionIndex = Math.max(0, gooState.resources.corruptionIndex - 10);
      break;

    case 'surveillance':
      // Increase exposure risk of all sites
      region.ritualSites.forEach(site => {
        site.exposureRisk += 25;
      });

      region.investigationHeat += 20;

      addMissionLogEntry(gooState, {
        category: 'investigation',
        title: 'Surveillance Operation',
        description: `Intensive surveillance in ${region.regionName} has increased exposure risk of all operations.`,
        veilChange: -5,
      });

      gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 5);
      gooState.resources.veilIntegrity = gooState.veil.integrity;
      break;

    case 'arrest':
      // Remove compromised cells
      const compromisedCells = gooState.cultistCells.filter(
        c => c.regionId === region.regionId && c.compromised
      );
      gooState.cultistCells = gooState.cultistCells.filter(c => !compromisedCells.includes(c));

      addMissionLogEntry(gooState, {
        category: 'investigation',
        title: 'Mass Arrests',
        description: `Authorities have arrested ${compromisedCells.length} cultist cells in ${region.regionName}.`,
        veilChange: -10,
        corruptionChange: -5,
      });

      gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 10);
      gooState.resources.veilIntegrity = gooState.veil.integrity;
      gooState.resources.corruptionIndex = Math.max(0, gooState.resources.corruptionIndex - 5);
      break;

    case 'media_campaign':
      // Reduce corruption through public awareness
      region.corruption = Math.max(0, region.corruption - 15);

      addMissionLogEntry(gooState, {
        category: 'investigation',
        title: 'Media Exposé',
        description: `Investigative journalists have exposed cult activities in ${region.regionName}. Public opinion turns against you.`,
        veilChange: -20,
        corruptionChange: -15,
      });

      gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 20);
      gooState.resources.veilIntegrity = gooState.veil.integrity;
      gooState.resources.corruptionIndex = Math.max(0, gooState.resources.corruptionIndex - 15);
      break;

    case 'quarantine':
      // Lock down region - reduce corruption and sanity harvesting
      region.corruption = Math.max(0, region.corruption - 10);
      region.investigationHeat += 40;

      addMissionLogEntry(gooState, {
        category: 'investigation',
        title: 'Region Quarantined',
        description: `${region.regionName} has been quarantined by authorities. Operations severely restricted.`,
        veilChange: -10,
        corruptionChange: -10,
      });

      gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 10);
      gooState.resources.veilIntegrity = gooState.veil.integrity;
      gooState.resources.corruptionIndex = Math.max(0, gooState.resources.corruptionIndex - 10);
      break;
  }
}

// ============================================================================
// REMOVAL CONDITIONS
// ============================================================================

/**
 * Check if investigators should be removed (eliminated by cult, retired, etc.)
 */
export function processInvestigatorAttrition(gooState: GreatOldOnesState): void {
  gooState.investigators = gooState.investigators.filter(inv => {
    // High corruption regions can "disappear" investigators
    const region = gooState.regions.find(r => r.regionId === inv.regionId);
    if (region && region.corruption > 80 && Math.random() > 0.8) {
      addMissionLogEntry(gooState, {
        category: 'event',
        title: 'Investigator Disappeared',
        description: `${inv.name} has mysteriously vanished. Your corrupted network strikes again.`,
      });
      return false; // Remove investigator
    }

    // Low psychic resistance = madness
    if (inv.psychicResistance < 10 && Math.random() > 0.7) {
      addMissionLogEntry(gooState, {
        category: 'event',
        title: 'Investigator Succumbs to Madness',
        description: `${inv.name} has been committed to an asylum. Too much exposure to the truth broke their mind.`,
        sanityChange: 10, // Order gains sanity fragments
      });
      gooState.resources.sanityFragments += 10;
      return false; // Remove investigator
    }

    // Investigators at 100% progress may "retire" after publishing findings
    if (inv.investigationProgress >= 100 && Math.random() > 0.6) {
      addMissionLogEntry(gooState, {
        category: 'investigation',
        title: 'Investigator Publishes Findings',
        description: `${inv.name} has published their investigation. The truth spreads.`,
        veilChange: -25,
      });
      gooState.veil.integrity = Math.max(0, gooState.veil.integrity - 25);
      gooState.resources.veilIntegrity = gooState.veil.integrity;
      return false; // Remove investigator (mission complete)
    }

    return true; // Keep investigator
  });
}
