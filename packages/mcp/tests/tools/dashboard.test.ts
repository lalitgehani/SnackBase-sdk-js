import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDashboardTool } from '../../src/tools/dashboard.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_dashboard tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      dashboard: {
        getStats: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles get_stats action', async () => {
    const mockStats = {
      total_accounts: 10,
      total_users: 50,
      total_collections: 5,
      total_records: 1000,
      system_health: 'healthy',
    };
    mockClient.dashboard.getStats.mockResolvedValue(mockStats);

    const result = await handleDashboardTool({ action: 'get_stats' }) as any;

    expect(mockClient.dashboard.getStats).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockStats, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.dashboard.getStats.mockRejectedValue(new Error('SDK Error'));

    const result = await handleDashboardTool({ action: 'get_stats' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleDashboardTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
