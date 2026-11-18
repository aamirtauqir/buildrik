# T4 — Assets · CMS · Forms: feature inventory + traceability

Audit only. Scope = INV lines 998–1209 (tables A-1…C-4; 129 rows: A1–A57, B1–B49, C1–C23). INV lines 1210–1256 are "Not verified" notes, status counts and the next section's header (no feature rows).

Abbreviations: **INV** = `docs/editor-feature-inventory-2026-10-16.md` · **P/nn** = `panels/nn-*.md` · **DYN** = `CMS-DYNAMIC-BINDING-DESIGN.md` (FD-DYN-01) · **PDB** = `PRODUCT-DESIGN-BRIEF.md` · **RIH** = `REMAINING-IA-HANDOFF.md` · **MS** = `evidence/ia-final-2026-10-16/module-specifications.md` (IAF-xx) · **CPC** = `evidence/ia-final-2026-10-16/control-and-package-contracts.md` · **CP** = `evidence/ia-final-2026-10-16/capability-preservation.md` (1,238-row register; M05-xx = these INV rows).

## Scope read
| File | Lines read |
|---|---|
| `_extraction/EXTRACTION-BRIEF.md` | 1–46 (full) |
| INV | 975–1264 (all of tables A-1…C-4 + notes/counts) |
| P/00-SHARED-CONTRACTS.md | 1–361 (full) |
| PDB | 1012–1166 (as instructed); plus grep hits 545–552, 586–592, 675–682, 912–917, 1001 |
| P/07-CMS.md | 1–177 (full) |
| P/08-ASSETS.md | 1–173 (full) |
| DYN | 1–441 (full) |
| P/06-INSPECTOR-DELTA.md | 1–85 (full) — contains no form rows |
| MS | 343–510 (IAF-07/08/09), 679–734 (IAF-13) |
| CPC | 58–72 (FORM-01) |
| CP | 1–12, 602–730 (M05-A1…C23 rows) |
| RIH | 40–66 |
| REPORT.md | 274–294, 486–490 |
| P/02, 03, 10, 11, 14, 18, 22, 23, 24 | grep hits only (cited lines) |
Skipped: P/20 (AI, deferred SC-21; only used to confirm AI alt is out of scope), P/13/15/16/17/19/21/25 (no row in scope after grep), evidence screenshots/JSON (not spec text). Synonym greps run over P + D for every PARTIAL/OMITTED candidate (e.g. "replacement upload|smaller file", "Select Icon|IconPicker", "password field", "sourceUrl|Sent from", "365|retention", "FormHandler|validation messages", "Handlebars|Liquid|cmsMode", "outbox|didn't sync", "declared bytes").

