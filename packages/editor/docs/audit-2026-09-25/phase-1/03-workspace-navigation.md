# Audit 3 — workspace and authentication navigation

Date: 2026-09-25. Scope: editor/dashboard handoffs, deep-link consumption, parent/return behavior, and authentication/invitation/review/share navigation. Documentation only; no production changes or security audit. **Authenticated flows are source-only: NOT RUNTIME VERIFIED.** The lead's dashboard browser session redirects to `/auth`; this lane did not establish authenticated browser access or run tests.

## Primary and secondary navigation

| Surface | Primary / parent | Secondary destination / action | Back / Close behavior | Decision and proof |
| --- | --- | --- | --- | --- |
| Dashboard workspace | Home, Getting started, Sites, Agency, Media, Settings | Main route navigation | Persistent shell remains the workspace parent | **KEEP.** Explicit list at `packages/dashboard/components/dashboard/shell/nav.ts:20`; site-detail paths are recognized as children of Sites at `:43`. |
| Site detail | Dashboard → Sites → named site breadcrumb | Overview, Traffic, Domains, SEO, Submissions, Redirects, Sharing, Settings | Breadcrumb returns to dashboard/sites; child tabs stay under the same site ID | **KEEP.** `packages/dashboard/app/dashboard/sites/[id]/layout.tsx:59`; `packages/dashboard/components/site-detail/tab-nav.tsx:7`, `:32`. |
| Dashboard settings | Settings root | Section routes | Section layout links back to `/dashboard/settings` | **KEEP.** `packages/dashboard/app/dashboard/settings/layout.tsx:34`. This is a workspace parent link, not “return to the editor.” |
| Agency | Agency primary section | Clients, Reviews, Handover, Library, Shared theme | Persistent agency tabs/global shell provide parent/sibling navigation | **KEEP.** `packages/dashboard/components/dashboard/shell/agency-tabs.tsx:10`. Route-group `(tabs)` is filesystem grouping; URLs remain `/dashboard/agency/*`. |
| Site → editor | Site header / site route | “Edit in Editor”; Publish navigates to editor | Edit opens a new tab; Publish switches current tab to editor | **KEEP with handoff follow-up.** `packages/dashboard/components/site-detail/site-header.tsx:151` opens EditorLink with `_blank`; site layout's publish action routes to editor at `packages/dashboard/app/dashboard/sites/[id]/layout.tsx:75`. Publish does not pass an auto-open-publication request; whether that is the desired task continuation needs browser/product verification. |

## Editor handoffs and return preservation

