# Apply brief — owner decisions 2026-10-18 → design docs

Owner approved all 45 decisions (option A) and said "han laga do" (apply them). Mode: DOCUMENTATION edits only. Never touch app code, tokens.generated.*, CLAUDE.md files, AGENTS.md, or files owned by another agent.

## Paths
- E = /Users/shahg/Desktop/pencil/buildrik/packages/editor
- D = E/docs/audit-and-design-2026-10-16 ; P = D/panels ; A = D/design-audit-2026-10-18
- Inputs (read first, read-only): A/OWNER-DECISIONS-2026-10-18.md (the 45 decisions) · A/FINAL_DESIGN_QA_REPORT.md §4 (fix list) · A/CROSS_SCREEN_CONSISTENCY_AUDIT.md §1 (CS-01…23) · A/DESIGN_SYSTEM_SPECIFICATION.md (§2 values, §3 copy patterns, §4 components) · A/DOCUMENTATION_AUDIT.md §6 (284-row gap register — search it for your files' names/panel numbers, e.g. "P/07", "07 §", "Panel 07", "P07").

## What to apply in YOUR files
1. Every one of the 45 decisions that touches your files.
2. Every FINAL §4 fix-list item that touches your files.
3. Every gap-register row (any severity) about your files **whose resolution needs no new decision** (stale text, wrong citation, contradiction already settled by a decision or SC rule, missing state row with an obvious answer, copy pattern alignment). If a row needs a choice nobody made, do NOT invent one — list it under "Not applied" in your report.
4. Remove stale panel text that a 00-SHARED-CONTRACTS rule overrides (the audit's CS findings) so panel text and SC agree. Prefer replacing with a one-line pointer "→ SC-n" over duplicating the rule.

## Conventions (all agents)
- Mark every changed rule/row with ` *(R-1018)*` (same style as the existing *(R-1017)*).
- Add ONE line right under each file's status line: `**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): <IDs applied here>.`
- Status labels: keep SPEC COMPLETE / not VERIFIED; never write DESIGN READY or VERIFIED. Update "blocked by" lists if you add ⛔ dependencies.
- Edit in place with minimal diffs. Keep the existing structure, IDs and numbering; append new rows/IDs rather than renumbering.
- No new capabilities beyond the decisions. No AI entry points (SC-21) — except P3 Brand "From logo or URL", which is decided NOT AI and ships this version.
- Each panel 01–25 §1 gets one line `Job: J1 Build / J2 Get approval / J3 Publish and maintain / S supporting` (00-STRATEGY §3) if missing — pick from its documented purpose.
- US English nouns per SC-11 (Behaviour tab label stays as the approved tab name only if SC-11 lists it; otherwise "Behavior" — check SC-11 and follow it).

## Fixed vocabulary to use (from DS §3 and decisions)
- **SC-15 classes (S2):**
  (a) Undo only (toast ≥8 s "{Name} {verb} · Undo", plus Recently deleted where the object has one): delete page/component/collection/record/field (as today), archive/unarchive site, locale remove, redirect delete, detach instance(s), update main from selection, set primary domain, named-version delete (S5).
  (b) Consequence confirm (plain dialog that states the consequence; default = Cancel): replace page from template, republish, reload latest (discards local), overwrite in conflict (after "Before overwrite" snapshot, S4), remove password protection and publish, change a live page's slug, Inspector column reduction that removes content, component Reset that drops overrides, choosing the active set on plan downgrade, duplicate site.
  (c) Typed confirm: delete site (screen also states the 30-day restore), unpublish site, transfer site, permanent delete from Recently deleted, CMS E-1/E-2/E-3 as already declared.
  Unchanged existing SC-15 items: delete domain, revoke client review link, Clear undo history until K-8, discard a kept unsaved copy, lossy CMS conversions, asset delete E-4.
  Duplicate name ("create anyway?") → inline warning, no dialog. Form submission delete → (c)? NO: submissions are hard-deleted → typed is overkill; use (b) consequence confirm "Delete N submissions permanently".
- **Unsaved guard (S3):** title "Leave without saving?" · buttons Keep editing (default) · Discard changes · Save and leave (only where an explicit Save exists: Site settings, CMS record, Page settings).
- **Save states:** Saving… · Saved · Couldn't save — Retry · Applies on next publish · Offline — will save when back online.
- **Offline control:** disabled with "Needs a connection"; announcement owned by Panel 22 (one polite announcement).
- **Role refusal:** "{Action} needs {Role} access".
- **Not built yet:** "Planned" only.
- **Delete toast:** "{Name} deleted · Undo · Recently deleted ›".
- **Load error:** server "Couldn't load {thing} — Retry"; network "You're offline" — never blame the connection for a server error.
- **Nouns:** Font-size token · main component (not master/definition) · Area (editor areas) vs Workspace (organisation) · US spelling (Color, Colors).
- **Geometry (GEO-01/DS §2.6):** rail 56 · Add/Layers 284 (260–360) · Inspector 300 · task host 360 (320–420) · nav 240 · detail 320 · area header 56 · task header/footer 48 · drawer header 44 · bottom bar/drawer footer 32 · canvas toolbar 44 · dialogs 480/560/640/720/960 · popovers 240/280/360 · toast 460 · rows 28 dense / 32 tool / 40 thumbnail resource lists / 48 two-line / 56 avatar two-line · controls min 32, in-row icon buttons 24 with ≥8 spacing.
- **Visual:** header ladder area 20/30/600 · panel/task 14/20/600 · section 12/16/600 sentence case; motion 100/160/240 only, no pulse, every animation names its reduced-motion result; info banners neutral grey + icon; red alignment guides (new token canvas-guide); menus/popovers shadow-drag; focus = accent border + soft 2 px ring (founder 2026-07-29); radius per G13 (panel chrome ≤4, form atoms/overlays 8, modals 12).

## Your report back (≤200 words)
Files changed · decisions/IDs applied · gap rows applied (IDs) · "Not applied" list with reason · anything you found contradictory that you did NOT resolve.
