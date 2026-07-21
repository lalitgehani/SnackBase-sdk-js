/**
 * Backend field types (SnackBase collection_validator.FieldType).
 * Must match the server enum exactly for create/update validation.
 */
export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'email'
  | 'url'
  | 'json'
  | 'reference'
  | 'file'
  | 'date'
  | 'computed';

/** On-delete actions for reference fields (backend OnDeleteAction). */
export type OnDeleteAction = 'cascade' | 'set_null' | 'restrict';

/** PII mask strategies accepted when pii=true. */
export type MaskType = 'email' | 'ssn' | 'phone' | 'name' | 'full' | 'custom';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  /** Additional field options (e.g. file max size, select options if extended). */
  options?: string[] | Record<string, any> | null;
  /** Target collection name (required for reference type). */
  collection?: string | null;
  /** On delete action for reference fields: cascade, set_null, restrict. */
  on_delete?: OnDeleteAction | string | null;
  /** Whether this field contains PII data. */
  pii?: boolean;
  /** Mask type for PII fields (only when pii=true). */
  mask_type?: MaskType | string | null;
  /** SQL expression for computed (virtual) fields. */
  expression?: string | null;
  /** Return type of a computed field expression. */
  return_type?: 'text' | 'number' | 'boolean' | 'datetime' | null;
}

export interface Collection {
  id: string;
  name: string;
  fields: FieldDefinition[];
  record_count: number;
  field_count: number;
  created_at: string;
  updated_at: string;
  /** Whether this collection is accessible without authentication. */
  has_public_access?: boolean;
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
  options?: Record<string, any> | null;
  collection?: string | null;
  on_delete?: string | null;
  pii?: boolean;
  mask_type?: string | null;
  expression?: string | null;
  return_type?: string | null;
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
