/**
 * Intelligence Operations Handlers
 * Extracted from Index.tsx (Session 4 Part 2)
 *
 * Manages satellite deployment, ASAT strikes, sabotage, propaganda,
 * culture bombs, deep recon, and cyber operations.
 */

import { type ReactNode } from 'react';
import { toast } from "@/components/ui/use-toast";
import type { Nation } from '@/types/game';
import type { GameState } from '@/types/game';
import PlayerManager from '@/state/PlayerManager';
import { spendStrategicResource } from '@/lib/territorialResourcesSystem';
import { OperationModal, type OperationAction } from '@/components/modals/OperationModal';
import { IntelReportContent } from '@/components/modals/IntelReportContent';

export interface IntelHandlerDependencies {
  S: GameState;
  nations: Nation[];
  targetableNations: Nation[];
  AudioSys: { playSFX: (sound: string) => void; handleDefconTransition?: (defcon: number) => void };
  log: (message: string, level?: string) => void;
  openModal: (title: string, content: ReactNode) => void;
  closeModal: () => void;
  updateDisplay: () => void;
  consumeAction: () => void;
  getBuildContext: (context: string) => Nation | null;
  requestApproval: (action: string, options?: { description?: string }) => Promise<boolean>;
  getCyberActionAvailability: (nationId: string, action: string) => {
    canExecute: boolean;
    reason?: string;
    cost: number
  };
  launchCyberAttack: (attackerId: string, targetId: string) => { executed: boolean };
  hardenCyberNetworks: (nationId: string) => { executed: boolean };
  launchCyberFalseFlag: (attackerId: string, targetId: string) => { executed: boolean };
  registerSatelliteOrbit: (nationId: string, targetId: string) => void;
  adjustThreat: (nation: Nation, againstId: string, amount: number) => void;
  handleDefconChange: (
    delta: number,
    reason: string,
    source: string,
    handlers: {
      onAudioTransition?: (defcon: number) => void;
      onLog?: (msg: string, level?: string) => void;
      onNewsItem?: (type: string, message: string, severity?: string) => void;
      onUpdateDisplay?: () => void;
      onShowModal?: (event: any) => void;
    }
  ) => void;
  addNewsItem: (type: string, message: string, severity?: string) => void;
  setDefconChangeEvent: (event: any) => void;
  isEligibleEnemyTarget: (commander: Nation, nation: Nation) => boolean;
}

/**
 * Handles intelligence operations including satellites, cyber warfare, sabotage, and propaganda
 */
