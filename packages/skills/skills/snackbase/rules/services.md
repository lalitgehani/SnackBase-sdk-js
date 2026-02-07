---
name: services
description: Complete reference for all SDK services and their methods
metadata:
  tags: service, reference, api, methods
---

Complete reference for all services available in the SnackBase SDK.

## Service Architecture

All services follow a consistent pattern:

```typescript
export class ExampleService {
  constructor(private http: HttpClient) {}

  async list(params?: ListParams): Promise<ListResponse> {
    const response = await this.http.get<ListResponse>('/api/v1/resource', { params });
    return response.data; // Always unwrap response.data
  }
}
```

## Available Services

| Service | Purpose |
|---------|---------|
| AuthService | Authentication and session management |
| UserService | User CRUD operations |
| AccountService | Account management |
| CollectionService | Collection and schema operations |
| RecordService | Dynamic record CRUD |
| FileService | File upload/download |
| WebhookService | Webhook management |
| AuditLogService | Audit log queries and export |
| PermissionService | Permission checking |

## AuthService

**Constructor**: Receives http, authManager, apiKey, and defaultAccount

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse>
async logout(): Promise<{ success: boolean }>
async register(data: RegisterData): Promise<AuthResponse>
async verifyEmail(token: string): Promise<void>
async forgotPassword(data: PasswordResetRequest): Promise<void>
async resetPassword(data: PasswordResetConfirm): Promise<void>
async refreshToken(): Promise<AuthResponse>
async getCurrentUser(): Promise<AuthResponse>

// OAuth
async authenticateWithOAuth(data: OAuthData): Promise<AuthResponse>

// SAML
async getSAMLUrl(provider: SAMLProvider, account: string, relayState?: string): Promise<SAMLUrlResponse>
async handleSAMLCallback(params: SAMLCallbackParams): Promise<AuthResponse>
```

## UserService

```typescript
async list(params?: UserListParams): Promise<UserListResponse>
async get(userId: string): Promise<User>
async create(data: UserCreate): Promise<User>
async update(userId: string, data: UserUpdate): Promise<User>
async delete(userId: string): Promise<void>
```

**Note**: `getCurrentUser()` is available on the main client or via AuthService.

**List Response Format**:
```typescript
interface UserListResponse {
  items: User[];
  total: number;
  skip: number;
  limit: number;
}
```

## AccountService

```typescript
async list(params?: AccountListParams): Promise<AccountListResponse>
async get(accountId: string): Promise<Account>
async create(data: AccountCreate): Promise<Account>
async update(accountId: string, data: AccountUpdate): Promise<Account>
async delete(accountId: string): Promise<{ success: boolean }>
async getUsers(accountId: string, params?: AccountUserListParams): Promise<UserListResponse>
```

**List Response Format**:
```typescript
interface AccountListResponse {
  items: Account[];
  total: number;
  skip: number;
  limit: number;
}
```

## CollectionService

```typescript
async list(): Promise<Collection[]>
async listNames(): Promise<string[]>  // Get collection names only
async get(collectionIdOrName: string): Promise<Collection>
async create(data: CollectionCreate): Promise<Collection>
async update(collectionId: string, data: CollectionUpdate): Promise<Collection>
async delete(collectionId: string): Promise<{ success: boolean }>
async export(params?: CollectionExportParams): Promise<CollectionExportData>
async import(request: CollectionImportRequest): Promise<CollectionImportResult>
```

**Export Format**:
```typescript
interface CollectionExportData {
  version: string;
  exported_at: string;
  exported_by: string;
  collections: CollectionExportItem[];
}
```

## RecordService

Uses generics for type-safe operations:

```typescript
// List records
async list<T = any>(
  collection: string,
  params?: RecordListParams
): Promise<RecordListResponse<T>>

// Get single record
async get<T = any>(
  collection: string,
  recordId: string,
  options?: { fields?: string[]; expand?: string[] }
): Promise<T & BaseRecord>

// Create record
async create<T = any>(
  collection: string,
  data: T
): Promise<T & BaseRecord>

// Update record (partial, uses PATCH)
async update<T = any>(
  collection: string,
  recordId: string,
  data: Partial<T>
): Promise<T & BaseRecord>

// Delete record
async delete(
  collection: string,
  recordId: string
): Promise<void>
```

**List Response Format**:
```typescript
interface RecordListResponse<T> {
  items: (T & BaseRecord)[];
  total: number;
  skip: number;
  limit: number;
}
```

**List Parameters**:
```typescript
interface RecordListParams {
  skip?: number;
  limit?: number;
  sort?: string;
  filter?: string | Record<string, any>;
  fields?: string[];
  expand?: string[];
}
```

**Filter Format**:
- SQL-style expression: `'status="published" AND priority > 3'`
- Or object (auto-converted): `{ status: 'published' }`

## FileService

**Constructor**: Receives http, getBaseUrl(), and getToken() for dynamic access

```typescript
async upload(
  file: File | Blob,
  options?: FileUploadOptions,
  config?: { onProgress?: (progress: UploadProgress) => void }
): Promise<FileUploadResult>

async getUploadUrl(options: FileUploadOptions): Promise<{ url: string; key: string }>
async delete(key: string): Promise<void>
async getPublicUrl(key: string): Promise<string>
```

## WebhookService

```typescript
async list(params?: WebhookListParams): Promise<WebhookListResponse>
async get(webhookId: string): Promise<Webhook>
async create(data: WebhookCreate): Promise<Webhook>
async update(webhookId: string, data: WebhookUpdate): Promise<Webhook>
async delete(webhookId: string): Promise<void>
async trigger(webhookId: string): Promise<WebhookTriggerResult>
async getSecret(webhookId: string): Promise<{ secret: string }>
async rotateSecret(webhookId: string): Promise<{ secret: string }>
```

## AuditLogService

```typescript
async list(params?: AuditLogFilters): Promise<AuditLogListResponse>
async get(logId: string): Promise<AuditLog>
async export(params?: AuditLogFilters, format?: AuditLogExportFormat): Promise<string>
```

**Export Formats**: `'json'` (default), `'csv'`, `'pdf'`

**List Response Format**:
```typescript
interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  skip: number;
  limit: number;
  audit_logging_enabled: boolean;
}
```

## PermissionService

```typescript
async check(permission: string, resourceId?: string): Promise<boolean>
async checkBatch(permissions: string[]): Promise<Record<string, boolean>>
async getCurrentUserPermissions(): Promise<string[]>
```

## HTTP Client Reference

The `HttpClient` class is the foundation for all service communication:

```typescript
class HttpClient {
  // Request methods
  async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>>
  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>>
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>>
  async delete<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): void
  addResponseInterceptor(interceptor: ResponseInterceptor): void
  addErrorInterceptor(interceptor: ErrorInterceptor): void

  // Configuration
  setBaseUrl(baseUrl: string): void
  setToken(token: string | null): void
}
```

### Response Interface

```typescript
interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}
```

### Request Options

```typescript
interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
```
