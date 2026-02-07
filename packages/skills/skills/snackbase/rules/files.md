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
  record: docId,
  field: 'attachment'
});

console.log(result); // File record with token, url, etc.
```

## Upload Options

```typescript
interface FileUploadOptions {
  collection?: string;  // Optional: Link to a collection
  record?: string;     // Optional: Link to a specific record
  field?: string;       // Optional: Field name for the file reference
}
```

## Download a File

```typescript
// Get download URL from file token
const url = client.files.getUrl('file-token-here');

// Or download the file as Blob
const blob = await client.files.download('file-token-here');

// Save to disk in browser
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'filename.pdf';
a.click();
```

## File Record

```typescript
interface FileRecord {
  id: string;
  token: string;        // Access token
  filename: string;     // Original filename
  mimetype: string;     // MIME type
  size: number;         // File size in bytes
  created_at: string;   // ISO timestamp
}
```

## Complete Example: React Component

```typescript
import { useState } from 'react';
import { client } from './snackbase';

export function FileUpload() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const result = await client.files.upload(file, {
        collection: 'documents',
        record: docId
      });

      console.log('Uploaded:', result);
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
const fileRecord = await client.files.upload(file, {
  collection: 'profiles',
  record: profileId,
  field: 'avatar'
});

// 2. Update the record with the file token
await client.records.update('profiles', profileId, {
  avatar: fileRecord.token
});

// 3. Later, get the download URL
const url = client.files.getUrl(fileRecord.token);
```
