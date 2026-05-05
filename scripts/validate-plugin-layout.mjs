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

const readText = async (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8');

const workflowDescriptionTemplate = 'FF Removal SKILL Workflow - version XXX';

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message}. Expected "${expected}", received "${actual}".`);
  }
};

const assertOneOf = (actual, expectedValues, message) => {
  if (!expectedValues.includes(actual)) {
    throw new Error(`${message}. Expected one of ${expectedValues.map((value) => `"${value}"`).join(', ')}, received "${actual}".`);
  }
};

const assertExists = async (relativePath, message) => {
  try {
    await access(path.join(repoRoot, relativePath));
  } catch {
    throw new Error(`${message}. Missing path: ${relativePath}`);
  }
};

const assertIncludes = (text, expected, message) => {
  if (!text.includes(expected)) {
    throw new Error(`${message}. Missing text: ${expected}`);
  }
};

const assertNotIncludes = (text, unexpected, message) => {
  if (text.includes(unexpected)) {
    throw new Error(`${message}. Unexpected text: ${unexpected}`);
  }
};

const formatWorkflowDescription = (version) => `FF Removal SKILL Workflow - version ${version}`;

const rootManifest = await readJson('plugin.json');
const pluginManifest = await readJson('.claude-plugin/plugin.json');
const marketplaceManifest = await readJson('.claude-plugin/marketplace.json');
const agentWrapper = await readText('agents/flag-sunset.agent.md');
const expectedRootDescription = formatWorkflowDescription(rootManifest.version);
const expectedNestedDescription = expectedRootDescription;
const expectedMarketplaceDescription = expectedRootDescription;

assertOneOf(pluginManifest.version, ['', rootManifest.version], 'Nested plugin manifest version must be empty or match root plugin.json version');
assertOneOf(rootManifest.description, [workflowDescriptionTemplate, expectedRootDescription], 'Root plugin description must use the workflow description template or advertise the current version');
assertOneOf(pluginManifest.description, ['', expectedNestedDescription], 'Nested plugin description must be empty or advertise the current version');

assertEqual(pluginManifest.agents, '../agents', 'Nested plugin manifest must point to the repo-root agents folder');
assertEqual(pluginManifest.commands, '../commands', 'Nested plugin manifest must point to the repo-root commands folder');
assertEqual(pluginManifest.skills, '../skills', 'Nested plugin manifest must point to the repo-root skills folder');

const pluginEntry = marketplaceManifest.plugins?.[0];

if (!pluginEntry) {
  throw new Error('Marketplace manifest must contain at least one plugin entry.');
}

assertOneOf(pluginEntry.version, ['', rootManifest.version], 'Marketplace manifest version must be empty or match root plugin.json version');
assertOneOf(pluginEntry.description, ['', expectedMarketplaceDescription], 'Marketplace manifest description must be empty or advertise the current version');
assertEqual(pluginEntry.source, '../', 'Marketplace manifest must point to the repo root as the plugin source');

await assertExists('agents', 'Repo-root agents folder must exist');
await assertExists('commands', 'Repo-root commands folder must exist');
await assertExists('skills', 'Repo-root skills folder must exist');
await assertExists('commands/flag-sunset.md', 'Flag sunset command file must exist');

assertIncludes(
  agentWrapper,
  'Do not run background terminals, watch tasks, dev servers, or other long-running terminal commands.',
  'Agent wrapper must block long-running terminal usage',
);
assertIncludes(
  agentWrapper,
  'Run allowed terminal commands serially in the main agent context and wait for completion before continuing.',
  'Agent wrapper must require serial terminal execution for allowed commands',
);
assertIncludes(
  agentWrapper,
  'If the workspace gate passes, execute `SKILL.md` exactly from Preflight through Step 6; do not restate or reorder workflow steps in this agent.',
  'Agent wrapper must delegate workflow ordering to SKILL.md',
);
assertNotIncludes(
  agentWrapper,
  'Do not run any terminal commands.',
  'Agent wrapper must not block workflow-required terminal commands',
);
assertNotIncludes(
  agentWrapper,
  'Show Prompt 3 from `skills/flag-sunset-assets/references/user-prompts.md`',
  'Agent wrapper must not duplicate Step 0 workflow sequencing',
);

console.log('Plugin layout validation passed.');
