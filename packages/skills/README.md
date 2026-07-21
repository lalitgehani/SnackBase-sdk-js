# @snackbase/skills

Agent Skills for SnackBase, aligned with **`@snackbase/sdk` ≥ 0.6.0**.

This package contains specialized knowledge and best practices for working with SnackBase, formatted according to the [Agent Skills specification](https://agentskills.io/specification).

## Included Skills

- **snackbase**: TypeScript client guide for `@snackbase/sdk` — auth, records, collections, webhooks, automation (hooks/endpoints/workflows/jobs), dashboard, realtime, access control, platform utilities, admin, errors, and testing patterns.

## Source of truth

Published skill content lives only under:

```text
packages/skills/skills/snackbase/
  SKILL.md
  references/*.md
```

`install.js` copies that tree into the consumer project at `.claude/skills/snackbase/`. Do not maintain a second divergent copy under `packages/skills/.claude/`.

## Installation

### Option 1: npx (Recommended)

```bash
npx @snackbase/skills
```

### Option 2: npm/pnpm install

```bash
pnpm add -D @snackbase/skills
# or
npm install -D @snackbase/skills
```

Postinstall runs `install.js` and installs the skill into `.claude/skills/snackbase`.

### Option 3: Manual

Copy `skills/snackbase/` to `.claude/skills/snackbase/` in your project.

## Usage with AI Agents

Restart Claude Code (or your agent) after install so the skill loads.

### Other Agents (Windsurf, Cursor, etc.)

Check your agent's documentation for Agent Skills support. Most look for skills in `.claude/skills/`.

## Scope boundary: skills vs MCP

| Package | Purpose |
| ------- | ------- |
| **`@snackbase/skills`** | Documents **TypeScript client** usage (`client.records`, `client.hooks`, …) for coding agents |
| **`@snackbase/mcp`** | Exposes **MCP tool schemas** for Claude tool-use servers |

Skills must **not** redefine MCP tool action names as `client.*` methods. For tool-use servers, see `@snackbase/mcp`. Skills may mention MCP only as a pointer.

## Development

```bash
cd packages/skills

# Structural alignment gate (banned APIs / required markers / SKILL.md links)
pnpm verify
# or: node scripts/verify-against-sdk.mjs

# Unit tests for the verify script (positive + negative injection)
pnpm test
```

### SDK release coupling checklist

When `@snackbase/sdk` gains a public method or breaks types (minor/major):

1. Update `skills/snackbase/**` in the **same PR** or a blocking follow-up
2. Run `pnpm verify` (and `pnpm test`) under `packages/skills`
3. Update this package `CHANGELOG.md` and bump version if guidance changes
4. Confirm `SKILL.md` reference links still resolve
5. Optional: `npm publish --dry-run` from `packages/skills` before release

### Agent-failure feedback

If an agent generates client code that fails against the real SDK **because of skill docs**:

1. File a GitHub issue tagged **`skills`**
2. Prefer fixing the skill examples within one minor release of the report
3. Add a regression string to `scripts/verify-against-sdk.mjs` when the failure is a banned pattern

### Deferred backlog

Not blocking 0.2.0 alignment:

- `@snackbase/react` skill pack
- pocketbase-compat / supabase-compat skills
- Exhaustive OpenAPI dump or full workflow step-type catalog
- Multi-language client skills

See `CHANGELOG.md` → Unreleased → Deferred.

## Publish

```bash
cd packages/skills
pnpm verify
npm publish --dry-run   # inspect tarball file list
npm publish --access public   # requires npm auth; same as SDK publish
```

`publishConfig.access` is `public`. Package `files` includes `skills/`, `install.js`, and the verify script.

## Version

Current: **0.2.0** — full alignment with `@snackbase/sdk` 0.6.0 (see CHANGELOG).
