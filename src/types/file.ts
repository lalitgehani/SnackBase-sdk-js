/**
 * Metadata for a file.
 */
export interface FileMetadata {
  /**
   * Safe filename.
   */
  filename: string;
  
  /**
   * MIME type of the file.
   */
  contentType: string;
  
  /**
   * File size in bytes.
   */
  size: number;
  
  /**
   * Server path to the file.
   */
  path: string;
  
  /**
   * Upload timestamp.
   */
  created_at: string;
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
