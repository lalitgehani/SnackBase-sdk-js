/**
 * BatchServiceCompat and SubBatchServiceCompat — `pb.createBatch()` bridge for
 * @snackbase/pocketbase-compat.
 *
 * SnackBase has no single atomic batch endpoint, so operations are queued and
 * executed via `Promise.allSettled()` — a best-effort, non-atomic approximation.
 *
 * Phase 5.
 */

import type { SnackBaseClient } from '@snackbase/sdk';
import type { BatchRequestResult } from './types.js';

// ---------------------------------------------------------------------------
// Internal op types
// ---------------------------------------------------------------------------

interface CreateOp {
  op: 'create';
  data: Record<string, any>;
}

interface UpdateOp {
  op: 'update';
  id: string;
  data: Record<string, any>;
}

interface UpsertOp {
  op: 'upsert';
  data: Record<string, any>;
}

interface DeleteOp {
  op: 'delete';
  id: string;
}

type BatchOp = CreateOp | UpdateOp | UpsertOp | DeleteOp;

// ---------------------------------------------------------------------------
// SubBatchServiceCompat
// ---------------------------------------------------------------------------

/**
 * Accumulates operations for a single collection within a batch.
 * Methods mirror PocketBase's batch sub-service API.
 */
export class SubBatchServiceCompat {
  /** @internal Exposed so BatchServiceCompat can read and execute ops. */
  readonly _ops: BatchOp[] = [];
  private readonly _collection: string;

  constructor(collection: string) {
    this._collection = collection;
  }

  get collectionName(): string {
    return this._collection;
  }

  /** Queue a create operation. */
  create(data: Record<string, any>, _opts?: Record<string, any>): this {
    this._ops.push({ op: 'create', data });
    return this;
  }

  /** Queue an update (PATCH) operation. */
  update(id: string, data: Record<string, any>, _opts?: Record<string, any>): this {
    this._ops.push({ op: 'update', id, data });
    return this;
  }

  /**
   * Queue an upsert operation.
   * On send, tries `records.patch()` first; falls back to `records.create()` on error.
   * The `id` field is read from `data.id` if present.
   */
  upsert(data: Record<string, any>, _opts?: Record<string, any>): this {
    this._ops.push({ op: 'upsert', data });
    return this;
  }

  /** Queue a delete operation. */
  delete(id: string, _opts?: Record<string, any>): this {
    this._ops.push({ op: 'delete', id });
    return this;
  }
}

// ---------------------------------------------------------------------------
// BatchServiceCompat
// ---------------------------------------------------------------------------

/**
 * Collects batch operations across multiple collections and executes them
 * concurrently via `Promise.allSettled()`.
 *
 * Does NOT throw even when individual operations fail; failed ops appear in
 * the result array with `{ status: 400, body: { error: '...' } }`.
 */
export class BatchServiceCompat {
  private readonly _snackbase: SnackBaseClient;
  /** Per-collection sub-service cache */
  private readonly _subServices = new Map<string, SubBatchServiceCompat>();

  constructor(snackbase: SnackBaseClient) {
    this._snackbase = snackbase;
  }

  /**
   * Returns (or creates) the `SubBatchServiceCompat` for the given collection.
   * Multiple calls with the same name share the same op queue.
   */
  collection(name: string): SubBatchServiceCompat {
    if (!this._subServices.has(name)) {
      this._subServices.set(name, new SubBatchServiceCompat(name));
    }
    return this._subServices.get(name)!;
  }

  /**
   * Execute all queued operations and return results.
   * Uses `Promise.allSettled()` — all ops run regardless of individual failures.
   */
  async send(_opts?: Record<string, any>): Promise<BatchRequestResult[]> {
    // Flatten all ops into an ordered list of { collection, op } pairs
    const tasks: Array<{ collection: string; op: BatchOp }> = [];
    for (const [col, sub] of this._subServices) {
      for (const op of sub._ops) {
        tasks.push({ collection: col, op });
      }
    }

    const promises = tasks.map(({ collection, op }) =>
      this._executeOp(collection, op),
    );

    const settled = await Promise.allSettled(promises);

    return settled.map((result) => {
      if (result.status === 'fulfilled') {
        return { status: 200, body: result.value } as BatchRequestResult;
      }
      const reason = result.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason?.message === 'string'
            ? reason.message
            : String(reason);
      return { status: 400, body: { error: message } } as BatchRequestResult;
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async _executeOp(collection: string, op: BatchOp): Promise<any> {
    switch (op.op) {
      case 'create':
        return this._snackbase.records.create(collection, op.data);

      case 'update':
        return this._snackbase.records.patch(collection, op.id, op.data);

      case 'upsert': {
        const id = op.data.id as string | undefined;
        if (id) {
          try {
            return await this._snackbase.records.patch(collection, id, op.data);
          } catch {
            // Fallback to create on patch failure
            return this._snackbase.records.create(collection, op.data);
          }
        }
        // No id — can only create
        return this._snackbase.records.create(collection, op.data);
      }

      case 'delete':
        return this._snackbase.records.delete(collection, op.id);
    }
  }
}
