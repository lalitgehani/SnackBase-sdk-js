import { HttpClient } from './http-client';
import { 
  Collection, 
  CollectionCreate, 
  CollectionUpdate,
  CollectionExportData,
  CollectionExportParams,
  CollectionImportRequest,
  CollectionImportResult
} from '../types/collection';

/**
 * Service for managing collections and their schemas.
 * Requires superadmin authentication.
 */
export class CollectionService {
  constructor(private http: HttpClient) {}

  /**
   * List all collections.
   */
  async list(): Promise<Collection[]> {
    const response = await this.http.get<Collection[]>('/api/v1/collections');
    return response.data;
  }

  /**
   * List collection names only.
   */
  async listNames(): Promise<string[]> {
    const response = await this.http.get<string[]>('/api/v1/collections/names');
    return response.data;
  }

  /**
   * Get schema details for a specific collection.
   */
  async get(collectionId: string): Promise<Collection> {
    const response = await this.http.get<Collection>(`/api/v1/collections/${collectionId}`);
    return response.data;
  }

  /**
   * Create a new collection and its physical table.
   */
  async create(data: CollectionCreate): Promise<Collection> {
    const response = await this.http.post<Collection>('/api/v1/collections', data);
    return response.data;
  }

  /**
   * Update an existing collection schema.
   * Note: Field types cannot be changed for data safety.
   */
  async update(collectionId: string, data: CollectionUpdate): Promise<Collection> {
    const response = await this.http.patch<Collection>(`/api/v1/collections/${collectionId}`, data);
    return response.data;
  }

  /**
   * Delete a collection and drop its physical table.
   */
  async delete(collectionId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/collections/${collectionId}`);
    return { success: true };
  }

  /**
   * Export collections to JSON format.
   * Returns collection schemas and rules for backup or migration.
   *
   * @param params Optional filter by collection IDs
   * @returns Complete export data structure with collections, schemas, and rules
   * @throws {AuthorizationError} If user is not a superadmin
   *
   * @example
   * // Export all collections
   * const exportData = await client.collections.export();
   *
   * @example
   * // Export specific collections
   * const exportData = await client.collections.export({
   *   collection_ids: ['col-123', 'col-456']
   * });
   */
  async export(params?: CollectionExportParams): Promise<CollectionExportData> {
    const queryParams: Record<string, string> = {};

    // Serialize collection_ids array to comma-separated string
    if (params?.collection_ids && params.collection_ids.length > 0) {
      queryParams.collection_ids = params.collection_ids.join(',');
    }

    const response = await this.http.get<CollectionExportData>(
      '/api/v1/collections/export',
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Import collections from JSON export.
   *
   * @param request Import request with data and conflict strategy
   * @returns Import result with per-collection status and migration IDs
   * @throws {ValidationError} If import data is invalid
   * @throws {ConflictError} If collection exists and strategy is 'error'
   * @throws {AuthorizationError} If user is not a superadmin
   *
   * @example
   * // Import with error strategy (fail on conflicts)
   * const result = await client.collections.import({
   *   data: exportData,
   *   strategy: 'error'
   * });
   *
   * @example
   * // Import with skip strategy (skip existing collections)
   * const result = await client.collections.import({
   *   data: exportData,
   *   strategy: 'skip'
   * });
   *
   * @example
   * // Import with update strategy (update existing collections)
   * const result = await client.collections.import({
   *   data: exportData,
   *   strategy: 'update'
   * });
   */
  async import(request: CollectionImportRequest): Promise<CollectionImportResult> {
    const response = await this.http.post<CollectionImportResult>(
      '/api/v1/collections/import',
      request
    );
    return response.data;
  }
}
