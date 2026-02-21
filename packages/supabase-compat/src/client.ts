import type { SnackBaseClient } from '@snackbase/sdk';
import { NotSupportedError } from './errors';
import { AuthBridge } from './auth-bridge';
import { StorageBridge } from './storage-bridge';
import { RealtimeChannelBridge } from './realtime-bridge';
import { SnackbaseQueryBuilder } from './query-builder';

/**
 * Main Supabase-compatible client.
 *
 * Constructed via `createClient()` — exposes the same surface as `@supabase/supabase-js`:
 * - `.auth` — AuthBridge
 * - `.from(table)` — SnackbaseQueryBuilder
 * - `.storage` — StorageBridge
 * - `.channel(name)` — RealtimeChannelBridge
 * - `.functions` / `.rpc()` — NotSupportedError
 */
export class SnackbaseSupabaseClient {
  readonly auth: AuthBridge;
  private _storage: StorageBridge;

  constructor(private readonly snackbase: SnackBaseClient) {
    this.auth = new AuthBridge(snackbase);
    this._storage = new StorageBridge(snackbase);
  }

  /**
   * Supabase: `supabase.from('table')` — starts a lazy query builder.
   */
  from<T = Record<string, unknown>>(collection: string): SnackbaseQueryBuilder<T> {
    return new SnackbaseQueryBuilder<T>(this.snackbase, collection);
  }

  /**
   * Supabase: `supabase.storage` — file storage namespace.
   */
  get storage(): StorageBridge {
    return this._storage;
  }

  /**
   * Supabase: `supabase.channel(name)` — create a realtime channel.
   */
  channel(name: string): RealtimeChannelBridge {
    return new RealtimeChannelBridge(name, this.snackbase);
  }

  /**
   * Supabase: `supabase.getChannels()` — list all active channels.
   * Returns empty array (channel tracking not implemented).
   */
  getChannels(): RealtimeChannelBridge[] {
    return [];
  }

  /**
   * Supabase: `supabase.removeChannel(channel)` — unsubscribe and remove a channel.
   */
  async removeChannel(channel: RealtimeChannelBridge): Promise<'ok' | 'error'> {
    await channel._unsubscribeAll();
    return 'ok';
  }

  /**
   * Supabase: `supabase.removeAllChannels()` — unsubscribe from all channels.
   * Returns empty array (channel tracking not implemented).
   */
  async removeAllChannels(): Promise<('ok' | 'error')[]> {
    return [];
  }

  /**
   * Supabase: `supabase.functions` — Edge Functions (not supported by SnackBase).
   * @throws {NotSupportedError}
   */
  get functions(): never {
    throw new NotSupportedError('supabase.functions');
  }

  /**
   * Supabase: `supabase.rpc()` — PostgREST RPC (not supported by SnackBase).
   * @throws {NotSupportedError}
   */
  rpc(): never {
    throw new NotSupportedError('supabase.rpc');
  }
}
