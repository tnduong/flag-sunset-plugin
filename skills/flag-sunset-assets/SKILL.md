---
name: flag-sunset-assets
description: 'Internal workflow asset bundle for the shared flag-sunset prompt and executor agent. Contains the authoritative multi-step process, registry, and runtime policy for removing a LaunchDarkly flag by raw key across Nova, CoreApi, aya-talent-marketplace, and QaAutomation.'
argument-hint: 'The feature flag key to remove (for example: WFD-5487-display-strike-duplication)'
user-invocable: false
disable-model-invocation: true
---
# Flag Sunset
## Scope Rule
This workflow is the required entry point for any feature-flag removal request where the user provides a raw flag key or asks to remove a LaunchDarkly flag.
- Always perform cross-repo discovery against every app listed in [applications.md](./applications.md).
- Do not start from an app-specific removal skill when the request is expressed as a flag key. App-specific skills may only be used after this workflow proves the impact is limited to one app and the user explicitly narrows scope.
## Quick Start
```text
/flag-sunset-plugin:run [FLAG_KEY]
```
## User Guide
Operator onboarding, prerequisites, prompts, and workflow notes are documented in [README.md](./README.md).
The operator experience goal is documented in [operator-goal.md](./references/operator-goal.md).
Detailed Preflight and Step 1 procedures are documented in [preflight-step1.md](./references/preflight-step1.md).
Canonical user-facing prompt text is documented in [user-prompts.md](./references/user-prompts.md).
## Runtime Policy
Print before Step 0:
`Execution mode locked: flag-sunset (branch creation required, no automated build/test).`
Print immediately after the execution-mode line:
- `Plugin version: 1.0.0`
- `Preflight start: validating local repository roots and workspace membership.`
Rules:
- No automated build or test commands.
- Prefer compact outputs at every step. Print only the minimum evidence required to resume, validate, and edit safely.
- Outside the mandatory workflow lines in this skill, keep progress updates to one short sentence per phase transition.
- Keep the operator goal in [operator-goal.md](./references/operator-goal.md) in force for all workflow changes.
- A workflow change is not complete if it reintroduces expected permission prompts after Step 1, unless the exception is explicitly documented and justified in the workflow assets.
- Use VS Code prompt UI for workflow questions that require a user reply, using the canonical prompt sections in [user-prompts.md](./references/user-prompts.md). If prompt UI is unavailable, fall back to plain chat with equivalent choices and unchanged gate behavior.
- `read_file` and `get_errors` remain the default VS Code tools on workspace-confirmed paths.
- Local-roots resolution is defined only in [preflight-step1.md](./references/preflight-step1.md#preflight). Do not use alternate config locations outside that procedure.
- When a terminal command is required, use an OS-appropriate form for the active shell. On Windows PowerShell, prefer `Test-Path` and `Get-Date`; on macOS/Linux, prefer `test -d` and `date`.
- Preflight local-root validation must use an OS-appropriate terminal existence check on the resolved repository roots; do not use `list_dir`, `read_file`, or other VS Code filesystem tools on parent repository roots for existence checks.
- Step 1 entry must run main freshness and working-tree validation on each resolved repository root with OS-appropriate terminal git commands before discovery may begin.
- The default workflow must not use subagents at any point in the run. All permission, discovery, edit, and validation actions must remain in the main agent context. Do not invoke a subagent to access a missing workspace project or to bypass a workspace-gate failure.
- Machine-specific checkout roots must not be stored in the plugin. Prefer `.copilot/flag-sunset/local-roots.json` under the `Nova` workspace folder, ignored by Git. Do not create, repair, or write configuration files inside the plugin directory.
- The current VS Code workspace must include every project listed in [applications.md](./applications.md) before Step 0 may begin.
- No file edits before branch proof is printed.
- Permission-bearing tool calls in Step 1 must run serially; do not batch them. Any canceled, dismissed, timed-out, or interrupted result is `STEP_1_INCOMPLETE` — stop and print the current blocked item and latest resumable status line; do not continue with further tool calls, reads, searches, or reasoning-only progress messages. Do not automatically retry the same blocked item more than once in the same run; follow the full state model in [preflight-step1.md](./references/preflight-step1.md#step-1-permissions-and-start-clock).
- Do not ask the Step 0 LaunchDarkly question until all required preflight gates have passed and those pass lines have been printed.
- If any gate fails, stop and ask the user.
- After `Step 1 complete` is printed, the concrete future work set is frozen. Do not run new discovery or confirmation searches at any later step.
## Preflight
Before Step 0:
1. Run the full Preflight procedure in [preflight-step1.md](./references/preflight-step1.md#preflight).
2. Print all required pass and fail lines exactly as defined there.
3. Stop immediately with no Step 0 prompt and no edits on any Preflight gate failure.
## Step 0: LaunchDarkly Final State
- Start Step 0 only after all required preflight pass lines were printed in the current run.
- Step 0 is shown immediately after the preflight workspace gate passes (or immediately after Prompt 2 on first-run setup).
- Step 0 must be captured before any Step 1 main-refresh checks run.
- Show Prompt 3 from [user-prompts.md](./references/user-prompts.md#prompt-3-launchdarkly-final-state-step-0).
- Continue only if the next user reply in this run is exactly `1` or `2`.
- If the next user reply is `3`, stop with no edits. If the next user reply is anything else, or no reply arrives, stop and ask whether to retry or abort.
- Do not infer a default Step 0 selection or print the Step 0 complete line without a valid Step 0 reply.
Required line before Step 1:
`Step 0 complete: LaunchDarkly PROD state captured; proceeding to Step 1 permissions.`
## Step 1: Permissions and Start Clock
Run the full Step 1 state model and execution procedure in [preflight-step1.md](./references/preflight-step1.md#step-1-permissions-and-start-clock).
Required line before Step 2:
`Step 1 complete: permission envelope established; proceeding to Step 2 without further approval prompts.`
## Step 2: Discover Impact
Use the exact local evidence gathered during Step 1. Do not use subagents.
Step 2A: Reuse the candidate app set, identifier mapping, and concrete future work set from Step 1. Do not expand scope unless a Step 1 result is incomplete.
Step 2B: Derive a resolved app table per [search-strategy.md](./references/search-strategy.md) and print per-app status and evidence from Step 1.
Minimum required output from Step 2:
- registry-wide app mapping
- per confirmed app status: `MATCH`, `NO_MATCH`, `PATH_ERROR`, or `READ_ERROR`
- exact identifier mapping for confirmed apps
- definition-file path evidence from local confirmation
- usage files with line numbers only for confirmed apps
- spec, test, or mock files with line numbers only for confirmed apps
Print the full per-app mapping before any usage scan using the exact format defined in [search-strategy.md](./references/search-strategy.md#step-2---read-the-exact-constant-name).
If the mapping cannot be completed, stop and ask the user.
## Step 3: Branch Gate
Print immediately on entering Step 3: `Step 3 started: creating removal branch.`
Do not run any discovery or confirmation searches before or during branch creation. All edit evidence comes from the frozen Step 2 future work set.
Before any edits:
1. Determine the affected repositories.
2. For each affected repository, update the local `main` branch from `origin/main` before creating the removal branch.
3. Create or switch each affected repository to `[FLAG_KEY]-ff-removal` from the updated `main` branch.
4. Print branch proof for each affected repository.
5. If branch proof cannot be established, stop with no edits. Print `Blocked item: [command] [repo]` before stopping.
## Step 4: Edit Scope
Edit only files proven by Step 2.
Rules:
- remove the flag definition and direct usages for affected apps only
- keep exactly one behavior path after removal
- **compound conditions:** when the removed flag appears as one term in a compound condition (e.g. `A && !B` where B is being removed), eliminate only the removed flag's sub-expression and leave other flags intact — the result is `if (A)`, not the else branch; never substitute the removed flag's production value into a compound condition that contains other flags
- keep changes minimal and deterministic — preserve existing patterns, do not add new comments in edited files, and do not modify unrelated tests or neighboring code paths
- **intermediate-variable propagation:** when removing a flag check stored in a local variable, search the entire containing method/function for every reference to that variable. Replace all downstream ternary expressions, `if` guards, and argument usages. A variable removal is incomplete if any reference to it survives.
- **orphaned imports / usings (all languages):** after removing flag-related code, check whether any `using` directive (C#), `import` statement (TypeScript/JS), or similar inclusion became unused as a result. If the removed code was the **last** usage of that import in the file, remove the import. This applies to source files, test files, and controller files equally.
- when a TypeScript source file loses a cleanup-only library import, injected dependency, or provider because of the flag removal, inspect the paired unit test file and remove only the matching stale import/provider/mock/setup there; do not remove broader test scaffolding that is still present in the source file
- **paired spec cleanup (TypeScript):** when a component or service TypeScript file is edited to remove a flag-derived property or signal (e.g. `isEnabledMyFlag`), the co-located `*.spec.ts` MUST also be edited to remove all assignments, overrides, and test blocks that reference that removed property. Examples: `component.isEnabledMyFlag = signal(true)`, test blocks titled "when feature flag is off". This is not optional — orphaned references in the spec will cause compile errors.
- **paired test cleanup (C#):** when a Service or Repository class is edited to remove a flag check, the corresponding `*Tests.cs` file in the matching `*.Tests` project MUST also be edited. Remove all `Mock<ILDClient>.Setup(...)` calls for the removed flag constant, delete losing-path test methods, and remove any local variables that stored the flag mock result. C# test files live in separate test projects (e.g. `Aya.Core.BL.Tests/`), not co-located — search by class name convention (`FooService` → `FooServiceTests`).
- before removing any remaining import from the paired unit test file, verify that the imported symbol has no other references anywhere else in that spec; if the symbol is still used for unrelated setup or assertions, keep the import
- **spec/test files — losing-path deletion:** when a test suite has both an "FF enabled" (winning-path) test and an "FF disabled" (losing-path) test, you MUST delete the entire losing-path test method/block. Do not just remove mock setup lines while leaving the test body intact.
- **spec/test files — winning-path rename:** after deleting the losing-path test, you MUST rename the winning-path test to remove the "when FF is enabled" / "WhenFeatureFlagEnabled" qualifier. Example: rename `CandidateAssignToRecruiter_Should_AssignWfdRecruiter_WhenFeatureFlagEnabled` → `CandidateAssignToRecruiter_Should_AssignWfdRecruiter`. This rename rule applies to all languages (C# `[Fact]`/`[Test]` methods, TypeScript `it()`/`describe()` blocks, etc.). Do NOT skip this rename.
- **spec/test files — behavioral assertion updates:** when flag removal makes a conditional value unconditional, search co-located spec/test files for assertions on affected values:
  - TS: literal expected values matching old losing-path behavior; count/length assertions on collections modified by now-unconditional code
  - C#: `Assert.Null`/`Assert.Equal` on now-populated or changed values; `Mock.Verify(...)` call counts that changed
  Update assertions to match the new unconditional behavior. These won't be found by symbol-driven grep — trace from each source edit to determine downstream value changes.
  **Required:** as each source edit is applied, append a behavioral change entry: `file:property old→new`. This inventory is mandatory input for Step 5.
## Step 5: Static Validation Only
Run static validation only.
Minimum checks:
- zero remaining references to the removed flag in the edited scope
- zero remaining references to any intermediate variable that was removed as part of the flag cleanup (e.g. if `isWfdRecruiterFlagEnabled` was removed, grep for it across the entire file to confirm zero surviving references)
- zero new diagnostics caused by the edits, using `get_errors` scoped to edited files only when diagnostics are needed
- clean imports and clean structure after dead-code removal — verify no orphaned `using` (C#) or `import` (TS/JS) directives remain that lost their last consumer
- **HTML template check:** for every `*.component.ts` that was edited, verify the paired `*.component.html` has zero remaining references to any removed downstream symbol; if references remain, edit the HTML file to remove them
- **spec file check (TS):** for every `*.component.ts` or `*.service.ts` that was edited, verify the paired `*.spec.ts` has zero remaining references to any removed property/signal; if references remain, edit the spec file to remove orphaned assignments and test blocks
- **test file check (C#):** for every edited Service or Repository class, verify the paired `*Tests.cs` has zero remaining `Mock.Setup(...)` calls for the removed flag constant and no surviving losing-path test methods; if references remain, edit the test file to remove them
- **test rename check:** grep all edited test files for method/block names containing `WhenFeatureFlagEnabled`, `WhenFlagEnabled`, `When_FF_Enabled`, or similar flag-conditional qualifiers related to the removed flag; any remaining match must be renamed to remove the qualifier
- **losing-path test deletion check:** grep all edited test files for method/block names containing `WhenFeatureFlagDisabled`, `WhenFlagDisabled`, `When_FF_Disabled`, or similar; any remaining match must be deleted entirely
- **behavioral assertion check:** for every Step 4 behavioral change entry, grep the paired spec/test file for the old literal value in assertion contexts. If found, update to the new value. This check is mandatory for every entry.
Each check listed above runs exactly once per file. Do not repeat a check that already passed.
Scope all reference searches to source files only. Exclude generated outputs, build artifacts, and cache directories (e.g. `.angular/cache`, `bin/`, `obj/`, `dist/`).
If validation fails, fix the issue and rerun Step 5. Do not run automated build or test commands.
## Step 6: Final Output
Print a compact summary containing:
- flag key
- affected repositories and branches
- modified files
- static validation result
- elapsed time
- reminder that manual build and unit-test verification is still required
