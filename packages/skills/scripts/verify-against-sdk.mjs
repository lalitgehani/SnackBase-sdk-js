#!/usr/bin/env node
/**
 * Structural verification that @snackbase/skills markdown stays aligned with
 * @snackbase/sdk ≥ 0.6.0 public contracts (no banned obsolete APIs).
 *
 * Usage (from packages/skills):
 *   node scripts/verify-against-sdk.mjs
 *   pnpm verify
 *
 * Exit 0 on success; non-zero on any ban or missing required marker.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const skillRoot = path.join(packageRoot, 'skills', 'snackbase');

/** @type {{ name: string; re: RegExp; hint: string }[]} */
const BANNED = [
  {
    name: 'bulkCreate call',
    re: /\.bulkCreate\b/,
    hint: 'Use batchCreate',
  },
  {
    name: 'bulkUpdate call',
    re: /\.bulkUpdate\b/,
    hint: 'Use batchUpdate with { id, data }',
  },
  {
    name: 'bulkDelete call',
    re: /\.bulkDelete\b/,
    hint: 'Use batchDelete',
  },
  {
    name: 'getSecret call',
    re: /\.getSecret\b/,
    hint: 'Secret only on webhook create response',
  },
  {
    name: 'rotateSecret call',
    re: /\.rotateSecret\b/,
    hint: 'No rotateSecret on WebhookService',
  },
  {
    name: 'client.permissions',
    re: /client\.permissions\b/,
    hint: 'Use client.collectionRules (mentions in "no client.permissions" are ok if pattern is client.permissions alone — see allowlist)',
  },
  {
    name: 'PermissionService as API',
    re: /##\s*PermissionService\b|\|\s*PermissionService\s*\|/,
    hint: 'Remove PermissionService documentation',
  },
  {
    name: 'FieldType relation',
    re: /\|\s*'relation'\s*(\||$)/,
    hint: 'Use reference, not relation',
  },
  {
    name: "type: 'select' field",
    re: /type:\s*['"]select['"]/,
    hint: 'select is not a valid FieldType',
  },
  {
    name: "type: 'multi_select' field",
    re: /type:\s*['"]multi_select['"]/,
    hint: 'multi_select is not a valid FieldType',
  },
  {
    name: 'filter object auto-JSON claim',
    // Positive claim only (not "no object-filter auto-JSON-stringify")
    re: /Filter objects are JSON stringif|object format auto-converted|filter objects are JSON stringif/i,
    hint: 'Filters are string-only',
  },
  {
    name: 'object filter example as supported',
    // Code-sample style assignment, not prose mentioning the pattern
    re: /(?<!no object-shaped `|no object-shaped |shaped `)filter:\s*\{\s*status:/,
    hint: 'Do not present object filters as supported',
  },
  {
    name: 'webhook object filter collection',
    re: /(?<!shaped `|object-shaped `)filter:\s*\{\s*collection:/,
    hint: 'Webhook filter is a string; collection is top-level',
  },
];

/** Lines matching these are ignored (educational negation / “do not use” prose). */
const ALLOW_LINE = [
  /no\s+`?client\.permissions/i,
  /not\s+`?client\.permissions/i,
  /no\s+`?PermissionService/i,
  /not\s+PermissionService/i,
  /not\s+`?PermissionService/i,
  /\(not PermissionService\)/i,
  /There is \*\*no\*\* `PermissionService/i,
  /There is \*\*no\*\* `client\.permissions/i,
  /There is no `PermissionService/i,
  /no PermissionService/i,
  /not getSecret|no.*getSecret|There are \*\*no\*\* `getSecret/i,
  /not page_size|not `page`\s*\/\s*`page_size`|not page\/page_size/i,
  /not toHaveProperty\(['"]page_size['"]\)/,
  /not toHaveProperty\(['"]page['"]\)/,
  // Negations of obsolete filter patterns (must not flag the warning itself)
  /no object-filter auto-JSON/i,
  /There is no object-filter/i,
  /no object-shaped `filter:/i,
  /There is \*\*no\*\* object-shaped/i,
  /Do not pass object|do not present object filter/i,
  /Filters are strings only/i,
];

const REQUIRED = [
  { name: 'batchCreate', re: /\bbatchCreate\b/ },
  { name: 'client.hooks or hooks guide', re: /client\.hooks|references\/hooks\.md/ },
  { name: 'toggle', re: /\.toggle\b|async toggle\b/ },
  { name: 'accountId', re: /\baccountId\b/ },
  { name: 'batchUpdate', re: /\bbatchUpdate\b/ },
  { name: 'listDeliveries', re: /\blistDeliveries\b/ },
  { name: 'getStats range', re: /getStats|range:\s*['"]7d['"]/ },
];

function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...walk(p));
    else if (ent.isFile() && /\.(md|mdx)$/i.test(ent.name)) files.push(p);
  }
  return files;
}

function lineAllowed(line) {
  return ALLOW_LINE.some((re) => re.test(line));
}

function main() {
  if (!fs.existsSync(skillRoot)) {
    console.error(`Skill tree missing: ${skillRoot}`);
    process.exit(2);
  }

  const files = walk(skillRoot);
  if (files.length === 0) {
    console.error('No markdown files under skills/snackbase');
    process.exit(2);
  }

  /** @type {string[]} */
  const failures = [];
  /** @type {Map<string, boolean>} */
  const requiredHits = new Map(REQUIRED.map((r) => [r.name, false]));

  for (const file of files) {
    const rel = path.relative(packageRoot, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const req of REQUIRED) {
      if (req.re.test(content)) requiredHits.set(req.name, true);
    }

    lines.forEach((line, idx) => {
      if (lineAllowed(line)) return;
      for (const ban of BANNED) {
        if (ban.re.test(line)) {
          // Soft-allow educational negation of client.permissions on same line
          if (
            ban.name === 'client.permissions' &&
            /no|not|never|removed|instead/i.test(line)
          ) {
            return;
          }
          failures.push(
            `${rel}:${idx + 1}: banned [${ban.name}] — ${ban.hint}\n  ${line.trim()}`,
          );
        }
      }
    });
  }

  for (const [name, hit] of requiredHits) {
    if (!hit) {
      failures.push(`missing required marker: ${name}`);
    }
  }

  // SKILL.md relative links must resolve
  const skillMd = path.join(skillRoot, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    const text = fs.readFileSync(skillMd, 'utf8');
    const linkRe = /\]\((references\/[^)#\s]+)\)/g;
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const target = path.join(skillRoot, m[1]);
      if (!fs.existsSync(target)) {
        failures.push(`SKILL.md broken link: ${m[1]}`);
      }
    }
  }

  if (failures.length) {
    console.error('verify-against-sdk: FAILED\n');
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(`\n${failures.length} issue(s) in ${files.length} file(s).`);
    process.exit(1);
  }

  console.log(
    `verify-against-sdk: OK (${files.length} files, all banned patterns clear, required markers present)`,
  );
  process.exit(0);
}

main();
