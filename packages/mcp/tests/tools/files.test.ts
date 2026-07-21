import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFilesTool } from '../../src/tools/files.js';
import { createClient } from '../../src/client.js';

vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_files tool', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      files: {
        getDownloadUrl: vi.fn(),
        delete: vi.fn(),
        upload: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockClient);
  });

  it('handles get_download_url', async () => {
    mockClient.files.getDownloadUrl.mockReturnValue(
      'https://example.com/api/v1/files/acc/uuid/file.png?token=t',
    );

    const result = await handleFilesTool({
      action: 'get_download_url',
      path: '/acc/uuid/file.png',
    }) as any;

    expect(mockClient.files.getDownloadUrl).toHaveBeenCalledWith('/acc/uuid/file.png');
    expect(JSON.parse(result.content[0].text)).toEqual({
      url: 'https://example.com/api/v1/files/acc/uuid/file.png?token=t',
    });
  });

  it('handles delete', async () => {
    mockClient.files.delete.mockResolvedValue({ success: true });

    const result = await handleFilesTool({
      action: 'delete',
      path: '/acc/uuid/file.png',
    }) as any;

    expect(mockClient.files.delete).toHaveBeenCalledWith('/acc/uuid/file.png');
    expect(result.content[0].text).toBe(JSON.stringify({ success: true }, null, 2));
  });

  it('throws when path missing', async () => {
    const result = await handleFilesTool({ action: 'get_download_url' }) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('path is required');
  });

  it('does not call upload (intentional non-exposure)', async () => {
    const result = await handleFilesTool({ action: 'upload', path: '/x' }) as any;
    expect(result.isError).toBe(true);
    expect(mockClient.files.upload).not.toHaveBeenCalled();
  });
});
