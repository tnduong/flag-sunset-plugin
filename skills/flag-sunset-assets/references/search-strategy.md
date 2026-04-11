# Search Strategy
## Overview
Preferred flow: local definition-file confirmation -> exact local usage search -> concrete future work set. Read the application registry from [../applications.md](../applications.md) before starting.
This workflow must resolve machine-specific local repository roots before starting by following [preflight-step1.md](./preflight-step1.md#preflight).
Why this helps:
- local confirmation preserves branch-local correctness before edits
- exact local search still provides the narrow file and line evidence needed for safe edits
- the same discovery pass can establish the minimal permission envelope needed to avoid post-Step-1 prompts
Before any search, derive each app's effective local app path from the registry and the resolved repository roots for the current run:
- map `Repository` to the resolved local root
- effective app path = local repository root + `Path in Repo`
- if `Path in Repo` is `./`, the effective app path is the local repository root
- derive app discovery scope from `Search Scope` (repository-root-relative); if omitted, default to the effective app path

## Step 1 - Local Definition-File Confirmation
For each app in the registry, search its definition file for the exact raw flag key.
Use `rg -n --fixed-strings` when available; otherwise fall back to an OS-appropriate native command scoped to the exact definition target. Do not broaden definition-file confirmation into an all-file repo scan.
From the results:
1. Apps whose definition file contains the flag key are affected.
2. Apps with zero matches are marked `NO_MATCH`.
3. Apps with missing or unreadable paths are marked `PATH_ERROR` or `READ_ERROR`.
4. Record the exact searched path for every app.

## Step 2 - Read the Exact Constant Name
For each affected app, read the definition file and extract the exact constant or enum member name used by that app.
From first-hop matches of that identifier, extract downstream symbols for the same behavior.
For TypeScript sources, downstream-symbol extraction must include paired-template propagation:
- if a downstream symbol appears in a component TypeScript file, also search the paired HTML template for that symbol
- include the paired HTML file even when it does not contain the raw LaunchDarkly key string
Example:
- definition entry: `FlagSymbol = 'flag-key'`
- first-hop usage: `DerivedSymbol = evaluate(FlagSymbol)`
- Step 2 outputs: primary identifier = `FlagSymbol`; downstream symbol = `DerivedSymbol`
Before proceeding, print the full mapping:
`Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], [AppB]=[IdentifierB|NO_MATCH], ...`
If an app matched by key but no identifier can be extracted, stop and ask the user.

## Step 3 - Local Usage Search
Search only the affected apps using the exact identifier discovered in Step 2.
Rules:
- Prefer `rg -n --fixed-strings` when available; otherwise fall back to OS-appropriate native search commands with explicit extension filters. Exact command forms live in [preflight-step1.md](./preflight-step1.md#step-1-permissions-and-start-clock).
- Use an app-scoped search root from registry `Search Scope`; if `Search Scope` is omitted, use the effective app path. Do not fall back to a whole-repository all-file scan when an app search root is known.
- Keep searches extension-filtered by app language: Angular apps -> `*.ts`, `*.html`; CoreApi -> `*.cs`; QaAutomation -> `*.feature`.
- Search symbols from Step 2 in this order: primary first, downstream second (if any).
- When a downstream symbol is found in a TypeScript source file, run a second-hop search in the paired HTML template (for example `x.component.ts` -> `x.component.html`).
- Search test and mock files with the exact LaunchDarkly key string, not fuzzy variants.
- Build the concrete future work set from the results:
	- definition files
	- usage files that may be edited
	- test or mock files only if they are proven relevant
	- files that will later be checked with `get_errors` if file-scoped diagnostics are needed

## Step 4 - Permission Envelope Use
Use the same main-agent discovery pass to seed approvals before Step 1 completes.
Rules:
- Before any VS Code filesystem or search tool runs, validate local roots with OS-appropriate terminal existence checks and confirm every effective app path is already present in the active workspace.
- Local-roots resolution must follow [preflight-step1.md](./preflight-step1.md#preflight) and use only the workspace-local config path defined there.
- If any required effective app path is missing from the active workspace, stop with workspace-gate failure instead of triggering external-directory approval prompts.
- Do not use `list_dir` as part of the default permission envelope.
- Use terminal search commands only on workspace-confirmed app paths, following the scoped and extension-filtered rules above.
- Use `read_file` only for files in the concrete future work set. Definition files are read in full. All other files are read as targeted ranges anchored to grep-discovered match lines (±30 lines, expanded to contain the full logical block, merged when overlapping). The grep line numbers from Step 3 are the authoritative coverage list; every match line must fall within a read range.
- Defer `get_errors` until Step 5 and scope it to edited files only, unless a Step 1 fallback requires file-scoped diagnostics for a specific already-approved file.
- Do not use subagents after Step 1 begins.
- When a terminal command is required for Step 1 path validation, use an OS-appropriate form for the active shell so the workflow remains valid on both macOS and Windows.
- If a Step 1 permission-bearing action is interrupted, retry the same blocked item at most once after approval; if the retry also fails, stop and ask the user whether to retry again or abort.

## Targeted Fallback Strategy
If local results are incomplete, recheck only the apps with one of these conditions:
- omitted app
- missing path evidence
- `PATH_ERROR`
- `READ_ERROR`
- `MATCH` with missing identifier
- missing usage list for a matched app
Keep fallback app-scoped and read-only.
