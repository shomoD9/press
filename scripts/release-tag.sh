#!/usr/bin/env bash
# This script creates and publishes an annotated stable release tag for Press. It
# exists so release operations remain repeatable and include a release-notes stub with
# explicit upgrade guidance.
#
# It validates git cleanliness, runs build/test, creates the tag, optionally pushes it,
# and writes a release notes template under docs/releases.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: npm run release:tag -- --version "vX.Y.Z" [--no-push]
USAGE
}

VERSION=""
PUSH_TAG="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="${2:-}"
      shift 2
      ;;
    --no-push)
      PUSH_TAG="false"
      shift 1
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

if [[ -z "$VERSION" ]]; then
  echo "Missing required --version argument."
  usage
  exit 1
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must match vX.Y.Z"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release aborted: git working tree is not clean."
  exit 1
fi

if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "Release aborted: tag already exists: $VERSION"
  exit 1
fi

PREVIOUS_TAG="$(git tag -l 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1)"

echo "[release] Building Press..."
npm run build

echo "[release] Running tests..."
npm test

echo "[release] Creating annotated tag $VERSION..."
git tag -a "$VERSION" -m "Press release $VERSION"

if [[ "$PUSH_TAG" == "true" ]]; then
  echo "[release] Pushing tag to origin..."
  git push origin "$VERSION"
fi

RELEASE_NOTES_FILE="$REPO_ROOT/docs/releases/$VERSION.md"
if [[ ! -f "$RELEASE_NOTES_FILE" ]]; then
  COMMIT_RANGE=""
  if [[ -n "$PREVIOUS_TAG" ]]; then
    COMMIT_RANGE="$PREVIOUS_TAG..$VERSION"
  fi

  {
    echo "# $VERSION"
    echo ""
    echo "## Summary"
    echo ""
    echo "Describe the user-facing changes in this release."
    echo ""
    echo "## Upgrade Notes"
    echo ""
    echo "Call out any install/update or migration actions users must take."
    echo ""
    echo "## Included Commits"
    echo ""
    if [[ -n "$COMMIT_RANGE" ]]; then
      git log --oneline "$COMMIT_RANGE"
    else
      echo "- Initial stable release line."
    fi
  } > "$RELEASE_NOTES_FILE"
fi

echo ""
echo "Release tag created: $VERSION"
echo "Release notes stub: $RELEASE_NOTES_FILE"
if [[ "$PUSH_TAG" == "false" ]]; then
  echo "Tag push skipped (--no-push)."
fi
