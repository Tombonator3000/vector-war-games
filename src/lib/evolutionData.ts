/**
 * Evolution Tree Data - All node definitions
 * Plague Inc inspired evolution system
 */

import type { EvolutionNode, PlagueType } from '@/types/biowarfare';

// ============================================================================
// TRANSMISSION NODES
// ============================================================================

export const TRANSMISSION_NODES: EvolutionNode[] = [
  // Air transmission branch
  {
    id: 'air-1',
    category: 'transmission',
    name: 'Air 1',
    description: 'Pathogen evolves to travel on dust particles',
    flavor: 'Aerosolized particulate dispersal via atmospheric suspension',
    dnaCost: 5,
    effects: {
      infectivity: 2,
    },
  },
  {
    id: 'air-2',
    category: 'transmission',
    name: 'Air 2',
    description: 'Pathogen can survive in aircraft recycled air',
    flavor: 'HVAC system exploitation - global aviation vector active',
    dnaCost: 8,
    requires: ['air-1'],
    effects: {
      infectivity: 4,
    },
  },

  // Water transmission branch
  {
    id: 'water-1',
    category: 'transmission',
    name: 'Water 1',
    description: 'Pathogen can survive in fresh water',
    flavor: 'Aquatic persistence protocols initialized',
    dnaCost: 6,
    effects: {
      infectivity: 3,
    },
  },
  {
    id: 'water-2',
    category: 'transmission',
    name: 'Water 2',
    description: 'Pathogen thrives in salt water and sewage',
    flavor: 'Maritime transmission corridors unlocked',
    dnaCost: 9,
    requires: ['water-1'],
    effects: {
      infectivity: 4,
    },
  },

  // Blood transmission branch
  {
    id: 'blood-1',
    category: 'transmission',
    name: 'Blood 1',
    description: 'Pathogen transmitted through bodily fluids',
    flavor: 'Hemorrhagic fluid exchange vectors enabled',
    dnaCost: 7,
    effects: {
      infectivity: 2,
      severity: 2,
    },
    increasesVisibility: true,
  },
  {
    id: 'blood-2',
    category: 'transmission',
    name: 'Blood 2',
    description: 'Pathogen survives in blood banks and medical equipment',
    flavor: 'Healthcare infiltration - iatrogenic cascade initiated',
    dnaCost: 10,
    requires: ['blood-1'],
    effects: {
      infectivity: 4,
      severity: 3,
    },
    increasesVisibility: true,
  },

  // Insect transmission branch
  {
    id: 'insect-1',
    category: 'transmission',
    name: 'Insect 1',
    description: 'Pathogen transmitted by mosquitoes and flies',
    flavor: 'Arthropod vectorization - diptera carriers active',
    dnaCost: 6,
    effects: {
      infectivity: 3,
    },
  },
  {
    id: 'insect-2',
    category: 'transmission',
    name: 'Insect 2',
    description: 'Pathogen breeds in insect populations',
    flavor: 'Entomological amplification loop established',
    dnaCost: 9,
    requires: ['insect-1'],
    effects: {
      infectivity: 5,
    },
  },

  // Bird transmission branch
  {
    id: 'bird-1',
    category: 'transmission',
    name: 'Bird 1',
    description: 'Pathogen carried by migratory birds',
    flavor: 'Avian migration corridors exploited',
    dnaCost: 7,
    effects: {
      infectivity: 4,
    },
  },
  {
    id: 'bird-2',
    category: 'transmission',
    name: 'Bird 2',
    description: 'Pathogen transmits through bird droppings in urban areas',
    flavor: 'Metropolitan ornithological dispersal active',
    dnaCost: 10,
    requires: ['bird-1'],
    effects: {
      infectivity: 5,
    },
  },

  // Rodent transmission branch
  {
    id: 'rodent-1',
    category: 'transmission',
    name: 'Rodent 1',
    description: 'Pathogen spreads via rats and mice',
    flavor: 'Murine distribution networks established',
    dnaCost: 6,
    effects: {
      infectivity: 3,
    },
  },
  {
    id: 'rodent-2',
    category: 'transmission',
    name: 'Rodent 2',
    description: 'Pathogen thrives in urban rodent populations',
    flavor: 'Subterranean infestation matrix operational',
    dnaCost: 9,
    requires: ['rodent-1'],
    effects: {
      infectivity: 5,
    },
  },

  // Livestock transmission
  {
    id: 'livestock-1',
    category: 'transmission',
    name: 'Livestock',
    description: 'Pathogen jumps to cattle, pigs, and sheep',
    flavor: 'Agricultural zoonotic bridge established',
    dnaCost: 8,
    effects: {
      infectivity: 4,
      severity: 1,
    },
  },

  // Extreme transmission (late game)
  {
    id: 'extreme-bioaerosol',
    category: 'transmission',
    name: 'Extreme Bioaerosol',
    description: 'Weaponized aerosolization with extended airborne survival',
    flavor: 'Militarized dispersal protocols - pandemic inevitable',
    dnaCost: 18,
    requires: ['air-2'],
    effects: {
      infectivity: 10,
      severity: 3,
    },
    increasesVisibility: true,
  },
  {
    id: 'extreme-zoonosis',
    category: 'transmission',
    name: 'Extreme Zoonosis',
    description: 'Pathogen jumps between all animal species',
    flavor: 'Total cross-species compatibility achieved',
    dnaCost: 16,
    requires: ['livestock-1'],
    effects: {
      infectivity: 8,
      severity: 2,
    },
  },
];

