# Build spec — Topbar regroup (hand this to the builder)

> This is a **design → build handoff**. It has four parts: WHAT · WHERE · DON'T-BREAK · DONE.
> Paste the whole thing to a build session ("implement this spec").

## 1. WHAT — the design (three zones + one overflow)

Regroup the topbar into three zones separated by thin vertical dividers, plus a `⋯` overflow menu. Reduce ~16 scattered controls to this:

```
┌ LEFT: Navigate ──────┐   ┌ CENTER: View ┐         ┌ RIGHT: Status + Ship ─────────────┐
│ ‹ Exit │ ↶ ↷ ⟲       │   │ [🖥 ▭ ▯ ▢]   │         │ ● Saved   ✨   Preview ▾   Publish  ⋯ │
└──────────────────────┘   └──────────────┘         └───────────────────────────────────┘
```

- **LEFT — Navigate:** `‹ Exit`, then a divider, then Undo · Redo · History (icon buttons).
- **CENTER — View:** the device/breakpoint switcher only.
- **RIGHT — Status + Ship:** `● Saved` (quiet status text, not a button) · `✨` Ask AI (icon-only) · `Preview ▾` (ghost button; the dropdown contains "Preview as: Me / Client" — this absorbs the old Client-view toggle) · **`Publish`** (the ONLY filled/cobalt primary button — it is the hero) · `⋯` overflow.
- **`⋯` overflow menu contains:** Invite / Share, Command palette (⌘K), Help, Account. These are infrequent — they do not deserve top-level space.

**Leaves the topbar entirely:**
- The site/page **breadcrumb** → moves to the **bottom status bar** (one breadcrumb only; see editor-chrome.html mockup).
- The red "Issues" pill → that is the **Next.js dev overlay** (nextjs-portal shadow root), not our chrome — leave it, it does not ship.

## 2. WHERE — the files

- **Primary:** `packages/editor/src/editor/shell/Topbar.tsx` — regroup the existing cells into the three zones + overflow. Keep ALL existing handler props (`onUndo`, `onRedo`, `onOpenHistory`, `onPreview`, `onPublish`, `onOpenAI`, etc.) — this is a **regroup + restyle**, not a rewrite of behaviour.
- **Overflow menu:** reuse the vibcoder `Menu` / dropdown primitive for the `⋯`.
- **Preview-as-client:** the existing `viewMode.clientView` toggle moves into the Preview dropdown.
- The bottom-bar breadcrumb work is a **separate spec** (StudioFooter) — do the topbar first.

## 3. DON'T-BREAK — the rules (Buildrik constraints)

- **Use vibcoder primitives only** — `Button`, `IconButton`, `Menu`, `Tooltip` from `@/editor/shared/vibcoder`. **No raw `<button>`/`<input>`** (Gate 24 will reject it).
- **One accent: cobalt `#2D6DFF`.** Publish is the only filled cobalt button. No purple/violet (DESIGN.md).
- **Don't touch the engine** (`packages/editor/src/engine/`). Chrome only.
- **Keep keyboard shortcuts** (⌘Z undo, ⌘⇧Z redo, ⌘K palette) wired even if their visible buttons move to overflow.
- Run `npx tsc --noEmit` + the shell tests before declaring done.

## 4. DONE — how we'll know it's right

- Topbar shows exactly three visible groups + a `⋯`; Publish is the only filled blue button.
- Ask AI is an icon, not a labelled button. Preview's dropdown offers "Preview as: Me / Client."
- Invite, ⌘K, Help, Account are reachable only from `⋯`.
- No breadcrumb in the topbar.
- `tsc` clean, shell tests green, no raw `<button>` added.

---
*Mockup of the target: `docs/reviews/audit-mockups/editor-chrome.html` (top bar) + `topbar-v2.html`.*
