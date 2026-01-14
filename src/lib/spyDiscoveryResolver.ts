/**
 * Spy Discovery Resolution System
 *
 * Handles the resolution of discovered spy operations, including detection methods,
 * capture mechanics, spy fate determination, and diplomatic consequences.
 * Extracted from spyNetworkUtils.ts for improved modularity and maintainability.
 */

import type { Nation } from '@/types/game';
import type { SpyAgent, SpyMission } from '@/types/spySystem';

/**
 * Spy fate after being caught by counter-intelligence
 */
export type SpyFate = 'executed' | 'imprisoned' | 'exchanged' | 'turned' | 'escaped';

/**
 * Discovery details for a compromised spy mission
 */
export interface DiscoveryDetails {
  /** How the spy or operation was discovered */
  howDiscovered: string;
  /** Method used to capture the spy (if caught) */
  captureMethod?: string;
  /** Final fate of the spy */
  spyFate: SpyFate;
  /** Diplomatic and strategic consequences */
  diplomaticConsequences: string[];
}

/**
 * Possible methods by which spy operations can be discovered
 */
const DISCOVERY_METHODS = [
  'Routine security sweep identified anomalous behavior patterns',
  'Counter-intelligence surveillance detected unauthorized access',
  'Advanced cyber monitoring systems flagged suspicious communications',
  'Local informant reported unusual activities to authorities',
  'Physical security breach triggered automated alarm protocols',
  'Pattern recognition AI identified operational signatures',
];

/**
 * Methods used to capture spies once detected
 */
const CAPTURE_METHODS = [
  'Coordinated security forces executed a precision arrest operation',
  'Counter-intelligence team surrounded and apprehended the agent',
  'Automated security systems locked down the facility, enabling capture',
  'Local law enforcement detained the agent during routine questioning',
  'Military intelligence forces intercepted the agent during exfiltration',
];

/**
 * Generate detailed discovery information for a compromised spy mission
 *
 * @param mission - The spy mission that was discovered
 * @param spy - The spy agent involved in the mission
 * @param target - The nation that discovered the operation
 * @param spyCaught - Whether the spy was captured
 * @param spyEliminated - Whether the spy was killed
 * @returns Detailed discovery information including consequences
 */
export function generateDiscoveryDetails(
  mission: SpyMission,
  spy: SpyAgent,
  target: Nation,
  spyCaught: boolean,
  spyEliminated: boolean
): DiscoveryDetails {
  // Determine spy fate based on outcome
  const spyFate = determineSpyFate(spyCaught, spyEliminated);

  // Generate diplomatic consequences based on mission type and outcome
  const diplomaticConsequences = generateDiplomaticConsequences(
    mission,
    target,
    spyCaught,
    spyEliminated
  );

  return {
    howDiscovered: selectRandom(DISCOVERY_METHODS),
    captureMethod: spyCaught ? selectRandom(CAPTURE_METHODS) : undefined,
    spyFate,
    diplomaticConsequences,
  };
}

/**
 * Determine the fate of a spy after discovery
 *
 * @param spyCaught - Whether the spy was captured
 * @param spyEliminated - Whether the spy was killed
 * @returns The fate of the spy
 */
function determineSpyFate(spyCaught: boolean, spyEliminated: boolean): SpyFate {
  if (spyEliminated) {
    return 'executed';
  }

  if (spyCaught) {
    // 70% chance imprisoned, 30% chance turned into double agent
    const fateRoll = Math.random();
    return fateRoll < 0.7 ? 'imprisoned' : 'turned';
  }

  // Discovered but escaped
  return 'escaped';
}

/**
 * Generate diplomatic consequences based on mission discovery
 *
 * @param mission - The discovered mission
 * @param target - The nation that discovered the operation
 * @param spyCaught - Whether the spy was captured
 * @param spyEliminated - Whether the spy was killed
 * @returns Array of diplomatic consequence descriptions
 */
function generateDiplomaticConsequences(
  mission: SpyMission,
  target: Nation,
  spyCaught: boolean,
  spyEliminated: boolean
): string[] {
  const consequences: string[] = [];

  if (spyCaught || spyEliminated) {
    // Spy captured or killed - severe diplomatic incident
    consequences.push(`${target.name} has formal evidence of espionage activities`);
    consequences.push('International incident will damage diplomatic relations');
    consequences.push(`${target.name} may demand official apology and reparations`);

    if (spyEliminated) {
      consequences.push('Execution of foreign operative will cause severe diplomatic crisis');
    }

    // Additional consequences based on mission type
    if (mission.type === 'assassination') {
      consequences.push('Assassination attempt will be considered an act of war');
      consequences.push('International condemnation expected from all nations');
    } else if (mission.type === 'sabotage-military' || mission.type === 'sabotage-production') {
      consequences.push('Sabotage attempt may justify military retaliation');
    }
  } else {
    // Discovered but spy escaped - less severe but still problematic
    consequences.push(`${target.name} is aware of intelligence operations but lacks conclusive proof`);
    consequences.push('Security measures will be significantly enhanced');
    consequences.push(`Future operations in ${target.name} will face increased risks`);
  }

  return consequences;
}

/**
 * Helper function to select a random element from an array
 */
function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
