import { useState, useCallback } from 'react';

export interface UseClientActionResult<TArgs extends any[], TResult> {
  run: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  data: TResult | null;
  reset: () => void;
}

/**
 * Generic async action helper with loading/error/data state.
 * Useful for occasional admin calls without a dedicated domain hook:
 *
 * @example
 * ```tsx
 * const client = useSnackBase();
 * const { run, loading, error } = useClientAction(
 *   (id: string) => client.workflows.trigger(id)
 * );
 * ```
 */
export function useClientAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): UseClientActionResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        const result = await action(...args);
        setData(result);
        return result;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { run, loading, error, data, reset };
}
