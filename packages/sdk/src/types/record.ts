/**
 * Base record fields managed by the system.
 */
export interface BaseRecord {
  id: string;
  account_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  [key: string]: any;
}

/**
 * Parameters for listing records.
 */
export interface RecordListParams {
  /**
   * Number of records to skip.
   */
  skip?: number;

  /**
   * Maximum number of records to return.
   */
  limit?: number;

  /**
   * Sort expression (e.g., 'created_at' or '-created_at' for descending).
   */
  sort?: string;

  /**
   * Fields to include in the response.
   */
  fields?: string[] | string;

  /**
   * Filter expression string (e.g., 'status = "active"').
   */
  filter?: string;

  /**
   * Related collections to expand.
   */
  expand?: string[] | string;

  /**
   * Cursor token for forward cursor-based pagination.
   */
  cursor?: string;

  /**
   * Cursor token for backward cursor-based pagination.
   */
  cursor_before?: string;

  /**
   * When using cursor pagination, also return the total count.
   */
  include_count?: boolean;
}

/**
 * Paginated response for records.
 */
export interface RecordListResponse<T> {
  items: (T & BaseRecord)[];
  total: number;
  skip: number;
  limit: number;
  /** Cursor token to fetch the next page (cursor-based pagination). */
  next_cursor?: string | null;
  /** Cursor token to fetch the previous page (cursor-based pagination). */
  prev_cursor?: string | null;
  /** Whether more records exist after this page (cursor-based pagination). */
  has_more?: boolean;
}

// --- Batch operation types ---

export interface BatchCreateRequest {
  records: Record<string, any>[];
}

export interface BatchUpdateItem {
  id: string;
  data: Record<string, any>;
}

export interface BatchUpdateRequest {
  records: BatchUpdateItem[];
}

export interface BatchDeleteRequest {
  ids: string[];
}

export interface BatchCreateResponse {
  created: BaseRecord[];
  count: number;
}

export interface BatchUpdateResponse {
  updated: BaseRecord[];
  count: number;
}

export interface BatchDeleteResponse {
  deleted: string[];
  count: number;
}

// --- Aggregation types ---

export interface AggregationParams {
  /** Required. Aggregation functions, e.g. "count(),sum(price)" */
  functions: string;
  /** Fields to group by, e.g. "status,category" */
  group_by?: string;
  /** Pre-aggregation filter (SQL-like string) */
  filter?: string;
  /** Post-aggregation filter, e.g. "count() > 5" */
  having?: string;
}

export interface AggregationResponse {
  results: Record<string, any>[];
  total_groups: number;
}
