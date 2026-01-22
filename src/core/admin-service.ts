import { HttpClient } from './http-client';
import { 
  Configuration, 
  ConfigurationStats, 
  ProviderDefinition, 
  ConnectionTestResult,
  ConfigurationCreate,
  RecentConfiguration
} from '../types/admin';

/**
 * Service for superadmin operations and system configuration management.
 */
export class AdminService {
  constructor(private http: HttpClient) {}

  /**
   * Returns configuration statistics by category.
   */
  async getConfigurationStats(): Promise<ConfigurationStats> {
    const response = await this.http.get<ConfigurationStats>('/api/v1/admin/configuration/stats');
    return response.data;
  }

  /**
   * Returns recently modified configurations.
   * @param limit Number of configurations to return
   */
  async getRecentConfigurations(limit: number = 10): Promise<RecentConfiguration[]> {
    const response = await this.http.get<RecentConfiguration[]>('/api/v1/admin/configuration/recent', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Returns all system-level configurations.
   * @param category Optional category filter
   */
  async listSystemConfigurations(category?: string): Promise<Configuration[]> {
    const response = await this.http.get<Configuration[]>('/api/v1/admin/configuration/system', {
      params: { category }
    });
    return response.data;
  }

  /**
   * Returns configurations for specific account.
   * @param accountId Account ID
   * @param category Optional category filter
   */
  async listAccountConfigurations(accountId: string, category?: string): Promise<Configuration[]> {
    const response = await this.http.get<Configuration[]>('/api/v1/admin/configuration/account', {
      params: { account_id: accountId, category }
    });
    return response.data;
  }

  /**
   * Returns decrypted configuration values with secrets masked.
   * @param configId Configuration ID
   */
  async getConfigurationValues(configId: string): Promise<Record<string, any>> {
    const response = await this.http.get<Record<string, any>>(`/api/v1/admin/configuration/${configId}/values`);
    return response.data;
  }

  /**
   * Updates configuration values.
   * @param configId Configuration ID
   * @param values New configuration values
   */
  async updateConfigurationValues(configId: string, values: Record<string, any>): Promise<Record<string, any>> {
    const response = await this.http.patch<Record<string, any>>(`/api/v1/admin/configuration/${configId}/values`, values);
    return response.data;
  }

  /**
   * Enables or disables configuration.
   * @param configId Configuration ID
   * @param enabled Enabled status
   */
  async updateConfigurationStatus(configId: string, enabled: boolean): Promise<Configuration> {
    const response = await this.http.patch<Configuration>(`/api/v1/admin/configuration/${configId}`, { enabled });
    return response.data;
  }

  /**
   * Creates new configuration record.
   * @param data Configuration data
   */
  async createConfiguration(data: ConfigurationCreate): Promise<Configuration> {
    const response = await this.http.post<Configuration>('/api/v1/admin/configuration', data);
    return response.data;
  }

  /**
   * Deletes configuration.
   * @param configId Configuration ID
   */
  async deleteConfiguration(configId: string): Promise<{ success: boolean }> {
    const response = await this.http.delete<{ success: boolean }>(`/api/v1/admin/configuration/${configId}`);
    return response.data;
  }

  /**
   * Lists all available provider definitions.
   * @param category Optional category filter
   */
  async listProviders(category?: string): Promise<ProviderDefinition[]> {
    const response = await this.http.get<ProviderDefinition[]>('/api/v1/admin/configuration/providers', {
      params: { category }
    });
    return response.data;
  }

  /**
   * Returns JSON schema for provider configuration.
   * @param category Provider category
   * @param providerName Provider name
   */
  async getProviderSchema(category: string, providerName: string): Promise<Record<string, any>> {
    const response = await this.http.get<Record<string, any>>(`/api/v1/admin/configuration/schema/${category}/${providerName}`);
    return response.data;
  }

  /**
   * Tests provider connection.
   * @param category Provider category
   * @param providerName Provider name
   * @param config Configuration values to test
   */
  async testConnection(
    category: string, 
    providerName: string, 
    config: Record<string, any>
  ): Promise<ConnectionTestResult> {
    const response = await this.http.post<ConnectionTestResult>('/api/v1/admin/configuration/test-connection', {
      category,
      provider_name: providerName,
      config
    }, {
      timeout: 15000 
    });
    return response.data;
  }
}
