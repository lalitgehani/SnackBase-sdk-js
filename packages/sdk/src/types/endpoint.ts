export interface Endpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EndpointCreate {
  name: string;
  method: string;
  path: string;
  enabled?: boolean;
}

export type EndpointUpdate = EndpointCreate;

export interface EndpointExecution {
  id: string;
  endpoint_id: string;
  status: string;
  duration_ms?: number;
  created_at: string;
  completed_at?: string;
}

export interface EndpointListParams {
  page?: number;
  page_size?: number;
}

export interface EndpointListResponse {
  items: Endpoint[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface EndpointExecutionListParams {
  page?: number;
  page_size?: number;
}

export interface EndpointExecutionListResponse {
  items: EndpointExecution[];
  total: number;
  page?: number;
  page_size?: number;
}
