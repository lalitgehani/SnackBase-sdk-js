/**
 * Configuration record representing a system or account level setting.
 */
export interface Configuration {
  id: string;
  display_name: string;
  category: string;
  provider_name: string;
  is_system?: boolean;
  is_builtin?: boolean;
  account_id?: string;
  enabled: boolean;
  is_default?: boolean;
  priority?: number;
  logo_url?: string;
  created_at?: string;
  updated_at: string;
}

/**
 * Statistics for configurations by category.
 */
export interface ConfigurationStats {
  system_configs: {
    total: number;
    by_category: Record<string, number>;
  };
  account_configs: {
    total: number;
    by_category: Record<string, number>;
  };
}

/**
 * Available provider definition.
 */
export interface ProviderDefinition {
  provider_name: string;
  display_name: string;
  category: string;
  is_builtin: boolean;
  logo_url?: string;
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
  display_name: string;
  category: string;
  provider_name: string;
  config: Record<string, any>;
  account_id?: string;
  enabled?: boolean;
}

/**
 * Result of creating a configuration.
 */
export interface ConfigurationCreateResult {
  id: string;
  status: string;
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

/**
 * Result of enabling or disabling a configuration.
 */
export interface UpdateConfigurationStatusResult {
  status: string;
  enabled: boolean;
  is_default: boolean;
}

/**
 * Result of setting a configuration as the default provider.
 */
export interface SetDefaultResult {
  status: string;
  is_default: boolean;
  provider_name: string;
  display_name: string;
}

/**
 * Result of unsetting a configuration's default flag.
 */
export interface UnsetDefaultResult {
  status: string;
  is_default: boolean;
}
