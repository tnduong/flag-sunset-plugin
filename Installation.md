# Installation (Private Repo)

## Install from Source (VS Code)

In VS Code, open **Command Palette** and run:

- **Chat: Install Plugin from Source**

Paste the following GitHub URL:

```
https://github.com/tnduong/flag-sunset-plugin
```

> **Why this URL?** VS Code's plugin installer runs `git clone` on the URL you paste, which clones the **default branch** of the repository. The default branch is set to `stable`, which is only advanced when a new release is approved — so users always get tested code, never in-progress work from `main`.

> **Important:** If installation fails with "repository not found", do not use GitHub web page URLs like `/tree/v1.0.0` or `/releases/tag/v1.0.0` — those are not valid git clone targets.

## One-Time GitHub Setup (repo owner only)

After the first release is pushed, set `stable` as the default branch:

1. Go to `https://github.com/tnduong/flag-sunset-plugin/settings/branches`
2. Under **Default branch**, click the ↕ icon and switch to `stable`
3. Confirm the change

This only needs to be done once. All future releases automatically advance `stable` via `create-release.mjs`.

## How new users should install

1. Ensure you have GitHub access to the private repo **tnduong/flag-sunset-plugin**.
2. Sign in to GitHub in VS Code if prompted.
3. Use **Chat: Install Plugin from Source** and paste: `https://github.com/tnduong/flag-sunset-plugin`

## Upgrading to a New Version

Source-installed plugins do not auto-update. When a new version is released, reinstall manually:

1. Open **Command Palette** in VS Code.
2. Run **Chat: Install Plugin From Source**.
3. Paste: `https://github.com/tnduong/flag-sunset-plugin`
4. Enable the plugin if prompted.
5. Confirm the upgrade by running `/flag-sunset-plugin:run` — the first output line will show the new version.

The release notification DM will confirm when a new version has been pushed to `stable`.

