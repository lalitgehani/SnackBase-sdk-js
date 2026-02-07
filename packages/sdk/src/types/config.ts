export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type StorageBackend = 'localStorage' | 'sessionStorage' | 'memory' | 'asyncStorage';

export interface SnackBaseConfig {
  /**
   * API base URL (required)
   */
  baseUrl: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Optional API key for service authentication
   */
  apiKey?: string;

  /**
   * Enable automatic token refresh (default: true)
   */
  enableAutoRefresh?: boolean;

  /**
   * Refresh tokens N seconds before expiry (default: 300)
   */
  refreshBeforeExpiry?: number;

  /**
   * Maximum retry attempts for failed requests (default: 3)
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds (default: 1000)
   */
  retryDelay?: number;

  /**
   * Token storage backend. 
   * 'localStorage' or 'sessionStorage' for web, 
   * 'asyncStorage' for React Native.
   * Default: auto-detect based on platform.
   */
  storageBackend?: StorageBackend;

  /**
   * Enable request/response logging (default: false in production)
   */
  enableLogging?: boolean;

  /**
   * Logging level (default: 'error')
   */
  logLevel?: LogLevel;

  /**
   * Callback for 401 authentication errors
   */
  onAuthError?: (error: any) => void;

  /**
   * Callback for network failures
   */
  onNetworkError?: (error: any) => void;

  /**
   * Callback for 429 rate limit errors
   */
  onRateLimitError?: (error: any) => void;

  /**
   * Default account slug/ID for single-tenant mode (optional)
   */
  defaultAccount?: string;

  /**
   * Maximum reconnection attempts for real-time (default: 10)
   */
  maxRealTimeRetries?: number;

  /**
   * Initial delay for real-time reconnection in milliseconds (default: 1000)
   */
  realTimeReconnectionDelay?: number;
}

export const DEFAULT_CONFIG: Partial<SnackBaseConfig> = {
  timeout: 30000,
  enableAutoRefresh: true,
  refreshBeforeExpiry: 300,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'error',
  enableLogging: false,
  defaultAccount: undefined,
  maxRealTimeRetries: 10,
  realTimeReconnectionDelay: 1000,
};
