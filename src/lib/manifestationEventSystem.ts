/**
 * First Manifestation Event System
 * Handles public manifestation events, media response, and public reactions
 */

import type { GreatOldOnesState, Doctrine, SummonedEntity } from '../types/greatOldOnes';
import { addMissionLogEntry } from './greatOldOnesHelpers';

// ============================================================================
// MANIFESTATION EVENT TYPES
// ============================================================================

export type ManifestationType = 'subtle_omens' | 'violent_eruption' | 'benevolent_vision';
export type ManifestationScale = 'local' | 'regional' | 'national' | 'global';
export type PublicReaction = 'panic' | 'denial' | 'curiosity' | 'worship' | 'mobilization';
export type MediaResponse = 'coverup' | 'exposure' | 'exploitation' | 'ridicule';

export interface ManifestationEvent {
  id: string;
  name: string;
  type: ManifestationType;
  scale: ManifestationScale;

  /** Which region/regions affected */
  affectedRegions: string[];

  /** Narrative description */
  description: string;

  /** Witnessed by how many people? */
  witnessCount: number;

  /** Evidence quality (0-100, affects credibility) */
  evidenceQuality: number;

  /** Initial public reaction */
  publicReaction: PublicReaction;

  /** Media coverage level (0-100) */
  mediaCoverage: number;

  /** Government response */
  governmentResponse: GovernmentResponse;

  /** Effects on game state */
  effects: ManifestationEffects;

  /** Was this manifestation intentional or accidental? */
  intentional: boolean;

  /** Related entity (if any) */
  relatedEntityId?: string;

  /** Turn when this occurred */
  turn: number;

  /** Current status */
  status: 'active' | 'contained' | 'normalized' | 'escalating';
}

export interface GovernmentResponse {
  responseType: 'denial' | 'investigation' | 'quarantine' | 'martial_law' | 'coverup';
  responseStrength: number; // 0-100
  credibilityDamage: number; // 0-100, how much government loses credibility
}

export interface ManifestationEffects {
  veilChange: number;
  corruptionChange: number;
  publicAwarenessChange: number;
  investigatorSpawnChance: number;
  regionalSanityChange: Record<string, number>; // regionId -> sanity change
}

// ============================================================================
// PUBLIC REACTION SYSTEM
// ============================================================================

export interface PublicReactionState {
  /** Current dominant reaction */
  dominantReaction: PublicReaction;

  /** Reaction percentages */
  reactions: Record<PublicReaction, number>;

  /** Is reaction evolving? */
  evolving: boolean;

  /** Turns until reaction stabilizes */
  turnsUntilStable: number;

  /** Social media virality (0-100) */
  viralityScore: number;

  /** Religious response strength (0-100) */
  religiousResponse: number;

  /** Scientific community response (0-100) */
  scientificResponse: number;
}

/**
 * Calculate public reaction to a manifestation
 */
export function calculatePublicReaction(
  event: ManifestationEvent,
  gooState: GreatOldOnesState
): PublicReactionState {
  const reactions: Record<PublicReaction, number> = {
    panic: 0,
    denial: 0,
    curiosity: 0,
    worship: 0,
    mobilization: 0,
  };

  // Base reactions depend on manifestation type
  switch (event.type) {
    case 'subtle_omens':
      reactions.denial = 40;
      reactions.curiosity = 30;
      reactions.panic = 10;
      reactions.worship = 15;
      reactions.mobilization = 5;
      break;

    case 'violent_eruption':
      reactions.panic = 50;
      reactions.denial = 10;
      reactions.mobilization = 25;
      reactions.curiosity = 10;
      reactions.worship = 5;
      break;

    case 'benevolent_vision':
      reactions.worship = 40;
      reactions.curiosity = 30;
      reactions.denial = 15;
      reactions.panic = 10;
      reactions.mobilization = 5;
      break;
  }

  // Modify based on evidence quality
  if (event.evidenceQuality > 70) {
    reactions.denial -= 15;
    reactions.panic += 10;
    reactions.mobilization += 5;
  } else if (event.evidenceQuality < 30) {
    reactions.denial += 20;
    reactions.curiosity -= 10;
  }

  // Modify based on current veil status
  if (gooState.veil.integrity < 50) {
    // Public is already aware of supernatural - less denial
    reactions.denial -= 20;
    reactions.mobilization += 15;
    reactions.worship += 5;
  }

  // Modify based on corruption level
  if (gooState.resources.corruptionIndex > 60) {
    // Society is already corrupted - more acceptance
    reactions.worship += 15;
    reactions.panic -= 10;
    reactions.denial -= 5;
  }

  // Normalize to 100%
  const total = Object.values(reactions).reduce((sum, val) => sum + val, 0);
  Object.keys(reactions).forEach(key => {
    reactions[key as PublicReaction] = Math.round((reactions[key as PublicReaction] / total) * 100);
  });

  // Determine dominant reaction
  const dominantReaction = (Object.keys(reactions) as PublicReaction[]).reduce((a, b) =>
    reactions[a] > reactions[b] ? a : b
  );

  return {
    dominantReaction,
    reactions,
    evolving: true,
    turnsUntilStable: 5,
    viralityScore: event.evidenceQuality,
    religiousResponse: event.type === 'benevolent_vision' ? 70 : 30,
    scientificResponse: event.evidenceQuality > 50 ? 60 : 20,
  };
}

