# Missing Editor Wireframes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate 14 missing `wireframes.html` files covering all remaining editor surfaces, each self-contained, passing gates G1–G7, one commit per file, in 4 sequential phases with user checkpoints.

**Architecture:** Single shared contract (locked DS V1 tokens, `1440×900` stage, `60px/320px/1fr/320px` shell grid, dark sticky nav toggling `.stage.visible`). Each wireframe is a standalone HTML file — no build step, no shared imports, copy-paste boilerplate. Per-surface differences live only in panel contents, inspector contents, and per-state overlays.

**Tech Stack:** HTML5, CSS custom properties, vanilla JS for nav toggling. Inter Tight + Geist Mono via `fonts.bunny.net`. No frameworks. No bundler.

**Spec:** `docs/superpowers/specs/2026-04-22-missing-editor-wireframes-design.md`

---

## Prerequisites

Before starting Task 0, the executor must have read:
- The spec file above (sections 1–5)
- Reference wireframe: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/build-tab-20260422/wireframes.html`

Working directory for all bash commands: `/Users/shahg/Desktop/pencil/buildrik`

Target output root: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/`

Commits land directly on `main` (solo workflow, no feature branches).

---

## File Structure

```
/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/
├── shell-20260422/wireframes.html              (Task 1 · 8 stages)
├── rail-20260422/wireframes.html               (Task 2 · 6 stages)
├── sidebar-container-20260422/wireframes.html  (Task 3 · 7 stages)
├── pages-tab-20260422/wireframes.html          (Task 4 · 8 stages)
├── history-tab-20260422/wireframes.html        (Task 5 · 7 stages)
├── elements-tab-20260422/wireframes.html       (Task 6 · 7 stages)
├── component-library-20260422/wireframes.html  (Task 7 · 7 stages)
├── wizard-20260422/wireframes.html             (Task 8 · 7 stages)
├── onboarding-20260422/wireframes.html         (Task 9 · 7 stages)
├── animation-20260422/wireframes.html          (Task 10 · 7 stages)
├── collaboration-20260422/wireframes.html      (Task 11 · 7 stages)
├── ecommerce-20260422/wireframes.html          (Task 12 · 7 stages)
├── export-20260422/wireframes.html             (Task 13 · 7 stages)
└── sync-20260422/wireframes.html               (Task 14 · 7 stages)
```

One file = one wireframe. One wireframe = one commit. No shared library file (each HTML is self-contained).

---

## Task 0: Internalize Shared Boilerplate and Gates

**Files:** none (reference only)

This task establishes the reusable boilerplate used by every subsequent task. Read and understand, do not write any files.

### Boilerplate Head (BP-HEAD)

