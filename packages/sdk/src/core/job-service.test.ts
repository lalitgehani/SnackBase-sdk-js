import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobService } from './job-service';
import { HttpClient } from './http-client';
import { Job, JobStats, JobListResponse } from '../types/job';

describe('JobService', () => {
  let httpClient: HttpClient;
  let jobService: JobService;

  const mockJob: Job = {
    id: 'job-1',
    type: 'send_email',
    status: 'failed',
    payload: { to: 'user@example.com' },
    error: 'SMTP connection refused',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockStats: JobStats = {
    total: 100,
    pending: 10,
    running: 5,
    completed: 70,
    failed: 12,
    cancelled: 3,
  };

  const mockListResponse: JobListResponse = {
    items: [mockJob],
    total: 1,
    page: 1,
    per_page: 20,
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
    it('should cancel a job by id', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { ...mockJob, status: 'cancelled' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await jobService.cancel('job-1');

      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/jobs/job-1/cancel');
      expect(result.status).toBe('cancelled');
    });
  });
});
