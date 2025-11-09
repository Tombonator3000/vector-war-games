/**
 * AI Strategies for Advanced Propaganda
 * Determines how AI nations use useful idiots, phobia campaigns, and religious weapons
 */

import type { Nation, GameState } from '../types/game';
import {
  UsefulIdiotType,
  PhobiaType,
  PhobiaIntensity,
  ReligiousWeaponType,
  USEFUL_IDIOT_CONFIG,
  PHOBIA_CAMPAIGN_CONFIG,
  RELIGIOUS_WEAPON_CONFIG,
} from '../types/advancedPropaganda';
import {
  initiateRecruitment,
  launchPhobiaCampaign,
  deployReligiousWeapon,
} from './advancedPropagandaManager';

// ============================================================================
// AI STRATEGY TYPES
// ============================================================================

export type AdvancedPropagandaStrategy =
  | 'aggressive_subversion'    // Focus on destabilization through all means
  | 'ideological_warfare'      // Use religious weapons and convert populations
  | 'psychological_ops'        // Focus on phobia campaigns
  | 'infiltration_network'     // Build extensive useful idiot network
  | 'opportunistic'            // Mix of tactics based on opportunity
  | 'defensive';               // Minimal propaganda, focus on defense

// ============================================================================
// AI DECISION MAKING
// ============================================================================

/**
 * Determine which advanced propaganda strategy an AI nation should use
 */
export function determineAdvancedPropagandaStrategy(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): AdvancedPropagandaStrategy {
  const personality = nation.aiPersonality;
  const ideology = nation.ideologyState?.currentIdeology;
  const intel = nation.intel;
  const relationships = nation.relationships || {};

  // High aggression personalities
  if (personality === 'aggressive' || personality === 'paranoid') {
    if (intel > 300) {
      return 'aggressive_subversion';
    } else {
      return 'psychological_ops';
    }
  }

  // Ideological nations
  if (ideology === 'theocracy') {
    return 'ideological_warfare';
  }

  if (ideology === 'authoritarianism' || ideology === 'communism') {
    return 'aggressive_subversion';
  }

  // Defensive nations
  if (personality === 'defensive' || personality === 'isolationist') {
    return 'defensive';
  }

  // High intel nations
  if (intel > 500) {
    return 'infiltration_network';
  }

  // Count enemies
  const enemies = Object.values(relationships).filter(r => r < -20).length;
  if (enemies > 2) {
    return 'psychological_ops'; // Spread fear to weaken multiple enemies
  }

  // Default
  return 'opportunistic';
}

/**
 * Execute advanced propaganda strategy for an AI nation
 */
export function executeAdvancedPropagandaStrategy(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): void {
  if (!gameState.advancedPropaganda) return;
  if (nation.eliminated || nation.isPlayer) return;

  const strategy = determineAdvancedPropagandaStrategy(nation, gameState, allNations);
  const intel = nation.intel;

  // Don't spend if intel is too low
  if (intel < 100) return;

  switch (strategy) {
    case 'aggressive_subversion':
      executeAggressiveSubversion(nation, gameState, allNations);
      break;

    case 'ideological_warfare':
      executeIdeologicalWarfare(nation, gameState, allNations);
      break;

    case 'psychological_ops':
      executePsychologicalOps(nation, gameState, allNations);
      break;

    case 'infiltration_network':
      executeInfiltrationNetwork(nation, gameState, allNations);
      break;

    case 'opportunistic':
      executeOpportunistic(nation, gameState, allNations);
      break;

    case 'defensive':
      // Defensive nations don't actively use propaganda
      break;
  }
}

// ============================================================================
// STRATEGY IMPLEMENTATIONS
// ============================================================================

/**
 * Aggressive Subversion: Use all tools to destabilize enemies
 */
function executeAggressiveSubversion(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): void {
  const enemies = selectEnemyTargets(nation, allNations, 2);

  for (const enemy of enemies) {
    // Try to recruit useful idiots (politicians for destabilization)
    if (nation.intel > 200 && Math.random() < 0.4) {
      const types: UsefulIdiotType[] = ['politician', 'journalist', 'academic'];
      const type = types[Math.floor(Math.random() * types.length)];

      // Check if we already have recruitment ongoing
      const existing = gameState.advancedPropaganda!.recruitmentOperations.find(
        r => r.recruiterNation === nation.id && r.targetNation === enemy.id
      );

      if (!existing) {
        initiateRecruitment(gameState, nation.id, enemy.id, type);
      }
    }

    // Launch phobia campaigns (aggressive intensity)
    if (nation.intel > 150 && Math.random() < 0.5) {
      const phobiaTypes: PhobiaType[] = ['enemy_fear', 'economic_anxiety', 'existential_dread'];
      const type = phobiaTypes[Math.floor(Math.random() * phobiaTypes.length)];

      const existing = gameState.advancedPropaganda!.phobiaCampaigns.find(
        c => c.sourceNation === nation.id && c.targetNation === enemy.id && !c.discovered
      );

      if (!existing) {
        launchPhobiaCampaign(gameState, nation.id, enemy.id, type, 'aggressive');
      }
    }

    // Deploy religious weapons if compatible
    if (nation.intel > 200 && Math.random() < 0.3) {
      const ideology = nation.ideologyState?.currentIdeology;
      if (ideology === 'theocracy' || ideology === 'authoritarianism') {
        const weaponTypes: ReligiousWeaponType[] = ['enemy_demonization', 'heresy_accusation'];
        const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

        const existing = gameState.advancedPropaganda!.religiousWeapons.find(
          w => w.sourceNation === nation.id && w.targetNations.includes(enemy.id)
        );

        if (!existing) {
          deployReligiousWeapon(gameState, nation.id, [enemy.id], type);
        }
      }
    }
  }
}

