import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './admin-service';
import { HttpClient } from './http-client';
import { Configuration, ConfigurationStats, ProviderDefinition, ConnectionTestResult } from '../types/admin';

describe('AdminService', () => {
  let httpClient: HttpClient;
  let adminService: AdminService;

  const mockConfig: Configuration = {
    id: 'conf-1',
    name: 'Primary SMTP',
    category: 'email',
    provider_name: 'sendgrid',
    is_system: true,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockStats: ConfigurationStats = {
    system_count: 5,
    account_count: 10,
    by_category: {
      email: { system: 1, account: 2 },
      auth: { system: 4, account: 8 },
    },
  };

  const mockProvider: ProviderDefinition = {
    name: 'sendgrid',
    display_name: 'SendGrid',
    category: 'email',
    is_built_in: true,
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    adminService = new AdminService(httpClient);
  });

  describe('getConfigurationStats', () => {
    it('should fetch configuration stats', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockStats,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.getConfigurationStats();
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getRecentConfigurations', () => {
    it('should fetch recent configurations', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: [mockConfig],
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.getRecentConfigurations(5);
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/recent', { params: { limit: 5 } });
      expect(result).toEqual([mockConfig]);
    });
  });

  describe('listSystemConfigurations', () => {
    it('should fetch system configurations', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: [mockConfig],
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.listSystemConfigurations('email');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/system', { params: { category: 'email' } });
      expect(result).toEqual([mockConfig]);
    });
  });

  describe('listAccountConfigurations', () => {
    it('should fetch account configurations', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: [mockConfig],
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.listAccountConfigurations('acc-1', 'auth');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/account', { params: { account_id: 'acc-1', category: 'auth' } });
      expect(result).toEqual([mockConfig]);
    });
  });

  describe('getConfigurationValues', () => {
    it('should fetch configuration values', async () => {
      const mockValues = { apiKey: 'masked_***', host: 'smtp.sendgrid.net' };
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockValues,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.getConfigurationValues('conf-1');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1/values');
      expect(result).toEqual(mockValues);
    });
  });

  describe('updateConfigurationValues', () => {
    it('should update configuration values', async () => {
      const mockValues = { host: 'new.smtp.net' };
      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: mockValues,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.updateConfigurationValues('conf-1', mockValues);
      expect(patchSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1/values', mockValues);
      expect(result).toEqual(mockValues);
    });
  });

  describe('updateConfigurationStatus', () => {
    it('should update configuration status', async () => {
      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: { ...mockConfig, enabled: false },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.updateConfigurationStatus('conf-1', false);
      expect(patchSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1', { enabled: false });
      expect(result.enabled).toBe(false);
    });
  });

  describe('createConfiguration', () => {
    it('should create a configuration', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockConfig,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const data = {
        name: 'Test',
        category: 'email',
        provider_name: 'sendgrid',
        values: { key: 'val' }
      };
      const result = await adminService.createConfiguration(data);
      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/configuration', data);
      expect(result).toEqual(mockConfig);
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete a configuration', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: { success: true },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.deleteConfiguration('conf-1');
      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1');
      expect(result.success).toBe(true);
    });
  });

  describe('listProviders', () => {
    it('should list providers', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: [mockProvider],
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.listProviders('email');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/providers', { params: { category: 'email' } });
      expect(result).toEqual([mockProvider]);
    });
  });

  describe('getProviderSchema', () => {
    it('should fetch provider schema', async () => {
      const mockSchema = { type: 'object', properties: {} };
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockSchema,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.getProviderSchema('email', 'sendgrid');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/schema/email/sendgrid');
      expect(result).toEqual(mockSchema);
    });
  });

  describe('testConnection', () => {
    it('should test provider connection', async () => {
      const mockResult: ConnectionTestResult = { success: true, message: 'Connected' };
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockResult,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const config = { api_key: 'test' };
      const result = await adminService.testConnection('email', 'sendgrid', config);
      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/test-connection', {
        category: 'email',
        provider_name: 'sendgrid',
        config
      }, { timeout: 15000 });
      expect(result).toEqual(mockResult);
    });
  });
});
