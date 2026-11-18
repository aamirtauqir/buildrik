# Panel 10 — Site settings workspace: functionality specification (FD-PNL-10)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by settings revision stamp + access gate (SC-9 ⛔) + Vercel protection-capability check (S7, ⛔) · not VERIFIED** *(R-1018: S7 added)* (independent `design-qa-critic` review: pass 1 PROPOSAL with 4 blocking, pass 2 passed; 5 minor notes fixed). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S3, S7, V2, V6 (+ DS-OD-9 title 20/30); gap rows D2-7, D2-8, D2-25, D2-28, T1-01, T1-04, T1-29, T4-2, T4-8, T4-21, T5-03, T5-08, T5-12, T5-13, T5-20, CS-01, CS-02, CS-10, CS-12, CS-15; FINAL §4 items 3 (T4-21, T4-8), 4 (T4-2), 5, 6, 11 (D2-7); INTERACTION_AND_STATE_MATRIX §3 (offline). Round 2: Q2 (owner-confirmed), Q4, Q11, Q15 (Publish opens in the tray here, SC-7) *(R-1018b)*.

Visual: DS §2 (area title 20/30/600, V6/DS-OD-9; read-only, access and info banners neutral grey + icon, V2; menus/popovers `shadow-drag`, V4; motion 100/160/240, V5); copy patterns DS §3. *(R-1018)*

Governing IA: **BD-14 LOCKED** (labelled "Site settings" in the topbar beside the site name; no rail entry), IA-08 (settings scope), IAF-14 (A–M), SET-01 write-scope matrix (`evidence/ia-final-2026-10-16/control-and-package-contracts.md`), GEO-01 (nav 240; content preferred 960; form max 720; two-column fields stack < 640), Panel 01 (topbar entry, overview on first entry, viewer: disabled with reason), Panel 02 (no rail item active in Site settings). Owner decisions 2026-10-04 (memory): **Yoast-level SEO (all four parts) and Vercel DNS record CRUD are PLANNED** — this panel reserves their homes, it does not design them.

---

## 1. Purpose and boundary

Site settings answers: **configure how this site behaves — identity, languages, search, domains, access, tracking, code — and know whether each change waits for the next publish or happens right now.**

Job: J3 Publish and maintain (00-STRATEGY §3) *(R-1018)*

