# Flag Sunset Plugin — QA Checklist

Use this checklist as the formal test reference when validating the plugin. For each scenario, work through the numbered steps, then confirm all pass criteria are true.

Each scenario maps to one or more behavioral contracts enforced by `scripts/validate-skill-contracts.mjs`. If the contracts script passes in CI but a scenario fails during manual testing, the contract patterns need to be tightened.

---

## Scenario 1: brand new user

**Setup**

1. Start in a fresh VS Code profile or fresh window.
2. Confirm the plugin is not installed.
3. Confirm `~/.copilot/flag-sunset/local-roots.json` does not exist.
4. Install the plugin.
5. Open a workspace containing the required projects.

**Steps**

6. Run `/flag-sunset [FF KEY]`.
7. Verify the workflow asks for the shared parent folder.
8. Verify the workflow asks to confirm the derived roots.
9. Verify `local-roots.json` gets created.
10. Verify there is no VS Code external-directory prompt just to access `local-roots.json`.
11. Verify Step 0 appears after the preflight gates pass.
12. Verify Step 1 operates only on workspace-confirmed paths.
13. Verify the workflow does not loop on the same blocked item.

**Pass criteria**

- [ ] First-run setup completes.
- [ ] `local-roots.json` exists afterward.
- [ ] No host permission prompt was needed for off-workspace config access.

---

## Scenario 2: existing user with valid local-roots

**Setup**

1. Start in a fresh VS Code profile or fresh window.
2. Confirm the plugin is installed.
3. Confirm `local-roots.json` already exists with valid paths.
4. Open a workspace containing the required projects.

**Steps**

5. Run `/flag-sunset [FF KEY]`.
6. Verify there is no parent-folder question.
7. Verify there is no derived-roots confirmation question.
8. Verify there is no VS Code external-directory prompt for reading `local-roots.json`.
9. Verify Step 0 appears normally.
10. Verify Step 1 searches and reads only workspace-confirmed paths.

**Pass criteria**

- [ ] Common-path execution skips setup.
- [ ] No repeated preflight permission churn occurs.

---

## Scenario 3: stale local-roots

**Setup**

1. Edit `local-roots.json` so one path points to a missing repo.

**Steps**

2. Run `/flag-sunset [FF KEY]`.
3. Verify preflight fails at root validation.
4. Verify the workflow stops before Step 0.
5. Verify there is no retry loop.

**Pass criteria**

- [ ] Failure is clean and early.
- [ ] No misleading prompt behavior occurs.

---

## Scenario 4: missing workspace folder

**Setup**

1. Keep `local-roots.json` valid.
2. Open a workspace missing one required project.

**Steps**

3. Run `/flag-sunset [FF KEY]`.
4. Verify workspace gate fails before any VS Code filesystem or search operation runs on the missing project.

**Pass criteria**

- [ ] The workflow stops with workspace-gate failure.
- [ ] It does not try external reads on the missing project.

---

## Scenario 5: non-default approval selection

**Steps**

1. Force a case that still triggers a VS Code host approval.
2. Choose the non-default approval option (e.g., allowing the whole repository for the session).
3. Verify the result is not treated as user cancellation.
4. Verify the blocked item either succeeds or follows the bounded retry path once.

**Pass criteria**

- [ ] Non-default approval is not misclassified as denial or cancellation.

---

## Scenario 6: explicit deny or dismiss

**Steps**

1. Force a permission-bearing action.
2. Deny or dismiss the prompt.
3. Verify the workflow stops with the blocked item and resumable state.
4. Verify it does not keep retrying automatically.

**Pass criteria**

- [ ] Stop is clean.
- [ ] No endless loop.

---

## Scenario 7: bounded retry

**Steps**

1. Force the same blocked item to fail twice.
2. Verify the workflow retries that exact item once.
3. Verify the second failure causes a stop with explicit user choice, not another automatic retry.

**Pass criteria**

- [ ] Only one automatic retry occurs for the same blocked item.

---

## Scenario 8: Windows path variant

**Steps**

1. Run Scenario 1 and Scenario 2 on Windows.
2. Verify the workflow uses `%USERPROFILE%/.copilot/flag-sunset/local-roots.json`.
3. Verify path handling and terminal commands remain valid.

**Pass criteria**

- [ ] Behavior is equivalent across macOS and Windows.
