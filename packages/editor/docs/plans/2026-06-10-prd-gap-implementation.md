# PRD Gap Implementation — Tracker (2026-06-10)

Source: 10-module fable gap audit vs `docs/prd/Module*.md`. Status legend: ☐ todo · ◐ in progress · ☑ done.

## Tier A — BROKEN / silent no-op / data-loss (code-only, ship now)

Done: A1 ✅ A2 ✅ A3 ✅ A4 ✅ A5 ✅ A6 ✅ A7 ✅ A11 ✅ A12 ✅ (7 commits 25125900..c9152111, full suite green). A8/A10 touch server/dashboard files modified by an in-flight auth arc — skipped to avoid commit entanglement. A9 (mount editor onboarding) pending — runs on every editor load, needs care. Custom-CSS per-element section (devMode-gated) deferred — needs a real "Developer mode" toggle decision (clutter risk for non-coder audience).

- ☑ **A1 (P0) Cross-site version bleed** — `VersionTimelineManager.projectId` hardcoded `"default"` (`engine/VersionTimelineManager.ts:56`), `setProjectId` zero callers. Restoring a version imports ANOTHER site's content; autosave persists it. Fix: call `versions.setProjectId(siteId)` + `components.setProjectId(siteId)` on load in `useComposerInit`.
- ☐ **A2 Inspector transform clobbering** — `EffectsSection.tsx` transform sliders each write a single-function value → setting rotate wipes scale. Compose translate/scale/rotate/skew into one transform string.
- ☐ **A3 Inspector filter clobbering** — same in filter sliders (blur wipes brightness). Compose filter functions.
- ☐ **A4 Group/Ungroup dead menu** — `standaloneActions.ts` emits `elements:group`/`elements:ungroup` with zero listeners. Implement handlers or remove the menu items.
- ☐ **A5 Custom CSS pipeline dead** — `projectSettings.customCode.globalCss` consumed by nothing. Inject `<style>` in canvas + export head + add to BuildrikSyncProvider patch.
- ☐ **A6 Component instances don't survive reload** — `componentInstance` written to element data, never read back. Rehydrate instance map on project load.
- ☐ **A7 Inspector margin/padding "link all" dead** — `setMarginLinked`/`setPaddingLinked` never called; no toggle UI. Wire the link toggle.
- ☐ **A8 Avatar upload silent no-op** — `profile-form.tsx` previews but `settings/page.tsx` never passes `onAvatarUpload`. Wire persistence.
- ☐ **A9 Editor onboarding unmounted** — `useOnboardingOrchestrator` + WelcomeModal/Checklist (~1200 LOC) zero consumers. Mount it (or delete per no-dead-code).
- ☐ **A10 Team-activity widget empty** — `getTeamActivity` filters on `MEMBER_INVITED/JOINED/REMOVED/ROLE_CHANGED` actions never written. Record them in team.service.
- ☐ **A11 Zoom-to-Fit Cmd+1 conflict** — bound to device-desktop; no fit math. Rebind + implement fit-to-content.
- ☐ **A12 Grid/Ruler toggles unreachable** — `toggleOverlay("showGrid")` no call site; `showRulers` never passed. Wire footer toggles.

## Missing inspector controls (registry defs existed, no rendered control) — shipped

- ☑ box-sizing (layout), select-options editor, transition-delay, text-shadow, will-change (effects)
- ☑ word-spacing, text-indent, vertical-align (typography), background-blend-mode (visual)
- Each updates the section's `styleKeys` (enforced by registry.styleKeys exhaustiveness test).
- Verified non-gaps (audit false positives): grid justify-items/align-items already editable via AlignmentGrid.
- Remaining niche/low-value: border-image, background-origin/clip, animation-direction/fill-mode/play-state, multi-stop gradient, multi-shadow list. Long tail.

## Tier B — UI missing for shipped backend

- ☐ B1 Transfer-ownership UI (backend done) — dashboard, in-flight-arc files
- ☐ B2 Email-change UI (backend done) — dashboard, in-flight-arc files
- ☐ B3 Save-as-custom-template wiring (`openSaveTemplate` zero callers)
- ☐ B4 CMS records management UI (engine CRUD orphaned) — large
- ◐ B5 Multi-select: duplicate ✅ (commit). copy/cut/paste deferred (clipboard-array refactor)
- ☑ B6 Heading H1–H6 level switcher (commit). select-options editor still TODO

## Tier C — Missing backend / infra (needs product/infra decision — NOT auto-built)

- Real-time collaboration server (WebSocket transport) — entire §2 of Module 6
- Server-side CMS (Prisma + tRPC) — Module 4 backend
- Server-side version persistence — Module 9 §7
- Analytics ingestion (write path) — Module 5 §2
- AI site-generation worker — Module 7 (queues forever)
- Custom-domain serving + SSL provisioning — Module 5 §3
- Branded free subdomain hosting — Module 5 §1

## Notes
- Backend for text-AI, publish, auth, team, settings persistence is REAL and working.
- Many "scaffold" items are 1 wire from done; Tier A captures the highest-impact of those.
- Tier C items are genuine multi-system builds; surface to user, don't loop-build blind.
