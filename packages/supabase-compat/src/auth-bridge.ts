import type { SnackBaseClient, User as SnackUser, AuthState, AuthResponse } from '@snackbase/sdk';
import { wrap, NotSupportedError, type CompatError } from './errors';
import type {
  CompatUser,
  CompatSession,
  CompatSessionResult,
  CompatUserResult,
  AuthStateChangeCallback,
  AuthSubscription,
  AuthChangeEvent,
} from './types';

// ── Return type aliases matching SupabaseResult<T> shape ──────────────────────

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

// ── Mapping helpers ───────────────────────────────────────────────────────────

/**
 * Map a SnackBase User object to a Supabase-compatible CompatUser.
 */
function toCompatUser(user: SnackUser): CompatUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    user_metadata: {},
    app_metadata: { role: user.role },
  };
}

/**
 * Map a SnackBase AuthResponse + current state to a Supabase-compatible CompatSession.
 */
function toCompatSession(auth: AuthResponse, state: AuthState): CompatSession | null {
  const token = auth.token ?? state.token;
  if (!token) return null;

  const user = auth.user ?? state.user;
  if (!user) return null;

  const expiresAtStr = auth.expiresAt ?? state.expiresAt;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr).getTime() / 1000 : undefined;

  return {
    access_token: token,
    refresh_token: auth.refresh_token ?? auth.refreshToken ?? state.refreshToken ?? undefined,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: toCompatUser(user),
  };
}

/**
 * Map an AuthState (from AuthManager) to a CompatSession or null.
 */
function stateToCompatSession(state: AuthState): CompatSession | null {
  if (!state.isAuthenticated || !state.token || !state.user) return null;
  return {
    access_token: state.token,
    refresh_token: state.refreshToken ?? undefined,
    expires_at: state.expiresAt ? new Date(state.expiresAt).getTime() / 1000 : undefined,
    token_type: 'bearer',
    user: toCompatUser(state.user),
  };
}

// ── AuthBridge ────────────────────────────────────────────────────────────────

/**
 * Bridges Supabase `auth.*` API to SnackBase AuthService + AuthManager.
 *
 * All methods return `{ data, error }` — never throw.
 *
 * @internal Exposed via SnackbaseSupabaseClient.auth
 */
export class AuthBridge {
  /** Supabase: `supabase.auth.admin.*` — admin auth namespace. */
  readonly admin: AuthAdminBridge;

  constructor(private readonly snackbase: SnackBaseClient) {
    this.admin = new AuthAdminBridge(snackbase);
  }

  /**
   * Supabase: `auth.signUp({ email, password })`.
   * Creates a new user account.
   */
  async signUp(credentials: {
    email: string;
    password: string;
    options?: Record<string, unknown>;
  }): Promise<UserSessionResult> {
    return wrap<{ user: CompatUser | null; session: CompatSession | null }>(async () => {
      const auth = await this.snackbase.auth.register({
        email: credentials.email,
        password: credentials.password,
      });
      const state = this.snackbase.internalAuthManager.getState();
      const session = toCompatSession(auth, state);
      const user = auth.user ? toCompatUser(auth.user) : session?.user ?? null;
      return { user, session };
    });
  }

  /**
   * Supabase: `auth.signInWithPassword({ email, password })`.
   * Authenticates with email + password, returns session.
   */
  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<UserSessionResult> {
    return wrap<{ user: CompatUser | null; session: CompatSession | null }>(async () => {
      const auth = await this.snackbase.auth.login({
        email: credentials.email,
        password: credentials.password,
      });
      const state = this.snackbase.internalAuthManager.getState();
      const session = toCompatSession(auth, state);
      const user = auth.user ? toCompatUser(auth.user) : session?.user ?? null;
      return { user, session };
    });
  }

  /**
   * Supabase: `auth.signInWithOAuth({ provider, options })`.
   * Returns a redirect URL to the provider's auth page.
   */
  async signInWithOAuth(options: {
    provider: string;
    options?: { redirectTo?: string; scopes?: string };
  }): Promise<OAuthResult> {
    return wrap<{ provider: string; url: string }>(async () => {
      const redirectTo = options.options?.redirectTo ?? `${window?.location?.origin ?? ''}/auth/callback`;
      const oauthUrl = await this.snackbase.auth.getOAuthUrl(
        options.provider as any,
        redirectTo,
      );
      return { provider: options.provider, url: oauthUrl.url };
    });
  }

