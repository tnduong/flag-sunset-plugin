# Flag Sunset Plugin

![version](https://img.shields.io/badge/version-1.0.2-blue)

Public VS Code agent plugin that provides the `/flag-sunset-plugin:run` command for shared LaunchDarkly feature-flag sunset workflows.

For maintainers and plugin developers, see `DEVELOPMENT/README.md`.

## Audience

- USER/Operator docs: this README and `onboarding/new-user-onboarding.md`
- DEV/Maintainer docs: `DEVELOPMENT/README.md`

## Install

1. Open the Command Palette in VS Code.
2. Run `Chat: Install Plugin From Source`.
3. Paste the Git repository URL for this repo.
4. Enable the plugin if prompted.

## Use

Run:

```text
/flag-sunset-plugin:run [FLAG_KEY]
```

This prompt routes to the dedicated `flag-sunset-executor` custom agent shipped with the plugin.

The prompt is the only public entry point. The executor agent is internal and is not intended to be invoked directly.

Example:

```text
/flag-sunset-plugin:run WFD-5487-display-strike-duplication
```

## New User Quickstart

If you are new to the plugin, use this order:

1. Install the plugin from source.
2. Open your team shared FF-removal workspace.
3. Use the OS-specific shared workspace file with built-in chat approval settings.
4. Run `/flag-sunset-plugin:run [FLAG_KEY]`.

Use these cutover assets:

- Shared workspace file (Windows): `onboarding/ff-removal.code-workspace`
- Shared workspace file (macOS): `onboarding/ff-removal.macos.code-workspace`
- Full step-by-step runbook: `onboarding/new-user-onboarding.md`

## Notes

- This plugin is distributed outside application repositories.
- Installed plugin cache locations: macOS `~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin/`; Windows `%USERPROFILE%\.vscode\agent-plugins\github.com\tnduong\flag-sunset-plugin\`.
- For distribution and ownership options (current public mode plus optional private/org mode), see `DEVELOPMENT/INTERNAL_ROLLOUT.md`.
- For repository protection rules and release-branch guardrails, see `DEVELOPMENT/REPO-INFO.md`.
- Store confirmed checkout roots in `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder, and keep that file ignored by Git.
