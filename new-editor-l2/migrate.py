#!/usr/bin/env python3
"""
Physical migration: src/types/ + src/utils/ + src/constants/ → src/shared/
- Moves files using git mv (preserves history)
- Fixes depth-adjusted imports in moved files (../ → ../../ for non-sibling dirs)
- Updates all external imports to use new shared/ paths
- Deletes utils backward-compat barrels (dragDropHelpers, helpers, htmlHelpers, nestingRules, parsers)
"""

import re
import os
import subprocess
from pathlib import Path

SRC = Path("src")

UTILS_BARREL_NAMES = {
    "dragDropHelpers.ts",
    "helpers.ts",
    "htmlHelpers.ts",
    "nestingRules.ts",
    "parsers.ts",
}

# Barrel imports that need renaming (old_name → new_dir)
BARREL_RENAME_MAP = {
    "dragDropHelpers": "dragDrop",
    "htmlHelpers":     "html",
    "nestingRules":    "nesting",
}

# Directories that move together (relative imports between them are preserved)
SIBLING_DIRS = {"types", "utils", "constants", "shared"}

def run(cmd: str, cwd: str = ".") -> bool:
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    if result.returncode != 0:
        print(f"  WARN [{cmd[:60]}]: {result.stderr.strip()[:100]}")
        return False
    return True


def git_rm(path: Path):
    run(f"git rm --quiet '{path}'")


