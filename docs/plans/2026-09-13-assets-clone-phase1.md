# Assets · Clone Phase 1 — Selection & browsing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shipped fullpage media library behave and look like the 19 "Assets · selection & browsing" prototype screens on Figma page `Editor v1 Clone` (section `3695:19967`), verified in the running unified editor.

**Architecture:** This is a conformance walk, not greenfield. The surface already exists — `LibraryManager` (orchestrator) → `FolderTree` / `AssetGrid` / `AssetDetailsPanel`, state from `useMediaState` + four sub-hooks. Each prototype journey is walked live at 1440×900, compared to the cached Figma screenshot, and every drift is closed with a failing test → fix → commit, recorded per screen in `scripts/conformance/boards.json`. Backend-shaped drift is recorded as blocked, never built here.

**Tech Stack:** React 18 + TS (Vitest + RTL for unit), Playwright via gstack `/browse` for the live walk, `scripts/baseline/figma-mcp.mjs` for Figma reads (budget-capped), Next dashboard at `localhost:3000` hosting the unified editor.

**Spec:** the grilling session of 2026-09-13 (decisions table below) + the cached prototype graph `docs/design-jobs/CLONE-ASSETS/reactions-3695-19967.json` + the Clone page's own notes (audit `3692:19968`, checkpoint `3711:20473`, handoff `3688:19967`).

## Global Constraints