| In Site settings | Not here (owner) |
|---|---|
| General, Languages, SEO defaults, Domains, Redirects, Access, Analytics, Form submissions inbox, Custom code, Security headers, Danger zone; doors to Brand and to organization workspace (Members, Billing, Integrations) | Page SEO/slug → **Page settings** (Pages, Panel 11); visual tokens → **Brand**; per-form delivery → **Inspector Behavior** *(R-1018 — US spelling, SC-11)*; members/billing → **dashboard** |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/sidebar/tabs/settings/SettingsTab.tsx`, `constants.ts`, `types.ts`, `screens/*`, `components/*`, `hooks/*`; `sidebar/FullPageRouter.tsx:154-178`; `shell/shellDirtyRegistry.ts`; server `site-detail.ts`, `sites.ts`, `forms.ts`.

| ID | Capability | Today |
|---|---|---|
| ST-01 | Entry | rail-less full-screen Portal (`fixed inset-0`, no `inert`); doors: key S, ⌃,/⌘,, ⋯ "Site settings", ⌘K, deep links `?settings=<id>` / `ui:settings-open` (Publish, Page settings, SEO tab). **No topbar button** |
| ST-02 | Sidebar (256) | Back to canvas, title + site name, Search (search mode replaces sidebar; combobox; lands on field), Overview, groups, "Managed in workspace settings ↗" doors, role foot "Your role: X · Permissions"; last screen remembered per site |
| ST-03 | Overview | archived / deletion strips, "Needs attention", 7 group cards with summaries |
| ST-04 | Screens | **Site:** General (name, author, favicon, touch icon, favicon URL; Advanced: site URL slug with confirm), Languages (default locale footer; add/remove locale immediate; 25 locales + RTL; translation checklist), Brand ↗ door. **Search & sharing:** SEO (title, description, OG image URL, social profiles ×6, indexing switch, canonical, robots.txt with preview/reset, "overridden per page in Pages ›"). **Publishing:** Domains (list, primary, add/connect, Force HTTPS, remove, check DNS, TXT ownership), Redirects (CSV import/export, add/edit/delete + Undo toast, 404 suggester switch immediate + Accept → 301, slug-repair card), Access (password protection Pro; share links ↗ dashboard). **Visitors:** Analytics (GA/GTM/Meta Pixel/Clarity, status, Verify), Form submissions (inbox, view/spam/archive/delete, CSV, "Configure in Inspector ›"). **Advanced:** Custom code (head/body/CSS, Pro), Security headers (CSP, XFO, Referrer, HSTS max-age, Permissions). **Danger zone:** archive/unarchive, transfer, delete |
| ST-05 | Save | footer: general, localization, seo, access, analytics, custom-code, headers; immediate: domains, redirects, forms, danger-zone (an immediate screen **still shows the footer while it holds an unsaved edit or a save error**, `SettingsTab.tsx:796-797`); existing per-screen **scope line** under each title (`constants.ts:203-223`: publish / live / lifecycle — Redirects = publish, Domains & Forms = live, Danger zone = lifecycle); footer status Loading / could not load / Not saved / Unsaved / All changes saved; Discard / Save (→ Retry save); toast "Saved · applies on next publish" + Publish; dirty guard Keep editing / Discard / Save and continue; per-screen error banners + field errors; **no conflict state; no saving label** |
| ST-06 | Roles | ADMIN: general, localization, seo, domains, access, custom-code, headers · EDITOR: redirects, analytics, forms · OWNER: danger; below role → read-only banner + disabled fieldset; **unknown role stays editable** (server decides) |
| ST-07 | Doors out | Members, Billing, Integrations & webhooks, Upgrade, share links, post-delete redirect |
| ST-08 | Geometry | sidebar 256; header 112; body px-12, **no max width**; footer 44 |
| ST-09 | Keyboard | **Esc leaves** (through guard) outside inputs; search Esc closes search; guard Esc = Keep editing |
| ST-10 | Not present | Yoast-level SEO analysis, DNS record editing (both PLANNED), Integrations screen (removed → Overview), conflict state, "checking access" state |

Tests: 30 files / ~441 cases; no e2e.

## 3. Problems this design solves
1. **No visible entry** — BD-14 requires a labelled topbar button (Panel 01 adds it).
2. **Unknown role acts as a grant** for destructive actions (IAF-14 C / T-IAF14-6).
3. **Live vs next-publish is easy to miss**: the existing scope line is plain text under the title; Languages mixes both models without saying so.
4. **No conflict / checking-access states**; saving has no explicit label.
5. **Esc leaves the workspace** (inconsistent with the shared rule).
6. Unbounded form width; sidebar width differs from GEO-01; editor behind not inert.
7. Planned SEO analysis and DNS records have no reserved home.

## 4. Target layout

```
rail (no active item) │ SETTINGS NAV (240)              │ CONTENT (max 960; forms max 720)
                      │ ‹ Back to Editor · Home         │ SEO                                 · Applies on next publish
                      │ [🔍 Search settings]            │ Site-wide defaults. Pages can override in Page settings ›
                      │ Overview                        │ ┌ Defaults ─────────────────────────┐
                      │ SITE                            │ │ Title  [ Bella Cucina           ] │
                      │   General · Languages · Brand ↗ │ │ …                                 │
                      │ SEARCH & SHARING                │ └───────────────────────────────────┘
                      │   SEO                           │ ┌ SEO analysis · Planned ───────────┐  (reserved)
                      │ PUBLISHING                      │ └───────────────────────────────────┘
                      │   Domains · Redirects · Access  │
                      │ VISITORS                        │
                      │   Analytics · Form submissions  │
                      │ ADVANCED                        │
                      │   Custom code · Security headers│
                      │ DANGER ZONE                     │
                      │ ORGANIZATION WORKSPACE ↗        │ ── footer (staged screens; immediate screens only while an edit is unsaved/failed) ──────────────
                      │   Members · Billing · Integr.   │ Unsaved changes        [Discard] [Save settings]
                      │ Your role: Admin · Permissions  │
```
(Back slot per Panel 00 SC-1: left end of the 56px work-area header — not in the nav, so it survives the ≤1280 nav collapse.) Sketch position of the back link is illustrative.
- **Entry:** topbar **⚙ Site settings** (Panel 01 §5.3; overview on first entry, then last screen); all existing doors kept. Topbar entry shows active; rail shows none (Panel 02).
- Group labels per IAF-14 E: "Managed in workspace settings ↗" → **"Organization workspace ↗"** *(Change, IA wording)*.
- **Screen header** (exact screen + scope): title · existing scope line restyled as a **scope chip** (*Change: restyle, same values as `SCREEN_SCOPE`*): **"Applies on next publish"** (General, Languages default locale, SEO, Access, Analytics, Custom code, Security headers) · **"Rules saved now · reach visitors on next publish"** (Redirects — SET-01) · **"Live immediately · no publish needed"** (Domains, Form submissions — **except** its spam-protection toggle and visitor success message, which carry their own field-level chip **"Applies on next publish"** because the honeypot and message reach the live site only after republish, INV:1190 *(R-1018 — T4-2)*) · **"Site lifecycle · applies immediately"** (Danger zone) · Languages shows "Default locale: next publish · Locales: saved now". Header 56 min *(DS, Change from 112 / board 8134:212121 — must be shown to fit a 20/30/600 title (V6 / DS-OD-9; was 20/28 — R-1018), scope chip and the right-hand action at 56 and grow at 200% text; board update recorded as a follow-up)*.

## 5. Save contract (SET-01)

| Screen kind | Contract |
|---|---|
| **Staged (footer)** | Edits stay local until **Save settings**; footer states (DS §3 save vocabulary *(R-1018 — CS-12)*): Unsaved changes · **Saving…** (NEW explicit label) · **Saved** (was "All changes saved") · Couldn't save — Retry (edits kept) · **Offline: Save disabled with "Needs a connection"; edits stay on the screen, unsaved** *(R-1018 — offline; announcement owned by Panel 22)* · **Changed elsewhere — Review** (NEW conflict: shows theirs vs yours per field, Keep mine / Use theirs; never silent overwrite) — **Requires engineering: a settings revision stamp** (none exists today). **Until then:** last write wins as today, but the footer never shows "Saved" before the server ack, and a reload after another session's save shows the server value. **Interim concurrent-edit guard (C-2, review 2026-10-17 — required, not optional), two layers (Panel 21 §5.5):** (1) **always, flag-independent:** on Save the client re-reads the screen's server values and, if any field the user edited differs from the value loaded at open, shows "Changed elsewhere — Review" with the theirs/yours list before writing (read-compare-write; not atomic, so the revision stamp stays release-blocking — SC-9); (2) **only when collaboration presence is available** (collab flag on + Panel 21 MP-4): a header banner "{name} is also editing Site settings — the last save wins". Layer 1 is testable with the flag off. **Save error copy (DS §3, F-ST-S13 / T5-13)** *(R-1018)*: a server refusal reads "Couldn't save — Retry" with the server's reason inline; only a real network failure reads "You're offline" — a server error never blames the connection. Same split for screen load: "Couldn't load {screen} — Retry" vs "You're offline". Success toast "Saved · applies on next publish" + Publish (existing). Save and leave awaits the server ack; failed save/discard never navigates (IAF-14 G) |
| **Immediate** | Each action shows inline pending → receipt ("Domain added — waiting for DNS", "Redirect deleted — Undo") (existing toasts kept); footer appears **only while an edit is unsaved or a save failed** (existing, kept); never labelled "Saved settings". **Offline:** every immediate action is disabled with "Needs a connection" *(R-1018)*. **Confirm class per SC-15 (owner S2)** *(R-1018 — CS-01, T5-03, D2-8)*: see the table below |
| **Mixed (Languages)** | Default locale = staged (footer); add/remove locale = immediate — **add: no confirm; remove: Undo only, toast "{Locale} removed · Undo"** (S2 class a; the existing confirm is removed) *(R-1018 — D2-8, T5-03)* — the scope chip shows "Default locale: next publish · Locales: saved now" |
| Dirty guard | **The one guard dialog (owner S3, DS §3)** *(R-1018 — CS-02, T1-01, D2-28)*: title **"Leave without saving?"** · **Keep editing** (default) · **Discard changes** · **Save and leave** (offered here because Site settings has an explicit Save; replaces "Discard / Save and continue"); applies to section switches, Back to Editor, rail clicks, exit, `beforeunload` (existing registry). Save and leave awaits the server ack; a failed save never navigates. **Declared variant for topbar Publish and Preview (NEW, review 2026-10-17; owner-confirmed 2026-10-18, Q2 *(R-1018b)*)** — not leaving, so a different title: "Save settings first?" — Keep editing (default) / Publish without these changes / Save and continue (SC-24). After Save and continue (or Publish without these changes), topbar Publish opens the **Publish task in this area's tray, in place** (SC-7, owner Q15) *(R-1018b)* |

### 5.1 Confirm classes in Site settings (SC-15 three classes, owner S2) *(R-1018 — CS-01, T1-04, T5-03, D2-8)*
| Action | Class | Contract |
|---|---|---|
| Remove a locale (Languages) | (a) Undo only | toast ≥8 s "{Locale} removed · Undo"; no confirm |
| Delete a redirect | (a) Undo only | toast "Redirect deleted · Undo" (existing); no confirm |
| Archive / unarchive site (Danger zone) | (a) Undo only | toast "{Site} archived · Undo" / "{Site} unarchived · Undo"; no confirm |
| Set primary domain | (a) Undo only | toast "{domain} is now primary · Undo"; no confirm |
| Change the site URL slug (General › Advanced) | (b) consequence confirm | plain dialog stating the consequence (existing impact text: links to the old URL stop working); default = Cancel |
| Turn password protection off and **Publish now** (Access) | (b) consequence confirm | "Your site becomes public when this publish finishes"; default = Cancel |
| Delete form submissions (Form submissions) | (b) consequence confirm | submissions are hard-deleted, so no Undo: "Delete N submissions permanently" — Cancel (default) · Delete; no typed confirm |
| Delete site (Danger zone) | (c) typed confirm | type the site name; the dialog **and** the "{site} deleted" screen state **"You can restore it for 30 days"** (sites have a 30-day Recently deleted, P22 GS-06) |
| Transfer site | (c) typed confirm | unchanged (existing) |
| Delete domain | SC-15 listed confirm | unchanged (existing) |

The SC-15 sentence "any other confirm is overridden" applies to every other action on these screens → SC-15.

## 6. Roles and access (IAF-14 D/I)

| State | Behaviour |
|---|---|
| **Checking access** (role not yet known) (NEW) | Note "Checking your access…"; **fields stay editable**; **Save, destructive and immediate actions are disabled** with that reason until the role resolves (Fix: unknown ≠ grant) — applies to Domains, Redirects, Form submissions actions, Languages add/remove and Danger zone |
| Could not verify (**Change** from today's editable-unknown) | "Couldn't check your access — Retry"; same rule as Checking access (fields editable, writes disabled) |
| Demo / standalone (no role service) | Treated as the session's local role: fully editable — never stuck in Checking access (*assumption: demo mode makes no real server writes; verify in implementation*) |
| Below role | Existing read-only banner, reworded to the DS §3 role-refusal pattern **"Changing {screen} needs {Role} access"** (was "Only {role} can change {screen}") *(R-1018 — CS-11)* + disabled fieldset. **Exception (existing):** Danger zone draws its own notice and disables each action itself, because a site creator who is ADMIN may still transfer (`SettingsTab.tsx:705-708`) |
| Viewer | No access — topbar button disabled with reason (Panel 01 §5.3, SC-6); unchanged from today |
| Plan restriction | **Per SC-20:** during the 30-day Pro trial and on Pro, Custom code and Access are fully editable with the label "Pro · included in your trial" / "Pro". On Free after the trial: existing "Pro" pill + LockedScreen / Access lock with SC-18 Upgrade — shown **distinct from role** ("Available on Pro" vs "Only an admin…"). Saved values are kept while locked |
| **Site locked after the trial (over the Free limit, SC-20)** *(2026-10-17)* | every screen read-only with the reason "This site is over the Free limit — Upgrade to edit" (owner) / "Ask the workspace owner to upgrade"; Save, immediate and destructive actions disabled; values stay visible |
| **Over-limit items on an editable site** | Domains beyond the Free limit stay connected but **locked** (no edit, no add); Redirects / integrations beyond the limit keep working and are locked; Custom code and Access show "Saved · not published on Free" (Panel 23 §5.5) |
| Server refusal | Inline error on the action; staged draft kept |

Role matrix unchanged (ST-06).

**Permissions dialog (sidebar foot "Your role: X · Permissions", ⌘K "Permissions")** *(R-1018 — T1-29)*: read-only dialog 480, title "Permissions", lists **who can change what, from the existing ST-06 matrix only** (minimum role per screen — no new roles or grants): **Owner** — Danger zone (archive, transfer, delete site) · **Admin** — General, Languages, SEO, Domains, Access, Custom code, Security headers (+ transfer when the admin created the site, existing) · **Editor** — Redirects, Analytics, Form submissions · **Viewer** — no Site settings access. The reader's own role is marked "You". Nothing outside ST-06 is listed. Door: "Manage members in Organization workspace ↗". Loading: skeleton rows; role unknown: "Checking your access…".

## 7. Screen notes (existing content kept; only deltas listed)
- **General:** unchanged fields; favicon and touch icon gain **"Choose from Assets"** (picker dialog, Panel 08 §4.4) beside the existing upload/URL (NEW); slug change = **consequence confirm** with the existing impact text (S2 class b, §5.1) *(R-1018)*; **validation runs on blur and on Save, never on open or per keystroke** (F-ST-S22 / T5-12 — applies to every Settings form) *(R-1018)*.
- **Languages:** unchanged; no auto-translation promise (IAF-14 H).
- **SEO:** unchanged fields; Open Graph image gains **"Choose from Assets"** (picker dialog) beside the URL field (NEW); + reserved **"SEO analysis · Planned"** card (disabled, labelled "Planned" — never "Coming soon", DS §3 *(R-1018 — D2-25, CS-15)*) for the owner-approved Yoast-level work (focus keyword, score, title templates, readability) — detailed design is a separate task. Page-level SEO stays in Page settings; this screen never writes page values (T-IAF14-3).
- **Domains:** unchanged — the existing **DNS records** card in Manage DNS (expected records, copy, Check DNS, verification statuses — `DomainsScreen.tsx:432-433`) is kept; a separate reserved **"Edit records at Vercel · Planned"** section (owner-approved Vercel DNS CRUD, paused) sits below it, disabled with reason. Status per domain: Pending DNS / Verified / Failed with Retry (immediate operation receipts).
- **Redirects:** unchanged (CSV, dialog, Undo toast, 404 suggester, repair card); delete = Undo only, no confirm (§5.1) *(R-1018)*.
- **Domains › Set primary:** Undo only, no confirm (§5.1) *(R-1018)*.
- **Access:** **OD-C3 decided (SC-22): access changes apply immediately** through a server gate (SC-9 ⛔ "Access gate applied immediately"); until that gate ships, today's next-publish behaviour stays with the C-3 warning below. Trial end never changes access on a live site (Panel 23 §5.6). Fields unchanged; plan lock per SC-20 (open during the trial; locked on Free after it — a protected site on Free hits the Publish Blocking row, SC-20). **NEW (C-3, review 2026-10-17):** turning password protection **on** shows an inline warning under the toggle — **"Your site stays public until you publish"** + **Publish now** button; after Save, until the next successful publish, Overview › Needs attention lists "Password protection saved — not live yet · Publish". Turning it **off** shows the mirror warning "Your site stays protected until you publish"; **Publish now** after turning it off is a consequence confirm (§5.1) *(R-1018)*. **Plan can't protect (owner S7)** *(R-1018 — T5-08)*: when the connected Vercel plan cannot password-protect deployments, the Access screen shows a **blocking state** under the toggle — "Your Vercel plan can't password-protect this site. Publishing is blocked while protection is on." + **Turn protection off** · **Open Vercel plan ↗** — and Panel 14 lists the same Blocking check; the site is **never published public silently** (same principle as SC-20). ⛔ **Requires engineering:** read the protection capability from the workspace's Vercel connection (today protection is silently skipped, INV 1321); until it exists this state cannot be shown and the row stays blocked.
- **Analytics:** unchanged; Verify statuses distinct (not configured / waiting for data / receiving / error).
- **Form submissions:** inbox kept; **NEW (SET-01):** view filter Inbox / Spam / Archived with **Unspam** and **Unarchive** row actions; **per-form filter** *(R-1018b, owner Q11)*: a "Form ▾" select (All forms · each form by its name) beside the view filter, combinable with it; the count and Export follow the chosen form (the server already filters by form — `listSubmissions` / export take `formBlockId`, `form-submission.service.ts:216-220, 388-394`); the choice is kept per site for the session *(DS)*; "Configure in Inspector ›" → Editor with the form selected and **"‹ Back to Form submissions"** return *(NEW return)*. *(R-1018:)* **Delete** (row or bulk) = consequence confirm **"Delete N submissions permanently"** (S2 class b; submissions are hard-deleted). **Inbox footer:** "Submissions are kept 365 days" (T4-21 — the existing purge is stated, not silent). **Spam protection toggle and success message** carry the chip "Applies on next publish" (T4-2). **Dependency (T4-8):** "Configure in Inspector ›" reaching the exact form needs `pageId`/`sourceUrl` persisted on submissions (SC-9 row, engineering); until then, when the form's page is unknown the action shows "Form not on the open page — Open page ›" instead of a wrong selection.
- **Custom code:** code fields get their own label and **Esc leaves the code field** (no focus trap; IAF-14 I); Pro lock per SC-20 (open during the trial).
- **Security headers:** unchanged incl. custom HSTS seconds.
- **Danger zone:** unchanged actions; **confirmations per §5.1** (archive/unarchive Undo only; delete site typed + 30-day restore line; transfer typed) *(R-1018 — T1-04, T5-03)*; disabled while access is checking.
- **Overview** gains the trial chip "Pro trial · {n} days left" → Billing (SC-20). The workspace pending-deletion **strip** is replaced by a **Needs attention row**; the editor-wide notice is Panel 22's banner (9) in the P22 slot — one surface each (CS-08) *(R-1018 — T5-20)*.
- **Organization workspace doors:** open the named dashboard page in a new tab; Editor context unchanged (T-IAF14-7).

## 8. Search
Existing search mode kept (combobox, ↑/↓/Enter, lands on field). Results show group › screen › field; restricted results shown with lock and reason (no hidden-field leak).

## 9. Geometry (GEO-01; NOT MEASURED)
- rail 56 (no active item) + nav **240** (as-built 256 → Change) + content max **960**, forms max **720**, two-column field rows stack below 640; header 56 min; footer **48 min** (GEO-01 form footer; as-built 44 → Change) — nav 240 / header 56 / footer 48 confirmed against DS §2.6 *(R-1018)*; Permissions dialog 480 *(R-1018)*; ≤1280 nav collapses to "Settings navigation" overlay button; dialogs 640 (existing).
- Editor behind **inert** and not focusable (Fix).

## 10. Keyboard
- **Esc no longer leaves Site settings** *(Change)* — shared rule "Escape closes only the topmost cancellable layer" (search mode, dialog, popover); otherwise no-op. Leaving via "‹ Back to Editor", topbar, or rail (all through the dirty guard).
- Focus moves to the first invalid field on failed Save (IAF-14 I). F6 regions per NAV-04.
- **No keyboard shortcut opens Site settings** *(R-1018b, owner Q4)*: key S and ⌃, / ⌘, are retired (⌘, opens the browser's own settings); doors are the topbar button, ⌘K, the ⋯ menu row (no key hint) and the existing deep links.

## 11. Preservation map
| Old | New | Disposition |
|---|---|---|
| ST-01 doors | + topbar button (BD-14); ⋯ row, ⌘K and deep links kept; **key S and ⌃,/⌘, retired** (owner Q4) *(R-1018b)* | Keep + NEW + Remove |
| Viewer access | None (unchanged); topbar button disabled with reason | Keep |
| ST-02 sidebar | 240; group label "Organization workspace ↗" | Keep (Change width/label) |
| ST-03 overview | Same; first-entry default | Keep |
| ST-04 all screens and fields | Same | Keep |
| ST-05 save models | Same models; Saving label (NEW); conflict state (NEW, needs revision stamp); scope line restyled as chip with SET-01 values (Change) | Keep + NEW |
| Form submissions inbox | + Spam / Archived views, Unspam / Unarchive; + per-form filter (Q11 *(R-1018b)*) | Keep + NEW |
| ST-06 roles | Same matrix; unknown role no longer acts as a grant | Keep + Fix |
| ST-07 doors out | Same (Upgrade door kept; during the trial it reads "Pro trial · {n} days left") | Keep |
| ST-09 Esc leaves | Topmost-layer rule | Change |
| Dirty guard Keep editing / Discard / Save and continue | One guard dialog "Leave without saving?" Keep editing · Discard changes · Save and leave (S3) | Change *(R-1018)* |
| Confirms on locale remove, archive, set primary | Undo only (S2 class a); slug change / protection-off publish / submission delete = consequence confirm; delete site typed + 30-day restore line | Change *(R-1018)* |
| — Vercel plan can't protect (silently skipped today) | Blocking state on Access + Panel 14 Blocking check (S7, ⛔ engineering) | NEW *(R-1018)* |
| Permissions link (no content spec) | Read-only Permissions dialog from ST-06 | Keep + specify *(R-1018)* |
| Overview pending-deletion strip | Needs attention row; banner via Panel 22 | Change *(R-1018)* |
| — Yoast SEO, DNS records | Reserved Planned slots | Planned |
| Integrations screen (removed earlier) | Door to dashboard Integrations | Keep |

No capability removed.

## 12. Acceptance (specified, NOT RUN)
| ID | Pass condition |
|---|---|
| T-ST-01 | Topbar "Site settings" opens Overview first time, last screen afterwards; rail shows no active item |
| T-ST-02 | Every screen's scope chip matches `SCREEN_SCOPE` / SET-01 (Redirects "saved now · next publish"; Domains/Forms live; Danger lifecycle); Languages shows both; Form submissions' spam toggle and success message show "Applies on next publish" *(R-1018 — T4-2)* |
| T-ST-03 | Role unknown: fields editable; Save and every immediate/destructive action (Domains, Redirects, Forms, Languages add/remove, Danger zone) disabled with reason until the role resolves; demo mode stays editable |
| T-ST-04 | **BLOCKED until the settings revision stamp exists:** concurrent edit → "Changed elsewhere — Review" with per-field choice; no silent overwrite |
| T-ST-04b | **Interim read-compare-write guard (layer 1, flag-independent)** *(R-1018 — rewritten per D2-7)*: session A and B open the same screen; A saves field X; B edits X and presses Save → B is **not** written; B sees "Changed elsewhere — Review" listing X with theirs vs yours before anything is written; choosing Keep mine then writes; a field B did not edit is never overwritten with B's stale value; neither footer shows "Saved" before its own server ack; reload shows the server value |
| T-ST-05 | Failed Save and leave stays on the screen with edits; focus on first invalid field |
| T-ST-06 | Esc with nothing open does not leave; Back to Editor restores origin |
| T-ST-07 | "Configure in Inspector ›" selects the form; "‹ Back to Form submissions" returns |
| T-ST-08 | SEO save never changes any page's own SEO values |
| T-ST-09 | Planned SEO analysis and DNS records show disabled with "Planned" (no "Coming soon" anywhere); no fake controls *(R-1018 — D2-25)* |
| T-ST-10 | Existing ~441 settings tests updated with the change, not deleted |
| T-ST-11 | Remove a locale, delete a redirect, archive the site, set a primary domain → no dialog; toast "… · Undo" and Undo restores; change the site slug / turn protection off and Publish now / delete submissions → consequence dialog with Cancel default ("Delete N submissions permanently"); delete site → typed confirm and the dialog + deleted screen say "You can restore it for 30 days" *(R-1018 — S2)* |
| T-ST-12 | Leave a dirty screen via Back to Editor / rail / section → "Leave without saving?" with Keep editing (default) · Discard changes · Save and leave; failed Save and leave stays *(R-1018 — S3)* |
| T-ST-13 | **BLOCKED until the Vercel capability read exists:** a site on a Vercel plan without protection, protection on → Access shows the blocking state and Publish is blocked; the site is never deployed public *(R-1018 — S7)* |
| T-ST-14 | Offline: Save and every immediate action disabled with "Needs a connection"; edits stay; one polite announcement (Panel 22). Server refusal reads "Couldn't save — Retry", network loss "You're offline"; a screen load failure from the server never mentions the connection *(R-1018 — F-ST-S13)* |
| T-ST-15 | Typing in a field shows no error per keystroke and none on open; the error appears on blur or Save *(R-1018 — F-ST-S22)* |
| T-ST-16 | Form submissions inbox footer reads "Submissions are kept 365 days"; Permissions dialog lists exactly the ST-06 roles and marks "You" *(R-1018 — T4-21, T1-29)* |
| T-ST-17 *(R-1018b, Q11, Q4)* | With two forms, "Form ▾" = Contact shows only Contact submissions in Inbox/Spam/Archived; Export downloads only those; S and ⌃,/⌘, do not open Site settings, ⌘K does |

## 13. Review and not verified
Independent review complete (see status). Not verified: runtime, conflict detection backend (needs revision stamps on settings), Vercel protection-capability read (S7), submission `pageId`/`sourceUrl` persistence (T4-8), DNS/provider behaviour, measured geometry.
