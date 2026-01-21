import { SnackBaseConfig, DEFAULT_CONFIG } from '../types/config';
import { getAutoDetectedStorage } from '../utils/platform';
import { HttpClient } from './http-client';
import { 
  contentTypeInterceptor, 
  createAuthInterceptor, 
  errorNormalizationInterceptor, 
  errorInterceptor 
} from './interceptors';
import { AuthManager } from './auth';
import { AuthService } from './auth-service';
import { AccountService } from './account-service';
import { UserService } from './user-service';
import { CollectionService } from './collection-service';
import { createStorageBackend } from './storage';
import { 
  User, 
  Account, 
  AuthEvents, 
  LoginCredentials,
  SAMLProvider,
  SAMLCallbackParams
} from '../types/auth';

/**
 * Main SDK client for interacting with SnackBase API.
 */
export class SnackBaseClient {
  private config: Required<SnackBaseConfig>;
  private http: HttpClient;
  private authManager: AuthManager;
  private authService: AuthService;
  private accountService: AccountService;
  private userService: UserService;
  private collectionService: CollectionService;

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

    this.authManager = new AuthManager({
      storage: createStorageBackend(this.config.storageBackend),
    });

    this.authService = new AuthService(this.http, this.authManager, this.config.apiKey);
    this.accountService = new AccountService(this.http);
    this.userService = new UserService(this.http);
    this.collectionService = new CollectionService(this.http);

    this.setupInterceptors();
    this.authManager.initialize();
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
        () => this.authManager.token || undefined,
        this.config.apiKey
      )
    );

    // Response interceptors
    this.http.addResponseInterceptor(errorNormalizationInterceptor);

    // Error interceptors
    this.http.addErrorInterceptor(errorInterceptor);
  }

  /**
   * Returns the current authenticated user.
   */
  get user(): User | null {
    return this.authManager.user;
  }

  /**
   * Returns the current account.
   */
  get account(): Account | null {
    return this.authManager.account;
  }

  /**
   * Returns whether the client is currently authenticated.
   */
  get isAuthenticated(): boolean {
    return this.authManager.isAuthenticated;
  }

  /**
   * Access to authentication methods.
   */
  get auth(): AuthService {
    return this.authService;
  }

  /**
   * Access to account management methods.
   */
  get accounts(): AccountService {
    return this.accountService;
  }

  /**
   * Access to user management methods.
   */
  get users(): UserService {
    return this.userService;
  }

  /**
   * Access to collection management methods.
   */
  get collections(): CollectionService {
    return this.collectionService;
  }

  /**
   * Subscribe to authentication events.
   * @param event Event name
   * @param listener Callback function
   */
  on<K extends keyof AuthEvents>(event: K, listener: AuthEvents[K]): () => void {
    return this.authManager.on(event, listener);
  }

  /**
   * Authenticate a user with email and password.
   */
  async login(credentials: LoginCredentials) {
    return this.authService.login(credentials);
  }

  /**
   * Log out the current user.
   */
  async logout() {
    return this.authService.logout();
  }

  /**
   * Generate SAML SSO authorization URL.
   */
  async getSAMLUrl(provider: SAMLProvider, account: string, relayState?: string) {
    return this.authService.getSAMLUrl(provider, account, relayState);
  }

  /**
   * Handle SAML callback.
   */
  async handleSAMLCallback(params: SAMLCallbackParams) {
    return this.authService.handleSAMLCallback(params);
  }

  /**
   * Get SAML metadata.
   */
  async getSAMLMetadata(provider: SAMLProvider, account: string) {
    return this.authService.getSAMLMetadata(provider, account);
  }

  /**
   * Internal access to AuthManager.
   * @internal
   */
  get internalAuthManager(): AuthManager {
    return this.authManager;
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
