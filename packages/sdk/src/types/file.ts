/**
 * Metadata for an uploaded file, as returned by the server.
 */
export interface FileMetadata {
  /**
   * Safe filename.
   */
  filename: string;

  /**
   * File size in bytes.
   */
  size: number;

  /**
   * MIME type of the file.
   */
  mime_type: string;

  /**
   * Server path to the file (format: {account_id}/{uuid_filename}).
   */
  path: string;
}

/**
 * Full response body from POST /api/v1/files/upload.
 */
export interface FileUploadResponse {
  success: boolean;
  file: FileMetadata;
  message: string;
}

/**
 * Options for file upload.
 */
export interface FileUploadOptions {
  /**
   * Custom filename for the upload.
   */
  filename?: string;

  /**
   * Custom content type for the upload.
   */
  contentType?: string;
}
