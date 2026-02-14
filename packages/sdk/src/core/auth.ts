import { AuthState, User, Account, AuthEvents, AuthResponse, TokenType } from '../types/auth';
import { AuthStorage } from './storage';
import { AuthEventEmitter } from './events';

export interface AuthManagerOptions {
  storage: AuthStorage;
  storageKey?: string;
}

import { detectTokenType, isSuperadmin as isSuperadminUtil } from '../utils/token-utils';

const DEFAULT_AUTH_STATE: AuthState = {
  user: null,
  account: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  expiresAt: null,
  tokenType: TokenType.JWT, // Default to JWT
};

export class AuthManager {
  private state: AuthState = { ...DEFAULT_AUTH_STATE };
  private storage: AuthStorage;
  private storageKey: string;
  private events: AuthEventEmitter;

  constructor(options: AuthManagerOptions) {
    this.storage = options.storage;
    this.storageKey = options.storageKey || 'sb_auth_state';
    this.events = new AuthEventEmitter();
  }

  async initialize(): Promise<void> {
    await this.hydrate();
    this.validateSession();
  }

  getState(): AuthState {
    return { ...this.state };
  }

  get user(): User | null {
    return this.state.user;
  }

  get account(): Account | null {
    return this.state.account;
  }

  get token(): string | null {
    return this.state.token;
  }

  get refreshToken(): string | null {
    return this.state.refreshToken;
  }

  get isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  get tokenType(): TokenType {
    return this.state.tokenType;
  }

  /**
   * Update auth state (enhanced to extract token_type)
   */
  async updateState(data: AuthResponse): Promise<void> {
    const userElement = data.user || (data.user_id ? {
      id: data.user_id,
      email: data.email || '',
      role: data.role || 'user',
      account_id: data.account_id || '',
      groups: [],
      is_active: true,
      created_at: '',
      last_login: null,
      token_type: TokenType.JWT
    } as User : null);

    const user = userElement;
    const token = data.token || null;
    const refreshToken = data.refresh_token || data.refreshToken || null;

    // Detect token type from token string or user object
    let tokenType: TokenType = TokenType.JWT;
    if (token) {
      tokenType = detectTokenType(token) || TokenType.JWT;
    } else if (user?.token_type) {
      tokenType = user.token_type;
    }

    this.state = {
      ...this.state,
      user,
      account: data.account || (data.account_id ? {
        id: data.account_id,
        slug: '',
        name: '',
        created_at: ''
      } as Account : this.state.account),
      token: token || this.state.token,
      refreshToken: refreshToken || this.state.refreshToken,
      isAuthenticated: !!((token || this.state.token) && user),
      expiresAt: this.calculateExpiry(data) || this.state.expiresAt,
      tokenType,
    };

    await this.persist();
    
    if (token || user) {
      this.events.emit('auth:login', this.state);
    }
  }

  /**
   * Check if current user is superadmin
   */
  isSuperadmin(): boolean {
    return isSuperadminUtil(this.state.user);
  }

  /**
   * Check if current session uses API key authentication
   */
  isApiKeySession(): boolean {
    return this.state.tokenType === TokenType.API_KEY;
  }

  /**
   * Check if current session uses personal token authentication
   */
  isPersonalTokenSession(): boolean {
    return this.state.tokenType === TokenType.PERSONAL_TOKEN;
  }

  /**
   * Check if current session uses OAuth authentication
   */
  isOAuthSession(): boolean {
    return this.state.tokenType === TokenType.OAUTH;
  }

  private calculateExpiry(data: AuthResponse): string | null {
    if (data.expiresAt) return data.expiresAt;
    if (data.expires_in) {
      return new Date(Date.now() + data.expires_in * 1000).toISOString();
    }
    return null;
  }

  async setState(newState: Partial<AuthState>): Promise<void> {
    this.state = {
      ...this.state,
      ...newState,
    };
    
    // Update isAuthenticated derived state
    this.state.isAuthenticated = !!(this.state.token && this.state.user);

    await this.persist();
    
    if (newState.token || newState.user) {
      this.events.emit('auth:login', this.state);
    }
  }

  async clear(): Promise<void> {
    this.state = { ...DEFAULT_AUTH_STATE };
    await this.storage.removeItem(this.storageKey);
    this.events.emit('auth:logout');
  }

  on<K extends keyof AuthEvents>(event: K, listener: AuthEvents[K]): () => void {
    return this.events.on(event, listener);
  }

  private async hydrate(): Promise<void> {
    try {
      const stored = await this.storage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = {
          ...DEFAULT_AUTH_STATE,
          ...parsed,
          isAuthenticated: !!(parsed.token && parsed.user),
        };
      }
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
      await this.clear();
    }
  }

  private async persist(): Promise<void> {
    try {
      await this.storage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to persist auth state:', error);
    }
  }

  private validateSession(): void {
    if (!this.state.expiresAt) return;

    const expiry = new Date(this.state.expiresAt).getTime();
    const now = Date.now();

    if (expiry <= now) {
      this.clear();
    }
  }
}
