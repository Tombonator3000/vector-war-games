/**
 * Research & Construction Handlers
 * Extracted from Index.tsx to reduce file size and improve maintainability
 *
 * This module handles:
 * - Research project initiation
 * - Research progress tracking
 * - City construction progress
 */

import type { Nation } from '@/types/game';
import { RESEARCH_LOOKUP, WARHEAD_YIELD_TO_ID, type ResourceCost } from '@/lib/gameConstants';
import { canAfford, pay } from '@/lib/gameUtils';
import { CityLights } from '@/state/CityLights';

/**
 * Dependencies injected from Index.tsx
 */
export interface ResearchHandlerDependencies {
  PlayerManager: {
    get: () => Nation | null;
  };
  toast: (options: { title: string; description: string }) => void;
  AudioSys: {
    playSFX: (sfx: string) => void;
  };
  log: (message: string, type?: string) => void;
  updateDisplay: () => void;
}

/**
 * Initiates a research project for the player nation
 * @param tier - Either a number (warhead yield) or string (research project ID)
 * @param deps - Injected dependencies
 * @returns true if research was successfully started, false otherwise
 */
export function startResearch(
  tier: number | string,
  deps: ResearchHandlerDependencies
): boolean {
  const player = deps.PlayerManager.get();
  if (!player) return false;

  const projectId = typeof tier === 'number'
    ? WARHEAD_YIELD_TO_ID.get(tier) || `warhead_${tier}`
    : tier;
  const project = RESEARCH_LOOKUP[projectId];

  if (!project) {
    deps.toast({
      title: 'Unknown research',
      description: 'The requested project does not exist.'
    });
    return false;
  }

  if (player.researchQueue) {
    deps.toast({
      title: 'Project already running',
      description: 'You must wait for the current research to complete before starting another.'
    });
    return false;
  }

  player.researched = player.researched || {};

  if (player.researched[project.id]) {
    deps.toast({
      title: 'Already unlocked',
      description: `${project.name} has already been researched.`
    });
    return false;
  }

  if (project.prerequisites && project.prerequisites.some(req => !player.researched?.[req])) {
    deps.toast({
      title: 'Prerequisites missing',
      description: 'Research previous tiers before starting this project.'
    });
    return false;
  }

  if (!canAfford(player, project.cost)) {
    deps.toast({
      title: 'Insufficient resources',
      description: 'You need more production or intel to begin this project.'
    });
    return false;
  }

  pay(player, project.cost);

  player.researchQueue = {
    projectId: project.id,
    turnsRemaining: project.turns,
    totalTurns: project.turns
  };

  deps.AudioSys.playSFX('research');
  deps.log(`Research initiated: ${project.name}`);
  deps.toast({
    title: '🔬 Research Initiated',
    description: `${project.name} will complete in ${project.turns} turn${project.turns > 1 ? 's' : ''}.`,
  });
  deps.updateDisplay();
  return true;
}

/**
 * Advances research progress for a nation during PRODUCTION or RESOLUTION phase
 * @param nation - The nation whose research to advance
 * @param phase - The game phase during which this is called
 * @param deps - Injected dependencies
 */
export function advanceResearch(
  nation: Nation,
  phase: 'PRODUCTION' | 'RESOLUTION',
  deps: ResearchHandlerDependencies
) {
  if (!nation.researchQueue || nation.researchQueue.turnsRemaining <= 0) return;

  nation.researchQueue.turnsRemaining = Math.max(0, nation.researchQueue.turnsRemaining - 1);

  if (nation.researchQueue.turnsRemaining > 0) return;

  const project = RESEARCH_LOOKUP[nation.researchQueue.projectId];
  nation.researchQueue = null;

  if (!project) return;

  nation.researched = nation.researched || {};
  nation.researched[project.id] = true;

  if (project.onComplete) {
    project.onComplete(nation);
  }

  const message = `${nation.name} completes ${project.name}!`;
  deps.log(message, 'success');

  if (nation.isPlayer) {
    deps.AudioSys.playSFX('success');
    deps.toast({
      title: '✅ Research Complete',
      description: `${project.name} breakthrough achieved! New capabilities unlocked.`,
    });
    deps.updateDisplay();
  }
}

/**
 * Advances city construction progress for a nation during PRODUCTION or RESOLUTION phase
 * @param nation - The nation whose city construction to advance
 * @param phase - The game phase during which this is called
 * @param deps - Injected dependencies
 */
export function advanceCityConstruction(
  nation: Nation,
  phase: 'PRODUCTION' | 'RESOLUTION',
  deps: ResearchHandlerDependencies
) {
  if (!nation.cityConstructionQueue || nation.cityConstructionQueue.turnsRemaining <= 0) return;

  nation.cityConstructionQueue.turnsRemaining = Math.max(0, nation.cityConstructionQueue.turnsRemaining - 1);

  if (nation.cityConstructionQueue.turnsRemaining > 0) return;

  // Construction complete
  nation.cityConstructionQueue = null;
  nation.cities = (nation.cities || 1) + 1;

  // Add city lights to the map
  const spread = 6;
  const angle = Math.random() * Math.PI * 2;
  const newLat = nation.lat + Math.sin(angle) * spread;
  const newLon = nation.lon + Math.cos(angle) * spread;
  CityLights.addCity(newLat, newLon, 1.0);

  const message = `${nation.name} completes city #${nation.cities}!`;
  deps.log(message, 'success');

  if (nation.isPlayer) {
    deps.AudioSys.playSFX('success');
    deps.toast({
      title: '🏙️ City Established',
      description: `Urban center ${nation.cities} constructed. Production capacity increased.`,
    });
    deps.updateDisplay();
  }
}
