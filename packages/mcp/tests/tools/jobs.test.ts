import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleJobsTool } from '../../src/tools/jobs.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_jobs tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      jobs: {
        list: vi.fn(),
        stats: vi.fn(),
        retry: vi.fn(),
        cancel: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockJobs = { items: [{ id: 'j-1', status: 'pending', type: 'email' }], total: 1 };
    mockClient.jobs.list.mockResolvedValue(mockJobs);

    const result = await handleJobsTool({ action: 'list' }) as any;

    expect(mockClient.jobs.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockJobs, null, 2));
  });

  it('handles stats action and returns all count fields', async () => {
    const mockStats = {
      pending: 5,
      running: 2,
      completed: 100,
      failed: 3,
      cancelled: 1,
    };
    mockClient.jobs.stats.mockResolvedValue(mockStats);

    const result = await handleJobsTool({ action: 'stats' }) as any;

    expect(mockClient.jobs.stats).toHaveBeenCalled();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.pending).toBeDefined();
    expect(parsed.running).toBeDefined();
    expect(parsed.completed).toBeDefined();
    expect(parsed.failed).toBeDefined();
    expect(parsed.cancelled).toBeDefined();
    expect(result.content[0].text).toBe(JSON.stringify(mockStats, null, 2));
  });

  it('handles retry action', async () => {
    const mockJob = { id: 'j-1', status: 'pending' };
    mockClient.jobs.retry.mockResolvedValue(mockJob);

    const result = await handleJobsTool({ action: 'retry', job_id: 'j-1' }) as any;

    expect(mockClient.jobs.retry).toHaveBeenCalledWith('j-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockJob, null, 2));
  });

  it('throws error when job_id is missing for retry', async () => {
    const result = await handleJobsTool({ action: 'retry' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('job_id is required');
  });

  it('handles cancel action', async () => {
    const mockJob = { id: 'j-1', status: 'cancelled' };
    mockClient.jobs.cancel.mockResolvedValue(mockJob);

    const result = await handleJobsTool({ action: 'cancel', job_id: 'j-1' }) as any;

    expect(mockClient.jobs.cancel).toHaveBeenCalledWith('j-1');
    expect(result.content[0].text).toBe(JSON.stringify(mockJob, null, 2));
  });

  it('throws error when job_id is missing for cancel', async () => {
    const result = await handleJobsTool({ action: 'cancel' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('job_id is required');
  });

  it('maps SDK errors correctly', async () => {
    mockClient.jobs.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleJobsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleJobsTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
