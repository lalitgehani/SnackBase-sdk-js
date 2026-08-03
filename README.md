# SnackBase JavaScript SDK monorepo

This pnpm workspace contains the JavaScript/TypeScript SDK ecosystem for
[SnackBase](https://snackbase.dev).

## Packages

| Package | Purpose |
| --- | --- |
| [`@snackbase/sdk`](packages/sdk/README.md) | Core typed client and 24 API services |
| [`@snackbase/react`](packages/react/README.md) | React provider and hooks |
| [`@snackbase/mcp`](packages/mcp/README.md) | API-key-only MCP server with 22 tools |
| [`@snackbase/pocketbase-compat`](packages/pocketbase-compat/README.md) | PocketBase-compatible client surface |
| [`@snackbase/supabase-compat`](packages/supabase-compat/README.md) | Supabase-compatible client surface |
| [`@snackbase/skills`](packages/skills/README.md) | Agent Skills for SnackBase SDK development |
| [`create-snackbase-app`](packages/create-snackbase-app/README.md) | Vite project scaffolding CLI |
| `@snackbase/tsconfig` | Private shared TypeScript configuration |

## Development

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm build
pnpm test
pnpm test:unit
pnpm typecheck
pnpm lint
```

Useful package-scoped commands:

```bash
pnpm --filter @snackbase/sdk build
pnpm --filter @snackbase/react test
pnpm --filter @snackbase/mcp typecheck
pnpm --filter @snackbase/skills verify
```

Integration tests target a live SnackBase backend. Set `SNACKBASE_URL` and, where
required by the test flow, `SNACKBASE_API_KEY`; SDK integration tests run sequentially
to avoid SQLite locking.

Build outputs are written to package `dist/` directories and are intentionally ignored
by Git.

## Repository layout

```text
packages/
├── sdk/                    # Core client
├── react/                  # React integration
├── mcp/                    # MCP server
├── pocketbase-compat/      # PocketBase compatibility layer
├── supabase-compat/        # Supabase compatibility layer
├── skills/                 # Agent Skills
├── create-snackbase-app/   # Scaffolding CLI and templates
└── tsconfig/               # Shared TypeScript config
```

## License

MIT
