import { useCallback, useEffect, useRef, useState } from 'react';
import type { Nation, NationCyberProfile } from '@/types/game';

export type CyberActionId = 'intrusion' | 'fortify' | 'false_flag';
export type CyberLogTone = 'normal' | 'warning' | 'success' | 'alert';
export type CyberNewsCategory = 'intel' | 'crisis' | 'diplomatic' | 'science' | 'military';
export type CyberNewsPriority = 'routine' | 'important' | 'urgent' | 'critical';

export interface CyberOperationLogEntry {
  id: string;
  type: CyberActionId;
  turn: number;
  attackerId?: string;
  targetId?: string;
  success: boolean;
  detected: boolean;
  attributedTo?: string | null;
  summary: string;
  falseFlag?: boolean;
}

export interface CyberActionAvailability {
  id: CyberActionId;
  cost: number;
  cooldown: number;
  remainingCooldown?: number;
  canExecute: boolean;
  reason?: string;
  scapegoatId?: string;
}

export interface CyberOperationOutcome {
  executed: boolean;
  success?: boolean;
  detected?: boolean;
  attributed?: boolean;
  attributedTo?: string | null;
  falseFlag?: boolean;
  message: string;
  severity?: 'minor' | 'major';
}

export type CyberResearchUnlock =
  | 'firewalls'
  | 'intrusion_detection'
  | 'advanced_offense'
  | 'stealth_protocols'
  | 'attribution_obfuscation'
  | 'ai_defense'
  | 'cyber_superweapon';

export interface UseCyberWarfareOptions {
  currentTurn: number;
  getNation: (id: string) => Nation | undefined;
  getNations: () => Nation[];
  onLog?: (message: string, tone?: CyberLogTone) => void;
  onToast?: (payload: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  onNews?: (category: CyberNewsCategory, text: string, priority: CyberNewsPriority) => void;
  onDefconShift?: (delta: number, reason: string) => void;
  rng?: () => number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ACTION_RULES: Record<CyberActionId, { cost: number; cooldown: number; requiresResearch?: string }> = {
  intrusion: { cost: 25, cooldown: 2 },
  fortify: { cost: 15, cooldown: 1 },
  false_flag: { cost: 35, cooldown: 3, requiresResearch: 'cyber_ids' },
};

const LOG_LIMIT = 25;

const ensureThreatMap = (nation: Nation) => {
  if (!nation.threats) {
    nation.threats = {};
  }
};

const increaseThreat = (nation: Nation, otherId: string, amount: number) => {
  if (amount === 0) return;
  ensureThreatMap(nation);
  const current = nation.threats?.[otherId] ?? 0;
  const next = clamp(current + amount, 0, 100);
  if (next <= 0) {
    delete nation.threats?.[otherId];
    return;
  }
  nation.threats![otherId] = next;
};

export const createDefaultNationCyberProfile = (): NationCyberProfile => ({
  readiness: 60,
  maxReadiness: 100,
  offense: 55,
  defense: 52,
  detection: 32,
  attribution: 35,
  research: {},
});

export const applyCyberResearchUnlock = (
  nation: { cyber?: NationCyberProfile },
  unlock: CyberResearchUnlock,
): NationCyberProfile => {
  const profile = nation.cyber ? { ...nation.cyber } : createDefaultNationCyberProfile();
  profile.research = profile.research ? { ...profile.research } : {};
  switch (unlock) {
    case 'firewalls':
      profile.research.firewalls = true;
      profile.maxReadiness += 15;
      profile.defense += 8;
      profile.detection += 6;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 12);
      break;
    case 'intrusion_detection':
      profile.research.intrusionDetection = true;
      profile.detection += 12;
      profile.attribution += 18;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 8);
      break;
    case 'advanced_offense':
      profile.research.advancedOffense = true;
      profile.offense += 10;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 10);
      break;
    case 'stealth_protocols':
      profile.research.stealthProtocols = true;
      profile.offense += 5;
      // Detection reduction of 15% handled in executeIntrusion logic
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 8);
      break;
    case 'attribution_obfuscation':
      profile.research.attributionObfuscation = true;
      profile.attribution += 15; // Makes YOUR attacks harder to attribute
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 10);
      break;
    case 'ai_defense':
      profile.research.aiDefense = true;
      profile.defense += 10;
      profile.detection += 10;
      // 20% counter-attack chance handled in executeIntrusion logic
      profile.maxReadiness += 10;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 15);
      break;
    case 'cyber_superweapon':
      profile.research.cyberSuperweapon = true;
      // Unlocks new action "Cyber Nuke" (one-time devastating attack)
      profile.offense += 15;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 20);
      break;
  }
  nation.cyber = profile;
  return profile;
};

