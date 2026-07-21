import { useState, useCallback, useEffect, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { subscribeInvalidation } from '../internal/invalidation';
import type { BaseRecord } from '@snackbase/sdk';

export interface UseRecordResult<T> {
  data: (T & BaseRecord) | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseRecordOptions {
  fields?: string[] | string;
  expand?: string[] | string;
  /**
   * When false, skip fetch and set loading false.
   * @default true when id is non-empty
   */
  enabled?: boolean;
  /** Listen for collection invalidation from useMutation. @default true */
  listenToInvalidation?: boolean;
}

export const useRecord = <T = any>(
  collection: string,
  id: string,
  options?: UseRecordOptions
): UseRecordResult<T> => {
  const client = useSnackBase();
  const [data, setData] = useState<(T & BaseRecord) | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id) && options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled !== false && Boolean(id);
  const listenToInvalidation = options?.listenToInvalidation !== false;

  const { fields, expand } = options ?? {};
  const optionsKey = JSON.stringify({ fields, expand });

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
      const result = await client.records.get<T>(collection, id, { fields, expand });
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
  }, [client, collection, id, optionsKey, enabled, fields, expand]);

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
};
