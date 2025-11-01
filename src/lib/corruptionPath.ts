/**
 * Path of Corruption - Week 5 Implementation
 * Infiltration Architecture, Memetic Warfare, Dream Invasion, Puppet Government
 */

import {
  GreatOldOnesState,
  RegionalState,
  CulturalTrait,
  Doctrine,
} from '../types/greatOldOnes';

// ============================================================================
// INFILTRATION ARCHITECTURE
// ============================================================================

export type InstitutionType =
  | 'government'
  | 'military'
  | 'corporate'
  | 'media'
  | 'academia'
  | 'religious'
  | 'intelligence';

export interface InfluenceNode {
  id: string;
  institutionType: InstitutionType;
  regionId: string;
  name: string;

  /** How corrupted is this institution (0-100) */
  corruptionLevel: number;

  /** Key individuals compromised */
  compromisedIndividuals: CompromisedPerson[];

  /** Sleeper cells activated */
  sleeperCells: number;

  /** Benefits provided by this node */
  benefits: InstitutionBenefit[];

  /** Exposure risk (0-100) */
  exposureRisk: number;

  /** Is this node under investigation? */
  underInvestigation: boolean;
}

export interface CompromisedPerson {
  id: string;
  name: string;
  position: string;
  importance: number;  // 1-10, 10 = highest ranking

  /** How they were compromised */
  method: 'blackmail' | 'bribery' | 'conversion' | 'possession' | 'replacement';

  /** Loyalty to Order (0-100) */
  loyalty: number;

  /** Can they be trusted? */
  reliable: boolean;

  /** Risk of exposure if used */
  actionRisk: number;
}

export interface InstitutionBenefit {
  type: 'resource_generation' | 'investigation_suppression' | 'veil_protection' | 'cultist_recruitment' | 'ritual_support';
  value: number;
  description: string;
}

export interface InfluenceNetwork {
  nodes: InfluenceNode[];

  /** Connections between institutions */
  connections: NetworkConnection[];

  /** Overall network strength */
  networkPower: number;

  /** How many tiers deep the network goes */
  depth: number;
}

export interface NetworkConnection {
  fromNodeId: string;
  toNodeId: string;
  strength: number;  // 0-100
  type: 'funding' | 'information' | 'personnel' | 'coordination';
}

/**
 * Creates a new influence node through infiltration
 */
export function infiltrateInstitution(
  institutionType: InstitutionType,
  regionId: string,
  cultistsAssigned: number,
  eldritchPowerSpent: number,
  state: GreatOldOnesState
): { success: boolean; node?: InfluenceNode; message: string } {
  // Base infiltration chance
  let successChance = 40;

  // Cultist skill bonus
  successChance += Math.min(30, cultistsAssigned * 3);

  // Power can be used for psychic influence
  successChance += Math.min(20, eldritchPowerSpent / 10);

  // Doctrine bonus
  if (state.doctrine === 'corruption') {
    successChance += 40;  // Corruption path gets huge bonus
  }

  // Regional corruption helps
  const region = state.regions.find(r => r.regionId === regionId);
  if (region) {
    successChance += region.corruption / 5;
  }

  // Cultural traits affect difficulty
  if (region?.culturalTraits.includes('rationalist')) {
    successChance -= 15;
  }
  if (region?.culturalTraits.includes('faithful')) {
    successChance -= 10;
  }

  // Institution-specific modifiers
  const institutionDifficulty = {
    media: 0,           // Easiest - lots of turnover
    corporate: -5,
    academia: -10,
    religious: -15,
    government: -20,
    military: -25,
    intelligence: -35,  // Hardest - active counterintelligence
  };
  successChance += institutionDifficulty[institutionType];

  const roll = Math.random() * 100;

  if (roll <= successChance) {
    const node: InfluenceNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      institutionType,
      regionId,
      name: generateInstitutionName(institutionType, region?.regionName || 'Unknown'),
      corruptionLevel: 20 + Math.random() * 20,
      compromisedIndividuals: [],
      sleeperCells: Math.floor(cultistsAssigned * 0.3),
      benefits: [], // TODO: Implement generateInstitutionBenefits
      exposureRisk: 10 + Math.random() * 15,
      underInvestigation: false,
    };

    return {
      success: true,
      node,
      message: `Successfully infiltrated ${node.name}! Sleeper cells planted.`,
    };
  } else {
    return {
      success: false,
      message: `Infiltration of ${institutionType} institution failed. ${roll > 90 ? 'Cultists captured!' : 'Target too secure.'}`,
    };
  }
}

