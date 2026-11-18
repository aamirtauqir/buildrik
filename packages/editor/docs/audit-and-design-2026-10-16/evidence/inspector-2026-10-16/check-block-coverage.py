"""Validate documentation coverage, not redesigned application behavior."""
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
EDITOR = HERE.parents[3]

def read(name):
    return json.loads((HERE / name).read_text())

registry = read("element-coverage-reconciliation.json")["rows"]
expected = {r["block_id"] for r in registry}
records = []
for category in ("foundations", "media-sections", "components"):
    doc = read(f"block-coverage-{category}.json")
    rows = doc.get("rows", doc.get("blocks"))
    assert rows, category
    records.extend(rows)
    markdown = (HERE / f"block-coverage-{category}.md").read_text()
    for row in rows:
        assert row["id"] == "B69-" + row["block_id"], row["id"]
        assert row["id"] in markdown, row["id"]
        assert row["controls"] and row["workflow"] and row["acceptance"], row["id"]
        assert any(row.get(k) for k in ("disposition", "dispositions")), row["id"]
        assert any(row.get(k) for k in ("owner", "canonical_owners_and_scope")), row["id"]
assert len(records) == len(expected) == 69
assert {r["block_id"] for r in records} == expected
assert len({r["id"] for r in records}) == len(records)
for row in registry:
    assert (EDITOR / row["source"]).is_file(), row["source"]

native = read("native-tag-coverage.json")["rows"]
source = (EDITOR.parent / "shared/schemas/element-markup.ts").read_text()
tag_text = source.split("new Set([", 1)[1].split("]);", 1)[0]
allowlist = set(re.findall(r'"([a-z0-9]+)"', tag_text))
assert len(native) == len(allowlist) == 120
assert {r["tag"] for r in native} == allowlist

runtime = read("block-runtime-survey.json")["records"]
assert len(runtime) == 69 and {r["block_id"] for r in runtime} == expected
assert all(r["returned_id"] and r["roots"] and r["inspector_visible"] for r in runtime)
assert all(r["selected_type"] == r["declared_type"] for r in runtime)
index = read("block-coverage-index.json")["rows"]
assert len(index) == 69 and {r["id"] for r in index} == expected
html = (HERE / "block-coverage-design.html").read_text()
embedded = json.loads(re.search(r'<script type="application/json" id="data">(.*?)</script>', html, re.S)[1])
assert len(embedded) == 69 and {r["id"] for r in embedded} == expected
assert all(r["controls"] and r["flow"] and r["acceptance"] for r in embedded)
print(json.dumps({
    "status": "PASS — documentation consistency only",
    "registered_blocks": 69,
    "individual_records": len(records),
    "native_routes": len(native),
    "runtime_insert_select_records": len(runtime),
    "html_records": len(embedded),
    "redesigned_app_tests": "NOT RUN — no application changes",
}, indent=2))
