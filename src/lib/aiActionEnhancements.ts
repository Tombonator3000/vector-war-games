/**
 * AI Action Enhancements
 * Adds cyber warfare, conventional warfare, immigration, and NGO operations to AI decision making
 */

import type { Nation } from '../types/game';
import { aiNGOAction, aiNGOInfrastructureUpgrade } from './aiNGOStrategies';

interface ConventionalTerritory {
  id: string;
  name?: string;
  controllingNationId?: string | null;
  neighbors?: string[];
  armies?: number;
  strategicValue?: number;
  productionBonus?: number;
  instabilityModifier?: number;
  contestedBy?: string[];
}

function getTerritoryMap(hook: any): Record<string, ConventionalTerritory> {
  const raw = hook?.territories;
  if (raw && typeof raw === 'object') {
    return raw as Record<string, ConventionalTerritory>;
  }
  return {};
}

function getNationTerritories(
  hook: any,
  nationId: string,
  territoryMap: Record<string, ConventionalTerritory>
): ConventionalTerritory[] {
  if (typeof hook?.getTerritoriesForNation === 'function') {
    const territories = hook.getTerritoriesForNation(nationId) as ConventionalTerritory[];
    if (Array.isArray(territories)) {
      return territories;
    }
  }

  return Object.values(territoryMap).filter(
    (territory) => territory?.controllingNationId === nationId
  );
}

function getDeployableTerritories(
  hook: any,
  nationId: string,
  territoryMap: Record<string, ConventionalTerritory>
): ConventionalTerritory[] {
  if (typeof hook?.getDeployableTerritories === 'function') {
    const territories = hook.getDeployableTerritories(nationId) as ConventionalTerritory[];
    if (Array.isArray(territories) && territories.length > 0) {
      return territories;
    }
  }

  return getNationTerritories(hook, nationId, territoryMap);
}

function scoreDeploymentTarget(
  territory: ConventionalTerritory,
  nationId: string,
  territoryMap: Record<string, ConventionalTerritory>
): number {
  const armies = territory.armies ?? 0;
  const production = territory.productionBonus ?? 0;
  const strategic = territory.strategicValue ?? 0;
  const contested = territory.contestedBy ?? [];

  const hasEnemyNeighbor = (territory.neighbors ?? []).some((neighborId) => {
    const neighbor = territoryMap[neighborId];
    return neighbor?.controllingNationId && neighbor.controllingNationId !== nationId;
  });

  let score = 0;
  if (hasEnemyNeighbor) {
    score += 40;
  }
  score += strategic * 10 + production * 5;
  score += contested.includes(nationId) ? 15 : 0;
  // Prefer reinforcing weaker territories (fewer armies -> higher priority)
  score += Math.max(0, 10 - armies);

  return score;
}

function chooseBorderConflict(
  nationId: string,
  territoryMap: Record<string, ConventionalTerritory>,
  preferredEnemies: Set<string>
): {
  from: ConventionalTerritory;
  to: ConventionalTerritory;
  armies: number;
} | null {
  const nationTerritories = Object.values(territoryMap).filter(
    (territory) => territory?.controllingNationId === nationId && (territory.armies ?? 0) > 1
  );

  let bestOpportunity: {
    from: ConventionalTerritory;
    to: ConventionalTerritory;
    armies: number;
    score: number;
  } | null = null;

  for (const from of nationTerritories) {
    const neighbors = (from.neighbors ?? [])
      .map((id) => territoryMap[id])
      .filter(
        (neighbor): neighbor is ConventionalTerritory =>
          Boolean(neighbor?.controllingNationId && neighbor.controllingNationId !== nationId)
      );

    for (const target of neighbors) {
      const availableArmies = Math.max(1, (from.armies ?? 0) - 1);
      if (availableArmies <= 0) continue;

      const enemyArmies = Math.max(1, target.armies ?? 0);
      const powerRatio = availableArmies / enemyArmies;
      const strategicValue = (target.strategicValue ?? 0) * 10 + (target.productionBonus ?? 0) * 6;
      const preferredBonus = preferredEnemies.has(target.controllingNationId ?? '') ? 25 : 0;
      const score = powerRatio * 30 + strategicValue + preferredBonus;

      const armiesToCommit = Math.max(1, Math.min(availableArmies, Math.round(availableArmies * 0.6)));

      if (!bestOpportunity || score > bestOpportunity.score) {
        bestOpportunity = { from, to: target, armies: armiesToCommit, score };
      }
    }
  }

  if (!bestOpportunity) return null;

  return {
    from: bestOpportunity.from,
    to: bestOpportunity.to,
    armies: bestOpportunity.armies,
  };
}

