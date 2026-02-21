Complete reference for all services available in the SnackBase SDK.

## Table of Contents

- [Service Overview](#service-overview)
- [UserService](#userservice)
- [AccountService](#accountservice)
- [AuditLogService](#auditlogservice)
- [PermissionService](#permissionservice)
- [HTTP Client Reference](#http-client-reference)

## Service Overview

| Service           | Accessor             | Dedicated Reference                    |
| ----------------- | -------------------- | -------------------------------------- |
| AuthService       | `client.auth`        | [authentication.md](authentication.md) |
| UserService       | `client.users`       | below                                  |
| AccountService    | `client.accounts`    | below                                  |
| CollectionService | `client.collections` | [collections.md](collections.md)       |
| RecordService     | `client.records`     | [records.md](records.md)               |
| FileService       | `client.files`       | [files.md](files.md)                   |
| WebhookService    | `client.webhooks`    | [webhooks.md](webhooks.md)             |
| AuditLogService   | `client.auditLogs`   | below                                  |
| PermissionService | `client.permissions` | below                                  |
| AdminService      | `client.admin`       | [admin.md](admin.md)                   |

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

## AdminService

See [admin.md](admin.md) for full reference.

```typescript
// Configuration listings
async getConfigurationStats(): Promise<ConfigurationStats>
async getRecentConfigurations(limit?: number): Promise<RecentConfiguration[]>
async listSystemConfigurations(category?: string): Promise<Configuration[]>
async listAccountConfigurations(accountId: string, category?: string): Promise<Configuration[]>

// Configuration values
async getConfigurationValues(configId: string): Promise<Record<string, any>>
async updateConfigurationValues(configId: string, values: Record<string, any>): Promise<Record<string, any>>

// Configuration lifecycle
async createConfiguration(data: ConfigurationCreate): Promise<Configuration>
async deleteConfiguration(configId: string): Promise<{ success: boolean }>
async updateConfigurationStatus(configId: string, enabled: boolean): Promise<UpdateConfigurationStatusResult>

// Default provider management (v0.6.0+)
async setConfigurationDefault(configId: string): Promise<SetDefaultResult>
async unsetConfigurationDefault(configId: string): Promise<UnsetDefaultResult>

// Providers
async listProviders(category?: string): Promise<ProviderDefinition[]>
async getProviderSchema(category: string, providerName: string): Promise<Record<string, any>>
async testConnection(category: string, providerName: string, config: Record<string, any>): Promise<ConnectionTestResult>
```

## HTTP Client Reference

The `HttpClient` class is the foundation for all service communication:

```typescript
class HttpClient {
  // Request methods
  async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
  async post<T>(
    url: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;
  async patch<T>(
    url: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;
  async put<T>(
    url: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;
  async delete<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
  addErrorInterceptor(interceptor: ErrorInterceptor): void;

  // Configuration
  setBaseUrl(baseUrl: string): void;
  setToken(token: string | null): void;
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
