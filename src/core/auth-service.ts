import { HttpClient } from './http-client';
import { AuthManager } from './auth';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User, 
  Account,
  PasswordResetRequest,
  PasswordResetConfirm
} from '../types/auth';

/**
 * Service for handling authentication operations.
 */
export class AuthService {
  constructor(
    private http: HttpClient,
    private auth: AuthManager
  ) {}

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
}
