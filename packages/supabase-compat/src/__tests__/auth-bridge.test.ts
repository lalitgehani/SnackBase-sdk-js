import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ── Mock the SnackBaseClient ──────────────────────────────────────────────────

/**
 * Creates a minimal mock SnackBaseClient with jest/vitest spy functions
 * covering all services used by AuthBridge / AuthAdminBridge.
 */
function makeMockClient() {
  const authManager = {
    getState: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
  };

  const authService = {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    verifyEmail: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    getOAuthUrl: vi.fn(),
  };

  const userService = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setPassword: vi.fn(),
    verifyEmail: vi.fn(),
  };

  const invitationService = {
    create: vi.fn(),
  };

  return {
    internalAuthManager: authManager,
    auth: authService,
    users: userService,
    invitations: invitationService,
    _authManager: authManager,
  };
}

// Lazy import so we can control mock first
let AuthBridge: typeof import('../auth-bridge').AuthBridge;
let AuthAdminBridge: typeof import('../auth-bridge').AuthAdminBridge;

beforeEach(async () => {
  const mod = await import('../auth-bridge');
  AuthBridge = mod.AuthBridge;
  AuthAdminBridge = mod.AuthAdminBridge;
});

// ── Sample data ───────────────────────────────────────────────────────────────

const MOCK_SNACK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'user',
  account_id: 'account-1',
  groups: [],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  last_login: null,
  token_type: 'jwt' as any,
};

const MOCK_AUTH_RESPONSE = {
  user: MOCK_SNACK_USER,
  token: 'access-token-123',
  refresh_token: 'refresh-token-456',
  expires_in: 3600,
};

const MOCK_AUTH_STATE = {
  user: MOCK_SNACK_USER,
  account: { id: 'account-1', slug: 'test', name: 'Test', created_at: '' },
  token: 'access-token-123',
  refreshToken: 'refresh-token-456',
  isAuthenticated: true,
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  tokenType: 'jwt' as any,
};

// ── AuthBridge tests ──────────────────────────────────────────────────────────