/**
 * Deepens corruption in an existing influence node
 */
export function deepenCorruption(
  node: InfluenceNode,
  method: CompromisedPerson['method'],
  targetImportance: number,
  resourcesSpent: { cultists: number; power: number; fragments: number },
  state: GreatOldOnesState
): { success: boolean; person?: CompromisedPerson; message: string } {
  // Higher importance targets are harder
  let successChance = 60 - (targetImportance * 4);

  // Existing corruption helps
  successChance += node.corruptionLevel / 5;

  // Resources help
  successChance += Math.min(20, resourcesSpent.cultists * 2);
  successChance += Math.min(15, resourcesSpent.power / 5);
  successChance += Math.min(15, resourcesSpent.fragments / 10);

  // Method-specific modifiers
  const methodModifiers = {
    blackmail: 10,      // Easiest, but least loyal
    bribery: 5,
    conversion: 0,      // Medium difficulty, medium loyalty
    possession: -20,    // Hard, but total control
    replacement: -30,   // Very hard, perfect loyalty
  };
  successChance += methodModifiers[method];

  const roll = Math.random() * 100;

  if (roll <= successChance) {
    const loyalty = {
      blackmail: 40 + Math.random() * 20,
      bribery: 50 + Math.random() * 20,
      conversion: 70 + Math.random() * 25,
      possession: 100,
      replacement: 100,
    }[method];

    const person: CompromisedPerson = {
      id: `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: generatePersonName(),
      position: generatePosition(node.institutionType, targetImportance),
      importance: targetImportance,
      method,
      loyalty,
      reliable: loyalty > 70,
      actionRisk: (10 - targetImportance) + (method === 'blackmail' ? 20 : 0),
    };

    return {
      success: true,
      person,
      message: `Successfully compromised ${person.name} (${person.position}) via ${method}!`,
    };
  } else {
    return {
      success: false,
      message: `Failed to compromise target. ${roll > 85 ? 'Operation exposed!' : 'Target resisted.'}`,
    };
  }
}

/**
 * Activates sleeper cells in a network for coordinated action
 */
export function activateSleeperCells(
  network: InfluenceNetwork,
  targetNodeIds: string[],
  operation: 'sabotage' | 'information_theft' | 'assassination' | 'ritual_support' | 'mass_activation',
  state: GreatOldOnesState
): {
  success: boolean;
  results: SleeperCellResult[];
  networkExposure: number;
  message: string;
} {
  const results: SleeperCellResult[] = [];
  let totalExposure = 0;

  for (const nodeId of targetNodeIds) {
    const node = network.nodes.find(n => n.id === nodeId);
    if (!node) continue;

    // Check if node has cells
    if (node.sleeperCells === 0) {
      results.push({
        nodeId,
        success: false,
        message: 'No sleeper cells available',
        exposure: 0,
      });
      continue;
    }

    // Operation difficulty
    const operationDifficulty = {
      sabotage: 30,
      information_theft: 40,
      assassination: 60,
      ritual_support: 20,
      mass_activation: 50,
    }[operation];

    // Success chance based on corruption and cells
    let successChance = 50 + node.corruptionLevel / 2 + node.sleeperCells * 2;
    successChance -= operationDifficulty;

    // If under investigation, much riskier
    if (node.underInvestigation) {
      successChance -= 30;
    }

    const roll = Math.random() * 100;

    if (roll <= successChance) {
      const exposure = operationDifficulty / 2 + Math.random() * 10;
      totalExposure += exposure;

      results.push({
        nodeId,
        success: true,
        message: `${operation} successful at ${node.name}`,
        exposure,
      });

      // Consume sleeper cells on high-risk operations
      if (operation === 'assassination' || operation === 'mass_activation') {
        node.sleeperCells = Math.max(0, node.sleeperCells - 1);
      }
    } else {
      const exposure = operationDifficulty * 1.5 + Math.random() * 20;
      totalExposure += exposure;

      results.push({
        nodeId,
        success: false,
        message: `${operation} failed at ${node.name}. ${roll > 80 ? 'Cells compromised!' : ''}`,
        exposure,
      });

      if (roll > 80) {
        node.sleeperCells = Math.max(0, node.sleeperCells - Math.ceil(node.sleeperCells * 0.5));
        node.underInvestigation = true;
      }
    }
  }

  const overallSuccess = results.filter(r => r.success).length > results.length / 2;

  return {
    success: overallSuccess,
    results,
    networkExposure: totalExposure,
    message: overallSuccess
      ? `Sleeper cell operation successful! ${results.filter(r => r.success).length}/${results.length} targets achieved.`
      : `Sleeper cell operation failed. ${results.filter(r => !r.success).length} failures.`,
  };
}

export interface SleeperCellResult {
  nodeId: string;
  success: boolean;
  message: string;
  exposure: number;
}

// ============================================================================
// MEMETIC WARFARE
// ============================================================================

export interface MemeticAgent {
  id: string;
  name: string;
  description: string;

  /** Type of idea virus */
  type: 'nihilism' | 'conspiracy' | 'forbidden_knowledge' | 'aesthetic' | 'philosophy' | 'anti_rationalism';

  /** How infectious is it? */
  virality: number;  // 0-100

  /** How much sanity does it drain? */
  sanityDamage: number;

  /** What corruption does it spread? */
  corruptionGain: number;

  /** Transmission vectors */
  vectors: MemeticVector[];

  /** Current reach (number of people affected) */
  reach: number;

  /** Counter-meme resistance */
  resistance: number;  // 0-100, how hard to counter
}

export type MemeticVector = 'social_media' | 'art' | 'music' | 'literature' | 'academic' | 'religious' | 'entertainment';

export interface MemeticCampaign {
  id: string;
  agent: MemeticAgent;
  targetRegionId: string;
  duration: number;
  progress: number;

  /** Influencer nodes helping spread */
  amplificationNodes: string[];  // Influence node IDs from media/academia
}

/**
 * Creates a new memetic agent (idea virus)
 */
export function createMemeticAgent(
  type: MemeticAgent['type'],
  vectors: MemeticVector[],
  eldritchPowerInvested: number,
  state: GreatOldOnesState
): MemeticAgent {
  // Base stats by type
  const typeStats = {
    nihilism: { virality: 60, sanity: 15, corruption: 20 },
    conspiracy: { virality: 80, sanity: 10, corruption: 15 },
    forbidden_knowledge: { virality: 30, sanity: 40, corruption: 35 },
    aesthetic: { virality: 70, sanity: 20, corruption: 25 },
    philosophy: { virality: 40, sanity: 25, corruption: 30 },
    anti_rationalism: { virality: 50, sanity: 30, corruption: 25 },
  };

  const stats = typeStats[type];

  // Power investment boosts all stats
  const powerBonus = eldritchPowerInvested / 50;

  return {
    id: `meme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: generateMemeName(type),
    description: generateMemeDescription(type),
    type,
    virality: Math.min(100, stats.virality + powerBonus),
    sanityDamage: Math.min(50, stats.sanity + powerBonus * 0.5),
    corruptionGain: Math.min(50, stats.corruption + powerBonus * 0.5),
    vectors,
    reach: 0,
    resistance: 50 + powerBonus,
  };
}

/**
 * Spreads a memetic agent through a region
 */
export function spreadMeme(
  agent: MemeticAgent,
  region: RegionalState,
  amplificationNodes: InfluenceNode[],
  state: GreatOldOnesState
): {
  newReach: number;
  sanityDrained: number;
  corruptionGained: number;
  counterMemeDetected: boolean;
  message: string;
} {
  // Base spread rate
  let spreadRate = agent.virality;

  // Amplification from media/academic nodes
  const mediaAmplification = amplificationNodes
    .filter(n => n.institutionType === 'media')
    .reduce((sum, n) => sum + n.corruptionLevel / 10, 0);

  const academicAmplification = amplificationNodes
    .filter(n => n.institutionType === 'academia')
    .reduce((sum, n) => sum + n.corruptionLevel / 15, 0);

  spreadRate += mediaAmplification + academicAmplification;

  // Cultural traits affect spread
  if (region.culturalTraits.includes('urban')) {
    spreadRate *= 1.3;  // Urban areas spread faster
  }
  if (region.culturalTraits.includes('isolated')) {
    spreadRate *= 0.6;  // Isolated areas resist
  }
  if (region.culturalTraits.includes('rationalist') && agent.type === 'anti_rationalism') {
    spreadRate *= 0.5;  // Rationalists resist anti-rational memes
  }
  if (region.culturalTraits.includes('academic') && agent.type === 'forbidden_knowledge') {
    spreadRate *= 1.5;  // Academics drawn to knowledge
  }

  // Calculate new reach (exponential growth but capped by population)
  const populationFactor = 10000;  // Arbitrary population unit
  const currentPenetration = agent.reach / populationFactor;
  const growthFactor = 1 + (spreadRate / 100) * (1 - currentPenetration);
  const newReach = Math.min(populationFactor, agent.reach * growthFactor + 100);

  // Effects
  const sanityDrained = (newReach - agent.reach) * (agent.sanityDamage / 100);
  const corruptionGained = (newReach - agent.reach) * (agent.corruptionGain / 100);

  // Check for counter-meme
  const counterMemeChance = region.investigationHeat / 2 - agent.resistance / 2;
  const counterMemeDetected = Math.random() * 100 < counterMemeChance;

  return {
    newReach,
    sanityDrained,
    corruptionGained,
    counterMemeDetected,
    message: generateMemeSpreadMessage(agent, newReach - agent.reach, counterMemeDetected),
  };
}

/**
 * Intellectual resistance creates counter-memes
 */
export function generateCounterMeme(
  agent: MemeticAgent,
  region: RegionalState
): {
  success: boolean;
  viralityReduction: number;
  message: string;
} {
  // Rationalist and academic regions better at counter-memes
  let counterStrength = 30;

  if (region.culturalTraits.includes('rationalist')) {
    counterStrength += 25;
  }
  if (region.culturalTraits.includes('academic')) {
    counterStrength += 20;
  }

  // Compare to agent resistance
  const success = counterStrength > agent.resistance;
  const viralityReduction = success ? agent.virality * 0.3 : agent.virality * 0.1;

  return {
    success,
    viralityReduction,
    message: success
      ? `Intellectuals successfully counter ${agent.name}! Spread slows significantly.`
      : `Counter-meme attempts fail. ${agent.name} continues spreading.`,
  };
}

// ============================================================================
// DREAM INVASION
// ============================================================================

export interface DreamRitual {
  id: string;
  name: string;
  targetRegionId: string;

  /** What type of nightmares to send */
  dreamType: 'paranoia' | 'cosmic_horror' | 'prophecy' | 'madness' | 'recruitment';

  /** Intensity (0-100) */
  intensity: number;

  /** How many turns it lasts */
  duration: number;
  remainingTurns: number;

  /** Demographics targeted */
  targets: DreamTarget[];

  /** Has spawned dream prophets? */
  dreamProphetsGenerated: number;
}

export type DreamTarget = 'children' | 'leaders' | 'military' | 'general_population' | 'investigators';

export interface DreamArchitecture {
  id: string;
  name: string;
  description: string;

  /** Nightmare design elements */
  elements: DreamElement[];

  /** Psychological attack vectors */
  psychologicalEffects: PsychologicalEffect[];

  /** Success against various resistance levels */
  penetration: number;  // 0-100
}

export interface DreamElement {
  type: 'symbolism' | 'entity_appearance' | 'reality_distortion' | 'personal_fear' | 'cosmic_revelation';
  intensity: number;
  description: string;
}

export interface PsychologicalEffect {
  effect: 'insomnia' | 'paranoia' | 'depression' | 'conversion' | 'suicide_ideation' | 'psychic_opening';
  probability: number;  // 0-100
  severity: number;  // 1-10
}

/**
 * Launches a mass dream invasion ritual
 */
export function launchDreamInvasion(
  targetRegionId: string,
  dreamType: DreamRitual['dreamType'],
  targets: DreamTarget[],
  intensity: number,
  architecture: DreamArchitecture,
  ritualSite: string,
  eldritchPowerSpent: number,
  state: GreatOldOnesState
): {
  success: boolean;
  ritual?: DreamRitual;
  effects: DreamInvasionEffect[];
  message: string;
} {
  // Base success chance
  let successChance = 60;

  // Power investment
  successChance += Math.min(30, eldritchPowerSpent / 10);

  // Architecture quality
  successChance += architecture.penetration / 5;

  // Doctrine bonus
  if (state.doctrine === 'corruption') {
    successChance += 20;
  }

  // Cosmic alignment (dreams stronger during certain phases)
  if (state.alignment.lunarPhase === 0 || state.alignment.lunarPhase === 4) {
    successChance += 15;  // New moon or full moon boost
  }

  const roll = Math.random() * 100;

  if (roll > successChance) {
    return {
      success: false,
      effects: [],
      message: 'Dream invasion ritual fails to penetrate the collective unconscious.',
    };
  }

  // Create ritual
  const ritual: DreamRitual = {
    id: `dream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `Nightmare Epidemic: ${targetRegionId}`,
    targetRegionId,
    dreamType,
    intensity,
    duration: Math.ceil(intensity / 20),
    remainingTurns: Math.ceil(intensity / 20),
    targets,
    dreamProphetsGenerated: 0,
  };

  // Calculate effects
  const effects: DreamInvasionEffect[] = [];

  for (const target of targets) {
    const effect = calculateDreamEffect(target, dreamType, intensity, architecture);
    effects.push(effect);
  }

  return {
    success: true,
    ritual,
    effects,
    message: `Dream invasion successful! Nightmares spread across ${targetRegionId}.`,
  };
}

export interface DreamInvasionEffect {
  target: DreamTarget;
  sanityLoss: number;
  insomniaRate: number;  // % of population affected
  conversions: number;
  prophetsGenerated: number;
  productivityLoss: number;  // % economic impact
  description: string;
}

function calculateDreamEffect(
  target: DreamTarget,
  dreamType: DreamRitual['dreamType'],
  intensity: number,
  architecture: DreamArchitecture
): DreamInvasionEffect {
  const baseSanity = intensity * 0.3;
  const baseInsomnia = intensity * 0.5;

  // Target-specific multipliers
  const targetMultipliers = {
    children: { sanity: 1.5, insomnia: 1.2, conversion: 0.05, prophets: 0.02, productivity: 0.1 },
    leaders: { sanity: 1.0, insomnia: 1.5, conversion: 0.02, prophets: 0.01, productivity: 0.3 },
    military: { sanity: 0.8, insomnia: 1.3, conversion: 0.01, prophets: 0.005, productivity: 0.4 },
    general_population: { sanity: 1.0, insomnia: 1.0, conversion: 0.03, prophets: 0.01, productivity: 0.2 },
    investigators: { sanity: 0.6, insomnia: 1.8, conversion: 0.001, prophets: 0.001, productivity: 0.5 },
  };

  const mult = targetMultipliers[target];

  return {
    target,
    sanityLoss: baseSanity * mult.sanity,
    insomniaRate: baseInsomnia * mult.insomnia,
    conversions: Math.floor(intensity * mult.conversion * 100),
    prophetsGenerated: Math.floor(intensity * mult.prophets * 100),
    productivityLoss: intensity * mult.productivity,
    description: generateDreamEffectDescription(target, dreamType, intensity),
  };
}

/**
 * Dream prophets are people who channel eldritch messages unconsciously
 */
export function generateDreamProphet(
  regionId: string,
  dreamType: DreamRitual['dreamType']
): {
  name: string;
  influence: number;
  message: string;
  benefits: string[];
} {
  const names = ['Sarah Chen', 'Marcus Webb', 'Elena Volkov', 'James Morrison', 'Aria Santos'];
  const name = names[Math.floor(Math.random() * names.length)];

  const influence = 40 + Math.random() * 40;

  const benefits = [
    '+5% corruption spread in region',
    'Attracts cultist recruits passively',
    'Spreads nightmares to followers',
    influence > 70 ? 'May form independent cult chapter' : 'Provides sanity fragments',
  ];

  return {
    name,
    influence,
    message: `${name} has become a Dream Prophet in ${regionId}, unwittingly channeling eldritch visions!`,
    benefits,
  };
}

// ============================================================================
// PUPPET GOVERNMENT SYSTEM
// ============================================================================

export interface PuppetGovernment {
  regionId: string;
  corruptionLevel: number;  // 0-100, how much of government is controlled

  /** Key corrupted officials */
  officials: CorruptedOfficial[];

  /** Eldritch-friendly legislation passed */
  legislation: EldritchLegislation[];

  /** Resources generated per turn */
  resourceGeneration: {
    sanityFragments: number;
    cultistRecruitment: number;
    veilProtection: number;
  };

  /** Is the corruption exposed? */
  exposed: boolean;

  /** Public approval (lower = suspicious) */
  publicApproval: number;
}

export interface CorruptedOfficial {
  id: string;
  name: string;
  title: string;
  position: 'executive' | 'legislative' | 'judicial' | 'military_command' | 'intelligence_chief';

  loyalty: number;  // 0-100
  compromiseMethod: CompromisedPerson['method'];

  /** What can they do for the Order? */
  capabilities: OfficialCapability[];

  exposureRisk: number;
}

export type OfficialCapability =
  | 'pass_legislation'
  | 'suppress_investigations'
  | 'divert_funds'
  | 'military_orders'
  | 'intelligence_manipulation'
  | 'judicial_protection';

export interface EldritchLegislation {
  id: string;
  name: string;
  description: string;

  /** What does this law enable? */
  effects: LegislationEffect[];

  /** How suspicious is it? */
  suspicionLevel: number;  // 0-100

  passedTurn: number;
}

export interface LegislationEffect {
  type: 'ritual_site_protection' | 'thought_crime' | 'surveillance' | 'mandatory_programs' | 'resource_allocation' | 'cult_legalization';
  benefit: string;
  value: number;
}

/**
 * Passes eldritch-friendly legislation through puppet government
 */
export function passLegislation(
  puppet: PuppetGovernment,
  legislationType: LegislationEffect['type'],
  coverStory: string,
  state: GreatOldOnesState
): {
  success: boolean;
  legislation?: EldritchLegislation;
  suspicionGained: number;
  message: string;
} {
  // Need sufficient corruption to pass laws
  if (puppet.corruptionLevel < 40) {
    return {
      success: false,
      suspicionGained: 0,
      message: 'Insufficient government control to pass legislation.',
    };
  }

  // Check for legislative officials
  const legislators = puppet.officials.filter(
    o => o.position === 'legislative' && o.capabilities.includes('pass_legislation')
  );

  if (legislators.length === 0) {
    return {
      success: false,
      suspicionGained: 0,
      message: 'No corrupted legislators available.',
    };
  }

  // Success chance based on corruption and official loyalty
  const avgLoyalty = legislators.reduce((sum, o) => sum + o.loyalty, 0) / legislators.length;
  let successChance = 50 + puppet.corruptionLevel / 2 + avgLoyalty / 4;

  // Some legislation types are harder to pass
  const difficultyModifiers = {
    ritual_site_protection: -10,
    thought_crime: -30,
    surveillance: -15,
    mandatory_programs: -20,
    resource_allocation: -5,
    cult_legalization: -40,
  };
  successChance += difficultyModifiers[legislationType];

  const roll = Math.random() * 100;

  if (roll > successChance) {
    const suspicion = Math.abs(difficultyModifiers[legislationType]) / 2;
    return {
      success: false,
      suspicionGained: suspicion,
      message: `Legislation fails to pass. ${suspicion > 10 ? 'Raised some eyebrows.' : ''}`,
    };
  }

  // Create legislation
  const legislation: EldritchLegislation = {
    id: `law_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: coverStory,
    description: generateLegislationDescription(legislationType, coverStory),
    effects: [generateLegislationEffect(legislationType)],
    suspicionLevel: Math.abs(difficultyModifiers[legislationType]),
    passedTurn: state.alignment.turn,
  };

  return {
    success: true,
    legislation,
    suspicionGained: legislation.suspicionLevel / 2,
    message: `"${coverStory}" has been passed into law!`,
  };
}

/**
 * Uses compromised intelligence agencies to suppress investigations
 */
export function suppressInvestigation(
  puppet: PuppetGovernment,
  targetInvestigatorId: string,
  method: 'discredit' | 'redirect' | 'bribe' | 'threaten' | 'eliminate',
  state: GreatOldOnesState
): {
  success: boolean;
  investigationReduction: number;
  exposureRisk: number;
  message: string;
} {
  // Check for intelligence officials
  const intOfficials = puppet.officials.filter(
    o => o.position === 'intelligence_chief' &&
      o.capabilities.includes('intelligence_manipulation')
  );

  if (intOfficials.length === 0) {
    return {
      success: false,
      investigationReduction: 0,
      exposureRisk: 0,
      message: 'No compromised intelligence officials available.',
    };
  }

  // Method difficulty and exposure risk
  const methodStats = {
    discredit: { difficulty: 30, exposure: 10, effectiveness: 20 },
    redirect: { difficulty: 20, exposure: 5, effectiveness: 30 },
    bribe: { difficulty: 40, exposure: 30, effectiveness: 40 },
    threaten: { difficulty: 35, exposure: 25, effectiveness: 35 },
    eliminate: { difficulty: 60, exposure: 50, effectiveness: 100 },
  };

  const stats = methodStats[method];
  const official = intOfficials[0];

  let successChance = 60 + official.loyalty / 2 - stats.difficulty;

  const roll = Math.random() * 100;

  if (roll > successChance) {
    return {
      success: false,
      investigationReduction: 0,
      exposureRisk: stats.exposure * 1.5,
      message: `Suppression attempt fails! ${roll > 85 ? 'Official exposed!' : 'Investigator remains active.'}`,
    };
  }

  return {
    success: true,
    investigationReduction: stats.effectiveness,
    exposureRisk: stats.exposure,
    message: `Investigation successfully suppressed via ${method}. ${stats.effectiveness === 100 ? 'Investigator eliminated.' : 'Investigation heat reduced.'}`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateInstitutionName(type: InstitutionType, regionName: string): string {
  const templates = {
    government: [`${regionName} Department of Public Safety`, `${regionName} City Council`],
    military: [`${regionName} Military District`, `${regionName} National Guard`],
    corporate: [`${regionName} Industries`, `Global ${regionName} Corp`],
    media: [`${regionName} Daily News`, `${regionName} Broadcasting Network`],
    academia: [`${regionName} University`, `${regionName} Institute of Technology`],
    religious: [`${regionName} Interfaith Council`, `Temple of ${regionName}`],
    intelligence: [`${regionName} Security Service`, `${regionName} Intelligence Bureau`],
  };

  const options = templates[type];
  return options[Math.floor(Math.random() * options.length)];
}

function generatePersonName(): string {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function generatePosition(type: InstitutionType, importance: number): string {
  const positions = {
    government: ['Aide', 'Manager', 'Director', 'Deputy Secretary', 'Secretary', 'Minister', 'Prime Minister'],
    military: ['Captain', 'Major', 'Colonel', 'Brigadier', 'General', 'Chief of Staff'],
    corporate: ['Manager', 'Director', 'VP', 'SVP', 'EVP', 'COO', 'CEO'],
    media: ['Reporter', 'Editor', 'Senior Editor', 'Managing Editor', 'Editor-in-Chief', 'Publisher'],
    academia: ['Lecturer', 'Professor', 'Department Head', 'Dean', 'Provost', 'President'],
    religious: ['Priest', 'Minister', 'Bishop', 'Archbishop', 'Cardinal'],
    intelligence: ['Analyst', 'Agent', 'Senior Agent', 'Division Chief', 'Deputy Director', 'Director'],
  };

  const list = positions[type];
  const index = Math.min(list.length - 1, Math.floor((importance / 10) * list.length));
  return list[index];
}

function generateMemeName(type: MemeticAgent['type']): string {
  const names = {
    nihilism: ['Nothing Matters Movement', 'The Void Aesthetic', 'Existential Despair Collective'],
    conspiracy: ['The Hidden Truth', 'They Are Watching', 'Wake Up Theory'],
    forbidden_knowledge: ['The Necronomicon Papers', 'Eldritch Mathematics', 'Cosmic Truth Archive'],
    aesthetic: ['Dark Geometry', 'Impossible Colors Movement', 'Non-Euclidean Art'],
    philosophy: ['True Cosmic Philosophy', 'Beyond Rationality', 'Transcendent Nihilism'],
    anti_rationalism: ['Post-Logic Movement', 'Reason Is Prison', 'Embrace Unreason'],
  };

  const options = names[type];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMemeDescription(type: MemeticAgent['type']): string {
  const descriptions = {
    nihilism: 'A philosophy that life is meaningless, preparing minds for cosmic indifference.',
    conspiracy: 'Wild theories that happen to brush against eldritch truth.',
    forbidden_knowledge: 'Fragments of genuine occult knowledge spreading through culture.',
    aesthetic: 'Art and design incorporating impossible geometries and alien beauty.',
    philosophy: 'A new philosophy questioning the foundations of reality and reason.',
    anti_rationalism: 'Ideas attacking rational thought as limited and imprisoning.',
  };

  return descriptions[type];
}

function generateMemeSpreadMessage(agent: MemeticAgent, newInfections: number, countered: boolean): string {
  const baseMessage = `${agent.name} spreads to ${Math.floor(newInfections)} new people.`;
  const counterMessage = countered ? ' Intellectuals begin creating counter-memes!' : '';
  return baseMessage + counterMessage;
}

function generateDreamEffectDescription(target: DreamTarget, dreamType: DreamRitual['dreamType'], intensity: number): string {
  return `${target} plagued by ${dreamType} nightmares (intensity: ${intensity})`;
}

function generateLegislationDescription(type: LegislationEffect['type'], coverStory: string): string {
  return `Under the guise of "${coverStory}", this law serves the Order's interests.`;
}

function generateLegislationEffect(type: LegislationEffect['type']): LegislationEffect {
  const effects = {
    ritual_site_protection: {
      benefit: 'Ritual sites protected as "historical landmarks"',
      value: 20,
    },
    thought_crime: {
      benefit: 'Critics of the Order can be legally silenced',
      value: 30,
    },
    surveillance: {
      benefit: 'Mass surveillance helps identify investigators',
      value: 25,
    },
    mandatory_programs: {
      benefit: 'Mandatory "wellness programs" are actually indoctrination',
      value: 35,
    },
    resource_allocation: {
      benefit: 'Government funds diverted to Order operations',
      value: 15,
    },
    cult_legalization: {
      benefit: 'Order recognized as legitimate religion',
      value: 50,
    },
  };

  const effect = effects[type];
  return {
    type,
    benefit: effect.benefit,
    value: effect.value,
  };
}
