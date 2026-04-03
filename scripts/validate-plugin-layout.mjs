import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const readJson = async (relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  const content = await readFile(absolutePath, 'utf8');
  return JSON.parse(content);
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message}. Expected "${expected}", received "${actual}".`);
  }
};

const assertExists = async (relativePath, message) => {
  try {
    await access(path.join(repoRoot, relativePath));
  } catch {
    throw new Error(`${message}. Missing path: ${relativePath}`);
  }
};

const rootManifest = await readJson('plugin.json');
const pluginManifest = await readJson('.claude-plugin/plugin.json');

// Version consistency — plugin.json (root) is the single source of truth
if (rootManifest.version !== pluginManifest.version) {
  throw new Error(
    `Version mismatch: plugin.json is "${rootManifest.version}" but .claude-plugin/plugin.json is "${pluginManifest.version}". Sync them before tagging.`
  );
}

assertEqual(pluginManifest.agents, '../agents', 'Nested plugin manifest must point to the repo-root agents folder');
assertEqual(pluginManifest.commands, '../commands', 'Nested plugin manifest must point to the repo-root commands folder');
assertEqual(pluginManifest.skills, '../skills', 'Nested plugin manifest must point to the repo-root skills folder');

await assertExists('agents', 'Repo-root agents folder must exist');
await assertExists('commands', 'Repo-root commands folder must exist');
await assertExists('skills', 'Repo-root skills folder must exist');
await assertExists('commands/flag-sunset.md', 'Flag sunset command file must exist');

console.log(`Plugin layout validation passed. Version: ${rootManifest.version}`);