Every `wireframes.html` starts with this exact block:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Buildrik · <SURFACE_NAME> wireframes</title>
<link rel="preconnect" href="https://fonts.bunny.net">
<link href="https://fonts.bunny.net/css?family=inter-tight:400,500,600,700|geist-mono:400,500" rel="stylesheet">
<style>
:root{
  --aqb-bg-app:#F1F5F9;
  --aqb-bg-panel:#F8FAFC;
  --aqb-bg-subtle:#F1F5F9;
  --aqb-bg-card:#FFFFFF;
  --aqb-bg-elevated:#FFFFFF;
  --aqb-border:#E2E8F0;
  --aqb-border-medium:#CBD5E1;
  --aqb-border-strong:#94A3B8;
  --aqb-text-primary:#334155;
  --aqb-text-secondary:#64748B;
  --aqb-text-muted:#94A3B8;
  --aqb-text-disabled:#CBD5E1;
  --accent:#2D6DFF;
  --accent-hover:#4B8DFF;
  --accent-pressed:#1E58D9;
  --accent-tint:rgba(45,109,255,0.10);
  --accent-subtle:rgba(45,109,255,0.05);
  --accent-on:#FFFFFF;
  --success:#16A34A;
  --warning:#D97706;
  --error:#DC2626;
  --aqb-font:"Inter Tight","sans-serif";
  --aqb-font-mono:"Geist Mono","monospace";
  --shadow-modal:0 8px 32px rgba(15,23,42,0.08);
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:var(--aqb-font);background:#E2E8F0;color:var(--aqb-text-primary);font-size:13px;line-height:1.45;-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer;border:0;background:transparent;color:inherit}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}

/* Nav */
.nav{position:sticky;top:0;z-index:100;display:flex;flex-wrap:wrap;gap:4px;padding:12px 20px;background:#0F172A;color:#CBD5E1;font-family:var(--aqb-font-mono);font-size:11px}
.nav-label{display:flex;align-items:center;padding:0 12px 0 0;color:#64748B;text-transform:uppercase}
.nav button{padding:6px 10px;border-radius:4px;color:#CBD5E1;font-family:var(--aqb-font-mono);font-size:11px}
.nav button:hover{background:rgba(255,255,255,.08);color:#fff}
.nav button.active{background:var(--accent);color:#fff}

.section-head{max-width:1440px;margin:40px auto 0;padding:0 12px;font-family:var(--aqb-font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#475569}
.section-desc{max-width:1440px;margin:6px auto 0;padding:0 12px;font-size:12px;color:#475569;line-height:1.5}

.stage{width:1440px;height:900px;margin:24px auto;background:var(--aqb-bg-app);border:1px solid var(--aqb-border-medium);border-radius:12px;overflow:hidden;position:relative;display:none}
.stage.visible{display:block}

/* Shell */
.shell{display:grid;grid-template-columns:60px 320px 1fr 320px;height:100%}
.shell--no-inspector{grid-template-columns:60px 320px 1fr}
.shell--no-sidebar{grid-template-columns:60px 1fr 320px}
.shell--canvas-only{grid-template-columns:1fr}

/* Rail */
.rail{background:var(--aqb-bg-panel);border-right:1px solid var(--aqb-border);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px}
.rail-btn{width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--aqb-text-secondary);position:relative}
.rail-btn:hover{background:var(--accent-subtle);color:var(--aqb-text-primary)}
.rail-btn.active{background:var(--accent-tint);color:var(--accent)}
.rail-btn.active::before{content:"";position:absolute;left:-1px;top:6px;bottom:6px;width:3px;background:var(--accent);border-radius:0 2px 2px 0}
.rail-btn svg{width:18px;height:18px}
.rail-sep{width:32px;height:1px;background:var(--aqb-border);margin:4px 0}

/* Sidebar panel (320px authoring) */
.panel{background:var(--aqb-bg-panel);border-right:1px solid var(--aqb-border);display:flex;flex-direction:column;overflow:hidden}
.ps-header{height:44px;padding:0 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--aqb-border);flex-shrink:0}
.ps-title{font-size:14px;font-weight:600;color:var(--aqb-text-primary);letter-spacing:-.005em}
.ps-spacer{flex:1}
.ps-iconbtn{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--aqb-text-secondary)}
.ps-iconbtn:hover{background:var(--aqb-bg-subtle);color:var(--aqb-text-primary)}
.ps-iconbtn svg{width:14px;height:14px}

/* Canvas */
.main{background:var(--aqb-bg-app);display:flex;flex-direction:column;overflow:hidden}
.topbar{height:48px;padding:0 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--aqb-border);background:var(--aqb-bg-panel);flex-shrink:0}
.tb-breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--aqb-text-secondary)}
.tb-breadcrumb .project{color:var(--aqb-text-primary);font-weight:500}
.tb-breadcrumb .sep{color:var(--aqb-text-muted)}
.tb-breadcrumb .page{color:var(--aqb-text-primary)}
.tb-spacer{flex:1}
.tb-actions{display:flex;align-items:center;gap:8px}
.tb-btn{height:30px;padding:0 12px;border-radius:6px;background:var(--aqb-bg-card);border:1px solid var(--aqb-border);font-size:12px;font-weight:500;color:var(--aqb-text-primary)}
.tb-btn:hover{border-color:var(--aqb-border-medium);background:var(--aqb-bg-subtle)}
.tb-btn--primary{background:var(--accent);border-color:var(--accent);color:var(--accent-on)}
.tb-btn--primary:hover{background:var(--accent-hover);border-color:var(--accent-hover)}
.tb-avatar{width:28px;height:28px;border-radius:50%;background:var(--accent-tint);color:var(--accent);font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center}
.canvas{flex:1;overflow:hidden;padding:24px;display:flex;align-items:center;justify-content:center}
.canvas-artboard{width:100%;max-width:960px;height:100%;background:var(--aqb-bg-card);border:1px solid var(--aqb-border);border-radius:4px;color:var(--aqb-text-muted);font-family:var(--aqb-font-mono);font-size:11px;display:flex;align-items:center;justify-content:center}

/* Inspector */
.inspector{background:var(--aqb-bg-panel);border-left:1px solid var(--aqb-border);overflow-y:auto;padding:12px}

/* Modal overlay (used by several surfaces) */
.modal-scrim{position:absolute;inset:0;background:rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;z-index:20}
.modal{background:var(--aqb-bg-card);border:1px solid var(--aqb-border);border-radius:8px;box-shadow:var(--shadow-modal);min-width:480px;max-width:640px;padding:20px}
.modal-title{font-size:15px;font-weight:600;color:var(--aqb-text-primary);margin:0 0 6px}
.modal-body{font-size:12px;color:var(--aqb-text-secondary);line-height:1.5}
.modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}

/* Empty state */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:10px;text-align:center;color:var(--aqb-text-muted)}
.empty-icon{width:40px;height:40px;border-radius:8px;background:var(--aqb-bg-card);border:1px solid var(--aqb-border);display:flex;align-items:center;justify-content:center;color:var(--aqb-text-secondary)}
.empty-title{font-size:13px;font-weight:600;color:var(--aqb-text-primary)}
.empty-body{font-size:11px;color:var(--aqb-text-secondary);max-width:240px}

/* Error banner */
.err-banner{background:#FEF2F2;border:1px solid #FECACA;color:var(--error);padding:8px 12px;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px}

/* Loading skeleton */
.skel{background:linear-gradient(90deg,var(--aqb-bg-subtle),var(--aqb-border),var(--aqb-bg-subtle));background-size:200% 100%;animation:skel 1.2s infinite;border-radius:4px}
@keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* <<< PER-SURFACE CSS APPENDS HERE >>> */
</style>
</head>
<body>
```

### Boilerplate Nav (BP-NAV)

Every wireframe has this nav, customized per surface:

```html
<div class="nav" role="tablist" aria-label="States">
  <span class="nav-label"><SURFACE_LABEL></span>
  <button class="active" data-state="1">1 · <STATE_1_LABEL></button>
  <button data-state="2">2 · <STATE_2_LABEL></button>
  <!-- … one button per state up to N … -->
</div>
```

### Boilerplate Stage (BP-STAGE)

Every stage follows this pattern. `data-state-id` on `.stage` matches `data-state` on nav button. First stage has `visible` class pre-applied.

```html
<div class="section-head" data-for="1">State 1 — <STATE_1_LABEL></div>
<div class="section-desc" data-for="1"><ONE_SENTENCE_DESCRIPTION></div>
<div class="stage visible" data-state-id="1">
  <div class="shell">
    <!-- rail, panel, main, inspector — omit panels per shell variant -->
  </div>
</div>
```

### Boilerplate Script (BP-SCRIPT)

Every wireframe ends with this exact block before `</body>`:

```html
<script>
const btns=document.querySelectorAll('.nav button[data-state]');
const stages=document.querySelectorAll('.stage');
const heads=document.querySelectorAll('.section-head');
const descs=document.querySelectorAll('.section-desc');
btns.forEach(b=>b.addEventListener('click',()=>{
  const id=b.dataset.state;
  btns.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  stages.forEach(s=>s.classList.toggle('visible',s.dataset.stateId===id));
  heads.forEach(h=>h.style.display=h.dataset.for===id?'block':'none');
  descs.forEach(d=>d.style.display=d.dataset.for===id?'block':'none');
  window.scrollTo({top:0,behavior:'smooth'});
}));
heads.forEach(h=>h.style.display=h.dataset.for==='1'?'block':'none');
descs.forEach(d=>d.style.display=d.dataset.for==='1'?'block':'none');
</script>
</body>
</html>
```

### Gate Script (GS)

Every task runs this gate function after writing the file. Save as an ad-hoc shell function for the session (DO NOT commit):

```bash
run_gates() {
  local f="$1"
  local errors=0

  echo "=== Gates for $f ==="

  # G1: hex colors must be in DS allowlist
  local allowed='#F1F5F9|#F8FAFC|#FFFFFF|#E2E8F0|#CBD5E1|#94A3B8|#334155|#64748B|#2D6DFF|#4B8DFF|#1E58D9|#16A34A|#D97706|#DC2626|#0F172A|#475569|#FEF2F2|#FECACA|#FEF3C7'
  local bad_hex
  bad_hex=$(grep -oE '#[0-9a-fA-F]{3,8}' "$f" | grep -vE "^($allowed)$" | sort -u)
  if [ -n "$bad_hex" ]; then
    echo "G1 FAIL: non-allowlist hex colors found:"
    echo "$bad_hex"
    errors=$((errors+1))
  else
    echo "G1 PASS: hex colors"
  fi

  # G2: no banned font stacks
  if grep -qE '(Arial|Helvetica|Roboto)' "$f"; then
    echo "G2 FAIL: banned font stack found (Arial/Helvetica/Roboto)"
    errors=$((errors+1))
  else
    echo "G2 PASS: font stack"
  fi

  # G3: stage count 6-11
  local stage_count
  stage_count=$(grep -cE 'class="stage( visible)?" data-state-id=' "$f")
  if [ "$stage_count" -lt 6 ] || [ "$stage_count" -gt 11 ]; then
    echo "G3 FAIL: stage count $stage_count not in [6,11]"
    errors=$((errors+1))
  else
    echo "G3 PASS: stage count $stage_count"
  fi

  # G4: geometry — stage width/height, shell grid
  if ! grep -q 'width:1440px;height:900px' "$f"; then
    echo "G4 FAIL: stage geometry 1440x900 missing"
    errors=$((errors+1))
  elif ! grep -q 'grid-template-columns:60px 320px 1fr 320px' "$f"; then
    echo "G4 FAIL: shell grid 60/320/1fr/320 missing"
    errors=$((errors+1))
  else
    echo "G4 PASS: geometry"
  fi

  # G5: nav-wiring — every data-state-id has matching nav button
  local stage_ids nav_ids
  stage_ids=$(grep -oE 'data-state-id="[0-9]+"' "$f" | grep -oE '[0-9]+' | sort -u)
  nav_ids=$(grep -oE 'data-state="[0-9]+"' "$f" | grep -oE '[0-9]+' | sort -u)
  if [ "$stage_ids" != "$nav_ids" ]; then
    echo "G5 FAIL: stage ids ($stage_ids) != nav ids ($nav_ids)"
    errors=$((errors+1))
  elif ! grep -q 'class="stage visible"' "$f"; then
    echo "G5 FAIL: no stage has class='stage visible' (first stage must be pre-visible)"
    errors=$((errors+1))
  else
    echo "G5 PASS: nav wiring"
  fi

  # G6: self-contained — only fonts.bunny.net external
  local bad_ext
  bad_ext=$(grep -E '(<script src=|<link rel="stylesheet")' "$f" | grep -v 'fonts.bunny.net')
  if [ -n "$bad_ext" ]; then
    echo "G6 FAIL: external asset other than fonts.bunny.net:"
    echo "$bad_ext"
    errors=$((errors+1))
  else
    echo "G6 PASS: self-contained"
  fi

  # G7: file size 400-900 lines
  local lines
  lines=$(wc -l < "$f")
  if [ "$lines" -lt 400 ] || [ "$lines" -gt 900 ]; then
    echo "G7 FAIL: line count $lines not in [400,900]"
    errors=$((errors+1))
  else
    echo "G7 PASS: line count $lines"
  fi

  echo "=== $errors error(s) ==="
  return $errors
}
```

- [ ] **Step 0.1: Define the gate function in the current shell session**

Run:
```bash
# Paste the run_gates function above into the current shell
# Verify it's defined:
type run_gates
```
Expected: `run_gates is a function`

No file is written or committed in Task 0.

---

## Phase 1 — Foundation

### Task 1: shell wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/shell-20260422/wireframes.html`

**Surface label in nav:** `SHELL`

**Stage count:** 8

**States (numeric ids 1–8):**

| id | Label | Shell variant | Key differences from default |
|----|-------|---------------|------------------------------|
| 1 | Default (idle canvas) | `.shell` (all 4 panels) | All panels visible; canvas shows empty artboard with placeholder text "Drop elements here"; inspector shows "Select an element to edit"; rail active = Pages tab (second icon) |
| 2 | Element selected | `.shell` | Canvas shows artboard with a selected mock element (blue outline + resize handles); inspector fully populated with Layout / Spacing / Typography accordions |
| 3 | No-inspector mode | `.shell--no-inspector` | 3-column grid (rail, sidebar, canvas); topbar shows toggle `Inspector: off` pill |
| 4 | Preview / fullscreen | `.shell--canvas-only` | All chrome collapsed; floating Exit Preview pill at top-right; canvas at 100% width; device frame around artboard |
| 5 | Loading skeleton | `.shell` | Every panel filled with `.skel` placeholder rectangles; rail icons at 50% opacity; topbar shows "Loading project…" |
| 6 | Dirty / unsaved | `.shell` | Topbar breadcrumb appends orange dot + "unsaved" text; Publish button shows "Save draft" secondary; Preview button disabled |
| 7 | Offline banner | `.shell` | Top-row banner above topbar: `.err-banner` variant with amber `#D97706` color saying "Offline — changes queued locally"; Publish disabled |
| 8 | Responsive preview | `.shell--no-inspector` | Canvas artboard replaced by 390px-wide mobile frame (iPhone-esque); topbar shows breakpoint switcher (`Desktop / Tablet / Mobile`) with Mobile active |

- [ ] **Step 1.1: Create the folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/shell-20260422
```

- [ ] **Step 1.2: Write `wireframes.html`**

Compose the file as:
1. `BP-HEAD` with `<SURFACE_NAME>` = `Shell (root layout)`.
2. Append under `/* <<< PER-SURFACE CSS APPENDS HERE >>> */`:
   - CSS for `.preview-exit-pill` (floating cobalt pill, top-right, 12px padding, shadow).
   - CSS for `.breakpoint-switch` (segmented control, 3 pills, each 72px wide).
   - CSS for `.mobile-frame` (390×800 bordered rounded rectangle centered in canvas).
3. `BP-NAV` with `<SURFACE_LABEL>` = `SHELL`, one button per state.
4. 8 `BP-STAGE` blocks, each with the shell variant and state-specific content from the table above.
5. `BP-SCRIPT`.

Total expected file size: 550–750 lines.

- [ ] **Step 1.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/shell-20260422/wireframes.html
```
Expected: `0 error(s)`. If any gate fails, fix inline and re-run before continuing.

- [ ] **Step 1.4: Visual spot-check (optional but recommended)**

Run:
```bash
open /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/shell-20260422/wireframes.html
```
Click through all 8 nav buttons. Verify each stage renders distinct content. Close browser.

- [ ] **Step 1.5: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/shell-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: shell — 8 states (root layout)

Covers default, element-selected, no-inspector, preview/fullscreen,
loading skeleton, dirty/unsaved, offline banner, responsive preview.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: rail wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/rail-20260422/wireframes.html`

**Surface label in nav:** `RAIL`

**Stage count:** 6

**States (numeric ids 1–6):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Default | Full rail with 8 icon buttons: Pages, Build, Templates, Design, Media, History, Layers, Settings. Pages = active. Small separators `.rail-sep` between groups (3 groups). Right of rail: dimmed panel showing `panel` with minimal placeholder so rail context visible. |
| 2 | Hover tooltip | Same as S1 + tooltip element absolutely positioned right of "Build" icon: dark-navy bg `#0F172A`, white text "Build (B)", 6px padding, small arrow. |
| 3 | Badge / dot | Same as S1 + red dot `#DC2626` 8px circle top-right of "History" icon (indicates new activity); cobalt dot on "Media" (indicates unread). |
| 4 | Active pressed | Same as S1 but "Build" clicked: shows :active state (background `--accent-pressed`, slightly inset shadow). |
| 5 | Disabled / locked | Same as S1 + "Templates" button with 30% opacity + lock SVG overlay in corner; tooltip explaining "Upgrade to unlock templates". |
| 6 | Context menu open | Same as S1 + context menu to the right of "Pages" icon: 160px card, 3 items (Rename, Duplicate, Delete), arrow pointing at icon. |

- [ ] **Step 2.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/rail-20260422
```

- [ ] **Step 2.2: Write `wireframes.html`**

Compose using BP-HEAD + per-surface CSS (`.rail-tooltip`, `.rail-badge`, `.rail-context-menu`, `.rail-lock`) + BP-NAV (label `RAIL`) + 6 BP-STAGE + BP-SCRIPT.

Each stage uses `.shell--no-inspector` shell variant so the rail is emphasized; panel holds a single neutral label "panel"; canvas holds placeholder artboard.

Total: 450–600 lines.

- [ ] **Step 2.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/rail-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 2.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/rail-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: rail — 6 states (icon navigation)

Covers default, hover tooltip, badge/dot, active pressed,
disabled/locked, context menu.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: sidebar-container wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-container-20260422/wireframes.html`

**Surface label in nav:** `SIDEBAR CONTAINER`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Default | Standard `.panel` with `.ps-header` showing title "Pages", search icon right, collapse icon far right. Body = 8 mock list items (each = 36px row with small thumbnail + label). |
| 2 | Search active | Header replaced by inline search input (Cmd+K style), placeholder "Filter pages…", `/` kbd hint. Below: 3 filtered results. |
| 3 | Secondary tabs row | Header + secondary tabs row below (height 32px, 3 tabs: All / Published / Drafts). All-count = 8, Published = 5, Drafts = 3. |
| 4 | Collapsed | `.shell--no-sidebar` variant. Rail + canvas + inspector only. Tooltip near rail indicating "Sidebar collapsed — click to expand". |
| 5 | Resize handle grab | Default panel + a vertical resize handle between panel and canvas showing cobalt highlight + cursor grab icon + width indicator tooltip "320 → 384". |
| 6 | Scrolled (sticky header) | Default panel but scrolled mid-list; `.ps-header` has bottom shadow; list shows items 12–20; scrollbar visible on right. |
| 7 | Filter chips row | Header + chip row below (height 36px, chips: Status ×, Author Sam ×, Modified 7d ×, + Add filter). Below: filtered list of 5 items. |

- [ ] **Step 3.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-container-20260422
```

- [ ] **Step 3.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.ps-tabs`, `.ps-filter-chips`, `.ps-resize-handle`, `.list-row`, `.list-row-thumb`) + BP-NAV (label `SIDEBAR CONTAINER`) + 7 BP-STAGE + BP-SCRIPT.

Total: 450–650 lines.

- [ ] **Step 3.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-container-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 3.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-container-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: sidebar-container — 7 states (panel wrapper)

Covers default, search, secondary tabs, collapsed, resize handle,
scrolled sticky header, filter chips.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Checkpoint P1

- [ ] **Checkpoint P1: pause for user review**

Stop after Task 3. Show the user all 3 phase-1 files:
```bash
ls -la /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/{shell,rail,sidebar-container}-20260422/
git log --oneline main -3
```
Ask: "P1 Foundation done (3 wireframes). Review files and commits. Approve to proceed to P2, or request changes?"

Wait for user approval before starting Task 4.

---

## Phase 2 — Sidebar Tabs

### Task 4: pages-tab wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/pages-tab-20260422/wireframes.html`

**Surface label in nav:** `PAGES TAB`

**Stage count:** 8

**States (numeric ids 1–8):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Default list | Panel with header "Pages" + Add button. Body: 5 page rows (home, about, pricing, blog, contact) each with thumbnail, title, meta (published status + date). Active row highlighted. |
| 2 | Populated + groups | Same as S1 but 15+ rows organized into 3 folders (Marketing, Blog, Legal) with collapsible group headers + count badges. |
| 3 | Empty CTA | Empty state (`.empty` class): "No pages yet" + "Create your first page to get started" + primary cobalt button "+ New page". |
| 4 | Search results | Search input active, query "pric" typed; 2 results shown with matching text bolded. |
| 5 | Bulk-select toolbar | Several rows have checkboxes visible; top toolbar bar (dark-navy `#0F172A`) shows "3 selected" + action buttons (Publish, Unpublish, Move, Duplicate, Delete, × clear). |
| 6 | Drag-reorder | One row being dragged (translucent, cobalt outline); drop indicator line between two other rows; drag-ghost cursor. |
| 7 | Page-settings drawer | Right-side drawer slides in from inspector area (or overlays it): 320-384px wide, tabs (General / SEO / Social / Advanced); General tab active showing slug, title, meta desc fields. |
| 8 | Error / loading | Top error banner `.err-banner`: "Failed to load pages — retry". Below: 3 skeleton rows. |

- [ ] **Step 4.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/pages-tab-20260422
```

- [ ] **Step 4.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.pg-row`, `.pg-thumb`, `.pg-meta`, `.pg-group-hdr`, `.pg-bulk-bar`, `.pg-drawer`, `.pg-drawer-tabs`, `.pg-drop-line`) + BP-NAV (label `PAGES TAB`) + 8 BP-STAGE + BP-SCRIPT.

