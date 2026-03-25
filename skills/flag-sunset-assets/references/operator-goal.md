# Operator Goal

The operator experience for `flag-sunset` should follow this sequence:

1. Start the tool.
2. Answer Preflight and Step 1 questions or permission prompts.
3. After Step 1 completes, the agent should be able to continue unattended while the user pivots to another task.

Implications:

- Preflight and Step 1 are the only phases where user interaction should normally be required.
- Step 2 and beyond should avoid new permission prompts by relying on the Step 1 workspace gate and permission envelope.
- When possible, reduce long-running continuation pressure after Step 1 so the workflow can proceed unattended.
- Changes that improve one issue must not reintroduce prompt churn or hanging behavior after Step 1.

Acceptance criterion:

- A workflow change is not complete if it reintroduces expected permission prompts after Step 1, unless the exception is explicitly documented and justified in the workflow assets.