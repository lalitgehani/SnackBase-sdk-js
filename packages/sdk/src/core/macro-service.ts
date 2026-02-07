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
  async list(): Promise<MacroListResponse> {
    const response = await this.http.get<MacroListResponse>('/api/v1/macros');
    return response.data;
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
    const response = await this.http.patch<Macro>(`/api/v1/macros/${macroId}`, data);
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
   * Test a macro with parameters.
   */
  async test(macroId: string, params: Record<string, any>): Promise<MacroTestResult> {
    const response = await this.http.post<MacroTestResult>(
      `/api/v1/macros/${macroId}/test`,
      { params }
    );
    return response.data;
  }
}
