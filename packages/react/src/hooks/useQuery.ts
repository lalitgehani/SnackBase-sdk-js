import { useState, useCallback, useEffect, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { subscribeInvalidation } from '../internal/invalidation';
import type { QueryBuilder, RecordListParams, RecordListResponse } from '@snackbase/sdk';

export interface UseQueryResult<T> {
  data: RecordListResponse<T> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseQueryOptions {
  /**
   * When false, skip the network call and set loading to false.
   * @default true
   */
  enabled?: boolean;
  /**
   * When true, refetch when a mutation for this collection invalidates (see useMutation invalidateOnSuccess).
   * @default true when registered (always listens; mutations control whether they fire)
   */
  listenToInvalidation?: boolean;
}

export type QueryBuilderFactory<T> = (qb: QueryBuilder<T>) => QueryBuilder<T> | Promise<RecordListResponse<T>>;

/**
 * List records from a collection with React state.
 *
 * **Params form (backward compatible):** `useQuery(collection, params?, options?)`
 *
 * **QueryBuilder form:** `useQuery(collection, (qb) => qb.filter(...).sort(...), options?)`
 * The factory may return a QueryBuilder (`.get()` is called) or a Promise of list response.
 */
export function useQuery<T = any>(
  collection: string,
  params?: RecordListParams | QueryBuilderFactory<T>,
  options?: UseQueryOptions
): UseQueryResult<T> {
  const client = useSnackBase();
  const [data, setData] = useState<RecordListResponse<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled !== false;
  const listenToInvalidation = options?.listenToInvalidation !== false;

  const isBuilder = typeof params === 'function';
  const paramsKey = isBuilder ? null : JSON.stringify(params ?? null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Generation token to ignore stale responses
  const fetchGen = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const gen = ++fetchGen.current;
    setLoading(true);
    setError(null);
    try {
      let result: RecordListResponse<T>;
      const p = paramsRef.current;
      if (typeof p === 'function') {
        const qb = client.records.query<T>(collection);
        const built = await p(qb);
        if (built && typeof (built as QueryBuilder<T>).get === 'function') {
          result = await (built as QueryBuilder<T>).get();
        } else {
          result = built as RecordListResponse<T>;
        }
      } else {
        result = await client.records.list<T>(collection, p);
      }
      if (gen === fetchGen.current && mountedRef.current) {
        setData(result);
      }
    } catch (err: any) {
      if (gen === fetchGen.current && mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (gen === fetchGen.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [client, collection, paramsKey, isBuilder, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!listenToInvalidation || !enabled) return;
    return subscribeInvalidation(collection, () => {
      fetchData();
    });
  }, [collection, listenToInvalidation, enabled, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
