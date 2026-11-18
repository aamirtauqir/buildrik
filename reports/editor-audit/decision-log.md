# Editor audit: decision log

| Date | Module | Decision | Options considered | Recommendation | Approver | Status |
|---|---|---|---|---|---|---|
| 2026-10-09 | CMS | D-01: may `design cms` create a Figma proposal section before the code fixes land? Founder rule: code first, Figma after runtime verification. | (a) wait for Wave 0–1 runtime-verified · (b) non-destructive `Editor Improvements / CMS / Proposal v1` now | (b): proposal only, originals untouched | Product owner (founder) | approved: (b) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-02: scope of C5 surfaces (Source, Views, Constants) in this spec and the next design | (a) include now · (b) separate `cms-sources` spec after C2 | (b) | Product owner | approved: (a) include. Recommendation rejected (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-03: pasted-JSON Data Sources until C5 (EDT-016) | (a) hide the door · (b) persist in project settings · (c) leave | (a) | Product owner | approved: (b) persist. Recommendation rejected (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-04: drafts in a Collection list on the canvas (EDT-015) | (a) published only · (b) drafts marked · (c) toggle, default (a) | (c) | Product owner + design lead | approved: (c) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-05: field-key rename before server `cms.fields.rename` exists (EDT-001) | (a) key read-only after create · (b) allow with warning · (c) client ordering fix only | (a), then confirm + server rename | Engineering lead | approved: (a) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-06: concurrency model and conflict UX (EDT-002/013/014) | (a) required `expectedUpdatedAt` + field diff/merge · (b) `version` column + diff/merge · (c) last-write-wins + warning | (b) | Engineering lead | approved: (b) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-07: `archived` status (EDT-040) | (a) add server ARCHIVED · (b) remove from editor | (b) | Product owner | approved: (b) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-08: Duplicate site and CMS (EDT-005) | (a) copy collections + records with remapped ids · (b) strip bindings + notice | (a) | Product owner | approved: (a) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-09: plan limits for CMS (PD-9) | numbers per FREE/PRO/BUSINESS | founder sets them; 10k / 100 technical caps stay | Product owner | approved: tiered. FREE 2/100 · PRO 20/2,000 · BUSINESS 100/10,000 (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-10: record saves vs canvas undo (EDT-035) | (a) out of canvas undo, with a note · (b) in the undo stack | (a) | Product owner + engineering lead | approved: (a) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-11: ecommerce product blocks (PD-6, EDT-042) | (a) wire as Collection lists · (b) drop the prompt + dead `data-bind` | (b) | Product owner | approved: (a) wire. Recommendation rejected (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-12: template page ownership (PD-11) | (a) Pages page type with pageId · (b) CMS file-name pointer | (a) | Product owner | approved: (a) (founder, 2026-10-09) |
| 2026-10-09 | CMS | D-13: record publish model (PD-2) | (a) record Published + site publish, honest copy · (b) per-record live publish | (a) | Product owner | approved: (a) (founder, 2026-10-09) |
