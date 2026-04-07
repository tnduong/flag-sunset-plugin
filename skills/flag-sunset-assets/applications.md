# Application Registry

This shared registry stores repository-relative metadata only.

Machine-specific checkout roots are not stored in this file and must come from either:
- the user's local config file in the user profile
- a session prompt handled by the skill at runtime

Derivation rule:
- local repository root = resolved repository root for the current run
- effective app path = local repository root + `Path in Repo`
- if `Path in Repo` is `./`, the effective app path is the local repository root

Required local root keys:

| Repository |
|---|
| AyaHealthcare/Applications |
| AyaHealthcare/aya-talent-marketplace |

| App | Language | Repository | Path in Repo | Usage Search Path | Flag Definition File | Build Command | Test Command |
|---|---|---|---|---|---|---|---|
| Nova | typescript-angular | AyaHealthcare/Applications | Nova/ | src/app | src/app/shared/models/enums/feature-flag.ts | *(combined with test)* | `NODE_OPTIONS="--max-old-space-size=8192" npx ng test --include="[SPEC_PATH]" --watch=false --browsers=ChromeHeadlessCI` |
| CoreApi | csharp | AyaHealthcare/Applications | Aya.Core.Api/ | Aya.Core.Api/, Aya.Core.BL/, Aya.Core.Common/ | Aya.Core.Common/FeatureManagement/FeatureFlag.cs | `dotnet build` | `dotnet test Aya.Core.BL.Tests/Aya.Core.BL.Tests.csproj --filter "FullyQualifiedName~[TEST_FILTER]" --no-build` |
| aya-talent-marketplace | typescript-angular | AyaHealthcare/aya-talent-marketplace | ./ | apps/atm-web/, libs/ | apps/atm-web/src/app/shared/enums/feature-flag.ts | `npm run build` | `npx nx test atm-web --include="[SPEC_PATH]" --watch=false --browsers=ChromeHeadlessCI` |
| QaAutomation | cypress | AyaHealthcare/Applications | QaAutomation/ | cypress/e2e/ | — | — | — |

## App-Specific Notes

- **Nova:** No separate build phase. TypeScript compilation runs automatically with the test command.
- **aya-talent-marketplace:** Uses `@angular/build:karma`. Use `--include`, not Jest-only flags.
- **CoreApi:** Target `Aya.Core.BL.Tests/Aya.Core.BL.Tests.csproj` directly instead of the whole solution.
- **QaAutomation:** Edit-only. No build or test commands.
- **Usage Search Path:** Scope terminal usage grep to these paths to avoid broad repository-wide searches that can timeout.

## Multi-Repository Support

When apps live in different GitHub repositories, the search step must query each unique `Repository` value separately. The `Path in Repo` column scopes searches within each repository, and the resolved repository roots determine the local filesystem base for that repository.
