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
- Do not emit per-file read confirmations, intermediate search result echoes, or other tool progress notes outside of Step 1 resumability status lines. Each phase should produce only its required output and gate lines.
- Keep the operator goal in [operator-goal.md](./references/operator-goal.md) in force for all workflow changes.
- A workflow change is not complete if it reintroduces expected permission prompts after Step 1, unless the exception is explicitly documented and justified in the workflow assets.
- Immediately before Preflight item 1, print exactly:
   - `## >>>>>> USER ACTION MAY BE REQUIRED NEXT`
   - `VS Code may show a permission prompt during Preflight or Step 1. If it appears, approve it. If no prompt appears, Copilot will continue and you can work on something else.`
- If Step 1 becomes blocked on a permission or read, print exactly:
   - `## >>>>>> WAITING ON YOU`
- Prefer VS Code tools for workflow prompts and in-workspace reads, searches, and diagnostics: `vscode_askQuestions`, `read_file`, `grep_search`, and `get_errors` remain the default choices on workspace-confirmed paths.
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
- Do not ask the Step 0 LaunchDarkly question until both preflight gates have passed and those pass lines have been printed.
- If any gate fails, stop and ask the user.

## Preflight

Before Step 0:
- Print exactly before item 1:
  - `## >>>>>> USER ACTION MAY BE REQUIRED NEXT`
  - `VS Code may show a permission prompt during Preflight or Step 1. If it appears, approve it. If no prompt appears, Copilot will continue and you can work on something else.`
1. Read [applications.md](./applications.md). Cache the content for the remainder of this run; do not re-read it in later steps.
2. Resolve machine-specific repository roots using one of these sources, in order:
   - workspace-local config file: `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder
     - if this file does not exist (read_file error or file not found), treat it as absent and continue to the next source; this is not a gate failure
   - macOS/Linux user config file: `~/.copilot/flag-sunset/local-roots.json`
   - Windows user config file: `%USERPROFILE%/.copilot/flag-sunset/local-roots.json`
   - a one-time prompt for the shared parent folder that contains both `Applications` and `aya-talent-marketplace`, followed by persisting the confirmed derived roots to the workspace-local config file
   - when the selected config file is outside the active workspace, read it with an OS-appropriate terminal command instead of a VS Code filesystem tool
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
   - create or update the workspace-local `.copilot/flag-sunset/local-roots.json` file with the confirmed derived paths before continuing
   - if the workspace-local file cannot be written, fall back to the user-owned home-directory config file outside the plugin, using an OS-appropriate terminal command when the target is outside the active workspace
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
   - do not invoke a subagent or use any external mechanism to access the missing project; a workspace-gate failure is terminal for this run

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
- Track one automatic retry allowance for the current `next_pending` item; reset that allowance only after a different blocked item appears or the current item succeeds.
- Print the status line after root validation, after the candidate app set is confirmed, after the concrete future work set is fully approved, and on interruption.
- On interruption, print `## >>>>>> WAITING ON YOU`, report the exact blocked item, repeat the latest status line verbatim, and stop.
- On resume after approval, rerun only the exact blocked tool call represented by `next_pending`; do not skip ahead or assume the earlier call completed.
- If the same `next_pending` item fails again after that automatic retry, stop and ask the user whether to retry again or abort instead of looping.

Execution:
1. Capture start time immediately on Step 1 entry.
2. Reuse the [applications.md](./applications.md) content cached during Preflight; do not re-read it.
3. Resolve the local repository roots for the current run.
   - first check the workspace-local `.copilot/flag-sunset/local-roots.json` file under the `Nova` workspace folder
   - if this file does not exist (read_file error or file not found), treat it as absent and fall through to the next source; this is not a gate failure
   - if this requires reading the user-owned home-directory local-roots config outside the workspace, use an OS-appropriate terminal command instead of a VS Code filesystem tool
   - if the terminal read fails because the config file does not exist, continue with the first-run prompt path above
   - if the terminal read fails for any other reason, stop and ask the user
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
9. Determine the candidate app set using the `Flag Definition File` and `Fallback Definition Search Path` columns from [applications.md](./applications.md):
   - **Apps with `—` as their definition file** (e.g. QaAutomation): skip this step for that app; it is always included as a candidate.
   - **All other apps**: read the `Flag Definition File` in full with `read_file`. If the raw flag key is found, mark the app as a candidate.
   - **Fallback (Nova only)**: if the key is not found in the main definition file and the app has a `Fallback Definition Search Path`, run one `grep_search` scoped to that path. If a match is found, read the matched sub-file in full with `read_file` to confirm the identifier; mark the app as a candidate. The sub-file counts as a definition file read — do not re-read it in Step 1.11.
   - Apps where the raw flag key is absent after all checks are excluded from subsequent steps.
10. Using only the main agent, run exact local usage discovery for the candidate apps with `grep_search` and build the concrete future work set:
    - usage files that may be edited
    - spec, test, or mock files only if they are proven relevant
   - if a candidate Angular component, service, or similar source file is expected to lose a feature-manager or other cleanup-only library import/provider during flag removal, include the co-located `*.spec.ts` file in the concrete future work set for mirrored cleanup review
   - files that may later be checked with `get_errors` in Step 6 if file-scoped diagnostics are needed