Total: 550–750 lines.

- [ ] **Step 4.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/pages-tab-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 4.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/pages-tab-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: pages-tab — 8 states (pages list)

Covers default list, groups, empty, search, bulk-select,
drag-reorder, page-settings drawer, error/loading.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: history-tab wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/history-tab-20260422/wireframes.html`

**Surface label in nav:** `HISTORY TAB`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Timeline recent | Vertical timeline with 8 entries; each = avatar + action text + timestamp + diff count (+3/-1). Most-recent at top, today/yesterday/earlier groups. |
| 2 | Version preview | An entry expanded inline showing preview thumbnail of the page at that point + "Restore to this version" cobalt CTA. |
| 3 | Compare diff | 2 entries selected (checkboxes); main canvas area shows side-by-side before/after diff of one element's props table (added / removed / changed rows). |
| 4 | Restore modal | Background same as S2 + modal scrim + `.modal` card asking "Restore to April 18, 3:42 pm? This will create a new version above current." Cancel / Restore buttons. |
| 5 | Empty | `.empty` state: "No history yet" + "Changes will appear here as you edit" + small clock icon. |
| 6 | Filter by user/date | Top of panel has filter row: user dropdown (showing "Sam Gupta"), date range (7 days), action filter (Edit only). Results filtered to 4 entries. |
| 7 | Snapshot create | Panel shows form overlay: "Create snapshot" + name input + optional description textarea + tags chips + Create / Cancel. |

- [ ] **Step 5.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/history-tab-20260422
```

