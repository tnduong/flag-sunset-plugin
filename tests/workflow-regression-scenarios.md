# Flag Sunset Workflow Regression Scenarios

Use this checklist as the formal workflow-regression reference when validating the flag-sunset workflow. For each scenario, work through the numbered steps, then confirm all pass criteria are true.

Each scenario maps to one or more static clauses enforced by `scripts/validate-skill-contracts.mjs`. If the contracts script passes in CI but a scenario fails during manual testing, the contract patterns need to be tightened.

---

## Scenario 1: brand new user

**Setup**

1. Start in a fresh VS Code profile or fresh window.
2. Confirm the plugin is not installed.
3. Confirm `~/.copilot/flag-sunset/local-roots.json` does not exist.
4. Install the plugin.
5. Open a workspace containing the required projects.

**Steps**

6. Run `/flag-sunset-plugin:run [FLAG_KEY]`.
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

5. Run `/flag-sunset-plugin:run [FLAG_KEY]`.
6. Verify there is no parent-folder question.
7. Verify there is no derived-roots confirmation question.
8. Verify there is no VS Code external-directory prompt for reading `local-roots.json`.
9. Verify Step 0 appears as a plain chat question with options `1`, `2`, and `3`.
10. Reply `1` or `2` and verify the workflow continues into Step 1.
11. Verify Step 1 searches and reads only workspace-confirmed paths.

**Pass criteria**

- [ ] Common-path execution skips setup.
- [ ] No repeated preflight permission churn occurs.

---

## Scenario 3: stale local-roots

**Setup**

1. Edit `local-roots.json` so one path points to a missing repo.

**Steps**

2. Run `/flag-sunset-plugin:run [FLAG_KEY]`.
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

3. Run `/flag-sunset-plugin:run [FLAG_KEY]`.
4. Verify workspace gate fails before any VS Code filesystem or search operation runs on the missing project.

**Pass criteria**

- [ ] The workflow stops with workspace-gate failure.
- [ ] It does not try external reads on the missing project.
- [ ] No subagent is invoked to reach the missing project.

---

## Scenario 5: non-default approval selection

**Steps**

1. Force a case that still triggers a VS Code host approval.
2. Choose the non-default approval option (for example, allowing the whole repository for the session).
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

---

## Scenario 9: no new permission prompts after Step 1 on the normal path

**Setup**

1. Use a workspace that passes both preflight gates.
2. Choose a flag whose discovery and edit scope can be completed without interruption.

**Steps**

3. Run `/flag-sunset-plugin:run [FLAG_KEY]`.
4. Allow Preflight and Step 1 to complete successfully.
5. Continue through Step 2 and Step 4 on the normal path.

**Pass criteria**

- [ ] No new expected approval prompts appear after Step 1 completes.
- [ ] Any later prompt is treated as a workflow regression unless the workflow assets explicitly document and justify it.

---

## Scenario 10: branch proof before edits

**Setup**

1. Use a flag with at least one affected repository.

**Steps**

2. Run `/flag-sunset-plugin:run [FLAG_KEY]` through discovery.
3. Observe Step 3 and the first edit action.

**Pass criteria**

- [ ] The workflow prints branch proof for every affected repository before any edit is attempted.
- [ ] If branch proof cannot be established, the workflow stops with no edits.

---

## Scenario 11: static validation remains file-scoped and build-free

**Setup**

1. Complete a representative flag-removal run.

**Steps**

2. Observe Step 5 validation behavior.

**Pass criteria**

- [ ] Validation checks the edited scope for remaining references.
- [ ] Diagnostics are scoped to edited files only when diagnostics are needed.
- [ ] No automated build or test commands are run.

---

## Scenario 12: targeted-read completeness including a trailing match near end-of-file

**Setup**

1. Use a file where `grep_search` finds multiple feature-flag matches.
2. Ensure one of those matches is near the bottom of the file.

**Steps**

3. Run Step 1 discovery and inspect the read evidence for that file.
4. Compare the `grep_search` line numbers against the `read_file` ranges used for the file.

**Pass criteria**

- [ ] Every grep-discovered line falls within at least one read range.
- [ ] The trailing match near end-of-file is not skipped.
- [ ] The workflow does not finalize edit reasoning while any discovered match remains unread.

---

## Scenario 13: paired spec file enters scope when source cleanup implies stale test wiring

**Setup**

1. Use a TypeScript source file whose flag removal eliminates a cleanup-only import, provider, or injected dependency.

**Steps**

2. Run Step 1 discovery.
3. Inspect the resulting concrete future work set.

**Pass criteria**

- [ ] The co-located `*.spec.ts` file is added to the concrete future work set for mirrored cleanup review.

---

## Scenario 14: minimal mirrored unit-test cleanup

**Setup**

1. Use a source and spec pair where the flag removal makes some unit-test setup stale but leaves other setup valid.

**Steps**

2. Run the workflow through the proposed edits.
3. Compare the source cleanup with the paired spec cleanup.

**Pass criteria**

- [ ] Only the stale mirrored imports, providers, mocks, or setup are removed from the spec.
- [ ] Unrelated scaffolding remains intact.

---

## Scenario 15: still-used spec imports are retained

**Setup**

