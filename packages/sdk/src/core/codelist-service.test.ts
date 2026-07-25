import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodelistService } from './codelist-service';
import type { HttpClient } from './http-client';

describe('CodelistService', () => {
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: CodelistService;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    service = new CodelistService(http as unknown as HttpClient);
  });

  it('list() GETs /api/v1/codelists and returns data', async () => {
    const payload = [{ code: 'regions', name: 'Regions' }];
    http.get.mockResolvedValue({ data: payload });
    const result = await service.list();
    expect(http.get).toHaveBeenCalledWith('/api/v1/codelists', { params: undefined });
    expect(result).toEqual(payload);
  });

  it('getValues() loads effective values with lang', async () => {
    const values = [
      {
        code: 'eu-01',
        label: 'EU Central (Germany)',
        is_default: false,
        sort_order: 1,
        scope: 'system',
        is_active: true,
      },
    ];
    http.get.mockResolvedValue({ data: values });
    const result = await service.getValues('regions', { lang: 'en' });
    expect(http.get).toHaveBeenCalledWith('/api/v1/codelists/regions/values', {
      params: { lang: 'en' },
    });
    expect(result[0].code).toBe('eu-01');
  });

  it('create() POSTs body', async () => {
    http.post.mockResolvedValue({ data: { code: 'tags', name: 'Tags' } });
    const result = await service.create({ code: 'tags', name: 'Tags', scope: 'account' });
    expect(http.post).toHaveBeenCalledWith('/api/v1/codelists', {
      code: 'tags',
      name: 'Tags',
      scope: 'account',
    });
    expect(result.code).toBe('tags');
  });

  it('setOverride() PUTs override', async () => {
    http.put.mockResolvedValue({
      data: { id: '1', visibility: 'hidden', is_default: false },
    });
    const ov = await service.setOverride('regions', 'eu-01', { visibility: 'hidden' });
    expect(http.put).toHaveBeenCalledWith(
      '/api/v1/codelists/regions/values/eu-01/override',
      { visibility: 'hidden' },
      { params: undefined },
    );
    expect(ov.visibility).toBe('hidden');
  });
});
