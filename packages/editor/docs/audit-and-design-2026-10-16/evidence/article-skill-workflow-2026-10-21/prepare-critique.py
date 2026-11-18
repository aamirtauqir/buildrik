"""Attach scoped observations to the upstream checklist, preserving unknowns."""
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
data = json.loads((BASE / "checklist-template.json").read_text())
colors = json.loads(json.loads((BASE / "figma-colors.json").read_text())["toolText"][0])


def luminance(color):
    values = [color[k] for k in ("r", "g", "b")]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values]
    return sum(v * weight for v, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


contrast = []
for row in colors["labels"]:
    if row["text"] is None:
        continue
    fg = row["parents"][0]["fills"][0]
    backgrounds = [
        p for p in row["parents"][1:]
        if isinstance(p["fills"], list) and len(p["fills"]) == 1
        and p["fills"][0]["type"] == "SOLID"
        and p["fills"][0]["opacity"] == 1 and p["opacity"] == 1
    ]
    assert fg["type"] == "SOLID" and fg["opacity"] == 1
    bg = backgrounds[0]
    lighter, darker = sorted(
        (luminance(fg["color"]), luminance(bg["fills"][0]["color"])), reverse=True
    )
    ratio = (lighter + 0.05) / (darker + 0.05)
    contrast.append({
        "node": row["id"], "text": row["text"], "fontSize": row["fontSize"],
        "foreground": fg["color"], "backgroundNode": bg["id"],
        "background": bg["fills"][0]["color"], "ratio": ratio,
        "passes_4_5": ratio >= 4.5,
        "scope": "Opaque solid-fill design values only; not a rendered-app audit.",
    })

# Indices address the unchanged upstream checklist. A pass applies only to the
# explicit specimen/property in its note, never the complete product.
observations = {
    ("N1", 3): (True, None, "Five start specimens: selected object, page and task are named. Static inspection only."),
    ("N2", 0): (True, None, "Expert judgment on sampled labels: Replace, Source, Preview and Send Round 3 to Lena name their tasks. User comprehension untested."),
    ("N2", 2): (True, None, "F4 places blocking issue before tips; F5 shows round/status before send action."),
    ("N3", 1): (True, None, "All journeys is visible in sampled starts and has a native route to 302:3370. F4 close also has a route. Other exit behaviors untested."),
    ("N4", 0): (False, 2, "Prototype-only issue C02: in F4.01, identical Fix links differ in operability: 303:32421 has a route, 303:32429 has none. Scope is limited to the tested prototype, not application behavior."),
    ("N4", 1): (True, None, "Sampled text uses the same rail, Preview, Publish, Content/Style/Behavior/Effects labels. No claim about all pages."),
    ("N4", 2): (True, None, "F1/F4/F5 screenshots share consistent rail, topbar, bottom navigation and right-task treatment; only these screenshots assessed."),
    ("N6", 3): (True, None, "Search layers is visible in sampled starts. Filtering/search execution untested."),
    ("N8", 1): (True, None, "F4 visually prioritizes the blocker; F5 emphasizes Send Round 3 in task footer. This is a bounded visual judgment."),
    ("N8", 2): (True, None, "Three 1440px screenshots separate rail, tree, canvas and Inspector/task; other sizes not assessed."),
    ("N9", 0): (True, None, "F4.01 explains missing collection source in words without an error code."),
    ("N9", 1): (True, None, "F4.01 names Latest posts and Home / Journal section."),
    ("N9", 2): (True, None, "Blocking Fix route goes to 303:32650, which names the exact list and Choose collection action. Route structure, not playback."),
    ("N9", 3): (True, None, "F4.01 displays blocker first with a selected-list canvas message; visual prominence assessed in screenshot."),
    ("N10", 1): (False, 2, "Prototype-only issue C01: F1.01 guidance 302:3510 says select a child, but the only product reaction is Add (302:3422). No child-selection route is present in this specimen. Generic controller guidance does not explain the constrained task."),
    ("A1", 0): (all(x["passes_4_5"] for x in contrast), None, "Only five sampled opaque text/background pairs measured; see contrast.json. Other text, modes, hover and disabled states unknown."),
    ("A1", 2): (True, None, "Sampled F4 error and F5 resolved states have text as well as color."),
}

counts = {"pass": 0, "fail": 0, "not_tested": 0}
assessed = {"heuristics": [], "accessibility": []}
for section in ("heuristics", "accessibility"):
    for group in data[section]:
        subset = {"id": group["id"], "name": group["name"], "checkpoints": []}
        for index, item in enumerate(group["checkpoints"]):
            result = observations.get((group["id"], index))
            if result is None:
                item["notes"] = "NOT TESTED in this bounded static/route review. No pass/fail inferred from older handoffs."
                item["status"] = "NOT_TESTED"
                counts["not_tested"] += 1
            else:
                item["pass"], item["severity"], item["notes"] = result
                item["status"] = "PASS" if item["pass"] else "FAIL"
                counts["pass" if item["pass"] else "fail"] += 1
                subset["checkpoints"].append(item)
        if subset["checkpoints"]:
            assessed[section].append(subset)

scope = {
    "date": "2026-10-21", "method": "Product-designer skill: bounded Figma critique",
    "fileKey": "2L9OTGzBrL6kYmU18yA1c7",
    "metadata": ["302:3396", "302:11636", "302:19069", "303:32296", "307:14695"],
    "screenshots": ["302:3396", "303:32296", "307:14695"],
    "counts": counts,
    "warning": "Upstream summary grade is not an accessibility, usability or whole-editor score. Only assessed items are passed to its aggregation; full checklist preserves unknowns.",
    "script_source": "https://raw.githubusercontent.com/borghei/Claude-Skills/main/product-team/product-designer/scripts/design_critique.py",
    "script_sha256": hashlib.sha256(Path("/tmp/buildrick-design-critique-20261021.py").read_bytes()).hexdigest(),
}
for name, value in [
    ("checklist-evidence.json", data), ("assessed-only.json", assessed),
    ("contrast.json", contrast), ("run-scope.json", scope),
]:
    (BASE / name).write_text(json.dumps(value, indent=2) + "\n")
print(json.dumps({"counts": counts, "contrast": [
    {"node": x["node"], "ratio": round(x["ratio"], 3)} for x in contrast
]}))
