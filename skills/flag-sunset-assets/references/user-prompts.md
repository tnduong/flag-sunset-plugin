# Flag Sunset User Prompts

This file is the canonical source for workflow user-facing prompts.
Other workflow docs should reference these sections instead of duplicating prompt text.

Delivery requirement: VS Code prompt UI for Prompt 1, Prompt 2, and Prompt 3.
Fallback: plain chat with equivalent choices only when prompt UI is unavailable.

## Prompt UI Contract Rules

- Use the exact Message and Options text defined below.
- For choice prompts, render selectable UI choices and capture a single mapped value.
- For Prompt 2 and Prompt 3, do not use free-form text in chat when prompt UI is available.
- Keep gate behavior unchanged when fallback chat is used.

## Prompt 1: Parent Folder Input (Preflight)

When shown: setup-only, first run when local-roots config is unavailable.

Prompt ID: preflight_parent_folder_input

UI Control: text input

Message:
Enter parent folder containing Applications and aya-talent-marketplace.

Validation:
- non-empty input
- absolute path
- value is used to derive both repository roots

Captured value:
- raw input path string

## Prompt 2: Derived Paths Confirmation (Preflight)

When shown: setup-only, immediately after Prompt 1.

Prompt ID: preflight_derived_roots_confirmation

UI Control: static choice

Message:
Use these roots?

Details:
- AyaHealthcare/Applications = [PARENT]/Applications
- AyaHealthcare/aya-talent-marketplace = [PARENT]/aya-talent-marketplace

Options:
- YES (map to YES)
- NO (map to NO)

Validation:
- Continue only when YES is selected
- On NO, stop with no Step 0 prompt and no edits

## Prompt 3: LaunchDarkly Final State (Step 0)

When shown: always, every Step 0 execution.

Prompt ID: step0_launchdarkly_prod_state

UI Control: static choice

Message:
Select LaunchDarkly PROD state.

Options:
1. TRUE on PROD, continue (map to 1)
2. FALSE on PROD, continue (remove full feature) (map to 2)
3. Quit (map to 3)

Validation:
- Continue only on mapped values 1 or 2.
- Stop with no edits on mapped value 3.
- If no valid selection is captured, stop and ask whether to retry or abort.