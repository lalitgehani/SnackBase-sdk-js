import { useState, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { invalidateCollection } from '../internal/invalidation';
import type {
  BaseRecord,
  BatchUpdateItem,
  AggregationParams,
  AggregationResponse,
  BatchCreateResponse,
  BatchUpdateResponse,
  BatchDeleteResponse,
} from '@snackbase/sdk';

export interface UseMutationOptions {
  /**
   * When true, successful mutations invalidate mounted useQuery/useRecord for the same collection.
   * @default false — apps must opt in so existing callers are not surprised by extra refetches
   */
  invalidateOnSuccess?: boolean;
}

export interface UseMutationResult<T> {
  create: (data: Partial<T>) => Promise<T & BaseRecord>;
  update: (id: string, data: Partial<T>) => Promise<T & BaseRecord>;
  patch: (id: string, data: Partial<T>) => Promise<T & BaseRecord>;
  del: (id: string) => Promise<boolean>;
  batchCreate: (records: Record<string, any>[]) => Promise<BatchCreateResponse>;
  batchUpdate: (items: BatchUpdateItem[]) => Promise<BatchUpdateResponse>;
  batchDelete: (ids: string[]) => Promise<BatchDeleteResponse>;
  aggregate: (params: AggregationParams) => Promise<AggregationResponse>;
  loading: boolean;
  error: Error | null;
}

/**
 * Record mutations with shared loading/error state.
 * Concurrent calls share a single loading flag (last completion clears it).
 * Errors are set on `error` and rethrown (match historical create/update/del pattern).
 */
export const useMutation = <T = any>(
  collection: string,
  options?: UseMutationOptions
): UseMutationResult<T> => {
  const client = useSnackBase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const invalidateOnSuccess = options?.invalidateOnSuccess === true;

  const run = useCallback(
    async <R,>(fn: () => Promise<R>): Promise<R> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn();
        if (invalidateOnSuccess) {
          invalidateCollection(collection);
        }
        return result;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collection, invalidateOnSuccess]
  );

  const create = useCallback(
    (data: Partial<T>) => run(() => client.records.create<T>(collection, data)),
    [client, collection, run]
  );

  const update = useCallback(
    (id: string, data: Partial<T>) =>
      run(() => client.records.update<T>(collection, id, data)),
    [client, collection, run]
  );

  const patch = useCallback(
    (id: string, data: Partial<T>) =>
      run(() => client.records.patch<T>(collection, id, data)),
    [client, collection, run]
  );

  const del = useCallback(
    (id: string) =>
      run(async () => {
        await client.records.delete(collection, id);
        return true;
      }),
    [client, collection, run]
  );

  const batchCreate = useCallback(
    (records: Record<string, any>[]) =>
      run(() => client.records.batchCreate(collection, records)),
    [client, collection, run]
  );

  const batchUpdate = useCallback(
    (items: BatchUpdateItem[]) =>
      run(() => client.records.batchUpdate(collection, items)),
    [client, collection, run]
  );

  const batchDelete = useCallback(
    (ids: string[]) => run(() => client.records.batchDelete(collection, ids)),
    [client, collection, run]
  );

  const aggregate = useCallback(
    (params: AggregationParams) =>
      run(() => client.records.aggregate(collection, params)),
    [client, collection, run]
  );

  return {
    create,
    update,
    patch,
    del,
    batchCreate,
    batchUpdate,
    batchDelete,
    aggregate,
    loading,
    error,
  };
};
