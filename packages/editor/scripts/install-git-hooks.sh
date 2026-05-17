#!/usr/bin/env bash
# Buildrik editor — install repo-local git hooks.
#
# Run once per clone:
#   bash packages/editor/scripts/install-git-hooks.sh
#
# Copies hook scripts from `packages/editor/scripts/hooks/` into the local
# `.git/hooks/` directory and marks them executable. Idempotent — re-running
# overwrites the existing hooks with the latest checked-in version.
#
# Why copy rather than symlink: symlinks can break across worktrees, OS
# clones, and `pnpm` install paths. Copy is dumb but works everywhere.
#
# @license BSD-3-Clause

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_SRC_DIR="$REPO_ROOT/packages/editor/scripts/hooks"
HOOK_DEST_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOK_SRC_DIR" ]; then
  echo "ERROR: hook source dir not found: $HOOK_SRC_DIR"
  exit 1
fi

if [ ! -d "$HOOK_DEST_DIR" ]; then
  echo "ERROR: .git/hooks not found — are you in a git repo?"
  exit 1
fi

echo "Installing git hooks from $HOOK_SRC_DIR → $HOOK_DEST_DIR"
for hook in "$HOOK_SRC_DIR"/*; do
  [ -f "$hook" ] || continue
  name="$(basename "$hook")"
  cp "$hook" "$HOOK_DEST_DIR/$name"
  chmod +x "$HOOK_DEST_DIR/$name"
  echo "  installed: $name"
done

echo ""
echo "Done. Hooks active for this clone."
echo "Re-run after pulling hook updates: bash packages/editor/scripts/install-git-hooks.sh"
