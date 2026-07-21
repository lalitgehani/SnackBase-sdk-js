import { HttpClient } from './http-client';
import {
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookCreateResponse,
  WebhookListResponse,
  WebhookDeliveryListParams,
  WebhookDeliveryListResponse,
  WebhookTestResponse,
} from '../types/webhook';

export class WebhookService {
  constructor(private http: HttpClient) {}

  /**
   * List all webhooks for the current account.
   * Backend returns the full list (no pagination).
   */
  async list(): Promise<WebhookListResponse> {
    const response = await this.http.get<WebhookListResponse>('/api/v1/webhooks');
    return response.data;
  }

  async get(id: string): Promise<Webhook> {
    const response = await this.http.get<Webhook>(`/api/v1/webhooks/${id}`);
    return response.data;
  }

  async create(data: WebhookCreate): Promise<WebhookCreateResponse> {
    const response = await this.http.post<WebhookCreateResponse>('/api/v1/webhooks', data);
    return response.data;
  }

  async update(id: string, data: WebhookUpdate): Promise<Webhook> {
    const response = await this.http.put<Webhook>(`/api/v1/webhooks/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/webhooks/${id}`);
    return { success: true };
  }

  async test(id: string): Promise<WebhookTestResponse> {
    const response = await this.http.post<WebhookTestResponse>(`/api/v1/webhooks/${id}/test`);
    return response.data;
  }

  /**
   * List delivery history for a webhook.
   * Query params: limit, offset (backend contract).
   */
  async listDeliveries(id: string, params?: WebhookDeliveryListParams): Promise<WebhookDeliveryListResponse> {
    const response = await this.http.get<WebhookDeliveryListResponse>(
      `/api/v1/webhooks/${id}/deliveries`,
      { params }
    );
    return response.data;
  }
}
