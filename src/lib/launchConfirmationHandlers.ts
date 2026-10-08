/** Final launch confirmation, with current-state validation and one-use previews. */
import type { GameState, Nation } from '@/types/game';
import type { ActionConsequences, ConsequenceCalculationContext } from '@/types/consequences';
import type { PendingLaunchState } from '@/lib/attackHandlers';
import type { LaunchDependencies } from '@/lib/gamePhaseHandlers';
import PlayerManager from '@/state/PlayerManager';
import GameStateManager from '@/state/GameStateManager';
import DoomsdayClock from '@/state/DoomsdayClock';
import { calculateActionConsequences } from '@/lib/consequenceCalculator';
import { launch } from '@/lib/gamePhaseHandlers';
import { launchBomber, launchSubmarine } from '@/lib/nuclearLaunchHandlers';
import { validateLaunch } from '@/lib/launchValidation';

export type DeliveryMethod = 'missile' | 'bomber' | 'submarine';

export interface LaunchConfirmationDeps {
  pendingLaunch: PendingLaunchState | null;
  selectedWarheadYield: number | null;
  selectedDeliveryMethod: DeliveryMethod | null;
  toast: (payload: { title: string; description: string; variant?: 'destructive' }) => void;
  resetLaunchControl: () => void;
  gameState: GameState;
  log: (message: string, tone?: string) => void;
  triggerConsequenceAlerts: (consequences: ActionConsequences) => void;
  consumeAction: () => void;
  queueConsequencePreview: (consequences: ActionConsequences, callback: () => void) => boolean;
  setConsequencePreview: (consequences: ActionConsequences | null) => void;
  setConsequenceCallback: (callback: (() => void) | null) => void;
  playSFX: (sound: string) => void;
  launchDeps: LaunchDependencies;
}

interface StrikeOrder {
  targetId: string;
  playerId: string;
  yieldMT: number;
  deliveryMethod: DeliveryMethod;
  state: GameState;
  turn: number;
  sessionVersion: number;
}

interface ValidatedStrike {
  state: GameState;
  player: Nation;
  target: Nation;
  nations: Nation[];
}

function rejectOrder(deps: LaunchConfirmationDeps, description: string): null {
  deps.toast({ title: 'Cannot launch', description });
  deps.resetLaunchControl();
  return null;
}

/** Re-resolve nations so a preview cannot target objects replaced by a state update. */
function validateOrder(order: StrikeOrder, deps: LaunchConfirmationDeps): ValidatedStrike | null {
  const state = GameStateManager.getState();
  const player = PlayerManager.get();
  const nations = GameStateManager.getNations();
  const target = nations.find(nation => nation.id === order.targetId);
  if (state !== order.state || state.turn !== order.turn || player?.id !== order.playerId ||
      GameStateManager.getSessionVersion() !== order.sessionVersion) {
    return rejectOrder(deps, 'This strike order has expired. Prepare a new strike.');
  }
  if (state.gameOver || state.phase !== 'PLAYER' || state.actionsRemaining <= 0) {
    return rejectOrder(deps, 'Strikes require an available action during your active turn.');
  }
  if (!player || player.population <= 0 || player.eliminated || !target || target.eliminated) {
    return rejectOrder(deps, 'The attacking nation or target is no longer available.');
  }
  if (!deps.launchDeps) {
    return rejectOrder(deps, 'The launch system is unavailable. Prepare a new strike.');
  }
  const validation = validateLaunch({
    from: player,
    to: target,
    yieldMT: order.yieldMT,
    defcon: state.defcon,
    warheadYieldToId: deps.launchDeps.WARHEAD_YIELD_TO_ID,
    researchLookup: deps.launchDeps.RESEARCH_LOOKUP,
    deliveryMethod: order.deliveryMethod,
  });
  if (!validation.valid) {
    return rejectOrder(deps, validation.errorMessage ?? 'The selected strike is no longer valid.');
  }
  return { state, player, target, nations };
}

/** Failed helpers must not consume inventory or leave a strike queued for animation. */
function captureLaunchState(player: Nation, state: GameState): () => void {
  const inventory = {
    warheads: { ...player.warheads },
    missiles: player.missiles,
    bombers: player.bombers,
    submarines: player.submarines,
    lastAggressiveAction: player.lastAggressiveAction,
  };
  const missiles = [...state.missiles];
  const bombers = [...state.bombers];
  const submarines = [...(state.submarines ?? [])];
  const statistics = state.statistics ? { ...state.statistics } : undefined;
  return () => {
    Object.assign(player, inventory);
    state.missiles = missiles;
    state.bombers = bombers;
    state.submarines = submarines;
    state.statistics = statistics;
  };
}