- [ ] **Step 5.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.hist-row`, `.hist-avatar`, `.hist-ts`, `.hist-diff`, `.hist-diff-table`, `.hist-filter-row`, `.hist-snapshot-form`) + BP-NAV (label `HISTORY TAB`) + 7 BP-STAGE + BP-SCRIPT.

Total: 550–700 lines.

- [ ] **Step 5.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/history-tab-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 5.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/history-tab-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: history-tab — 7 states (timeline + versions)

Covers timeline, version preview, compare diff, restore modal,
empty, filter, snapshot create.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: elements-tab wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/elements-tab-20260422/wireframes.html`

**Surface label in nav:** `ELEMENTS TAB`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Default grid | Panel with 2-col grid of element cards (12 shown): Heading, Text, Button, Image, Video, Form, Input, Divider, Container, Grid, Flex, Spacer. |
| 2 | Category filter | Top filter row with chips: All / Text / Media / Layout / Form / Advanced. "Text" active. Grid shows only text-related elements (5 cards). |
| 3 | Search | Search input with query "but"; grid shows Button + Back Button + Submit Button results (3 cards) with match highlighted. |
| 4 | Favorites | Top tab switched to "Favorites"; grid shows 4 favorited cards with filled yellow star. |
| 5 | Hover preview | One element card hovered; floating preview card to its right showing rendered example (actual button look). |
| 6 | Drag-to-canvas | One card being dragged (translucent, cobalt ring); drop indicator on canvas showing where the element will land; canvas has highlighted drop zone. |
| 7 | Empty results | Search query "xyz" with no matches; `.empty` state: "No elements match 'xyz'" + "Clear search" link. |

