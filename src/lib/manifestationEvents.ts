/**
 * First Manifestation Event Chain System
 * Handles supernatural events, public reactions, and media responses
 */

import type { GreatOldOnesState, RegionalState, Doctrine } from '../types/greatOldOnes';
import { addMissionLogEntry } from './greatOldOnesHelpers';

// ============================================================================
// MANIFESTATION EVENTS
// ============================================================================

export type ManifestationType = 'subtle_omen' | 'violent_eruption' | 'benevolent_vision' | 'cosmic_sign';

export interface ManifestationEvent {
  id: string;
  type: ManifestationType;
  regionId: string;
  severity: 'minor' | 'moderate' | 'major' | 'legendary';
  title: string;
  description: string;
  witnesses: number; // How many people saw it
  evidenceStrength: number; // 0-100, how provable it is
  publicReaction: PublicReaction;
  mediaResponse: MediaResponse;
  consequences: ManifestationConsequences;
}

export interface PublicReaction {
  panic: number; // 0-100
  belief: number; // 0-100, how many believe it's real
  denial: number; // 0-100, how many think it's fake
  conversion: number; // How many join cults
}

export type MediaStance = 'coverup' | 'exposure' | 'exploitation' | 'denial' | 'propaganda';

export interface MediaResponse {
  stance: MediaStance;
  coverage: number; // 0-100, how much media attention
  credibility: number; // 0-100, how believable the coverage is
  narrative: string;
}

export interface ManifestationConsequences {
  veilDamage: number;
  sanityDrain: number;
  corruptionGain: number;
  investigatorSpawnChance: number;
  cultistRecruitment: number;
}

// ============================================================================
// MANIFESTATION TRIGGERS
// ============================================================================

/**
 * Check if conditions are right for a manifestation event
 */
export function checkManifestationTriggers(state: GreatOldOnesState): void {
  // Manifestations more likely at certain thresholds
  let triggerChance = 0.05; // Base 5% chance per turn

  // High corruption increases chance
  if (state.resources.corruptionIndex > 50) {
    triggerChance += (state.resources.corruptionIndex - 50) / 200;
  }

  // Low veil increases chance
  if (state.veil.integrity < 70) {
    triggerChance += (70 - state.veil.integrity) / 200;
  }

  // Summoned entities dramatically increase chance
  if (state.summonedEntities.length > 0) {
    triggerChance += state.summonedEntities.length * 0.1;
  }

  // Cosmic alignment boosts chance
  if (state.alignment.ritualPowerModifier > 1.5) {
    triggerChance += 0.15;
  }

  // Active rituals increase chance
  const activeRituals = state.regions.reduce(
    (count, region) => count + region.ritualSites.filter(s => s.activeRitual).length,
    0
  );
  triggerChance += activeRituals * 0.08;

  // Roll for manifestation
  if (Math.random() < triggerChance) {
    triggerManifestationEvent(state);
  }
}

/**
 * Trigger a manifestation event
 */
function triggerManifestationEvent(state: GreatOldOnesState): void {
  // Select region (prefer regions with high corruption or entities)
  const targetRegion = selectManifestationRegion(state);

  // Determine manifestation type based on doctrine
  const type = selectManifestationType(state);

  // Determine severity based on conditions
  const severity = determineManifestationSeverity(state, targetRegion);

  // Create the manifestation event
  const event = createManifestationEvent(state, targetRegion, type, severity);

  // Apply consequences
  applyManifestationConsequences(state, targetRegion, event);

  // Log the event
  addMissionLogEntry(state, {
    category: 'event',
    title: `MANIFESTATION: ${event.title}`,
    description: event.description,
    veilChange: -event.consequences.veilDamage,
    sanityChange: event.consequences.cultistRecruitment,
    corruptionChange: event.consequences.corruptionGain,
  });
}

/**
 * Select region for manifestation (prefer high-corruption or entity-hosting regions)
 */
function selectManifestationRegion(state: GreatOldOnesState): RegionalState {
  // Score regions
  const scoredRegions = state.regions.map(region => {
    let score = region.corruption;
    score += region.ritualSites.length * 15;
    score += state.summonedEntities.filter(e => e.regionId === region.regionId).length * 25;
    score += (100 - region.sanitySanity) * 0.5;
    return { region, score };
  });

  // Sort by score
  scoredRegions.sort((a, b) => b.score - a.score);

  // Pick from top 3
  const topRegions = scoredRegions.slice(0, 3);
  return topRegions[Math.floor(Math.random() * topRegions.length)].region;
}

