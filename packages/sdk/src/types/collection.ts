export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'phone'
  | 'select'
  | 'multi_select'
  | 'relation'
  | 'json';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  options?: string[]; // For select and multi_select
  collection?: string; // For relation
}

export interface Collection {
  id: string;
  name: string;
  fields: FieldDefinition[];
  record_count: number;
  field_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionCreate {
  name: string;
  fields: FieldDefinition[];
  list_rule?: string | null;
  view_rule?: string | null;
  create_rule?: string | null;
  update_rule?: string | null;
  delete_rule?: string | null;
}

export interface CollectionUpdate {
  name?: string;
  fields?: FieldDefinition[];
  list_rule?: string | null;
  view_rule?: string | null;
  create_rule?: string | null;
  update_rule?: string | null;
  delete_rule?: string | null;
}

/**
 * Comprehensive field definition for export including all metadata
 */
export interface CollectionExportFieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  options?: Record<string, any> | null;  // For select/multi_select
  collection?: string | null;            // For reference fields
  on_delete?: string | null;             // CASCADE, SET_NULL, RESTRICT
  pii?: boolean;                         // PII marking for compliance
  mask_type?: string | null;             // Masking strategy (email, ssn, phone, name, full, custom)
}

/**
 * Access control rules structure for Permission System V2
 * Rule values:
 *  - null = locked (access denied)
 *  - "" (empty string) = public (all users can access)
 *  - Expression string = conditional access (RLS rule)
 */
export interface CollectionExportRules {
  list_rule: string | null;
  view_rule: string | null;
  create_rule: string | null;
  update_rule: string | null;
  delete_rule: string | null;
  list_fields: string;    // "*" or comma-separated field names
  view_fields: string;
  create_fields: string;
  update_fields: string;
}

/**
 * Single collection in export bundle
 */
export interface CollectionExportItem {
  name: string;
  schema: CollectionExportFieldDefinition[];
  rules: CollectionExportRules;
}

/**
 * Complete export file structure
 */
export interface CollectionExportData {
  version: string;         // Export format version (e.g., "1.0")
  exported_at: string;     // ISO 8601 timestamp
  exported_by: string;     // User email who performed export
  collections: CollectionExportItem[];
}

/**
 * Import conflict handling strategies
 */
export type ImportStrategy = 'error' | 'skip' | 'update';

/**
 * Import request payload
 */
export interface CollectionImportRequest {
  data: CollectionExportData;
  strategy?: ImportStrategy;  // Defaults to 'error' if not specified
}

/**
 * Import result for a single collection
 */
export interface CollectionImportItemResult {
  name: string;
  status: 'imported' | 'skipped' | 'updated' | 'error';
  message: string;  // Descriptive message about the result
}

/**
 * Complete import operation result
 */
export interface CollectionImportResult {
  success: boolean;           // Overall operation success
  imported_count: number;     // Number of collections newly imported
  skipped_count: number;      // Number of collections skipped
  updated_count: number;      // Number of collections updated
  failed_count: number;       // Number of collections that failed
  collections: CollectionImportItemResult[];  // Per-collection details
  migrations_created: string[];  // Migration revision IDs generated
}

/**
 * Export query parameters
 */
export interface CollectionExportParams {
  collection_ids?: string[];  // Optional filter by collection IDs
}