1. Use a paired spec file where one import is used both by stale FF-specific setup and by unrelated remaining setup or assertions.

**Steps**

2. Run the workflow through the proposed edits.
3. Inspect the paired spec import cleanup.

**Pass criteria**

- [ ] The workflow verifies whether the imported symbol still has references elsewhere in the spec before deleting the import.
- [ ] If the symbol is still used for unrelated setup or assertions, the import is kept.

---

## Scenario 16: winning-path tests are preserved and normalized

**Setup**

1. Use a spec file with both FF-enabled and FF-disabled tests for the same behavior.

**Steps**

2. Run the workflow through the proposed edits.
3. Inspect the resulting spec changes.

**Pass criteria**

- [ ] The losing-path test is removed.
- [ ] The winning-path test is kept.
- [ ] The winning-path test description is renamed to the non-FF form.

---

## Scenario 17: compound-condition cleanup removes only the targeted flag term

**Setup**

1. Use code with a condition such as `A && !B` where `B` is the flag being removed and `A` still matters.

**Steps**

2. Run the workflow through the proposed edits.
3. Inspect the resulting condition.

**Pass criteria**

- [ ] Only the removed flag sub-expression is eliminated.
- [ ] The unrelated condition remains intact.
- [ ] The workflow does not collapse the logic to the wrong branch.

---

## Scenario 18: Step 0 plain reply handling

**Setup**

1. Use a workspace that passes preflight.

**Steps**

2. Run `/flag-sunset-plugin:run [FLAG_KEY]` until Step 0 appears.
3. Verify Step 0 is printed as plain chat text with the three numbered choices.
4. Reply `1` and verify the workflow continues.
5. Repeat and reply `2` and verify the workflow continues.
6. Repeat and reply `3` and verify the workflow stops with no edits.
7. Repeat and reply something else, or do not reply, and verify the workflow asks whether to retry or abort.

**Pass criteria**

- [ ] Replies `1` and `2` continue.
- [ ] Reply `3` aborts cleanly.
- [ ] Invalid or missing Step 0 input does not continue silently.

---

## Scenario 19: Step 1 search prefers rg when available

**Setup**

1. Ensure `rg` is installed and available in the active shell.

**Steps**

2. Run `/flag-sunset-plugin:run [FLAG_KEY]` through Step 1 discovery.
3. Observe the terminal search commands used for definition-file confirmation and usage discovery.

**Pass criteria**

- [ ] The workflow prefers `rg` for definition-file and usage searches when it is available.
- [ ] The workflow does not fall back to PowerShell-native search commands when `rg` is already available.

---

## Scenario 20: fallback searches stay extension-filtered and avoid broad PowerShell scans

**Setup**

1. Force a run where `rg` is unavailable in the active shell.

**Steps**

2. Run `/flag-sunset-plugin:run [FLAG_KEY]` through Step 1 discovery.
3. Observe the fallback search commands.

**Pass criteria**

- [ ] Fallback searches are limited to language-appropriate file types for the target app.
- [ ] Windows fallback searches use `Select-String -Path ...` with explicit `*.ext` patterns.
- [ ] The workflow does not use broad `Get-ChildItem ... -Recurse -File | Select-String ...` scans over an app or repository root.

---

## Scenario 21: dirty working tree gate blocks Step 1 discovery until repositories are clean

**Setup**

1. Use valid local roots and a workspace that passes the workspace gate.
2. Ensure the main freshness gate can pass.
3. Leave one required repository with staged, unstaged, or untracked changes.

**Steps**

4. Run `/flag-sunset-plugin:run [FLAG_KEY]` through Step 1 entry.
5. Observe the dirty working tree gate output.

**Pass criteria**

- [ ] The workflow prints `Dirty working tree gate failed: [RepoX]=dirty` when any repository is not clean.
- [ ] The workflow prints `Commit, stash, or discard local changes, then rerun flag-sunset.`.
- [ ] The workflow stops before Step 1 discovery and makes no edits.
- [ ] When all required repositories are clean, the workflow continues through Step 1 discovery without printing an additional clean-status line.

---

## Scenario 22: medium workspace autoapproval with rg and scope isolation

**Setup**

1. Create or open the dedicated FF-removal multi-root workspace.
2. Open the OS-specific shared workspace file that includes the medium profile:
	- Windows: `onboarding/ff-removal.code-workspace`
	- macOS: `onboarding/ff-removal.macos.code-workspace`
3. Ensure user-level settings do not add new FF-removal-specific autoapproval entries for this test.

**Steps**

4. Run `/flag-sunset-plugin:run [FLAG_KEY]` through Step 1 on the normal path.
5. Observe that Step 1 terminal search uses `rg` when available.
6. Record prompt count and prompt phase boundaries (Preflight, Step 1, post-Step 1).
7. Open an unrelated workspace and run a simple chat action that would require approval in that workspace.

**Pass criteria**

- [ ] `rg` is included in workspace terminal autoapproval and Step 1 search prefers `rg` when available.
- [ ] Prompt volume is reduced on the FF-removal workspace run compared to baseline.
- [ ] No unexpected approval churn appears after Step 1 on the normal path.
- [ ] Autoapproval behavior does not leak into the unrelated workspace.