- **Target page:** `Editor v1 Clone` = `3397:13062`. Never read `Editor v1 Clone 2` (`3974:26562`) in this phase.
- **Authority:** Clone frame beats the V1 (`1:3`) board it re-draws. Every such override goes on the boards.json row as `authority: "board:clone-<nodeId>"` with a `verifiedNote` naming the V1 board it displaced.
- **Density:** 32px controls / 28px rows stay (DESIGN.md compact). The Clone's 44px controls are NOT adopted — row gets `authority: "founder:density-32"`.
- **Fidelity:** real behaviour on real (local-only) assets. No fixture/demo mode. The prototype's sample data ("Bella Cucina", "24 assets · 84 MB / 500 MB") is shape, never copied literally.
- **Env:** `BLOB_READ_WRITE_TOKEN`, `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY` are absent. Uploads are `localOnly` (IndexedDB). Journeys that need a server-synced asset or stock results are recorded `verified: "unreachable"` with the reason, never claimed.
- **Backend:** no tRPC / service / Prisma change. Such drift → `authority: "blocked:<reason>"` on the row + an entry in `docs/design-jobs/BLOCKERS.md`.
- **Figma budget:** ≤ 40 calls today, 9 already spent before this plan. Every read is cached under `docs/design-jobs/CLONE-ASSETS/` and never repeated. Read via `node scripts/baseline/figma-mcp.mjs` (the session's tool list may lack the Figma tools; the script does not care).
- **Git:** branch `feat/assets-clone-p1` off `fix/audit-criticals` HEAD (`e202e4ef3`). One commit per closed drift, message `J-<nodeId>: implemented — <what>` (repo convention). NEVER stage `packages/editor/src/editor/shell/AquibraStudio.tsx` or `packages/editor/scripts/baselines/ssot.json` — both are the founder's uncommitted edits. Push only when asked.
- **Copy:** copy on screen follows the board. Overlay title becomes **"Asset library"**; the drawer tab stays **"Media"** (the Clone's own drawer variants still say Media).
- **Chrome rules:** `@/editor/chrome-ui` is the only import surface for flowbite; no raw `<button>/<input>` in chrome (Gate 24); `var(--bk-*)` only; `tw:` prefix; hex ratchet may only go down.
- **Done-condition (checked, not claimed):** all 19 screens have a live screenshot beside the Figma one; every prototype edge in the graph has been driven live; drift table filled with fixed / open / unreachable; `npx vitest run src/editor/media src/editor/sidebar/tabs/media` green; `pnpm run verify:ds` green.

---

## File map

| File | Responsibility in this phase |
|---|---|
| `packages/editor/src/editor/media/LibraryManager.tsx` | Overlay chassis: title, header buttons (Import URL / Upload / Add from stock / Close), footer status |
| `packages/editor/src/editor/media/LibraryManager.css` | Chassis layout — `.mgr`, `.mgr-top`, `.mgr-status` |
| `packages/editor/src/editor/media/components/FolderTree.tsx` | Left rail: SMART (Recent / In use / Unused) · FOLDERS (All assets + folders + New folder) · TAGS |
| `packages/editor/src/editor/media/components/AssetGrid.tsx` | Toolbar (count · type chips · Grid·N columns 2 3 4 · List · sort · select-mode), bulk bar, grid cards, list rows, drag start |
| `packages/editor/src/editor/media/components/AssetDetailsPanel.tsx` | Right rail: per-type details (img/png/svg/mp4/woff2), Edit image · Insert to canvas · Rename · Delete · Replace across site… · Manage font · versions |
| `packages/editor/src/editor/sidebar/tabs/media/hooks/useSelectionState.ts` | `selMode`, `selectedKeys`, `toggleSelMode` (clears keys when leaving bulk mode: line 84) |
| `packages/editor/src/editor/sidebar/tabs/media/hooks/useLibraryState.ts` | search / sort / folder scope / type filter |
| `packages/editor/src/editor/sidebar/tabs/media/hooks/useMediaState.ts` | `insertToCanvas` — selection mode (replace element src) vs standard mode (type-aware insert), lines 177-270 |
| `packages/editor/src/editor/media/__tests__/LibraryManager.test.tsx` | Existing mount pattern (mocks `useMediaState`, mocks overlays) — copy its harness for new tests |
| `scripts/conformance/boards.json` (under `packages/editor/`) | One row per Clone screen, family `Assets · Clone` |
| `docs/design-jobs/CLONE-ASSETS/` | Cache: `reactions-*.json`, `shots/<id>.png`, `phase1-journeys.md`, `phase1-drift.md` |
| `docs/design-jobs/BLOCKERS.md` | Backend-shaped drift, one row each |
| `packages/editor/e2e/fixtures/clone-assets/` | The 10 generated fixture files (committed, ~250 KB total) |

## The 19 screens (section `3695:19967`)

| # | nodeId | name | journey |
|---|---|---|---|
| 0 | 3695:19968 | Assets · List · no selection | J-F bulk mode |
| 1 | 3695:20154 | Assets · List · hero selected | J-F bulk mode, 1 checked |
| 2 | 3695:20340 | Assets · Menu cover selected | J-B, J-G replace |
| 3 | 3695:20614 | Canvas · Menu preview image replaced | J-G |
| 4 | 3695:43991 | Canvas · uploaded image applied | J-G |
| 5 | 3695:44165 | Canvas · team image applied | J-G |
| 6 | 3695:44339 | Assets · Search menu | J-D |
| 7 | 3695:44543 | Assets · Grid 2 columns | J-C |
| 8 | 3695:44747 | Assets · Grid 4 columns | J-C |
| 9 | 3695:44951 | Assets · Name ascending | J-E |
| 10 | 3695:45155 | Assets · No selection | J-A |
| 11 | 3696:20326 | Assets · Selected · chef-intro.mp4 | J-B |
| 12 | 3696:20530 | Assets · Selected · team-photo.jpg | J-B |
| 13 | 3696:20734 | Assets · Selected · logo-mark.svg | J-B |
| 14 | 3696:20938 | Assets · Selected · pasta-closeup.jpg | J-B |
| 15 | 3696:21142 | Assets · Selected · grand-opening.mp4 | J-B |
| 16 | 3696:21346 | Assets · Selected · star-icon.svg | J-B |
| 17 | 3696:21550 | Assets · Selected · Inter-Var.woff2 | J-B (Manage font) |
| 18 | 3696:21754 | Assets · Selected · terrace-night.jpg | J-B |

## Journeys (derived from the reactions graph — the prototype's own edges)

- **J-A Library chrome** (screen 10): Close · Import URL → overlay · Upload → "Upload files" overlay · Add from stock → overlay · SMART rows Recent / In use / Unused → scope swap · FOLDERS rows All assets / Products / Hero shots / Icons → scope swap · New folder → overlay · TAGS menu / team / food → scope swap.
- **J-B Single selection per type** (screens 2, 11–18): click card → details rail for that file. Actions per type: Edit image (img/png/svg — sets "Editing context = `<file> · <dims>`"), Insert to canvas, Rename → overlay, Delete → per-file confirm overlay, Replace across site… (a `COND` on mp4 — expect disabled/hidden for video), Manage font (woff2 only → Site fonts overlay), versions row → versions overlay.
- **J-C View switch preserves selection** (screens 7, 8, 2, 9): `g/2` `g/3` `g/4` `List` set `Assets / Selected view / {view,width,height,thumbs}` — the selected asset STAYS selected (audit A01: "switching view must preserve, never create, selection").
- **J-D Search scope preserved** (screen 6): search "menu" → filtered set; `g/2..4`/`List` inside search set `Assets / Scope search / *` — the query survives the view switch; sort inside search is a `COND`.
- **J-E Sort** (screen 9): sort → Name ascending; sort again → back to Date added (library screen).
- **J-F Bulk mode** (screens 0, 1): `select-mode` → List · no selection (checkbox column, bulk rail "Select files to use bulk actions"); click a list row → `List · <file> selected` (rail: "1 asset selected", Delete; bar: 1 selected · Move to folder… · Download · Delete · ✕ Clear); ☐ toggles; ✕ Clear → no selection; `select-mode` again → back to library.
- **J-G Insert / apply to canvas** (screens 3, 4, 5, and typed edges from 11/13/15/16): from "Menu cover selected" with an image element selected on canvas → element src replaced (screen 3); with nothing selected → new element inserted; mp4 → Video element, svg → image element (the typed edges land in Phase 4's boards; here only the TYPE and the return-to-canvas are verified).
- **J-H Drag start** (every asset card / list row `DRAG` → "Assets · dragging hero-…"): the library shows a drag state while an asset is dragged toward the canvas.
- **J-I Overlays return to caller** (audit A06): every overlay opened from the library (Import URL, Upload, Stock, New folder, Rename, Delete, Edit image, Replace across, versions) — Cancel closes to the library with folder/search/selection UNCHANGED.

---

### Task 1: Branch, fixtures, journey doc

**Files:**
- Create: `packages/editor/e2e/fixtures/clone-assets/{hero-dark.jpg,menu-cover.png,team-photo.jpg,pasta-closeup.jpg,terrace-night.jpg,logo-mark.svg,star-icon.svg,chef-intro.mp4,grand-opening.mp4,Inter-Var.woff2}`
- Create: `packages/editor/e2e/fixtures/clone-assets/make.py` (regenerates the images), `docs/design-jobs/CLONE-ASSETS/phase1-journeys.md`
- Modify: nothing in `src/`

**Interfaces:**
- Produces: the 10 files above, named EXACTLY as the prototype names them (the details rail, list rows and delete confirms all print the filename).

- [ ] **Step 1: Branch**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git switch -c feat/assets-clone-p1
git status --short   # expect ONLY: M packages/editor/scripts/baselines/ssot.json, M packages/editor/src/editor/shell/AquibraStudio.tsx, ?? docs/reviews/*.zip, ?? docs/design-jobs/CLONE-ASSETS/
```

- [ ] **Step 2: Generate the five raster fixtures**

`packages/editor/e2e/fixtures/clone-assets/make.py`:

```python
"""Regenerates the Clone Phase-1 raster fixtures. Distinct colours per file so a
wrong src on the canvas is visible at a glance. Sizes match what the prototype's
details rail prints (hero 2400x1600, menu-cover 1600x1000)."""
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).parent
FILES = {
    "hero-dark.jpg":      ((2400, 1600), (24, 28, 36)),
    "menu-cover.png":     ((1600, 1000), (222, 184, 135)),
    "team-photo.jpg":     ((1800, 1200), (70, 130, 180)),
    "pasta-closeup.jpg":  ((1200, 1200), (205, 92, 92)),
    "terrace-night.jpg":  ((2000, 1125), (25, 25, 112)),
}
for name, (size, rgb) in FILES.items():
    im = Image.new("RGB", size, rgb)
    d = ImageDraw.Draw(im)
    d.text((40, 40), name, fill=(255, 255, 255))
    im.save(HERE / name, quality=60 if name.endswith(".jpg") else None, optimize=True)
    print(name, size, (HERE / name).stat().st_size, "bytes")
```

Run: `python3 packages/editor/e2e/fixtures/clone-assets/make.py`
Expected: five files, each under 60 KB (flat colour compresses hard).

- [ ] **Step 3: SVG, MP4, WOFF2 fixtures**

```bash
cd packages/editor/e2e/fixtures/clone-assets
cat > logo-mark.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1A56DB"/><text x="32" y="40" font-size="24" text-anchor="middle" fill="#fff" font-family="Inter">BC</text></svg>
EOF
cat > star-icon.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="#F59E0B"/></svg>
EOF
# 2-second, 320x180, silent, ~30 KB each. -pix_fmt yuv420p so Chromium decodes it.
ffmpeg -y -f lavfi -i color=c=0x8B0000:s=320x180:d=2 -pix_fmt yuv420p -movflags +faststart chef-intro.mp4
ffmpeg -y -f lavfi -i color=c=0x006400:s=320x180:d=2 -pix_fmt yuv420p -movflags +faststart grand-opening.mp4
cp ../../../dist/assets/inter-latin-ext-500-normal-CV4jyFjo.woff2 Inter-Var.woff2
ls -la
```

Expected: 10 files; total under 300 KB (`du -sh .`). If `dist/assets` is absent, run `npx vite build` once from `packages/editor` — it is the shipped Inter subset, not a download.

- [ ] **Step 4: Write the journey doc**

`docs/design-jobs/CLONE-ASSETS/phase1-journeys.md` — copy the "Journeys" and "The 19 screens" sections of this plan verbatim, then append a **Drift table** skeleton:

```markdown
## Drift table (filled during Tasks 3–9)

| screen | journey | live shot | verdict | note |
|---|---|---|---|---|
| 3695:45155 | J-A | shots/live-3695-45155.png | | |
| 3695:44339 | J-D | | | |
...one row per screen, all 19...
```

Verdict vocabulary is boards.json's: `match` · `drift-fixed` · `drift-open` · `unreachable`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/e2e/fixtures/clone-assets docs/design-jobs/CLONE-ASSETS docs/plans/2026-09-13-assets-clone-phase1.md
git commit -m "chore(assets-clone): phase-1 plan, prototype graph cache, 10 named fixtures"
```

---

### Task 2: Cache the 19 Figma screenshots (19 Figma calls)

**Files:**
- Create: `docs/design-jobs/CLONE-ASSETS/shots/<nodeId with ':'→'-'>.png` × 19 (one already exists: `3695-20154.png`)
- Create: `scripts/figma/clone-shots.mjs` (repo-root `scripts/figma/`, next to the other apply/census scripts)

**Interfaces:**
- Consumes: `scripts/baseline/figma-mcp.mjs` `{ connect, rpc }`
- Produces: PNGs the walk tasks open side-by-side; the script is resumable (skips existing files) because the quota trickles back a few calls at a time.

- [ ] **Step 1: Write the resumable shot script**

`scripts/figma/clone-shots.mjs`:

```js
#!/usr/bin/env node
/**
 * Cache Figma screenshots for a list of node ids, skipping any already on disk.
 * One node = one Figma call (the daily cap is 200, shared). get_screenshot
 * returns a short-lived URL, not bytes — fetch it immediately.
 *
 * Usage: node scripts/figma/clone-shots.mjs <outDir> <nodeId> [<nodeId> ...]
 */
import fs from "node:fs";
import path from "node:path";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const [outDir, ...ids] = process.argv.slice(2);
if (!outDir || ids.length === 0) { console.error("usage: clone-shots.mjs <outDir> <nodeId>..."); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
await connect();
let spent = 0;
for (const id of ids) {
  const file = path.join(outDir, `${id.replace(":", "-")}.png`);
  if (fs.existsSync(file)) { console.log("skip", id); continue; }
  const r = await rpc("tools/call", { name: "get_screenshot", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", nodeId: id } }, 100 + spent);
  spent++;
  const text = (r?.result?.content || []).map((c) => c.text || "").join("\n");
  const url = text.match(/https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^\s"')]+/)?.[0];
  if (!url) { console.error("no url for", id, text.slice(0, 200)); if (/limit/i.test(text)) break; continue; }
  const res = await fetch(url);
  if (!res.ok) { console.error("fetch failed", id, res.status); continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log("wrote", file);
}
console.log("figma calls spent:", spent);
```

- [ ] **Step 2: Run it for the 19 screens**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
node scripts/figma/clone-shots.mjs docs/design-jobs/CLONE-ASSETS/shots \
  3695:19968 3695:20154 3695:20340 3695:20614 3695:43991 3695:44165 3695:44339 \
  3695:44543 3695:44747 3695:44951 3695:45155 3696:20326 3696:20530 3696:20734 \
  3696:20938 3696:21142 3696:21346 3696:21550 3696:21754
ls docs/design-jobs/CLONE-ASSETS/shots | wc -l   # expect 19
```

Expected: 18 writes + 1 skip, "figma calls spent: 18". If the output says `You've reached the Figma MCP tool call limit`, stop — re-run later; the script resumes.

- [ ] **Step 3: Look at every shot once, note the per-type action set**

Open each `Selected · <file>` shot (11–18) and write into `phase1-journeys.md` under J-B a table: file type → which actions the rail draws (Edit image? Replace across? Manage font? versions row?). This is the contract Task 5 tests against; the reactions graph only says which actions have EDGES, not which are drawn disabled.

- [ ] **Step 4: Commit**

```bash
git add scripts/figma/clone-shots.mjs docs/design-jobs/CLONE-ASSETS
git commit -m "chore(assets-clone): cache the 19 phase-1 prototype screens; resumable shot script"
```

---

### Task 3: Live environment — servers, login, seeded site

**Files:**
- Modify: nothing committed. `docs/design-jobs/CLONE-ASSETS/phase1-journeys.md` gets a "Live env" block (site id, account, ports).

**Interfaces:**
- Produces: a site at `http://localhost:3000/edit/<siteId>` whose media library holds exactly the 10 fixtures, and a Home page with one Image element (for J-G replace).

- [ ] **Step 1: Start the dashboard (hosts the unified editor)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -c "NEXT_PUBLIC_UNIFIED_EDITOR=true" .env.local     # expect 1
pnpm --filter dashboard dev > /tmp/claude-501/dash.log 2>&1 &
sleep 20; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/   # expect 200 or 307
```

- [ ] **Step 2: Log in as the seeded e2e user**

The e2e accounts come from `prisma/seed.ts`; the login is the magic-link path `packages/dashboard/e2e/auth.setup.ts` drives. Reuse it rather than re-deriving:

```bash
cd packages/dashboard
npx playwright test --project=setup 2>&1 | tail -5     # writes the storageState the e2e suite uses
ls playwright/.auth/ 2>/dev/null || grep -n "storageState" playwright.config.ts
```

If it fails with `/auth/error/expired-link`, the rate limit tripped (5 per 15 min): `npx prisma db execute --stdin <<< 'DELETE FROM "RateLimitBucket";'` from the repo root, then rerun. Load `/browse` (gstack) with that storageState for every later step.

- [ ] **Step 3: Create the walk site and seed the library through the UI**

In `/browse`: dashboard → New site → name `Clone P1 walk` → Open in editor. Rail → Media → **Manage** (opens the fullpage overlay) → **Upload** → select all 10 fixtures from `packages/editor/e2e/fixtures/clone-assets/`. Expected: 10 cards, footer says `10 assets`, and a pill reading `10 not on the server` (local-only — Blob token absent; this is the accepted state, write it in the journeys doc).

Then Insert → Image on Home once (any src) — J-G's replace target. Record `siteId`, the URL, and the account in `phase1-journeys.md → Live env`.

- [ ] **Step 4: Baseline the boot**

```bash
node packages/editor/scripts/conformance/live-shot.mjs --help >/dev/null 2>&1 || true
```

`live-shot.mjs` drives the port-5050 Vite demo, not Next — do NOT use it for this walk. All live screenshots in Tasks 4–9 come from `/browse` at viewport 1440×900, saved as `docs/design-jobs/CLONE-ASSETS/shots/live-<nodeId>.png`.

---

### Task 4: J-A — library chrome (screen 10 `3695:45155`, plus rail/header on every screen)

**Files:**
- Modify (only where drift is found): `packages/editor/src/editor/media/LibraryManager.tsx`, `LibraryManager.css`, `components/FolderTree.tsx`
- Test: `packages/editor/src/editor/media/__tests__/LibraryManager.clone.test.tsx` (new file; reuse the mount harness from `LibraryManager.test.tsx` lines 20–70)

**Interfaces:**
- Consumes: `LibraryManager({ composer, onClose, onOpenImageEditor, onOpenIconPicker })`
- Produces: the test harness `mountLibrary(items: LibraryItem[])` used by Tasks 5–8.

- [ ] **Step 1: Walk it live**

Open the overlay with nothing selected. Screenshot → `shots/live-3695-45155.png`. Compare with `shots/3695-45155.png`, region by region: title text, the four header controls and their order, the rail's three groups and their row order + counts, toolbar contents, empty right rail copy, footer left (`N assets · X MB`) and right (sync pill). Write every difference into the drift table as a row with a one-line `note`.

Expected drift (from the code read, to be confirmed by the shot): title reads `Media library`/`MANAGE` where the board reads **Asset library**; counts on Recent / In use / Unused; the sync pill.

- [ ] **Step 2: Write the failing test for the title (and each visual drift that is text-provable)**

`LibraryManager.clone.test.tsx` — build the harness once:

```tsx
/**
 * Clone Phase-1 contracts for the fullpage library — Figma page
 * "Editor v1 Clone", section 3695:19967. One `it` per prototype edge that a
 * DOM assertion can prove; the visual side is the shot pair in
 * docs/design-jobs/CLONE-ASSETS/shots/.
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { LibraryItem, MediaStateResult } from "../../sidebar/tabs/media/data/mediaTypes";

const state: { mediaState: MediaStateResult } = { mediaState: null as unknown as MediaStateResult };
vi.mock("../../sidebar/tabs/media/hooks/useMediaState", () => ({ useMediaState: () => state.mediaState }));
vi.mock("../../sidebar/tabs/media/components/StockSourceModal", () => ({ StockSourceModal: () => null }));
vi.mock("../../sidebar/tabs/media/components/ConfirmDeleteModal", () => ({ ConfirmDeleteModal: () => null }));
vi.mock("../../sidebar/tabs/media/components/MediaContextMenu", () => ({ MediaContextMenu: () => null }));
vi.mock("../../sidebar/tabs/media/components/AssetDetailOverlay", () => ({ AssetDetailOverlay: () => null }));

import { LibraryManager } from "../LibraryManager";
import { makeMediaState } from "./LibraryManager.test"; // if not exported there, copy its builder here verbatim

export function item(over: Partial<LibraryItem> & Pick<LibraryItem, "key" | "name" | "type">): LibraryItem {
  return { src: `blob:${over.key}`, size: 1024, createdAt: "2026-09-01T00:00:00Z", mimeType: "image/jpeg", ...over };
}

export const TEN: LibraryItem[] = [
  item({ key: "hero", name: "hero-dark.jpg", type: "img", width: 2400, height: 1600, size: 840_000 }),
  item({ key: "menu", name: "menu-cover.png", type: "img", mimeType: "image/png", width: 1600, height: 1000, size: 220_000 }),
  item({ key: "team", name: "team-photo.jpg", type: "img" }),
  item({ key: "pasta", name: "pasta-closeup.jpg", type: "img" }),
  item({ key: "terrace", name: "terrace-night.jpg", type: "img", size: 1_100_000 }),
  item({ key: "logo", name: "logo-mark.svg", type: "ico", mimeType: "image/svg+xml", size: 6_000 }),
  item({ key: "star", name: "star-icon.svg", type: "ico", mimeType: "image/svg+xml" }),
  item({ key: "chef", name: "chef-intro.mp4", type: "vid", mimeType: "video/mp4", size: 8_400_000, duration: 2 }),
  item({ key: "opening", name: "grand-opening.mp4", type: "vid", mimeType: "video/mp4", duration: 2 }),
  item({ key: "inter", name: "Inter-Var.woff2", type: "fnt", mimeType: "font/woff2", size: 310_000 }),
];

export function mountLibrary(items: LibraryItem[] = TEN, over: Partial<MediaStateResult> = {}) {
  state.mediaState = { ...makeMediaState(items), ...over };
  const composer = { media: { getAssets: () => [], downloadAssets: vi.fn() }, mediaOps: { insertMedia: vi.fn() } } as never;
  return render(<LibraryManager composer={composer} onClose={vi.fn()} />);
}

describe("Clone 3695:45155 · Assets · No selection", () => {
  it("titles the overlay 'Asset library' (board copy)", () => {
    mountLibrary();
    expect(screen.getByRole("heading", { name: "Asset library" })).toBeInTheDocument();
  });
});
```

Check first whether `LibraryManager.test.tsx` exports a state builder; if it does not, lift its builder (the object it assigns to `state.mediaState`) into this file as `makeMediaState` so both files compile independently — do not import test internals across files.

- [ ] **Step 3: Run, expect FAIL**

Run: `cd packages/editor && npx vitest run src/editor/media/__tests__/LibraryManager.clone.test.tsx`
Expected: FAIL — `Unable to find an accessible element with the role "heading" and name "Asset library"`.

- [ ] **Step 4: Fix the title in `LibraryManager.tsx`**

Find the header (around line 295, the `mgr-tag` "MANAGE" span and the title next to it). Replace the title text with `Asset library`; drop the `MANAGE` tag if the shot does not draw it. Keep the element a heading (`<h1>`/`<h2>` or `role="heading"`) so the test's query and the screen reader agree.

- [ ] **Step 5: Run, expect PASS; run the existing suite**

```bash
npx vitest run src/editor/media/__tests__/LibraryManager.clone.test.tsx     # PASS
npx vitest run src/editor/media src/editor/sidebar/tabs/media               # everything else still green
```

If `LibraryManager.test.tsx` asserted the old title, rewrite that assertion in the same commit (CLAUDE.md: tests protecting the old design are rewritten with the design).

- [ ] **Step 6: Re-shoot live, confirm, record, commit**

Re-screenshot the live screen; the title region now matches. Drift row → `drift-fixed`. Repeat Steps 2–5 for every other J-A drift the shot pair showed (rail row order, counts, footer copy). Each fix is its own commit:

```bash
git add packages/editor/src/editor/media packages/editor/src/editor/media/__tests__ docs/design-jobs/CLONE-ASSETS
git commit -m "J-3695:45155: implemented — the overlay is titled Asset library, as the Clone draws it"
```

---

### Task 5: J-B — single selection per file type (screens 2, 11–18)

**Files:**
- Modify (where drift): `packages/editor/src/editor/media/components/AssetDetailsPanel.tsx`
- Test: `packages/editor/src/editor/media/__tests__/AssetDetailsPanel.clone.test.tsx`

**Interfaces:**
- Consumes: `AssetDetailsPanel` props — `selectedItem: LibraryItem | null`, `onInsert(key)`, `onOpenImageEditor`, `onRename`, `onDelete`, `onReplaceAcross` (read the exact prop names off `AssetDetailsPanel.tsx:40-110` before writing the test; the plan names the behaviour, the file names the props).
- Consumes: the J-B action table written in Task 2 Step 3.

- [ ] **Step 1: Walk all nine selections live**

Click each of the 10 fixtures in turn (screen 2 = menu-cover.png; 11–18 = the other eight; hero-dark.jpg has no `Selected` screen of its own — its selected state is screen 9's toolbar-and-rail). Screenshot each → `shots/live-<nodeId>.png`. Compare the RIGHT RAIL only: preview, filename, type/size/dims line, usage line, then the action list and its order.

- [ ] **Step 2: Encode the per-type action contract as tests**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { AssetDetailsPanel } from "../components/AssetDetailsPanel";
import { TEN } from "./LibraryManager.clone.test";

function mount(key: string) {
  const selectedItem = TEN.find((i) => i.key === key)!;
  const handlers = { onInsert: vi.fn(), onOpenImageEditor: vi.fn(), onRename: vi.fn(), onDelete: vi.fn(), onReplaceAcross: vi.fn() };
  render(<AssetDetailsPanel selectedItem={selectedItem} usageCount={0} {...handlers} />);
  return handlers;
}

describe("Clone 3696:2xxxx · Assets · Selected · <file> — per-type actions", () => {
  it("3696:20326 chef-intro.mp4: no Edit image, no Replace across site", () => {
    mount("chef");
    expect(screen.queryByRole("button", { name: /edit image/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /replace across site/i })).toBeNull();
    expect(screen.getByRole("button", { name: /insert to canvas/i })).toBeInTheDocument();
  });
  it("3696:21550 Inter-Var.woff2: Manage font instead of Insert to canvas", () => {
    mount("inter");
    expect(screen.getByRole("button", { name: /manage font/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /insert to canvas/i })).toBeNull();
  });
  it("3696:20734 logo-mark.svg: Insert to canvas present, Edit image absent", () => {
    mount("logo");
    expect(screen.getByRole("button", { name: /insert to canvas/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit image/i })).toBeNull();
  });
  it("3695:20340 menu-cover.png: Edit image, Insert to canvas, Rename, Delete, Replace across site in board order", () => {
    mount("menu");
    const names = screen.getAllByRole("button").map((b) => b.textContent?.trim());
    expect(names).toEqual(expect.arrayContaining(["Edit image", "Insert to canvas", "Rename", "Delete", "Replace across site…"]));
  });
});
```

Adjust each `it` to the action table from Task 2 Step 3 — the shots decide, not this listing. Where the shot draws an action DISABLED rather than absent, assert `toBeDisabled()` instead of `toBeNull()`.

- [ ] **Step 3: Run, expect the drifting cases to FAIL**

Run: `npx vitest run src/editor/media/__tests__/AssetDetailsPanel.clone.test.tsx`
Expected: at least the cases that the live walk marked as drift fail; the matching ones pass on the first run (that is the proof they were already right).

- [ ] **Step 4: Fix `AssetDetailsPanel.tsx`**

Gate each action on `selectedItem.type`: `"vid"` hides Edit image + Replace across; `"fnt"` swaps Insert for **Manage font** (opens the existing site-fonts flow — grep `Manage site fonts` / `siteFonts` in `src/editor` for the entry that the Inspector's font picker already opens, and call the same function; do not build a new dialog); `"ico"` keeps Insert, hides Edit image. Keep the board's action ORDER.

- [ ] **Step 5: Run, expect PASS; existing suite green**

```bash
npx vitest run src/editor/media src/editor/sidebar/tabs/media
```

- [ ] **Step 6: Re-shoot, record, commit — one commit per screen that changed**

```bash
git commit -am "J-3696:20326: implemented — a video's rail hides Edit image and Replace across, as the Clone draws"
```

---

### Task 6: J-C + J-D + J-E — view switch, search scope, sort (screens 6, 7, 8, 9)

**Files:**
- Modify (where drift): `packages/editor/src/editor/media/components/AssetGrid.tsx`, `packages/editor/src/editor/sidebar/tabs/media/hooks/useSelectionState.ts`, `useLibraryState.ts`
- Test: `packages/editor/src/editor/media/__tests__/AssetGrid.clone.test.tsx`

**Interfaces:**
- Consumes: `AssetGrid`'s `data-testid`s — `mgr-view-list`, `mgr-gridn` (columns group) — and the list-row ids `mgr-list-row-<key>` (`AssetGrid.tsx:245-260, 543`).

- [ ] **Step 1: Walk live**

Select `menu-cover.png` (screen 2). Click `2` → shot vs `3695:44543`; click `4` → vs `3695:44747`; click `List` → vs `3695:20154`'s toolbar (selection must still be menu-cover, NOT a fresh "1 selected" bulk state — audit A01). Type `menu` in search → vs `3695:44339`; switch columns inside the search → query still in the field, results unchanged. Click sort → `Name ascending` (vs `3695:44951`); click again → `Date added`.

- [ ] **Step 2: Failing tests for the preserved-selection contract**

```tsx
import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { mountLibrary } from "./LibraryManager.clone.test";

describe("Clone 3695:44543 / 44747 / 20154 · view switch preserves selection (audit A01)", () => {
  it("keeps menu-cover.png selected across 2 → 4 → List", () => {
    mountLibrary();
    fireEvent.click(screen.getByTestId("mgr-asset-menu"));
    const rail = screen.getByTestId("mgr-details");
    expect(within(rail).getByText("menu-cover.png")).toBeInTheDocument();
    const cols = screen.getByTestId("mgr-gridn");
    fireEvent.click(within(cols).getByRole("button", { name: "2" }));
    expect(within(rail).getByText("menu-cover.png")).toBeInTheDocument();
    fireEvent.click(within(cols).getByRole("button", { name: "4" }));
    expect(within(rail).getByText("menu-cover.png")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mgr-view-list"));
    expect(within(rail).getByText("menu-cover.png")).toBeInTheDocument();
    expect(screen.queryByText(/1 selected/)).toBeNull();   // list view must not CREATE a bulk selection
  });
});

describe("Clone 3695:44339 · search scope survives a view switch", () => {
  it("keeps 'menu' in the field and the filtered set after Grid 2", () => {
    mountLibrary();
    const search = screen.getByRole("searchbox", { name: /search/i });
    fireEvent.change(search, { target: { value: "menu" } });
    expect(screen.getAllByTestId(/^mgr-asset-/)).toHaveLength(1);
    fireEvent.click(within(screen.getByTestId("mgr-gridn")).getByRole("button", { name: "2" }));
    expect(search).toHaveValue("menu");
    expect(screen.getAllByTestId(/^mgr-asset-/)).toHaveLength(1);
  });
});
```

The `mgr-asset-<key>` and `mgr-details` ids are the ones `media-fullpage-library.json` waits on; confirm both exist with `grep -n 'data-testid' AssetGrid.tsx AssetDetailsPanel.tsx` before running, and use the real id if it differs.

- [ ] **Step 3: Run, expect FAIL where the walk saw drift** (and PASS where it did not — record both)

- [ ] **Step 4: Fix** — the usual suspect is a `setDetailItem(null)` / `setSelectedKeys(new Set())` on a view or search change; remove it from the view-switch path only (bulk-mode exit at `useSelectionState.ts:84` is correct and stays — leaving bulk mode is not a view switch).

- [ ] **Step 5: Run green; re-shoot; record; commit**

```bash
git commit -am "J-3695:44543: implemented — switching columns or list keeps the selected asset (audit A01)"
```

---

### Task 7: J-F — bulk mode (screens 0 `3695:19968`, 1 `3695:20154`)

**Files:**
- Modify (where drift): `AssetGrid.tsx` (bulk bar, checkbox column), `AssetDetailsPanel.tsx` (bulk rail copy), `useSelectionState.ts`
- Test: `AssetGrid.clone.test.tsx` (append)

- [ ] **Step 1: Walk live**

Click `select-mode` (the checkbox-square toggle at the toolbar's right end) → shot vs `3695:19968`: list view with a checkbox column, rail copy **"Select files to use bulk actions."**, no bulk bar yet. Check `hero-dark.jpg` → vs `3695:20154`: bar `1 selected · Move to folder… · Download · Delete · ✕ Clear`; rail `1 asset selected` / `hero-dark.jpg · Select another file to use bulk actions.` / **Delete** (outlined, danger). ✕ Clear → back to screen 0. `select-mode` again → library, nothing selected.

- [ ] **Step 2: Failing tests**

```tsx
describe("Clone 3695:19968 / 20154 · bulk mode", () => {
  it("entering select-mode shows the checkbox list with no selection and the rail's bulk hint", () => {
    mountLibrary();
    fireEvent.click(screen.getByRole("button", { name: /select mode|select files/i }));
    expect(screen.getByTestId("mgr-list-head")).toBeInTheDocument();
    expect(screen.queryByText(/\d+ selected/)).toBeNull();
    expect(screen.getByText("Select files to use bulk actions.")).toBeInTheDocument();
  });
  it("checking one row shows the bar and the 1-asset rail; Clear empties both", () => {
    mountLibrary();
    fireEvent.click(screen.getByRole("button", { name: /select mode|select files/i }));
    fireEvent.click(within(screen.getByTestId("mgr-list-row-hero")).getByRole("checkbox"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move to folder…" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getByText("1 asset selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.queryByText("1 selected")).toBeNull();
  });
});
```

- [ ] **Step 3: Run → FAIL on drift; Step 4: fix copy/structure in `AssetGrid.tsx` / `AssetDetailsPanel.tsx`; Step 5: green + re-shoot + record; Step 6: commit**

```bash
git commit -am "J-3695:20154: implemented — bulk rail reads '1 asset selected' with the Clone's hint and Delete"
```

---

### Task 8: J-G — insert / apply to canvas (screens 3, 4, 5 + typed edges)

**Files:**
- Modify (where drift): `packages/editor/src/editor/sidebar/tabs/media/hooks/useMediaState.ts` (lines 177–270)
- Test: `packages/editor/src/editor/sidebar/tabs/media/hooks/__tests__/useMediaState.insert.clone.test.ts` (check the folder's existing test names first and match their harness)

- [ ] **Step 1: Walk live — three outcomes**

(a) Select the Image element on Home → rail Media → Manage → select `menu-cover.png` → **Insert to canvas** → overlay closes, the SAME element now shows menu-cover (shot vs `3695:20614`; confirm with `/browse` eval: `document.querySelector('[data-element-id="<id>"] img').src` contains `menu-cover`). (b) Deselect everything → same for `team-photo.jpg` → a NEW image element appears, selected (vs `3695:44165`). (c) `chef-intro.mp4` → new element is a Video (`<video>` in the canvas, not `<img>`); `logo-mark.svg` → an image element whose src is the svg. Record usage: after (a) the library shows menu-cover `used ×1` and team-photo `unused` until (b) — audit A04.

- [ ] **Step 2: If the local-only src blocks a step**, the toast `… is only on this device — it won't show on the page or publish` is EXPECTED (`useMediaState.ts:236-243`) and the element still updates. Record it as `match` with the note "localOnly toast, accepted env"; only a src that did NOT change is drift.

- [ ] **Step 3: Tests only for drift found** — if (a)/(b)/(c) all match, write no new test; add a row `match` per screen and move on. If the replace path drifts, the failing test targets `composer.mediaOps.replaceMedia(elementId, src)` being called with the SELECTED element's id when `selectionContext` is set (mock `composer.mediaOps`, call `insertToCanvas("menu")`, assert the mock's args).

- [ ] **Step 4: Commit if anything changed**

---

### Task 9: J-H drag state + J-I overlays return to caller

**Files:**
- Modify (where drift): `AssetGrid.tsx` (drag start), `LibraryManager.tsx` (overlay wiring)
- Test: append to `AssetGrid.clone.test.tsx`

- [ ] **Step 1: J-H live** — mousedown-drag `hero-dark.jpg` 40px toward the canvas without dropping: the library should show a drag state (the graph names a frame "Assets · dragging hero-…"; its shot is NOT in Phase 1's 19 — read `docs/design-jobs/CLONE-ASSETS/reactions-3695-19967.json` for the destination id and spend ONE extra Figma call on its screenshot only if the live state is visibly different from the card's normal hover). Record.

- [ ] **Step 2: J-I live** — with `Products` scope active AND `menu-cover.png` selected, open each overlay in turn (Import URL, Upload, Add from stock, New folder, Rename, Delete, Edit image, Replace across site…, versions) and press Cancel / Esc. After each: scope still `Products`, menu-cover still selected, no second overlay (audit A06). Any overlay that resets scope or selection, or stacks, is drift.

- [ ] **Step 3: Failing test for any A06 drift**

```tsx
it("Cancel in Import URL returns to the library with scope and selection intact (audit A06)", () => {
  mountLibrary();
  fireEvent.click(screen.getByTestId("mgr-asset-menu"));
  fireEvent.click(screen.getByRole("button", { name: /import url/i }));
  fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
  expect(within(screen.getByTestId("mgr-details")).getByText("menu-cover.png")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).toBeNull();
});
```

(`ImportUrlModal` is real here — do not mock it in this file.)

- [ ] **Step 4: Fix, green, re-shoot, record, commit per overlay**

---

### Task 10: Record, gate, report

**Files:**
- Modify: `packages/editor/scripts/conformance/boards.json` (append 19 rows), `docs/design-jobs/BLOCKERS.md` (append rows), `docs/design-jobs/CLONE-ASSETS/phase1-journeys.md` (drift table complete)

- [ ] **Step 1: boards.json rows — one per screen, family `Assets · Clone`**

Append inside the boards array (keep the file's key order):

```json
{
 "nodeId": "3695:45155",
 "name": "Assets · No selection",
 "family": "Assets · Clone",
 "state": "no-selection",
 "width": 1440,
 "height": 900,
 "status": "active",
 "authority": "board:clone-3695:45155",
 "recipe": "media-fullpage-library",
 "verified": "drift-fixed",
 "verifiedNote": "Clone P1 walk 2026-09-13: title Media library → Asset library (V1 1159:4593 displaced). Density kept at 32 — founder:density-32."
}
```

Rules: `authority` is `board:clone-<id>` when the Clone won, `founder:density-32` when ONLY the 44px density was refused, `blocked:<reason>` when the drift needs backend, `code:<reason>` when the code contract won (say which schema/service). `recipe` names the closest existing surface (`media-fullpage-library`, `media-fullpage-list-view-bulk`, `media-drill-in-asset-detail`) — no new recipe in this phase; the harness is a regression net, the walk is the acceptance. `verified` ∈ `match | drift-fixed | drift-open | unreachable`.

Then: `cd packages/editor && node scripts/conformance/check-boards.mjs` — expect 0 errors (it validates the schema; if it rejects the new `family`, read its message — the vocabulary may be closed and the row belongs under `Media` with `state: "clone · no-selection"` instead).

- [ ] **Step 2: BLOCKERS.md — one row per `blocked:*`**

Under a new heading `## Assets · Clone Phase 1 — 2026-09-13`, table `| row | screen | what the Clone draws | why code cannot | owner |`. Known already: **C1** footer `84 MB / 500 MB` needs real byte totals + a quota from the server (`useServerStorageQuota` exists — record what it returns today and what is missing); **C2** `N not on the server` pill is the ACCEPTED local-only env, not a defect — say so, so nobody files it; **C3** tags are editor-local (`media.service.ts` has no `tags`) — the TAGS rail works per browser only.

- [ ] **Step 3: Gates**

```bash
cd packages/editor
npx vitest run src/editor/media src/editor/sidebar/tabs/media
npx tsc --noEmit
cd /Users/shahg/Desktop/pencil/buildrik && pnpm run verify:ds 2>&1 | tail -20
```

Expected: all green. A hex/shadow/portal gate failing means a fix used a literal — replace with `var(--bk-*)` / a chrome-ui primitive, do not touch the baseline.

- [ ] **Step 4: Report to the founder (in chat, and the same text at the top of `phase1-journeys.md`)**

Format:

```
Phase 1 — 19 screens walked in the unified editor (site <id>, 1440×900, local-only assets)
  match         N   (screens …)
  drift-fixed   N   (screens …, commits …)
  drift-open    N   (screens …, why)
  unreachable   N   (screens …, env reason)
NOT verified: server-synced usage, stock, published-page usage — no Blob/Pexels keys (Q5).
Blocked (backend): C1 …, C3 …
Figma calls spent today: <n> / 40.
Next: Phase 2 (organisation & actions, 26 screens) — waiting for go.
```

- [ ] **Step 5: Final commit**

```bash
git add packages/editor/scripts/conformance/boards.json docs/design-jobs/BLOCKERS.md docs/design-jobs/CLONE-ASSETS
git commit -m "docs(assets-clone): phase-1 walk recorded — 19 rows, drift table, backend blockers"
git status --short   # AquibraStudio.tsx and ssot.json must still show as M, unstaged
```

---

## Self-review

- **Spec coverage:** Q1 page → Global Constraints; Q2 scope → the 19-screen table + journeys A–I (every edge family in the cached graph has a task: chrome A/T4, selection B/T5, view/search/sort C-D-E/T6, bulk F/T7, canvas G/T8, drag H + overlays I/T9); Q3 authority, Q10 density → boards.json rules in T10; Q4 real behaviour → T3 seeds real files, no fixture mode; Q5 env → unreachable vocabulary + C2; Q6 budget → T2 script is resumable and counted, T9 caps the extra at one; Q7 verification → every task's Step 1 is the live walk, done-condition in Global Constraints; Q8 git → branch in T1, per-fix commits, the two founder files named; Q9 backend → `blocked:*` + BLOCKERS.md in T10.
- **Placeholders:** none — every fix step names the file, the line region and the mechanism; test code is real; where the fix cannot be known before the walk, the step says what to assert and what counts as drift.
- **Type consistency:** `mountLibrary`, `TEN`, `item` are defined in T4 and consumed by T5–T9 under the same names; `LibraryItem`'s required fields match `mediaTypes.ts:45-70` (`key name type src size createdAt mimeType`); `data-testid`s used (`mgr-asset-<key>`, `mgr-details`, `mgr-gridn`, `mgr-view-list`, `mgr-list-head`, `mgr-list-row-<key>`) are the ones `AssetGrid.tsx` / the fullpage recipe already ship, with a grep step before first use.
