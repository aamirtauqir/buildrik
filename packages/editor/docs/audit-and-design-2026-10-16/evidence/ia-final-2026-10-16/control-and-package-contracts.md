# Detailed shared contracts — FD-IA-09

Selected design, 2026-10-16. Incorporated into [the remaining IA handoff](../../REMAINING-IA-HANDOFF.md). Existing source behavior is labelled S; new behavior is P. These tables complement IAF-01–23, not a separate roadmap. All service and application acceptance below is **NOT RUN**.

## ACC-01 — Action-level access

S: `src/services/RoleService.ts`, `../../server/trpc/guards.ts`, `../../server/services/permission.service.ts`, routers `sites.ts`, `reviews.ts`, `comments.ts`, `site-version.ts`, `activity.ts`, `cms.ts`, `forms.ts`, `media.ts`, `site-component.ts`. Role names alone do not bypass active membership, site assignment, effective overrides, resource access, plan or server flags. EDITOR and DESIGNER share the editing tier. OWNER satisfies ADMIN operations subject to actual ownership checks.

| Action | Current source boundary | Selected UI contract |
|---|---|---|
| Read site, Activity, saved versions, scheduled-publish status | Authorized active site access, including VIEWER | Keep accessible sections; do not infer mutation permission |
| Save document; create/rename/delete saved version; restore draft | EDITOR-equivalent write permission | Viewer can inspect allowed versions, cannot restore or write |
| Site comment read/create | Authorized site access, including VIEWER | Separate comment capability from review-round access |
| Resolve/reattach comment | EDITOR+ | Readable thread with unavailable mutation explanation |
| Review status/rounds/approved snapshot; send/revoke review | EDITOR+ with applicable agency availability | Same policy at button, shortcut and deep link; revoked/stale round rechecked |
| Resolve internal review queue | Workspace ADMIN+ plus agency layer | Do not expose approval as a generic site-editor action |
| Client review credential disclosure | ADMIN+ | Read round metadata without exposing credential to lower role |
| Public client approval | Valid scoped review credential and server lifecycle checks | Distinct client flow; possessing site Viewer role does not mint this credential |
| Normal publish | EDITOR+ plus review/approval and connection checks | Confirm exact destination/revision; recheck server-side |
| Schedule/cancel scheduled publish | EDITOR+ | Preserve existing schedule flow; name timezone/instant and server date validation; approval rechecked at execution |
| Published history/diff/snapshot | EDITOR+ | History Published restriction does not block accessible Saves/Session |
| Republish previous release / unpublish / cancel active job / stale-approval override | ADMIN+ | Separate confirmations; rollback does not restore the editor draft |
| Collaboration stream/operations | EDITOR+ plus server collaboration flag | Presence/read-only mode does not imply authorized operations |
| CMS reads / mutations | Site access / EDITOR+ | Field/record/collection actions have individual receipts |
| Assets | Personal resource ownership; site-associated writes also EDITOR+ | Do not infer team access from workspace Components decision |
| Form block reads, submission list/export | Site access at endpoint | Current Site settings Forms screen is EDITOR-gated; preserve this UI policy, disclose the separate endpoint policy rather than silently changing grants |
| Submission read/spam/archive updates and permanent deletion | EDITOR+ | Mutations require confirmed result; delete explicit/no Undo |
| After-submit settings except notification recipient | EDITOR+ | Immediate server setting outside document Undo; incomplete redirect draft retained |
| Actual notification-recipient change | ADMIN+ | Disabled Send to with reason for editors; unchanged value is not a forbidden mutation |
| Local component writes/adoption | EDITOR+ | Keep local authoring and instance operations |
| Existing workspace component rename/delete | ADMIN+ | Preserve global-management boundary |
| Proposed library create/import/adopt/export and revision publish | P: see PKG-01/IAF-11 | New endpoints must implement specified resource and dependency ACL; existing UI is not authorization |

UI states: Checking access; Could not verify access → Retry; Restricted → actual reason; Available. Unknown does not become Editor or Viewer. A feature disabled by server is not enabled by a defaulted shortcut. Permission loss keeps recoverable drafts and stops new mutations. Never expose inaccessible resource names/usages while explaining restrictions.

## SET-01 — Site settings save model and scope

