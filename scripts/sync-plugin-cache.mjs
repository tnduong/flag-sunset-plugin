import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const mode = (process.argv[2] || 'sync').toLowerCase();

if (!['sync', 'verify'].includes(mode)) {
  console.error('Usage: node scripts/sync-plugin-cache.mjs [sync|verify]');
  process.exit(2);
}

const defaultCacheRoot = path.join(
  os.homedir(),
  '.vscode',
  'agent-plugins',
  'github.com',
  'tnduong',
  'flag-sunset-plugin'
);

const cacheRoot = process.env.FLAG_SUNSET_PLUGIN_CACHE_PATH || defaultCacheRoot;

// Explicit allowlist prevents accidental broad copies and keeps source as single truth.
const ALLOWLIST = [
  'onboarding/ff-removal.code-workspace',
  'onboarding/ff-removal.macos.code-workspace',
];

const hashFile = async (filePath) => {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
};

const ensureReadable = async (filePath, label) => {
  try {
    await access(filePath, constants.R_OK);
  } catch {
    throw new Error(`${label} is missing or not readable: ${filePath}`);
  }
};

const syncOne = async (relativePath) => {
  const sourcePath = path.join(repoRoot, relativePath);
  const cachePath = path.join(cacheRoot, relativePath);

  await ensureReadable(sourcePath, 'Source file');

  if (mode === 'sync') {
    await mkdir(path.dirname(cachePath), { recursive: true });
    await copyFile(sourcePath, cachePath);
  }

  await ensureReadable(cachePath, 'Cache file');

  const sourceHash = await hashFile(sourcePath);
  const cacheHash = await hashFile(cachePath);
  const inSync = sourceHash === cacheHash;

  if (!inSync) {
    throw new Error(`Hash mismatch for ${relativePath}`);
  }

  console.log(`${relativePath}: OK (${sourceHash.slice(0, 12)})`);
};

try {
  console.log(`Mode: ${mode}`);
  console.log(`Source root: ${repoRoot}`);
  console.log(`Cache root: ${cacheRoot}`);

  for (const relativePath of ALLOWLIST) {
    await syncOne(relativePath);
  }

  console.log('Done: source and plugin cache are synchronized for allowlisted files.');
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
}
