# Phase 1 — Product structure and ownership audit

Date: 2026-09-25. Baseline: `69a88e0b145dc4e52ff0fdf3578391b448c514ac` plus the pre-existing working tree. Audits 1–7 are complete as scoped in their individual reports. This is not a whole-repository line-by-line review, release gate, security assessment, or claim that authenticated/multi-user behavior works.

## Audit completion

| Audit | Deliverables | Coverage status |
|---|---|---|
| 1 — Information architecture | `phase-1/01-ia-product.md`, `01-ia-collaboration.md`, `01-ia-backend.md`, `01-ia-consolidated.md` | Ownership and product decisions reconciled; R1/R9 verify competing AI surfaces in the local demo. Authenticated behavior not verified. |
| 2 — Module cohesion | `02-module-cohesion.md`, `02-backend-cohesion.md`, `02-collaboration-cohesion.md` | Compared module intent/handler/outcome; runtime mostly unverified. |
| 3 — Navigation | `03-navigation.md`, `03-collaboration-navigation.md`, `03-workspace-navigation.md` | Local demo verifies Settings return (R4), closed-panel shortcut (R5), issue-row dismissal (R8), and pre-login redirect loss (R7). Login completion remains unverified. |
| 4 — Surface orchestration | `04-surfaces.md`, `04-collaboration-surfaces.md`, `04-overlay-orchestration.md` | Surface owners and close contracts traced. Conflict-modal Escape ordering OVR-W01 remains a partial source risk pending reproduction. |
| 5 — Search | `05-editor-search.md`, `05-global-workspace-search.md`, `05-collaboration-search.md` | Search owner, datasets and query/pagination contracts traced. R10 covers narrow local palette/Add smoke cases; dashboard/auth search not runtime tested. |
| 6 — Interaction architecture | `06-editor-interactions.md`, `06-workspace-interactions.md`, `06-collaboration-interactions.md` | UI-to-handler/API/state plus error/cancel paths traced. Remote failures, destructive writes and competing-user flows not induced. |
| 7 — Collaboration product architecture | `07-live-collaboration.md`, `07-review-workspace.md`, `07-ownership-reconciliation.md` | Capability and ownership maps reconcile comments/review, membership/share, versions/activity, saves/undo/publish and conditional live collaboration. All multi-user/deployment outcomes remain NOT RUNTIME VERIFIED. |

## Highest-priority verified blockers

1. **P1 — Full Media cannot compile in this working tree.** A literal `<<<<<<< HEAD` is present at `src/editor/media/LibraryManager.tsx:870`; Vite reports a parse failure and Manage assets shows an error fallback (R6). The marker was already in the staged diff captured at audit start. This blocks full-library browser verification. It is not evidence of a deployed production crash. Resolve only after reviewing and preserving the staged conflict contents.
2. **P2 — High-confidence UI failures.** Two AI entry paths open separate sessions and the inspector AI route remains off-screen when Inspector is hidden (IA-001, R1/R9); returning from Site Settings resets Pages to Add (NAV-01, R4); opening an already-closed panel by its letter shortcut leaves it invisible (NAV-02, R5); an Issues row closes the overlay without opening its target (NAV-C02, R8); dashboard Pages scope cannot satisfy its own data gate (SRCH-W01, source); Review resend rejection has no visible failure state and Compare treats failed current export as an empty site (CI-01/02, source).
3. **P2 — Dataset/intent limits.** Dashboard Media Load more eventually exceeds the validated limit and Name sort orders only the loaded subset (SRCH-W02/03); Team list/global search cap retrieval at 20/10 despite the supported 25-member plan (SC-C01/03); Activity and full Notifications destinations return fixed recent windows without continuation (SC-C02). Each source finding includes dataset preconditions and is not runtime verified.

## Consolidated finding ledger

The specialist IDs below are retained to preserve source references. Repeated evidence is one issue where noted. “Source” describes code evidence; it does not imply a tested production outcome.

