---
name: "flag-sunset"
description: "Start the shared flag-sunset workflow for a raw LaunchDarkly flag key using the dedicated Flag Sunset Executor custom agent."
argument-hint: "The feature flag key to remove, for example: WFD-5487-display-strike-duplication"
agent: "Flag Sunset Executor"
---

Route this request to the configured custom agent.

Treat the slash-command argument as the raw LaunchDarkly feature flag key.

The command is intentionally thin. Workspace gating, workflow preflight, and execution rules are owned by the agent and skill assets.