import { useState, useCallback, useEffect, useRef } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { RecordListParams, RecordListResponse } from '@snackbase/sdk';

export interface UseQueryResult<T> {
  data: RecordListResponse<T> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useQuery = <T = any>(
  collection: string,
  params?: RecordListParams
): UseQueryResult<T> => {
  const client = useSnackBase();
  const [data, setData] = useState<RecordListResponse<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Serialize params to string key for dependency tracking
  const paramsKey = JSON.stringify(params);
  const paramsRef = useRef(params);

  // Update ref if params changed roughly
  if (JSON.stringify(paramsRef.current) !== paramsKey) {
    paramsRef.current = params;
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.records.list<T>(collection, paramsRef.current);
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [client, collection, paramsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
