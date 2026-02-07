---
name: testing
description: Testing patterns, mocking, and Vitest setup for SnackBase SDK
metadata:
  tags: test, testing, mock, vitest, unit-test
---

The SDK uses Vitest for testing. Services should be tested by mocking the `HttpClient`.

## Test Setup

### Mock HttpClient Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user-service';

describe('UserService', () => {
  const mockHttp = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  };

  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService(mockHttp as any);
  });

  // Tests go here...
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
        { id: '2', email: 'user2@example.com' }
      ],
      total: 2,
      skip: 0,
      limit: 20
    };
    mockHttp.get.mockResolvedValue({ data: mockData });

    const result = await service.list();

    expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/users', { params: undefined });
    expect(result).toEqual(mockData);
  });

  it('should pass query parameters', async () => {
    mockHttp.get.mockResolvedValue({ data: { items: [], total: 0, skip: 0, limit: 10 } });

    await service.list({ skip: 10, limit: 10 });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/users', {
      params: { skip: 10, limit: 10 }
    });
  });
});
```

### Get Method

```typescript
describe('get', () => {
  it('should get user by ID', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockHttp.get.mockResolvedValue({ data: mockUser });

    const result = await service.get('123');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/users/123');
    expect(result).toEqual(mockUser);
  });
});
```

### Create Method

```typescript
describe('create', () => {
  it('should create a new user', async () => {
    const newUser = { email: 'new@example.com', password: 'password123' };
    const mockResponse = { id: '1', ...newUser };
    mockHttp.post.mockResolvedValue({ data: mockResponse });

    const result = await service.create(newUser);

    expect(mockHttp.post).toHaveBeenCalledWith('/api/v1/users', newUser);
    expect(result).toEqual(mockResponse);
  });
});
```

### Update Method

```typescript
describe('update', () => {
  it('should update a user', async () => {
    const updates = { name: 'Updated Name' };
    const mockResponse = { id: '1', ...updates };
    mockHttp.patch.mockResolvedValue({ data: mockResponse });

    const result = await service.update('1', updates);

    expect(mockHttp.patch).toHaveBeenCalledWith('/api/v1/users/1', updates);
    expect(result).toEqual(mockResponse);
  });
});
```

### Delete Method

```typescript
describe('delete', () => {
  it('should delete a user', async () => {
    mockHttp.delete.mockResolvedValue(undefined);

    await service.delete('1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/v1/users/1');
  });
});
```

## Testing Error Handling

```typescript
describe('error handling', () => {
  it('should throw AuthenticationError on 401', async () => {
    const error = new AuthenticationError('Unauthorized');
    mockHttp.get.mockRejectedValue(error);

    await expect(service.get('1')).rejects.toThrow(AuthenticationError);
  });

  it('should throw ValidationError on 422', async () => {
    const error = new ValidationError('Validation failed', {
      email: ['Invalid email']
    });
    mockHttp.post.mockRejectedValue(error);

    await expect(service.create({ email: 'invalid' })).rejects.toThrow(ValidationError);
  });
});
```

## Testing Records with Generics

```typescript
describe('RecordService', () => {
  const mockHttp = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
  let service: RecordService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecordService(mockHttp as any);
  });

  describe('list', () => {
    it('should return typed records', async () => {
      interface Task { id: string; title: string; }
      const mockData = {
        items: [{ id: '1', title: 'Task 1' }],
        total: 1,
        skip: 0,
        limit: 20
      };
      mockHttp.get.mockResolvedValue({ data: mockData });

      const result = await service.list<Task>('tasks');

      expect(result.items[0].title).toBe('Task 1');
    });
  });
});
```

## Test File Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FooService } from './foo-service';
import type { Foo, FooCreate, FooUpdate } from '../types/foo';

describe('FooService', () => {
  const mockHttp = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  };

  let service: FooService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FooService(mockHttp as any);
  });

  describe('list', () => {
    it('should return list of items', async () => {
      const mockData = {
        items: [{ id: '1', name: 'Foo 1' }],
        total: 1,
        skip: 0,
        limit: 20
      };
      mockHttp.get.mockResolvedValue({ data: mockData });

      const result = await service.list();

      expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/foos', { params: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('get', () => {
    it('should get item by ID', async () => {
      const mockItem = { id: '1', name: 'Foo 1' };
      mockHttp.get.mockResolvedValue({ data: mockItem });

      const result = await service.get('1');

      expect(mockHttp.get).toHaveBeenCalledWith('/api/v1/foos/1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const createData: FooCreate = { name: 'New Foo' };
      const mockItem: Foo = { id: '1', ...createData };
      mockHttp.post.mockResolvedValue({ data: mockItem });

      const result = await service.create(createData);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/v1/foos', createData);
      expect(result).toEqual(mockItem);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateData: FooUpdate = { name: 'Updated' };
      const mockItem: Foo = { id: '1', name: 'Updated' };
      mockHttp.patch.mockResolvedValue({ data: mockItem });

      const result = await service.update('1', updateData);

      expect(mockHttp.patch).toHaveBeenCalledWith('/api/v1/foos/1', updateData);
      expect(result).toEqual(mockItem);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      mockHttp.delete.mockResolvedValue({ success: true });

      await service.delete('1');

      expect(mockHttp.delete).toHaveBeenCalledWith('/api/v1/foos/1');
    });
  });
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for a specific file
pnpm test -- foo-service.test.ts

# Run tests matching a pattern
pnpm test -- -t "should return list"

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration
```