- [ ] **Step 6.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/elements-tab-20260422
```

- [ ] **Step 6.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.el-grid`, `.el-card`, `.el-card-icon`, `.el-card-label`, `.el-cat-chip`, `.el-preview-card`, `.el-drop-zone`) + BP-NAV (label `ELEMENTS TAB`) + 7 BP-STAGE + BP-SCRIPT.

Total: 500–650 lines.

- [ ] **Step 6.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/elements-tab-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 6.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/elements-tab-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: elements-tab — 7 states (elements palette)

Covers default grid, category filter, search, favorites,
hover preview, drag-to-canvas, empty results.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: component-library wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/component-library-20260422/wireframes.html`

**Surface label in nav:** `COMPONENT LIBRARY`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Library grid | Panel with 2-col grid of library components: Nav, Hero, Features, Testimonial, CTA, Footer, Pricing, FAQ (8 cards with larger thumbnails showing section preview). |
| 2 | Category view | Top tabs: Navigation / Hero / Content / Commerce / Forms. "Navigation" active; grid shows 4 nav variants. |
| 3 | Component detail + variants | One component selected; detail panel below grid shows: name, description, 3 variants as thumbnails, Insert button (cobalt primary), preview toggle. |
| 4 | Create-new modal | Modal scrim + modal card: "Create component" form — name input, description textarea, category select, tags chips, preview placeholder, Create/Cancel buttons. |
| 5 | Search | Search input with query "hero"; grid shows 2 matching cards (Hero Classic, Hero Split) with query highlighted in title. |
| 6 | Saved / custom tab | Top tabs switched to "My Components"; grid shows 3 user-saved components with "Custom" badge + edit/delete icons on hover. |
| 7 | Empty | `.empty` state: "No components yet" + "Save sections as reusable components to see them here" + cobalt link "Learn more". |

- [ ] **Step 7.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/component-library-20260422
```