function dispatchStrike(order: StrikeOrder, strike: ValidatedStrike, deps: LaunchConfirmationDeps): boolean {
  const { player, target, state, nations } = strike;
  const launchDeps = { ...deps.launchDeps, S: state, nations };
  if (order.deliveryMethod === 'missile') {
    return launch(player, target, order.yieldMT, launchDeps);
  }
  const succeeded = order.deliveryMethod === 'bomber'
    ? launchBomber(player, target, { yield: order.yieldMT }, launchDeps)
    : launchSubmarine(player, target, order.yieldMT, launchDeps);
  if (!succeeded) return false;
  const remaining = player.warheads[order.yieldMT] - 1;
  if (remaining <= 0) delete player.warheads[order.yieldMT];
  else player.warheads[order.yieldMT] = remaining;
  if (order.deliveryMethod === 'bomber') player.bombers = (player.bombers ?? 0) - 1;
  else player.submarines = (player.submarines ?? 0) - 1;
  player.lastAggressiveAction = state.turn;
  return true;
}

function executeStrike(order: StrikeOrder, consequences: ActionConsequences, deps: LaunchConfirmationDeps): void {
  const strike = validateOrder(order, deps);
  if (!strike) return;
  const rollback = captureLaunchState(strike.player, strike.state);
  let succeeded = false;
  try {
    succeeded = dispatchStrike(order, strike, deps);
  } catch (error) {
    console.error('[Launch Confirmation] Strike failed:', error);
  }
  if (!succeeded) {
    rollback();
    rejectOrder(deps, 'The strike could not be launched. Your inventory has been preserved.');
    return;
  }
  // Commit the action before optional presentation effects can throw or re-enter.
  deps.consumeAction();
  deps.resetLaunchControl();
  if (order.deliveryMethod !== 'missile') {
    deps.log(`${strike.player.name} launches ${order.deliveryMethod} strike (${order.yieldMT}MT) toward ${strike.target.name}`);
    DoomsdayClock.tick(0.3);
    if (order.deliveryMethod === 'bomber') deps.playSFX('launch');
  }
  deps.triggerConsequenceAlerts(consequences);
}

function prepareOrder(deps: LaunchConfirmationDeps): StrikeOrder | null {
  const { pendingLaunch, selectedWarheadYield, selectedDeliveryMethod } = deps;
  if (!pendingLaunch || selectedWarheadYield === null || !selectedDeliveryMethod) return null;
  if (!pendingLaunch.warheads.some(warhead => warhead.yield === selectedWarheadYield)) {
    return rejectOrder(deps, 'Select a valid warhead yield before launching.');
  }
  const player = PlayerManager.get();
  if (!player) return rejectOrder(deps, 'Your nation is no longer available.');
  return {
    targetId: pendingLaunch.target.id,
    playerId: player.id,
    yieldMT: selectedWarheadYield,
    deliveryMethod: selectedDeliveryMethod,
    state: deps.gameState,
    turn: deps.gameState.turn,
    sessionVersion: GameStateManager.getSessionVersion(),
  };
}

export function confirmPendingLaunch(deps: LaunchConfirmationDeps): void {
  const order = prepareOrder(deps);
  if (!order) return;
  const strike = validateOrder(order, deps);
  if (!strike) return;
  const context: ConsequenceCalculationContext = {
    playerNation: strike.player,
    targetNation: strike.target,
    allNations: strike.nations,
    currentDefcon: strike.state.defcon,
    currentTurn: strike.state.turn,
    gameState: strike.state,
  };
  const consequences = calculateActionConsequences('launch_missile', context, {
    warheadYield: order.yieldMT,
    deliveryMethod: order.deliveryMethod,
  });
  if (!consequences) {
    deps.toast({ title: 'Unable to analyze strike', description: 'Consequence system failed to respond.', variant: 'destructive' });
    return;
  }
  let executed = false;
  const onConfirm = () => {
    if (executed) return;
    executed = true;
    executeStrike(order, consequences, deps);
  };
  if (!deps.queueConsequencePreview(consequences, onConfirm)) {
    deps.setConsequencePreview(consequences);
    deps.setConsequenceCallback(() => onConfirm);
  }
}
