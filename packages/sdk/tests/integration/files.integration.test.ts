/**
 * FileService integration tests — F6.3: FileService Full Coverage
 *
 * Tests require a running SnackBase backend (SNACKBASE_URL) and a valid
 * superadmin API key (SNACKBASE_API_KEY) for email verification.
 *
 * Backend endpoints exercised:
 *   POST /api/v1/files/upload   → upload a file, returns { success, file, message }
 *   GET  /api/v1/files/{path}   → download a file (auth via Authorization: Bearer header)
 *
 * Note: getDownloadUrl() appends ?token= for future browser-link support, but the
 * backend currently only accepts auth via the Authorization header. Raw fetch() calls
 * in the accessibility tests must therefore supply the header explicitly.
 *
 * Known backend limitations at time of writing:
 *   - DELETE /api/v1/files/{path} is NOT implemented — delete() tests are skipped.
 *   - File size limit is environment-configured — oversized-file test is skipped.
 *
 * Uploaded test files are NOT cleaned up between runs (no delete endpoint).
 * They accumulate in the backend's storage directory; this is a known trade-off.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import {
  createTestClient,
  createTestEmail,
  createTestAccountName,
  verifyUser,
  TEST_CONFIG,
} from './setup';

// A small text file used across upload tests
const TEST_FILE_CONTENT = 'hello from snackbase integration test';
const TEST_FILE_NAME = 'test-upload.txt';
const TEST_MIME_TYPE = 'text/plain';

function makeTextBlob(content = TEST_FILE_CONTENT): Blob {
  return new Blob([content], { type: TEST_MIME_TYPE });
}

describe('FileService Integration Tests', () => {
  let client: SnackBaseClient;
  let jwtToken: string | null = null;

  beforeEach(async () => {
    client = createTestClient();
    jwtToken = null;

    const email = createTestEmail();
    const password = 'TestPass123!';
    const account_name = createTestAccountName();
    const account_slug = account_name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

    // Register a fresh user for each test
    const authState = await client.auth.register({ email, password, account_name });

    // Verify and login so the client holds a JWT (needed for SDK upload auth + raw fetch auth)
    await verifyUser(authState.user!.id);
    const loginState = await client.auth.login({ email, password, account: account_slug });
    jwtToken = loginState.token ?? null;
  });

  /** Headers for raw fetch() calls to the download endpoint */
  function authHeaders(): HeadersInit {
    return jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};
  }

  // ---------------------------------------------------------------------------
  // upload
  // ---------------------------------------------------------------------------

  describe('upload', () => {
    it('should return file metadata with filename, size, mime_type, and path', async () => {
      const blob = makeTextBlob();

      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      expect(metadata).toBeDefined();
      expect(metadata.filename).toBe(TEST_FILE_NAME);
      expect(metadata.size).toBe(TEST_FILE_CONTENT.length);
      expect(metadata.mime_type).toBe(TEST_MIME_TYPE);
      expect(typeof metadata.path).toBe('string');
      expect(metadata.path.length).toBeGreaterThan(0);
    });

    it('should return FileMetadata directly, NOT wrapped in { success, file, message }', async () => {
      const blob = makeTextBlob();
      const result = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      // The SDK must unwrap the backend envelope — callers should get metadata, not the wrapper
      expect((result as any).success).toBeUndefined();
      expect((result as any).message).toBeUndefined();
      expect((result as any).file).toBeUndefined();
      expect(result.filename).toBeDefined();
      expect(result.path).toBeDefined();
    });

    it('should use the explicit filename provided in options', async () => {
      const customName = `custom-${Date.now()}.txt`;
      const blob = makeTextBlob('custom file content');

      const metadata = await client.files.upload(blob, { filename: customName });

      expect(metadata.filename).toBe(customName);
    });

    it('should store the file path under the account directory', async () => {
      const blob = makeTextBlob();
      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      // Backend stores files as {account_id}/{uuid_filename}
      // The path must contain at least one path separator
      expect(metadata.path).toContain('/');
    });

    it('should correctly reflect file size for different content lengths', async () => {
      const content = 'x'.repeat(512);
      const blob = new Blob([content], { type: TEST_MIME_TYPE });

      const metadata = await client.files.upload(blob, { filename: '512bytes.txt' });

      expect(metadata.size).toBe(512);
    });
  });

  // ---------------------------------------------------------------------------
  // getDownloadUrl
  // ---------------------------------------------------------------------------

  describe('getDownloadUrl', () => {
    it('should return a non-empty string URL', async () => {
      const blob = makeTextBlob();
      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      const url = client.files.getDownloadUrl(metadata.path);

      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    });

    it('should include /api/v1/files/ and the file path in the URL', async () => {
      const blob = makeTextBlob();
      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      const url = client.files.getDownloadUrl(metadata.path);

      expect(url).toContain('/api/v1/files/');
      expect(url).toContain(metadata.path);
    });

    it('should append a ?token= query param when the user is authenticated', async () => {
      const blob = makeTextBlob();
      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      const url = client.files.getDownloadUrl(metadata.path);

      // Client logged in via JWT in beforeEach — token must be present
      expect(url).toContain('token=');
    });

    it('should handle paths that already start with a slash', async () => {
      const blob = makeTextBlob();
      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      const pathWithSlash = metadata.path.startsWith('/') ? metadata.path : `/${metadata.path}`;
      const url = client.files.getDownloadUrl(pathWithSlash);

      // Should not produce double slashes in the URL
      expect(url).not.toContain('//api');
      expect(url).toContain('/api/v1/files/');
    });
  });

  // ---------------------------------------------------------------------------
  // File accessibility (live HTTP fetch)
  // ---------------------------------------------------------------------------

  describe('file accessibility', () => {
    it('should serve the uploaded file via the download URL (HTTP 200)', async () => {
      const blob = makeTextBlob();
      const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

      const downloadUrl = client.files.getDownloadUrl(metadata.path);
      const response = await fetch(downloadUrl, { headers: authHeaders() });

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe(TEST_FILE_CONTENT);
    });

    it('should return 404 when downloading a path that was never uploaded', async () => {
      // Construct a plausible-looking but non-existent path
      const fakeAccountId = 'ZZ9999';
      const fakeFilename = '00000000-0000-0000-0000-000000000000.txt';
      const fakePath = `${fakeAccountId}/${fakeFilename}`;

      const downloadUrl = client.files.getDownloadUrl(fakePath);
      const response = await fetch(downloadUrl, { headers: authHeaders() });

      // Backend returns 404 for files that don't exist, 403 for cross-account paths
      expect([403, 404]).toContain(response.status);
    });
  });

  // ---------------------------------------------------------------------------
  // delete — skipped (backend endpoint not implemented)
  // ---------------------------------------------------------------------------

  describe('delete', () => {
    it.skip(
      'should delete the file and make the download URL return 404 — SKIPPED: DELETE /api/v1/files/{path} is not implemented in the backend',
      async () => {
        const blob = makeTextBlob();
        const metadata = await client.files.upload(blob, { filename: TEST_FILE_NAME });

        await client.files.delete(metadata.path);

        const downloadUrl = client.files.getDownloadUrl(metadata.path);
        const response = await fetch(downloadUrl, { headers: authHeaders() });
        expect(response.status).toBe(404);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Size limit — skipped (limit is environment-configured)
  // ---------------------------------------------------------------------------

  describe('size limit', () => {
    it.skip(
      'should return an error when the uploaded file exceeds the configured size limit — SKIPPED: limit is environment-specific; enable when limit is known',
      async () => {
        // Generate a blob larger than the configured max (e.g. 10 MB + 1 byte)
        const oversizeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
        const blob = new Blob([oversizeContent], { type: TEST_MIME_TYPE });

        await expect(
          client.files.upload(blob, { filename: 'oversize.txt' })
        ).rejects.toThrow();
      }
    );
  });
});
