# DEVELOPMENT — Flag Sunset Plugin

This guide covers the full loop: workspace setup, making changes, local testing, and shipping to users.

---

## Prerequisites

- VS Code with GitHub Copilot Chat installed
- Node.js ≥ 20 (`node --version`)
- GitHub access to `tnduong/flag-sunset-plugin` (public read access is sufficient)
- The plugin installed in VS Code at least once (creates the plugin cache folder)

---

## Workspace Setup

### 1. Clone the repo

```bash
git clone https://github.com/tnduong/flag-sunset-plugin.git
cd flag-sunset-plugin
```

Open the folder in VS Code. When the active workspace is this plugin source repo, Copilot Chat is in **developer mode** — the instructions in `../.github/copilot-instructions.md` apply.

### 2. Understand the two locations

| Location | Purpose |
|----------|---------|
| `~/src/flag-sunset-plugin/` | **Source** — what you edit |
| `~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin/` | **Plugin cache** — what VS Code runs |

VS Code reads from the **cache**, not the source repo. You must sync changes to the cache to test them.

### 3. Confirm the plugin cache exists

```bash
ls ~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin/
```

If the folder is missing, install the plugin first using **Chat: Install Plugin from Source** with:
```
https://github.com/tnduong/flag-sunset-plugin
```

The canonical install path uses the repository default branch (`stable`).

---

## Layout Reference

```
agents/                         # *.agent.md — custom agent definitions
commands/                       # *.md — slash command entry points
.claude-plugin/
  plugin.json                   # Installed/nested manifest used by source install
  marketplace.json              # Marketplace/source-install metadata
skills/
  flag-sunset-assets/
    SKILL.md                    # Main workflow (loaded by the agent, not users directly)
    applications.md             # App registry used by the workflow
    references/                 # Supporting docs loaded on demand
plugin.json                     # Root plugin manifest; version source of truth
onboarding/
  ff-removal*.code-workspace    # Shared operator workspace files with scoped approvals
  new-user-onboarding.md        # Operator setup/runbook
DEVELOPMENT/
  DEVELOPMENT.md                # Developer workflow and release guide
  workspace-modes.md            # Developer vs operator mode rules and approval rationale
  INTERNAL_ROLLOUT.md           # Rollout guidance and medium-profile approval policy
  REPO-INFO.md                  # Branch/release protection notes
scripts/
  create-release.mjs            # Release automation: patch manifests/README, tag, push
  sync-plugin-cache.mjs         # Sync source repo changes into the installed plugin cache
  validate-plugin-layout.mjs    # Manifest/layout/version-description consistency check
  validate-skill-contracts.mjs  # Static contract checks on SKILL.md clauses
tests/
  workflow-regression-scenarios.md  # Manual test checklist
```

**Key constraint:** The `name:` field in `SKILL.md` frontmatter must exactly match the skill folder name (`flag-sunset-assets`). Mismatches cause silent load failures.

---

## Making Changes

### Which file to edit

| What you want to change | File |
|------------------------|------|
| Workflow steps, prompts, behavior | `skills/flag-sunset-assets/SKILL.md` |
| App-specific paths/flags | `skills/flag-sunset-assets/applications.md` |
| Slash command entry point | `commands/flag-sunset.md` |
| Agent orchestration | `agents/flag-sunset.agent.md` |
| Supporting reference docs | `skills/flag-sunset-assets/references/` |
| Plugin version | `plugin.json` → then sync `".claude-plugin/plugin.json"` |

### Branch workflow

```bash
git checkout -b my-feature-branch
# make your edits
git push origin my-feature-branch
# open a PR → merge to main
```

Do **not** commit directly to `main`. All changes flow through PRs.

---

## Testing Changes Locally (Before Pushing)

This is the fast loop — no commit, no install required.

### Step 1: Edit the source file

Edit any file in `~/src/flag-sunset-plugin/`.

### Step 2: Sync to the plugin cache

```bash
rsync -av --exclude='.git' \
  ~/src/flag-sunset-plugin/ \
  ~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin/
```

Or sync a single file:

```bash
cp skills/flag-sunset-assets/SKILL.md \
   ~/.vscode/agent-plugins/github.com/tnduong/flag-sunset-plugin/skills/flag-sunset-assets/SKILL.md
```

### Step 3: Start a new chat

