import csv
from pathlib import Path
base = Path(__file__).resolve().parent.parent
master = base / "PHASE6-PRODUCT-PARITY-MATRIX.csv"
with master.open(newline="") as f:
    reader = csv.DictReader(f)
    fields = list(reader.fieldnames)
    rows = list(reader)
with (base / "R33-FEATURE-PARITY.csv").open(newline="") as f:
    updates = list(csv.DictReader(f))
columns = ["R33 evidence rows", "Current continuation evidence", "R33 destination IDs", "R33 assessment"]
for c in columns:
    if c not in fields:
        fields.append(c)
prior = {
    "F-002": "R31-REMAINING-FLOWS-PARITY.csv; R32-FEATURE-PARITY.csv",
    "F-004": "R31-REMAINING-FLOWS-PARITY.csv; R32-FEATURE-PARITY.csv",
    "F-020": "R32-FEATURE-PARITY.csv",
    "F-021": "R32-FEATURE-PARITY.csv",
    "F-023": "R32-FEATURE-PARITY.csv",
    "F-024": "R32-FEATURE-PARITY.csv",
    "F-030": "R31-REMAINING-FLOWS-PARITY.csv; R32-FEATURE-PARITY.csv",
    "F-032": "R32-FEATURE-PARITY.csv",
    "F-033": "R31-REMAINING-FLOWS-PARITY.csv; R32-FEATURE-PARITY.csv",
    "F-035": "R30-REMAINING-FLOWS-PARITY.csv; R32-FEATURE-PARITY.csv"
}
for row in rows:
    fid = row["Feature ID"]
    matches = [u for u in updates if fid in u["Master feature"].split(";")]
    row["R33 evidence rows"] = ";".join(u["Feature ID"] for u in matches)
    row["Current continuation evidence"] = "; ".join(filter(None, [prior.get(fid, ""), "R33-FEATURE-PARITY.csv; R33-IMPLEMENTATION-QA.md" if matches else ""]))
    row["R33 destination IDs"] = ";".join(dict.fromkeys(d for u in matches for d in u["Improved destination"].split(";")))
    row["R33 assessment"] = "AUTHORED_SCOPE_VERIFIED_WITH_RECORDED_LIMITS" if matches else "PRIOR_EVIDENCE_RETAINED_NOT_REVALIDATED_R33"
    if matches and fid.startswith("F-0") and int(fid[2:]) >= 47:
        row["R33 assessment"] = "UI_MAPPING_ONLY_SERVICE_NOT_EXECUTED"
assert len(rows) == 81
assert len({r["Feature ID"] for r in rows}) == 81
with master.open("w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
print({"master_rows": len(rows), "r33_rows": len(updates), "master_rows_with_r33_evidence": sum(bool(r["R33 evidence rows"]) for r in rows)})