S: `src/editor/sidebar/tabs/settings/constants.ts`, `SettingsTab.tsx`, screen components. Reuse these screen writers and validators. Relocation to the labelled topbar entry does not introduce a universal save transaction.

| Screen / source component | Current UI minimum | Commit and scope | Preserved controls / key behavior |
|---|---|---|---|
| General / SiteSettingsScreen | ADMIN | Footer save; publish-required output settings | Site name, author, favicon/touch icon and URL, language, site URL slug; custom/legacy values retained |
| Languages / LocalizationScreen | ADMIN | Default locale footer; locale rows immediate | Existing locale IDs, enabled locales, translation/checklist paths; no automatic regional-code re-keying or translation promise |
| SEO / SeoScreen | ADMIN | Footer; next publish | Site title/description/OG defaults, canonical URL, indexing, robots; page overrides remain separate |
| Domains / DomainsScreen | ADMIN | Immediate live operations | Add/verify/remove, primary domain, DNS records/copy/verification statuses; no footer Saved claim from DNS request |
| Redirects / RedirectsScreen | EDITOR | Immediate persisted rules; next publish for output | Create/edit/delete, existing Undo, CSV import, suggestions; preserve path/type/URL validators |
| Access / AccessScreen | ADMIN | Footer; output applies on publish | Plan restriction, set/change/remove password; never display secret or confuse blank with unchanged |
| Analytics / AnalyticsScreen | EDITOR | Footer; next publish | GA/GTM/Meta/Clarity enable and IDs; syntax validation versus actual provider connection status separate |
| Form submissions / FormsScreen | EDITOR UI; endpoint policy ACC-01 | Immediate live service operations | Form selection, pagination, detail, read/spam/archive, site-wide Export CSV, confirmed permanent deletion; proposed Spam/Archive views provide Unspam/Unarchive |
| Custom code / AdvancedScreen | ADMIN | Footer; next publish | Head/body scripts and global CSS; preserve raw valid input, explicit unsupported/security checks; no preview-execution promise |
| Security headers / HeadersScreen | ADMIN | Footer; next publish | CSP/frame/referrer/HSTS/permissions policy; keep unknown valid existing values and custom HSTS duration |
| Danger zone / DangerZoneScreen | OWNER | Immediate lifecycle action | Existing archive/delete/reset-like actions only where implemented; exact object, consequence, recovery and server confirmation |
| Brand | Actual Brand capability | Door to Brand; Composer live edits | NAV-01 return, not duplicated settings values |
| Members / Billing / Integrations & webhooks | Destination policy | Dashboard new-tab doors | Existing `/dashboard/settings/team`, `/dashboard/settings/billing`, `/dashboard/settings/integrations`; keep editor draft |

For each footer screen: draft typing → field validation → Save settings → service acknowledgement → publish-required status. Failed save or discard keeps the current screen. Immediate rows show independent pending/success/failure receipts; leaving does not undo a completed live operation. No new numeric/string bounds replace current canonical schema validators.

## FORM-01 — Server settings inside the contextual Inspector

S: `FormAfterSubmitSection.tsx`, `../shared/schemas/forms.ts`, `../../server/trpc/routers/forms.ts`. The primary location remains Inspector → Behaviour → After submit, but **the canonical owner is server FormBlock `(siteId, blockId)`**, not the document element. This is a useful example of location and persistence being different.

- Then: Show message (`MESSAGE`) or Redirect (`REDIRECT`). Action and redirect URL form one invariant and save together. Selecting Redirect without a valid URL remains an incomplete draft; no premature request or success.
- Message: ≤500 characters; empty stored value differs from the displayed placeholder. Redirect to: existing safe relative/absolute URL validator. Send to: email or empty/unset, ≤320, actual change ADMIN+; untouched field is not a mutation.
- Spam protection: boolean, EDITOR+. Inputs commit via current blur/selection behavior with captured site/form identity; recheck stale target and serialize concurrent updates so an older response cannot revert a newer edit.
- Status: Loading, Saving, Saved to site, Failed/Retry, Restricted. Show “Saved to your site directly — outside document Undo.” On failure preserve a recoverable input draft while showing confirmed server value; do not silently discard the user's attempt.
- Duplicate/import allocates a new form element ID and remaps internal references. Preserve suitable field names and authored markup, but do not clone submissions, notification recipients or backend credentials. New form setup is explicit. Navigation/editing preserves the existing ID.
- Inbox Export CSV explicitly exports the site's submissions under the existing behavior; its label cannot imply only the current page/filter unless the request actually implements that filter. Export initiation is not file-retention proof. Permanent Delete names the submission and has confirmation/no Undo. Proposed Spam/Archived views expose Unspam/Unarchive using existing reversible flags.