  /**
   * Supabase: `auth.signOut()`.
   * Clears local session and optionally notifies the server.
   */
  async signOut(): Promise<{ error: CompatError | null }> {
    const { error } = await wrap<{ success: boolean }>(async () => {
      await this.snackbase.auth.logout();
      return { success: true };
    });
    return { error };
  }

  /**
   * Supabase: `auth.getSession()`.
   * Returns the current session from local state — no network call.
   */
  async getSession(): Promise<CompatSessionResult> {
    const state = this.snackbase.internalAuthManager.getState();
    const session = stateToCompatSession(state);
    return { data: { session }, error: null };
  }

  /**
   * Supabase: `auth.getUser()`.
   * Fetches the current authenticated user profile from the server.
   */
  async getUser(): Promise<CompatUserResult> {
    const result = await wrap<{ user: CompatUser | null }>(async () => {
      const auth = await this.snackbase.auth.getCurrentUser();
      const state = this.snackbase.internalAuthManager.getState();
      const user = auth.user ? toCompatUser(auth.user) : state.user ? toCompatUser(state.user) : null;
      return { user };
    });
    return {
      data: result.data ?? { user: null },
      error: result.error,
    };
  }

  /**
   * Supabase: `auth.updateUser({ password, data })`.
   * Updates the current user's attributes.
   */
  async updateUser(attributes: {
    password?: string;
    email?: string;
    data?: Record<string, unknown>;
  }): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(async () => {
      const state = this.snackbase.internalAuthManager.getState();
      if (!state.user) {
        throw new Error('Not authenticated');
      }
      const userId = state.user.id;

      // Update email/role if provided
      if (attributes.email) {
        await this.snackbase.users.update(userId, { email: attributes.email });
      }

      // Update password separately
      if (attributes.password) {
        await this.snackbase.users.setPassword(userId, attributes.password);
      }

      // Refresh user state
      const auth = await this.snackbase.auth.getCurrentUser();
      const updatedState = this.snackbase.internalAuthManager.getState();
      const user = auth.user
        ? toCompatUser(auth.user)
        : updatedState.user
          ? toCompatUser(updatedState.user)
          : null;
      return { user };
    });
  }

  /**
   * Supabase: `auth.resetPasswordForEmail(email)`.
   * Sends a password reset email.
   */
  async resetPasswordForEmail(
    email: string,
    _options?: { redirectTo?: string },
  ): Promise<EmptyDataResult> {
    return wrap<Record<string, never>>(async () => {
      await this.snackbase.auth.forgotPassword({ email });
      return {};
    });
  }

  /**
   * Supabase: `auth.verifyOtp({ token_hash, type })`.
   * Verifies an OTP / email token and returns a session.
   */
  async verifyOtp(params: {
    token_hash: string;
    type: string;
  }): Promise<UserSessionResult> {
    return wrap<{ user: CompatUser | null; session: CompatSession | null }>(async () => {
      await this.snackbase.auth.verifyEmail(params.token_hash);
      const state = this.snackbase.internalAuthManager.getState();
      const session = stateToCompatSession(state);
      const user = state.user ? toCompatUser(state.user) : null;
      return { user, session };
    });
  }

  /**
   * Supabase: `auth.refreshSession()`.
   * Refreshes the current session using the refresh token.
   */
  async refreshSession(): Promise<SessionDataResult> {
    return wrap<{ session: CompatSession | null }>(async () => {
      const auth = await this.snackbase.auth.refreshToken();
      const state = this.snackbase.internalAuthManager.getState();
      const session = toCompatSession(auth, state);
      return { session };
    });
  }

  /**
   * Supabase: `auth.onAuthStateChange(callback)`.
   * Subscribes to authentication state changes.
   * Fires immediately with INITIAL_SESSION if a session exists.
   *
   * @returns `{ data: { subscription: { unsubscribe } } }` — call `unsubscribe()` to stop listening.
   */
  onAuthStateChange(callback: AuthStateChangeCallback): AuthSubscription {
    const authManager = this.snackbase.internalAuthManager;

    // Map SnackBase auth events → Supabase event names
    const unsubLogin = authManager.on('auth:login', (state: AuthState) => {
      const session = stateToCompatSession(state);
      callback(session ? ('SIGNED_IN' as AuthChangeEvent) : ('SIGNED_OUT' as AuthChangeEvent), session);
    });

    const unsubLogout = authManager.on('auth:logout', () => {
      callback('SIGNED_OUT' as AuthChangeEvent, null);
    });

    const unsubRefresh = authManager.on('auth:refresh', (state: AuthState) => {
      const session = stateToCompatSession(state);
      callback('TOKEN_REFRESHED' as AuthChangeEvent, session);
    });

    // Fire INITIAL_SESSION if already authenticated
    const currentState = authManager.getState();
    const currentSession = stateToCompatSession(currentState);
    // Defer to next tick so the caller can set up before receiving the event
    Promise.resolve().then(() => {
      callback('INITIAL_SESSION' as AuthChangeEvent, currentSession);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            unsubLogin();
            unsubLogout();
            unsubRefresh();
          },
        },
      },
    };
  }

  // ── Not-supported stubs ────────────────────────────────────────────────────

  async signInAnonymously(): Promise<UserSessionResult> {
    return wrap<{ user: null; session: null }>(() =>
      Promise.reject(new NotSupportedError('auth.signInAnonymously')),
    );
  }

  async signInWithIdToken(_credentials: { provider: string; token: string }): Promise<UserSessionResult> {
    return wrap<{ user: null; session: null }>(() =>
      Promise.reject(new NotSupportedError('auth.signInWithIdToken')),
    );
  }

  get mfa(): never {
    throw new NotSupportedError('auth.mfa');
  }
}

