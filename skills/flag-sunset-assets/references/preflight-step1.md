# Preflight and Step 1 Procedure
This reference is the authoritative detailed procedure for Preflight and Step 1.
## Preflight
Before Step 0:
1. Print exactly:
   - `## >>>>>> USER ACTION MAY BE REQUIRED NEXT`
   - `VS Code may prompt for permission during Preflight or Step 1. Approve if shown; otherwise Copilot continues and you can step away.`
2. Read [applications.md](../applications.md).
3. Resolve machine-specific repository roots from the workspace-local config file only:
    - path: `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder
    - required local root keys come from [applications.md](../applications.md) and currently are:
       - `AyaHealthcare/Applications`
       - `AyaHealthcare/aya-talent-marketplace`
    - if this file is missing, unreadable, invalid JSON, or missing required local root keys, treat it as not usable and continue to item 4
    - if this file is usable, skip item 4 with no setup prompts
4. If no usable workspace-local config file is found:
   - this setup path is a one-time prompt for the shared parent folder that contains both `Applications` and `aya-talent-marketplace`
      - show Prompt 1 from [user-prompts.md](./user-prompts.md#prompt-1-parent-folder-input-preflight)
   - derive:
     - `AyaHealthcare/Applications` = `[PARENT]/Applications`
     - `AyaHealthcare/aya-talent-marketplace` = `[PARENT]/aya-talent-marketplace`
      - show Prompt 2 from [user-prompts.md](./user-prompts.md#prompt-2-derived-paths-confirmation-preflight) to confirm derived paths before continuing
   - if the confirmation is not approved, stop immediately with no Step 0 prompt and no edits
   - create or update the workspace-local `.copilot/flag-sunset/local-roots.json` file with the confirmed derived paths before continuing
   - if the config file cannot be written, stop and ask the user
5. If repository roots are available and valid, print:
   - `Local roots gate passed: [RepoA]=configured, [RepoB]=configured, ...`
   - validate root existence with an OS-appropriate terminal check before printing the pass line
6. Derive the effective local project path for every project row:
   - local repository root + `Path in Repo`
   - if `Path in Repo` is `./`, the effective local project path is the local repository root
7. Compare those derived project paths against the folders currently added to the active VS Code workspace.
   - do not use parent repository roots for workspace-gate filesystem reads; compare the effective project paths directly to the open workspace folders
8. If every project path is present in the workspace, print:
   - `Workspace gate passed: [ProjectA]=present, [ProjectB]=present, ...`
9. If any project path is missing from the workspace, print:
   - `Workspace gate failed: missing [ProjectA]=[PathA], [ProjectB]=[PathB], ...`
   - `Open or create a VS Code workspace that includes every project listed in applications.md, then rerun flag-sunset.`
   - stop immediately with no Step 0 prompt and no edits
   - do not invoke a subagent or use any external mechanism to access the missing project; a workspace-gate failure is terminal for this run
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
- On interruption, report the exact blocked item, repeat the latest status line verbatim, and stop.
- On resume after approval, rerun only the exact blocked tool call represented by `next_pending`; do not skip ahead or assume the earlier call completed.
- If the same `next_pending` item fails again after that automatic retry, stop and ask the user whether to retry again or abort instead of looping.
Execution:
1. Capture start time immediately on Step 1 entry.
2. Read [applications.md](../applications.md).
3. Resolve the local repository roots for the current run.
   - first check the workspace-local `.copilot/flag-sunset/local-roots.json` file under the `Nova` workspace folder
   - if this file is missing, unreadable, invalid JSON, or missing required local root keys, continue with the Preflight item 4 setup path
   - do not read local-roots config from any other location
4. Validate each unique local repository root with an OS-appropriate terminal existence check before any permission prompts.
5. Reuse the required `## >>>>>> USER ACTION MAY BE REQUIRED NEXT` banner that was printed during Preflight; do not print it again in Step 1.
6. Derive each app's effective local app path from the registry.
7. Confirm every effective app path is already present in the active VS Code workspace before any VS Code filesystem or search tool runs.
   - if any required effective app path is missing, stop with workspace-gate failure instead of attempting external reads
8. Refresh local `main` from `origin/main` for each unique repository listed in [applications.md](../applications.md) before discovery:
   - use OS-appropriate terminal git commands on the resolved repository roots
   - use a fast-forward-only update policy
   - run refresh checks serially, one repository at a time
   - on Windows PowerShell, run these serial git commands for each repository root, in order:
      - `git -C '[resolved repository root]' rev-parse --is-inside-work-tree`
      - `git -C '[resolved repository root]' fetch origin main`
      - `git -C '[resolved repository root]' switch main`
      - `git -C '[resolved repository root]' merge --ff-only origin/main`
   - treat successful completion of all four commands as success evidence for that repository
   - if one command fails, use the failing command label (`rev-parse`, `fetch`, `switch-main`, or `merge-ff-only`) as the gate-failure reason
   - if every repository refresh succeeds, print:
     - `Main freshness gate passed: [RepoA]=up-to-date, [RepoB]=up-to-date, ...`
   - if any repository refresh fails, print:
     - `Main freshness gate failed: [RepoX]=[reason]`
     - `Resolve the local main update issue, then rerun flag-sunset.`
     - stop immediately with no edits