Acceptance T-FORM01: linked redirect draft and field race; recipient denied versus unchanged; server acknowledgement distinct from Composer save; new copied form ID; CSV scope; delete cancellation/failure; reversible spam/archive states.

## PKG-01 — Editable component package

**P: new capability and engineering contract.** User approved Buildrick component packages and import/export inside the Editor. HTML/CSS conversion is not this format. Manager: Add → Saved components → Manage components. Export/import never publishes the website.

### Identity and format

Use `.brcomponent`, a ZIP containing UTF-8 `manifest.json`:

```json
{
  "format": "buildrick-component-package",
  "schemaVersion": 1,
  "packageId": "package-local-unique-id",
  "createdAt": "ISO-8601 UTC timestamp",
  "exporterVersion": "supported-buildrick-version",
  "roots": ["definition-key"],
  "definitions": [],
  "resources": [],
  "references": [],
  "requiredFeatures": []
}
```

Definitions contain package-local key, name, complete supported master tree, metadata, variants/default variant/variant properties, dependency keys and stable definition-node keys. Resources contain local key, kind, relative entry path, media type, byte size and SHA-256 hash. References contain source owner/node/property, target key, expected compatible type and whether required. Binary/text entries are hashed; validate bytes before registering them. Library/revision/source IDs may be provenance only; they never authorize access or overwrite a destination identity.

Proposed launch budgets: archive≤50 MiB; expanded≤100 MiB; aggregate JSON≤10 MiB; ≤100 definitions including dependencies; ≤10,000 element nodes total; depth≤64; ≤1,000 entries. Enforce any tighter current site/media capacity. The current UI's 100-component ceiling is not established as a server invariant; server enforcement and performance fixtures are required before release. Limits are selected budgets, not measured engine capacity.

Reject unsupported schema/required feature, malformed JSON/UTF-8, invalid/prototype keys, duplicate entries, absolute/traversal paths, inconsistent hashes/sizes, invalid references and cyclic component dependencies before mutation. A ZIP must never create arbitrary filesystem paths. Unknown optional inert metadata is retained; unknown consequential behavior blocks the affected root.

### Portable content and references

| Content | Contract |
|---|---|
| Native editable tree/styles | Preserve compatible attributes/content, responsive and pseudo-state rules, supported overrides/variants; no flattening to screenshot |
| Identity | Allocate fresh destination component/element IDs on file import; consistently remap HTML id, label `for`, ARIA ID references, anchors, selectors and interaction targets. Shared-library adoption instead pins the existing authorized identity/revision |
| Classes/tokens | Include closed supported dependency/alias graph. Copy new by default; explicit mapping only to compatible destination resources. Same name is not same identity |
| Media/fonts | Include authorized bytes via existing ingestion/validation. Missing/inaccessible required bytes block portability or require explicit destination mapping; no temporary URL masquerading as portable data |
| CMS | Carry collection/field type requirements; map to compatible destination identities. No records included. Missing required binding blocks root until mapping; optional fallback only explicit and previewed |
| Forms | Authored markup preserved; new destination service setup. No submissions, recipient configuration, provider credentials or secrets |
| Commerce | Map to a compatible destination product/catalog; otherwise block affected root. Do not invent a supported checkout provider |
| Scripts/global CSS/runtime | Block arbitrary scripts, unscoped global CSS and unsupported required runtime dependencies; do not silently strip then call the import complete |

General name: trimmed1–200 characters; editable collision-free suffix. Incoming name/ID never overwrites or links implicitly. A package can contain1–100 selectable roots; selected roots plus all automatically included transitive definitions must fit the100-definition budget. Initial export is one named master plus complete supported dependency graph.

### Export workflow

