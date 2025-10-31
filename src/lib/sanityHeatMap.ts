/**
 * Sanity Heat Map System
 * Manages regional madness, nightmares, and mass hallucinations
 */

import type {
  RegionalState,
  GreatOldOnesState,
  CulturalTrait,
  Doctrine,
} from '../types/greatOldOnes';
import { addMissionLogEntry } from './greatOldOnesHelpers';

// ============================================================================
// SANITY EVENTS
// ============================================================================

export type SanityEventType =
  | 'nightmares'
  | 'mass_hallucination'
  | 'asylum_overflow'
  | 'suicide_wave'
  | 'madness_cult'
  | 'reality_distortion';

export interface SanityEvent {
  id: string;
  type: SanityEventType;
  regionId: string;
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  description: string;
  sanityDrain: number;
  duration: number; // Turns this event lasts
  effects: SanityEventEffects;
}

export interface SanityEventEffects {
  populationLoss?: number; // Percentage
  corruptionGain?: number;
  investigationHeatChange?: number;
  veilDamage?: number;
  sanityFragmentsGained?: number;
}

export interface AsylumCapacity {
  regionId: string;
  capacity: number;
  currentPatients: number;
  overflowRisk: number; // 0-100
}

// ============================================================================
// CULTURAL TRAIT EFFECTS
// ============================================================================

const CULTURAL_TRAIT_MODIFIERS: Record<
  CulturalTrait,
  {
    sanityResistance: number; // Multiplier for sanity drain
    corruptionVulnerability: number; // Multiplier for corruption spread
    investigationBonus: number; // Bonus to investigation effectiveness
    description: string;
  }
> = {
  rationalist: {
    sanityResistance: 0.8, // 20% less sanity drain
    corruptionVulnerability: 1.2, // 20% more resistant to corruption via mysticism
    investigationBonus: 15,
    description: 'Rationalist societies resist mystical corruption but suffer more from cognitive dissonance',
  },
  superstitious: {
    sanityResistance: 1.3, // 30% more sanity drain
    corruptionVulnerability: 0.7, // 30% easier to corrupt via fear
    investigationBonus: -10,
    description: 'Superstitious populations are highly susceptible to fear campaigns',
  },
  academic: {
    sanityResistance: 0.9, // 10% less sanity drain
    corruptionVulnerability: 1.1, // 10% more resistant
    investigationBonus: 25,
    description: 'Academic centers provide strong investigation support but attract attention',
  },
  isolated: {
    sanityResistance: 1.0, // Normal sanity drain
    corruptionVulnerability: 1.3, // 30% slower corruption spread
    investigationBonus: -15,
    description: 'Isolated regions are harder to corrupt but also harder to investigate',
  },
  urban: {
    sanityResistance: 1.2, // 20% more sanity drain (population density)
    corruptionVulnerability: 0.8, // 20% easier to corrupt (more targets)
    investigationBonus: 10,
    description: 'Urban centers are ideal for sanity harvesting and rapid corruption',
  },
  faithful: {
    sanityResistance: 0.7, // 30% less sanity drain (faith provides protection)
    corruptionVulnerability: 1.4, // 40% more resistant to corruption
    investigationBonus: 5,
    description: 'Faith provides strong protection against madness and corruption',
  },
};

/**
 * Get effective sanity resistance for a region
 */
export function getRegionalSanityResistance(region: RegionalState): number {
  let resistance = 1.0;

  region.culturalTraits.forEach(trait => {
    resistance *= CULTURAL_TRAIT_MODIFIERS[trait].sanityResistance;
  });

  return resistance;
}

/**
 * Get effective corruption vulnerability for a region
 */
export function getRegionalCorruptionVulnerability(region: RegionalState): number {
  let vulnerability = 1.0;

  region.culturalTraits.forEach(trait => {
    vulnerability *= CULTURAL_TRAIT_MODIFIERS[trait].corruptionVulnerability;
  });

  return vulnerability;
}

/**
 * Get investigation bonus for a region
 */
export function getRegionalInvestigationBonus(region: RegionalState): number {
  let bonus = 0;

  region.culturalTraits.forEach(trait => {
    bonus += CULTURAL_TRAIT_MODIFIERS[trait].investigationBonus;
  });

  return bonus;
}

// ============================================================================
// SANITY DRAIN MECHANICS
// ============================================================================

/**
 * Update regional sanity levels
 */