// ============================================================================
// MEDIA RESPONSE SYSTEM
// ============================================================================

export interface MediaResponseState {
  /** Dominant media narrative */
  dominantNarrative: MediaResponse;

  /** Media attention level (0-100) */
  attentionLevel: number;

  /** Is story going viral? */
  trending: boolean;

  /** Competing narratives */
  narratives: {
    coverup: number; // Government/official sources trying to hide
    exposure: number; // Investigative journalists exposing truth
    exploitation: number; // Sensationalist media milking for views
    ridicule: number; // Skeptics mocking believers
  };

  /** Celebrity/influencer involvement */
  influencerEngagement: number; // 0-100

  /** Mainstream vs alternative media split */
  mainstreamCoverage: number; // 0-100
  alternativeCoverage: number; // 0-100
}

/**
 * Calculate media response to manifestation
 */
export function calculateMediaResponse(
  event: ManifestationEvent,
  reactionState: PublicReactionState,
  gooState: GreatOldOnesState
): MediaResponseState {
  const narratives = {
    coverup: 0,
    exposure: 0,
    exploitation: 0,
    ridicule: 0,
  };

  // Government response influences media
  if (event.governmentResponse.responseType === 'coverup' || event.governmentResponse.responseType === 'denial') {
    narratives.coverup = 40;
    narratives.exposure = 20; // Some journalists resist
    narratives.ridicule = 30;
    narratives.exploitation = 10;
  } else if (event.governmentResponse.responseType === 'investigation') {
    narratives.exposure = 50;
    narratives.exploitation = 30;
    narratives.ridicule = 10;
    narratives.coverup = 10;
  } else if (event.governmentResponse.responseType === 'martial_law') {
    narratives.exposure = 60;
    narratives.exploitation = 25;
    narratives.coverup = 10;
    narratives.ridicule = 5;
  }

  // Evidence quality affects coverage
  if (event.evidenceQuality > 80) {
    narratives.exposure += 20;
    narratives.ridicule -= 15;
  } else if (event.evidenceQuality < 30) {
    narratives.ridicule += 20;
    narratives.exposure -= 15;
  }

  // Virality affects exploitation
  if (reactionState.viralityScore > 70) {
    narratives.exploitation += 25;
  }

  // Normalize
  const total = Object.values(narratives).reduce((sum, val) => sum + val, 0);
  Object.keys(narratives).forEach(key => {
    narratives[key as keyof typeof narratives] = Math.round(
      (narratives[key as keyof typeof narratives] / total) * 100
    );
  });

  const dominantNarrative = (Object.keys(narratives) as MediaResponse[]).reduce((a, b) =>
    narratives[a as keyof typeof narratives] > narratives[b as keyof typeof narratives] ? a : b
  );

  return {
    dominantNarrative,
    attentionLevel: event.mediaCoverage,
    trending: reactionState.viralityScore > 60,
    narratives,
    influencerEngagement: reactionState.viralityScore * 0.8,
    mainstreamCoverage: event.evidenceQuality > 50 ? 70 : 30,
    alternativeCoverage: event.evidenceQuality > 50 ? 80 : 90, // Alternative media covers it more
  };
}

// ============================================================================
// MANIFESTATION EVENT GENERATION
// ============================================================================

/**
 * Generate a manifestation event based on current game state
 */
