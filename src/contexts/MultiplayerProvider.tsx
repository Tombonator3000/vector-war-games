import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase, isSupabaseFallback } from '@/integrations/supabase/client';
import { MultiplayerTransport, type MultiplayerPresenceState, type MultiplayerStateEnvelope, type MultiplayerApprovalRequest, type MultiplayerApprovalResponse, type MultiplayerRole } from '@/integrations/multiplayer/service';
import type { MultiplayerActionType, MultiplayerSharedState } from '@/types/game';

/**
 * Feature flag to enable/disable multiplayer functionality globally.
 * Set to false to disable all multiplayer features, popups, and connection attempts.
 * The code is preserved for future use - just set this to true to re-enable.
 */
export let MULTIPLAYER_ENABLED = false;

/** Override the multiplayer feature flag (for testing) */
export function setMultiplayerEnabled(enabled: boolean): void {
  MULTIPLAYER_ENABLED = enabled;
}

const ROLE_PERMISSIONS: Record<MultiplayerRole, Set<MultiplayerActionType>> = {
  STRATEGIST: new Set(['BUILD', 'RESEARCH', 'DIPLOMACY', 'PRODUCTION', 'BIOWARFARE']),
  TACTICIAN: new Set(['INTEL', 'CULTURE', 'IMMIGRATION', 'PRODUCTION', 'BIOWARFARE']),
};

const SESSION_STORAGE_KEY = 'norad_coop_session_id';

type ConnectionState = 'idle' | 'connecting' | 'ready' | 'error' | 'unavailable';

let supabaseAnonUnavailable = false;

type MultiplayerApproval = {
  request: MultiplayerApprovalRequest;
  status: 'pending' | 'approved' | 'rejected';
  actorId: string;
};

type MultiplayerPlayer = MultiplayerPresenceState & { isSelf: boolean; role: MultiplayerRole };

type StateListener = (envelope: MultiplayerStateEnvelope) => void;

type EnsureActionOptions = {
  description?: string;
  payload?: Record<string, unknown>;
};

type MultiplayerContextValue = {
  sessionId: string;
  connection: ConnectionState;
  role: MultiplayerRole | null;
  players: MultiplayerPlayer[];
  ready: boolean;
  setReady: (ready: boolean) => Promise<void>;
  canExecute: (action: MultiplayerActionType) => boolean;
  ensureAction: (action: MultiplayerActionType, options?: EnsureActionOptions) => Promise<boolean>;
  publishState: (state: MultiplayerSharedState) => Promise<void>;
  registerStateListener: (listener: StateListener) => () => void;
  approvals: MultiplayerApproval[];
  respondToApproval: (id: string, approved: boolean) => Promise<void>;
  conflict: { expected: number; actual: number; at: string } | null;
  clearConflict: () => void;
};

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const ensureAnonSession = async () => {
  if (isSupabaseFallback) {
    return null;
  }

  if (supabaseAnonUnavailable) {
    throw new Error('anon-auth-unavailable');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('[multiplayer] session lookup failed', error);
  }
  if (data.session) {
    return data.session.access_token;
  }

  const authClient: typeof supabase.auth & {
    signInAnonymously?: () => Promise<{ error?: unknown }>;
  } = supabase.auth as never;

  if (typeof authClient.signInAnonymously !== 'function') {
    supabaseAnonUnavailable = true;
    throw new Error('anon-auth-unavailable');
  }

  try {
    const result = await authClient.signInAnonymously();
    if (result && 'error' in result && result.error) {
      console.warn('[multiplayer] anonymous sign-in failed', result.error);
      supabaseAnonUnavailable = true;
      throw new Error('anon-auth-unavailable');
    }
  } catch (err) {
    console.warn('[multiplayer] anonymous sign-in threw', err);
    supabaseAnonUnavailable = true;
    throw new Error('anon-auth-unavailable');
  }

  const refreshed = await supabase.auth.getSession();
  if (refreshed.error) {
    console.warn('[multiplayer] session refresh failed', refreshed.error);
    return refreshed.data.session?.access_token ?? null;
  }

  if (!refreshed.data.session) {
    supabaseAnonUnavailable = true;
    throw new Error('anon-auth-unavailable');
  }

  return refreshed.data.session.access_token;
};

