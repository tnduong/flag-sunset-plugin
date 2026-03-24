---
name: flag-sunset
description: 'Workflow to sunset a feature flag across apps and repos with mandatory branch setup and static validation only. Use when removing LaunchDarkly flags by raw key across Nova, CoreApi, aya-talent-marketplace, and QaAutomation.'
argument-hint: 'The feature flag key to remove (for example: WFD-5487-display-strike-duplication)'
---

# Flag Sunset

## Scope Rule

This workflow is the required entry point for any feature-flag removal request where the user provides a raw flag key or asks to remove a LaunchDarkly flag.

- Always perform cross-repo discovery against every app listed in [applications.md](./applications.md).
- Do not start from an app-specific removal skill when the request is expressed as a flag key.
- App-specific removal skills may only be used after this workflow proves the impact is limited to one app and the user explicitly narrows scope.
- The required apps are the rows currently defined in [applications.md](./applications.md).

## Quick Start

```text
/flag-sunset [FLAG_KEY]
```

## User Guide

Operator onboarding, prerequisites, prompts, and workflow notes are documented in [README.md](./README.md).

## Runtime Policy

Print before Step 0:
`Execution mode locked: flag-sunset (branch creation required, no automated build/test).`

Print immediately after the execution-mode line:
- `Preflight start: validating local repository roots and workspace membership.`

Rules:
- No automated build or test commands.
- Prefer compact outputs at every step. Print only the minimum evidence required to resume, validate, and edit safely.
- Outside the mandatory workflow lines in this skill, keep progress updates to one short sentence per phase transition.
- Prefer VS Code tools for prompts, reads, searches, and diagnostics: `vscode_askQuestions`, `read_file`, `grep_search`, and `get_errors` are the default choices unless a terminal command is strictly required.
- When a terminal command is required, use an OS-appropriate form for the active shell. On Windows PowerShell, prefer `Test-Path` and `Get-Date`; on macOS/Linux, prefer `test -d` and `date`.
- `search_subagent` may be used in Step 2 for read-only discovery. It must not make edits.
- All file edits must remain in the main agent context.
- Machine-specific checkout roots must come from either a user-owned config file outside the plugin or a one-time prompt in the current session.
- The current VS Code workspace must include every project listed in [applications.md](./applications.md) before Step 0 may begin.
- Do not create, repair, or write configuration files inside the plugin directory.
- No file edits before branch proof is printed.
- Keep exactly one behavior path when unwrapping flags.
- Do not modify unrelated tests.
- Permission-sensitive validation and external-read approval steps in Step 1 must be executed serially, not in parallel.
- Any canceled, dismissed, timed-out, or interrupted tool or permission result in Step 1 must be treated as `STEP_1_INCOMPLETE`, not as loss of Step 0 state.
- Do not ask the Step 0 LaunchDarkly question until both preflight gates have passed and those pass lines have been printed.
- If any gate fails, stop and ask the user.

## Preflight

Before Step 0:
1. Read [applications.md](./applications.md).
2. Resolve machine-specific repository roots using one of these sources, in order:
   - macOS/Linux user config file: `~/.copilot/flag-sunset/local-roots.json`
   - Windows user config file: `%USERPROFILE%/.copilot/flag-sunset/local-roots.json`
   - a one-time prompt for the shared parent folder that contains both `Applications` and `aya-talent-marketplace`
3. If no usable config file is found:
   - ask one `vscode_askQuestions` free-text prompt for the shared parent folder
   - when the active OS is macOS, use this exact prompt text:
     - `Provide the macOS parent folder that contains both Applications and aya-talent-marketplace.`
   - when the active OS is Windows, use this exact prompt text:
     - `Provide the Windows parent folder that contains both Applications and aya-talent-marketplace.`
   - derive:
     - `AyaHealthcare/Applications` = `[PARENT]/Applications`
     - `AyaHealthcare/aya-talent-marketplace` = `[PARENT]/aya-talent-marketplace`
   - prompt the user to confirm the derived paths before continuing
   - if the confirmation is not approved, stop immediately with no Step 0 prompt and no edits
   - keep the derived paths in memory for the current run only
4. If repository roots are available and valid, print:
   - `Local roots gate passed: [RepoA]=configured, [RepoB]=configured, ...`
5. Derive the effective local project path for every project row:
   - local repository root + `Path in Repo`
   - if `Path in Repo` is `./`, the effective local project path is the local repository root
6. Compare those derived project paths against the folders currently added to the active VS Code workspace.
7. If every project path is present in the workspace, print:
   - `Workspace gate passed: [ProjectA]=present, [ProjectB]=present, ...`