export function updateRegionalSanity(state: GreatOldOnesState): void {
  state.regions.forEach(region => {
    let sanityDrain = 0;

    // Base sanity drain from corruption
    if (region.corruption > 20) {
      sanityDrain += (region.corruption / 100) * 0.5;
    }

    // Sanity drain from cultist presence
    sanityDrain += region.cultistCells * 0.2;

    // Sanity drain from ritual sites
    region.ritualSites.forEach(site => {
      if (site.activeRitual) {
        sanityDrain += 1.0;
      } else {
        sanityDrain += 0.3;
      }
    });

    // Sanity drain from summoned entities nearby
    const entitiesInRegion = state.summonedEntities.filter(e => e.regionId === region.regionId);
    entitiesInRegion.forEach(entity => {
      sanityDrain += entity.terrorRadius * 0.1;
    });

    // Apply cultural trait resistance
    const resistance = getRegionalSanityResistance(region);
    sanityDrain *= resistance;

    // Apply doctrine modifiers
    if (state.doctrine === 'domination') {
      sanityDrain *= 1.3; // Domination causes more fear
    } else if (state.doctrine === 'convergence') {
      sanityDrain *= 0.7; // Convergence is gentler
    }

    // Apply sanity drain
    region.sanitySanity = Math.max(0, region.sanitySanity - sanityDrain);

    // Check for sanity threshold events
    checkSanityThresholds(state, region);

    // Update asylum capacity
    updateAsylumCapacity(state, region);
  });
}

/**
 * Check if region has crossed sanity thresholds
 */
function checkSanityThresholds(state: GreatOldOnesState, region: RegionalState): void {
  const previousSanity = region.sanitySanity + 1; // Approximate previous value

  // Critical threshold: 20%
  if (region.sanitySanity <= 20 && previousSanity > 20) {
    triggerSanityEvent(state, region, 'catastrophic');

    addMissionLogEntry(state, {
      category: 'event',
      title: 'SOCIETAL BREAKDOWN',
      description: `${region.regionName} has descended into mass psychosis. Government authority has collapsed. The region is lost to madness.`,
      sanityChange: 50,
      corruptionChange: 30,
    });
  }
  // Severe threshold: 40%
  else if (region.sanitySanity <= 40 && previousSanity > 40) {
    triggerSanityEvent(state, region, 'severe');

    addMissionLogEntry(state, {
      category: 'event',
      title: 'Mass Hysteria',
      description: `${region.regionName} is gripped by widespread panic. Hospitals are overwhelmed. Emergency services are failing.`,
      sanityChange: 30,
      corruptionChange: 15,
    });
  }
  // Moderate threshold: 60%
  else if (region.sanitySanity <= 60 && previousSanity > 60) {
    triggerSanityEvent(state, region, 'moderate');

    addMissionLogEntry(state, {
      category: 'event',
      title: 'Sanity Crisis',
      description: `${region.regionName} reports surging rates of mental illness. Authorities are concerned but not yet alarmed.`,
      sanityChange: 15,
      corruptionChange: 8,
    });
  }
}

// ============================================================================
// SANITY EVENTS
// ============================================================================

/**
 * Trigger a sanity-related event in a region
 */
export function triggerSanityEvent(
  state: GreatOldOnesState,
  region: RegionalState,
  severity: SanityEvent['severity']
): void {
  const eventTypes: SanityEventType[] = [
    'nightmares',
    'mass_hallucination',
    'asylum_overflow',
    'suicide_wave',
    'madness_cult',
    'reality_distortion',
  ];

  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

  const event = createSanityEvent(state, region, eventType, severity);

  // Apply event effects
  applySanityEventEffects(state, region, event);

  // Add to recent events
  region.recentEvents.push(event.description);
  if (region.recentEvents.length > 5) {
    region.recentEvents = region.recentEvents.slice(-5);
  }
}

/**
 * Create a sanity event
 */
