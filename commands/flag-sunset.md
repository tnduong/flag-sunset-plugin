---
name: "run"
description: "Start the shared flag-sunset workflow for a raw LaunchDarkly flag key using the dedicated flag-sunset-executor custom agent."
argument-hint: "The feature flag key to remove, for example: WFD-5487-display-strike-duplication"
agent: "flag-sunset-executor"
---

Route this request to the configured custom agent.

Before routing, apply invocation validation from `skills/flag-sunset-assets/SKILL.md` (`## Invocation Gate`).
If validation fails, stop immediately with the exact failure message defined there.

Treat the slash-command argument as the raw LaunchDarkly feature flag key.
