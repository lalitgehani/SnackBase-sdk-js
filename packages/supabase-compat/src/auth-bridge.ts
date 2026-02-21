import type { SnackBaseClient } from '@snackbase/sdk';
import { wrap, NotSupportedError, type CompatError } from './errors';
import type {
  CompatUser,
  CompatSession,
  CompatSessionResult,
  CompatUserResult,
  AuthStateChangeCallback,
  AuthSubscription,
} from './types';

// ── Return type aliases matching SupabaseResult<T> shape (data: T | null) ──

type UserSessionResult = {
  data: { user: CompatUser | null; session: CompatSession | null } | null;
  error: CompatError | null;
};
type OAuthResult = {
  data: { provider: string; url: string } | null;
  error: CompatError | null;
};
type UserDataResult = {
  data: { user: CompatUser | null } | null;
  error: CompatError | null;
};
type EmptyDataResult = {
  data: Record<string, never> | null;
  error: CompatError | null;
};
type SessionDataResult = {
  data: { session: CompatSession | null } | null;
  error: CompatError | null;
};
type AdminListResult = {
  data: { users: CompatUser[]; aud: string } | null;
  error: CompatError | null;
};

async function unsupported<T>(method: string): Promise<T> {
  throw new NotSupportedError(method);
}

/**
 * Bridges Supabase `auth.*` API to SnackBase AuthService + AuthManager.
 *
 * Phase 1: Stub — all methods return NotSupportedError wrapped in { data, error }.
 * Phase 2: Full implementation.
 *
 * @internal Exposed via SnackbaseSupabaseClient.auth
 */
export class AuthBridge {
  /** @internal */
  readonly admin: AuthAdminBridge;

  constructor(private readonly snackbase: SnackBaseClient) {
    this.admin = new AuthAdminBridge(snackbase);
  }

  async signUp(_credentials: {
    email: string;
    password: string;
    options?: Record<string, unknown>;
  }): Promise<UserSessionResult> {
    return wrap<{ user: CompatUser | null; session: CompatSession | null }>(
      () => unsupported('auth.signUp'),
    );
  }

  async signInWithPassword(_credentials: {
    email: string;
    password: string;
  }): Promise<UserSessionResult> {
    return wrap<{ user: CompatUser | null; session: CompatSession | null }>(
      () => unsupported('auth.signInWithPassword'),
    );
  }

  async signInWithOAuth(_options: {
    provider: string;
    options?: { redirectTo?: string };
  }): Promise<OAuthResult> {
    return wrap<{ provider: string; url: string }>(
      () => unsupported('auth.signInWithOAuth'),
    );
  }

  async signOut(): Promise<{ error: CompatError | null }> {
    const { error } = await wrap<never>(() => unsupported('auth.signOut'));
    return { error };
  }

  async getSession(): Promise<CompatSessionResult> {
    const result = await wrap<{ session: CompatSession | null }>(
      () => unsupported('auth.getSession'),
    );
    return {
      data: result.data ?? { session: null },
      error: result.error,
    };
  }

  async getUser(): Promise<CompatUserResult> {
    const result = await wrap<{ user: CompatUser | null }>(
      () => unsupported('auth.getUser'),
    );
    return {
      data: result.data ?? { user: null },
      error: result.error,
    };
  }

  async updateUser(_attributes: {
    password?: string;
    data?: Record<string, unknown>;
  }): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(
      () => unsupported('auth.updateUser'),
    );
  }

  async resetPasswordForEmail(
    _email: string,
    _options?: { redirectTo?: string },
  ): Promise<EmptyDataResult> {
    return wrap<Record<string, never>>(
      () => unsupported('auth.resetPasswordForEmail'),
    );
  }

  async verifyOtp(_params: {
    token_hash: string;
    type: string;
  }): Promise<UserSessionResult> {
    return wrap<{ user: CompatUser | null; session: CompatSession | null }>(
      () => unsupported('auth.verifyOtp'),
    );
  }

  async refreshSession(): Promise<SessionDataResult> {
    return wrap<{ session: CompatSession | null }>(
      () => unsupported('auth.refreshSession'),
    );
  }

  onAuthStateChange(_callback: AuthStateChangeCallback): AuthSubscription {
    // Phase 2 will be implemented here using authManager.on(...)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // no-op in Phase 1
          },
        },
      },
    };
  }
}

/**
 * Bridges Supabase `auth.admin.*` API to SnackBase UserService.
 *
 * Phase 1: Stub — all methods return NotSupportedError.
 * Phase 2: Full implementation.
 *
 * @internal Exposed via AuthBridge.admin
 */
export class AuthAdminBridge {
  constructor(private readonly snackbase: SnackBaseClient) {}

  async listUsers(_params?: {
    page?: number;
    perPage?: number;
  }): Promise<AdminListResult> {
    return wrap<{ users: CompatUser[]; aud: string }>(
      () => unsupported('auth.admin.listUsers'),
    );
  }

  async getUserById(_uid: string): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(
      () => unsupported('auth.admin.getUserById'),
    );
  }

  async createUser(_attributes: {
    email: string;
    password?: string;
    email_confirm?: boolean;
  }): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(
      () => unsupported('auth.admin.createUser'),
    );
  }

  async updateUserById(
    _uid: string,
    _attributes: { email?: string; password?: string; data?: Record<string, unknown> },
  ): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(
      () => unsupported('auth.admin.updateUserById'),
    );
  }

  async deleteUser(_uid: string): Promise<EmptyDataResult> {
    return wrap<Record<string, never>>(
      () => unsupported('auth.admin.deleteUser'),
    );
  }

  async inviteUserByEmail(_email: string): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(
      () => unsupported('auth.admin.inviteUserByEmail'),
    );
  }
}
