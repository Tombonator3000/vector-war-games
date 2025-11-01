import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { MultiplayerProvider, useMultiplayer } from '@/contexts/MultiplayerProvider';
import type { MultiplayerSharedState } from '@/types/game';

vi.mock('@/integrations/supabase/client', () => {
  const getSession = vi.fn(async () => ({ data: { session: { id: 'session-id' } } }));
  const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
  return {
    supabase: {
      auth: {
        getSession,
        onAuthStateChange,
      },
    },
    isSupabaseFallback: false,
  };
});

type MultiplayerRole = 'STRATEGIST' | 'TACTICIAN';
type MultiplayerPresenceState = { id: string; ready?: boolean; lastSeen: string; role?: MultiplayerRole };
type MultiplayerStateEnvelope = { sessionId: string; actorId: string; version: number; timestamp: string; state: MultiplayerSharedState };
type MultiplayerApprovalRequest = { id: string; sessionId: string; actorId: string; action: string; payload?: Record<string, unknown>; requestedAt: string; description?: string };
type MultiplayerApprovalResponse = { id: string; sessionId: string; actorId: string; approved: boolean; respondedAt: string; notes?: string };

type TransportEvent =
  | { type: 'state'; payload: MultiplayerStateEnvelope }
  | { type: 'approval-request'; payload: MultiplayerApprovalRequest }
  | { type: 'approval-response'; payload: MultiplayerApprovalResponse };

type PresenceListener = (presence: Record<string, MultiplayerPresenceState>) => void;

const listeners: Set<(event: TransportEvent) => void> = new Set();
const presenceListeners: Set<PresenceListener> = new Set();
const presence: Record<string, MultiplayerPresenceState> = {};
const version = 0;
type MockControls = {
  setPresence: (next: Record<string, MultiplayerPresenceState>) => void;
  emitEvent: (event: TransportEvent) => void;
  reset: () => void;
  instances: Array<{
    join: ReturnType<typeof vi.fn>;
    sendApprovalRequest: ReturnType<typeof vi.fn>;
    sendApprovalResponse: ReturnType<typeof vi.fn>;
    broadcastState: ReturnType<typeof vi.fn>;
    updatePresence: ReturnType<typeof vi.fn>;
    getVersion: () => number;
  }>;
};

vi.mock('@/integrations/multiplayer/service', () => {
  let versionLocal = 0;
  let presenceLocal: Record<string, MultiplayerPresenceState> = {};
  const listenersLocal: Set<(event: TransportEvent) => void> = new Set();
  const presenceListenersLocal: Set<PresenceListener> = new Set();
  const instancesLocal: any[] = [];

  const emitEventLocal = (event: TransportEvent) => {
    listenersLocal.forEach(listener => listener(event));
  };

  const emitPresenceLocal = () => {
    presenceListenersLocal.forEach(listener => listener(presenceLocal));
  };

  class MockTransport {
    join = vi.fn(async () => {});
    leave = vi.fn(async () => {});
    getVersion = vi.fn(() => versionLocal);
    getClientId = vi.fn(() => 'client-1');
    onEvent = vi.fn((listener: (event: TransportEvent) => void) => {
      listenersLocal.add(listener);
      return () => listenersLocal.delete(listener);
    });
    onPresence = vi.fn((listener: PresenceListener) => {
      presenceListenersLocal.add(listener);
      listener(presenceLocal);
      return () => presenceListenersLocal.delete(listener);
    });
    broadcastState = vi.fn(async (state: MultiplayerSharedState) => {
      versionLocal += 1;
      emitEventLocal({
        type: 'state',
        payload: {
          sessionId: 'session',
          actorId: 'client-1',
          version: versionLocal,
          timestamp: new Date().toISOString(),
          state,
        },
      });
    });
    sendApprovalRequest = vi.fn(async (request: MultiplayerApprovalRequest) => {
      emitEventLocal({ type: 'approval-request', payload: request });
    });
    sendApprovalResponse = vi.fn(async (response: MultiplayerApprovalResponse) => {
      emitEventLocal({ type: 'approval-response', payload: response });
    });
    updatePresence = vi.fn(async (meta: Partial<MultiplayerPresenceState>) => {
      presenceLocal = {
        ...presenceLocal,
        'client-1': {
          ...(presenceLocal['client-1'] ?? { id: 'client-1', lastSeen: new Date().toISOString() }),
          ...meta,
          id: 'client-1',
          lastSeen: new Date().toISOString(),
        },
      };
      emitPresenceLocal();
    });

    constructor() {
      instancesLocal.push(this);
    }
  }

  const setPresenceLocal = (next: Record<string, MultiplayerPresenceState>) => {
    presenceLocal = next;
    emitPresenceLocal();
  };

  const resetLocal = () => {
    listenersLocal.clear();
    presenceListenersLocal.clear();
    presenceLocal = {};
    versionLocal = 0;
    instancesLocal.splice(0, instancesLocal.length);
  };

  return {
    MultiplayerTransport: MockTransport,
    __mockControls: {
      setPresence: setPresenceLocal,
      emitEvent: emitEventLocal,
      reset: resetLocal,
      instances: instancesLocal,
    } as MockControls,
  };
});

