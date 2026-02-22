#!/usr/bin/env bash
# This script validates local Press installation and vault wiring health. It exists so
# bootstrap and daily usage can quickly confirm that deterministic capabilities are
# ready before a writing session begins.
#
# It checks runtime artifacts, command shim availability, and required vault files.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: npm run doctor -- --vault "/absolute/path/to/creative"
USAGE
}

read_config_value() {
  local key="$1"
  local config_file="$2"
  node -e "const fs=require('fs'); const p=process.argv[1]; const k=process.argv[2]; if(!fs.existsSync(p)){process.exit(0);} const raw=fs.readFileSync(p,'utf8'); const obj=JSON.parse(raw); if(obj[k]){process.stdout.write(String(obj[k]));}" "$config_file" "$key"
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
  echo "Doctor failed: no vault path provided and none found in .press-local.json"
  exit 1
fi

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "Doctor failed: vault path does not exist: $VAULT_PATH"
  exit 1
fi

VAULT_PATH="$(cd "$VAULT_PATH" && pwd)"

ERRORS=0
WARNINGS=0

if ! command -v node >/dev/null 2>&1; then
  echo "[doctor] ERROR: node is not available."
  ERRORS=$((ERRORS + 1))
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[doctor] ERROR: npm is not available."
  ERRORS=$((ERRORS + 1))
fi

if [[ ! -f "$REPO_ROOT/dist/index.js" ]]; then
  echo "[doctor] ERROR: build artifact missing at $REPO_ROOT/dist/index.js"
  ERRORS=$((ERRORS + 1))
fi

if [[ -f "$REPO_ROOT/dist/index.js" ]]; then
  if ! node "$REPO_ROOT/dist/index.js" help >/dev/null 2>&1; then
    echo "[doctor] ERROR: Press runtime help command failed."
    ERRORS=$((ERRORS + 1))
  fi
fi

PRESS_SHIM_PATH="$HOME/.local/bin/press"
if [[ ! -x "$PRESS_SHIM_PATH" ]]; then
  echo "[doctor] ERROR: command shim missing or not executable at $PRESS_SHIM_PATH"
  ERRORS=$((ERRORS + 1))
fi

if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  echo "[doctor] WARNING: $HOME/.local/bin is not in PATH."
  WARNINGS=$((WARNINGS + 1))
fi

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "[doctor] ERROR: vault path does not exist: $VAULT_PATH"
  ERRORS=$((ERRORS + 1))
else
  SYSTEM_DIR="$VAULT_PATH/_system"
  if [[ ! -d "$SYSTEM_DIR" ]]; then
    echo "[doctor] ERROR: missing vault _system directory: $SYSTEM_DIR"
    ERRORS=$((ERRORS + 1))
  else
    if [[ ! -f "$SYSTEM_DIR/visual-trigger-ruleset.md" ]]; then
      echo "[doctor] ERROR: missing visual trigger ruleset in vault _system."
      ERRORS=$((ERRORS + 1))
    fi

    if [[ ! -f "$SYSTEM_DIR/press-wiring.md" ]]; then
      echo "[doctor] ERROR: missing press wiring file: $SYSTEM_DIR/press-wiring.md"
      ERRORS=$((ERRORS + 1))
    fi

    for FILE_NAME in CLAUDE.md AGENTS.md; do
      TARGET_FILE="$SYSTEM_DIR/$FILE_NAME"
      if [[ -f "$TARGET_FILE" ]]; then
        if ! grep -q "PRESS_WIRING:BEGIN" "$TARGET_FILE" || ! grep -q "PRESS_WIRING:END" "$TARGET_FILE"; then
          echo "[doctor] WARNING: $TARGET_FILE exists but does not contain Press marker block."
          WARNINGS=$((WARNINGS + 1))
        fi
      fi
    done
  fi
fi

if [[ "$ERRORS" -gt 0 ]]; then
  echo ""
  echo "Doctor failed with $ERRORS error(s) and $WARNINGS warning(s)."
  exit 1
fi

echo ""
echo "Doctor passed with $WARNINGS warning(s)."