// ── AuthAdminBridge ───────────────────────────────────────────────────────────

/**
 * Bridges Supabase `auth.admin.*` API to SnackBase UserService + InvitationService.
 *
 * All methods return `{ data, error }` — never throw.
 *
 * @internal Exposed via AuthBridge.admin
 */
export class AuthAdminBridge {
  constructor(private readonly snackbase: SnackBaseClient) {}

  /**
   * Supabase: `auth.admin.listUsers(params?)`.
   * Lists all users with optional pagination.
   */
  async listUsers(params?: {
    page?: number;
    perPage?: number;
  }): Promise<AdminListResult> {
    return wrap<{ users: CompatUser[]; aud: string }>(async () => {
      const res = await this.snackbase.users.list({
        page: params?.page,
        page_size: params?.perPage,
      });
      return {
        users: res.items.map(toCompatUser),
        aud: 'authenticated',
      };
    });
  }

  /**
   * Supabase: `auth.admin.getUserById(uid)`.
   * Returns the user with the specified ID.
   */
  async getUserById(uid: string): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(async () => {
      const user = await this.snackbase.users.get(uid);
      return { user: toCompatUser(user) };
    });
  }

  /**
   * Supabase: `auth.admin.createUser({ email, password, email_confirm })`.
   * Creates a new user. Optionally verifies email automatically.
   */
  async createUser(attributes: {
    email: string;
    password?: string;
    email_confirm?: boolean;
    user_metadata?: Record<string, unknown>;
  }): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(async () => {
      const state = this.snackbase.internalAuthManager.getState();
      const accountId = state.account?.id ?? '';

      const user = await this.snackbase.users.create({
        email: attributes.email,
        password: attributes.password,
        account_id: accountId,
      });

      // Auto-verify email if requested
      if (attributes.email_confirm) {
        await this.snackbase.users.verifyEmail(user.id);
      }

      return { user: toCompatUser(user) };
    });
  }

  /**
   * Supabase: `auth.admin.updateUserById(uid, attributes)`.
   * Updates a user's email, password, or role.
   */
  async updateUserById(
    uid: string,
    attributes: { email?: string; password?: string; data?: Record<string, unknown> },
  ): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(async () => {
      // Update password separately if provided
      if (attributes.password) {
        await this.snackbase.users.setPassword(uid, attributes.password);
      }

      // Build user update payload
      const updateData: { email?: string } = {};
      if (attributes.email) updateData.email = attributes.email;

      let user: SnackUser;
      if (Object.keys(updateData).length > 0) {
        user = await this.snackbase.users.update(uid, updateData);
      } else {
        user = await this.snackbase.users.get(uid);
      }

      return { user: toCompatUser(user) };
    });
  }

  /**
   * Supabase: `auth.admin.deleteUser(uid)`.
   * Soft-deletes (deactivates) a user.
   */
  async deleteUser(uid: string): Promise<EmptyDataResult> {
    return wrap<Record<string, never>>(async () => {
      await this.snackbase.users.delete(uid);
      return {};
    });
  }

  /**
   * Supabase: `auth.admin.inviteUserByEmail(email)`.
   * Sends an invitation email to the provided address.
   */
  async inviteUserByEmail(email: string): Promise<UserDataResult> {
    return wrap<{ user: CompatUser | null }>(async () => {
      await this.snackbase.invitations.create({ email });
      // SnackBase invitations don't return a full User — return null user
      return { user: null };
    });
  }
}
