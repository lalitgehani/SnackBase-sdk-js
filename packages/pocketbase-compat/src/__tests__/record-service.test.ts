import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordServiceCompat } from '../record-service.js';
import { ClientResponseError, NotSupportedError } from '../errors.js';
import type { SnackBaseClient } from '@snackbase/sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawRecord(overrides: Record<string, any> = {}) {
  return {
    id: 'rec1',
    account_id: 'acc1',
    title: 'Test Post',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

function makeListResponse(items: any[], total: number) {
  return { items, total, skip: 0, limit: items.length };
}

function makeMockSnackbase() {
  const records = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { records } as unknown as SnackBaseClient;
}

// ---------------------------------------------------------------------------
// getList
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.getList', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('calls SnackBase with skip:0, limit:30 for page 1, perPage 30', async () => {
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([], 0));
    await service.getList(1, 30);
    expect(snackbase.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({ skip: 0, limit: 30 }));
  });

  it('calls SnackBase with skip:10, limit:10 for page 2, perPage 10', async () => {
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([], 0));
    await service.getList(2, 10);
    expect(snackbase.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({ skip: 10, limit: 10 }));
  });

  it('rewrites sort field -created → -created_at', async () => {
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([], 0));
    await service.getList(1, 30, { sort: '-created' });
    expect(snackbase.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({ sort: '-created_at' }));
  });

  it('rewrites filter field created → created_at', async () => {
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([], 0));
    await service.getList(1, 30, { filter: "created > '2024'" });
    expect(snackbase.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({ filter: "created_at > '2024'" }));
  });

  it('returns ListResult with correct shape', async () => {
    const raw = makeRawRecord();
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    const result = await service.getList(1, 30);
    expect(result).toMatchObject({ page: 1, perPage: 30, totalItems: 1, totalPages: 1 });
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('items have created and updated (not created_at)', async () => {
    const raw = makeRawRecord();
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    const result = await service.getList(1, 30);
    expect(result.items[0].created).toBe('2024-01-01T00:00:00Z');
    expect(result.items[0].updated).toBe('2024-06-01T00:00:00Z');
    expect(result.items[0]).not.toHaveProperty('created_at');
    expect(result.items[0]).not.toHaveProperty('updated_at');
  });

  it('items have collectionId and collectionName', async () => {
    const raw = makeRawRecord();
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    const result = await service.getList(1, 30);
    expect(result.items[0].collectionId).toBe('posts');
    expect(result.items[0].collectionName).toBe('posts');
  });

  it('throws ClientResponseError on SnackBase failure', async () => {
    (snackbase.records.list as any).mockRejectedValue({ status: 500, message: 'Server error' });
    await expect(service.getList(1, 30)).rejects.toBeInstanceOf(ClientResponseError);
  });
});

// ---------------------------------------------------------------------------
// getFullList
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.getFullList', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('makes 3 SnackBase calls when total=25 and batch=10', async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => makeRawRecord({ id: `${i + 1}` }));
    const page2 = Array.from({ length: 10 }, (_, i) => makeRawRecord({ id: `${i + 11}` }));
    const page3 = Array.from({ length: 5 }, (_, i) => makeRawRecord({ id: `${i + 21}` }));

    (snackbase.records.list as any)
      .mockResolvedValueOnce(makeListResponse(page1, 25))
      .mockResolvedValueOnce(makeListResponse(page2, 25))
      .mockResolvedValueOnce(makeListResponse(page3, 25));

    const result = await service.getFullList(10);
    expect(snackbase.records.list).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(25);
  });

  it('accepts options as first argument', async () => {
    const raw = makeRawRecord();
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    const result = await service.getFullList({ filter: 'title = "test"' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('uses batch field from options object', async () => {
    const raw = makeRawRecord();
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    await service.getFullList({ batch: 50 });
    expect(snackbase.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({ limit: 50 }));
  });

  it('defaults to batch 200 when no arg given', async () => {
    const raw = makeRawRecord();
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    await service.getFullList();
    expect(snackbase.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({ limit: 200 }));
  });
});

// ---------------------------------------------------------------------------
// getFirstListItem
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.getFirstListItem', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('returns the first item when found', async () => {
    const raw = makeRawRecord({ title: 'Found' });
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([raw], 1));
    const result = await service.getFirstListItem("title = 'Found'");
    expect(result.id).toBe('rec1');
    expect(result.created).toBe('2024-01-01T00:00:00Z');
  });

  it('throws ClientResponseError with status 404 when not found', async () => {
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([], 0));
    const error = await service.getFirstListItem('title = "missing"').catch((e) => e);
    expect(error).toBeInstanceOf(ClientResponseError);
    expect(error.status).toBe(404);
  });

  it('passes filter to getList', async () => {
    (snackbase.records.list as any).mockResolvedValue(makeListResponse([], 0));
    await service.getFirstListItem("status = 'active'").catch(() => {});
    expect(snackbase.records.list).toHaveBeenCalledWith(
      'posts',
      expect.objectContaining({ limit: 1, skip: 0 }),
    );
  });
});