11. Read each file in the concrete future work set with `read_file` to trigger any remaining file-scoped approvals, using this strategy:
   - **Definition files**: already read in full during step 1.9; do not re-read.
   - **All other files**: read only the line ranges anchored to the grep-discovered match lines from Step 10:
     - default context window: ±20 lines around each match line
     - expand the range ONLY when the closing delimiter of the innermost logical block containing the match line falls outside the ±20 window; expand by the minimum number of lines needed to reach that delimiter and no more; do not expand to capture outer block delimiters or unrelated surrounding code
     - merge overlapping or adjacent ranges for the same file into a single `read_file` call
     - the first range read per file triggers the file-scoped permission approval
   - The grep-discovered line numbers from Step 10 are the authoritative completeness list. Every line number returned by `grep_search` for a file must fall within a read range. If any grep-discovered line falls outside all ranges after merging, expand the nearest range to include it.
   - Read all ranges for a file before moving to the next file.
   - after each permission-bearing tool call, either continue immediately on success or stop and print the blocked item and latest Step 1 status on interruption
   - if the user approves a prompt after an interrupted call, retry that exact `read_file` call once before doing anything else
   - if the same file read is interrupted again after that retry, stop and ask the user whether to retry again or abort
12. Capture the current workspace repo branch.

To reduce unnecessary long-running continuation prompts from the chat host, do not emit additional Step 1 status lines for every workspace-confirmed app search or every individual file read while work is progressing normally.

Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`

## Step 2: Discover Impact

Use the exact local evidence gathered during Step 1. Do not use subagents.

Step 2A: Reuse Step 1 discovery
- reuse the candidate app set, identifier mapping, and concrete future work set produced during Step 1
- do not expand scope unless a Step 1 result is incomplete

Step 2B: Report local confirmation
- reuse the [applications.md](./applications.md) content cached during Preflight; do not re-read it
- resolve local roots for the current run
- derive a resolved app table as described in [search-strategy.md](./references/search-strategy.md)
- print the per-app status and evidence derived during Step 1

Minimum required output from Step 2:
- one-line identifier mapping: `Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], ...`
- for each MATCH app: definition-file path only, and a count of usage files (e.g. `2 usage files`)
- skip NO_MATCH apps from the per-app detail block; list them only in the identifier mapping line

Print the full per-app mapping before any usage scan:
- `Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], [AppB]=[IdentifierB|NO_MATCH], ...`

If the mapping cannot be completed, stop and ask the user.

## Step 3: Branch Gate

Before any edits:
1. Determine the affected repositories.
2. For each affected repository, run the update and branch creation as **three separate serial terminal calls** — do not chain them into one command:
   - Call 1: `git fetch origin main && git checkout main && git pull origin main` — run and ignore the output; its only purpose is to bring main up to date.
   - Call 2: `git checkout -b [FLAG_KEY]-ff-removal` — create the branch; capture any error output.
   - Call 3: `git branch --show-current` — use this output as the branch proof.
3. Print branch proof for each affected repository from Call 3 output.
4. If branch proof cannot be established, stop with no edits.

## Step 4: Pre-Edit Freshness Check

Before any edits, re-read the anchored line ranges for every file in the concrete future work set (the same ranges used in Step 1: grep-discovered match line ±20 lines, expanded only to the minimum needed to close the innermost logical block when it falls outside that window, merged if overlapping).

- Do not print per-file `Fresh:` lines. Suppress individual file confirmations.
- When all files are read, print one line only: `Freshness check passed: [N] files validated; proceeding to edits.`
- Proceed to Step 5.

## Step 5: Edit Scope

Edit only files proven by Step 2.

Rules:
- remove the flag definition and direct usages for affected apps only
- keep exactly one behavior path after removal
- **compound conditions:** when the removed flag appears as one term in a compound condition (e.g. `A && !B` where B is being removed), eliminate only the removed flag's sub-expression and leave other flags intact — the result is `if (A)`, not the else branch; never substitute the removed flag's production value into a compound condition that contains other flags
- preserve existing patterns unless the flag itself required branching logic
- do not modify unrelated tests or neighboring code paths
- keep changes minimal and deterministic
- when a TypeScript source file loses a cleanup-only library import, injected dependency, or provider because of the flag removal, inspect the paired unit test file and remove only the matching stale import/provider/mock/setup there; do not remove broader test scaffolding that is still present in the source file
- before removing any remaining import from the paired unit test file, verify that the imported symbol has no other references anywhere else in that spec; if the symbol is still used for unrelated setup or assertions, keep the import
- **spec/test files:** when a test suite has both an "FF enabled" (winning-path) test and an "FF disabled" (losing-path) test, remove only the losing-path test; rename and keep the winning-path test without the "when FF is enabled" qualifier (e.g. rename `should display percentage when FF is enabled` → `should display percentage`). The winning-path test continues to verify hardcoded behavior and must not be deleted.

## Step 6: Static Validation Only

Run static validation only.

Minimum checks:
- zero remaining references to the removed flag in the edited scope
- zero new diagnostics caused by the edits, using `get_errors` scoped to edited files only when diagnostics are needed
- clean imports and clean structure after dead-code removal

If validation fails, fix the issue and rerun Step 6. Do not run automated build or test commands.

## Step 7: Final Output

Print a compact summary containing:
- flag key
- affected repositories and branches
- modified files
- static validation result
- elapsed time
- reminder that manual build and unit-test verification is still required
- one OS-appropriate revert instruction
