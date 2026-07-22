# P2 — Shell resilience (C6 recovery banner + S1.5 load-error) · task-level plan

> Executes P2 of `2026-07-22-design-to-code-master-plan.md`. Re-greped 2026-07-23.

**Goal:** the editor tells the user when something went wrong and gives them a way out — a crash is surfaced (not silent), and a failed load is a persistent, actionable banner (not a disappearing toast).

**Ground truth (re-greped 2026-07-23):**
- `RecoveryManager` stamps a crash sentinel in `sessionStorage["buildrick:last-crash"]` = `{ at, source, reason }`; exposes static `consumeLastCrash()` (read+clear) and `wasLastSessionCrashed()`. **ZERO consumers** — the sentinel is written, never surfaced (C6 unbuilt).
- `useComposerInit` (`shell/hooks/useComposerInit.ts`) loads a project; on load failure the `.catch` distinguishes auth (`/unauthorized/i`) from generic and shows a **toast** — transient, not the drawn full-screen/persistent surface. Local autosave (`localStorage["buildrick-project"]`) is loaded on any failure, so a crash auto-restores the draft.
- `AquibraStudio.tsx` (562 lines) is the shell root: calls `useComposerInit` (L141), renders a `<Stack>` with `<header>` (L286+); already tracks `isOffline` (L227) + save-conflict (L251).

**Scope calls (kept tight + low-risk):**
- Banners, not a full-screen shell-load-state refactor (that would restructure the one-shot load effect and change the canvas mount model — out of proportion to P2's "S" size). The functional resilience the design wants — crash surfaced, load error persistent + retryable — is fully delivered by two shell banners.
- **Retry = `window.location.reload()`** (re-runs the whole server load fresh) — honest, no hook restructure.
- "Newer-server" warning (design finding #21) deferred: needs a server-updatedAt compare; the banner shows timestamp + page count (scope), which addresses the non-binary requirement. Documented.

## Global constraints
DS primitives (Gate 24); inline-style chrome convention; TDD; commit per slice to `main`; tsc gate + ds-ssot green.

### Slice A — RecoveryBanner (C6)
**Files:** create `shell/RecoveryBanner.tsx` + `shell/__tests__/RecoveryBanner.test.tsx`; wire into `AquibraStudio.tsx`.
**Produces:** a banner that reads `RecoveryManager.consumeLastCrash()` once on mount; if a crash occurred, shows "Recovered your work after an unexpected close · {relTime(at)} · {N} pages" with **Keep changes** (dismiss) and **Discard & reload** (clear `buildrick-project` + reload → server version). Renders null with no crash. Optional `pageCount` prop.

- [x] A1 failing RTL test (crash seeded → banner + timestamp + actions; consume clears sentinel; Keep dismisses; no-crash → null; Discard clears localStorage + reloads)
- [x] A2 fail · A3 implement + wire · A4 pass; tsc · A5 commit

### Slice B — LoadErrorBanner (S1.5)
**Files:** create `shell/LoadErrorBanner.tsx` + test; add `onLoadError?: (kind: "auth" | "network") => void` to `useComposerInit`; wire in `AquibraStudio.tsx`.
**Produces:** on a load failure the hook calls `onLoadError(kind)` (auth vs network); if unwired it falls back to today's toast (back-compat). AquibraStudio holds `loadError` state and renders a persistent banner: auth → "Session expired" + **Sign in** (→ `${DASHBOARD_URL}/auth`) + **Retry**; network → "Couldn't load this site" + **Retry**. Retry = reload. Error ≠ dismissed-and-forgotten (persistent until resolved).

- [x] B1 failing tests (banner renders per kind; Sign in navigates; Retry reloads; hook calls onLoadError with the right kind; unwired → toast fallback)
- [x] B2 fail · B3 implement + wire · B4 pass; tsc · B5 commit

### Slice C — Verify
- [x] C1 editor vitest green for touched files; tsc gate PASS; ds-ssot green
- [x] C2 manual/scripted behavioral check per master-plan acceptance (crash sentinel → banner restores; load-fail → persistent banner + retry)
- [x] C3 commit notes; update memory

## Verification results (2026-07-23)
- tsc gate PASS (0 both pkgs) · ds-ssot GREEN.
- RecoveryBanner 8 · LoadErrorBanner 6 · useComposerInit suite still green · **shell sweep 502/502 (38 files, incl. Topbar + hooks)**.
- Behavioral acceptance covered by RTL: crash sentinel → recovery banner (Keep/Discard-reload); dashboard load-fail → persistent LoadErrorBanner (auth→Sign in+Retry, network→Retry). Retry = full reload.
- Deferred (documented): full-screen S1.5 treatment (banners deliver the functional resilience — crash surfaced, load error persistent+retryable — without a canvas-mount refactor) · "newer-server" compare on the recovery banner (needs a server-updatedAt fetch).
- Commits `<slice A>`,`<slice B>` on `main`. NOT deployed (rides P0.5).
