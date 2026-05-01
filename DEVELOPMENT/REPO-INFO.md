## Repository protection rules (Rulesets)

Current repository mode: **Public** (`https://github.com/tnduong/flag-sunset-plugin`) with protected release surfaces.

We use GitHub **Rulesets** (Settings → Rules → Rulesets) to protect the install branch and make version tags effectively immutable.

### 1) Branch ruleset: Protect `stable`
**Purpose:** `stable` is the default/install branch. Prevent accidental changes and history rewrites.

**Target:**
- Branch name pattern: `stable`

**Rules enabled:**
- **Restrict updates** — only actors in the **bypass list** can update `stable`
- **Restrict deletions** — prevents deleting the `stable` branch
- **Block force pushes** — prevents rewriting history on `stable`
- **Require a pull request before merging:** **Disabled** (so the release script can push/merge directly)

**Bypass list:**
- **Repository admin** (allows the maintainer/admin account to run releases)

**Operational note:**
- Releases are performed by running `scripts/create-release.mjs` locally, which updates `stable` using the maintainer’s Git credentials.

---

### 2) Tag ruleset: Protect version tags (`v*`)
**Purpose:** Prevent retagging or deleting version tags so published versions remain stable.

**Target:**
- Tag pattern: `v*` (matches `v1.0.2`, `v2.0.0`, etc.)

**Rules enabled:**
- **Restrict updates** — prevents moving an existing tag to a different commit
- **Restrict deletions** — prevents deleting existing tags
- *(If available in the UI)* **Block force pushes** for tags

**Bypass list:**
- **Repository admin** (admin can still manage tags in exceptional cases)