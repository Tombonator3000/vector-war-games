import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseFallback } from '@/integrations/supabase/client';
import type { MultiplayerSharedState } from '@/types/game';

export type MultiplayerRole = 'STRATEGIST' | 'TACTICIAN';

export interface MultiplayerPresenceState {
  id: string;
  role?: MultiplayerRole;
  ready?: boolean;
  userId?: string;
  displayName?: string;
  lastSeen: string;
}

export interface MultiplayerStateEnvelope {
  sessionId: string;
  actorId: string;
  version: number;
  timestamp: string;
  state: MultiplayerSharedState;
}

export interface MultiplayerApprovalRequest {
  id: string;
  sessionId: string;
  actorId: string;
  action: string;
  payload?: Record<string, unknown>;
  requestedAt: string;
  description?: string;
}

export interface MultiplayerApprovalResponse {
  id: string;
  sessionId: string;
  actorId: string;
  approved: boolean;
  respondedAt: string;
  notes?: string;
}

export type MultiplayerTransportEvent =
  | { type: 'state'; payload: MultiplayerStateEnvelope }
  | { type: 'approval-request'; payload: MultiplayerApprovalRequest }
  | { type: 'approval-response'; payload: MultiplayerApprovalResponse };

export interface MultiplayerTransportOptions {
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export type MultiplayerTransportListener = (event: MultiplayerTransportEvent) => void;
export type MultiplayerPresenceListener = (presence: Record<string, MultiplayerPresenceState>) => void;

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const nowIso = () => new Date().toISOString();

export class MultiplayerTransport {
  private channel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners = new Set<MultiplayerTransportListener>();
  private presenceListeners = new Set<MultiplayerPresenceListener>();
  private version = 0;
  private readonly clientId = createId();
  private presenceState: Record<string, MultiplayerPresenceState> = {};
  private sessionId: string | null = null;

  async join(options: MultiplayerTransportOptions) {
    this.sessionId = options.sessionId;

    if (this.channel) {
      await this.leave();
    }

    if (isSupabaseFallback) {
      this.setupBroadcastFallback(options.metadata);
      return;
    }

    try {
      this.channel = supabase.channel(`coop:${options.sessionId}`, {
        config: { presence: { key: this.clientId } },
      });

      this.channel
        .on('broadcast', { event: 'state' }, ({ payload }) => {
          if (!payload) return;
          this.version = Math.max(this.version, payload.version);
          this.emit({ type: 'state', payload });
        })
        .on('broadcast', { event: 'approval-request' }, ({ payload }) => {
          if (!payload) return;
          this.emit({ type: 'approval-request', payload });
        })
        .on('broadcast', { event: 'approval-response' }, ({ payload }) => {
          if (!payload) return;
          this.emit({ type: 'approval-response', payload });
        })
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel?.presenceState<{ meta: MultiplayerPresenceState }>();
          if (!state) return;
          const flattened: Record<string, MultiplayerPresenceState> = {};
          Object.entries(state).forEach(([key, entries]) => {
            const meta = entries?.[0]?.meta;
            if (meta) {
              flattened[key] = { ...meta, id: key };
            }
          });
          this.presenceState = flattened;
          this.emitPresence();
        });

      const channel = await this.channel.subscribe();
      if (channel && this.channel.state === 'joined') {
        await this.channel.track({
          meta: {
            id: this.clientId,
            lastSeen: nowIso(),
            ...(options.metadata || {}),
          },
        });
      }
    } catch (error) {
       
      console.warn('[multiplayer] Failed to join Supabase channel, falling back to BroadcastChannel', error);
      this.setupBroadcastFallback(options.metadata);
    }
  }

  async leave() {
    if (this.channel) {
      const channel = this.channel;
      this.channel = null;
      await channel.unsubscribe();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.listeners.clear();
    this.presenceListeners.clear();
    this.presenceState = {};
  }

  getVersion() {
    return this.version;
  }

  getClientId() {
    return this.clientId;
  }

  onEvent(listener: MultiplayerTransportListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onPresence(listener: MultiplayerPresenceListener) {
    this.presenceListeners.add(listener);
    listener(this.presenceState);
    return () => {
      this.presenceListeners.delete(listener);
    };
  }

  async broadcastState(state: MultiplayerSharedState, expectedVersion?: number) {
    if (!this.sessionId) {
      throw new Error('Transport not initialised with sessionId');
    }

    if (typeof expectedVersion === 'number' && expectedVersion !== this.version) {
      const error = new Error('Version mismatch');
      (error as Error & { code?: string }).code = 'VERSION_MISMATCH';
      throw error;
    }

    const envelope: MultiplayerStateEnvelope = {
      sessionId: this.sessionId,
      actorId: this.clientId,
      version: this.version + 1,
      timestamp: nowIso(),
      state,
    };

    if (this.channel) {
      await this.channel.send({ type: 'broadcast', event: 'state', payload: envelope });
    } else if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'state', payload: envelope });
    }

    this.version = envelope.version;
    this.emit({ type: 'state', payload: envelope });
  }

  async sendApprovalRequest(request: MultiplayerApprovalRequest) {
    if (this.channel) {
      await this.channel.send({ type: 'broadcast', event: 'approval-request', payload: request });
    } else if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'approval-request', payload: request });
    }
    this.emit({ type: 'approval-request', payload: request });
  }

  async sendApprovalResponse(response: MultiplayerApprovalResponse) {
    if (this.channel) {
      await this.channel.send({ type: 'broadcast', event: 'approval-response', payload: response });
    } else if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'approval-response', payload: response });
    }
    this.emit({ type: 'approval-response', payload: response });
  }

  async updatePresence(meta: Partial<MultiplayerPresenceState>) {
    if (this.channel) {
      await this.channel.track({
        meta: {
          ...(this.presenceState[this.clientId] || { id: this.clientId }),
          ...meta,
          lastSeen: nowIso(),
        },
      });
    } else {
      this.presenceState[this.clientId] = {
        ...(this.presenceState[this.clientId] || { id: this.clientId }),
        ...meta,
        lastSeen: nowIso(),
      };
      this.emitPresence();
    }
  }

  private emit(event: MultiplayerTransportEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  private emitPresence() {
    this.presenceListeners.forEach(listener => listener({ ...this.presenceState }));
  }

  private setupBroadcastFallback(metadata?: Record<string, unknown>) {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    this.broadcastChannel = new BroadcastChannel(`coop:${this.sessionId}`);
    this.broadcastChannel.onmessage = ({ data }) => {
      const event = data as MultiplayerTransportEvent;
      if (event.type === 'state' && event.payload) {
        this.version = Math.max(this.version, event.payload.version);
      }
      this.emit(event);
    };

    this.presenceState[this.clientId] = {
      id: this.clientId,
      lastSeen: nowIso(),
      role: undefined,
      ready: false,
      ...(metadata as Partial<MultiplayerPresenceState>),
    };
    this.emitPresence();
  }
}
