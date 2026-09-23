#!/usr/bin/env python3
"""Turn the TSV dumps into the arithmetic each audit claim stands or falls on.

An "overlaps by 15x16 pixels" or "the warning is cut off" claim is either true of
the boxes Figma returned or it is not. Eyeballing a screenshot at 2x hides an 8px
error; this does not.
"""
import json, glob, os, sys

D = os.path.dirname(os.path.abspath(__file__))
N = {}   # id -> node record

def add(nid, **kw):
    N.setdefault(nid, {"id": nid, "texts": [], "kids": [], "rx": []}).update(kw)

def box(s):
    if not s: return None
    p = [int(x) for x in s.split(",")]
    return p if len(p) == 4 else None

for f in sorted(glob.glob(os.path.join(D, "b*.tsv"))):
    cur = None
    for line in open(f):
        p = line.rstrip("\n").split("\t")
        if p[0] == "N":
            cur = p[1]
            if len(p) > 2 and p[2] == "MISSING": add(cur, exists=False, name="MISSING"); continue
            add(cur, exists=True, name=p[2], type=p[3], box=box(p[4]),
                clips=p[5], layout=p[6], nkids=int(p[7] or 0), vis=p[8] if len(p) > 8 else "")
        elif p[0] == "C" and cur: N[cur]["ntext"] = int(p[2].split("=")[1])
        elif p[0] == "T" and cur:
            N[cur]["texts"].append({"id": p[1], "box": box(p[2]), "fs": p[3], "sty": p[4],
                                    "v": p[5] == "true", "ar": p[6], "pn": p[7], "c": p[8] if len(p) > 8 else ""})
        elif p[0] == "K" and cur:
            N[cur]["kids"].append({"id": p[1], "t": p[2], "box": box(p[3]), "v": p[4] == "true",
                                   "clips": p[5], "name": p[6] if len(p) > 6 else ""})
        elif p[0] == "R" and cur:
            N[cur]["rx"].append({"from": p[1], "to": p[2], "nav": p[3], "fname": p[4] if len(p) > 4 else ""})

for f in sorted(glob.glob(os.path.join(D, "b*.json"))):          # legacy JSON batch
    try: rows = json.load(open(f))
    except Exception: continue
    for n in rows:
        if not n.get("exists"): add(n["id"], exists=False, name="MISSING"); continue
        add(n["id"], exists=True, name=n["name"], type=n["type"], box=n["box"], clips=str(n.get("clips")),
            layout=str(n.get("layout")), nkids=n.get("nkids", 0), ntext=n.get("ntext", 0),
            texts=[{"id": t["id"], "box": t["box"], "fs": str(t["fs"]), "sty": str(t["sty"]),
                    "v": t.get("v", True), "ar": t.get("ar", ""), "pn": t.get("pn", ""), "c": t["c"]} for t in n.get("texts", [])],
            kids=[{"id": k["id"], "t": k["t"], "box": k["box"], "v": k.get("v"), "clips": str(k.get("clips")), "name": k["name"]} for k in n.get("kids", [])],
            rx=[{"from": r["from"], "to": r["to"], "nav": str(r.get("nav")), "fname": r.get("fn", "")} for r in n.get("rx", [])])

def ix(a, b):
    if not a or not b: return (0, 0)
    w = min(a[0]+a[2], b[0]+b[2]) - max(a[0], b[0])
    h = min(a[1]+a[3], b[1]+b[3]) - max(a[1], b[1])
    return (max(w, 0), max(h, 0))

def outside(child, parent):
    if not child or not parent: return {}
    o = {"left": parent[0]-child[0], "top": parent[1]-child[1],
         "right": (child[0]+child[2])-(parent[0]+parent[2]),
         "bottom": (child[1]+child[3])-(parent[1]+parent[3])}
    return {k: v for k, v in o.items() if v > 0}

