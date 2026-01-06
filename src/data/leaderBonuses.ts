/**
 * Leader-Specific Passive Bonuses (FASE 2.1)
 * Each leader gets 2 unique passive bonuses for strategic diversity
 *
 * Extracted from Index.tsx to support modularization
 */

import type { Nation } from '@/types/game';
import { clampDefenseValue } from '@/lib/nuclearDamage';

export interface LeaderBonus {
  name: string;
  description: string;
  effect: (nation: Nation) => void;
}

export const leaderBonuses: Record<string, LeaderBonus[]> = {
  // Historical Cuban Crisis Leaders
  'John F. Kennedy': [
    {
      name: '📜 Diplomatic Finesse',
      description: '+15% to peace treaty acceptance, +1 DIP per turn',
      effect: (nation) => {
        // @ts-expect-error - Legacy diplomacy influence system
        nation.diplomaticInfluence = nation.diplomaticInfluence || { current: 50, capacity: 200, generation: 3 };
        // @ts-expect-error - Legacy diplomacy influence system
        nation.diplomaticInfluence.generation = (nation.diplomaticInfluence.generation || 3) + 1;
      }
    },
    {
      name: '🎯 Precision Warfare',
      description: '+10% missile accuracy, -15% collateral damage',
      effect: (nation) => {
        nation.enemyMissileAccuracyReduction = (nation.enemyMissileAccuracyReduction || 0) - 0.10; // Enemies have 10% less accuracy against JFK
      }
    }
  ],
  'Nikita Khrushchev': [
    {
      name: '⚔️ Iron Fist',
      description: '-10% missile costs, +15% military intimidation',
      effect: (nation) => {
        nation.buildCostReduction = (nation.buildCostReduction || 0) + 0.10;
      }
    },
    {
      name: '🏭 Soviet Industry',
      description: '+15% production per turn',
      effect: (nation) => {
        nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.15;
      }
    }
  ],
  'Fidel Castro': [
    {
      name: '🔥 Revolutionary Fervor',
      description: '+20% population morale, immunity to culture bombs',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 20);
      }
    },
    {
      name: '🛡️ Guerrilla Defense',
      description: '+25% defense effectiveness',
      effect: (nation) => {
        const currentDefense = nation.defense ?? 0;
        nation.defense = clampDefenseValue(Math.floor(currentDefense * 1.25));
      }
    }
  ],

  // Lovecraftian Great Old Ones Leaders
  'Cthulhu': [
    {
      name: '🌊 Deep Sea Dominion',
      description: '+20% summoning power, -15% summoning backlash',
      effect: (nation) => {
        // Applied to Great Old Ones state in specialized handler
        nation.morale = Math.min(100, nation.morale + 10); // Cultists more devoted
      }
    },
    {
      name: '😱 Madness Aura',
      description: '+30% sanity harvest from terror',
      effect: (nation) => {
        nation.intel = Math.floor(nation.intel * 1.1); // Bonus intel from insanity
      }
    }
  ],
  'Azathoth': [
    {
      name: '🌀 Chaotic Flux',
      description: 'Random bonus each turn (10-30% to any stat)',
      effect: (nation) => {
        // Applied dynamically each turn - placeholder marker
        nation.morale = Math.min(100, nation.morale + 5);
      }
    },
    {
      name: '🎲 Unpredictable',
      description: '-20% enemy prediction accuracy',
      effect: (nation) => {
        nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.20;
      }
    }
  ],
  'Nyarlathotep': [
    {
      name: '🎭 Master of Masks',
      description: '+40% infiltration speed, -25% detection',
      effect: (nation) => {
        nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.25;
      }
    },
    {
      name: '🗣️ Whispering Shadows',
      description: '+50% memetic warfare effectiveness',
      effect: (nation) => {
        nation.memeWaveEffectiveness = (nation.memeWaveEffectiveness || 1.0) + 0.50;
      }
    }
  ],
  'Hastur': [
    {
      name: '🌫️ Yellow Sign',
      description: '+25% corruption spread, +15% willing conversions',
      effect: (nation) => {
        nation.stolenPopConversionRate = (nation.stolenPopConversionRate || 1.0) + 0.15;
      }
    },
    {
      name: '🤐 Unspeakable Presence',
      description: '-30% veil damage from operations',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 5);
      }
    }
  ],
  'Shub-Niggurath': [
    {
      name: '🐐 Spawn of the Black Goat',
      description: '+30% entity spawning rate, +20% entity strength',
      effect: (nation) => {
        nation.unitAttackBonus = (nation.unitAttackBonus || 0) + 0.20;
      }
    },
    {
      name: '🌿 Primal Growth',
      description: '+20% population growth in corrupted areas',
      effect: (nation) => {
        nation.immigrationBonus = (nation.immigrationBonus || 0) + 0.20;
      }
    }
  ],
  'Yog-Sothoth': [
    {
      name: '🔮 The Gate and the Key',
      description: '+30% research speed, auto-reveal enemy research',
      effect: (nation) => {
        nation.autoRevealEnemyResearch = true;
      }
    },
    {
      name: '⏳ Temporal Manipulation',
      description: '+1 action per turn',
      effect: (nation) => {
        // Applied during turn start
      }
    }
  ],

  // Parody Leaders
  'Ronnie Raygun': [
    {
      name: '🎬 Star Wars Program',
      description: '+30% ABM defense effectiveness',
      effect: (nation) => {
        const currentDefense = nation.defense ?? 0;
        nation.defense = clampDefenseValue(Math.floor(currentDefense * 1.30));
      }
    },
    {
      name: '💰 Trickle Down Economics',
      description: '+20% production from high morale',
      effect: (nation) => {
        if (nation.morale > 70) {
          nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.20;
        }
      }
    }
  ],
  'Tricky Dick': [
    {
      name: '🕵️ Watergate Skills',
      description: '+35% intelligence gathering, +20% cover ops duration',
      effect: (nation) => {
        nation.intel = Math.floor(nation.intel * 1.15);
      }
    },
    {
      name: '🤝 Détente Master',
      description: '+20% to non-aggression pact acceptance',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 10);
      }
    }
  ],
  'Jimi Farmer': [
    {
      name: '🌾 Agricultural Surplus',
      description: '+25% population capacity, faster recovery',
      effect: (nation) => {
        nation.immigrationBonus = (nation.immigrationBonus || 0) + 0.25;
      }
    },
    {
      name: '☮️ Peace Dividend',
      description: '+15% production during peacetime',
      effect: (nation) => {
        nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.10;
      }
    }
  ],
  'E. Musk Rat': [
    {
      name: '🚀 SpaceX Advantage',
      description: '+50% satellite deployment speed, +2 orbital slots',
      effect: (nation) => {
        nation.maxSatellites = (nation.maxSatellites || 3) + 2;
      }
    },
    {
      name: '🤖 AI Warfare',
      description: '+40% cyber offense, +25% cyber defense',
      effect: (nation) => {
        if (nation.cyber) {
          nation.cyber.offense = Math.floor(nation.cyber.offense * 1.40);
          nation.cyber.defense = Math.floor(nation.cyber.defense * 1.25);
        }
      }
    }
  ],
  'Donnie Trumpf': [
    {
      name: '🏗️ The Wall',
      description: 'Borders always closed, +30% immigration control',
      effect: (nation) => {
        nation.bordersClosedTurns = 999; // Permanently closed
      }
    },
    {
      name: '💬 Twitter Diplomacy',
      description: '+25% culture bomb effectiveness, -10% diplomatic costs',
      effect: (nation) => {
        nation.cultureBombCostReduction = (nation.cultureBombCostReduction || 0) + 0.25;
      }
    }
  ],
  'Atom Hus-Bomb': [
    {
      name: '☢️ Nuclear Zealot',
      description: '+20% warhead yield, -20% nuclear winter impact on self',
      effect: (nation) => {
        // Warhead bonus applied during launch calculations
        nation.morale = Math.min(100, nation.morale + 10);
      }
    },
    {
      name: '⚡ First Strike Doctrine',
      description: 'Missiles launch 25% faster',
      effect: (nation) => {
        nation.production = Math.floor(nation.production * 1.10);
      }
    }
  ],
  'Krazy Re-Entry': [
    {
      name: '🎪 Chaos Theory',
      description: 'Random events 30% more likely, +20% to all randomness',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 15);
      }
    },
    {
      name: '🌪️ Unpredictable Madness',
      description: 'AI cannot accurately predict actions',
      effect: (nation) => {
        nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.30;
      }
    }
  ],
  'Odd\'n Wild Card': [
    {
      name: '🃏 Trickster\'s Gambit',
      description: '+30% false intel generation, +25% deception success',
      effect: (nation) => {
        nation.memeWaveEffectiveness = (nation.memeWaveEffectiveness || 1.0) + 0.30;
      }
    },
    {
      name: '🎰 High Stakes',
      description: 'Double or nothing: +50% gains OR -25% losses randomly',
      effect: (nation) => {
        if (Math.random() > 0.5) {
          nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.25;
        }
      }
    }
  ],
  'Oil-Stain Lint-Off': [
    {
      name: '🛢️ Petro-State',
      description: '+40% uranium generation, +20% production',
      effect: (nation) => {
        nation.uraniumPerTurn = (nation.uraniumPerTurn || 2) + 1;
        nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.20;
      }
    },
    {
      name: '💼 Oligarch Network',
      description: '+25% intel from economic espionage',
      effect: (nation) => {
        nation.intel = Math.floor(nation.intel * 1.15);
      }
    }
  ],
  'Ruin Annihilator': [
    {
      name: '💀 Scorched Earth',
      description: '+35% damage to all targets, +20% to radiation zones',
      effect: (nation) => {
        nation.unitAttackBonus = (nation.unitAttackBonus || 0) + 0.35;
      }
    },
    {
      name: '🔥 Apocalypse Doctrine',
      description: 'Immune to morale penalties, thrives in chaos',
      effect: (nation) => {
        nation.morale = 100; // Always maximum morale
      }
    }
  ]
};
