# J5 — Client Sign-off · Screen Wireframes (build-first)

> The wedge, detailed to build. 6 screens, every state. Spec: `2026-07-17-editor-product-redesign-complete.md` §5-J5 + §5.6. Locked: **L1** build J5 first · **L2** client page = dedicated DESKTOP surface (not editor, not mobile).
>
> Running example: designer **Ali** (agency) finished a restaurant site "Bella Cucina", needs client **Sara** (owner) to approve before publish.
>
> Craft: **accent = `Client.brandColor` when the agency has set one, else the dashboard accent `#406ED6`** — NOT the editor's cobalt. S5.5 ships in the **dashboard** package, and white-labelling means the agency's colour outranks ours on a client-facing page. Contrast floor: if the brand colour fails 4.5:1 on white, keep it on the header only and use `#406ED6` for the primary button. Otherwise: no black (slate-700 `#334155`) · General Sans display / Inter Tight UI · 4px grid · light theme · desktop widths.

Legend: `[ Button ]` primary (agency brand colour, see above) · `( Button )` secondary · `‹ ›` icon · `▓` selected/active · `░` muted/disabled.

---

## Screen map (the flow)

```
DESIGNER (in editor)                         CLIENT (public desktop link)
──────────────────                           ────────────────────────────
S5.1 Send for review ──emails link──────────▶ S5.5 Client review page
        │                                          │
        ▼                                    ┌──────┴───────┐
S5.2 Review status ◀──────────────────────── ▼              ▼
   pending/changes/approved            Request changes    Approve v3
        │                                    │              │
        ▼                                    └──────┬───────┘
S5.3 Comments (canvas pins) ◀────comments──────────┘
        │
        ▼  (if Ali edits after approval)
S5.6 Post-approval guard → approval marked stale → publish with acknowledgement, or re-review
        │
        ▼  (approved & unchanged)
   Publish unblocks  ·  S5.4 = the gate error if publish attempted while pending
```

---

## S5.1 · Send for review — designer, topbar action

**Purpose:** Ali submits the current version for Sara's approval and gets a shareable link. Opens from the topbar `[ Send for review ]` (the action home, per R1).

### State A — compose
```
┌─ Send for review ───────────────────────────────── ✕ ─┐
│                                                        │
│  Version   ▓ v3 · current  ░                           │
│                                                        │
│  Reviewer  ┌──────────────────────────────────────┐   │
│            │ sara@bellacucina.com                  │   │
│            └──────────────────────────────────────┘   │
│            ‹＋› add another reviewer                    │
│                                                        │
│  Message   ┌──────────────────────────────────────┐   │
│  (optional)│ Hi Sara — homepage + menu ready.      │   │
│            │ Take a look and approve when happy.   │   │
│            └──────────────────────────────────────┘   │
│                                                        │
│  ☑ Lock publishing until approved                      │
│                                                        │
│              ( Cancel )        [ Send for review ]     │
└────────────────────────────────────────────────────────┘
```

### State B — sending → sent
```
┌─ Send for review ───────────────────── ✕ ─┐    ┌─ Sent ✓ ───────────────────────── ✕ ─┐
│                                            │    │  Review link created for v3          │
│         ◌  Creating review link…           │ →  │  ┌────────────────────────────────┐  │
│                                            │    │  │ app…/review/9fA2… ‹copy› ‹open›│  │
│                                            │    │  └────────────────────────────────┘  │
│                                            │    │  Emailed to sara@bellacucina.com     │
│                                            │    │           [ Done ]                    │
└────────────────────────────────────────────┘    └───────────────────────────────────────┘
```
States: `compose` · `sending` · `sent` · `error (email failed → link still copyable)`.

---

## S5.2 · Review status — designer, TOPBAR review-status pill → review bar (§4.3)

**Purpose:** Ali's at-a-glance state of the sign-off. Lives in the topbar as the review-status pill; expands into the review bar while a review is active (not an action — the status surface).

### State: PENDING
```
┌ REVIEW ───────────────┐
│ ● Pending review      │   ← cobalt dot
│                       │
│ v3 · sent 2h ago      │
│ to sara@bellacucina   │
│                       │
│ ‹👁› Sara hasn't       │
│      opened yet       │
│                       │
│ 💬 0 comments          │
│                       │
│ ( Copy link )         │
│ ( Cancel review )     │
└───────────────────────┘
```

### State: CHANGES REQUESTED          ### State: APPROVED
```
┌ REVIEW ───────────────┐        ┌ REVIEW ───────────────┐
│ ▲ Changes requested   │        │ ✓ Approved            │  ← green
│   (amber)             │        │                       │
│ v3 · Sara · 20m ago   │        │ v3 · Sara · just now  │
│                       │        │                       │
│ "Menu prices wrong,   │        │ Publishing unlocked   │
│  hero photo too dark" │        │                       │
│                       │        │ [ Publish ]           │
│ 💬 3 comments  ‹view›  │        │                       │
│                       │        │ ‹↺› Re-send for review│
│ [ Open comments ]     │        │      (new version)    │
└───────────────────────┘        └───────────────────────┘
```
States: `none (draft)` · `pending` · `opened-not-acted` · `changes-requested` · `approved` · `approved-but-edited-since` (→ S5.6).

