# Dashboard Gap Analysis — Two-Way Diff

**New (dc):** `Buildrik Dashboard.dc.html` — current workspace, a stateful design-canvas template.
**Complete Kit:** `Buildrik Dashboard - Complete Kit (2).html` — an audit + fix + handoff board titled *"Dashboard wireframe — gap fixes."*
Method: extracted New's `sc-if` state inventory (~150 states) from source; decoded Complete's escaped template to plain text and read its 20 sections incl. its own *Priority backlog — consolidated handoff* (45 findings).
Date: 2026-07-12.

---

## TL;DR — the premise flipped

The two files are **not** "new (thin) vs old (complete)." They are:

- **New (dc)** = the **newer, comprehensive build** — 25 screens (`is*`), ~22 states (`ds*`), **41 modals (`ov*`)**, 8 site-detail tabs, wizard steps, command palette. It already **absorbed almost every fix wireframe** the Complete Kit produced.
- **Complete Kit** = the **audit that produced those fixes** — it documents 45 findings (24 wireframed, 7 code-only, 14 still open) and the fix screens.

So the real gaps are small and go **both ways**:
- **Complete → New:** ~4 wireframed fixes New didn't carry over + the 14 items Complete itself left OPEN (unbuilt in *both* — a shared backlog).
- **New → Complete:** 8 whole product areas + ~12 modals + several states that New added and Complete never had.

Do **not** re-import Complete's screens wholesale — you'd duplicate 90% of what New already has and reintroduce the old red accent + pre-fix copy.

---

## A. Complete → New — genuine gaps to ADD to New

### A1. Wireframed in Complete, missing in New (real, add these)

| # | Missing item | Where it belongs in New | Complete reference | Add-it instruction (no dupes) |
|---|---|---|---|---|
| A1-1 | **Publish FAILED + retry state** | Inside the existing publish modal (`ovPublish`), as a terminal branch after progress | Backlog **O7** ("Publish FAILED + retry path") | Add a `dsPublishFailed` / third state to `ovPublish` (progress → success → **failed**). Reuse the publish modal shell + error banner; add a "Retry" + "View log" CTA. Don't make a new modal. |
| A1-2 | **Solo-mode nav variant** (agency_layer OFF) | Sidebar — a second nav state hiding Clients / Reviews / Comments / Shared-theme | Backlog **O8** ("Solo-mode 6-item nav") | Add a `soloNav` boolean to the sidebar component; when true, render only Home/Sites/Media/Team?/Settings/Help. Reuse the existing sidebar; toggle item visibility. New currently always shows the agency nav. |
| A1-3 | **reviews-DENIED state** | Review & comments screen (`isReview`) empty/denied variant | Audit "State gaps" + Backlog **P1–3** | Add a `dsReviewDenied` branch to `isReview`: *"Only admins can review submissions."* Reuse the existing empty-state block with a lock icon; no new screen. |
| A1-4 | **Notification → deleted-resource guard** | Notifications screen (`isNotifications`) row / click target | Backlog **S6** | Add a `dsNotifDeleted` (or inline toast) state: clicking a notification whose site/comment was deleted shows *"This item no longer exists."* Reuse the existing `toast` pattern. |

> Everything else the Complete Kit wireframed is **already in New**: share-draft-404 (`ovShareDraft`+`ds404`), invited checklist (`dsInvited`), upgrade return (`ovUpgradeOk`+`ovCheckoutCancel`), 2FA setup+disable (`ov2fa`/`ovCodes`/`ov2faOff`), comments reply + @mentions (`ovMention`), free-plan ticket (`ovTicket`), downgrade keep-picker (`ovDowngrade`), editor→sent-for-review (`ovSendReview`), onboarding name carry (`dsOnboard`+`step0-4`+`siteName`), create-folder (`ovFolder`), workspace-delete (`ovWsDelete`), media-QUOTA (`dsQuota`), ⌘K empty (`cmdNoResults`), sites/billing/theme ERROR (`dsError`/`dsSharedErr`), notifications/templates EMPTY (`dsEmpty`/`dsTemplatesEmpty`), transfer-accept + maintenance (`dsTransfer`+`dsMaintenance`). **Do not re-add these.**

### A2. OPEN in Complete = unbuilt in BOTH (shared backlog — design once, add to New)

Complete's backlog marks these `○ open` — it never designed them either. They belong in New as new work:

