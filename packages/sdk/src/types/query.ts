/**
 * Supported filter operators.
 */
export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | '~'        // LIKE / contains
  | 'IN'       // IN (list of values)
  | 'IS NULL'  // field IS NULL
  | 'IS NOT NULL' // field IS NOT NULL
  | '!~'       // Not Like (legacy, not supported by backend)
  | '?='       // Is Empty/Null (legacy, not supported by backend)
  | '?!=';     // Is Not Empty/Null (legacy, not supported by backend)

/**
 * Filter expression object.
 */
export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value?: any;
}

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort expression object.
 */
export interface SortExpression {
  field: string;
  direction: SortDirection;
}

/**
 * Query parameters interface matching the backend expectations.
 * This is similar to RecordListParams but used internally by the builder.
 */
export interface QueryParams {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
  fields?: string;
  skip?: number;
  limit?: number;
}
