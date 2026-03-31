---
name: "flag-sunset"
description: "Start the shared flag-sunset workflow for a raw LaunchDarkly flag key using the dedicated Flag Sunset Executor custom agent."
argument-hint: "The feature flag key to remove, for example: WFD-5487-display-strike-duplication"
agent: "Flag Sunset Executor"
---

Run the shared `flag-sunset` workflow for the provided raw LaunchDarkly feature flag key.

Before loading any workflow asset, enforce the workspace gate with zero tool calls beyond reading `../skills/flag-sunset-assets/applications.md`.

- Cross-reference every required project row in `applications.md` against the folders already present in the injected `<workspace_info>`.
- If any required project path is missing from the active workspace, print the workspace-gate-failed message and stop immediately.
- Do not read `SKILL.md`.
- Do not run any terminal commands.
- Do not prompt for local roots.
- Do not proceed to workflow preflight.

Use these plugin assets as the authoritative source of workflow behavior:
- [workflow](../skills/flag-sunset-assets/SKILL.md)
- [application registry](../skills/flag-sunset-assets/applications.md)
- [workflow guide](../skills/flag-sunset-assets/README.md)

Interpret the slash-command argument as the raw LaunchDarkly feature flag key to remove.

Follow the workflow exactly.