# New User Onboarding: Shared Workspace and Chat Approval

Use this runbook after installing the plugin.

## Goal

Set up one shared FF-removal workspace where:

- required project folders are present
- chat approvals are configured at workspace scope
- `/flag-sunset-plugin:run [FLAG_KEY]` can run with reduced prompt churn

## 1) Open the shared workspace

If your team already shared a `.code-workspace` file:

1. Open VS Code.
2. Run `File: Open Workspace from File...`.
3. Select the shared workspace file.

If your team did not share one yet:

1. Copy the workspace file for your OS to a local file:
	- Windows: `onboarding/ff-removal.code-workspace`
	- macOS: `onboarding/ff-removal.macos.code-workspace`
2. Update each folder `path` value to your local checkout locations.
3. Open that local `.code-workspace` file in VS Code.

## 2) Verify required folders are loaded

Your active workspace should include these project roots:

- `aya-talent-marketplace`
- `Applications/Nova`
- `Applications/Aya.Core.Api`
- `Applications/QaAutomation`

The workflow will stop at preflight if any required project path is missing.

## 3) Use workspace-scoped chat approval (medium profile)

1. Open the shared workspace file for your OS:
	- Windows: `onboarding/ff-removal.code-workspace`
	- macOS: `onboarding/ff-removal.macos.code-workspace`
2. Confirm the workspace file `settings` includes `chat.tools.terminal.autoApprove`.

Important:

- Keep this at workspace scope, not user scope.
- `rg` and `grep` are intentionally included for Step 1 search operations.
- Destructive branch/delete patterns remain gated.

If you use `pwsh` on macOS, you can also use the Windows profile because command names are PowerShell-native.

## 4) Run the command

Use:

```text
/flag-sunset-plugin:run [FLAG_KEY]
```

Example:

```text
/flag-sunset-plugin:run WFD-5487-display-strike-duplication
```

## 5) Expected first-run behavior

- Preflight may ask for a shared parent folder if no local-roots config exists.
- Step 0 asks for LaunchDarkly production state (`1`, `2`, or `3`).
- Step 1 performs serial permission-sensitive actions and should reduce prompt churn with workspace approvals.

## 6) If you still see prompts

- `Focus Terminal` prompts can still appear for gated terminal actions.
- Verify your opened workspace file includes the medium profile.
- Confirm you edited workspace settings, not user settings.
- Confirm `rg` is available in the active shell.

## 7) Validate setup

Use this checklist:

- `tests/workflow-regression-scenarios.md` (Scenarios 11 and 22)
