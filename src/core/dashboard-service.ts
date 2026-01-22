import { HttpClient } from './http-client';
import { DashboardStats } from '../types/dashboard';

/**
 * Service for interacting with the Dashboard API.
 * Provides statistics and metrics for system monitoring.
 */
export class DashboardService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Retrieves dashboard statistics including counts for accounts, users, 
   * collections, and records, as well as recent activity and health metrics.
   * 
   * @returns {Promise<DashboardStats>} A promise that resolves to dashboard statistics.
   * @throws {AuthenticationError} If not authenticated.
   * @throws {AuthorizationError} If the user is not a superadmin.
   */
  async getStats(): Promise<DashboardStats> {
    const response = await this.httpClient.get<DashboardStats>('/api/v1/dashboard/stats');
    return response.data;
  }
}
