# Workspace Modes: Developer vs Operator

This document is the portable source of truth for mode selection when using the Flag Sunset plugin workflow.

## Purpose

Use this mode map so behavior is consistent across:
- different machines
- different operating systems
- different AI tools/models

## Mode A: Development Mode (Plugin Developer)

Use Development mode when your active context is DEV-FF-REMOVAL and you are developing the plugin itself.

Rules:
- Edit and debug in source repo: `/Users/Thuy.Duong/src/flag-sunset-plugin`
- Primary target for workflow changes: `/flag-sunset-plugin:run`
- Do not treat installed plugin cache as source of truth for code edits

Notes:
- You can sync source changes into the installed plugin cache for local testing in chat
- Committed changes must come from the source repo, not cache-only edits

## Mode B: Operator Mode (Plugin User)

Use Operator mode when these workspace files are opened:
- `/Users/Thuy.Duong/src/ff-removal.macos.code-workspace`
- `/Users/Thuy.Duong/src/ff-removal.code-workspace`

Intent:
- Run `/flag-sunset-plugin:run` as a user/operator across target repositories
- Follow plugin workflow prompts and safety gates

## Installed Plugin Cache Location

Installed runtime copy (not source of truth for committed development):
- macOS: `/Users/Thuy.Duong/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin`
- Windows pattern: `%USERPROFILE%/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin`

## Cross-Machine Guidance

Opening the same workspace name helps with consistency, but mode is determined by the opened workspace file/path context above.

If paths differ per machine, keep the same role split:
- Development mode => edit plugin source repo
- Operator mode => run installed plugin workflow in the FF-removal workspace

## Why chat.tools.terminal.autoApprove (not alternatives)

The operator workspace file (`ff-removal.code-workspace`) pre-populates `chat.tools.terminal.autoApprove` with scoped regex patterns.
This is the deliberate choice. The alternatives were evaluated and rejected:

| Option | Pre-configurable in workspace file | Operator friction | Security trade-off |
|---|---|---|---|
| `chat.tools.terminal.autoApprove` (current) | ✅ Yes | None after setup | Low — scoped to exact patterns |
| Autopilot mode | ❌ No (per-session UI choice) | Once per session | Medium |
| `chat.tools.global.autoApprove` | ✅ Yes | None | High — approves everything |
| Sandbox (macOS/Linux only) | ✅ Yes | None | Medium — restricted env |

`chat.tools.terminal.autoApprove` is the only option that is pre-configurable in a shared workspace file, scoped to specific safe commands, and works on Windows.

`"Allow for session"` (the runtime prompt option) is ephemeral — it lives in VS Code in-memory state only and resets on every window reload or new session. It cannot be pre-configured in any settings file.

## Why github.copilot.chat.additionalReadAccessFolders

Plugin skill/reference files (SKILL.md, applications.md, preflight-step1.md, etc.) live in the plugin cache folder, which is outside the operator workspace. Without additional access, VS Code prompts once per file per session ("Allow reading external files?").

Setting `github.copilot.chat.additionalReadAccessFolders` to `~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin` in the workspace file grants silent read access to the entire plugin cache. The `~` expansion works on both Windows and macOS. This reduces the operator's required approvals from 5-6 file prompts per run down to 1.
