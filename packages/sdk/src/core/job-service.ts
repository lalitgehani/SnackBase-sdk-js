import { HttpClient } from './http-client';
import { Job, JobStats, JobListParams, JobListResponse } from '../types/job';

/**
 * Service for superadmin job queue management.
 */
export class JobService {
  constructor(private http: HttpClient) {}

  /**
   * Lists background jobs with optional filtering.
   */
  async list(params?: JobListParams): Promise<JobListResponse> {
    const response = await this.http.get<JobListResponse>('/api/v1/admin/jobs', { params });
    return response.data;
  }

  /**
   * Returns job queue statistics broken down by status.
   */
  async stats(): Promise<JobStats> {
    const response = await this.http.get<JobStats>('/api/v1/admin/jobs/stats');
    return response.data;
  }

  /**
   * Retries a failed or cancelled job.
   * @param id Job ID
   */
  async retry(id: string): Promise<Job> {
    const response = await this.http.post<Job>(`/api/v1/admin/jobs/${id}/retry`);
    return response.data;
  }

  /**
   * Cancels a pending or running job.
   * @param id Job ID
   */
  async cancel(id: string): Promise<Job> {
    const response = await this.http.post<Job>(`/api/v1/admin/jobs/${id}/cancel`);
    return response.data;
  }
}
