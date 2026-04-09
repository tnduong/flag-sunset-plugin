# Flag Sunset Plugin — Copilot Instructions

## Two Audiences

| Audience | Context |
|----------|---------|
| **Plugin developer** (you) | Editing files in this source repo (`/src/flag-sunset-plugin`) |
| **Plugin user / operator** | Running `/flag-sunset-plugin:run` in a different multi-repo workspace |

When the active workspace folder is this plugin source repo, you are in **developer mode** — helping edit, test, and ship workflow changes. The operator experience is documented in `skills/flag-sunset-assets/README.md`.

## Source vs Plugin Cache

This repo is the **source**. VS Code installs a separate copy to the **plugin cache** when the plugin is installed:

- **macOS cache:** `~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin/`
- **Windows cache:** `%USERPROFILE%\.vscode\agent-plugins\github.com\tnduong\flag-sunset-plugin\`

To test a change without committing:
1. Edit the file in this source repo.
2. Copy the changed file into the matching path under the plugin cache folder.
3. VS Code picks it up on the next chat — no reinstall needed.

Changes committed to `main` and pushed to GitHub are picked up when VS Code syncs the plugin (typically on restart or explicit plugin refresh).

## Plugin Layout

```
agents/          # Custom agent definitions (*.agent.md)
commands/        # Slash command prompt files (*.md)
skills/
  flag-sunset-assets/   # Skill folder — name matches `name:` in SKILL.md
    SKILL.md             # Authoritative workflow (user-invocable: false)
    applications.md      # App registry
    README.md            # Operator onboarding
    references/          # Supporting docs loaded on demand
plugin.json      # Plugin manifest
```

## Key Rules for Developer Mode

- `skills/flag-sunset-assets/` folder name must match the `name:` field in SKILL.md.
- `SKILL.md` has `user-invocable: false` and `disable-model-invocation: true` — it is loaded by the command/agent, not directly by the user.
- The slash command entry point is `commands/flag-sunset.md`; the executor is `agents/flag-sunset.agent.md`.
- Do not store machine-specific paths in any file committed to this repo.
- Workflow asset changes (SKILL.md, applications.md, references/) take effect immediately in the cache after a manual file copy.
