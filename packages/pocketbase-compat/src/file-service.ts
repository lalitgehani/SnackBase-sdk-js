/**
 * FileServiceCompat — `pb.files.*` bridge for @snackbase/pocketbase-compat.
 *
 * Wraps `@snackbase/sdk`'s `FileService` to expose PocketBase-compatible
 * `getURL()` / `getToken()` methods.
 *
 * Phase 5.
 */

import type { SnackBaseClient } from '@snackbase/sdk';

export class FileServiceCompat {
  private readonly _snackbase: SnackBaseClient;

  constructor(snackbase: SnackBaseClient) {
    this._snackbase = snackbase;
  }

  /**
   * Build the download URL for a file attached to a record.
   *
   * @param record  - Object with at least `id` and optionally `collectionName` / `collectionId`
   * @param filename - The filename stored in the record field
   * @param _queryParams - Optional PocketBase query params (thumb, token, download).
   *                       Not forwarded — included for API surface compatibility only.
   * @returns Download URL string, or `''` if `filename` or `record.id` is missing.
   */
  getURL(
    record: { id?: string; collectionName?: string; collectionId?: string; [key: string]: any },
    filename: string,
    _queryParams?: {
      thumb?: string;
      token?: string;
      download?: boolean;
      [key: string]: any;
    },
  ): string {
    if (!filename || !record.id) {
      return '';
    }

    const collection = record.collectionName ?? record.collectionId ?? '';
    const path = `${collection}/${record.id}/${filename}`;
    return this._snackbase.files.getDownloadUrl(path);
  }

  /**
   * Deprecated alias for `getURL()`.
   * @deprecated Use `getURL()` instead.
   */
  getUrl(
    record: { id?: string; collectionName?: string; collectionId?: string; [key: string]: any },
    filename: string,
    queryParams?: { thumb?: string; token?: string; download?: boolean; [key: string]: any },
  ): string {
    console.warn(
      '[pocketbase-compat] pb.files.getUrl() is deprecated. Use pb.files.getURL() instead.',
    );
    return this.getURL(record, filename, queryParams);
  }

  /**
   * Returns the current auth token — approximates PocketBase's private file token.
   *
   * SnackBase has no separate file-token endpoint; the regular auth token is returned.
   */
  getToken(_opts?: Record<string, any>): string {
    return this._snackbase.internalAuthManager.getState().token ?? '';
  }
}
