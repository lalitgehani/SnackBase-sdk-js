import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMigrationsTool } from '../../src/tools/migrations.js';
import { createClient } from '../../src/client.js';

// Mock the client factory
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_migrations tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      migrations: {
        list: vi.fn(),
        getCurrent: vi.fn(),
        getHistory: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles list action', async () => {
    const mockRevisions = {
      revisions: [
        { revision: '20240101000000', description: 'initial', isApplied: true, isDynamic: false }
      ],
      total: 1,
      currentRevision: '20240101000000'
    };
    mockClient.migrations.list.mockResolvedValue(mockRevisions);

    const result = await handleMigrationsTool({ action: 'list' }) as any;

    expect(mockClient.migrations.list).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockRevisions, null, 2));
  });

  it('handles get_current action', async () => {
    const mockCurrent = {
      revision: '20240101000000',
      description: 'initial',
      appliedAt: '2024-01-01T00:00:00Z',
      isDynamic: false
    };
    mockClient.migrations.getCurrent.mockResolvedValue(mockCurrent);

    const result = await handleMigrationsTool({ action: 'get_current' }) as any;

    expect(mockClient.migrations.getCurrent).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockCurrent, null, 2));
  });

  it('handles get_history action', async () => {
    const mockHistory = {
      history: [
        { revision: '20240101000000', description: 'initial', appliedAt: '2024-01-01T00:00:00Z' }
      ],
      total: 1
    };
    mockClient.migrations.getHistory.mockResolvedValue(mockHistory);

    const result = await handleMigrationsTool({ action: 'get_history' }) as any;

    expect(mockClient.migrations.getHistory).toHaveBeenCalled();
    expect(result.content[0].text).toBe(JSON.stringify(mockHistory, null, 2));
  });

  it('maps SDK errors correctly', async () => {
    mockClient.migrations.list.mockRejectedValue(new Error('SDK Error'));

    const result = await handleMigrationsTool({ action: 'list' }) as any;

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SDK Error');
  });

  it('handles unknown action', async () => {
    const result = await handleMigrationsTool({ action: 'invalid' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown action: invalid');
  });
});
