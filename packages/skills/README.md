# @snackbase/skills

Agent Skills for SnackBase.

This package contains specialized knowledge and best practices for working with SnackBase, formatted according to the [Agent Skills specification](https://agentskills.io/specification).

## Included Skills

- **snackbase**: Comprehensive guide to using the SnackBase JavaScript/TypeScript SDK, including authentication, CRUD operations, and service-specific rules.

## Usage with AI Agents

### Claude Code

To use these skills with Claude Code, add the path to the `skills/` directory in this package to your Claude Code configuration.

1. Install the package:

   ```bash
   pnpm add -D @snackbase/skills
   ```

2. Add the skill path to your agent's environment or configuration:
   ```bash
   # Example: Adding to current session
   export CLAUDE_SKILLS_PATH=$(pwd)/node_modules/@snackbase/skills/skills
   ```

### Other Agents (Windsurf, etc.)

Check your agent's documentation for "Agent Skills" support and point it to the `skills/` directory within this package.

## Development

Individual skills are located in `skills/<skill-name>/`. Each skill directory contains a `SKILL.md` file and a `rules/` directory for granular documentation.
