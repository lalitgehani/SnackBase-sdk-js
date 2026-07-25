import { useState, useCallback, useEffect, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import type { Codelist } from '@snackbase/sdk';

export interface UseCodelistsOptions {
  scope?: 'system' | 'account' | string;
  active?: boolean;
  /**
   * When false, skip the network call and set loading to false.
   * @default true
   */
  enabled?: boolean;
}

export interface UseCodelistsResult {
  data: Codelist[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * List codelists visible to the current user (system + own account).
 */
export function useCodelists(options?: UseCodelistsOptions): UseCodelistsResult {
  const client = useSnackBase();
  const enabled = options?.enabled !== false;
  const scope = options?.scope;
  const active = options?.active;

  const [data, setData] = useState<Codelist[] | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchGen = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchList = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const gen = ++fetchGen.current;
    setLoading(true);
    setError(null);
    try {
      const params: { scope?: string; active?: boolean } = {};
      if (scope !== undefined) params.scope = scope;
      if (active !== undefined) params.active = active;
      const result = await client.codelists.list(
        Object.keys(params).length ? params : undefined,
      );
      if (!mountedRef.current || gen !== fetchGen.current) return;
      setData(result);
    } catch (err: unknown) {
      if (!mountedRef.current || gen !== fetchGen.current) return;
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setData(null);
    } finally {
      if (mountedRef.current && gen === fetchGen.current) {
        setLoading(false);
      }
    }
  }, [client, scope, active, enabled]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  return { data, loading, error, refetch: fetchList };
}
