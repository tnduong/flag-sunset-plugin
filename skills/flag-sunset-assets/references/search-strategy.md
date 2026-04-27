# Search Strategy
## Overview
Preferred flow: local definition-file confirmation -> exact local usage search -> concrete future work set. Read the application registry from [../applications.md](../applications.md) before starting.
This workflow must resolve machine-specific local repository roots before starting by following [preflight-and-discovery.md](./preflight-and-discovery.md#preflight). Local-first discovery preserves branch-local correctness, provides narrow file/line evidence for safe edits, and seeds the permission envelope to avoid post-Step-1 prompts.
Before any search, derive each app's effective local app path: map `Repository` to the resolved local root, then effective app path = local repository root + `Path in Repo` (if `./`, use the root itself). Derive app discovery scope from `Search Scope` (repository-root-relative); if omitted, default to the effective app path.

## Canonical Search Rules
All `grep_search` calls in this workflow must follow these rules, referenced by [preflight-and-discovery.md](./preflight-and-discovery.md) and the steps below as the single source of truth.

1. **Tool choice:** Use `grep_search` (VS Code workspace tool) with `isRegexp: false` for all identifier and raw-key searches. Do not use terminal search commands (`rg`, `grep`, `Select-String`) for file discovery. Terminal commands are reserved for git operations and path validation only.
2. **Scope:** Scope every search to the app's resolved search path via `includePattern`; use the `Search Scope` from the registry when present, otherwise use the effective app path. Do not fall back to a whole-repository all-file scan when an app search root is known.
3. **Extension filters:** Keep every search extension-filtered by app language via `includePattern` glob:
   - Angular apps → `**/*.ts` and `**/*.html` (separate calls)
   - CoreApi → `**/*.cs`
   - QaAutomation → `**/*.feature`
4. **maxResults policy:** Do not set `maxResults` by default. If a search for a `MATCH` app returns 0 usage results, retry once with `maxResults: 100` before classifying the result.

## Step 1 - Local Definition-File Confirmation
For each app in the registry, search its definition file for the exact raw flag key.
Use `grep_search` with `isRegexp: false` and `includePattern` scoped to the definition file's containing directory with the appropriate extension glob. Do not broaden definition-file confirmation into an all-file repo scan.
From the results: apps whose definition file contains the flag key are affected; apps with zero matches are `NO_MATCH`; apps with missing or unreadable paths are `PATH_ERROR` or `READ_ERROR`. Record the exact searched path for every app.

## Step 2 - Read the Exact Constant Name
For each affected app, read the definition file and extract the exact constant or enum member name used by that app.
From first-hop matches of that identifier, extract downstream symbols for the same behavior.
For TypeScript sources, downstream-symbol extraction must include paired-template propagation:
- if a downstream symbol appears in a component TypeScript file, also search the paired HTML template for that symbol
- include the paired HTML file even when it does not contain the raw LaunchDarkly key string
Before proceeding, print the full mapping:
`Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], [AppB]=[IdentifierB|NO_MATCH], ...`
If an app matched by key but no identifier can be extracted, stop and ask the user.

## Step 3 - Local Usage Search
Search only the affected apps using the exact identifier discovered in Step 2.
Apply the [Canonical Search Rules](#canonical-search-rules) for every `grep_search` call in this step, plus:
- Search symbols from Step 2 in this order: primary first, downstream second (if any).
- **MANDATORY second-hop (HTML templates):** When a downstream symbol is found in a component TypeScript file (e.g. `x.component.ts`), you MUST also search that TS file for downstream symbol line numbers and run a second-hop search in the paired HTML template (`x.component.html`). Add the HTML file to the future work set if it contains any matches. This step is NOT optional — skipping it causes the HTML template to be missed during edits.
- **MANDATORY spec/test pairing:** For every TypeScript source file (`*.component.ts`, `*.service.ts`, etc.) that enters the future work set, also add its co-located spec file (`*.spec.ts`) if one exists. The spec file must be searched for both the primary identifier and all downstream symbols. Spec files that reference any removed symbol must be in the future work set for cleanup.
- Search test and mock files with the exact LaunchDarkly key string, not fuzzy variants.
- Build the concrete future work set from the results (definition files; usage files that may be edited; test or mock files only if proven relevant; files for later `get_errors` checks).

**Post-discovery checklist (mandatory before proceeding):**
1. For every `*.component.ts` in the future work set, verify the paired `*.component.html` is also present if it references any downstream symbol.
2. For every `*.component.ts` or `*.service.ts` in the future work set, verify the paired `*.spec.ts` is also present if it references any removed symbol.
3. If either check fails, add the missing file and re-run its search before proceeding.
4. **Zero-result retry:** If any `grep_search` call for a `MATCH` app returned 0 results during Step 3, and the search did not use `maxResults`, retry that search once with `maxResults: 100`. If the retry also returns 0 results, accept the result. If the retry surfaces new files, add them to the future work set and search them for downstream symbols before proceeding. This guards against the rare case where the default result cap is lower than expected for a given workspace configuration.

## Step 4 - Permission Envelope Use
Use the same main-agent discovery pass to seed approvals before Step 1 completes.
Rules:
- Before any VS Code filesystem or search tool runs, validate local roots with OS-appropriate terminal existence checks and confirm every effective app path is present in the active workspace. Local-roots resolution must follow [preflight-and-discovery.md](./preflight-and-discovery.md#preflight). If any required path is missing, stop with workspace-gate failure.
- Apply the [Canonical Search Rules](#canonical-search-rules) for all file discovery searches. Do not use `list_dir` as part of the default permission envelope.
- Use `read_file` only for files in the concrete future work set: definition files in full; all others as targeted ranges anchored to grep-discovered match lines (±30 lines, expanded to contain the full logical block, merged when overlapping). The grep line numbers from Step 3 are the authoritative coverage list. Defer `get_errors` until Step 5 and scope it to edited files only, unless a Step 1 fallback requires file-scoped diagnostics.
- Do not use subagents after Step 1 begins. Use OS-appropriate terminal commands for path validation.
- If a Step 1 permission-bearing action is interrupted, retry the same blocked item at most once after approval; if the retry also fails, stop and ask the user whether to retry again or abort.

## Targeted Fallback Strategy
If local results are incomplete, recheck only apps that are: omitted, missing path evidence, `PATH_ERROR`, `READ_ERROR`, `MATCH` with missing identifier, or missing a usage list. Keep fallback app-scoped and read-only.
