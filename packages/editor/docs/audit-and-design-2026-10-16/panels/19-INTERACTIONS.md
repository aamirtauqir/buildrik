# Panel 19 — Interactions and animation: functionality specification (FD-PNL-19)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by IXD-3, IXD-4 · not VERIFIED.** Independent `design-qa-critic` review: pass 1 PROPOSAL (7 blocking) + 11 notes — fixed 2026-10-17; pass 2: 4 blocking fixed 2026-10-17. Runtime NOT RUN; geometry NOT MEASURED. Written from a source inventory (file:line below); no claim here was observed in the running app. *(DS)* = designer-selected; owner standing instruction 2026-10-17: designer recommendations are accepted (still marked *(DS)*); owner decisions OD-I1…I4 are decided as recommended (SC-22). Panel 00 (SC-1…SC-22) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): V5 (chrome motion only), GEO/DS §2.7 targets; FINAL §4 items 11 (D3-1 check id), 13; gap rows T2-18, D3-1, D3-29, CS-07, SC-11 "Behavior" (T6-8).
Governing IA: **IAF-23** D/F/H/K (`evidence/ia-final-2026-10-16/module-specifications.md:1259,1267,1275,1287` — Inspector home, no timeline workspace, contract = trigger · target · action · timing · preview/reset · missing target · conflicting style authority, versioned additions only), **IAF-15** C/:825 (Preview does not run arbitrary scripts — amended by OD-I1, §5.4), FD-INS-02 **INS-D06** motion closure (`PRODUCT-DESIGN-BRIEF.md:735`) and **INS-D08** reduced motion (`:752`), Behaviour order (`:679`), Panel 06 overlay, SC-3, SC-18 one-line Interactions contract (**replaced by this panel**), Panel 12 Issues task and Panel 14 §5.2 checks (new rows, §5.8), 00-STRATEGY job 1 "Build". DESIGN.md §Motion (100/160/240 ms) governs **editor chrome only**, not customer sites. WCAG 2.2.2 (Pause, Stop, Hide), 2.3.1 (Three flashes), 2.3.3 (Animation from interactions) apply to customer output.

---

## 1. Purpose and boundary
Interactions answer: **"What moves on my visitor's page, when, and will it look the same live as it did here?"**

Job: J1 Build (00-STRATEGY §3) *(R-1018)*
Label: the Inspector tab is **"Behavior"** (SC-11 US spelling, tab labels included); "Behaviour" below survives only in file names and citations (`behaviour.tsx`, brief headings) *(R-1018)*.

- In: Inspector › Behavior › **Interactions** (list, add, edit, play), the element **CSS animation** row inside it ("Plays when rendered", INS-D06), "Add interaction" on every SC-3 surface, presets, triggers, target, timing, repeat, per-breakpoint playback, in-editor Play, Preview behaviour, reduced-motion and accessibility of output, export/publish output, undo, performance limits.
- Out (linked): Style states (hover/pressed **appearance**, Inspector Style, brief `:586`), slider autoplay (Behavior › Playback), Lottie/video playback, Brand › Motion tokens (Panel 09 BR-04), chrome motion (DESIGN.md).
- Not in scope: multi-step timelines, scroll-linked (scrubbed) animation, non-animation actions — §10.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
Paths under `packages/editor/src/` unless noted.

