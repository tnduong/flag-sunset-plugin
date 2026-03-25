# Search Subagent Template

Use this prompt template when Step 2 calls `search_subagent`.

The main agent should precompute and pass a resolved app table from [../applications.md](../applications.md) before invoking the subagent. The subagent must use those resolved paths exactly as provided.

Only include apps that were locally confirmed after the `#search_code` prefilter. Do not expand scope unless the main agent explicitly asks for fallback coverage.

```text
Using grep or grep_search only, perform local usage discovery for feature flag removal of [FLAG_KEY].

Resolved app table:
[PASTE_RESOLVED_APP_TABLE]

Required tasks:
1. For each confirmed app, search the app's usage roots for its exact identifier.
2. Search spec/test/mock locations for the exact LaunchDarkly key string to find mock setups.
3. For QaAutomation, follow the two-step feature-file search described in search-strategy.md.

Return all of the following for locally confirmed apps only:
- one compact status row per app using this format:
  - `APP [App] status=[MATCH|NO_MATCH|PATH_ERROR|READ_ERROR] def=[path] id=[Identifier|NO_MATCH]`
- for matched apps only, one usage row per app:
  - `USAGE [App] files=[path1:line,path2:line,...]`
- for matched apps only, one test/mock row per app when applicable:
  - `TESTS [App] files=[path1:line,path2:line,...]`

Rules:
- Do not infer paths from app names.
- Do not use semantic search.
- Do not make edits.
- If a path cannot be read, report PATH_ERROR or READ_ERROR instead of NO_MATCH.
- Keep the response compact. Do not include prose, snippets, or repeated headings.
```
