#!/usr/bin/env bash
# This script validates local Press installation and vault wiring health. It exists so
# bootstrap and daily usage can quickly confirm that deterministic capabilities are
# ready before a writing session begins.
#
# It checks runtime artifacts, command shim availability, required vault files, root
# instruction wiring, and Excalidraw MCP bridge readiness.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: npm run doctor -- --vault "/absolute/path/to/creative"
USAGE
}

read_config_value() {
  local key="$1"
  local config_file="$2"
  node -e "const fs=require('fs'); const p=process.argv[1]; const k=process.argv[2]; if(!fs.existsSync(p)){process.exit(0);} const raw=fs.readFileSync(p,'utf8'); const obj=JSON.parse(raw); if(obj[k] !== undefined){process.stdout.write(String(obj[k]));}" "$config_file" "$key"
}

VAULT_PATH=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      VAULT_PATH="${2:-}"
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

if [[ -z "$VAULT_PATH" ]]; then
  VAULT_PATH="$(read_config_value vaultPath "$CONFIG_FILE")"
fi

if [[ -z "$VAULT_PATH" ]]; then
  echo "NOT READY"
  echo "Fix: Set the creative vault path in Press settings, then rerun Press: Ready Check."
  echo "Details:"
  echo "- [ERROR] No vault path provided and none found in .press-local.json."
  exit 1
fi

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "NOT READY"
  echo "Fix: Update Press settings to the correct creative vault path, then rerun Press: Ready Check."
  echo "Details:"
  echo "- [ERROR] Vault path does not exist: $VAULT_PATH"
  exit 1
fi

VAULT_PATH="$(cd "$VAULT_PATH" && pwd)"

ERRORS=0
WARNINGS=0
FIRST_FIX=""
DETAIL_LINES=()

set_first_fix() {
  if [[ -z "$FIRST_FIX" ]]; then
    FIRST_FIX="$1"
  fi
}

record_error() {
  local message="$1"
  local fix="$2"
  echo "[doctor] ERROR: $message"
  ERRORS=$((ERRORS + 1))
  DETAIL_LINES+=("[ERROR] $message")
  set_first_fix "$fix"
}

record_warning() {
  local message="$1"
  echo "[doctor] WARNING: $message"
  WARNINGS=$((WARNINGS + 1))
  DETAIL_LINES+=("[WARNING] $message")
}

if ! command -v node >/dev/null 2>&1; then
  record_error "node is not available." "Install Node.js and rerun Press: Install or Repair."
fi

if ! command -v npm >/dev/null 2>&1; then
  record_error "npm is not available." "Install npm and rerun Press: Install or Repair."
fi

if [[ ! -f "$REPO_ROOT/dist/index.js" ]]; then
  record_error "build artifact missing at $REPO_ROOT/dist/index.js" "Run Press: Install or Repair to rebuild runtime artifacts."
fi

if [[ -f "$REPO_ROOT/dist/index.js" ]]; then
  if ! node "$REPO_ROOT/dist/index.js" help >/dev/null 2>&1; then
    record_error "Press runtime help command failed." "Run Press: Install or Repair to restore runtime health."
  fi
fi

PRESS_SHIM_PATH="$HOME/.local/bin/press"
if [[ ! -x "$PRESS_SHIM_PATH" ]]; then
  record_error "command shim missing or not executable at $PRESS_SHIM_PATH" "Run Press: Install or Repair to reinstall the local command shim."
fi

if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  record_warning "$HOME/.local/bin is not in PATH."
fi

SYSTEM_DIR="$VAULT_PATH/_system"
if [[ ! -d "$SYSTEM_DIR" ]]; then
  record_error "missing vault _system directory: $SYSTEM_DIR" "Choose the correct creative vault path and rerun Press: Install or Repair."
else
  if [[ ! -f "$SYSTEM_DIR/visual-trigger-ruleset.md" ]]; then
    record_error "missing visual trigger ruleset in vault _system." "Restore _system/visual-trigger-ruleset.md, then rerun Press: Ready Check."
  fi

  if [[ ! -f "$SYSTEM_DIR/press-wiring.md" ]]; then
    record_error "missing press wiring file: $SYSTEM_DIR/press-wiring.md" "Run Press: Install or Repair to regenerate vault wiring."
  fi

  for FILE_NAME in CLAUDE.md AGENTS.md; do
    TARGET_FILE="$SYSTEM_DIR/$FILE_NAME"
    if [[ -f "$TARGET_FILE" ]]; then
      if ! grep -q "PRESS_WIRING:BEGIN" "$TARGET_FILE" || ! grep -q "PRESS_WIRING:END" "$TARGET_FILE"; then
        record_warning "$TARGET_FILE exists but does not contain Press marker block."
      fi
    fi
  done
fi

# Root-level files help agents that only inspect project root, like several CLI tools.
for FILE_NAME in CLAUDE.md AGENTS.md WARP.md CODEX.md CURSOR.md; do
  TARGET_FILE="$VAULT_PATH/$FILE_NAME"
  if [[ -f "$TARGET_FILE" ]]; then
    if ! grep -q "PRESS_WIRING:BEGIN" "$TARGET_FILE" || ! grep -q "PRESS_WIRING:END" "$TARGET_FILE"; then
      record_warning "$TARGET_FILE exists but does not contain Press marker block."
    fi
  fi
done

EXCALIDRAW_MCP_COMMAND="$(read_config_value excalidrawMcpCommand "$CONFIG_FILE")"
BRIDGE_SCRIPT="$REPO_ROOT/scripts/excalidraw-mcp-bridge.ts"

if [[ ! -f "$BRIDGE_SCRIPT" ]]; then
  record_error "missing first-party Excalidraw bridge: $BRIDGE_SCRIPT" "Run Press: Install or Repair to restore Excalidraw integration files."
elif [[ -z "$EXCALIDRAW_MCP_COMMAND" ]]; then
  record_warning "Excalidraw MCP command is not configured."
  record_warning "Press will fallback to local placeholder diagrams until configured."
else
  if ! PRESS_EXCALIDRAW_MCP_SERVER_CMD="$EXCALIDRAW_MCP_COMMAND" node --import tsx "$BRIDGE_SCRIPT" --check >/dev/null 2>&1; then
    record_error "Excalidraw MCP bridge check failed for configured command." "Run Press: Connect Services and verify the Excalidraw server command."
  fi
fi

if [[ "$ERRORS" -gt 0 ]]; then
  echo ""
  echo "NOT READY"
  echo "Fix: ${FIRST_FIX:-Run Press: Install or Repair.}"
  echo "Details:"
  for line in "${DETAIL_LINES[@]}"; do
    echo "- $line"
  done
  exit 1
fi

echo ""
echo "READY"
echo "Details:"
for line in "${DETAIL_LINES[@]}"; do
  echo "- $line"
done
echo "- [INFO] Ready check passed with $WARNINGS warning(s)."
