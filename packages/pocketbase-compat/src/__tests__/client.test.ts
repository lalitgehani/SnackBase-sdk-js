import { describe, it, expect, beforeEach } from 'vitest';
import { PocketBaseCompat } from '../client.js';
import { PocketBase } from '../index.js';
import { RecordServiceCompat } from '../record-service.js';
import { NotSupportedError } from '../errors.js';

describe('PocketBaseCompat constructor', () => {
  it('creates client without throwing for a full URL', () => {
    expect(() => new PocketBaseCompat('http://localhost:8000')).not.toThrow();
  });

  it('strips trailing slash from baseURL', () => {
    const pb = new PocketBaseCompat('http://localhost:8000/');
    expect(pb.baseURL).toBe('http://localhost:8000');
  });

  it('stores lang', () => {
    const pb = new PocketBaseCompat('http://localhost:8000', null, 'de-DE');
    expect(pb.lang).toBe('de-DE');
  });

  it('defaults lang to en-US', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    expect(pb.lang).toBe('en-US');
  });

  it('throws clear error when baseURL starts with /', () => {
    // In Node.js (test env), window.location is not available
    expect(() => new PocketBaseCompat('/')).toThrow(
      "PocketBase compat requires a full URL (e.g. 'http://localhost:8000')",
    );
  });

  it('stores passed authStore', () => {
    const fakeStore = { token: 'tok', isValid: true };
    const pb = new PocketBaseCompat('http://localhost:8000', fakeStore);
    expect(pb.authStore).toBe(fakeStore);
  });

  it('authStore is an AuthStoreCompat instance by default', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    expect(pb.authStore).toBeDefined();
    expect(pb.authStore).not.toBeNull();
  });
});

describe('PocketBaseCompat named exports', () => {
  it('PocketBase named export is the same as PocketBaseCompat', () => {
    expect(PocketBase).toBe(PocketBaseCompat);
  });
});

describe('PocketBaseCompat.collection()', () => {
  it('returns a RecordServiceCompat instance', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const svc = pb.collection('posts');
    expect(svc).toBeInstanceOf(RecordServiceCompat);
  });

  it('returns the same cached instance on repeated calls', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const first = pb.collection('posts');
    const second = pb.collection('posts');
    expect(first).toBe(second);
  });

  it('returns different instances for different collection names', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const posts = pb.collection('posts');
    const users = pb.collection('users');
    expect(posts).not.toBe(users);
  });

  it('collection has correct collectionIdOrName', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const svc = pb.collection('articles');
    expect(svc.collectionIdOrName).toBe('articles');
  });
});

describe('PocketBaseCompat.filter()', () => {
  it('interpolates placeholders and rewrites field names', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const result = pb.filter('created > {:d}', { d: '2024-01-01' });
    expect(result).toBe("created_at > '2024-01-01'");
  });

  it('works without params', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const result = pb.filter("updated < '2025-01-01'");
    expect(result).toBe("updated_at < '2025-01-01'");
  });

  it('returns valid filter string when given a Date param', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    const d = new Date('2024-06-01T00:00:00.000Z');
    const result = pb.filter('created >= {:d}', { d });
    expect(result).toContain('created_at');
    expect(result).toContain('2024-06-01');
  });
});

describe('PocketBaseCompat.buildURL()', () => {
  it('prepends baseURL', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    expect(pb.buildURL('/api/v1/health')).toBe('http://localhost:8000/api/v1/health');
  });
});

describe('PocketBaseCompat no-op cancellation methods', () => {
  it('autoCancellation returns this', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    expect(pb.autoCancellation(false)).toBe(pb);
  });

  it('cancelRequest returns this', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    expect(pb.cancelRequest('key')).toBe(pb);
  });

  it('cancelAllRequests returns this', () => {
    const pb = new PocketBaseCompat('http://localhost:8000');
    expect(pb.cancelAllRequests()).toBe(pb);
  });
});

describe('PocketBaseCompat unsupported getters', () => {
  let pb: PocketBaseCompat;

  beforeEach(() => {
    pb = new PocketBaseCompat('http://localhost:8000');
  });

  it('pb.backups throws NotSupportedError', () => {
    expect(() => pb.backups).toThrow(NotSupportedError);
  });

  it('pb.crons throws NotSupportedError', () => {
    expect(() => pb.crons).toThrow(NotSupportedError);
  });

  it('pb.settings throws NotSupportedError', () => {
    expect(() => pb.settings).toThrow(NotSupportedError);
  });

  it('pb.logs throws NotSupportedError', () => {
    expect(() => pb.logs).toThrow(NotSupportedError);
  });

  it('pb.createBatch() returns a BatchServiceCompat instance', async () => {
    const { BatchServiceCompat } = await import('../batch-service.js');
    expect(pb.createBatch()).toBeInstanceOf(BatchServiceCompat);
  });
});

describe('PocketBaseCompat Phase 5 services', () => {
  let pb: PocketBaseCompat;

  beforeEach(() => {
    pb = new PocketBaseCompat('http://localhost:8000');
  });

  it('pb.files is a FileServiceCompat instance', async () => {
    const { FileServiceCompat } = await import('../file-service.js');
    expect(pb.files).toBeInstanceOf(FileServiceCompat);
  });

  it('pb.health is a HealthServiceCompat instance', async () => {
    const { HealthServiceCompat } = await import('../health-service.js');
    expect(pb.health).toBeInstanceOf(HealthServiceCompat);
  });

  it('pb.realtime is a RealtimeServiceCompat instance', async () => {
    const { RealtimeServiceCompat } = await import('../realtime-service.js');
    expect(pb.realtime).toBeInstanceOf(RealtimeServiceCompat);
  });
});
