# Panel 00 — Strategy one-pager (FD-PNL-00S)

Date 2026-10-17 · Mode: DESIGN ONLY
Status: **WORKING HYPOTHESIS — not validated.** Written from the designer recommendation in the product-design review (`REVIEW-2026-10-17-pro-product-design.md`, finding X02/X03), owner instruction 2026-10-17 "han likh do". No user interviews or usability tests exist yet; every line below is a hypothesis to test (§7).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): R1, N1. Gap rows: D1-18, D1-19, D2-1, D2-35, D3-12, D3-13.
Purpose: give every panel spec a "why". Each panel's **§1** carries one line **"Job: J1 Build / J2 Get approval / J3 Publish and maintain / S supporting"** naming the job (§3) it serves *(R-1018, D2-1 — was "§3 should name"; every panel §3 is "Problems")*.

---

## 1. Primary user (one)
**Solo professional designer / freelancer who builds and maintains websites for clients.**
Picked from PRODUCT-DESIGN-BRIEF §2 ("professional solo designers building client websites"). The other statements in the doc set (HANDOFF "site editors/designers, administrators/owners and viewers"; FD-DYN-01 "designer/freelancer") describe **roles**, not users — roles govern access only (Panel 00 SC-6).

Secondary users, designed for second: the **client** (reviews, approves, later edits content), and **small agency teammates** (same job as the primary, shared sites).

## 2. Problem
The designer must deliver a professional, fast, client-approved site and keep it updated after hand-off. Today they juggle a design tool, a builder, email/screenshot feedback and a separate CMS; feedback and content edits break the design, and every round trip costs unpaid hours.

## 3. Jobs to be done
1. **J1 Build** — When I start a client project, I want to get from brief to a professional-looking site fast (page templates, sections, brand), so I can show the client something real in the first meeting.
2. **J2 Get approval** — When the site is ready for feedback, I want the client to comment on the real site and approve it, so I don't chase screenshots and emails.
3. **J3 Publish and maintain** — When the client approves or asks for a change, I want to publish safely and let the client update content without breaking the design, so the project stays profitable after launch.

**S** — supporting jobs: keep the site consistent (Brand, Components), manage content at scale (CMS), never lose work (saves, history, recovery).

## 4. Core loop
**Build → Preview → Client review → Publish → Change → (repeat)**
Panels on the loop: Add, Layers, Canvas, Inspector (Build) · Preview (SC-8) · Client review (Panel 17 — Review task interior + client page `/review/<token>`) · Publish (Panel 14 — review-and-publish dialog and Publish task) *(R-1018, D3-13 — was "Review task / Publish task (Panel 12)"; Panel 12 hosts them)* · CMS, Assets, Brand (Change).
Areas without a rail item *(R-1018, N1 / D2-35)*: **Components** — "Components ›" in the Add header + the Layers instance link (+ ⌘K); **Templates** — Pages → New page → From template (SC-10). Both deliberate: the rail stays Add, Layers │ Assets, CMS, Brand │ Help (BD-05).
Loop specs: first run (Panel 16), Publish (Panel 14), client review page (Panel 17) — SPEC COMPLETE, not VERIFIED.

## 5. Activation moment
**First session: the user edits a page template or section on the canvas and opens Preview (or publishes).**
Target: first canvas edit within 2 minutes of opening the editor; Preview within the first session. First-run design must lead straight here — one path ("Start from a page template"), not five competing actions on the empty canvas (Panel 05 §8).

## 6. Metrics
- **North star:** sites published per week (first publish + republishes) per active designer.
- **Funnel events** (to define per panel; no events exist yet): `editor_opened` · `first_canvas_edit` · `preview_opened` · `review_link_sent` · `client_comment_created` · `client_approved` · `publish_started` / `publish_succeeded` / `publish_failed` · `cms_record_saved` · `site_republished_7d`.
- **Health signals:** time to first edit; publish success rate; % sites with a review link; republish within 30 days (maintenance retention); undo-after-delete rate (recovery need).

## 7. Validation plan (hypotheses → tests)
**Owner decision R1 (2026-10-18)** *(R-1018, D1-19 / Q4)*: user validation is a **gate** — the 5 interviews run **before** first-run Figma starts, and the 5-user prototype test runs **with the first Figma pass**. Owner: **founder** on the two R1 rows; rows 3–4 are not covered by R1 — **owner: to assign** *(R-1018 reconciliation)*. Dates: **owner to set** (none invented here).

| Hypothesis | Test | When | Owner | Date |
|---|---|---|---|---|
| The primary user is the solo designer, not an agency team | 5 interviews with current/target users | **before** Figma of first run — gate *(R-1018)* | owner: to assign | date: owner to set |
| Page template → edit → Preview is the activation path | 5-user moderated test of first run (Figma prototype) | with first Figma pass *(R-1018)* | owner: to assign | date: owner to set |
| The core loop is clear with the new shell (rail, topbar, right tasks) | 5-user task test: build a section, send review, publish | after Figma of panels 01–05, 11, 12 | owner: to assign *(R-1018)* | date: owner to set |
| Clients can review without training | 3 non-designer tests of `/review/<token>` | after the review page is designed | owner: to assign *(R-1018)* | date: owner to set |

## 8. Scope reminder
In this redesign: editor surfaces 00–13 + FD-DYN-01, then Publish end-to-end (14), first run (16), Templates (15), client review page (17) (priority order from the review §D); plus 18 palette/help, 22 global states, 23 plans and trial, 24 undo coverage, 25 analytics events — all SPEC COMPLETE, not VERIFIED.
**Interactions (19) and collaboration (21) are SPEC COMPLETE, behind flags** *(R-1018, D1-18 / D3-12 — were listed under "Later")*: they ship only when their flags are turned on and their SC-9 ⛔ rows are met.
Not this version: AI (Panel 20 DEFERRED, SC-21 — Brand "From logo or URL" is not AI and ships, P3) · members/visitor login (D7 deferred) · items the 2026-10-18 owner decisions defer (P1, P4, P6, P10, P11 — SC-23).