/**
 * Select manifestation type based on doctrine
 */
function selectManifestationType(state: GreatOldOnesState): ManifestationType {
  if (!state.doctrine) {
    return 'subtle_omen';
  }

  // Doctrine influences manifestation type
  const doctrinePreferences: Record<Doctrine, ManifestationType[]> = {
    domination: ['violent_eruption', 'cosmic_sign'],
    corruption: ['subtle_omen', 'cosmic_sign'],
    convergence: ['benevolent_vision', 'cosmic_sign'],
  };

  const options = doctrinePreferences[state.doctrine];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Determine manifestation severity
 */
function determineManifestationSeverity(
  state: GreatOldOnesState,
  region: RegionalState
): ManifestationEvent['severity'] {
  let severityScore = 0;

  severityScore += state.resources.corruptionIndex;
  severityScore += (100 - state.veil.integrity);
  severityScore += region.corruption;
  severityScore += state.summonedEntities.length * 20;

  if (state.alignment.ritualPowerModifier > 2.0) {
    severityScore += 50;
  }

  if (severityScore > 250) return 'legendary';
  if (severityScore > 180) return 'major';
  if (severityScore > 100) return 'moderate';
  return 'minor';
}

// ============================================================================
// CREATE MANIFESTATION EVENTS
// ============================================================================

/**
 * Create a manifestation event
 */
function createManifestationEvent(
  state: GreatOldOnesState,
  region: RegionalState,
  type: ManifestationType,
  severity: ManifestationEvent['severity']
): ManifestationEvent {
  const severityMultipliers = {
    minor: 1,
    moderate: 2,
    major: 4,
    legendary: 8,
  };

  const mult = severityMultipliers[severity];

  const templates: Record<
    ManifestationType,
    (mult: number) => Omit<ManifestationEvent, 'id' | 'regionId'>
  > = {
    subtle_omen: (mult) => ({
      type: 'subtle_omen',
      severity,
      title: 'Strange Omens',
      description: `Bizarre occurrences plague ${region.regionName}. Animals behave strangely. Electronics malfunction. People report feelings of being watched. Most dismiss it as coincidence, but some know better.`,
      witnesses: 100 * mult,
      evidenceStrength: 10 * mult,
      publicReaction: {
        panic: 5 * mult,
        belief: 15 * mult,
        denial: 70,
        conversion: 2 * mult,
      },
      mediaResponse: generateMediaResponse('denial', 10 * mult, region),
      consequences: {
        veilDamage: 2 * mult,
        sanityDrain: 1 * mult,
        corruptionGain: 3 * mult,
        investigatorSpawnChance: 0.05 * mult,
        cultistRecruitment: 5 * mult,
      },
    }),

    violent_eruption: (mult) => ({
      type: 'violent_eruption',
      severity,
      title: 'Supernatural Eruption',
      description: `A violent supernatural event rocks ${region.regionName}. Witnesses describe tentacles, impossible shadows, reality tearing at the seams. Emergency services respond to mass casualties. This cannot be denied.`,
      witnesses: 1000 * mult,
      evidenceStrength: 60 * mult,
      publicReaction: {
        panic: 40 * mult,
        belief: 50 * mult,
        denial: 30,
        conversion: 8 * mult,
      },
      mediaResponse: generateMediaResponse('exposure', 60 * mult, region),
      consequences: {
        veilDamage: 15 * mult,
        sanityDrain: 8 * mult,
        corruptionGain: 10 * mult,
        investigatorSpawnChance: 0.3 * mult,
        cultistRecruitment: 20 * mult,
      },
    }),

    benevolent_vision: (mult) => ({
      type: 'benevolent_vision',
      severity,
      title: 'Visions of Transcendence',
      description: `Thousands in ${region.regionName} report beautiful, profound visions. They speak of cosmic truths, enlightenment beyond flesh, and joining with something vast and wonderful. Many willingly seek to experience it again.`,
      witnesses: 2000 * mult,
      evidenceStrength: 30 * mult,
      publicReaction: {
        panic: 10 * mult,
        belief: 60 * mult,
        denial: 20,
        conversion: 20 * mult,
      },
      mediaResponse: generateMediaResponse('exploitation', 40 * mult, region),
      consequences: {
        veilDamage: 8 * mult,
        sanityDrain: 3 * mult,
        corruptionGain: 15 * mult,
        investigatorSpawnChance: 0.1 * mult,
        cultistRecruitment: 40 * mult,
      },
    }),

    cosmic_sign: (mult) => ({
      type: 'cosmic_sign',
      severity,
      title: 'Sign in the Sky',
      description: `The sky above ${region.regionName} displays impossible phenomena. Stars move in wrong patterns. The moon shows faces. Reality itself seems to announce something is coming. Astronomers have no explanation.`,
      witnesses: 5000 * mult,
      evidenceStrength: 80 * mult,
      publicReaction: {
        panic: 30 * mult,
        belief: 70 * mult,
        denial: 15,
        conversion: 15 * mult,
      },
      mediaResponse: generateMediaResponse('exposure', 80 * mult, region),
      consequences: {
        veilDamage: 20 * mult,
        sanityDrain: 5 * mult,
        corruptionGain: 12 * mult,
        investigatorSpawnChance: 0.25 * mult,
        cultistRecruitment: 30 * mult,
      },
    }),
  };

  const template = templates[type](mult);

  return {
    id: `manifestation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    regionId: region.regionId,
    ...template,
  };
}

// ============================================================================
// MEDIA RESPONSE SYSTEM
// ============================================================================

/**
 * Generate media response to a manifestation
 */
function generateMediaResponse(
  baseStance: MediaStance,
  baseCoverage: number,
  region: RegionalState
): MediaResponse {
  let stance = baseStance;
  let coverage = baseCoverage;
  let credibility = 50;

  // High corruption regions have corrupted media
  if (region.corruption > 60) {
    if (Math.random() < 0.5) {
      stance = 'propaganda';
      coverage *= 1.3;
      credibility = 80;
    }
  }

  // Academic regions are more likely to investigate
  if (region.culturalTraits.includes('academic')) {
    if (stance === 'denial') {
      stance = 'exposure';
    }
    credibility += 15;
  }

  // Rationalist regions try to explain it away
  if (region.culturalTraits.includes('rationalist') && stance === 'exposure') {
    if (Math.random() < 0.4) {
      stance = 'denial';
      credibility -= 10;
    }
  }

  const narratives: Record<MediaStance, string> = {
    coverup: 'Officials deny reports, claiming mass hallucination or hoax. Media cooperates with information blackout.',
    exposure: 'Media exposes the supernatural event. Public demands answers. Scientists scramble to explain.',
    exploitation: 'Media sensationalizes the event for ratings. Documentary crews flood the area. The story becomes viral.',
    denial: 'Media dismisses reports as conspiracy theories. Experts debunk. Witnesses are ridiculed.',
    propaganda: 'Media frames the event as a spiritual awakening. Pundits encourage acceptance. The message spreads.',
  };

  return {
    stance,
    coverage: Math.min(100, coverage),
    credibility: Math.min(100, Math.max(0, credibility)),
    narrative: narratives[stance],
  };
}

/**
 * Update media response based on Order actions
 */
export function influenceMediaResponse(
  state: GreatOldOnesState,
  targetRegionId: string,
  desiredStance: MediaStance,
  influenceCost: number
): boolean {
  const region = state.regions.find(r => r.regionId === targetRegionId);
  if (!region) return false;

  // Check if Order has enough resources
  if (state.resources.eldritchPower < influenceCost) {
    return false;
  }

  // Attempt to influence media
  const baseChance = 0.4;
  let successChance = baseChance;

  // Higher corruption makes it easier
  successChance += region.corruption / 200;

  // Corruption doctrine bonus
  if (state.doctrine === 'corruption') {
    successChance += 0.2;
  }

  // Roll for success
  if (Math.random() < successChance) {
    // Success! Change media stance
    // This would need to be tracked per-region or globally
    state.resources.eldritchPower -= influenceCost;

    addMissionLogEntry(state, {
      category: 'infiltration',
      title: 'Media Manipulation Successful',
      description: `The Order has successfully influenced media in ${region.regionName} to adopt a ${desiredStance} stance.`,
      corruptionChange: 5,
    });

    return true;
  }

  // Failure
  state.resources.eldritchPower -= influenceCost / 2; // Half cost on failure

  addMissionLogEntry(state, {
    category: 'infiltration',
    title: 'Media Manipulation Failed',
    description: `Attempt to influence media in ${region.regionName} has failed. Resources wasted.`,
  });

  return false;
}

// ============================================================================
// APPLY MANIFESTATION CONSEQUENCES
// ============================================================================

/**
 * Apply consequences of a manifestation event
 */
function applyManifestationConsequences(
  state: GreatOldOnesState,
  region: RegionalState,
  event: ManifestationEvent
): void {
  const { consequences, publicReaction } = event;

  // Veil damage
  state.veil.integrity = Math.max(0, state.veil.integrity - consequences.veilDamage);
  state.resources.veilIntegrity = state.veil.integrity;
  state.veil.publicAwareness = Math.min(100, state.veil.publicAwareness + consequences.veilDamage);

  // Sanity drain
  region.sanitySanity = Math.max(0, region.sanitySanity - consequences.sanityDrain);

  // Corruption gain
  region.corruption = Math.min(100, region.corruption + consequences.corruptionGain);
  state.resources.corruptionIndex = Math.min(
    100,
    state.resources.corruptionIndex + consequences.corruptionGain / 10
  );

  // Cultist recruitment (add sanity fragments from converts)
  state.resources.sanityFragments = Math.min(
    state.limits.maxSanityFragments,
    state.resources.sanityFragments + consequences.cultistRecruitment
  );

  // Investigation heat increase
  region.investigationHeat = Math.min(
    100,
    region.investigationHeat + event.witnesses / 100
  );

  // Investigator spawn chance
  if (Math.random() < consequences.investigatorSpawnChance) {
    // This would trigger investigator spawn in the AI system
    region.investigationHeat += 20;
  }

  // Public panic affects regional stability
  if (publicReaction.panic > 50) {
    region.sanitySanity = Math.max(0, region.sanitySanity - publicReaction.panic / 10);
  }

  // Media coverage affects veil
  if (event.mediaResponse.coverage > 70) {
    state.veil.emergencyPowers = true;
    state.veil.mediaCoverage = Math.min(100, state.veil.mediaCoverage + 10);
  }
}

// ============================================================================
// HIDDEN AGENDA TRACKING
// ============================================================================

export interface HiddenAgenda {
  trueGoal: 'world_domination' | 'cosmic_transcendence' | 'personal_power' | 'prevent_catastrophe';
  publicNarrative: string;
  deceptionLevel: number; // 0-100, how different is the truth from the lie
  exposureRisk: number; // 0-100, chance of being revealed
}

/**
 * Update hidden agenda exposure risk
 */
export function updateHiddenAgendaExposure(
  state: GreatOldOnesState,
  agenda: HiddenAgenda
): void {
  // High public awareness increases exposure risk
  agenda.exposureRisk = state.veil.publicAwareness / 2;

  // Investigators increase exposure risk
  agenda.exposureRisk += state.investigators.length * 2;

  // High deception level reduces exposure risk (good at lying)
  agenda.exposureRisk *= 1 - agenda.deceptionLevel / 200;

  // Check for exposure
  if (agenda.exposureRisk > 80 && Math.random() < 0.1) {
    exposeHiddenAgenda(state, agenda);
  }
}

/**
 * Expose the Order's true agenda
 */
function exposeHiddenAgenda(state: GreatOldOnesState, agenda: HiddenAgenda): void {
  addMissionLogEntry(state, {
    category: 'event',
    title: 'AGENDA EXPOSED!',
    description: `Investigators have uncovered the Order's true goal: ${agenda.trueGoal.replace('_', ' ')}. Public outcry is immense. The veil is shattered.`,
    veilChange: -30,
  });

  // Massive veil damage
  state.veil.integrity = Math.max(0, state.veil.integrity - 30);
  state.veil.emergencyPowers = true;

  // Investigation surge
  state.regions.forEach(region => {
    region.investigationHeat = Math.min(100, region.investigationHeat + 40);
  });

  // Some converts may leave
  state.regions.forEach(region => {
    if (agenda.trueGoal !== 'cosmic_transcendence' && state.doctrine === 'convergence') {
      region.corruption = Math.max(0, region.corruption - 15);
    }
  });
}
