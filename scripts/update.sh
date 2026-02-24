#!/usr/bin/env bash
# This script upgrades Press to the newest stable tagged release. It exists so users
# can stay on a reliable channel with one command while preserving chat-native wiring.
#
# It fetches tags, checks out the target stable version in detached mode, rebuilds,
# retests, refreshes vault wiring, and prints changelog plus rollback instructions.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: npm run update [-- --vault "/absolute/path/to/creative"] [--tag "vX.Y.Z"] [--excalidraw-mcp-command "<server command>"]
USAGE
}

read_config_value() {
  local key="$1"
  local config_file="$2"
  node -e "const fs=require('fs'); const p=process.argv[1]; const k=process.argv[2]; if(!fs.existsSync(p)){process.exit(0);} const raw=fs.readFileSync(p,'utf8'); const obj=JSON.parse(raw); if(obj[k] !== undefined){process.stdout.write(String(obj[k]));}" "$config_file" "$key"
}

VAULT_PATH=""
EXPLICIT_TAG=""
EXCALIDRAW_MCP_COMMAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      VAULT_PATH="${2:-}"
      shift 2
      ;;
    --tag)
      EXPLICIT_TAG="${2:-}"
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
  echo "Update aborted: git working tree is not clean. Commit or stash changes first."
  exit 1
fi

if [[ -z "$VAULT_PATH" ]]; then
  VAULT_PATH="$(read_config_value vaultPath "$CONFIG_FILE")"
fi

if [[ -z "$EXCALIDRAW_MCP_COMMAND" ]]; then
  EXCALIDRAW_MCP_COMMAND="$(read_config_value excalidrawMcpCommand "$CONFIG_FILE")"
fi

echo "[update] Fetching tags..."
git fetch --tags origin

TARGET_TAG="$EXPLICIT_TAG"
if [[ -z "$TARGET_TAG" ]]; then
  TARGET_TAG="$(git tag -l 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1)"
fi

if [[ -z "$TARGET_TAG" ]]; then
  echo "No stable semver tags found."
  exit 1
fi

PREVIOUS_REF="$(git symbolic-ref --short -q HEAD || git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD)"
PREVIOUS_TAG="$(git describe --tags --abbrev=0 2>/dev/null || true)"

echo "[update] Checking out $TARGET_TAG in detached mode..."
git checkout --detach "$TARGET_TAG"

echo "[update] Installing dependencies..."
npm ci

echo "[update] Building Press..."
npm run build

echo "[update] Running tests..."
npm test

if [[ -n "$VAULT_PATH" ]]; then
  if [[ ! -d "$VAULT_PATH" ]]; then
    echo "Configured vault path does not exist: $VAULT_PATH"
    exit 1
  fi
  PRESS_COMMAND="node $REPO_ROOT/dist/index.js"
  echo "[update] Refreshing vault wiring for $VAULT_PATH..."
  node --import tsx "$REPO_ROOT/scripts/install-wiring.ts" --vault "$VAULT_PATH" --press-command "$PRESS_COMMAND" --quiet
fi

node -e '
const fs = require("fs");
const file = process.argv[1];
const data = {
  vaultPath: process.argv[2],
  channel: "stable",
  excalidrawMcpCommand: process.argv[3],
  lastUpdateTag: process.argv[4],
  lastUpdateAt: process.argv[5]
};
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
' "$CONFIG_FILE" "$VAULT_PATH" "$EXCALIDRAW_MCP_COMMAND" "$TARGET_TAG" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo ""
echo "Updated to $TARGET_TAG"
if [[ -n "$PREVIOUS_TAG" && "$PREVIOUS_TAG" != "$TARGET_TAG" ]]; then
  echo ""
  echo "Changelog summary ($PREVIOUS_TAG..$TARGET_TAG):"
  git log --oneline "$PREVIOUS_TAG..$TARGET_TAG"
fi

echo ""
echo "Rollback command: git checkout $PREVIOUS_REF"
