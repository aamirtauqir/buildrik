# Buildrik Product Showcase Video — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render and deliver a 48-second industrial-grade product showcase video for Buildrik, sequencing 6 Veo 3 / Flow shots through risk-first ordering, three review gates, and an After Effects post-production stack.

**Architecture:** Six independently-rendered Veo 3 clips at 8 seconds each, glued by repeated bible tokens for continuity, then composited in After Effects for cursor + trail, UI screencast inserts, tagline/wordmark, audio bed, and final color grade. Cursor-as-protagonist threads the narrative, glass-portal in shot 3 (mirrored in shot 5) is the signature spatial trick.

**Tech Stack:**
- **Generation:** Veo 3 / Flow (web)
- **Post-production:** Adobe After Effects (composite, type, audio mix)
- **Color:** DaVinci Resolve (LUT match) — optional, AE Lumetri also acceptable
- **Screencast capture:** macOS built-in `Cmd+Shift+5` or ScreenFlow
- **Audio:** Veo native + post sound design (Splice / Artlist for pad and sfx)
- **Storage:** local working folder + git for spec/log/manifest text artifacts

**Source spec:** `docs/superpowers/specs/2026-05-06-buildrik-showcase-video-design.md`

**Estimated total time:** 3-5 working days of operator effort.

---

## File Structure (what gets created)

```
video/buildrik-showcase/
├── prompts/                       # Plain-text prompt files for Flow paste-ins
│   ├── shot-1.txt
│   ├── shot-2.txt
│   ├── shot-3.txt
│   ├── shot-4.txt
│   ├── shot-5.txt
│   └── shot-6.txt
├── assets/
│   ├── screencasts/
│   │   ├── shot-4-drag-drop.mov   # Buildrik UI screen recording
│   │   └── shot-5-page-renders.mov
│   ├── audio/
│   │   ├── pad-bed-48s.wav        # continuous musical bed
│   │   ├── snap-drop-x4.wav       # 4 individual snap sfx
│   │   ├── render-whoosh.wav      # shot 5 sting
│   │   └── logo-sting.wav         # shot 6 closing
│   └── luts/
│       ├── warm-world.cube
│       └── cool-ui.cube
├── shot-renders/                  # Raw Veo output, archived per shot
│   ├── shot-3/                    # rendered first (signature)
│   │   ├── roll-01.mp4
│   │   ├── roll-02.mp4
│   │   └── locked.mp4             # the chosen ship
│   ├── shot-5/
│   ├── shot-1/
│   ├── shot-6/
│   ├── shot-2/
│   └── shot-4/
├── ae-project/
│   ├── buildrik-showcase.aep      # AE project file
│   └── renders/
│       ├── final.mp4              # 48s with audio
│       └── final-mute.mp4         # 48s silent
└── deliverables/
    ├── final.mp4
    ├── final-mute.mp4
    ├── bible-snapshot.md
    └── render-log.md
```

**Git-tracked artifacts:** `prompts/*.txt`, `bible-snapshot.md`, `render-log.md`. Binary renders, screencasts, audio, AE project, LUTs are NOT committed (they live in `video/buildrik-showcase/` which should be in `.gitignore`).

---

## Phase 0 — Operator Setup

### Task 1: Create video project folder structure

**Files:**
- Create: `video/buildrik-showcase/` (entire tree above)
- Create: `.gitignore` entry for `video/buildrik-showcase/` binary subfolders