| ID | Area | Today |
|---|---|---|
| IX-01 | Data | Interactions on `element.data.data.interactions: Interaction[]` (`engine/elements/ElementOperations.ts:257-270`); shape `{id, trigger, animation:{preset,duration,delay,easing,target?,reverse?,loop?,customProperties?}, enabled, name?}` (`engine/interactions/types.ts:108-145`). Element CSS animation is a **separate** record `data.data.animation: AnimationConfig` `{type,duration,delay,easing,direction,iterations,trigger,fillMode}` also written as inline `animation:` style (`ElementOperations.ts:212-249`, `shared/types/animations.ts:35-69`). Inspector updates spread the old object (`inspector/sections/interactions/index.tsx:93-95`), so unknown fields survive edits |
| IX-02 | Not per breakpoint | Interactions are element data, not styles — every breakpoint; CSS animation is a base style (overrides not traced) |
| IX-03 | Home | Inspector › Behavior, after Visibility (`inspector/config/sectionOrder.ts:28-40`); opens by default when the element has any (`index.tsx:130-138`); not on the page root (`inspector/components/PagePanel.tsx:14`) |
| IX-04 | List | Flat rows "On hover · Fade In ›"; CSS animation row first, labelled by its stored trigger (`ElementAnimationRow.tsx:18-48`); disabled rows muted (`InteractionItem.tsx:27-32`); drill-in with "‹ {trigger}" back (`index.tsx:110-162`) — boards 4428:142686 / 4418:109686 per code comment (not opened) |
| IX-05 | Add | "+ Add interaction" → inline "Choose Trigger", 4 groups, 14 triggers (`AddInteractionPanel.tsx:27-148`, `interactions/types.ts:88-111`); new = trigger + `DEFAULT_ANIMATION_CONFIG` (Fade In, 300 ms, `easeOut`), opens its editor (`index.tsx:79-90`, `engine/interactions/types.ts:199-207`). "Entrance animation…" only while the element has none (`AddInteractionPanel.tsx:137-146`). Close "×" has no accessible name (`:128-130`) |
| IX-06 | Edit (interaction) | Animation (39 presets, 6 groups, `interactions/types.ts:114-176`), Duration 0.1–10 s, Delay 0–5 s, Easing from `GSAPEngine.EASINGS` (10 entries: Linear, Ease, Ease in/out/in-out, Elastic, Bounce, Back, Expo, Circ — `engine/animations/GSAPEngine.ts:75-86`, `interactions/types.ts:178-181`), Preview, Disable/Enable, Delete (`InteractionEditor.tsx:143-205`). **No UI** for target, reverse, loop, custom — data and both runtimes read them. Timeline button removed (`:184-186`) |
| IX-07 | Edit (CSS animation) | `AnimationEditor`: Entrance / Attention / **Exit** tabs, 25 chips, Duration 100–3000 ms, Delay 0–2000, 7 CSS easings, Iterations 1–10, "▶️ Preview Animation", CSS readout (`editor/animation/AnimationEditor.tsx:21-221`); trigger row removed because CSS never honoured it (`:193-197`); "Remove animation" (`ElementAnimationRow.tsx:57-71`) |
| IX-08 | Triggers | Two declarations of the 14 (`interactions/types.ts:20-38`, `engine/interactions/types.ts:14-34`). `hover` = `mouse-over` (mouseenter) in both runtimes (`engine/interactions/InteractionRuntime.ts:168-174`, `engine/export/interactionRuntime.ts:206`); `page-leave` plays on `beforeunload` |
| IX-09 | Editor runtime | GSAP `InteractionRuntime` starts only from `Composer.setPreviewMode` (`engine/Composer.ts:1291-1303`), which **has no caller** (`AquibraStudio.tsx:266-275`, `useEditorEventListeners.ts:235-242`) — interactions never run on the canvas. **GSAP itself stays in use:** statically imported by `editor/canvas/hooks/useSelectionAnimation.ts:8` (exported from the hooks barrel `canvas/hooks/index.ts:138`; its call is commented out at `canvas/overlays/SelectionBoxOverlay.tsx:328-331`), and the Easing select is built from `GSAPEngine.EASINGS` (IX-06); dependency `packages/editor/package.json:63` |
| IX-10 | Inspector Preview | Sets CSS `animation: bd-anim-{preset} {ms} {easing} …` on the canvas node (`inspector/sections/registry/behaviour.tsx:52-59`) with GSAP ease strings (`power2.out`, `none`) or `easeOut` — not CSS timing functions → invalid declaration, nothing plays (source reading; NOT RUN). CSS-animation Preview restarts the inline animation (`:77-85`) |
| IX-11 | Preview mode | Preview HTML includes the runtime (`Composer.ts:870-881`), but `sanitizeHTMLForPreview` removes `script` (`editor/export/ExportUtils.ts:39`, applied `AquibraStudio.tsx:291,853`) and the frame is `sandbox="allow-same-origin"` without `allow-scripts` (`shell/PreviewOverlay.tsx:208-212`). Triggered interactions never play in Preview; CSS animations do. The sanitizer is a **blocklist**: protocol check only on `src`/`href` (`ExportUtils.ts:50-55`) — `xlink:href`, SVG `<animate>/<set>` are not covered |
| IX-12 | Published/export | `data-buildrick-interactions` serialized (`shared/utils/html/generation.ts:99-107`, `engine/export/ExportEngine.ts:1198-1204`); WAAPI runtime injected only on pages that use interactions (`ExportEngine.ts:659-662,986-988`; `interactionRuntime.ts:190-211`); used `bd-anim-*` keyframes emitted (`ExportEngine.ts:351-357`, `shared/constants/animationKeyframes.ts:79-88`) |
| IX-13 | Three tables | GSAP timelines (`InteractionRuntime.ts:474-534`), WAAPI keyframes (`interactionRuntime.ts:23-136`), CSS `@keyframes` (`animationKeyframes.ts:22-73`) disagree (Rotate In −180° / −90° / −200°; Glow `26,86,219` filter vs `45,109,255` box-shadow); Inspector Preview uses CSS, visitors get WAAPI |
| IX-14 | Divergence | Scroll into view: editor 0.5 / once (`InteractionRuntime.ts:70-75`), published 0.3 / every entry (`interactionRuntime.ts:205`). Legacy `{type, iterations}` read by editor runtime (`InteractionRuntime.ts:308-316`), published falls back to Fade In (`interactionRuntime.ts:203`). Reverse placeholder in editor runtime (`:333-339`) |
| IX-15 | Reduced motion | GSAP path fast-forwards (`GSAPEngine.ts:120-135`) but never runs. **Published WAAPI runtime and exported CSS animations ignore it** (`interactionRuntime.ts:200-209`; `ExportEngine.ts:351-357`). Precedent: slider autoplay (`engine/export/sliderRuntime.ts:78-79,160`) |
| IX-16 | First paint / fill | No hidden start state before the trigger; `fill:'both'` applies only once playing (`interactionRuntime.ts:204`) → content visible, jumps to "from", animates (flash). `fill:'both'` also **holds the end frame forever**, so an effect's end `transform` replaces the element's authored `transform` after it ends (WAAPI animations sit above CSS animations and inline styles in the cascade) |
| IX-17 | Continuous triggers | `page-scroll`, `while-scrolling`, `mouse-move` start a new animation per event, unthrottled (`interactionRuntime.ts:206`; `InteractionRuntime.ts:213-250`) |
| IX-18 | Undo | `writeElement` = lock gate + one transaction (`engine/commands/commandOperations.ts:222-237`); labels "Changed interactions" / "Changed animation" (`shell/hooks/useHistoryFeedback.ts:116-118`). Duration/Delay commit per valid keystroke (`InteractionEditor.tsx:89-93`) — one step per keystroke (NOT RUN). Delete: no confirm, no toast |
| IX-19 | Add interaction action | Registry `add-interaction`, hidden on the page root (`isVisible: notRoot`), selects the element and reveals Interactions (`editor/shared/elementActions.ts:214-224`, `shared/constants/events.ts:365-367`); in the canvas context menu (`canvas/menus/contextMenuRegistry.ts:67`) and so in selection toolbar More (`canvas/controls/UnifiedSelectionToolbar.tsx:6-8`). **Not in Inspector ⋯** (`elementActions.ts:243-255`) |
| IX-20 | Engine CRUD | `InteractionManager` CRUD + 7 events (`engine/interactions/InteractionManager.ts:84-251`) unused by the Inspector (`behaviour.tsx:44-51`); two id formats (`int-…` / `interaction-…`) |
| IX-21 | Easing select | Default `easeOut` is not a select value (`power2.out` …) → stored value not shown (NOT RUN) |
| IX-22 | Plans | No plan gate |

