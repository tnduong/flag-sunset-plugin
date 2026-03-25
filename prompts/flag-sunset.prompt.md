name: "flag-sunset"
description: "Start the shared flag-sunset workflow for a raw LaunchDarkly flag key using the dedicated Flag Sunset Executor custom agent."
argument-hint: "The feature flag key to remove, for example: WFD-5487-display-strike-duplication"
agent: "Flag Sunset Executor"
---

Run the shared `flag-sunset` workflow for the provided raw LaunchDarkly feature flag key.

Use these plugin assets as the authoritative source of workflow behavior:
- [workflow](../skills/flag-sunset-assets/SKILL.md)
- [application registry](../skills/flag-sunset-assets/applications.md)
- [workflow guide](../skills/flag-sunset-assets/README.md)

Interpret the slash-command argument as the raw feature flag key to remove.

Follow the workflow exactly.