export type WebhookEvent = 'create' | 'update' | 'delete';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookCreate {
  name: string;
  url: string;
  events: WebhookEvent[];
  enabled?: boolean;
}

export type WebhookUpdate = Partial<WebhookCreate>;

export interface WebhookCreateResponse extends Webhook {
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  url: string;
  status: 'success' | 'failed' | 'pending';
  status_code?: number;
  response_body?: string;
  duration_ms?: number;
  created_at: string;
}

export interface WebhookListParams {
  page?: number;
  page_size?: number;
}

export interface WebhookListResponse {
  items: Webhook[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface WebhookDeliveryListParams {
  page?: number;
  page_size?: number;
}

export interface WebhookDeliveryListResponse {
  items: WebhookDelivery[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface WebhookTestResponse {
  success: boolean;
  status_code?: number;
  duration_ms?: number;
}
