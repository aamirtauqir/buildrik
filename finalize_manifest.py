"""
finalize_manifest.py — Regenerate clean manifest.json + README.md
from all PNGs in latest-screenshots/
"""

import json
import time
from pathlib import Path
import glob

OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
manifest_path = OUTPUT_DIR / "manifest.json"

# ── Load existing manifest entries (deduplicated by file) ──────────────────────
existing: dict[str, dict] = {}
try:
    data = json.loads(manifest_path.read_text())
    for item in data:
        existing[item["file"]] = item
except Exception:
    pass

print(f"Loaded {len(existing)} existing manifest entries")

# ── Build final sorted manifest ────────────────────────────────────────────────
# Fill in any missing files with auto-generated metadata
all_pngs = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.name)

final_manifest = []
for png in all_pngs:
    fn = png.name
    if fn in existing:
        final_manifest.append(existing[fn])
    else:
        # Auto-generate metadata from filename
        base = fn.replace(".png", "").replace("-", " ")
        final_manifest.append({
            "file": fn,
            "section": "Unknown",
            "state": base,
            "how_to_reproduce": f"Screenshot of: {base}",
        })

print(f"Final manifest: {len(final_manifest)} entries")
manifest_path.write_text(json.dumps(final_manifest, indent=2))

# ── Build README.md ────────────────────────────────────────────────────────────
sections: dict[str, list] = {}
for item in final_manifest:
    s = item.get("section", "Other")
    sections.setdefault(s, []).append(item)

# Order sections logically
section_order = [
    "Entry", "Topbar", "Left Rail", "Left Sidebar", "Templates", "Pages",
    "Media", "Design System", "Settings", "Publish",
    "Canvas Footer", "Canvas", "Inspector", "Modals", "Notifications",
    "Empty States", "History", "Layers", "Editor", "Unknown", "Other",
]

ordered_sections: dict[str, list] = {}
for s in section_order:
    if s in sections:
        ordered_sections[s] = sections.pop(s)
for s, items in sections.items():
    ordered_sections[s] = items

lines = [
    "# Aquibra Editor — Complete Screenshot Library",
    "",
    f"> **Total screenshots:** {len(final_manifest)}  ",
    f"> **Generated:** {time.strftime('%Y-%m-%d %H:%M')}  ",
    f"> **Viewport:** 1440×900 · Chromium headless · Dark mode",
    "",
    "---",
    "",
    "## Quick Index",
    "",
]

for section, items in ordered_sections.items():
    anchor = section.lower().replace(" ", "-").replace("/", "")
    lines.append(f"- [{section} ({len(items)})](#{anchor})")

lines += ["", "---", ""]

for section, items in ordered_sections.items():
    anchor = section.lower().replace(" ", "-").replace("/", "")
    lines.append(f"## {section}")
    lines.append("")
    lines.append("| File | State | How to Reproduce |")
    lines.append("|------|-------|-----------------|")
    for item in items:
        fn = item["file"]
        state = item["state"]
        how = item["how_to_reproduce"]
        lines.append(f"| [`{fn}`]({fn}) | {state} | {how} |")
    lines.append("")

readme_path = OUTPUT_DIR / "README.md"
readme_path.write_text("\n".join(lines))
print(f"README.md written ({readme_path.stat().st_size} bytes)")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print(f"COMPLETE! {len(final_manifest)} screenshots in {OUTPUT_DIR}")
print("="*60)
print(f"\nFiles:")
for item in final_manifest:
    print(f"  {item['file']:<50}  {item['section']}")
