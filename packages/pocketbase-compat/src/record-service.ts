/**
 * RecordServiceCompat — PocketBase-compatible record CRUD bridge.
 *
 * Phase 2: getList, getFullList, getFirstListItem, getOne, create, update, delete.
 * Phase 3 (auth methods) and Phase 4 (realtime) are stubbed with NotSupportedError.
 */

import type { SnackBaseClient } from '@snackbase/sdk';
import type { ListResult, RecordModel } from './types.js';
import { ClientResponseError, NotSupportedError, wrapThrow } from './errors.js';
import {
  toRecordModel,
  fromRecordModel,
  toListResult,
  toSnackListParams,
} from './normalizer.js';

export interface SendOptions {
  expand?: string | string[];
  fields?: string | string[];
  filter?: string;
  sort?: string;
  [key: string]: any;
}

export interface FullListOptions extends SendOptions {
  batch?: number;
}

export class RecordServiceCompat<M extends RecordModel = RecordModel> {
  constructor(
    private readonly snackbase: SnackBaseClient,
    public readonly collectionIdOrName: string,
  ) {}

  /**
   * Fetch a paginated list of records.
   */
  async getList<T extends RecordModel = M>(
    page = 1,
    perPage = 30,
    opts: SendOptions = {},
  ): Promise<ListResult<T>> {
    return wrapThrow(async () => {
      const params = toSnackListParams(page, perPage, opts);
      const result = await this.snackbase.records.list<T>(this.collectionIdOrName, params);
      return toListResult(result as any, this.collectionIdOrName, page, perPage) as ListResult<T>;
    });
  }

  /**
   * Fetch all records by looping getList until all items are retrieved.
   *
   * @param batchOrOpts - batch size (number) or options object with optional `batch` field
   * @param opts - options when batchOrOpts is a number
   */
  async getFullList<T extends RecordModel = M>(
    batchOrOpts?: number | FullListOptions,
    opts?: SendOptions,
  ): Promise<T[]> {
    let batchSize: number;
    let options: SendOptions;

    if (typeof batchOrOpts === 'number') {
      batchSize = batchOrOpts;
      options = opts ?? {};
    } else if (batchOrOpts && typeof batchOrOpts === 'object') {
      const { batch, ...rest } = batchOrOpts;
      batchSize = batch ?? 200;
      options = rest;
    } else {
      batchSize = 200;
      options = {};
    }

    const result: T[] = [];
    let page = 1;

    while (true) {
      const listResult = await this.getList<T>(page, batchSize, options);
      result.push(...listResult.items);
      if (result.length >= listResult.totalItems) break;
      page++;
    }

    return result;
  }

  /**
   * Fetch the first matching record. Throws ClientResponseError(404) if none found.
   */
  async getFirstListItem<T extends RecordModel = M>(
    filter: string,
    opts: SendOptions = {},
  ): Promise<T> {
    return wrapThrow(async () => {
      const listResult = await this.getList<T>(1, 1, { ...opts, filter });
      if (listResult.items.length === 0) {
        throw new ClientResponseError({
          status: 404,
          message: "The requested resource wasn't found.",
          data: { code: 404, message: "The requested resource wasn't found." },
        });
      }
      return listResult.items[0];
    });
  }

  /**
   * Fetch a single record by ID.
   */
  async getOne<T extends RecordModel = M>(id: string, opts: SendOptions = {}): Promise<T> {
    return wrapThrow(async () => {
      const params: { fields?: string | string[]; expand?: string | string[] } = {};
      if (opts.expand) params.expand = opts.expand;
      if (opts.fields) params.fields = opts.fields;
      const raw = await this.snackbase.records.get<T>(this.collectionIdOrName, id, params);
      return toRecordModel(raw as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T;
    });
  }

  /**
   * Create a new record. Strips PocketBase-specific fields before sending.
   * Passes FormData through unchanged (for file uploads).
   */
  async create<T extends RecordModel = M>(
    bodyParams: Partial<T> | FormData,
    opts: SendOptions = {},
  ): Promise<T> {
    return wrapThrow(async () => {
      const data =
        bodyParams instanceof FormData
          ? bodyParams
          : fromRecordModel(bodyParams as Record<string, any>);
      const raw = await this.snackbase.records.create<T>(
        this.collectionIdOrName,
        data as Partial<T>,
      );
      return toRecordModel(raw as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T;
    });
  }

  /**
   * Partially update a record (PATCH). Strips PocketBase-specific fields before sending.
   * Passes FormData through unchanged (for file uploads).
   */
  async update<T extends RecordModel = M>(
    id: string,
    bodyParams: Partial<T> | FormData,
    opts: SendOptions = {},
  ): Promise<T> {
    return wrapThrow(async () => {
      const data =
        bodyParams instanceof FormData
          ? bodyParams
          : fromRecordModel(bodyParams as Record<string, any>);
      const raw = await this.snackbase.records.patch<T>(
        this.collectionIdOrName,
        id,
        data as Partial<T>,
      );
      return toRecordModel(raw as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T;
    });
  }

  /**
   * Delete a record. Returns true on success.
   */
  async delete(id: string, opts: SendOptions = {}): Promise<boolean> {
    return wrapThrow(async () => {
      await this.snackbase.records.delete(this.collectionIdOrName, id);
      return true;
    });
  }

  // --- Phase 3 stubs (auth methods) ---

  authWithPassword(): never {
    throw new NotSupportedError('authWithPassword — will be available in Phase 3');
  }

  authRefresh(): never {
    throw new NotSupportedError('authRefresh — will be available in Phase 3');
  }

  listAuthMethods(): never {
    throw new NotSupportedError('listAuthMethods — will be available in Phase 3');
  }

  requestPasswordReset(): never {
    throw new NotSupportedError('requestPasswordReset — will be available in Phase 3');
  }

  confirmPasswordReset(): never {
    throw new NotSupportedError('confirmPasswordReset — will be available in Phase 3');
  }

  requestVerification(): never {
    throw new NotSupportedError('requestVerification — will be available in Phase 3');
  }

  confirmVerification(): never {
    throw new NotSupportedError('confirmVerification — will be available in Phase 3');
  }

  authWithOAuth2Code(): never {
    throw new NotSupportedError('authWithOAuth2Code — will be available in Phase 3');
  }

  authWithOAuth2(): never {
    throw new NotSupportedError('authWithOAuth2 — will be available in Phase 3');
  }

  // --- Phase 4 stubs (realtime) ---

  subscribe(): never {
    throw new NotSupportedError('subscribe — will be available in Phase 4');
  }

  unsubscribe(): never {
    throw new NotSupportedError('unsubscribe — will be available in Phase 4');
  }
}
