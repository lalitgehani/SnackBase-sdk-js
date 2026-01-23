import { HttpClient } from './http-client';
import { 
  Collection, 
  CollectionCreate, 
  CollectionUpdate 
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
}
