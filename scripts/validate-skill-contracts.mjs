/**
 * validate-skill-contracts.mjs
 *
 * Static content validator for the flag-sunset prompt, agent, and shared skill.
 *
 * Each entry in `contracts` maps one scenario from the deployment/readiness and
 * regression checklists (see tests/validate-plugin-contract.md and
 * tests/workflow-regression-scenarios.md)
 * to the specific clauses in the relevant plugin file that make it pass. If a clause
 * is removed or reworded without updating these checks, this script exits non-zero
 * and CI fails.
 *
 * Add or update entries whenever either checklist changes.
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
const preflightPath = path.join(repoRoot, 'skills/flag-sunset-assets/references/preflight-step1.md');
const operatorGoalPath = path.join(repoRoot, 'skills/flag-sunset-assets/references/operator-goal.md');

const files = {
    command: await readFile(commandPath, 'utf8'),
    agent: await readFile(agentPath, 'utf8'),
    skill: await readFile(skillPath, 'utf8'),
    preflight: await readFile(preflightPath, 'utf8'),
    operatorGoal: await readFile(operatorGoalPath, 'utf8'),
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
                label: 'Command is intentionally thin and routes to the execution agent',
                text: 'Route this request to the configured custom agent.',
            },
            {
                label: 'Command delegates gating and workflow ownership to the agent and assets',
                text: 'The command is intentionally thin. Workspace gating, workflow preflight, and execution rules are owned by the agent and skill assets.',
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
        file: 'preflight',
        scenario: 'Scenario 1: brand new user — first-run setup',
        checks: [
            {
                label: 'Asks for shared parent folder when no config exists',
                text: 'a one-time prompt for the shared parent folder',
            },
            {
                label: 'Asks user to confirm derived paths before continuing',
                text: 'show Prompt 2 from [user-prompts.md](./user-prompts.md#prompt-2-derived-paths-confirmation-preflight) to confirm derived paths before continuing',
            },
            {
                label: 'Creates workspace-local local-roots.json after confirmation',
                text: 'create or update the workspace-local',
            },
            {
                label: 'First-run parent-folder question uses canonical Prompt 1',
                text: 'show Prompt 1 from [user-prompts.md](./user-prompts.md#prompt-1-parent-folder-input-preflight)',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 1: brand new user — first-run setup',
        checks: [
            {
                label: 'Step 0 gated until all required preflight pass lines are printed',
                text: 'all required preflight pass lines were printed',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 2: existing user with valid local-roots — setup is skipped',
        checks: [
            {
                label: 'Local-roots resolution is centralized in preflight procedure',
                text: 'Local-roots resolution is defined only in [preflight-step1.md](./references/preflight-step1.md#preflight). Do not use alternate config locations outside that procedure.',
            },
            {
                label: 'Workflow questions use VS Code prompt UI with fallback behavior',
                text: 'Use VS Code prompt UI for workflow questions that require a user reply',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 2: existing user with valid local-roots — setup is skipped',
        checks: [
            {
                label: 'Missing or invalid workspace-local config triggers setup prompts',
                text: 'if this file is missing, unreadable, invalid JSON, or missing required local root keys, treat it as not usable and continue to item 4',
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
        file: 'preflight',
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
        file: 'preflight',
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
        file: 'preflight',
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
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 7: bounded retry — exactly one automatic retry per blocked item',
        checks: [
            {
                label: 'Explicit rule limits automatic retry to once per blocked item per run',
                text: 'Do not automatically retry the same blocked item more than once in the same run',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 8: Windows path variant — cross-platform support',
        checks: [
            {
                label: 'Workspace-local config path is explicit under Nova workspace folder',
                text: 'path: `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 8: Windows path variant — cross-platform support',
        checks: [
            {
                label: 'Windows PowerShell uses Test-Path for existence checks',
                text: 'On Windows PowerShell, prefer `Test-Path`',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 4: missing workspace folder — workspace gate failure is terminal',
        checks: [
            {
                label: 'Workspace-gate failure explicitly blocks subagent bypass',
                text: 'do not invoke a subagent or use any external mechanism to access the missing project; a workspace-gate failure is terminal for this run',
            },
        ],
    },
    {
        file: 'operatorGoal',
        scenario: 'Scenario 9: no new permission prompts after Step 1 on the normal path',
        checks: [
            {
                label: 'Normal execution should continue unattended after Step 1',
                text: 'After Step 1 completes, the agent should be able to continue unattended',
            },
            {
                label: 'Any expected post-Step-1 prompt is treated as regression unless justified',
                text: 'A workflow change is not complete if it reintroduces expected permission prompts after Step 1',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 10: branch proof before edits',
        checks: [
            {
                label: 'Edits are blocked until branch proof exists',
                text: 'No file edits before branch proof is printed.',
            },
            {
                label: 'Step 3 prints branch proof for each affected repository',
                text: 'Print branch proof for each affected repository.',
            },
            {
                label: 'Branch proof failure stops with no edits',
                text: 'If branch proof cannot be established, stop with no edits.',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 11: static validation remains file-scoped and build-free',
        checks: [
            {
                label: 'Step 5 is static validation only',
                text: 'Run static validation only.',
            },
            {
                label: 'Diagnostics are scoped to edited files when needed',
                text: 'using `get_errors` scoped to edited files only when diagnostics are needed',
            },
            {
                label: 'Automated build and test commands remain forbidden',
                text: 'Do not run automated build or test commands.',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 12: targeted-read completeness including a trailing match near end-of-file',
        checks: [
            {
                label: 'Grep-discovered lines are the authoritative completeness list',
                text: 'The grep-discovered line numbers from item 12 are the authoritative completeness list.',
            },
            {
                label: 'Ranges must be expanded to include any uncovered match lines',
                text: 'expand the nearest range to include it',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 12B: Step 10 completion gate remains mandatory and fail-closed',
        checks: [
            {
                label: 'Step 10 gate requires app-scoped identifier file-list search from exact resolved scope',
                text: 'Discovery completion gate: for each `MATCH` app, run one extension-filtered identifier file-list search from exactly that app\'s resolved scope (`Search Scope` when present, otherwise the effective app path).',
            },
            {
                label: 'Invalid search root must stop with explicit STEP_1_INCOMPLETE message',
                text: 'If the search runs from any other root, print `STEP_1_INCOMPLETE: invalid search scope for [app]=[actual root]` and stop.',
            },
            {
                label: 'Untracked identifier matches must stop with explicit STEP_1_INCOMPLETE message',
                text: 'If any matched file is not in the concrete future work set, print `STEP_1_INCOMPLETE: untracked matches found for [app]=[untracked files]` and stop.',
            },
            {
                label: 'Step 10 gate must pass for all MATCH apps before continuing to item 11',
                text: 'Proceed to item 13 only when all `MATCH` apps pass both checks.',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 13: paired spec file enters scope when source cleanup implies stale test wiring',
        checks: [
            {
                label: 'Co-located spec file enters the future work set for mirrored cleanup review',
                text: 'include the co-located `*.spec.ts` file in the concrete future work set for mirrored cleanup review',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 14: minimal mirrored unit-test cleanup',
        checks: [
            {
                label: 'Only the mirrored stale test wiring is removed',
                text: 'remove only the matching stale import/provider/mock/setup there; do not remove broader test scaffolding that is still present in the source file',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 15: still-used spec imports are retained',
        checks: [
            {
                label: 'Spec imports are checked for remaining references before removal',
                text: 'verify that the imported symbol has no other references anywhere else in that spec',
            },
            {
                label: 'Still-used spec imports are kept',
                text: 'keep the import',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 16: winning-path tests are preserved and normalized',
        checks: [
            {
                label: 'Losing-path test block must be deleted',
                text: 'you MUST delete the entire losing-path test method/block',
            },
            {
                label: 'Winning-path test must be renamed to non-FF qualifier form',
                text: 'after deleting the losing-path test, you MUST rename the winning-path test to remove the "when FF is enabled" / "WhenFeatureFlagEnabled" qualifier',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 17: compound-condition cleanup removes only the targeted flag term',
        checks: [
            {
                label: 'Compound-condition cleanup preserves the unrelated condition terms',
                text: '**compound conditions:** when the removed flag appears as one term in a compound condition',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 18: Step 0 reply handling — continue only on 1 or 2',
        checks: [
            {
                label: 'Step 0 uses canonical Prompt 3',
                text: 'Show Prompt 3 from [user-prompts.md](./references/user-prompts.md#prompt-3-launchdarkly-final-state-step-0).',
            },
            {
                label: 'Step 0 continues only on replies 1 or 2',
                text: 'Continue only if the next user reply in this run is exactly `1` or `2`.',
            },
            {
                label: 'Step 0 invalid or missing reply stops for retry-or-abort',
                text: 'If the next user reply is anything else, or no reply arrives, stop and ask whether to retry or abort.',
            },
        ],
    },
    {
        file: 'agent',
        scenario: 'Scenario 18: Step 0 reply handling — continue only on 1 or 2',
        checks: [
            {
                label: 'Agent uses canonical Prompt 3 and the next user reply for Step 0',
                text: 'Show Prompt 3 from `skills/flag-sunset-assets/references/user-prompts.md` and use only the next user reply in this run.',
            },
            {
                label: 'Agent blocks Step 1 without a valid Step 0 reply',
                text: 'without a valid Step 0 reply of `1` or `2` captured in the current run',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 19: Step 1 search prefers rg when available',
        checks: [
            {
                label: 'Step 1 prefers rg for definition-file confirmation',
                text: 'prefer `rg -n --fixed-strings` when available',
            },
            {
                label: 'Step 1 prefers rg for usage discovery',
                text: 'prefer `rg -n --fixed-strings` with extension globs when available',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 20: fallback searches stay extension-filtered and avoid broad PowerShell scans',
        checks: [
            {
                label: 'Step 1 keeps searches extension-filtered by app language',
                text: 'file extensions by app language: Angular apps (Nova, aya-talent-marketplace) -> `*.ts`, `*.html`, plus `*.spec.ts` only when the spec is already proven relevant; CoreApi -> `*.cs`; QaAutomation -> `*.feature`',
            },
            {
                label: 'Windows fallback uses Select-String with explicit extension patterns',
                text: 'use `Select-String -Path "[path1]\\**\\*.ext1","[path1]\\**\\*.ext2",... -Pattern "IDENTIFIER"`',
            },
            {
                label: 'Broad Get-ChildItem whole-tree scans are explicitly blocked',
                text: 'do not use `Get-ChildItem ... -Recurse -File` pipelines for usage discovery',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 21: definition targets resolve from effective app paths before PATH_ERROR classification',
        checks: [
            {
                label: 'Definition-file confirmation resolves targets from effective app paths, not repository root alone',
                text: 'resolve each definition target as: `[effective app path] + [Flag Definition File]`; do not resolve definition targets from repository root alone',
            },
            {
                label: 'PATH_ERROR is allowed only after exact derived definition target validation fails',
                text: 'classify an app as `PATH_ERROR` only after validating that exact derived definition target path is missing or unreadable',
            },
        ],
    },
    {
        file: 'preflight',
        scenario: 'Scenario 22: dirty working tree gate blocks Step 1 discovery when repositories are not clean',
        checks: [
            {
                label: 'Dirty working tree gate runs after main freshness and before Step 1 discovery',
                text: 'If the main freshness gate passed, validate working-tree cleanliness for each unique repository listed in [applications.md](../applications.md) before discovery',
            },
            {
                label: 'Clean repositories continue without an extra clean-status line',
                text: 'if every repository is clean, continue to discovery with no additional clean-status line',
            },
            {
                label: 'Dirty working tree gate has explicit fail line and clean-up instruction',
                text: '`Dirty working tree gate failed: [RepoX]=dirty`',
            },
            {
                label: 'Dirty working tree gate fail path stops before Step 1 discovery edits',
                text: 'stop immediately with no edits',
            },
        ],
    },
    {
        file: 'skill',
        scenario: 'Scenario 22: dirty working tree validation is required at Step 1 entry before discovery',
        checks: [
            {
                label: 'Top-level runtime policy requires Step 1 git status checks before discovery',
                text: 'Step 1 entry must run main freshness and working-tree validation on each resolved repository root with OS-appropriate terminal git commands before discovery may begin.',
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
