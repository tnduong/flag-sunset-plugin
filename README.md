# Flag Sunset Plugin

Private VS Code agent plugin that provides the `flag-sunset` skill for shared LaunchDarkly feature-flag sunset workflows.

## Install

1. Open the Command Palette in VS Code.
2. Run `Chat: Install Plugin From Source`.
3. Paste the Git repository URL for this repo.
4. Enable the plugin if prompted.

## Use

Run:

```text
/flag-sunset [FLAG_KEY]
```

This prompt routes to the dedicated `Flag Sunset` custom agent shipped with the plugin.

Example:

```text
/flag-sunset WFD-5487-display-strike-duplication
```

## Notes

- This plugin is distributed outside application repositories.
- Machine-specific checkout roots are not stored in the plugin.
- The workflow stores confirmed checkout roots in a user-owned config file outside the plugin so the source-code location prompt is normally a one-time setup.

## Dev Testing

- Dev-only reset helpers are maintained outside this plugin deployment.
- Current repo-tracked copies live in the Nova workspace under `.github/skills/flag-sunset/` on your testing branch.