**Forms answer up front:** there is **no Forms panel doc in P/** and none in the PDB panel index (PDB:1014–1031). Forms are specified only piecemeal: IAF-13 (MS:679–734, evidence annex), FORM-01 (CPC:58–68), PDB FD-INS-02 rows (PDB:549, 590, 679, 915), REPORT M19–21 (REPORT:274–292), one bullet in P/10 (P/10:105, :132, :151) and the Forms sub-heading in P/03 (:71, :115). P/06 (Inspector delta) has zero form rows.

## Traceability
Coverage: COVERED · PARTIAL · CONFLICT · DEFERRED-BY-DECISION (DEF) · REMOVED-N/A · OMITTED. "Register-only" = only a CP row names a destination; no spec defines location/controls/states.

### Assets (A1–A57)
| FID | Feature | INV | INV line | Design home | Controls | States | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-AS-01 | Drawer header + count + ⋯ Select | ✅ | 1001 | P/08 §4.1, §11 (Merge) | Y | count | Y | COVERED | Drawer merges into workspace; "Select assets…" mode kept (P/08 §10) |
| F-AS-02 | Panel search | ✅ | 1002 | P/08 §4.1 | Y | no-match, truncated, failed | Y | COVERED | `/` focuses (SC-12) |
| F-AS-03 | Server search-scope line | ✅ | 1003 | P/08 §9 | Y | truncated, failed | Y | COVERED | — |
| F-AS-04 | "Manage assets ›" door | ✅ | 1004 | P/08 §4.1 "one management surface" | Y | — | Y | COVERED | Door disappears by merge |
| F-AS-05 | Filter ▾ type + folder | ✅ | 1005 | P/08 §4.1 toolbar, nav | Y | — | P | COVERED | Fonts bucket label fixed |
| F-AS-06 | Grid + Load more | ✅ | 1006 | P/08 §4.1, T-AS-09 | Y | loading | Y | COVERED | Load more now in workspace |
| F-AS-07 | Click-insert / replace selected | ✅ | 1007 | P/08 §4.3, §4.5 | Y | target gone/locked | Y | COVERED | Change: click selects; explicit Replace |
| F-AS-08 | Drag asset onto canvas | ✅ | 1008 | P/08 §4.3, MS IAF-09 E | Y | invalid drop | Y | PARTIAL | Stock drag forced `imported-*.webp` copy not addressed |
| F-AS-09 | OS file drop on canvas | ✅ | 1009 | P/08 §5 last row | P | locked refusal (INV only) | P | COVERED | — |
| F-AS-10 | Hover-to-select check | ✅ | 1010 | P/08 §10 (Shift/⌘ multi) | N | — | P | PARTIAL | Hover check entry not specified |
| F-AS-11 | Bulk bar | ✅ | 1011 | P/08 §10 "bulk Move/Tag/Delete" | P | — | P | PARTIAL | Bar layout/controls not specified |
| F-AS-12 | Upload split button | ✅ | 1012 | P/08 §4.1 Upload ▾ | Y | — | Y | COVERED | Fonts move to nav section |
| F-AS-13 | Drop strip, progress, failed rows | ✅ | 1013 | P/08 §5 | Y | uploading, failed, unsupported, oversize | Y | COVERED | Progress claim conflicts, see F-AS-52 |
| F-AS-14 | Quota band | ✅ | 1014 | P/08 §9, §10 footer; P/23:262 | Y | near-limit, full | P | CONFLICT | Warn at 90% (P/08 §9) vs ≥80% (P/23:103, INV) — T4-4 |
| F-AS-15 | Replacement upload modal + banner | ✅ | 1015 | CP:616 (Move); P/08 §5 "Choose a smaller file" | P | oversize | N | PARTIAL | Follow-on modal/banner unspecified |
| F-AS-16 | Empty/error/loading/no-match | ✅ | 1016 | P/08 §9 | Y | empty, no results, truncated, failed, offline | Y | COVERED | — |
| F-AS-17 | Pick mode (one picker) | ✅ | 1017 | P/08 §4.3–4.4; P/02 §5 | Y | target gone, cancel | Y | COVERED | Header copy canonical |
| F-AS-18 | Viewer read-only gating | ✅ | 1018 | P/08 §8; SC-6 | Y | disabled-with-reason | Y | COVERED | — |
| F-AS-19 | Device-only insert warning | 🐞 | 1019 | P/08 §5 Failure (FI-03); P/14:142 | Y | not saved, retry, other device | Y | COVERED | Data-loss answered; ⛔ P1-D18 blocks cross-device |
| F-AS-20 | APPLIED badge / lock overlay on cards | ⏳ | 1020 | CP:621 (Defer) | N | — | N | DEF (FD-IA-09 Defer) | APPLIED kept only in Versions |
| F-AS-21 | Detail hub: preview, alt, Generate | ✅ | 1025 | P/08 §4.2 Details | Y | — | P | COVERED | Generate hidden (SC-21) |
| F-AS-22 | Hub rows (Used in/Versions/Edit/Optimise/Replace) | ✅ | 1026 | P/08 §4.2 | Y | — | Y | COVERED | — |
| F-AS-23 | Hub action list | ✅ | 1027 | P/08 §4.2 actions | Y | — | Y | COVERED | Download added to all menus |
| F-AS-24 | Versions + inline restore | ✅ | 1028 | P/08 §4.2 Versions | P | — | N | PARTIAL | Restore/apply-version flow and author line unspecified |
| F-AS-25 | Used-in + Go | ✅ | 1029 | P/08 §4.2 Usage, T-AS-05 | Y | unused, scope banner | Y | COVERED | + CMS scan (new) |
| F-AS-26 | Drawer Optimise panel | ❌ | 1030 | — | — | — | — | REMOVED-N/A | — |
| F-AS-27 | Replace across site | ✅ | 1031 | P/08 §6; MS IAF-09 G | Y | blocked batch | Y | COVERED | All-or-none (Change) |
| F-AS-28 | Icon browser drill-in | ✅ | 1036 | P/08 AS-09, §4.1 Upload ▾ Icons | N | — | N | PARTIAL | Drill-in vs modal not reconciled; recents unspecified |
| F-AS-29 | "Select Icon" modal (Inspector) | ✅ | 1037 | CP:630 (Move → "Rail → Assets") | N | — | N | PARTIAL | Register-only; home is boilerplate (T4-10) |
| F-AS-30 | Drawer stock overlay | ❌ | 1038 | — | — | — | — | REMOVED-N/A | — |
| F-AS-31 | Stock modal | ✅ | 1039 | P/08 §5 Stock save, §4.1 | P | not configured | P | PARTIAL | Photos/Videos switch, Orientation/Colour filters unspecified |
| F-AS-32 | Stock: one provider missing | 🟡 | 1040 | P/08 §9 | P | not configured | N | PARTIAL | Single-provider fallback state missing |
| F-AS-33 | Stock save loses alt/credit | 🐞 | 1041 | P/08 §5 Stock save | Y | — | P | COVERED | Data-loss answered (keep author/source/alt + ping) |
| F-AS-34 | Site fonts modal | ✅ | 1042 | P/08 §7 | Y | added/not added | Y | COVERED | Owner name needs API (SC-9) |
| F-AS-35 | Library top bar | ✅ | 1047 | P/08 §4.1; SC-1 | Y | — | Y | COVERED | UX-20 back position solved by SC-1 slot |
| F-AS-36 | Folder rail | ✅ | 1048 | P/08 §4.1 nav | Y | — | P | COVERED | "Unused" → "No known placements" |
| F-AS-37 | Folder delete confirm | ✅ | 1049 | P/08 §6 last sentence | P | — | P | PARTIAL | No confirm (SC-15) and no Undo (MS IAF-09 G) — T4-6 |
| F-AS-38 | Trash row | ❌ | 1050 | P/08 §4.1 Recently deleted | — | — | — | REMOVED-N/A | Revived as Recently deleted after U-4 |
| F-AS-39 | Grid toolbar | 🟡 | 1051 | P/08 §4.1 (density separate) | Y | — | Y | COVERED | UX-20 label clash resolved |
| F-AS-40 | List/grid views, drop zone | ✅ | 1052 | P/08 §4.1, §10 (rows 40) | P | empty drop zone | P | PARTIAL | List columns and grid drop overlay unspecified |
| F-AS-41 | Details rail | ✅ | 1053 | P/08 §4.2 (320, tabs) | Y | — | Y | COVERED | — |
| F-AS-42 | Regenerate alt local-only bug | 🐞 | 1054 | SC-21 | — | — | — | DEF (SC-21) | AI alt hidden |
| F-AS-43 | Context menu | ✅ | 1055 | P/08 AS-04, §4.2 | Y | — | Y | COVERED | — |
| F-AS-44 | Library modals (13) | ✅ | 1056 | P/08 §11 "item actions kept" | P | — | N | PARTIAL | Modals not enumerated; clash/move-failed states unspecified |
| F-AS-45 | Confirm delete + 8s Undo | ✅ | 1057 | P/08 §6; SC-15 E-4; P/24 | Y | grace, Recently deleted | Y | COVERED | — |
| F-AS-46 | Status bar | ✅ | 1058 | P/08 §10 footer 32 | Y | not on server | P | COVERED | — |
| F-AS-47 | Image editor | ✅ | 1063 | P/08 §6; MS IAF-09 F/H | Y | — | Y | COVERED | Modal → work-area subview |
| F-AS-48 | Saved/discard/save-failed dialogs | ✅ | 1064 | MS IAF-09 H ("history failure does not erase file") | P | save failed | N | PARTIAL | Discard-unsaved dialog not specified |
| F-AS-49 | Output formats | ✅ | 1065 | P/08 §6; MS IAF-09 H | Y | — | — | COVERED | — |
| F-AS-50 | Accepted kinds + limits | 🟡 | 1070 | P/08 §5 Accept | Y | refused-with-reason | Y | CONFLICT | P/08 §4.1 Type filter lists "Audio"; §5/§11 refuse audio — T4-5 |
| F-AS-51 | Upload → Blob → createAsset | 🟡 | 1071 | P/08 §5 Confirm | Y | uploading, waiting to sync | Y | COVERED | — |
| F-AS-52 | Upload progress | 🟡 | 1072 | P/08 AS-07, §5 Progress | Y | — | — | CONFLICT | Docs call 75→99 "real, existing"; INV: synthetic, stalls at 75 — T4-3 |
| F-AS-53 | Auto alt on upload | 🟡 | 1073 | SC-21 (hook unmounted) | — | — | — | DEF (SC-21) | — |
| F-AS-54 | Unconfigured alt provider | 🟡 | 1074 | SC-21 | — | — | — | DEF (SC-21) | — |
| F-AS-55 | Server quota trusts declared bytes | 🐞 | 1075 | P/08 AS-07 (noted); CP:656 Fix | N | — | N | PARTIAL | No SC-9 / backlog row — T4-9 |
| F-AS-56 | Image loss after failed registration | 🐞 | 1076 | P/08 §5; SC-9 ⛔ FI-03; P/14:142; backlog BK-007 | Y | not saved, retry, other device, publish block, exit guard | Y | COVERED | Blocked ⛔ P1-D18; interim guard mandatory |
| F-AS-57 | Library scope = user | 🟡 | 1077 | P/08 header, §8 | Y | viewer | — | COVERED | Decided per user per site |

### CMS (B1–B49)
| FID | Feature | INV | INV line | Design home | Controls | States | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-CM-01 | Rail entry | ✅ | 1086 | P/02 LR-05; P/07 §4 | Y | viewer disabled | Y | COVERED | — |
| F-CM-02 | Drawer root | ✅ | 1087 | P/07 §4 (nav column) | Y | — | Y | COVERED | Merge |
| F-CM-03 | Loading / error | ✅ | 1088 | P/07 §11 | P | loading, failed+Retry | P | COVERED | "Not a data loss" wording not carried |
| F-CM-04 | Drawer empty state | 🐞 | 1089 | P/07 §11, §9 | P | no collections | P | PARTIAL | Toggle default + one primary action not stated |
| F-CM-05 | Workspace takeover empty centre | 🐞 | 1090 | P/07 §11; CM-02 "Keep" | P | no collections | N | PARTIAL | CTA placement (centre vs hint column) unspecified |
| F-CM-06 | Back to canvas | ✅ | 1091 | SC-1; P/07 §4 | Y | — | Y | COVERED | Relabel "‹ Back to {origin}" |
| F-CM-07 | ⌘K "Manage CMS records" | ✅ | 1092 | P/18 CP-06 (as-is), §Records group | P | — | P | PARTIAL | Label/target mismatch not addressed |
| F-CM-08 | Collection header, tabs, ⋯ | 🟡 | 1097 | P/07 §4 (four visible tabs) | Y | — | Y | COVERED | — |
| F-CM-09 | Sheets / Airtable | ⏳ | 1098 | P/07 §4, §12 "Planned" | Y | disabled | — | COVERED | — |
| F-CM-10 | Create Collection modal | 🐞 | 1099 | P/07 §9 | P | create fails | P | PARTIAL | Stepper bug and 9-type list untouched — T4-16 |
| F-CM-11 | Two-step wizard | ❌ | 1100 | — | — | — | — | REMOVED-N/A | — |
| F-CM-12 | Collection settings | ✅ | 1101 | P/07 §8 | Y | blocked while bound | Y | COVERED | + preflight, soft delete |
| F-CM-13 | Products preset | ✅ | 1102 | CP:671 vs CP:841; P/03 AD-16 Defer | N | — | N | CONFLICT | T4-11 |
| F-CM-14 | Records table | 🟡 | 1107 | P/07 §5 Table, Bulk | Y | draft/published/changed | Y | COVERED | — |
| F-CM-15 | Records search | ✅ | 1108 | P/07 §5 | Y | no match | Y | COVERED | — |
| F-CM-16 | Empty collection states | ✅ | 1109 | P/07 §11, CM-04 | Y | no fields, no records | Y | COVERED | — |
| F-CM-17 | Record sheet | ✅ | 1110 | P/07 §5 Open record, Form | Y | — | Y | COVERED | Rich-text toolbar has no board |
| F-CM-18 | Record footer (eligibility colour bug) | 🐞 | 1111 | P/07 §5 Published, Save states | Y | saving, saved, failed, conflict | Y | PARTIAL | Eligibility line "kept"; colour defect not addressed |
| F-CM-19 | Record previews | ✅ | 1112 | P/07 §5 Preview | Y | — | Y | COVERED | "Preview (unsaved)" relabel |
| F-CM-20 | Delete record (new id) | 🟡 | 1113 | P/07 §5 Delete; SC-9; SC-15 E-1 | Y | Recently deleted, slug taken | Y | COVERED | Fallback until undelete endpoint |
| F-CM-21 | Conflict / gone banners | 🟡 | 1114 | P/07 §5 Save states | P | conflict | N | PARTIAL | No "theirs" diff — T4-17 |
| F-CM-22 | In-drawer views | ❌ | 1115 | — | — | — | — | REMOVED-N/A | — |
| F-CM-23 | Fields table | ✅ | 1120 | P/07 §6 List | Y | — | Y | COVERED | Field reorder absent everywhere |
| F-CM-24 | + Add field | ✅ | 1121 | P/07 §6 Add field | Y | key clash | Y | COVERED | — |
| F-CM-25 | Field inspector | ✅ | 1122 | P/07 §6 Settings, Save | Y | saving, failed | Y | COVERED | Receipts (Fix) |
| F-CM-26 | Delete field | ✅ | 1123 | P/07 §6; SC-15 E-3 | Y | bound, has values | Y | COVERED | ⛔ tombstone dependency |
| F-CM-27 | Field-type coverage 16/10/9 | 🟡 | 1124 | P/07 §6 (16 in Add field) | Y | — | Y | PARTIAL | Create modal list not unified — T4-16 |
| F-CM-28 | Dynamic pages pane | ✅ | 1129 | P/07 §7; DYN §10.1 | Y | missing, collision, ready | Y | COVERED | — |
| F-CM-29 | Server render + pre-publish | ✅ | 1130 | DYN §16 T-DYN-10; P/14 checks | Y | warn/fail | — | COVERED | — |
| F-CM-30 | Pages-panel dynamic count | 🐞 | 1131 | P/11:75; DYN §6, §14 | P | 0 pages, missing | N | PARTIAL | Count rule (pattern without collection page) not stated |
| F-CM-31 | Sources (lost on reload) | 🐞 | 1136 | P/07 §10 banner | Y | session reset | Y | COVERED | Disclosure, not persistence — T4-12 |
| F-CM-32 | Variables (canvas braces) | 🟡 | 1137 | P/07 §10; DYN §7.1 | Y | — | P | PARTIAL | Canvas still shows `{{site.key}}` — not addressed |
| F-CM-33 | Conditions (no-op) | 🐞 | 1138 | DYN §12; P/07 §10 | Y | ghost, not active | Y | COVERED | Redesign; legacy kept inactive |
| F-CM-34 | Inspector CMS binding | ✅ | 1143 | DYN §8; P/06 A1 | Y | §14 list | Y | COVERED | Section retired → row binds |
| F-CM-35 | Binding popover | ❌ | 1144 | — | — | — | — | REMOVED-N/A | — |
| F-CM-36 | Bound chip | ✅ | 1145 | DYN §8.4; P/06 A5 | Y | missing | Y | COVERED | — |
| F-CM-37 | Canvas follows publish | ✅ | 1146 | DYN §8.3 If empty, §14 | Y | empty fallback, unpublished | Y | COVERED | — |
| F-CM-38 | Collection list | 🟡 | 1147 | DYN §11 | Y | empty block, drafts | Y | COVERED | — |
| F-CM-39 | Rich text export | ✅ | 1148 | DYN D6 | Y | formatting removed | — | COVERED | — |
| F-CM-40 | Handlebars/Liquid mode | 🧪 | 1149 | CP:698 (Defer) | — | — | — | DEF (FD-IA-09 Defer) | — |
| F-CM-41 | Server authority | ✅ | 1154 | P/14:156; MS IAF-07 G | — | — | — | COVERED | — |
| F-CM-42 | Outbox + retry toast | ✅ | 1155 | P/14 T-PB-18; P/11:106 | P | pending | P | PARTIAL | Retry toast copy not in any spec |
| F-CM-43 | Conflict handling | 🟡 | 1156 | P/07 §5 "existing semantics" | P | conflict | N | PARTIAL | Stale Keep-mine resend not addressed — T4-17 |
| F-CM-44 | Gone / invalid (local-only collection) | 🟡 | 1157 | P/07 §5 Offline | P | device-only | N | PARTIAL | No local-only collection marker — T4-18 |
| F-CM-45 | Soft-delete tombstones | ✅ | 1158 | P/07 §8; SC-9 | Y | Recently deleted | Y | COVERED | — |
| F-CM-46 | Publish gate + snapshot | ✅ | 1159 | P/14:156, T-PB-18 | Y | syncing, conflict | Y | COVERED | Caps not mentioned |
| F-CM-47 | Import CSV | ✅ | 1164 | P/07 §12 | Y | partial result | Y | COVERED | No export (consistent) |
| F-CM-48 | Import JSON | ✅ | 1165 | P/07 §4 ⋯ | P | skipped rows | P | COVERED | — |
| F-CM-49 | Records modal | ❌ | 1166 | — | — | — | — | REMOVED-N/A | — |

### Forms (C1–C23)
| FID | Feature | INV | INV line | Design home | Controls | States | Interaction | Coverage | Gap / note |
|---|---|---|---|---|---|---|---|---|---|
| F-FM-01 | Form block | ✅ | 1175 | P/03 §4 Forms; REPORT:290 | P | — | P | PARTIAL | Missing labels (L3-029) only in REPORT contract |
| F-FM-02 | Contact Form component | ✅ | 1176 | P/03:80, :118 | P | — | P | PARTIAL | Label `for` not addressed in a panel |
| F-FM-03 | Contact section empty box | 🐞 | 1177 | CP:710 (Fix) | N | — | N | PARTIAL | Register-only |
| F-FM-04 | Field elements list | ✅ | 1178 | P/03 §4 (Forms sub-heading) | Y | — | Y | COVERED | — |
| F-FM-05 | Password field on public forms | 🐞 | 1179 | CP:712 (Fix → "After submit") | N | — | N | PARTIAL | Register-only; no design answer — T4-7 |
| F-FM-06 | Upload field | ❌ | 1180 | CP:713 (Defer) | — | — | — | REMOVED-N/A | REPORT:280 still lists "upload" — T4-14 |
| F-FM-07 | Fields section | 🟡 | 1185 | PDB INS-06 (:549); REPORT:288–290 | P | — | P | PARTIAL | `field-N` collision not addressed; no panel spec |
| F-FM-08 | Per-field inspector | ✅ | 1186 | PDB FD-INS-02 Content (:678) | P | — | P | PARTIAL | Required/Type editable in two places unresolved |
| F-FM-09 | After submit | ✅ | 1187 | CPC FORM-01; MS IAF-13 H | Y | loading, saving, saved, failed, restricted | Y | COVERED | — |
| F-FM-10 | Old Store/Webhook/Email settings | ❌ | 1188 | CP:717 (Defer) | — | — | — | REMOVED-N/A | PDB:679 "Submission → Advanced" stale — T4-15 |
| F-FM-11 | Send to (ADMIN) | ✅ | 1189 | CPC FORM-01 | Y | restricted | Y | COVERED | — |
| F-FM-12 | Spam protection toggle | 🟡 | 1190 | CPC:65; P/10 T-ST-02 | Y | saved | Y | CONFLICT | "Saved directly / live" vs applies on next publish — T4-2 |
| F-FM-13 | Publish wiring | ✅ | 1195 | CP:720 (Keep) | N | — | N | PARTIAL | Register-only; `NEXT_PUBLIC_APP_URL` refusal not in P/14 errors |
| F-FM-14 | Public endpoint | ✅ | 1196 | CP:721 (Keep) | — | — | — | PARTIAL | Backend; register-only |
| F-FM-15 | Visitor outcome | ✅ | 1197 | REPORT:292 A20; MS IAF-13 G | N | success, failure (named only) | N | PARTIAL | Visitor page/inline error undesigned |
| F-FM-16 | Spam / abuse limits | 🟡 | 1198 | P/23:268 | P | at limit | N | PARTIAL | Owner not notified at cap |
| F-FM-17 | Notifications | ✅ | 1199 | P/22:160 (bell row) | P | target deleted/forbidden | P | PARTIAL | Email notification undesigned |
| F-FM-18 | Unified inbox | ✅ | 1204 | P/10:105; MS IAF-13 G–I | Y | no forms, no submissions, no matches, failed | Y | COVERED | — |
| F-FM-19 | Inbox filters / Unspam / Unarchive | ❌ | 1205 | P/10:105, :132 (SET-01 NEW) | Y | — | Y | COVERED | Revived; per-form filter only in REPORT — T4-13 |
| F-FM-20 | "Configure in Inspector ›" (pageId) | 🐞 | 1206 | SC-7; P/10:105, T-ST-07; MS IAF-13 E | Y | missing form | Y | PARTIAL | Return designed; `pageId` dependency unregistered — T4-8 |
| F-FM-21 | "Sent from <url>" | 🐞 | 1207 | CP:728 (Fix) | N | — | N | PARTIAL | Register-only — T4-8 |
| F-FM-22 | 365-day retention | ✅ | 1208 | CP:729 (Keep) | N | — | N | PARTIAL | No disclosure anywhere — T4-21 |
| F-FM-23 | Engine FormHandler unused | 🟡 | 1209 | CP:730 (Redesign); REPORT:292 | N | — | N | PARTIAL | Validation messaging undesigned |

## Principle observations
| PID | Module | Observation (spec level) | Risk | Evidence | Suggested status |
|---|---|---|---|---|---|
| P32 | Forms | No panel owns forms; rules split over 6 docs, 2 of them evidence annexes | Implementers miss FORM-01/IAF-13 | PDB:1014–1031; MS:679 | NEEDS REVISION |
| P38 | Assets/CMS | Empty/loading/error/no-match/truncated states are listed per area | Low | P/08 §9; P/07 §11 | PASS-SPEC |
| P38 | Forms | Inbox states only in an evidence annex; the visitor outcome has no states | Visitor errors undesigned | MS IAF-13 I; INV C15 | NEEDS REVISION |
| P23 | Assets | Progress is spec'd as "real" when the code shows synthetic progress | Acceptance passes a false claim | P/08 §5 vs INV:1072 | NEEDS REVISION |
| P23 | Forms | Spam toggle says live; the effect needs a republish | False success feedback | CPC:65 vs INV:1190 | NEEDS REVISION |
| P24 | Assets | Client accept list = server allow-list; audio refused with reason | — | P/08 §5 | PASS-SPEC |
| P25 | CMS | Recently deleted (30 d) + exact Restore with a declared fallback | Depends on ⛔ endpoints | P/07 §5, §8; SC-9 | PASS-SPEC (blocked) |
| P25 | Assets | A56 interim guard (block exit, Retry/Remove/Stay) | Cross-device blocked | P/08 §5; SC-9 FI-03 | PASS-SPEC (blocked) |
| P25 | Forms | Submission delete = confirm + no Undo, but it is not on the SC-15 exception list | Rules conflict on an irreversible delete | MS IAF-13 G; SC-15 | NEEDS REVISION |
| P21 | Assets | Implicit replace on click removed; explicit Replace/Insert | — | P/08 §4.5 | PASS-SPEC |
| P26 | CMS | Dynamic pages and Settings become visible tabs | — | P/07 §4 | PASS-SPEC |
| P29 | CMS | Add › CMS fields group only shows in a record context | — | DYN §9 | PASS-SPEC |
| P31 | All three | Three save-status vocabularies (Record saving… / Uploading·Waiting to sync / Saving·Saved to site) | Inconsistent status reading | SC-4; P/08 §5; CPC:65 | NEEDS REVISION |
| P39 | Assets | Grid pattern replaces invalid listbox-with-buttons | — | P/08 §10 | PASS-SPEC |
| P39 | Forms | Label/`for` fixes exist only in REPORT, not in a panel | A11y fix may be lost | REPORT:290; INV C1–C2 | NEEDS REVISION |
| P31 | Naming | P/07 and P/08 call their area a "workspace"; SC-11 reserves "Workspace" for the organisation | Copy drift | SC-11:220–221; P/07 §4; P/08 §4.1 | NEEDS REVISION |
| P40 | CMS | Several 🐞/🟡 UX rows left as "existing kept" (B18 colour, B32 braces, B5 centre CTA) | Debt carried forward | P/07 §5, §10, §12 | NEEDS REVISION |

## Contradictions & gaps
| ID | Type | Statement A | Statement B / missing | Severity | Proposed resolution |
|---|---|---|---|---|---|
| T4-1 | missing | Forms are a full INV family (23 rows, INV:1170–1209) | No Forms panel in P/ or in the PDB panel index (PDB:1014–1031); P/06 has 0 form rows | Major | Consolidate IAF-13 + FORM-01 + INS-06 + REPORT form contract into one Forms panel (or a P/06 + P/10 section) |
| T4-2 | contradiction | CPC:65 "Saved to your site directly"; P/10 T-ST-02 "Forms live" | INV:1190: honeypot and message reach the live site only after republish | Major | Scope chip "Applies on next publish" for spam protection and message |
| T4-3 | stale | P/08 AS-07 + §5: "real progress (existing 75→99)" | INV:1013, 1072: synthetic 25/50/75, stalls at 75 | Minor | Mark progress as Fix (needs `onUploadProgress`); update T-AS acceptance |
| T4-4 | contradiction | P/08 §9: near-limit warning at 90% | P/23:103 ≥80% (existing 80%); INV:1014 ≥80% | Minor | Use 80% (SC-18 line) everywhere |
| T4-5 | contradiction | P/08 §4.1 Type filter includes "Audio" | P/08 §5, §11: audio not uploadable; no local audio assets | Minor | Drop Audio from the filter until the server accepts it |
| T4-6 | gap | P/08 §6: folder delete moves assets to All (no confirm stated); SC-15 drops unlisted confirms | MS IAF-09 G "no fake global Undo" → no confirm and no Undo; INV:1049 confirms today | Minor | Give folder delete an Undo toast (restore folder + membership) |
| T4-7 | missing | INV:1179 password value stored and emailed in plain text (🐞) | No spec answer; CP:712 maps it to "After submit" | Major | Spec: hide Password inside forms, or a warning in Add/Inspector |
| T4-8 | missing | SC-7 / P/10 T-ST-07 rely on "Configure in Inspector" reaching the exact form; INV:1206–1207: `pageId` and `sourceUrl` never saved | No SC-9 dependency row; C21 is register-only | Major | Add an SC-9 row (persist pageId/sourceUrl) with a fallback ("form not on the open page — Open page ›") |
| T4-9 | missing | INV:1075 quota trusts declared bytes (🐞 security/billing) | Only noted (P/08 AS-07, CP:656); absent from SC-9 and the backlog | Major | Register as an engineering dependency |
| T4-10 | ambiguity | CP M05-A rows all read "Rail → Assets; contextual picker…" | A29 is an Inspector modal; B39 (export) → "CMS → Data"; C5 → "After submit" | Minor | Treat CP homes as family-level; give row-level homes for A29/B39/C5 |
| T4-11 | contradiction | CP:671 M05-B13 Products preset "Move → IAF-07" | CP:841 M06-C1 "Redesign, IAF-23 deferred"; P/03 AD-16 e-commerce blocks Defer (the trigger is unreachable) | Minor | One disposition: Defer with e-commerce |
| T4-12 | contradiction | INV:1136 owner default: hide Sources until persisted | P/07 §10 keeps them visible with a banner "Sources reset when you reload" | Minor | Confirm with the owner; record the decision |
| T4-13 | contradiction | REPORT:290: "View submissions" opens the inbox filtered to that form | P/10:105 / MS IAF-13: no per-form filter; site-wide export | Minor | Decide on a per-form filter; if kept, add it to P/10 |
| T4-14 | stale | REPORT:280 lists "upload" among retained form controls | INV:1180 upload field hidden; CP:713 Defer | Minor | Mark as deferred in REPORT |
| T4-15 | stale | PDB:679 "Native form transport stays in Submission → Advanced" | INV:1188: no UI writes `formConfig`; settings removed | Minor | Remove the reference or name the real control |
| T4-16 | gap | P/07 §6: Add field offers 16 types | P/07 §9 keeps the setup modal's starter fields (9 types, stepper bug INV:1099) | Minor | One type list for both dialogs; drop the stepper |
| T4-17 | gap | P/07 §5 conflict → "Changed elsewhere — Review (existing semantics)" | INV:1114, 1156: no view of "theirs"; Keep mine resends the stale copy (data-loss risk) | Major | Spec a field diff, and make Keep mine rebase on the latest version |
| T4-18 | gap | INV:1157: a refused collection's entries still queue and block publish | No local-only marker in P/07 or P/14 | Minor | Add a "Only on this device" collection state + publish row |
| T4-19 | gap | P/08 §9 "Stock not configured" (both providers) | INV:1040 one-provider fallback; INV:1039 filters | Minor | Add a single-provider notice; list the filter controls |
| T4-20 | gap | INV:1036–1037: two icon surfaces (drawer drill-in + Inspector modal) | P/08 names only "Icons (Upload ▾)" | Minor | State one icon picker and its homes |
| T4-21 | missing | INV:1208: submissions auto-deleted after 365 days | No disclosure in any doc (only CP:729 Keep) | Major | Inbox footer line "Submissions are kept 365 days" |
| T4-22 | contradiction | MS IAF-13 G, CPC:67: permanent submission delete with confirm, no Undo | SC-15: "Any other confirm in panel text is overridden"; the exception list lacks submissions | Major | Add submission delete to the SC-15 exception list (hard delete) |
| T4-23 | gap | INV:1131 count includes collections without a collection page | P/11:75 / DYN §14 never state the counting rule | Minor | "Count only collections with a collection page" |

**🐞 data-loss check:** A19/A56 image loss → answered (P/08 §5, blocked ⛔ P1-D18). A33 stock credit → answered. B31 sources → disclosed only, not persisted. B33 conditions → answered (DYN §12). C19 spam/archive disappear → answered (P/10 SET-01). **Not answered:** C5 password plaintext (T4-7), C21 sourceUrl never stored (T4-8), C22 silent 365-day purge (T4-21), B43 stale Keep-mine overwrite (🟡; T4-17), A55 quota (T4-9, not data loss).

## Consistency notes
| Topic | Pattern difference | Evidence |
|---|---|---|
| Back labels | P/07–08 "‹ Back to Editor · {page}" ✓ SC-1; DYN §10.1 "Back to CMS · Dynamic pages" (the area · subview form appears only here); P/10 "‹ Back to Form submissions" ✓ | SC-1; DYN:231; P/10:105 |
| Delete / recovery | Assets: confirm only while placed (E-4), Recently deleted after U-4. CMS: Undo + Recently deleted, typed E-1/2/3. Folders: none (T4-6). Submissions: confirm, hard delete, not on the SC-15 list (T4-22) | P/08 §6; P/07 §8; MS IAF-13 G |
| Save status | CMS "Record saving/saved/failed" (SC-4); Assets "Uploading / Waiting to sync / Not saved to library"; Forms "Saving / Saved to site / Failed" | SC-4; P/08 §5; CPC:65 |
| Empty states | "Upload your first image" vs "Create your first collection" vs IAF-13's 4-way split (no forms / no submissions / no matches / failed) — Forms copy unwritten | P/08 §9; P/07 §11; MS IAF-13 I |
| Pickers | Asset picker 284 (Editor) / 720 dialog; CMS source picker 280 popover — different widths for similar choosers (justified by context) | P/08 §4.3–4.4; DYN §7.1 |
| Widths | Nav 240 and detail 320 match across P/07, P/08, P/10 ✓; P/10 forms max 720 | GEO-01 refs |
| Naming | "workspace" for areas (SC-11 violation); "entry" → "record" fixed in P/07 §9 ✓; "Optimise/organise" (UK) in P/08 §1–2 vs SC-11 US spelling | SC-11; P/08:11, :31 |
| Search Esc / keys | Assets `/` focus + ⌘K scoped palette; CMS search follows SC-2; no Forms inbox search spec | SC-12; P/08 §4.1 |
| Register vs spec | CP dispositions (e.g. C12 "Keep") ignore INV redesign notes ("say applies on next publish") | CP:719; INV:1190 |

## Counts
| Coverage | Assets (57) | CMS (49) | Forms (23) | Total (129) |
|---|---|---|---|---|
| COVERED | 33 | 31 | 5 | **69** |
| PARTIAL | 14 | 12 | 15 | **41** |
| CONFLICT | 3 | 1 | 1 | **5** |
| DEFERRED-BY-DECISION | 4 (SC-21 ×3, FD-IA-09 Defer ×1) | 1 | 0 | **5** |
| REMOVED-N/A | 3 | 4 | 2 | **9** |
| OMITTED | 0 | 0 | 0 | **0** |

PARTIAL rows that are register-only (CP row, no spec text): A29, C3, C5, C13, C14, C21, C22, C23 = 8. Contradictions & gaps: 23 (Major 8 · Minor 15). Principle observations: 17.
