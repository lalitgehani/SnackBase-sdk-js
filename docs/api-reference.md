# API Reference

Complete API reference for the SnackBase SDK.

## Contents

- [SnackBaseClient](#snackbaseclient)
- [Configuration](#configuration)
- [Services](#services)
  - [AuthService](#authservice)
  - [UserService](#userservice)
  - [CollectionService](#collectionservice)
  - [RecordService](#recordservice)
  - [RealTimeService](#realtimeservice)
  - [FileService](#fileservice)
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