---

## S5.3 · Comments — designer, canvas 💬 comment mode + slide-in thread list

**Purpose:** Sara's comments land as numbered pins on the canvas; Ali reads/replies/resolves. Comments backend exists — this is the missing editor UI.

```
┌ Comments (slide-in)  ✕ ┐   ┌──────── CANVAS (Bella Cucina · home) ─────────┐
│ 3 open · 1 resolved    │   │                                               │
│ ┌────────────────────┐ │   │      BELLA CUCINA        ①◀─ pin (cobalt)     │
│ │①Sara               │ │   │      ┌───────────────────────────┐            │
│ │ "hero too dark"    │ │   │      │   [ dark hero photo ]     │            │
│ │ ‹reply› ‹✓resolve› │ │   │      └───────────────────────────┘            │
│ ├────────────────────┤ │   │                                               │
│ │②Sara               │ │   │   Our Menu            ②◀─ pin                 │
│ │ "prices wrong"     │ │   │   Pasta … $12  ③◀─ pin                        │
│ │ ↳ Ali: "fixed ✓"   │ │   │                                               │
│ │ ‹✓resolve›         │ │   │                                               │
│ ├────────────────────┤ │   │                                               │
│ │▓③Sara  (selected)  │ │   │                                               │
│ │ "add gluten-free"  │ │   │                                               │
│ └────────────────────┘ │   │                                               │
│ ☐ show resolved        │   │                                               │
└────────────────────────┘   └───────────────────────────────────────────────┘
```
Interaction: click a list item → canvas scrolls to + highlights its pin (and reverse). States: `no-comments` · `open-thread` · `replied` · `resolved` · `show-resolved toggled`.

---

## S5.4 · Approval gate error-state — designer/admin

**Purpose:** an ADMIN hits **Publish** while review is still pending. Show *why + who + how*, never a raw `PRECONDITION_FAILED` (design-review D-T2).

```
┌─ Can't publish yet ─────────────────────────────── ✕ ─┐
│                                                        │
│   ⚠  This site needs client approval before it        │
│      goes live.                                        │
│                                                        │
│   Status   ● Pending — sent to Sara 2h ago             │
│                                                        │
│   Who can approve                                      │
│   • sara@bellacucina.com  (reviewer)                   │
│                                                        │
│   ┌────────────────────────────────────────────────┐  │
│   │  app…/review/9fA2…            ‹copy›  ‹remind›  │  │
│   └────────────────────────────────────────────────┘  │
│                                                        │
│   ( Cancel )                       ( Copy review link )│
└────────────────────────────────────────────────────────┘
```
Variants: `pending` (above) · `changes-requested` ("Sara asked for changes — resolve them, then re-send") · `no-review-sent` ("Send for review first → [ Send for review ]"). Behind the per-workspace flag (S5); OWNER-exempt path shows nothing.

---

## S5.5 · CLIENT REVIEW PAGE — `/review/<token>` · dedicated DESKTOP (the front door, #1)

**Purpose:** Sara (not logged in, on desktop) reviews Bella Cucina and approves or requests changes. Minimal chrome — agency-branded, NOT the editor. This is the wedge.

### State A0 — first visit: who are you? (identity capture — locked decision C)
Sara has the link but we've never seen her. One lightweight step, **no password**, before the site loads. Returning visits skip this (stored on the token).
```
┌────────────────────────────────────────────────────────────────────────┐
│  ‹Ali's Studio›                         Reviewing:  Bella Cucina · v3    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              Ali's Studio invited you to review this site.               │
│                                                                          │
│              Your name    ┌──────────────────────────┐                   │
│                           │ Sara Khan                │                   │
│                           └──────────────────────────┘                   │
│              Email        ┌──────────────────────────┐                   │
│                           │ sara@bellacucina.com     │                   │
│                           └──────────────────────────┘                   │
│              (so Ali knows whose feedback is whose)                      │
│                                                                          │
│                        [ Start reviewing → ]                             │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```
- No password, no account creation, no email verification loop — one form, then straight into the site.
- Name + email attach to every comment and to the approval record (the ★ audit-trail: "Sara Khan approved v3 on 18 Jul").
- Pre-fill both when the designer already typed the reviewer's email in S5.1.
- **States:** empty · typing · validation-error (bad email) · returning-visitor (skipped entirely).

### State A — landing / viewing
```
┌────────────────────────────────────────────────────────────────────────┐
│  ‹Ali's Studio›                         Reviewing:  Bella Cucina · v3    │  ← slim branded bar
├────────────────────────────────────────────────────────────────────────┤
│  ▓ Preview        ‹💬 Comment›               [ Desktop ▾ ]   ← view-only  │  ← mode strip
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                        ┌────────────────────────────┐                    │
│                        │       BELLA CUCINA          │                    │
│                        │   [ hero photo ]            │   ← the real       │
│                        │   Authentic Italian         │     built site,    │
│                        │   ( Book a table )          │     scrollable     │
│                        │                             │     view-only      │
│                        │   Our Menu · Pasta $12 …    │                    │
│                        └────────────────────────────┘                    │
│                                                                          │
├────────────────────────────────────────────────────────────────────────┤
│  Ali asks: "homepage + menu ready — approve when happy"                  │
│                              ( Request changes )        [ ✓ Approve v3 ] │  ← sticky footer
└────────────────────────────────────────────────────────────────────────┘
```

