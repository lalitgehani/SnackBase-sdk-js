import { useState, useCallback, useEffect } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { BaseRecord } from '@snackbase/sdk';

export interface UseRecordResult<T> {
  data: (T & BaseRecord) | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseRecordOptions {
  fields?: string[] | string;
  expand?: string[] | string;
}

export const useRecord = <T = any>(
  collection: string,
  id: string,
  options?: UseRecordOptions
): UseRecordResult<T> => {
  const client = useSnackBase();
  const [data, setData] = useState<(T & BaseRecord) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const optionsKey = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await client.records.get<T>(collection, id, options);
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [client, collection, id, optionsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
