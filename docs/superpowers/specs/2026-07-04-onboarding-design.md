# Onboarding Design — 3-Path Hybrid Wizard (2026-07-04)

Status: APPROVED in brainstorm (founder, 2026-07-04). Target: Figma hi-fi on "Approach B — Full Redesign" page (842:2), then build.
Owner: Saqib. Design surface: Figma file `RmtnWGlZX9Z3idP6f5vmLq`.

## 1. Problem

Post-login onboarding is missing from the hi-fi deck. Pieces exist (Workspace Setup, getting-started checklist, new-site-chooser, ai-generate modal, empty editor W4) but nothing connects them, and the product has 3 build paths (Blank editor / AI / Templates) with no guided entry. Contact #1's usability report: "features grouped nahi, junior ko start samajh nahi aata" — first-run users don't know where to start.

## 2. Goal + success metric

- **Activation (wizard's job):** user makes their FIRST EDIT in session 1, inside 2 minutes of login.
- **Live (checklist's job):** first site published by day 1–2, driven by the dashboard getting-started checklist.
- Wizard ends at first edit. Checklist carries the rest. Never both at once.

## 3. Personas

| Persona | Entry | Onboarding |
|---|---|---|
| **Agency owner** (primary) | Sign-up → verify → verified | Full wizard (steps 1–4 below) |
| **Invited member** (Designer/Member) | Invite-accept link | SKIPS wizard — gets member first-run (§6) |
| **Returning user** | Sign-in | No wizard. Dashboard. Checklist if incomplete |

## 4. Owner flow (wizard, 4 steps → editor)

```
Login/verify ──▶ 1. Workspace Setup (EXISTS 843:270 — name, role, source)
                 2. "Kis ke liye site?"  — client quick-add
                    · prefilled "My first client", email optional
                    · SKIP prominent (top-right, 13px, always visible)
                 3. "Kaise banaoge?" — 3-path chooser (THUMBNAILS, not radio)
                    · ✨ AI — mini example card. DEFAULT when role=Freelancer
                    · 📋 Template — 3 mini-previews. DEFAULT when role=Agency
                    · ⬜ Blank — empty grid thumb
                    · "Recommended" chip follows role from step 1
                 4. Editor + path-specific first-run (ONE coach mark, dismissible)
                    · AI       → ai-generate modal, prompt PREFILLED, focus on Generate
                    · Template → template loaded, coach mark on first text block:
                                 "Click karke text badlo"
                    · Blank    → pulse on "+ Add section"
                 ── WIZARD ENDS. User has made/started something. ──
Dashboard checklist continues (EXISTS, modified §7):
   ✓ workspace → ✓ client → ✓ site → send for review → LIVE
```

Progress indicator: 3 dots top-center on steps 1–3 ("1 of 3"). Step 4 is the editor itself — no wizard chrome.

## 5. Rules

- **Skip-all:** every wizard step skippable; "Skip setup" ends wizard → dashboard. Checklist absorbs skipped steps.
- **Resume:** wizard incomplete + next login → resume at same step (max 1 resume; second abandon = never show again, checklist only).
- **Never re-show:** wizard completed or skipped-twice → never again. Checklist is the only persistent onboarding surface.
- **Client email optional at step 2:** sign-off needs it later — checklist item 5 (§7) and send-for-review prompt catch it.
- **Step-2 skip → auto-client:** silently create client "My workspace"; site attaches to it. Model ("every site belongs to a client") stays unbroken; renameable later. *(auto-decided, founder confirm pending)*
- **Path default by role:** Freelancer → AI recommended; Agency → Template recommended; unknown role → AI. *(auto-decided, founder confirm pending)*

## 6. Invited member first-run (1 new screen)

Invite-accept → `member-first-run`: "[Agency] ka workspace • You're a [Designer] • Assigned: [site cards]" → single CTA "Open [site] →" lands in that site's editor. No workspace creation, no client step, no path chooser. Trunk-test: member always knows whose workspace, what role, which sites.

## 7. Dashboard checklist (modify existing)

5 items (was 4): 1. Create workspace ✓ · 2. Add your first client · 3. Create a site · 4. **Add client email (sign-off ke liye)** · 5. Send for review → publish. Wizard-completed steps arrive pre-checked. Checklist card collapses to a slim progress pill after 5/5.

## 8. States & edge cases

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| AI generate (step 4a) | "~30 sec" progress + rotating build log lines | — | **"Generate fail — dobara try karo, ya template se shuru karo"** (Template = fallback CTA, retry secondary) | Editor with draft loaded |
| Template gallery | skeleton cards ×6 | n/a (stock always present) | load-fail → retry + Blank fallback | template applied in editor |
| Client quick-add (step 2) | btn spinner | — | invalid email inline | step 3 |
| Resume | — | — | wizard state lost → start dashboard + checklist (never re-wizard a step they finished) | — |
| Template apply | 300ms skeleton canvas, then content | — | apply-fail → stay in gallery + toast retry | editor, coach mark on first text |
| AI mid-generate close | — | — | user closes tab during generate → draft AUTOSAVES; next login: dashboard shows site card "Draft (AI)" — no wizard re-entry | — |
| member-first-run | — | **zero assigned sites → "Abhi koi site assign nahi hui. [Owner] se access maango" + secondary "Browse workspace" → dashboard (read-only)** | invite expired → invalid-link pattern (exists) | editor of assigned site |

## 9. Screens inventory

**NEW (3):** `onboarding-client-quickadd` (step 2) · `onboarding-path-chooser` (step 3, thumbnails) · `member-first-run` (§6). Plus 1 state: ai-generate ERROR variant.
**MODIFIED (3):** `template-gallery` — hi-fi missing, build from lo-fi 241:436 (6 templates, categories, hover→"Use template") · `dashboard-home-getting-started` — checklist 4→5 items · `ai-site-generate` — prefill note + error state.
**REUSE unchanged (4):** Workspace Setup (843:270) · editor W4 (843:847) · ai-generate modal happy path (845:14) · dashboard checklist card shell.

**Prototype wiring (B page):** verify-success → Workspace → client-quickadd → path-chooser → [ai-modal | template-gallery | editor-blank] → editor → dashboard-getting-started. invite-accept → member-first-run → editor. Every screen ≥1 exit; skip links wired to dashboard.

## 10. Journey storyboard (owner, AI path)

| Step | User does | Feels | Design supports |
|---|---|---|---|
| Verify → workspace | names workspace | "shuru ho gaya" | 1-of-3 dots, single field focus |
| Client quick-add | accepts prefill / skips | "ye mere kaam ko samajhta hai" (agency model) | prefill removes typing; skip removes pressure |
| Path chooser | picks AI (recommended chip) | confident — dekh ke chuna | thumbnails + role-based default |
| Editor + AI | hits Generate on prefilled prompt | **WOW — 30 sec mein site** | prefill = zero blank-page fear |
| Dashboard later | sees 3/5 checklist done | momentum | pre-checked items |

Template path delta: chooser → gallery (browse = "ye sab MERA ho sakta hai") → apply → coach mark on text ("edit karna itna aasan?"). Blank path delta: pulse on "+ Add section" ("khaali hai lekin agla qadam saaf hai") — Blank users are power users; least hand-holding.

## 11. NOT in scope

- Mobile onboarding (product desktop-only per DESIGN.md)
- Interactive product tours / tooltips beyond 1 coach mark per path (anti-slop, minimal motion)
- Email onboarding drip (separate arc)
- Billing/upgrade prompts inside wizard (never — goodwill reservoir)
- In-editor tutorials beyond first-run mark (editor spine arc)

## 12. What already exists (leverage)

DESIGN.md tokens (cobalt #2D6DFF, Inter, 4px, radius 4/8/12) · B-page auth chain incl. verify-success (870:131) · Workspace Setup · checklist card · new-site-chooser (superseded by path-chooser for onboarding; stays for dashboard "+ New site") · ai-generate modal · W4/W5 editor screens · lo-fi onboarding series on Wireframes page (790:x, 490:x, 464:x) as reference.

## 13. Design tokens / specifics

Wizard screens: 1440×1024, white bg, logo top-left (32px cobalt square + wordmark), content column 560px centered, heading Inter Bold 26, body Inter Regular 14 muted #64748B, primary CTA cobalt 48px, skip link 13px muted top-right, dots 8px (active cobalt, rest #E2E8F0). Path cards: 3× 260×200, 1px #E2E8F0 border, radius 12, hover border cobalt, "Recommended" chip cobalt-light. Path icons: **line icons (18px, 1.5px stroke, slate) — NO emoji** (slop rule). AI = spark outline, Template = layout-grid outline, Blank = plus-square outline. Coach mark: 1 per path, 280px tooltip, cobalt border, dismiss ✕, never blocks canvas.

## 14. Keyboard & a11y (desktop)

Enter = primary CTA on every wizard step · Esc = dismiss coach mark (never = skip-step, avoids accidental skips) · Tab order: field → primary → skip · path-chooser: arrow keys move card focus, visible 2px cobalt focus ring, Enter selects · all body text ≥13px at ≥4.5:1 contrast · progress dots have aria-label "Step 2 of 3".

## 15. AI path — complete flow (v2, built 2026-07-04)

chooser → **ai-brief** (business-type chips + naam + 1-line + pages checkboxes — NO free prompt) → **ai-style-pick** (predefined DESIGN TOKEN presets: ★ client brand kit + Cobalt Clean/Warm Earth/Slate Mono; swatches + hex + fonts + radius per card) → ai-generating → **ai-result-choice** (2 layout variants) → editor-ai-draft (+ ↻ Regenerate-section pill) → dashboard. Error: retry → generating. Modal `ai-site-generate` demoted to dashboard quick-gen only. Deferred: refine bar (inline-AI = code TARGET), long-wait state, quota-exhausted state.

## 16. Template path — complete flow (planned)

chooser → template-gallery ✅ → **template-preview (NEW: full-screen scroll preview, Use/Back)** → **style-tokens (REUSE ai-style-pick — one shared token screen for both paths)** → **template-applying (NEW: 2s merge-skeleton "template + brand tokens")** → editor-template-loaded ✅ → dashboard. States: gallery load-fail / apply-fail (§8) ✅.

## 17. Editor (Blank) path — complete flow (planned)

chooser → editor-blank W4 ✅ → editor-insert ✅ (WIRE: W4 "+ Add section" → insert → W5) → editor-build W5 ✅ (inline toolbar) → **editor-preview (NEW: chrome-less, Desktop/Tablet/Mobile toggle, shared exit for ALL 3 paths' Preview buttons)** → publish-flow ✅ → publish-live ✅. Edge: save-conflict ✅, version-history ✅. Deferred: unsaved-leave modal (P3).

## 18. M2 v3 — built rules (2026-07-04/05, post design-review ×2)

- **EK editor:** teeno paths ek `editor-ready` pe khatam; editor-variants (ai-draft/template-loaded/result-choice) DELETED. Blank path = founder's blank-canvas→insert→build.
- **EK kahani:** onboarding content = new-user story ("Bright Events") — demo-workspace (Green Media/Vortex) refs BANNED in wizard screens. Data flows: S2 client → A1 business prefill ("— S2 ke client se") + type match → A2 "kit abhi khaali" (naya client = no kit; Recommended = Cobalt Clean preset) → A3/E/T3 sab "bright-events". Member first-run = alag scenario (Vortex/greenmedia — M3 se consistent), amber divider ke saath.
- **EK counter per screen:** wizard dots sirf S1-S3; path screens sirf path-chip (A 1/3…). Dono kabhi ek saath nahi.
- Screens = component instances (wizard-chrome / editor-chrome / auth-split-shell); step-chips S/A/T/B/E/M; states-board + flow-map frames on page.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | issues_open (this run: clean, 2 pending) | score: 6/10 → 9/10, 8 decisions |
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |

Pass scores: IA 8→9 · States 6→9 (member-zero-sites, template-apply, AI-mid-close added) · Journey 8→9 (Template/Blank deltas) · Slop 8→9 (emoji→line icons per blacklist #7) · DESIGN.md 9 · A11y 6→8 (§14 added) · Decisions: 6 resolved in brainstorm, 2 auto-decided pending founder. Mockups skipped by design: visuals are built directly as Figma hi-fi (the deck IS the mockup medium); review target was flow correctness.

**VERDICT:** DESIGN REVIEW CLEAR (2 founder confirmations pending) — ready for Figma hi-fi build.

**UNRESOLVED DECISIONS:**
- D2: step-2 skip → auto "My workspace" client (recommended default applied; flip options: null-client / mandatory-client)
- D3: path default by role — Freelancer→AI, Agency→Template (flip option: AI-always)
