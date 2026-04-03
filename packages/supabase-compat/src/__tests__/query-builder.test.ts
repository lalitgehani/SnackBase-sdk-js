import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnackbaseQueryBuilder } from '../query-builder';

// ── Mock SnackBaseClient ──────────────────────────────────────────────────────

function makeMockClient() {
  const records = {
    list: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  };
  return { records };
}

import { SnackbaseQueryBuilder } from '../query-builder';

// ── Sample data ───────────────────────────────────────────────────────────────

const MOCK_RECORD = {
  id: 'rec-1',
  account_id: 'acc-1',
  title: 'Hello World',
  status: 'published',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const MOCK_LIST_RESPONSE = {
  items: [MOCK_RECORD],
  total: 1,
  skip: 0,
  limit: 10,
};

// ── Lazy execution tests ───────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — lazy execution', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    client.records.list.mockResolvedValue(MOCK_LIST_RESPONSE);
  });

  it('is lazy — does not call network until await-ed', () => {
    const builder = new SnackbaseQueryBuilder(client as any, 'posts');
    builder.select('*').eq('status', 'published').limit(10);

    // No calls yet
    expect(client.records.list).not.toHaveBeenCalled();
  });

  it('calls records.list when await-ed', async () => {
    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .select('*')
      .limit(10);

    expect(client.records.list).toHaveBeenCalledOnce();
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('implements .then() for await support', async () => {
    const result = await new SnackbaseQueryBuilder(client as any, 'posts');
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });
});

// ── SELECT + filter mapping ────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — SELECT filters', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    client.records.list.mockResolvedValue(MOCK_LIST_RESPONSE);
  });

  it('.eq() builds correct filter string', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts')
      .select('*')
      .eq('status', 'published');

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      filter: "status='published'",
    }));
  });

  it('.neq() builds correct filter string', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').neq('draft', true);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      filter: "draft!='true'",
    }));
  });

  it('.gt() builds correct filter string', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').gt('views', 100);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      filter: "views>'100'",
    }));
  });

  it('.lt() builds correct filter string', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').lt('price', 50);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      filter: "price<'50'",
    }));
  });

  it('.in() builds IN filter string', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').in('status', ['draft', 'published']);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      filter: 'status IN (draft,published)',
    }));
  });

  it('multiple .eq() calls join with AND', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts')
      .eq('status', 'published')
      .eq('category', 'tech');

    const callArgs = client.records.list.mock.calls[0][1];
    expect(callArgs.filter).toContain('AND');
    expect(callArgs.filter).toContain("status='published'");
    expect(callArgs.filter).toContain("category='tech'");
  });

  it('.select() with specific columns sends fields param', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').select('id, title, body');

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      fields: ['id', 'title', 'body'],
    }));
  });

  it('.select("*") sends no fields param (all fields)', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').select('*');

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      fields: undefined,
    }));
  });
});

// ── ORDER + LIMIT + RANGE ──────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — ordering and pagination', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    client.records.list.mockResolvedValue(MOCK_LIST_RESPONSE);
  });

  it('.order("col") sends ascending sort', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').order('created_at', { ascending: true });

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      sort: 'created_at',
    }));
  });

  it('.order("col", { ascending: false }) sends "-col"', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').order('created_at', { ascending: false });

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      sort: '-created_at',
    }));
  });

  it('.limit(n) passes limit param', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').limit(20);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      limit: 20,
    }));
  });

  it('.range(0, 9) computes skip=0 limit=10', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').range(0, 9);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      skip: 0,
      limit: 10,
    }));
  });

  it('.range(10, 19) computes skip=10 limit=10', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').range(10, 19);

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      skip: 10,
      limit: 10,
    }));
  });
});

// ── .single() ────────────────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — .single()', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('returns the first item as data (not array) when row exists', async () => {
    client.records.list.mockResolvedValue({ items: [MOCK_RECORD], total: 1, skip: 0, limit: 1 });

    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .select('*')
      .single();

    expect(error).toBeNull();
    expect(data).toEqual(MOCK_RECORD); // single object, not array
    expect(Array.isArray(data)).toBe(false);
  });

  it('returns { data: null, error: "No rows found" } when no rows', async () => {
    client.records.list.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 1 });

    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .select('*')
      .single();

    expect(data).toBeNull();
    expect(error?.message).toBe('No rows found');
    expect(error?.code).toBe('PGRST116');
  });

  it('sends limit: 1 to records.list', async () => {
    client.records.list.mockResolvedValue({ items: [MOCK_RECORD], total: 1, skip: 0, limit: 1 });

    await new SnackbaseQueryBuilder(client as any, 'posts').single();

    expect(client.records.list).toHaveBeenCalledWith('posts', expect.objectContaining({
      limit: 1,
    }));
  });
});

