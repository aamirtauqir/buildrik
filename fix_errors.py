#!/usr/bin/env python3
"""
Fix false positives and missed depth-fixes from migrate.py.

Categories:
  A) src/blocks/*: '../shared/types' → '../types'  (local block types.ts)
  B) src/editor/canvas/*: '../shared/utils/elementInfo' → '../utils/elementInfo'
  C) src/editor/panels/layers/hooks: '../shared/types' → '../types'
  D) src/engine/canvas/indicators/*: '../shared/constants' → '../constants'
  E) src/engine/ (collaboration, components, data): '../shared/utils/X' → '../utils/X'
  F) src/shared/constants/events.ts: dynamic imports need depth-fix (../engine → ../../engine)
  G) src/shared/utils/dragDrop/dragData.ts: '../../helpers' → '../helpers'
  H) src/shared/utils/dragDrop/dropTarget.ts: '../../engine' → '../../../engine', '../../nestingRules' → '../nesting'
"""
import re
import subprocess
from pathlib import Path

SRC = Path("src")


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def write(p: Path, text: str):
    p.write_text(text, encoding="utf-8")
    subprocess.run(f"git add '{p}'", shell=True, capture_output=True, cwd=".")


def replace_exact(content: str, old: str, new: str) -> str:
    return content.replace(old, new)


fixes = []

# ─── A: src/blocks/*/*.tsx  '../shared/types' → '../types' ───────────────────
for f in sorted(SRC.glob("blocks/**/*.ts*")):
    content = read(f)
    new = content.replace('"../shared/types"', '"../types"').replace(
        "'../shared/types'", "'../types'"
    )
    # Also revert any ../shared/constants or ../shared/utils false positives in blocks
    new = new.replace('"../shared/constants"', '"../constants"').replace(
        "'../shared/constants'", "'../constants'"
    )
    if new != content:
        write(f, new)
        fixes.append(f"  A: {f}")

# ─── B: src/editor/canvas/* '../shared/utils/elementInfo' → '../utils/elementInfo' ──
for f in sorted(SRC.glob("editor/canvas/**/*.ts*")):
    content = read(f)
    new = content
    # ../shared/utils/elementInfo  →  ../utils/elementInfo
    new = new.replace('"../shared/utils/elementInfo"', '"../utils/elementInfo"').replace(
        "'../shared/utils/elementInfo'", "'../utils/elementInfo'"
    )
    # ../../shared/utils/elementInfo  →  ../../utils/elementInfo
    new = new.replace('"../../shared/utils/elementInfo"', '"../../utils/elementInfo"').replace(
        "'../../shared/utils/elementInfo'", "'../../utils/elementInfo'"
    )
    if new != content:
        write(f, new)
        fixes.append(f"  B: {f}")

# ─── C: src/editor/panels/layers/hooks/useLayersState.ts ─────────────────────
layers_state = SRC / "editor" / "panels" / "layers" / "hooks" / "useLayersState.ts"
if layers_state.exists():
    content = read(layers_state)
    new = content.replace('"../shared/types"', '"../types"').replace(
        "'../shared/types'", "'../types'"
    )
    if new != content:
        write(layers_state, new)
        fixes.append(f"  C: {layers_state}")

# ─── D: src/engine/canvas/indicators/*  '../shared/constants' → '../constants' ──
for f in sorted(SRC.glob("engine/canvas/indicators/*.ts*")):
    content = read(f)
    new = content.replace('"../shared/constants"', '"../constants"').replace(
        "'../shared/constants'", "'../constants'"
    )
    if new != content:
        write(f, new)
        fixes.append(f"  D: {f}")

# ─── E: src/engine/collaboration, components, data: '../shared/utils/X' → '../utils/X' ──
ENGINE_UTILS_DIRS = [
    SRC / "engine" / "collaboration",
    SRC / "engine" / "components",
    SRC / "engine" / "data",
    SRC / "engine" / "utils",
]
for d in ENGINE_UTILS_DIRS:
    for f in sorted(d.glob("*.ts*")):
        content = read(f)
        # Replace '../shared/utils/ANYTHING' with '../utils/ANYTHING'
        new = re.sub(
            r'"(\.\.)/shared/utils/([^"]+)"',
            r'"\1/utils/\2"',
            content,
        )
        new = re.sub(
            r"'(\.\.)/shared/utils/([^']+)'",
            r"'\1/utils/\2'",
            new,
        )
        if new != content:
            write(f, new)
            fixes.append(f"  E: {f}")

# ─── F: src/shared/constants/events.ts — dynamic import depth fix ─────────────
events_ts = SRC / "shared" / "constants" / "events.ts"
if events_ts.exists():
    content = read(events_ts)
    # Dynamic imports: import("../engine/...") → import("../../engine/...")
    # Also standard from imports that might have been missed
    new = content
    # Fix dynamic imports: import("../engine/
    new = re.sub(
        r'import\("\.\./(engine/[^"]+)"\)',
        r'import("../../\1")',
        new,
    )
    new = re.sub(
        r"import\('\.\./([^']+)'\)",
        r"import('../../\1')",
        new,
    )
    # Also fix any 'from "../engine/' that was missed (not from ["']) — belt-and-suspenders
    new = re.sub(
        r'from "\.\./engine/',
        r'from "../../engine/',
        new,
    )
    if new != content:
        write(events_ts, new)
        fixes.append(f"  F: {events_ts}")

# ─── G: src/shared/utils/dragDrop/dragData.ts — revert incorrect depth fix ───
drag_data = SRC / "shared" / "utils" / "dragDrop" / "dragData.ts"
if drag_data.exists():
    content = read(drag_data)
    # '../../helpers' was the wrong depth fix; sibling ../helpers/ is correct
    new = content.replace('"../../helpers"', '"../helpers"').replace(
        "'../../helpers'", "'../helpers'"
    )
    if new != content:
        write(drag_data, new)
        fixes.append(f"  G: {drag_data}")

# ─── H: src/shared/utils/dragDrop/dropTarget.ts — engine didn't move; nestingRules deleted ──
drop_target = SRC / "shared" / "utils" / "dragDrop" / "dropTarget.ts"
if drop_target.exists():
    content = read(drop_target)
    new = content
    # Engine is at src/engine, file is at src/shared/utils/dragDrop → need ../../../engine
    new = new.replace('"../../engine/elements/Element"', '"../../../engine/elements/Element"').replace(
        "'../../engine/elements/Element'", "'../../../engine/elements/Element'"
    )
    # nestingRules barrel deleted; canonical is ../nesting (sibling dir)
    new = new.replace('"../../nestingRules"', '"../nesting"').replace(
        "'../../nestingRules'", "'../nesting'"
    )
    if new != content:
        write(drop_target, new)
        fixes.append(f"  H: {drop_target}")

print(f"\nFixed {len(fixes)} files:")
for f in fixes:
    print(f)
print("\nDone. Run: npx tsc --noEmit")
