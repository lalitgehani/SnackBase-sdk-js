import { useState, useCallback, useEffect, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import type { EffectiveCodelistValue, GetEffectiveValuesParams } from '@snackbase/sdk';

export interface UseCodelistValuesOptions {
  lang?: string;
  active?: boolean;
  /** Superadmin preview: effective values as another account */
  accountId?: string;
  /**
   * When false, skip the network call and set loading to false.
   * @default true
   */
  enabled?: boolean;
}

export interface UseCodelistValuesResult {
  data: EffectiveCodelistValue[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Load effective codelist values for pickers (e.g. regions).
 *
 * @example
 * const { data, loading } = useCodelistValues('regions', { lang: 'en' });
 */
export function useCodelistValues(
  code: string,
  options?: UseCodelistValuesOptions,
): UseCodelistValuesResult {
  const client = useSnackBase();
  const enabled = options?.enabled !== false;
  const lang = options?.lang;
  const active = options?.active;
  const accountId = options?.accountId;

  const [data, setData] = useState<EffectiveCodelistValue[] | null>(null);
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

  const fetchValues = useCallback(async () => {
    if (!enabled || !code) {
      setLoading(false);
      return;
    }
    const gen = ++fetchGen.current;
    setLoading(true);
    setError(null);
    try {
      const params: GetEffectiveValuesParams = {};
      if (lang !== undefined) params.lang = lang;
      if (active !== undefined) params.active = active;
      if (accountId !== undefined) params.account_id = accountId;
      const result = await client.codelists.getValues(
        code,
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
  }, [client, code, lang, active, accountId, enabled]);

  useEffect(() => {
    void fetchValues();
  }, [fetchValues]);

  return { data, loading, error, refetch: fetchValues };
}
