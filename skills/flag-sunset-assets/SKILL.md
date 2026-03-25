---
name: flag-sunset-assets
description: 'Internal workflow asset bundle for the shared flag-sunset prompt and executor agent. Contains the authoritative multi-step process, registry, and runtime policy for removing a LaunchDarkly flag by raw key across Nova, CoreApi, aya-talent-marketplace, and QaAutomation.'
argument-hint: 'The feature flag key to remove (for example: WFD-5487-display-strike-duplication)'
user-invocable: false
disable-model-invocation: true
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

The operator experience goal is documented in [operator-goal.md](./references/operator-goal.md).

## Runtime Policy

Print before Step 0:
`Execution mode locked: flag-sunset (branch creation required, no automated build/test).`

Print immediately after the execution-mode line:
- `Preflight start: validating local repository roots and workspace membership.`

Rules:
- No automated build or test commands.
- Prefer compact outputs at every step. Print only the minimum evidence required to resume, validate, and edit safely.
- Outside the mandatory workflow lines in this skill, keep progress updates to one short sentence per phase transition.
- Keep the operator goal in [operator-goal.md](./references/operator-goal.md) in force for all workflow changes.
- A workflow change is not complete if it reintroduces expected permission prompts after Step 1, unless the exception is explicitly documented and justified in the workflow assets.
- Immediately after Preflight item 1, print exactly:
   - `## >>>>>> USER ACTION MAY BE REQUIRED NEXT`
   - `VS Code may show a permission prompt during Preflight or Step 1. If it appears, approve it. If no prompt appears, Copilot will continue and you can work on something else.`
- If Step 1 becomes blocked on a permission or read, print exactly:
   - `## >>>>>> WAITING ON YOU`
- Prefer VS Code tools for prompts, reads, searches, and diagnostics: `vscode_askQuestions`, `read_file`, `grep_search`, and `get_errors` are the default choices unless a terminal command is strictly required.
- When a terminal command is required, use an OS-appropriate form for the active shell. On Windows PowerShell, prefer `Test-Path` and `Get-Date`; on macOS/Linux, prefer `test -d` and `date`.
- Preflight local-root validation must use an OS-appropriate terminal existence check on the resolved repository roots; do not use `list_dir`, `read_file`, or other VS Code filesystem tools on parent repository roots for existence checks.
- The default workflow must not use subagents after Step 1 begins. All permission, discovery, edit, and validation actions from Step 1 onward must remain in the main agent context.
- All file edits must remain in the main agent context.
- Machine-specific checkout roots must come from a user-owned config file outside the plugin, creating or updating that file after a confirmed first-run prompt when needed.
- The current VS Code workspace must include every project listed in [applications.md](./applications.md) before Step 0 may begin.
- Do not create, repair, or write configuration files inside the plugin directory.
- No file edits before branch proof is printed.
- Keep exactly one behavior path when unwrapping flags.
- Do not modify unrelated tests.
- Permission-sensitive validation and external-read approval steps in Step 1 must be executed serially, not in parallel.
- Do not batch any tool calls that may trigger a permission prompt; preflight root checks, app-root approvals, and file approvals must each run as single-step serial operations.
- Any canceled, dismissed, timed-out, or interrupted tool or permission result in Step 1 must be treated as `STEP_1_INCOMPLETE`, not as loss of Step 0 state.
- If a permission-bearing tool result is canceled, interrupted, or delayed unexpectedly, stop and print the current blocked item and latest resumable status line instead of remaining in a generic working state.
- After the user approves any permission prompt, immediately rerun the exact blocked tool call in the next agent action; never assume the interrupted call will resume on its own.
- If a permission-bearing tool call does not return a success result, do not continue with additional reads, searches, or reasoning-only progress messages in the same run state.
- Do not ask the Step 0 LaunchDarkly question until both preflight gates have passed and those pass lines have been printed.
- If any gate fails, stop and ask the user.

## Preflight

Before Step 0:
1. Read [applications.md](./applications.md).
   - Immediately after item 1, print exactly:
     - `## >>>>>> USER ACTION MAY BE REQUIRED NEXT`
     - `VS Code may show a permission prompt during Preflight or Step 1. If it appears, approve it. If no prompt appears, Copilot will continue and you can work on something else.`
