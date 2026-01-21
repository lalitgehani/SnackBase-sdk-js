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
}

export interface CollectionUpdate {
  name?: string;
  fields?: FieldDefinition[];
}
