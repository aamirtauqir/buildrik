#!/usr/bin/env python3
"""The ONE way this file is counted. A count produced by a method that changes
cannot be compared with itself — that was F6's defect in the contrast gate, and
I reproduced it in my own reporting four times on 2026-09-03 before writing
this down. Markers are fixed here so the number is reproducible.
  ✅ ❌  closed        — done, withdrawn, or disproved
  ⚠️ ⏸️ 📌 ⏳  parked  — partial, blocked, standing reference, assigned elsewhere
  anything else       — open
"""
import io, re, sys
s = io.open("BLOCKERS.md", encoding="utf-8").read()
body = s[s.index("## A · product cannot produce"):s.index("## Flow integrity")]
rows = re.findall(r'^- ([A-Z][\w-]*\d*|[A-Z]-\w+) · (.*?)(?=\n- [A-Z]|\n\n|\n## )', body, re.M | re.S)
closed, parked, open_ = [], [], []
for tag, txt in rows:
    head = " ".join(txt.split())[:175]
    (closed if re.search(r'✅|❌', head)
     else parked if re.search(r'⚠️|⏸️|📌|⏳', head)
     else open_).append(tag)
print(f"total {len(rows)}   closed {len(closed)}   parked {len(parked)}   OPEN {len(open_)}")
print("open:", ", ".join(open_))