| Consolidated item | Priority / classification | Audit disposition and current status |
|---|---|---|
| Existing staged `LibraryManager.tsx:870` merge marker | P1 working-tree blocker | Parse failure reproduced locally (R6); pre-existing staged content. Resolve carefully before Full Media testing. |
| IA-001 — AI destination/session/visibility | P2 confirmed source; demo runtime | One canonical destination and session owner; verified R1/R9. |
| IA-002 = IA-C01 = COH-BE-03 — preview/draft share wording reaches published-site link | P2 source | Define the promised share scope, then align handoff/copy. Authenticated route NOT VERIFIED. |
| IA-003 — Brand component summary versus Components ownership | P2 product decision | Decide whether Brand shows/manages reusable definitions; no silent module move. |
| IA-004 — conditional Brand AI schema output application owner | P2 product decision | Decide destination/preview-only contract before implementation. |
| IA-005 = IA-PROD-04 + IA-C02 — Review placement | P2 product decision | Decide site Review placement; current Review/comment ownership is mapped. |
| IA-006 = IA-C03 — Mentions filter taxonomy | P2 confirmed source | Filter is security/account/billing notices, not comment mentions. Align label/filter semantics; structured mentions are absent from traced contract. |
| COH-01 — Quick/Full alt-text generation contracts | P2 source | Unify metadata/provenance contract while keeping distinct contexts. Provider behavior was not invoked. |
| COH-02 — duplicate Undo palette rows | P3 source + demo visibility | Merge the two same-handler rows; no Undo operation was executed. |
| COH-BE-01 — workspace theme payload vs Brand tokens | P2 product/data contract decision | Clarify whether theme distribution shares canonical Brand tokens or a distinct style-rule model. |
| COH-BE-02 — workspace component rename/delete vs editor definition hydration | P2 partial source | Reproduce rename/delete then reopen/update before designing reconciliation; resurrection not established. |
| CO-C01 — internal admin and external reviewer share review-round wording | P2 product decision | Clarify audience language/round lifecycle; shared record alone is not duplicate ownership. |
| NAV-01 — Settings loses previous left-tab context | P2 source + demo | Preserve previous tab or define a deliberate destination. R4. |
| NAV-02 — panel shortcut does not reopen closed drawer | P2 source + demo | Ensure shortcut reveals requested panel. R5. |
| NAV-C01 — consumed Compare request can persist/replay | P2 candidate, source mechanism | Reproduce deep-link → Back → other tab → plain Review and same-tab re-entry before changing persistent subtab state. |
| NAV-C02 — Issues row dismisses without target navigation | P2 source + demo | Give known token findings a typed Brand destination; do not treat issue IDs as element IDs. R8. |
| NAV-W01/W02/W03 — auth continuation lost by middleware, 2FA Back, and conditional magic-link branch | P2 source; redirect start demo verified | Remediate as one return-context contract, test post-login destination with authorized local account. Successful login not performed. |
| OVR-W01 — async conflict modal outside shared overlay Escape ordering | P2 partial candidate | Reproduce shared dialog → conflict event → Escape before any fix. Do not alter valid nested modal behavior without evidence. |
| SRCH-E01 — Full Media says all folders while current-folder filter stays active | P2 source; runtime blocked | Decide global vs current-folder query and align result scope/copy. |
| SRCH-W01 — dashboard Pages palette scope unreachable | P2 source | Align query/display gate for existing Pages chip; do not imply title/content search. |
| SRCH-W02/W03 — dashboard Media bounded Load more and loaded-subset Name sort | P2 source, large-result preconditions | Replace rising-limit paging with cursor; define and implement list-wide or explicitly scoped sorting. Shared regression test should use >192 and >24-result cases respectively. |
| SC-C01/SC-C03 — Team roster page and palette stop at20/10 | P2 source, supported-plan precondition | Add complete/paged roster and server-side name/email matching before result cap. Coordinate shared Team API/UI. |
| SC-C02 — Activity/full inbox fixed-window feeds | P2 source | Add continuation/total or make recent-window promise explicit and provide history destination. Quick previews remain intentionally bounded. |
| INT-E01 — Pages Cmd/Ctrl+K opens global and page palettes | P2 source, runtime pending | Reproduce with Pages active; establish one shortcut owner/precedence. |
| INT-E02 — global editor shortcuts while full-page workspace hides canvas | P2 candidate, runtime pending | Verify safe disposable history action in Settings/Full Media; define shortcut suspension/ownership. |
| INT-E03 — Media bulk move lacks rejection/partial-result feedback | P2 candidate, source | Handle Promise.all partial success and retry/selection state; inspect existing manager error events first. |
| INT-E04 — page-delete toast Undo calls generic current history entry | P2 candidate, runtime pending | Reproduce delete → another edit → click old toast; make promised undo operation-specific or constrain the affordance. |
| INT-W01 — dashboard copy controls show success before clipboard promise resolves | P3 source | Tie feedback to clipboard success/rejection. Clipboard denial not induced. |
| INT-W02 — filtered/paged site selection remains actionable across results | P2 product semantics decision | Decide page-local vs cross-result selection and make scope explicit; no bulk operation run. |
| CI-01 — Review resend rejection lacks visible failure state | P2 source | Catch rejected mutation, preserve context and offer retry; mail-delivery failure after creation stays distinct. |
| CI-02 — Compare export failure is treated as empty current site | P2 source | Add current-export error/retry state; distinguish actual empty project from failed read. |
| Audit 7 decisions D7-01..04 | Product/release decisions | Comment-to-round association, Activity event/retention contract, role workflow vocabulary, and collab readiness gate. No new defect ID. |

## Fix Batch A draft

`FIX-BATCH-A.md` turns this ledger into small implementation slices, affected files, dependencies and verification targets. It separates confirmed changes from source candidates that must reproduce and product decisions that need an owner. No production remediation is claimed or started.

## Verification and limits

- Existing focused suites: 18 files run; 200 tests pass and 3 stale CommandPalette assertions fail (V-006). Failures expect 21 commands/current “Open Insert panel”; source currently renders 23 and “Open Add panel”. No test/source was edited to mask this baseline mismatch.
- Browser R1–R10 used the standalone local Vite editor demo in an isolated context. These checks do not establish authenticated Next-host, API, persistence, or multi-user behavior. Dashboard login was not completed.
- Full Media browser paths remain blocked by the pre-existing staged parser marker. No invite, publish, delete, model generation or collaborative write was sent.
- Initial staged/editor media files, root workspace config, pre-existing audit assets and screenshots remain preserved. No production code has changed as part of this audit.
- Approval gate: the supplied playbook §29 requires approval of the concrete batch before code changes. Batch A is a proposal; Phase 1 audit completion is not implementation approval or release sign-off.