// ── INSERT ────────────────────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — .insert()', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    client.records.create.mockResolvedValue(MOCK_RECORD);
  });

  it('calls records.create and returns array with created record', async () => {
    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .insert({ title: 'My Post', status: 'draft' });

    expect(client.records.create).toHaveBeenCalledWith('posts', { title: 'My Post', status: 'draft' });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect((data as any[])[0].id).toBe('rec-1');
  });

  it('bulk inserts an array of records', async () => {
    const record2 = { ...MOCK_RECORD, id: 'rec-2', title: 'Post 2' };
    client.records.create
      .mockResolvedValueOnce(MOCK_RECORD)
      .mockResolvedValueOnce(record2);

    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .insert([{ title: 'Post 1' }, { title: 'Post 2' }]);

    expect(client.records.create).toHaveBeenCalledTimes(2);
    expect(error).toBeNull();
    expect((data as any[]).length).toBe(2);
  });

  it('does NOT call records.list', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts').insert({ title: 'Test' });
    expect(client.records.list).not.toHaveBeenCalled();
  });
});

// ── UPDATE ────────────────────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — .update()', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    client.records.patch.mockResolvedValue({ ...MOCK_RECORD, title: 'Updated Title' });
  });

  it('calls records.patch with the ID from .eq("id", id)', async () => {
    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .update({ title: 'Updated Title' })
      .eq('id', 'rec-1');

    expect(client.records.patch).toHaveBeenCalledWith('posts', 'rec-1', { title: 'Updated Title' });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect((data as any[])[0].title).toBe('Updated Title');
  });

  it('returns error when no .eq("id", id) filter provided', async () => {
    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .update({ title: 'Updated' });

    expect(data).toBeNull();
    expect(error?.message).toContain('.eq("id", id)');
  });

  it('does NOT include the id filter in the patch filter string', async () => {
    await new SnackbaseQueryBuilder(client as any, 'posts')
      .update({ title: 'Updated' })
      .eq('id', 'rec-1')
      .eq('status', 'draft'); // Additional filter should be ignored for patch

    expect(client.records.patch).toHaveBeenCalledWith('posts', 'rec-1', { title: 'Updated' });
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — .delete()', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
    client.records.delete.mockResolvedValue({ success: true });
  });

  it('calls records.delete with the ID from .eq("id", id)', async () => {
    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .delete()
      .eq('id', 'rec-1');

    expect(client.records.delete).toHaveBeenCalledWith('posts', 'rec-1');
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('returns error when no .eq("id", id) filter provided', async () => {
    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts').delete();

    expect(data).toBeNull();
    expect(error?.message).toContain('.eq("id", id)');
  });
});

// ── UPSERT ────────────────────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — .upsert()', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('patches existing record when id is provided in data', async () => {
    client.records.patch.mockResolvedValue(MOCK_RECORD);

    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .upsert({ id: 'rec-1', title: 'Updated' });

    expect(client.records.patch).toHaveBeenCalledWith('posts', 'rec-1', { id: 'rec-1', title: 'Updated' });
    expect(error).toBeNull();
  });

  it('creates a new record when patch fails (no existing record)', async () => {
    client.records.patch.mockRejectedValue(new Error('Not found'));
    client.records.create.mockResolvedValue({ ...MOCK_RECORD, id: 'rec-new' });

    const { data, error } = await new SnackbaseQueryBuilder(client as any, 'posts')
      .upsert({ id: 'rec-999', title: 'New Post' });

    expect(client.records.create).toHaveBeenCalled();
    expect(error).toBeNull();
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe('SnackbaseQueryBuilder — error handling', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
  });

  it('returns { data: null, error } on network failure — never throws', async () => {
    client.records.list.mockRejectedValue(new Error('Network error'));

    let threw = false;
    let result: any;
    try {
      result = await new SnackbaseQueryBuilder(client as any, 'posts').select('*');
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Network error');
  });

  it('.rpc() throws NotSupportedError synchronously', () => {
    const builder = new SnackbaseQueryBuilder(client as any, 'posts');
    expect(() => builder.rpc()).toThrow('from().rpc');
  });

  it('.returns() is a no-op and returns the builder', () => {
    const builder = new SnackbaseQueryBuilder(client as any, 'posts');
    const result = builder.returns<{ custom: string }>();
    expect(result).toBe(builder);
  });
});