- [ ] **Step 1: Create the directory tree**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
mkdir -p video/buildrik-showcase/{prompts,assets/{screencasts,audio,luts},shot-renders/{shot-1,shot-2,shot-3,shot-4,shot-5,shot-6},ae-project/renders,deliverables}
```

- [ ] **Step 2: Add binary subfolders to gitignore**

Edit `/Users/shahg/Desktop/pencil/buildrik/.gitignore` and append:

```
# Buildrik showcase video — binaries not tracked
video/buildrik-showcase/assets/
video/buildrik-showcase/shot-renders/
video/buildrik-showcase/ae-project/
video/buildrik-showcase/deliverables/*.mp4
```

- [ ] **Step 3: Verify the structure exists**

Run: `ls -la /Users/shahg/Desktop/pencil/buildrik/video/buildrik-showcase/`
Expected: 5 folders listed (`prompts`, `assets`, `shot-renders`, `ae-project`, `deliverables`)

- [ ] **Step 4: Create skeleton render-log.md (operator appends to this throughout phases 2-9)**

Write the following to `video/buildrik-showcase/deliverables/render-log.md`:

```markdown
# Buildrik Showcase Video — Render Log

**Sign-off date:** _to be filled at delivery_
**Total render time:** _running_
**Total Veo spend:** _running_
**Total post hours:** _running_

## Per-shot summary

| Shot | Rolls | Spend | Final status | Notes |
|------|-------|-------|--------------|-------|
| 3 (signature) | | | | |
| 5 (mirror) | | | | |
| 1 (warm establish) | | | | |
| 6 (CTA + VO) | | | | |
| 2 (cluttered) | | | | |
| 4 (drag-drop plate) | | | | |

## Fallbacks invoked

(append rows during phases 2-7)

## Gate findings

(append Gate A per-shot notes here as you go; Gate B and Gate C at the end)

## Lessons / surprises

(free-form notes for future video productions)
```

- [ ] **Step 5: Commit the gitignore change + render-log skeleton**

```bash
git -C /Users/shahg/Desktop/pencil/buildrik add .gitignore video/buildrik-showcase/deliverables/render-log.md
git -C /Users/shahg/Desktop/pencil/buildrik commit -m "chore(video): scaffold buildrik-showcase folder + gitignore binaries + render-log skeleton"
```

---

### Task 2: Write all 6 prompt files (plain-text, copy-pasteable)

**Files:**
- Create: `video/buildrik-showcase/prompts/shot-1.txt` through `shot-6.txt`

The full prompt prose for each shot lives in spec Section 4. Copy verbatim from spec into plain-text files for fast paste-into-Flow workflow.

- [ ] **Step 1: Write `shot-1.txt`**

Copy the prompt-to-paste block from spec Section 4.1 verbatim into the file. The block begins with "A wide, locked-off cinematic shot of a quiet designer's studio..." and ends with "...no camera shake, no speech."

- [ ] **Step 2: Write `shot-2.txt`**

Copy the prompt-to-paste block from spec Section 4.2 verbatim. Begins "A slow continuous cinematic dolly-in shot..."

- [ ] **Step 3: Write `shot-3.txt`**

Copy the prompt-to-paste block from spec Section 4.3 verbatim. Begins "A continuous slow push-in shot inside a quiet designer's studio..."

- [ ] **Step 4: Write `shot-4.txt`**

Copy the prompt-to-paste block from spec Section 4.4 verbatim. Begins "A static, locked-off shot inside a clean software interface..."

- [ ] **Step 5: Write `shot-5.txt`**

Copy the prompt-to-paste block from spec Section 4.5 verbatim. Begins "A continuous pull-back shot beginning inside a clean software interface..."

- [ ] **Step 6: Write `shot-6.txt`**

Copy the prompt-to-paste block from spec Section 4.6 verbatim. Begins "A continuous slow pull-back shot inside the designer's studio..."

- [ ] **Step 7: Verify each file is non-empty and matches spec**

Run: `wc -l /Users/shahg/Desktop/pencil/buildrik/video/buildrik-showcase/prompts/*.txt`
Expected: all 6 files between 15-30 lines, no zero-line files.

- [ ] **Step 8: Commit prompt files**

```bash
git -C /Users/shahg/Desktop/pencil/buildrik add video/buildrik-showcase/prompts/
git -C /Users/shahg/Desktop/pencil/buildrik commit -m "docs(video): add 6 verbatim Veo 3 prompt files"
```

---

### Task 3: Verify Veo 3 / Flow access

**Files:** none

- [ ] **Step 1: Open Flow in browser**

Navigate to: https://labs.google/flow (or your active Flow URL).
Confirm: signed in to a Google account with Veo 3 access enabled.

- [ ] **Step 2: Verify credit balance**

Check credit/billing dashboard in Flow.
Required: enough credits for ~18 rolls (worst case all shots fall back to maximum re-rolls).
At standard Flow pricing, plan for ~$30 in render spend.

- [ ] **Step 3: Run a smoke render to confirm Veo 3 model is live**

Submit a 4-second test prompt: "A still life of a single ceramic mug on a wooden desk in golden hour light, no camera movement, light film grain."
Expected: render completes, output is photorealistic, runtime under 2 minutes.

If render fails or output quality is below expectation, stop and resolve account/access issue before continuing.

---

### Task 4: Verify After Effects access + skeleton project

**Files:**
- Create: `video/buildrik-showcase/ae-project/buildrik-showcase.aep` (binary, not tracked)

- [ ] **Step 1: Open After Effects (any version 2023+)**

Confirm the application launches and a new project can be created.

- [ ] **Step 2: Create new project**

File → New → New Project. Save as: `video/buildrik-showcase/ae-project/buildrik-showcase.aep`.

- [ ] **Step 3: Create main composition**

Composition → New Composition.
Settings:
- Name: `final-48s`
- Width: 1920 px (1080p master) — also create a parallel 4K comp at 3840×2160 if 4K master is needed
- Height: 1080 px
- Frame rate: 24 fps
- Duration: 48 seconds
- Background color: black

- [ ] **Step 4: Create folder structure inside Project panel**

Right-click in Project panel → New Folder. Create folders:
- `01-shots-veo` (raw Veo plates per shot)
- `02-screencasts` (UI recordings for shots 4, 5)
- `03-cursor` (cursor + trail comps)
- `04-type` (tagline + wordmark)
- `05-audio` (pad, sfx, VO if added)
- `06-luts` (color grade lookup tables)

- [ ] **Step 5: Save the AE project**

File → Save. Verify the `.aep` file exists at expected path.

---

### Task 5: Verify DaVinci Resolve / Lumetri color tools

**Files:** none

- [ ] **Step 1: Decide color path**

Choose either: (A) DaVinci Resolve for primary color grade, AE for composite. (B) AE Lumetri for everything (simpler, lower ceiling). Default: (B) for solo operators, (A) for two-person teams.

- [ ] **Step 2: If (A) — verify Resolve installed and projects can roundtrip via H.264 ProRes**

Open DaVinci Resolve. Confirm a new project loads. Note: a full Resolve roundtrip is documented in Phase 8 if chosen.

- [ ] **Step 3: If (B) — confirm AE Lumetri panel is available**

In AE: Window → Lumetri Color. Panel should appear. No further setup needed.

---

## Phase 1 — Asset Prep

### Task 6: Record Buildrik UI screencast for shot 4 (drag-drop sequence)

**Files:**
- Create: `video/buildrik-showcase/assets/screencasts/shot-4-drag-drop.mov`

This is the actual Buildrik editor screen recording showing 4 drag-drop actions, used as the post-comp content overlaid on Veo's empty-UI plate.

- [ ] **Step 1: Open Buildrik editor in a clean state**

Run dev server:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run dev
```
Open http://localhost:5050 in Chrome. Confirm editor loads with empty canvas.

- [ ] **Step 2: Set browser window to exact 1920×1080 viewport**

Use Chrome DevTools → device toolbar → Responsive → 1920×1080. This matches Veo plate aspect.

- [ ] **Step 3: Plan the drag-drop sequence**

The 8-second clip contains 4 drag-drops at roughly 1s, 3s, 5s, 7s:
1. Hero block from sidebar → top of canvas
2. Text block from sidebar → below hero
3. Image block from sidebar → next to text
4. Footer block from sidebar → bottom of canvas

Practice the sequence 2-3 times for fluid pacing before recording.

- [ ] **Step 4: Start macOS screen recording**

Press `Cmd+Shift+5` → choose "Record Selected Portion" → frame the Buildrik UI viewport (1920×1080) → click Record.

- [ ] **Step 5: Perform the drag-drop sequence**

8 seconds total. Click the 4 drag-drops at roughly 1s, 3s, 5s, 7s marks. Smooth motion, no hesitation.

- [ ] **Step 6: Stop recording and trim to exactly 8.0 seconds**

Save the recording to `video/buildrik-showcase/assets/screencasts/shot-4-drag-drop.mov`.
Open in QuickTime → Edit → Trim → set start and end so duration is 8.000s.

- [ ] **Step 7: Verify file**

Run: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video/buildrik-showcase/assets/screencasts/shot-4-drag-drop.mov`
Expected: `8.000000` (or within ±0.04s tolerance).

---

### Task 7: Record Buildrik UI screencast for shot 5 (page renders)

**Files:**
- Create: `video/buildrik-showcase/assets/screencasts/shot-5-page-renders.mov`

8-second clip showing final block snapping in then preview pane animating into final state.

- [ ] **Step 1: Open Buildrik editor with the half-built layout from shot 4**

Either continue from Task 6's recording state, or rebuild the same layout fresh.

- [ ] **Step 2: Position cursor for the final drag-drop**

Cursor should be over the last block in the sidebar, ready to drag in.

- [ ] **Step 3: Start recording (Cmd+Shift+5, same 1920×1080 frame)**

- [ ] **Step 4: Perform final drag-drop at 0.5s mark, then trigger preview render**

- 0.5s: drag final block in, snap
- 1-3s: page state stabilizes
- 3-5s: preview pane animates the final rendered state
- 5-8s: hold on the finished page

- [ ] **Step 5: Stop recording, trim to 8.000s**

Save to `video/buildrik-showcase/assets/screencasts/shot-5-page-renders.mov`.

- [ ] **Step 6: Verify duration**

Same `ffprobe` command as Task 6 Step 7.

---

### Task 8: Acquire continuous music pad bed (48 seconds)

**Files:**
- Create: `video/buildrik-showcase/assets/audio/pad-bed-48s.wav`

The pad is the through-line glue across all 6 shots. Veo cannot reliably score continuous music — this comes from a stock library or original composition.

- [ ] **Step 1: Source candidate pads from Artlist / Splice / Soundstripe**

Search terms: "ambient pad cinematic", "soft cinematic underscore", "warm pad film score". Filter for: 80-120 BPM (matches crescendo curve), instrumental, no vocals, available at 48s+ length.

- [ ] **Step 2: Audition 3-5 candidates**

Listen for: warmth in opening (matches shot 1 mood), capacity to swell at shot 3 transition, ability to drop to bed during shots 4-5, soft resolve at shot 6.

- [ ] **Step 3: Download chosen pad as WAV at 48kHz / 24-bit**

Save to `video/buildrik-showcase/assets/audio/pad-bed-48s.wav`.

- [ ] **Step 4: Trim to exactly 48.000 seconds**

In Audacity / Logic / Reaper: import → trim to 48s with soft fade-out in last 0.5s. Export as WAV 48kHz/24-bit.

- [ ] **Step 5: Verify duration**

Run: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video/buildrik-showcase/assets/audio/pad-bed-48s.wav`
Expected: 48.000000 (±0.04s).

---

### Task 9: Acquire snap-drop sfx pack

**Files:**
- Create: `video/buildrik-showcase/assets/audio/snap-drop-x4.wav`

Four discrete snap sounds layered onto shot 4's drag-drops.

- [ ] **Step 1: Source 4 snap candidates**

From Splice / Soundstripe: search "UI snap", "magnetic snap", "soft thunk". Choose 4 distinct but cohesive sounds (slight variation prevents repetition fatigue).

- [ ] **Step 2: Time-align them in Reaper / Audacity**

Place snaps at 1.0s, 3.0s, 5.0s, 7.0s within an 8-second project. Each snap ≤200ms duration.

- [ ] **Step 3: Export as WAV 48kHz / 24-bit**

Save to `video/buildrik-showcase/assets/audio/snap-drop-x4.wav`. Duration: 8.000s.

---

### Task 10: Acquire render-whoosh sting + logo-sting

**Files:**
- Create: `video/buildrik-showcase/assets/audio/render-whoosh.wav`
- Create: `video/buildrik-showcase/assets/audio/logo-sting.wav`

- [ ] **Step 1: Source render-whoosh candidate**

Search: "cinematic whoosh sting", "render reveal sound", "soft impact reveal". Length ~1.5s. Lands at shot 5's 3s mark (page-render moment).

- [ ] **Step 2: Source logo-sting candidate**

Search: "brand reveal sting", "soft logo signature", "cinematic outro". Length ~1.5s. Lands at shot 6's 7s mark (closing 1.5s of film).

- [ ] **Step 3: Export both as WAV 48kHz / 24-bit**

Save to `assets/audio/render-whoosh.wav` and `assets/audio/logo-sting.wav`.

---

### Task 11: Acquire / create LUTs for color grade

**Files:**
- Create: `video/buildrik-showcase/assets/luts/warm-world.cube`
- Create: `video/buildrik-showcase/assets/luts/cool-ui.cube`

- [ ] **Step 1: Source or create warm-world LUT**

Goal: matches palette canvas-white #f8f4f1, paper-grey #e8e3dd, ink-black #191919, clay-orange #ee855a accents. Free options: Lutify.me "Golden Hour", or download a free Kodak Vision3 250D emulation. Save as `warm-world.cube`.

- [ ] **Step 2: Source or create cool-UI LUT**

Goal: matches palette #ffffff, #f5f5f7, #191919, #2D6DFF cobalt. Free options: a flat editorial UI LUT (common search: "clean software product film LUT"). Save as `cool-ui.cube`.

- [ ] **Step 3: Test both LUTs in AE Lumetri or Resolve**

Apply each to a sample frame. Verify warm LUT does not crush cobalt, cool LUT does not introduce green tint.

---

## Phase 2 — Render Pass 1: Shot 3 (signature glass-portal)

**Why first:** Highest-risk shot. If glass-pass fails after 5 rolls, fall back to L3 (hard cut), which changes the entire treatment and propagates to shot 5.

### Task 12: Submit shot 3 prompt to Veo 3 / Flow

- [ ] **Step 1: Open Flow in browser, start a new generation**

- [ ] **Step 2: Paste contents of `video/buildrik-showcase/prompts/shot-3.txt`**

Use the entire prose prompt verbatim, no edits.

- [ ] **Step 3: Configure render parameters**

- Model: Veo 3
- Length: 8 seconds
- Aspect: 16:9
- Resolution: 1080p (use 4K if available and budget allows)
- Audio: enabled

- [ ] **Step 4: Submit roll-01**

Wait for render completion. Download the resulting `.mp4` and save to `video/buildrik-showcase/shot-renders/shot-3/roll-01.mp4`.

---

### Task 13: Gate A on shot 3 — review against success criteria

Per spec Section 4.3, shot 3 success criteria:
1. Glass-pass reads as intentional portal, not glitch
2. Palette shift visible but not jarring
3. Cursor lands on blank canvas inside Buildrik-styled UI
4. UI chrome reads as crisp software, not cluttered editor mockup

Per spec Section 3.8 negative tokens:
- No visible humans, faces, hands
- No branded products on desk
- No readable on-screen text
- No neon colors, no hard shadows, no shake, no speech

- [ ] **Step 1: Watch roll-01 in full at 100% speed**

Open in QuickTime, play through.

- [ ] **Step 2: Score against the 4 success criteria above (PASS / FAIL each)**

Document scores in a temporary scratch file or render-log.md.

- [ ] **Step 3: Score against the 9 negative tokens (PRESENT / ABSENT each)**

Any "PRESENT" = automatic fail.

- [ ] **Step 4: Decide ship status**

Outcome A: All 4 success PASS + all 9 negatives ABSENT → mark roll-01 as `locked.mp4`, proceed to Task 17.
Outcome B: 1-2 issues → re-roll once with refined prompt (Task 14).
Outcome C: 3+ issues or any negative present → re-roll (Task 14).

---

### Task 14: Iterate shot 3 (rolls 2-5 if needed)

- [ ] **Step 1: Identify the failure mode**

Specific issue: glass-pass reads as glitch / palette shift jarring / cursor wrong position / UI looks fake / negative token present.

- [ ] **Step 2: Edit the prompt to address the issue**

Examples:
- Glass-pass reads as glitch → strengthen "twelve frames" timing, add "smooth bend" language
- Palette shift jarring → add "cross-fade" "rises" "dies" language explicitly
- Cursor wrong position → add explicit "cursor at center of canvas, hovering still" line
- UI looks fake → add "clean software interface" + "soft chrome" tokens
- Faces visible → strengthen negative: "absolutely no humans, no faces, no hands, no body parts"

Save edits to `prompts/shot-3.txt` and stage but do not commit yet.

- [ ] **Step 3: Submit roll-02 with edited prompt**

Save output to `shot-renders/shot-3/roll-02.mp4`.

- [ ] **Step 4: Repeat Gate A (Task 13)**

Continue rolling up to roll-05 with stop-loss at 5 rolls or $10 spend.

- [ ] **Step 5: If 5 rolls fail, escalate to fallback**

Per spec Section 6:
- L1: re-prompt with shorter pass-through (3 frames not 12)
- L2: AE morph between two Veo plates (room close-up + UI close-up rendered separately)
- L3: drop to hard-cut treatment

Document chosen fallback in render-log.md.

---

### Task 15: Lock shot 3 plate

- [ ] **Step 1: Copy the chosen ship roll to `locked.mp4`**

```bash
cp video/buildrik-showcase/shot-renders/shot-3/roll-0X.mp4 video/buildrik-showcase/shot-renders/shot-3/locked.mp4
```

- [ ] **Step 2: Update render-log.md**

Append a row:
```
| Shot 3 | rolls=N | spend=$X | status=locked | notes=... |
```

- [ ] **Step 3: Commit any prompt edits made during iteration**

```bash
git -C /Users/shahg/Desktop/pencil/buildrik add video/buildrik-showcase/prompts/shot-3.txt
git -C /Users/shahg/Desktop/pencil/buildrik commit -m "docs(video): refine shot-3 prompt based on roll-N feedback" --allow-empty
```

(Use `--allow-empty` only if no prompt edits — then skip the add line.)

---

## Phase 3 — Render Pass 2: Shot 5 (mirror of shot 3)

### Task 16: Submit shot 5 prompt to Veo

Same pattern as Task 12 with `prompts/shot-5.txt` saved to `shot-renders/shot-5/roll-01.mp4`.

- [ ] **Step 1: Open Flow, paste `prompts/shot-5.txt` verbatim**

- [ ] **Step 2: Configure render — Veo 3, 8s, 16:9, 1080p, audio enabled**

- [ ] **Step 3: Submit roll-01, save as `shot-renders/shot-5/roll-01.mp4`**

---

### Task 17: Gate A on shot 5

Per spec Section 4.5 success criteria:
1. Glass-pass mirrors shot 3's intentionality
2. Finished page on monitor reads as polished web output (composite happens later)
3. Warm room returns without abrupt cut

- [ ] **Step 1: Watch roll-01 at 100% speed**

- [ ] **Step 2: Compare directly against shot 3's locked.mp4**

Open both side-by-side in QuickTime. Glass-pass timing should mirror. Palette shift should reverse.

- [ ] **Step 3: Score 3 success criteria + 9 negative tokens**

- [ ] **Step 4: Decide ship status**

Outcome A: pass → proceed to Task 19.
Outcome B/C: re-roll up to 5 times (Task 18).

---

### Task 18: Iterate shot 5 (rolls 2-5 if needed)

Same pattern as Task 14. Reference shot 3's locked roll for continuity tokens that worked.

- [ ] **Step 1: Identify failure**

- [ ] **Step 2: Edit `prompts/shot-5.txt`**

- [ ] **Step 3: Submit roll-02, repeat Gate A**

- [ ] **Step 4: Stop-loss at 5 rolls / $10 / 2 hours; escalate fallback if hit**

Note: if shot 3 was forced into hard-cut fallback, shot 5 inherits that pattern.

---

### Task 19: Lock shot 5 plate

- [ ] **Step 1: Copy chosen roll to `locked.mp4`**

```bash
cp video/buildrik-showcase/shot-renders/shot-5/roll-0X.mp4 video/buildrik-showcase/shot-renders/shot-5/locked.mp4
```

- [ ] **Step 2: Update render-log.md**

- [ ] **Step 3: Commit prompt edits if any**

---

## Phase 4 — Render Pass 3: Shot 1 (warm world establish)

### Task 20: Submit shot 1 prompt

- [ ] **Step 1: Paste `prompts/shot-1.txt` into Flow**

- [ ] **Step 2: Submit, save as `shot-renders/shot-1/roll-01.mp4`**

---

### Task 21: Gate A on shot 1

Per spec Section 4.1 success criteria:
1. Dust motes visible in beam
2. Monitor glow reads soft, not bright
3. No humans, no logos, no on-screen text

- [ ] **Step 1: Watch roll-01**

- [ ] **Step 2: Score 3 success + 9 negatives**

- [ ] **Step 3: Decide ship status**

---

### Task 22: Iterate or lock shot 1

Same iterate/lock pattern as Task 14/15.

- [ ] **Step 1: Iterate up to 5 rolls if needed**

- [ ] **Step 2: Lock chosen roll as `shot-renders/shot-1/locked.mp4`**

- [ ] **Step 3: Update render-log.md**

---

## Phase 5 — Render Pass 4: Shot 6 (CTA + VO)

VO is the highest single-element risk in this shot. Render before shots 2 and 4 in case the VO mood requires audio strategy adjustment.

### Task 23: Submit shot 6 prompt

- [ ] **Step 1: Paste `prompts/shot-6.txt` into Flow**

- [ ] **Step 2: Submit, save as `shot-renders/shot-6/roll-01.mp4`**

---

### Task 24: Gate A on shot 6 — visual + VO

Per spec Section 4.6 success criteria:
1. VO line clear, paced, on-key
2. Tagline space readable on warm background (post will add the actual text)
3. Wordmark space available for post composite
4. Final 1s holds quietly

- [ ] **Step 1: Listen with headphones**

VO line: "Build at the speed of taste."
- Pacing: ~0.5s pause between "speed" and "of taste"
- Tone: warm, dry, mid-30s, neutral mid-Atlantic
- Delivery: confident, no theatrical emphasis

- [ ] **Step 2: Watch with audio**

Confirm VO timing aligns with the visual hold (camera locked at 4s mark, VO at 3.5s).

- [ ] **Step 3: Score success + negatives**

- [ ] **Step 4: Decide ship status — escalate VO fallback early if needed**

If VO sounds AI-flat or robotic, do NOT spend 5 rolls — escalate to L2 fallback (record human VO in post) after 2-3 rolls.

---

### Task 25: Iterate or lock shot 6

- [ ] **Step 1: Iterate up to 5 rolls (or fewer if VO triggers L2 fallback)**

- [ ] **Step 2: If L2 fallback triggered:**
  - Hire a voice talent on Voice123 / Voices.com (~$50-200, 1 hour turnaround)
  - Strip Veo audio from the chosen visual roll
  - Replace VO in After Effects post

- [ ] **Step 3: Lock the chosen roll as `shot-renders/shot-6/locked.mp4`**

- [ ] **Step 4: Update render-log.md including VO fallback notes if applicable**

---

## Phase 6 — Render Pass 5: Shot 2 (cluttered struggle)

### Task 26: Submit shot 2 prompt (with optional image-to-video seeding)

If continuity drift between shot 1 and shot 2 is a concern, use Flow's image-to-video mode and seed shot 2 with shot 1's last frame.

- [ ] **Step 1: (Optional) Extract last frame of shot 1's locked.mp4**

```bash
ffmpeg -sseof -0.04 -i video/buildrik-showcase/shot-renders/shot-1/locked.mp4 -frames:v 1 -q:v 2 video/buildrik-showcase/shot-renders/shot-1/last-frame.jpg
```

- [ ] **Step 2: Submit shot 2 prompt**

If using image-to-video: upload `last-frame.jpg` as starting frame in Flow + paste `prompts/shot-2.txt`.
If not: paste `prompts/shot-2.txt` only.

- [ ] **Step 3: Save as `shot-renders/shot-2/roll-01.mp4`**

---

### Task 27: Gate A on shot 2

Per spec Section 4.2 success criteria:
1. Sketches readable as creative work-in-progress (not gibberish lines)
2. Cursor visible on tiny screen but not the focus
3. Tension audible in audio

- [ ] **Step 1: Watch roll-01**

- [ ] **Step 2: Score success + negatives**

- [ ] **Step 3: Decide ship status**

---

### Task 28: Iterate or lock shot 2

Same iterate/lock pattern.

- [ ] **Step 1: Iterate up to 5 rolls if needed**

- [ ] **Step 2: Lock as `shot-renders/shot-2/locked.mp4`**

- [ ] **Step 3: Update render-log.md**

---

## Phase 7 — Render Pass 6: Shot 4 (drag-drop UI plate)

Lowest-risk shot — Veo only renders the empty UI backplate; the actual drag-drop content is the screencast from Task 6 composited in post.

### Task 29: Submit shot 4 prompt

- [ ] **Step 1: Paste `prompts/shot-4.txt` into Flow**

- [ ] **Step 2: Submit, save as `shot-renders/shot-4/roll-01.mp4`**

---

### Task 30: Gate A on shot 4 — text-artifact check

Per spec Section 4.4 success criteria:
1. UI panel and canvas render as clean Buildrik-styled chrome
2. No broken text, no fake UI artifacts
3. Empty UI base plate ready for screencast composite
4. Drag tempo readable as fast (visualized via 4 click sounds at 1s, 3s, 5s, 7s)

- [ ] **Step 1: Watch roll-01 frame-by-frame**

Pay attention to small text artifacts, gibberish letters, fake icons that look real-but-wrong.

- [ ] **Step 2: Score**

If text artifacts present, decide: (a) re-roll with stronger negative tokens, or (b) accept and mask them in AE composite (the screencast overlays the UI center anyway).

---

### Task 31: Iterate or accept shot 4

- [ ] **Step 1: If text artifacts in central canvas zone (where screencast overlays) — accept**

The screencast will fully cover the affected area.

- [ ] **Step 2: If text artifacts in sidebar / inspector zones (visible in final composite) — re-roll**

Up to 3 rolls. If still failing, escalate: replace shot 4 with pure screencast at full-frame (no Veo plate), accept slight visual difference between shot 4 lighting and shots 3/5 lighting (post-grade bridges this).

- [ ] **Step 3: Lock as `shot-renders/shot-4/locked.mp4`**

- [ ] **Step 4: Update render-log.md**

---

## Phase 8 — Post-Production Composites (After Effects)

All 6 plates locked. Now build the final composite in AE.

### Task 32: Import all assets into AE project

**Files:** `ae-project/buildrik-showcase.aep`

- [ ] **Step 1: Open `ae-project/buildrik-showcase.aep`**

- [ ] **Step 2: Import all 6 locked Veo plates**

File → Import → File. Select each `shot-renders/shot-N/locked.mp4`. Place into folder `01-shots-veo`.

- [ ] **Step 3: Import 2 screencasts**

`shot-4-drag-drop.mov` and `shot-5-page-renders.mov` → folder `02-screencasts`.

- [ ] **Step 4: Import audio assets**

Pad bed, snap-drop, render-whoosh, logo-sting → folder `05-audio`.

- [ ] **Step 5: Import LUTs**

Both `.cube` files → folder `06-luts`.

- [ ] **Step 6: Save**

File → Save.

---

### Task 33: Lay out 6 plates on the `final-48s` timeline

- [ ] **Step 1: Drag each locked Veo plate into the `final-48s` comp**

Stack in time order:
- Shot 1 plate → 0s-8s
- Shot 2 plate → 8s-16s
- Shot 3 plate → 16s-24s
- Shot 4 plate → 24s-32s (this will get screencast overlay)
- Shot 5 plate → 32s-40s
- Shot 6 plate → 40s-48s

- [ ] **Step 2: Verify total comp duration is 48.0 seconds**

- [ ] **Step 3: Play through the rough cut at 100% speed**

This is the cinematic spine before composites. Confirm pacing reads as crescendo (slow-slow-medium-fast-fast-resolve).

- [ ] **Step 4: Save**

---

### Task 34: Composite UI screencast onto shot 4 plate

The Veo plate for shot 4 is an empty UI backplate. The screencast (drag-drop sequence) goes on top.

- [ ] **Step 1: Drag `shot-4-drag-drop.mov` into the comp at the 24s mark**

Place above shot 4 Veo plate in layer order.

- [ ] **Step 2: Scale and position screencast to align with the Veo plate's UI canvas area**

The screencast is full-frame 1920×1080 from Task 6. Veo plate is also full-frame. Default 100% scale + 0,0 position should align.

- [ ] **Step 3: Verify alignment frame-by-frame**

Move the timeline cursor through 24-32s. The screencast UI should match the Veo plate UI position.

- [ ] **Step 4: If misaligned, use AE Corner Pin effect to map screencast corners to plate corners**

Effects → Distort → Corner Pin. Manually drag corners to match.

- [ ] **Step 5: Set screencast layer blend mode to "Normal" with opacity 100%**

The screencast is the visible content; the Veo plate underneath is just a fallback for any edge gaps.

- [ ] **Step 6: Save**

---

### Task 35: Composite UI screencast onto shot 5 plate

Same pattern for shot 5's first ~3 seconds (before the camera pulls back through glass).

- [ ] **Step 1: Drag `shot-5-page-renders.mov` into the comp at 32s mark**

- [ ] **Step 2: Trim to first 3 seconds (32s-35s) — the UI portion of shot 5**

After 35s, shot 5's Veo plate takes over for the pull-back-through-glass cinematic portion.

- [ ] **Step 3: Position and scale the screencast to align with Veo plate UI area**

Use Corner Pin if needed.

- [ ] **Step 4: Add a 12-frame opacity fade-out on the screencast (35s → 35.5s)**

This blends the cut from screencast to Veo plate as the camera begins exiting the UI.

- [ ] **Step 5: Save**

---

### Task 36: Build cursor + light-trail composite (all 6 shots)

Cursor + trail composited uniformly across the entire 48s timeline.

- [ ] **Step 1: Create a new precomp `cursor-trail-48s` (1920×1080, 48s, 24fps)**

This sits as a separate layer above all 6 plates and screencasts.

- [ ] **Step 2: Add a solid layer for the cursor (32×32 px, color `#191919`, with a 1px white outline halo)**

Position it manually at each beat:
- Shot 1 (0-8s): cursor static, on tiny screen-within-frame area, ~3% frame width
- Shot 2 (8-16s): cursor jittering on tiny screen-within-frame
- Shot 3 (16-24s): cursor enters at the glass-pass moment (~19s mark), grows to native UI scale, lands on canvas
- Shot 4 (24-32s): cursor at native UI scale, performs 4 drag-drops (1s, 3s, 5s, 7s within shot)
- Shot 5 (32-40s): cursor at native UI scale through 35s, then exits with camera pull-back
- Shot 6 (40-48s): cursor optionally absent or on logo at 47s

Use AE keyframes on Position property to animate.

- [ ] **Step 3: Add the trail effect**

Use either:
- Trapcode Particular (if installed) for a particle-trail behind cursor
- Native AE: duplicate cursor layer → offset by 1-2 frames → reduce opacity → blend mode "Add" → repeat 6-8 times for a fading trail
- Trail color tint: cobalt `#2D6DFF` at 35% opacity

- [ ] **Step 4: Add click-ripple at each click moment**

Click times: 19s (shot 3 landing), 25s, 27s, 29s, 31s (shot 4 four drags), 32.5s (shot 5 final drag).
At each click: a ring effect expands from cursor and fades in 200ms.

- [ ] **Step 5: Verify the precomp plays smoothly**

- [ ] **Step 6: Drop `cursor-trail-48s` onto the `final-48s` timeline**

Layer at the top of the stack. Set blend mode to "Normal", opacity 100%.

- [ ] **Step 7: Save**

---

### Task 37: Composite tagline + wordmark in shot 6

- [ ] **Step 1: Create a new text layer at 42.5s (shot 6, 2.5s in)**

Text: "Build at the speed of taste."
Font: General Sans Semibold
Color: `#191919`
Size: 48 pt (adjust to taste; should occupy ~60% of horizontal frame)
Position: lower-third, horizontally centered

- [ ] **Step 2: Animate the text fade-in**

Opacity: 0 at 42.5s → 100 at 43.5s.

- [ ] **Step 3: Create a second text layer at 45s**

Text: "Buildrik."
Font: General Sans Regular
Color: `#191919`
Size: 24 pt
Position: below the tagline, horizontally centered

- [ ] **Step 4: Animate fade-in**

Opacity: 0 at 45s → 100 at 46s.

- [ ] **Step 5: Both text layers hold to end of comp (48s)**

- [ ] **Step 6: Save**

---

### Task 38: Lay in pad bed across all 6 shots

- [ ] **Step 1: Drag `pad-bed-48s.wav` into the comp at 0s**

Layer it at the bottom of the audio stack.

- [ ] **Step 2: Set audio levels**

Initial volume: -18 dBFS (low mix, sits under diegetic).
Add a slight swell at 16s (entering shot 3) — automate volume up to -12 dBFS.
Drop back to -18 dBFS at 19s (after glass-pass landing).
Resolve to -15 dBFS at 40s (shot 6 entry) for emotional landing.

Use AE Audio Levels keyframes.

- [ ] **Step 3: Save**

---

### Task 39: Lay in snap-drop sfx (shot 4)

- [ ] **Step 1: Drag `snap-drop-x4.wav` into the comp at 24s**

This is a single 8-second WAV with snaps at 1s, 3s, 5s, 7s within the file.

- [ ] **Step 2: Set audio level to -10 dBFS**

Snaps should punch through pad bed but not dominate.

- [ ] **Step 3: Save**

---

### Task 40: Lay in render-whoosh and logo-sting

- [ ] **Step 1: Drag `render-whoosh.wav` into the comp at 35s**

Aligns with shot 5's render moment (approximately 3s into shot 5).
Audio level: -8 dBFS.

- [ ] **Step 2: Drag `logo-sting.wav` into the comp at 47s**

Lands at shot 6's closing 1s.
Audio level: -8 dBFS.

- [ ] **Step 3: Save**

---

### Task 41: Apply color grade (warm LUT for shots 1, 2, 6; cool LUT for shots 4, 5; cross-fade for 3, 5)

- [ ] **Step 1: Apply warm-world LUT to shots 1, 2, 6 plates**

Select shot 1 plate → Effects → Apply LUT → choose `assets/luts/warm-world.cube`.
Repeat for shot 2 plate and shot 6 plate.

- [ ] **Step 2: Apply cool-UI LUT to shot 4 plate (incl. screencast layer)**

Select shot 4 layer → Effects → Apply LUT → `assets/luts/cool-ui.cube`.

- [ ] **Step 3: Apply BOTH LUTs cross-faded across shot 3**

Shot 3 transitions warm → cool around the 19s mark (3s into shot 3, the glass-pass moment).
Use two LUT effect instances on shot 3, animate each LUT's opacity:
- Warm LUT: 100% at 16s, 0% at 19.5s
- Cool LUT: 0% at 18.5s, 100% at 19.5s

- [ ] **Step 4: Apply BOTH LUTs cross-faded across shot 5 (mirrored)**

Shot 5 transitions cool → warm around the 35s mark.
- Cool LUT: 100% at 32s, 0% at 35.5s
- Warm LUT: 0% at 34.5s, 100% at 35.5s

- [ ] **Step 5: Play through the entire timeline**

Confirm color shifts at glass-pass moments feel intentional. Confirm warm and cool worlds each share their respective tint within their shots.

- [ ] **Step 6: Save**

---

## Phase 9 — Gate B + Gate C reviews

### Task 42: Gate B — Six-shot continuity review

Reviewers: you (decision maker) + operator.

- [ ] **Step 1: Render a low-res preview**

In AE: Composition → Add to Render Queue → Output Module: H.264, 1080p, audio enabled → Render. Save preview as `ae-project/renders/preview-gate-b.mp4`.

- [ ] **Step 2: Watch the full 48s preview**

Score against Gate B criteria from spec Section 8:
1. Cursor scale consistent across cinematic shots (1, 2, 6)? PASS / FAIL
2. Palette transitions feel intentional, not jarring? PASS / FAIL
3. Pacing crescendo readable (slow-slow-medium-fast-fast-resolve)? PASS / FAIL
4. Pad bed doesn't fight diegetic? PASS / FAIL

- [ ] **Step 3: Document findings in render-log.md**

- [ ] **Step 4: Address any failures**

- Cursor scale inconsistent → adjust cursor precomp keyframes (Task 36)
- Palette jarring → tweak LUT cross-fade timing (Task 41)
- Pacing reads wrong → consider re-rendering one shot with adjusted prompt timing language
- Pad fights diegetic → adjust pad volume curves (Task 38) or strip pad temporarily for sanity check

- [ ] **Step 5: Re-render preview after fixes, repeat Gate B**

---

### Task 43: Gate C — Final assembly sign-off

Reviewer: you.

- [ ] **Step 1: Render final master in AE**

Composition → Add to Render Queue → Output Module:
- Format: H.264
- Resolution: 1920×1080 (and a parallel 4K render at 3840×2160 if 4K master is required)
- Frame rate: 24 fps
- Audio: 48kHz, stereo, AAC 320kbps
- File name: `ae-project/renders/final.mp4`

- [ ] **Step 2: Watch the final master through 2 times**

Score against Gate C criteria:
1. All 8 post-production hand-off items present (cursor+trail, screencasts, type, pad, snap, whoosh, sting, color)?
2. VO line clear and on-key?
3. Tagline readable?
4. 48s timeline reads as one film, not six clips?

- [ ] **Step 3: Document findings**

- [ ] **Step 4: Address any failures, re-render**

- [ ] **Step 5: Render the mute version**

Duplicate the comp → mute all audio layers → render as `ae-project/renders/final-mute.mp4`.

- [ ] **Step 6: Sign off when both versions pass**

---

## Phase 10 — Delivery

### Task 44: Move final artifacts to deliverables folder

- [ ] **Step 1: Copy final.mp4 and final-mute.mp4 to deliverables**

```bash
cp video/buildrik-showcase/ae-project/renders/final.mp4 video/buildrik-showcase/deliverables/final.mp4
cp video/buildrik-showcase/ae-project/renders/final-mute.mp4 video/buildrik-showcase/deliverables/final-mute.mp4
```

- [ ] **Step 2: Verify file integrity**

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video/buildrik-showcase/deliverables/final.mp4
```
Expected: `48.000000` (±0.04s).

```bash
ffprobe -v error -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 video/buildrik-showcase/deliverables/final.mp4
```
Expected: `video` and `audio` listed.

```bash
ffprobe -v error -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 video/buildrik-showcase/deliverables/final-mute.mp4
```
Expected: `video` only (no audio stream).

---

### Task 45: Snapshot the bible

The bible (Section 3 of the spec) gets frozen as a separate artifact in case the live spec drifts.

- [ ] **Step 1: Extract Section 3 from the spec**

Open `docs/superpowers/specs/2026-05-06-buildrik-showcase-video-design.md`. Copy the entire Section 3 ("World Bible") including all subsections 3.1-3.8.

- [ ] **Step 2: Save to `deliverables/bible-snapshot.md`**

Header the file with:
```markdown
# World Bible Snapshot — Buildrik Showcase Video

Frozen on: 2026-05-06 (or actual sign-off date)
Source: docs/superpowers/specs/2026-05-06-buildrik-showcase-video-design.md (Section 3)

---
```

Then paste the bible content below.

---

### Task 46: Finalize render-log.md

The skeleton was created in Task 1 Step 4 and operator has been appending to it throughout phases 2-9. This task closes it out.

- [ ] **Step 1: Open `deliverables/render-log.md`**

- [ ] **Step 2: Fill in the header values**

- `Sign-off date:` set to today's date
- `Total render time:` total operator hours from start of Task 12 to end of Task 43
- `Total Veo spend:` sum across all rolls
- `Total post hours:` total AE work from start of Task 32 to end of Task 43

- [ ] **Step 3: Verify per-shot summary table is complete**

Each of the 6 rows should have rolls, spend, and final status filled in. If any row is empty, look back at the Gate A notes from that shot's phase and reconstruct.

- [ ] **Step 4: Add closing "Lessons / surprises" notes**

Free-form: anything that surprised you during production, prompt-engineering tricks that worked, fallbacks that triggered, AE techniques worth remembering for future video productions.

---

### Task 47: Final commit

- [ ] **Step 1: Stage tracked artifacts**

```bash
git -C /Users/shahg/Desktop/pencil/buildrik add video/buildrik-showcase/prompts/ video/buildrik-showcase/deliverables/bible-snapshot.md video/buildrik-showcase/deliverables/render-log.md
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/shahg/Desktop/pencil/buildrik commit -m "feat(video): ship Buildrik showcase video — 48s, 6 shots, Veo 3 + AE post"
```

- [ ] **Step 3: Verify final.mp4 and final-mute.mp4 are NOT staged (they're gitignored)**

```bash
git -C /Users/shahg/Desktop/pencil/buildrik status video/buildrik-showcase/deliverables/
```

Expected: only `bible-snapshot.md` and `render-log.md` listed; the `.mp4` files should be untracked / ignored.

---

## Done

The 48s Buildrik product showcase video is now sitting at:

- `video/buildrik-showcase/deliverables/final.mp4` — full audio version, embed-ready
- `video/buildrik-showcase/deliverables/final-mute.mp4` — silent autoplay version

Distribution and embedding into the actual product website / social channels is out of scope for this plan and lives downstream.
