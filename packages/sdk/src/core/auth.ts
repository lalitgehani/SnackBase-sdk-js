import { AuthState, User, Account, AuthEvents } from '../types/auth';
import { AuthStorage } from './storage';
import { AuthEventEmitter } from './events';

export interface AuthManagerOptions {
  storage: AuthStorage;
  storageKey?: string;
}

const DEFAULT_AUTH_STATE: AuthState = {
  user: null,
  account: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  expiresAt: null,
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
