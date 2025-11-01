/**
 * AI Action Enhancements
 * Adds cyber warfare, conventional warfare, and immigration to AI decision making
 */

import type { Nation } from '../types/game';

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
  const personality = aiNation.ai || 'balanced';
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
    // AI unit deployment logic - skip for now
    // TODO: Implement proper territory system integration
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

    if (enemies.length > 0) {
      const enemy = enemies[Math.floor(Math.random() * enemies.length)];
      // AI territory attack logic - skip for now
      // TODO: Implement proper territory system integration
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

  // 1. Cyber warfare (10-25% chance based on personality)
  const cyberChance = personality === 'trickster' ? 0.25 : 0.10;
  if (r < cyberChance) {
    if (aiCyberWarfareAction(aiNation, nations, cyberWarfareHook, log)) {
      return true;
    }
  }

  // 2. Immigration (8-15% chance)
  const immigrationChance = personality === 'trickster' ? 0.15 : 0.08;
  if (r < 0.10 + immigrationChance) {
    if (aiImmigrationAction(aiNation, nations, costs, log)) {
      return true;
    }
  }

  // 3. Conventional warfare (15-35% chance based on personality and era)
  const conventionalChance =
    turn > 15 ? (personality === 'aggressive' ? 0.35 : personality === 'balanced' ? 0.20 : 0.10) : 0.05;
  if (r < 0.20 + conventionalChance) {
    if (aiConventionalWarfareAction(aiNation, nations, conventionalWarfareHook, turn, log)) {
      return true;
    }
  }

  return false;
}
