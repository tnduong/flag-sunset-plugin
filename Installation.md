# Installation (Private Repo)

## Install from Source (VS Code)

In VS Code, open **Command Palette** and run:

- **Chat: Install Plugin from Source**

Paste one of the following GitHub URLs.

### Frozen fallback (recommended for 2026-04-09 fallback)

This pins to the immutable tag **v0.1.0**.

- `https://github.com/tnduong/flag-sunset-plugin/tree/v0.1.0`

Notes:
- Tag: **v0.1.0**
- Purpose: **deploy for 2026-04-09-fallback**
- Frozen commit: **66e713bf54993c5635d9c08e66ea68809ae2181e**

### Frozen fallback (release branch)

This points to a branch created from the same frozen commit:

- `https://github.com/tnduong/flag-sunset-plugin/tree/release/2026-04-09`

Notes:
- Branch: **release/2026-04-09**
- Frozen commit: **66e713bf54993c5635d9c08e66ea68809ae2181e**

## How new users should install

1. Ensure you have GitHub access to the private repo **tnduong/flag-sunset-plugin**.
2. Sign in to GitHub in VS Code if prompted.
3. Use **Chat: Install Plugin from Source** and paste the **tag URL** for the version you want.

## Deployment plan for Thu 2026-04-09

- If recent changes are not stable: deploy/install from **v0.1.0** (fallback).
- If recent changes are stable: create a new tag (e.g., **v0.2.0**) on the approved commit and deploy/install from that tag.
