# Buildrick editor vs Webflow: product, UX and editor-behaviour audit

**Date:** 2026-10-14 · **Code baseline:** `main @ df60cf9ec` (clean worktree; the uncommitted context-menu diff in the founder's checkout is *not* included) · **Live app:** dashboard + shipping editor on `http://localhost:3300`, Chromium, 1440×900 (plus 1280×720 / 1366×800 where stated), owner `qa@buildrik.local`, six throwaway sites `audit1014-L1…L6`.

This audit improves the existing editor. It does not replace it, copy Webflow, or chase feature parity for its own sake. It was read-only on the product: no code, test, config or Figma file was changed.

---

## How to read this report

### Evidence levels (used in every table)

| Label | Meaning |
|---|---|
| **CODE** | Implemented in code (file:line cited) |
| **REACH** | Reachable through the UI according to the code (mounted, routed, not flag-off) |
| **LIVE ✔** | Reproduced in the running app with a measurement (computed style, DOM, network, DB, reload) |
| **LIVE ✘** | Tried in the running app; the claim did **not** reproduce (behaves correctly) |
| **LIVE ~** | Reproduced only partly, or with a different cause; the row says how |
| **NOT VERIFIED** | Could not be executed; the row says why and what evidence would settle it |
| **DESIGN** | Represented in Figma: **not assessed this round** (owner instruction 2026-10-14: "figma ko abhi mat follow karo"). No design-omission finding in this report is based on Figma |
| **PLANNED** | Described or flag-gated only. Flagged features (`publish`, `dsAi`, `collab`) are planned product, never "dead" |

### What is a finding vs a Webflow difference

Every gap row is classified. A Webflow capability is **not** automatically a Buildrick requirement.

| Classification | Meaning |
|---|---|
| **Defect** | Buildrick does something wrong (a reproducible failure) |
| **Missing capability** | A user job Buildrick cannot do at all |
| **Partial implementation** | Some of the job works; part is missing |
| **Implemented but undiscoverable** | It exists in code but the UI hides it or never wires it |
| **Ownership ambiguity** | Unclear who owns a value, what it affects, or what reset does |
| **Inconsistent interaction** | The same action behaves differently across surfaces |
| **Missing state** | Empty / loading / error / conflict / recovery state absent or wrong |
| **Intentional difference** | Buildrick does it differently on purpose; keep it |
| **Not verified** | Not settled by evidence in this round |

### Priority scale

**P0** critical, blocking, data-loss, or security exposure across users or sites (self-only script execution, e.g. BK-51, is P1 because it needs the user to paste the payload into their own session) · **P1** major core-workflow problem · **P2** meaningful usability improvement · **P3** polish or optional expansion.

### Sources

- Six code maps (one per area) and six live-verification lanes. All are in [`evidence/`](evidence/) with their own step lists, measurements and screenshots paths.
- The Webflow reference: [`evidence/07-webflow-reference.md`](evidence/07-webflow-reference.md). It cites **77 official Webflow sources, all retrieved 2026-10-14** (help.webflow.com via its public JSON API because HTML returns 403, developers.webflow.com, webflow.com/pricing, webflow.com/updates). **No Webflow account was used**; Webflow behaviour is reported only as Webflow documents it. Plan and role restrictions are noted where Webflow documents them. Five places where Webflow's own pages disagree are listed there and left unresolved.
- File paths: `engine/`, `services/`, `shared/`, `blocks/`, `editor/` are under `packages/editor/src/`; bare `canvas/`, `rail/`, `inspector/`, `panels/`, `sidebar/`, `shell/`, `media/`, `cms/` paths are under `packages/editor/src/editor/`; `server/`, `lib/`, `packages/`, `prisma/` are repo-root; `edit/[siteId]/page.tsx` is under `packages/dashboard/app/`. All line numbers are at `df60cf9ec`.
- Prior audits: the 2026-10-08 full audit and the 2026-10-10 UI/UX, product and master audits were used as **context only**; every prior claim below was re-checked against current code and, where possible, live. The 2026-10-14 master-audit rounds (R38–R48) and the page-04 Figma work were **not used** (owner instruction).

### Independent re-verification (2026-10-14)

A separate verifier re-ran the eleven P0 rows and two P1 rows with its own scripts on two fresh copies of the fixture site (`audit1014-V1`, `audit1014-V2`), trying to disprove them. Result: **12 CONFIRMED, 1 PARTIAL, 0 not reproduced** ([`evidence/live/V-results.md`](evidence/live/V-results.md)).

| ID | Re-verification |
|---|---|
| BK-01 | ✔ 50 % no-move click 296×28 → 143×18; +20 px drag → 148 px instead of 336 px; both axes written |
| BK-02 | ✔ `NaNpx` in the save request and after reload (in 4 earlier runs no save fired; unexplained) |
| BK-03 | ✔ saved Align change removed by Escape on a resize; history 2 → 1; save fired; lost after reload |
| BK-04 | ✔ page added in browser B deleted on the server by "Restore my edits" in A; no conflict prompt |
| BK-05 | ✔ ⌘Z behind Settings and in time-travel undid a canvas edit and saved; time-travel also left read-only |
| BK-06 | ✔ original 24/40/32 px + hover red; clone 24/24/24 px, no hover; reload doesn't repair (styles set via the same engine calls the inspector makes, with a positive control) |
| BK-07 | ✔ instance lost Mobile 14 px and hover; toast "2 linked instances updated" with no lost count; old rules left on a deleted id |
| BK-08 | ✔ 2 of 3 parts: cross-site revoke returned `{revoked:true}` and the DB row was revoked; library returned 27 masters from other sites; `theme.targets` listed 49 sites. Capped-ADMIN approval not re-run |
| BK-09 | ✔ canvas and export 32 px at 375 px; Preview 52 px; Preview opened on Desktop from Mobile |
| BK-15 | ✔ 17,886-character GET → HTTP 431; UI "The AI service didn't respond" |
| BK-40 | ✔ exported page shows literal `Q&amp;amp;A &lt;strong&gt;bold&lt;/strong&gt;` |
| BK-42 | ✔ no src after reload; 3 uploads and 2 asset rows for one file; the insert now shows an "only on this device" warning |
| BK-44 | ~ default radios share the name `radio-group`, have no value and store `"on"`; **but** a field labelled "Default" on the inner radio input writes `value` (set to `large`, the submission stored `"large"`). The report text was corrected accordingly |

Not re-run by the verifier: BK-01 at 25 %/150 %, BK-05 in Brand/Templates/Assets, BK-07 toast Undo, BK-08 capped-ADMIN approval, BK-40 template hero, BK-42 `blob:` in export, BK-44 GET/multipart. Those remain verified once (by the original lane).

### What this audit did NOT cover (summary; full register in §B)

Figma/design representation (owner instruction) · WebKit/Safari (not installed) · real email delivery · Stripe/billing · dashboard agency, handover and client screens beyond the library and review pages · real-time collaboration (flag off) · AI success paths (AI is broken locally by finding **BK-15**, so no successful AI run was possible) · a third publish/rollback (owner budget: one publish + one re-publish).

---

## A. Executive assessment

### The short version

Buildrick already has more editor than it shows. The engine, save pipeline, design tokens, review/approval, publish gates and recovery tooling are serious work, and several pieces are ahead of Webflow (rendered version compare, React export, honest AI failure states, token rename that keeps bindings alive). The editor feels incomplete and hard to trust for four reasons, in this order:

1. **The editor lies about what will happen.** The inspector shows values that are not what renders (UX-10, UX-25, D-7), Preview renders a different cascade from the canvas and from the published site (UX-09 + hover, hide and site CSS all lost), and several confirmations misreport (Brand "applies straight away", "Used by 0" while the whole page restyles, "Link duplicated · Undo" on page create, "Approved by the client" for an internal approval). Users cannot use the editor to predict output. **All of this is LIVE ✔.**
2. **Common gestures silently destroy work.** Resize at any zoom other than 100 % halves sizes; keyboard resize writes `NaNpx`; Escape on a resize undoes a different edit; ⌘Z inside Settings/Brand/time-travel undoes canvas work out of sight and saves it; duplicate drops all responsive and hover styling; master update drops instance responsive/hover overrides while the toast says nothing was lost; "Restore my edits" deletes a teammate's newer page. **All LIVE ✔ and persisted after reload.**
3. **The styling model is element-by-element with no visible scope.** There are no reusable class rules (classes are labels only; suggestions are always empty), no value-origin indicator, three breakpoints with the active one hidden on Desktop, four states that cannot be previewed on the canvas, and position/display only on containers. This is the structural gap against Webflow, whose whole Style panel is organised around *selector × breakpoint × state* with colour-coded origin (W04, W17–W20).
4. **Ownership is unclear across surfaces.** Content settings (alt, src, input name) live in the Style tab while links and CMS live in Behaviour; site head code silently beats page head code; "Linked from library" components are per-site copies that never update; workspace-pushed tokens are indistinguishable from local ones; three different role rules govern unarchive; permission copy tells editors they may apply templates and then refuses.

### Highest-impact issues (top 18; full backlog in §F)

| ID | Issue | Evidence | P |
|---|---|---|---|
| BK-01 | Canvas resize at zoom ≠ 100 % rewrites both axes at half size, even on a click with no movement | LIVE ✔ L1 #6 (296×28 → 143×18 at 50 %) | P0 |
| BK-02 | Keyboard resize stores `NaNpx`, survives reload | LIVE ✔ L1 #7 | P0 |
| BK-03 | Escape-cancelling a resize undoes the previous unrelated edit and autosaves the loss | LIVE ✔ L1 #8 | P0 |
| BK-04 | "Restore my edits" overwrites newer server work and deletes a teammate's page, no conflict prompt | LIVE ✔ L1 #21, L5 #29 | P0 |
| BK-05 | ⌘Z behind Settings / Brand / time-travel undoes canvas edits out of sight and saves them | LIVE ✔ L1 #9a, #16; L6 N2; L5 #32 | P0 |
| BK-06 | Duplicate / paste / page-duplicate drop every breakpoint and `:hover` style; reload does not repair | LIVE ✔ L2 §10-9 | P0 |
| BK-07 | Component master update drops instance Tablet/Mobile/`:hover` overrides; the update toast mentions no loss (LC-3); Undo doesn't restore dropped overrides (C-10) | LIVE ✔ L3 LC-3, C-10 | P0 |
| BK-08 | Security: an EDITOR scoped to site A revoked a review on site B; a site-scoped member can read other sites' component masters (`library`, `libraryGet`) and list every workspace site (`theme.targets`); an ADMIN capped to VIEWER approved a review that unblocks publish | LIVE ✔ L6 #12, #11; L3 LC-18 | P0 |
| BK-09 | Preview ≠ published: drops breakpoint overrides of inline properties, all `:hover`, per-device hide, site CSS, scripts, head code; opens on Desktop | LIVE ✔ L2 §10-1/-8/-10, UX-11; LIVE ~ L5 #15–16; LIVE ✔ L6 #4 | P1 |
| BK-10 | Inspector shows defaults instead of the rendered value (line-height 1.1 vs 1.5; align shows nothing; tablet value invisible on Mobile; "Reset to Desktop" lands on Tablet) | LIVE ✔ L2 §10-2..5 | P1 |
| BK-15 | Every AI prompt fails with HTTP 431 (16,855-char GET URL) and the UI blames the service | LIVE ✔ L6 N1, L5 NF-6 | P1 |
| BK-20 | Published 301 redirects and slug-change suggestions point at extensionless paths the deploy does not serve (404); sitemap/robots point at a non-existent host | LIVE ✔ L5 #5, NF-2, NF-3 (real deploy) | P1 |
| BK-21 | Publish: server never runs pre-publish checks; "Publish now" is clickable while checks load; failure-toast "Try again" skips all gates | LIVE ✔ L5 #19 (D-P3); CODE D-P1, D-P9 | P1 |
| BK-30 | No class-based styling (classes are names only; suggestions always empty) | LIVE ✔ L2 J3, §10-14 | P1 (strategic) |
| BK-40 | Formatted text and `&` export as visible escaped text (`<strong>bold</strong>`, `Q&amp;A`, the SaaS template hero); Preview looks right and hides it | LIVE ✔ L4 #1–3 (export; publish uses the same renderer per CODE) | P0 |
| BK-42 | A failed asset registration leaves the placed image with no `src` after reload; the retry re-uploads it (3 Blob PUTs for one file) and creates duplicate asset rows | LIVE ✔ L4 #11 | P0 |
| BK-44 | Forms: Method GET puts visitor name/email in the URL and returns 405; multipart/plain return raw `{"error":"Invalid JSON"}`; radios ship with no `value` and a shared name, so answers are stored as `"on"`; a value can only be set through a field labelled "Default" on the inner radio input, not on the radio block (checkbox: same code path, CODE) | LIVE ✔ L4 #22–23 (wired export submitted to the real endpoint); re-verified ~ (V: "on" by default; "Default" field writes `value`) | P0 |
| BK-51 | Security: Paste HTML executes script in the editor origin while the dialog says the handler "will be removed" | LIVE ✔ L4 #6 | P1 (security) |

### Strengths to preserve (do not remove or "simplify away")

| Strength | Why it matters | Evidence |
|---|---|---|
| Single command gateway with read-only gate and shortcut carve-outs (`CommandCenter`) | One place to enforce role/read-only; only the ⌘Z path bypasses it today | `engine/commands/CommandCenter.ts:132-148,210-291` |
| Save pipeline: compare-and-swap on `Site.lastEditedAt`, change-sequence guard, backoff retry, conflict modal with backup, beforeunload covering in-flight saves | Real multi-tab safety; LIVE ✔ conflict modal (L5 #28) | `sites.service.ts:1049-1092`, `useComposerInit.ts` |
| Saved-version restore takes a safety version first and offers "Undo restore" | LIVE ✘ (works correctly, L5 #27) | `VersionTimelineManager.ts:282-324` |
| Rendered compare (approved / published / saved / current) | Webflow documents no visual diff; this is a differentiator once its coverage is truthful (BK-23) | `CompareHost.tsx` |
| Token system: one write path, in-use delete guard, rename via `replacedBy` so bindings keep resolving, light/dark modes, DTCG import/export | Ahead of Webflow variables in safety; LIVE ✔ token edit + reload | `Composer.ts:390-414` |
| Keep URL / Update URL decision on page rename + `slugHistory` | Right intent capture; only the generated redirect paths are wrong (BK-20) | `RenameUrlDecision.tsx` |
| Publish confirm facts, approval gate, typed UNPUBLISH confirm | LIVE ✔ two real deploys + unpublish (L5); cancel-wins worker CAS is CODE | L5 |
| Viewer read-only route forced server-side; mid-session demotion keeps unsaved work | Safe default | `edit/[siteId]/page.tsx:53-68`, `useSaveCallback.ts:90-121` |
| Media viewer gating pattern (`aria-disabled` + tooltip reason) | Correct pattern to copy elsewhere (needs `aria-describedby`, BK-64) | `useMediaWriteAccess.ts` |
| AI failure states that say "Nothing changed" and an "Undo all" that stops at the user's own newer edit | Honest; keep when AI is fixed | `AITab.tsx:308-368`, `useAgentRunner.ts:413-420` |
| Export to React | Webflow does not offer it | `ReactExporter.ts` (fix BK-58 first) |
| Published interaction runtime (WAAPI) | LIVE ✔ plays in exported HTML (L6 #5) | `engine/export/interactionRuntime.ts` |
| Layers ↔ canvas selection sync and selection breadcrumb in inspector (LIVE ✔ L1 J1); lock-aware Layers drag (CODE; but Layers ⌘-click adds locked elements to a multi-selection, L2 N-6) | LIVE ✔ / CODE | `panels/layers/**` |
| Settings shell: role/plan/scope tables, read-only banner, unsaved guard, "Saved · applies on next publish" | Truthful publish timing | `settings/constants.ts`, `SettingsTab.tsx:621` |

---

## B. Coverage register

### B1. Modules and screen families

`Code` = mapped from source. `Live` = exercised in the running app. Counts are checks executed in that lane.

| Module / screen family | Code | Live | Live lane / checks | Remaining unverified |
|---|---|---|---|---|
| Shell: topbar, save pill, site menu, notifications, exit | ✔ | ✔ | L1, L6 | Session-expired modal, load-error banner, recovery *banner* (only the recovery toast was seen) |
| Rail + drawers, full-page host routing | ✔ | ✔ | L1 #9, L6 #8 | — |
| Command palette, shortcuts (62 of 66 cheat-sheet rows run) | ✔ | ✔ | L1 J3 | "C" comment-mode shortcut (no observable marker) |
| Onboarding surfaces | ✔ | ✔ | L1 #2, #4 (fresh user) | — |
| Canvas: select, nested select, hover, breadcrumbs | ✔ | ✔ | L1 J1 | — |
| Canvas: drag-to-add from Add panel | ✔ | ~ | L1 J1 (once) | Repeated Add-panel HTML5 drags hung/crashed headless Chromium (also on unlocked controls). D-11 drop-into-locked, D-13, D-14, D-20 need a headed browser |
| Canvas: resize, zoom, marquee | ✔ | ✔ | L1 #6–8, #19 | Resize cancel on unmount (D-09). Marquee drawn at half size and handles jumping ~135 px at 50 % are LIVE ~ (L1 #19), folded into BK-01 |
| Canvas: lock, hide, multi-select, group/ungroup, arrange, clipboard | ✔ | ✔ | L1 #14, #17, #18, D-11 | Menu Cut/Copy OS-clipboard payload (D-17) |
| Context menus (canvas, Layers, Pages, Inspector ⋯) | ✔ | ✔ | L1 #11–13 | Working-tree context-menu fix (not on main) |
| Inspector: tabs, sections, capabilities | ✔ | ✔ | L2 | Every element type's sections not individually walked (Heading, Image, Flex, Container, Section, Button, Text measured) |
| Inspector: responsive cascade, override UI, reset/revert | ✔ | ✔ | L2 §10-1..5 | Media-rule insertion order (D-12, needs a site with no tablet rules) |
| Inspector: states | ✔ | ~ | L2 (`:hover` only) | `:focus`, `:active`, `:disabled` editing |
| Inspector: effects | ✔ | ✔ | L2 §10-11 | — |
| Classes / Brand › Classes | ✔ | ✔ | L2 J3 | — |
| Components: create, insert, override, update, reset, detach, delete, duplicate, library | ✔ | ✔ | L3 LC-1…18 | Convert-matching nested instances (C-7), duplicate-master variants (C-14), read-only Detach all (C-11), template apply side (LC-16); LC-9 with a truly offline network; LC-15 through the UI (tRPC used); ⌘Z after Update from selection; 1280×720 |
| Brand: tokens, modes, restore points, workspace push | ✔ | ✔ | L3 J2, LC-10, LC-14, LC-15 | Brand lock / `themeLocked` display, read-only banner, style-preset apply |
| Add panel and block catalogue | ✔ | ✔ | L4 #5, #41, journeys | Every block inserted individually (catalogue duplication is CODE) |
| Text, rich text, links | ✔ | ✔ | L4 #1–3, #5–10 | Published (Vercel) sample of formatted text; export used instead |
| Assets drawer, library, upload, image editor | ✔ | ✔ | L4 #11–21 | Cross-device metadata reconcile (F-13), audio sync (F-16), plan-size limits (F-17) |
| Forms (editor, publish wiring, inbox) | ✔ | ✔ | L4 #22–28 (wired export → real endpoint) | Real notification email delivery; Settings › Form submissions UI as VIEWER (API only); message change after publish |
| CMS (collections, fields, records, binding, lists, dynamic pages, import) | ✔ | ✔ | L4 #29–40 | Server publish snapshot (`cms.publishSnapshot`) and CMS-bound text on a real deploy |
| Ecommerce | ✔ | n/a | — | PLANNED/hidden: no UI entry point (CODE) |
| Pages panel, page settings, templates, create flow | ✔ | ✔ | L5 #1–9, J1 | Folder membership after delete/undo (D-PG11) |
| Site Settings (14 screens) | ✔ | ~ | L5 #10–14, J2; L6 #22 | Domains, Headers, Locales, Danger zone beyond archive, Members/Billing doors |
| Preview | ✔ | ✔ | L2, L5 #15–16, L6 #4 | Interaction click inside Preview (L5 #16); page-link click is LIVE ~ (L4 #8) |
| Export (HTML, ZIP, React) | ✔ | ✔ | L2 (HTML), L4 (ZIP/HTML/React, served locally), L5 (ZIP), L6 (HTML) | React export duplicate `class`/`className` (third clause of BK-58) is CODE only |
| Publish (real), unpublish, cleanup | ✔ | ✔ | L5 (2 real deploys) | Rollback (budget), reload mid-publish CONFLICT, failure step (no deploy failed), Cancel for EDITOR (D-P6) |
| History: session, named versions, compare, time-travel, conflict | ✔ | ✔ | L5 #25–32, L1 #16 | Restore of column-backed settings for non-ADMIN (D-H12) |
| Roles: VIEWER, EDITOR, DESIGNER, ADMIN, capped ADMIN | ✔ | ✔ | L6 role journeys, L5 #17, #20 | EDITOR/DESIGNER depth in Settings and CMS; dashboard Access tab UI |
| Comments, review rounds, client review page | ✔ | ~ | L6 | `/review/<token>` client page end to end; notification delivery |
| Activity, notifications | ✔ | ✔ | L6 | Event delivery / SSE |
| Interactions and element animation | ✔ | ✔ | L6 #1–5 | Target/reverse/loop controls (not exposed in UI) |
| AI | ✔ | ~ | L6 #21, L5 #23 | Every success path (blocked by BK-15) |
| Real-time collaboration | ✔ | ✔ (flag off) | L6 #20 | PLANNED |
| Accessibility (keyboard, focus, AX names) | ✔ | ✔ (Chromium) | L1 J3, L6 #8, #16–18 | WebKit AX, screen-reader session, measured contrast |
| Design (Figma) | ✘ | ✘ | — | Not assessed by owner instruction |

### B2. End-to-end journeys

| Journey | Lane | Result | Where it breaks |
|---|---|---|---|
| Create a page (blank / template / CMS) | L5 J1, L1 #2 | Works for OWNER; dead end for EDITOR by default | Default path is "template" (UX-26); EDITOR gets "Only an admin can apply a template" with no page (BK-24); failed template apply leaves an orphan + duplicate on retry (BK-25); false "duplicated · Undo" toast (BK-26) |
| Add and style an element | L2 J1, L1 J1 | Works on canvas; export matches canvas | Click-add lands off-screen (BK-37); Preview disagrees (BK-09); inspector misreports inherited values (BK-10); hex Enter doesn't commit (BK-62) |
| Change responsive styles | L2 J2 | Cascade on canvas and export correct | Breakpoint hidden on Desktop (BK-31); tablet layer invisible on Mobile and "Reset to Desktop" lands on Tablet (BK-10); Paste/Reset style act on Desktop (BK-12); Preview drops overrides (BK-09) |
| Create and edit a reusable component | L3 J1 | Create, insert, override (desktop), reset dot, detach all work | No in-place master editing; instance can't be deleted (BK-16); responsive/hover overrides lost on update (BK-07); duplicate not an instance until reload (BK-17); variants not authorable |
| Update content or assets | L4 J1–J4 | Inline edit, upload, click-replace, alt, CMS records and bindings persist after reload | Formatted text exports as escaped text (BK-40); link popover corrupts text (BK-55); failed registration loses images (BK-42); library hidden from teammates (BK-43); forms lose answers (BK-44); collection lists reorder on edit (BK-46) |
| Preview | L2, L5, L6 | Opens, switches devices and pages | Wrong cascade, no scripts, no site CSS/head code, opens on Desktop (BK-09); page links dead (CODE F-23) |
| Publish | L5 | Two real deploys succeeded; unpublish worked | Checks not enforced server-side + clickable while loading (BK-21); redirects/sitemap 404 (BK-20); topbar ignores in-flight job (BK-22); no unpublish confirmation toast |
| Recover from a failed or accidental action | L1 J2, L5 #26–29 | Delete+Undo, toast Undo, version restore work | Escape-cancel undoes a different edit (BK-03); session-row restore never saved (BK-19); "Restore my edits" overwrites teammate (BK-04); Overwrite keeps no snapshot (BK-59) |

### B3. Remaining verification register (what evidence would settle each)

| Item | Why not verified | Evidence needed |
|---|---|---|
| Rollback after publish (D-P4) | Owner deploy budget (1 publish + 1 re-publish) | One more real deploy + rollback on a throwaway site, then delete the Vercel project |
| Reload mid-publish CONFLICT (D-P7) and failure-step log (D-P12) | Jobs finished in < 20 s; no deploy failed | Throttled worker or an injected Vercel failure in a dev build |
| AI publish freshness (RR-02), AI Undo-all, AI lock refusal | AI broken by BK-15 | Fix BK-15, then repeat L6 #13/#21 |
| Add-panel drag cases D-11 (drop into locked), D-13, D-14, D-20 | Headless Chromium hung on HTML5 drag | Headed browser or manual walk |
| 1280×720 coverage | Run only in L1/L2; L3, L4, L6 ran at 1440×900 | Repeat components, content and roles lanes at 1280×720 |
| Escape in Brand | L1 J3 (Escape moved focus, Brand stayed open) and L6 #7 (Escape closed Brand) disagree | Rerun on a clean Brand session and record focus before Escape |
| WebKit accessibility of `display:contents` dialogs (D-13) | WebKit not installed | `npx playwright install webkit`, AX snapshot |
| Client review page `/review/<token>` end to end | Needs a real token and client email | Review fixture + email sink |
| Notification and form-email delivery | No mail sink | Local SMTP sink (e.g. MailHog) |
| Media-rule order bug D-12 | Site already had tablet rules first | Fresh site with no tablet rules |
| Every element type's inspector | Time | Element sweep (`scripts/baseline/element-sweep.mjs`) |
| Design representation | Owner instruction | Separate design pass when the owner asks |

---

## C. Comparison and gap matrix

Webflow references cite the ledger IDs in [`evidence/07-webflow-reference.md`](evidence/07-webflow-reference.md). Plan/role notes come from those sources.

### C1. Information architecture and discoverability (A)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dependencies | Verification |
|---|---|---|---|---|---|---|---|---|
| Rail and panel set | Rail shows 6 tools (Add, Layers, Pages, Assets, CMS, Brand). Templates, Settings, Components, Publish, History, Activity, Review only via letter keys, site menu or ⌘K (`rail/tabsConfig.ts:294-296`) | Left toolbar lists every panel with a shortcut: Add A, Pages P, Navigator Z, Components ⇧A, Variables, Style selectors G, Assets J, Libraries L, Audit U… (W01) | Implemented but undiscoverable | Publish, History and Components are hard to find; letter shortcuts are invisible | Add Components, History and Publish to the rail (or a "More" group); show shortcut letters in rail tooltips | P1 | — | LIVE ✔ (L5 NF-13: Publish panel only via ⌘K) |
| Breakpoint visibility | Active breakpoint hidden on Desktop; footer reads "View · 1" (`CanvasFooterToolbar.tsx:370,403-452`) | Breakpoint icons always in the canvas bar; canvas width shown ("1440px") (W01) | Implemented but undiscoverable | Users don't know which scope they are writing | Persistent breakpoint switcher with width in the canvas bar (see §E3) | P1 | BK-32 if breakpoints are added | LIVE ✔ L1 #23 |
| Full-page tools | Settings, Brand, Templates, Assets cover the canvas but leave covered chrome focusable; focus not moved in or returned; three measured "Back to canvas" positions (L1 J3), a fourth (Assets, top-right) in CODE | Panels are part of one Designer layout (W01) | Missing state (a11y) + Inconsistent interaction | Keyboard/SR users wander behind the overlay; ⌘Z acts on hidden canvas | One full-page host primitive: `inert` covered chrome, focus in on open, return to opener, one Back control top-left | P1 | BK-05 | LIVE ✔ L6 #8 (Settings 11/45, Brand 19/60, Assets 18/50, Templates 19/50 Tab stops outside) |
| Command palette | Substring match only, no ranking, 35 rows on empty query, no focus return | Quick find ⌘E/⌘K searches elements, components, layouts, assets, pages, CMS items and runs actions (W14) | Partial implementation | Discovery and speed | Fuzzy ranking, edit-first defaults, keyboard legend, focus return | P3 | — | LIVE ✔ L1 J3 |
| Onboarding | Five surfaces, one modal on top of Preview (z 10001 vs 50) | In-product help via Video tutorials and AI learning assistant panels (W01) | Inconsistent interaction | Interrupts first tasks | One orchestrator queue; never modal over Preview | P3 | — | LIVE ✔ L1 #4; UX-01 clipping LIVE ✘ (fits at 1280×720) |
| Settings vs Style split in inspector | Alt, src, input name/required, button type sit in **Style** › type block; link, ID, form, CMS, visibility in **Behaviour** | Separate **Element settings** (non-CSS) vs **Style** (CSS) panels; settings and content apply to all breakpoints (W03, W19) | Ownership ambiguity | Users hunt across tabs; unclear which edits are breakpoint-scoped | Rename Behaviour → **Settings**; move all non-CSS content there (see §D, §E5) | P2 | — | CODE (`sectionOrder.ts:15-54`) |
| Add-panel taxonomy | 13/14 BUILT-IN COMPONENTS duplicate ELEMENTS rows; two "Testimonials"; Navbar/Footer/CTA in two groups | One Add panel grouped Layout/Basic/Typography/CMS/Media/Forms/Components (W77) | Inconsistent interaction | Confusion | De-duplicate the catalogue | P2 | — | CODE |

### C2. Canvas and selection (B)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Resize under zoom | Screen-px deltas written as CSS px; both axes always written; click with no movement rewrites size | Not documented in detail; resize is a canvas basic | **Defect** | Data corruption on a common gesture | Convert bounds and deltas by `canvasScale`; write only the dragged axis; no write when delta is 0 | **P0** | — | LIVE ✔ L1 #6 |
| Keyboard resize | Handles cast KeyboardEvent to MouseEvent → `NaN` | n/a | **Defect** | Corrupt persisted style | Finite guard; arrow-key resize on a focused handle | **P0** | — | LIVE ✔ L1 #7 |
| Cancel resize | `cancelResize` calls `history.undo()` | Esc cancels only the gesture | **Defect** | Silent loss of an unrelated edit, autosaved | Transaction-local rollback; never global undo | **P0** | — | LIVE ✔ L1 #8 |
| Locks | Right-click selects locked elements; Ungroup, paste-into, Arrange ignore lock; contradictory toasts | Per-element editing permissions for limited roles (W59) | Defect | Locked content changes | Route every structural write through the lock gate | P1 | — | LIVE ✔ L1 #17, D-11 |
| Click-add placement | Nothing selected → appended at page end off-screen; canvas doesn't follow | Nothing selected → bottom of Body, same rule; selection rules documented (W77) | Partial | New element invisible | Scroll to and flash the inserted element; prefer insertion after the visible viewport section | P1 | — | LIVE ✔ L1 N1 |
| Desktop frame fit | At 1440×900 the 1024 px frame overflows a 752 px canvas; right-column handles unusable | Designer needs ≥ 1268 px screens (W01); canvas edge can be dragged to test widths (W19) | Defect | Can't resize right-column elements without zooming | Fit-width default zoom or reserve canvas width; fix IA-12 layout below 1366 | P1 | BK-01 | LIVE ✔ L1 N2, #5 |
| Parent selection | Only inspector breadcrumb and ← key; no canvas breadcrumb | Breadcrumb bar under the canvas; click the label for parent menu; ↑ selects parent (W03, W13) | Partial | Hard to select a wrapper | Canvas breadcrumb in the canvas bar | P2 | §E3 | CODE + LIVE ✔ (crumb works in inspector) |
| Zoom/pan | No ⌘+wheel zoom or space-drag pan | Expand canvas: Space+drag pan, ⌘/Alt+scroll zoom (W16) | Missing capability | Slower navigation | Add both | P3 | — | CODE |
| Layers hide eye | Editor-only hide (publishes anyway; tooltip says so) | Eye-slash = hidden via `display:none` per breakpoint, published (W02, W19) | Intentional difference / Ownership ambiguity | Users expect a live-site hide | Keep as canvas-only but rename "Hide on canvas"; offer "Hide on this breakpoint" that writes the visibility style | P2 | BK-35 | LIVE ✔ L1 #24 |
| Cross-parent Group | Menu Group enabled; does nothing, no toast; three eligibility rules | Wrap in div | Inconsistent interaction | Silent no-op | One eligibility function with a reason | P2 | — | LIVE ✔ L1 #14 |
| Context menus | Canvas submenu opens at (0,0) and ↓ closes it at HEAD; not clamped to viewport; Layers menu has no arrow keys | Right-click menu with Select Parent (W03) | Defect | Keyboard users blocked | Land the working-tree fix (not on main) + clamp + carry disabled reasons | P1 | — | LIVE ✔ L1 #11–13 |
| ⌘D on page row | Duplicates the selected canvas element, not the page | ⌘D duplicate (W13) | Defect | Wrong object duplicated | Pages row owns ⌘D and ⌫ | P1 | — | LIVE ✔ L1 #10 |
| ⌘-drag + Escape | Leaves a clone | Opt+drag duplicate (W13) | Defect | Stray copies | Cancel removes the clone | P2 | — | LIVE ✔ L1 #18 |

### C3. Inspector and property editing (C)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Displayed value | Shows type defaults off desktop (line-height 1.1 vs 1.5 rendered); `text-align` never read (no radio selected); colour and weight show token names or nothing instead of the resolved value (L2 J1) | Field shows inherited value with an orange label; set value blue; element-only pink (W04) | **Defect** + Missing capability | Inspector misdescribes the output; users re-set values already set | Resolved-value model: default → class → base → tablet → mobile → state → inherited/computed, each with an origin | P1 | BK-30 class layer later | LIVE ✔ L2 §10-2, §10-3 |
| Position / display availability | Layout + Position only on containers; Heading, Image, Flex have none | Style panel sections include Layout and Position (W04); per-element availability not documented | Missing capability | Can't absolutely position an image or hide a heading | Show Position and Display basics for all element types | P1 | — | LIVE ✔ L2 §10-16 |
| Number fields | `calc()`/`clamp()` rejected by the parser (CODE); Top offset accepts unitless `10` → element jumps | Variable values can use `calc()`/`clamp()` (W05); calc in plain Style fields not documented in the sources read | Partial + Defect | Fluid type impossible; invalid CSS stored | Accept CSS math; route offsets through the unit parser | P2 | — | LIVE ~ L2 §10-17 (unitless offset confirmed); calc/clamp rejection CODE only |
| Effects composer | Editing blur drops other filters; touching Scale reorders transform and moves the element | Multiple filters, transforms, origin (W04) | **Defect** | Authored effects destroyed | Parse and preserve unknown functions; keep order | P1 | — | LIVE ✔ L2 §10-11 |
| Disclosure | One authored advanced value opens all nine Typography rows | Focus mode; collapsible sections (W04) | Inconsistent interaction | Common controls below the fold | Open only rows with values | P3 | — | LIVE ✔ L2 §10-6 |
| Colour input | Hex field ignores Enter/Tab; only Apply commits | — | Defect | Silent no-op edits | Commit on Enter/blur | P2 | — | LIVE ✔ L2 N-1 |
| Copy style | Copies margins too, contrary to the Apply-to-all dialog's promise | — | Inconsistent interaction | Unexpected layout changes | One "style categories" contract shared by Copy and Apply-to-all | P3 | — | LIVE ✔ L2 N-2 |
| Inspector at 1280 px | Inspector floats over canvas, 56 px gap under topbar; below-fold sections | Designer requires ≥ 1268 px (W01) | Defect (IA-12) | Squeezed canvas | Fix the CSS specificity conflict; min canvas width | P1 | — | LIVE ✔ L1 #5, L2 1280×720 |

### C4. Responsive behaviour and styling (D)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Reusable class styling | Classes are labels; no class-rule authoring; suggestions empty (`getGlobalClasses` doesn't exist; tests mock it); `GlobalStyleManager` unused | Selector field, auto-class, combo classes, "affected elements" count, rename/duplicate/remove, style selectors panel with cleanup (W04, W17, W18) | Missing capability | Every element styled one by one | Class rules in the existing `StyleEngine` (it already stores selector × media × pseudo rules and exports them); selector field at the top of Style (§E4) | P1 (strategic) | BK-10 resolved-value model | LIVE ✔ L2 J3, §10-14 |
| Breakpoints | Desktop base, Tablet ≤1023, Mobile ≤767; "Wide 1920" previews but edits Desktop | Desktop base, ≤991, ≤767, ≤479; optional 1280/1440/1920 upward cascade (W19) | Partial | No small-phone or large-screen tuning | Add Mobile-portrait (≤479) first, then larger breakpoints; label "Wide" as preview-only now | P2 | BK-10 | CODE |
| Cascade display | Mobile shows base ⊕ mobile only; tablet layer invisible; "Reset to Desktop" reveals Tablet | Inherited values from larger breakpoints shown orange (W04, W19) | **Defect** | Users can't tell which value applies | Cascade `stylesAt` in breakpoint order; label the source layer; name reset targets by layer | P1 | — | LIVE ✔ L2 §10-4 |
| Override indicators | One Mobile override → 8 indicators | One coloured label per property + section dot (W04) | Inconsistent interaction | Noise | Field dot + one context line | P2 | — | LIVE ✔ L2 §10-5 |
| States | Base, :hover, :focus, :active, :disabled; canvas doesn't preview the state while editing | Hover, Pressed, Focused, Focused (keyboard), Disabled, Visited, Placeholder, Checked, Current, Current locale (W20). **Not documented:** `:focus-within`, pseudo-elements | Partial | Hover design is blind | Force the state on the selected canvas node while state ≠ Base; add focus-visible, visited, placeholder, checked | P2 | — | LIVE ✔ L2 §10-18 |
| Apply style to all (state) | Selector typo `data-buildrik-id` → silent no-op on any non-Base state | — | **Defect** | Silent failure | Fix selector; error toast when 0 written | P1 | — | LIVE ✔ L2 §10-7 (`stylePeers.ts:79`) |
| Copy/Paste/Reset style scope | Act on Desktop base only even on Mobile; Reset wipes all Desktop styles but keeps Mobile override | Opt-click clears per selector/breakpoint (W04) | **Defect** + Ownership ambiguity | Edits on Mobile change Desktop | Breakpoint- and state-aware like Apply-to-all; name the scope in the label | P1 | — | LIVE ✔ L2 §10-12 |
| Multi-select align | Moves locked elements; writes Desktop positions on Tablet | — | Defect (CI-01) | Locked/other-breakpoint changes | Lock gate + breakpoint-aware writes | P1 | — | LIVE ✔ L2 §10-13 |
| Tokens (variables) | 14 kinds, light/dark modes, aliases, usage, delete guard; bind colour/spacing/size/type; radius has no token picker | Variables: Color, Size, Percentage, Number, Font; collections; responsive and manual modes; bind almost every numeric property; pencil to edit in place (W05) | Partial | Radius/shadow/opacity/z-index unbindable | Token picker on radius, shadow, opacity, z-index, line-height | P2 | — | LIVE ~ L3 LC-11 (claim not reachable; observed: the Radius row has no token link) |
| Token usage truth | Type token "Used by 0" while changing it resizes the whole page; default Button/Link colours are literal blue, so "applies straight away" is false | Variable binding shown with a purple dot/highlight (W05); inherited-impact counts not documented | **Defect** + Ownership ambiguity | Users can't predict global effects | Count inherited impact; bind default component colours to `color-primary` | P1 | — | LIVE ✔ L3 NF-4, NF-5 |
| Workspace-pushed tokens | Indistinguishable from local; stale tab Overwrite regressed `dsSchemaVersion` 4→3; 10 restore points evict the push snapshot (rollback then fails) | Library variables are read-only on consumer sites (W25) | Ownership ambiguity + Defect | Push origin invisible; `dsSchemaVersion` regresses 4→3 on a stale Overwrite (tokens themselves were not reverted); push rollback lost after 10 restore points | Mark "from workspace" + lock state in Brand; separate prune pools; don't reuse the migration counter | P1 | — | LIVE ~ L3 LC-14 (no token revert); LIVE ✔ L3 LC-15 (restore points created via tRPC, not UI) |

### C5. Components and reuse (E)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Edit main component | No in-place editing; "Edit master" opens a detail screen; only "Update from selection" (accepts any element) | Double-click instance / right-click Edit component; green ribbon; Component Canvas (W06, W24) | Missing capability | Indirect and error-prone | In-context master editing on an instance with live propagation; restrict "Update from selection" to instances of the same master | P1 | — | LIVE ✔ L3 J1 |
| Delete an instance | Delete, Backspace, ⌘X, menu Delete all refused ("detach the instance") | Not documented in W06 (a main component is deletable only with zero instances) | **Defect** | Must detach to delete | Exempt the instance root from the filter | P1 | — | LIVE ✔ L3 LC-1 |
| Orphan instances after site duplicate | `sites.duplicate` doesn't copy components; instances of a master on another site can be neither deleted nor detached (no Component section) | — | **Defect** | Undeletable elements | Copy component rows on duplicate; offer Detach when master missing | P1 | — | LIVE ✔ L3 NF-1 |
| Instance responsive/state overrides | Not recorded; lost on update/reset; toast says 0 lost; Undo doesn't restore | Per-instance values only through props/variants; styles on main (W06) | **Defect** (data loss) | Silent loss | Record breakpoint/pseudo writes as overrides, or re-key rules on re-clone; count them in the warning | **P0** | — | LIVE ✔ L3 LC-3, C-10 |
| Duplicate instance | Copy not an instance until reload; edits before reload never overrides | — | Defect | Inconsistent behaviour across reload | Register clones in the instance map at clone time | P1 | — | LIVE ✔ L3 LC-5 |
| Component properties / slots | None; overrides are implicit position-path patches | Props: Text, Rich text, Image, Link, Video, Number, Visibility, Variant, Collection-list props; Slots (W21, W22) | Missing capability | Reuse at scale breaks on reorder | Declared props keyed by stable ids; then slots | P1 | in-place editing | CODE |
| Variants | Engine API only; select shows "Default" | One variant property, unlimited variants (W23) | Implemented but undiscoverable | Dead control | Hide the select until authoring ships, or ship authoring | P2 | — | LIVE ✔ L3 LC-13 |
| Library ("linked") | Per-site copies; master updates don't propagate; dashboard rename reverted by editor save; delete resurrects | Libraries share from a source site; consumers Review changes → Accept; library items read-only on consumers (W25; plan limits: Starter 0, Freelancer/Core/Growth 1, Agency/Enterprise unlimited; only admin/owner/Designer can accept updates) | Ownership ambiguity + Defect | Agencies believe updates propagate | Either a real versioned library with "update available", or rename to "copied from library" now | P1 | — | LIVE ✔ L3 LC-7, LC-8, LC-17 |
| Create from an instance | Toast "created" while element stays linked to old master | — | Defect | Misreport | Refuse or convert explicitly | P2 | — | LIVE ✔ L3 LC-6 |

### C6. Content, assets and data (F)

"Live page" results in this section come from the editor's own ZIP/HTML/React export served locally; forms were put through the real `wireForms()` and submitted to the real endpoint. The real Vercel deploy (L5) used the same renderer (CODE), but formatted text was not specifically sampled on the deploy.

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Rich text fidelity | Canvas/Preview mount HTML; export escapes it (`ExportEngine.renderContent` :1139-1150; `contentFormat` is never set by inline edit, toolbar or HTML import — only the AI-generate worker sets `"html"`) | Text and Rich Text publish as designed | **Defect** | Live site shows `<strong>`, `&amp;`, template `<br><span>` as text | One encoding: set `contentFormat:"html"` on inline commit/import, or sanitize instead of escaping | **P0** | — | LIVE ✔ L4 #1–3 |
| Text editing tools | Clear formatting does nothing; inline link field can't take focus and typing overwrites the selected text; dragging a block onto a heading makes its text uneditable | Not documented in the sources read | **Defect** | Text corrupted while editing | Fix toolbar focus and `removeFormat`; text-leaf guard on drag | P1 | — | LIVE ✔ L4 #5, #9, #10 |
| Rich Text element | None; Enter commits | Rich Text block with H1–H6, lists, quotes, images, CMS rich text | Missing capability | No long-form authoring | Rich-text element | P1 | BK-40 | CODE |
| Links | Link field shows the previous element's URL and writes it onto the new one; page links dead in Preview; button link exports `<a style=display:contents><button>` | Links are an Element-settings concern applying to all breakpoints (W03, W19); link types not detailed in the sources read | Defect | Wrong links shipped | Key the Link section by element; resolve page links in Preview; valid markup | P1 | BK-09 | LIVE ✔ L4 #7, #8, journey 1 |
| Interactive widgets | Tabs and Modal have no runtime in export; 0 scripts | Native Tabs, Lightbox, Dropdown, Navbar runtimes | **Defect** | Tab 2 / modal content unreachable | Add runtimes next to `lib/publish-widgets.ts`, or hide the rows | P1 | — | LIVE ✔ L4 #4 (export) |
| Upload durability | Failed registration discards the uploaded URL; save strips `blob:`; reload leaves image src-less; retry uploads 3× with duplicate rows; `blob:` src can ship in the ZIP | Replace updates the asset everywhere it is used (W07) | **Defect (data loss)** | Placed images vanish | Keep `uploaded.url`, retry only registration; `data-asset-id` link; refuse `blob:` at export | **P0** | — | LIVE ✔ L4 #11, #12 |
| Shared library | `listAssets` filters by uploader: a VIEWER and an EDITOR both see 0 assets while the owner sees 3 | Assets panel is per site (W07); Library assets shared from a source site (W25) | Ownership ambiguity | Teammates can't find or reuse site images | Site-scoped reads with role check | P1 | — | LIVE ✔ L4 #17 |
| Alt text model | Drag strips alt (null); library alt field drops characters (10 typed → `xdfj`); no decorative option; asset alt not shown on element | Asset alt Descriptive/Decorative; instance override (W40) | Defect + Missing + Ownership ambiguity | a11y loss, silent changes | Carry alt on drag; fix controlled textarea; Decorative toggle; "Use asset alt" vs custom | P1 | — | LIVE ✔ L4 #13, #20, N-3 |
| Media safety | Click-replace and Apply version change a locked image; folder delete with contents has no undo and leaves broken images; GIF becomes a single-frame WebP; drop at 50 % zoom lands at the wrong place; failed move shows success | Replace updates everywhere; delete requires removing usages first (W07) | Defect | Locked or placed images broken | Lock gate; grace + undo + usage check on folder delete; keep GIFs; scale drop coordinates; surface server refusals | P1 | BK-01 (zoom maths) | LIVE ✔ L4 #14–16, #19–20 |
| Responsive images | No srcset/sizes/width/height | Automatic responsive variants (W39) | Missing capability | Slow pages, layout shift | Variants at upload or publish | P1 | — | CODE |
| Forms: submission correctness | GET → 405 + PII in URL; multipart/plain → raw JSON error; radio/checkbox "on"; custom Action silently detaches the form; duplicate field names merged | Field settings, Success/Error states, destinations incl. custom action (W41–W42) | **Defect (data loss)** | Lost or unusable submissions | Value control; force POST/urlencoded or handle the encodings; warn on custom action; unique names | **P0** | — | LIVE ✔ L4 #22–24, #26 |
| Forms: editing | Select Options duplicates options; changing a select's type loses options; clearing the redirect never saves; viewers can export submitter IPs | Options editor; Starter caps (W42) | Defect | Wrong form markup; privacy leak | Edit `<option>` children; guard type changes; save on clear; restrict IP export | P1 | — | LIVE ✔ L4 #25–28 |
| CMS field types | UI offers 10; schema/server accept 16 | 16 types incl. multi-reference, multi-image, phone, option, file (W29) | Implemented but undiscoverable + Missing | No URL/email/option fields | Expose the 6; add multi-reference | P1 | — | CODE |
| Collection list | Limit only; order = last edited (editing the oldest record moved it first); canvas shows drafts; nested list substitutes the outer item; ZIP export writes only the first card | Dynamic vs Curated; filter, multi-level sort, limit + skip, pagination, empty state; ≤3 nesting levels (W31–W38) | Missing capability (engine supports filter/sort/offset) + Defect | Live lists reorder on every edit | Sort/filter/offset in binding + UI; drafts labelled; fix nested expansion and export | P1 | — | LIVE ✔ L4 #35–36, N-5 |
| Conditional visibility | Per-breakpoint only | Conditionals on CMS fields/props/variant/locale; hidden elements excluded from HTML (W37) | Missing capability | Empty fields can't be hidden | Field-driven visibility | P1 | Collection list | CODE |
| Record lifecycle | Undo of a draft delete restores under a new id (pins go blank); CSV stores strings (`false` shows Yes; lists fail publish); renaming a field key breaks SEO patterns; no bulk publish | Per-item, multi-item, scheduled publishing (Premium) (W75) | Missing + Defect | Broken bindings; 500 imports = 500 manual publishes | Undo by id; typed CSV; follow keys into SEO patterns; bulk publish | P1 | — | LIVE ✔ L4 #32–34 |
| Collection slug clash | A new collection whose slug clashes is rejected by the server and silently discarded, no message | — | **Defect** | User's collection disappears | Validate slug client-side; show the server reason | P1 | — | LIVE ✔ L4 #31 |
| CMS first run | Empty state scattered (4 link buttons left, create in header, hint right, 800 px centre empty); stepper shows step 1 done with an empty name | One clear start | Inconsistent interaction | First-run confusion | One centred CTA; honest stepper | P2 | — | LIVE ✔ L4 #29–30 |
| Paste HTML | Script runs in the editor origin; dialog claims the handler is removed | — | **Defect (security)** | Self-XSS via pasted content | Sanitize at `setContent` and before mount; dialog states what was removed | P1 | — | LIVE ✔ L4 #6 |
| Embed | "Embed" promises Spotify/Figma; no code embed element | Code Embed (50,000 chars, CMS fields) (W48) | Mislabelled + Missing | Expectations fail | Fix copy; sandboxed HTML embed | P2 | — | CODE |
| Ecommerce | No entry point ("cart", "Product Card" → Nothing matches) | Full ecommerce | PLANNED (owner call) | — | Keep hidden; remove or label dead paths | P3 | — | LIVE ✔ L4 #41 |

### C7. Interaction and workflow design (G)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Undo scope and gates | ⌘Z bypasses read-only and full-page guards; one global stack across pages; undo of delete selects the parent | Undo per user in real-time collaboration (W62); page delete not undoable (W12, W13) | **Defect** | Hidden destructive undo | Route ⌘Z through `CommandCenter` gates; navigate to the page being undone; reselect restored element | **P0** | — | LIVE ✔ L1 #9a, #16, N5; L6 N2 |
| Save status truth | ⌘S in an input clears dirty without saving; two saves per ⌘S elsewhere; "saved" while an edit is pending; conflict shown as connection error | Autosave + ⌘S (W01) | Defect | False reassurance | One ⌘S path; dirty only cleared by an acknowledged save; distinct conflict copy | P1 | — | LIVE ✔ L1 #15, #20, N6; L5 NF-7 |
| Recovery | "Restore my edits" ignores newer server state; Overwrite keeps no snapshot; session-row restore never saved | Backups: auto every 50th autosave, on restore, manual (W50); restore locks the site (W62); backups Site-manager only (W58) | **Defect** + Partial | Teammate work lost | Compare against server `lastEditedAt` before restore; snapshot before Overwrite; autosave after restore | **P0** (restore) / P1 | — | LIVE ✔ L1 #21, L5 #26, #28, #29 |
| Interactions preview | Inspector Preview never plays (invalid easing in CSS shorthand); canvas runtime never started; Preview overlay runs no scripts; export plays | Timeline with play/pause/reverse/loop/scrub (W28); Preview-mode playback not documented in the sources read | Defect + Missing | Can't see motion before publish | Fix easing mapping; run the published WAAPI runtime in an isolated preview | P1 | BK-09 isolated preview | LIVE ✔ L6 #1–5 |
| Interaction model | One preset per trigger; no timeline, scroll progress, targets UI | Trigger → target → action; timeline, presets, scopes, reduced-motion (W08, W27, W28) | Partial | Complex motion impossible | Target picker + reverse first; timeline later | P2 | — | CODE |
| Keyboard | Tab trap on footer Zoom; Escape in Layers clears selection and closes drawer in one press | — | Defect (WCAG 2.1.2) | Keyboard users stuck | Footer outside the canvas Tab handler; one Escape = one layer | P1 | — | LIVE ✔ L6 N3, L1 #22 |
| Find & replace / Audit panel | None; pre-publish checks cover readiness only | Audit panel (U): alt, link text, heading order, duplicate IDs, SEO meta (W63) | Missing capability | a11y/SEO issues reach production | Extend the Issues panel into an Audit panel with these checks | P2 | — | CODE |

### C8. Pages, site settings and publishing (H)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| New page flow | Default source is "From template"; EDITOR refused at the catalogue; starter card opens the whole catalogue | Create blank, from template, or via Quick find; Create arrow for draft (W12) | Inconsistent interaction | Slow creation; EDITOR dead end | Default to Blank; pass `previewId`; role-aware template door | P1 | BK-25 | LIVE ✔ L5 #1, #2 |
| Rename + URL | Rename stuck after duplicate-name error (Esc only) | Slug in page settings | Defect | Stuck input | Reset commit flag on rejection | P1 | — | LIVE ✔ L5 #4 |
| Redirects / URLs | Suggested and saved 301 `/about → /our-journey` 404s live; old `/about.html` 404; no clean URLs; sitemap/robots use the untruncated project host (`…-d013128c-copy-11.vercel.app`), which 404s, while Vercel's real alias is truncated (`…-d01312.vercel.app`) | 301 redirects with wildcards, oldest-first; needs a paid Site or Workspace plan (W49); clean URLs not documented | **Defect** (SEO) | Broken links on every rename | Ship `cleanUrls` (or `.html` paths consistently); auto-redirect on Update URL; use the real deployment alias | P1 | — | LIVE ✔ L5 #5, NF-2, NF-3 (real deploy) |
| Hidden home page | Root silently handed to another page | Homepage can't be deleted (W12) | Defect | Wrong home page live | Refuse hiding the home page, or require choosing a new home | P2 | — | LIVE ✔ L5 #8 |
| Head code | Valid `<meta>` rejected as unclosed; site head code silently wins over page | Page and site head/body code (W47); needs a Core/Growth/Agency/Freelancer Workspace or a Site plan; Custom-code section Site manager/Designer only (W58) | Defect + Ownership ambiguity | Can't add common tags | Fix validator; document/emit page after site | P2 | — | LIVE ✔ L5 #7 (meta rejected); site-over-page precedence CODE (`SEOInjector.ts:231-235`) |
| Site settings save | No "Saving…", no conflict detection (last writer wins), premature red validation, "Save and continue" drops invalid values, offline Discard sticks | Settings save explicitly | Missing state + Defect | Silent overwrites between admins | Version token; Saving state; validation-aware guard | P2 | — | LIVE ✔ L5 #11–13 |
| Pre-publish enforcement | Server doesn't run checks; "Publish now" enabled while checks load; failure-toast retry skips gates; issue counts disagree (6 errors / 7 issues / 7 warnings) | Publish dialog with selected domains (W10); Audit before publish (W63) | **Defect** | Blockers can ship | Enforce checks server-side; disable until loaded; one gate for every publish door; one issue count; failed server checks must not render as "no issues" | P1 | — | LIVE ✔ L5 #18, #19, NF-4 (client); CODE D-P1, D-P9 (server, retry path) |
| Staging | "Preview deployment" row always "None" | `*.webflow.io` staging + custom domains; publish to selected domains (W10) | Missing capability (UI implies it exists) | Can't validate before prod | Hide the row or build a staging target on Vercel preview deployments | P3 (P1 while the "Preview deployment" row stays visible) | — | CODE (`usePublishSnapshot.ts:183`) |
| Publish selected pages | All live pages ship | Single-page publish on Team/Enterprise only (W53) | Intentional difference (for now) | — | Keep; revisit for agency tier | P3 | — | CODE |
| Publish state UI | Topbar CTA says "Publish anyway" while a deploy runs; "Step N of M" never renders; reload after publish shows "Not live yet"; unpublish has no confirmation toast | One publish at a time; UI shows who is publishing (W53) | Defect + Missing state | Users re-click publish | Topbar tracks the job; fix step status key; success toast for unpublish | P1 | — | LIVE ✔ L5 #21, NF-5, NF-9 |
| Version compare | "Matches" after page rename, layer rename, section reorder, site SEO change | Webflow documents no visual diff | Defect (differentiator made untruthful) | Wrong restore decisions | Compare page metadata, order, styles and settings, or scope the label | P1 | — | LIVE ✔ L5 #25 |
| Versions across devices | Deleted version still listed on another device | Backups and restore (W50); storage location not documented | Defect | Confusion | Server-authoritative list | P2 | — | LIVE ✔ L5 #30 |

### C9. Collaboration and permissions (I)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Site-scope authz | Cross-site review revoke; library/theme reads ignore site grants; capped ADMIN approves | Site roles scoped per site (W58) | **Defect (security)** | Out-of-scope access and actions | Bind every review/library/theme call to the target site and its effective role | **P0** | — | LIVE ✔ L6 #11–12, L3 LC-18 |
| Content-only role | EDITOR = DESIGNER rank; no content-only mode | Content editor and Marketer roles; editing permissions per element; Preview as role (W58–W61) | Missing capability | Clients can't safely edit content | Add a Content editor capability set (text, images, CMS, no styles/structure) | P2 | §D ownership model | CODE |
| Role-aware UI | Viewer sees Add/Pages/CMS/Brand as enabled then toast; Unpublish and Share preview offered to roles the server refuses; permission copy contradicts enforcement (4 cases) | Tools shown depend on role (W01) | Inconsistent interaction | Trust | Hide or disable-with-reason from one role table | P1 | — | LIVE ✔ L6 #14–15, N6; L5 #17, #20 |
| Comments | Every internal comment credited to "You"; viewers blocked in UI but allowed by server; comments hidden without the agency layer (CODE; L6 ran with the layer on); flat replies | Everyone can comment; threads, @mentions, resolve, filters (W15) | Defect + Partial | Unattributed discussion | Show author; one comment policy; comments without agency layer | P1 | — | LIVE ✔ L6 N4, #9–10 |
| Approvals | Internal approval shown as "Approved by the client" | Design approvals (Enterprise) (W52) | Defect (copy) | Misleading audit trail | Name the approver and type | P2 | BK-08 | LIVE ✔ L6 N5 |
| Real-time collaboration | Flag off; LWW; locks unwired | Up to 25 users, last write wins, presence, no cursors (W62) | PLANNED | — | Keep flag off; wire locks first | P3 | — | LIVE ✔ (flag off) L6 #20 |

### C10. Design-system quality and accessibility (J)

| Module/flow | Buildrick evidence | Webflow reference | Classification | User impact | Recommended change | P | Dep. | Verification |
|---|---|---|---|---|---|---|---|---|
| Disabled reasons | History "Clear undo history" reason only in `title`, skipped by arrows; aria-disabled controls have no `aria-describedby` | — | Missing state (a11y) | SR users never hear why | One `DisabledReason` pattern with `aria-describedby` | P2 | — | LIVE ✔ L6 #16 |
| Focus visibility | Global 2 px accent ring works; Assets search shows no focus outline | — | Partial | — | Audit inputs with `outline:none` | P3 | — | LIVE ✔ L6 #18 (ring OK), N14 |
| Dialog semantics | Modals trap/return focus correctly (Chromium); Preview overlay is a region without focus management | — | Partial | — | Preview overlay as a dialog | P2 | BK-09 | LIVE ✔ L6 #17, N8 |
| Primary actions | Two measured Upload treatments (L4 #21; a third, the drawer, in CODE); three measured Back-to-canvas placements (L1 J3) | — | Inconsistent interaction | Learnability | One primary-action and one exit component | P3 | — | CODE + LIVE ✔ L1 J3 |
| Inline styles / relative imports in chrome | `InteractionEditor` inline style objects; `../../` imports in AI/interactions/settings | Repo rule (CLAUDE.md) | Code quality | Drift | Clean up while touching | P3 | — | CODE |

---

## D. Ownership map

### D1. Recommended ownership model (grounded in the existing product)

Seven rules. Each keeps an existing Buildrick structure and removes ambiguity.

1. **Style tab owns CSS, scoped by selector × breakpoint × state.** Today the selector is always the element. When classes ship (BK-30), the selector field chooses element or class; breakpoint and state come from the canvas bar and state chip. Every value shows its origin (default / class / base / tablet / mobile / state / token / inherited). Reset names its layer ("Clear Mobile value", "Clear :hover on Mobile").
2. **Settings tab (rename "Behaviour") owns everything that is not CSS and applies to all breakpoints:** content (text, src, alt, link, button type, input name/value/required), CMS binding, form settings, attributes, interactions entry, component props. Webflow's scope rule (W19) is the right one: settings and content are breakpoint-free.
3. **Visibility is a style, not a setting.** Per-breakpoint hide should write `display:none` through the normal breakpoint cascade (so Tablet hide cascades to Mobile like every other style), shown in Style › Layout. The Layers eye stays canvas-only and is labelled so.
4. **Component master owns structure and styles; instances own declared props and recorded overrides only.** Breakpoint and state edits on an instance must be recorded as overrides (or refused with a reason), and every update reports exactly what was dropped.
5. **Site owns tokens; workspace pushes are visibly "from workspace"** and either locked or warned on edit. A library item is read-only on consumer sites, as in Webflow (W25), or labelled a copy.
6. **Page overrides site for SEO/social/head; the export emits page after site** so the page wins conflicts, and each page field shows "inherits site default" when empty.
7. **Draft vs published is shown per surface:** CMS "Published" records show "live after next site publish"; form settings that apply at submit vs at next publish are labelled; Brand copy says "applies to the draft now, live at next publish".

### D2. Ownership table

| Property / action | Current editing location(s) | Recommended canonical location | Value owner | Scope | Inheritance / override / reset | Permission boundary | Save / publish boundary |
|---|---|---|---|---|---|---|---|
| Font size, line height, colour, align | Style › Typography; Type block › Text style (binds font-size); Apply-to-all; Paste style | Style › Typography only; Text style becomes a token/class picker inside it | Element styles (desktop) / StyleEngine rule (bp, state) | element × bp × state | Should show inherited/class/token origin. Today: defaults shown, tablet layer hidden, "Reset to Desktop" lands on Tablet (BK-10) | Lock gate; EDITOR+ on save | Applied immediately → autosave → live at publish |
| Width/height (canvas handles + Size) | Canvas resize, Style › Size | Both, same value | Element styles at active bp | element × bp | Today both axes written; zoom-corrupt (BK-01) | Lock gate | same |
| Position / display / z-index | Style › Layout (containers only) | Style › Layout for all types | Element styles | element × bp | — | Lock gate | same |
| Per-breakpoint hide | Behaviour › Visibility (`--hide-*`, non-cascading) | Style › Layout › Display (cascading) | Element styles | element × bp | Today Tablet hide does not cascade to Mobile; Preview ignores it (BK-09) | Lock gate | same |
| `:state` styles | State chip + any field | same, with canvas forced-state preview | StyleEngine rule | element × bp × state | Lost on duplicate (BK-06); not shown on canvas (BK-34) | Lock gate | same |
| Classes | Behaviour › CSS classes (names only) | Style › Selector field | Class rule (future) / element class list | site (rule) / element (assignment) | Remove from element ≠ delete rule; "affects N" (BK-30) | Create/modify: designer-level roles | same |
| Copy / paste / reset style | ⋯ menu, ⌘⌥C/V | same; breakpoint- and state-aware | Element styles | element | Today Desktop-only (BK-12) | Lock gate | same |
| Text content | Canvas inline edit, toolbar, CMS binding | Canvas; Settings shows bound source | `ElementData.content` | element (instance override inside components) | Applied ≠ published today (BK-40) | Lock gate | Live at publish |
| Link | Settings (Behaviour) › Link; toolbar inline link (URL only, always new tab) | Settings › Link; toolbar uses the same model | `href`, `target`, `rel` | element | — | Lock gate | Live at publish |
| Image src / alt | Style › type block (src, alt), Assets drawer, library, drag, AI | Settings › Image: src + "Use asset alt / Custom / Decorative" | Element attrs; asset alt as default | element (asset alt is site/per-user today) | Asset alt follows non-overridden placements; `""` treated as not overridden (BK-50) | Lock gate; media write EDITOR+ | Placements autosave; asset metadata best-effort (WS-01) |
| Media library visibility | Assets drawer / library | same | `MediaAsset` rows | **should be site**, is user today (BK-43) | — | EDITOR+ write, members read | Immediate |
| Form field name / value / required | Style › type block, Behaviour › Fields, Attributes | Settings › Form field | Element attributes | element | No value control today (BK-44) | Lock gate | Live at publish; required never server-enforced |
| Form after-submit, recipients, spam | Behaviour › After submit (server row) | Settings › Form, with "applies now" vs "at next publish" labels | `FormBlock` row | site + element id | Outside undo | EDITOR; recipients ADMIN (not pre-gated in UI) | Redirect/recipient at submit immediately; message/spam at next publish |
| CMS binding | Settings › CMS binding | same | `cmsBindings` in project | element | Unbind keeps current text; writes outside undo | `canWrite` + EDITOR | Canvas shows first published; export pins or newest published |
| Collection list source/limit (+ sort/filter/offset) | Settings › Collection (limit only) | same, full query | `cmsBindings.collection` | element | Canvas shows drafts, publish shows published (BK-46) | `canWrite` | Live at next site publish |
| Token values | Brand (table, detail, modes, starters, import, AI) | Brand | `projectSettings.designTokens` | site | Workspace push copies over; no source shown (BK-36) | Brand: EDITOR+ (viewers hidden); push ADMIN + agency | Applied to draft now; live at publish (copy says "straight away") |
| Token binding on element | Inspector pickers; Connect to tokens; unlink | same; add radius/shadow/opacity/z-index | Element style `var()` | element | Unlink writes the painted value | Lock gate | same as element style |
| Master structure/styles | Components › "Update from selection" | In-context master edit on an instance | `ComponentDefinition.masterTree` | site (or page) | Re-clones instances with new ids; drops responsive/state edits (BK-07) | EDITOR (server); no lock gate in detail screen | Master: IndexedDB + server mirror immediately; pages via autosave |
| Instance override | Any field inside an instance | Settings › Props (when props ship) + style dot | Instance root `overrides` | instance | Reset to master per property (style only) | Lock gate | Page autosave |
| Library component | Add › From library; dashboard rename/delete | Libraries with version + "update available", or "copy" label | One `SiteComponent` row per site | workspace display / site data | No propagation today (BK-18) | Insert EDITOR; rename/delete ADMIN | Server rows only |
| Page name / slug / redirects | Pages row rename, page settings, Settings › Redirects | Pages + page settings; auto-redirect on Update URL | `pages[]` + `Redirect` rows | page / site | No automatic 301; generated paths 404 live (BK-20) | EDITOR | Name/slug at publish; redirects saved now, live at publish |
| Page vs site SEO / head code | Page settings; Settings › SEO, Custom code | same, with inheritance hints | `pages[].settings` / `Site.*` | page overrides site | Site head code currently wins conflicts | Page EDITOR; site ADMIN (+Pro for code) | Publish |
| Home page / page visibility | Pages context menu; page settings | same; refuse hiding home | `pages[].isHomePage` / `settings.visibility` | site effect | Hidden home silently reassigned (BK-66) | EDITOR | Publish |
| Archive / unarchive | Settings › Overview (ungated), Danger zone (OWNER), dashboard (ADMIN) | One rule (ADMIN) everywhere | `Site.archivedAt` | site | — | **Three competing rules today** | Immediate |
| Publish / unpublish / cancel / share preview | Topbar, Publish panel, AI, failure toast, Preview | Topbar + Publish panel only, one gate | `PublishBuildJob`, `Site.status` | site | — | EDITOR publish; ADMIN unpublish/cancel/rollback/stale override (UI offers some to lower roles) | Live after worker completes |
| Approval | Review tab, dashboard queue, client page | same | `ReviewRequest` | site | Capped ADMIN can approve (BK-08) | Should be effective site role | Gate checked at publish |
| Element lock | Layers, menu, ⋯ | same | `ElementData.locked` | element (no cascade) | Some write paths ignore it (BK-13) | Any editor | Saved; no publish effect |
| Undo history | ⌘Z, footer, toasts, History tab | same, with read-only + full-page gates | `HistoryManager` (global across pages) | project | ⌘Z bypasses gates (BK-05) | Should respect read-only | Undo results autosave |
| Named versions / restore | History › Saves | same; server-authoritative list | IndexedDB + `SiteVersion` | site | Restore replaces settings too | Create/rename/delete EDITOR | Restore persists via autosave |

### D3. Competing surfaces, silent global effects and misleading editability (consolidated)

| Type | Item | Evidence |
|---|---|---|
| Competing surfaces | Font size in Typography and Text style (two dots for one override) | LIVE ✔ L2 §10-5 |
| Competing surfaces | Group in canvas menu, inspector bar and Layers with three rules | LIVE ✔ L1 #14 |
| Competing surfaces | Site name in dashboard and Settings; archive in three places with three rules | LIVE ✔ L5 #14 |
| Competing surfaces | Form field label vs placeholder vs `<label>` | CODE |
| Unclear precedence | Site head code beats page head code (comment claims the opposite) | CODE `SEOInjector.ts:231-235` |
| Silent global effect | Type token change restyles the page while showing "Used by 0" | LIVE ✔ L3 NF-4 |
| Silent global effect | Workspace token push replaces site tokens with no editor indication | LIVE ✔ L3 LC-14 |
| Silent global effect | ⌘Z behind full-page tools | LIVE ✔ L1 #9a, L6 N2 |
| Silent global effect | Hidden home page reassigns the site root | LIVE ✔ L5 #8 |
| Misleading editability | Variant select (only "Default"), "Component styles" rows (navigation only), style presets (read-only), AI "Generate" with no apply | LIVE ✔ L3 LC-13; CODE |
| Misleading editability | Permissions modal "Apply a template: Allowed" for EDITOR, then refused | LIVE ✔ L6 #14 |
| Misleading editability | "Linked from library" | LIVE ✔ L3 LC-8 |
| Ambiguous reset | "Reset to Desktop" lands on Tablet; "Reset style" clears Desktop base only; instance "Reset to master" vs field dot | LIVE ✔ L2 §10-4, §10-12; L3 LC-4 |

---

## E. Screen-by-screen correction specification

Visual direction stays Buildrick's (DESIGN.md: Inter, one accent `#1A56DB`, 4 px spacing, compact density, chrome-ui + flowbite + `tw:` + `--bk-*`). Every new control is a chrome-ui component; no raw `<button>/<input>`.

### E1. Shell topbar

- **Save pill:** states Unsaved · Saving · Saved · Offline · Conflict · Error, with Conflict distinct from network error (BK-11). The dirty state clears only when a save is acknowledged.
- **Publish CTA:** reflects an in-flight job ("Publishing… 40 %", disabled), the live state after reload, and the role (hidden or disabled-with-reason). Unpublish success shows a toast.
- **No change** to placement of Exit, crumbs, Preview, Notifications, Site menu.
- **Components:** `SaveStatus` (extend variants), `Topbar` CTA states.

### E2. Left rail and drawers

- Add **Components**, **History** and **Publish** to the rail (Webflow lists every panel with a letter, W01). Show the letter in each tooltip ("Layers · L").
- Viewer rail shows only allowed tools; disallowed ones are hidden, not toast-after-click (BK-39).
- **Components:** `Rail` item variant with shortcut hint.

### E3. Canvas bar (replaces the footer's "View · N")

- Left: Undo / Redo.
- Centre: **breakpoint switcher** always visible (Desktop · Tablet · Mobile, later Mobile portrait and large), with the active **width label** ("1024 px"), and the **canvas breadcrumb** of the selection (click any crumb to select it).
- Right: zoom menu (Fit width as default at 1440×900 so the Desktop frame fits, BK-14), View menu (overlays), and the state chip mirror when a state is active.
- The footer keeps no Tab handler that traps focus (BK-28).
- **Components:** `BreakpointSwitcher` (exists in Preview; reuse), new `CanvasBreadcrumb`, `ZoomMenu`.

### E4. Inspector header and Style tab

- **Header:** element icon + name + ⋯ (unchanged). Below it, the **selector row**: one chip per class on the element plus "This element" (default), "+ class". Hover a chip → Rename / Duplicate / Remove from element. Under the row, **"Affects N elements"** (click to outline them). Until class rules ship (BK-30), the row shows only "This element" and the class chips as read-only labels with a tooltip "Class styling coming", instead of the current Behaviour › CSS classes field.
- **Context row:** breakpoint (mirrors canvas bar) and state chip. One line "Editing Mobile · 1 value set here" replaces the four current indicators (BK-33).
- **Field origin:** every field label is coloured by origin (set here / inherited from Tablet / from class / from token / inherited from parent). Clicking the label opens a popover "Value 40px · from Tablet · Clear Mobile value". This replaces the type-default display (BK-10).
- **Sections for every element type:** Layout (display, flex/grid, position, offsets, z-index, overflow), Size, Spacing, Typography, Fill, Border, Effects. Hide only what is impossible for the tag, not by element family (BK-29).
- **Effects:** parse-preserving filter and transform editors (BK-27); transform origin; backdrop filter.
- **Numeric fields:** accept `calc()/clamp()/min()/max()`; offsets use the same unit parser.
- **Colour popover:** Enter/blur commits the hex.
- **Components:** extend `InputWithUnit`, `OverrideDot` → `OriginLabel`, new `SelectorField`, `AffectsCount`.

### E5. Settings tab (renamed from Behaviour)

- Order: **Element** (tag/level, ID, button type), **Content** (src, alt with Use asset alt / Custom / Decorative, link, form field name/value/required/placeholder), **CMS** (binding, collection list source + filter + sort + limit + skip + empty state), **Form** (destinations, success/error states, spam, recipients with "applies now" labels), **Component props** (when on an instance), **Interactions**, **Attributes**.
- Moves alt/src/input settings out of the Style tab's type block (BK-38).
- **Components:** reuse section registry; new `CollectionQueryEditor`, `AltTextMode`.

### E6. Layers

- Rename the eye to "Hide on canvas" with its existing tooltip; add "Hide on this breakpoint" in the row menu (writes Display: none).
- Context menu: arrow-key navigation, clamped to viewport, disabled reasons visible (BK-28).
- Undo of a delete reselects the restored element.

### E7. Pages panel and New page

- New page modal defaults to **Blank**; "From template" second. EDITOR sees templates as disabled-with-reason (or allowed if the server rule is EDITOR, which it is today: decide one rule, BK-24).
- Rename: rejection resets the commit state (BK-25).
- "Update URL" creates the 301 automatically with Undo, using the deploy's URL form.
- Home page row: "Hide" disabled with reason "Choose another home page first".
- ⌘D / ⌫ on a focused row act on the page; arrow keys move focus in the tree.
- **Components:** `NewPageModal`, `PageRow`, `RenameUrlDecision`.

### E8. Templates

- Starter cards open that template's preview (pass `previewId`).
- Template apply: create the page only after import succeeds; one feedback surface (no stacked progress + achievement + toasts).

### E9. Components panel and master editing

- Instance: "Edit component" enters in-context editing with a ribbon "Editing ‹name› · N instances · Done"; Esc exits.
- Detail screen: Update from selection accepts only instances of this master; Detach all and Delete gated like the inspector row; "Linked from library" renamed "Copied from library" until a real library exists.
- Variant select hidden until variant authoring ships.
- Toasts after update list overrides dropped by breakpoint/state.

### E10. Brand

- Show "From workspace" + lock badge on pushed tokens; edits warn.
- Usage counts include inherited impact ("Affects ~24 elements on 3 pages").
- Default Button/Link colours bound to `color-primary`.
- Rename dialog validates the id pattern inline.
- Brand host joins the shared full-page host (focus, inert, `data-bk-surface`).

### E11. Assets and media

- One library per site (BK-43); upload states per tile (uploading / local-only + Retry / failed); folder delete with grace and Undo; alt mode per placement.
- One Upload primary style; Back control matches other full-page tools.

### E12. CMS workspace

- Empty state: one centred "Create your first collection" with records-first copy; stepper reflects real steps.
- Add-field dialog lists all 16 schema types; multi-reference added.
- Records: bulk publish; typed CSV import; undo restores the same id.
- Collection list (in Settings tab, E5) gets the full query editor and an empty state.

### E13. Publish panel and confirm

- One gate for every publish door (topbar, panel, failure retry, AI): checks loaded and passed (server-enforced), confirm, then job tracking.
- "Publish now" disabled while checks load; one issue count across gate, panel and confirm.
- Hide "Preview deployment" until staging exists.
- Steps render ("Step 2 of 4 · Deploying").

### E14. History

- Session restore autosaves; Time-travel blocks ⌘Z.
- Compare covers page name/slug/settings, element order, layer names, styles and site settings; otherwise the label says "Compares element content only".
- "Overwrite" in the conflict dialog first saves a server snapshot version.
- "Restore my edits" compares against server `lastEditedAt` and offers "Review differences" when the server is newer.

### E15. Site Settings

- Footer: Saving state; conflict message when another admin saved first; Save disabled with the reason.
- Untouched invalid stored values show a neutral notice, not red errors.
- One archive rule.

### E16. Preview overlay

- Opens at the canvas breakpoint and page; renders through the **publish CSS path** (class base + responsive + hide + site CSS + head code); interactive mode on an isolated origin for scripts (keep the current sandbox for the static mode); page links work; a dialog with focus management.

### E17. Review and comments

- Comments show the author; replies thread; viewers may comment if the server allows (decide one policy); comments available without the agency layer.
- Approval text names who approved and whether it was a client.

### E18. Permissions modal and role notices

- Generated from the same role table the server uses; "Workspace role" vs "Role on this site" shown separately when capped.

### E19. AI panel

- Move prompt context out of the GET query (POST or chunked subscription) so requests stay under header limits; distinguish "request too large" from "service down".

### Reusable components and variants to add or extend

| Component | Variants / states | Used by |
|---|---|---|
| `FullPageHost` (new primitive) | open/closing; focus-in; inert siblings; return focus; `data-bk-surface` | Settings, Brand, Templates, Assets, CMS |
| `OriginLabel` (replaces `OverrideDot`) | set-here / inherited-breakpoint / class / token / parent / default; popover with Clear | Every Style field |
| `SelectorField` + `AffectsCount` | element-only / with classes / combo / read-only | Inspector header |
| `BreakpointSwitcher` (reuse from Preview) | 3 → 4 → 7 breakpoints; width label | Canvas bar, Preview |
| `CanvasBreadcrumb` | overflow collapse | Canvas bar |
| `DisabledReason` | tooltip + `aria-describedby` | Menus, History, Review, Publish, rail |
| `SaveStatus` | + Conflict, + Saving acknowledged | Topbar |
| `CollectionQueryEditor` | filter rows, sort levels, limit, skip | Settings tab |
| `AltTextMode` | asset / custom / decorative | Image settings |
| `PublishGate` (single hook + modal) | loading / blocked / ready / submitting | Topbar, panel, failure toast, AI |

---

## F. Prioritized implementation backlog

Columns: **ID** · **Issue** · **Files / screens** · **Fix** · **Dep.** · **Owner** (Eng / Design / Both) · **Acceptance criteria (testable)** · **P** · **Verification**.

> Acceptance criteria are written to be checked in the running app with measurements, per CLAUDE.md ("Live app is the verifier"; "Measure, don't eyeball").

### P0

| ID | Issue | Files / screens | Fix | Dep. | Owner | Acceptance criteria | Verification |
|---|---|---|---|---|---|---|---|
| BK-01 | Resize at zoom ≠ 100 % corrupts size; no-movement click rewrites both axes | `engine/canvas/canvasGeometry.ts:53-66`, `engine/canvas/resize/ResizeOrchestrator.ts:44-45`, `resize/DOMUpdater.ts:117-118` | Convert bounds and deltas by canvas scale; write only the dragged axis; skip write on zero delta | — | Eng | At 25/50/100/150 % zoom: press-release with no movement leaves `getStyles()` unchanged; +20 screen px at 50 % stores original + 40 CSS px on the dragged axis only; height untouched for an E-handle drag; marquee rectangle and handles track the pointer at 50 % (L1 #19) | LIVE ✔ L1 #6 |
| BK-02 | Keyboard resize stores `NaNpx` | `canvas/overlays/SelectionHandles.tsx:107,135,157,184,206`, resize code | Finite-value guard; arrow-key resize on focused handle; Enter/Escape finish | — | Eng | Tab to a handle, arrows change width by 1 px (⇧ 10 px); no style value matches `/NaN/` after any keyboard sequence; reload keeps a finite px | LIVE ✔ L1 #7 |
| BK-03 | Escape-cancel undoes previous unrelated edit and autosaves | `engine/canvas/ResizeHandler.ts:264-268,444` | Restore start bounds inside the gesture transaction; never call `history.undo()`; same on unmount | — | Eng | Change text-align, wait 1 s, start resize, Escape: text-align unchanged, history length unchanged, no `saveProject` for the cancel | LIVE ✔ L1 #8 |
| BK-04 | "Restore my edits" overwrites newer server work, deleting teammate pages | `editor/shell/hooks/useComposerInit.ts:326-377`, `services/unsavedRecovery.ts` | Compare unsaved snapshot time with server `lastEditedAt`; if server newer, show a conflict choice (review / keep server / overwrite after backup) | — | Both | Two-browser test: B's page added after A's offline edit survives A's "Restore my edits" unless A explicitly chooses overwrite, and then a server snapshot version exists | LIVE ✔ L1 #21, L5 #29 |
| BK-05 | ⌘Z/⇧⌘Z bypass read-only, time-travel and full-page guards | `editor/shell/hooks/useEditorShortcuts.ts:183-194`, `FullPageRouter.tsx:186-197` (Brand lacks `data-bk-surface`) | Route undo/redo through `CommandCenter.run` gates; add `data-bk-surface="fullpage"` to Brand; full-page host stands down canvas keys | — | Eng | In Settings, Brand, Templates, Assets and time-travel, ⌘Z with focus on a non-input changes nothing on the canvas and sends no `saveProject` | LIVE ✔ L1 #9a, #16; L6 N2; L5 #32 |
| BK-06 | Duplicate/paste/page-duplicate drop breakpoint and `:state` rules | `engine/elements/ElementManager.ts:365-372`, `engine/elements/manager/ElementCRUD.ts:227-290`, `PageManager.duplicatePage` | Copy StyleEngine rules keyed to the old id onto the new id (all media, all pseudo) in the same transaction | — | Eng | Element with Tablet 40 / Mobile 32 / :hover red → ⌘D → clone computes 40/32 at Tablet/Mobile and red on hover on canvas, export and after reload | LIVE ✔ L2 §10-9 |
| BK-07 | Master update/reset drops instance breakpoint and `:hover` edits; toast says 0 lost; Undo doesn't restore | `engine/components/ComponentInstances.ts:43-56,313-375`, `StyleEngine.setBreakpointStyle`, `ComponentDetailScreen.tsx:194-211` | Record breakpoint/state writes on instances as overrides (or re-key rules on re-clone); include them in `overridesDropped`; Undo restores instance overrides from the snapshot | — | Eng | Instance heading Mobile 14 px + :hover 40 px → update master → both persist (or toast lists them) → toast Undo restores them | LIVE ✔ L3 LC-3, C-10 |
| BK-08 | Authorization: cross-site review revoke; library/theme reads ignore site grants; capped ADMIN approves | `server/trpc/routers/reviews.ts:180-191,263-289`, `server/services/review.service.ts:461-483,527-552`, `server/trpc/routers/site-component.ts:91-103`, `site-component.service.ts`, `server/trpc/routers/theme.ts` (`targets`, `getShared`, `snapshots`) | Bind review ops to the review's own site and check the effective site role; apply `siteScopeWhere` to library/theme reads | — | Eng | Site-scoped EDITOR on A gets 403 revoking a B review; site-scoped member's `library`/`libraryGet`/`theme.targets` return only granted sites; ADMIN capped to VIEWER gets 403 on `reviews.resolve` | LIVE ✔ L6 #11, #12; L3 LC-18 |
| BK-40 | Formatted text, `&` and template markup export/publish as escaped visible text | `engine/export/ExportEngine.ts:1139-1150` (`renderContent`), `canvas/hooks/useCanvasInlineEdit.ts:164`, `engine/elements/manager/HTMLParser.ts:249-250` | Store a content format: set `contentFormat:"html"` on inline commit, toolbar commands and HTML import; export sanitizes (DOMPurify) instead of escaping for HTML content | — | Eng | Heading `Q&A`, a bolded word and the SaaS hero render identically on canvas, Preview, export and the live deploy (`<strong>` element present; no literal `&amp;`) | LIVE ✔ L4 #1–3 |
| BK-42 | Image loses its `src` after a failed asset registration; retry re-uploads 3× and duplicates rows; `blob:` can ship | `services/AssetUploadService.ts:153-185`, `services/BuildrikSyncProvider.ts:835-840`, `engine/media/MediaManager.ts:733-735,946-971`, `Composer.ts:561-568` | Keep the uploaded URL and retry only `createAsset` (idempotent); link elements by `data-asset-id`; export refuses `blob:` | — | Eng | With `createAsset` blocked once: image keeps a remote src after reload; one Blob, one asset row; export has no `blob:` | LIVE ✔ L4 #11, #12 |
| BK-44 | Form submissions broken or lossy: GET (405 + PII in URL), multipart/plain (raw JSON error), radio/checkbox `"on"` by default (value only via an inner-input field labelled "Default"), duplicate names merged, custom Action silently detaches | `lib/publish-forms.ts:120-159`, `packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts:36-38,80-84`, `blocks/Forms/Radio.tsx:19`, `typeBlock/bodies/formBodies.tsx:106-143`, `FormFieldsSection.tsx:135` | Force POST + urlencoded when wiring (or accept multipart); a labelled Value control on each radio/checkbox block, and a unique default value per option; unique names on add; warn when Action is set | — | Both | Published form with GET/multipart selected still submits via POST and lands in the inbox; a 3-option radio stores the chosen value; two added fields get distinct names | LIVE ✔ L4 #22–24, #26 |

### P1

| ID | Issue | Files / screens | Fix | Dep. | Owner | Acceptance criteria | Verification |
|---|---|---|---|---|---|---|---|
| BK-09 | Preview renders a different cascade (breakpoint overrides of inline props, `:hover`, hide, site CSS, head code, scripts) and opens on Desktop | `engine/Composer.ts:930-1003`, `shared/utils/html/generation.ts:111-118`, `StyleEngine.ts:471-553`, `editor/shell/PreviewOverlay.tsx:119,209-211`, `AquibraStudio.tsx:861-876` | Build Preview from the publish export (class base + responsive + hide + site CSS + head code); pass canvas device/page; scripted mode on an isolated origin | BK-61 for scripts | Eng | For the same page: H1 at 375 px computes equal in canvas, Preview and export; hover colour equal; hidden-on-Mobile element `display:none` in Preview; site CSS outline present; Preview opens at the canvas device | LIVE ✔ L2 §10-1, §10-8, §10-10; L5 #15–16; L6 #4 |
| BK-10 | Inspector displays defaults/partial cascade instead of the rendered value; "Reset to Desktop" lands on Tablet | `editor/inspector/hooks/useStyleHandlers.ts:64-80,168-191`, `engine/commands/commandOperations.ts:251-259`, `cssContext.ts:53-70`, `OverrideDot.tsx` | Resolved-value model with origin per field; cascade breakpoints in order; reset labels name the layer | — | Both | H1 on Mobile: line-height field = computed/font-size ratio (1.5) labelled "inherited"; align shows Center labelled inherited; with Tablet 40 the Mobile field shows 40 "from Tablet"; the reset menu says "Clear Mobile value → 40 px" | LIVE ✔ L2 §10-2..5 |
| BK-11 | Save truth: ⌘S in input clears dirty without saving; double save; "saved" while pending; conflict shown as network error | `engine/commands/defaultCommands.ts:80-85`, `Composer.saveProject`, `useSaveCallback.ts:214-219`, `useEditorShortcuts.ts:108-113,167-170` | One ⌘S handler; dirty clears only on acknowledged save of the same change sequence; conflict copy | — | Eng | ⌘S anywhere sends exactly one `saveProject`; with saves blocked, ⌘S never shows saved; edit during an in-flight save keeps Unsaved until its own save returns | LIVE ✔ L1 #15, #20, N6; L5 NF-7 |
| BK-12 | Copy/Paste/Reset style act on Desktop base only; Apply-to-all fails on non-Base state (selector typo) | `engine/commands/defaultCommands.ts:193-225`, `commandOperations.ts` `pasteStyles`, `engine/commands/stylePeers.ts:79` | Breakpoint/state-aware copy/paste/reset; fix `data-buildrick-id`; error toast when 0 written | — | Eng | On Mobile, Paste style writes a Mobile rule only; Reset style on Mobile clears Mobile values only and says so; Apply-to-all on :hover writes rules for every peer and shows the count | LIVE ✔ L2 §10-7, §10-12 |
| BK-13 | Lock bypass: right-click selects locked; Ungroup, paste-into, Arrange, multi-select align ignore lock | `Canvas.tsx:709`, `standaloneActions.ts:63-73`, `commandOperations.ts:123-170`, `MultiSelectBar.tsx:39-58`, `AlignmentHandler.ts:52-56,216-226` | Route all structural writes through `writableElements`; align/distribute breakpoint-aware | — | Eng | Locked container: Ungroup disabled with reason; paste into it refused with one toast; ⌘[ doesn't move it; align with a locked member moves only unlocked ones and writes the active breakpoint | LIVE ✔ L1 #17, D-11; L2 §10-13 |
| BK-14 | Desktop frame overflows the canvas at 1440×900; inspector floats below 1366 px | `rail/LayoutShell.css:187-193,333-358`, `Canvas.tsx` zoom default | Fix specificity; default zoom "fit width" | — | Eng | At 1440×900 and 1280×800 the full Desktop frame width is visible and every right-edge handle is draggable; inspector is in-flow (static) at 1280 | LIVE ✔ L1 #5, N2; L2 1280×720 |
| BK-15 | AI requests fail with HTTP 431 (prompt context in the GET URL) and the UI blames the service | `ai.streamPrompt` subscription input; `sidebar/tabs/ai/*` | Send context by POST / mutation-then-subscribe; separate "too large" error copy | — | Eng | Element-scoped prompt on a site with full Brand tokens returns a plan; request URL < 8 KB | LIVE ✔ L6 N1, L5 NF-6 |
| BK-16 | Component instance cannot be deleted/cut | `engine/commands/commandOperations.ts:49`, `defaultCommands.ts:109,290` | Exempt instance roots | — | Eng | Select instance root → Delete removes it with Undo toast | LIVE ✔ L3 LC-1 |
| BK-17 | Duplicate instance not an instance until reload; edits before reload are never recorded as overrides (so the next master sync would drop them) | `ElementManager.ts:365-371`, `ComponentManager.rehydrateInstances` | Register clones immediately with fresh override list | — | Eng | ⌘D on an instance → copy shows ◇ and Component section immediately; an edit records an override | LIVE ✔ L3 LC-5 |
| BK-18 | "Linked from library" is a copy; dashboard rename reverted; failed delete resurrects master | `site-component.service.ts:131-151,174-227`, `services/componentSync.ts:111-119`, `syncRetryQueue.ts` | Short term: label "Copied from library", rename updates payload name, persisted retry queue. Long term: versioned library with "update available" | — | Both | Dashboard rename survives the next editor save; failed delete retried after reload; label truthful | LIVE ✔ L3 LC-7, LC-8, LC-17 |
| BK-19 | Session-row / time-travel restore never autosaved | `useComposerInit.ts:906-909`, `HistoryManager.ts:~816` | Listen to restore events; mark dirty | — | Eng | Session restore → `saveProject` within 2 s → reload shows restored state | LIVE ✔ L5 #26 |
| BK-20 | Redirects/sitemap/robots point at paths/hosts that 404 on the deploy | `SeoTab.tsx:37-39,149-150`, `RedirectsScreen.tsx:381`, `site-detail.service.ts:440`, `packages/shared/seo/urls.ts:5-9`, sitemap/robots generator | Ship `cleanUrls` (or use `.html` consistently); auto-create redirect on Update URL; use the actual deployment alias | — | Eng | After rename + publish: old URL (both forms) → 301 → 200; sitemap and robots URLs return 200 | LIVE ✔ L5 #5, NF-2, NF-3 (real deploy) |
| BK-21 | Pre-publish checks not enforced server-side; "Publish now" enabled while loading/failed; failure-toast retry skips gates; counts disagree | `server/services/publish.service.ts:330-566`, `PublishConfirmModal.tsx:149`, `PublishConfirmFacts.tsx:137`, `useExportHandlers.ts`, `useIssuesFeed.ts:124-129` | Server runs `runPrePublishChecks` and refuses blockers; one `PublishGate` for all doors; one issue model | — | Eng | Blocked confirm button until checks resolve; server rejects a publish with an unbound collection list even via API; failure retry reopens the gate; gate, panel and confirm show the same counts | LIVE ✔ L5 #19, NF-4; CODE D-P1 |
| BK-22 | Publish state UI: topbar ignores in-flight job; steps never render; reload shows "Not live yet"; no unpublish toast; Unpublish/Share offered to roles the server refuses (LIVE ✔); Cancel offered to EDITOR (CODE D-P6, not verified) | `StudioHeader.tsx:835-842`, `PublishTab.tsx:307,421,755`, `usePublishJob.ts:323-343`, `PreviewOverlay.tsx:198` | Track active job on mount; status key `"active"`; role-gated menu items | BK-21 | Eng | During a deploy the topbar shows progress; after reload of a published site the CTA is hidden; EDITOR sees no Unpublish; VIEWER sees no Share | LIVE ✔ L5 #17, #20, #21, NF-5, NF-9 |
| BK-23 | Version compare says "matches" after page rename, layer rename, reorder, site SEO change | `engine/VersionTimelineManager.ts:720-944`, `CompareView.tsx:191-196` | Compare page metadata, order, layer names, styles, settings | — | Eng | Each of the four changes appears as a difference | LIVE ✔ L5 #25 |
| BK-24 | New page defaults to template; EDITOR dead end; starter opens whole catalogue; template ADMIN rule is client-only | `NewPageModal.tsx:44,52,71-74`, `TemplatesTab.tsx:153-163`, `CanvasEmptyCTA.tsx:75,98-99` | Default Blank; decide one template-apply role (server is EDITOR today) and use it everywhere; pass `previewId` | — | Both | "+ Add page" → Enter creates a blank page; EDITOR either applies a template or sees disabled-with-reason before choosing; SaaS starter opens its own preview | LIVE ✔ L5 #1, #2; L6 #14 |
| BK-25 | Template apply failure leaves orphan page; retry adds a second; rename stuck after duplicate-name error | `TemplatesTab.tsx:318-337,627`, `PageRow.tsx:87-116` | Create page after successful import (or roll back); clear pending refs; reset commit flag | — | Eng | Injected failure leaves page count unchanged; retry creates one page; rename recovers after error | LIVE ✔ L5 J1, #4 |
| BK-26 | False "Link duplicated · Undo" / "2 elements duplicated · Undo" toast on page create | `useClipboardToasts.ts` reacting to nav-link propagation | Suppress clipboard toasts for system duplication | — | Eng | Creating a page shows only "Page created" | LIVE ✔ L1 N4, L5 NF-1 |
| BK-27 | Effects edits drop filter functions and reorder transforms | `inspector/sections/effects/effectValues.ts:44-89` | Parse-preserving editors | — | Eng | `saturate(1.4) blur(2px)` → move Blur → `saturate(1.4) blur(3px)`; transform order and matrix unchanged except the edited function | LIVE ✔ L2 §10-11 |
| BK-28 | Keyboard: footer Zoom Tab trap; menus not keyboard-operable at HEAD; Layers menu no arrows; ⌘D on page row hits canvas | `useCanvasKeyboard.ts`, `ElementContextMenu.tsx`, `SubmenuItem.tsx`, `LayerContextMenu.tsx:57-62`, `PageRow.tsx:247-258` | Footer outside canvas Tab handler; land submenu keyboard fix with clamping; roving focus in Layers menu; Pages owns ⌘D/⌫ | — | Eng | Tab leaves Zoom; ↓→ opens a submenu next to its parent; Layers menu arrows move; ⌘D on a focused page row duplicates the page | LIVE ✔ L6 N3; L1 #10–13 |
| BK-29 | Position/display only on containers | `shared/constants/elementCapabilities.ts`, `inspector/sections/registry/box.tsx:49` | Show Layout/Position for all types | — | Both | Heading, Image, Flex show Position; absolute positioning works on each | LIVE ✔ L2 §10-16 |
| BK-30 | No class-based styling | `CSSClassesSection.tsx:111-114`, `engine/styles/StyleEngine.ts`, `GlobalStyleManager.ts` (delete or fold in) | Class rules in StyleEngine (`.cls` × media × pseudo); selector field; affects-N; rename/duplicate/remove; style-selector list with "unused" cleanup | BK-10 | Both | Create `btn-primary`, style it, apply to a second button: both compute identical styles; "Affects 2"; rename updates both and the export; combo class changes only its element; Mobile override on the class and scoped clear work | LIVE ✔ (gap) L2 J3 |
| BK-31 | Active breakpoint hidden on Desktop | `CanvasFooterToolbar.tsx:370,403-452` | Canvas bar (E3) | — | Both | Breakpoint and width visible at all times | LIVE ✔ L1 #23 |
| BK-36 | Token truth: "Used by 0" for inherited tokens; Button/Link default colours literal; workspace-pushed tokens unmarked; restore-point pool evicts push snapshot; stale Overwrite regresses `dsSchemaVersion` | `TokenUsageTracker`, `defaultStyles.ts`, Brand UI, `pruneThemeSnapshots`, theme push service | Inherited impact count; bind defaults; source badge; separate prune pools; separate migration counter | — | Both | Changing primary recolours default buttons; type token shows non-zero impact; pushed tokens show "From workspace"; 10 restore points don't break rollback | LIVE ✔ L3 NF-4, NF-5, LC-14, LC-15 |
| BK-37 | Click-add lands off-screen with no scroll | `useBlockInsertion.ts` | Scroll into view and flash | — | Eng | Inserted element is in the viewport after insert | LIVE ✔ L1 N1 |
| BK-39 | Role-aware UI and copy contradict enforcement (template allowed, viewer tabs toast, invite copy, review composer, workspace vs site role) | `PermissionsModal.tsx`, `lib/constants/enums.ts:52`, `tabsConfig.ts`, `ViewerRoleNotice.tsx`, `ReviewTab.tsx:1107` | One role/capability table shared by server and UI copy | — | Both | For each role, every visible action either works or shows a reason; copy matches server results | LIVE ✔ L6 #14, #15, N6, D-16 |
| BK-56 | Interaction Preview never plays; easing select shows "Select…" | `inspector/sections/registry/behaviour.tsx:52-59`, `engine/interactions/types.ts:178-207` | Map GSAP easing names to CSS; select shows stored default | — | Eng | Preview produces a running animation for every easing option | LIVE ✔ L6 #1, #2 |
| BK-57 | Comments credited to "You"; viewer comment policy split; comments need agency layer | `ReviewTab.tsx`, `ReviewService.ts`, `StudioHeader.tsx:742`, `comments.ts:39-44` | Show author; one policy; decouple from review rounds | — | Both | Each comment shows its author; viewers either comment in UI or the server refuses | LIVE ✔ L6 N4, #9, #10 |
| BK-59 | "Overwrite" in conflict keeps no copy of the other writer's work | `AquibraStudio.tsx:853-857` | Snapshot server state as a version before overwrite | — | Eng | After Overwrite, a version "Before overwrite" contains the other tab's change | LIVE ✔ L5 #28 |

### P2

| ID | Issue | Fix | Owner | Acceptance | Verification |
|---|---|---|---|---|---|
| BK-32 | Breakpoint set (no ≤479, no large) | Add Mobile portrait, then 1280/1440/1920 upward cascade | Both | Styles cascade correctly across new breakpoints in canvas/preview/export | CODE |
| BK-33 | 8 override indicators for one override | One context line + field origin label | Both | One Mobile override shows exactly one field indicator and one context line | LIVE ✔ L2 §10-5 |
| BK-34 | State styles not previewed on canvas; only 4 states | Forced state on selection; add focus-visible, visited, placeholder, checked | Both | Editing :hover shows the hover style without pointer | LIVE ✔ L2 §10-18 |
| BK-35 | Visibility model (non-cascading, editor-only eye) | Display:none through cascade; eye relabelled | Both | Tablet hide also hides on Mobile unless overridden; eye tooltip/label says canvas-only | LIVE ✔ L1 #24, L2 §10-10a |
| BK-38 | Content settings in Style tab | Settings tab (E5) | Design | Alt/src/input settings appear only under Settings | CODE |
| BK-60 | Numeric input: no calc/clamp; offsets unitless | Accept CSS math; unit parser for offsets | Eng | `clamp(1rem,2vw,2rem)` accepted; `10` in Top stores `10px` | LIVE ~ L2 §10-17 (unitless offset); calc/clamp CODE |
| BK-61 | No live interaction preview; two runtimes | Run export WAAPI runtime in isolated scripted Preview; retire canvas GSAP runtime or unify | Eng | Hover/click/scroll interactions play in Preview identical to export | LIVE ✔ L6 #3–5 |
| BK-62 | Hex input ignores Enter/Tab | Commit on Enter/blur | Eng | Enter commits | LIVE ✔ L2 N-1 |
| BK-63 | Settings save: no Saving, no conflict, premature red, Save-and-continue drops values, offline Discard stuck, three archive rules | Version token; states; one rule | Both | Two admins: second sees a conflict; untouched invalid shows neutral notice | LIVE ✔ L5 #11–14 |
| BK-64 | Disabled reasons not exposed to AT | `DisabledReason` with `aria-describedby` | Eng | AX tree contains the reason | LIVE ✔ L6 #16 |
| BK-65 | **P1 (enabler for BK-05; listed here for grouping)** Full-page host focus/inert, Back placement | `FullPageHost` | Both | Tab stays inside; focus returns to opener | LIVE ✔ L6 #8 |
| BK-66 | Hidden home page silently reassigned; `<meta>` rejected; site head code beats page | Refuse/route; fix validator; emit order | Eng | Hiding home refused with reason; `<meta …>` accepted; page head emitted after site | LIVE ✔ L5 #7, #8; site-over-page head precedence CODE; page OG image ignored in favour of the site default (L5 J2, D-PG12) |
| BK-67 | Versions drift between devices; unbounded named versions | Server-authoritative list; prune policy | Eng | Deleted version disappears on other devices after reload | LIVE ✔ L5 #30 |
| BK-68 | Undo of delete selects parent; undo of off-page edit doesn't navigate | Reselect restored element; navigate | Eng | ⌘Z after delete selects the restored element | LIVE ✔ L1 N5 |
| BK-69 | Variants select dead; create-from-instance misreport; stale instance counts | Hide select; refuse/convert; prune map on delete | Both | Counts update immediately after deleting a container with instances | LIVE ✔ L3 LC-2, LC-6, LC-13 |
| BK-70 | Content-only (client) role | Capability set: text, images, CMS; no styles/structure | Both | A Content editor can edit text and CMS records but every Style control is disabled with a reason | CODE |
| BK-71 | Audit panel (a11y/SEO) | Extend Issues panel with alt, link text, heading order, duplicate IDs, meta | Both | Each check finds a planted issue | CODE |
| BK-72 | Interaction model depth | Target picker, reverse; later timeline | Both | Interaction can target children/siblings | CODE |
| BK-73 | Analytics "receiving data" for any GA id | Check the GA property or reword | Eng | Wrong GA id never reported as receiving | LIVE ✔ L6 #22 |

### P3

| ID | Issue | Fix | Verification |
|---|---|---|---|
| BK-74 | Command palette ranking/legend/focus return | Fuzzy ranking; ↑↓/Enter/Esc legend; return focus | LIVE ✔ L1 J3 |
| BK-75 | Onboarding orchestration | One queue; nothing modal over Preview | LIVE ✔ L1 #4 |
| BK-76 | Pan/zoom gestures | ⌘+wheel zoom, Space-drag pan | CODE |
| BK-77 | Upload / Back-to-canvas visual consistency | One primary + one exit component | CODE + LIVE ✔ |
| BK-78 | Inline styles and `../../` imports in chrome (InteractionEditor, AI, settings hooks) | Clean up while touching | CODE |
| BK-79 | Localization, publish selected pages, staging, ecommerce, memberships, A/B | Optional expansions; staging is the first to consider (P1 if the "Preview deployment" row stays visible) | CODE / PLANNED |

### Content and data rows (P1–P2; the P0 rows BK-40, BK-42, BK-44 are in the P0 table)

| ID | Issue | Files / screens | Fix | Owner | Acceptance criteria | P | Verification |
|---|---|---|---|---|---|---|---|
| BK-41 | Tabs and Modal have no runtime in exported/published pages | `blocks/Components/Tabs.tsx:84`, `Modal.tsx:57`, `lib/publish-widgets.ts:25-28` | Add runtimes (and include the accordion/countdown runtimes in ZIP/HTML export) or hide the rows | Eng | Exported page: clicking tab 2 shows panel 2; Open Modal shows the overlay | P1 | LIVE ✔ L4 #4 |
| BK-43 | Media library scoped to the uploader, not the site | `server/services/media.service.ts:153-155` | Site-scoped list with role check | Eng | EDITOR and VIEWER on the site list the same assets as the owner | P1 | LIVE ✔ L4 #17 |
| BK-45 | Form editing defects: Select Options duplicates; select → Long text loses options; clearing redirect never saves; VIEWER can export submitter IPs | `PropertyField.tsx:143-172`, `FormFieldsSection.tsx:50-74`, `FormAfterSubmitSection.tsx:138`, `server/trpc/routers/forms.ts:91-99` | Edit `<option>` children; guard type change; save on clear; IP export ADMIN-only | Eng | Options Red/Blue → exactly 2 options after reload; clearing redirect updates the DB; VIEWER export has no IP | P1 | LIVE ✔ L4 #25–28 |
| BK-46 | Collection lists: no sort/filter/offset; order follows last edit; canvas shows drafts; nested lists wrong; export writes one card | `engine/cms/CMSBindingManager.ts:327-354`, `RepeaterRenderer.ts:141-163,399-456`, `CollectionListSection.tsx`, export CMS expansion | Query editor (filter, sort, limit, skip) stored in the binding; draft badge on canvas; fix nested substitution and export expansion | Both | Sorting by a field keeps order after edits; filter excludes items; nested list shows its own items; export page has as many cards as the canvas | P1 | LIVE ✔ L4 #35–36, N-5 |
| BK-47 | CMS lifecycle: undo restores under a new id; CSV stores strings; key rename breaks SEO patterns; no bulk publish | `CmsWorkspace.tsx:486-488`, `server/services/cms.service.ts:569-572`, `CollectionManager.ts:273-298` | Restore by id (un-tombstone); coerce CSV per field type; follow keys into SEO patterns; bulk publish | Eng | Undo keeps the id and pins; CSV `false` stays false and lists import as lists; rename keeps `{field}` patterns valid; select-all → Publish | P1 | LIVE ✔ L4 #32–34 |
| BK-48 | Six validated CMS field types hidden; no multi-reference | `editor/cms/fieldTypes.ts:17`, `packages/shared/schemas/cms.ts:19-36` | Expose datetime, select, file, color, url, email; add multi-reference | Both | Add-field dialog lists 16 types; multi-ref list binds referenced items | P1 | CODE |
| BK-49 | Collection slug clash silently discards the new collection | `CMSCollectionSetupModal.tsx:159-166`, `cmsSync.ts:802-856` | Validate slug in the dialog; show the server reason; never discard silently | Eng | Creating "Menu-items" next to "Menu items" shows an inline slug error | P1 | LIVE ✔ L4 #31 |
| BK-50 | Alt text: drag strips alt; library alt drops characters; no decorative option | `AssetCell.tsx:110-115`, `AssetGrid.tsx:801-805`, `AssetDetailsPanel.tsx:752-765`, `MediaCommandLayer.ts:259-283` | Carry alt in drag payload; stable controlled textarea with debounced save; Decorative/Use asset alt/Custom modes | Both | Dragged image keeps asset alt; typing 10 characters saves exactly those 10; decorative writes `alt=""` and is never overwritten | P1 | LIVE ✔ L4 #13, #20, N-3 |
| BK-51 | Paste HTML executes script in the editor origin; dialog claims the handler is removed | `engine/elements/manager/HTMLParser.ts:268-287`, `Element.ts:146`, `generation.ts:160`, `PasteHtmlModal.tsx` | Sanitize in `setContent` and before canvas mount; keep text nodes as text | Eng | Pasting the flag payload leaves `window.__audit1014` undefined and no `onerror` attribute in the canvas DOM | P1 (security) | LIVE ✔ L4 #6 |
| BK-52 | Media safety: lock bypass on click-replace and Apply version; folder delete with contents irreversible; failed moves look successful | `useMediaState.ts:213-220`, `LibraryManager.tsx:669,1077-1091`, `useLibraryState.ts:315-338`, `MediaManager.ts:1388,1435` | Lock gate; grace + undo + usage check on folder delete; surface server refusal | Eng | Locked image src unchanged after tile click; folder delete offers Undo and lists usages; blocked move shows an error | P1 | LIVE ✔ L4 #15, #16, #19 |
| BK-53 | Media drop lands at the wrong position under zoom; GIF animation lost | `useDropExecution.ts:96-98`, `MediaManager.ts:1096-1111` | Scale drop coordinates; skip WebP conversion for animated GIF | Eng | At 50 % zoom the image appears under the pointer; uploaded GIF keeps all frames | P2 | LIVE ✔ L4 #14, #20 |
| BK-54 | Sync failures invisible: component library read error shows as "No saved components"; asset move refusal silent | `services/componentSync.ts:184-195`, `useComponentList.ts:55`, `AssetUploadService.ts:224-251` | Error state with Retry | Eng | Blocked library read shows an alert with Retry | P2 | LIVE ✔ L4 #16, #39 |
| BK-55 | Text editing tools: toolbar link field steals no focus and overwrites text; Clear formatting dead; Link section carries the previous element's URL; drag onto heading makes it uneditable; page links dead in Preview | `editor/panels/RichTextEditor.tsx`, `useCanvasInlineCommands.ts:174-175`, `LinkSection.tsx:119-193`, `dropOperations.tsx:416-535`, `PreviewOverlay.tsx:137` | Fix popover focus; implement `removeFormat`; key Link section by element; text-leaf guard on drag; resolve page links in Preview | Eng | Typing in the link popover edits the URL only; Clear formatting removes `<strong>`; switching elements shows each element's own link; dropping onto a heading inserts beside it | P1 | LIVE ✔ L4 #5, #7–10 |
| BK-58 | React export: drops heading text when it has children; invalid JS (hyphenated CSS-module keys via dot access); duplicate `class`/`className` | `engine/export/ReactExporter.ts:219-247` | Content-then-children; bracket access; one className | Eng | Exported React project type-checks and renders the same text | P2 | LIVE ✔ L4 #5, N-6 |
| BK-80 | Export fidelity: ZIP claims "your media" but has none; CMS lists not expanded; file named after the page title | ZIP export | Bundle or document remote media; expand lists; name after the site | Eng | ZIP contains media or states remote URLs; CMS list pages have all cards | P2 | LIVE ✔ L4 N-5, N-10 |
| BK-81 | CMS first-run IA (scattered empty state; stepper shows a step done that wasn't) | `CmsWorkspace.tsx:178-207`, `ContentViews.tsx:159-230`, `CMSCollectionSetupModal.tsx:283-293` | One centred CTA; honest stepper | Design | Empty CMS shows one primary action in the centre | P2 | LIVE ✔ L4 #29–30 |

---

### Additional backlog rows (from the consistency pass)

| ID | Issue | Files / screens | Fix | Owner | Acceptance criteria | P | Verification |
|---|---|---|---|---|---|---|---|
| BK-82 | Duplicated sites carry orphan component instances that can be neither deleted nor detached (no Component section) | `server/services/sites.service.ts` (duplicate), `SiteComponent` rows, Inspector Component section | Copy `SiteComponent` rows on site duplicate; offer Detach when the master is missing | Eng | In a duplicated site every instance can be deleted or detached | P1 | LIVE ✔ L3 NF-1 |
| BK-83 | ⌘-drag then Escape leaves a clone; cross-parent Group is a silent no-op | `useCanvasElementDrag.ts:216-235,368-395`, `standaloneActions.ts:40-56` | Cancel removes the clone; one Group eligibility function with a reason | Eng | Esc during ⌘-drag leaves the element count unchanged; Group across parents is disabled with a reason | P2 | LIVE ✔ L1 #14, #18 |
| BK-84 | Components, History and Publish not on the rail; shortcut letters invisible | `rail/tabsConfig.ts:294-296`, `sidebar/LeftSidebar.tsx` | Add rail entries; show letters in tooltips | Both | Each of the three tools opens from the rail; tooltips show the letter | P1 | LIVE ✔ L5 NF-13 |
| BK-85 | No in-place master editing, no component properties or slots | `ComponentDetailScreen.tsx`, `ComponentInstances.ts`, `ComponentInstance.ts` override paths | In-context edit mode on an instance; declared props keyed by stable ids; then slots | Both | Double-click an instance → edit master in place → every instance updates; a Text prop edited on one instance survives a master reorder | P1 | LIVE ✔ L3 J1 (gap) |
| BK-86 | No Rich Text element | `blocks/`, `useCanvasInlineEdit.ts:205-207` | Rich-text element with block-level Enter (H1–H6, lists, quote) | Both | Enter creates a new paragraph inside the element; export matches | P1 | CODE |
| BK-87 | No responsive images (srcset/sizes/width/height) | export pipeline, `engine/media/*` | Variants at upload or publish; emit dimensions and `loading` | Eng | Exported `<img>` has `srcset`, `sizes`, `width`, `height` | P1 | CODE |
| BK-88 | No field-driven conditional visibility | `VisibilitySection.tsx`, `CMSBindingManager.ts` | Conditions on CMS fields (empty / equals / switch) | Both | An element bound to an empty field is excluded from the published HTML | P1 | CODE |
| BK-89 | Component cache and template edges: IndexedDB component row moves to another site when hydration fails; "Save page as template" drops instance markers; Update/Reset leaves orphan `:hover` rules for old ids | `ComponentStorage.ts:51,164`, template save path, `ComponentInstances.ts:313-375` | Key IndexedDB rows by (site, id); serialize markers or warn; delete old-id rules on re-clone | Eng | Two sites in one browser keep their own masters offline; template save keeps or warns about instances; no orphan rules after update | P2 | LIVE ✔ L3 LC-9, LC-16 (save side), NF-2 |

§C rows without a BK id (Add-panel taxonomy, canvas breadcrumb, pan/zoom, disclosure, copy-style categories, radius token picker, embed copy, approvals copy) are polish or strategic items tracked in §E only.

### Additional confirmed observations mapped to backlog rows

| Lane / id | Observation | Tracked under |
|---|---|---|
| L5 #18 (RR-03) | Aborted server checks make 4 issue rows vanish silently (7 → 3), no banner | BK-21 |
| L5 NF-4 (part) | Errors gate calls links to a hidden (existing) page "no longer exists" | BK-21 |
| L2 N-3 | Single-page HTML export carries CSS for elements on other pages | BK-80 |
| L4 N-8 | Collection-list clones reuse `data-buildrick-id` (duplicate ids in the canvas DOM) | BK-46 |
| L5 NF-8 | Hidden pages offered as CMS dynamic-page templates | BK-46 |
| L4 N-9, #18 | Library usage count stale; Apply version still rewrites the image; no UI to restore v1 | BK-52 |
| L4 journey 3 | Submissions store `sourceUrl: null` | BK-44 |
| L4 journey 2 | Assets header count disagrees with listed tiles after a retry | BK-42 |
| L3 LC-10 | Token rename accepts `brand.test`, then fails with no reason | BK-36 |
| L3 NF-6 | ⌘Z/⇧⌘Z with focus in the Brand Value input records two token edits | BK-05 |
| L3 NF-7 | After a failed DELETE the toast says "saved on this device" | BK-18 |
| L3 J2 | Brand restore point applies in one click with no confirm | BK-36 |
| L5 NF-10 | Nested `Before restoring "Before restoring …"` version names; row overflows | BK-67 |
| L5 NF-12 | Session-restore confirm says "discard 2 changes"; only 1 undone | BK-19 |
| L5 #11 | Settings Save disabled with no reason | BK-63 |
| L6 #19 (D-15) | Role unknown → "‹ Back to editing" loops back to read-only | BK-39 |
| L6 N13 | Viewer History empty state says "Use ⌘Z to undo changes" | BK-39 |
| L6 #20 | "Start collaboration PLANNED" is `aria-disabled` with no reason | BK-64 |
| L6 N9 | Review comment row is `role=button` containing buttons | BK-64 |
| L6 N7, N10, N11 | Viewer Activity comment row is a dead door; empty RESOLVED header after reload; no toast after internal Send for review | BK-57 |
| L6 N8 (part) | Escape does nothing while focus is inside the Preview iframe | BK-09 |
| L1 #3 (UX-07) | Selection tag intersects the toolbar on small elements; caption drawn over the element | BK-37 |
| L1 N8 | ⌘1 "Zoom to fit" gives 26 % (fits height, not width) | BK-14 |
| L1 N7, N11 | No automatic save retry after the network returns; stale "Couldn't save" toast next to "Restore my edits" | BK-11, BK-04 |
| L1 N10 | Preview page selector label overlaps its chevron | BK-09 |
| L2 N-5 | Move X/Y show empty while `translateX(10px)` exists | BK-27 |
| L2 J1 | Border › Color empty while it renders as currentColor | BK-10 |
| L2 N-7 | Enter in Add page opens the template gallery and uses the typed text as the page name | BK-24 |

## Appendices

- [`evidence/BRIEF.md`](evidence/BRIEF.md), [`evidence/LIVE-BRIEF.md`](evidence/LIVE-BRIEF.md): the method every lane followed.
- Code maps: [`01-shell-canvas`](evidence/01-shell-canvas.md), [`02-inspector-styling`](evidence/02-inspector-styling.md), [`03-components-brand`](evidence/03-components-brand.md), [`04-content-data`](evidence/04-content-data.md), [`05-pages-settings-publish`](evidence/05-pages-settings-publish.md), [`06-collab-roles-a11y-ix`](evidence/06-collab-roles-a11y-ix.md). Each has a module map, screen inventory, control traces (UI → state → validation → persistence → render), state coverage, ownership rows, Webflow gaps, hidden features, preserve list, defects and live-check scripts.
- Webflow reference: [`07-webflow-reference`](evidence/07-webflow-reference.md) (77 sources, 2026-10-14).
- Live results: [`L1`](evidence/live/L1-results.md) · [`L2`](evidence/live/L2-results.md) · [`L3`](evidence/live/L3-results.md) · [`L4`](evidence/live/L4-results.md) · [`L5`](evidence/live/L5-results.md) · [`L6`](evidence/live/L6-results.md). Screenshots, JSON measurements and scripts are outside the repo at `~/Desktop/buildrik-worktrees/editor-audit-evidence-2026-10-14/` (same layout).

### Test data and external side effects

- **Vercel:** two real deploys of `audit1014-L5` (owner-approved), project `buildrik-site-e2e-blank-full-d013128c-copy-11`, then deleted via the API (204, verified 404). Both URLs return 404. The local `Site.vercelProjectName` row still holds the deleted name.
- **Local DB (dev only):** sites `audit1014-L1…L6`, `audit1014-L3-S2`, `audit1014 fresh` (+ user `audit1014-l1@buildrik.local` and its workspace), user `audit1014-l5-editor@buildrik.local` (EDITOR), workspace template `audit1014-tpl`, verifier sites `audit1014-V1`/`audit1014-V2` (test edits) and 4 `audit1014-v-*` media asset rows with their uploaded Blob files. Lane L6 fixtures were deleted and verified. See each results file for the per-site list.
- **No code, test, config or Figma file was changed.** One temporary helper (`scripts/baseline/.l5-vercel.ts`) was created and removed by lane L5.
