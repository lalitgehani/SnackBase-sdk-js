import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCodelistsTool } from '../../src/tools/codelists.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_codelists tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      codelists: {
        list: vi.fn(),
        get: vi.fn(),
        getValues: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        createValue: vi.fn(),
        setOverride: vi.fn(),
        clearOverride: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles get_values action', async () => {
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
    mockClient.codelists.getValues.mockResolvedValue(values);

    const result = (await handleCodelistsTool({
      action: 'get_values',
      code: 'regions',
      lang: 'en',
    })) as any;

    expect(mockClient.codelists.getValues).toHaveBeenCalledWith('regions', {
      lang: 'en',
    });
    expect(result.content[0].text).toBe(JSON.stringify(values, null, 2));
  });

  it('errors when code missing for get_values', async () => {
    const result = (await handleCodelistsTool({ action: 'get_values' })) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('code is required');
  });

  it('handles list action', async () => {
    const list = [{ code: 'regions', name: 'Cloud Regions' }];
    mockClient.codelists.list.mockResolvedValue(list);

    const result = (await handleCodelistsTool({ action: 'list' })) as any;

    expect(mockClient.codelists.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(list, null, 2));
  });

  it('handles set_override action', async () => {
    const ov = { id: '1', visibility: 'hidden', is_default: false };
    mockClient.codelists.setOverride.mockResolvedValue(ov);

    const result = (await handleCodelistsTool({
      action: 'set_override',
      code: 'regions',
      value_code: 'eu-01',
      visibility: 'hidden',
      account_id: 'acct-a',
    })) as any;

    expect(mockClient.codelists.setOverride).toHaveBeenCalledWith(
      'regions',
      'eu-01',
      {
        visibility: 'hidden',
        is_default: false,
        sort_order: undefined,
        metadata_override: undefined,
      },
      'acct-a',
    );
    expect(result.content[0].text).toBe(JSON.stringify(ov, null, 2));
  });
});
