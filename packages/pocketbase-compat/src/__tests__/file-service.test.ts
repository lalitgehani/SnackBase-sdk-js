/**
 * Phase 5 — FileServiceCompat tests
 *
 * All SnackBase SDK methods are mocked; tests run entirely in Node.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileServiceCompat } from '../file-service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSnackbaseMock(token: string = 'auth-token-abc') {
  return {
    files: {
      getDownloadUrl: vi.fn((path: string) => `http://localhost:8000/api/v1/files/download/${path}?token=${token}`),
    },
    internalAuthManager: {
      getState: vi.fn(() => ({ token })),
    },
  } as any;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FileServiceCompat', () => {
  let snackbase: ReturnType<typeof makeSnackbaseMock>;
  let service: FileServiceCompat;

  beforeEach(() => {
    snackbase = makeSnackbaseMock();
    service = new FileServiceCompat(snackbase);
  });

  // -------------------------------------------------------------------------
  // getURL
  // -------------------------------------------------------------------------

  describe('getURL', () => {
    it('returns URL containing collection/record.id/filename path', () => {
      const url = service.getURL({ id: 'rec1', collectionName: 'posts' }, 'image.jpg');
      expect(url).toContain('posts/rec1/image.jpg');
    });

    it('calls snackbase.files.getDownloadUrl with the constructed path', () => {
      service.getURL({ id: 'rec1', collectionName: 'posts' }, 'avatar.png');
      expect(snackbase.files.getDownloadUrl).toHaveBeenCalledWith('posts/rec1/avatar.png');
    });

    it('falls back to collectionId when collectionName is absent', () => {
      const url = service.getURL({ id: 'rec1', collectionId: 'users' }, 'photo.jpg');
      expect(url).toContain('users/rec1/photo.jpg');
    });

    it('returns empty string when filename is empty', () => {
      const url = service.getURL({ id: 'rec1', collectionName: 'posts' }, '');
      expect(url).toBe('');
      expect(snackbase.files.getDownloadUrl).not.toHaveBeenCalled();
    });

    it('returns empty string when record.id is absent or empty', () => {
      expect(service.getURL({}, 'file.jpg')).toBe('');
      expect(service.getURL({ id: '' }, 'file.jpg')).toBe('');
      expect(snackbase.files.getDownloadUrl).not.toHaveBeenCalled();
    });

    it('returns empty string when both filename and record.id are missing', () => {
      expect(service.getURL({}, '')).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // getUrl (deprecated alias)
  // -------------------------------------------------------------------------

  describe('getUrl — deprecated alias', () => {
    it('delegates to getURL and returns same result', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = service.getUrl({ id: 'rec1', collectionName: 'posts' }, 'image.jpg');
      expect(result).toContain('posts/rec1/image.jpg');
      warnSpy.mockRestore();
    });

    it('logs a deprecation warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      service.getUrl({ id: 'rec1', collectionName: 'posts' }, 'image.jpg');
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0][0]).toContain('deprecated');
      warnSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // getToken
  // -------------------------------------------------------------------------

  describe('getToken', () => {
    it('returns the current auth token string', () => {
      const token = service.getToken();
      expect(token).toBe('auth-token-abc');
    });

    it('returns empty string when not authenticated', () => {
      const unauthMock = makeSnackbaseMock('');
      unauthMock.internalAuthManager.getState.mockReturnValue({ token: null });
      const unauthService = new FileServiceCompat(unauthMock);
      expect(unauthService.getToken()).toBe('');
    });
  });
});
