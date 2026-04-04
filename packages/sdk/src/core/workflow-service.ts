import { HttpClient } from './http-client';
import {
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowListParams,
  WorkflowListResponse,
  WorkflowInstance,
  WorkflowInstanceDetail,
  WorkflowTriggerResponse,
  WorkflowInstanceListParams,
  WorkflowInstanceListResponse,
} from '../types/workflow';

export class WorkflowService {
  constructor(private http: HttpClient) {}

  async list(params?: WorkflowListParams): Promise<WorkflowListResponse> {
    const response = await this.http.get<WorkflowListResponse>('/api/v1/workflows', { params });
    return response.data;
  }

  async get(id: string): Promise<Workflow> {
    const response = await this.http.get<Workflow>(`/api/v1/workflows/${id}`);
    return response.data;
  }

  async create(data: WorkflowCreate): Promise<Workflow> {
    const response = await this.http.post<Workflow>('/api/v1/workflows', data);
    return response.data;
  }

  async update(id: string, data: WorkflowUpdate): Promise<Workflow> {
    const response = await this.http.put<Workflow>(`/api/v1/workflows/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/workflows/${id}`);
    return { success: true };
  }

  async trigger(id: string, input?: Record<string, unknown>): Promise<WorkflowTriggerResponse> {
    const response = await this.http.post<WorkflowTriggerResponse>(
      `/api/v1/workflows/${id}/trigger`,
      input ?? {}
    );
    return response.data;
  }

  async listInstances(id: string, params?: WorkflowInstanceListParams): Promise<WorkflowInstanceListResponse> {
    const response = await this.http.get<WorkflowInstanceListResponse>(
      `/api/v1/workflows/${id}/instances`,
      { params }
    );
    return response.data;
  }

  async getInstance(instanceId: string): Promise<WorkflowInstanceDetail> {
    const response = await this.http.get<WorkflowInstanceDetail>(
      `/api/v1/workflow-instances/${instanceId}`
    );
    return response.data;
  }

  async cancelInstance(instanceId: string): Promise<WorkflowInstance> {
    const response = await this.http.post<WorkflowInstance>(
      `/api/v1/workflow-instances/${instanceId}/cancel`
    );
    return response.data;
  }

  async retryInstance(instanceId: string): Promise<WorkflowInstance> {
    const response = await this.http.post<WorkflowInstance>(
      `/api/v1/workflow-instances/${instanceId}/resume`
    );
    return response.data;
  }
}