VS Code picks up the cache on the next chat session. No reinstall needed.

### Step 4: Run the workflow

Open a workspace that contains the repos the plugin operates on, then:

```
/flag-sunset-plugin:run [FLAG_KEY]
```

Work through the relevant scenario(s) from `tests/workflow-regression-scenarios.md`.

---

## Testing a Source Reinstall (Post-Merge Validation)

After merging to `main`, validate the install path by reinstalling from the canonical URL:

1. Open **Command Palette** → **Chat: Install Plugin from Source**
2. Paste:
  ```
  https://github.com/tnduong/flag-sunset-plugin
  ```
3. Run `/flag-sunset-plugin:run [FLAG_KEY]` and verify behavior

For pre-merge feature branch testing, use the local source + cache sync loop above (checkout the branch locally, sync, and run scenarios).

> **Important:** This installs into the plugin cache and overwrites your local test copy. Re-run the rsync above if you want to keep iterating locally after this.

---

## Validation Scripts

Run these before opening a PR:

```bash
# Check manifest structure and version consistency across plugin.json files
node scripts/validate-plugin-layout.mjs

# Check static contract clauses in SKILL.md
node scripts/validate-skill-contracts.mjs
```

Both scripts exit non-zero on failure and print a specific error message. Fix all errors before requesting review.

These same scripts also run in CI via `.github/workflows/validate-plugin-layout.yml` on every push to `main` and on pull requests.

---

## Shipping a Release to Users

Only do this after the `main` branch has been manually tested.

### 1. Bump versions in both manifests

Update `version` in both `plugin.json` and `.claude-plugin/plugin.json`.

```bash
node scripts/validate-plugin-layout.mjs  # confirm they match
```

### 2. Update CHANGELOG.md

Add an entry for the new version.

### 3. Run the release script

```bash
node scripts/create-release.mjs --dry-run
node scripts/create-release.mjs
```

This script validates branch/state, updates the README version badge, commits release artifacts, creates the annotated tag, advances `stable`, and pushes `main`, `stable`, and the tag.
This script also updates the root and nested plugin manifest descriptions so the installed plugin details panel advertises `Installed version: X.Y.Z.`.

### 4. Distribute the install URL

Share with users:

```
https://github.com/tnduong/flag-sunset-plugin
```

> **Important:** The canonical install flow depends on `stable` being the repository default branch. See `Installation.md` and `DEVELOPMENT/REPO-INFO.md`.

Users install via **Chat: Install Plugin from Source**. Source-installed plugins do **not** auto-update — users must reinstall manually for each new version.

---

## Regression Checklist & Keeping Scenarios in Sync

Use the test artifacts this way:

- `tests/workflow-regression-scenarios.md`: regression and deployment/readiness checklist for behavior changes and pre-release validation.
- `scripts/validate-skill-contracts.mjs`: static contract checker that enforces key clauses in the live workflow assets.

Before tagging a release, manually verify the relevant scenarios in `tests/workflow-regression-scenarios.md`.

When you change `SKILL.md`, the agent, or the command, use the **`synch-skill-regression`** prompt to confirm that `tests/workflow-regression-scenarios.md` and `scripts/validate-skill-contracts.mjs` are updated to match:

```
> /synch-skill-regression
```

This prompt loads the key workflow, checklist, and contract files and checks alignment. Add or update the relevant checklist entries and static contracts in the same PR as the behavioral change.

> `tests/workflow-regression-scenarios.md` and `scripts/validate-skill-contracts.mjs` are developer-side only. Only `SKILL.md`, `applications.md`, `commands/flag-sunset.md`, and `agents/flag-sunset.agent.md` are active at runtime.

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Changes not reflected in chat | Edited source but didn't sync to cache | Run the `rsync` command |
| Plugin not loading after rsync | Started chat before rsync completed | Open a new chat |
| Install URL rejected | GitHub web URL with `/tree/...` or `/releases/tag/...` was pasted | Use the canonical repo URL `https://github.com/tnduong/flag-sunset-plugin` |
| Installed an unexpected version | Repository default branch is not `stable` | Set default branch to `stable` and reinstall from source |
| SKILL.md not invoked | `name:` in frontmatter doesn't match folder | Must be `flag-sunset-assets` exactly |
| Version mismatch error from validator | `plugin.json` and `.claude-plugin/plugin.json` differ | Sync version field in both files |
