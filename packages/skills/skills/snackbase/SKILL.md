---
name: snackbase
description: SnackBase JavaScript/TypeScript SDK patterns and best practices. Use when working with SnackBase-js client, services, authentication, collections, or records.
metadata:
  tags: snackbase, sdk, typescript, javascript, api, backend-as-a-service, baas
---

## When to use

Use this skill whenever you are working with the SnackBase JavaScript/TypeScript SDK to obtain domain-specific knowledge about client initialization, authentication, service usage, and common patterns.

## Getting Started

New to SnackBase SDK? Start with the [client initialization rules](./rules/client.md).

## Core Rules

Read individual rule files for detailed explanations and code examples:

- [rules/client.md](rules/client.md) - Client initialization, configuration, and setup
- [rules/authentication.md](rules/authentication.md) - Authentication flows, OAuth, SAML, session management
- [rules/collections.md](rules/collections.md) - Collection CRUD, schema operations, versioning
- [rules/records.md](rules/records.md) - Record CRUD, filtering, pagination, bulk operations
- [rules/errors.md](rules/errors.md) - Error handling, retry behavior, specific error types
- [rules/files.md](rules/files.md) - File upload/download, progress tracking
- [rules/webhooks.md](rules/webhooks.md) - Webhook management, signature verification
- [rules/testing.md](rules/testing.md) - Testing patterns, mocking, Vitest setup
- [rules/storage.md](rules/storage.md) - Storage configuration, platform-specific backends

## Service Reference

- [rules/services.md](rules/services.md) - Complete reference for all SDK services

## Key Principles

1. **Services always return `response.data`** - Never the full response object
2. **Auth is handled by interceptors** - Services don't manage auth headers
3. **Array params are comma-joined** - e.g., `fields: ['id', 'name']` becomes `?fields=id,name`
4. **Filter objects are JSON stringified** - Passed as query params

## Common Tasks

| Task                  | Rule                                         |
| --------------------- | -------------------------------------------- |
| Initialize client     | [client.md](rules/client.md)                 |
| Authenticate user     | [authentication.md](rules/authentication.md) |
| Create collection     | [collections.md](rules/collections.md)       |
| Query records         | [records.md](rules/records.md)               |
| Handle 401/403 errors | [errors.md](rules/errors.md)                 |
| Upload file           | [files.md](rules/files.md)                   |
| Set up webhooks       | [webhooks.md](rules/webhooks.md)             |
| Write tests           | [testing.md](rules/testing.md)               |
