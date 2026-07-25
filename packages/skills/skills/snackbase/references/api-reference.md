Complete reference for services available in `@snackbase/sdk` ≥ 0.6.0.

There is **no** `PermissionService` / `client.permissions`. Use `client.collectionRules`.

## Table of Contents

- [Service Overview](#service-overview)
- [UserService](#userservice)
- [AccountService](#accountservice)
- [AuditLogService](#auditlogservice)
- [CollectionRuleService](#collectionruleservice)
- [HookService](#hookservice)
- [EndpointService](#endpointservice)
- [WorkflowService](#workflowservice)
- [JobService](#jobservice)
- [DashboardService](#dashboardservice)
- [Groups / Invitations / Roles](#groups--invitations--roles)
- [Macros / EmailTemplates / Migrations / ApiKeys](#macros--emailtemplates--migrations--apikeys)
- [Realtime / Files / Webhooks / Records / Collections](#realtime--files--webhooks--records--collections)
- [AdminService](#adminservice)
- [HTTP Client Reference](#http-client-reference)

## Service Overview

| Service | Accessor | Dedicated Reference |
| ------- | -------- | ------------------- |
| AuthService | `client.auth` | [authentication.md](authentication.md) |
| UserService | `client.users` | below |
| AccountService | `client.accounts` | below |
| CollectionService | `client.collections` | [collections.md](collections.md) |
| RecordService | `client.records` | [records.md](records.md) |
| FileService | `client.files` | [files.md](files.md) |
| WebhookService | `client.webhooks` | [webhooks.md](webhooks.md) |
| HookService | `client.hooks` | [hooks.md](hooks.md) |
| EndpointService | `client.endpoints` | [endpoints.md](endpoints.md) |
| WorkflowService | `client.workflows` | [workflows.md](workflows.md) |
| JobService | `client.jobs` | [jobs.md](jobs.md) |
| CodelistService | `client.codelists` | [codelists.md](codelists.md) |
| DashboardService | `client.dashboard` | [dashboard.md](dashboard.md) |
| RealTimeService | `client.realtime` | [realtime.md](realtime.md) |
| GroupsService | `client.groups` | [access-control.md](access-control.md) |
| InvitationService | `client.invitations` | [access-control.md](access-control.md) |
| RoleService | `client.roles` | [access-control.md](access-control.md) |
| CollectionRuleService | `client.collectionRules` | [access-control.md](access-control.md) |
| MacroService | `client.macros` | [platform.md](platform.md) |
| EmailTemplateService | `client.emailTemplates` | [platform.md](platform.md) |
| MigrationService | `client.migrations` | [platform.md](platform.md) |
| ApiKeyService | `client.apiKeys` | [platform.md](platform.md) |
| AuditLogService | `client.auditLogs` | below |
| AdminService | `client.admin` | [admin.md](admin.md) |

## UserService

```typescript
async list(params?: UserListParams): Promise<UserListResponse>
async get(userId: string): Promise<User>
async create(data: UserCreate): Promise<User>
async update(userId: string, data: UserUpdate): Promise<User>
async delete(userId: string): Promise<{ success: boolean }>
```

`getCurrentUser()` lives on `AuthService` / session helpers on the client.

## AccountService

```typescript
async list(params?: AccountListParams): Promise<AccountListResponse>
async get(accountId: string): Promise<Account>
async create(data: AccountCreate): Promise<Account>
async update(accountId: string, data: AccountUpdate): Promise<Account>
async delete(accountId: string): Promise<{ success: boolean }>
async getUsers(accountId: string, params?: AccountUserListParams): Promise<UserListResponse>
```

## AuditLogService

```typescript
async list(params?: AuditLogFilters): Promise<AuditLogListResponse>
async get(logId: string): Promise<AuditLog>
async export(params?: AuditLogFilters, format?: AuditLogExportFormat): Promise<string>
```

Export formats: `'json'` (default), `'csv'`, `'pdf'`.

## CollectionRuleService

```typescript
async get(collectionName: string): Promise<CollectionRule>
async update(collectionName: string, data: CollectionRuleUpdate): Promise<CollectionRule>
async validateRule(rule: string, operation: 'list'|'view'|'create'|'update'|'delete', collectionFields: string[]): Promise<RuleValidationResult>
async testRule(rule: string, context: any): Promise<RuleTestResult>
```

See [access-control.md](access-control.md).

## HookService

```typescript
async list(params?: { trigger_type?: 'schedule'|'event'|'manual'; enabled?: boolean; limit?: number; offset?: number }): Promise<HookListResponse>
async get(id: string): Promise<Hook>
async create(data: HookCreate): Promise<Hook>
async update(id: string, data: HookUpdate): Promise<Hook>
async delete(id: string): Promise<{ success: boolean }>
async toggle(id: string): Promise<Hook>
async trigger(id: string): Promise<{ queued: boolean }>
async listExecutions(id: string, params?: { limit?: number; offset?: number }): Promise<HookExecutionListResponse>
```

See [hooks.md](hooks.md).

## EndpointService

```typescript
async list(params?: { method?: string; enabled?: boolean; limit?: number; offset?: number }): Promise<EndpointListResponse>
async get(id: string): Promise<Endpoint>
async create(data: EndpointCreate): Promise<Endpoint>
async update(id: string, data: EndpointUpdate): Promise<Endpoint>
async delete(id: string): Promise<{ success: boolean }>
async toggle(id: string): Promise<Endpoint>
async listExecutions(id: string, params?: { limit?: number; offset?: number }): Promise<EndpointExecutionListResponse>
```

Dispatch: raw HTTP `GET|POST|... /api/v1/x/{account_slug}/{path}`. See [endpoints.md](endpoints.md).

## WorkflowService

```typescript
async list(params?: { trigger_type?: string; enabled?: boolean; limit?: number; offset?: number }): Promise<WorkflowListResponse>
async get(id: string): Promise<Workflow>
async create(data: WorkflowCreate): Promise<Workflow>
async update(id: string, data: WorkflowUpdate): Promise<Workflow>
async delete(id: string): Promise<{ success: boolean }>
async toggle(id: string): Promise<Workflow> // PATCH .../workflows/{id}/toggle
async trigger(id: string, input?: Record<string, unknown>): Promise<WorkflowTriggerResponse>
async listInstances(id: string, params?: { status?: string; limit?: number; offset?: number }): Promise<WorkflowInstanceListResponse>
async getInstance(instanceId: string): Promise<WorkflowInstanceDetail>
async cancelInstance(instanceId: string): Promise<WorkflowInstance>
async resumeInstance(instanceId: string): Promise<WorkflowInstance> // POST .../resume
async retryInstance(instanceId: string): Promise<WorkflowInstance> // alias → resume
```

See [workflows.md](workflows.md).

## JobService

```typescript
async list(params?: { status?: string; queue?: string; handler?: string; limit?: number; offset?: number }): Promise<JobListResponse>
async stats(): Promise<JobStats>
async retry(id: string): Promise<Job> // dead | failed | retrying
async cancel(id: string): Promise<void> // DELETE pending only
```

Paths under `/api/v1/admin/jobs`. See [jobs.md](jobs.md).

## DashboardService

```typescript
async getStats(params?: { range?: '7d' | '30d' | '90d' }): Promise<DashboardStats>
```

See [dashboard.md](dashboard.md).

## Groups / Invitations / Roles

```typescript
// client.groups
async list(params?): Promise<Group[]>
async get(groupId): Promise<Group>
async create(data): Promise<Group>
async update(groupId, data): Promise<Group>
async delete(groupId): Promise<{ success: boolean }>
async addMember(groupId, userId): Promise<{ success: boolean }>
async removeMember(groupId, userId): Promise<{ success: boolean }>

// client.invitations
async list(params?): Promise<InvitationListResponse>
async create(data): Promise<Invitation>
async resend(invitationId): Promise<{ success: boolean }>
async getPublic(token): Promise<InvitationPublicDetails>
async accept(token, password): Promise<AuthResponse>
async cancel(invitationId): Promise<{ success: boolean }>

// client.roles
async list(): Promise<RoleListResponse>
async get(roleId): Promise<Role>
async create(data): Promise<Role>
async update(roleId, data): Promise<Role>
async delete(roleId): Promise<{ success: boolean }>
```

See [access-control.md](access-control.md).

## Macros / EmailTemplates / Migrations / ApiKeys

```typescript
// client.macros
async list(): Promise<MacroListResponse>
async get(macroId): Promise<Macro>
async create(data): Promise<Macro>
async update(macroId, data): Promise<Macro>
async delete(macroId): Promise<{ success: boolean }>
async test(macroId, params: string[]): Promise<MacroTestResult>

// client.emailTemplates
async list(filters?): Promise<EmailTemplate[]>
async get(templateId): Promise<EmailTemplate>
async update(templateId, data): Promise<EmailTemplate>
async render(request): Promise<EmailTemplateRenderResponse>
async sendTest(...): Promise<...>
async listLogs(filters?): Promise<EmailLogListResponse>
async getLog(logId): Promise<EmailLog>

// client.migrations
async list(): Promise<MigrationListResponse>
async getCurrent(): Promise<CurrentRevisionResponse | null>
async getHistory(): Promise<MigrationHistoryResponse>

// client.apiKeys — base path /api/v1/admin/api-keys
async list(params?: { limit?: number; offset?: number }): Promise<ApiKeyListResponse>
async get(keyId): Promise<ApiKey>
async create(data: { name: string; expires_at?: string }): Promise<ApiKey>
async revoke(keyId): Promise<void>
```

See [platform.md](platform.md).

## Realtime / Files / Webhooks / Records / Collections

See dedicated guides: [realtime.md](realtime.md), [files.md](files.md), [webhooks.md](webhooks.md), [records.md](records.md), [collections.md](collections.md).

Selected record methods:

```typescript
async list<T>(collection, params?): Promise<RecordListResponse<T>>
query<T>(collection): QueryBuilder<T>
async get<T>(collection, recordId, params?)
async create<T>(collection, data)
async update<T>(collection, recordId, data) // PUT
async patch<T>(collection, recordId, data)  // PATCH
async delete(collection, recordId)
async batchCreate(collection, records)
async batchUpdate(collection, items: { id: string; data: Record<string, any> }[])
async batchDelete(collection, ids: string[])
async aggregate(collection, { functions, group_by?, filter?, having? })
```

Selected webhook methods:

```typescript
async list(): Promise<WebhookListResponse>
async get(id): Promise<Webhook>
async create(data: WebhookCreate): Promise<WebhookCreateResponse>
async update(id, data): Promise<Webhook>
async delete(id): Promise<{ success: boolean }>
async test(id): Promise<WebhookTestResponse>
async listDeliveries(id, params?: { limit?: number; offset?: number }): Promise<WebhookDeliveryListResponse>
```

## AdminService

See [admin.md](admin.md).

```typescript
async getConfigurationStats(): Promise<ConfigurationStats>
async getRecentConfigurations(limit?: number): Promise<RecentConfiguration[]>
async listSystemConfigurations(category?: string): Promise<Configuration[]>
async listAccountConfigurations(accountId: string, category?: string): Promise<Configuration[]>
async getConfigurationValues(configId: string): Promise<Record<string, any>>
async updateConfigurationValues(configId: string, values: Record<string, any>): Promise<{ status: string }>
async createConfiguration(data: ConfigurationCreate): Promise<ConfigurationCreateResult>
async deleteConfiguration(configId: string): Promise<{ success: boolean }>
async updateConfigurationStatus(configId: string, enabled: boolean): Promise<UpdateConfigurationStatusResult>
async setConfigurationDefault(configId: string): Promise<SetDefaultResult>
async unsetConfigurationDefault(configId: string): Promise<UnsetDefaultResult>
async listProviders(category?: string): Promise<ProviderDefinition[]>
async getProviderSchema(category: string, providerName: string): Promise<Record<string, any>>
async testConnection(category: string, providerName: string, config: Record<string, any>): Promise<ConnectionTestResult>
```

## HTTP Client Reference

```typescript
class HttpClient {
  async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>>;
  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>>;
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>>;
  async delete<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
  addErrorInterceptor(interceptor: ErrorInterceptor): void;
}

interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  body?: any;
}
```
