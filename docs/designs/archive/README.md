# Archive — do not build from anything in here

Files land here when they are **finished, not when they are wrong**. Nothing is deleted; git has the history either way, but a superseded doc left in the working folder gets read by someone who does not know it is superseded, and that is how a stale decision ships.

The bar for archiving: *a specific document now answers this file's question better, or the work it describes is done.* "Old" is not a reason — much of `docs/designs/` is old and still true.

| File | Archived | Replaced by | Why |
|---|---|---|---|
| `2026-07-17-editor-ia-redesign.md` | 2026-07-19 | `PART-1-information-architecture.md` | Its own first line reads `⛔ SUPERSEDED — do not build from this file`. It was the first IA pass, before the taxonomy went module-buckets → job-groups → tool-rail. |
| `2026-07-19-brief-audit.md` | 2026-07-19 | — (work complete) | Findings-and-repair record for the designer brief: 8 findings, 3 doc-vs-doc conflicts. Every fix is applied in the live docs. The durable outcome lives in `DESIGNER-BRIEF.md` §6a, which records the three settled conflicts. |

## What is deliberately NOT archived

Checked on 2026-07-19 and kept in the working folder, because each was a plausible archive candidate and each turned out to be live:

- **`docs/prd/editor/01-12`** — this reads like a superseded PRD (Ch.02 describes "rail + 11 tabs", which is the previous IA). It is not superseded: it documents **what ships today**, reverse-engineered from the code. Ch.02 is correct about the current product. Separately, **Ch.12 is a live SSOT** — Ch.14 cites it by name in its header as the feature-catalog source.
- **`settings-v2.md`** — approved 2026-05-08, and the target IA has since moved Settings to the Site full-page, which made it look superseded. It is not: `usePanelNavigation` and `DrillInHeader` are both imported in `SettingsTab.tsx`, so this doc describes **shipped code**. The Site full-page is the target; this is the current state. Both are true, with different shelf-lives.
- **`auth-ux-hardening.md`** — dashboard auth, not editor. Arguably in the wrong folder, but not stale.

The pattern worth remembering: **a document that looks superseded and a document that is superseded are different things, and only reading the code tells them apart.** Two of the three above would have been archived on appearance alone.