/**
 * Check if a nation has open borders for immigration
 */
function hasOpenBorders(nation: Nation): boolean {
  return !nation.bordersClosedTurns || nation.bordersClosedTurns <= 0;
}

/**
 * AI Immigration Logic
 * AI nations will use immigration to steal population from rivals
 */
export function aiImmigrationAction(
  aiNation: Nation,
  nations: Nation[],
  costs: Record<string, any>,
  log: (message: string) => void
): boolean {
  // Only attempt immigration if AI has enough intel/production
  if (aiNation.intel < 10) return false;

  // Find potential targets with high population and open borders
  const validTargets = nations.filter(
    (n) =>
      n.id !== aiNation.id &&
      !n.eliminated &&
      n.population > 10 &&
      hasOpenBorders(n) &&
      !aiNation.treaties?.[n.id]?.truceTurns
  );

  if (validTargets.length === 0) return false;

  // Sort by population (steal from richest)
  const target = validTargets.sort((a, b) => b.population - a.population)[0];

  // Determine immigration type based on AI personality and resources
  const personality = aiNation.aiPersonality || 'balanced';
  let actionType: string | null = null;

  // Aggressive AI prefers mass immigration
  if (personality === 'aggressive') {
    if (aiNation.production >= (costs.immigration_mass?.production || 30)) {
      actionType = 'mass';
    }
  }
  // Trickster/Intelligence-focused AI prefers brain drain
  else if (personality === 'trickster') {
    if (aiNation.intel >= (costs.immigration_brain?.intel || 15)) {
      actionType = 'brain';
    }
  }
  // Defensive/balanced AI prefers skilled immigration
  else if (personality === 'defensive' || personality === 'balanced') {
    if (aiNation.intel >= (costs.immigration_skilled?.intel || 10)) {
      actionType = 'skilled';
    }
  }

  // Execute immigration if valid
  if (actionType) {
    const result = executeAIImmigration(aiNation, target, actionType, costs, log);
    return result;
  }

  return false;
}

/**
 * Execute AI immigration action
 */
function executeAIImmigration(
  from: Nation,
  target: Nation,
  type: string,
  costs: Record<string, any>,
  log: (message: string) => void
): boolean {
  switch (type) {
    case 'skilled':
      if (from.intel < (costs.immigration_skilled?.intel || 10)) return false;
      {
        const amount = Math.max(1, Math.floor(target.population * 0.05));
        if (amount <= 0) return false;
        target.population = Math.max(0, target.population - amount);
        from.population += amount;
        target.instability = (target.instability || 0) + 15;
        from.defense = (from.defense || 0) + 1;
        from.intel -= costs.immigration_skilled?.intel || 10;
        from.migrantsThisTurn = (from.migrantsThisTurn || 0) + amount;
        from.migrantsTotal = (from.migrantsTotal || 0) + amount;
        log(`${from.name} recruits skilled immigrants from ${target.name} (+${amount}M)`);
        return true;
      }

    case 'mass':
      if (from.production < (costs.immigration_mass?.production || 30)) return false;
      {
        const amount = Math.max(1, Math.floor(target.population * 0.1));
        if (amount <= 0) return false;
        target.population = Math.max(0, target.population - amount);
        from.population += amount;
        const instability = 25 + Math.floor(Math.random() * 11);
        target.instability = (target.instability || 0) + instability;
        from.production -= costs.immigration_mass?.production || 30;
        from.migrantsThisTurn = (from.migrantsThisTurn || 0) + amount;
        from.migrantsTotal = (from.migrantsTotal || 0) + amount;
        log(`${from.name} initiates mass immigration from ${target.name} (+${amount}M)`);
        return true;
      }

    case 'brain':
      if (from.intel < (costs.immigration_brain?.intel || 15)) return false;
      {
        const amount = Math.max(1, Math.floor(target.population * 0.03));
        if (amount <= 0) return false;
        target.population = Math.max(0, target.population - amount);
        from.population += amount;
        target.instability = (target.instability || 0) + 10;
        from.intel -= costs.immigration_brain?.intel || 15;
        from.production += costs.immigration_brain?.productionGain || 2;
        from.migrantsThisTurn = (from.migrantsThisTurn || 0) + amount;
        from.migrantsTotal = (from.migrantsTotal || 0) + amount;
        log(`${from.name} executes brain drain on ${target.name} (+${amount}M)`);
        return true;
      }

    case 'refugee':
      if (
        from.production < (costs.immigration_refugee?.production || 20) ||
        (from.instability || 0) < 50
      )
        return false;
      {
        const amount = Math.max(1, Math.floor(target.population * 0.15));
        if (amount <= 0) return false;
        target.population = Math.max(0, target.population - amount);
        from.population += amount;
        target.instability = (target.instability || 0) + 40;
        from.instability = Math.max(0, (from.instability || 0) - 20);
        from.production -= costs.immigration_refugee?.production || 20;
        from.migrantsThisTurn = (from.migrantsThisTurn || 0) + amount;
        from.migrantsTotal = (from.migrantsTotal || 0) + amount;
        log(`${from.name} accepts refugees from ${target.name} (+${amount}M)`);
        return true;
      }
  }

  return false;
}

