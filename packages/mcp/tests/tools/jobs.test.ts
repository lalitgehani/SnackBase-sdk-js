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

  it('handles list with JobListParams (status, queue, handler, limit, offset)', async () => {
    const mockJobs = { items: [{ id: 'j-1', status: 'pending' }], total: 1 };
    mockClient.jobs.list.mockResolvedValue(mockJobs);

    const result = await handleJobsTool({
      action: 'list',
      status: 'failed',
      queue: 'default',
      handler: 'email',
      limit: 25,
      offset: 10,
    }) as any;

    expect(mockClient.jobs.list).toHaveBeenCalledWith({
      status: 'failed',
      queue: 'default',
      handler: 'email',
      limit: 25,
      offset: 10,
    });
    const callArg = mockClient.jobs.list.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('page');
    expect(callArg).not.toHaveProperty('per_page');
    expect(result.content[0].text).toBe(JSON.stringify(mockJobs, null, 2));
  });

  it('handles stats action', async () => {
    const mockStats = {
      pending: 5,
      running: 2,
      completed: 100,
      failed: 3,
      retrying: 1,
      dead: 0,
    };
    mockClient.jobs.stats.mockResolvedValue(mockStats);

    const result = await handleJobsTool({ action: 'stats' }) as any;

    expect(mockClient.jobs.stats).toHaveBeenCalled();
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

  it('handles cancel action (void SDK → success payload)', async () => {
    mockClient.jobs.cancel.mockResolvedValue(undefined);

    const result = await handleJobsTool({ action: 'cancel', job_id: 'j-1' }) as any;

    expect(mockClient.jobs.cancel).toHaveBeenCalledWith('j-1');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.jobs.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleJobsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });
});
