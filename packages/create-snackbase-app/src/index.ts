import { Command } from 'commander';
import prompts from 'prompts';
import { red, green, blue, bold, cyan, yellow } from 'kolorist';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import validateProjectName from 'validate-npm-package-name';
import { initGit, installDependencies, detectPkgManager } from './post-process';

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
    .option('--git', 'Initialize git repository')
    .option('--install', 'Install dependencies')
    .option('--yes', 'Skip all prompts')
    .parse(process.argv);

  const options = program.opts();
  let targetDir = program.args[0];
  let template = options.template;
  const useGit = options.git;
  const useInstall = options.install;
  const skipPrompts = options.yes;

  const defaultProjectName = targetDir || 'snackbase-app';

  if (skipPrompts) {
    targetDir = targetDir || defaultProjectName;
    template = template || templates[0].name;
  }

  let result: prompts.Answers<'projectName' | 'template'> = {
    projectName: targetDir,
    template: template,
  };

  if (!skipPrompts) {
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

  const templateDir = path.resolve(__dirname, '../templates', selectedTemplate);
  
  if (fs.existsSync(templateDir)) {
    // Get latest SDK and React version from packages if available, or fallback
    let sdkVersion = '0.2.0';
    let reactPackageVersion = '0.2.0';
    try {
      const sdkPkgPath = path.resolve(__dirname, '../../../sdk/package.json');
      if (fs.existsSync(sdkPkgPath)) {
        const sdkPkg = await fs.readJSON(sdkPkgPath);
        sdkVersion = sdkPkg.version;
      }
      
      const reactPkgPath = path.resolve(__dirname, '../../../react/package.json');
      if (fs.existsSync(reactPkgPath)) {
        const reactPkg = await fs.readJSON(reactPkgPath);
        reactPackageVersion = reactPkg.version;
      }
    } catch (e) {
      // Ignore and use fallback
    }

    const variables = {
      PROJECT_NAME: projectName,
      PROJECT_DESCRIPTION: `SnackBase app created from ${selectedTemplate} template`,
      SDK_VERSION: sdkVersion,
      REACT_VERSION: reactPackageVersion,
    };

    await copyRecursive(templateDir, root, variables);
  } else {
    // Basic placeholder for Phase 1 (fallback)
    await fs.writeJSON(path.join(root, 'package.json'), {
      name: projectName,
      version: '0.0.0',
      private: true,
      description: `SnackBase app created from ${selectedTemplate} template`,
    }, { spaces: 2 });
    
    await fs.writeFile(path.join(root, 'README.md'), `# ${projectName}\n\nCreated with \`create-snackbase-app\`.`);
  }

  // Post-process actions
  if (useGit) {
    console.log(`\nInitializing git repository...`);
    if (initGit(root)) {
      console.log(green(`✓ Git repository initialized`));
    } else {
      console.log(yellow(`⚠ Failed to initialize git repository`));
    }
  }

  if (useInstall) {
    const pkgManager = detectPkgManager();
    console.log(`\nInstalling dependencies with ${pkgManager}...`);
    try {
      await installDependencies(root, pkgManager);
      console.log(green(`✓ Dependencies installed`));
    } catch (e) {
      console.log(red(`✖ Failed to install dependencies: ${e}`));
    }
  }

  console.log(`\n${green('Done.')} Now run:\n`);
  if (root !== process.cwd()) {
    console.log(`  cd ${path.relative(process.cwd(), root)}`);
  }
  
  if (!useInstall) {
    console.log('  npm install');
  }
  console.log('  npm run dev\n');
  
  console.log(`${cyan('Set up SnackBase:')}`);
  console.log(`  Create a ${blue('.env')} file with:`);
  console.log(`  ${bold('VITE_SNACKBASE_URL')}=https://your-snackbase-instance.com`);
  console.log(`  ${bold('VITE_SNACKBASE_API_KEY')}=your-api-key\n`);
}

async function copyRecursive(src: string, dest: string, variables: Record<string, string>) {
  const stats = await fs.stat(src);
  if (stats.isDirectory()) {
    await fs.ensureDir(dest);
    const files = await fs.readdir(src);
    for (const file of files) {
      if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'package-lock.json') continue;
      await copyRecursive(path.join(src, file), path.join(dest, file), variables);
    }
  } else {
    const filename = path.basename(src);
    if (filename === 'package.json' || filename === 'README.md' || filename === '.env.example' || filename === 'index.html') {
      let content = await fs.readFile(src, 'utf8');
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
      }
      await fs.writeFile(dest, content);
    } else {
      await fs.copy(src, dest);
    }
  }
}

init().catch((e) => {
  console.error(e);
});