- [ ] **Step 7.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.lib-grid`, `.lib-card`, `.lib-thumb`, `.lib-detail`, `.lib-variant`, `.lib-create-form`, `.lib-custom-badge`) + BP-NAV (label `COMPONENT LIBRARY`) + 7 BP-STAGE + BP-SCRIPT.

Total: 550–700 lines.

- [ ] **Step 7.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/component-library-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 7.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/component-library-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: component-library — 7 states (reusable components)

Covers library grid, category view, component detail, create-new
modal, search, saved/custom, empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Checkpoint P2

- [ ] **Checkpoint P2: pause for user review**

Stop after Task 7. Show the user all 4 phase-2 files:
```bash
ls -la /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/{pages,history,elements,component-library}-*20260422*/
git log --oneline main -4
```
Ask: "P2 Sidebar tabs done (4 wireframes). Approve to proceed to P3?"

Wait for user approval before starting Task 8.

---

## Phase 3 — Overlays

### Task 8: wizard wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/wizard-20260422/wireframes.html`

**Surface label in nav:** `WIZARD`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Step 1 template pick | Full-screen overlay (100% shell, dimmed bg behind): centered card (640px), progress rail at top (`1 of 4`), grid of 6 template thumbnails (Landing, Blog, Shop, Portfolio, SaaS, Blank). Next button disabled. |
| 2 | Step 2 content setup | Same layout; progress rail shows step 2; form fields: Business name, Tagline, Industry select. Back / Next (Next enabled). |
| 3 | Step 3 customize | Step 3; color theme picker (6 swatches — first is cobalt `#2D6DFF`, none purple), font pair dropdown, logo upload dropzone. |
| 4 | Step 4 review | Step 4; summary table showing picked template, filled fields, chosen theme; preview thumbnail right side; Back / Create buttons. |
| 5 | Complete | Green success state: big checkmark `#16A34A`, "Your site is ready!", 3 next-action CTAs (Open editor, Invite team, Share link). |
| 6 | Error in step | Step 2 with validation error on "Business name" field (red outline, small error text); error banner at top "Please fill required fields". |
| 7 | Back / skip | Step 3 with "Skip for now" link visible bottom-left + confirmation popover on hover "You can customize later". |

- [ ] **Step 8.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/wizard-20260422
```

- [ ] **Step 8.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.wiz-overlay`, `.wiz-card`, `.wiz-progress`, `.wiz-step`, `.wiz-template-grid`, `.wiz-template-thumb`, `.wiz-field`, `.wiz-success`) + BP-NAV (label `WIZARD`) + 7 BP-STAGE + BP-SCRIPT.

Each stage uses `.shell--canvas-only` and the wizard overlay fills the stage.

Total: 500–700 lines.

- [ ] **Step 8.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/wizard-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 8.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/wizard-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: wizard — 7 states (4-step new project flow)

Covers template pick, content setup, customize, review, complete,
error-in-step, back/skip.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: onboarding wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/onboarding-20260422/wireframes.html`

**Surface label in nav:** `ONBOARDING`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Welcome splash | Full-screen centered: large "Welcome to Buildrik" heading, short subheading, cobalt primary CTA "Get started", secondary "Watch demo". Subtle illustration area placeholder (gray rounded rectangle). |
| 2 | Role / profile | Form card: "What best describes you?" + 4 large radio cards (Designer, Developer, Marketer, Other). Continue disabled until select. |
| 3 | Team invite | Card: "Invite your team"; email input repeater (3 rows, one with sample email); role dropdown per row; Skip + Send invites buttons. |
| 4 | First project | Card: "Create your first project"; form: project name, template select (visual row of 4 thumbnails), Start project cobalt button. |
| 5 | Tour popover A | Full editor chrome visible (using normal shell); cobalt-outlined popover with arrow pointing at rail "Build" icon: "Add elements from here" + 1/4 + Next. |
| 6 | Tour popover B | Same shell; popover pointing at topbar Publish button: "Ship your changes when ready" + 3/4 + Next. |
| 7 | Completion | Centered celebration card: confetti illustration placeholder, "You're all set!", "Explore the editor" CTA, small link "Replay tour". |

- [ ] **Step 9.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/onboarding-20260422
```

- [ ] **Step 9.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.onb-welcome`, `.onb-role-card`, `.onb-invite-row`, `.onb-tour-popover`, `.onb-tour-arrow`, `.onb-celebration`) + BP-NAV (label `ONBOARDING`) + 7 BP-STAGE + BP-SCRIPT.

Total: 500–700 lines.

- [ ] **Step 9.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/onboarding-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 9.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/onboarding-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: onboarding — 7 states (new-user flow)

Covers welcome, role pick, team invite, first project,
tour popover A, tour popover B, completion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Checkpoint P3

- [ ] **Checkpoint P3: pause for user review**

Stop after Task 9. Show the user:
```bash
ls -la /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/{wizard,onboarding}-20260422/
git log --oneline main -2
```
Ask: "P3 Overlays done (2 wireframes). Approve to proceed to P4?"

Wait for user approval before starting Task 10.

---

## Phase 4 — Feature Modules

### Task 10: animation wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/animation-20260422/wireframes.html`

