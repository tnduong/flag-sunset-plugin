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

Example:

```text
/flag-sunset WFD-5487-display-strike-duplication
```

## Notes

- This plugin is distributed outside application repositories.
- Machine-specific checkout roots are not stored in the plugin.
- Users may optionally create a local config file in their user profile, or provide the shared parent folder when prompted.
