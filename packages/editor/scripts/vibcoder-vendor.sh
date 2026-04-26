#!/usr/bin/env bash
# Vibcoder vendoring pipeline. Sequenced: pin → codemod 1 → 2 → 3.
# @license BSD-3-Clause

set -e

# Resolve script directory BEFORE cd so baseline-file lookups work regardless of
# whether the script is invoked from repo root or packages/editor.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../../.."

step() { echo ""; echo "=== $1 ==="; }
fail() { echo "ORCHESTRATOR FAIL: $1"; exit 1; }

step "1/4 bundle pin"
bun packages/editor/scripts/vibcoder-bundle-pin.mjs || fail "bundle pin"

step "2/4 codemod 1: class + animation rename"
bun packages/editor/scripts/vibcoder-codemod-1.mjs || fail "codemod 1"

step "3/4 codemod 2: token fold surface"
bun packages/editor/scripts/vibcoder-codemod-2.mjs || fail "codemod 2"

step "4/4 codemod 3: alias bridge"
bun packages/editor/scripts/vibcoder-codemod-3.mjs || fail "codemod 3"

echo ""
echo "vibcoder-vendor: complete"