## 3. Problems this design solves (job 1 "Build"; job 3 "publish safely")
1. **Nothing can be checked before going live** (IX-09/10/11).
2. **Preview ≠ live** — three tables, two runtimes (IX-13/14).
3. **Accessibility debt on customers' sites:** reduced motion ignored (IX-15); entrance flash (IX-16); no guard on endless motion or fast flashing (WCAG 2.2.2 / 2.3.1).
4. **Effects break layout:** end frame overrides an authored transform (IX-16) with no warning.
5. **No presets-first path** (SC-18); default "hover · fade in" is a combination nobody wants.
6. **Unreachable data:** target, reverse, repeat (IX-06); infinite CSS iterations (IX-07).
7. **Misleading labels:** CSS row shows a trigger CSS never honours (INS-D06); Exit animations leave elements invisible; duplicate triggers (IX-08).
8. Undo noise (IX-18), performance traps (IX-17), registry gap (IX-19).

## 4. Target layout

### 4.1 Interactions section (Inspector › Behavior, 300 wide, INS-D07)
```
INTERACTIONS                                   ⓘ Plays on all breakpoints
  ▶ On scroll into view   Fade in up      ●  ›      row 32: play · trigger · effect · state · drill
  ▶ On hover              Grow            ○  ›      ○ = "Off" (glyph + text, never colour-only)
  ⚠   Overrides this element's transform            second line, conflict state (§5.7)
  ≋ Plays when rendered   Fade in               ›   CSS animation row (INS-D06)
  + Add interaction
```
- The CSS row reads **"Plays when rendered"** (Change, INS-D06). A stored non-load trigger adds "Saved trigger 'On hover' isn't used — Make it an interaction ›" (preserved and disclosed; offered only when the preset exists in the published table).
- Header chip "Plays on all breakpoints" (until IXD-6; then the per-row summary).

### 4.2 Add interaction picker (replaces "Choose Trigger"; inline, not a modal)
```
‹ Back to Interactions
PRESETS  (7 recipes — DS)
  Fade in on scroll      Slide up on scroll     Fade in on page load
  Grow on hover          Glow on hover          Pulse on hover
  Press while held
CUSTOM
  Choose a trigger ›     Plays when rendered (CSS) ›   (only while the element has none)
```
- **Presets first** (SC-18), each a starting configuration of existing triggers + presets (no new engine capability) *(DS)*: Fade in on scroll = `scroll-into-view` + `fadeIn` 0.6 s ease-out, first time only; Slide up on scroll = `scroll-into-view` + `fadeInUp`; Fade in on page load = `page-load` + `fadeIn`; Grow on hover = `hover` + `scaleUp` 0.2 s + reverse; Glow on hover = `hover` + `glow` + reverse; Pulse on hover = `hover` + `pulse`; Press while held = `active` ("While pressed") + `scaleDown` 0.1 s + reverse. ("+ reverse" applies only after IXD-12, §4.3 *(R-1018, T2-18)*.)
- "Choose a trigger ›": **Common** — On click, On hover, While pressed, On focus, On page load, On scroll into view, On scroll out; **More** (collapsed) — On blur, On mouse out, On mouse move, On page scroll, While scrolling, On page leave. "On mouse over" **merged into On hover** (identical, IX-08); stored `mouse-over` rows keep working, displayed as "On hover" *(DS)*.
- Preset add: adds and selects the new row, **focus on that row**, toast "Interaction added · Undo", and plays it once on the canvas — **skipped when the designer's OS has reduced motion** (INS-D08; announcement "Added Fade in on scroll" only). Choosing a trigger opens the editor with focus on Effect.
- **Esc ladder (SC-2):** picker → back to the list (step 3), focus on "+ Add interaction"; editor → back to the list (step 3), focus on that row; list with nothing open → Inspector exception (focus to canvas).

