import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeMockClient() {
  const fileService = {
    upload: vi.fn(),
    getDownloadUrl: vi.fn(),
    delete: vi.fn(),
  };

  return {
    files: fileService,
  };
}

let StorageBridge: typeof import('../storage-bridge').StorageBridge;

beforeEach(async () => {
  const mod = await import('../storage-bridge');
  StorageBridge = mod.StorageBridge;
});

describe('StorageBridge', () => {
  let client: ReturnType<typeof makeMockClient>;
  let bridge: InstanceType<typeof import('../storage-bridge').StorageBridge>;

  beforeEach(() => {
    client = makeMockClient();
    bridge = new StorageBridge(client as any);
  });

  describe('from()', () => {
    it('returns a BucketReference with the bucket name', () => {
      const bucket = bridge.from('avatars');
      expect(bucket).toBeDefined();
      expect((bucket as any).bucket).toBe('avatars');
    });
  });

  describe('BucketReference', () => {
    let bucket: any;

    beforeEach(() => {
      bucket = bridge.from('avatars');
    });

    describe('upload()', () => {
      it('calls files.upload with prefixed path', async () => {
        client.files.upload.mockResolvedValue({ id: 'file-1' });
        const file = new Blob(['hello'], { type: 'text/plain' });

        const { data, error } = await bucket.upload('user-1.txt', file, {
          contentType: 'text/plain',
        });

        expect(client.files.upload).toHaveBeenCalledWith(file, {
          filename: 'avatars/user-1.txt',
          contentType: 'text/plain',
        });
        expect(error).toBeNull();
        expect(data?.path).toBe('user-1.txt');
      });
    });

    describe('download()', () => {
      it('fetches file from download URL and returns blob', async () => {
        const mockBlob = new Blob(['content']);
        client.files.getDownloadUrl.mockReturnValue('http://localhost:8000/download/avatars/user-1.txt');
        
        // Mock global fetch
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
        });

        const { data, error } = await bucket.download('user-1.txt');

        expect(client.files.getDownloadUrl).toHaveBeenCalledWith('avatars/user-1.txt');
        expect(error).toBeNull();
        expect(data).toBe(mockBlob);
      });

      it('returns error when fetch fails', async () => {
        client.files.getDownloadUrl.mockReturnValue('http://localhost:8000/download/avatars/user-1.txt');
        
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          statusText: 'Not Found',
        });

        const { data, error } = await bucket.download('user-1.txt');

        expect(data).toBeNull();
        expect(error?.message).toContain('Failed to download file: Not Found');
      });
    });

    describe('getPublicUrl()', () => {
      it('returns download URL from files service', () => {
        client.files.getDownloadUrl.mockReturnValue('http://localhost:8000/public/avatars/user-1.txt');

        const { data } = bucket.getPublicUrl('user-1.txt');

        expect(client.files.getDownloadUrl).toHaveBeenCalledWith('avatars/user-1.txt');
        expect(data.publicUrl).toBe('http://localhost:8000/public/avatars/user-1.txt');
      });
    });

    describe('remove()', () => {
      it('calls files.delete for each path', async () => {
        client.files.delete.mockResolvedValue({ success: true });

        const { data, error } = await bucket.remove(['file1.txt', 'file2.txt']);

        expect(client.files.delete).toHaveBeenCalledTimes(2);
        expect(client.files.delete).toHaveBeenCalledWith('avatars/file1.txt');
        expect(client.files.delete).toHaveBeenCalledWith('avatars/file2.txt');
        expect(error).toBeNull();
        expect(data).toEqual([{ name: 'file1.txt' }, { name: 'file2.txt' }]);
      });
    });
  });
});
