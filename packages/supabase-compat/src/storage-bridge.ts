import type { SnackBaseClient } from '@snackbase/sdk';
import { wrap, NotSupportedError } from './errors';
import type { CompatError, PublicUrlResult } from './types';

type StorageUploadResult = { data: { path: string } | null; error: CompatError | null };
type StorageDownloadResult = { data: Blob | null; error: CompatError | null };
type StorageRemoveResult = { data: Array<{ name: string }> | null; error: CompatError | null };
type StorageListResult = { data: Array<{ name: string }> | null; error: CompatError | null };
type StorageBucketResult = { data: { name: string } | null; error: CompatError | null };
type StorageBucketsResult = { data: Array<{ name: string }> | null; error: CompatError | null };

/**
 * Bridges Supabase `storage.*` API to SnackBase FileService.
 *
 * Phase 1: Stub — all methods return NotSupportedError.
 * Phase 3: Full implementation.
 *
 * @internal Exposed via SnackbaseSupabaseClient.storage
 */
export class StorageBridge {
  constructor(private readonly snackbase: SnackBaseClient) {}

  /**
   * Supabase: `supabase.storage.from('bucket')`
   * Returns a bucket reference scoped to the given bucket name (used as path prefix).
   */
  from(bucket: string): BucketReference {
    return new BucketReference(bucket, this.snackbase);
  }

  async createBucket(_name: string): Promise<StorageBucketResult> {
    return wrap<{ name: string }>(() => Promise.reject(new NotSupportedError('storage.createBucket')));
  }

  async listBuckets(): Promise<StorageBucketsResult> {
    return wrap<Array<{ name: string }>>(() => Promise.reject(new NotSupportedError('storage.listBuckets')));
  }
}

/**
 * Represents a storage bucket (path-prefix scoped reference).
 * Mirrors Supabase's `storage.from('bucket').upload(...)` pattern.
 */
export class BucketReference {
  constructor(
    private readonly bucket: string,
    private readonly snackbase: SnackBaseClient,
  ) {}

  private prefixed(path: string): string {
    return this.bucket ? `${this.bucket}/${path}` : path;
  }

  async upload(
    path: string,
    file: File | Blob,
    options?: { contentType?: string; upsert?: boolean },
  ): Promise<StorageUploadResult> {
    return wrap<{ path: string }>(async () => {
      await this.snackbase.files.upload(file, {
        filename: this.prefixed(path),
        contentType: options?.contentType,
      });
      return { path };
    });
  }

  async download(path: string): Promise<StorageDownloadResult> {
    return wrap<Blob>(async () => {
      const url = this.snackbase.files.getDownloadUrl(this.prefixed(path));
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      return response.blob();
    });
  }

  /**
   * Returns the public URL for a file. Synchronous, never errors.
   * Mirrors Supabase's synchronous `getPublicUrl()`.
   */
  getPublicUrl(path: string): PublicUrlResult {
    const fullPath = this.prefixed(path);
    return {
      data: {
        publicUrl: this.snackbase.files.getDownloadUrl(fullPath),
      },
    };
  }

  async remove(paths: string[]): Promise<StorageRemoveResult> {
    return wrap<Array<{ name: string }>>(async () => {
      const results: Array<{ name: string }> = [];
      for (const path of paths) {
        await this.snackbase.files.delete(this.prefixed(path));
        results.push({ name: path });
      }
      return results;
    });
  }

  async list(_prefix?: string): Promise<StorageListResult> {
    return wrap<Array<{ name: string }>>(() =>
      Promise.reject(new NotSupportedError('storage.from().list')),
    );
  }
}