**Surface label in nav:** `ANIMATION`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Panel default | Right-side panel (inside inspector slot or sidebar) listing existing animations on selected element: Fade in, Slide up. Each = name + trigger (On load) + duration (300ms) + play icon. Add animation button. |
| 2 | Selected anim editor | One animation expanded showing: trigger select (On load / On scroll / On hover / On click), duration slider, easing dropdown, delay input, direction toggles. |
| 3 | Timeline view | Bottom dock (height 200px) showing horizontal timeline; tracks = 3 layers; keyframes = cobalt diamonds; playhead; play/pause/loop controls. Replaces canvas artboard temporarily. |
| 4 | Keyframe editor | Timeline visible + keyframe selected (outlined cobalt); right-panel detail shows property value (opacity 0 → 1), easing curve preview, Copy / Delete. |
| 5 | Preset library | Overlay or modal: grid of animation preset cards (Fade, Slide, Zoom, Rotate, Bounce, Elastic) with animated thumbnail loops (static preview acceptable). Apply button. |
| 6 | Empty | `.empty` state inside animation panel: "No animations on this element" + "Add one to bring it to life" + Add button. |
| 7 | Preview playing | Canvas artboard shows a mock component with animation playing (transform: translateY indicator + opacity fade); top overlay pill "Previewing · 0.8s" + stop button. |

- [ ] **Step 10.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/animation-20260422
```

- [ ] **Step 10.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.anim-list-row`, `.anim-editor`, `.anim-timeline`, `.anim-track`, `.anim-keyframe`, `.anim-preset-card`, `.anim-preview-pill`) + BP-NAV (label `ANIMATION`) + 7 BP-STAGE + BP-SCRIPT.

Total: 550–700 lines.

- [ ] **Step 10.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/animation-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 10.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/animation-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: animation — 7 states (animation authoring)

Covers panel default, editor, timeline, keyframe editor,
preset library, empty, preview playing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: collaboration wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/collaboration-20260422/wireframes.html`

**Surface label in nav:** `COLLABORATION`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Solo default | Full editor chrome; topbar shows only current user avatar "SG"; no cursors on canvas. |
| 2 | Active cursors | 3 labeled colored cursors on canvas (Alice — cobalt, Bo — amber, Cy — teal). Topbar shows 4 avatars overlapping (SG + 3). |
| 3 | Comments thread | Right-side comment drawer: thread with 3 comments on selected element (avatar, name, text, timestamp), reply input at bottom, "Resolve" button. |
| 4 | Share modal | Modal: "Share this project" + link input with Copy button, access select (Anyone with link / Team only / Private), email invite field with role (Editor/Viewer). |
| 5 | Permissions editor | Modal: members list with 5 rows (avatar + name + role dropdown + remove × per row); Invite more button bottom; pending-invite row with orange "Pending" pill. |
| 6 | Conflict / merge | Inline banner on canvas: "Alice edited this section simultaneously. Review changes →" + cobalt CTA. Selected element has diagonal striped overlay. |
| 7 | Presence avatars topbar | Zoomed-in crop of topbar area only; avatar stack with 5 avatars (4 visible + "+2"); hovering one shows tooltip card with name, role, last active, Follow button. |

- [ ] **Step 11.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/collaboration-20260422
```

- [ ] **Step 11.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.collab-cursor`, `.collab-avatar-stack`, `.collab-comment-drawer`, `.collab-comment`, `.collab-share-modal`, `.collab-perm-row`, `.collab-conflict-banner`) + BP-NAV (label `COLLABORATION`) + 7 BP-STAGE + BP-SCRIPT.

Multi-user cursor colors MUST come from the DS allowlist — do NOT introduce new hex. Use exactly: Alice = `var(--accent)` (`#2D6DFF`), Bo = `var(--warning)` (`#D97706`), Cy = `var(--success)` (`#16A34A`). These three tokens are already in the G1 allowlist, so the standard `run_gates` check will pass without any per-task override.

Total: 550–700 lines.

- [ ] **Step 11.3: Run gates (standard)**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/collaboration-20260422/wireframes.html
```
Expected: `0 error(s)`. If cursor colors cause G1 failure, replace with accent/warning/success tokens per note above.

- [ ] **Step 11.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/collaboration-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: collaboration — 7 states (multiplayer)

Covers solo, active cursors, comments thread, share modal,
permissions editor, conflict/merge, presence avatars.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: ecommerce wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ecommerce-20260422/wireframes.html`

**Surface label in nav:** `ECOMMERCE`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Products list | Panel with product list: 6 rows (image + title + price + inventory badge). Add product CTA. |
| 2 | Product detail | Expanded product view in main area: image gallery, title input, price, variants table, description, Save button. |
| 3 | Cart / checkout preview | Canvas artboard renders a cart page preview with 2 line items + subtotal + checkout button (mock customer view). |
| 4 | Payment methods | Panel tab: list of payment providers (Stripe, PayPal, Apple Pay) with Connect buttons; Stripe shown as Connected with account id. |
| 5 | Orders dash | Panel switched to Orders tab: table with 5 rows (order #, customer, total, status pill, date). Status pills: Paid / Shipped / Refunded / Pending. |
| 6 | Empty | `.empty` state: "No products yet" + "Add your first product to start selling" + Add product button. |
| 7 | Settings / config | Panel tab: form with store name, currency select, tax rate, shipping zones (repeater), save button. |

- [ ] **Step 12.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ecommerce-20260422
```

- [ ] **Step 12.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.ec-product-row`, `.ec-product-thumb`, `.ec-price`, `.ec-variant-row`, `.ec-cart-preview`, `.ec-payment-row`, `.ec-order-row`, `.ec-status-pill`, `.ec-shipping-zone`) + BP-NAV (label `ECOMMERCE`) + 7 BP-STAGE + BP-SCRIPT.

Total: 600–800 lines.

- [ ] **Step 12.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ecommerce-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 12.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ecommerce-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: ecommerce — 7 states (store management)

