import { HttpClient } from './http-client';
import {
  MigrationListResponse,
  CurrentRevisionResponse,
  MigrationHistoryResponse,
} from '../types/migration';

/**
 * Service for viewing migration status and history.
 * Requires superadmin authentication.
 */
export class MigrationService {
  constructor(private http: HttpClient) {}

  /**
   * List all Alembic migration revisions.
   * Returns all migrations with their application status.
   */
  async list(): Promise<MigrationListResponse> {
    const response = await this.http.get<MigrationListResponse>('/api/v1/migrations');
    return response.data;
  }

  /**
   * Get the current database revision.
   * Returns the currently applied migration.
   */
  async getCurrent(): Promise<CurrentRevisionResponse | null> {
    try {
      const response = await this.http.get<CurrentRevisionResponse>(
        '/api/v1/migrations/current'
      );
      return response.data;
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get full migration history.
   * Returns all applied migrations in chronological order.
   */
  async getHistory(): Promise<MigrationHistoryResponse> {
    const response = await this.http.get<MigrationHistoryResponse>(
      '/api/v1/migrations/history'
    );
    return response.data;
  }
}
