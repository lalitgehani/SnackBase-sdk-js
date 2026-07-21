/** HTTP methods supported by custom endpoints. */
export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Custom endpoint definition (response shape from the backend).
 */
export interface Endpoint {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  path: string;
  method: string;
  auth_required: boolean;
  condition: string | null;
  actions: Record<string, any>[];
  response_template: Record<string, any> | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EndpointCreate {
  name: string;
  path: string;
  method: EndpointMethod | string;
  description?: string | null;
  auth_required?: boolean;
  condition?: string | null;
  actions?: Record<string, any>[];
  response_template?: Record<string, any> | null;
  enabled?: boolean;
}

export type EndpointUpdate = Partial<EndpointCreate>;

export interface EndpointExecution {
  id: string;
  endpoint_id: string;
  status: string;
  duration_ms?: number | null;
  error_message?: string | null;
  request_context?: Record<string, any> | null;
  created_at: string;
  completed_at?: string | null;
}

/**
 * List query parameters for custom endpoints (backend: limit/offset + filters).
 */
export interface EndpointListParams {
  method?: string;
  enabled?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface EndpointListResponse {
  items: Endpoint[];
  total: number;
}

export interface EndpointExecutionListParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface EndpointExecutionListResponse {
  items: EndpointExecution[];
  total: number;
}
