import type { SnackBaseClient } from '@snackbase/sdk';
import { NotSupportedError } from './errors';
import type {
  RealtimeChannelStatus,
  RealtimePostgresEvent,
  RealtimePostgresChangesPayload,
} from './types';

type PostgresChangesFilter = {
  event: RealtimePostgresEvent;
  schema?: string;
  table?: string;
  filter?: string;
};

type PostgresChangesCallback<T = Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>,
) => void;

type ChannelEventType = 'postgres_changes' | 'broadcast' | 'presence';

/**
 * Bridges Supabase `channel().on().subscribe()` pattern to SnackBase RealTimeService.
 *
 * Phase 1: Stub — subscribe/unsubscribe are no-ops; all events immediately return CHANNEL_ERROR.
 * Phase 3: Full implementation.
 *
 * @internal Constructed by SnackbaseSupabaseClient.channel()
 */
export class RealtimeChannelBridge {
  private _cleanupFns: Array<() => void> = [];

  constructor(
    private readonly name: string,
    private readonly snackbase: SnackBaseClient,
  ) {}

  /**
   * Register a listener for a channel event type.
   * Mirrors Supabase's `.on('postgres_changes', filter, callback)`.
   * Returns `this` for chaining (builder pattern).
   */
  on(
    eventType: 'postgres_changes',
    filter: PostgresChangesFilter,
    callback: PostgresChangesCallback,
  ): this;
  on(eventType: 'broadcast', filter: Record<string, unknown>, callback: (payload: unknown) => void): this;
  on(eventType: 'presence', filter: Record<string, unknown>, callback: (payload: unknown) => void): this;
  on(eventType: ChannelEventType, _filter: unknown, _callback: unknown): this {
    // Phase 3 will wire postgres_changes to realtime.subscribe() + realtime.on()
    // broadcast/presence remain unsupported
    return this;
  }

  /**
   * Activate the channel and begin receiving events.
   * Mirrors Supabase's `.subscribe(statusCallback)`.
   *
   * Phase 1: immediately signals CHANNEL_ERROR (not yet implemented).
   * Phase 3: calls snackbase.realtime.connect() and subscribe().
   */
  subscribe(statusCallback?: (status: RealtimeChannelStatus, err?: Error) => void): this {
    if (statusCallback) {
      Promise.resolve().then(() => {
        statusCallback('CHANNEL_ERROR', new NotSupportedError('channel().subscribe (Phase 3 not yet implemented)'));
      });
    }
    return this;
  }

  /**
   * Unsubscribe from this channel's realtime events.
   */
  async unsubscribe(): Promise<void> {
    for (const cleanup of this._cleanupFns) {
      cleanup();
    }
    this._cleanupFns = [];
  }

  /**
   * @internal Called by SnackbaseSupabaseClient.removeChannel()
   */
  async _unsubscribeAll(): Promise<void> {
    await this.unsubscribe();
  }
}
