# Approved Site settings audit-gap repairs

Design output only, 2026-10-20. Figma `2L9OTGzBrL6kYmU18yA1c7`, page `3:7`. Existing roots changed: Languages S07 `238:11810`, Analytics AN01 `245:45159`, Security SH06 `245:49280`. New workspace roots occupy x20000–24680; the review outcome board is at x28000/y80.

The user's “ACHA KAROO ISKO” approved the audited gap repairs. The parent confirmed that Languages dirty Back/sidebar connections belong to this bounded Settings repair. New scope requires permission. B9/R1 interviews and onboarding remain pending. No application code, live settings write, organization navigation, or publish was performed.

## Completed scope

- **Languages:** Deutsch is explicitly chosen as the unsaved default; saved default is English. Save has pending, acknowledged and failure/retry fixtures. Discard changes only the staged default. Français removal remains immediate; Undo restores only Français and retains the Deutsch draft. A separate save branch after Undo preserves restored Français on success and failure.
- **Navigation:** Analytics sidebar destinations are wired. Security and Languages each have 13 named destination guards, pending saves and failures. Keep editing has default-focus treatment; Discard affects only the staged owner; a failed Save and leave stays on that owner and retries the same destination. Separate acknowledged destination companions preserve saved HSTS/default-locale values on return instead of landing in an older fixture.
- **Organization doors:** Members, Billing and Integrations have named, explicitly illustrative handoffs that retain the original settings draft. No external URLs are fabricated or opened. Permissions returns to the exact source.
- **Publish:** dirty settings use “Save settings first?” with Keep editing, Publish without these changes, and Save and continue. The resulting Publish tray remains over the settings screen. Excluded drafts are named and retained. The acknowledged branch includes saved settings. Whole-site confirmation and a pending publish job preserve the owner; closing a running task returns to the same settings with Publishing status and a reopen route. No timer claims a server result.

## Evidence and counts

158 new roots: 157 scenario roots and one explicit review outcome board. Current inventory contains 35,194 nodes and 599 destination links within those roots. The three repaired original roots contain 21 / 19 / 19 native actions respectively; those totals include retained actions.

Final structural scan: zero missing destinations, timed success transitions, horizontal text overflow beyond workspace-root bounds, or overlaps among the new roots. Screenshots inspected Languages dirty/restored-saved, Security guard, Publish guard/tray, Brand return, Languages navigation guard and acknowledged Analytics.

Independent `design_guard_reviewer` rechecked saved Security → Analytics and Forms → Security at 31536000 seconds, Languages guard/Back/failure retry, and saved Analytics → Languages with Deutsch. The sampled review passed after correcting the stale acknowledged-return routes. This is a bounded native-route and visual review, not whole-product verification.

Current complete IDs, original-root actions, structural findings, and acknowledged destination maps are in **`b8-20261020-gapfix-settings-final-ledger.json`**. Earlier initial route records inside that ledger are historical; `routes.acknowledgedMaps` and `audit` describe the final state.

Useful roots:

| Scenario | Node |
|---|---|
| Review service outcomes | `277:46436` |
| Languages save pending / saved / failed | `277:25315` / `277:25524` / `277:25733` |
| Default discarded; Français still removed | `277:25943` |
| Français restored, Deutsch still staged | `277:26152` |
| Save after Undo: pending / saved / failed | `277:107093` / `277:107302` / `277:107511` |
| Security saved HSTS 31536000 | `277:26371` |
| Security → Analytics guard / pending / failed | `277:34044` / `277:34288` / `277:34535` |
| Security acknowledged Analytics / Forms | `278:63294` / `278:63547` |
| Languages → Analytics guard / pending / failed | `278:72993` / `278:73212` / `278:73434` |
| Languages acknowledged Analytics / Forms | `278:66172` / `278:66425` |
| Languages Back guard | `278:76663` |
| Security Publish guard / excluded draft tray / included saved tray | `277:44524` / `277:42403` / `277:43486` |
| Languages Publish guard / excluded draft tray / included saved tray | `277:41731` / `277:39946` / `277:40858` |

Authoring sequence: `b8-20261020-gapfix-settings.js`, `b8-20261020-gapfix-settings-continuity.js`, `b8-20261020-gapfix-settings-returns.js`, and the root placement correction `b8-20261020-gapfix-settings-layout.js`. The first three prepend `continuation-helpers.js` with page `3:7`, x-origin 20000 and y-origin 80. Grid offsets are 0, 84 and 100 respectively; the placement correction separates the five continuity roots from the enlarged review board. These are authored evidence scripts, not instructions to duplicate completed frames.

## Explicit limits

Actual persistence, revision-conflict handling, server acknowledgments, keyboard/focus behavior, accessibility and full prototype playback remain unrun. Service outcomes are selected from the review board. Organization handoffs are design-only. These settings-origin Publish fixtures stop at the running job and do not duplicate every existing publisher success/failure/recovery variant. Arbitrary combinations of edits across different owners are not simulated.

Forms and Review are owned by the main agent and were still undergoing their separate final validation when this handoff was written. Forms acknowledgment companions clone the current rebuilt S13; this packet does not claim acceptance of the whole Forms or Review module. No whole-product 100% completion claim is made.