export function useCyberWarfare(options: UseCyberWarfareOptions) {
  const {
    getNation,
    getNations,
    onLog,
    onToast,
    onNews,
    onDefconShift,
  } = options;

  const rngRef = useRef<() => number>(options.rng ?? Math.random);
  useEffect(() => {
    rngRef.current = options.rng ?? Math.random;
  }, [options.rng]);

  const turnRef = useRef(options.currentTurn);
  useEffect(() => {
    turnRef.current = options.currentTurn;
  }, [options.currentTurn]);

  const [cooldowns, setCooldowns] = useState<Record<string, Partial<Record<CyberActionId, number>>>>({});
  const [logs, setLogs] = useState<CyberOperationLogEntry[]>([]);

  const ensureProfile = useCallback((nation: Nation): NationCyberProfile => {
    if (!nation.cyber) {
      nation.cyber = createDefaultNationCyberProfile();
    } else if (!nation.cyber.research) {
      nation.cyber.research = {};
    }
    return nation.cyber;
  }, []);

  const getCooldown = useCallback(
    (nationId: string, action: CyberActionId) => cooldowns[nationId]?.[action] ?? 0,
    [cooldowns],
  );

  const setCooldown = useCallback((nationId: string, action: CyberActionId, value: number) => {
    setCooldowns(prev => {
      const next = { ...prev };
      next[nationId] = { ...(next[nationId] ?? {}), [action]: value };
      return next;
    });
  }, []);

  const pushLog = useCallback((entry: CyberOperationLogEntry) => {
    setLogs(prev => [...prev.slice(-LOG_LIMIT + 1), entry]);
  }, []);

  const pickFalseFlagScapegoat = useCallback(
    (attacker: Nation, target: Nation): Nation | undefined => {
      const threats = target.threats ? Object.entries(target.threats) : [];
      const ordered = threats
        .filter(([nationId]) => nationId !== attacker.id)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
      for (const [nationId] of ordered) {
        const candidate = getNation(nationId);
        if (candidate && candidate.id !== target.id && candidate.population > 0) {
          return candidate;
        }
      }
      const fallbacks = getNations().filter(
        nation => nation.id !== attacker.id && nation.id !== target.id && nation.population > 0,
      );
      return fallbacks[0];
    },
    [getNation, getNations],
  );

  const computeSuccessChance = useCallback((attacker: NationCyberProfile, defender: NationCyberProfile) => {
    const offenseTerm = (attacker.offense - defender.defense) / 220;
    const readinessRatio = attacker.maxReadiness > 0 ? attacker.readiness / attacker.maxReadiness : 0;
    const readinessTerm = (readinessRatio - 0.5) * 0.35;
    const researchBoost = (attacker.research.intrusionDetection ? 0.05 : 0) + (attacker.research.advancedOffense ? 0.08 : 0);
    return clamp(0.45 + offenseTerm + readinessTerm + researchBoost, 0.1, 0.95);
  }, []);

  const computeDetectionChance = useCallback((targetProfile: NationCyberProfile, attackerProfile: NationCyberProfile) => {
    const readinessPenalty = targetProfile.readiness < targetProfile.maxReadiness * 0.3 ? -0.08 : 0;
    const researchBonus = targetProfile.research.intrusionDetection ? 0.12 : 0;
    const stealthReduction = attackerProfile.research.stealthProtocols ? -0.15 : 0; // Stealth protocols reduce detection by 15%
    return clamp(0.28 + targetProfile.detection / 150 + readinessPenalty + researchBonus + stealthReduction, 0.12, 0.95);
  }, []);

  const computeAttributionChance = useCallback((targetProfile: NationCyberProfile, attackerProfile: NationCyberProfile) => {
    const researchBonus = targetProfile.research.intrusionDetection ? 0.1 : 0;
    const obfuscationReduction = attackerProfile.research.attributionObfuscation ? -0.25 : 0; // Attribution obfuscation makes your attacks harder to trace
    return clamp(0.35 + targetProfile.attribution / 190 + researchBonus + obfuscationReduction, 0.15, 0.9);
  }, []);

  const computeFalseFlagChance = useCallback((targetProfile: NationCyberProfile) => {
    return clamp(0.55 - targetProfile.attribution / 220, 0.08, 0.68);
  }, []);

  const getActionAvailability = useCallback(
    (nationId: string, action: CyberActionId, targetId?: string): CyberActionAvailability => {
      const rule = ACTION_RULES[action];
      const nation = getNation(nationId);
      if (!nation) {
        return {
          id: action,
          cost: rule.cost,
          cooldown: rule.cooldown,
          canExecute: false,
          reason: 'Nation unavailable',
        };
      }
      const profile = ensureProfile(nation);
      const remainingCooldown = getCooldown(nationId, action);

      // Apply advanced offense cost reduction for intrusion (20%)
      let effectiveCost = rule.cost;
      if (action === 'intrusion' && profile.research.advancedOffense) {
        effectiveCost = Math.round(rule.cost * 0.8); // 20% cost reduction
      }

      if (remainingCooldown > 0) {
        return {
          id: action,
          cost: effectiveCost,
          cooldown: rule.cooldown,
          remainingCooldown,
          canExecute: false,
          reason: `Cooldown: ${remainingCooldown} turn(s) remaining`,
        };
      }
      if (profile.readiness < effectiveCost) {
        return {
          id: action,
          cost: effectiveCost,
          cooldown: rule.cooldown,
          canExecute: false,
          reason: 'Insufficient cyber readiness',
        };
      }
      if (rule.requiresResearch && !nation.researched?.[rule.requiresResearch]) {
        return {
          id: action,
          cost: effectiveCost,
          cooldown: rule.cooldown,
          canExecute: false,
          reason: 'Research prerequisite incomplete',
        };
      }
      if (action === 'false_flag' && targetId) {
        const target = getNation(targetId);
        if (!target) {
          return {
            id: action,
            cost: effectiveCost,
            cooldown: rule.cooldown,
            canExecute: false,
            reason: 'Select a valid target',
          };
        }
        const scapegoat = pickFalseFlagScapegoat(nation, target);
        if (!scapegoat) {
          return {
            id: action,
            cost: effectiveCost,
            cooldown: rule.cooldown,
            canExecute: false,
            reason: 'No viable rival to frame',
          };
        }
        return {
          id: action,
          cost: effectiveCost,
          cooldown: rule.cooldown,
          canExecute: true,
          scapegoatId: scapegoat.id,
        };
      }
      return {
        id: action,
        cost: effectiveCost,
        cooldown: rule.cooldown,
        canExecute: true,
      };
    },
    [ensureProfile, getCooldown, getNation, pickFalseFlagScapegoat],
  );

  const resolveIntrusion = useCallback(
    (
      attacker: Nation,
      target: Nation,
      action: CyberActionId,
      scapegoatId?: string,
    ): CyberOperationOutcome => {
      const rule = ACTION_RULES[action];
      const attackerProfile = ensureProfile(attacker);
      const targetProfile = ensureProfile(target);

      const availability = getActionAvailability(attacker.id, action, target.id);
      if (!availability.canExecute) {
        if (availability.reason) {
          onToast?.({ title: 'Cyber action unavailable', description: availability.reason });
        }
        return {
          executed: false,
          message: availability.reason ?? 'Action unavailable',
        };
      }

      // Apply advanced offense cost reduction for intrusion (20%)
      let effectiveCost = rule.cost;
      if (action === 'intrusion' && attackerProfile.research.advancedOffense) {
        effectiveCost = Math.round(rule.cost * 0.8); // 20% cost reduction
      }

      attackerProfile.readiness = Math.max(0, attackerProfile.readiness - effectiveCost);
      setCooldown(attacker.id, action, rule.cooldown);

      const successChance = computeSuccessChance(attackerProfile, targetProfile);
      const detectionChance = computeDetectionChance(targetProfile, attackerProfile);
      const attributionChance = computeAttributionChance(targetProfile, attackerProfile);
      const falseFlagChance = computeFalseFlagChance(targetProfile);

      const success = rngRef.current() < successChance;
      const detected = rngRef.current() < detectionChance;
      let attributed = false;
      let attributedTo: string | null = null;
      let falseFlagSuccess = false;

      if (detected && rngRef.current() < attributionChance) {
        attributed = true;
        attributedTo = attacker.id;
        if (scapegoatId) {
          const scapegoat = getNation(scapegoatId);
          if (scapegoat) {
            const scapegoatRoll = rngRef.current();
            if (scapegoatRoll < falseFlagChance) {
              attributedTo = scapegoat.id;
              falseFlagSuccess = true;
              increaseThreat(target, scapegoat.id, 14);
              increaseThreat(scapegoat, target.id, 10);
            }
          }
        }
      }

      const readinessDamage = success ? Math.round(16 + attackerProfile.offense / 18) : 6;
      const intelDrain = success ? Math.max(2, Math.round(attackerProfile.offense / 25) + 4) : 0;

      if (success) {
        targetProfile.readiness = Math.max(0, targetProfile.readiness - readinessDamage);
        target.intel = Math.max(0, (target.intel || 0) - intelDrain);
        target.instability = Math.max(0, (target.instability || 0) + (detected ? 4 : 7));
        increaseThreat(target, attacker.id, detected ? 12 : 6);
        if (falseFlagSuccess && attributedTo) {
          const scapegoat = getNation(attributedTo);
          if (scapegoat) {
            increaseThreat(target, scapegoat.id, 18);
          }
        }

        // AI-Driven Cyber Defenses: 20% chance to counter-attack
        if (detected && targetProfile.research.aiDefense && rngRef.current() < 0.2) {
          const counterDamage = Math.round(8 + targetProfile.defense / 15);
          attackerProfile.readiness = Math.max(0, attackerProfile.readiness - counterDamage);
          onLog?.(`AI defense system counter-attacked ${attacker.name}, inflicting ${counterDamage} readiness damage`, 'warning');
        }
      } else {
        attackerProfile.readiness = Math.max(0, attackerProfile.readiness - 5);
        increaseThreat(target, attacker.id, detected ? 10 : 3);
      }

      const attackerName = attacker.name;
      const targetName = target.name;
      const scapegoatName = scapegoatId ? getNation(scapegoatId)?.name : null;

      let summary: string;
      if (success) {
        summary = detected
          ? `Cyber breach hit ${targetName}, but defenses exposed the attack.`
          : `Stealth intrusion siphoned intel from ${targetName}.`;
      } else {
        summary = detected
          ? `${targetName} neutralised an incoming cyber offensive from ${attackerName}.`
          : `${targetName} shrugged off a probing intrusion attempt.`;
      }

      const tone: CyberLogTone = success ? (detected ? 'warning' : 'success') : 'warning';
      onLog?.(summary, tone);

      const title = success
        ? detected
          ? 'Intrusion Exposed'
          : 'Network Breached'
        : detected
        ? 'Counter-Intrusion Success'
        : 'Attack Foiled';
      onToast?.({
        title,
        description: summary,
        variant: detected && (!falseFlagSuccess || attributedTo === attacker.id) ? 'destructive' : 'default',
      });

      if (detected) {
        if (falseFlagSuccess && scapegoatName && attributedTo) {
          onNews?.(
            'intel',
            `${targetName} blames ${scapegoatName} for a crippling cyber strike`,
            'critical',
          );
          onDefconShift?.(-1, `${targetName} escalates tensions with ${scapegoatName} over cyber evidence`);
        } else if (attributedTo === attacker.id) {
          onNews?.(
            'intel',
            `${targetName} traces cyber attack to ${attackerName}`,
            'important',
          );
          onDefconShift?.(-1, `${targetName} traces cyber attack to ${attackerName}`);
        } else {
          onNews?.('intel', `${targetName} detects intrusion but attribution remains murky`, 'important');
        }
      } else if (success) {
        onNews?.('intel', `Silent breach compromises ${targetName}'s critical systems`, 'urgent');
      }

      if (attributedTo) {
        targetProfile.lastAttribution = {
          turn: turnRef.current,
          attackerId: attacker.id,
          outcome: success ? 'success' : 'failed',
          falseFlagged: falseFlagSuccess,
          attributedTo,
        };
      }

      const entry: CyberOperationLogEntry = {
        id: `cyber_${turnRef.current}_${Math.random().toString(36).slice(2)}`,
        type: action,
        turn: turnRef.current,
        attackerId: attacker.id,
        targetId: target.id,
        success,
        detected,
        attributedTo: attributed ? attributedTo ?? null : null,
        summary,
        falseFlag: !!scapegoatId,
      };
      pushLog(entry);

      return {
        executed: true,
        success,
        detected,
        attributed,
        attributedTo,
        falseFlag: !!scapegoatId,
        message: summary,
        severity: success && detected ? 'major' : 'minor',
      };
    },
    [
      computeAttributionChance,
      computeDetectionChance,
      computeFalseFlagChance,
      computeSuccessChance,
      ensureProfile,
      getActionAvailability,
      getNation,
      onDefconShift,
      onLog,
      onNews,
      onToast,
      pushLog,
      setCooldown,
    ],
  );

  const launchAttack = useCallback(
    (attackerId: string, targetId: string): CyberOperationOutcome => {
      const attacker = getNation(attackerId);
      const target = getNation(targetId);
      if (!attacker || !target) {
        const message = 'Invalid attacker or target';
        onToast?.({ title: 'Cyber command error', description: message });
        return { executed: false, message };
      }
      return resolveIntrusion(attacker, target, 'intrusion');
    },
    [getNation, onToast, resolveIntrusion],
  );

  const launchFalseFlag = useCallback(
    (attackerId: string, targetId: string): CyberOperationOutcome => {
      const attacker = getNation(attackerId);
      const target = getNation(targetId);
      if (!attacker || !target) {
        const message = 'Invalid attacker or target';
        onToast?.({ title: 'Cyber command error', description: message });
        return { executed: false, message };
      }
      const scapegoat = pickFalseFlagScapegoat(attacker, target);
      if (!scapegoat) {
        const message = 'No rival available to frame';
        onToast?.({ title: 'False flag unavailable', description: message });
        return { executed: false, message };
      }
      return resolveIntrusion(attacker, target, 'false_flag', scapegoat.id);
    },
    [getNation, onToast, pickFalseFlagScapegoat, resolveIntrusion],
  );

  const hardenNetworks = useCallback(
    (nationId: string): CyberOperationOutcome => {
      const nation = getNation(nationId);
      if (!nation) {
        const message = 'Nation unavailable';
        onToast?.({ title: 'Cyber command error', description: message });
        return { executed: false, message };
      }
      const availability = getActionAvailability(nationId, 'fortify');
      if (!availability.canExecute) {
        if (availability.reason) {
          onToast?.({ title: 'Cannot fortify', description: availability.reason });
        }
        return {
          executed: false,
          message: availability.reason ?? 'Action unavailable',
        };
      }
      const profile = ensureProfile(nation);
      const rule = ACTION_RULES.fortify;
      profile.readiness = Math.max(0, profile.readiness - rule.cost);
      const restoration = 28 + (profile.research.firewalls ? 12 : 6);
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + restoration);
      setCooldown(nationId, 'fortify', rule.cooldown);
      const summary = `${nation.name} reinforces digital fortifications (+${Math.round(restoration)} readiness).`;
      onLog?.(summary, 'success');
      onToast?.({ title: 'Networks hardened', description: summary });
      onNews?.('intel', `${nation.name} advertises new cyber defenses`, 'routine');
      pushLog({
        id: `cyber_${turnRef.current}_${Math.random().toString(36).slice(2)}`,
        type: 'fortify',
        turn: turnRef.current,
        attackerId: nation.id,
        targetId: nation.id,
        success: true,
        detected: false,
        summary,
      });
      return {
        executed: true,
        success: true,
        message: summary,
        severity: 'minor',
      };
    },
    [ensureProfile, getActionAvailability, getNation, onLog, onNews, onToast, pushLog, setCooldown],
  );

  const advanceTurn = useCallback(() => {
    setCooldowns(prev => {
      const next: typeof prev = {};
      const all = getNations();
      all.forEach(nation => {
        const existing = prev[nation.id] ?? {};
        const reduced: Partial<Record<CyberActionId, number>> = {};
        (Object.keys(ACTION_RULES) as CyberActionId[]).forEach(actionId => {
          const value = existing[actionId];
          if (value && value > 0) {
            const nextValue = Math.max(0, value - 1);
            if (nextValue > 0) {
              reduced[actionId] = nextValue;
            }
          }
        });
        if (Object.keys(reduced).length > 0) {
          next[nation.id] = reduced;
        }
      });
      return next;
    });

    getNations().forEach(nation => {
      const profile = ensureProfile(nation);
      const regen = 12 + (profile.research.firewalls ? 5 : 0) + (profile.research.intrusionDetection ? 3 : 0);
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + regen);
    });
  }, [ensureProfile, getNations]);

  const runAiPlan = useCallback(
    (nationId: string): CyberOperationOutcome | null => {
      const aiNation = getNation(nationId);
      if (!aiNation || aiNation.isPlayer) return null;
      const player = getNations().find(n => n.isPlayer && n.population > 0);
      if (!player) return null;
      const availability = getActionAvailability(aiNation.id, 'intrusion', player.id);
      if (!availability.canExecute) return null;
      const aggressionRoll = rngRef.current();
      if (aggressionRoll > 0.32) return null;
      const outcome = resolveIntrusion(aiNation, player, 'intrusion');
      return outcome.executed ? outcome : null;
    },
    [
      getActionAvailability,
      getNation,
      getNations,
      resolveIntrusion,
    ],
  );

  const profileForNation = useCallback(
    (nationId: string): NationCyberProfile | undefined => {
      const nation = getNation(nationId);
      if (!nation) return undefined;
      return ensureProfile(nation);
    },
    [ensureProfile, getNation],
  );

  return {
    logs,
    getProfile: profileForNation,
    getActionAvailability,
    launchAttack,
    launchFalseFlag,
    hardenNetworks,
    advanceTurn,
    runAiPlan,
  };
}

export type UseCyberWarfareReturn = ReturnType<typeof useCyberWarfare>;
