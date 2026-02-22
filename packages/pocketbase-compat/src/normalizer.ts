/**
 * Field-name mapping and pagination conversion utilities.
 *
 * SnackBase uses `created_at` / `updated_at`; PocketBase uses `created` / `updated`.
 * These helpers translate between the two conventions.
 */

import type { ListResult, RecordModel } from './types.js';
import { rewriteFilterFields, rewriteSortField } from './filter-rewriter.js';

/**
 * Converts a raw SnackBase record to a PocketBase RecordModel shape.
 * - Maps `created_at` → `created`
 * - Maps `updated_at` → `updated`
 * - Injects `collectionId = collectionName` (approximation)
 * - Injects `collectionName`
 */
export function toRecordModel<T extends Record<string, any>>(
  raw: T,
  collectionName: string,
): T & RecordModel {
  const { created_at, updated_at, ...rest } = raw as any;

  return {
    ...rest,
    collectionId: collectionName,
    collectionName,
    created: created_at ?? '',
    updated: updated_at ?? '',
  } as T & RecordModel;
}

/**
 * Strips PocketBase-specific fields before sending to SnackBase.
 * Removes: `collectionId`, `collectionName`, `created`, `updated`, `expand`.
 */
export function fromRecordModel(pbRecord: Record<string, any>): Record<string, any> {
  const { collectionId, collectionName, created, updated, expand, ...rest } = pbRecord;
  return rest;
}

/**
 * Converts a SnackBase list response to PocketBase ListResult shape.
 *
 * @param snackResult - { items: T[], total: number } from SnackBase
 * @param collectionName - collection name to inject into each record
 * @param page - current page (1-based)
 * @param perPage - items per page
 */
export function toListResult<T extends Record<string, any>>(
  snackResult: { items: T[]; total: number },
  collectionName: string,
  page: number,
  perPage: number,
): ListResult<T & RecordModel> {
  const totalItems = snackResult.total;
  const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;
  return {
    page,
    perPage,
    totalItems,
    totalPages,
    items: snackResult.items.map((item) => toRecordModel(item, collectionName)),
  };
}

/**
 * Converts PocketBase-style pagination params to SnackBase list params.
 * Also rewrites `sort` and `filter` field names from PB convention to SnackBase.
 */
export function toSnackListParams(
  page: number,
  perPage: number,
  opts: {
    sort?: string;
    filter?: string;
    expand?: string | string[];
    fields?: string | string[];
    [key: string]: any;
  } = {},
): Record<string, any> {
  const params: Record<string, any> = {
    skip: (page - 1) * perPage,
    limit: perPage,
  };

  if (opts.sort) {
    params.sort = rewriteSortField(opts.sort);
  }

  if (opts.filter) {
    params.filter = rewriteFilterFields(opts.filter);
  }

  if (opts.expand) {
    params.expand = Array.isArray(opts.expand) ? opts.expand.join(',') : opts.expand;
  }

  if (opts.fields) {
    params.fields = Array.isArray(opts.fields) ? opts.fields.join(',') : opts.fields;
  }

  return params;
}