// ============================================================================
// SYMPTOM NODES
// ============================================================================

export const SYMPTOM_NODES: EvolutionNode[] = [
  // Tier 1 - Mild symptoms
  {
    id: 'coughing',
    category: 'symptom',
    name: 'Coughing',
    description: 'Irritates airways, expels pathogen',
    flavor: 'Respiratory expulsion vectors active',
    dnaCost: 3,
    effects: {
      infectivity: 2,
      severity: 1,
    },
  },
  {
    id: 'sneezing',
    category: 'symptom',
    name: 'Sneezing',
    description: 'Violent expulsion of pathogen droplets',
    flavor: 'Explosive aerosol dispersal enabled',
    dnaCost: 3,
    effects: {
      infectivity: 3,
      severity: 1,
    },
  },
  {
    id: 'rash',
    category: 'symptom',
    name: 'Rash',
    description: 'Skin irritation and inflammation',
    flavor: 'Dermal manifestation protocols initiated',
    dnaCost: 2,
    effects: {
      severity: 2,
    },
    increasesVisibility: true,
  },
  {
    id: 'sweating',
    category: 'symptom',
    name: 'Sweating',
    description: 'Increased fluid secretion',
    flavor: 'Thermoregulation disruption - fluid contamination active',
    dnaCost: 2,
    effects: {
      infectivity: 1,
      severity: 1,
    },
  },
  {
    id: 'nausea',
    category: 'symptom',
    name: 'Nausea',
    description: 'Stomach discomfort and unease',
    flavor: 'Gastric irritation subroutines deployed',
    dnaCost: 3,
    effects: {
      severity: 2,
    },
  },
  {
    id: 'vomiting',
    category: 'symptom',
    name: 'Vomiting',
    description: 'Forceful expulsion of stomach contents',
    flavor: 'Emetic pathogen dispersal activated',
    dnaCost: 4,
    requires: ['nausea'],
    effects: {
      infectivity: 2,
      severity: 3,
    },
    increasesVisibility: true,
  },
  {
    id: 'cysts',
    category: 'symptom',
    name: 'Cysts',
    description: 'Pathogen forms protective cysts under skin',
    flavor: 'Subcutaneous encystment for persistence',
    dnaCost: 4,
    effects: {
      severity: 2,
    },
    increasesVisibility: true,
  },
  {
    id: 'fever',
    category: 'symptom',
    name: 'Fever',
    description: 'Elevated body temperature',
    flavor: 'Pyrogenic response cascade initiated',
    dnaCost: 3,
    effects: {
      infectivity: 1,
      severity: 2,
    },
  },

  // Tier 2 - Moderate symptoms
  {
    id: 'pneumonia',
    category: 'symptom',
    name: 'Pneumonia',
    description: 'Severe lung infection',
    flavor: 'Pulmonary colonization - respiratory failure imminent',
    dnaCost: 7,
    requires: ['coughing'],
    effects: {
      infectivity: 2,
      severity: 5,
      lethality: 2,
    },
    increasesVisibility: true,
  },
  {
    id: 'skin-lesions',
    category: 'symptom',
    name: 'Skin Lesions',
    description: 'Open sores and tissue damage',
    flavor: 'Necrotizing dermal degradation active',
    dnaCost: 6,
    requires: ['rash'],
    effects: {
      infectivity: 2,
      severity: 4,
      lethality: 1,
    },
    increasesVisibility: true,
  },
  {
    id: 'immune-suppression',
    category: 'symptom',
    name: 'Immune Suppression',
    description: 'Weakens immune system defenses',
    flavor: 'Immunological sabotage - T-cell collapse',
    dnaCost: 6,
    effects: {
      infectivity: 1,
      severity: 3,
      lethality: 2,
    },
  },
  {
    id: 'abscesses',
    category: 'symptom',
    name: 'Abscesses',
    description: 'Infected pockets of pus',
    flavor: 'Purulent reservoirs formed - secondary infection vectors',
    dnaCost: 5,
    requires: ['cysts'],
    effects: {
      infectivity: 2,
      severity: 4,
      lethality: 1,
    },
    increasesVisibility: true,
  },
  {
    id: 'diarrhea',
    category: 'symptom',
    name: 'Diarrhea',
    description: 'Severe intestinal fluid loss',
    flavor: 'Enteric pathogen shedding maximized',
    dnaCost: 5,
    requires: ['vomiting'],
    effects: {
      infectivity: 3,
      severity: 3,
      lethality: 1,
    },
    increasesVisibility: true,
  },
  {
    id: 'pulmonary-edema',
    category: 'symptom',
    name: 'Pulmonary Edema',
    description: 'Fluid accumulation in lungs',
    flavor: 'Alveolar flooding - drowning from within',
    dnaCost: 8,
    requires: ['pneumonia'],
    effects: {
      severity: 6,
      lethality: 4,
    },
    increasesVisibility: true,
  },
  {
    id: 'inflammation',
    category: 'symptom',
    name: 'Inflammation',
    description: 'Widespread tissue swelling',
    flavor: 'Systemic inflammatory cascade - organs under siege',
    dnaCost: 6,
    requires: ['fever'],
    effects: {
      severity: 4,
      lethality: 2,
    },
  },

  // Tier 3 - Severe symptoms
  {
    id: 'total-organ-failure',
    category: 'symptom',
    name: 'Total Organ Failure',
    description: 'Multiple organs shut down',
    flavor: 'Catastrophic systemic collapse - mortality imminent',
    dnaCost: 15,
    requires: ['inflammation'],
    effects: {
      severity: 10,
      lethality: 12,
    },
    increasesVisibility: true,
  },
  {
    id: 'hemorrhagic-shock',
    category: 'symptom',
    name: 'Hemorrhagic Shock',
    description: 'Uncontrolled internal bleeding',
    flavor: 'Vascular rupture protocols - terminal hemorrhage',
    dnaCost: 14,
    requires: ['skin-lesions'],
    effects: {
      infectivity: 2,
      severity: 9,
      lethality: 11,
    },
    increasesVisibility: true,
  },
  {
    id: 'necrosis',
    category: 'symptom',
    name: 'Necrosis',
    description: 'Widespread tissue death',
    flavor: 'Gangrenous decay - living flesh converted to carrion',
    dnaCost: 13,
    requires: ['abscesses'],
    effects: {
      severity: 8,
      lethality: 10,
    },
    increasesVisibility: true,
  },
  {
    id: 'insanity',
    category: 'symptom',
    name: 'Insanity',
    description: 'Severe cognitive impairment and psychosis',
    flavor: 'Neural degradation - higher function terminated',
    dnaCost: 12,
    requires: ['inflammation'],
    effects: {
      severity: 7,
      lethality: 5,
    },
    increasesVisibility: true,
  },
  {
    id: 'paralysis',
    category: 'symptom',
    name: 'Paralysis',
    description: 'Loss of motor function',
    flavor: 'Neuromuscular junction sabotage - mobility ceased',
    dnaCost: 11,
    requires: ['inflammation'],
    effects: {
      severity: 8,
      lethality: 6,
    },
    increasesVisibility: true,
  },
  {
    id: 'coma',
    category: 'symptom',
    name: 'Coma',
    description: 'Loss of consciousness',
    flavor: 'Consciousness matrix offline - terminal dormancy',
    dnaCost: 10,
    requires: ['insanity'],
    effects: {
      severity: 9,
      lethality: 7,
    },
    increasesVisibility: true,
  },

  // Tier 4 - Lethal symptoms
  {
    id: 'cytokine-storm',
    category: 'symptom',
    name: 'Cytokine Storm',
    description: 'Immune system destroys body',
    flavor: 'Immunological auto-destruction - body wars with itself',
    dnaCost: 18,
    requires: ['total-organ-failure'],
    effects: {
      severity: 10,
      lethality: 15,
    },
    increasesVisibility: true,
  },
  {
    id: 'systemic-infection',
    category: 'symptom',
    name: 'Systemic Infection',
    description: 'Pathogen floods bloodstream',
    flavor: 'Septic cascade - every cell becomes a bioreactor',
    dnaCost: 16,
    requires: ['total-organ-failure'],
    effects: {
      severity: 10,
      lethality: 13,
    },
    increasesVisibility: true,
  },
  {
    id: 'liquefaction',
    category: 'symptom',
    name: 'Liquefaction',
    description: 'Internal organs dissolve',
    flavor: 'Enzymatic digestion protocols - structural integrity lost',
    dnaCost: 20,
    requires: ['hemorrhagic-shock', 'necrosis'],
    effects: {
      severity: 10,
      lethality: 18,
    },
    increasesVisibility: true,
  },
];