9. If the main freshness gate passed, validate working-tree cleanliness for each unique repository listed in [applications.md](../applications.md) before discovery:
   - use OS-appropriate terminal git status commands on the resolved repository roots
   - evaluate staged, unstaged, and untracked changes
   - run cleanliness checks serially, one repository at a time
   - if every repository is clean, continue to discovery with no additional clean-status line
   - if any repository is dirty, print:
     - `Dirty working tree gate failed: [RepoX]=dirty`
     - `Commit, stash, or discard local changes, then rerun flag-sunset.`
     - stop immediately with no edits
10. All definition-file and usage searches use `grep_search` (VS Code workspace tool) on workspace-confirmed paths. Search rules:
   - use `grep_search` with `isRegexp: false` for all identifier and raw-key searches
   - scope every search to the app's resolved search path via `includePattern`; use the `Search Scope` from the registry when present, otherwise use the effective app path
   - keep every search extension-filtered by app language via `includePattern` glob: Angular apps -> `**/*.ts` and `**/*.html` (separate calls); CoreApi -> `**/*.cs`; QaAutomation -> `**/*.feature`
   - do not set `maxResults` by default; if a search for a `MATCH` app returns 0 usage results, retry once with `maxResults: 100` before classifying the result
   - do not fall back to terminal search commands (`rg`, `grep`, `Select-String`) for file discovery; terminal commands are reserved for git operations and path validation only
   Negative constraints still apply:
   - do not use `list_dir` as part of the default Step 1 permission envelope
   - do not run `get_errors` at app-root scope during Step 1
   - do not batch permission-bearing `read_file` calls
11. Using only the main agent, confirm the raw flag key in each app's definition target with `grep_search` and determine the candidate app set.
   - resolve each definition target as: `[effective app path] + [Flag Definition File]`; do not resolve definition targets from repository root alone
   - classify an app as `PATH_ERROR` only after validating that exact derived definition target path is missing or unreadable
   - use `grep_search` with `isRegexp: false` and `includePattern` scoped to the definition file's containing directory with the appropriate extension glob
   - for apps with no definition file (e.g. QaAutomation with `—`), search the app's `Search Scope` for the raw flag key string using `grep_search` with the app's language extension filter
12. Using only the main agent, run exact local usage discovery for the candidate apps with `grep_search` and build the concrete future work set:
    - definition files
    - usage files that may be edited
    - spec, test, or mock files only if they are proven relevant
   - file extensions by app language, enforced via `includePattern` glob:
     - Angular apps (Nova, aya-talent-marketplace) -> `**/*.ts` and `**/*.html` (separate calls), plus `**/*.spec.ts` only when the spec is already proven relevant
     - CoreApi -> `**/*.cs`
     - QaAutomation -> `**/*.feature`
   - use `grep_search` with `isRegexp: false` for each search; do not use terminal search commands for file discovery
   - apply the downstream-symbol second-hop rule defined in [search-strategy.md](./search-strategy.md) when building the concrete future work set
   - if a candidate Angular component, service, or similar source file is expected to lose a feature-manager or other cleanup-only library import/provider during flag removal, include the co-located `*.spec.ts` file in the concrete future work set for mirrored cleanup review
   - files that may later be checked with `get_errors` in Step 5 if file-scoped diagnostics are needed
   - Discovery completion gate: for each `MATCH` app, verify that every file returned by the `grep_search` calls in this item is present in the concrete future work set.
     - If any matched file is not in the concrete future work set, add the missing file(s), run targeted `read_file` ranges for the new match lines, and update the future work set before proceeding.
     - If the `grep_search` scope does not match the app's resolved scope (`Search Scope` when present, otherwise the effective app path), print `STEP_1_INCOMPLETE: invalid search scope for [app]=[actual root]` and stop.
     - If any matched file remains untracked after the update, print `STEP_1_INCOMPLETE: untracked matches found for [app]=[untracked files]` and stop.
     - Proceed to item 13 only when all `MATCH` apps pass the completion gate.
13. Read each file in the concrete future work set with `read_file` to trigger any remaining file-scoped approvals, using this strategy:
   - **Definition files** (the flag enum/const file for each app): read in full - they are small and are the authoritative identifier source.
   - **All other files**: read only the line ranges anchored to the `grep_search`-discovered match lines from item 12:
     - default context window: +/-30 lines around each match line
     - expand the range if the logical block at the match site (function body, decorator, class, import group) is not fully contained within +/-30 lines
     - merge overlapping or adjacent ranges for the same file into a single `read_file` call
     - the first range read per file triggers the file-scoped permission approval
   - The `grep_search`-discovered line numbers from item 12 are the authoritative completeness list. Every matched line number for a file must fall within a read range. If any discovered line falls outside all ranges after merging, expand the nearest range to include it.
   - Read all ranges for a file before moving to the next file.
   - after each permission-bearing tool call, either continue immediately on success or stop and print the blocked item and latest Step 1 status on interruption
   - if the user approves a prompt after an interrupted call, retry that exact `read_file` call once before doing anything else
   - if the same file read is interrupted again after that retry, stop and ask the user whether to retry again or abort
14. Capture the current workspace repo branch.
To reduce unnecessary long-running continuation prompts from the chat host, do not emit additional Step 1 status lines for every workspace-confirmed app search or every individual file read while work is progressing normally.
Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`
