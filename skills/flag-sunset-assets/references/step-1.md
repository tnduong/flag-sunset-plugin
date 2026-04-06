# Step 1: Permissions and Start Clock

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
2. Reuse the [applications.md](../applications.md) content cached during Preflight; do not re-read it.
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
8. No VS Code tool pre-seeding is required; all definition-file and usage searches use OS-appropriate terminal commands. Negative constraints still apply:
   - do not use `list_dir` as part of the default Step 1 permission envelope
   - do not run `get_errors` at app-root scope during Step 1
   - do not batch permission-bearing `read_file` calls
9. Determine the candidate app set using the `Flag Definition File` and `Fallback Definition Search Path` columns from [applications.md](../applications.md):
   - **Apps with `—` as their definition file** (e.g. QaAutomation): skip this step for that app; it is always included as a candidate.
   - **All other apps**: run an OS-appropriate terminal `grep` for the raw flag key in the `Flag Definition File`. If the key is found, mark the app as a candidate and read only the matched line ±2 lines with `read_file` to extract the exact constant or enum member name. Do not read the definition file in full.
   - **Fallback (Nova only)**: if the key is not found in the main definition file and the app has a `Fallback Definition Search Path`, run an OS-appropriate terminal `grep -rn "[FLAG_KEY]" "[effective app path]/[Fallback Definition Search Path]" --include="*.ts"`. If a match is found, read only the matched line ±2 lines with `read_file` to confirm the identifier; mark the app as a candidate. The sub-file counts as a definition file read — do not re-read it in Step 1.11.
   - Apps where the raw flag key is absent after all checks are excluded from subsequent steps.
10. Using only the main agent, run exact local usage discovery for each candidate app using an OS-appropriate terminal command and build the concrete future work set:
    - Check the `Usage Search Path` column for the app. If a value is present (not `—`), use those paths as search roots; if `—`, use the full effective app path. Combine all comma-separated paths into a single terminal call — do not issue one call per path.
    - File extensions by app language: Angular apps (Nova, aya-talent-marketplace) → `*.ts` and `*.html`; CoreApi → `*.cs`; QaAutomation → `*.feature`.
    - **macOS/Linux:** `grep -rn "IDENTIFIER" [path1] [path2] ... --include="*.ext1" --include="*.ext2"`
    - **Windows:** `Select-String -Path "[path1]\**\*.ext1","[path1]\**\*.ext2","[path2]\**\*.ext1",... -Pattern "IDENTIFIER" -Recurse`
    - Parse terminal output (format `filepath:linenum:content`) to extract file paths and match line numbers for step 1.11.
    - usage files that may be edited
    - spec, test, or mock files only if they are proven relevant
   - if a candidate Angular component, service, or similar source file is expected to lose a feature-manager or other cleanup-only library import/provider during flag removal, include the co-located `*.spec.ts` file in the concrete future work set for mirrored cleanup review
   - files that may later be checked with `get_errors` in Step 5 if file-scoped diagnostics are needed
11. Read each file in the concrete future work set with `read_file` to trigger any remaining file-scoped approvals, using this strategy:
   - **Definition files**: already read (matched line ±2) during step 1.9; do not re-read.
   - **All other files** (including test and spec files): read only the line ranges anchored to the grep-discovered match lines from Step 10:
     - default context window: ±30 lines around each match line
     - expand the range if the logical block at the match site (function body, test method, decorator, class, import group) is not fully contained within ±30 lines
     - merge overlapping or adjacent ranges for the same file into a single `read_file` call
     - the first range read per file triggers the file-scoped permission approval
   - The grep-discovered line numbers from Step 10 are the authoritative completeness list. Every line number must fall within a read range. If any grep-discovered line falls outside all ranges after merging, expand the nearest range to include it.
   - Read all ranges for a file before moving to the next file.
   - after each permission-bearing tool call, either continue immediately on success or stop and print the blocked item and latest Step 1 status on interruption
   - if the user approves a prompt after an interrupted call, retry that exact `read_file` call once before doing anything else
   - if the same file read is interrupted again after that retry, stop and ask the user whether to retry again or abort
12. Capture the current workspace repo branch.

To reduce unnecessary long-running continuation prompts from the chat host, do not emit additional Step 1 status lines for every workspace-confirmed app search or every individual file read while work is progressing normally.

Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`