const resolveRole = (selfId: string, peers: Record<string, MultiplayerPresenceState>): MultiplayerRole | null => {
  const ids = Object.keys(peers).sort();
  if (!ids.includes(selfId)) {
    return null;
  }
  const index = ids.indexOf(selfId);
  return index === 0 ? 'STRATEGIST' : 'TACTICIAN';
};

export const MultiplayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return createId();
    }
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const generated = createId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  });
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [presence, setPresence] = useState<Record<string, MultiplayerPresenceState>>({});
  const presenceRef = useRef<Record<string, MultiplayerPresenceState>>({});
  const [approvals, setApprovals] = useState<MultiplayerApproval[]>([]);
  const [conflict, setConflict] = useState<MultiplayerContextValue['conflict']>(null);
  const readyRef = useRef(false);
  const listenersRef = useRef(new Set<StateListener>());
  const resolversRef = useRef(new Map<string, (approved: boolean) => void>());
  const transportRef = useRef<MultiplayerTransport | null>(null);
  const [role, setRole] = useState<MultiplayerRole | null>(null);
  const fallbackToastRef = useRef(false);

  useEffect(() => {
    // Skip all multiplayer initialization when feature is disabled
    if (!MULTIPLAYER_ENABLED) {
      setConnection('unavailable');
      return;
    }

    const notifyUnavailable = () => {
      setConnection('unavailable');
      if (!fallbackToastRef.current) {
        toast({
          title: 'Multiplayer unavailable',
          description: 'Supabase credentials are missing or anonymous access is disabled. Local play remains available.',
        });
        fallbackToastRef.current = true;
      }
    };

    if (isSupabaseFallback) {
      notifyUnavailable();
      return;
    }
    const subscription = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        try {
          await ensureAnonSession();
        } catch (error) {
          if ((error as Error)?.message === 'anon-auth-unavailable') {
            notifyUnavailable();
          } else {
            console.warn('[multiplayer] auth state refresh failed', error);
          }
        }
      }
    });
    ensureAnonSession()
      .then(token => {
        if (!token) {
          notifyUnavailable();
        }
      })
      .catch(error => {
        if ((error as Error)?.message === 'anon-auth-unavailable') {
          notifyUnavailable();
          return;
        }
        toast({ title: 'Multiplayer auth failed', description: 'Unable to initialise Supabase session.' });
        setConnection('error');
      });
    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Skip transport initialization when multiplayer is disabled
    if (!MULTIPLAYER_ENABLED) {
      return;
    }

    const transport = new MultiplayerTransport();
    transportRef.current = transport;
    setConnection(isSupabaseFallback ? 'unavailable' : 'connecting');

    let isMounted = true;

    transport
      .join({ sessionId })
      .then(() => {
        if (!isMounted) return;
        setConnection(isSupabaseFallback ? 'unavailable' : 'ready');
        setRole(resolveRole(transport.getClientId(), presenceRef.current));
        transport.updatePresence({ ready: readyRef.current }).catch(() => {
          /* ignore */
        });
      })
      .catch(error => {
        console.error('[multiplayer] join error', error);
        if (!isMounted) return;
        setConnection('error');
      });

    const offEvent = transport.onEvent(event => {
      if (event.type === 'state') {
        listenersRef.current.forEach(listener => listener(event.payload));
      }
      if (event.type === 'approval-request') {
        const isSelf = event.payload.actorId === transport.getClientId();
        setApprovals(prev => {
          const filtered = prev.filter(item => item.request.id !== event.payload.id);
          return [...filtered, { request: event.payload, status: 'pending', actorId: event.payload.actorId }];
        });
        if (!isSelf) {
          toast({
            title: 'Command approval requested',
            description: event.payload.description || `Action ${event.payload.action} requires review.`,
          });
        }
      }
      if (event.type === 'approval-response') {
        const resolver = resolversRef.current.get(event.payload.id);
        if (resolver) {
          resolver(event.payload.approved);
          resolversRef.current.delete(event.payload.id);
        }
        setApprovals(prev =>
          prev.map(record =>
            record.request.id === event.payload.id
              ? { ...record, status: event.payload.approved ? 'approved' : 'rejected' }
              : record,
          ),
        );
        if (!event.payload.approved) {
          toast({ title: 'Command rejected', description: 'Your co-commander declined the operation.' });
        }
      }
    });

    const offPresence = transport.onPresence(state => {
      presenceRef.current = state;
      setPresence(state);
      setRole(resolveRole(transport.getClientId(), state));
    });

    return () => {
      isMounted = false;
      offEvent();
      offPresence();
      transport.leave();
    };
  }, [sessionId]);

  const players = useMemo<MultiplayerPlayer[]>(() => {
    if (!transportRef.current) return [];
    const clientId = transportRef.current.getClientId();
    const ids = Object.keys(presence).sort();
    return ids.map((id, index) => ({
      ...presence[id],
      role: index === 0 ? 'STRATEGIST' : 'TACTICIAN',
      isSelf: id === clientId,
      ready: presence[id]?.ready ?? false,
    }));
  }, [presence]);

  const setReady = useCallback(async (ready: boolean) => {
    readyRef.current = ready;
    await transportRef.current?.updatePresence({ ready });
  }, []);

  const canExecute = useCallback(
    (action: MultiplayerActionType) => {
      if (!role) return false;
      return ROLE_PERMISSIONS[role]?.has(action) ?? false;
    },
    [role],
  );

  const ensureAction = useCallback(
    async (action: MultiplayerActionType, options?: EnsureActionOptions) => {
      if (canExecute(action)) {
        return true;
      }

      if (!transportRef.current) return false;
      const request: MultiplayerApprovalRequest = {
        id: createId(),
        sessionId,
        actorId: transportRef.current.getClientId(),
        action,
        payload: options?.payload,
        requestedAt: new Date().toISOString(),
        description: options?.description,
      };

      await transportRef.current.sendApprovalRequest(request);
      toast({ title: 'Awaiting approval', description: 'Waiting for your co-commander to approve.' });

      return await new Promise<boolean>(resolve => {
        resolversRef.current.set(request.id, resolve);
      });
    },
    [canExecute, sessionId],
  );

  const publishState = useCallback(async (state: MultiplayerSharedState) => {
    if (!transportRef.current) return;
    const currentVersion = transportRef.current.getVersion();
    try {
      await transportRef.current.broadcastState(state, currentVersion);
    } catch (error) {
      if ((error as Error & { code?: string }).code === 'VERSION_MISMATCH') {
        setConflict({ expected: currentVersion, actual: currentVersion, at: new Date().toISOString() });
        toast({ title: 'Sync conflict', description: 'State update rejected due to version mismatch.' });
      } else {
        console.error('[multiplayer] broadcast failure', error);
      }
    }
  }, []);

  const registerStateListener = useCallback((listener: StateListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const respondToApproval = useCallback(async (id: string, approved: boolean) => {
    if (!transportRef.current) return;
    const record = approvals.find(item => item.request.id === id);
    if (!record) return;
    const response: MultiplayerApprovalResponse = {
      id,
      sessionId,
      actorId: transportRef.current.getClientId(),
      approved,
      respondedAt: new Date().toISOString(),
    };
    await transportRef.current.sendApprovalResponse(response);
    setApprovals(prev =>
      prev.map(item => (item.request.id === id ? { ...item, status: approved ? 'approved' : 'rejected' } : item)),
    );
  }, [approvals, sessionId]);

  const clearConflict = useCallback(() => setConflict(null), []);

  const value = useMemo<MultiplayerContextValue>(
    () => ({
      sessionId,
      connection,
      role,
      players,
      ready: readyRef.current,
      setReady,
      canExecute,
      ensureAction,
      publishState,
      registerStateListener,
      approvals,
      respondToApproval,
      conflict,
      clearConflict,
    }),
    [approvals, canExecute, clearConflict, connection, ensureAction, players, publishState, registerStateListener, role, sessionId, conflict, setReady],
  );

  return <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>;
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider');
  }
  return context;
};