describe('AuthBridge', () => {
  let client: ReturnType<typeof makeMockClient>;
  let bridge: InstanceType<typeof import('../auth-bridge').AuthBridge>;

  beforeEach(() => {
    client = makeMockClient();
    client.internalAuthManager.getState.mockReturnValue(MOCK_AUTH_STATE);
    bridge = new AuthBridge(client as any);
  });

  describe('signUp()', () => {
    it('returns { data: { user, session }, error: null } on success', async () => {
      client.auth.register.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { data, error } = await bridge.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data?.user?.id).toBe('user-1');
      expect(data?.user?.email).toBe('test@example.com');
      expect(data?.session?.access_token).toBe('access-token-123');
      expect(data?.session?.token_type).toBe('bearer');
      expect(data?.user?.user_metadata).toEqual({});
      expect(data?.user?.app_metadata).toEqual({ role: 'user' });
    });

    it('returns { data: null, error } on failure', async () => {
      client.auth.register.mockRejectedValue(new Error('Email already taken'));

      const { data, error } = await bridge.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(data).toBeNull();
      expect(error?.message).toBe('Email already taken');
    });
  });

  describe('signInWithPassword()', () => {
    it('returns { data: { user, session }, error: null } on success', async () => {
      client.auth.login.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { data, error } = await bridge.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data?.user?.id).toBe('user-1');
      expect(data?.session?.access_token).toBe('access-token-123');
      expect(data?.session?.refresh_token).toBe('refresh-token-456');
    });

    it('returns { data: null, error } on failure', async () => {
      client.auth.login.mockRejectedValue(new Error('Invalid credentials'));

      const { data, error } = await bridge.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(data).toBeNull();
      expect(error?.message).toBe('Invalid credentials');
    });
  });

  describe('signOut()', () => {
    it('calls logout and returns error: null', async () => {
      client.auth.logout.mockResolvedValue({ success: true });

      const { error } = await bridge.signOut();

      expect(client.auth.logout).toHaveBeenCalled();
      expect(error).toBeNull();
    });

    it('returns error on failure', async () => {
      client.auth.logout.mockRejectedValue(new Error('Network error'));

      const { error } = await bridge.signOut();
      expect(error?.message).toBe('Network error');
    });
  });

  describe('getSession()', () => {
    it('returns current session from local state without network call', async () => {
      const { data, error } = await bridge.getSession();

      // Should NOT call any network service
      expect(client.auth.getCurrentUser).not.toHaveBeenCalled();

      expect(error).toBeNull();
      expect(data.session).not.toBeNull();
      expect(data.session?.access_token).toBe('access-token-123');
    });

    it('returns { session: null } when not authenticated', async () => {
      client.internalAuthManager.getState.mockReturnValue({
        ...MOCK_AUTH_STATE,
        isAuthenticated: false,
        token: null,
        user: null,
      });

      const { data, error } = await bridge.getSession();
      expect(error).toBeNull();
      expect(data.session).toBeNull();
    });
  });

  describe('getUser()', () => {
    it('fetches and returns CompatUser', async () => {
      client.auth.getCurrentUser.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { data, error } = await bridge.getUser();

      expect(client.auth.getCurrentUser).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(data.user?.id).toBe('user-1');
      expect(data.user?.email).toBe('test@example.com');
    });

    it('returns error on failure', async () => {
      client.auth.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      const { data, error } = await bridge.getUser();
      expect(data.user).toBeNull();
      expect(error?.message).toBe('Unauthorized');
    });
  });

  describe('resetPasswordForEmail()', () => {
    it('calls forgotPassword and returns empty data', async () => {
      client.auth.forgotPassword.mockResolvedValue({ message: 'Email sent' });

      const { data, error } = await bridge.resetPasswordForEmail('test@example.com');

      expect(client.auth.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(error).toBeNull();
      expect(data).toEqual({});
    });
  });

  describe('verifyOtp()', () => {
    it('verifies email token and returns session', async () => {
      client.auth.verifyEmail.mockResolvedValue({ message: 'Email verified' });

      const { data, error } = await bridge.verifyOtp({
        token_hash: 'verify-token-123',
        type: 'email',
      });

      expect(client.auth.verifyEmail).toHaveBeenCalledWith('verify-token-123');
      expect(error).toBeNull();
      expect(data?.user?.id).toBe('user-1');
      expect(data?.session?.access_token).toBe('access-token-123');
    });
  });

  describe('refreshSession()', () => {
    it('refreshes tokens and returns new session', async () => {
      const newAuth = {
        ...MOCK_AUTH_RESPONSE,
        token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };
      client.auth.refreshToken.mockResolvedValue(newAuth);

      const { data, error } = await bridge.refreshSession();

      expect(client.auth.refreshToken).toHaveBeenCalled();
      expect(error).toBeNull();
      expect(data?.session?.access_token).toBe('new-access-token');
    });

    it('returns error when no refresh token', async () => {
      client.auth.refreshToken.mockRejectedValue(new Error('No refresh token available'));

      const { data, error } = await bridge.refreshSession();
      expect(data).toBeNull();
      expect(error?.message).toBe('No refresh token available');
    });
  });

  describe('onAuthStateChange()', () => {
    it('returns a subscription with unsubscribe()', () => {
      const callback = vi.fn();
      const result = bridge.onAuthStateChange(callback);

      expect(result.data.subscription.unsubscribe).toBeTypeOf('function');
    });

    it('registers listeners on authManager events', () => {
      const callback = vi.fn();
      bridge.onAuthStateChange(callback);

      // Should subscribe to auth:login, auth:logout, auth:refresh
      const onCalls = (client.internalAuthManager.on as Mock).mock.calls;
      const events = onCalls.map((c) => c[0]);
      expect(events).toContain('auth:login');
      expect(events).toContain('auth:logout');
      expect(events).toContain('auth:refresh');
    });

    it('fires INITIAL_SESSION on next tick', async () => {
      const callback = vi.fn();
      bridge.onAuthStateChange(callback);

      // INITIAL_SESSION is deferred via Promise.resolve().then(...)
      await Promise.resolve();

      expect(callback).toHaveBeenCalledWith('INITIAL_SESSION', expect.anything());
    });

    it('fires INITIAL_SESSION with null session when not authenticated', async () => {
      client.internalAuthManager.getState.mockReturnValue({
        ...MOCK_AUTH_STATE,
        isAuthenticated: false,
        token: null,
        user: null,
      });

      const callback = vi.fn();
      bridge.onAuthStateChange(callback);
      await Promise.resolve();

      expect(callback).toHaveBeenCalledWith('INITIAL_SESSION', null);
    });

    it('unsubscribes all listeners when unsubscribe() is called', () => {
      const unsub1 = vi.fn();
      const unsub2 = vi.fn();
      const unsub3 = vi.fn();
      (client.internalAuthManager.on as Mock)
        .mockReturnValueOnce(unsub1)
        .mockReturnValueOnce(unsub2)
        .mockReturnValueOnce(unsub3);

      const callback = vi.fn();
      const { data } = bridge.onAuthStateChange(callback);
      data.subscription.unsubscribe();

      expect(unsub1).toHaveBeenCalled();
      expect(unsub2).toHaveBeenCalled();
      expect(unsub3).toHaveBeenCalled();
    });
  });

  describe('signInWithOAuth()', () => {
    it('returns { data: { provider, url } } on success', async () => {
      client.auth.getOAuthUrl.mockResolvedValue({
        url: 'https://accounts.google.com/o/oauth2/auth?...',
        state: 'state-abc123',
      });

      const { data, error } = await bridge.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'http://localhost:3000/auth/callback' },
      });

      expect(error).toBeNull();
      expect(data?.provider).toBe('google');
      expect(data?.url).toContain('accounts.google.com');
    });
  });

  describe('not-supported stubs', () => {
    it('signInAnonymously returns error', async () => {
      const { error } = await bridge.signInAnonymously();
      expect(error?.message).toContain('auth.signInAnonymously');
    });

    it('signInWithIdToken returns error', async () => {
      const { error } = await bridge.signInWithIdToken({
        provider: 'google',
        token: 'id-token',
      });
      expect(error?.message).toContain('auth.signInWithIdToken');
    });

    it('mfa getter throws NotSupportedError', () => {
      expect(() => bridge.mfa).toThrow('auth.mfa');
    });
  });
});

