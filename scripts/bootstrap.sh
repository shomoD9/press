#!/usr/bin/env bash
# This script performs first-time Press setup for a user machine. It exists so the
# product can be installed with one command and immediately become usable from agent
# chat without recurring manual CLI steps.
#
# It validates prerequisites, builds and tests the runtime, installs a local command
# shim, wires the target creative vault, stores local install metadata (including
# Excalidraw MCP command when provided), and runs a health check.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: npm run bootstrap -- --vault "/absolute/path/to/creative" [--excalidraw-mcp-command "<server command>"]
USAGE
}

VAULT_PATH=""
EXCALIDRAW_MCP_COMMAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      VAULT_PATH="${2:-}"
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

if [[ -z "$VAULT_PATH" ]]; then
  echo "Missing required --vault argument."
  usage
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but was not found in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [[ ! -d "$VAULT_PATH" ]]; then
  echo "Vault path does not exist: $VAULT_PATH"
  exit 1
fi
VAULT_PATH="$(cd "$VAULT_PATH" && pwd)"

cd "$REPO_ROOT"

echo "[bootstrap] Installing dependencies..."
npm ci

echo "[bootstrap] Building Press..."
npm run build

echo "[bootstrap] Running tests..."
npm test

INSTALL_BIN_DIR="$HOME/.local/bin"
PRESS_SHIM_PATH="$INSTALL_BIN_DIR/press"
PRESS_COMMAND="node $REPO_ROOT/dist/index.js"

echo "[bootstrap] Installing command shim at $PRESS_SHIM_PATH..."
mkdir -p "$INSTALL_BIN_DIR"
cat > "$PRESS_SHIM_PATH" <<SHIM
#!/usr/bin/env bash
set -euo pipefail
export PRESS_EXCALIDRAW_EXEC="node"
export PRESS_EXCALIDRAW_ARGS="--import tsx $REPO_ROOT/scripts/excalidraw-mcp-bridge.ts"
node "$REPO_ROOT/dist/index.js" "\$@"
SHIM
chmod +x "$PRESS_SHIM_PATH"

echo "[bootstrap] Installing vault wiring..."
node --import tsx "$REPO_ROOT/scripts/install-wiring.ts" --vault "$VAULT_PATH" --press-command "$PRESS_COMMAND"

# We write config via Node so values remain valid JSON even when commands contain quotes.
node -e '
const fs = require("fs");
const path = require("path");
const file = path.join(process.argv[1], ".press-local.json");
const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
const data = {
  ...existing,
  vaultPath: process.argv[2],
  channel: "stable",
  excalidrawMcpCommand: process.argv[3],
  lastBootstrapAt: process.argv[4]
};
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
' "$REPO_ROOT" "$VAULT_PATH" "$EXCALIDRAW_MCP_COMMAND" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "[bootstrap] Running doctor checks..."
bash "$REPO_ROOT/scripts/doctor.sh" --vault "$VAULT_PATH"

if [[ ":$PATH:" != *":$INSTALL_BIN_DIR:"* ]]; then
  echo "[bootstrap] Note: $INSTALL_BIN_DIR is not in your PATH."
  echo "Add this line to ~/.zshrc: export PATH=\"$INSTALL_BIN_DIR:\$PATH\""
fi

if [[ -z "$EXCALIDRAW_MCP_COMMAND" ]]; then
  echo "[bootstrap] Note: Excalidraw MCP server command was not provided."
  echo "Press will work with local fallback diagrams until MCP command is configured in .press-local.json."
fi

echo ""
echo "Press Publish V1.5 is ready."
echo "Try natural-language prompts in your agent, such as:"
echo "- Generate a diagram for this excerpt in drafts/draft-01.md"
echo "- Refine diagram-01 to simplify labels"
echo "- Generate visual plan for this project from essay.md"
echo "- Validate the visual plan before I lock it"
echo "- Build an article draft package for this project"
