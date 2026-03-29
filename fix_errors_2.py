#!/usr/bin/env python3
"""
Second pass: fix remaining false positives and depth errors.

  I)  src/editor/sidebar/**/*.tsx with '../shared/types' → '../types'  (LOCAL tab types.ts)
  J)  src/shared/utils/**/*.ts with '../../helpers' → '../helpers'  (sibling dir)
  K)  src/shared/utils/dragDrop/*.ts with '../../engine/...' → '../../../engine/...'
  L)  src/shared/utils/dragDrop/dropValidation.ts '../../nesting' → '../nesting'
"""
import subprocess
from pathlib import Path

SRC = Path("src")


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def write(p: Path, text: str):
    p.write_text(text, encoding="utf-8")
    subprocess.run(f"git add '{p}'", shell=True, capture_output=True, cwd=".")


fixes = []

# ─── I: src/editor/sidebar/**  '../shared/types' → '../types' ────────────────
for f in sorted(SRC.glob("editor/sidebar/**/*.ts*")):
    content = read(f)
    new = content.replace('"../shared/types"', '"../types"').replace(
        "'../shared/types'", "'../types'"
    )
    if new != content:
        write(f, new)
        fixes.append(f"  I: {f}")

# ─── J: src/shared/utils/**  '../../helpers' → '../helpers' ──────────────────
# (only for files at depth shared/utils/X/*.ts, where helpers/ is a sibling of X/)
for f in sorted(SRC.glob("shared/utils/**/*.ts*")):
    content = read(f)
    new = content.replace('"../../helpers"', '"../helpers"').replace(
        "'../../helpers'", "'../helpers'"
    )
    # Also fix '../../nesting' → '../nesting' for files at shared/utils/*/
    # (nesting/ is a sibling directory within shared/utils/)
    new = new.replace('"../../nesting"', '"../nesting"').replace(
        "'../../nesting'", "'../nesting'"
    )
    if new != content:
        write(f, new)
        fixes.append(f"  J: {f}")

# ─── K: src/shared/utils/dragDrop/*.ts  '../../engine/...' → '../../../engine/...' ──
# Files at src/shared/utils/dragDrop/ need 3 levels up to reach src/engine/
import re
for f in sorted(SRC.glob("shared/utils/dragDrop/*.ts*")):
    content = read(f)
    new = re.sub(
        r'"(\.\./\.\./)(engine/[^"]+)"',
        r'"../\1\2"',  # add one more ../
        content,
    )
    new = re.sub(
        r"'(\.\./\.\./)(engine/[^']+)'",
        r"'../\1\2'",
        new,
    )
    if new != content:
        write(f, new)
        fixes.append(f"  K: {f}")

print(f"\nFixed {len(fixes)} files:")
for f in fixes:
    print(f)
print("\nDone. Run: npx tsc --noEmit")