export function generateManifestationEvent(
  gooState: GreatOldOnesState,
  intentional: boolean,
  entity?: SummonedEntity
): ManifestationEvent {
  // Determine type based on doctrine and entity
  let type: ManifestationType;

  if (entity) {
    // Entity manifestations are usually more dramatic
    if (entity.tier === 'great_old_one' || entity.tier === 'avatar') {
      type = 'violent_eruption';
    } else if (gooState.doctrine === 'convergence') {
      type = 'benevolent_vision';
    } else if (gooState.doctrine === 'domination') {
      type = 'violent_eruption';
    } else {
      type = 'subtle_omens';
    }
  } else {
    // Random manifestations
    if (gooState.doctrine === 'convergence') {
      type = Math.random() > 0.5 ? 'benevolent_vision' : 'subtle_omens';
    } else if (gooState.doctrine === 'domination') {
      type = Math.random() > 0.3 ? 'violent_eruption' : 'subtle_omens';
    } else {
      type = 'subtle_omens';
    }
  }

  // Determine scale based on veil and corruption
  let scale: ManifestationScale;
  if (gooState.veil.integrity < 30) {
    scale = 'global';
  } else if (gooState.veil.integrity < 60) {
    scale = 'national';
  } else if (gooState.resources.corruptionIndex > 50) {
    scale = 'regional';
  } else {
    scale = 'local';
  }

  // Select affected regions
  const affectedRegions = selectAffectedRegions(gooState, scale);

  // Generate narrative based on type
  const narrative = generateManifestationNarrative(type, scale, entity);

  // Calculate witness count
  const witnessCount = calculateWitnessCount(type, scale);

  // Calculate evidence quality
  const evidenceQuality = calculateEvidenceQuality(type, witnessCount, gooState);

  // Determine government response
  const governmentResponse = determineGovernmentResponse(type, scale, evidenceQuality, gooState);

  // Calculate effects
  const effects = calculateManifestationEffects(type, scale, affectedRegions, gooState);

  return {
    id: `manifestation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: narrative.title,
    type,
    scale,
    affectedRegions,
    description: narrative.description,
    witnessCount,
    evidenceQuality,
    publicReaction: 'panic', // Will be calculated properly later
    mediaCoverage: Math.min(100, evidenceQuality + witnessCount / 1000),
    governmentResponse,
    effects,
    intentional,
    relatedEntityId: entity?.id,
    turn: gooState.alignment.turn,
    status: 'active',
  };
}

/**
 * Select which regions are affected
 */
function selectAffectedRegions(gooState: GreatOldOnesState, scale: ManifestationScale): string[] {
  switch (scale) {
    case 'local':
      // Pick one region with highest corruption
      return [
        gooState.regions.reduce((max, r) => (r.corruption > max.corruption ? r : max)).regionId,
      ];

    case 'regional':
      // Pick 2-3 neighboring regions
      return gooState.regions
        .sort((a, b) => b.corruption - a.corruption)
        .slice(0, 3)
        .map(r => r.regionId);

    case 'national':
      // Pick 4-5 regions
      return gooState.regions
        .sort((a, b) => b.corruption - a.corruption)
        .slice(0, 5)
        .map(r => r.regionId);

    case 'global':
      // All regions
      return gooState.regions.map(r => r.regionId);
  }
}

/**
 * Generate narrative description for manifestation
 */
function generateManifestationNarrative(
  type: ManifestationType,
  scale: ManifestationScale,
  entity?: SummonedEntity
): { title: string; description: string } {
  const templates = {
    subtle_omens: {
      local: {
        title: 'Strange Occurrences Reported',
        description:
          'Residents report vivid nightmares, strange symbols appearing overnight, and an unsettling feeling of being watched. Animals flee the area.',
      },
      regional: {
        title: 'Unexplained Phenomena Spread',
        description:
          'Multiple cities report synchronized mass nightmares, inexplicable equipment failures, and bizarre weather patterns. Scientists are baffled.',
      },
      national: {
        title: 'Nationwide Anomalies',
        description:
          'The entire nation experiences coordinated supernatural events. Government agencies scramble to explain away the impossible.',
      },
      global: {
        title: 'Global Synchronicity Event',
        description:
          'Around the world, millions experience the same vision simultaneously. Reality itself seems to flicker.',
      },
    },
    violent_eruption: {
      local: {
        title: 'Terror in the Streets',
        description: `A ${entity?.name || 'monstrous entity'} manifests in the city center. Chaos erupts as panicked crowds flee. Emergency services are overwhelmed.`,
      },
      regional: {
        title: 'Multiple Entity Sightings',
        description:
          'Creatures beyond comprehension appear in multiple locations simultaneously. Military mobilizes. Casualty reports flood in.',
      },
      national: {
        title: 'Nationwide Crisis',
        description:
          'The nation descends into chaos as entities rampage through major cities. Government declares state of emergency. Martial law imminent.',
      },
      global: {
        title: 'The World Awakens in Terror',
        description:
          'Across the globe, eldritch horrors manifest. Humanity faces its darkest hour. Civilization teeters on the brink.',
      },
    },
    benevolent_vision: {
      local: {
        title: 'Divine Visitation',
        description:
          'Thousands witness a beautiful, impossible sight in the sky. Many report feelings of profound peace and transcendence. Some claim to have been "called."',
      },
      regional: {
        title: 'Enlightenment Movement Spreads',
        description:
          'Across the region, people report contact with benevolent cosmic entities offering wisdom and evolution. A spiritual awakening begins.',
      },
      national: {
        title: 'Mass Enlightenment Event',
        description:
          'The entire nation experiences visions of cosmic transcendence. Millions embrace the message. Religious and secular leaders divided on response.',
      },
      global: {
        title: 'Humanity Receives the Invitation',
        description:
          'The entire world witnesses the presence of something vast and ancient. It offers humanity a choice: evolve or remain.',
      },
    },
  };

  return templates[type][scale];
}

/**
 * Calculate how many people witnessed the event
 */
function calculateWitnessCount(type: ManifestationType, scale: ManifestationScale): number {
  const baseWitnesses = {
    local: 1000,
    regional: 100000,
    national: 10000000,
    global: 1000000000,
  };

  const typeModifier = {
    subtle_omens: 0.5,
    violent_eruption: 2.0,
    benevolent_vision: 1.5,
  };

  return Math.floor(baseWitnesses[scale] * typeModifier[type]);
}

/**
 * Calculate evidence quality (photos, videos, etc.)
 */
function calculateEvidenceQuality(
  type: ManifestationType,
  witnessCount: number,
  gooState: GreatOldOnesState
): number {
  let quality = 0;

  // More witnesses = more evidence
  if (witnessCount > 1000000) quality += 40;
  else if (witnessCount > 10000) quality += 30;
  else if (witnessCount > 1000) quality += 20;
  else quality += 10;

  // Type affects evidence quality
  if (type === 'violent_eruption') quality += 30; // Hard to miss
  else if (type === 'benevolent_vision') quality += 20;
  else quality += 10; // Subtle omens harder to capture

  // Lower veil = easier to capture evidence
  if (gooState.veil.integrity < 50) {
    quality += 20;
  }

  return Math.min(100, quality);
}

/**
 * Determine how government responds
 */
function determineGovernmentResponse(
  type: ManifestationType,
  scale: ManifestationScale,
  evidenceQuality: number,
  gooState: GreatOldOnesState
): GovernmentResponse {
  let responseType: GovernmentResponse['responseType'];
  let responseStrength = 0;
  let credibilityDamage = 0;

  // Check if government is corrupted
  const avgCorruption =
    gooState.regions.reduce((sum, r) => sum + r.corruption, 0) / gooState.regions.length;

  if (avgCorruption > 70) {
    // Government is compromised - coverup
    responseType = 'coverup';
    responseStrength = 80;
    credibilityDamage = 60;
  } else if (scale === 'global' || (scale === 'national' && type === 'violent_eruption')) {
    // Too big to hide
    responseType = 'martial_law';
    responseStrength = 90;
    credibilityDamage = 30;
  } else if (evidenceQuality > 70) {
    // Too much evidence to deny
    responseType = 'investigation';
    responseStrength = 70;
    credibilityDamage = 20;
  } else if (scale === 'local') {
    // Small enough to quarantine
    responseType = 'quarantine';
    responseStrength = 60;
    credibilityDamage = 10;
  } else {
    // Default to denial
    responseType = 'denial';
    responseStrength = 50;
    credibilityDamage = 40; // Denying obvious events damages credibility
  }

  return {
    responseType,
    responseStrength,
    credibilityDamage,
  };
}

/**
 * Calculate effects on game state
 */
function calculateManifestationEffects(
  type: ManifestationType,
  scale: ManifestationScale,
  affectedRegions: string[],
  gooState: GreatOldOnesState
): ManifestationEffects {
  const scaleMultiplier = {
    local: 1,
    regional: 2,
    national: 4,
    global: 8,
  };

  const typeEffects = {
    subtle_omens: {
      veilChange: -5 * scaleMultiplier[scale],
      corruptionChange: 3 * scaleMultiplier[scale],
      publicAwarenessChange: 5 * scaleMultiplier[scale],
      investigatorSpawnChance: 0.2,
      regionalSanityChange: -5,
    },
    violent_eruption: {
      veilChange: -20 * scaleMultiplier[scale],
      corruptionChange: 10 * scaleMultiplier[scale],
      publicAwarenessChange: 30 * scaleMultiplier[scale],
      investigatorSpawnChance: 0.6,
      regionalSanityChange: -20,
    },
    benevolent_vision: {
      veilChange: -10 * scaleMultiplier[scale],
      corruptionChange: 15 * scaleMultiplier[scale],
      publicAwarenessChange: 15 * scaleMultiplier[scale],
      investigatorSpawnChance: 0.3,
      regionalSanityChange: -8,
    },
  };

  const effects = typeEffects[type];

  // Build regional sanity changes
  const regionalSanityChange: Record<string, number> = {};
  affectedRegions.forEach(regionId => {
    regionalSanityChange[regionId] = effects.regionalSanityChange;
  });

  return {
    veilChange: effects.veilChange,
    corruptionChange: effects.corruptionChange,
    publicAwarenessChange: effects.publicAwarenessChange,
    investigatorSpawnChance: effects.investigatorSpawnChance,
    regionalSanityChange,
  };
}

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

/**
 * Trigger a manifestation event and apply effects
 */
export function triggerManifestationEvent(
  gooState: GreatOldOnesState,
  intentional: boolean = false,
  entity?: SummonedEntity
): ManifestationEvent {
  // Generate event
  const event = generateManifestationEvent(gooState, intentional, entity);

  // Calculate public reaction
  const reactionState = calculatePublicReaction(event, gooState);
  event.publicReaction = reactionState.dominantReaction;

  // Calculate media response
  const mediaState = calculateMediaResponse(event, reactionState, gooState);

  // Apply effects
  applyManifestationEffects(event, gooState);

  // Log event
  addMissionLogEntry(gooState, {
    category: 'event',
    title: event.name,
    description: event.description,
    veilChange: event.effects.veilChange,
    corruptionChange: event.effects.corruptionChange,
  });

  // Additional logging for public/media reaction
  addMissionLogEntry(gooState, {
    category: 'event',
    title: `Public Reaction: ${capitalizeFirst(reactionState.dominantReaction)}`,
    description: `The public responds with ${reactionState.dominantReaction}. Media narrative: ${mediaState.dominantNarrative}.`,
  });

  return event;
}

/**
 * Apply manifestation effects to game state
 */
function applyManifestationEffects(event: ManifestationEvent, gooState: GreatOldOnesState): void {
  // Apply veil change
  gooState.veil.integrity = Math.max(
    0,
    Math.min(100, gooState.veil.integrity + event.effects.veilChange)
  );
  gooState.resources.veilIntegrity = gooState.veil.integrity;

  // Apply corruption change
  gooState.resources.corruptionIndex = Math.max(
    0,
    Math.min(100, gooState.resources.corruptionIndex + event.effects.corruptionChange)
  );

  // Apply public awareness
  gooState.veil.publicAwareness = Math.max(
    0,
    Math.min(100, gooState.veil.publicAwareness + event.effects.publicAwarenessChange)
  );

  // Apply regional sanity changes
  Object.entries(event.effects.regionalSanityChange).forEach(([regionId, change]) => {
    const region = gooState.regions.find(r => r.regionId === regionId);
    if (region) {
      region.sanitySanity = Math.max(0, Math.min(100, region.sanitySanity + change));
    }
  });

  // Check if should spawn investigators
  if (Math.random() < event.effects.investigatorSpawnChance) {
    // Spawn investigator (will be handled by investigation AI)
    addMissionLogEntry(gooState, {
      category: 'investigation',
      title: 'New Investigator Emerges',
      description: 'The manifestation has attracted the attention of a skilled investigator.',
    });
  }
}

/**
 * Update active manifestation events
 */
export function updateManifestationEvents(
  events: ManifestationEvent[],
  gooState: GreatOldOnesState
): ManifestationEvent[] {
  return events.map(event => {
    if (event.status === 'active') {
      // Events gradually normalize or escalate based on government response
      if (event.governmentResponse.responseStrength > 70) {
        // Strong response contains the event
        event.status = 'contained';
        event.mediaCoverage = Math.max(0, event.mediaCoverage - 10);
      } else if (event.evidenceQuality > 80 && event.witnessCount > 100000) {
        // High-evidence events escalate
        event.status = 'escalating';
        event.mediaCoverage = Math.min(100, event.mediaCoverage + 5);
      } else {
        // Events slowly normalize
        event.mediaCoverage = Math.max(0, event.mediaCoverage - 5);
        if (event.mediaCoverage < 20) {
          event.status = 'normalized';
        }
      }
    }

    return event;
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
}
