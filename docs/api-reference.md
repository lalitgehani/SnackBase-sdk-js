# API Reference

Complete API reference for the SnackBase SDK.

## Contents

- [SnackBaseClient](#snackbaseclient)
- [Configuration](#configuration)
- [Services](#services)
  - [AuthService](#authservice)
  - [UserService](#userservice)
  - [AccountService](#accountservice)
  - [CollectionService](#collectionservice)
  - [RecordService](#recordservice)
  - [RealTimeService](#realtimeservice)
  - [FileService](#fileservice)
  - [ApiKeyService](#apikeyservice)
  - [AuditLogService](#auditlogservice)
  - [AdminService](#adminservice)
  - [CollectionRuleService](#collectionruleservice)
  - [DashboardService](#dashboardservice)
  - [EmailTemplateService](#emailtemplateservice)
  - [GroupsService](#groupsservice)
  - [InvitationService](#invitationservice)
  - [MacroService](#macroservice)
  - [MigrationService](#migrationservice)
  - [RoleService](#roleservice)
- [QueryBuilder](#querybuilder)
- [Types](#types)
- [Error Handling](#error-handling)

---

## SnackBaseClient

The main entry point for interacting with SnackBase.

### Constructor

```typescript
new SnackBaseClient(config: SnackBaseConfig)
```

Creates a new SnackBase client instance.

**Parameters:**

| Parameter                          | Type                                     | Required | Description                                           |
| ---------------------------------- | ---------------------------------------- | -------- | ----------------------------------------------------- |
| `config.baseUrl`                   | `string`                                 | Yes      | Your SnackBase project URL                            |
| `config.apiKey`                    | `string`                                 | No       | API key for server-to-server authentication           |
| `config.storageBackend`            | `Storage`                                | No       | Custom storage backend (defaults to auto-detected)    |
| `config.timeout`                   | `number`                                 | No       | Request timeout in milliseconds (default: 30000)      |
| `config.maxRetries`                | `number`                                 | No       | Maximum number of retries (default: 3)                |
| `config.retryDelay`                | `number`                                 | No       | Initial retry delay in milliseconds (default: 1000)   |
| `config.enableLogging`             | `boolean`                                | No       | Enable debug logging (default: false)                 |
| `config.logLevel`                  | `'debug' \| 'info' \| 'warn' \| 'error'` | No       | Log level (default: 'error')                          |
| `config.defaultAccount`            | `string`                                 | No       | Default account ID for multi-account projects         |
| `config.refreshBeforeExpiry`       | `number`                                 | No       | Seconds before expiry to refresh token (default: 300) |
| `config.maxRealTimeRetries`        | `number`                                 | No       | Max real-time reconnection attempts (default: 5)      |
| `config.realTimeReconnectionDelay` | `number`                                 | No       | Real-time reconnection delay (default: 1000)          |

**Example:**

```typescript
const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key",
  enableLogging: true,
  logLevel: "debug",
});
```

### Properties

#### `user`

```typescript
get user(): User | null
```

Returns the currently authenticated user, or `null` if not authenticated.

#### `account`

```typescript
get account(): Account | null
```

Returns the current account, or `null` if not set.

#### `isAuthenticated`

```typescript
get isAuthenticated(): boolean
```

Returns `true` if the client is currently authenticated.

### Methods

#### `getConfig()`

```typescript
getConfig(): Required<SnackBaseConfig>
```

Returns a copy of the current client configuration.

#### `on(event, listener)`

```typescript
on<K extends keyof AuthEvents>(event: K, listener: AuthEvents[K]): () => void
```

Subscribe to authentication events. Returns an unsubscribe function.

**Events:** `'auth:login'`, `'auth:logout'`, `'auth:refresh'`, `'auth:error'`

**Example:**

```typescript
const unsubscribe = client.on("auth:login", (state) => {
  console.log("Logged in:", state.user);
});

// Later: unsubscribe();
```

---

## Configuration

### SnackBaseConfig

```typescript
interface SnackBaseConfig {
  baseUrl: string;
  apiKey?: string;
  storageBackend?: Storage;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
  defaultAccount?: string;
  refreshBeforeExpiry?: number;
  maxRealTimeRetries?: number;
  realTimeReconnectionDelay?: number;
}
```

### Storage

Storage backend interface for persisting authentication state.

```typescript
interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

Built-in implementations:

- `MemoryStorage` - In-memory storage (default for Node.js)
- `LocalStorageBackend` - Browser localStorage
- `SessionStorageBackend` - Browser sessionStorage

---

## Services

### AuthService

Handles authentication, user registration, and password management.

Accessed via `client.auth`.

#### Methods

##### `login(credentials)`

```typescript
async login(credentials: LoginCredentials): Promise<AuthState>
```

Authenticate a user with email and password.

**Parameters:**

```typescript
interface LoginCredentials {
  email: string;
  password: string;
  account?: string; // Optional account ID for multi-account projects
}
```

**Returns:** `AuthState` - Updated authentication state

##### `logout()`

```typescript
async logout(): Promise<void>
```

Log out the current user and clear authentication state.

##### `register(data)`

```typescript
async register(data: RegisterData): Promise<AuthState>
```

Register a new user and account.

**Parameters:**

```typescript
interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
  account?: string; // Account ID for joining existing account
}
```

**Returns:** `AuthState` - Updated authentication state

##### `refreshToken()`

```typescript
async refreshToken(): Promise<AuthState>
```

Refresh the access token using the stored refresh token.

##### `getCurrentUser()`

```typescript
async getCurrentUser(): Promise<User>
```

Get the current authenticated user's profile.

##### `updateProfile(data)`

```typescript
async updateProfile(data: UserUpdate): Promise<User>
```

Update the current user's profile.

##### `changePassword(data)`

```typescript
async changePassword(data: ChangePasswordData): Promise<void>
```

Change the current user's password.

**Parameters:**

```typescript
interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}
```

##### `forgotPassword(data)`

```typescript
async forgotPassword(data: PasswordResetRequest): Promise<void>
```

Initiate password reset flow. Sends an email with reset token.

**Parameters:**

```typescript
interface PasswordResetRequest {
  email: string;
}
```

##### `resetPassword(data)`

```typescript
async resetPassword(data: PasswordResetConfirm): Promise<void>
```

Reset password using a token from the email.

**Parameters:**

```typescript
interface PasswordResetConfirm {
  token: string;
  password: string;
  passwordConfirm: string;
}
```

##### `verifyEmail(token)`

```typescript
async verifyEmail(token: string): Promise<void>
```

Verify user's email address using a token.

##### `resendVerificationEmail()`

```typescript
async resendVerificationEmail(): Promise<void>
```

Resend the verification email to the current user.

##### `authenticateWithOAuth(data)`

```typescript
async authenticateWithOAuth(data: OAuthData): Promise<AuthState>
```

Authenticate using an OAuth provider.

**Parameters:**

```typescript
interface OAuthData {
  provider: "google" | "github" | "facebook" | string;
  code: string;
  codeVerifier?: string;
  redirectUrl: string;
  account?: string;
}
```

##### `getSAMLUrl(provider, account, relayState?)`

```typescript
async getSAMLUrl(provider: SAMLProvider, account: string, relayState?: string): Promise<SAMLUrlResponse>
```

Generate a SAML SSO authorization URL.

##### `handleSAMLCallback(params)`

```typescript
async handleSAMLCallback(params: SAMLCallbackParams): Promise<AuthState>
```

Handle the SAML callback after authentication.

---

### UserService

Manage user accounts.

Accessed via `client.users`.

#### Methods

##### `list(params?)`

```typescript
async list(params?: UserListParams): Promise<UserListResponse>
```

List users with pagination and filtering.

**Parameters:**

```typescript
interface UserListParams {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  search?: string;
}
```

**Returns:**

```typescript
interface UserListResponse {
  items: User[];
  totalItems: number;
  page: number;
  perPage: number;
  totalPages: number;
}
```

##### `get(userId)`

```typescript
async get(userId: string): Promise<User>
```

Get a user by ID.

##### `create(data)`

```typescript
async create(data: UserCreate): Promise<User>
```

Create a new user.

##### `update(userId, data)`

```typescript
async update(userId: string, data: UserUpdate): Promise<User>
```

Update a user.

##### `delete(userId)`

```typescript
async delete(userId: string): Promise<void>
```

Delete a user.

---

### CollectionService

Manage collections and their schemas.

Accessed via `client.collections`.

#### Methods

##### `list(params?)`

```typescript
async list(params?: CollectionListParams): Promise<CollectionListResponse>
```

List all collections.

##### `get(collectionIdOrName)`

```typescript
async get(collectionIdOrName: string): Promise<Collection>
```

Get a collection by ID or name.

##### `create(data)`

```typescript
async create(data: CollectionCreate): Promise<Collection>
```

Create a new collection.

**Parameters:**

```typescript
interface CollectionCreate {
  name: string;
  schema: RecordSchema;
  description?: string;
  listRule?: string;
  viewRule?: string;
  createRule?: string;
  updateRule?: string;
  deleteRule?: string;
}
```

##### `update(collectionId, data)`

```typescript
async update(collectionId: string, data: CollectionUpdate): Promise<Collection>
```

Update a collection.

##### `delete(collectionId)`

```typescript
async delete(collectionId: string): Promise<void>
```

Delete a collection.

---

### RecordService

Perform CRUD operations on dynamic collections.

Accessed via `client.records`.

#### Methods

##### `list<T>(collection, params?)`

```typescript
async list<T = any>(collection: string, params?: RecordListParams): Promise<RecordListResponse<T>>
```

List records from a collection.

**Parameters:**

```typescript
interface RecordListParams {
  page?: number;
  perPage?: number;
  skip?: number;
  limit?: number;
  sort?: string;
  filter?: string | Record<string, any>;
  fields?: string[];
  expand?: string[];
}
```

##### `get<T>(collection, recordId)`

```typescript
async get<T = any>(collection: string, recordId: string): Promise<T & BaseRecord>
```

Get a single record by ID.

##### `create(collection, data)`

```typescript
async create(collection: string, data: Record<string, any>): Promise<Record>
```

Create a new record.

##### `update(collection, recordId, data)`

```typescript
async update(collection: string, recordId: string, data: Record<string, any>): Promise<Record>
```

Update a record (partial update using PATCH).

##### `replace(collection, recordId, data)`

```typescript
async replace(collection: string, recordId: string, data: Record<string, any>): Promise<Record>
```

Replace a record (full replacement using PUT).

##### `delete(collection, recordId)`

```typescript
async delete(collection: string, recordId: string): Promise<void>
```

Delete a record.

---

### RealTimeService

Manage real-time subscriptions using WebSocket or SSE.

Accessed via `client.realtime`.

#### Methods

##### `subscribe(collection, handler)`

```typescript
subscribe(collection: string, handler: RealTimeEventHandler): () => void
```

Subscribe to all events on a collection.

**Parameters:**

```typescript
type RealTimeEventHandler = (event: RealTimeEvent) => void;

interface RealTimeEvent {
  action: "create" | "update" | "delete";
  record: Record<string, any>;
  collection: string;
}
```

**Returns:** Unsubscribe function

##### `subscribe(collection, options, handler)`

```typescript
subscribe(collection: string, options: RealTimeSubscriptionOptions, handler: RealTimeEventHandler): () => void
```

Subscribe to filtered events on a collection.

**Parameters:**

```typescript
interface RealTimeSubscriptionOptions {
  filter?: string;
  expand?: string[];
}
```

##### `subscribeByQuery(query, handler)`

```typescript
subscribeByQuery(query: QueryBuilder, handler: RealTimeEventHandler): () => void
```

Subscribe to events matching a query builder query.

##### `connect()`

```typescript
async connect(): Promise<void>
```

Manually connect to the real-time service.

##### `disconnect()`

```typescript
async disconnect(): Promise<void>
```

Disconnect from the real-time service.

##### `isConnected`

```typescript
get isConnected(): boolean
```

Returns `true` if connected to the real-time service.

---

### FileService

Manage file uploads and downloads.

Accessed via `client.files`.

#### Methods

##### `upload(file, options?)`

```typescript
async upload(file: File | Blob | Buffer, options?: FileUploadOptions): Promise<FileRecord>
```

Upload a file.

**Parameters:**

```typescript
interface FileUploadOptions {
  collection?: string;
  record?: string;
  field?: string;
}
```

##### `getUrl(token)`

```typescript
getUrl(token: string): string
```

Get the URL for downloading a file by token.

##### `download(token)`

```typescript
async download(token: string): Promise<Blob>
```

Download a file by token.

---

### AccountService

Manage accounts in multi-account projects.

Accessed via `client.accounts`.

#### Methods

##### `list(params?)`

```typescript
async list(params?: AccountListParams): Promise<AccountListResponse>
```

List all accounts with pagination and filtering.

**Parameters:**

```typescript
interface AccountListParams {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  search?: string;
}
```

**Returns:**

```typescript
interface AccountListResponse {
  items: Account[];
  totalItems: number;
  page: number;
  perPage: number;
  totalPages: number;
}
```

##### `get(accountId)`

```typescript
async get(accountId: string): Promise<Account>
```

Get details for a specific account.

##### `create(data)`

```typescript
async create(data: AccountCreate): Promise<Account>
```

Create a new account.

##### `update(accountId, data)`

```typescript
async update(accountId: string, data: AccountUpdate): Promise<Account>
```

Update an account.

##### `delete(accountId)`

```typescript
async delete(accountId: string): Promise<{ success: boolean }>
```

Delete an account and all its associated data.

##### `getUsers(accountId, params?)`

```typescript
async getUsers(accountId: string, params?: AccountUserListParams): Promise<UserListResponse>
```

Get all users belonging to a specific account.

---

### ApiKeyService

Manage API keys for service-to-service authentication.

Accessed via `client.apiKeys`.

#### Methods

##### `list()`

```typescript
async list(): Promise<ApiKey[]>
```

List all API keys for the current user. Keys are masked except for the last 4 characters.

##### `get(keyId)`

```typescript
async get(keyId: string): Promise<ApiKey>
```

Get details for a specific API key. The key itself is masked.

##### `create(data)`

```typescript
async create(data: ApiKeyCreate): Promise<ApiKey>
```

Create a new API key. The response includes the full key, which is shown only once.

##### `revoke(keyId)`

```typescript
async revoke(keyId: string): Promise<{ success: boolean }>
```

Revoke an existing API key. Once revoked, the key can no longer be used.

---

### AuditLogService

Manage audit logs for compliance and security tracking.

Accessed via `client.auditLogs`.

#### Methods

##### `list(params?)`

```typescript
async list(params?: AuditLogFilters): Promise<AuditLogListResponse>
```

List audit logs with optional filtering, pagination, and sorting.

**Parameters:**

```typescript
interface AuditLogFilters {
  account_id?: string;
  table_name?: string;
  record_id?: string;
  user_id?: string;
  operation?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  skip?: number;
  limit?: number;
  sort?: string;
}
```

**Returns:**

```typescript
interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  audit_logging_enabled: boolean;
}
```

##### `get(logId)`

```typescript
async get(logId: string): Promise<AuditLog>
```

Retrieve a single audit log entry by ID.

##### `export(params?, format?)`

```typescript
async export(params?: AuditLogFilters, format: AuditLogExportFormat = 'json'): Promise<string>
```

Export audit logs in the specified format (JSON, CSV, or PDF).

**Parameters:**
- `params` - Optional filters (account_id, table_name, operation, date range, etc.)
- `format` - Export format: `'json'`, `'csv'`, or `'pdf'` (default: `'json'`)

**Returns:** Exported data as string (base64-encoded for PDF format)

**Example:**

```typescript
// Export as JSON
const jsonData = await client.auditLogs.export({ table_name: 'users' }, 'json');

// Export as CSV
const csvData = await client.auditLogs.export({ table_name: 'users' }, 'csv');

// Export as PDF (returns base64-encoded PDF)
const pdfBase64 = await client.auditLogs.export({ table_name: 'users' }, 'pdf');
```

---

### AdminService

Manage system administration and configuration.

Accessed via `client.admin`. Requires superadmin authentication.

#### Methods

##### `getConfigurationStats()`

```typescript
async getConfigurationStats(): Promise<ConfigurationStats>
```

Returns configuration statistics by category.

##### `getRecentConfigurations(limit?)`

```typescript
async getRecentConfigurations(limit: number = 10): Promise<RecentConfiguration[]>
```

Returns recently modified configurations.

##### `listSystemConfigurations(category?)`

```typescript
async listSystemConfigurations(category?: string): Promise<Configuration[]>
```

Returns all system-level configurations.

##### `listAccountConfigurations(accountId, category?)`

```typescript
async listAccountConfigurations(accountId: string, category?: string): Promise<Configuration[]>
```

Returns configurations for a specific account.

##### `getConfigurationValues(configId)`

```typescript
async getConfigurationValues(configId: string): Promise<Record<string, any>>
```

Returns decrypted configuration values with secrets masked.

##### `updateConfigurationValues(configId, values)`

```typescript
async updateConfigurationValues(configId: string, values: Record<string, any>): Promise<Record<string, any>>
```

Updates configuration values.

##### `updateConfigurationStatus(configId, enabled)`

```typescript
async updateConfigurationStatus(configId: string, enabled: boolean): Promise<Configuration>
```

Enables or disables a configuration.

##### `createConfiguration(data)`

```typescript
async createConfiguration(data: ConfigurationCreate): Promise<Configuration>
```

Creates a new configuration record.

##### `deleteConfiguration(configId)`

```typescript
async deleteConfiguration(configId: string): Promise<{ success: boolean }>
```

Deletes a configuration.

##### `listProviders(category?)`

```typescript
async listProviders(category?: string): Promise<ProviderDefinition[]>
```

Lists all available provider definitions.

##### `getProviderSchema(category, providerName)`

```typescript
async getProviderSchema(category: string, providerName: string): Promise<Record<string, any>>
```

Returns the JSON schema for provider configuration.

##### `testConnection(category, providerName, config)`

```typescript
async testConnection(category: string, providerName: string, config: Record<string, any>): Promise<ConnectionTestResult>
```

Tests a provider connection.

---

### CollectionRuleService

Manage collection-level access rules and field permissions.

Accessed via `client.collectionRules`. Requires superadmin authentication.

#### Methods

##### `get(collectionName)`

```typescript
async get(collectionName: string): Promise<CollectionRule>
```

Get access rules and field permissions for a specific collection.

##### `update(collectionName, data)`

```typescript
async update(collectionName: string, data: CollectionRuleUpdate): Promise<CollectionRule>
```

Update access rules and field permissions for a specific collection.

##### `validateRule(rule, operation, collectionFields)`

```typescript
async validateRule(rule: string, operation: 'list' | 'view' | 'create' | 'update' | 'delete', collectionFields: string[]): Promise<RuleValidationResult>
```

Validate a rule expression against a collection schema.

##### `testRule(rule, context)`

```typescript
async testRule(rule: string, context: any): Promise<RuleTestResult>
```

Test a rule evaluation with a sample context.

---

### DashboardService

Retrieve dashboard statistics and metrics for monitoring.

Accessed via `client.dashboard`. Requires superadmin authentication.

#### Methods

##### `getStats()`

```typescript
async getStats(): Promise<DashboardStats>
```

Retrieves dashboard statistics including counts for accounts, users, collections, and records, as well as recent activity and health metrics.

**Returns:**

```typescript
interface DashboardStats {
  accounts: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    verified: number;
    active: number;
  };
  collections: {
    total: number;
    system: number;
    userCreated: number;
  };
  records: {
    total: number;
  };
  recentActivity: Array<{
    timestamp: string;
    type: string;
    description: string;
  }>;
  health: {
    database: 'healthy' | 'degraded' | 'down';
    cache: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
  };
}
```

---

### EmailTemplateService

Manage email templates and view email logs.

Accessed via `client.emailTemplates`. Requires superadmin authentication.

#### Methods

##### `list(filters?)`

```typescript
async list(filters?: EmailTemplateFilters): Promise<EmailTemplate[]>
```

Returns a list of email templates.

##### `get(templateId)`

```typescript
async get(templateId: string): Promise<EmailTemplate>
```

Returns email template details.

##### `update(templateId, data)`

```typescript
async update(templateId: string, data: EmailTemplateUpdate): Promise<EmailTemplate>
```

Updates an email template.

##### `render(request)`

```typescript
async render(request: EmailTemplateRenderRequest): Promise<EmailTemplateRenderResponse>
```

Renders an email template with provided variables.

##### `sendTest(templateId, recipientEmail, variables?, provider?)`

```typescript
async sendTest(templateId: string, recipientEmail: string, variables?: Record<string, any>, provider?: string): Promise<{ success: boolean }>
```

Sends a test email using the specified template.

##### `listLogs(filters?)`

```typescript
async listLogs(filters?: EmailLogFilters): Promise<EmailLogListResponse>
```

Returns a paginated list of email logs.

##### `getLog(logId)`

```typescript
async getLog(logId: string): Promise<EmailLog>
```

Returns single email log details.

---

### GroupsService

Manage user groups within an account.

Accessed via `client.groups`.

#### Methods

##### `list(params?)`

```typescript
async list(params?: GroupListParams): Promise<GroupListResponse>
```

List all groups in the current account.

##### `get(groupId)`

```typescript
async get(groupId: string): Promise<Group>
```

Get details for a specific group.

##### `create(data)`

```typescript
async create(data: GroupCreate): Promise<Group>
```

Create a new group in the current account.

##### `update(groupId, data)`

```typescript
async update(groupId: string, data: GroupUpdate): Promise<Group>
```

Update a group's name or description.

##### `delete(groupId)`

```typescript
async delete(groupId: string): Promise<{ success: boolean }>
```

Delete a group.

##### `addMember(groupId, userId)`

```typescript
async addMember(groupId: string, userId: string): Promise<{ success: boolean }>
```

Add a user to a group.

##### `removeMember(groupId, userId)`

```typescript
async removeMember(groupId: string, userId: string): Promise<{ success: boolean }>
```

Remove a user from a group.

---

### InvitationService

Manage user invitations for account access.

Accessed via `client.invitations`.

#### Methods

##### `list(params?)`

```typescript
async list(params?: InvitationListParams): Promise<Invitation[]>
```

List all invitations in the current account.

##### `create(data)`

```typescript
async create(data: InvitationCreate): Promise<Invitation>
```

Create a new invitation for a user.

##### `resend(invitationId)`

```typescript
async resend(invitationId: string): Promise<{ success: boolean }>
```

Resend an invitation email.

##### `getPublic(token)`

```typescript
async getPublic(token: string): Promise<Invitation>
```

Get public details of an invitation using a token. No authentication required.

##### `accept(token, password)`

```typescript
async accept(token: string, password: string): Promise<AuthResponse>
```

Accept an invitation using a token and password. Creates the user account and returns authentication tokens.

##### `cancel(invitationId)`

```typescript
async cancel(invitationId: string): Promise<{ success: boolean }>
```

Cancel a pending invitation.

---

### MacroService

Manage SQL macros for use in permission rules.

Accessed via `client.macros`. Requires superadmin authentication for most operations.

#### Methods

##### `list()`

```typescript
async list(): Promise<MacroListResponse>
```

List all macros, including built-in ones.

##### `get(macroId)`

```typescript
async get(macroId: string): Promise<Macro>
```

Get details for a specific macro.

##### `create(data)`

```typescript
async create(data: MacroCreate): Promise<Macro>
```

Create a new custom macro.

##### `update(macroId, data)`

```typescript
async update(macroId: string, data: MacroUpdate): Promise<Macro>
```

Update an existing custom macro. Built-in macros cannot be updated.

##### `delete(macroId)`

```typescript
async delete(macroId: string): Promise<{ success: boolean }>
```

Delete a macro. Fails if the macro is built-in or currently in use.

##### `test(macroId, params)`

```typescript
async test(macroId: string, params: Record<string, any>): Promise<MacroTestResult>
```

Test a macro with parameters.

---

### MigrationService

View migration status and history.

Accessed via `client.migrations`. Requires superadmin authentication.

#### Methods

##### `list()`

```typescript
async list(): Promise<MigrationListResponse>
```

List all Alembic migration revisions. Returns all migrations with their application status.

##### `getCurrent()`

```typescript
async getCurrent(): Promise<CurrentRevisionResponse | null>
```

Get the current database revision. Returns the currently applied migration, or `null` if no migration has been applied.

##### `getHistory()`

```typescript
async getHistory(): Promise<MigrationHistoryResponse>
```

Get full migration history. Returns all applied migrations in chronological order.

---

### RoleService

Manage roles and their permissions.

Accessed via `client.roles`. Requires superadmin authentication.

#### Methods

##### `list()`

```typescript
async list(): Promise<RoleListResponse>
```

List all roles with pagination.

##### `get(roleId)`

```typescript
async get(roleId: string): Promise<Role>
```

Get details for a specific role.

##### `create(data)`

```typescript
async create(data: RoleCreate): Promise<Role>
```

Create a new role.

##### `update(roleId, data)`

```typescript
async update(roleId: string, data: RoleUpdate): Promise<Role>
```

Update an existing role.

##### `delete(roleId)`

```typescript
async delete(roleId: string): Promise<{ success: boolean }>
```

Delete a role. Fails if the role is currently in use.

---

## QueryBuilder

Build complex queries with a fluent API.

Accessed via `client.query(collection)`.

### Methods

#### `select(...fields)`

```typescript
select(...fields: string[]): QueryBuilder
```

Select specific fields to return.

#### `expand(...relations)`

```typescript
expand(...relations: string[]): QueryBuilder
```

Expand relation fields.

#### `filter(field, operator, value)`

```typescript
filter(field: string, operator: FilterOperator, value: any): QueryBuilder
```

Add a filter condition.

**Operators:** `'='`, `'!='`, `'>'`, `'<'`, `'>='`, `'<='`, `'~'` (regex)

#### `sort(field, direction?)`

```typescript
sort(field: string, direction?: SortDirection): QueryBuilder
```

Sort results. Direction: `'asc'` or `'desc'` (default).

#### `page(page)`

```typescript
page(page: number): QueryBuilder
```

Set the page number (1-indexed).

#### `perPage(perPage)`

```typescript
perPage(perPage: number): QueryBuilder
```

Set the number of items per page.

#### `skip(count)`

```typescript
skip(count: number): QueryBuilder
```

Skip the first N results.

#### `limit(count)`

```typescript
limit(count: number): QueryBuilder
```

Limit the number of results.

#### `first()`

```typescript
async first<T = any>(): Promise<T | null>
```

Execute the query and return the first result, or `null` if none found.

#### `execute<T>()`

```typescript
async execute<T = any>(): Promise<RecordListResponse<T>>
```

Execute the query and return the results.

**Example:**

```typescript
const results = await client
  .query("posts")
  .select("id", "title", "author.name")
  .expand("author", "comments")
  .filter("status", "=", "published")
  .filter("views", ">", 100)
  .sort("createdAt", "desc")
  .page(1)
  .perPage(20)
  .execute<Post>();
```

---

## Types

### User

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  verified: boolean;
  emailVisibility?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Account

```typescript
interface Account {
  id: string;
  name: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Collection

```typescript
interface Collection {
  id: string;
  name: string;
  schema: RecordSchema;
  description?: string;
  listRule?: string;
  viewRule?: string;
  createRule?: string;
  updateRule?: string;
  deleteRule?: string;
  createdAt: string;
  updatedAt: string;
}
```

### BaseRecord

```typescript
interface BaseRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
}
```

### AuthState

```typescript
interface AuthState {
  user: User;
  account: Account;
  token: string;
  refreshToken: string;
  isAuthenticated: boolean;
  expiresAt: number;
}
```

---

## Error Handling

All errors extend from `SnackBaseError`.

### Error Types

| Error Class           | Status Code | Description                            |
| --------------------- | ----------- | -------------------------------------- |
| `AuthenticationError` | 401         | Authentication failed                  |
| `AuthorizationError`  | 403         | Not authorized for this resource       |
| `NotFoundError`       | 404         | Resource not found                     |
| `ConflictError`       | 409         | Resource conflict (e.g., duplicate)    |
| `ValidationError`     | 422         | Validation failed with `fields` object |
| `RateLimitError`      | 429         | Rate limited with `retryAfter`         |
| `NetworkError`        | -           | Network connection failed              |
| `TimeoutError`        | -           | Request timeout                        |
| `ServerError`         | 500+        | Server error                           |

### ValidationError Fields

```typescript
interface ValidationError {
  fields: Record<string, string>;
}
```

### RateLimitError Properties

```typescript
interface RateLimitError {
  retryAfter: number; // Seconds to wait before retrying
}
```

### Example

```typescript
try {
  await client.records.create("posts", data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.fields);
  } else if (error instanceof AuthenticationError) {
    console.error("Authentication required");
  } else if (error instanceof RateLimitError) {
    setTimeout(() => retry(), error.retryAfter * 1000);
  }
}
```
