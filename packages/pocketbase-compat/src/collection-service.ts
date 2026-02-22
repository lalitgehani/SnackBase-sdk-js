/**
 * CollectionServiceCompat — PocketBase-compatible pb.collections.* bridge.
 *
 * SnackBase's collections.list() returns all collections (not paginated),
 * so getList() does client-side slicing to match PocketBase's paginated shape.
 */

import type { SnackBaseClient } from '@snackbase/sdk';
import type { ListResult } from './types.js';
import { NotSupportedError, wrapThrow } from './errors.js';
import type { SendOptions } from './record-service.js';

export class CollectionServiceCompat {
  constructor(private readonly snackbase: SnackBaseClient) {}

  /**
   * List collections with client-side pagination (SnackBase returns all at once).
   */
  async getList(page = 1, perPage = 30, opts: SendOptions = {}): Promise<ListResult<any>> {
    return wrapThrow(async () => {
      const all = await this.snackbase.collections.list();
      const start = (page - 1) * perPage;
      const items = all.slice(start, start + perPage);
      return {
        page,
        perPage,
        totalItems: all.length,
        totalPages: Math.ceil(all.length / perPage) || 0,
        items,
      };
    });
  }

  /**
   * Fetch all collections as a flat array.
   */
  async getFullList(opts: SendOptions = {}): Promise<any[]> {
    return wrapThrow(() => this.snackbase.collections.list());
  }

  /**
   * Get a single collection by ID or name.
   */
  async getOne(id: string, opts: SendOptions = {}): Promise<any> {
    return wrapThrow(() => this.snackbase.collections.get(id));
  }

  /**
   * Create a new collection.
   */
  async create(data: any, opts: SendOptions = {}): Promise<any> {
    return wrapThrow(() => this.snackbase.collections.create(data));
  }

  /**
   * Update an existing collection.
   */
  async update(id: string, data: any, opts: SendOptions = {}): Promise<any> {
    return wrapThrow(() => this.snackbase.collections.update(id, data));
  }

  /**
   * Delete a collection. Returns true on success.
   */
  async delete(id: string, opts: SendOptions = {}): Promise<boolean> {
    return wrapThrow(async () => {
      await this.snackbase.collections.delete(id);
      return true;
    });
  }

  // --- Unsupported PocketBase collection operations ---

  import(): never {
    throw new NotSupportedError(
      'collections.import — use @snackbase/sdk collections.import() directly',
    );
  }

  getScaffolds(): never {
    throw new NotSupportedError('collections.getScaffolds — no SnackBase equivalent');
  }

  truncate(): never {
    throw new NotSupportedError('collections.truncate — no SnackBase equivalent');
  }
}
