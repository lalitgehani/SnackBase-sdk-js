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
  private _listeners: Array<{
    eventType: ChannelEventType;
    filter: PostgresChangesFilter;
    callback: PostgresChangesCallback;
  }> = [];

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
  on(eventType: ChannelEventType, filter: any, callback: any): this {
    if (eventType === 'postgres_changes') {
      this._listeners.push({ eventType, filter, callback });
    }
    return this;
  }

  /**
   * Activate the channel and begin receiving events.
   * Mirrors Supabase's `.subscribe(statusCallback)`.
   *
   * Phase 3: calls snackbase.realtime.connect() and subscribe().
   */
  subscribe(statusCallback?: (status: RealtimeChannelStatus, err?: Error) => void): this {
    const run = async () => {
      try {
        await this.snackbase.realtime.connect();

        for (const listener of this._listeners) {
          if (listener.eventType !== 'postgres_changes') continue;

          const { table, event } = listener.filter;
          if (!table) continue;

          const ops = this._mapEventToOps(event);
          await this.snackbase.realtime.subscribe(table, ops);

          const cleanup = this.snackbase.realtime.on(`${table}.*`, (data: any) => {
            // Check if this specific event matches the filter
            const snackOp = this._getOpFromType(data.type); // type is e.g. "posts.create"
            if (event === '*' || this._mapOpToEvent(snackOp) === event) {
              listener.callback(this._normalizePayload(table, data));
            }
          });

          this._cleanupFns.push(() => {
            cleanup();
            this.snackbase.realtime.unsubscribe(table);
          });
        }

        if (statusCallback) statusCallback('SUBSCRIBED');
      } catch (err: any) {
        if (statusCallback) statusCallback('CHANNEL_ERROR', err);
      }
    };

    run();
    return this;
  }

  /**
   * Unsubscribe from this channel's realtime events.
   */
  async unsubscribe(): Promise<void> {
    for (const cleanup of this._cleanupFns) {
      await cleanup();
    }
    this._cleanupFns = [];
  }

  /**
   * @internal Called by SnackbaseSupabaseClient.removeChannel()
   */
  async _unsubscribeAll(): Promise<void> {
    await this.unsubscribe();
  }

  private _mapEventToOps(event: RealtimePostgresEvent): string[] {
    switch (event) {
      case 'INSERT':
        return ['create'];
      case 'UPDATE':
        return ['update'];
      case 'DELETE':
        return ['delete'];
      case '*':
      default:
        return ['create', 'update', 'delete'];
    }
  }

  private _mapOpToEvent(op: string): RealtimePostgresEvent {
    switch (op) {
      case 'create':
        return 'INSERT';
      case 'update':
        return 'UPDATE';
      case 'delete':
        return 'DELETE';
      default:
        return '*';
    }
  }

  private _getOpFromType(type: string): string {
    return type.split('.')[1] || '';
  }

  private _normalizePayload(table: string, data: any): RealtimePostgresChangesPayload {
    const op = this._getOpFromType(data.type);
    const eventType = this._mapOpToEvent(op) as 'INSERT' | 'UPDATE' | 'DELETE';

    return {
      schema: 'public',
      table,
      eventType,
      new: eventType === 'DELETE' ? {} : data.data,
      old: eventType === 'INSERT' ? {} : (eventType === 'DELETE' ? data.data : {}), // SnackBase doesn't always provide old data for updates in current SDK?
      commit_timestamp: new Date().toISOString(),
    };
  }
}
