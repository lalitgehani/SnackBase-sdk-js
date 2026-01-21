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
   * Filter parameters.
   */
  filter?: any;

  /**
   * Related collections to expand.
   */
  expand?: string[] | string;
}

/**
 * Paginated response for records.
 */
export interface RecordListResponse<T> {
  items: (T & BaseRecord)[];
  total: number;
  skip: number;
  limit: number;
}