/**
 * Ideological Warfare: Focus on religious weapons and conversion
 */
function executeIdeologicalWarfare(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): void {
  const ideology = nation.ideologyState?.currentIdeology;
  if (!ideology) return;

  // Select targets with different ideologies
  const targets = allNations.filter(
    n => !n.eliminated &&
    n.id !== nation.id &&
    n.ideologyState?.currentIdeology !== ideology &&
    (nation.relationships?.[n.id] || 0) < 20
  ).slice(0, 3);

  for (const target of targets) {
    // Priority: Deploy religious weapons
    if (nation.intel > 250 && Math.random() < 0.6) {
      const weaponTypes: ReligiousWeaponType[] = [
        'holy_war',
        'prophetic_narrative',
        'sacred_mission',
        'ideological_purity',
      ];
      const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

      const compatibleTypes = RELIGIOUS_WEAPON_CONFIG.IDEOLOGY_COMPATIBILITY[type];
      if (compatibleTypes.includes(ideology)) {
        const existing = gameState.advancedPropaganda!.religiousWeapons.find(
          w => w.sourceNation === nation.id && w.type === type
        );

        if (!existing) {
          deployReligiousWeapon(gameState, nation.id, [target.id], type);
        }
      }
    }

    // Secondary: Recruit religious leaders and academics
    if (nation.intel > 150 && Math.random() < 0.4) {
      const types: UsefulIdiotType[] = ['religious_leader', 'academic'];
      const type = types[Math.floor(Math.random() * types.length)];

      const existing = gameState.advancedPropaganda!.recruitmentOperations.find(
        r => r.recruiterNation === nation.id && r.targetNation === target.id
      );

      if (!existing) {
        initiateRecruitment(gameState, nation.id, target.id, type);
      }
    }
  }
}

/**
 * Psychological Operations: Mass fear campaigns
 */
function executePsychologicalOps(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): void {
  const enemies = selectEnemyTargets(nation, allNations, 3);

  for (const enemy of enemies) {
    // Focus on phobia campaigns
    if (nation.intel > 100 && Math.random() < 0.7) {
      // Select phobia type based on target's vulnerabilities
      let phobiaType: PhobiaType;

      const targetInstability = enemy.instability || 0;
      const targetMorale = enemy.morale || 50;

      if (targetInstability > 40) {
        phobiaType = 'existential_dread'; // Amplify existing fear
      } else if (targetMorale < 30) {
        phobiaType = 'apocalypse_fear'; // Push them over the edge
      } else if (enemy.popGroups && enemy.popGroups.length > 1) {
        phobiaType = 'cultural_erasure'; // Exploit diversity
      } else {
        phobiaType = 'enemy_fear'; // Classic fear of the enemy
      }

      // Choose intensity based on intel reserves
      let intensity: PhobiaIntensity;
      if (nation.intel > 300) {
        intensity = 'aggressive';
      } else if (nation.intel > 150) {
        intensity = 'moderate';
      } else {
        intensity = 'subtle';
      }

      const existing = gameState.advancedPropaganda!.phobiaCampaigns.find(
        c => c.sourceNation === nation.id &&
        c.targetNation === enemy.id &&
        c.type === phobiaType &&
        !c.discovered
      );

      if (!existing) {
        launchPhobiaCampaign(gameState, nation.id, enemy.id, phobiaType, intensity);
      }
    }

    // Recruit journalists to spread fear
    if (nation.intel > 120 && Math.random() < 0.3) {
      const existing = gameState.advancedPropaganda!.recruitmentOperations.find(
        r => r.recruiterNation === nation.id && r.targetNation === enemy.id
      );

      if (!existing) {
        initiateRecruitment(gameState, nation.id, enemy.id, 'journalist');
      }
    }
  }
}

/**
 * Infiltration Network: Build extensive useful idiot network
 */
