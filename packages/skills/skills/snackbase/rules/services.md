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
async login(email: string, password: string): Promise<AuthResult>
async logout(): Promise<void>
async register(data: RegisterRequest): Promise<AuthResult>
async verifyEmail(email: string, token: string): Promise<void>
async requestPasswordReset(email: string): Promise<void>
async resetPassword(token: string, newPassword: string): Promise<void>

// OAuth
oauthAuthorize(config: OAuthConfig): string
oauthExchange(provider: string, data: OAuthExchangeRequest): Promise<AuthResult>

// SAML
samlAuthorize(config: SAMLConfig): string

// Session
getState(): AuthState | null
on(event: AuthEvent, callback: (state: AuthState) => void): void
off(event: AuthEvent, callback: (state: AuthState) => void): void
```

## UserService

```typescript
async list(params?: UserListParams): Promise<UserListResponse>
async get(userId: string): Promise<User>
async create(data: UserCreate): Promise<User>
async update(userId: string, data: UserUpdate): Promise<User>
async delete(userId: string): Promise<void>
async me(): Promise<User>
async updateMe(data: UserUpdateMe): Promise<User>
async changePassword(data: ChangePasswordRequest): Promise<void>
```

## AccountService

```typescript
async list(params?: AccountListParams): Promise<AccountListResponse>
async get(accountId: string): Promise<Account>
async create(data: AccountCreate): Promise<Account>
async update(accountId: string, data: AccountUpdate): Promise<Account>
async delete(accountId: string): Promise<void>
async switchAccount(accountId: string): Promise<AuthState>
```

## CollectionService

```typescript
async list(params?: CollectionListParams): Promise<CollectionListResponse>
async get(collectionIdOrSlug: string): Promise<Collection>
async create(data: CollectionCreate): Promise<Collection>
async update(collectionIdOrSlug: string, data: CollectionUpdate): Promise<Collection>
async delete(collectionIdOrSlug: string): Promise<void>
async export(collectionIdOrSlug: string): Promise<CollectionExport>
async import(data: CollectionImport): Promise<CollectionImportResult>
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
  recordId: string
): Promise<T & BaseRecord>

// Create record
async create<T = any>(
  collection: string,
  data: T
): Promise<T & BaseRecord>

// Update record (partial)
async update<T = any>(
  collection: string,
  recordId: string,
  data: Partial<T>
): Promise<T & BaseRecord>

// Replace record (full)
async replace<T = any>(
  collection: string,
  recordId: string,
  data: T
): Promise<T & BaseRecord>

// Delete record
async delete(
  collection: string,
  recordId: string
): Promise<boolean>

// Bulk operations
async bulkCreate<T = any>(
  collection: string,
  items: T[]
): Promise<(T & BaseRecord)[]>

async bulkUpdate<T = any>(
  collection: string,
  updates: Array<{ id: string; changes: Partial<T> }>
): Promise<(T & BaseRecord)[]>

async bulkDelete(
  collection: string,
  recordIds: string[]
): Promise<{ deleted: string[]; failed: string[] }>

// Aggregation
async aggregate<T = any>(
  collection: string,
  query: AggregationQuery
): Promise<AggregationResult<T>>
```

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
async list(params?: AuditLogListParams): Promise<AuditLogListResponse>
async get(logId: string): Promise<AuditLogEntry>
async export(params: AuditLogExportRequest): Promise<AuditLogExport>
async getExport(exportId: string): Promise<AuditLogExport>
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