| # | Item | Where in New | Complete ref | Instruction |
|---|---|---|---|---|
| A2-1 | **Responsive / mobile layouts (all core)** | Every `is*` screen | Backlog, effort **L** | Desktop-only today (New only has a `dsMobile` "not supported" block). If mobile is in scope, add breakpoints to the shell + core screens. Large; sequence separately. |
| A2-2 | **Media folder rename / delete UI** | Media (`isMedia`) — extend `ovFolder` | Backlog M | New has create-folder (`ovFolder`); add rename/delete actions to the folder chip context menu. Reuse `ovRename`/`ovDelete` patterns. |
| A2-3 | **Email-change verification leg** | Account (`isAccount`) → after `ovEmail` | Backlog M | New has the change-email modal (`ovEmail`) but not the "check your new inbox → verify" confirmation screen. Add a `dsEmailChangePending` state. |
| A2-4 | **Lost-device 2FA recovery path** | Account/security | Backlog M | Add a recovery screen off the 2FA flow (use backup codes / support). Reuse `ovCodes`. |
| A2-5 | **Per-screen empty states: clients / team / client-detail** | `isClients` / `isTeam` / `isClientDetail` | Backlog S | New has a generic `dsEmpty`; add dedicated zero-states ("No clients yet", "No team members yet" already partly exists, "No sites for this client"). |
| A2-6 | **Per-site export** (decide first) | Site context menu / bulk bar | Backlog M | Product decision pending — decide if it's a feature before designing. |
| A2-7 | **Role / a11y polish set** | Cross-cutting | Backlog S–M | Designer-invite badge fix, Designer vs Editor split, Transfer-includes-Designers, Team-table Designer row, aria-labels on icon-only controls, focus states, non-color status, AA nav contrast, ⌘K "Moved" IA map. Mostly small; batch as an "accessibility + roles" pass. |

### A3. Code-only (⚙) — NOT design gaps (hand to eng, don't wireframe)

From Complete's backlog: maintenance `/api/health`, real QR encoder, "Danger Zone" vs workspace-delete naming, delete-site copy vs backend, agency-flag paint race, accent drift (**already fixed** — cobalt/Buildrick), analytics 90-day retention disclosure, two role-enum casings. These need code, not screens.

---

## B. New → Complete — what New added beyond Complete

New has whole areas the Complete Kit never contained. Keep them; they are **not** gaps — listed so you don't think they're stray.

- **Screens (whole nav destinations):** Marketplace (`isMarketplace`, full column), Learn (`isLearn`), Resources (`isResources`), Partner program (`isPartner`), Usage (`isUsage`), Apps (`isApps`), Libraries & Templates (`isLibraries`), Getting started (`isGettingStarted`), All projects (`isProjects`).
- **Modals New adds:** AI generate (`ovAiGen`), Referral (`ovReferral`), App install (`ovInstall`), Integration connect (`ovConnect`), Help article (`ovArticle`), API token (`ovNewToken`), Active sessions (`ovSessions`), New project (`ovNewProject`), Rename (`ovRename`), Stale-version (`ovStale`), New site (`ovNewSite`).
- **States New adds:** workspace deletion scheduled (`dsDeletion`), past-due (`dsPastDue`), uploading (`dsUploading`), help-empty (`dsHelpEmpty`).
- **Structure New adds:** full 8-tab site detail (Overview/Traffic/Domains/SEO/Redirects/Submissions/Sharing/Settings), command palette with 4 states, richer bulk-select variants.

**Complete has one framing New lacks as a dedicated screen:** a standalone **"Comments queue"** (Complete's section). In New this is folded into **Review & comments** (`isReview` + `ovMention`/`ovSendReview`/`ovRequestChanges`). Decide if you want comments split out; if not, no action.

---

## C. Single-update checklist (add to New, zero dupes)

1. `ovPublish` → add **failed + retry** branch. (A1-1)
2. Sidebar → add **solo-mode** nav variant. (A1-2)
3. `isReview` → add **denied** state. (A1-3)
4. `isNotifications` → add **deleted-resource** guard. (A1-4)
5. `ovEmail` → add **verification-pending** screen. (A2-3)
6. `isMedia`/`ovFolder` → add **rename/delete folder**. (A2-2)
7. `isClients`/`isTeam`/`isClientDetail` → add **dedicated empty states**. (A2-5)
8. Cross-cutting **roles + a11y** pass. (A2-7)
9. (Scope decisions) per-site export (A2-6), responsive (A2-1), lost-device 2FA (A2-4).
10. Hand code-only items (§A3) to eng — no screens.

**Do not touch** New's existing 41 modals / 25 screens / states listed in §A1 note + §B — they already satisfy the Complete Kit's fixes.

---

### Appendix — New (dc) full state inventory (source of truth for "already covered")

`is*` screens: Home, Sites, Projects, Apps, Libraries, Marketplace, Learn, Resources, Clients, ClientDetail, Team, Partner, Plans, Usage, Billing, Integrations, Settings, SiteDetail, Notifications, Account, Media, GettingStarted, Review, Help, Domains.
`ds*` states: Loading, Empty, Error, Offline, 404, 500, Maintenance, PastDue, Denied, Quota, Quota80, Uploading, Deletion, Invited, SharedTheme, SharedErr, Transfer, Onboard, Mobile, HelpEmpty, TemplatesEmpty, Ready.
`ov*` modals: 2fa, 2faOff, AddClient, AiGen, Article, CancelPlan, ChangePlan, CheckoutCancel, Codes, Command, Connect, Delete, Domain, Downgrade, Email, Folder, Install, Invite, Mention, NewProject, NewSite, NewToken, Password, Payment, Paywall, Publish, Redirect, Referral, Rename, RequestChanges, SendReview, Sessions, ShareDraft, Stale, Submission, Template, Ticket, Transfer, UpgradeOk, Upload, WsDelete.
`tab*` (site detail): Overview, Traffic, Domains, SEO, Redirects, Submissions, Sharing, Settings.
Wizard: step0–4. Command palette: cmdEmpty, cmdHasResults, cmdNoResults.
