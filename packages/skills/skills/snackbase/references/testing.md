The SDK uses Vitest for testing. Services should be tested by mocking the `HttpClient`.

## Table of Contents

- [Test Setup](#test-setup)
- [Testing Service Methods](#testing-service-methods)
- [Testing Toggle / PATCH Endpoints](#testing-toggle--patch-endpoints)
- [Asserting limit / offset](#asserting-limit--offset)
- [Dashboard range](#dashboard-range)
- [Testing Error Handling](#testing-error-handling)
- [Testing Records with Generics](#testing-records-with-generics)
- [Running Tests](#running-tests)

## Test Setup

### Mock HttpClient Pattern

Include **`put` and `patch`** so toggle endpoints and full updates can be asserted:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user-service';

describe('UserService', () => {
  const mockHttp = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService(mockHttp as any);
  });
});
```

## Testing Service Methods

### List Method

```typescript
describe('list', () => {
  it('should return list of users', async () => {
    const mockData = {
      items: [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ],
      total: 2,
      skip: 0,
      limit: 20,
    };
    mockHttp.get.mockResolvedValue({ data: mockData });

    const result = await service.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/users', { params: undefined });
    expect(result).toEqual(mockData);
  });
});
```

### Create / Update / Delete

```typescript
it('should create a new user', async () => {
  const newUser = { email: 'new@example.com', password: 'password123' };
  mockHttp.post.mockResolvedValue({ data: { id: '1', ...newUser } });
  const result = await service.create(newUser);
  expect(mockHttp.post).toHaveBeenCalledWith('/api/v1/users', newUser);
  expect(result.id).toBe('1');
});
```

## Testing Toggle / PATCH Endpoints

Automation services use `PATCH .../toggle`:

```typescript
import { HookService } from './hook-service';

describe('HookService.toggle', () => {
  const mockHttp = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  const service = new HookService(mockHttp as any);

  it('should PATCH toggle path', async () => {
    const hook = { id: 'h1', enabled: false };
    mockHttp.patch.mockResolvedValue({ data: { ...hook, enabled: true } });

    const result = await service.toggle('h1');

    expect(mockHttp.patch).toHaveBeenCalledWith('/api/v1/hooks/h1/toggle');
    expect(result.enabled).toBe(true);
  });
});
```

Same pattern for `client.endpoints.toggle`, `client.workflows.toggle`.

## Asserting limit / offset

Automation list APIs use `limit` / `offset` (not `page` / `page_size`):

```typescript
import { WorkflowService } from './workflow-service';

it('should pass limit and offset query keys', async () => {
  const mockHttp = {
    get: vi.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  const service = new WorkflowService(mockHttp as any);

  await service.list({ trigger_type: 'manual', enabled: true, limit: 10, offset: 20 });

  expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/workflows', {
    params: { trigger_type: 'manual', enabled: true, limit: 10, offset: 20 },
  });
  const params = mockHttp.get.mock.calls[0][1].params;
  expect(params).toHaveProperty('limit', 10);
  expect(params).toHaveProperty('offset', 20);
  expect(params).not.toHaveProperty('page');
  expect(params).not.toHaveProperty('page_size');
});
```

## Dashboard range

```typescript
import { DashboardService } from './dashboard-service';

it('should pass range param', async () => {
  const mockHttp = {
    get: vi.fn().mockResolvedValue({
      data: {
        total_accounts: 1,
        range: '30d',
        system_health: { database_status: 'ok', storage_usage_mb: 1 },
        previous_period: { new_accounts: 0, new_users: 0 },
        // ...other DashboardStats fields as needed
      },
    }),
  };
  const service = new DashboardService(mockHttp as any);

  await service.getStats({ range: '30d' });

  expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/dashboard/stats', {
    params: { range: '30d' },
  });
});
```

## Testing Error Handling

```typescript
import { AuthenticationError, ValidationError } from './errors';

it('should throw AuthenticationError on 401', async () => {
  mockHttp.get.mockRejectedValue(new AuthenticationError('Unauthorized'));
  await expect(service.get('1')).rejects.toThrow(AuthenticationError);
});
```

## Testing Records with Generics

```typescript
describe('RecordService', () => {
  const mockHttp = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  let service: RecordService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecordService(mockHttp as any);
  });

  it('should batchUpdate with { id, data }', async () => {
    mockHttp.patch.mockResolvedValue({
      data: { updated: [], count: 1 },
    });
    await service.batchUpdate('tasks', [{ id: '1', data: { status: 'done' } }]);
    expect(mockHttp.patch).toHaveBeenCalledWith('/api/v1/records/tasks/batch', {
      records: [{ id: '1', data: { status: 'done' } }],
    });
  });
});
```

## Running Tests

```bash
# From SnackBase-sdk-js monorepo root
pnpm test
pnpm test:unit
pnpm test:integration

# Targeted
pnpm --filter @snackbase/sdk test -- hook-service.test.ts
```
