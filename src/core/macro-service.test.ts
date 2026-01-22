import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MacroService } from './macro-service';
import { HttpClient } from './http-client';
import { MacroCreate, MacroUpdate } from '../types/macro';

describe('MacroService', () => {
  let macroService: MacroService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    macroService = new MacroService(mockHttpClient as unknown as HttpClient);
  });

  describe('list', () => {
    it('should call GET /api/v1/macros', async () => {
      const mockResponse = { data: { items: [], total: 0 } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await macroService.list();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/macros');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should call GET /api/v1/macros/:id', async () => {
      const mockMacro = { id: 'macro-1', name: 'Owns Record' };
      mockHttpClient.get.mockResolvedValue({ data: mockMacro });

      const result = await macroService.get('macro-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/macros/macro-1');
      expect(result).toEqual(mockMacro);
    });
  });

  describe('create', () => {
    it('should call POST /api/v1/macros with macro data', async () => {
      const macroData: MacroCreate = { 
        name: 'Is Manager', 
        description: 'Checks if user is a manager',
        sql_query: 'SELECT count(*) > 0 FROM employees WHERE manager_id = @user_id',
        parameters: ['user_id']
      };
      const mockResponse = { data: { id: 'macro-1', ...macroData, is_builtin: false } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await macroService.create(macroData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/macros', macroData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('update', () => {
    it('should call PATCH /api/v1/macros/:id with update data', async () => {
      const updateData: MacroUpdate = { name: 'Is Team Lead' };
      const mockResponse = { data: { id: 'macro-1', ...updateData } };
      mockHttpClient.patch.mockResolvedValue(mockResponse);

      const result = await macroService.update('macro-1', updateData);

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/macros/macro-1', updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/v1/macros/:id', async () => {
      mockHttpClient.delete.mockResolvedValue({});

      const result = await macroService.delete('macro-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/macros/macro-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('test', () => {
    it('should call POST /api/v1/macros/:id/test with params', async () => {
      const params = { user_id: 'user-1' };
      const mockResponse = { data: { success: true, result: true } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await macroService.test('macro-1', params);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/macros/macro-1/test', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