function createSanityEvent(
  state: GreatOldOnesState,
  region: RegionalState,
  type: SanityEventType,
  severity: SanityEvent['severity']
): SanityEvent {
  const severityMultipliers = {
    minor: 1,
    moderate: 2,
    severe: 3,
    catastrophic: 5,
  };

  const multiplier = severityMultipliers[severity];

  const eventTemplates: Record<SanityEventType, (mult: number) => Omit<SanityEvent, 'id' | 'regionId'>> = {
    nightmares: (mult) => ({
      type: 'nightmares',
      severity,
      description: `Widespread nightmares plague ${region.regionName}. Citizens report dreams of impossible geometries and whispered voices.`,
      sanityDrain: 2 * mult,
      duration: 2,
      effects: {
        sanityFragmentsGained: 10 * mult,
        veilDamage: 1 * mult,
      },
    }),

    mass_hallucination: (mult) => ({
      type: 'mass_hallucination',
      severity,
      description: `Thousands in ${region.regionName} report seeing impossible things. The sky ripples. Buildings twist. Reality bends.`,
      sanityDrain: 5 * mult,
      duration: 1,
      effects: {
        sanityFragmentsGained: 25 * mult,
        veilDamage: 5 * mult,
        investigationHeatChange: 20,
      },
    }),

    asylum_overflow: (mult) => ({
      type: 'asylum_overflow',
      severity,
      description: `Mental hospitals in ${region.regionName} are at 300% capacity. The mad wander the streets, speaking in tongues.`,
      sanityDrain: 3 * mult,
      duration: 3,
      effects: {
        sanityFragmentsGained: 20 * mult,
        corruptionGain: 5 * mult,
        investigationHeatChange: 10,
      },
    }),

    suicide_wave: (mult) => ({
      type: 'suicide_wave',
      severity,
      description: `A wave of suicides sweeps ${region.regionName}. Victims leave behind writings in unknown languages.`,
      sanityDrain: 8 * mult,
      duration: 1,
      effects: {
        populationLoss: 0.5 * mult,
        sanityFragmentsGained: 40 * mult,
        veilDamage: 8 * mult,
        investigationHeatChange: 25,
      },
    }),

    madness_cult: (mult) => ({
      type: 'madness_cult',
      severity,
      description: `Spontaneous cult activity emerges in ${region.regionName}. The mad worship entities they glimpse in their visions.`,
      sanityDrain: 4 * mult,
      duration: 4,
      effects: {
        corruptionGain: 10 * mult,
        sanityFragmentsGained: 15 * mult,
      },
    }),

    reality_distortion: (mult) => ({
      type: 'reality_distortion',
      severity,
      description: `Reality itself warps in ${region.regionName}. Physics behaves strangely. Time stutters. Space folds.`,
      sanityDrain: 10 * mult,
      duration: 2,
      effects: {
        sanityFragmentsGained: 50 * mult,
        veilDamage: 15 * mult,
        investigationHeatChange: -10, // Investigators flee
        corruptionGain: 15 * mult,
      },
    }),
  };

  const template = eventTemplates[type](multiplier);

  return {
    id: `sanity_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    regionId: region.regionId,
    ...template,
  };
}

/**
 * Apply sanity event effects to region and state
 */
function applySanityEventEffects(
  state: GreatOldOnesState,
  region: RegionalState,
  event: SanityEvent
): void {
  const effects = event.effects;

  // Population loss
  if (effects.populationLoss) {
    // Would need to track regional population
    // For now, just extra sanity drain
    region.sanitySanity = Math.max(0, region.sanitySanity - effects.populationLoss);
  }

  // Corruption gain
  if (effects.corruptionGain) {
    region.corruption = Math.min(100, region.corruption + effects.corruptionGain);
    state.resources.corruptionIndex = Math.min(
      100,
      state.resources.corruptionIndex + effects.corruptionGain / 10
    );
  }

  // Investigation heat change
  if (effects.investigationHeatChange) {
    region.investigationHeat = Math.max(
      0,
      Math.min(100, region.investigationHeat + effects.investigationHeatChange)
    );
  }

  // Veil damage
  if (effects.veilDamage) {
    state.resources.veilIntegrity = Math.max(
      0,
      state.resources.veilIntegrity - effects.veilDamage
    );
  }

  // Sanity fragments gained
  if (effects.sanityFragmentsGained) {
    state.resources.sanityFragments = Math.min(
      state.limits.maxSanityFragments,
      state.resources.sanityFragments + effects.sanityFragmentsGained
    );
  }

  // Apply sanity drain
  region.sanitySanity = Math.max(0, region.sanitySanity - event.sanityDrain);
}

// ============================================================================
// ASYLUM CAPACITY SYSTEM
// ============================================================================

/**
 * Update asylum capacity for a region
 */
function updateAsylumCapacity(state: GreatOldOnesState, region: RegionalState): void {
  // Calculate asylum capacity based on population sanity
  const madnessRate = 100 - region.sanitySanity;
  const baseCapacity = 1000; // Assume 1000 beds per region

  // Current patients = population * madness rate (simplified)
  const currentPatients = Math.floor((madnessRate / 100) * 10000);
  const overflowRisk = Math.min(100, (currentPatients / baseCapacity) * 100);

  // Check for asylum overflow event
  if (overflowRisk > 100 && Math.random() < 0.3) {
    triggerSanityEvent(state, region, 'severe');
  }
}

// ============================================================================
// DOCTRINE-SPECIFIC SANITY MECHANICS
// ============================================================================

/**
 * Apply doctrine-specific sanity effects
 */
export function applyDoctrineSanityEffects(state: GreatOldOnesState): void {
  if (!state.doctrine) return;

  switch (state.doctrine) {
    case 'domination':
      // Domination: Extra sanity drain in regions with entities
      state.regions.forEach(region => {
        const entitiesInRegion = state.summonedEntities.filter(e => e.regionId === region.regionId);
        if (entitiesInRegion.length > 0) {
          const extraDrain = entitiesInRegion.length * 0.5;
          region.sanitySanity = Math.max(0, region.sanitySanity - extraDrain);

          // Gain extra sanity fragments from terror
          state.resources.sanityFragments = Math.min(
            state.limits.maxSanityFragments,
            state.resources.sanityFragments + Math.floor(extraDrain * 5)
          );
        }
      });
      break;

    case 'corruption':
      // Corruption: Slower sanity drain but steadier corruption
      state.regions.forEach(region => {
        if (region.corruption > 50) {
          // In highly corrupted regions, sanity stabilizes at low but non-zero levels
          if (region.sanitySanity < 30 && region.sanitySanity > 0) {
            region.sanitySanity = Math.min(30, region.sanitySanity + 0.2);
          }
        }
      });
      break;

    case 'convergence':
      // Convergence: Voluntary sanity donation from converts
      state.regions.forEach(region => {
        if (region.corruption > 40) {
          // Willing converts provide steady sanity fragments
          const voluntaryDonation = Math.floor((region.corruption / 100) * 5);
          state.resources.sanityFragments = Math.min(
            state.limits.maxSanityFragments,
            state.resources.sanityFragments + voluntaryDonation
          );

          // But sanity drains slower
          region.sanitySanity = Math.min(100, region.sanitySanity + 0.3);
        }
      });
      break;
  }
}

// ============================================================================
// SANITY RECOVERY MECHANICS
// ============================================================================

/**
 * Regions with low corruption can slowly recover sanity
 */
export function applySanityRecovery(state: GreatOldOnesState): void {
  state.regions.forEach(region => {
    // Recovery only in regions with low corruption and no cultist presence
    if (region.corruption < 20 && region.cultistCells === 0 && region.ritualSites.length === 0) {
      const recovery = 0.5;
      region.sanitySanity = Math.min(100, region.sanitySanity + recovery);

      // Reduce investigation heat as things calm down
      region.investigationHeat = Math.max(0, region.investigationHeat - 2);
    }
  });
}

// ============================================================================
// MASS HALLUCINATION TRIGGERS
// ============================================================================

/**
 * Check for conditions that trigger mass hallucinations
 */
export function checkMassHallucinationTriggers(state: GreatOldOnesState): void {
  state.regions.forEach(region => {
    let triggerChance = 0;

    // Low sanity increases chance
    if (region.sanitySanity < 40) {
      triggerChance += (40 - region.sanitySanity) / 100;
    }

    // High corruption increases chance
    if (region.corruption > 60) {
      triggerChance += (region.corruption - 60) / 100;
    }

    // Active rituals increase chance dramatically
    if (region.ritualSites.some(s => s.activeRitual)) {
      triggerChance += 0.3;
    }

    // Summoned entities increase chance
    const entitiesInRegion = state.summonedEntities.filter(e => e.regionId === region.regionId);
    triggerChance += entitiesInRegion.length * 0.15;

    // Cosmic alignment boosts chance
    if (state.alignment.ritualPowerModifier > 1.5) {
      triggerChance += 0.2;
    }

    // Roll for mass hallucination
    if (Math.random() < triggerChance) {
      triggerSanityEvent(state, region, entitiesInRegion.length > 0 ? 'severe' : 'moderate');
    }
  });
}

// ============================================================================
// SANITY STATISTICS
// ============================================================================

/**
 * Calculate global sanity average
 */
export function getGlobalSanityAverage(state: GreatOldOnesState): number {
  if (state.regions.length === 0) return 100;

  const total = state.regions.reduce((sum, region) => sum + region.sanitySanity, 0);
  return Math.floor(total / state.regions.length);
}

/**
 * Get most endangered regions (lowest sanity)
 */
export function getMostEndangeredRegions(state: GreatOldOnesState, count: number = 3): RegionalState[] {
  return [...state.regions]
    .sort((a, b) => a.sanitySanity - b.sanitySanity)
    .slice(0, count);
}

/**
 * Get crisis regions (sanity below threshold)
 */
export function getCrisisRegions(state: GreatOldOnesState, threshold: number = 30): RegionalState[] {
  return state.regions.filter(region => region.sanitySanity <= threshold);
}