8. If any project path is missing from the workspace, print:
   - `Workspace gate failed: missing [ProjectA]=[PathA], [ProjectB]=[PathB], ...`
   - `Open or create a VS Code workspace that includes every project listed in applications.md, then rerun flag-sunset.`
   - stop immediately with no Step 0 prompt and no edits

## Step 0: LaunchDarkly Final State

- Start Step 0 only after both preflight pass lines were printed in the current run.
- Run one `vscode_askQuestions` prompt with options:
  1. `FF is TRUE on PROD + YES to continue with FF removal`
  2. `FF is FALSE on PROD + YES to continue with FF removal (entire feature removal)`
  3. `NO - Quit`
- Default to option 1.
- Once the Step 0 selection is captured for the current run, it remains valid until the run ends or the user explicitly changes it.
- If option 3 is selected, stop with no edits.

Required line before Step 1:
`Step 0 complete: LaunchDarkly PROD state captured; proceeding to Step 1 permissions.`

## Step 1: Permissions and Start Clock

State model:
- Maintain one resumable status line during Step 1:
  - `Step 1 status: roots_validated=[yes|no]; approved_files=[FileA, FileB, ...]; next_pending=[Item|none]`
- Treat any canceled, dismissed, timed-out, or interrupted validation or read as `STEP_1_INCOMPLETE`.
- Print the status line after root validation, after each successful external definition-file read, and on interruption.
- On interruption, stop, report the exact blocked item, repeat the latest status line verbatim, and resume Step 1 only from `next_pending`.

Execution:
1. Read [applications.md](./applications.md).
2. Resolve the local repository roots for the current run.
3. Validate each unique local repository root before any permission prompts.
4. Build the external definition-file read list from the registry.
5. Read each external app's derived definition-file path serially to trigger approvals.
6. Record each successful file as approved.
7. Immediately after the final permission prompt is answered, capture start time.
8. Capture the current workspace repo branch.

Required line before Step 2:
`Step 1 complete: all permission prompts approved; proceeding to Step 2.`

## Step 2: Discover Impact

Use `#search_code` exact-match first to prefilter affected apps and repositories. Then confirm locally before any edits. If `#search_code` is unavailable, incomplete, or inconsistent with local evidence, fall back to the local workflow in [search-strategy.md](./references/search-strategy.md).

Step 2A: Remote prefilter
- run `#search_code` with the exact raw flag key string
- use the result only to identify candidate apps and likely definition files
- prefer exact matches in feature-flag definition files over tests, docs, comments, or mocks
- do not treat `#search_code` as edit proof

Step 2B: Local confirmation
- read [applications.md](./applications.md)
- resolve local roots for the current run
- derive a resolved app table as described in [search-strategy.md](./references/search-strategy.md)
- confirm the raw flag key in each candidate app's local definition target
- extract the exact constant or enum member name from each locally confirmed app

Step 2C: Local usage discovery
- only after local confirmation, invoke `search_subagent` or exact local search for the confirmed apps
- pass the resolved app table into the subagent prompt instead of asking the subagent to infer paths
- use the prompt contract in [search-subagent-template.md](./references/search-subagent-template.md)

Minimum required output from Step 2:
- registry-wide app mapping
- per confirmed app status: `MATCH`, `NO_MATCH`, `PATH_ERROR`, or `READ_ERROR`
- exact identifier mapping for confirmed apps
- definition-file path evidence from local confirmation
- usage files with line numbers only for confirmed apps
- spec, test, or mock files with line numbers only for confirmed apps

Print the full per-app mapping before any usage scan:
- `Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], [AppB]=[IdentifierB|NO_MATCH], ...`

If the mapping cannot be completed, stop and ask the user.

## Step 3: Branch Gate

Before any edits:
1. Determine the affected repositories.
2. Create or switch each affected repository to `[FLAG_KEY]-ff-removal`.
3. Print branch proof for each affected repository.
4. If branch proof cannot be established, stop with no edits.

## Step 4: Edit Scope

Edit only files proven by Step 2.

Rules:
- remove the flag definition and direct usages for affected apps only
- keep exactly one behavior path after removal
- preserve existing patterns unless the flag itself required branching logic
- do not modify unrelated tests or neighboring code paths
- keep changes minimal and deterministic

## Step 5: Static Validation Only

Run static validation only.

Minimum checks:
- zero remaining references to the removed flag in the edited scope
- zero new diagnostics caused by the edits
- clean imports and clean structure after dead-code removal

If validation fails, fix the issue and rerun Step 5. Do not run automated build or test commands.

## Step 6: Final Output

Print a compact summary containing:
- flag key
- affected repositories and branches
- modified files
- static validation result
- elapsed time
- reminder that manual build and unit-test verification is still required
- one OS-appropriate revert instruction
