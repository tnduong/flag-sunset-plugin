# Search Strategy

## Overview

Preferred flow: local definition-file confirmation -> exact local usage search -> concrete future work set. Read the application registry from [../applications.md](../applications.md) before starting.

This workflow must resolve machine-specific local repository roots before starting, using either:
- the user's local config file
- the session-provided derived roots

Why this helps:
- local confirmation preserves branch-local correctness before edits
- exact local search still provides the narrow file and line evidence needed for safe edits
- the same discovery pass can establish the minimal permission envelope needed to avoid post-Step-1 prompts

Before any search, derive each app's effective local app path from the registry and the resolved repository roots for the current run:
- map `Repository` to the resolved local root
- effective app path = local repository root + `Path in Repo`
- if `Path in Repo` is `./`, the effective app path is the local repository root

## Step 1 - Local Definition-File Confirmation

For each app in the registry, search its definition file for the exact raw flag key.

From the results:
1. Apps whose definition file contains the flag key are affected.
2. Apps with zero matches are marked `NO_MATCH`.
3. Apps with missing or unreadable paths are marked `PATH_ERROR` or `READ_ERROR`.
4. Record the exact searched path for every app.

## Step 2 - Read the Exact Constant Name

For each affected app, read the definition file and extract the exact constant or enum member name used by that app.

Before proceeding, print the full mapping:

`Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], [AppB]=[IdentifierB|NO_MATCH], ...`

If an app matched by key but no identifier can be extracted, stop and ask the user.

## Step 3 - Local Usage Search

Search only the affected apps using the exact identifier discovered in Step 3.

Rules:
- Use `grep_search` for each affected app root.
- For QaAutomation, search `*.feature` files only.
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
- If any required effective app path is missing from the active workspace, stop with workspace-gate failure instead of triggering external-directory approval prompts.
- Do not use `list_dir` as part of the default permission envelope.
- Use `grep_search` only on workspace-confirmed app paths.
- Use `read_file` only for files in the concrete future work set.
- Defer `get_errors` until Step 5 and scope it to edited files only, unless a Step 1 fallback requires file-scoped diagnostics for a specific already-approved file.
- Do not use subagents after Step 1 begins.
- When a terminal command is required for Step 1 path validation, use an OS-appropriate form for the active shell so the workflow remains valid on both macOS and Windows.

## Targeted Fallback Strategy

If local results are incomplete, recheck only the apps with one of these conditions:
- omitted app
- missing path evidence
- `PATH_ERROR`
- `READ_ERROR`
- `MATCH` with missing identifier
- missing usage list for a matched app

Keep fallback app-scoped and read-only.
