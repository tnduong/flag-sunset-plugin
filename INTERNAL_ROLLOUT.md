# Internal Rollout

This plugin is best distributed as an internal private repository owned by an organization rather than a personal account.

## Recommended Ownership

- Transfer the repository to the `AyaHealthcare` organization.
- Keep the repository private.
- Use team-based access instead of granting users one by one.

## Recommended Team Access

Visible teams in `AyaHealthcare` from the current account include:

- `software-developers`
- `copilot`
- `nova`
- `qa-automation`

Recommended default:

- Grant read access to `copilot` because this plugin depends on Copilot usage and users need Copilot access anyway.
- Grant read access to `software-developers` only if you later decide the audience should be broader than Copilot-enabled users.
- Add app-specific teams only if usage should stay scoped to one domain.

## Rollout Steps

1. Transfer the repository from the personal account to `AyaHealthcare`.
2. Keep `main` protected and require pull requests for manifest changes.
3. Grant the `copilot` team read access.
4. Publish a stable install target using either `main` plus branch protection or a dedicated release tag.
5. Share one canonical install URL with users.

## Transfer Checklist

1. In GitHub, open the repository settings for `tnduong/flag-sunset-plugin`.
2. Use the transfer option to move the repository to `AyaHealthcare`.
3. Confirm the repository remains private after transfer.
4. Verify the default branch is still `main`.
5. Add the `copilot` team with read access.
6. Reconfirm that a user in the `copilot` team can clone the repository.
7. Update the install URL in any saved docs, prompts, or onboarding notes.
8. Run `node scripts/validate-plugin-layout.mjs` after the transfer if any manifest paths were touched.

## Canonical Install URL

After transfer, prefer one documented URL format and keep it stable across onboarding docs:

```text
https://github.com/AyaHealthcare/flag-sunset-plugin.git
```

## Onboarding Flow

1. Confirm the user is a member of the team that has repository access.
2. Confirm the user has Copilot access and is in the `copilot` team.
3. In VS Code, run `Chat: Install Plugin From Source`.
4. Paste the canonical repository URL.
5. Enable the plugin when prompted.
6. Run `/flag-sunset <FLAG_KEY>`.

## Troubleshooting

- If install fails before any plugin prompt appears, verify the user can access the private repository in the browser and is a member of the `copilot` team.
- If install fails after manifest changes, run `node scripts/validate-plugin-layout.mjs` and confirm the nested `.claude-plugin` paths still point at the repository root assets.
- If install works for existing users but fails for new users, treat it as an access-provisioning problem first, not a plugin-content problem.
- If the plugin installs but `/flag-sunset` is missing, verify the plugin is enabled in VS Code and the repository contains `commands/flag-sunset.md`.

## Support Notes

- Private source install depends on repository access. If the repo becomes organization-owned, onboarding becomes a team membership problem instead of a per-user repository invitation problem.
- Source-install regressions are likely to come from plugin manifest layout changes. Keep the nested `.claude-plugin` manifests aligned with the repository root asset paths.
- If you want stronger change control, install from a release tag instead of the moving default branch.

## Suggested Follow-up

- Keep the manifest validation workflow enabled on pull requests.
- Treat the install URL as a stable contract and avoid changing it once onboarding has been shared.

