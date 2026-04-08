# Flag Sunset Plugin

Private VS Code agent plugin that provides the `/flag-sunset` prompt for shared LaunchDarkly feature-flag sunset workflows.

For the recommended internal ownership and onboarding model, see `INTERNAL_ROLLOUT.md`.

To validate the source-install manifest layout locally, run `node scripts/validate-plugin-layout.mjs`.

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

This prompt routes to the dedicated `flag-sunset-executor` custom agent shipped with the plugin.

The prompt is the only public entry point. The executor agent is internal and is not intended to be invoked directly.

Example:

```text
/flag-sunset WFD-5487-display-strike-duplication
```

## Notes

- This plugin is distributed outside application repositories.
- The slash command stays thin and routes to the custom agent; critical safety gates live in the agent plus skill workflow assets.
- For internal rollout, prefer an organization-owned private repository with team-based access instead of a personal repository.
- Machine-specific checkout roots are not stored in the plugin.
- For new users, the workflow should store confirmed checkout roots in `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder and keep that file ignored by Git.
- The home-directory config at `~/.copilot/flag-sunset/local-roots.json` remains a fallback for existing setups.
- The installed plugin location, including `%APPDATA%\Code\agentPlugins\github.com\tnduong\flag-sunset-plugin`, is not used for machine-specific config reads or writes.

## Dev Testing

- Dev-only reset helpers are maintained outside this plugin deployment.
- Current repo-tracked copies live in the Nova workspace under `.github/skills/flag-sunset/` on your testing branch.
- Use `node scripts/validate-plugin-layout.mjs` before merging manifest-related changes.