// ============================================================================
// ABILITY NODES
// ============================================================================

export const ABILITY_NODES: EvolutionNode[] = [
  // Cold resistance
  {
    id: 'cold-resistance-1',
    category: 'ability',
    name: 'Cold Resistance 1',
    description: 'Pathogen survives in cold climates',
    flavor: 'Cryogenic persistence - Arctic vectors unlocked',
    dnaCost: 5,
    effects: {
      infectivity: 2,
    },
  },
  {
    id: 'cold-resistance-2',
    category: 'ability',
    name: 'Cold Resistance 2',
    description: 'Pathogen thrives in freezing conditions',
    flavor: 'Subzero optimization - polar dominance',
    dnaCost: 8,
    requires: ['cold-resistance-1'],
    effects: {
      infectivity: 4,
    },
  },

  // Heat resistance
  {
    id: 'heat-resistance-1',
    category: 'ability',
    name: 'Heat Resistance 1',
    description: 'Pathogen survives in hot climates',
    flavor: 'Thermal adaptation - equatorial expansion enabled',
    dnaCost: 5,
    effects: {
      infectivity: 2,
    },
  },
  {
    id: 'heat-resistance-2',
    category: 'ability',
    name: 'Heat Resistance 2',
    description: 'Pathogen thrives in extreme heat',
    flavor: 'Desert warfare protocols - arid zone saturation',
    dnaCost: 8,
    requires: ['heat-resistance-1'],
    effects: {
      infectivity: 4,
    },
  },

  // Drug resistance
  {
    id: 'drug-resistance-1',
    category: 'ability',
    name: 'Drug Resistance 1',
    description: 'Pathogen resists basic medications',
    flavor: 'Pharmaceutical countermeasures neutralized',
    dnaCost: 6,
    effects: {
      cureResistance: 2,
    },
  },
  {
    id: 'drug-resistance-2',
    category: 'ability',
    name: 'Drug Resistance 2',
    description: 'Pathogen resists advanced antibiotics',
    flavor: 'Multi-drug resistance - healthcare collapse accelerating',
    dnaCost: 10,
    requires: ['drug-resistance-1'],
    effects: {
      cureResistance: 4,
    },
  },
  {
    id: 'drug-resistance-3',
    category: 'ability',
    name: 'Drug Resistance 3',
    description: 'Pathogen immune to all conventional treatments',
    flavor: 'Total pharmaceutical immunity - medicine obsolete',
    dnaCost: 15,
    requires: ['drug-resistance-2'],
    effects: {
      cureResistance: 7,
    },
  },

  // Genetic hardening (slows cure research)
  {
    id: 'genetic-hardening-1',
    category: 'ability',
    name: 'Genetic Hardening 1',
    description: 'Makes pathogen harder to analyze',
    flavor: 'Genomic obfuscation - lab analysis hampered',
    dnaCost: 7,
    effects: {
      cureResistance: 3,
    },
  },
  {
    id: 'genetic-hardening-2',
    category: 'ability',
    name: 'Genetic Hardening 2',
    description: 'Complex genetic structure confounds research',
    flavor: 'Cryptographic DNA lattice - sequencing stalled',
    dnaCost: 11,
    requires: ['genetic-hardening-1'],
    effects: {
      cureResistance: 5,
    },
  },
  {
    id: 'genetic-hardening-3',
    category: 'ability',
    name: 'Genetic Hardening 3',
    description: 'Nearly impossible to sequence genome',
    flavor: 'Quantum genetic encryption - reverse engineering impossible',
    dnaCost: 16,
    requires: ['genetic-hardening-2'],
    effects: {
      cureResistance: 8,
    },
  },

  // Environmental hardening
  {
    id: 'environmental-hardening',
    category: 'ability',
    name: 'Environmental Hardening',
    description: 'Pathogen survives outside host longer',
    flavor: 'Spore-like dormancy - surfaces remain contaminated',
    dnaCost: 8,
    effects: {
      infectivity: 3,
    },
  },

  // Genetic reshuffle (reduces cure progress)
  {
    id: 'genetic-reshuffle-1',
    category: 'ability',
    name: 'Genetic Reshuffle 1',
    description: 'Pathogen mutates to avoid cure',
    flavor: 'Adaptive mutation burst - research data invalidated',
    dnaCost: 12,
    effects: {
      cureResistance: 4,
    },
  },
  {
    id: 'genetic-reshuffle-2',
    category: 'ability',
    name: 'Genetic Reshuffle 2',
    description: 'Rapid genetic reorganization',
    flavor: 'Recursive genetic algorithm - moving target achieved',
    dnaCost: 16,
    requires: ['genetic-reshuffle-1'],
    effects: {
      cureResistance: 6,
    },
  },
  {
    id: 'genetic-reshuffle-3',
    category: 'ability',
    name: 'Genetic Reshuffle 3',
    description: 'Constant genetic flux',
    flavor: 'Perpetual genomic instability - cure obsolete on arrival',
    dnaCost: 20,
    requires: ['genetic-reshuffle-2'],
    effects: {
      cureResistance: 9,
    },
  },

  // Plague-type specific abilities
  {
    id: 'neural-atrophy',
    category: 'ability',
    name: 'Neural Atrophy',
    description: 'Prion-specific: Accelerates brain damage',
    flavor: 'Prion cascade - cognitive dissolution',
    dnaCost: 12,
    effects: {
      severity: 5,
      lethality: 8,
    },
    plagueTypeModifier: {
      prion: { dnaCostMultiplier: 0.5 },
      bacteria: { disabled: true },
      virus: { disabled: true },
      fungus: { disabled: true },
      parasite: { disabled: true },
      'nano-virus': { disabled: true },
      'bio-weapon': { disabled: true },
    },
  },
  {
    id: 'bacterial-resilience',
    category: 'ability',
    name: 'Bacterial Resilience',
    description: 'Bacteria-specific: Forms protective biofilms',
    flavor: 'Biofilm fortress - antibiotics deflected',
    dnaCost: 10,
    effects: {
      cureResistance: 5,
    },
    plagueTypeModifier: {
      bacteria: { dnaCostMultiplier: 0.5 },
      virus: { disabled: true },
      fungus: { disabled: true },
      parasite: { disabled: true },
      prion: { disabled: true },
      'nano-virus': { disabled: true },
      'bio-weapon': { disabled: true },
    },
  },
  {
    id: 'viral-instability',
    category: 'ability',
    name: 'Viral Instability',
    description: 'Virus-specific: Random beneficial mutations',
    flavor: 'Hypermutation engine - unpredictable evolution',
    dnaCost: 8,
    effects: {
      infectivity: 3,
    },
    plagueTypeModifier: {
      virus: { dnaCostMultiplier: 0.5 },
      bacteria: { disabled: true },
      fungus: { disabled: true },
      parasite: { disabled: true },
      prion: { disabled: true },
      'nano-virus': { disabled: true },
      'bio-weapon': { disabled: true },
    },
  },
  {
    id: 'spore-burst',
    category: 'ability',
    name: 'Spore Burst',
    description: 'Fungus-specific: Explosive spore release',
    flavor: 'Sporulation detonation - airborne cloud deployed',
    dnaCost: 14,
    effects: {
      infectivity: 8,
    },
    plagueTypeModifier: {
      fungus: { dnaCostMultiplier: 0.5 },
      bacteria: { disabled: true },
      virus: { disabled: true },
      parasite: { disabled: true },
      prion: { disabled: true },
      'nano-virus': { disabled: true },
      'bio-weapon': { disabled: true },
    },
  },
  {
    id: 'symbiosis',
    category: 'ability',
    name: 'Symbiosis',
    description: 'Parasite-specific: Hides in host cells',
    flavor: 'Cellular camouflage - immune detection suppressed',
    dnaCost: 10,
    effects: {
      severity: -3,
      cureResistance: 6,
    },
    plagueTypeModifier: {
      parasite: { dnaCostMultiplier: 0.5 },
      bacteria: { disabled: true },
      virus: { disabled: true },
      fungus: { disabled: true },
      prion: { disabled: true },
      'nano-virus': { disabled: true },
      'bio-weapon': { disabled: true },
    },
  },
];