| Entry / action | Exact destination and consumption | Parent / return behavior | KEEP / CHANGE |
| --- | --- | --- | --- |
| Editor Site settings | Local settings surface, via `onOpenSiteSettings` | Remains in the editor; fullpage close handler has separate local navigation | **KEEP local ownership.** Menu callback at `packages/editor/src/editor/shell/SiteMenu.tsx:194`; local settings close is `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx:265`. Local screen-stack details are covered by the editor navigation lane. |
| Settings → Members / Billing | Dashboard workspace URLs opened with `_blank` | Original editor tab and local Settings state remain mounted | **KEEP.** `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx:281`. No return parameter is required to preserve the original tab; no explicit same-tab return contract is claimed. |
| Site menu → Invite teammates / Account settings | `/dashboard/settings/team`, `/dashboard/settings/account` | New dashboard tab; browser tab switch/close returns to original editor | **KEEP.** `packages/editor/src/editor/shell/SiteMenu.tsx:288`; helper uses `_blank` at `:118`. Invite action lands on the team destination, not a separately encoded open-invite modal. |
| Site menu → Site health / Activity log | `/dashboard/sites/:id#site-health`, `#activity-log` | New dashboard tab; site detail breadcrumb and Edit in Editor available | **KEEP target identities; PARTIAL landing verification.** Entry at `packages/editor/src/editor/shell/SiteMenu.tsx:222`; exact DOM IDs at `packages/dashboard/components/site-detail/overview-tab.tsx:184` and `:306`. Overview renders a skeleton while loading (`:89`); no explicit hash-after-load consumer was found in that component. Actual scroll after asynchronous mount needs authenticated browser verification. |
| Site menu → Share preview link | `/dashboard/sites/:id?share=1` | New tab preserves editor; modal Close returns to site detail | **KEEP query handoff.** `packages/editor/src/editor/shell/SiteMenu.tsx:275`; `packages/dashboard/components/site-detail/site-header.tsx:41` consumes `share=1`; `:180` closes via local state. Modal close does not remove the query, so a fresh load can intentionally/repeatedly reopen it. The preview/live destination issue is already IA002; do not count again here. |
| Editor → full media library | `setMediaFullPage(true)`, not `/dashboard/media` | Close returns to the Media slim launcher without switching tabs | **KEEP.** `packages/editor/src/editor/shell/StudioPanels.tsx:421` opens; `:411` handles close, clearing mediaFullPage. `packages/editor/src/editor/media/LibraryManager.tsx:843` invokes the close callback. This is not a workspace route. |
| Dashboard Media | `/dashboard/media` → workspace MediaLibrary | Workspace shell navigation; no originating editor/site parameter | **KEEP as workspace destination.** `packages/dashboard/app/dashboard/media/page.tsx:8` loads workspace ID and `:11` renders MediaLibrary. No editor → dashboard-media handoff was established in inspected media code, so lack of a site return URL is not recorded as a broken return path. |
| Workspace Components Library | Agency → `/dashboard/agency/library` | Agency tabs; rename/delete modal close remains in library | **KEEP administration parent; PARTIAL editing-continuation question.** `packages/dashboard/app/dashboard/agency/(tabs)/library/page.tsx:4` mounts LibraryPanel; `packages/dashboard/components/library/library-panel.tsx:119` shows a noninteractive “Used on N sites” pill. Its reviewed row actions are rename/delete, with no editor/component destination. Do not imply a working “jump to instance” flow from the server usage endpoint alone. |
| Editor Exit | `/dashboard/projects` in current tab | Explicitly leaves editor; guard handles dirty/error/pending mirror state | **KEEP.** `packages/editor/src/editor/shell/StudioHeader.tsx:504`, guard at `:416`. This is a parent destination, not history.back. Save/durability behavior was not exercised. |
| Enter/exit view mode | Same full URL, only `view` query changed | Guarded current-tab navigation preserves other URL components | **KEEP.** `packages/editor/src/editor/shell/StudioHeader.tsx:509` constructs URL, edits query and assigns it. |

Editor URL selection is centralized in `packages/dashboard/components/editor-route/unified-flag.ts:8`: unified `/edit/:id` or legacy editor origin `/?siteId=...`. It preserves site identity, but does not encode selected page, selected element, active panel or a caller return route. The new-tab handoffs preserve the original session by retaining its tab; opening a fresh EditorLink should not be described as restoring the exact prior editing position.

## Authentication and public-link route continuity

| Entry / branch | Destination proof | Return semantics | Decision |
| --- | --- | --- | --- |
| Logged-out direct `/edit/:id` | `packages/dashboard/app/edit/[siteId]/page.tsx:17` supplies `next=/edit/:id` | `/auth/login` maps `next` to `returnUrl` (`packages/dashboard/app/auth/login/page.tsx:15`); login success assigns it (`packages/dashboard/app/auth/page.tsx:63`) | **KEEP** the proven direct-editor continuation. Query-level editor context is not included in this server redirect. |
| Password login → 2FA → success | Login carries returnUrl/remember/token at `packages/dashboard/app/auth/page.tsx:47`; 2FA success at `packages/dashboard/app/auth/2fa/page.tsx:34` | Returns to intended route when parameters remain present | **KEEP** forward flow. |
| 2FA → backup code | `packages/dashboard/app/auth/2fa/page.tsx:62` carries token, remember and returnUrl | Backup success uses returnUrl at `packages/dashboard/app/auth/2fa/backup/page.tsx:35` | **KEEP** forward branch; **CHANGE** reverse link per NAV-W02. |
| Password login → OAuth | `packages/dashboard/app/auth/page.tsx:112` passes returnUrl as callbackUrl | Intended route is supplied to provider flow | **KEEP source contract**; provider/browser callback not verified. |
| Invitation → sign-in/join | `packages/dashboard/app/auth/invite/page.tsx:76` builds invite URL; `:260` supplies it as returnUrl; `:263` carries token to join-workspace | Sign-in returns to invitation; success has an explicit dashboard destination at `:144` | **KEEP**, subject to alternate-login detour issue NAV-W03. |
| Review token | `/review/[token]` is a client-review surface, not an editor-auth link | Its confirmation “Go back” clears asking state (`packages/dashboard/app/review/[token]/review-client.tsx:399`), retaining review context | **KEEP.** No editor-return affordance is assumed for an external recipient. |
| Share token | `/share/[token]` resolves published destination (`packages/dashboard/app/share/[token]/page.tsx:39`) | Redirects to published URL; password gate navigates to returned redirect URL (`packages/dashboard/app/share/[token]/password-gate.tsx:28`) | **KEEP destination semantics in navigation map.** No editor parent exists for recipient; preview/live promise is tracked once as IA002. |

