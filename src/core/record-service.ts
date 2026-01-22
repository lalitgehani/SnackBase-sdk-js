import { HttpClient } from './http-client';
import { QueryBuilder } from './query-builder';
import { 
  BaseRecord, 
  RecordListParams, 
  RecordListResponse 
} from '../types/record';

/**
 * Service for performing CRUD operations on dynamic collections.
 */
export class RecordService {
  constructor(private http: HttpClient) {}

  /**
   * List records from a collection with pagination, filtering, and sorting.
   * @template T The record type
   * @param collection Collection name
   * @param params Query parameters
   */
  async list<T = any>(
    collection: string, 
    params?: RecordListParams
  ): Promise<RecordListResponse<T>> {
    const formattedParams: any = {};
    if (params) {
      if (params.skip !== undefined) formattedParams.skip = params.skip;
      if (params.limit !== undefined) formattedParams.limit = params.limit;
      if (params.sort !== undefined) formattedParams.sort = params.sort;
      if (params.fields) {
        formattedParams.fields = Array.isArray(params.fields) 
          ? params.fields.join(',') 
          : params.fields;
      }
      if (params.expand) {
        formattedParams.expand = Array.isArray(params.expand) 
          ? params.expand.join(',') 
          : params.expand;
      }
      if (params.filter) {
        formattedParams.filter = typeof params.filter === 'string' 
          ? params.filter 
          : JSON.stringify(params.filter);
      }
    }

    const response = await this.http.get<RecordListResponse<T>>(
      `/api/v1/collections/${collection}/records`,
      { params: formattedParams }
    );
    return response.data;
  }

  /**
   * Create a query builder for the collection.
   * @template T The record type
   * @param collection Collection name
   */
  query<T = any>(collection: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this, collection);
  }

  /**
   * Get a single record by ID.
   * @template T The record type
   * @param collection Collection name
   * @param recordId Record ID
   * @param params Optional query parameters (e.g., fields)
   */
  async get<T = any>(
    collection: string, 
    recordId: string, 
    params?: { fields?: string[] | string; expand?: string[] | string }
  ): Promise<T & BaseRecord> {
    const formattedParams: any = {};
    if (params) {
      if (params.fields) {
        formattedParams.fields = Array.isArray(params.fields) 
          ? params.fields.join(',') 
          : params.fields;
      }
      if (params.expand) {
        formattedParams.expand = Array.isArray(params.expand) 
          ? params.expand.join(',') 
          : params.expand;
      }
    }

    const response = await this.http.get<T & BaseRecord>(
      `/api/v1/collections/${collection}/records/${recordId}`,
      { params: formattedParams }
    );
    return response.data;
  }

  /**
   * Create a new record in a collection.
   * @template T The record type
   * @param collection Collection name
   * @param data Record data
   */
  async create<T = any>(
    collection: string, 
    data: Partial<T>
  ): Promise<T & BaseRecord> {
    const response = await this.http.post<T & BaseRecord>(
      `/api/v1/collections/${collection}/records`,
      data
    );
    return response.data;
  }

  /**
   * Full update of an existing record (PUT).
   * @template T The record type
   * @param collection Collection name
   * @param recordId Record ID
   * @param data Record data
   */
  async update<T = any>(
    collection: string, 
    recordId: string, 
    data: Partial<T>
  ): Promise<T & BaseRecord> {
    const response = await this.http.put<T & BaseRecord>(
      `/api/v1/collections/${collection}/records/${recordId}`,
      data
    );
    return response.data;
  }

  /**
   * Partial update of an existing record (PATCH).
   * @template T The record type
   * @param collection Collection name
   * @param recordId Record ID
   * @param data Partial record data
   */
  async patch<T = any>(
    collection: string, 
    recordId: string, 
    data: Partial<T>
  ): Promise<T & BaseRecord> {
    const response = await this.http.patch<T & BaseRecord>(
      `/api/v1/collections/${collection}/records/${recordId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a record from a collection.
   * @param collection Collection name
   * @param recordId Record ID
   */
  async delete(
    collection: string, 
    recordId: string
  ): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/collections/${collection}/records/${recordId}`);
    return { success: true };
  }
}
