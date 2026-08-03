# create-snackbase-app

The official CLI for scaffolding new SnackBase projects.

## Quick Start

You can create a new SnackBase project by running:

```bash
npx create-snackbase-app@latest
```

Specify a project name and template when you want a non-interactive starting point:

```bash
npx create-snackbase-app@latest my-app --template todo --yes
```

The CLI also supports `--git` to initialize a repository and `--install` to install
dependencies with the package manager that launched the command.

## Features

- 🚀 **Fast Scaffolding**: Get started with a new project in seconds.
- 🎨 **Multiple Templates**: Choose from a variety of templates (Todo App, Realtime Demo, Feature Voting, etc.).
- 🛠️ **Fully Configured**: Comes with SnackBase SDK and React integration out of the box.
- 📦 **Modern Stack**: Uses Vite, TypeScript, and React.

## Templates

Currently supported template names:

- `todo`: Multi-account todo application with authentication.
- `todo-single-tenant`: Todo application for single-tenant or internal use cases.
- `realtime`: Real-time subscription demo.
- `voting`: Feature voting application with authentication and realtime updates.

## Development

To contribute to this CLI:

1.  Clone the repository: `git clone https://github.com/lalitgehani/snackbase-js.git`
2.  Install dependencies: `pnpm install`
3.  Navigate to the CLI package: `cd packages/create-snackbase-app`
4.  Run in dev mode: `pnpm --filter create-snackbase-app dev`

The generated applications use Vite and expose the usual `dev`, `build`, `lint`, and
`preview` scripts.

## License

MIT
