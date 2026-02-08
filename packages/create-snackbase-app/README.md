# create-snackbase-app

The official CLI for scaffolding new SnackBase projects.

## Quick Start

You can create a new SnackBase project by running:

```bash
npx create-snackbase-app@latest
```

Or, if you want to specify a project name and template:

```bash
npx create-snackbase-app@latest my-app --template todo-app
```

## Features

- 🚀 **Fast Scaffolding**: Get started with a new project in seconds.
- 🎨 **Multiple Templates**: Choose from a variety of templates (Todo App, Realtime Demo, Feature Voting, etc.).
- 🛠️ **Fully Configured**: Comes with SnackBase SDK and React integration out of the box.
- 📦 **Modern Stack**: Uses Vite, TypeScript, and React.

## Templates

Currently supported templates:

- `todo-app`: A simple todo application with authentication.
- `todo-single-tenant`: A todo application tailored for single-tenant use cases.
- `realtime-demo`: A demonstration of SnackBase's real-time capabilities.
- `voting-app`: A feature voting application.

## Development

To contribute to this CLI:

1.  Clone the repository: `git clone https://github.com/lalitgehani/snackbase-js.git`
2.  Install dependencies: `pnpm install`
3.  Navigate to the CLI package: `cd packages/create-snackbase-app`
4.  Run in dev mode: `npm run dev`

## License

MIT
