# Integration Tests

This directory contains integration tests that run against a live SnackBase server.

## Setup

### 1. Environment Variables

Create a `.env` file in the root of the project:

```env
SNACKBASE_URL=https://your-test-server.snackbase.dev
SNACKBASE_API_KEY=your-test-api-key
SNACKBASE_TEST_EMAIL=test@example.com
SNACKBASE_TEST_PASSWORD=testpassword123
```

### 2. Test Server Setup

You can set up a test SnackBase server in several ways:

#### Option 1: Local Development Server

```bash
# Run SnackBase locally with Docker
docker run -p 8090:8090 snackbase/server:latest
```

#### Option 2: SnackBase Cloud Staging

Use a staging project on SnackBase Cloud for integration testing.

#### Option 3: Mock Server

Use a mock server like `msw` for integration tests (see `setup.ts`).

### 3. Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run a specific test file
npm run test:integration tests/integration/auth.test.ts

# Run with coverage
npm run test:integration:coverage
```

## Test Structure

```
tests/integration/
├── README.md
├── setup.ts           # Test setup and utilities
├── auth.test.ts       # Authentication tests
├── records.test.ts    # Record CRUD tests
├── realtime.test.ts   # Real-time subscription tests
├── files.test.ts      # File upload/download tests
└── helpers/
    ├── cleanup.ts     # Cleanup utilities
    └── fixtures.ts    # Test data fixtures
```

## Writing Integration Tests

### Example Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SnackBaseClient } from "@snackbase/sdk";
import { createTestUser, cleanupTestUser } from "../helpers/fixtures";

describe("Authentication Integration Tests", () => {
  let client: SnackBaseClient;
  let testUserId: string;

  beforeEach(async () => {
    client = new SnackBaseClient({
      baseUrl: process.env.SNACKBASE_URL!,
      apiKey: process.env.SNACKBASE_API_KEY,
    });
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(client, testUserId);
    }
  });

  it("should register a new user", async () => {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: "testpassword123",
      passwordConfirm: "testpassword123",
      name: "Test User",
    };

    const authState = await client.auth.register(userData);

    expect(authState.user).toBeDefined();
    expect(authState.user.email).toBe(userData.email);
    expect(authState.isAuthenticated).toBe(true);

    testUserId = authState.user.id;
  });

  it("should login with email and password", async () => {
    // First create a user
    const authState = await createTestUser(client);
    testUserId = authState.user.id;

    // Logout
    await client.auth.logout();

    // Login again
    const loginState = await client.auth.login({
      email: authState.user.email,
      password: "testpassword123",
    });

    expect(loginState.user.id).toBe(testUserId);
    expect(loginState.isAuthenticated).toBe(true);
  });
});
```

## Test Utilities

### Fixtures

```typescript
// helpers/fixtures.ts

export async function createTestUser(client: SnackBaseClient) {
  const email = `test-${Date.now()}@example.com`;
  const authState = await client.auth.register({
    email,
    password: "testpassword123",
    passwordConfirm: "testpassword123",
    name: "Test User",
  });
  return authState;
}

export async function createTestCollection(
  client: SnackBaseClient,
  name: string,
) {
  const collection = await client.collections.create({
    name,
    schema: {
      type: "base",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "content", type: "text" },
      ],
    },
  });
  return collection;
}

export async function cleanupTestUser(client: SnackBaseClient, userId: string) {
  await client.users.delete(userId);
}

export async function cleanupTestCollection(
  client: SnackBaseClient,
  collectionId: string,
) {
  await client.collections.delete(collectionId);
}
```

### Cleanup

```typescript
// helpers/cleanup.ts

const createdResources = {
  users: [] as string[],
  collections: [] as string[],
  records: [] as string[],
};

export function trackUser(userId: string) {
  createdResources.users.push(userId);
}

export function trackCollection(collectionId: string) {
  createdResources.collections.push(collectionId);
}

export async function cleanupAll(client: SnackBaseClient) {
  // Delete all tracked records
  for (const recordId of createdResources.records) {
    // Determine collection and delete
  }

  // Delete all tracked collections
  for (const collectionId of createdResources.collections) {
    await client.collections.delete(collectionId).catch(() => {});
  }

  // Delete all tracked users
  for (const userId of createdResources.users) {
    await client.users.delete(userId).catch(() => {});
  }

  // Clear arrays
  createdResources.users = [];
  createdResources.collections = [];
  createdResources.records = [];
}
```

## Best Practices

1. **Isolation**: Each test should be independent and clean up after itself
2. **Unique Data**: Use timestamps or UUIDs to create unique test data
3. **Cleanup**: Always delete created resources in `afterEach`
4. **Timeouts**: Set appropriate timeouts for network requests
5. **Retry Logic**: Handle transient network failures gracefully
6. **Parallel Tests**: Avoid state conflicts between parallel tests

## CI/CD Integration

Add to your CI workflow:

```yaml
# .github/workflows/ci.yml
integration-test:
  name: Integration Tests
  runs-on: ubuntu-latest
  services:
    snackbase:
      image: snackbase/server:latest
      ports:
        - 8090:8090
      env:
        SNACKBASE_ADMIN_EMAIL: admin@test.com
        SNACKBASE_ADMIN_PASSWORD: password123

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Install dependencies
      run: npm ci

    - name: Run integration tests
      env:
        SNACKBASE_URL: http://localhost:8090
        SNACKBASE_API_KEY: ${{ secrets.TEST_API_KEY }}
      run: npm run test:integration
```

## Troubleshooting

### Tests Fail Intermittently

- Add retry logic for network operations
- Increase timeouts
- Run tests serially instead of in parallel

### Tests Timeout

- Check if the server is running
- Verify network connectivity
- Increase the test timeout in vitest config

### Cleanup Fails

- Ensure resources are properly tracked
- Add error handling to cleanup operations
- Use unique identifiers for test resources
