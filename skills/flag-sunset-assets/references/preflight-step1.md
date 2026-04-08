# Preflight and Step 1 Procedure

This reference is the authoritative detailed procedure for Preflight and Step 1.

## Preflight

Before Step 0:
1. Read [applications.md](../applications.md).
   - Immediately after item 1, print exactly:
     - `## >>>>>> USER ACTION MAY BE REQUIRED NEXT`
     - `VS Code may show a permission prompt during Preflight or Step 1. If it appears, approve it. If no prompt appears, Copilot will continue and you can work on something else.`
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
9. If the workspace gate passed, refresh local `main` from `origin/main` for each unique repository listed in [applications.md](../applications.md) before starting Step 0:
   - use OS-appropriate terminal git commands on the resolved repository roots
   - use a fast-forward-only update policy
   - run refresh checks serially, one repository at a time
   - if every repository refresh succeeds, print:
     - `Main freshness gate passed: [RepoA]=up-to-date, [RepoB]=up-to-date, ...`
   - if any repository refresh fails, print:
     - `Main freshness gate failed: [RepoX]=[reason]`
     - `Resolve the local main update issue, then rerun flag-sunset.`
     - stop immediately with no Step 0 prompt and no edits

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
2. Read [applications.md](../applications.md).
3. Resolve the local repository roots for the current run.
   - first check the workspace-local `.copilot/flag-sunset/local-roots.json` file under the `Nova` workspace folder
   - if this file does not exist (read_file error or file not found), treat it as absent and fall through to the next source; this is not a gate failure
   - if this requires reading the user-owned home-directory local-roots config outside the workspace, use an OS-appropriate terminal command instead of a VS Code filesystem tool
   - if the terminal read fails because the config file does not exist, continue with the Preflight item 3 first-run prompt-and-confirm path
   - if the terminal read fails for any other reason, stop and ask the user
4. Validate each unique local repository root with an OS-appropriate terminal existence check before any permission prompts.
5. Reuse the required `## >>>>>> USER ACTION MAY BE REQUIRED NEXT` banner that was printed during Preflight; do not print it again in Step 1.
6. Derive each app's effective local app path from the registry.
7. Confirm every effective app path is already present in the active VS Code workspace before any VS Code filesystem or search tool runs.
   - if any required effective app path is missing, stop with workspace-gate failure instead of attempting external reads
8. No VS Code search pre-seeding is required; all definition-file and usage searches use OS-appropriate terminal grep commands. Negative constraints still apply:
   - do not use `list_dir` as part of the default Step 1 permission envelope
   - do not run `get_errors` at app-root scope during Step 1
   - do not batch permission-bearing `read_file` calls
9. Using only the main agent, confirm the raw flag key in each app's definition target with an OS-appropriate terminal grep command and determine the candidate app set.
10. Using only the main agent, run exact local usage discovery for the candidate apps with OS-appropriate terminal grep commands and build the concrete future work set:
    - definition files
    - usage files that may be edited
    - spec, test, or mock files only if they are proven relevant
   - if a candidate Angular component, service, or similar source file is expected to lose a feature-manager or other cleanup-only library import/provider during flag removal, include the co-located `*.spec.ts` file in the concrete future work set for mirrored cleanup review
   - files that may later be checked with `get_errors` in Step 5 if file-scoped diagnostics are needed
11. Read each file in the concrete future work set with `read_file` to trigger any remaining file-scoped approvals, using this strategy:
   - **Definition files** (the flag enum/const file for each app): read in full - they are small and are the authoritative identifier source.
   - **All other files**: read only the line ranges anchored to the grep-discovered match lines from Step 10:
     - default context window: +/-30 lines around each match line
     - expand the range if the logical block at the match site (function body, decorator, class, import group) is not fully contained within +/-30 lines
     - merge overlapping or adjacent ranges for the same file into a single `read_file` call
     - the first range read per file triggers the file-scoped permission approval
   - The grep-discovered line numbers from Step 10 are the authoritative completeness list. Every matched line number for a file must fall within a read range. If any grep-discovered line falls outside all ranges after merging, expand the nearest range to include it.
   - Read all ranges for a file before moving to the next file.
   - after each permission-bearing tool call, either continue immediately on success or stop and print the blocked item and latest Step 1 status on interruption
   - if the user approves a prompt after an interrupted call, retry that exact `read_file` call once before doing anything else
   - if the same file read is interrupted again after that retry, stop and ask the user whether to retry again or abort
12. Capture the current workspace repo branch.

To reduce unnecessary long-running continuation prompts from the chat host, do not emit additional Step 1 status lines for every workspace-confirmed app search or every individual file read while work is progressing normally.

Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`