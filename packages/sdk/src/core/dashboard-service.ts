import { HttpClient } from './http-client';
import { DashboardStats, DashboardStatsParams } from '../types/dashboard';

/**
 * Service for interacting with the Dashboard API.
 * Provides statistics and metrics for system monitoring.
 */
export class DashboardService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Retrieves dashboard statistics including counts for accounts, users,
   * collections, and records, as well as growth series, automation health,
   * recent activity, and system health metrics.
   *
   * @param params Optional query parameters (e.g. range: '7d' | '30d' | '90d').
   * @returns A promise that resolves to dashboard statistics.
   * @throws {AuthenticationError} If not authenticated.
   * @throws {AuthorizationError} If the user is not a superadmin.
   */
  async getStats(params?: DashboardStatsParams): Promise<DashboardStats> {
    const query: Record<string, string> = {};
    if (params?.range !== undefined) {
      query.range = params.range;
    }

    const response = await this.httpClient.get<DashboardStats>(
      '/api/v1/dashboard/stats',
      Object.keys(query).length > 0 ? { params: query } : undefined
    );
    return response.data;
  }
}
