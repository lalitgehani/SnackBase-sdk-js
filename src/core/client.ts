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
import { RecordService } from './record-service';
import { GroupsService } from './group-service';
import { InvitationService } from './invitation-service';
import { ApiKeyService } from './api-key-service';
import { AuditLogService } from './audit-log-service';
import { RoleService } from './role-service';
import { CollectionRuleService } from './collection-rule-service';
import { MacroService } from './macro-service';
import { DashboardService } from './dashboard-service';
import { AdminService } from './admin-service';
import { EmailTemplateService } from './email-template-service';
import { FileService } from './file-service';
import { createStorageBackend } from './storage';
import { 
  User, 
  Account, 
  AuthEvents, 
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
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
  private recordService: RecordService;
  private groupsService: GroupsService;
  private invitationService: InvitationService;
  private apiKeyService: ApiKeyService;
  private auditLogService: AuditLogService;
  private roleService: RoleService;
  private collectionRuleService: CollectionRuleService;
  private macroService: MacroService;
  private dashboardService: DashboardService;
  private adminService: AdminService;
  private emailTemplateService: EmailTemplateService;
  private fileService: FileService;

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

    this.authService = new AuthService(
      this.http, 
      this.authManager, 
      this.config.apiKey,
      this.config.defaultAccount
    );
    this.accountService = new AccountService(this.http);
    this.userService = new UserService(this.http);
    this.collectionService = new CollectionService(this.http);
    this.recordService = new RecordService(this.http);
    this.groupsService = new GroupsService(this.http);
    this.invitationService = new InvitationService(this.http);
    this.apiKeyService = new ApiKeyService(this.http);
    this.auditLogService = new AuditLogService(this.http);
    this.roleService = new RoleService(this.http);
    this.collectionRuleService = new CollectionRuleService(this.http);
    this.macroService = new MacroService(this.http);
    this.dashboardService = new DashboardService(this.http);
    this.adminService = new AdminService(this.http);
    this.emailTemplateService = new EmailTemplateService(this.http);
    this.fileService = new FileService(
      this.http,
      () => this.config.baseUrl,
      () => this.authManager.token
    );

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
   * Access to record management methods (CRUD on dynamic collections).
   */
  get records(): RecordService {
    return this.recordService;
  }

  /**
   * Access to group management methods.
   */
  get groups(): GroupsService {
    return this.groupsService;
  }

  /**
   * Access to invitation management methods.
   */
  get invitations(): InvitationService {
    return this.invitationService;
  }

  /**
   * Access to API key management methods.
   */
  get apiKeys(): ApiKeyService {
    return this.apiKeyService;
  }

  /**
   * Access to audit log management methods.
   */
  get auditLogs(): AuditLogService {
    return this.auditLogService;
  }

  /**
   * Access to role management methods.
   */
  get roles(): RoleService {
    return this.roleService;
  }

  /**
   * Access to collection rule management methods.
   */
  get collectionRules(): CollectionRuleService {
    return this.collectionRuleService;
  }

  /**
   * Access to macro management methods.
   */
  get macros(): MacroService {
    return this.macroService;
  }

  /**
   * Access to dashboard statistics and monitoring.
   */
  get dashboard(): DashboardService {
    return this.dashboardService;
  }

  /**
   * Access to system administration and configuration methods.
   */
  get admin(): AdminService {
    return this.adminService;
  }

  /**
   * Access to email template management methods.
   */
  get emailTemplates(): EmailTemplateService {
    return this.emailTemplateService;
  }

  /**
   * Access to file management methods.
   */
  get files(): FileService {
    return this.fileService;
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
   * Register a new user and account.
   */
  async register(data: RegisterData) {
    return this.authService.register(data);
  }

  /**
   * Refresh the access token using the refresh token.
   */
  async refreshToken() {
    return this.authService.refreshToken();
  }

  /**
   * Get the current authenticated user profile.
   */
  async getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  /**
   * Initiate password reset flow.
   */
  async forgotPassword(data: PasswordResetRequest) {
    return this.authService.forgotPassword(data);
  }

  /**
   * Reset password using a token.
   */
  async resetPassword(data: PasswordResetConfirm) {
    return this.authService.resetPassword(data);
  }

  /**
   * Verify email using a token.
   */
  async verifyEmail(token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Resend the verification email to the current user.
   */
  async resendVerificationEmail() {
    return this.authService.resendVerificationEmail();
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

    if (config.defaultAccount !== undefined && typeof config.defaultAccount !== 'string') {
      throw new Error('SnackBaseClient: defaultAccount must be a string');
    }
  }
}
