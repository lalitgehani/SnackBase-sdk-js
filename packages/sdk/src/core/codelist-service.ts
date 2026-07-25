import { HttpClient } from './http-client';
import type {
  Codelist,
  CodelistCreate,
  CodelistOverride,
  CodelistUpdate,
  CodelistValueCreate,
  EffectiveCodelistValue,
  GetEffectiveValuesParams,
  OverridePayload,
} from '../types/codelist';

/**
 * Service for first-class codelists (shared reference dictionaries).
 */
export class CodelistService {
  constructor(private http: HttpClient) {}

  /** List codelists visible to the caller (system + own account). */
  async list(params?: { scope?: string; active?: boolean }): Promise<Codelist[]> {
    const response = await this.http.get<Codelist[]>('/api/v1/codelists', {
      params,
    });
    return response.data;
  }

  /** Get codelist metadata by code. */
  async get(code: string): Promise<Codelist> {
    const response = await this.http.get<Codelist>(`/api/v1/codelists/${code}`);
    return response.data;
  }

  /**
   * Effective values for the caller's account (or superadmin preview account_id).
   * Alias: getValues for picker UX.
   */
  async getValues(
    code: string,
    params?: GetEffectiveValuesParams,
  ): Promise<EffectiveCodelistValue[]> {
    const query: Record<string, string | number | boolean | undefined> | undefined =
      params
        ? {
            lang: params.lang,
            active: params.active,
            account_id: params.account_id,
          }
        : undefined;
    const response = await this.http.get<EffectiveCodelistValue[]>(
      `/api/v1/codelists/${code}/values`,
      { params: query },
    );
    return response.data;
  }

  /** Create a codelist (system requires superadmin). */
  async create(data: CodelistCreate): Promise<Codelist> {
    const response = await this.http.post<Codelist>('/api/v1/codelists', data);
    return response.data;
  }

  /** Update codelist metadata. */
  async update(code: string, data: CodelistUpdate): Promise<Codelist> {
    const response = await this.http.patch<Codelist>(
      `/api/v1/codelists/${code}`,
      data,
    );
    return response.data;
  }

  /** Soft-deactivate (or hard-delete when allowed). */
  async delete(code: string, hard = false): Promise<Codelist> {
    const response = await this.http.delete<Codelist>(`/api/v1/codelists/${code}`, {
      params: { hard },
    });
    return response.data;
  }

  /** Create a value (system or account extension). */
  async createValue(code: string, data: CodelistValueCreate): Promise<unknown> {
    const response = await this.http.post(
      `/api/v1/codelists/${code}/manage/values`,
      data,
    );
    return response.data;
  }

  /** Set account override for a value. */
  async setOverride(
    code: string,
    valueCode: string,
    data: OverridePayload,
    accountId?: string,
  ): Promise<CodelistOverride> {
    const response = await this.http.put<CodelistOverride>(
      `/api/v1/codelists/${code}/values/${valueCode}/override`,
      data,
      { params: accountId ? { account_id: accountId } : undefined },
    );
    return response.data;
  }

  /** Clear account override. */
  async clearOverride(
    code: string,
    valueCode: string,
    accountId?: string,
  ): Promise<void> {
    await this.http.delete(`/api/v1/codelists/${code}/values/${valueCode}/override`, {
      params: accountId ? { account_id: accountId } : undefined,
    });
  }
}
