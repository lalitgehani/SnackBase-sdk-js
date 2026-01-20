import { SnackBaseConfig, DEFAULT_CONFIG } from '../types/config';
import { getAutoDetectedStorage } from '../utils/platform';
import { HttpClient } from './http-client';
import { 
  contentTypeInterceptor, 
  createAuthInterceptor, 
  errorNormalizationInterceptor, 
  errorInterceptor 
} from './interceptors';

/**
 * Main SDK client for interacting with SnackBase API.
 */
export class SnackBaseClient {
  private config: Required<SnackBaseConfig>;
  private http: HttpClient;

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

    this.http = new HttpClient({
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
    });

    this.setupInterceptors();
  }

  /**
   * Returns the current client configuration.
   */
  getConfig(): Required<SnackBaseConfig> {
    return { ...this.config };
  }

  /**
   * Internal helper to access the HTTP client.
   * @internal
   */
  get httpClient(): HttpClient {
    return this.http;
  }

  /**
   * Sets up the default interceptors for the HTTP client.
   */
  private setupInterceptors(): void {
    // Request interceptors
    this.http.addRequestInterceptor(contentTypeInterceptor);
    this.http.addRequestInterceptor(
      createAuthInterceptor(
        () => this.getAccessToken(), // Placeholder for M1.3
        this.config.apiKey
      )
    );

    // Response interceptors
    this.http.addResponseInterceptor(errorNormalizationInterceptor);

    // Error interceptors
    this.http.addErrorInterceptor(errorInterceptor);
  }

  /**
   * Returns the current access token.
   * Placeholder to be implemented in Module 1.3.
   */
  private getAccessToken(): string | undefined {
    // TODO: Implement with AuthState state management (M1.3)
    return undefined;
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
