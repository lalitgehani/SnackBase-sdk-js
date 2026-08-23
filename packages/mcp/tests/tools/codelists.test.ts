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
        listManageValues: vi.fn(),
        updateValue: vi.fn(),
        upsertLabels: vi.fn(),
        listOverrides: vi.fn(),
        export: vi.fn(),
        import: vi.fn(),
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

  it('handles list_manage_values action and defaults include_inactive to true', async () => {
    const values = [{ code: 'eu-01', is_active: false }];
    mockClient.codelists.listManageValues.mockResolvedValue(values);

    const result = (await handleCodelistsTool({
      action: 'list_manage_values',
      code: 'regions',
    })) as any;

    expect(mockClient.codelists.listManageValues).toHaveBeenCalledWith('regions', true);
    expect(result.content[0].text).toBe(JSON.stringify(values, null, 2));
  });

  it('honours include_inactive false for list_manage_values', async () => {
    mockClient.codelists.listManageValues.mockResolvedValue([]);

    await handleCodelistsTool({
      action: 'list_manage_values',
      code: 'regions',
      include_inactive: false,
    });

    expect(mockClient.codelists.listManageValues).toHaveBeenCalledWith('regions', false);
  });

  it('handles update_value action', async () => {
    const updated = { code: 'eu-01', sort_order: 5 };
    mockClient.codelists.updateValue.mockResolvedValue(updated);

    const result = (await handleCodelistsTool({
      action: 'update_value',
      code: 'regions',
      value_code: 'eu-01',
      value: { sort_order: 5 },
    })) as any;

    expect(mockClient.codelists.updateValue).toHaveBeenCalledWith('regions', 'eu-01', {
      sort_order: 5,
    });
    expect(result.content[0].text).toBe(JSON.stringify(updated, null, 2));
  });

  it('errors when value is missing for update_value', async () => {
    const result = (await handleCodelistsTool({
      action: 'update_value',
      code: 'regions',
      value_code: 'eu-01',
    })) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('value is required');
  });

  it('handles upsert_labels action', async () => {
    const labels = [{ language: 'de', label: 'EU Zentral' }];
    mockClient.codelists.upsertLabels.mockResolvedValue(labels);

    const result = (await handleCodelistsTool({
      action: 'upsert_labels',
      code: 'regions',
      value_code: 'eu-01',
      labels,
    })) as any;

    expect(mockClient.codelists.upsertLabels).toHaveBeenCalledWith('regions', 'eu-01', labels);
    expect(result.content[0].text).toBe(JSON.stringify(labels, null, 2));
  });

  it('errors when labels is not an array for upsert_labels', async () => {
    const result = (await handleCodelistsTool({
      action: 'upsert_labels',
      code: 'regions',
      value_code: 'eu-01',
    })) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('labels must be an array');
  });

  it('handles list_overrides action', async () => {
    const overrides = [{ value_code: 'eu-01', visibility: 'hidden' }];
    mockClient.codelists.listOverrides.mockResolvedValue(overrides);

    const result = (await handleCodelistsTool({
      action: 'list_overrides',
      code: 'regions',
      account_id: 'acct-a',
    })) as any;

    expect(mockClient.codelists.listOverrides).toHaveBeenCalledWith('regions', 'acct-a');
    expect(result.content[0].text).toBe(JSON.stringify(overrides, null, 2));
  });

  it('handles export action', async () => {
    const pkg = { code: 'regions', values: [] };
    mockClient.codelists.export.mockResolvedValue(pkg);

    const result = (await handleCodelistsTool({ action: 'export', code: 'regions' })) as any;

    expect(mockClient.codelists.export).toHaveBeenCalledWith('regions');
    expect(result.content[0].text).toBe(JSON.stringify(pkg, null, 2));
  });

  it('handles import action', async () => {
    const pkg = { code: 'regions', values: [] };
    mockClient.codelists.import.mockResolvedValue({ code: 'regions' });

    const result = (await handleCodelistsTool({ action: 'import', package: pkg })) as any;

    expect(mockClient.codelists.import).toHaveBeenCalledWith(pkg);
    expect(result.content[0].text).toBe(JSON.stringify({ code: 'regions' }, null, 2));
  });

  it('errors when package is missing for import', async () => {
    const result = (await handleCodelistsTool({ action: 'import' })) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('package is required');
  });
});
