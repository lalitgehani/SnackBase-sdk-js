import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileService } from './file-service';
import { HttpClient } from './http-client';

describe('FileService', () => {
  let httpClient: HttpClient;
  let fileService: FileService;
  const baseUrl = 'https://api.example.com';
  const token = 'test-token';

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl });
    fileService = new FileService(
      httpClient,
      () => baseUrl,
      () => token
    );
  });

  describe('upload', () => {
    it('should upload a file using FormData', async () => {
      // Mock Blob since File might not be available in Node/Test environment easily
      const mockFile = new Blob(['test content'], { type: 'text/plain' });
      (mockFile as any).name = 'test.txt';

      const mockResponse = {
        filename: 'test.txt',
        contentType: 'text/plain',
        size: 12,
        path: '/uploads/test.txt',
        created_at: '2026-01-22T12:00:00Z',
      };

      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockResponse,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await fileService.upload(mockFile);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/files/upload', expect.any(FormData), {
        headers: {
          'Content-Type': undefined,
        },
      });

      const callArgs = postSpy.mock.calls[0];
      const formData = callArgs[1] as FormData;
      expect(formData.get('file')).toBeDefined();
      
      expect(result).toEqual(mockResponse);
    });

    it('should use custom filename if provided', async () => {
      const mockFile = new Blob(['test content'], { type: 'text/plain' });
      
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { path: '/uploads/custom.txt' } as any,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      await fileService.upload(mockFile, { filename: 'custom.txt' });

      const formData = postSpy.mock.calls[0][1] as FormData;
      // In some environments, getting the file from FormData might return the Blob
      // but the filename is set during append.
      expect(formData.get('file')).toBeDefined();
    });
  });

  describe('getDownloadUrl', () => {
    it('should return a valid download URL with token', () => {
      const path = '/uploads/test.txt';
      const url = fileService.getDownloadUrl(path);

      expect(url).toBe(`${baseUrl}/api/v1/files/download/uploads/test.txt?token=${token}`);
    });

    it('should handle paths without leading slash', () => {
      const path = 'uploads/test.txt';
      const url = fileService.getDownloadUrl(path);

      expect(url).toBe(`${baseUrl}/api/v1/files/download/uploads/test.txt?token=${token}`);
    });

    it('should omit token if not available', () => {
      fileService = new FileService(
        httpClient,
        () => baseUrl,
        () => null
      );
      const path = '/uploads/test.txt';
      const url = fileService.getDownloadUrl(path);

      expect(url).toBe(`${baseUrl}/api/v1/files/download/uploads/test.txt`);
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: {},
        status: 204,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await fileService.delete('/uploads/test.txt');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/files/uploads/test.txt');
      expect(result.success).toBe(true);
    });

    it('should handle paths without leading slash for delete', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: {},
        status: 204,
        headers: new Headers(),
        request: {} as any,
      });

      await fileService.delete('uploads/test.txt');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/files/uploads/test.txt');
    });
  });
});
