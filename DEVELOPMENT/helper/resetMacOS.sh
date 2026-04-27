#!/bin/zsh

set -euo pipefail

SCRIPT_LABEL="flag-sunset test reset (MacOs)"
CODE_APP_SUPPORT="$HOME/Library/Application Support/Code"
SCRIPT_DIR="${0:A:h}"
NOVA_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKSPACE_LOCAL_ROOTS_FILE="$NOVA_ROOT/.copilot/flag-sunset/local-roots.json"

STANDARD_PATHS=(
  "$WORKSPACE_LOCAL_ROOTS_FILE"
  "$CODE_APP_SUPPORT/Cache"
  "$CODE_APP_SUPPORT/CachedData"
  "$CODE_APP_SUPPORT/GPUCache"
)

PROFILE_STATE_PATHS=(
  "$CODE_APP_SUPPORT/User/workspaceStorage"
  "$CODE_APP_SUPPORT/User/globalStorage/github.copilot-chat"
)

full_reset=true

for arg in "$@"; do
  case "$arg" in
    --standard)
      full_reset=false
      ;;
    --aggressive)
      full_reset=true
      ;;
    --help|-h)
      /bin/cat <<'EOF'
Usage:
  zsh DEVELOPMENT/helper/resetMacOS.sh [--standard]

Behavior:
  - Removes the saved flag-sunset local-roots file.
  - Removes standard VS Code cache folders for macOS.
  - By default, also removes workspaceStorage and Copilot Chat global storage to better simulate fresh approval prompts.
  - With --standard, skips workspaceStorage and Copilot Chat global storage removal.

Requirement:
  - Quit VS Code before running this script.
EOF
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$arg" >&2
      exit 1
      ;;
  esac
done

if /usr/bin/pgrep -x "Code" >/dev/null 2>&1; then
  printf '%s: quit VS Code before running this script.\n' "$SCRIPT_LABEL" >&2
  exit 1
fi

printf 'Running %s\n' "$SCRIPT_LABEL"
printf 'Removing standard reset targets...\n'

for path in "${STANDARD_PATHS[@]}"; do
  /bin/rm -rf "$path"
  printf '  removed %s\n' "$path"
done

if [[ "$full_reset" == true ]]; then
  printf 'Removing approval-state reset targets...\n'
  for path in "${PROFILE_STATE_PATHS[@]}"; do
    /bin/rm -rf "$path"
    printf '  removed %s\n' "$path"
  done
fi

printf '\nReset complete.\n'
printf 'Next steps:\n'
printf '  1. Reopen VS Code.\n'
printf '  2. Run /flag-sunset YOUR_FLAG_KEY.\n'
printf '  3. Confirm the workflow recreates Nova/.copilot/flag-sunset/local-roots.json without using the installed plugin directory.\n'
printf '  4. Confirm the source-location prompt only appears when no usable config exists.\n'
printf '  5. If you are testing approval prompts, confirm the Step 1 permission prompt appears again.\n'