// ============================================================================
// DEFENSE NODES - Player countermeasure research
// ============================================================================

export const DEFENSE_NODES: EvolutionNode[] = [
  {
    id: 'vaccine-prototyping',
    category: 'defense',
    name: 'Vaccine Prototyping',
    description: 'Allied research teams rapidly assemble prototype vaccine candidates.',
    flavor: 'Coalition biolabs exchange encrypted genomes to spin up neutralizing cultures.',
    dnaCost: 9,
    requires: ['drug-resistance-1'],
    effects: {},
    defenseEffects: {
      vaccineProgress: 12,
    },
  },
  {
    id: 'vaccine-field-trials',
    category: 'defense',
    name: 'Vaccine Field Trials',
    description: 'Expedited human trials unlock emergency approval pathways.',
    flavor: 'Forward bases host clandestine trials under DEFCON quarantine protocols.',
    dnaCost: 12,
    requires: ['vaccine-prototyping'],
    effects: {},
    defenseEffects: {
      vaccineProgress: 18,
    },
  },
  {
    id: 'vaccine-mass-production',
    category: 'defense',
    name: 'Vaccine Mass Production',
    description: 'Rapid manufacturing lines flood the globe with protective doses.',
    flavor: 'Stratcom reroutes supply chains—cargo jets disperse antigen arrays worldwide.',
    dnaCost: 16,
    requires: ['vaccine-field-trials'],
    effects: {},
    defenseEffects: {
      vaccineProgress: 24,
    },
  },
  {
    id: 'radiation-shielding-1',
    category: 'defense',
    name: 'Radiation Shielding Mesh',
    description: 'Deployable shielding reduces fallout lethality around strategic hubs.',
    flavor: 'Nanofiber domes bloom over urban centers, scattering ionizing fallout.',
    dnaCost: 10,
    requires: ['genetic-hardening-1'],
    effects: {},
    defenseEffects: {
      radiationMitigation: 0.2,
    },
  },
  {
    id: 'radiation-shielding-2',
    category: 'defense',
    name: 'Global Radiation Umbrella',
    description: 'Coordinated shield grid dramatically cuts fallout casualties worldwide.',
    flavor: 'High-altitude aerosols and orbital reflectors diffuse lingering radiation plumes.',
    dnaCost: 14,
    requires: ['radiation-shielding-1'],
    effects: {},
    defenseEffects: {
      radiationMitigation: 0.35,
    },
  },
];

