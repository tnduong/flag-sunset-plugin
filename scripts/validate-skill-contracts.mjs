/**
 * validate-skill-contracts.mjs
 *
 * Static content validator for the flag-sunset prompt, agent, and shared skill.
 *
 * Each entry in `contracts` maps one scenario (see tests/workflow-regression-scenarios.md)
 * to the specific clauses in the relevant plugin file that make it pass. If a clause
 * is removed or reworded without updating these checks, this script exits non-zero
 * and CI fails.
 *
 * Add a new entry whenever a new scenario is added to tests/workflow-regression-scenarios.md.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const commandPath = path.join(repoRoot, 'commands/flag-sunset.md');
const agentPath = path.join(repoRoot, 'agents/flag-sunset.agent.md');
const skillPath = path.join(repoRoot, 'skills/flag-sunset-assets/SKILL.md');

const files = {
    command: await readFile(commandPath, 'utf8'),
    agent: await readFile(agentPath, 'utf8'),
    skill: await readFile(skillPath, 'utf8'),
};

// Each contract is: { file, scenario, checks: [{ label, text }] }
// `text` is an exact substring that must appear in the target file.
// Keep `text` as short as possible while remaining unambiguous.
const contracts = [
    {
        file: 'command',
        scenario: 'Scenario 4: missing workspace folder — command prompt fails closed',
        checks: [
            {
                label: 'Command enforces a workspace gate before loading workflow assets',
                text: 'Before loading any workflow asset, enforce the workspace gate with zero tool calls beyond reading `../skills/flag-sunset-assets/applications.md`',
            },
            {
                label: 'Command blocks SKILL.md loading before the workspace gate passes',
                text: 'Do not read `SKILL.md`.',
            },
            {
                label: 'Command blocks terminal fallback before the workspace gate passes',
                text: 'Do not run any terminal commands.',
            },
        ],
    },
    {
        file: 'agent',
        scenario: 'Scenario 4: missing workspace folder — custom agent still guards first',
        checks: [
            {
                label: 'Agent performs a zero-tool workspace gate first',
                text: '**Workspace gate (zero tool calls required).**',
            },
            {
                label: 'Agent blocks SKILL.md loading before the workspace gate passes',
                text: 'Do not load `SKILL.md`.',
            },
            {
                label: 'Agent blocks terminal commands before the workspace gate passes',
                text: 'Do not run any terminal commands.',
            },
        ],
    },
    {
        file: 'skill',
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
        file: 'skill',
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
        file: 'skill',
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
        file: 'skill',
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
        file: 'skill',
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
        file: 'skill',
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
        file: 'skill',
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
        file: 'skill',
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
    {
        file: 'skill',
        scenario: 'Scenario 9: subagent bypass — workspace-gate failure is terminal',
        checks: [
            {
                label: 'Subagent ban is unconditional and covers workspace-gate bypass',
                text: 'Do not invoke a subagent to access a missing workspace project or to bypass a workspace-gate failure',
            },
            {
                label: 'Workspace-gate failure explicitly blocks subagent bypass',
                text: 'do not invoke a subagent or use any external mechanism to access the missing project; a workspace-gate failure is terminal for this run',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 9: no new permission prompts after Step 1 on the normal path',
        checks: [
            {
                label: 'Operator goal prevents reintroducing expected permission prompts after Step 1',
                text: 'A workflow change is not complete if it reintroduces expected permission prompts after Step 1',
            },
            {
                label: 'Step 1 completion promises Step 2 will proceed without further approval prompts',
                text: 'Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 10: branch proof before edits',
        checks: [
            {
                label: 'No file edits occur before branch proof is printed',
                text: 'No file edits before branch proof is printed.',
            },
            {
                label: 'Branch proof is required before edits',
                text: 'If branch proof cannot be established, stop with no edits.',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 11: static validation remains file-scoped and build-free',
        checks: [
            {
                label: 'Workflow is static-validation only',
                text: 'Run static validation only.',
            },
            {
                label: 'Diagnostics are scoped to edited files only when needed',
                text: 'using `get_errors` scoped to edited files only when diagnostics are needed',
            },
            {
                label: 'Automated builds and tests remain forbidden',
                text: 'Do not run automated build or test commands.',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 12: targeted-read completeness including a trailing match near end-of-file',
        checks: [
            {
                label: 'Every grep-discovered line must fall within a read range',
                text: 'Every line number returned by `grep_search` for a file must fall within a read range.',
            },
            {
                label: 'Late matches outside merged ranges force range expansion',
                text: 'If any grep-discovered line falls outside all ranges after merging, expand the nearest range to include it.',
            },
            {
                label: 'All ranges for a file are read before moving on',
                text: 'Read all ranges for a file before moving to the next file.',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 13: paired spec file enters scope when source cleanup implies stale test wiring',
        checks: [
            {
                label: 'Paired Angular spec files are added to the future work set for mirrored cleanup',
                text: 'include the co-located `*.spec.ts` file in the concrete future work set for mirrored cleanup review',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 14: minimal mirrored unit-test cleanup',
        checks: [
            {
                label: 'Only matching stale unit-test setup is removed',
                text: 'remove only the matching stale import/provider/mock/setup there; do not remove broader test scaffolding that is still present in the source file',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 15: still-used spec imports are retained',
        checks: [
            {
                label: 'Spec imports are kept when their symbols still have references',
                text: 'verify that the imported symbol has no other references anywhere else in that spec; if the symbol is still used for unrelated setup or assertions, keep the import',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 16: winning-path tests are preserved and normalized',
        checks: [
            {
                label: 'Losing-path tests are removed while winning-path tests are kept and renamed',
                text: 'remove only the losing-path test; rename and keep the winning-path test without the "when FF is enabled" qualifier',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 17: compound-condition cleanup removes only the targeted flag term',
        checks: [
            {
                label: 'Compound-condition cleanup preserves unrelated condition terms',
                text: 'eliminate only the removed flag\'s sub-expression and leave other flags intact',
            },
            {
                label: 'Compound-condition cleanup forbids substituting the removed flag\'s production value',
                text: 'never substitute the removed flag\'s production value into a compound condition that contains other flags',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 18: pre-edit freshness check guards against stale discovery evidence',
        checks: [
            {
                label: 'Freshness check re-reads anchored ranges before any edits',
                text: 're-read the anchored line ranges for every file in the concrete future work set',
            },
            {
                label: 'Freshness pass prints per-file confirmation',
                text: 'Freshness check passed: [N] files validated; proceeding to edits.',
            },
        ],
    },
];

let passed = 0;
let failed = 0;

for (const { file, scenario, checks } of contracts) {
    console.log(`\n${scenario} [${file}]`);
    const source = files[file];

    for (const { label, text } of checks) {
        if (source.includes(text)) {
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
        '\nPlugin contract validation FAILED. One or more behavioral contracts are no longer expressed in the prompt, agent, or shared skill.\n' +
        'Update the relevant source file to restore the missing clauses, or update the contract text in this file if the wording was intentionally changed.'
    );
    process.exit(1);
}

console.log('Plugin contract validation passed.');
