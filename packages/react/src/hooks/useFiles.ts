import { useState, useCallback } from 'react';
import { useSnackBase } from '../SnackBaseContext';
import type { FileMetadata, FileUploadOptions } from '@snackbase/sdk';

export interface UseFilesResult {
  upload: (file: File | Blob, options?: FileUploadOptions) => Promise<FileMetadata>;
  /** Synchronous download URL from the SDK (no network). */
  getDownloadUrl: (path: string) => string;
  remove: (path: string) => Promise<{ success: boolean }>;
  loading: boolean;
  error: Error | null;
}

/**
 * File upload / download URL / delete helpers with loading and error state.
 * Upload progress is not exposed unless/until the SDK provides progress APIs.
 */
export function useFiles(): UseFilesResult {
  const client = useSnackBase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File | Blob, options?: FileUploadOptions) => {
      setLoading(true);
      setError(null);
      try {
        return await client.files.upload(file, options);
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const getDownloadUrl = useCallback(
    (path: string) => client.files.getDownloadUrl(path),
    [client]
  );

  const remove = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      try {
        return await client.files.delete(path);
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return { upload, getDownloadUrl, remove, loading, error };
}
