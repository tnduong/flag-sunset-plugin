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

const formatVersionedDescription = (prefix, version) => `${prefix} Installed version: ${version}.`;

const rootManifest = await readJson('plugin.json');
const pluginManifest = await readJson('.claude-plugin/plugin.json');
const marketplaceManifest = await readJson('.claude-plugin/marketplace.json');
const expectedRootDescription = formatVersionedDescription(
  'Shared LaunchDarkly feature-flag sunset workflow for VS Code Copilot.',
  rootManifest.version,
);
const expectedNestedDescription = formatVersionedDescription('Flag sunset workflow helpers.', rootManifest.version);

assertEqual(pluginManifest.version, rootManifest.version, 'Nested plugin manifest version must match root plugin.json version');
assertEqual(rootManifest.description, expectedRootDescription, 'Root plugin description must advertise the current version');
assertEqual(pluginManifest.description, expectedNestedDescription, 'Nested plugin description must advertise the current version');

assertEqual(pluginManifest.agents, '../agents', 'Nested plugin manifest must point to the repo-root agents folder');
assertEqual(pluginManifest.commands, '../commands', 'Nested plugin manifest must point to the repo-root commands folder');
assertEqual(pluginManifest.skills, '../skills', 'Nested plugin manifest must point to the repo-root skills folder');

const pluginEntry = marketplaceManifest.plugins?.[0];

if (!pluginEntry) {
  throw new Error('Marketplace manifest must contain at least one plugin entry.');
}

assertEqual(pluginEntry.source, '../', 'Marketplace manifest must point to the repo root as the plugin source');

await assertExists('agents', 'Repo-root agents folder must exist');
await assertExists('commands', 'Repo-root commands folder must exist');
await assertExists('skills', 'Repo-root skills folder must exist');
await assertExists('commands/flag-sunset.md', 'Flag sunset command file must exist');

console.log('Plugin layout validation passed.');