function executeInfiltrationNetwork(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): void {
  const targets = allNations
    .filter(n => !n.eliminated && n.id !== nation.id)
    .sort((a, b) => {
      // Prioritize by importance (population, production, threats)
      const aScore = a.population + a.production + ((nation.relationships?.[a.id] || 0) < -20 ? 100 : 0);
      const bScore = b.population + b.production + ((nation.relationships?.[b.id] || 0) < -20 ? 100 : 0);
      return bScore - aScore;
    })
    .slice(0, 4);

  // Count existing idiots per target
  const idiotsPerTarget = new Map<string, number>();
  for (const idiot of gameState.advancedPropaganda!.usefulIdiots) {
    if (idiot.recruiterNation === nation.id && idiot.status !== 'burned') {
      idiotsPerTarget.set(idiot.nation, (idiotsPerTarget.get(idiot.nation) || 0) + 1);
    }
  }

  for (const target of targets) {
    const currentIdiots = idiotsPerTarget.get(target.id) || 0;

    // Build network gradually (max 3 per target)
    if (currentIdiots < 3 && nation.intel > 150 && Math.random() < 0.5) {
      // Recruit diverse types for comprehensive coverage
      let type: UsefulIdiotType;

      if (currentIdiots === 0) {
        type = 'journalist'; // Start with media
      } else if (currentIdiots === 1) {
        type = 'academic'; // Add intellectual credibility
      } else {
        // Add either political or business influence
        type = Math.random() < 0.5 ? 'politician' : 'business_leader';
      }

      const existing = gameState.advancedPropaganda!.recruitmentOperations.find(
        r => r.recruiterNation === nation.id && r.targetNation === target.id
      );

      if (!existing) {
        initiateRecruitment(gameState, nation.id, target.id, type);
      }
    }
  }
}

/**
 * Opportunistic: Mix of tactics based on circumstances
 */
function executeOpportunistic(
  nation: Nation,
  gameState: GameState,
  allNations: Nation[]
): void {
  // Look for vulnerable targets
  const vulnerableTargets = allNations
    .filter(n =>
      !n.eliminated &&
      n.id !== nation.id &&
      ((n.instability || 0) > 30 || n.morale < 40 || (nation.relationships?.[n.id] || 0) < -30)
    )
    .sort((a, b) => (b.instability || 0) - (a.instability || 0))
    .slice(0, 2);

  if (vulnerableTargets.length === 0) return;

  for (const target of vulnerableTargets) {
    // Pick one random tactic to apply
    const tactic = Math.random();

    if (tactic < 0.4 && nation.intel > 150) {
      // Recruit useful idiot
      const types: UsefulIdiotType[] = ['journalist', 'politician', 'influencer'];
      const type = types[Math.floor(Math.random() * types.length)];

      const existing = gameState.advancedPropaganda!.recruitmentOperations.find(
        r => r.recruiterNation === nation.id && r.targetNation === target.id
      );

      if (!existing) {
        initiateRecruitment(gameState, nation.id, target.id, type);
      }
    } else if (tactic < 0.8 && nation.intel > 100) {
      // Launch phobia campaign (subtle to avoid detection)
      const phobiaTypes: PhobiaType[] = ['economic_anxiety', 'xenophobia', 'enemy_fear'];
      const type = phobiaTypes[Math.floor(Math.random() * phobiaTypes.length)];

      const existing = gameState.advancedPropaganda!.phobiaCampaigns.find(
        c => c.sourceNation === nation.id && c.targetNation === target.id && !c.discovered
      );

      if (!existing) {
        launchPhobiaCampaign(gameState, nation.id, target.id, type, 'subtle');
      }
    } else if (nation.intel > 200 && nation.ideologyState?.currentIdeology === 'theocracy') {
      // Deploy religious weapon if theocracy
      const weaponTypes: ReligiousWeaponType[] = ['enemy_demonization', 'heresy_accusation'];
      const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

      const existing = gameState.advancedPropaganda!.religiousWeapons.find(
        w => w.sourceNation === nation.id && w.targetNations.includes(target.id)
      );

      if (!existing) {
        deployReligiousWeapon(gameState, nation.id, [target.id], type);
      }
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Select enemy targets for propaganda operations
 */
function selectEnemyTargets(nation: Nation, allNations: Nation[], count: number): Nation[] {
  return allNations
    .filter(n => !n.eliminated && n.id !== nation.id)
    .sort((a, b) => {
      const aRelation = nation.relationships?.[a.id] || 0;
      const bRelation = nation.relationships?.[b.id] || 0;

      // Prioritize enemies (negative relationships)
      if (aRelation < bRelation) return -1;
      if (aRelation > bRelation) return 1;

      // Then by threat level (population + production)
      const aThreat = a.population + a.production;
      const bThreat = b.population + b.production;
      return bThreat - aThreat;
    })
    .slice(0, count);
}

/**
 * Execute advanced propaganda for all AI nations
 */
export function executeAllAIAdvancedPropaganda(gameState: GameState): void {
  if (!gameState.advancedPropaganda) return;

  const allNations = gameState.nations;

  for (const nation of allNations) {
    if (nation.eliminated || nation.isPlayer) continue;

    executeAdvancedPropagandaStrategy(nation, gameState, allNations);
  }
}