## NAV-W01 — login gate drops dashboard handoff destination

**Severity:** P2. **Status:** VERIFIED by source; NOT RUNTIME VERIFIED after login.

**File / symbol:** `packages/dashboard/middleware.ts:109`, dashboard unauthenticated branch.

**Evidence:** A logged-out dashboard request redirects to plain `/auth/login` at line 110. It does not carry the original path or query, so `/dashboard/sites/:id?share=1`, workspace settings, media and agency destinations are not given to the login continuation. `/auth/login` can forward `returnUrl`/`next`, but only if supplied (`packages/dashboard/app/auth/login/page.tsx:15`). Without one, login proceeds to `/auth/redirect` (`packages/dashboard/app/auth/page.tsx:63`), whose workspace/onboarding branch determines a generic destination (`packages/dashboard/app/auth/redirect/page.tsx:24`).

**Expected / root cause:** An authentication detour should preserve the requested in-app destination. This producer omits the continuation parameter consumed by login.

**Affected modules:** Dashboard deep links, editor → dashboard handoffs, auth.

**CHANGE:** Carry the requested pathname/query through the existing returnUrl contract and verify the intended modal/section after login. Hash restoration requires a client-side strategy because fragments are not sent to middleware. No auth-security implementation advice is implied here.

## NAV-W02 — backup-code Back loses return context

**Severity:** P2. **Status:** VERIFIED by source; NOT RUNTIME VERIFIED.

**File / symbol:** `packages/dashboard/app/auth/2fa/backup/page.tsx:63`, “Back to code” link.

**Evidence:** The forward 2FA → backup link includes `token`, `remember`, and `returnUrl` (`packages/dashboard/app/auth/2fa/page.tsx:62`). Backup → code reconstructs only `?token=...`. The receiving code screen reads missing remember as false and missing returnUrl as absent (`packages/dashboard/app/auth/2fa/page.tsx:18`); success then selects `/auth/redirect` instead of the original destination at `:34`.

**Expected / root cause:** Switching verification method and returning should preserve the login flow's route/state. Reverse-link construction omits existing continuation fields.

**Affected modules:** Auth 2FA/backup, invited-user continuation, direct-editor continuation.

**CHANGE:** Preserve existing token/remember/returnUrl on the reverse link. Verify login → backup → Back → code success returns to the original site/invitation. This is a navigation issue, not a security finding.

## NAV-W03 — alternate login routes discard an existing return destination

**Severity:** P2. **Status:** VERIFIED by source for magic-link branch; NOT RUNTIME VERIFIED.

**Files / symbols:** `packages/dashboard/app/auth/page.tsx:222`, magic-link navigation; `packages/dashboard/app/auth/callback/page.tsx:30`, callback success.

**Evidence:** Main auth reads returnUrl and preserves it for password/OAuth, but its magic-link link is fixed `/auth/magic-link`. The switch is conditional: it appears only after `credentialError` and while not pending (`packages/dashboard/app/auth/page.tsx:212`), not on every initial login screen. Magic-link request success forwards only email to its sent screen (`packages/dashboard/app/auth/magic-link/page.tsx:23`); callback reads only token (`packages/dashboard/app/auth/callback/page.tsx:12`), sends 2FA only token at `:22`, or assigns `/auth/redirect` at `:33`. An invitation/editor deep-link continuation is therefore not carried by this alternate route.

**Expected / root cause:** Choosing another supported sign-in method should preserve the active destination; the alternate route uses a separate URL contract without that context.

**Affected modules:** Auth method switching, invitations, editor deep links.

**CHANGE:** Extend the continuation contract across the magic-link request/callback path and its 2FA branch. Coordinate with NAV-W01/W02 so remediation covers one coherent return-flow contract rather than separate UI patches.

## Deferred verification

Authenticated browser checks remain required for final hash scroll position, query-triggered modal close/reload behavior, auth detours, exact editor state on return, and whether workspace Library needs an editor jump. Public review/share token navigation needs legitimate fixture tokens. These are explicit verification limits, not permission/security findings. Existing IA002 and component cohesion findings are cross-references, not new duplicate issues.
