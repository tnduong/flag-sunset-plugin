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

Detailed Preflight and Step 1 procedures are documented in [preflight-step1.md](./references/preflight-step1.md).

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
- Use plain chat prompts for workflow questions that require a user reply. `read_file` and `get_errors` remain the default VS Code tools on workspace-confirmed paths. Prefer `rg` when available; otherwise use OS-appropriate terminal search commands with app-scoped, extension-filtered paths for definition-file and usage searches.
- Prefer a workspace-local `local-roots.json` file on workspace-confirmed paths before falling back to the user-owned home-directory file.
- Use OS-appropriate terminal commands for reading or writing the user-owned home-directory `local-roots.json` file and for root validation whenever the target is outside the active workspace.
- When a terminal command is required, use an OS-appropriate form for the active shell. On Windows PowerShell, prefer `Test-Path` and `Get-Date`; on macOS/Linux, prefer `test -d` and `date`.
- Preflight local-root validation must use an OS-appropriate terminal existence check on the resolved repository roots; do not use `list_dir`, `read_file`, or other VS Code filesystem tools on parent repository roots for existence checks.
- The default workflow must not use subagents at any point in the run. All permission, discovery, edit, and validation actions must remain in the main agent context. Do not invoke a subagent to access a missing workspace project or to bypass a workspace-gate failure.
- All file edits must remain in the main agent context.
- Machine-specific checkout roots must not be stored in the plugin.
- Prefer storing machine-specific checkout roots in a workspace-local config file at `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder, ignored by Git.
- Preserve support for the user-owned home-directory config file as a fallback for existing users.
- The current VS Code workspace must include every project listed in [applications.md](./applications.md) before Step 0 may begin.
- Do not create, repair, or write configuration files inside the plugin directory.
- No file edits before branch proof is printed.
- Keep exactly one behavior path when unwrapping flags.
- Do not modify unrelated tests.
- Permission-sensitive validation and external-read approval steps in Step 1 must be executed serially, not in parallel.
- Do not batch any tool calls that may trigger a permission prompt; preflight root checks, app-root approvals, and file approvals must each run as single-step serial operations.
- Any canceled, dismissed, timed-out, or interrupted tool or permission result in Step 1 must be treated as `STEP_1_INCOMPLETE`, not as loss of Step 0 state.
- If a permission-bearing tool result is canceled, interrupted, or delayed unexpectedly, stop and print the current blocked item and latest resumable status line instead of remaining in a generic working state.
- After the user approves any permission prompt, rerun the exact blocked tool call once in the next agent action; never assume the interrupted call will resume on its own.
- Do not automatically retry the same blocked item more than once in the same run. If the retry also fails or returns another ambiguous result, stop and ask the user whether to retry again or abort.
- If a permission-bearing tool call does not return a success result, do not continue with additional reads, searches, or reasoning-only progress messages in the same run state.
- Do not ask the Step 0 LaunchDarkly question until all required preflight gates have passed and those pass lines have been printed.
- If any gate fails, stop and ask the user.

## Preflight

Before Step 0:
1. Run the full Preflight procedure in [preflight-step1.md](./references/preflight-step1.md#preflight).
2. Print all required pass and fail lines exactly as defined there.
3. Stop immediately with no Step 0 prompt and no edits on any Preflight gate failure.

## Step 0: LaunchDarkly Final State

- Start Step 0 only after all required preflight pass lines were printed in the current run.
- Print one plain chat prompt with options:
  1. `FF is TRUE on PROD + YES to continue with FF removal`
  2. `FF is FALSE on PROD + YES to continue with FF removal (entire feature removal)`
  3. `NO - Quit`
- Continue only if the next user reply in this run is exactly `1` or `2`.
- If the next user reply is `3`, stop with no edits.
- If the next user reply is anything else, or no reply arrives, stop and ask whether to retry or abort.
- Do not infer a default Step 0 selection.
- Do not print the Step 0 complete line or start Step 1 without that valid Step 0 reply.

Required line before Step 1:
`Step 0 complete: LaunchDarkly PROD state captured; proceeding to Step 1 permissions.`

## Step 1: Permissions and Start Clock

Run the full Step 1 state model and execution procedure in [preflight-step1.md](./references/preflight-step1.md#step-1-permissions-and-start-clock).

Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`

## Step 2: Discover Impact

Use the exact local evidence gathered during Step 1. Do not use subagents.

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

Print the full per-app mapping before any usage scan using the exact format defined in [search-strategy.md](./references/search-strategy.md#step-2---read-the-exact-constant-name).

If the mapping cannot be completed, stop and ask the user.

## Step 3: Branch Gate

Before any edits:
1. Determine the affected repositories.
2. For each affected repository, update the local `main` branch from `origin/main` before creating the removal branch.
3. Create or switch each affected repository to `[FLAG_KEY]-ff-removal` from the updated `main` branch.
4. Print branch proof for each affected repository.
5. If branch proof cannot be established, stop with no edits.

## Step 4: Edit Scope

Edit only files proven by Step 2.

Rules:
- remove the flag definition and direct usages for affected apps only
- keep exactly one behavior path after removal
- **compound conditions:** when the removed flag appears as one term in a compound condition (e.g. `A && !B` where B is being removed), eliminate only the removed flag's sub-expression and leave other flags intact — the result is `if (A)`, not the else branch; never substitute the removed flag's production value into a compound condition that contains other flags
- preserve existing patterns unless the flag itself required branching logic
- do not add new comments in edited source or test files as part of flag removal
- do not modify unrelated tests or neighboring code paths
- keep changes minimal and deterministic
- when a TypeScript source file loses a cleanup-only library import, injected dependency, or provider because of the flag removal, inspect the paired unit test file and remove only the matching stale import/provider/mock/setup there; do not remove broader test scaffolding that is still present in the source file
- before removing any remaining import from the paired unit test file, verify that the imported symbol has no other references anywhere else in that spec; if the symbol is still used for unrelated setup or assertions, keep the import
- **spec/test files:** when a test suite has both an "FF enabled" (winning-path) test and an "FF disabled" (losing-path) test, remove only the losing-path test; rename and keep the winning-path test without the "when FF is enabled" qualifier (e.g. rename `should display percentage when FF is enabled` → `should display percentage`). The winning-path test continues to verify hardcoded behavior and must not be deleted.

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
