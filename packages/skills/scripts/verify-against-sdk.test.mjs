/**
 * Drives the shipped verify-against-sdk.mjs entry point (positive + negative).
 * Run: node --test scripts/verify-against-sdk.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const script = path.join(packageRoot, 'scripts', 'verify-against-sdk.mjs');

function runVerify(cwd = packageRoot) {
  return spawnSync(process.execPath, [script], {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
}

describe('verify-against-sdk.mjs (shipped gate)', () => {
  it('exits 0 on the aligned skills/snackbase tree', () => {
    const result = runVerify();
    assert.equal(
      result.status,
      0,
      `expected exit 0, got ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stdout, /verify-against-sdk: OK/);
  });

  it('exits non-zero when a banned API is injected into a temp skill tree', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-verify-'));
    const skillDir = path.join(tmp, 'skills', 'snackbase');
    fs.mkdirSync(path.join(skillDir, 'references'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '# test\n\nSee [records](references/records.md)\n',
    );
    // Minimal content that would pass required markers except we inject bulkCreate
    fs.writeFileSync(
      path.join(skillDir, 'references', 'records.md'),
      `
batchCreate batchUpdate listDeliveries toggle accountId client.hooks
const x = await client.records.bulkCreate('tasks', []);
getStats({ range: '7d' })
`,
    );

    // Run script with package root overridden by copying script structure
    // The script resolves skill root relative to packages/skills — so we run
    // by spawning with a patched package that mirrors layout.
    const fakePkg = path.join(tmp, 'pkg');
    fs.mkdirSync(path.join(fakePkg, 'scripts'), { recursive: true });
    fs.cpSync(path.join(tmp, 'skills'), path.join(fakePkg, 'skills'), {
      recursive: true,
    });
    fs.copyFileSync(script, path.join(fakePkg, 'scripts', 'verify-against-sdk.mjs'));

    const result = spawnSync(
      process.execPath,
      [path.join(fakePkg, 'scripts', 'verify-against-sdk.mjs')],
      { cwd: fakePkg, encoding: 'utf8' },
    );

    assert.notEqual(result.status, 0, 'expected non-zero on banned bulkCreate');
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /bulkCreate|FAILED|banned/i,
    );

    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
