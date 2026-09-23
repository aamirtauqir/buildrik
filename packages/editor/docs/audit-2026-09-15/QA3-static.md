# QA3 · static re-verification of pass-5 fixes (read-only)

_Reconstructed after the reboot: agent summary + §5 discrepancies._

Report written to `/private/tmp/claude-501/-Users-shahg/b0605a7a-7551-4483-8ad1-16b86d46874d/scratchpad/interaction-audit/QA3-static.md` (screenshots in `QA3-shots/`). Read-only throughout; no writes to the file.

## Summary

**Claims verified: 68** (A 20 · B 15 · C 16 · D 16 · COORD 1 composite) — **63 CONFIRMED, 5 PARTIAL, 0 NOT CONFIRMED.**

Confirmed by exact read-back: both Exit pages are 1440×900 with `color/bg-app` (VariableID:2:9), topbars and cards; Exit · Workspace link → `BACK`; Tablet board `4418:126653` fully converted (bar hidden, site page 768×520 @16,112, "768px" indicator, chips W→166009 / D→81300 / M→4428:140088, status "768 × 250 · Tablet · 100%"); chip/W sample 4/4 → 166009; toolbars y740 760×72; delete-confirm `4418:142410` rebuilt (560, p24 g16 r12, `elevation/modal`, Cancel CLOSE, Delete destructive → 142651); Detach/Update and 12 v1 backup dialogs with foot rows; catalogue + replace-mode 4-up; Starters CONDITIONAL back; Bistro CTA gate; Pages delete-confirm colours; Resize Body; both new CMS STATE boards + their triggers; Generate = SET + OVERLAY; 6/6 sampled footer conversions; Unsaved-settings fills; Publish wiring moved to buttons; Reconnect Vercel / Back to editor; Preview Done → 81300; Compare 776; Review 118896 headers/Resolve conditionals; Issues/Publish drawer ✕ → 123573.

**Page-wide counts (all match the coordinator):** `;16:13` dead = **0** (147 → 123573); chip/W → 126653 = **0**, → 166009 = **384**; GENERATED bindings **45/45** to VariableID:4643:45304.

**Visual spot-check (8 boards):** nothing overlapped, clipped, empty or wrongly filled.

**Discrepancies:**
- **Biggest miss (A + COORD):** the 23 Layers-section headers A swapped are the `Icons=close` variant whose ✕ is child `;2100:10962`, not `;16:13`. The X1 sweep never touched it: **48 live boards have a dead drawer ✕** (145 close-variant headers on live boards: 93 wired, 4 to base boards, 48 dead — all 21 swapped Layers boards + STATE · Layers/Inspector boards). "dead: 0" is true only for the expand-close child.
- Exit · Editor card `4762:55416`: pad 0 / gap 0 / `elevation/popover`, not "dialog anatomy pad 24 / gap 16"; the other agent's Button `4762:55430` no longer exists (D reverted it) — return path is the text link `4418:125161` → NAVIGATE 123152.
- `4418:84416` header carries an instance-level NAVIGATE→79139 (A said none did); `4418:91602` is 200×196 not ×184; launcher card `4757:150224` is wired only on its button; B's "149460" is `4428:149460`.

**Also noticed:** `4418:145176` footer still 128 px (visible 100-px spacer `4418:145177`); `4418:95816` "+ Add page" dead on the now-reachable structure view; stale layer names (Conflict modal 440, scrim rgba…, "3 templates" grids); toolbar radius 10 family-wide; token dialogs use a raw shadow not `elevation/modal`.

## 5. Discrepancies (PARTIAL / not-as-stated)
124:## 6. Noticed, not in the reports (≤ 10)
## 5. Discrepancies (PARTIAL / not-as-stated)

| # | Module | Node | Report says | File has |
|---|---|---|---|---|
| D1 | A + COORD | 21 Layers-section headers (`4418:79145, 79361, 79552, 79806, 80048, 80256, 80495, 81542, 81760, 81978, 82197, 82415, 82635, 82872, 83080, 83301, 83504, 83705, 83917, 84119, 84416`) and 27 more close-variant headers on STATE · Layers / STATE · Inspector boards | A: headers swapped to `2100:10963`; COORD X1: "dead: 0" | Swap is real, but the `Icons=close` variant's ✕ is child `;2100:10962`, which the X1 sweep (keyed on `;16:13`) never touched: **48 live boards have a dead drawer ✕** (145 close-variant headers on live boards: 93 wired to 123573, 4 to base boards, 48 dead). The "dead: 0" claim holds only for the expand-close child |
| D2 | A | `4762:55416` (Exit · Editor card) | "dialog anatomy pad 24 / gap 16"; other agent's Button `4762:55430` → 123152 kept | pad 0/0/0/0, gap 0, pax MIN, `elevation/popover`; `4762:55430` / `4762:55429` no longer exist (D's revert). Return path = text link `4418:125161` → NAVIGATE 4418:123152 |
| D3 | A | `4418:84416` | "no reactions were on the old headers per D-29" | instance-level ON_CLICK NAVIGATE→4418:79139 on the header of `4418:84410` (STATE · Layers · list-view) |
| D4 | C | `4418:91602` | 200×184 @ (72,176) | 200×196 @ (72,176) |
| D5 | C | `4757:150224` | "card 150224 → NAVIGATE→4762:55480" | card has no reaction; only its `Start walkthrough` button `4757:150228` navigates. Sibling `4757:150219` is wired on both card and button |
| D6 | B | "149460" | wide saved card hidden | correct node is `4428:149460` (hidden ✓); `4418:149460` is a visible "Crop:" text — id typo in the report only |

## 6. Noticed, not in the reports (≤ 10)
Shell cwd was reset to /Users/shahg