// ── AuthAdminBridge tests ─────────────────────────────────────────────────────

describe('AuthAdminBridge', () => {
  let client: ReturnType<typeof makeMockClient>;
  let adminBridge: InstanceType<typeof import('../auth-bridge').AuthAdminBridge>;

  beforeEach(() => {
    client = makeMockClient();
    client.internalAuthManager.getState.mockReturnValue(MOCK_AUTH_STATE);
    adminBridge = new AuthAdminBridge(client as any);
  });

  describe('listUsers()', () => {
    it('returns list of CompatUsers', async () => {
      client.users.list.mockResolvedValue({
        items: [MOCK_SNACK_USER],
        total: 1,
      });

      const { data, error } = await adminBridge.listUsers();

      expect(error).toBeNull();
      expect(data?.users).toHaveLength(1);
      expect(data?.users[0].id).toBe('user-1');
      expect(data?.users[0].user_metadata).toEqual({});
      expect(data?.aud).toBe('authenticated');
    });

    it('passes pagination params', async () => {
      client.users.list.mockResolvedValue({ items: [], total: 0 });

      await adminBridge.listUsers({ page: 2, perPage: 25 });

      expect(client.users.list).toHaveBeenCalledWith({ page: 2, page_size: 25 });
    });
  });

  describe('getUserById()', () => {
    it('returns a single CompatUser', async () => {
      client.users.get.mockResolvedValue(MOCK_SNACK_USER);

      const { data, error } = await adminBridge.getUserById('user-1');

      expect(client.users.get).toHaveBeenCalledWith('user-1');
      expect(error).toBeNull();
      expect(data?.user?.id).toBe('user-1');
    });
  });

  describe('createUser()', () => {
    it('creates user and returns CompatUser', async () => {
      client.users.create.mockResolvedValue(MOCK_SNACK_USER);

      const { data, error } = await adminBridge.createUser({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(client.users.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        account_id: 'account-1',
      });
      expect(error).toBeNull();
      expect(data?.user?.email).toBe('test@example.com');
    });

    it('calls verifyEmail when email_confirm is true', async () => {
      client.users.create.mockResolvedValue(MOCK_SNACK_USER);
      client.users.verifyEmail.mockResolvedValue({ success: true });

      await adminBridge.createUser({
        email: 'new@example.com',
        email_confirm: true,
      });

      expect(client.users.verifyEmail).toHaveBeenCalledWith('user-1');
    });

    it('does NOT call verifyEmail when email_confirm is false', async () => {
      client.users.create.mockResolvedValue(MOCK_SNACK_USER);

      await adminBridge.createUser({
        email: 'new@example.com',
        email_confirm: false,
      });

      expect(client.users.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('updateUserById()', () => {
    it('updates user email and returns updated user', async () => {
      const updatedUser = { ...MOCK_SNACK_USER, email: 'updated@example.com' };
      client.users.update.mockResolvedValue(updatedUser);

      const { data, error } = await adminBridge.updateUserById('user-1', {
        email: 'updated@example.com',
      });

      expect(client.users.update).toHaveBeenCalledWith('user-1', { email: 'updated@example.com' });
      expect(error).toBeNull();
      expect(data?.user?.email).toBe('updated@example.com');
    });

    it('calls setPassword when password is provided', async () => {
      client.users.setPassword.mockResolvedValue({ success: true });
      client.users.get.mockResolvedValue(MOCK_SNACK_USER);

      await adminBridge.updateUserById('user-1', { password: 'newPassword123' });

      expect(client.users.setPassword).toHaveBeenCalledWith('user-1', 'newPassword123');
    });

    it('only calls setPassword when no other fields to update', async () => {
      client.users.setPassword.mockResolvedValue({ success: true });
      client.users.get.mockResolvedValue(MOCK_SNACK_USER);

      await adminBridge.updateUserById('user-1', { password: 'newPassword123' });

      // Should not call update, only get + setPassword
      expect(client.users.update).not.toHaveBeenCalled();
      expect(client.users.get).toHaveBeenCalledWith('user-1');
    });
  });

  describe('deleteUser()', () => {
    it('deletes user and returns empty data', async () => {
      client.users.delete.mockResolvedValue({ success: true });

      const { data, error } = await adminBridge.deleteUser('user-1');

      expect(client.users.delete).toHaveBeenCalledWith('user-1');
      expect(error).toBeNull();
      expect(data).toEqual({});
    });
  });

  describe('inviteUserByEmail()', () => {
    it('creates invitation and returns null user', async () => {
      client.invitations.create.mockResolvedValue({
        id: 'inv-1',
        email: 'invite@example.com',
        account_id: 'account-1',
        status: 'pending',
        expires_at: '',
        created_at: '',
        updated_at: '',
      });

      const { data, error } = await adminBridge.inviteUserByEmail('invite@example.com');

      expect(client.invitations.create).toHaveBeenCalledWith({ email: 'invite@example.com' });
      expect(error).toBeNull();
      expect(data?.user).toBeNull(); // Invitation returns null user
    });
  });
});
