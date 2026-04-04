import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './admin-service';
import { HttpClient } from './http-client';
import {
  Configuration,
  ConfigurationStats,
  ProviderDefinition,
  ConnectionTestResult,
  SetDefaultResult,
  UnsetDefaultResult,
  UpdateConfigurationStatusResult
} from '../types/admin';

describe('AdminService', () => {
  let httpClient: HttpClient;
  let adminService: AdminService;

  const mockConfig: Configuration = {
    id: 'conf-1',
    display_name: 'Primary SMTP',
    category: 'email',
    provider_name: 'sendgrid',
    enabled: true,
    is_default: false,
    updated_at: new Date().toISOString(),
  };

  const mockStats: ConfigurationStats = {
    system_configs: { total: 5, by_category: { email: 1, auth: 4 } },
    account_configs: { total: 10, by_category: { email: 2, auth: 8 } },
  };

  const mockProvider: ProviderDefinition = {
    provider_name: 'sendgrid',
    display_name: 'SendGrid',
    category: 'email',
    is_builtin: true,
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
      const mockResult: UpdateConfigurationStatusResult = {
        status: 'success',
        enabled: false,
        is_default: false,
      };
      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: mockResult,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.updateConfigurationStatus('conf-1', false);
      expect(patchSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1', { enabled: false });
      expect(result.enabled).toBe(false);
      expect(result.is_default).toBe(false);
      expect(result.status).toBe('success');
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
        display_name: 'Test',
        category: 'email',
        provider_name: 'sendgrid',
        config: { key: 'val' }
      };
      const result = await adminService.createConfiguration(data);
      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/configuration', data);
      expect(result).toBeDefined();
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

  describe('setConfigurationDefault', () => {
    it('should set a configuration as default', async () => {
      const mockResult: SetDefaultResult = {
        status: 'success',
        is_default: true,
        provider_name: 'sendgrid',
        display_name: 'SendGrid',
      };
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockResult,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.setConfigurationDefault('conf-1');
      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1/set-default');
      expect(result.status).toBe('success');
      expect(result.is_default).toBe(true);
      expect(result.provider_name).toBe('sendgrid');
      expect(result.display_name).toBe('SendGrid');
    });
  });

  describe('unsetConfigurationDefault', () => {
    it('should clear the default flag from a configuration', async () => {
      const mockResult: UnsetDefaultResult = {
        status: 'success',
        is_default: false,
      };
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: mockResult,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await adminService.unsetConfigurationDefault('conf-1');
      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/admin/configuration/conf-1/set-default');
      expect(result.status).toBe('success');
      expect(result.is_default).toBe(false);
    });
  });
});
