The `files` service uploads, builds download URLs, and deletes files.

Aligned with `FileService` and `types/file.ts` in `@snackbase/sdk` ≥ 0.6.0.

## Table of Contents

- [Upload a File](#upload-a-file)
- [Upload Options](#upload-options)
- [Download URL](#download-url)
- [Delete a File](#delete-a-file)
- [File Metadata](#file-metadata)
- [Linking Files to Records](#linking-files-to-records)
- [React Example](#react-example)

## Upload a File

```typescript
const file = fileInput.files[0];

const meta = await client.files.upload(file, {
  filename: 'report.pdf', // optional
  contentType: 'application/pdf', // optional
});

console.log(meta.path); // {account_id}/{uuid_filename}
console.log(meta.filename, meta.size, meta.mime_type);
```

Upload does **not** accept `collection`, `record`, or `field` options. Link files to records by storing the returned `path` (or a field of type `file`) on the record.

## Upload Options

```typescript
interface FileUploadOptions {
  filename?: string;
  contentType?: string;
}
```

Endpoint: `POST /api/v1/files/upload` (multipart form field `file`).

## Download URL

```typescript
// path from upload response
const url = client.files.getDownloadUrl(meta.path);
// GET {baseUrl}/api/v1/files/{path}?token=... when authenticated
```

There is no `getUrl` or `download` method on `FileService` — use `getDownloadUrl` and fetch the URL in the browser or with your HTTP stack.

## Delete a File

```typescript
await client.files.delete(meta.path);
// DELETE /api/v1/files/{path} → { success: true }
```

## File Metadata

```typescript
interface FileMetadata {
  filename: string;
  size: number;
  mime_type: string;
  path: string; // {account_id}/{uuid_filename}
}
```

## Linking Files to Records

```typescript
// 1. Upload
const file = await client.files.upload(blob, { filename: 'avatar.png' });

// 2. Store path on a record (field type `file` or `text`)
await client.records.patch('profiles', profileId, {
  avatar: file.path,
});

// 3. Later resolve download URL
const url = client.files.getDownloadUrl(file.path);
```

## React Example

```typescript
import { useState } from 'react';
import { client } from './snackbase';

export function FileUpload({ profileId }: { profileId: string }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const meta = await client.files.upload(file, { filename: file.name });
      await client.records.patch('profiles', profileId, { avatar: meta.path });
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