// ---------------------------------------------------------------------------
// getOne
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.getOne', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('returns record with PB field shape', async () => {
    const raw = makeRawRecord();
    (snackbase.records.get as any).mockResolvedValue(raw);
    const result = await service.getOne('rec1');
    expect(result.id).toBe('rec1');
    expect(result.created).toBe('2024-01-01T00:00:00Z');
    expect(result.updated).toBe('2024-06-01T00:00:00Z');
    expect(result.collectionId).toBe('posts');
    expect(result.collectionName).toBe('posts');
    expect(result).not.toHaveProperty('created_at');
  });

  it('passes expand and fields opts to records.get', async () => {
    const raw = makeRawRecord();
    (snackbase.records.get as any).mockResolvedValue(raw);
    await service.getOne('rec1', { expand: 'author', fields: 'id,title' });
    expect(snackbase.records.get).toHaveBeenCalledWith('posts', 'rec1', {
      expand: 'author',
      fields: 'id,title',
    });
  });

  it('throws ClientResponseError on failure', async () => {
    (snackbase.records.get as any).mockRejectedValue({ status: 404, message: 'Not found' });
    await expect(service.getOne('missing')).rejects.toBeInstanceOf(ClientResponseError);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.create', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('strips collectionId, collectionName, created, updated before sending', async () => {
    const raw = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(raw);
    await service.create({
      id: 'rec1',
      title: 'Hello',
      collectionId: 'posts',
      collectionName: 'posts',
      created: '2024-01-01',
      updated: '2024-01-02',
    } as any);
    const calledWith = (snackbase.records.create as any).mock.calls[0][1];
    expect(calledWith).not.toHaveProperty('collectionId');
    expect(calledWith).not.toHaveProperty('collectionName');
    expect(calledWith).not.toHaveProperty('created');
    expect(calledWith).not.toHaveProperty('updated');
    expect(calledWith.title).toBe('Hello');
  });

  it('returns record with PB field shape', async () => {
    const raw = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(raw);
    const result = await service.create({ title: 'New Post' });
    expect(result.created).toBe('2024-01-01T00:00:00Z');
    expect(result.collectionName).toBe('posts');
  });

  it('passes FormData through without stripping fields', async () => {
    const raw = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(raw);
    const fd = new FormData();
    fd.append('file', 'data');
    await service.create(fd);
    expect(snackbase.records.create).toHaveBeenCalledWith('posts', fd);
  });

  it('throws ClientResponseError on failure', async () => {
    (snackbase.records.create as any).mockRejectedValue({ status: 422, message: 'Validation error' });
    await expect(service.create({ title: 'Bad' })).rejects.toBeInstanceOf(ClientResponseError);
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.update', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('uses PATCH (snackbase.records.patch) not PUT', async () => {
    const raw = makeRawRecord();
    (snackbase.records.patch as any).mockResolvedValue(raw);
    await service.update('rec1', { title: 'Updated' });
    expect(snackbase.records.patch).toHaveBeenCalledWith('posts', 'rec1', expect.any(Object));
    expect((snackbase.records as any).update).toBeUndefined();
  });

  it('strips PB fields before sending', async () => {
    const raw = makeRawRecord();
    (snackbase.records.patch as any).mockResolvedValue(raw);
    await service.update('rec1', {
      title: 'Updated',
      collectionId: 'posts',
      created: '2024-01-01',
    } as any);
    const calledWith = (snackbase.records.patch as any).mock.calls[0][2];
    expect(calledWith).not.toHaveProperty('collectionId');
    expect(calledWith).not.toHaveProperty('created');
    expect(calledWith.title).toBe('Updated');
  });

  it('returns record with PB field shape', async () => {
    const raw = makeRawRecord({ title: 'Updated' });
    (snackbase.records.patch as any).mockResolvedValue(raw);
    const result = await service.update('rec1', { title: 'Updated' });
    expect(result.collectionName).toBe('posts');
    expect(result.created).toBe('2024-01-01T00:00:00Z');
  });

  it('throws ClientResponseError on failure', async () => {
    (snackbase.records.patch as any).mockRejectedValue({ status: 404, message: 'Not found' });
    await expect(service.update('missing', { title: 'x' })).rejects.toBeInstanceOf(ClientResponseError);
  });
});

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe('RecordServiceCompat.delete', () => {
  let snackbase: SnackBaseClient;
  let service: RecordServiceCompat;

  beforeEach(() => {
    snackbase = makeMockSnackbase();
    service = new RecordServiceCompat(snackbase, 'posts');
  });

  it('returns true on success', async () => {
    (snackbase.records.delete as any).mockResolvedValue({ success: true });
    const result = await service.delete('rec1');
    expect(result).toBe(true);
  });

  it('calls records.delete with correct args', async () => {
    (snackbase.records.delete as any).mockResolvedValue({ success: true });
    await service.delete('rec1');
    expect(snackbase.records.delete).toHaveBeenCalledWith('posts', 'rec1');
  });

  it('throws ClientResponseError on failure', async () => {
    (snackbase.records.delete as any).mockRejectedValue({ status: 404, message: 'Not found' });
    await expect(service.delete('missing')).rejects.toBeInstanceOf(ClientResponseError);
  });
});

// ---------------------------------------------------------------------------
// Phase 3/4 stubs
// ---------------------------------------------------------------------------

describe('Phase 4 stubs throw NotSupportedError', () => {
  let service: RecordServiceCompat;

  beforeEach(() => {
    service = new RecordServiceCompat(makeMockSnackbase(), 'users');
  });

  it('subscribe throws NotSupportedError', () => {
    expect(() => service.subscribe()).toThrow(NotSupportedError);
  });

  it('unsubscribe throws NotSupportedError', () => {
    expect(() => service.unsubscribe()).toThrow(NotSupportedError);
  });
});
