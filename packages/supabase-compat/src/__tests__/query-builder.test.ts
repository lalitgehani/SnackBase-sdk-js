import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SnackBaseClient } from '@snackbase/sdk';
import { SnackbaseQueryBuilder } from '../query-builder';

/**
 * The builder's job is translating a Supabase/PostgREST chain into a single
 * RecordService call, so these tests assert on the arguments it forwards.
 */
function stubClient() {
  const records = {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    create: vi.fn().mockResolvedValue({ id: 'new' }),
    patch: vi.fn().mockResolvedValue({ id: 'patched' }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  return { client: { records } as unknown as SnackBaseClient, records };
}

describe('SnackbaseQueryBuilder — filter translation', () => {
  let stub: ReturnType<typeof stubClient>;
  const listArgs = () => stub.records.list.mock.calls[0][1];

  beforeEach(() => {
    stub = stubClient();
  });

  const build = () => new SnackbaseQueryBuilder(stub.client, 'posts');

  it.each([
    ['eq', (b: any) => b.eq('status', 'published'), "status='published'"],
    ['neq', (b: any) => b.neq('status', 'draft'), "status!='draft'"],
    ['gt', (b: any) => b.gt('views', 10), "views>'10'"],
    ['gte', (b: any) => b.gte('views', 10), "views>='10'"],
    ['lt', (b: any) => b.lt('views', 10), "views<'10'"],
    ['lte', (b: any) => b.lte('views', 10), "views<='10'"],
    ['like', (b: any) => b.like('title', '%draft%'), "title~'%draft%'"],
    ['ilike', (b: any) => b.ilike('title', '%draft%'), "title~'%draft%'"],
  ])('translates %s', async (_name, apply, expected) => {
    await apply(build().select('*'));
    expect(listArgs().filter).toBe(expected);
  });

  it('translates in() to an IN list', async () => {
    await build().select('*').in('status', ['draft', 'published']);
    expect(listArgs().filter).toBe('status IN (draft,published)');
  });

  it('joins multiple filters with AND', async () => {
    await build().select('*').eq('status', 'published').gt('views', 5);
    expect(listArgs().filter).toBe("status='published' AND views>'5'");
  });

  it('sends no filter when none were applied', async () => {
    await build().select('*');
    expect(listArgs().filter).toBeUndefined();
  });
});

describe('SnackbaseQueryBuilder — projection, sort and paging', () => {
  let stub: ReturnType<typeof stubClient>;
  const listArgs = () => stub.records.list.mock.calls[0][1];

  beforeEach(() => {
    stub = stubClient();
  });

  const build = () => new SnackbaseQueryBuilder(stub.client, 'posts');

  it('treats select("*") as "all fields"', async () => {
    await build().select('*');
    expect(listArgs().fields).toBeUndefined();
  });

  it('splits and trims a column list', async () => {
    await build().select('id, title,body');
    expect(listArgs().fields).toEqual(['id', 'title', 'body']);
  });

  it('sorts ascending by bare column name', async () => {
    await build().select('*').order('created_at');
    expect(listArgs().sort).toBe('created_at');
  });

  it('prefixes descending sorts with a minus', async () => {
    await build().select('*').order('created_at', { ascending: false });
    expect(listArgs().sort).toBe('-created_at');
  });

  it('passes limit through', async () => {
    await build().select('*').limit(10);
    expect(listArgs().limit).toBe(10);
  });

  it('translates range(from, to) into skip + limit', async () => {
    await build().select('*').range(10, 19);
    expect(listArgs().skip).toBe(10);
    expect(listArgs().limit).toBe(10);
  });

  it('targets the collection it was constructed with', async () => {
    await build().select('*');
    expect(stub.records.list.mock.calls[0][0]).toBe('posts');
  });
});

describe('SnackbaseQueryBuilder — single()', () => {
  let stub: ReturnType<typeof stubClient>;

  beforeEach(() => {
    stub = stubClient();
  });

  it('forces limit 1 and unwraps the first item', async () => {
    stub.records.list.mockResolvedValue({ items: [{ id: '1' }], total: 1 });

    const result = await new SnackbaseQueryBuilder(stub.client, 'posts')
      .select('*')
      .eq('id', '1')
      .single();

    expect(stub.records.list.mock.calls[0][1].limit).toBe(1);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(result.count).toBe(1);
  });

  it('returns the PGRST116 "No rows found" error on an empty result', async () => {
    stub.records.list.mockResolvedValue({ items: [], total: 0 });

    const result = await new SnackbaseQueryBuilder(stub.client, 'posts').select('*').single();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'No rows found', code: 'PGRST116' });
    expect(result.count).toBe(0);
  });

  it('converts a thrown SDK error into an error result', async () => {
    stub.records.list.mockRejectedValue(Object.assign(new Error('nope'), { statusCode: 500 }));

    const result = await new SnackbaseQueryBuilder(stub.client, 'posts').select('*').single();

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('nope');
    expect(result.error?.status).toBe(500);
  });
});

