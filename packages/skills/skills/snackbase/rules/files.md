---
name: files
description: File upload, download, and progress tracking in SnackBase SDK
metadata:
  tags: file, upload, download, progress, storage
---

The `files` service handles file uploads and downloads with support for progress tracking.

## Upload a File

```typescript
const file = fileInput.files[0];

const result = await client.files.upload(file, {
  collection: 'documents',
  recordId: docId,
  fieldName: 'attachment'
});

console.log(result.url); // Public URL
console.log(result.key); // Storage key
```

## Upload Options

```typescript
interface FileUploadOptions {
  collection?: string;  // Optional: Link to a collection
  recordId?: string;    // Optional: Link to a specific record
  fieldName?: string;   // Optional: Field name for the file reference
}
```

## Upload with Progress

```typescript
const result = await client.files.upload(file, options, {
  onProgress: (progress) => {
    console.log(`${progress.percentage}% complete`);
    console.log(`${progress.loaded} / ${progress.total} bytes`);

    // Update progress bar
    progressBar.style.width = `${progress.percentage}%`;
  }
});

interface UploadProgress {
  loaded: number;      // Bytes uploaded
  total: number;       // Total bytes
  percentage: number;  // 0-100
}
```

## Get Upload URL (Direct Upload)

For large files or direct-to-storage uploads:

```typescript
const { url, key } = await client.files.getUploadUrl({
  contentType: 'image/png',
  fileName: 'profile.png'
});

// Upload directly to the returned URL
await fetch(url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'image/png' }
});
```

## Delete a File

```typescript
await client.files.delete('storage-key-here');
```

## Get Public URL

```typescript
const url = await client.files.getPublicUrl('storage-key-here');
console.log(url); // https://cdn.snackbase.app/...
```

## File Upload Result

```typescript
interface FileUploadResult {
  url: string;     // Public URL
  key: string;     // Storage key
  size: number;    // File size in bytes
  contentType: string; // MIME type
  fileName: string;   // Original filename
}
```

## Complete Example: React Component

```typescript
import { useState } from 'react';
import { client } from './snackbase';

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await client.files.upload(file, {
        collection: 'documents',
        recordId: docId
      }, {
        onProgress: (p) => setProgress(p.percentage)
      });

      console.log('Uploaded:', result.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

## File Size Limits

- **Default limit**: 50MB per file
- **Recommended**: Use chunked uploads for files > 10MB

## Supported File Types

All standard MIME types are supported:

| Type | MIME Type |
|------|-----------|
| Images | `image/png`, `image/jpeg`, `image/gif`, `image/webp` |
| Videos | `video/mp4`, `video/webm`, `video/quicktime` |
| Audio | `audio/mpeg`, `audio/wav`, `audio/ogg` |
| Documents | `application/pdf`, `text/plain`, etc. |

## Linking Files to Records

To associate a file with a record:

```typescript
// 1. Upload the file
const fileResult = await client.files.upload(file, {
  collection: 'profiles',
  recordId: profileId,
  fieldName: 'avatar'
});

// 2. Update the record with the file reference
await client.records.update('profiles', profileId, {
  avatarUrl: fileResult.url,
  avatarKey: fileResult.key
});
```

## Direct Browser Upload Example

```typescript
async function uploadFileDirectly(file: File) {
  // Get signed URL
  const { url, key } = await client.files.getUploadUrl({
    contentType: file.type,
    fileName: file.name
  });

  // Upload directly to storage
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return { key, url: getPublicUrl(key) };
}
```
