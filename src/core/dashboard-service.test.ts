import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from './dashboard-service';
import { HttpClient } from './http-client';
import { DashboardStats } from '../types/dashboard';

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
    it('should call GET /api/v1/dashboard/stats and return result', async () => {
      const mockStats: DashboardStats = {
        total_accounts: 10,
        total_users: 50,
        total_collections: 5,
        total_records: 1000,
        new_accounts_7d: 2,
        new_users_7d: 5,
        recent_registrations: [],
        system_health: {
          status: 'healthy',
          uptime: '10 days',
          version: '1.0.0',
        },
        active_sessions: 12,
        recent_audit_logs: [],
      };
      mockHttpClient.get.mockResolvedValue({ data: mockStats });

      const result = await service.getStats();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/dashboard/stats');
      expect(result).toEqual(mockStats);
    });

    it('should propagate errors from HttpClient', async () => {
      const error = new Error('Network Error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(service.getStats()).rejects.toThrow('Network Error');
    });
  });
});
