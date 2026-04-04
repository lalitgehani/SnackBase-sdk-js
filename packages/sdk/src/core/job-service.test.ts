import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobService } from './job-service';
import { HttpClient } from './http-client';
import { Job, JobStats, JobListResponse } from '../types/job';

describe('JobService', () => {
  let httpClient: HttpClient;
  let jobService: JobService;

  const mockJob: Job = {
    id: 'job-1',
    queue: 'default',
    handler: 'send_email',
    status: 'failed',
    payload: { to: 'user@example.com' },
    priority: 0,
    run_at: null,
    started_at: null,
    completed_at: null,
    failed_at: new Date().toISOString(),
    error_message: 'SMTP connection refused',
    attempt_number: 1,
    max_retries: 3,
    retry_delay_seconds: 60,
    created_at: new Date().toISOString(),
    created_by: null,
    account_id: null,
  };

  const mockStats: JobStats = {
    pending: 10,
    running: 5,
    completed: 70,
    failed: 12,
    retrying: 3,
    dead: 2,
    avg_duration_seconds: null,
    failure_rate: 0.14,
  };

  const mockListResponse: JobListResponse = {
    items: [mockJob],
    total: 1,
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    jobService = new JobService(httpClient);
  });

  describe('list', () => {
    it('should fetch jobs with no params', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockListResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await jobService.list();

      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/jobs', { params: undefined });
      expect(result).toEqual(mockListResponse);
    });

    it('should pass status filter as query parameter', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockListResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await jobService.list({ status: 'failed' });

      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/jobs', { params: { status: 'failed' } });
      expect(result).toEqual(mockListResponse);
    });
  });

  describe('stats', () => {
    it('should fetch job stats', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockStats,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await jobService.stats();

      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/jobs/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('retry', () => {
    it('should retry a job by id', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockJob, status: 'pending' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await jobService.retry('job-1');

      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/jobs/job-1/retry');
      expect(result.status).toBe('pending');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending job by id (DELETE, returns void)', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: undefined,
        status: 204,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await jobService.cancel('job-1');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/admin/jobs/job-1');
      expect(result).toBeUndefined();
    });
  });
});
