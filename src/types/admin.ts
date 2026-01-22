/**
 * Configuration record representing a system or account level setting.
 */
export interface Configuration {
  id: string;
  name: string;
  category: string;
  provider_name: string;
  is_system: boolean;
  account_id?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Statistics for configurations by category.
 */
export interface ConfigurationStats {
  system_count: number;
  account_count: number;
  by_category: Record<string, {
    system: number;
    account: number;
  }>;
}

/**
 * Available provider definition.
 */
export interface ProviderDefinition {
  name: string;
  display_name: string;
  category: string;
  description?: string;
  is_built_in: boolean;
  icon?: string;
}

/**
 * Connection test result.
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Request data for creating a configuration.
 */
export interface ConfigurationCreate {
  name: string;
  category: string;
  provider_name: string;
  values: Record<string, any>;
  is_system?: boolean;
  account_id?: string;
  enabled?: boolean;
}

/**
 * Recent configuration summary.
 */
export interface RecentConfiguration extends Configuration {
  last_modified_by?: {
    id: string;
    email: string;
  };
}
