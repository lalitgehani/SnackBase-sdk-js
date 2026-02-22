/**
 * PocketBaseCompat — the main client class for @snackbase/pocketbase-compat.
 *
 * Drop-in replacement for `new PocketBase(url)`. Internally wraps a SnackBaseClient
 * and delegates all network calls through it.
 *
 * Phase 2: constructor, collection(), filter(), buildURL(), send(), no-op cancellation
 *   methods, and unsupported getter stubs (backups, crons, settings, logs).
 * Phase 3 will add authStore integration.
 * Phase 4 will add realtime.
 * Phase 5 will add files, health, createBatch.
 */

import { SnackBaseClient } from '@snackbase/sdk';
import { pbFilter } from './filter-rewriter.js';
import { NotSupportedError } from './errors.js';
import { RecordServiceCompat } from './record-service.js';
import { CollectionServiceCompat } from './collection-service.js';

export class PocketBaseCompat {
  public readonly baseURL: string;
  public readonly lang: string;

  /**
   * Auth store — populated in Phase 3.
   * Phase 2: always null unless caller passes one in.
   */
  public readonly authStore: any;

  /** pb.collections — CollectionServiceCompat instance */
  public readonly collections: CollectionServiceCompat;

  /** Internal SnackBaseClient — do not access in user code */
  private readonly _snackbase: SnackBaseClient;

  /** Cache of RecordServiceCompat instances keyed by collection name */
  private readonly _recordCache = new Map<string, RecordServiceCompat<any>>();

  constructor(baseURL = '/', authStore: any = null, lang = 'en-US') {
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
    this.authStore = authStore;

    this._snackbase = new SnackBaseClient({ baseUrl: this.baseURL });
    this.collections = new CollectionServiceCompat(this._snackbase);
  }

  /**
   * Returns a cached RecordServiceCompat for the given collection name.
   * Repeated calls with the same name return the same instance.
   */
  collection<M extends Record<string, any> = Record<string, any>>(
    idOrName: string,
  ): RecordServiceCompat<any> {
    if (!this._recordCache.has(idOrName)) {
      this._recordCache.set(idOrName, new RecordServiceCompat(this._snackbase, idOrName));
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

  // --- Phase 5 stubs ---

  /** Phase 5: file URL helpers */
  get files(): any {
    return null;
  }

  /** Phase 4: realtime subscriptions */
  get realtime(): any {
    return null;
  }

  /** Phase 5: health check */
  get health(): any {
    return null;
  }

  /** Phase 5: batch operations */
  createBatch(): never {
    throw new NotSupportedError('createBatch — will be available in Phase 5');
  }
}