describe('SnackbaseQueryBuilder — count', () => {
  let stub: ReturnType<typeof stubClient>;

  beforeEach(() => {
    stub = stubClient();
  });

  it('reports the total when a count is requested', async () => {
    stub.records.list.mockResolvedValue({ items: [{ id: '1' }], total: 42 });

    const result = await new SnackbaseQueryBuilder(stub.client, 'posts').select('*', {
      count: 'exact',
    });

    expect(result.count).toBe(42);
  });

  it('reports a null count when none was requested', async () => {
    stub.records.list.mockResolvedValue({ items: [{ id: '1' }], total: 42 });

    const result = await new SnackbaseQueryBuilder(stub.client, 'posts').select('*');

    expect(result.count).toBeNull();
  });
});

describe('SnackbaseQueryBuilder — mutations', () => {
  let stub: ReturnType<typeof stubClient>;

  beforeEach(() => {
    stub = stubClient();
  });

  const build = () => new SnackbaseQueryBuilder(stub.client, 'posts');

  it('inserts a single record and returns it in an array', async () => {
    stub.records.create.mockResolvedValue({ id: '1', title: 'Hi' });

    const result = await build().insert({ title: 'Hi' });

    expect(stub.records.create).toHaveBeenCalledWith('posts', { title: 'Hi' });
    expect(result.data).toEqual([{ id: '1', title: 'Hi' }]);
  });

  it('inserts each element of an array', async () => {
    await build().insert([{ title: 'a' }, { title: 'b' }]);

    expect(stub.records.create).toHaveBeenCalledTimes(2);
    expect(stub.records.create).toHaveBeenCalledWith('posts', { title: 'a' });
    expect(stub.records.create).toHaveBeenCalledWith('posts', { title: 'b' });
  });

  it('patches the record named by the preceding eq("id", …)', async () => {
    await build().update({ title: 'new' }).eq('id', 'rec-1');

    expect(stub.records.patch).toHaveBeenCalledWith('posts', 'rec-1', { title: 'new' });
  });

  it('errors when update has no id filter', async () => {
    const result = await build().update({ title: 'new' });

    expect(result.data).toBeNull();
    expect(result.error?.message).toContain('.eq("id", id)');
    expect(stub.records.patch).not.toHaveBeenCalled();
  });

  it('deletes the record named by the preceding eq("id", …)', async () => {
    const result = await build().delete().eq('id', 'rec-1');

    expect(stub.records.delete).toHaveBeenCalledWith('posts', 'rec-1');
    expect(result.data).toEqual([]);
  });

  it('errors when delete has no id filter', async () => {
    const result = await build().delete();

    expect(result.error?.message).toContain('.eq("id", id)');
    expect(stub.records.delete).not.toHaveBeenCalled();
  });

  it('upserts via patch when the payload carries an id', async () => {
    await build().upsert({ id: 'rec-1', title: 'x' });

    expect(stub.records.patch).toHaveBeenCalledWith('posts', 'rec-1', { id: 'rec-1', title: 'x' });
    expect(stub.records.create).not.toHaveBeenCalled();
  });

  it('falls back to create when the upsert patch fails', async () => {
    stub.records.patch.mockRejectedValue(new Error('not found'));

    await build().upsert({ id: 'rec-1', title: 'x' });

    expect(stub.records.create).toHaveBeenCalledWith('posts', { id: 'rec-1', title: 'x' });
  });

  it('creates directly when the upsert payload has no id', async () => {
    await build().upsert({ title: 'x' });

    expect(stub.records.patch).not.toHaveBeenCalled();
    expect(stub.records.create).toHaveBeenCalledWith('posts', { title: 'x' });
  });
});

describe('SnackbaseQueryBuilder — unsupported', () => {
  it('throws NotSupportedError from rpc()', () => {
    const { client } = stubClient();
    expect(() => new SnackbaseQueryBuilder(client, 'posts').rpc()).toThrow(
      /not supported by SnackBase/,
    );
  });
});
