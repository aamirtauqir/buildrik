# Templates + Media Shell — Parity vs prototype-v3 (focused post-arc)

Scope: only the 3 surfaces actually changed by the 2026-05-11-templates-media-new-design-shell.md plan execution. Full 22-section audit deferred.

Plan execution arc shipped in 5 commits:
- `673ed64e` — flip tabsConfig templates+assets to panel mode (320px)
- `680575eb` — Templates IA reshape (industry pills → page-type IA)
- `c1bd4202` — SlimLauncher wired in panel mode + missing CSS authored
- `e80b7cb7` — dashboard CORS headers + OPTIONS preflight
- `f9675906` — DialogTitle a11y on 3 modal sites

Live screenshots in `/tmp/buildrik-compare/`.

---

## S1 — Templates default (panel mode at 320px)

Reference: prototype-v3 S1, "All / Site Pages / Sections / My Templates" IA.
Live capture: `task3-templates-320.png`.

| Element | Match | Notes |
|---|---|---|
| Header "Templates" + search + close | 100% | Single row, 48px height, ghost icon buttons |
| Top-level IA pills | 100% | All (active cobalt fill) / Site Pages / Sections / My Templates — wrap cleanly to 2 rows on 320px |
| Card grid columns | partial | Live = 1-col via `repeat(auto-fill, minmax(130px, 1fr))`; prototype shows 2-col. At 256-272px inner width, 2*130 exceeds available width so falls to 1 col. Cards are still visually large + product-grade. **Action: ship as-is.** Switch to explicit `1fr 1fr` only if user feedback flags density. |
| Card content | 100% | Thumb + name + category meta |
| Pagination | 100% | Visible at bottom when result set > page size |

**Verdict: ship as-is.** Drift on column count is acceptable; no CSS change required.

---

## S2 — Templates inline detail (drilled-in state)

Reference: prototype-v3 S2, breadcrumb back-link + preview card + dual CTAs.
Live capture: `task8-templates-s2-detail.png`.

| Element | Match | Notes |
|---|---|---|
| Breadcrumb "← Back to grid > site-pages" | 100% | Left-aligned, small caps category chip on right |
| IA pills preserved during drill | 100% | All / Site Pages / Sections / My Templates remain visible above detail |
| Preview thumb | 100% | Aspect-correct dark thumbnail, full panel width |
| Title + description | 100% | 18px bold name, 13px muted description |
| Primary CTA "Apply to Current Page" | 100% | Cobalt filled, full-width, 40px height |
| Secondary CTA "Add as New Page" | 100% | Outline cobalt, full-width |
| Optional ghost CTA | not verified | Bottom of detail trimmed in capture; needs scroll-state screenshot to confirm |

**Verdict: ship as-is.** Detail-panel grid hide (`.tpl-content-inner--with-detail .tpl-grid-area { display: none }`) works correctly at 320px.

---

## S10 — Media slim launcher (panel mode at 320px)

Reference: prototype-v3 S10, recent strip + quick search + upload + maximize.
Live capture: `task4c-media-slim-styled.png`.

| Element | Match | Notes |
|---|---|---|
| Header "Media" + 3 ghost icon buttons | 100% | Upload / Maximize2 / Close, 28px each, transparent → hover subtle bg |
| Search faux-input "Search media… ⌘K" | 100% | Click-to-focus opens fullpage library with prefill (Path 3) |
| Empty state (library empty) | 100% | Title "Your library is empty" + helper copy + cobalt "Open library" CTA |
| Recent strip | not exercised | Library was empty during capture; CSS authored for 3-col grid `repeat(3, 1fr)` ready for first uploads |
| Drag overlay | not exercised | Authored at `.sl-drag-overlay`; behavior gated on `dragOver` state |
| Footer "Open library" (when recents present) | not exercised | Visible only when `recent.length > 0` |

**Verdict: ship as-is.** Three unexercised surfaces (recent strip, drag overlay, footer) are CSS-authored and gated on data state — manual smoke once user uploads first asset.

---

## Cross-cutting fixes

| Fix | Verified | Notes |
|---|---|---|
| `media.checkStorageQuota` CORS | code-only | Dashboard server not running locally. Code clearly correct: `corsHeaders(req)` returns `Access-Control-Allow-Origin: <origin>`, `Vary: Origin`, plus OPTIONS preflight handler. Production rollout requires editor prod URL in `EDITOR_ORIGIN` env. |
| Radix `DialogTitle` a11y warnings | console post-fix shows no NEW warnings | UnsavedWarningModal, TemplatePreview, AICopilot promoted visible heading text from `<div>`/`<span>` → `<ModalTitle>`. `margin: 0` added where browser-default `<h2>` margin would have shifted layout. |

---

## Open follow-ups (not in this arc)

- **My Templates filter is empty** — user-saved templates persistence is a separate arc. IA pill is wired but list returns `[]`.
- **Template "Add as New Page" + tail CTAs** — verify scroll-state of S2 detail panel captures all 3 CTAs.

## Retracted follow-up

- ~~Library fullpage CSS gap~~ — initial inventory flagged 123 unstyled `.med-*` classes in `MediaTab`'s fullpage internals. Browser-smoke after the SlimLauncher wiring landed proved this is a **non-issue**: `FullPageRouter.tsx:66-74` mounts `<LibraryManager>` (sibling 3-column manager with 972 LOC of `.mgr-*` CSS) when `mediaFullPage` flips true. The unstyled `MediaTab` fullpage path is unreachable in practice — the broken Library I screenshotted earlier was the panel-mode path before `onOpenLibrary` was wired. Capture: `task-followup-library-fullpage.png`.