Covers products list, product detail, cart preview, payment
methods, orders dash, empty, settings.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: export wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/export-20260422/wireframes.html`

**Surface label in nav:** `EXPORT`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | Panel default | Panel title "Export"; body shows summary (project name, last export, size estimate) + cobalt "Start new export" button. |
| 2 | Format pick | Three format cards side-by-side: ZIP (Static files), Cloud (Publish to Buildrik host), Code (React + Tailwind). Each with icon, bullet points, Select button. |
| 3 | Options config | Selected ZIP; form: include assets (toggle), minify HTML (toggle), sitemap (toggle), custom domain (input), Next button. |
| 4 | In-progress | Vertical step list (5 steps): Compiling → Optimizing → Packaging → Uploading → Done. Current step has spinner; past steps green check; future steps gray. |
| 5 | Success + download | Big green check; "Export complete"; primary CTA "Download site.zip (2.4 MB)"; secondary "Copy link"; summary metadata. |
| 6 | Error | Red banner "Export failed"; expandable error detail showing stderr-like mono log; Retry + Report button. |
| 7 | Export history | Table with 5 past exports: date, format, size, status, Download link. Filter by status pills above. |

- [ ] **Step 13.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/export-20260422
```

- [ ] **Step 13.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.exp-format-card`, `.exp-option-row`, `.exp-step-list`, `.exp-step-row`, `.exp-spinner`, `.exp-success`, `.exp-log`, `.exp-history-row`) + BP-NAV (label `EXPORT`) + 7 BP-STAGE + BP-SCRIPT.

Spinner CSS: use pure CSS `@keyframes` on a small circle, cobalt stroke. No JS animation.

Total: 550–700 lines.

- [ ] **Step 13.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/export-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 13.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/export-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: export — 7 states (export pipeline)

Covers default, format pick, options, in-progress, success,
error, history.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: sync wireframe

**Files:**
- Create: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sync-20260422/wireframes.html`

**Surface label in nav:** `SYNC`

**Stage count:** 7

**States (numeric ids 1–7):**

| id | Label | Key content |
|----|-------|-------------|
| 1 | All-synced status | Topbar extension or dedicated panel: green check + "All changes synced · just now" + cloud icon. |
| 2 | Syncing progress | Cobalt spinner + "Syncing 3 changes…" + progress bar 60%; details list showing 3 queued changes (element added, style updated, page renamed). |
| 3 | Conflict detected | Red `.err-banner`: "Conflict on Hero section — local and remote diverged"; actions: View diff / Keep local / Keep remote / Merge. |
| 4 | Offline mode | Amber banner: "Working offline — 7 changes queued"; icon of offline cloud; Retry now button. |
| 5 | Version mismatch | Modal warning: "Server on newer schema v4.2, your client v4.1. Refresh to get latest."; Refresh / Ignore buttons. |
| 6 | Sync history log | Table: 8 past sync events with timestamp, type (Push/Pull), items changed, status. Filter by success/conflict. |
| 7 | Force-sync modal | Modal: "Force sync now?"; warning "This may overwrite unsynced local changes"; checklist of affected items; Cancel / Force sync (red) buttons. |

- [ ] **Step 14.1: Create folder**

Run:
```bash
mkdir -p /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sync-20260422
```

- [ ] **Step 14.2: Write `wireframes.html`**

BP-HEAD + per-surface CSS (`.sync-status`, `.sync-progress-bar`, `.sync-queue-list`, `.sync-conflict-banner`, `.sync-offline-banner`, `.sync-history-row`, `.sync-force-modal`, `.sync-danger-btn`) + BP-NAV (label `SYNC`) + 7 BP-STAGE + BP-SCRIPT.

Red/danger button: use `--error` variable (allowlisted `#DC2626`) with white text.

Total: 550–700 lines.

- [ ] **Step 14.3: Run gates**

Run:
```bash
run_gates /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sync-20260422/wireframes.html
```
Expected: `0 error(s)`.

- [ ] **Step 14.4: Commit**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add /Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/sync-20260422/wireframes.html
git commit -m "$(cat <<'EOF'
wireframe: sync — 7 states (sync status + history)

Covers all-synced, syncing progress, conflict, offline, version
mismatch, history log, force-sync modal.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Checkpoint P4 (final)

- [ ] **Checkpoint P4: final verification**

Stop after Task 14. Run end-to-end verification:

```bash
# Verify all 14 files exist
for s in shell rail sidebar-container pages-tab history-tab elements-tab component-library wizard onboarding animation collaboration ecommerce export sync; do
  f="/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/${s}-20260422/wireframes.html"
  [ -f "$f" ] && echo "OK   $s" || echo "MISS $s"
done

# Count total stages across all 14 files
total=0
for s in shell rail sidebar-container pages-tab history-tab elements-tab component-library wizard onboarding animation collaboration ecommerce export sync; do
  f="/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/${s}-20260422/wireframes.html"
  n=$(grep -cE 'class="stage( visible)?" data-state-id=' "$f" 2>/dev/null)
  echo "$s: $n stages"
  total=$((total+n))
done
echo "TOTAL STAGES: $total (target 84-154, expected ~99)"

# Commit log
git log --oneline main -14
```

Expected:
- 14 `OK` lines
- Per-file counts: 8, 6, 7, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7
- TOTAL STAGES: 99
- 14 commits on `main`

Show the results to the user. Ask: "All 14 wireframes landed. Review and confirm done, or flag any to regenerate?"

---

## Success Criteria (from spec)

1. All 14 files exist at declared paths — verified by Checkpoint P4 script.
2. Every file passes G1–G7 — verified per task (Step N.3).
3. Total stages ≥ 84 and ≤ 154 — verified by P4 total count.
4. Every commit isolated, revertable — verified by one-commit-per-task structure.
5. User approves each phase before next begins — enforced by checkpoints P1–P4.

## Out of Scope

- Port to editor TSX code.
- Engine/manager changes.
- DS token migration.
- `approved.json` selection.
- `state1-grid/` variant folders.
