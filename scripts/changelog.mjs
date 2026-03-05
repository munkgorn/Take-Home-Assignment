#!/usr/bin/env node

/**
 * Changelog tool (changie-style for Node.js)
 *
 * Usage:
 *   node scripts/changelog.mjs new <project>           — create a new change entry
 *   node scripts/changelog.mjs batch <project> <ver>    — compile unreleased → version
 *   node scripts/changelog.mjs list <project>           — list unreleased changes
 *
 * <project> = "backend" | "frontend"
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ROOT = path.resolve(import.meta.dirname, '..');
const KINDS = ['added', 'changed', 'fixed', 'removed', 'security'];
const KIND_HEADERS = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  removed: 'Removed',
  security: 'Security',
};

function getProjectDir(project) {
  const dir = path.join(ROOT, project);
  if (!fs.existsSync(dir)) {
    console.error(`Project directory not found: ${project}/`);
    process.exit(1);
  }
  return dir;
}

function getChangesDir(project) {
  return path.join(getProjectDir(project), '.changes');
}

function getUnreleasedDir(project) {
  const dir = path.join(getChangesDir(project), 'unreleased');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function parseFragment(content) {
  const lines = content.trim().split('\n');
  const data = {};
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      data[match[1]] = match[2];
    }
  }
  // Body is everything after the YAML-like header
  const bodyStart = lines.findIndex((l) => l.startsWith('body:'));
  if (bodyStart !== -1) {
    data.body = lines[bodyStart].replace(/^body:\s*/, '');
  }
  return data;
}

function readFragments(project) {
  const dir = getUnreleasedDir(project);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'));
  return files.map((f) => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    return { file: f, ...parseFragment(content) };
  });
}

// --- Commands ---

async function cmdNew(project) {
  console.log(`\nNew changelog entry for: ${project}`);
  console.log(`Kinds: ${KINDS.join(', ')}\n`);

  const kind = (await prompt('Kind: ')).toLowerCase().trim();
  if (!KINDS.includes(kind)) {
    console.error(`Invalid kind. Choose from: ${KINDS.join(', ')}`);
    process.exit(1);
  }

  const body = (await prompt('Description: ')).trim();
  if (!body) {
    console.error('Description cannot be empty');
    process.exit(1);
  }

  const timestamp = new Date().toISOString();
  const slug = body.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const filename = `${Date.now()}-${slug}.yaml`;

  const content = `kind: ${kind}\nbody: ${body}\ntime: ${timestamp}\n`;

  const filepath = path.join(getUnreleasedDir(project), filename);
  fs.writeFileSync(filepath, content);
  console.log(`\nCreated: ${project}/.changes/unreleased/${filename}`);
}

function cmdList(project) {
  const fragments = readFragments(project);
  if (fragments.length === 0) {
    console.log(`No unreleased changes for ${project}`);
    return;
  }

  console.log(`\nUnreleased changes for ${project}:\n`);
  const grouped = {};
  for (const f of fragments) {
    const k = f.kind || 'changed';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(f);
  }
  for (const kind of KINDS) {
    if (!grouped[kind]) continue;
    console.log(`### ${KIND_HEADERS[kind]}`);
    for (const f of grouped[kind]) {
      console.log(`- ${f.body}`);
    }
    console.log('');
  }
}

function cmdBatch(project, version) {
  if (!version) {
    console.error('Usage: changelog.mjs batch <project> <version>');
    process.exit(1);
  }

  const fragments = readFragments(project);
  if (fragments.length === 0) {
    console.log(`No unreleased changes to batch for ${project}`);
    return;
  }

  // Group by kind
  const grouped = {};
  for (const f of fragments) {
    const k = f.kind || 'changed';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(f);
  }

  // Build markdown section
  const date = new Date().toISOString().split('T')[0];
  let section = `## ${version} - ${date}\n\n`;
  for (const kind of KINDS) {
    if (!grouped[kind]) continue;
    section += `### ${KIND_HEADERS[kind]}\n`;
    for (const f of grouped[kind]) {
      section += `- ${f.body}\n`;
    }
    section += '\n';
  }

  // Prepend to CHANGELOG.md
  const changelogPath = path.join(getProjectDir(project), 'CHANGELOG.md');
  let existing = '';
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, 'utf8');
  }

  const header = `# Changelog\n\n`;
  const body = existing.startsWith('# Changelog')
    ? existing.replace(/^# Changelog\n\n?/, '')
    : existing;

  fs.writeFileSync(changelogPath, `${header}${section}${body}`);
  console.log(`Updated: ${project}/CHANGELOG.md`);

  // Archive fragments
  const archiveDir = path.join(getChangesDir(project), version);
  fs.mkdirSync(archiveDir, { recursive: true });
  const unreleasedDir = getUnreleasedDir(project);
  for (const f of fragments) {
    fs.renameSync(path.join(unreleasedDir, f.file), path.join(archiveDir, f.file));
  }
  console.log(`Archived ${fragments.length} fragments to ${project}/.changes/${version}/`);
}

// --- Main ---

const [, , command, project, extra] = process.argv;

if (!command || !project) {
  console.log(`
Changelog tool (changie-style)

Usage:
  node scripts/changelog.mjs new <project>           Create a new change entry
  node scripts/changelog.mjs batch <project> <ver>   Compile unreleased → version
  node scripts/changelog.mjs list <project>           List unreleased changes

<project> = "backend" | "frontend"
  `);
  process.exit(0);
}

switch (command) {
  case 'new':
    await cmdNew(project);
    break;
  case 'list':
    cmdList(project);
    break;
  case 'batch':
    cmdBatch(project, extra);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
