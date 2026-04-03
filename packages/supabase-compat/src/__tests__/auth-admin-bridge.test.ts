import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthAdminBridge } from '../auth-bridge';

// ── Mock the SnackBaseClient ──────────────────────────────────────────────────

function makeMockClient() {
  const authManager = {
    getState: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
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
    users: userService,
    invitations: invitationService,
    _authManager: authManager,
    internalAuthManager: authManager,
  };
}

import { AuthAdminBridge } from '../auth-bridge';

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

const MOCK_AUTH_STATE = {
  user: MOCK_SNACK_USER,
  account: { id: 'account-1', slug: 'test', name: 'Test', created_at: '' },
  token: 'access-token-123',
  refreshToken: 'refresh-token-456',
  isAuthenticated: true,
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  tokenType: 'jwt' as any,
};

// ── AuthAdminBridge tests ─────────────────────────────────────────────────────

describe('AuthAdminBridge', () => {
  let client: ReturnType<typeof makeMockClient>;
  let adminBridge: AuthAdminBridge;

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
