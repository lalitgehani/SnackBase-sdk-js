import { HttpClient } from './http-client';
import {
  Macro,
  MacroCreate,
  MacroUpdate,
  MacroListResponse,
  MacroTestResult,
} from '../types/macro';

/**
 * Service for managing SQL macros.
 * Macros can be used in permission rules.
 * Requires superadmin authentication for most operations.
 */
export class MacroService {
  constructor(private http: HttpClient) {}

  /**
   * List all macros, including built-in ones.
   */
  async list(params?: { skip?: number; limit?: number }): Promise<MacroListResponse | Macro[]> {
    const response = await this.http.get<MacroListResponse | Macro[]>('/api/v1/macros', {
      params,
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }
    return data;
  }

  /**
   * Get details for a specific macro.
   */
  async get(macroId: string): Promise<Macro> {
    const response = await this.http.get<Macro>(`/api/v1/macros/${macroId}`);
    return response.data;
  }

  /**
   * Create a new custom macro.
   */
  async create(data: MacroCreate): Promise<Macro> {
    const response = await this.http.post<Macro>('/api/v1/macros', data);
    return response.data;
  }

  /**
   * Update an existing custom macro.
   * Built-in macros cannot be updated.
   */
  async update(macroId: string, data: MacroUpdate): Promise<Macro> {
    const response = await this.http.put<Macro>(`/api/v1/macros/${macroId}`, data);
    return response.data;
  }

  /**
   * Delete a macro.
   * Fails if the macro is built-in or currently in use.
   */
  async delete(macroId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/macros/${macroId}`);
    return { success: true };
  }

  /**
   * Test a macro with positional parameter values.
   * The array length must match the macro's `parameters` definition.
   */
  async test(macroId: string, params: string[]): Promise<MacroTestResult> {
    const response = await this.http.post<MacroTestResult>(
      `/api/v1/macros/${macroId}/test`,
      { parameters: params }
    );
    return response.data;
  }
}