### 4.3 Interaction editor (drill-in; back "‹ Back to Interactions", SC-1)
```
‹ Back to Interactions                       ▶ Play   ⋯ (Duplicate · Disable · Delete)
Trigger      [ On scroll into view ▾ ]
Effect       [ Fade in up ▾ ]          Fade · Slide · Scale · Rotate · Attention · Special
Animate      [ This element ▾ ]        This element · Parent · Pick on canvas…      (NEW UI on existing `target`)
Timing       Duration [0.6] s   Delay [0] s   Easing [ Ease out ▾ ]
Repeat       [ Once ▾ ]                Once · 2 · 3 · Forever                        (NEW UI on existing `loop`)
When         (•) Only the first time  ( ) Every time it enters   — scroll triggers   (NEW field `once`)
             [✓] Reverse when the pointer / focus leaves          — hover, focus, pressed (NEW UI on `reverse`; shown only after IXD-12, R-1018)
Plays on     [✓] Desktop [✓] Tablet [✓] Mobile                   (NEW field, shown only after IXD-6)
```
- **"Reverse when the pointer / focus leaves" is hidden until IXD-12** *(R-1018, T2-18)*: no dependency yet makes reverse run in the published runtime (the editor runtime's reverse is a placeholder, §13 #15; WAAPI behaviour UNKNOWN), so the toggle would promise output that may not happen. Until IXD-12: the row is not drawn; a stored `reverse` value is kept untouched (IX-01 spread rule); the hover/pressed presets (§4.2) are added **without** `reverse`. After IXD-12: the toggle shows and those presets set `reverse`.
- **Easing** *(DS)*: main list Linear · Ease out (default) · Ease in · Ease in-out · Back · Bounce · Elastic; **More**: Ease · Expo · Circ — all 10 existing entries kept (Change: regrouped only). An unlisted stored value shows "Custom ({value})" (Fix IX-21).
- **Out-of-range stored values** are kept and shown until edited: "12 s (outside 0.1–10 s)"; an edit clamps to the range. Repeat stored as 5 shows "Custom (5 times)" (INS-D06 preserve rule).
- **Flash** effect: Duration minimum 0.4 s per repeat (≤3 flashes per second, WCAG 2.3.1); a stored shorter value plays at 0.4 s on output and shows "Slowed to 0.4 s for safety" *(DS)*.
- Touch hint "Hover doesn't exist on touch screens — add On click for Mobile" appears **only after IXD-6** (it depends on per-breakpoint playback).
- Delete focus: the next row, else "+ Add interaction".
- **Pick on canvas…** (Components source-picking banner, Panel 05 §8): "Click the element to animate · Esc to cancel". Rules: current page only; the page root and elements **inside a CMS list item** are refused ("Can't animate one item of a list — pick the list"); stored as `[data-buildrick-id="…"]`; **one resolution rule** in both runtimes: first match in the document, else the element itself (Change for the editor runtime, which searches the parent first, `InteractionRuntime.ts:361-369`).

### 4.4 CSS animation editor ("Plays when rendered")
Existing editor kept with: Repeat replaces Iterations and adds **Forever** (data supports −1); Direction and Fill under "Playback options" (INS-D06); "Play" replaces "▶️ Preview Animation" (anti-slop); CSS readout behind "Show CSS" *(DS)*; Exit chips show "Hides the element after it plays", row "Hidden after it plays" *(DS — disclose, not remove)*.

## 5. Flows

### 5.1 Add interaction (one contract, every surface)
- Entries: canvas context menu, selection toolbar More, **Inspector ⋯ (Fix IX-19)**, section "+ Add interaction", ⌘K "Add interaction" (SC-18). All select the element, open Behavior › Interactions and **open the Add picker** (Change: today only revealed) with focus on the first preset.
- **Change:** on the page root the action is shown **disabled with reason** "The page itself can't have interactions — select an element" (today hidden, `notRoot`). Multi-selection: "Select one element to add an interaction" (brief `:696`). Locked: "Locked — unlock to edit" (SC-14). Viewer: hidden on the canvas menu, selection toolbar and Inspector ⋯ (SC-6); in ⌘K shown disabled "Editing needs Editor access" (Panel 18 §6).

### 5.2 Edit, enable, delete — undo
- Each discrete choice = **one undo step**, existing labels. Duration/Delay: draft while typing, **commit on Enter/blur = one step** (Fix IX-18; SC-17); Esc reverts the draft (SC-2 step 1).
- **Delete** never confirms (SC-15): toast "Interaction deleted · Undo"; ⌘Z restores it in place with its id. Same for "Remove animation".
- No reorder (order has no effect on playback).

### 5.3 Play in the editor (Fix IX-09/10)
Play animates on the canvas once **with the published keyframe table** (IXD-1/IXD-2); transient — nothing saved, nothing in history (INS-D06). The canvas never runs interactions by itself while editing *(DS; keeps today)*. Explicit Play always plays, even with the designer's reduced motion on (INS-D08 — explicit action); ⋯ › "Preview reduced motion" shows what reduced-motion visitors get *(DS)*.

| Situation | Play behaviour |
|---|---|
| Play pressed while playing | Restarts from the start (no queue) |
| Stop / Esc / selection change / any edit / tab switch | Stops and resets to the authored state. Esc follows the SC-2 exception "Inspector Play running: first Esc stops Play and resets; focus stays on ▶" |
| Element hidden at the current breakpoint (Visibility) | Play disabled: "Hidden on Tablet — switch breakpoint to play" |
| `Plays on` excludes the current breakpoint (after IXD-6) | Plays, with note "Won't play on Tablet for visitors" |
| Scroll into view / scroll out | Plays the effect as if the trigger fired (no scrolling needed) |
| Page leave | Plays once; note "Visitors may not see this — the page is closing" |
| Continuous (page scroll, while scrolling, mouse move) | Plays one cycle; note "Repeats while the visitor scrolls / moves" |
| Target off-screen (parent or picked) | Canvas scrolls it into view (SC-19 rule), outlines it, then plays |
| Repeat Forever | Plays 3 cycles then stops, note "Repeats forever for visitors" |
| Reset (after an exit effect) | Element returns visible at the end of Play |

### 5.4 Preview mode (SC-8) — OD-I1, security-gated
- **Target:** Preview runs **only Buildrick's interaction runtime**. IXD-3 (all mandatory together):
  1. Frame `sandbox="allow-scripts"` **without** `allow-same-origin` (opaque origin).
  2. After sanitizing, the parent injects a **CSP `<meta>`** as the first `<head>` child: `default-src 'none'; script-src 'nonce-{random per render}'; style-src 'unsafe-inline' {allowed font hosts}; img-src https: data:; font-src https: data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'` — only the runtime `<script nonce>` executes; anything that slipped the blocklist sanitizer (IX-11: `xlink:href="javascript:"`, SVG `<animate>/<set>` attribute tricks, inline handlers) cannot run.
  3. Link clicks reach the parent by `postMessage`; the parent accepts a message **only if `e.source === frame.contentWindow`** and the payload matches a schema (`{type:"bk-preview-link", href:string ≤2048}`); it navigates only `http(s)` URLs (in a new tab) or same-site page paths; anything else is dropped.
  4. The same rules apply to the **shared preview** page (`PreviewShareModal` → `/share/<token>`, dashboard) before it runs any script.
- **Fallback until IXD-3:** Preview bar note "Interactions don't play in Preview yet — use ▶ Play in the Inspector, or publish" when the page has any enabled interaction (honest; Fix IX-11).

### 5.5 Published site: reduced motion, first paint, no-JS (Fix IX-15/16)
| Visitor condition | Behavior |
|---|---|
| `prefers-reduced-motion: reduce` | Entrance/exit effects jump to their **end state**; attention effects and Forever loops **don't play**; CSS `bd-anim-*` animations get an emitted `@media (prefers-reduced-motion: reduce) { [style*="bd-anim-"] { animation: none !important } }` rule, with exit animations keeping their end state *(DS)* (IXD-4) |
| Normal motion | Entrance-on-scroll / page-load elements start hidden only via a class (IXD-5): a **tiny inline `<head>` script** adds `bk-ix` to `<html>` before first paint (not added under reduced motion); CSS hides `.bk-ix [data-bk-enter]` in the effect's "from" state; the runtime reveals each element through its animation and sets `bk-ix-ready`. **Fail-safe:** if `bk-ix-ready` is not set within 3 s *(DS)*, the head script removes `bk-ix` and everything shows |
| JavaScript off / runtime error / crawler | Head script never runs (or the fail-safe fires) → content fully visible in its authored state |
| Touch device | Hover interactions don't fire; nothing waits hidden for a hover |
No per-site "ignore reduced motion" switch *(DS)*.

### 5.6 Per-breakpoint playback (SC-13)
`Plays on` per interaction (NEW field `breakpoints`, default all), checked against SC-13 ranges at trigger time (IXD-6). Interactions are not cascaded styles: editing at Tablet changes the same interaction; first edit at Tablet/Mobile shows "Applies to all breakpoints".

### 5.7 Conflicting properties (IAF-23 H, INS-D06)
- **Detect** (editor, on list render): an interaction or CSS animation whose effect animates `transform` (move, scale, rotate, flip, skew) or `opacity`/`filter` on an element that has an **authored** value of that property at any breakpoint, or two motions on one element animating the same property (interaction + CSS animation, or two interactions with overlapping triggers).
- **Row:** second line ⚠ "Overrides this element's transform" / "Plays over the CSS animation" (glyph + text). Editor › info: "While it plays, this effect replaces the element's {property}. When it ends, your {property} is restored."
- **Which wins (one rule):** while playing, the interaction wins over the CSS animation, which wins over authored styles. **After it ends,** entrance and attention effects **release the property** (authored value returns — Change from today's held end frame, IX-16); exit effects keep their end state. Needs IXD-10 (fill `backwards` for entrance/attention, `forwards` for exit). *(DS)* Composing an effect on top of an authored transform is Planned.
- Issues task (Panel 12) lists it as a Tip with "Fix ›" → the row.

### 5.8 Accessibility and performance checks (Panel 12 Issues + Panel 14 §5.2)
| Check | Where | Severity | Fix › |
|---|---|---|---|
| Forever (or total run > 5 s) on an automatic trigger — page load, when rendered, scroll into view, while scrolling — with no pause (WCAG 2.2.2) | Issues + Publish | **Blocking** *(DS)*; inline "Repeat 3 times"; analytics check id `motion_wcag_2_2_2` (Panel 25 §4.4) *(R-1018, D3-1)* | the row |
| Forever on a visitor-started trigger (hover, click, pressed, focus) | Issues | Tip | the row |
| Flash stored faster than 3/s (WCAG 2.3.1) | Issues | Tip (output already clamped, §4.3) | the row |
| Target missing (picked element deleted) | Issues | Tip; runtime falls back to self | the row ("Pick again") |
| Conflicting property (§5.7) | Issues | Tip | the row |
| > 20 scroll / mouse-move interactions on a page *(DS threshold; technical, not a plan gate — SC-20)* | Issues | Tip "may feel slow on phones" | Layers filtered to them |
Continuous triggers run at most once per frame and restart only after the previous run ends (IXD-8). Runtime stays opt-in per page (IX-12).

### 5.9 Copy, duplicate, versioning
- Copy/duplicate carries interactions (existing). Picked targets inside the copied subtree re-point to the copy; outside, they stay (IXD-7).
- **Versioning (IAF-23 K):** new fields `once`, `breakpoints` are **additive and optional**; absent = today's behaviour (`once` absent = every time, OD-I4); readers ignore unknown fields; Inspector writes spread the old object so older/newer fields survive (IX-01). No migration, no schema version bump; `trigger`/`preset` values never rewritten on read.
- Components / CMS list items: **not traced** (§14).

## 6. States and permissions
| State | Behavior |
|---|---|
| No interactions | Collapsed section, "+ Add interaction" |
| Disabled | Row "Off"; exported inactive (existing `enabled:false`) |
| Locked (SC-14) | Rows readable, Play allowed, edits refused "Locked — unlock to edit" |
| Site locked (over the Free limit, SC-20) | As Locked, with SC-20 copy "Over the Free limit — Upgrade to edit" |
| Multi-selection | "Select one element to edit interactions" |
| Viewer (SC-6) | Existing viewer body (INS-D03); if it shows Behavior, rows read-only, Play allowed |
| Legacy `{type, iterations}` | Shown as its preset; saved in current shape on next edit; published runtime reads it (IXD-9) |
| Unknown trigger/preset | "Unknown trigger '{value}' — kept as is"; not editable, not deleted (IAF-23 H/I) |
| Plan | Free and Pro identical |
| Loading *(R-1018, D3-29)* | **N/A** — interactions are element data that arrive with the page; the section has no fetch of its own and renders with the Inspector (the canvas/shell skeleton covers load, Panel 22 §5.1) |
| Offline *(R-1018, D3-29)* | Add, edit, delete and ▶ Play work (local document edits; they save through the page save queue — Panel 22 §5.3, status "Offline — will save when back online"); Preview is local and unaffected. No offline-specific copy here; the offline announcement is Panel 22's |

## 7. Content (SC-11; US English, sentence case effect names *(DS)*)
"Interactions" · "+ Add interaction" · "Presets" / "Custom" · "Plays when rendered" · toasts "Interaction added · Undo", "Interaction deleted · Undo", "Animation removed · Undo" · "Overrides this element's transform" · "Target missing — Pick again" · "Can't animate one item of a list — pick the list" · "Interactions don't play in Preview yet — use ▶ Play in the Inspector, or publish" · "Moves forever — visitors can't stop it. Repeat 3 times" (2.2.2 row) · "Slowed to 0.4 s for safety".

## 8. Geometry and accessibility (NOT MEASURED)
Rows 32 (GEO-01); Play 24×24 in-row icon button with **≥8 px spacing** to the next control in the row (DS §2.7 in-row rule — the 24 target is allowed only with that spacing; WCAG 2.5.8) *(R-1018, CS-07)*; picker 2 columns at 300. Every control named ("Play Fade in up", "Close", "Turn off On hover" — fixes IX-05); state toggle `aria-pressed`; picker = headed lists, arrows within a group. Play announces "Playing …" / "Finished" (polite). Chrome adds no motion beyond DESIGN.md — chrome motion uses only the 100 / 160 / 240 ms tokens, no pulse (V5, DS §2.10); customer-output motion is governed by §5.5 *(R-1018)*. No new shortcuts (SC-12).

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| IX-01 data shapes | unchanged + optional `once`, `breakpoints` | Keep + Extend |
| Section, list, drill-in | §4.1 with Play, state, conflict line | Keep + Change |
| "Choose Trigger" grid | Presets first + Common/More | Change |
| 14 triggers | 13 shown, `mouse-over` shown as On hover | Merge (stored values work) |
| 39 presets, timing ranges | unchanged; out-of-range values kept until edited | Keep |
| 10 easings | 7 main + 3 under More + "Custom (…)" | Change (regroup, none removed) |
| target / reverse / loop (no UI) | exposed | Restore UI |
| `custom` preset | data + published runtime kept; no UI | Keep |
| Interaction Preview (no-op) | ▶ Play on published table | Fix |
| CSS animation editor | §4.4 | Keep + Change |
| CSS row trigger label | "Plays when rendered" + disclosure | Change (INS-D06) |
| Disable / Delete buttons | ⋯ + state dot; Undo toast | Move |
| Held end frame (`fill:both`) | entrance/attention release the property | Change (§5.7) |
| Page-root action hidden | shown disabled with reason | Change |
| GSAP `InteractionRuntime` (unreachable) | replaced by WAAPI Play — **only this path**; `gsap` and `GSAPEngine.EASINGS` stay | OD-I2 |
| Published runtime | + reduced motion, first paint, throttle, legacy read | Keep + Fix |
| InteractionManager CRUD (unused) | unchanged | Keep |
No capability removed.

## 10. Planned (reserved, not designed)
More actions (Scroll to, Show/Hide, Toggle class, Open link — board sample "On click · Scroll to menu" is sample data; OD-I3) · timelines and stagger (IAF-23 F) · scroll-linked animation · custom keyframes UI · composing effects on an authored transform · durations from Brand › Motion tokens *(DS)* · Layers ⚡ marker.

## 11. Engineering dependencies (add to SC-9)
| ID | Dependency | Fallback until shipped |
|---|---|---|
| IXD-1 | One preset keyframe table for canvas Play, shared CSS keyframes and the published runtime (values from today's WAAPI table) | Play uses the WAAPI table; CSS animation keeps its own (documented divergence) |
| IXD-2 | Canvas Play hook: run one interaction on a canvas node, restore the authored state | Play hidden; "Publish to see this animation" |
| ⛔ IXD-3 | Preview runs only the Buildrick runtime: `allow-scripts` without `allow-same-origin`, post-sanitize CSP meta with per-render nonce + `connect-src 'none'`, `postMessage` source + schema check, http(s)-only navigation; same for `/share/<token>` (§5.4) | Scripts stay off; Preview bar note. **Not shippable in part** |
| ⛔ IXD-4 | Published runtime **and** exported `bd-anim-*` CSS honour `prefers-reduced-motion` (§5.5) | **Mandatory interim guard:** runtime does nothing under reduced motion (one `matchMedia` check, as `sliderRuntime.ts:78-79`) **and** export emits `@media (prefers-reduced-motion: reduce){[style*="bd-anim-"]{animation:none!important}}`. Release-blocking |
| IXD-5 | Head script class `bk-ix` + `data-bk-enter` + 3 s fail-safe reveal (§5.5) | Entrance flash remains (today) |
| IXD-6 | `breakpoints` field + runtime breakpoint check | All breakpoints; chip says so; touch hint hidden |
| IXD-7 | Re-point picked targets on duplicate/paste | Copies keep the original target |
| IXD-8 | rAF throttle for continuous triggers | Issues Tip only |
| IXD-9 | Published runtime reads legacy `{type, iterations}`, honours `once`, threshold 0.3; GSAP `InteractionRuntime` path retired (OD-I2); no alignment | Legacy rows publish as Fade in (today) |
| IXD-10 | Fill rule per effect kind (entrance/attention `backwards`, exit `forwards`) + conflict detection (§5.7) | Warning line only; end frame still held |
| IXD-11 | Flash clamp ≥0.4 s on output; 2.2.2 Blocking row in `runPrePublishChecks` (Panel 14 P-1 pattern) | Issues rows client-side only |
| IXD-12 *(R-1018, T2-18)* | "Reverse when the pointer / focus leaves" runs in the published WAAPI runtime and in canvas Play (replaces the editor-runtime placeholder, §13 #15) | Toggle hidden; stored `reverse` kept; presets added without reverse (§4.3) |

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-IX-01 | Canvas menu, toolbar More, Inspector ⋯ and ⌘K "Add interaction" open the Add picker focused on the first preset; on the page root the action is disabled with its reason |
| T-IX-02 | "Fade in on scroll" adds one row, focus on it, plays once; ⌘Z removes it in one step, selection unchanged |
| T-IX-03 | Typing 0 → 0.6 + Enter = exactly one undo step; Esc while typing reverts |
| T-IX-04 | ▶ Play Rotate in matches the published page's end angle and duration (frame compare at 1440) |
| T-IX-05 | Published, reduced motion on: no element moves; entrance elements visible at end state; Pulse on hover does nothing |
| T-IX-06 | Published, JS disabled: every entrance element visible |
| T-IX-07 | Published, normal motion, throttled network: a below-fold Fade in on scroll element is never visible before its fade (head class present at first paint); blocking the runtime script → all content visible within 3 s |
| T-IX-08 | "Only the first time" plays once on repeated scrolling; "Every time" replays — same in Preview (after IXD-3) and published |
| T-IX-09 | Desktop-only interaction doesn't play at 375 on the published page |
| T-IX-10 | Before IXD-3: Preview note shown. After: a click interaction plays; **attack fixtures** do nothing — `<svg><a xlink:href="javascript:…">`, `<svg><animate attributeName="href" to="javascript:…">`, `<set>` on `onbegin`, custom-code `<script>`, `fetch()` from an injected script (blocked by `connect-src 'none'`), a forged `postMessage` from another window, a `javascript:` link message; identical on `/share/<token>` |
| T-IX-11 | Locked element: rows visible, Play works, edits refused with reason |
| T-IX-12 | Delete → Undo toast; Undo restores same id and position; focus moves to the next row |
| T-IX-13 | Legacy `{type:"bounceIn", iterations:2}` shows "Bounce in", publishes as Bounce in ×2 |
| T-IX-14 | CSS row with stored trigger "hover" reads "Plays when rendered" + disclosure; "Make it an interaction" creates On hover · same preset |
| T-IX-15 | Stored easing `power3.inOut` shows "Custom (power3.inOut)", kept on save; stored duration 12 s shown "outside 0.1–10 s" and kept until edited |
| T-IX-16 | While scrolling: at most one animation start per frame (performance trace) |
| T-IX-17 | Picked target deleted → "Target missing — Pick again"; published runtime animates the element itself; Pick on a CMS list item is refused |
| T-IX-18 | Element with authored `transform: translateX(-50%)` + Grow on hover → row shows "Overrides this element's transform"; on the published page after the hover ends, computed transform is `translateX(-50%)` again |
| T-IX-19 | Fade in on page load with Repeat Forever → Blocking 2.2.2 row in Issues and Publish; "Repeat 3 times" clears it; Forever on hover → Tip only |
| T-IX-20 | Flash with stored 0.1 s → output plays ≤3 flashes per second (measured); row shows "Slowed to 0.4 s for safety" |
| T-IX-21 | Designer OS reduced motion on: adding a preset does not auto-play and announces "Added …"; explicit ▶ Play still plays; "Preview reduced motion" shows the end state |
| T-IX-22 | Interim guard (before IXD-4 full): published page with a CSS `bd-anim-fadeIn` element and an interaction, reduced motion on → neither animates (computed `animation-name: none`; no WAAPI animations in `document.getAnimations()`) |
| T-IX-23 | Esc in the picker returns to the list with focus on "+ Add interaction"; Esc in the editor returns to its row |
| T-IX-24 *(R-1018, T2-18)* | Before IXD-12: an On hover interaction's editor shows no Reverse row; "Grow on hover" is stored without `reverse`; an existing interaction with `reverse:true` keeps it after an edit |
| T-IX-25 *(R-1018, CS-07)* | Play button measures 24×24 with ≥8 px to the neighbouring control in its row |

## 13. Code defects found during this inventory (engineering, not design)
1. Inspector interaction Preview writes an invalid CSS `animation` (GSAP ease names) → never plays (`registry/behaviour.tsx:58`; easings `interactions/types.ts:178-181`).
2. `Composer.setPreviewMode` has no caller → `InteractionRuntime` never starts (`Composer.ts:1291-1303`).
3. Preview strips and sandboxes the runtime it was given (`Composer.ts:870-881` vs `ExportUtils.ts:39`, `PreviewOverlay.tsx:208-212`); the comment at `Composer.ts:871-876` claims the opposite.
4. Published runtime and exported CSS animations ignore `prefers-reduced-motion` (`interactionRuntime.ts:200-209`, `ExportEngine.ts:351-357`).
5. Published runtime ignores the legacy `{type, iterations}` shape (`interactionRuntime.ts:203` vs `InteractionRuntime.ts:308-316`).
6. Scroll-into-view: 0.5/once (editor) vs 0.3/every time (published) (`InteractionRuntime.ts:70-75` vs `interactionRuntime.ts:205`).
7. Three preset tables with different values (`InteractionRuntime.ts:474-534`, `interactionRuntime.ts:23-136`, `animationKeyframes.ts:22-73`).
8. Continuous triggers restart per event, unthrottled (`interactionRuntime.ts:206`).
9. `fill:'both'` holds the end frame, permanently overriding an authored `transform` (`interactionRuntime.ts:204`).
10. Duration/Delay commit per keystroke → undo step per keystroke (`InteractionEditor.tsx:89-93`; NOT RUN).
11. Default easing `easeOut` not a value of the easing select (`engine/interactions/types.ts:203` vs `interactions/types.ts:178-181`).
12. Two `InteractionTrigger` declarations and two id formats (`engine/interactions/types.ts:14-34`, `interactions/types.ts:20-38`; `InteractionManager.ts:269` vs `index.tsx:81`).
13. Unnamed "×" (`AddInteractionPanel.tsx:128-130`); "▶️" emoji (`AnimationEditor.tsx:203`); commented-out code (`AnimationEditor.tsx:78-83`, `SelectionBoxOverlay.tsx:328-331`).
14. `add-interaction` missing from `INSPECTOR_MENU` (`elementActions.ts:243-255`, SC-3).
15. Editor-runtime reverse is a placeholder (`InteractionRuntime.ts:333-339`).
16. Preview sanitizer is a blocklist; protocol check only on `src`/`href` (`ExportUtils.ts:50-55`) — harmless today only because scripts are off; must not be relied on once IXD-3 enables scripts.
17. `gsap` is pulled in statically through the canvas hooks barrel for a disabled hook (`useSelectionAnimation.ts:8`, `canvas/hooks/index.ts:138`).

## 14. Review and not verified
`design-qa-critic` pass 1: PROPOSAL, 7 blocking (B1 Preview script security, B2 GSAP still in use, B3 conflicting properties, B4 CSS in the interim guard, B5 WCAG 2.2.2/2.3.1, B6 designer reduced motion, B7 hidden-start fail-safe) + 11 notes — all fixed 2026-10-17; pass 2: 4 blocking (owner-decision heading, IXD-9 wording, status blockers, Play Esc exception, viewer ⌘K row) fixed 2026-10-17. Not verified: everything at runtime (canvas never animating, Preview silence, per-keystroke undo, easing display, cascade order of WAAPI vs authored transform — read from source and the WAAPI spec); CSS-animation breakpoint behaviour; component instances and CMS lists; dashboard publish worker re-sanitizing; `/share/<token>` rendering path; Figma boards 4428:142686 / 4418:109686; geometry; screen-reader output. Presets and thresholds (3 s fail-safe, 0.4 s flash, 20 interactions) are *(DS)*, not user-validated (00-STRATEGY §7).
*(R-1018)* **Not applied (needs a decision):** D3-22 — whether `/review/<token>` runs the interaction runtime under IXD-3, or the client page states "Animations don't play in review" (Panel 17 §4.1 keeps `sandbox=""`).

### SC-10 amendment rows (for Panel 00)
| Amendment | Source | Panel |
|---|---|---|
| Preview runs Buildrick's interaction runtime only, under CSP + opaque origin + checked `postMessage` (reverses IAF-15 C/:825 "Preview does not run arbitrary scripts" for this one script; custom code still never runs) — on OD-I1 | Panel 19 §5.4 | SC-8, IAF-15, 19 |
| SC-18 Interactions one-liner replaced by Panel 19 | Panel 19 | SC-18 |
| "Add interaction" opens the Add picker (not just the section) on every SC-3 surface, incl. Inspector ⋯; disabled with reason on the page root | Panel 19 §5.1 | SC-3, 06 |
| Publish checks gain the WCAG 2.2.2 Blocking motion row; Issues gains motion Tips | Panel 19 §5.8 | 12, 14 §5.2 |

**Owner decisions — decided as recommended (SC-22)**
- **OD-I1** Preview runs Buildrick's interaction runtime under the IXD-3 controls? *Recommend yes* — Preview's job is "what visitors see"; custom code stays blocked.
- **OD-I2** Retire the unreachable GSAP `InteractionRuntime` path only, in favour of WAAPI Play (IXD-1/2)? *Recommend yes* — `gsap` and `GSAPEngine.EASINGS` stay.
- **OD-I3** Next action after Animate = "Scroll to element"? *Recommend Planned, after IXD-1…IXD-5.*
- **OD-I4** Existing scroll interactions without `once` keep "Every time"; new ones default to "Only the first time"? *Recommend yes* — no live site changes on republish.