def report(nid):
    n = N.get(nid)
    if not n: return f"{nid}: NOT DUMPED YET"
    if not n.get("exists"): return f"{nid}: DOES NOT EXIST IN THE FIGMA FILE"
    L = [f"{nid} | {n['name']} | {n.get('type')} | box={n.get('box')} clips={n.get('clips')} layout={n.get('layout')} kids={n.get('nkids')} texts={n.get('ntext')} (dumped {len(n['texts'])})"]
    ts = [t for t in n["texts"] if t["v"]]
    ov = []
    for i in range(len(ts)):
        for j in range(i+1, len(ts)):
            w, h = ix(ts[i]["box"], ts[j]["box"])
            if w > 0 and h > 0: ov.append((w, h, ts[i], ts[j]))
    if ov:
        L.append(f"  TEXT-OVERLAPS: {len(ov)}")
        for w, h, a, b in sorted(ov, key=lambda x: -x[0]*x[1])[:14]:
            L.append(f"    {w}x{h}px  {a['id']} {a['c'][:36]!r}  ><  {b['id']} {b['c'][:36]!r}")
    outs = [(max(o.values()), o, t) for t in ts for o in [outside(t["box"], n.get("box"))] if o]
    if outs:
        L.append(f"  TEXT-OUTSIDE-BOARD: {len(outs)} (board clips={n.get('clips')})")
        for m, o, t in sorted(outs, key=lambda x: -x[0])[:10]:
            L.append(f"    by {m}px [{','.join(f'{k}+{v}' for k, v in o.items())}] {t['id']} {t['c'][:46]!r}")
    if n["rx"]:
        L.append(f"  REACTIONS: {len(n['rx'])}")
        for r in n["rx"][:20]:
            L.append(f"    {r['from']} ({r['fname'][:26]}) -> {r['to']} [{r['nav']}] dest={N.get(r['to'],{}).get('name','?')}")
    return "\n".join(L)

def texts(nid, width=200):
    n = N.get(nid)
    if not n: return f"{nid}: NOT DUMPED YET"
    if not n.get("exists"): return f"{nid}: DOES NOT EXIST"
    out = [f"{nid} {n['name']} box={n.get('box')} texts={n.get('ntext')}"]
    for t in n["texts"]:
        out.append(f"  {t['id']} {t['box']} {t['fs']}/{t['sty']} vis={t['v']} ar={t['ar']} par={t['pn'][:22]} :: {t['c'][:width]!r}")
    return "\n".join(out)

def kids(nid):
    n = N.get(nid)
    if not n or not n.get("exists"): return f"{nid}: n/a"
    return "\n".join([f"{nid} {n['name']} kids={n.get('nkids')}"] +
                     [f"  {k['id']} {k['t']} {k['box']} v={k['v']} clips={k['clips']} {k['name']}" for k in n["kids"]])

def cover(nid):
    """Text painted over by a LATER sibling frame.

    Text-vs-text intersection under-reports badly: an opaque hotspot rectangle
    sitting on top of a paragraph hides it completely while no two text boxes
    touch. Figma paints children in array order, so a text inside child i is
    covered by any later child j>i whose box overlaps it.
    """
    n = N.get(nid)
    if not n or not n.get("exists"): return f"{nid}: n/a"
    ks = n["kids"]
    if not ks: return f"{nid}: no children dumped"
    def owner(t):
        for i, k in enumerate(ks):
            b, c = k["box"], t["box"]
            if b and c and c[0] >= b[0]-1 and c[1] >= b[1]-1 and c[0]+c[2] <= b[0]+b[2]+1 and c[1]+c[3] <= b[1]+b[3]+1:
                return i
        return None
    L = [f"{nid} {n['name']} — text covered by later siblings"]
    hits = 0
    for t in n["texts"]:
        if not t["v"]: continue
        oi = owner(t)
        if oi is None: continue
        for j in range(oi+1, len(ks)):
            k = ks[j]
            if not k["v"]: continue
            w, h = ix(t["box"], k["box"])
            if w > 2 and h > 2:
                hits += 1
                L.append(f"  {w}x{h}px  {t['id']} {t['c'][:44]!r}  covered by  {k['id']} {k['name'][:40]!r}")
    L.insert(1, f"  {hits} covered text runs")
    return "\n".join(L)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "report"
    ids = sys.argv[2:] or sorted(N)
    if mode == "have": print(" ".join(sorted(N))); raise SystemExit
    fn = {"texts": texts, "kids": kids, "cover": cover}.get(mode, report)
    for i in ids: print(fn(i)); print()
