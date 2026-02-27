#!/usr/bin/env bash
# This script rolls Press back to a previous known-good git reference. It exists so
# non-technical recovery is one command and preserves vault wiring consistency.
#
# It resolves a rollback target from explicit input or saved update metadata, checks
# out that reference in detached mode, rebuilds and retests, and refreshes vault wiring.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: npm run rollback [-- --vault "/absolute/path/to/creative"] [--ref "<git-ref>"] [--excalidraw-mcp-command "<server command>"]
USAGE
}

read_config_value() {
  local key="$1"
  local config_file="$2"
  node -e "const fs=require('fs'); const p=process.argv[1]; const k=process.argv[2]; if(!fs.existsSync(p)){process.exit(0);} const raw=fs.readFileSync(p,'utf8'); const obj=JSON.parse(raw); if(obj[k] !== undefined){process.stdout.write(String(obj[k]));}" "$config_file" "$key"
}

VAULT_PATH=""
TARGET_REF=""
EXCALIDRAW_MCP_COMMAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      VAULT_PATH="${2:-}"
      shift 2
      ;;
    --ref)
      TARGET_REF="${2:-}"
      shift 2
      ;;
    --excalidraw-mcp-command)
      EXCALIDRAW_MCP_COMMAND="${2:-}"
      shift 2
      ;;
    --help|help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$REPO_ROOT/.press-local.json"

cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Rollback aborted: git working tree is not clean. Commit or stash changes first."
  exit 1
fi

if [[ -z "$VAULT_PATH" ]]; then
  VAULT_PATH="$(read_config_value vaultPath "$CONFIG_FILE")"
fi

if [[ -z "$EXCALIDRAW_MCP_COMMAND" ]]; then
  EXCALIDRAW_MCP_COMMAND="$(read_config_value excalidrawMcpCommand "$CONFIG_FILE")"
fi

if [[ -z "$TARGET_REF" ]]; then
  TARGET_REF="$(read_config_value rollbackRef "$CONFIG_FILE")"
fi

if [[ -z "$TARGET_REF" ]]; then
  echo "Rollback aborted: no rollback ref provided and none saved in .press-local.json"
  exit 1
fi

if ! git rev-parse "$TARGET_REF" >/dev/null 2>&1; then
  echo "Rollback aborted: target ref does not exist: $TARGET_REF"
  exit 1
fi

CURRENT_REF="$(git symbolic-ref --short -q HEAD || git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD)"
CURRENT_TAG="$(git describe --tags --abbrev=0 2>/dev/null || true)"

echo "[rollback] Checking out $TARGET_REF in detached mode..."
git checkout --detach "$TARGET_REF"

echo "[rollback] Installing dependencies..."
npm ci

echo "[rollback] Building Press..."
npm run build

echo "[rollback] Running tests..."
npm test

if [[ -n "$VAULT_PATH" ]]; then
  if [[ ! -d "$VAULT_PATH" ]]; then
    echo "Configured vault path does not exist: $VAULT_PATH"
    exit 1
  fi
  PRESS_COMMAND="node $REPO_ROOT/dist/index.js"
  echo "[rollback] Refreshing vault wiring for $VAULT_PATH..."
  node --import tsx "$REPO_ROOT/scripts/install-wiring.ts" --vault "$VAULT_PATH" --press-command "$PRESS_COMMAND" --quiet
fi

# We keep previous state and flip rollbackRef to the ref we came from for easy undo.
node -e '
const fs = require("fs");
const file = process.argv[1];
const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
const next = {
  ...existing,
  vaultPath: process.argv[2],
  channel: "stable",
  excalidrawMcpCommand: process.argv[3],
  lastRollbackRef: process.argv[4],
  lastRollbackAt: process.argv[5],
  rollbackRef: process.argv[6],
  rollbackTag: process.argv[7]
};
fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
' "$CONFIG_FILE" "$VAULT_PATH" "$EXCALIDRAW_MCP_COMMAND" "$TARGET_REF" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$CURRENT_REF" "$CURRENT_TAG"

echo ""
echo "Rolled back to $TARGET_REF"
echo "Undo rollback command: npm run rollback -- --ref \"$CURRENT_REF\""