def git_mv(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    ok = run(f"git mv '{src}' '{dst}'")
    if not ok:
        # Fallback: copy + git add + git rm
        import shutil
        shutil.copy2(src, dst)
        run(f"git add '{dst}'")
        run(f"git rm --quiet --force '{src}'")


def git_add(path: Path):
    run(f"git add '{path}'")


# ─────────────────────────────────────────────────────────────────────────────
# Import-fixing helpers
# ─────────────────────────────────────────────────────────────────────────────

def fix_depth_imports(content: str) -> str:
    """
    Called on files that MOVED from src/X/ → src/shared/X/ (one level deeper).
    Any '../Y' import where Y does NOT start with types/utils/constants/shared
    needs to become '../../Y' (one extra level up).
    """
    def replacer(m):
        quote = m.group(1)   # from "  or  from '
        target = m.group(2)  # engine/Composer  or  services/ai  etc.
        # If target is a sibling dir that also moved, leave alone
        first_segment = target.split("/")[0]
        if first_segment in SIBLING_DIRS:
            return m.group(0)
        # Add one extra level
        return f"{quote}../../{target}"

    # Match: from ['"]../NON-DOT-PREFIXED-PATH
    return re.sub(r'(from ["\'])\.\.\/([^./][^"\']*)', replacer, content)


def fix_barrel_renames(content: str, prefix: str) -> str:
    """Rename deleted utils barrels → their canonical subdirectory."""
    for old, new in BARREL_RENAME_MAP.items():
        # e.g. ../../utils/dragDropHelpers → ../../shared/utils/dragDrop
        content = re.sub(
            rf'(from ["\']){re.escape(prefix)}utils/{re.escape(old)}(["\'/])',
            lambda m, new=new, prefix=prefix: f"{m.group(1)}{prefix}shared/utils/{new}{m.group(2)}",
            content,
        )
    return content


def fix_external_imports(content: str) -> str:
    """
    Called on files OUTSIDE the moved dirs.
    Insert 'shared/' before types/utils/constants in relative import paths.
    e.g.  ../../types/element  →  ../../shared/types/element
          ../constants/tabs     →  ../shared/constants/tabs
    """
    # First rename deleted barrels
    for old, new in BARREL_RENAME_MAP.items():
        content = re.sub(
            rf'(from ["\'])((?:\.\.\/)+)utils/{re.escape(old)}(["\'/])',
            lambda m, new=new: f"{m.group(1)}{m.group(2)}shared/utils/{new}{m.group(3)}",
            content,
        )
    # General: add shared/ before types|utils|constants
    content = re.sub(
        r'(from ["\'])((?:\.\.\/)+)(types|utils|constants)([/"\'\\])',
        lambda m: f"{m.group(1)}{m.group(2)}shared/{m.group(3)}{m.group(4)}",
        content,
    )
    return content


def write_file(path: Path, text: str):
    path.write_text(text, encoding="utf-8")
    git_add(path)


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: types/
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 1: types/ → shared/types/ ===")

# Remove existing redirect barrel
git_rm(SRC / "shared" / "types" / "index.ts")

types_dir = SRC / "types"
for f in sorted(types_dir.glob("*.ts")):
    dst = SRC / "shared" / "types" / f.name
    print(f"  mv {f} → {dst}")
    git_mv(f, dst)
    # Fix depth-level imports in the moved file
    content = dst.read_text(encoding="utf-8")
    fixed = fix_depth_imports(content)
    if fixed != content:
        write_file(dst, fixed)

# Rewrite root types/index.ts as redirect barrel
write_file(
    SRC / "types" / "index.ts",
    '/**\n * types/ — redirect barrel\n * Canonical: shared/types/\n * @license BSD-3-Clause\n */\nexport * from "../shared/types";\n',
)
print("  ✓ types/index.ts → redirect barrel")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: constants/
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 2: constants/ → shared/constants/ ===")

git_rm(SRC / "shared" / "constants" / "index.ts")

constants_dir = SRC / "constants"
for f in sorted(constants_dir.glob("*.ts")):
    dst = SRC / "shared" / "constants" / f.name
    print(f"  mv {f} → {dst}")
    git_mv(f, dst)
    content = dst.read_text(encoding="utf-8")
    fixed = fix_depth_imports(content)
    if fixed != content:
        write_file(dst, fixed)

write_file(
    SRC / "constants" / "index.ts",
    '/**\n * constants/ — redirect barrel\n * Canonical: shared/constants/\n * @license BSD-3-Clause\n */\nexport * from "../shared/constants";\n',
)
print("  ✓ constants/index.ts → redirect barrel")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: utils/ → shared/utils/
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 3: utils/ → shared/utils/ ===")

git_rm(SRC / "shared" / "utils" / "index.ts")

utils_dir = SRC / "utils"

# 3a: Delete backward-compat barrels
for barrel in UTILS_BARREL_NAMES:
    barrel_path = utils_dir / barrel
    if barrel_path.exists():
        print(f"  git rm {barrel_path}")
        git_rm(barrel_path)

# 3b: Move subdirectories (dragDrop, helpers, html, nesting, parsers)
for subdir_name in ["dragDrop", "helpers", "html", "nesting", "parsers"]:
    subdir = utils_dir / subdir_name
    if not subdir.exists():
        continue
    for f in sorted(subdir.rglob("*.ts")):
        rel = f.relative_to(utils_dir)
        dst = SRC / "shared" / "utils" / rel
        print(f"  mv {f} → {dst}")
        git_mv(f, dst)
        content = dst.read_text(encoding="utf-8")
        fixed = fix_depth_imports(content)
        if fixed != content:
            write_file(dst, fixed)

# 3c: Move root-level utils files (not barrels, not index.ts)
for f in sorted(utils_dir.glob("*.ts")):
    if f.name in UTILS_BARREL_NAMES or f.name == "index.ts":
        continue
    dst = SRC / "shared" / "utils" / f.name
    print(f"  mv {f} → {dst}")
    git_mv(f, dst)
    content = dst.read_text(encoding="utf-8")
    fixed = fix_depth_imports(content)
    if fixed != content:
        write_file(dst, fixed)

# 3d: Rewrite utils/index.ts before moving → update barrel refs, then move
utils_idx_content = (utils_dir / "index.ts").read_text(encoding="utf-8")
for old, new in BARREL_RENAME_MAP.items():
    utils_idx_content = utils_idx_content.replace(f"./{old}", f"./{new}")
# Also fix depth imports
utils_idx_content = fix_depth_imports(utils_idx_content)

dst_utils_idx = SRC / "shared" / "utils" / "index.ts"
print(f"  mv {utils_dir / 'index.ts'} → {dst_utils_idx}")
git_mv(utils_dir / "index.ts", dst_utils_idx)
write_file(dst_utils_idx, utils_idx_content)

# 3e: Write root redirect barrel
write_file(
    SRC / "utils" / "index.ts",
    '/**\n * utils/ — redirect barrel\n * Canonical: shared/utils/\n * @license BSD-3-Clause\n */\nexport * from "../shared/utils";\n',
)
print("  ✓ utils/index.ts → redirect barrel")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Update all external imports
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== STEP 4: Updating external imports ===")

# Directories whose files do NOT need external import updates
MOVED_DIRS = {
    str(SRC / "shared" / "types"),
    str(SRC / "shared" / "utils"),
    str(SRC / "shared" / "constants"),
}

# Root index.ts redirect barrels that were just written — skip
ROOT_REDIRECT_BARRELS = {
    str(SRC / "types" / "index.ts"),
    str(SRC / "utils" / "index.ts"),
    str(SRC / "constants" / "index.ts"),
}

updated_files = []
all_ts = list(SRC.rglob("*.ts")) + list(SRC.rglob("*.tsx"))

for f in sorted(all_ts):
    f_str = str(f)

    # Skip moved files (their relative imports to each other are preserved)
    if any(f_str.startswith(d) for d in MOVED_DIRS):
        continue

    # Skip the root redirect barrels we just wrote
    if f_str in ROOT_REDIRECT_BARRELS:
        continue

    try:
        content = f.read_text(encoding="utf-8")
        new_content = fix_external_imports(content)
        if new_content != content:
            write_file(f, new_content)
            updated_files.append(f_str)
    except Exception as e:
        print(f"  WARN {f}: {e}")

print(f"\n  ✓ Updated {len(updated_files)} external files")

print("\n=== Migration script complete. Run: npx tsc --noEmit ===\n")
