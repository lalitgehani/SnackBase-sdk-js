import { Command } from 'commander';
import prompts from 'prompts';
import { red, green, blue, bold, cyan } from 'kolorist';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import validateProjectName from 'validate-npm-package-name';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = [
  {
    name: 'todo',
    display: 'Todo App (Radix UI, React Hook Form, Zod)',
    color: blue,
  },
  {
    name: 'realtime',
    display: 'Realtime Demo (SnackBase Subscriptions)',
    color: green,
  },
  {
    name: 'voting',
    display: 'Feature Voting (Auth & Voting)',
    color: cyan,
  },
  {
    name: 'todo-single-tenant',
    display: 'Todo App (Single Tenant Mode)',
    color: blue,
  },
];

async function init() {
  const program = new Command();

  program
    .name('create-snackbase-app')
    .description('Scaffold a SnackBase-powered application')
    .argument('[project-name]', 'Project name')
    .option('-t, --template <template-name>', 'Template name')
    .parse(process.argv);

  let targetDir = program.args[0];
  let template = program.opts().template;

  const defaultProjectName = targetDir || 'snackbase-app';

  let result: prompts.Answers<'projectName' | 'template'>;

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: defaultProjectName,
          onState: (state) => {
            targetDir = state.value.trim() || defaultProjectName;
          },
        },
        {
          type: () =>
            template && templates.some((t) => t.name === template) ? null : 'select',
          name: 'template',
          message: 'Select a template:',
          initial: 0,
          choices: templates.map((t) => ({
            title: t.color(t.display),
            value: t.name,
          })),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        },
      }
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  const { projectName = targetDir, template: selectedTemplate = template } = result;

  const root = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(root)) {
    console.error(red(`Error: Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  const validation = validateProjectName(projectName);
  if (!validation.validForNewPackages) {
    console.error(red(`Invalid project name: "${projectName}"`));
    validation.errors?.forEach((err) => console.error(red(`- ${err}`)));
    process.exit(1);
  }

  console.log(`\nScaffolding project in ${blue(root)}...`);

  await fs.ensureDir(root);

  // For Phase 1, we just create a basic structure if templates aren't ready
  // In Phase 2+, we will copy from templates/
  const templateDir = path.resolve(__dirname, '../templates', selectedTemplate);
  
  if (fs.existsSync(templateDir)) {
    await fs.copy(templateDir, root);
  } else {
    // Basic placeholder for Phase 1
    await fs.writeJSON(path.join(root, 'package.json'), {
      name: projectName,
      version: '0.0.0',
      private: true,
      description: `SnackBase app created from ${selectedTemplate} template`,
    }, { spaces: 2 });
    
    await fs.writeFile(path.join(root, 'README.md'), `# ${projectName}\n\nCreated with \`create-snackbase-app\`.`);
  }

  console.log(`\n${green('Done.')} Now run:\n`);
  if (root !== process.cwd()) {
    console.log(`  cd ${path.relative(process.cwd(), root)}`);
  }
  console.log('  npm install');
  console.log('  npm run dev\n');
}

init().catch((e) => {
  console.error(e);
});
