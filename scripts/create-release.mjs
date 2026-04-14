#!/usr/bin/env node
/**
 * create-release.mjs
 *
 * Automates the flag-sunset-plugin release process:
 *   1. Validates the repo state (branch, cleanliness, layout, version consistency)
 *   2. Commits plugin.json if it is the only staged/unstaged change
 *   3. Creates an annotated git tag
 *   4. Pushes the commit and tag to origin
 *
 * Usage:
 *   node scripts/create-release.mjs [--dry-run]
 *
 * Flags:
 *   --dry-run   Print every git command without executing anything.
 *               Useful for previewing the release before committing.
 *
 * Exit codes:
 *   0  Success (or dry-run completed)
 *   1  Safety check failed — read the error message for the required fix
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const isDryRun = process.argv.includes('--dry-run');

const label = isDryRun ? '[dry-run] ' : '';

function readJson(relativePath) {
    const full = path.join(repoRoot, relativePath);
    return JSON.parse(readFileSync(full, 'utf8'));
}

function run(cmd, { capture = false } = {}) {
    if (isDryRun) {
        console.log(`${label}$ ${cmd}`);
        return '';
    }
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
}

function runCapture(cmd) {
    if (isDryRun) {
        console.log(`${label}$ ${cmd}`);
        return '';
    }
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function fail(message) {
    console.error(`\n❌  ${message}\n`);
    process.exit(1);
}

function info(message) {
    console.log(`ℹ️   ${message}`);
}

function ok(message) {
    console.log(`✅  ${message}`);
}

// ---------------------------------------------------------------------------
// Safety checks
// ---------------------------------------------------------------------------

// 1. Must be on main
const currentBranch = runCapture('git rev-parse --abbrev-ref HEAD');
if (!isDryRun && currentBranch !== 'main') {
    fail(`Releases must be cut from main. You are on branch "${currentBranch}". Switch with: git checkout main`);
}
ok(`Branch: ${isDryRun ? '(dry-run, skipped)' : 'main'}`);

// 2. Read version from root plugin.json
const rootManifest = readJson('plugin.json');
const version = rootManifest.version;
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`Invalid or missing version in plugin.json: "${version}". Must be semver (e.g. 1.0.0).`);
}
const tag = `v${version}`;
info(`Version from plugin.json: ${version}  →  tag: ${tag}`);

// 3. Version must match .claude-plugin/plugin.json
const nestedManifest = readJson('.claude-plugin/plugin.json');
if (nestedManifest.version !== version) {
    fail(
        `Version drift detected.\n` +
        `  plugin.json:               ${version}\n` +
        `  .claude-plugin/plugin.json: ${nestedManifest.version}\n` +
        `Fix: update .claude-plugin/plugin.json to match.`,
    );
}
ok(`Version consistent across manifests (${version})`);

// 4. Run the layout validator
try {
    execSync('node scripts/validate-plugin-layout.mjs', { cwd: repoRoot, stdio: 'pipe' });
    ok('Plugin layout validation passed');
} catch (err) {
    fail(`Plugin layout validation failed:\n${err.stderr?.toString() ?? err.message}`);
}

// 5. Tag must not already exist on origin
try {
    const remoteTags = execSync('git ls-remote --tags origin', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
    });
    if (remoteTags.includes(`refs/tags/${tag}`)) {
        fail(`Tag ${tag} already exists on origin. Bump the version in plugin.json and .claude-plugin/plugin.json to create a new release.`);
    }
} catch (lsErr) {
    // ls-remote itself can fail if remote is unreachable — handled in check 7
}
ok(`Tag ${tag} does not yet exist on origin`);

// 6. Check for uncommitted changes — only plugin.json is expected to be dirty
const statusLines = execSync('git status --porcelain', {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
}).split('\n').filter((line) => line.length > 0);

const unexpectedChanges = statusLines.filter((line) => {
    const xy = line.substring(0, 2);
    const file = line.substring(3);
    // Untracked files won't be included in the commit unless explicitly staged — ignore them
    if (xy === '??') return false;
    // Allow plugin.json to be modified (staged, unstaged, or both)
    if (file === 'plugin.json') return false;
    return true;
});

if (unexpectedChanges.length > 0) {
    fail(
        `Unexpected staged/modified files found:\n${unexpectedChanges.join('\n')}\n\n` +
        `Either commit/stash them before releasing, or ensure only plugin.json is modified.`,
    );
}
ok('Working tree is clean (only plugin.json allowed to be modified)');

// 7. Remote must be reachable (only warn — push will fail explicitly if not)
try {
    execSync('git ls-remote --exit-code origin HEAD', {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
    });
    ok('Remote origin is reachable');
} catch {
    if (!isDryRun) {
        fail('Remote origin is not reachable. Check your network or GitHub credentials.');
    }
    info('(dry-run) Remote reachability check skipped');
}

// ---------------------------------------------------------------------------
// Confirmation prompt
// ---------------------------------------------------------------------------

console.log(`
─────────────────────────────────────────────
  Release plan for ${tag}${isDryRun ? '  [DRY RUN]' : ''}
─────────────────────────────────────────────
  git add plugin.json
  git commit -m "release: ${version}"
  git tag -a ${tag} -m "Release ${tag}"
  git branch -f stable main
  git push origin main ${tag} stable
─────────────────────────────────────────────
  Install URL (paste into Chat: Install Plugin from Source):
  https://github.com/tnduong/flag-sunset-plugin
  (requires 'stable' to be the default branch in GitHub)
─────────────────────────────────────────────
`);

if (!isDryRun) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    await new Promise((resolve) => {
        rl.question('Proceed? [y/N] ', (answer) => {
            rl.close();
            if (answer.trim().toLowerCase() !== 'y') {
                console.log('\nAborted. No changes were made.');
                process.exit(0);
            }
            resolve();
        });
    });
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

run('git add plugin.json');
run(`git commit -m "release: ${version}"`);
run(`git tag -a ${tag} -m "Release ${tag}"`);

// Advance the 'stable' branch to this commit so users installing from the
// base repo URL always get the latest approved release, not in-progress main.
run('git branch -f stable main');
run(`git push origin main ${tag} stable`);

console.log(`\n🎉  Released ${tag} successfully.`);
console.log(`    Install URL: https://github.com/tnduong/flag-sunset-plugin\n`);
console.log(`    ⚠️  Remember: set 'stable' as the default branch in GitHub repo settings.`);
console.log(`       Settings → Branches → Default branch → change to 'stable'\n`);
