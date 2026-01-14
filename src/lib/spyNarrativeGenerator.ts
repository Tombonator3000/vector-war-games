/**
 * Spy Mission Narrative Generator
 *
 * Generates detailed narrative descriptions for spy mission outcomes.
 * Provides contextual storytelling based on mission success, discovery, and capture states.
 * Extracted from spyNetworkUtils.ts for improved modularity and maintainability.
 */

import type { Nation } from '@/types/game';
import type { SpyAgent, SpyMission, SpyMissionType } from '@/types/spySystem';

/**
 * Mission type descriptions for narrative generation
 */
const MISSION_TYPE_DESCRIPTIONS: Record<SpyMissionType, string> = {
  'steal-tech': 'infiltrate research facilities and exfiltrate classified technology',
  'sabotage-production': 'disrupt industrial production capabilities',
  'sabotage-military': 'damage military infrastructure and equipment',
  'rig-election': 'manipulate electoral processes and influence political outcomes',
  'sow-dissent': 'spread disinformation and destabilize diplomatic relationships',
  'assassination': 'eliminate high-value political targets',
  'gather-intel': 'collect strategic intelligence on military and political activities',
  'counter-intel': 'identify and neutralize enemy intelligence operations',
  'propaganda': 'conduct psychological operations to undermine public morale',
  'recruit-asset': 'recruit local informants and establish intelligence networks',
  'cyber-assist': 'compromise cyber defense systems and create vulnerabilities',
  'false-flag': 'conduct operations while implicating another nation',
  'exfiltrate': 'extract high-value assets or intelligence from hostile territory',
};

/**
 * Generate detailed mission narrative with context
 *
 * @param mission - The spy mission that was executed
 * @param spy - The spy agent who conducted the mission
 * @param target - The nation that was targeted
 * @param success - Whether the mission objectives were achieved
 * @param discovered - Whether the mission was detected by counter-intelligence
 * @param spyCaught - Whether the spy was captured
 * @param spyEliminated - Whether the spy was killed
 * @returns Detailed narrative string describing the mission outcome
 */
export function generateMissionNarrative(
  mission: SpyMission,
  spy: SpyAgent,
  target: Nation,
  success: boolean,
  discovered: boolean,
  spyCaught: boolean,
  spyEliminated: boolean
): string {
  const missionDesc = MISSION_TYPE_DESCRIPTIONS[mission.type] || mission.type;

  // Spy eliminated - highest severity outcome
  if (spyEliminated) {
    return selectRandomNarrative([
      `Agent ${spy.name} was intercepted by ${target.name}'s counter-intelligence forces during an operation to ${missionDesc}. After intensive interrogation, the agent was executed as a hostile operative. Our intelligence network in ${target.name} has suffered a significant blow.`,
      `${target.name}'s security apparatus successfully identified and eliminated Agent ${spy.name} while attempting to ${missionDesc}. The agent's cover was thoroughly compromised, leading to immediate termination. This represents a critical loss to our operational capabilities.`,
      `During an attempt to ${missionDesc}, Agent ${spy.name} was caught in a counter-intelligence trap set by ${target.name}. Despite resistance, the agent was neutralized. ${target.name} now possesses intelligence about our operational methods.`,
    ]);
  }

  // Spy caught but alive
  if (spyCaught) {
    return selectRandomNarrative([
      `Agent ${spy.name} has been apprehended by ${target.name}'s security forces while attempting to ${missionDesc}. The agent is currently detained and facing interrogation. Immediate diplomatic consequences are expected.`,
      `${target.name}'s counter-intelligence successfully captured Agent ${spy.name} during the mission to ${missionDesc}. Our operative is now in enemy custody, and sensitive information may be compromised.`,
      `Mission compromised: Agent ${spy.name} was identified and arrested by ${target.name} while conducting operations to ${missionDesc}. The agent's fate remains uncertain, and this incident will have diplomatic ramifications.`,
    ]);
  }

  // Mission discovered but spy escaped
  if (discovered) {
    return selectRandomNarrative([
      `Agent ${spy.name}'s operation to ${missionDesc} was detected by ${target.name}'s security apparatus. However, the agent successfully evaded capture and extracted from the area. The cover identity may be compromised, increasing future operational risks.`,
      `While attempting to ${missionDesc}, Agent ${spy.name} triggered security protocols in ${target.name}. The agent managed to escape pursuit but left evidence of foreign intelligence activity. Future missions will be significantly more difficult.`,
      `${target.name}'s counter-intelligence detected unusual activity during Agent ${spy.name}'s mission to ${missionDesc}. Though the agent avoided capture, the operation was aborted and our presence is now known. Heightened security measures are expected.`,
    ]);
  }

  // Mission successful
  if (success) {
    return selectRandomNarrative([
      `Agent ${spy.name} successfully completed the mission to ${missionDesc} in ${target.name}. The operation was executed flawlessly, with no indication of foreign involvement. Intelligence has been secured and objectives achieved without compromising operational security.`,
      `Mission accomplished: Agent ${spy.name} has successfully infiltrated ${target.name} and completed all objectives related to ${missionDesc}. The agent maintained cover throughout the operation and exfiltrated cleanly. ${target.name} remains unaware of our intelligence activities.`,
      `Agent ${spy.name} reports complete success on the mission to ${missionDesc} within ${target.name}. All strategic objectives were met, valuable intelligence gathered, and the operation concluded without detection. Our network's effectiveness remains intact.`,
    ]);
  }

  // Failed but undetected
  return selectRandomNarrative([
    `Agent ${spy.name} attempted to ${missionDesc} in ${target.name}, but mission objectives could not be achieved. Unexpected security measures and operational challenges forced an early abort. However, the agent successfully maintained cover and extracted without detection.`,
    `The mission to ${missionDesc} in ${target.name} encountered insurmountable obstacles. Agent ${spy.name} was unable to complete primary objectives due to enhanced security protocols, but managed to withdraw without compromising the intelligence network.`,
    `Agent ${spy.name}'s operation to ${missionDesc} in ${target.name} did not achieve the desired outcome. Technical difficulties and unforeseen complications prevented mission success. Despite the setback, operational security was maintained and the agent remains viable for future assignments.`,
  ]);
}

/**
 * Helper function to select a random narrative from an array
 */
function selectRandomNarrative(narratives: string[]): string {
  return narratives[Math.floor(Math.random() * narratives.length)];
}