let controls: MockControls = {
  reset: () => {},
  setPresence: () => {},
  emitEvent: () => {},
  instances: [],
};

describe('MultiplayerProvider', () => {
  beforeAll(async () => {
    const module = await import('@/integrations/multiplayer/service') as any;
    controls = module.__mockControls as MockControls;
  });

  beforeEach(() => {
    controls.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    controls.reset();
  });

  const Harness = ({ onReady }: { onReady: (ctx: ReturnType<typeof useMultiplayer>) => void }) => {
    const ctx = useMultiplayer();
    useEffect(() => {
      onReady(ctx);
    }, [ctx, onReady]);
    return null;
  };

  const renderWithProvider = async () => {
    const onReady = vi.fn();
    render(
      <MultiplayerProvider>
        <Harness onReady={onReady} />
      </MultiplayerProvider>
    );
    let ctx: ReturnType<typeof useMultiplayer> | null = null;
    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
      const lastCall = onReady.mock.calls[onReady.mock.calls.length - 1];
      ctx = lastCall[0];
    });
    return ctx!;
  };

  it('permits authorized roles to execute actions without approval', async () => {
    controls.setPresence({
      'client-1': { id: 'client-1', lastSeen: new Date().toISOString() },
    });
    const ctx = await renderWithProvider();
    const result = await ctx.ensureAction('BUILD');
    expect(result).toBe(true);
    expect(controls.instances[0].sendApprovalRequest).not.toHaveBeenCalled();
  });

  it('requests approval and resolves once approved by co-commander', async () => {
    controls.setPresence({
      'client-0': { id: 'client-0', lastSeen: new Date().toISOString() },
      'client-1': { id: 'client-1', lastSeen: new Date().toISOString() },
    });
    const ctx = await renderWithProvider();
    const approvalPromise = ctx.ensureAction('BUILD');
    await waitFor(() => {
      expect(controls.instances[0].sendApprovalRequest).toHaveBeenCalled();
    });
    const request = controls.instances[0].sendApprovalRequest.mock.calls[0][0] as MultiplayerApprovalRequest;
    await act(async () => {
      controls.emitEvent({
        type: 'approval-response',
        payload: {
          id: request.id,
          sessionId: request.sessionId,
          actorId: 'client-0',
          approved: true,
          respondedAt: new Date().toISOString(),
        },
      });
    });
    await expect(approvalPromise).resolves.toBe(true);
  });

  it('broadcasts and receives synchronized state payloads', async () => {
    controls.setPresence({
      'client-1': { id: 'client-1', lastSeen: new Date().toISOString() },
    });
    const ctx = await renderWithProvider();
    const sampleState: MultiplayerSharedState = {
      gameState: { turn: 1, defcon: 5, phase: 'PLAYER', actionsRemaining: 1, paused: false, gameOver: false, selectedLeader: null, selectedDoctrine: null, missiles: [], bombers: [], explosions: [], particles: [], radiationZones: [], empEffects: [], rings: [], screenShake: 0 },
      nations: [],
      conventionalDeltas: [],
    };
    await ctx.publishState(sampleState);
    expect(controls.instances[0].broadcastState).toHaveBeenCalledWith(sampleState, expect.any(Number));

    const updates: MultiplayerSharedState[] = [];
    const unsubscribe = ctx.registerStateListener(envelope => {
      updates.push(envelope.state);
    });
    await act(async () => {
      controls.emitEvent({
        type: 'state',
        payload: {
          sessionId: 'session',
          actorId: 'client-0',
          version: 2,
          timestamp: new Date().toISOString(),
          state: sampleState,
        },
      });
    });
    unsubscribe();
    await waitFor(() => {
      expect(updates.length).toBeGreaterThan(0);
    });
  });
});
