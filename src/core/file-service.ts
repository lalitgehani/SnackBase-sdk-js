import { HttpClient } from './http-client';
import { FileMetadata, FileUploadOptions } from '../types/file';

/**
 * Service for working with files (upload, download, delete).
 */
export class FileService {
  constructor(
    private http: HttpClient,
    private getBaseUrl: () => string,
    private getToken: () => string | null
  ) {}

  /**
   * Upload a file to the server.
   * @param file The file or blob to upload
   * @param options Optional upload options (filename, contentType)
   */
  async upload(file: File | Blob, options?: FileUploadOptions): Promise<FileMetadata> {
    const formData = new FormData();
    
    // Use specified filename or try to get it from File object
    const filename = options?.filename || (file as File).name || 'file';
    formData.append('file', file, filename);

    if (options?.contentType) {
      // Content-type is usually handled by FormData/Browser, but we can set it if needed
      // Note: Setting Content-Type header manually often breaks FormData boundaries
    }

    const response = await this.http.post<FileMetadata>('/api/v1/files/upload', formData, {
      // Override default Content-Type header to let the browser set the boundary
      headers: {
        'Content-Type': undefined as any
      }
    });

    return response.data;
  }

  /**
   * Get the download URL for a file.
   * @param path The server path to the file
   */
  getDownloadUrl(path: string): string {
    const baseUrl = this.getBaseUrl().replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${baseUrl}/api/v1/files/download${cleanPath}`);
    
    const token = this.getToken();
    if (token) {
      url.searchParams.set('token', token);
    }

    return url.toString();
  }

  /**
   * Delete a file from the server.
   * @param path The server path to the file
   */
  async delete(path: string): Promise<{ success: boolean }> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    await this.http.delete(`/api/v1/files${cleanPath}`);
    return { success: true };
  }
}