Select master/revision → Export component → dependency/permissions check → summary of included resources and blocked dependencies → Download package. Export is read-only and does not change adoption/version/Undo. Show generated/download started; the browser cannot confirm the user retained a file. Cancel before generation stops work; failure retains the selection and gives a concrete unsupported/resource-access reason.

### Import workflow, states and commit

Import → select one file → parse/validate → select roots → confirm workspace/site → resolve dependencies → review fresh names, resource creation, shared scope and capacity → Import components → durable receipt → optional Insert on page.

States: empty file input, validating, invalid/unsupported, blocked dependency, ready, staging uploads, committing, completed, cancelled, failed, interrupted/unknown outcome, resuming. Replacing a file before commit discards only that job's draft and remappings, after confirmation if useful. File selection is keyboard/native accessible. Errors link to root/dependency; focus first actionable error, not an inaccessible hidden tree node.

Stage assets/definitions invisibly under durable job ID. Required assets pass validation before commit; publish complete root/dependency/adoption visibility atomically. A storage upload may precede the database transaction, but incomplete definitions cannot appear in the library. Record job-owned temporary resources for cleanup. Retry uses job ID + package hash + target + mapping hash; repeated response loss cannot duplicate definitions. Existing optimistic mirror events are insufficient for this contract.

Before commit, Cancel publishes nothing and cleans only unused resources owned by that job. During commit, Close is navigation; show a durable running receipt. On ambiguous outcome, reconcile job before retry. Receipt reports committed, pending and failed items accurately. Dependency mutation or permission/capacity loss requires revalidation; no partially visible component graph.

Postcommit “Undo import” is available only when revision/usage checks prove original state can be restored. Otherwise show Review imported resources and explicit conditional removal. Never remove mapped/reused dependencies or break instances already inserted by another operation. Insertion is a separate document transaction; failed insertion does not claim library import failed.

### Permission, lifetime and migration

Workspace resource identities and immutable revisions are independent of the origin site's lifetime. Site adoption pins a revision. EDITOR/DESIGNER with destination edit access may create/import new independent definitions, adopt/insert and author site-local drafts. ADMIN/OWNER additionally publish another revision of an existing workspace identity and rename/delete that identity. Export requires source resource plus dependency access; a site/page master requires source-site EDITOR-equivalent, a published workspace master requires workspace EDITOR-equivalent plus resource/dependency authorization. All endpoints recheck; explicit sharing grants access to the reviewed snapshot, never the source site itself.

Workspace delete is a discovery/adoption tombstone; existing pinned revisions remain renderable. Source-site deletion cannot erase the published revision. Site-master deletion materializes exact supported instance results before detach. Recovery includes variants, overrides, instance records and references; it is not generic document Undo.

Legacy `(workspace, componentId, payload hash)` groups: identical snapshots may map to one revision; divergent same-ID payloads remain distinct, accessible preserved snapshots until explicit reconciliation. Never pick a timestamp winner. Migrate local cache from ID-only to `(siteId, componentId)` plus revision cache. Positional overrides migrate only when semantic target correspondence is provable; ambiguous targets require update review. New variant authoring is explicitly deferred until these identity/update/output prerequisites pass; selection and all stored variant data remain.

### T-PKG acceptance — implementation requirements

1. Same-workspace reuse A→B; other workspace/private source blocked; explicit shared snapshot remains usable after origin-site deletion.
2. Same-ID legacy site caches remain distinct; divergent payloads preserved.
3. Fresh import IDs consistently remap labels/ARIA/anchors/selectors/interactions and nested component references.
4. Duplicate/export/import retain responsive rules, variants/default, overrides and inert metadata.
5. Corrupt/traversal/duplicate/hash/oversize/unsupported/cyclic packages fail before visible mutation.
6. Each required CMS/media/font/token/catalog dependency maps compatibly or blocks its root; no silent flattening.
7. Cancel before commit exposes no definitions; cleanup never touches reused resources.
8. Interruption/retry/duplicate acknowledgement reconciles one job without duplicate library entries.
9. Permission/capacity/source revision changes during review force revalidation.
10. Postcommit removal respects newly created usages and shared dependencies.
11. Import success plus insertion failure has two truthful receipts; document Undo removes insertion only.
12. Keyboard/focus/short viewport/large package progress and proposed resource budgets verified in implementation.
