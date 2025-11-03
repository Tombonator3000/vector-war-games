/**
 * ENHANCED CYBER WARFARE FEEDBACK SYSTEM
 *
 * Adds clear, visible outcomes for cyber attacks.
 * Example: "Cyber attack disabled 3 missiles for 2 turns"
 */

import type { Nation } from './game';

export interface CyberAttackEffect {
  type: 'missile-disable' | 'intel-theft' | 'readiness-drain' | 'instability' | 'defense-breach';
  description: string;
  value: number;
  duration?: number; // turns
  icon: string;
}

export interface EnhancedCyberOutcome {
  success: boolean;
  detected: boolean;
  attributed: boolean;
  attributedTo: string | null;

  // Specific, visible effects
  effects: CyberAttackEffect[];

  // Summary message for combat log
  summaryMessage: string;

  // Toast notification
  toastTitle: string;
  toastDescription: string;
  toastVariant: 'default' | 'destructive';
}

/**
 * Generate specific cyber attack effects
 */
export function generateCyberEffects(
  attacker: Nation,
  target: Nation,
  success: boolean,
  detected: boolean
): CyberAttackEffect[] {
  const effects: CyberAttackEffect[] = [];

  if (!success) {
    return [{
      type: 'instability',
      description: 'Attack failed',
      value: 0,
      icon: '❌',
    }];
  }

  const attackerOffense = attacker.cyber?.offense || 50;
  const targetDefense = target.cyber?.defense || 50;

  // Effect 1: Missile Disruption
  const missileDisableCount = Math.floor((attackerOffense - targetDefense) / 20);
  if (missileDisableCount > 0 && target.missiles > 0) {
    const actualDisabled = Math.min(missileDisableCount, target.missiles);
    effects.push({
      type: 'missile-disable',
      description: `Disabled ${actualDisabled} missile${actualDisabled > 1 ? 's' : ''}`,
      value: actualDisabled,
      duration: 2,
      icon: '🚀',
    });
  }

  // Effect 2: Intel Theft
  const intelStolen = Math.floor(attackerOffense / 15) + 3;
  if (target.intel >= intelStolen) {
    effects.push({
      type: 'intel-theft',
      description: `Stole ${intelStolen} intel`,
      value: intelStolen,
      icon: '🔍',
    });
  }

  // Effect 3: Readiness Drain
  const readinessDrain = Math.floor(attackerOffense / 5) + 10;
  effects.push({
    type: 'readiness-drain',
    description: `Reduced cyber readiness by ${readinessDrain}`,
    value: readinessDrain,
    duration: 1,
    icon: '⚡',
  });

  // Effect 4: Instability
  const instabilityIncrease = detected ? 4 : 7;
  effects.push({
    type: 'instability',
    description: `Increased instability by ${instabilityIncrease}`,
    value: instabilityIncrease,
    icon: '⚠️',
  });

  // Effect 5: Defense Breach (if target has weak defense)
  if (targetDefense < 40) {
    effects.push({
      type: 'defense-breach',
      description: 'Breached defensive systems',
      value: 1,
      duration: 3,
      icon: '🛡️',
    });
  }

  return effects;
}

/**
 * Generate summary message for combat log
 */
export function generateCyberSummaryMessage(
  attackerName: string,
  targetName: string,
  effects: CyberAttackEffect[],
  detected: boolean,
  attributed: boolean,
  attributedTo: string | null
): string {
  const effectDescriptions = effects.map(e => {
    if (e.duration) {
      return `${e.description} for ${e.duration} turn${e.duration > 1 ? 's' : ''}`;
    }
    return e.description;
  });

  let message = `${attackerName} cyber attack on ${targetName}: ${effectDescriptions.join(', ')}`;

  if (detected) {
    message += ' [DETECTED]';
    if (attributed && attributedTo) {
      message += ` [Attributed to: ${attributedTo}]`;
    }
  }

  return message;
}

/**
 * Create enhanced cyber outcome
 */
export function createEnhancedCyberOutcome(
  attacker: Nation,
  target: Nation,
  success: boolean,
  detected: boolean,
  attributed: boolean,
  attributedTo: string | null
): EnhancedCyberOutcome {
  const effects = generateCyberEffects(attacker, target, success, detected);

  const summaryMessage = generateCyberSummaryMessage(
    attacker.name,
    target.name,
    effects,
    detected,
    attributed,
    attributedTo
  );

  // Create toast notification
  let toastTitle = '';
  let toastDescription = '';
  let toastVariant: 'default' | 'destructive' = 'default';

  if (attacker.isPlayer) {
    if (success) {
      toastTitle = 'Cyber Attack Successful!';
      toastDescription = effects.map(e => `${e.icon} ${e.description}`).join('\n');
      toastVariant = 'default';
      if (detected) {
        toastDescription += '\n⚠️ Attack was detected!';
      }
    } else {
      toastTitle = 'Cyber Attack Failed';
      toastDescription = 'The operation was unsuccessful';
      toastVariant = 'destructive';
    }
  } else if (target.isPlayer) {
    // Player is being attacked
    toastTitle = 'Under Cyber Attack!';
    toastDescription = effects.map(e => `${e.icon} ${e.description}`).join('\n');
    toastVariant = 'destructive';
    if (attributed && attributedTo) {
      toastDescription += `\n🎯 Attributed to: ${attributedTo}`;
    } else if (detected) {
      toastDescription += '\n❓ Attacker unknown';
    }
  }

  return {
    success,
    detected,
    attributed,
    attributedTo,
    effects,
    summaryMessage,
    toastTitle,
    toastDescription,
    toastVariant,
  };
}

/**
 * Apply cyber attack effects to target nation
 */
export function applyCyberEffects(
  target: Nation,
  effects: CyberAttackEffect[]
): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'missile-disable':
        // Temporarily reduce missiles
        target.missiles = Math.max(0, target.missiles - effect.value);
        break;

      case 'intel-theft':
        target.intel = Math.max(0, target.intel - effect.value);
        break;

      case 'readiness-drain':
        if (target.cyber) {
          target.cyber.readiness = Math.max(0, target.cyber.readiness - effect.value);
        }
        break;

      case 'instability':
        target.instability = (target.instability || 0) + effect.value;
        break;

      case 'defense-breach':
        if (target.cyber) {
          target.cyber.defense = Math.max(0, target.cyber.defense - 10);
        }
        break;
    }
  }
}

/**
 * Restore disabled missiles after duration expires
 */
export interface ActiveCyberEffect {
  targetId: string;
  effect: CyberAttackEffect;
  appliedTurn: number;
  expiresAt: number;
}

export function processActiveCyberEffects(
  activeEffects: ActiveCyberEffect[],
  currentTurn: number,
  getNation: (id: string) => Nation | undefined
): ActiveCyberEffect[] {
  const stillActive: ActiveCyberEffect[] = [];

  for (const active of activeEffects) {
    if (currentTurn >= active.expiresAt) {
      // Effect expired - restore if applicable
      const target = getNation(active.targetId);
      if (target && active.effect.type === 'missile-disable') {
        target.missiles += active.effect.value; // Restore disabled missiles
      }
    } else {
      stillActive.push(active);
    }
  }

  return stillActive;
}
