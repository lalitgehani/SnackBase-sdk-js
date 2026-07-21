export type WebhookEvent = 'create' | 'update' | 'delete';

export interface Webhook {
  id: string;
  account_id: string;
  url: string;
  collection: string;
  events: WebhookEvent[];
  filter: string | null;
  enabled: boolean;
  headers: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WebhookCreate {
  url: string;
  collection: string;
  events: WebhookEvent[];
  secret?: string;
  filter?: string | null;
  enabled?: boolean;
  headers?: Record<string, string> | null;
}

export type WebhookUpdate = Partial<WebhookCreate>;

export interface WebhookCreateResponse extends Webhook {
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  attempt_number: number;
  delivered_at: string | null;
  next_retry_at: string | null;
  status: string;
  created_at: string;
}

export interface WebhookListResponse {
  items: Webhook[];
  total: number;
}

/**
 * Delivery list query params (backend: limit/offset).
 */
export interface WebhookDeliveryListParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface WebhookDeliveryListResponse {
  items: WebhookDelivery[];
  total: number;
}

export interface WebhookTestResponse {
  success: boolean;
  status_code: number | null;
  response_body: string | null;
  error: string | null;
}
