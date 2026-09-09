#!/usr/bin/env python3
"""Is every finding in the audit file verified, and by what?

The done-condition was 'don't stop until every part is verified with proof'.
That is only checkable if 'verified' means something observable, so it means:
every finding parsed out of the audit HTML has a verdict whose proof names at
least one evidence source that is not the audit itself.
"""
import json, hashlib, os, re, collections

SRC = "/Users/shahg/Downloads/Buildrick-Editor-Audit (2).html"
SOURCES = [
    ("fresh Figma read",   r"fresh read b\d"),
    ("post-arc sweep",     r"render-defects[-\w]*\.(json|txt)|\.render-defects"),
    ("post-arc text dump", r"DISCOVERY\.md:|SHOTS\.md:"),
    ("code",               r"\.(tsx|ts):\d|\.tsx\b|\.ts\b"),
    ("builder source",     r"build-polished|order-sections|fix-settings-headers"),
    ("board baseline",     r"BOARD-BASELINE"),
    ("queue / plan record",r"queue[-\w]*\.json|plans/|reports/|CONTRADICTIONS|OUTCOME\.md|COVERAGE\.md"),
    ("audit render (board proven unchanged)", r"unchanged render|audit screenshot"),
]

raw = open(SRC, "rb").read()
finds = json.load(open("ALL-FINDINGS.json"))
ver = {json.loads(l)["id"]: json.loads(l) for l in open("verdicts.jsonl") if l.strip()}
ids = [f["id"] for f in finds]

print(f"SOURCE  {SRC}")
print(f"        {len(raw):,} bytes  sha256={hashlib.sha256(raw).hexdigest()[:16]}")
print(f"PARSED  {len(ids)} findings ({sum(i[0]=='M' for i in ids)} modal + {sum(i[0]=='F' for i in ids)} editor-wide), "
      f"citing {len({n for f in finds for n in f['nodes']})} Figma nodes\n")

tally, gaps = collections.Counter(), []
for i in ids:
    p = ver.get(i, {}).get("proof", "")
    hit = [name for name, pat in SOURCES if re.search(pat, p)]
    if i not in ver or len(p) < 80 or not hit:
        gaps.append(i)
    for h in hit:
        tally[h] += 1

print("evidence sources actually cited, by finding count:")
for name, n in tally.most_common():
    print(f"  {n:3}  {name}")
print(f"\n  verdict recorded ............ {sum(i in ver for i in ids)}/{len(ids)}")
print(f"  substantive proof ........... {sum(len(ver.get(i,{}).get('proof',''))>=80 for i in ids)}/{len(ids)}")
print(f"  names a non-audit source .... {len(ids)-len(gaps)}/{len(ids)}")
print(f"  raw Figma reads on disk ..... {len([f for f in os.listdir('.') if f.endswith('.tsv')])} batches")
print(f"\nCONDITION: {'MET' if not gaps else 'NOT MET — ' + ', '.join(gaps)}")
