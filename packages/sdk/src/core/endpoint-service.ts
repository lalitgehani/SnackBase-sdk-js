import { HttpClient } from './http-client';
import {
  Endpoint,
  EndpointCreate,
  EndpointUpdate,
  EndpointListParams,
  EndpointListResponse,
  EndpointExecution,
  EndpointExecutionListParams,
  EndpointExecutionListResponse,
} from '../types/endpoint';

export class EndpointService {
  constructor(private http: HttpClient) {}

  async list(params?: EndpointListParams): Promise<EndpointListResponse> {
    const response = await this.http.get<EndpointListResponse>('/api/v1/endpoints', { params });
    return response.data;
  }

  async get(id: string): Promise<Endpoint> {
    const response = await this.http.get<Endpoint>(`/api/v1/endpoints/${id}`);
    return response.data;
  }

  async create(data: EndpointCreate): Promise<Endpoint> {
    const response = await this.http.post<Endpoint>('/api/v1/endpoints', data);
    return response.data;
  }

  async update(id: string, data: EndpointUpdate): Promise<Endpoint> {
    const response = await this.http.put<Endpoint>(`/api/v1/endpoints/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/endpoints/${id}`);
    return { success: true };
  }

  async toggle(id: string): Promise<Endpoint> {
    const response = await this.http.patch<Endpoint>(`/api/v1/endpoints/${id}/toggle`);
    return response.data;
  }

  async listExecutions(id: string, params?: EndpointExecutionListParams): Promise<EndpointExecutionListResponse> {
    const response = await this.http.get<EndpointExecutionListResponse>(
      `/api/v1/endpoints/${id}/executions`,
      { params }
    );
    return response.data;
  }
}