/**
 * AI Conventional Warfare Logic
 * AI will train units and engage in border conflicts
 */
export function aiConventionalWarfareAction(
  aiNation: Nation,
  nations: Nation[],
  conventionalWarfareHook: any,
  turn: number,
  log: (message: string) => void
): boolean {
  if (!conventionalWarfareHook) return false;

  const { templates, trainUnit, deployUnit, resolveBorderConflict, getUnitsForNation } =
    conventionalWarfareHook;

  const territoryMap = getTerritoryMap(conventionalWarfareHook);

  // Decision: Should we train a unit?
  const personality = aiNation.ai || 'balanced';
  const shouldTrainUnit = Math.random() < (personality === 'aggressive' ? 0.4 : 0.25);

  if (shouldTrainUnit && aiNation.production >= 12) {
    // Determine which unit type to train based on personality
    let templateId = 'armored_corps'; // Default

    if (personality === 'aggressive') {
      // Aggressive AI prefers air superiority
      if (aiNation.researched?.['conventional_expeditionary_airframes'] && Math.random() < 0.5) {
        templateId = 'air_wing';
      }
    } else if (personality === 'defensive') {
      // Defensive AI prefers naval control
      if (aiNation.researched?.['conventional_carrier_battlegroups'] && Math.random() < 0.4) {
        templateId = 'carrier_fleet';
      }
    }

    // Train the unit
    const result = trainUnit(aiNation.id, templateId);
    if (result.success) {
      log(`${aiNation.name} trains ${templates[templateId]?.name || 'military unit'}`);
      return true;
    }
  }

  // Decision: Should we deploy units?
  const units = getUnitsForNation(aiNation.id);
  const reserveUnits = units.filter((u: any) => u.status === 'reserve');

  if (reserveUnits.length > 0 && Math.random() < 0.3) {
    const unit = reserveUnits[0];
    const deployableTerritories = getDeployableTerritories(
      conventionalWarfareHook,
      aiNation.id,
      territoryMap
    );

    if (deployableTerritories.length > 0 && typeof deployUnit === 'function') {
      const scored = deployableTerritories
        .map((territory) => ({
          territory,
          score: scoreDeploymentTarget(territory, aiNation.id, territoryMap),
        }))
        .sort((a, b) => b.score - a.score);

      const chosen = scored[0]?.territory;

      if (chosen) {
        const result = deployUnit(unit.id, chosen.id);
        if (!result || result.success !== false) {
          const template = templates?.[unit.templateId];
          const unitName = unit.label || template?.name || 'military unit';
          log(`${aiNation.name} deploys ${unitName} to ${chosen.name || chosen.id}`);
          return true;
        }
      }
    }
  }

  // Decision: Should we initiate a border conflict?
  const shouldAttack =
    Math.random() < (personality === 'aggressive' ? 0.35 : personality === 'balanced' ? 0.15 : 0.05);

  if (shouldAttack && turn > 15) {
    // Find potential conflict zones
    const enemies = nations.filter(
      (n) =>
        n.id !== aiNation.id &&
        !n.eliminated &&
        !aiNation.treaties?.[n.id]?.truceTurns &&
        (aiNation.threats?.[n.id] || 0) > 30
    );

    if (enemies.length > 0 && typeof resolveBorderConflict === 'function') {
      const preferredEnemies = new Set(enemies.map((enemy) => enemy.id));
      const opportunity = chooseBorderConflict(aiNation.id, territoryMap, preferredEnemies);

      if (opportunity) {
        const result = resolveBorderConflict(
          opportunity.from.id,
          opportunity.to.id,
          opportunity.armies,
        );

        if (result && result.success === false) {
          return false;
        }

        log(
          `${aiNation.name} launches border offensive from ${
            opportunity.from.name || opportunity.from.id
          } into ${opportunity.to.name || opportunity.to.id}`,
        );
        return true;
      }
    }
  }

  return false;
}

