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
