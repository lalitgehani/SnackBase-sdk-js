import { SnackBaseConfig, DEFAULT_CONFIG, StorageBackend } from '../types/config';
import { getAutoDetectedStorage } from '../utils/platform';

/**
 * Main SDK client for interacting with SnackBase API.
 */
export class SnackBaseClient {
  private config: Required<SnackBaseConfig>;

  /**
   * Initialize a new SnackBaseClient instance.
   * @param config Configuration options
   */
  constructor(config: SnackBaseConfig) {
    this.validateConfig(config);
    
    this.config = {
      ...DEFAULT_CONFIG,
      storageBackend: config.storageBackend || getAutoDetectedStorage(),
      ...config,
    } as Required<SnackBaseConfig>;
  }

  /**
   * Returns the current client configuration.
   */
  getConfig(): Required<SnackBaseConfig> {
    return { ...this.config };
  }

  /**
   * Validates the configuration object.
   * Throws descriptive errors for invalid options.
   */
  private validateConfig(config: SnackBaseConfig): void {
    if (!config.baseUrl) {
      throw new Error('SnackBaseClient: baseUrl is required');
    }

    try {
      new URL(config.baseUrl);
    } catch (e) {
      throw new Error('SnackBaseClient: baseUrl must be a valid URL');
    }

    if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout < 0)) {
      throw new Error('SnackBaseClient: timeout must be a non-negative number');
    }

    if (config.maxRetries !== undefined && (typeof config.maxRetries !== 'number' || config.maxRetries < 0)) {
      throw new Error('SnackBaseClient: maxRetries must be a non-negative number');
    }

    if (config.retryDelay !== undefined && (typeof config.retryDelay !== 'number' || config.retryDelay < 0)) {
      throw new Error('SnackBaseClient: retryDelay must be a non-negative number');
    }

    if (config.refreshBeforeExpiry !== undefined && (typeof config.refreshBeforeExpiry !== 'number' || config.refreshBeforeExpiry < 0)) {
      throw new Error('SnackBaseClient: refreshBeforeExpiry must be a non-negative number');
    }
  }
}
