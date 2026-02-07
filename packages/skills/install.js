#!/usr/bin/env node

/**
 * Install SnackBase skill to .claude/skills/
 * This script is automatically run via:
 * - npm install: postinstall hook
 * - npx @snackbase/skills: bin entry point
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source: the skill directory in this package
const sourceDir = path.join(__dirname, 'skills', 'snackbase');

// Target: .claude/skills/snackbase in the user's project
const targetDir = path.join(process.cwd(), '.claude', 'skills', 'snackbase');

function install() {
  // Check if source exists
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Source skill directory not found:', sourceDir);
    process.exit(1);
  }

  // Clean up old 'rules/' directory from previous versions
  const oldRulesDir = path.join(targetDir, 'rules');
  if (fs.existsSync(oldRulesDir)) {
    fs.rmSync(oldRulesDir, { recursive: true });
  }

  // Clean up old 'services.md' renamed to 'api-reference.md'
  const oldServicesFile = path.join(targetDir, 'references', 'services.md');
  if (fs.existsSync(oldServicesFile)) {
    fs.rmSync(oldServicesFile);
  }

  // Create target directory recursively
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all files recursively
  fs.cpSync(sourceDir, targetDir, { recursive: true });

  console.log('✅ SnackBase skill installed to .claude/skills/snackbase');
  console.log('   Restart Claude Code to load the skill.');
}

install();
