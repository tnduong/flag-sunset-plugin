# Flag Sunset Skill Guide

## Overview

`flag-sunset` is the required cross-repository workflow for removing a LaunchDarkly feature flag when the request starts from a raw flag key.

Command:

```text
/flag-sunset [FLAG_KEY]
```

The workflow performs discovery, editing, and static validation across the registered applications without running automated build or test commands.

The intended operator experience is documented in [operator-goal.md](./references/operator-goal.md).

## Supported Environment

- Supported operating systems: macOS and Windows
- Tested models: GPT-5.4 and Claude Sonnet 4.6
- Primary editor experience: VS Code workspace with the required projects loaded

## Prerequisites

1. A VS Code workspace is open and includes every required project from [applications.md](./applications.md).
2. The local machine has the required repository checkouts for both `AyaHealthcare/Applications` and `AyaHealthcare/aya-talent-marketplace`.
3. The operator knows the exact LaunchDarkly flag key to remove.
4. The operator can confirm the LaunchDarkly production state in Step 0.
5. `git` is available locally so the workflow can create or switch to the required feature-removal branches.
6. The user is prepared to approve serial permission prompts during Step 1 when the agent first touches app roots or concrete files.
7. The user has write access in the local checkouts for the affected repositories.

## One-Time Machine Setup

Each user uses a personal local-roots configuration file outside the plugin.

Preferred path:
- macOS/Linux: `~/.copilot/flag-sunset/local-roots.json`
- Windows: `%USERPROFILE%/.copilot/flag-sunset/local-roots.json`

Purpose:
- maps repository names to local checkout roots
- lets the workflow derive project-specific paths from [applications.md](./applications.md)
- remains user-specific and outside the installed plugin
- makes repository-root collection a one-time prompt on a new machine or after a manual config reset

Example:

```json
{
  "AyaHealthcare/Applications": "/Users/yourname/src/Applications",
  "AyaHealthcare/aya-talent-marketplace": "/Users/yourname/src/aya-talent-marketplace"
}
```

If this file does not exist, the workflow prompts once for the shared parent folder containing both `Applications` and `aya-talent-marketplace`, derives the repository roots, confirms them with the user, then writes the config file so later runs reuse the same locations without prompting again.

## Permission Prompts

Permission prompts are an expected part of the workflow.

1. Preflight may ask for the shared parent folder if no usable local-roots config is available.
2. Preflight asks for confirmation before persisting and using the derived repository roots.
3. Step 0 asks for the LaunchDarkly production state and whether to continue.
4. Preflight should validate repository-root existence with an OS-appropriate terminal check instead of VS Code filesystem reads on parent repository roots.
5. Step 1 must confirm that every required effective app path is already part of the active VS Code workspace before any VS Code filesystem or search tool runs.
6. Step 1 establishes a minimal permission envelope in the main agent by using `grep_search` on workspace-confirmed app paths and then reading only the concrete file set needed for edits and validation.
7. `list_dir` is not part of the default Step 1 approval flow, and `get_errors` should be deferred until Step 5 with file-scoped checks on edited files only.
8. Step 1 permission-bearing operations must run serially. Do not batch them in parallel, because an interrupted approval can leave the UI showing a misleading long-running working state.
9. After Step 1 completes, the default workflow is expected to proceed without further approval prompts.

## Operating Rules

- No automated build or test commands are allowed in this workflow.
- Cross-repository discovery must begin from the registry in [applications.md](./applications.md).
- No edits are allowed before the branch gate passes.
- Step 1 permission-sensitive actions must run serially, not in parallel.
- Preflight root existence checks must not use VS Code filesystem tools on parent repository roots.
- If any required effective app path is not already in the active workspace, the workflow must stop instead of attempting external-directory reads.
- If any permission-bearing tool call is interrupted, the workflow should stop and print the blocked item plus resumable status instead of silently appearing to work.
- The default workflow must not use subagents after Step 1 begins.
- The workflow must stop when a gate fails instead of making assumptions.
- All path resolution and terminal behavior must continue to support both macOS and Windows.

## Output

The workflow ends with a compact UI summary containing:
- flag key
- date, start time, end time, and elapsed minutes
- affected branches
- modified files
- static validation results
- reminder that manual build and unit-test verification is still required
