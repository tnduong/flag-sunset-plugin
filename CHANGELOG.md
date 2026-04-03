# Changelog

All notable changes to this plugin are documented here.

Format: `## [vX.Y.Z] — YYYY-MM-DD`

---

## [v1.0.0] — 2026-04-03

- Establish `plugin.json` (root) as the single version source of truth
- Remove `.claude-plugin/marketplace.json` (no longer needed)
- Extend `scripts/validate-plugin-layout.mjs` with version drift guard between `plugin.json` and `.claude-plugin/plugin.json`
- Add release process, notification template, and upgrade instructions to `INTERNAL_ROLLOUT.md` and `Installation.md`