export async function handleIntelExtracted(deps: IntelHandlerDependencies): Promise<void> {
  const {
    S,
    nations,
    targetableNations,
    AudioSys,
    log,
    openModal,
    closeModal,
    updateDisplay,
    consumeAction,
    getBuildContext,
    requestApproval,
    getCyberActionAvailability,
    launchCyberAttack,
    hardenCyberNetworks,
    launchCyberFalseFlag,
    registerSatelliteOrbit,
    adjustThreat,
    handleDefconChange,
    addNewsItem,
    setDefconChangeEvent,
    isEligibleEnemyTarget,
  } = deps;

  const approved = await requestApproval('INTEL', { description: 'Intelligence operations authorization' });
  if (!approved) return;
  AudioSys.playSFX('click');
  const player = getBuildContext('Intelligence');
  if (!player) return;

  const cyberAttackAvailability = getCyberActionAvailability(player.id, 'intrusion');
  const cyberDefenseAvailability = getCyberActionAvailability(player.id, 'fortify');
  const cyberFalseFlagAvailability = getCyberActionAvailability(player.id, 'false_flag');

  const cyberActions: OperationAction[] = [
    {
      id: 'cyber_attack',
      title: 'CYBER INTRUSION',
      subtitle: 'Drain enemy readiness & intel',
      costText: `Cost: ${cyberAttackAvailability.cost} CYBER`,
      requiresTarget: true,
      disabled: !cyberAttackAvailability.canExecute,
      disabledReason: cyberAttackAvailability.reason,
      targetFilter: (nation, commander) => isEligibleEnemyTarget(commander, nation),
    },
    {
      id: 'cyber_defend',
      title: 'HARDEN NETWORKS',
      subtitle: 'Restore readiness reserves',
      costText: `Cost: ${cyberDefenseAvailability.cost} CYBER`,
      disabled: !cyberDefenseAvailability.canExecute,
      disabledReason: cyberDefenseAvailability.reason,
    },
    {
      id: 'cyber_false_flag',
      title: 'FALSE FLAG BREACH',
      subtitle: 'Frame a rival for aggression',
      costText: `Cost: ${cyberFalseFlagAvailability.cost} CYBER`,
      requiresTarget: true,
      disabled: !cyberFalseFlagAvailability.canExecute,
      disabledReason: cyberFalseFlagAvailability.reason,
      description: 'Stage an intrusion that points forensic evidence toward another rival.',
      targetFilter: (nation, commander) => isEligibleEnemyTarget(commander, nation),
    },
  ];

  const intelActions: OperationAction[] = [
    ...cyberActions,
    {
      id: 'satellite',
      title: 'DEPLOY SATELLITE',
      subtitle: 'Reveal enemy arsenal',
      costText: 'Cost: 5 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 5,
      disabledReason: 'Requires 5 INTEL to deploy a satellite.',
    },
    ...(player.hasASATCapability ? [{
      id: 'asat_strike' as const,
      title: 'ASAT STRIKE',
      subtitle: 'Destroy enemy satellite',
      costText: 'Cost: 15 INTEL + 5 URANIUM',
      requiresTarget: true,
      disabled: (player.intel || 0) < 15 || (player.uranium || 0) < 5,
      disabledReason: 'Requires 15 INTEL and 5 URANIUM to launch ASAT weapon.',
      targetFilter: (nation: Nation) => nation.satellites && Object.keys(nation.satellites).length > 0,
    }] : []),
    ...(((player.orbitalStrikesAvailable || 0) > 0) ? [{
      id: 'orbital_strike' as const,
      title: 'ORBITAL STRIKE',
      subtitle: `Kinetic bombardment (${player.orbitalStrikesAvailable} left)`,
      costText: 'Cost: 50 INTEL + 30 URANIUM',
      requiresTarget: true,
      disabled: (player.intel || 0) < 50 || (player.uranium || 0) < 30,
      disabledReason: 'Requires 50 INTEL and 30 URANIUM for orbital strike.',
    }] : []),
    {
      id: 'sabotage',
      title: 'SABOTAGE',
      subtitle: 'Destroy enemy warhead',
      costText: 'Cost: 10 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 10,
      disabledReason: 'Requires 10 INTEL to mount sabotage.',
      targetFilter: nation => Object.values(nation.warheads || {}).some(count => (count || 0) > 0),
    },
    {
      id: 'propaganda',
      title: 'PROPAGANDA',
      subtitle: 'Stoke enemy unrest',
      costText: 'Cost: 15 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 15,
      disabledReason: 'Requires 15 INTEL to conduct propaganda.',
    },
    {
      id: 'culture_bomb',
      title: 'CULTURE BOMB',
      subtitle: 'Steal 10% population',
      costText: (() => {
        const baseCost = 20;
        const reduction = player.cultureBombCostReduction || 0;
        const actualCost = Math.ceil(baseCost * (1 - reduction));
        return `Cost: ${actualCost} INTEL${reduction > 0 ? ` (-${Math.floor(reduction * 100)}%)` : ''}`;
      })(),
      requiresTarget: true,
      disabled: (() => {
        const baseCost = 20;
        const reduction = player.cultureBombCostReduction || 0;
        const actualCost = Math.ceil(baseCost * (1 - reduction));
        return (player.intel || 0) < actualCost;
      })(),
      disabledReason: (() => {
        const baseCost = 20;
        const reduction = player.cultureBombCostReduction || 0;
        const actualCost = Math.ceil(baseCost * (1 - reduction));
        return `Requires ${actualCost} INTEL to deploy a culture bomb.`;
      })(),
      targetFilter: nation => nation.population > 5,
    },
    {
      id: 'view',
      title: 'VIEW INTELLIGENCE',
      subtitle: 'Review surveillance reports',
      description: 'Displays detailed data for nations under satellite coverage.',
    },
    {
      id: 'deep',
      title: 'DEEP RECON',
      subtitle: 'Reveal tech and doctrine',
      costText: 'Cost: 30 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 30,
      disabledReason: 'Requires 30 INTEL to run deep reconnaissance.',
    },
    {
      id: 'cover',
      title: 'COVER OPS',
      subtitle: 'Hide your assets for 3 turns',
      costText: 'Cost: 25 INTEL',
      disabled: (player.intel || 0) < 25,
      disabledReason: 'Requires 25 INTEL to mask your forces.',
    }
  ];

  const executeIntelAction = (action: OperationAction, target?: Nation) => {
    const commander = PlayerManager.get();
    if (!commander) {
      toast({ title: 'No command authority', description: 'Player nation could not be located.' });
      return false;
    }

    switch (action.id) {
      case 'cyber_attack': {
        if (!target) return false;
        const outcome = launchCyberAttack(commander.id, target.id);
        if (!outcome.executed) {
          return false;
        }
        updateDisplay();
        consumeAction();
        return true;
      }

      case 'cyber_defend': {
        const outcome = hardenCyberNetworks(commander.id);
        if (!outcome.executed) {
          return false;
        }
        updateDisplay();
        consumeAction();
        return true;
      }

      case 'cyber_false_flag': {
        if (!target) return false;
        const outcome = launchCyberFalseFlag(commander.id, target.id);
        if (!outcome.executed) {
          return false;
        }
        updateDisplay();
        consumeAction();
        return true;
      }

      case 'view':
        openModal('INTELLIGENCE REPORT', <IntelReportContent player={commander} nations={nations} onClose={closeModal} />);
        return false;

      case 'satellite':
        if (!target) return false;
        if ((commander.intel || 0) < 5) {
          toast({ title: 'Insufficient intel', description: 'You need 5 INTEL to deploy a satellite.' });
          return false;
        }
        {
          // Check satellite limit (only count non-expired satellites)
          const maxSats = commander.maxSatellites || 3;
          const currentSats = Object.keys(commander.satellites || {}).filter(id => {
            const expiresAt = commander.satellites?.[id];
            return expiresAt && S.turn < expiresAt;
          }).length;
          if (currentSats >= maxSats) {
            toast({ title: 'Satellite limit reached', description: `Maximum ${maxSats} satellites deployed. Research Advanced Satellite Network for more slots.` });
            return false;
          }

          commander.intel -= 5;
          commander.satellites = commander.satellites || {};
          commander.satellites[target.id] = S.turn + 5; // Expires after 5 turns
          log(`Satellite deployed over ${target.name}`);
          registerSatelliteOrbit(commander.id, target.id);
        }
        updateDisplay();
        consumeAction();
        return true;

      case 'asat_strike':
        if (!target) return false;
        {
          const availableUranium = commander.resourceStockpile?.uranium ?? commander.uranium ?? 0;
          if ((commander.intel || 0) < 15 || availableUranium < 5) {
            toast({ title: 'Insufficient resources', description: 'You need 15 INTEL and 5 URANIUM for ASAT strike.' });
            return false;
          }
        }
        {
          // Only count non-expired satellites
          const targetSatellites = Object.keys(target.satellites || {}).filter(id => {
            const expiresAt = target.satellites?.[id];
            return expiresAt && S.turn < expiresAt;
          });
          if (targetSatellites.length === 0) {
            toast({ title: 'No satellites', description: `${target.name} has no satellites to destroy.` });
            return false;
          }
          // Destroy a random satellite
          const randomSat = targetSatellites[Math.floor(Math.random() * targetSatellites.length)];
          if (target.satellites) {
            delete target.satellites[randomSat];
          }
          commander.intel -= 15;
          spendStrategicResource(commander, 'uranium', 5);
          log(`ASAT strike destroys ${target.name}'s satellite!`, 'alert');
          adjustThreat(target, commander.id, 15);
        }
        updateDisplay();
        consumeAction();
        return true;

      case 'orbital_strike':
        if (!target) return false;
        {
          const availableUranium = commander.resourceStockpile?.uranium ?? commander.uranium ?? 0;
          if ((commander.intel || 0) < 50 || availableUranium < 30) {
            toast({ title: 'Insufficient resources', description: 'You need 50 INTEL and 30 URANIUM for orbital strike.' });
            return false;
          }
        }
        if ((commander.orbitalStrikesAvailable || 0) <= 0) {
          toast({ title: 'No strikes available', description: 'No orbital strikes remaining.' });
          return false;
        }
        {
          // Orbital strike: massive damage
          const popLoss = Math.floor(target.population * 0.15);
          const prodLoss = Math.floor((target.production || 0) * 0.20);
          const warheadTypes = Object.keys(target.warheads || {});
          const warheadsDestroyed = Math.min(3, warheadTypes.length);

          target.population = Math.max(0, target.population - popLoss);
          target.production = Math.max(0, (target.production || 0) - prodLoss);

          // Destroy random warheads
          for (let i = 0; i < warheadsDestroyed; i++) {
            if (warheadTypes.length > 0) {
              const idx = Math.floor(Math.random() * warheadTypes.length);
              const type = Number(warheadTypes[idx]);
              if (target.warheads && target.warheads[type]) {
                target.warheads[type] = Math.max(0, target.warheads[type] - 1);
                if (target.warheads[type] <= 0) {
                  delete target.warheads[type];
                }
              }
              warheadTypes.splice(idx, 1);
            }
          }

          commander.intel -= 50;
          spendStrategicResource(commander, 'uranium', 30);
          commander.orbitalStrikesAvailable = (commander.orbitalStrikesAvailable || 1) - 1;

          // Mark as aggressive action
          commander.lastAggressiveAction = S.turn;

          log(`☄️ ORBITAL STRIKE devastates ${target.name}: ${popLoss}M casualties, ${warheadsDestroyed} warheads destroyed!`, 'alert');
          adjustThreat(target, commander.id, 35);
          handleDefconChange(-1, `Orbital strike against ${target.name} escalates global tensions`, 'player', {
            onAudioTransition: AudioSys.handleDefconTransition,
            onLog: log,
            onNewsItem: addNewsItem,
            onUpdateDisplay: updateDisplay,
            onShowModal: setDefconChangeEvent,
          });
        }
        updateDisplay();
        consumeAction();
        return true;

      case 'sabotage':
        if (!target) return false;
        if ((commander.intel || 0) < 10) {
          toast({ title: 'Insufficient intel', description: 'You need 10 INTEL for sabotage operations.' });
          return false;
        }
        {
          const warheadTypes = Object.keys(target.warheads || {}).filter(key => (target.warheads?.[Number(key)] || 0) > 0);
          if (warheadTypes.length === 0) {
            toast({ title: 'No targets', description: `${target.name} has no active warheads to sabotage.` });
            return false;
          }
          const type = warheadTypes[Math.floor(Math.random() * warheadTypes.length)];
          const numericType = Number(type);
          if (target.warheads) {
            target.warheads[numericType] = Math.max(0, (target.warheads[numericType] || 0) - 1);
            if (target.warheads[numericType] <= 0) {
              delete target.warheads[numericType];
            }
          }
          commander.intel -= 10;

          // Apply sabotage detection reduction from Deep Cover Operations tech
          const baseDetectionChance = 0.40;
          const detectionReduction = commander.sabotageDetectionReduction || 0;
          const actualDetectionChance = Math.max(0.05, baseDetectionChance - detectionReduction);

          if (Math.random() < actualDetectionChance) {
            log(`Sabotage successful: ${target.name}'s ${type}MT warhead destroyed (DETECTED).`, 'warning');
            adjustThreat(target, commander.id, 20);
          } else {
            log(`Sabotage successful: ${target.name}'s ${type}MT warhead destroyed.`);
          }
        }
        updateDisplay();
        consumeAction();
        return true;

      case 'propaganda':
        if (!target) return false;
        if ((commander.intel || 0) < 15) {
          toast({ title: 'Insufficient intel', description: 'You need 15 INTEL for propaganda operations.' });
          return false;
        }
        {
          commander.intel -= 15;

          // Apply propaganda effectiveness bonus from Propaganda Mastery tech
          const baseInstability = 20;
          const effectiveness = commander.memeWaveEffectiveness || 1.0;
          const actualInstability = Math.floor(baseInstability * effectiveness);

          target.instability = (target.instability || 0) + actualInstability;
          log(`Propaganda campaign spikes instability in ${target.name} (+${actualInstability}).`);
        }
        updateDisplay();
        consumeAction();
        return true;

      case 'culture_bomb':
        if (!target) return false;
        {
          // Apply culture bomb cost reduction from tech
          const baseCost = 20;
          const costReduction = commander.cultureBombCostReduction || 0;
          const actualCost = Math.ceil(baseCost * (1 - costReduction));

          if ((commander.intel || 0) < actualCost) {
            toast({ title: 'Insufficient intel', description: `You need ${actualCost} INTEL for a culture bomb.` });
            return false;
          }

          // Apply stolen pop conversion rate bonus
          const baseStolen = Math.floor(target.population * 0.1);
          const conversionRate = commander.stolenPopConversionRate || 1.0;
          const stolen = Math.max(1, Math.floor(baseStolen * conversionRate));

          commander.intel -= actualCost;
          target.population = Math.max(0, target.population - stolen);
          commander.population += stolen;
          commander.migrantsThisTurn = (commander.migrantsThisTurn || 0) + stolen;
          commander.migrantsTotal = (commander.migrantsTotal || 0) + stolen;
          log(`Culture bomb siphons ${stolen}M population from ${target.name}.`);
        }
        updateDisplay();
        consumeAction();
        return true;

      case 'deep':
        if (!target) return false;
        if ((commander.intel || 0) < 30) {
          toast({ title: 'Insufficient intel', description: 'You need 30 INTEL for deep reconnaissance.' });
          return false;
        }
        commander.intel -= 30;
        commander.satellites = commander.satellites || {};
        commander.satellites[target.id] = S.turn + 5; // Expires after 5 turns
        commander.deepRecon = commander.deepRecon || {};
        commander.deepRecon[target.id] = (commander.deepRecon[target.id] || 0) + 3;
        log(`Deep recon initiated over ${target.name}. Detailed intel for 3 turns.`);
        registerSatelliteOrbit(commander.id, target.id);
        updateDisplay();
        consumeAction();
        return true;

      case 'cover':
        if ((commander.intel || 0) < 25) {
          toast({ title: 'Insufficient intel', description: 'You need 25 INTEL to initiate cover operations.' });
          return false;
        }
        commander.intel -= 25;
        commander.coverOpsTurns = (commander.coverOpsTurns || 0) + 3;
        log('Cover operations active: your forces are hidden for 3 turns.');
        updateDisplay();
        consumeAction();
        return true;
    }

    return false;
  };

  openModal(
    'INTELLIGENCE OPS',
    <OperationModal
      actions={intelActions}
      player={player}
      targetableNations={targetableNations}
      onExecute={executeIntelAction}
      onClose={closeModal}
      accent="cyan"
    />
  );
}