2. Resolve machine-specific repository roots using one of these sources, in order:
   - macOS/Linux user config file: `~/.copilot/flag-sunset/local-roots.json`
   - Windows user config file: `%USERPROFILE%/.copilot/flag-sunset/local-roots.json`
   - a one-time prompt for the shared parent folder that contains both `Applications` and `aya-talent-marketplace`, followed by persisting the confirmed derived roots to the user config file
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
   - create or update the user-owned local-roots config file outside the plugin with the confirmed derived paths before continuing
   - if the config file cannot be written, stop and ask the user
4. If repository roots are available and valid, print:
   - `Local roots gate passed: [RepoA]=configured, [RepoB]=configured, ...`
   - validate root existence with an OS-appropriate terminal check before printing the pass line
5. Derive the effective local project path for every project row:
   - local repository root + `Path in Repo`
   - if `Path in Repo` is `./`, the effective local project path is the local repository root
6. Compare those derived project paths against the folders currently added to the active VS Code workspace.
   - do not use parent repository roots for workspace-gate filesystem reads; compare the effective project paths directly to the open workspace folders
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
- Capture Step 1 start time immediately on entry to Step 1 and retain it for the current run, including any `STEP_1_INCOMPLETE` resume.
- Maintain one resumable status line during Step 1:
   - `Step 1 status: roots_validated=[yes|no]; approved_apps=[AppA, AppB, ...]; approved_files=[FileA, FileB, ...]; next_pending=[Item|none]`
- When Step 1 is interrupted, also print one blocked-item line:
   - `Blocked item: [tool] [target]`
- Treat any canceled, dismissed, timed-out, or interrupted validation or read as `STEP_1_INCOMPLETE`.
- Print the status line after root validation, after the candidate app set is confirmed, after the concrete future work set is fully approved, and on interruption.
- On interruption, print `## >>>>>> WAITING ON YOU`, report the exact blocked item, repeat the latest status line verbatim, and stop.
- On resume after approval, rerun only the exact blocked tool call represented by `next_pending`; do not skip ahead or assume the earlier call completed.

Execution:
1. Capture start time immediately on Step 1 entry.
2. Read [applications.md](./applications.md).
3. Resolve the local repository roots for the current run.
   - if this requires reading the user-owned local-roots config outside the workspace, that read is permission-sensitive and must follow the interruption and retry rules above
4. Validate each unique local repository root with an OS-appropriate terminal existence check before any permission prompts.
5. Reuse the required `## >>>>>> USER ACTION MAY BE REQUIRED NEXT` banner that was printed during Preflight; do not print it again in Step 1.
6. Derive each app's effective local app path from the registry.
7. Confirm every effective app path is already present in the active VS Code workspace before any VS Code filesystem or search tool runs.
   - if any required effective app path is missing, stop with workspace-gate failure instead of attempting external reads
8. Seed only the minimum Step 1 approvals serially for the known workflow operations that are still required later:
   - `grep_search` on each workspace-confirmed effective app path
   - do not use `list_dir` as part of the default Step 1 permission envelope
   - do not run `get_errors` at app-root scope during Step 1
   - do not combine these approvals into a parallel batch
9. Using only the main agent, confirm the raw flag key in each app's definition target and determine the candidate app set.
10. Using only the main agent, run exact local usage discovery for the candidate apps with `grep_search` and build the concrete future work set:
    - definition files
    - usage files that may be edited
    - spec, test, or mock files only if they are proven relevant
   - files that may later be checked with `get_errors` in Step 5 if file-scoped diagnostics are needed
11. Read each file in the concrete future work set serially with `read_file` to trigger any remaining file-scoped approvals.
   - after each permission-bearing tool call, either continue immediately on success or stop and print the blocked item and latest Step 1 status on interruption
   - if the user approves a prompt after an interrupted call, retry that exact `read_file` call before doing anything else
12. Capture the current workspace repo branch.

To reduce unnecessary long-running continuation prompts from the chat host, do not emit additional Step 1 status lines for every workspace-confirmed app search or every individual file read while work is progressing normally.

Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`

## Step 2: Discover Impact

Use the exact local evidence gathered during Step 1. Do not use subagents after Step 1 begins.

Step 2A: Reuse Step 1 discovery
- reuse the candidate app set, identifier mapping, and concrete future work set produced during Step 1
- do not expand scope unless a Step 1 result is incomplete

Step 2B: Report local confirmation
- read [applications.md](./applications.md)
- resolve local roots for the current run
- derive a resolved app table as described in [search-strategy.md](./references/search-strategy.md)
- print the per-app status and evidence derived during Step 1

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
- zero new diagnostics caused by the edits, using `get_errors` scoped to edited files only when diagnostics are needed
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
