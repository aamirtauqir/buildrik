#!/usr/bin/env python3
"""Assemble VERDICTS.md from verdicts.jsonl + the parsed audit findings."""
import json, os, collections
D = os.path.dirname(os.path.abspath(__file__))
finds = {f["id"]: f for f in json.load(open(os.path.join(D, "ALL-FINDINGS.json")))}
ver = {}
for line in open(os.path.join(D, "verdicts.jsonl")):
    if line.strip():
        r = json.loads(line); ver[r["id"]] = r
order = [f"M{i:02d}" for i in range(1, 21)] + [f"F{i:02d}" for i in range(1, 29)]

BUCKET = {
    "CONFIRMED": "real", "CONFIRMED-TWICE": "real", "CONFIRMED-EXACT": "real",
    "CONFIRMED-WITH-MECHANISM": "real", "CONFIRMED-WITH-MEASUREMENT": "real",
    "CONFIRMED-AND-SHARPER": "real", "CONFIRMED-AND-UNDERSTATED": "real",
    "CONFIRMED-AND-CODE-BACKED": "real",
    "REFUTED": "refuted", "REFUTED-ALREADY-FIXED": "refuted",
    "TRUE-BUT-FIX-WRONG": "fix-wrong", "OUT-OF-SCOPE": "off-page",
    "DUPLICATE": "duplicate", "UNVERIFIED": "open",
}
def bucket(v):
    if v.startswith("PROVISIONAL"): return "provisional"
    if v.startswith("CONFIRMED"): return "real"
    if v.startswith("REFUTED"): return "refuted"
    if v.startswith("TRUE-BUT-OFF-PAGE"): return "off-page"
    if v.startswith("TRUE-BUT") or v.startswith("PART-STALE"): return "fix-wrong"
    if v.startswith("DUPLICATE"): return "duplicate"
    return BUCKET.get(v, "open")

counts = collections.Counter()
lines = ["| id | area | the audit's claim | verdict | proof |", "|---|---|---|---|---|"]
for i in order:
    f = finds.get(i, {})
    v = ver.get(i, {"verdict": "UNVERIFIED", "proof": "not settled by this pass"})
    counts[bucket(v["verdict"])] += 1
    title = f.get("title", "")
    a = (f.get("area", "") or "")
    area = "modal" if a.startswith("M") and "·" not in a else a.split("·")[-1].strip()[:22]
    lines.append(f"| **{i}** | {area} | {title} | **{v['verdict']}** | {v['proof']} |")
print("counts:", dict(counts))
open(os.path.join(D, "VERDICT-TABLE.md"), "w").write("\n".join(lines) + "\n")
print("wrote VERDICT-TABLE.md", len(lines) - 2, "rows")
