import { describe, it, expect } from 'vitest';
import {
  toRecordModel,
  fromRecordModel,
  toListResult,
  toSnackListParams,
} from '../normalizer.js';

describe('toRecordModel', () => {
  it('maps created_at → created', () => {
    const result = toRecordModel({ id: '1', created_at: '2024-01-01T00:00:00Z' }, 'posts');
    expect(result.created).toBe('2024-01-01T00:00:00Z');
    expect(result).not.toHaveProperty('created_at');
  });

  it('maps updated_at → updated', () => {
    const result = toRecordModel({ id: '1', updated_at: '2024-06-01T00:00:00Z' }, 'posts');
    expect(result.updated).toBe('2024-06-01T00:00:00Z');
    expect(result).not.toHaveProperty('updated_at');
  });

  it('sets collectionId = collectionName', () => {
    const result = toRecordModel({ id: '1' }, 'articles');
    expect(result.collectionId).toBe('articles');
    expect(result.collectionName).toBe('articles');
  });

  it('passes through all other dynamic fields', () => {
    const result = toRecordModel(
      { id: '42', title: 'Hello', views: 5, active: true },
      'posts',
    );
    expect(result.id).toBe('42');
    expect(result.title).toBe('Hello');
    expect(result.views).toBe(5);
    expect(result.active).toBe(true);
  });

  it('sets empty string for missing created_at / updated_at', () => {
    const result = toRecordModel({ id: '1' }, 'posts');
    expect(result.created).toBe('');
    expect(result.updated).toBe('');
  });
});

describe('fromRecordModel', () => {
  it('strips collectionId', () => {
    const result = fromRecordModel({ id: '1', collectionId: 'posts', title: 'Hi' });
    expect(result).not.toHaveProperty('collectionId');
  });

  it('strips collectionName', () => {
    const result = fromRecordModel({ id: '1', collectionName: 'posts', title: 'Hi' });
    expect(result).not.toHaveProperty('collectionName');
  });

  it('strips created', () => {
    const result = fromRecordModel({ id: '1', created: '2024-01-01', title: 'Hi' });
    expect(result).not.toHaveProperty('created');
  });

  it('strips updated', () => {
    const result = fromRecordModel({ id: '1', updated: '2024-01-01', title: 'Hi' });
    expect(result).not.toHaveProperty('updated');
  });

  it('strips expand', () => {
    const result = fromRecordModel({ id: '1', expand: { author: {} }, title: 'Hi' });
    expect(result).not.toHaveProperty('expand');
  });

  it('keeps all other fields', () => {
    const result = fromRecordModel({
      id: '1',
      title: 'My post',
      collectionId: 'posts',
      collectionName: 'posts',
      created: '2024-01-01',
      updated: '2024-01-02',
      expand: {},
    });
    expect(result).toEqual({ id: '1', title: 'My post' });
  });
});

describe('toListResult', () => {
  it('produces correct page, perPage, totalItems, totalPages', () => {
    const result = toListResult({ items: [], total: 25 }, 'posts', 2, 10);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(10);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('rounds totalPages up', () => {
    const result = toListResult({ items: [], total: 21 }, 'posts', 1, 10);
    expect(result.totalPages).toBe(3);
  });

  it('totalPages is 1 when total ≤ perPage', () => {
    const result = toListResult({ items: [], total: 5 }, 'posts', 1, 10);
    expect(result.totalPages).toBe(1);
  });

  it('converts each item through toRecordModel', () => {
    const raw = [{ id: '1', title: 'Hi', created_at: '2024-01-01', updated_at: '2024-01-02' }];
    const result = toListResult({ items: raw, total: 1 }, 'posts', 1, 10);
    expect(result.items[0].created).toBe('2024-01-01');
    expect(result.items[0].collectionName).toBe('posts');
  });
});

describe('toSnackListParams', () => {
  it('page 1, perPage 30 → skip 0, limit 30', () => {
    const params = toSnackListParams(1, 30, {});
    expect(params.skip).toBe(0);
    expect(params.limit).toBe(30);
  });

  it('page 3, perPage 10 → skip 20, limit 10', () => {
    const params = toSnackListParams(3, 10, {});
    expect(params.skip).toBe(20);
    expect(params.limit).toBe(10);
  });

  it('page 2, perPage 10 → skip 10', () => {
    const params = toSnackListParams(2, 10, {});
    expect(params.skip).toBe(10);
  });

  it('rewrites sort field -created → -created_at', () => {
    const params = toSnackListParams(1, 30, { sort: '-created' });
    expect(params.sort).toBe('-created_at');
  });

  it('rewrites sort field +updated → +updated_at', () => {
    const params = toSnackListParams(1, 30, { sort: '+updated' });
    expect(params.sort).toBe('+updated_at');
  });

  it('leaves unrelated sort fields unchanged', () => {
    const params = toSnackListParams(1, 30, { sort: 'title' });
    expect(params.sort).toBe('title');
  });

  it('rewrites filter field names', () => {
    const params = toSnackListParams(1, 30, { filter: "created > '2024-01-01'" });
    expect(params.filter).toBe("created_at > '2024-01-01'");
  });

  it('omits sort/filter when not provided', () => {
    const params = toSnackListParams(1, 10, {});
    expect(params).not.toHaveProperty('sort');
    expect(params).not.toHaveProperty('filter');
  });
});
