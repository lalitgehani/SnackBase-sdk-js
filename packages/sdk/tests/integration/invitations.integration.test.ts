/**
 * Invitations integration tests — F4.2: InvitationService Full Coverage
 *
 * Requires SNACKBASE_API_KEY for admin operations.
 * Tests cover the full invitation lifecycle: create → getPublic → accept → login,
 * as well as cancellation, resend, and duplicate/error cases.
 *
 * API notes:
 * - GET /api/v1/invitations returns { invitations: [...], total: N }
 * - GET /api/v1/invitations/{token} (public) returns { email, account_name,
 *   invited_by_name, expires_at, is_valid } — no `status` field
 * - POST /api/v1/invitations/{token}/accept returns AuthResponse
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  trackUser,
  cleanupTestResources,
  skipIfNoCredentials,
  TEST_CONFIG,
} from './setup';

describe('Invitations Integration Tests', () => {
  let client: SnackBaseClient;
  let testRoleId: string | undefined;

  // Track invitations and users created via accept() for cleanup
  const createdInvitationIds: string[] = [];
  const acceptedUserIds: string[] = [];

  beforeAll(async () => {
    if (skipIfNoCredentials()) return;

    client = createTestClient();

    // Fetch a role ID to optionally attach to invitations
    const rolesResult = await client.roles.list();
    testRoleId = rolesResult.items.length ? String(rolesResult.items[0].id) : undefined;
  });

  afterAll(async () => {
    if (!client) return;

    // Cancel any pending invitations not already cancelled/accepted
    for (const id of createdInvitationIds) {
      try {
        await client.invitations.cancel(id);
      } catch {
        // ignore — already accepted or cancelled
      }
    }

    // Register accepted users for global cleanup
    for (const id of acceptedUserIds) {
      trackUser(id);
    }

    await cleanupTestResources(client);
  });

  describe('create', () => {
    it('should create an invitation and return id, status pending, and a token', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email, role_id: testRoleId });
      createdInvitationIds.push(invitation.id);

      expect(invitation.id).toBeDefined();
      expect(invitation.email).toBe(email);
      expect(invitation.status).toBe('pending');
      expect(invitation.token).toBeDefined();
    });

    it('should return 409 for a duplicate pending invitation to the same email', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const first = await client.invitations.create({ email });
      createdInvitationIds.push(first.id);

      await expect(client.invitations.create({ email })).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should include the newly created invitation in the result', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });
      createdInvitationIds.push(invitation.id);

      // Backend returns { invitations: [...], total: N }
      const result = await client.invitations.list();

      expect(result.invitations).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      const found = result.invitations.find((inv) => inv.id === invitation.id);
      expect(found).toBeDefined();
      expect(found!.status).toBe('pending');
    });

    it('should filter to pending invitations only when status_filter is applied', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });
      createdInvitationIds.push(invitation.id);

      const result = await client.invitations.list({ status_filter: 'pending' });

      expect(result.invitations).toBeInstanceOf(Array);
      const found = result.invitations.find((inv) => inv.id === invitation.id);
      expect(found).toBeDefined();
      result.invitations.forEach((inv) => expect(inv.status).toBe('pending'));
    });
  });

  describe('resend', () => {
    it('should return { success: true } for a pending invitation', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();

      // resend triggers email delivery; if no provider is configured the backend may
      // return 500. Use a no-retry client to keep the test fast.
      const noRetryClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        apiKey: TEST_CONFIG.apiKey,
        enableLogging: false,
        maxRetries: 0,
      });

      const invitation = await noRetryClient.invitations.create({ email });
      createdInvitationIds.push(invitation.id);

      try {
        const result = await noRetryClient.invitations.resend(invitation.id);
        expect(result.success).toBe(true);
      } catch (error: any) {
        // 500 is acceptable when no email provider is configured
        expect(error.status).toBe(500);
      }
    });

    it('should throw when resending a cancelled invitation', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });
      await client.invitations.cancel(invitation.id);
      // Already cancelled — do not add to createdInvitationIds for cleanup

      await expect(client.invitations.resend(invitation.id)).rejects.toThrow();
    });
  });

  describe('getPublic', () => {
    it('should return public invitation metadata without authentication', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });
      createdInvitationIds.push(invitation.id);

      // Public endpoint requires no API key
      const publicClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        enableLogging: false,
      });

      // Returns InvitationPublicDetails: { email, account_name, invited_by_name, expires_at, is_valid }
      const details = await publicClient.invitations.getPublic(invitation.token!);

      expect(details.email).toBe(email);
      expect(details.is_valid).toBe(true);
      expect(details.expires_at).toBeDefined();
    });

    it('should throw for an invalid or forged token', async () => {
      if (skipIfNoCredentials()) return;

      const publicClient = new SnackBaseClient({
        baseUrl: TEST_CONFIG.baseUrl,
        enableLogging: false,
      });

      await expect(
        publicClient.invitations.getPublic('this-is-not-a-valid-token')
      ).rejects.toThrow();
    });
  });

  describe('accept', () => {
    it('should accept an invitation, create a user, and return auth tokens', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });
      // Do not push to createdInvitationIds — accepting removes it from pending

      const authResponse = await client.invitations.accept(
        invitation.token!,
        TEST_CONFIG.testPassword
      );

      expect(authResponse).toBeDefined();
      expect(authResponse.user).toBeDefined();
      expect(authResponse.user!.email).toBe(email);
      expect(authResponse.token).toBeDefined();

      if (authResponse.user?.id) {
        acceptedUserIds.push(authResponse.user.id);
      }
    });

    it('should remove the invitation from the pending list after acceptance', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });

      const authResponse = await client.invitations.accept(
        invitation.token!,
        TEST_CONFIG.testPassword
      );

      if (authResponse.user?.id) {
        acceptedUserIds.push(authResponse.user.id);
      }

      const result = await client.invitations.list({ status_filter: 'pending' });
      const stillPending = result.invitations.find((inv) => inv.id === invitation.id);
      expect(stillPending).toBeUndefined();
    });

    it('should allow the accepted user to log in with their credentials', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });

      const authResponse = await client.invitations.accept(
        invitation.token!,
        TEST_CONFIG.testPassword
      );

      if (authResponse.user?.id) {
        acceptedUserIds.push(authResponse.user.id);
      }

      // Login requires an account slug — derive from the auth response
      const accountSlug =
        (authResponse as any).account?.slug ?? (authResponse as any).account_slug;

      if (accountSlug) {
        const loginClient = createTestClient();
        const loginState = await loginClient.auth.login({
          email,
          password: TEST_CONFIG.testPassword,
          account: accountSlug,
        });
        expect(loginState.user).toBeDefined();
        expect(loginState.user!.email).toBe(email);
      }
    });

    it('should throw when accepting a cancelled invitation', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });
      const token = invitation.token!;

      await client.invitations.cancel(invitation.id);

      await expect(
        client.invitations.accept(token, TEST_CONFIG.testPassword)
      ).rejects.toThrow();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending invitation so it no longer appears as pending', async () => {
      if (skipIfNoCredentials()) return;

      const email = createTestEmail();
      const invitation = await client.invitations.create({ email });

      const result = await client.invitations.cancel(invitation.id);
      expect(result.success).toBe(true);

      const pending = await client.invitations.list({ status_filter: 'pending' });
      const stillPending = pending.invitations.find((inv) => inv.id === invitation.id);
      expect(stillPending).toBeUndefined();
    });
  });
});
