/**
 * Phase 5 — BatchServiceCompat tests
 *
 * All SnackBase SDK record methods are mocked; no live server required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchServiceCompat } from '../batch-service.js';
import type { SnackBaseClient } from '@snackbase/sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawRecord(overrides: Record<string, any> = {}) {
  return {
    id: 'rec1',
    title: 'Test',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

function makeSnackbaseMock() {
  const records = {
    create: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { records } as unknown as SnackBaseClient;
}

// ---------------------------------------------------------------------------
// Op queuing
// ---------------------------------------------------------------------------

describe('BatchServiceCompat — op queuing', () => {
  let snackbase: SnackBaseClient;
  let batch: BatchServiceCompat;

  beforeEach(() => {
    snackbase = makeSnackbaseMock();
    batch = new BatchServiceCompat(snackbase);
  });

  it('batch.collection(name) returns a SubBatchServiceCompat', () => {
    const sub = batch.collection('posts');
    expect(sub).toBeDefined();
    expect(typeof sub.create).toBe('function');
    expect(typeof sub.update).toBe('function');
    expect(typeof sub.delete).toBe('function');
    expect(typeof sub.upsert).toBe('function');
  });

  it('returns same sub-service on repeated collection(name) calls', () => {
    expect(batch.collection('posts')).toBe(batch.collection('posts'));
  });

  it('queues a create op', () => {
    batch.collection('posts').create({ title: 'New' });
    expect((batch.collection('posts') as any)._ops).toHaveLength(1);
    expect((batch.collection('posts') as any)._ops[0].op).toBe('create');
  });

  it('queues an update op', () => {
    batch.collection('posts').update('rec1', { title: 'Changed' });
    const ops = (batch.collection('posts') as any)._ops;
    expect(ops).toHaveLength(1);
    expect(ops[0].op).toBe('update');
    expect(ops[0].id).toBe('rec1');
  });

  it('queues a delete op', () => {
    batch.collection('posts').delete('rec1');
    const ops = (batch.collection('posts') as any)._ops;
    expect(ops).toHaveLength(1);
    expect(ops[0].op).toBe('delete');
    expect(ops[0].id).toBe('rec1');
  });

  it('queues an upsert op', () => {
    batch.collection('posts').upsert({ id: 'rec1', title: 'Upserted' });
    const ops = (batch.collection('posts') as any)._ops;
    expect(ops).toHaveLength(1);
    expect(ops[0].op).toBe('upsert');
  });
});

// ---------------------------------------------------------------------------
// send — successful ops
// ---------------------------------------------------------------------------

describe('BatchServiceCompat.send — successful operations', () => {
  let snackbase: SnackBaseClient;
  let batch: BatchServiceCompat;

  beforeEach(() => {
    snackbase = makeSnackbaseMock();
    batch = new BatchServiceCompat(snackbase);
  });

  it('calls records.create for create ops', async () => {
    const record = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(record);
    batch.collection('posts').create({ title: 'New' });
    await batch.send();
    expect(snackbase.records.create).toHaveBeenCalledWith('posts', { title: 'New' });
  });

  it('calls records.patch for update ops', async () => {
    const record = makeRawRecord();
    (snackbase.records.patch as any).mockResolvedValue(record);
    batch.collection('posts').update('rec1', { title: 'Updated' });
    await batch.send();
    expect(snackbase.records.patch).toHaveBeenCalledWith('posts', 'rec1', { title: 'Updated' });
  });

  it('calls records.delete for delete ops', async () => {
    (snackbase.records.delete as any).mockResolvedValue({ success: true });
    batch.collection('posts').delete('rec1');
    await batch.send();
    expect(snackbase.records.delete).toHaveBeenCalledWith('posts', 'rec1');
  });

  it('result array has one entry per queued op', async () => {
    const record = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(record);
    (snackbase.records.patch as any).mockResolvedValue(record);
    (snackbase.records.delete as any).mockResolvedValue({ success: true });
    batch.collection('posts').create({ title: 'A' });
    batch.collection('posts').update('rec1', { title: 'B' });
    batch.collection('posts').delete('rec2');
    const results = await batch.send();
    expect(results).toHaveLength(3);
  });

  it('successful ops have { status: 200, body: ... }', async () => {
    const record = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(record);
    batch.collection('posts').create({ title: 'New' });
    const results = await batch.send();
    expect(results[0].status).toBe(200);
    expect(results[0].body).toEqual(record);
  });

  it('executes operations from multiple collections', async () => {
    const record = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(record);
    (snackbase.records.delete as any).mockResolvedValue({ success: true });
    batch.collection('posts').create({ title: 'New Post' });
    batch.collection('comments').delete('com1');
    const results = await batch.send();
    expect(results).toHaveLength(2);
    expect(snackbase.records.create).toHaveBeenCalledWith('posts', { title: 'New Post' });
    expect(snackbase.records.delete).toHaveBeenCalledWith('comments', 'com1');
  });
});

// ---------------------------------------------------------------------------
// send — failed ops (does not throw)
// ---------------------------------------------------------------------------

describe('BatchServiceCompat.send — failed operations', () => {
  let snackbase: SnackBaseClient;
  let batch: BatchServiceCompat;

  beforeEach(() => {
    snackbase = makeSnackbaseMock();
    batch = new BatchServiceCompat(snackbase);
  });

  it('does NOT throw when some ops fail', async () => {
    (snackbase.records.create as any).mockRejectedValue(new Error('Server error'));
    batch.collection('posts').create({ title: 'Bad' });
    await expect(batch.send()).resolves.toBeDefined();
  });

  it('failed ops have { status: 400, body: { error: "..." } }', async () => {
    (snackbase.records.create as any).mockRejectedValue(new Error('Validation failed'));
    batch.collection('posts').create({ title: 'Bad' });
    const results = await batch.send();
    expect(results[0].status).toBe(400);
    expect((results[0].body as any).error).toBe('Validation failed');
  });

  it('mixed success/failure result in correct statuses per op', async () => {
    const record = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(record);
    (snackbase.records.delete as any).mockRejectedValue(new Error('Not found'));
    batch.collection('posts').create({ title: 'Good' });
    batch.collection('posts').delete('missing');
    const results = await batch.send();
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe(200);
    expect(results[1].status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// upsert fallback logic
// ---------------------------------------------------------------------------

describe('BatchServiceCompat.send — upsert fallback', () => {
  let snackbase: SnackBaseClient;
  let batch: BatchServiceCompat;

  beforeEach(() => {
    snackbase = makeSnackbaseMock();
    batch = new BatchServiceCompat(snackbase);
  });

  it('upsert tries patch first when id is present', async () => {
    const record = makeRawRecord({ id: 'existing' });
    (snackbase.records.patch as any).mockResolvedValue(record);
    batch.collection('posts').upsert({ id: 'existing', title: 'Updated' });
    await batch.send();
    expect(snackbase.records.patch).toHaveBeenCalledWith('posts', 'existing', {
      id: 'existing',
      title: 'Updated',
    });
    expect(snackbase.records.create).not.toHaveBeenCalled();
  });

  it('upsert falls back to create when patch fails', async () => {
    const record = makeRawRecord({ id: 'new-record' });
    (snackbase.records.patch as any).mockRejectedValue(new Error('Not found'));
    (snackbase.records.create as any).mockResolvedValue(record);
    batch.collection('posts').upsert({ id: 'new-record', title: 'New' });
    await batch.send();
    expect(snackbase.records.patch).toHaveBeenCalled();
    expect(snackbase.records.create).toHaveBeenCalledWith('posts', {
      id: 'new-record',
      title: 'New',
    });
  });

  it('upsert without id goes straight to create', async () => {
    const record = makeRawRecord();
    (snackbase.records.create as any).mockResolvedValue(record);
    batch.collection('posts').upsert({ title: 'No ID' });
    await batch.send();
    expect(snackbase.records.patch).not.toHaveBeenCalled();
    expect(snackbase.records.create).toHaveBeenCalledWith('posts', { title: 'No ID' });
  });
});
