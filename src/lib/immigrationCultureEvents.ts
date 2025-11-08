/**
 * IMMIGRATION & CULTURE EVENTS
 * Random events that create dynamic gameplay
 */

import type { Nation } from '../types/game';
import { PopSystemManager } from './popSystemManager';
import type { SeededRandom } from './seededRandom';

export interface ImmigrationEvent {
  id: string;
  title: string;
  description: string;
  trigger: (nation: Nation, rng: SeededRandom) => boolean;
  choices: EventChoice[];
}

export interface EventChoice {
  text: string;
  effects: {
    population?: number;
    instability?: number;
    diplomaticReputation?: number;
    intel?: number;
    production?: number;
    culturalPower?: number;
    loyalty?: number;
    happiness?: number;
  };
  execute?: (nation: Nation) => void;
}

export const IMMIGRATION_CULTURE_EVENTS: ImmigrationEvent[] = [
  {
    id: 'refugee_crisis',
    title: 'Refugee Crisis at Border',
    description: 'A devastating war in a neighboring region has created a refugee crisis. 5 million people seek asylum at your borders.',
    trigger: (nation, rng) => {
      const hasOpenPolicy = nation.currentImmigrationPolicy !== 'closed_borders';
      const isStable = (nation.instability || 0) < 50;
      return hasOpenPolicy && isStable && rng.next() < 0.08;
    },
    choices: [
      {
        text: 'Accept all refugees (Humanitarian)',
        effects: {
          population: 5,
          instability: 15,
          diplomaticReputation: 20,
          production: -10,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            const refugeePop = PopSystemManager.createImmigrantPop(
              5,
              'Refugees',
              'Mixed',
              'low'
            );
            refugeePop.happiness = 50; // Traumatized but grateful
            nation.popGroups.push(refugeePop);
          }
        },
      },
      {
        text: 'Accept selectively (skilled only)',
        effects: {
          population: 2,
          instability: 5,
          diplomaticReputation: 5,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            const refugeePop = PopSystemManager.createImmigrantPop(
              2,
              'Refugees',
              'Mixed',
              'medium'
            );
            nation.popGroups.push(refugeePop);
          }
        },
      },
      {
        text: 'Close borders (Reject all)',
        effects: {
          instability: -5,
          diplomaticReputation: -25,
        },
      },
    ],
  },

  {
    id: 'brain_drain_wave',
    title: 'Talent Exodus Warning',
    description: 'Intelligence reports that a rival nation is offering lucrative incentives to your top scientists and engineers.',
    trigger: (nation, rng) => {
      const population = nation.popGroups
        ? PopSystemManager.getTotalPopulation(nation.popGroups)
        : nation.population;
      return population > 50 && rng.next() < 0.06;
    },
    choices: [
      {
        text: 'Counter-offer with incentives',
        effects: {
          production: -20,
          loyalty: 10,
          population: 0,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            PopSystemManager.boostPopLoyalty(nation.popGroups, 10);
          }
        },
      },
      {
        text: 'Let them leave',
        effects: {
          population: -3,
          intel: -10,
          instability: 5,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            // Remove high-skill pops
            const highSkillPops = nation.popGroups.filter(p => p.skills === 'high');
            if (highSkillPops.length > 0) {
              const targetPop = highSkillPops[0];
              targetPop.size = Math.max(0, targetPop.size - 3);
            }
          }
        },
      },
      {
        text: 'Restrict emigration (Authoritarian)',
        effects: {
          instability: 20,
          diplomaticReputation: -15,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            PopSystemManager.reducePopHappiness(nation.popGroups, 15);
          }
        },
      },
    ],
  },

  {
    id: 'cultural_renaissance',
    title: 'Cultural Golden Age',
    description: 'Your nation experiences an unexpected cultural renaissance! Artists, writers, and thinkers are flourishing.',
    trigger: (nation, rng) => {
      const culturalPower = nation.culturalPower || 0;
      const instability = nation.instability || 0;
      return culturalPower > 70 && instability < 20 && rng.next() < 0.05;
    },
    choices: [
      {
        text: 'Invest heavily in the arts',
        effects: {
          production: -30,
          culturalPower: 25,
          happiness: 15,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            for (const pop of nation.popGroups) {
              pop.happiness = Math.min(100, pop.happiness + 15);
            }
          }
        },
      },
      {
        text: 'Capitalize commercially',
        effects: {
          production: 20,
          culturalPower: 10,
        },
      },
      {
        text: 'Export culture globally',
        effects: {
          culturalPower: 20,
          diplomaticReputation: 15,
        },
      },
    ],
  },

  {
    id: 'cultural_backlash',
    title: 'Cultural Identity Backlash',
    description: 'Rapid demographic changes have triggered a backlash from traditionalists. Protests demanding stricter immigration controls are growing.',
    trigger: (nation, rng) => {
      if (!nation.popGroups) return false;
      const avgAssimilation = PopSystemManager.getAverageAssimilation(nation.popGroups);
      return avgAssimilation < 60 && nation.currentImmigrationPolicy === 'open_borders' && rng.next() < 0.1;
    },
    choices: [
      {
        text: 'Switch to selective immigration',
        effects: {
          instability: -10,
          diplomaticReputation: -5,
        },
        execute: (nation) => {
          nation.currentImmigrationPolicy = 'selective';
        },
      },
      {
        text: 'Double down on integration programs',
        effects: {
          production: -25,
          instability: -5,
        },
        execute: (nation) => {
          if (nation.assimilationRate) {
            nation.assimilationRate += 5;
          }
        },
      },
      {
        text: 'Ignore the protests',
        effects: {
          instability: 15,
          happiness: -10,
        },
      },
    ],
  },

  {
    id: 'mass_defection',
    title: 'Mass Defection Opportunity',
    description: 'Political instability in a neighboring nation has created an opportunity. Thousands of their citizens want to defect to your nation.',
    trigger: (nation, rng) => {
      const hasGoodReputation = (nation.diplomaticReputation?.globalScore || 0) > 50;
      return hasGoodReputation && rng.next() < 0.07;
    },
    choices: [
      {
        text: 'Welcome the defectors',
        effects: {
          population: 4,
          instability: 8,
          intel: 10,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            const defectorPop = PopSystemManager.createImmigrantPop(
              4,
              'Defectors',
              'Mixed',
              'high'
            );
            defectorPop.loyalty = 70; // High initial loyalty
            defectorPop.happiness = 80;
            nation.popGroups.push(defectorPop);
          }
        },
      },
      {
        text: 'Screen carefully before accepting',
        effects: {
          population: 2,
          instability: 3,
          intel: 15,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            const defectorPop = PopSystemManager.createImmigrantPop(
              2,
              'Defectors',
              'Mixed',
              'high'
            );
            defectorPop.loyalty = 80;
            nation.popGroups.push(defectorPop);
          }
        },
      },
      {
        text: 'Turn them away (maintain neutrality)',
        effects: {
          diplomaticReputation: -10,
        },
      },
    ],
  },

  {
    id: 'cultural_wonder_tourism',
    title: 'Tourism Boom',
    description: 'Your cultural wonders are attracting unprecedented international attention. Immigration applications have surged.',
    trigger: (nation, rng) => {
      const hasWonders = (nation.culturalWonders?.filter(w => w.completed) || []).length > 0;
      return hasWonders && rng.next() < 0.06;
    },
    choices: [
      {
        text: 'Open immigration to capitalize',
        effects: {
          population: 6,
          culturalPower: 10,
          instability: 10,
        },
        execute: (nation) => {
          if (nation.popGroups) {
            const touristPop = PopSystemManager.createImmigrantPop(
              6,
              'Cultural Migrants',
              'Mixed',
              'medium'
            );
            touristPop.happiness = 75;
            nation.popGroups.push(touristPop);
          }
        },
      },
      {
        text: 'Maintain current policy',
        effects: {
          culturalPower: 5,
        },
      },
      {
        text: 'Focus on short-term tourism only',
        effects: {
          production: 15,
          culturalPower: 3,
        },
      },
    ],
  },
];

