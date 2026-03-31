/**
 * validate-skill-contracts.mjs
 *
 * Static content validator for skills/flag-sunset-assets/SKILL.md.
 *
 * Each entry in `contracts` maps one scenario (see tests/validate-plugin-contract.md)
 * to the specific clauses in SKILL.md that make it pass. If a clause is removed or
 * reworded without updating these checks, this script exits non-zero and CI fails.
 *
 * Add a new entry whenever a new scenario is added to tests/validate-plugin-contract.md.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const skillPath = path.join(repoRoot, 'skills/flag-sunset-assets/SKILL.md');
const skill = await readFile(skillPath, 'utf8');

// Each contract is: { scenario, checks: [{ label, text }] }
// `text` is an exact substring that must appear in SKILL.md.
// Keep `text` as short as possible while remaining unambiguous.
const contracts = [
    {
        scenario: 'Scenario 1: brand new user — first-run setup',
        checks: [
            {
                label: 'Asks for shared parent folder when no config exists',
                text: 'a one-time prompt for the shared parent folder',
            },
            {
                label: 'Asks user to confirm derived paths before continuing',
                text: 'prompt the user to confirm the derived paths before continuing',
            },
            {
                label: 'Creates workspace-local local-roots.json after confirmation',
                text: 'create or update the workspace-local',
            },
            {
                label: 'Step 0 gated until both preflight gates pass',
                text: 'both preflight gates have passed',
            },
        ],
    },
    {
        scenario: 'Scenario 2: existing user with valid local-roots — setup is skipped',
        checks: [
            {
                label: 'Workspace-local config is preferred before home-directory fallback',
                text: 'Prefer a workspace-local `local-roots.json` file on workspace-confirmed paths before falling back to the user-owned home-directory file',
            },
            {
                label: 'Home-directory config is read with OS-appropriate terminal command when outside workspace',
                text: 'when the selected config file is outside the active workspace, read it with an OS-appropriate terminal command instead of a VS Code filesystem tool',
            },
        ],
    },
    {
        scenario: 'Scenario 3: stale local-roots — path points to missing repo',
        checks: [
            {
                label: 'Root existence validated with OS-appropriate terminal check',
                text: 'OS-appropriate terminal existence check',
            },
            {
                label: 'Workflow stops before Step 0 if any gate fails',
                text: 'If any gate fails, stop and ask the user',
            },
        ],
    },
    {
        scenario: 'Scenario 4: missing workspace folder — workspace gate fails early',
        checks: [
            {
                label: 'Missing app path triggers workspace-gate failure, not external reads',
                text: 'if any required effective app path is missing, stop with workspace-gate failure instead of attempting external reads',
            },
            {
                label: 'Workspace gate failure message is printed and workflow stops',
                text: 'Workspace gate failed',
            },
        ],
    },
    {
        scenario: 'Scenario 5: non-default approval selection — resume path works correctly',
        checks: [
            {
                label: 'After approval, blocked tool call is retried exactly once before anything else',
                text: 'retry that exact `read_file` call once before doing anything else',
            },
            {
                label: 'Resume path reruns only the exact blocked tool call',
                text: 'On resume after approval, rerun only the exact blocked tool call represented by',
            },
        ],
    },
    {
        scenario: 'Scenario 6: explicit deny or dismiss — clean stop with no retry loop',
        checks: [
            {
                label: 'Canceled/dismissed/timed-out result is treated as STEP_1_INCOMPLETE',
                text: 'canceled, dismissed, timed-out, or interrupted',
            },
            {
                label: 'Workflow stops and reports blocked item on interruption instead of looping',
                text: 'stop and print the current blocked item and latest resumable status line',
            },
        ],
    },
    {
        scenario: 'Scenario 7: bounded retry — exactly one automatic retry per blocked item',
        checks: [
            {
                label: 'Automatic retry is tracked as a single allowance per next_pending item',
                text: 'Track one automatic retry allowance for the current `next_pending` item',
            },
            {
                label: 'Second failure stops and asks user instead of looping automatically',
                text: 'If the same `next_pending` item fails again after that automatic retry, stop and ask',
            },
            {
                label: 'Explicit rule limits automatic retry to once per blocked item per run',
                text: 'Do not automatically retry the same blocked item more than once in the same run',
            },
        ],
    },
    {
        scenario: 'Scenario 8: Windows path variant — cross-platform support',
        checks: [
            {
                label: 'Windows user config path uses %USERPROFILE%',
                text: '%USERPROFILE%/.copilot/flag-sunset/local-roots.json',
            },
            {
                label: 'Windows PowerShell uses Test-Path for existence checks',
                text: 'On Windows PowerShell, prefer `Test-Path`',
            },
        ],
    },
];

let passed = 0;
let failed = 0;

for (const { scenario, checks } of contracts) {
    console.log(`\n${scenario}`);
    for (const { label, text } of checks) {
        if (skill.includes(text)) {
            console.log(`  PASS  ${label}`);
            passed++;
        } else {
            console.log(`  FAIL  ${label}`);
            console.log(`        Missing: "${text}"`);
            failed++;
        }
    }
}

console.log(`\n${passed} passed, ${failed} failed.`);

if (failed > 0) {
    console.error(
        '\nSkill contract validation FAILED. One or more behavioral contracts are no longer expressed in SKILL.md.\n' +
        'Update SKILL.md to restore the missing clauses, or update the contract text in this file if the wording was intentionally changed.'
    );
    process.exit(1);
}

console.log('Skill contract validation passed.');
