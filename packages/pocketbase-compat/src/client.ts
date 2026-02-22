/**
 * PocketBaseCompat — the main client class for @snackbase/pocketbase-compat.
 *
 * Drop-in replacement for `new PocketBase(url)`. Internally wraps a SnackBaseClient
 * and delegates all network calls through it.
 *
 * Phase 2: constructor, collection(), filter(), buildURL(), send(), no-op cancellation
 *   methods, and unsupported getter stubs (backups, crons, settings, logs).
 * Phase 3: authStore integration.
 * Phase 4: realtime subscriptions via RealtimeServiceCompat.
 * Phase 5: files, health, createBatch.
 */

import { SnackBaseClient } from '@snackbase/sdk';
import { pbFilter } from './filter-rewriter.js';
import { NotSupportedError } from './errors.js';
import { RecordServiceCompat } from './record-service.js';
import { CollectionServiceCompat } from './collection-service.js';
import { AuthStoreCompat } from './auth-store.js';
import { RealtimeServiceCompat } from './realtime-service.js';
import { FileServiceCompat } from './file-service.js';
import { HealthServiceCompat } from './health-service.js';
import { BatchServiceCompat } from './batch-service.js';

export class PocketBaseCompat {
  public readonly baseURL: string;
  public readonly lang: string;

  /** pb.authStore — bridges SnackBase's AuthManager to PocketBase's authStore API */
  public readonly authStore: AuthStoreCompat;

  /** pb.collections — CollectionServiceCompat instance */
  public readonly collections: CollectionServiceCompat;

  /** pb.realtime — RealtimeServiceCompat instance */
  public readonly realtime: RealtimeServiceCompat;

  /** pb.files — file URL and token helpers */
  public readonly files: FileServiceCompat;

  /** pb.health — health check */
  public readonly health: HealthServiceCompat;

  /** Internal SnackBaseClient — do not access in user code */
  private readonly _snackbase: SnackBaseClient;

  /** Cache of RecordServiceCompat instances keyed by collection name */
  private readonly _recordCache = new Map<string, RecordServiceCompat<any>>();

  constructor(baseURL = '/', _authStore?: AuthStoreCompat | null, lang = 'en-US') {
    // Resolve relative URL
    if (baseURL.startsWith('/')) {
      if (typeof window !== 'undefined' && window.location) {
        baseURL = window.location.origin + baseURL;
      } else {
        throw new Error(
          "PocketBase compat requires a full URL (e.g. 'http://localhost:8000')",
        );
      }
    }

    // Strip trailing slash
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.lang = lang;

    this._snackbase = new SnackBaseClient({ baseUrl: this.baseURL });

    // Phase 3: create AuthStoreCompat from the internal AuthManager.
    // If a custom authStore was passed in, use it; otherwise build a fresh one.
    this.authStore = _authStore ?? new AuthStoreCompat(this._snackbase.internalAuthManager);

    this.collections = new CollectionServiceCompat(this._snackbase);

    // Phase 4: shared realtime bridge — one instance per client
    this.realtime = new RealtimeServiceCompat(this._snackbase);

    // Phase 5: file, health, and batch services
    this.files = new FileServiceCompat(this._snackbase);
    this.health = new HealthServiceCompat();
  }

  /**
   * Returns a cached RecordServiceCompat for the given collection name.
   * Repeated calls with the same name return the same instance.
   */
  collection<M extends Record<string, any> = Record<string, any>>(
    idOrName: string,
  ): RecordServiceCompat<any> {
    if (!this._recordCache.has(idOrName)) {
      this._recordCache.set(
        idOrName,
        new RecordServiceCompat(this._snackbase, idOrName, this.realtime),
      );
    }
    return this._recordCache.get(idOrName)!;
  }

  /**
   * Interpolates `{:paramName}` placeholders and rewrites PocketBase field names
   * to SnackBase equivalents (e.g. `created` → `created_at`).
   */
  filter(raw: string, params?: Record<string, any>): string {
    return pbFilter(raw, params);
  }

  /**
   * Builds a full URL by prepending baseURL.
   */
  buildURL(path: string): string {
    return this.baseURL + path;
  }

  /**
   * Low-level HTTP send — routes through the internal SnackBase httpClient.
   * Mirrors the PocketBase SDK's `pb.send(path, options)` signature.
   */
  async send<T = any>(
    path: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
      [key: string]: any;
    } = {},
  ): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    const http = this._snackbase.httpClient;
    const { body, headers, params } = options;

    let response;
    switch (method) {
      case 'GET':
        response = await http.get<T>(path, { params, headers });
        break;
      case 'POST':
        response = await http.post<T>(path, body, { headers });
        break;
      case 'PUT':
        response = await http.put<T>(path, body, { headers });
        break;
      case 'PATCH':
        response = await http.patch<T>(path, body, { headers });
        break;
      case 'DELETE':
        response = await http.delete<T>(path, { headers });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    return response.data;
  }

  // --- No-op cancellation methods (PocketBase SDK compatibility) ---

  /** No-op: SnackBase handles cancellation differently */
  autoCancellation(_enable: boolean): this {
    return this;
  }

  /** No-op: SnackBase handles cancellation differently */
  cancelRequest(_requestKey: string): this {
    return this;
  }

  /** No-op: SnackBase handles cancellation differently */
  cancelAllRequests(): this {
    return this;
  }

  // --- Unsupported PocketBase top-level services ---

  get backups(): any {
    throw new NotSupportedError(
      'pb.backups — no SnackBase equivalent. See https://snackbase.io/docs/pocketbase-migration',
    );
  }

  get crons(): any {
    throw new NotSupportedError(
      'pb.crons — no SnackBase equivalent. See https://snackbase.io/docs/pocketbase-migration',
    );
  }

  get settings(): any {
    throw new NotSupportedError(
      'pb.settings — use @snackbase/sdk admin service directly',
    );
  }

  get logs(): any {
    throw new NotSupportedError(
      'pb.logs — use @snackbase/sdk auditLogs service directly',
    );
  }

  /** Returns a new BatchServiceCompat that accumulates ops and sends them concurrently. */
  createBatch(): BatchServiceCompat {
    return new BatchServiceCompat(this._snackbase);
  }
}
