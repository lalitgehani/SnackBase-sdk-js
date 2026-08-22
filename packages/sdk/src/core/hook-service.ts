import { HttpClient } from './http-client';
import {
  Hook,
  HookCreate,
  HookUpdate,
  HookListParams,
  HookListResponse,
  HookExecutionListParams,
  HookExecutionListResponse,
} from '../types/hook';

export class HookService {
  constructor(private http: HttpClient) {}

  async list(params?: HookListParams): Promise<HookListResponse> {
    const response = await this.http.get<HookListResponse>('/api/v1/hooks', { params });
    return response.data;
  }

  async get(id: string): Promise<Hook> {
    const response = await this.http.get<Hook>(`/api/v1/hooks/${id}`);
    return response.data;
  }

  async create(data: HookCreate): Promise<Hook> {
    const response = await this.http.post<Hook>('/api/v1/hooks', data);
    return response.data;
  }

  async update(id: string, data: HookUpdate): Promise<Hook> {
    const response = await this.http.patch<Hook>(`/api/v1/hooks/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/hooks/${id}`);
    return { success: true };
  }

  async toggle(id: string): Promise<Hook> {
    const response = await this.http.patch<Hook>(`/api/v1/hooks/${id}/toggle`);
    return response.data;
  }

  async trigger(id: string): Promise<Record<string, unknown>> {
    const response = await this.http.post<Record<string, unknown>>(
      `/api/v1/hooks/${id}/trigger`,
    );
    return response.data;
  }

  async listExecutions(id: string, params?: HookExecutionListParams): Promise<HookExecutionListResponse> {
    const response = await this.http.get<HookExecutionListResponse>(
      `/api/v1/hooks/${id}/executions`,
      { params }
    );
    return response.data;
  }
}
