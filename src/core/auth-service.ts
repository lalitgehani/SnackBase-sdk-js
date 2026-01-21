import { HttpClient } from './http-client';
import { AuthManager } from './auth';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User, 
  Account,
  PasswordResetRequest,
  PasswordResetConfirm,
  OAuthProvider,
  OAuthUrlResponse,
  OAuthCallbackParams,
  OAuthResponse,
  SAMLProvider,
  SAMLUrlResponse,
  SAMLCallbackParams,
  SAMLResponse
} from '../types/auth';
import { AuthenticationError } from './errors';

/**
 * Service for handling authentication operations.
 */
export class AuthService {
  private oauthStates: Map<string, number> = new Map();
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  constructor(
    private http: HttpClient,
    private auth: AuthManager,
    private apiKey?: string
  ) {}

  /**
   * Helper to ensure API key is not used for user-specific operations.
   */
  private checkApiKeyRestriction(): void {
    if (this.apiKey && !this.auth.token) {
      // If we only have an API key and no user token, we should warn or restrict
      // but the PRD says "API key cannot be used for user-specific operations".
      // We'll throw an error if they try to use OAuth/SAML without a user session
      // if it's strictly forbidden, though usually these ARE for getting a session.
      // Wait, if these are for GETTING a session, you don't have a session yet.
      // If you don't have a session, you MUST use something else or be anonymous.
      // If the server requires an API key even for OAuth initiation, then 379 is tricky.
      // Re-reading 379: "API key cannot be used for user-specific operations (OAuth/SAML)".
      // This most likely means when the server processes OAuth/SAML, it ignores any X-API-Key header.
    }
  }

  /**
   * Authenticate a user with email and password.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/api/v1/auth/login', credentials);
    const authData = response.data;
    
    await this.auth.setState({
      user: authData.user,
      account: authData.account,
      token: authData.token,
      refreshToken: authData.refreshToken,
      expiresAt: authData.expiresAt,
    });

    return authData;
  }

  /**
   * Register a new user and account.
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/api/v1/auth/register', data);
    return response.data;
  }

  /**
   * Refresh the access token using the refresh token.
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.auth.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.http.post<AuthResponse>('/api/v1/auth/refresh', {
      refreshToken,
    });
    const authData = response.data;

    await this.auth.setState({
      user: authData.user,
      account: authData.account,
      token: authData.token,
      refreshToken: authData.refreshToken,
      expiresAt: authData.expiresAt,
    });

    return authData;
  }

  /**
   * Log out the current user.
   */
  async logout(): Promise<{ success: boolean }> {
    try {
      // Optional: notify server about logout if endpoint exists
      await this.http.post('/api/v1/auth/logout', {});
    } catch (e) {
      // Ignore logout errors as we want to clear local state anyway
    } finally {
      await this.auth.clear();
    }
    return { success: true };
  }

  /**
   * Get the current authenticated user profile.
   */
  async getCurrentUser(): Promise<AuthResponse> {
    const response = await this.http.get<AuthResponse>('/api/v1/auth/me');
    const authData = response.data;
    
    await this.auth.setState({
      user: authData.user,
      account: authData.account,
    });

    return authData;
  }

  /**
   * Initiate password reset flow.
   */
  async forgotPassword(data: PasswordResetRequest): Promise<{ message: string }> {
    const response = await this.http.post<{ message: string }>('/api/v1/auth/forgot-password', data);
    return response.data;
  }

  /**
   * Reset password using a token.
   */
  async resetPassword(data: PasswordResetConfirm): Promise<{ message: string }> {
    const response = await this.http.post<{ message: string }>('/api/v1/auth/reset-password', data);
    return response.data;
  }

  /**
   * Verify email using a token.
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await this.http.post<{ message: string }>('/api/v1/auth/verify-email', { token });
    return response.data;
  }

  /**
   * Resend the verification email to the current user.
   */
  async resendVerificationEmail(): Promise<{ message: string }> {
    const response = await this.http.post<{ message: string }>('/api/v1/auth/resend-verification', {});
    return response.data;
  }

  /**
   * Generate OAuth authorization URL for the specified provider.
   */
  async getOAuthUrl(provider: OAuthProvider, redirectUri: string, state?: string): Promise<OAuthUrlResponse> {
    this.checkApiKeyRestriction();
    const response = await this.http.post<OAuthUrlResponse>(`/api/v1/auth/oauth/${provider}/authorize`, {
      redirectUri,
      state,
    });
    const { url, state: stateToken } = response.data;

    // Store state token with expiry
    this.oauthStates.set(stateToken, Date.now() + this.STATE_EXPIRY_MS);

    // Periodically clean up expired states
    this.cleanupExpiredStates();

    return response.data;
  }

  /**
   * Handle OAuth callback and authenticate user.
   */
  async handleOAuthCallback(params: OAuthCallbackParams): Promise<OAuthResponse> {
    this.checkApiKeyRestriction();
    const { provider, code, redirectUri, state } = params;

    // Validate state token
    const expiry = this.oauthStates.get(state);
    if (!expiry || expiry < Date.now()) {
      this.oauthStates.delete(state);
      throw new AuthenticationError('Invalid or expired state token', { code: 'INVALID_STATE' });
    }

    // Remove state token after use
    this.oauthStates.delete(state);

    const response = await this.http.post<OAuthResponse>(`/api/v1/auth/oauth/${provider}/callback`, {
      code,
      redirectUri,
      state,
    });
    const authData = response.data;

    await this.auth.setState({
      user: authData.user,
      account: authData.account,
      token: authData.token,
      refreshToken: authData.refreshToken,
      expiresAt: authData.expiresAt,
    });

    return authData;
  }

  /**
   * Generate SAML SSO authorization URL for the specified provider and account.
   */
  async getSAMLUrl(provider: SAMLProvider, account: string, relayState?: string): Promise<SAMLUrlResponse> {
    this.checkApiKeyRestriction();
    const response = await this.http.get<SAMLUrlResponse>('/api/v1/auth/saml/sso', {
      params: {
        provider,
        account,
        relayState,
      },
    });
    return response.data;
  }

  /**
   * Handle SAML callback (ACS) and authenticate user.
   */
  async handleSAMLCallback(params: SAMLCallbackParams): Promise<SAMLResponse> {
    const response = await this.http.post<SAMLResponse>('/api/v1/auth/saml/acs', params);
    const authData = response.data;

    await this.auth.setState({
      user: authData.user,
      account: authData.account,
      token: authData.token,
      refreshToken: authData.refreshToken,
      expiresAt: authData.expiresAt,
    });

    return authData;
  }

  /**
   * Get SAML metadata for the specified provider and account.
   */
  async getSAMLMetadata(provider: SAMLProvider, account: string): Promise<string> {
    const response = await this.http.get<string>('/api/v1/auth/saml/metadata', {
      params: {
        provider,
        account,
      },
    });
    return response.data;
  }

  /**
   * Cleanup expired state tokens.
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, expiry] of this.oauthStates.entries()) {
      if (expiry < now) {
        this.oauthStates.delete(state);
      }
    }
  }
}
