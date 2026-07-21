import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from './dashboard-service';
import { HttpClient } from './http-client';
import { DashboardStats } from '../types/dashboard';

function mockDashboardStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    total_accounts: 10,
    total_users: 50,
    total_collections: 5,
    total_records: 1000,
    new_accounts_7d: 2,
    new_users_7d: 5,
    range: '7d',
    previous_period: { new_accounts: 1, new_users: 3 },
    time_series: {
      accounts_created: [{ date: '2026-07-01', count: 1 }],
      users_created: [{ date: '2026-07-01', count: 2 }],
      audit_by_operation: [{ date: '2026-07-01', create: 1, update: 0, delete: 0 }],
    },
    recent_registrations: [
      {
        id: 'u1',
        email: 'a@example.com',
        account_id: 'uuid-1',
        account_code: 'AB1234',
        account_name: 'Acme',
        created_at: '2026-07-01T00:00:00Z',
      },
    ],
    system_health: {
      database_status: 'healthy',
      storage_usage_mb: 12.5,
    },
    active_sessions: 12,
    public_collections_count: 0,
    records_by_collection: [{ name: 'posts', count: 100 }],
    feature_counts: {
      hooks: 1,
      hooks_enabled: 1,
      webhooks: 2,
      webhooks_enabled: 1,
      workflows: 0,
      endpoints: 0,
      macros: 0,
      api_keys_active: 0,
      invitations_pending: 0,
    },
    jobs_by_status: {
      pending: 0,
      running: 0,
      completed: 10,
      failed: 0,
      retrying: 0,
      dead: 0,
    },
    hook_executions_summary: { success: 5, failed: 0, partial: 0 },
    webhook_deliveries_summary: { delivered: 3, failed: 0, pending: 0, retrying: 0 },
    recent_audit_logs: [],
    ...overrides,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
    };
    service = new DashboardService(mockHttpClient as unknown as HttpClient);
  });

  describe('getStats', () => {
    it('should call GET /api/v1/dashboard/stats without params when range omitted', async () => {
      const mockStats = mockDashboardStats();
      mockHttpClient.get.mockResolvedValue({ data: mockStats });

      const result = await service.getStats();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/dashboard/stats', undefined);
      expect(result).toEqual(mockStats);
      expect(result.system_health.database_status).toBe('healthy');
      expect(result.time_series.accounts_created).toHaveLength(1);
      expect(result.feature_counts.hooks).toBe(1);
    });

    it('should pass range query param when provided', async () => {
      const mockStats = mockDashboardStats({ range: '30d', new_accounts_7d: 8 });
      mockHttpClient.get.mockResolvedValue({ data: mockStats });

      const result = await service.getStats({ range: '30d' });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/dashboard/stats', {
        params: { range: '30d' },
      });
      expect(result.range).toBe('30d');
    });

    it('should pass range=90d for quarterly metrics', async () => {
      const mockStats = mockDashboardStats({ range: '90d' });
      mockHttpClient.get.mockResolvedValue({ data: mockStats });

      await service.getStats({ range: '90d' });

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/dashboard/stats', {
        params: { range: '90d' },
      });
    });

    it('should propagate errors from HttpClient', async () => {
      const error = new Error('Network Error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(service.getStats()).rejects.toThrow('Network Error');
    });
  });
});
