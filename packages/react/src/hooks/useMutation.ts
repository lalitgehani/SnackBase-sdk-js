import { useState, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import { BaseRecord } from '@snackbase/sdk';

export interface UseMutationResult<T> {
  create: (data: Partial<T>) => Promise<T & BaseRecord>;
  update: (id: string, data: Partial<T>) => Promise<T & BaseRecord>;
  del: (id: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

export const useMutation = <T = any>(collection: string): UseMutationResult<T> => {
  const client = useSnackBase();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (data: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await client.records.create<T>(collection, data);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, collection]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await client.records.update<T>(collection, id, data);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, collection]);

  const del = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.records.delete(collection, id);
      return true;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, collection]);

  return { create, update, del, loading, error };
};
