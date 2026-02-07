# @snackbase/skills

Agent Skills for SnackBase.

This package contains specialized knowledge and best practices for working with SnackBase, formatted according to the [Agent Skills specification](https://agentskills.io/specification).

## Included Skills

- **snackbase**: Comprehensive guide to using the SnackBase JavaScript/TypeScript SDK, including authentication, CRUD operations, and service-specific rules.

## Installation

### Option 1: npx (Recommended)

Automatically install the skill to `.claude/skills/`:

```bash
npx @snackbase/skills
```

### Option 2: npm/pnpm install

Install as a dev dependency (runs automatically on install):

```bash
pnpm add -D @snackbase/skills
# or
npm install -D @snackbase/skills
```

### Option 3: Manual

Clone the repo and copy `skills/snackbase/` to `.claude/skills/snackbase/`.

## Usage with AI Agents

Once installed, restart Claude Code to load the skill.

### Other Agents (Windsurf, Cursor, etc.)

Check your agent's documentation for "Agent Skills" support. Most agents look for skills in `.claude/skills/` automatically.

## Development

Individual skills are located in `skills/<skill-name>/`. Each skill directory contains a `SKILL.md` file and a `rules/` directory for granular documentation.
