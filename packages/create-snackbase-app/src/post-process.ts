import { execSync, spawn } from 'child_process';
import { red, green } from 'kolorist';

export function initGit(root: string) {
  try {
    execSync('git init', { cwd: root, stdio: 'ignore' });
    execSync('git add .', { cwd: root, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from create-snackbase-app"', {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch (e) {
    return false;
  }
}

export type PkgManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export function detectPkgManager(): PkgManager {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  } else if (userAgent.startsWith('yarn')) {
    return 'yarn';
  } else if (userAgent.startsWith('bun')) {
    return 'bun';
  } else {
    return 'npm';
  }
}

export async function installDependencies(root: string, pkgManager: PkgManager) {
  return new Promise<void>((resolve, reject) => {
    const args = ['install'];
    
    // Some package managers might need different args, but 'install' is standard
    
    const child = spawn(pkgManager, args, {
      cwd: root,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${pkgManager} install failed with code ${code}`));
        return;
      }
      resolve();
    });
  });
}