### State B — commenting (click element → pin → type)
```
│                        │   [ hero photo ]  ①💬────────────┐               │
│                        │   Authentic Italian │ Sara       │               │
│                        │                     │ ┌────────┐ │               │
│                        │                     │ │too dark│ │               │
│                        │                     │ └────────┘ │               │
│                        │                     │ [ Post ]   │               │
│                        │                     └────────────┘               │
```
Mode strip `‹💬 Comment›` active → clicking any element drops a pin + inline composer. Pins persist, numbered, feed S5.3.

### State C — request changes             ### State D — approved
```
┌ Request changes ─────────── ✕ ┐        ┌────────────────────────────────┐
│ What should Ali fix?          │        │           ✓                    │
│ ┌───────────────────────────┐ │        │   You approved Bella Cucina v3 │
│ │ Menu prices are wrong and │ │        │   18 Jul 2026, 3:42pm          │
│ │ the hero photo's too dark │ │        │                                │
│ └───────────────────────────┘ │        │   Ali can now publish it live. │
│ 3 pinned comments included    │        │                                │
│   ( Cancel )  [ Send to Ali ] │        │   ( View site )                │
└───────────────────────────────┘        └────────────────────────────────┘
```

### State E — post-approval revisit        ### State F — expired / invalid token
```
┌────────────────────────────────┐        ┌────────────────────────────────┐
│ ✓ You approved v3 on 18 Jul.    │        │   This review link has expired │
│                                 │        │   or was replaced.             │
│ ⚠ Ali has changed 2 things      │        │                                │
│   since — he'll send a new      │        │   Ask Ali's Studio for a new   │
│   review if he needs sign-off.  │        │   link.                        │
│                                 │        │                                │
└─────────────────────────────────┘        └────────────────────────────────┘
```
States: `landing/viewing` · `commenting` · `request-changes` · `approved` · `post-approval (unchanged)` · `post-approval (edited-since → E)` · `expired-token (F)` · `loading` · `load-error`.

---

## S5.6 · Post-approval guard — mark the approval stale on edit

**Purpose:** if Ali edits after Sara approved, the approval must not silently cover the new edits (else the gate is theater — eng T2). Change-since-approval tracking.

⚠ **Wording corrected 2026-07-19.** This section was headed "invalidate approval on edit", but the screens below have always drawn `▲ Approved v3 · edited since` — a **stale marker**, not a revocation. The drawings were right and the heading was wrong. Canonical rule is `2026-07-19-system-contracts.md` §1.5: **the approval stands, it is marked stale, the change count is always visible, and publishing past it requires an itemised acknowledgement.** Revoking outright would make a one-word typo fix cost a full client round trip.

### Designer side — topbar review-status pill flips
```
BEFORE edit:  ✓ Approved v3            AFTER Ali edits:  ▲ Approved v3 · edited since
                [ Publish ]                                2 changes not reviewed
                                                           ( Re-send for review )
                                                           [ Publish anyway ⚠ ]
```
- `Publish` stays **enabled**, for any role including DESIGNER, behind an itemised acknowledgement of what changed since approval (contracts §1.5 + §2, decided 2026-07-19). There is no per-workspace policy switch — one rule, everywhere.
- "2 changes" links to a diff of what changed since approval.
- Client side reflects as S5.5 state E on their next visit.

States: `approved-clean` · `approved-edited-since (N changes)` · `re-sent (back to pending)`.

---

## Build order within J5
1. **S5.5 client review page** (landing → view → comment → approve/request → approved) — the front door, most net-new.
2. **S5.1 send-for-review** + **S5.2 review status** — the designer loop that feeds it.
3. **S5.3 comments UI** (canvas pins + list) — surfaces the built backend.
4. **S5.4 gate error-state** + **S5.6 post-approval lock** — make the gate honest (behind the S5 flag).

## Open (block a screen)
- ~~Token/link security model~~ — **settled**, contracts §1.4: 90-day expiry · re-send issues a new token and revokes the old · manual revoke from the Review panel · scope is one review, one site, comment+approve only · expired links get their own screen, not a 404.
- ~~Does "Request changes" reopen editing?~~ — **settled**, contracts §1.3: it moves the review to `CHANGES_REQUESTED`. The designer never stopped being able to edit; what changes is that the client’s view goes read-only until re-sent, and the Publish CTA stays disabled.
- ~~Reviewer identity~~ — **RESOLVED**: hybrid (token + name/email captured on first visit). See State A0..

## Next
Take these into Figma hi-fi (`figma-product-design` execute) once the 3 opens above are called. Then watch one real client approve — where Sara hesitates is the wedge's truth.