/**
 * AI Cyber Warfare Logic
 * Enhanced cyber warfare decisions for AI
 */
export function aiCyberWarfareAction(
  aiNation: Nation,
  nations: Nation[],
  cyberWarfareHook: any,
  log: (message: string) => void
): boolean {
  if (!cyberWarfareHook || !aiNation.cyber) return false;

  const { launchCyberAttack } = cyberWarfareHook;

  // Only attack if readiness is high enough
  if (aiNation.cyber.readiness < 30) return false;

  // Find potential targets
  const enemies = nations.filter(
    (n) =>
      n.id !== aiNation.id &&
      !n.eliminated &&
      n.cyber &&
      !aiNation.treaties?.[n.id]?.truceTurns &&
      (aiNation.threats?.[n.id] || 0) > 20
  );

  if (enemies.length === 0) return false;

  // Sort by threat level
  const target = enemies.sort((a, b) => {
    const aThreat = aiNation.threats?.[a.id] || 0;
    const bThreat = aiNation.threats?.[b.id] || 0;
    return bThreat - aThreat;
  })[0];

  // Determine attack type based on personality
  const personality = aiNation.ai || 'balanced';
  let attackType = 'infrastructure';

  if (personality === 'aggressive') {
    attackType = 'military';
  } else if (personality === 'trickster') {
    attackType = Math.random() < 0.5 ? 'intelligence' : 'economic';
  } else if (personality === 'defensive') {
    attackType = 'intelligence';
  }

  // Launch the attack
  try {
    const result = launchCyberAttack(aiNation.id, target.id, attackType);
    if (result.success) {
      log(`${aiNation.name} launches ${attackType} cyber attack on ${target.name}`);
      return true;
    }
  } catch (e) {
    // Cyber warfare hook might not support this interface
    return false;
  }

  return false;
}

/**
 * Main AI action enhancement coordinator
 * Call this during AI turn to give AI access to all actions
 */
export function enhancedAIActions(
  aiNation: Nation,
  nations: Nation[],
  turn: number,
  costs: Record<string, any>,
  conventionalWarfareHook: any,
  cyberWarfareHook: any,
  log: (message: string) => void
): boolean {
  const personality = aiNation.ai || 'balanced';

  // Random decision tree for action selection
  const r = Math.random();

  // 1. NGO Operations (12-30% chance based on personality) - STRATEGIC WEAPON
  const ngoChance = personality === 'aggressive' ? 0.30 : personality === 'trickster' ? 0.25 : 0.12;
  if (r < ngoChance) {
    if (aiNGOAction(aiNation, nations, turn, log)) {
      return true;
    }
  }

  // 2. Cyber warfare (10-25% chance based on personality)
  const cyberChance = personality === 'trickster' ? 0.25 : 0.10;
  if (r < cyberChance + ngoChance) {
    if (aiCyberWarfareAction(aiNation, nations, cyberWarfareHook, log)) {
      return true;
    }
  }

  // 3. Legacy Immigration (DEPRECATED - NGO system is preferred, but keep as fallback)
  // Only use if NGO infrastructure is zero and turn < 20
  const useSimpleImmigration = (!aiNation.ngoState || aiNation.ngoState.infrastructure === 0) && turn < 20;
  if (useSimpleImmigration) {
    const immigrationChance = personality === 'trickster' ? 0.15 : 0.08;
    if (r < 0.10 + immigrationChance) {
      if (aiImmigrationAction(aiNation, nations, costs, log)) {
        return true;
      }
    }
  }

  // 4. Conventional warfare (15-35% chance based on personality and era)
  const conventionalChance =
    turn > 15 ? (personality === 'aggressive' ? 0.35 : personality === 'balanced' ? 0.20 : 0.10) : 0.05;
  if (r < 0.20 + conventionalChance) {
    if (aiConventionalWarfareAction(aiNation, nations, conventionalWarfareHook, turn, log)) {
      return true;
    }
  }

  // 5. NGO Infrastructure Upgrade (opportunistic - if no other action taken)
  // Try to upgrade infrastructure even if main action wasn't NGO
  if (Math.random() < 0.15) {
    if (aiNGOInfrastructureUpgrade(aiNation, log)) {
      return true;
    }
  }

  return false;
}
