#!/usr/bin/env bash
# check-vocab-add.sh
#
# Validates that any commit introducing a NEW --buildrick-* token in
# themes/design-system/*.css contains the required vocab-add: line in its
# commit body. Rule defined in TODOS.md "Vibcoder DS Bridge — Define
# vocabulary expansion sign-off process" (RULE DEFINED 2026-04-26).
#
# Required body line format:
#   vocab-add: <token name> | tier=<tier> | design-md=<section OR "no-change-required: <reason>"> | ack=<initials>
#
# Triggers when:
#   - Commit modifies any file under packages/editor/src/themes/design-system/*.css
#   - AND introduces at least one NEW --buildrick-* token definition (added line
#     matching `^+\s*--buildrick-[a-z0-9-]+:` that has no matching removed line
#     for the same token name).
#
# Skips when:
#   - Commit is a merge commit (multiple parents)
#   - No design-system/*.css file touched
#   - Only modifies existing tokens (value change, no new name)
#
# Usage:
#   scripts/check-vocab-add.sh                   # validate HEAD
#   scripts/check-vocab-add.sh <commit-sha>      # validate specific commit
#   scripts/check-vocab-add.sh --self-test       # run built-in tests

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
DS_DIR="packages/editor/src/themes/design-system"

validate_commit() {
  local sha="$1"

  # Normalize cwd: git show --name-only returns paths relative to cwd, but
  # ${DS_DIR} is relative to repo root. Without this cd, the regex misses
  # matches when invoked from a subdirectory (e.g., CI working-directory or
  # IDE-spawned shells under packages/editor/).
  cd "$REPO_ROOT"

  if [ "$(git cat-file -p "$sha" | grep -c '^parent ')" -gt 1 ]; then
    echo "skip: $sha is a merge commit"
    return 0
  fi

  local touched_ds
  touched_ds=$(git show --name-only --format= "$sha" 2>/dev/null \
    | grep -E "^${DS_DIR}/[^/]+\.css$" || true)

  if [ -z "$touched_ds" ]; then
    return 0
  fi

  local added removed new_tokens
  added=$(git show --format= --unified=0 "$sha" -- "${DS_DIR}/*.css" 2>/dev/null \
    | grep -E '^\+[[:space:]]*--buildrick-[a-z0-9-]+:' \
    | sed -E 's/^\+[[:space:]]*(--buildrick-[a-z0-9-]+):.*/\1/' \
    | sort -u || true)
  removed=$(git show --format= --unified=0 "$sha" -- "${DS_DIR}/*.css" 2>/dev/null \
    | grep -E '^-[[:space:]]*--buildrick-[a-z0-9-]+:' \
    | sed -E 's/^-[[:space:]]*(--buildrick-[a-z0-9-]+):.*/\1/' \
    | sort -u || true)
  new_tokens=$(comm -23 <(echo "$added") <(echo "$removed") | grep -v '^$' || true)

  if [ -z "$new_tokens" ]; then
    return 0
  fi

  local body
  body=$(git log -1 --format=%B "$sha")

  local missing=()
  while IFS= read -r token; do
    [ -z "$token" ] && continue
    if ! echo "$body" | grep -qE "^vocab-add:[[:space:]]+${token}[[:space:]]*\|"; then
      missing+=("$token")
    fi
  done <<< "$new_tokens"

  if [ ${#missing[@]} -gt 0 ]; then
    echo "ERROR: commit $sha adds new --buildrick-* token(s) without vocab-add: line in body"
    echo ""
    echo "Missing vocab-add lines for:"
    for t in "${missing[@]}"; do
      echo "  - $t"
    done
    echo ""
    echo "Required format (one line per new token in commit body):"
    echo "  vocab-add: <token> | tier=<tier> | design-md=<section OR no-change-required: reason> | ack=<initials>"
    echo ""
    echo "See TODOS.md 'Vibcoder DS Bridge — Define vocabulary expansion sign-off process'"
    return 1
  fi

  echo "vocab-add validation: PASS for $sha"
  return 0
}

self_test() {
  local tmp passed=0 failed=0
  tmp=$(mktemp -d)
  cd "$tmp"
  git init -q
  git config user.email test@example.com
  git config user.name test
  mkdir -p "${DS_DIR}"

  cat > "${DS_DIR}/radius.css" <<'EOF'
:root {
  --buildrick-radius-md: 8px;
}
EOF
  git add . && git commit -q -m "seed"

  # CASE 1: new token, missing vocab-add → must FAIL
  cat > "${DS_DIR}/radius.css" <<'EOF'
:root {
  --buildrick-radius-md: 8px;
  --buildrick-radius-xl: 16px;
}
EOF
  git add . && git commit -q -m "feat: add xl radius"
  if "$REPO_ROOT/packages/editor/scripts/check-vocab-add.sh" HEAD 2>/dev/null; then
    echo "SELF-TEST 1: FAIL (should have rejected new token without vocab-add)"
    failed=$((failed+1))
  else
    echo "SELF-TEST 1: PASS (rejected missing vocab-add)"
    passed=$((passed+1))
  fi

  # CASE 2: new token, vocab-add present → must PASS
  cat > "${DS_DIR}/radius.css" <<'EOF'
:root {
  --buildrick-radius-md: 8px;
  --buildrick-radius-xl: 16px;
  --buildrick-radius-2xl: 24px;
}
EOF
  git add . && git commit -q -m "feat: add 2xl radius

vocab-add: --buildrick-radius-2xl | tier=24px (above xl=16) | design-md=A1.3 Border-radius scale (added 2xl row) | ack=TEST
"
  if "$REPO_ROOT/packages/editor/scripts/check-vocab-add.sh" HEAD 2>/dev/null; then
    echo "SELF-TEST 2: PASS (accepted valid vocab-add)"
    passed=$((passed+1))
  else
    echo "SELF-TEST 2: FAIL (should have accepted valid vocab-add)"
    failed=$((failed+1))
  fi

  # CASE 3: only value change, no new token → must PASS (no vocab-add needed)
  cat > "${DS_DIR}/radius.css" <<'EOF'
:root {
  --buildrick-radius-md: 10px;
  --buildrick-radius-xl: 16px;
  --buildrick-radius-2xl: 24px;
}
EOF
  git add . && git commit -q -m "fix: bump radius-md to 10px"
  if "$REPO_ROOT/packages/editor/scripts/check-vocab-add.sh" HEAD 2>/dev/null; then
    echo "SELF-TEST 3: PASS (value change ignored)"
    passed=$((passed+1))
  else
    echo "SELF-TEST 3: FAIL (value change should not require vocab-add)"
    failed=$((failed+1))
  fi

  # CASE 4: non-DS file touched → must PASS (no vocab-add needed)
  echo "console.log('hi');" > unrelated.ts
  git add . && git commit -q -m "chore: add unrelated file"
  if "$REPO_ROOT/packages/editor/scripts/check-vocab-add.sh" HEAD 2>/dev/null; then
    echo "SELF-TEST 4: PASS (non-DS commit ignored)"
    passed=$((passed+1))
  else
    echo "SELF-TEST 4: FAIL (non-DS commit should not require vocab-add)"
    failed=$((failed+1))
  fi

  cd "$REPO_ROOT"
  rm -rf "$tmp"

  echo ""
  echo "Self-test summary: $passed passed, $failed failed"
  [ "$failed" -eq 0 ]
}

if [ "${1:-}" = "--self-test" ]; then
  self_test
  exit $?
fi

target="${1:-HEAD}"
validate_commit "$target"