/**
 * Check if any events should trigger for a nation this turn
 */
export function checkForEvents(nation: Nation, rng: SeededRandom): ImmigrationEvent | null {
  // Only check events for nations with non-closed borders (unless event specifically designed for closed)
  const eligibleEvents = IMMIGRATION_CULTURE_EVENTS.filter(event =>
    event.trigger(nation, rng)
  );

  if (eligibleEvents.length === 0) return null;

  // Return random eligible event
  const index = rng.nextInt(0, eligibleEvents.length - 1);
  return eligibleEvents[index];
}

/**
 * Execute an event choice
 */
export function executeEventChoice(
  nation: Nation,
  event: ImmigrationEvent,
  choiceIndex: number
): void {
  if (choiceIndex < 0 || choiceIndex >= event.choices.length) return;

  const choice = event.choices[choiceIndex];

  // Apply numeric effects
  if (choice.effects.population) {
    nation.population += choice.effects.population;
  }
  if (choice.effects.instability) {
    nation.instability = Math.max(0, (nation.instability || 0) + choice.effects.instability);
  }
  if (choice.effects.intel) {
    nation.intel = Math.max(0, nation.intel + choice.effects.intel);
  }
  if (choice.effects.production) {
    nation.production = Math.max(0, nation.production + choice.effects.production);
  }
  if (choice.effects.culturalPower) {
    nation.culturalPower = Math.max(0, (nation.culturalPower || 0) + choice.effects.culturalPower);
  }

  // Execute custom logic if defined
  if (choice.execute) {
    choice.execute(nation);
  }
}
