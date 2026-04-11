# Application Registry
This shared registry stores repository-relative metadata only.
Machine-specific checkout roots are not stored in this file and must come from either:
- the user's local config file in the user profile
- a session prompt handled by the skill at runtime
Derivation rule:
- local repository root = resolved repository root for the current run
- effective app path = local repository root + `Path in Repo`
- if `Path in Repo` is `./`, the effective app path is the local repository root
- `Search Scope` defines discovery globs relative to the repository root; if omitted, default to the effective app path
- when `Search Scope` contains multiple entries, parse it as a comma-separated list, trim each entry, and execute discovery against each scope independently
Required local root keys:

| Repository |
|---|
| AyaHealthcare/Applications |
| AyaHealthcare/aya-talent-marketplace |

| App | Language | Repository | Path in Repo | Search Scope | Flag Definition File |
|---|---|---|---|---|---|
| Nova | typescript-angular | AyaHealthcare/Applications | Nova/ | Nova/src/app | src/app/shared/models/enums/feature-flag.ts |
| CoreApi | csharp | AyaHealthcare/Applications | Aya.Core.Api/ | | Aya.Core.Common/FeatureManagement/FeatureFlag.cs |
| aya-talent-marketplace | typescript-angular | AyaHealthcare/aya-talent-marketplace | ./ | apps/atm-web/**, libs/** | apps/atm-web/src/app/shared/enums/feature-flag.ts |
| QaAutomation | cypress | AyaHealthcare/Applications | QaAutomation/ | QaAutomation/cypress/e2e | — |

## Multi-Repository Support
When apps live in different GitHub repositories, the search step must query each unique `Repository` value separately. The `Path in Repo` column defines workspace/project derivation, `Search Scope` defines discovery breadth, and the resolved repository roots determine the local filesystem base for both.
