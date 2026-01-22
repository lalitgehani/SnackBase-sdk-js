export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  name: string;
  description?: string;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
}

export interface RoleListResponse {
  items: Role[];
  total: number;
}

export interface CollectionRule {
  list_rule: string | null;
  view_rule: string | null;
  create_rule: string | null;
  update_rule: string | null;
  delete_rule: string | null;
  list_fields: string;
  view_fields: string;
  create_fields: string;
  update_fields: string;
}

export interface CollectionRuleUpdate {
  list_rule?: string | null;
  view_rule?: string | null;
  create_rule?: string | null;
  update_rule?: string | null;
  delete_rule?: string | null;
  list_fields?: string;
  view_fields?: string;
  create_fields?: string;
  update_fields?: string;
}

export interface RuleValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface RuleTestResult {
  result: boolean;
}

export interface RuleValidationParams {
  rule: string;
  operation: 'list' | 'view' | 'create' | 'update' | 'delete';
  collectionFields: string[];
}

/**
 * Permission type alias for CollectionRule (Permission System V2).
 */
export type Permission = CollectionRule;
