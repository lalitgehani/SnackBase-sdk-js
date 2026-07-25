import { useState, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import type { CodelistOverride, OverridePayload } from '@snackbase/sdk';

export interface UseCodelistOverrideResult {
  setOverride: (
    code: string,
    valueCode: string,
    data: OverridePayload,
    accountId?: string,
  ) => Promise<CodelistOverride>;
  clearOverride: (
    code: string,
    valueCode: string,
    accountId?: string,
  ) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * Thin helpers for account-level codelist overrides (hide / default / sort).
 * Superadmin must pass tenant `accountId` when acting for another account.
 */
export function useCodelistOverride(): UseCodelistOverrideResult {
  const client = useSnackBase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setOverride = useCallback(
    async (
      code: string,
      valueCode: string,
      data: OverridePayload,
      accountId?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        return await client.codelists.setOverride(code, valueCode, data, accountId);
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const clearOverride = useCallback(
    async (code: string, valueCode: string, accountId?: string) => {
      setLoading(true);
      setError(null);
      try {
        await client.codelists.clearOverride(code, valueCode, accountId);
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return { setOverride, clearOverride, loading, error };
}
