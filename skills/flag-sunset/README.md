# Flag Sunset Skill Guide

## Overview

`flag-sunset` is the required cross-repository workflow for removing a LaunchDarkly feature flag when the request starts from a raw flag key.

Command:

```text
/flag-sunset [FLAG_KEY]
```

The workflow performs discovery, editing, and static validation across the registered applications without running automated build or test commands.

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
6. The user is prepared to approve permission prompts for external file reads during Step 1.
7. The user has write access in the local checkouts for the affected repositories.

## One-Time Machine Setup

Each user may optionally create a personal local-roots configuration file outside the plugin.

Preferred path:
- macOS/Linux: `~/.copilot/flag-sunset/local-roots.json`
- Windows: `%USERPROFILE%/.copilot/flag-sunset/local-roots.json`

Purpose:
- maps repository names to local checkout roots
- lets the workflow derive project-specific paths from [applications.md](./applications.md)
- remains user-specific and outside the installed plugin

Example:

```json
{
  "AyaHealthcare/Applications": "/Users/yourname/src/Applications",
  "AyaHealthcare/aya-talent-marketplace": "/Users/yourname/src/aya-talent-marketplace"
}
```

If this file does not exist, the workflow prompts once for the shared parent folder containing both `Applications` and `aya-talent-marketplace`, derives the repository roots, and uses them for the current run only.

## Permission Prompts

Permission prompts are an expected part of the workflow.

1. Preflight may ask for the shared parent folder if no usable local-roots config is available.
2. Preflight asks for confirmation before using the derived repository roots.
3. Step 0 asks for the LaunchDarkly production state and whether to continue.
4. Step 1 reads external definition files serially to trigger VS Code approval prompts for cross-project access.

## Operating Rules

- No automated build or test commands are allowed in this workflow.
- Cross-repository discovery must begin from the registry in [applications.md](./applications.md).
- No edits are allowed before the branch gate passes.
- Step 1 permission-sensitive actions must run serially, not in parallel.
- The workflow must stop when a gate fails instead of making assumptions.

## Output

The workflow ends with a compact UI summary containing:
- flag key
- date, start time, end time, and elapsed minutes
- affected branches
- modified files
- static validation results
- reminder that manual build and unit-test verification is still required