// ============================================================================
// ALL NODES COMBINED
// ============================================================================

export const ALL_EVOLUTION_NODES: EvolutionNode[] = [
  ...TRANSMISSION_NODES,
  ...SYMPTOM_NODES,
  ...ABILITY_NODES,
  ...DEFENSE_NODES,
];

// ============================================================================
// PLAGUE TYPE DEFINITIONS
// ============================================================================

export const PLAGUE_TYPES: PlagueType[] = [
  {
    id: 'bacteria',
    name: 'Bacteria',
    description: 'Balanced pathogen, good for beginners',
    difficulty: 'beginner',
    specialMechanic: 'Most versatile plague type with no special mechanics',
    baseTransmission: 0,
    baseSeverity: 0,
    baseLethality: 0,
    transmissionCostMultiplier: 1.0,
    symptomCostMultiplier: 1.0,
    abilityCostMultiplier: 1.0,
    naturalMutationRate: 0.05,
    startWithCure: false,
    autoIncreasingLethality: false,
    unlocked: true,
  },
  {
    id: 'virus',
    name: 'Virus',
    description: 'High mutation rate, hard to control',
    difficulty: 'intermediate',
    specialMechanic: 'Frequently gains random symptoms for free',
    baseTransmission: 1,
    baseSeverity: 0,
    baseLethality: 0,
    transmissionCostMultiplier: 0.9,
    symptomCostMultiplier: 1.2,
    abilityCostMultiplier: 1.0,
    naturalMutationRate: 0.25, // Very high!
    startWithCure: false,
    autoIncreasingLethality: false,
    unlocked: true,
  },
  {
    id: 'fungus',
    name: 'Fungus',
    description: 'Very slow spread, requires abilities',
    difficulty: 'intermediate',
    specialMechanic: 'Starts very slow but has Spore Burst ability for instant spread',
    baseTransmission: -2,
    baseSeverity: 0,
    baseLethality: 0,
    transmissionCostMultiplier: 1.3,
    symptomCostMultiplier: 0.9,
    abilityCostMultiplier: 0.8,
    naturalMutationRate: 0.02,
    startWithCure: false,
    autoIncreasingLethality: false,
    unlocked: false,
    unlockRequirement: 'Complete bacteria plague',
  },
  {
    id: 'parasite',
    name: 'Parasite',
    description: 'Very stealthy, hard to detect',
    difficulty: 'intermediate',
    specialMechanic: 'Much harder for cure research to begin',
    baseTransmission: 0,
    baseSeverity: -2,
    baseLethality: 0,
    transmissionCostMultiplier: 1.1,
    symptomCostMultiplier: 0.9,
    abilityCostMultiplier: 1.0,
    naturalMutationRate: 0.03,
    startWithCure: false,
    autoIncreasingLethality: false,
    unlocked: false,
    unlockRequirement: 'Complete virus plague',
  },
  {
    id: 'prion',
    name: 'Prion',
    description: 'Extremely slow and deadly',
    difficulty: 'advanced',
    specialMechanic: 'Very hard to detect and cure, but spreads very slowly',
    baseTransmission: -1,
    baseSeverity: 1,
    baseLethality: 2,
    transmissionCostMultiplier: 1.4,
    symptomCostMultiplier: 1.2,
    abilityCostMultiplier: 0.8,
    naturalMutationRate: 0.01,
    startWithCure: false,
    autoIncreasingLethality: false,
    unlocked: false,
    unlockRequirement: 'Complete parasite plague',
  },
  {
    id: 'nano-virus',
    name: 'Nano-Virus',
    description: 'Cure research starts immediately',
    difficulty: 'advanced',
    specialMechanic: 'Cure begins at game start, race against time',
    baseTransmission: 1,
    baseSeverity: 1,
    baseLethality: 0,
    transmissionCostMultiplier: 0.9,
    symptomCostMultiplier: 0.9,
    abilityCostMultiplier: 1.1,
    naturalMutationRate: 0.08,
    startWithCure: true, // Special!
    autoIncreasingLethality: false,
    unlocked: false,
    unlockRequirement: 'Complete prion plague',
  },
  {
    id: 'bio-weapon',
    name: 'Bio-Weapon',
    description: 'Lethality increases automatically',
    difficulty: 'expert',
    specialMechanic: 'Lethality uncontrollably increases over time',
    baseTransmission: 0,
    baseSeverity: 1,
    baseLethality: 1,
    transmissionCostMultiplier: 1.0,
    symptomCostMultiplier: 1.3,
    abilityCostMultiplier: 1.0,
    naturalMutationRate: 0.1,
    startWithCure: false,
    autoIncreasingLethality: true, // Special!
    unlocked: false,
    unlockRequirement: 'Complete nano-virus plague',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getNodeById(nodeId: string): EvolutionNode | undefined {
  return ALL_EVOLUTION_NODES.find((n) => n.id === nodeId);
}

export function getPlagueTypeById(id: string): PlagueType | undefined {
  return PLAGUE_TYPES.find((p) => p.id === id);
}

export function getNodesByCategory(category: string): EvolutionNode[] {
  return ALL_EVOLUTION_NODES.filter((n) => n.category === category);
}

export function canUnlockNode(
  nodeId: string,
  unlockedNodes: Set<string>
): boolean {
  const node = getNodeById(nodeId);
  if (!node) return false;

  // Check if already unlocked
  if (unlockedNodes.has(nodeId)) return false;

  // Check prerequisites
  if (node.requires) {
    return node.requires.every((req) => unlockedNodes.has(req));
  }

  return true;
}
