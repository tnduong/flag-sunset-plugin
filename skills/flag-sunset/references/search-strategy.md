# Search Strategy

## Overview

Preferred flow: `#search_code` exact-match prefilter -> local definition-file confirmation -> local search for the exact constant. Read the application registry from [../applications.md](../applications.md) before starting.

This workflow must resolve machine-specific local repository roots before starting, using either:
- the user's local config file
- the session-provided derived roots

Why this helps:
- `#search_code` can cheaply identify which apps mention the exact raw flag key
- local confirmation preserves branch-local correctness before edits
- local exact-identifier search still provides the narrow file and line evidence needed for safe edits

Before any search, derive each app's effective local app path from the registry and the resolved repository roots for the current run:
- map `Repository` to the resolved local root
- effective app path = local repository root + `Path in Repo`
- if `Path in Repo` is `./`, the effective app path is the local repository root

## Step 1 - Remote Prefilter

Run `#search_code` with the exact raw flag key.

From the results:
1. Identify apps and repos with exact key matches.
2. Prefer definition-file hits over tests, docs, comments, and mocks.
3. Build the initial candidate app list.
4. If `#search_code` is unavailable or clearly incomplete, skip directly to local definition-file search for every app in the registry.

This step is a prefilter only. Do not treat it as proof that a repo is affected or unaffected until local confirmation is complete.

## Step 2 - Local Definition-File Confirmation

For each candidate app, search its definition file for the exact raw flag key.

From the results:
1. Apps whose definition file contains the flag key are affected.
2. Apps with zero matches are marked `NO_MATCH`.
3. Apps with missing or unreadable paths are marked `PATH_ERROR` or `READ_ERROR`.
4. Record the exact searched path for every app.

## Step 3 - Read the Exact Constant Name

For each affected app, read the definition file and extract the exact constant or enum member name used by that app.

Before proceeding, print the full mapping:

`Identifier mapping: [AppA]=[IdentifierA|NO_MATCH], [AppB]=[IdentifierB|NO_MATCH], ...`

If an app matched by key but no identifier can be extracted, stop and ask the user.

## Step 4 - Local Usage Search

Search only the affected apps using the exact identifier discovered in Step 3.

Rules:
- Use `grep_search` for the workspace app when possible.
- Use exact local search for external apps.
- For QaAutomation, search `*.feature` files only.
- Search test and mock files with the exact LaunchDarkly key string, not fuzzy variants.

## Targeted Fallback Strategy

If subagent or local results are incomplete, recheck only the apps with one of these conditions:
- omitted app
- missing path evidence
- `PATH_ERROR`
- `READ_ERROR`
- `MATCH` with missing identifier
- missing usage list for a matched app

Keep fallback app-scoped and read-only.
