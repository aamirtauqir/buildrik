# Buildrick Editor — Feature Improvements (make each feature best-in-class)

> The enhancement layer. The redesign doc says keep/fix/complete/cut per feature; **this says how each feature becomes GREAT** for an agency designer — beyond "not broken", toward best-in-class vs Webflow / Framer / Figma. Feeds the screen-by-screen design (next step).
>
> Priority: **★ wedge-critical** (differentiator) · **◆ high** (agency value) · **• nice** (polish). Lens: the primary user is an agency designer building client sites and getting sign-off. "Why it wins" = the agency reason, not taste.

## Top 10 improvements that matter most (do these, in order)

| # | Improvement | Job | Pri |
|---|---|---|---|
| 1 | **Client review page = a Loom+Figma-comments killer** (video walkthrough + threaded pins + per-page approve + "what changed" highlight) | J5 | ★ |
| 2 | **White-label the review surface** (agency logo/color/domain — client never sees "Buildrick") | J5 | ★ |
| 3 | **Cross-site brand push with diff + blast-radius + rollback** (change a token once → preview impact across all client sites → push safely) | J4 | ★ |
| 4 | **Multi-stakeholder approval** (2+ approvers, sequential/parallel, deadline + auto-reminder) | J5 | ◆ |
| 5 | **AI whole-site draft = a real brief wizard** (industry → pages → tone → editable draft, not blank) | J2 | ◆ |
| 6 | **Inspector contextual density** (show only what this element needs; advanced collapsed; 6→2 levels) | J3 | ◆ |
| 7 | **Token usage map + safe-rename** ("where is this used" → rename propagates, never orphans) | J4 | ◆ |
| 8 | **Unified AI command bar** (⌘K → type intent → insert/edit/generate/navigate, one surface) | J3 | ◆ |
| 9 | **Real publish pipeline** (staging URL → real Lighthouse → preview-before-live → 1-click rollback) | J6 | ◆ |
| 10 | **Approval audit trail** (who approved which version when, exportable — agency's proof-of-sign-off) | J5 | ◆ |

---

## J5 · Client sign-off — the wedge, make it category-defining

| Feature | Today | Improve to | Why it wins (agency) | Pri |
|---|---|---|---|---|
| Client review page | absent | View site + **pin comments** + **Approve/Request-changes** + **video walkthrough** (record a Loom-style intro on the page) | replaces the email+Figma+Loom duct-tape with ONE link | ★ |
| Review branding | n/a | **White-label**: agency logo, accent, custom domain (`review.agency.com`) | client sees the agency, not Buildrick — agencies pay for this | ★ |
| Approval model | single implicit | **Multi-stakeholder** (client + client's boss), sequential or parallel, per-page approve | real sign-off has >1 approver; per-page unblocks partial ship | ◆ |
| "What changed" | none | **Diff highlight since last review** (client sees only what's new) | client re-reviews in seconds, not re-reading the whole site | ◆ |
| Approval integrity | gameable | **Invalidate on post-approval edit** + **audit trail** (who/what/when, exportable PDF) | the agency's legal proof "you approved this" | ★ |
| Reminders | none | **Deadline + auto-reminder** (client idle 2 days → nudge) | agencies chase clients manually today — automate it | ◆ |
| Comments | backend-only | Editor UI: **threaded**, @mention, resolve, filter by page/status, notify | the collaboration loop lives where work happens | ★ |
| Client identity | none | **Magic-link (no account)** + optional light account for repeat clients | zero friction for one-off clients, continuity for regulars | ◆ |

## J4 · On-brand — the second agency wedge

| Feature | Today | Improve to | Why it wins | Pri |
|---|---|---|---|---|
| Cross-site brand push | link-out only | **Diff-preview → blast-radius (N sites, M elements) → push → rollback** | change the brand once, ship to every client site safely | ★ |
| Token usage map | crash-prone hook | **"Where used" per token** + **safe-rename** (propagates, no orphans) + unused-token prune | refactor a brand without breaking 40 pages | ◆ |
| Import brand | manual | **Extract tokens from a URL / Figma / logo** (auto palette + type scale) | onboard a client's existing brand in one paste | ◆ |
| DS lint | warns | **One-click auto-fix** (snap off-token values to nearest token) | enforce brand without hand-editing | • |
| Presets | click no-op | **Component-level theming** (bind a preset to a component variant) | one brand, many looks, reusable | ◆ |
| Starters | 6 static | **Starter = a full brand kit** (tokens + components + sample pages) | new client site in minutes, on-brand from frame 1 | • |

## J3 · Build — the strength, sharpen to Framer-grade

| Feature | Today | Improve to | Why it wins | Pri |
|---|---|---|---|---|
| Inspector | 18 sections, dense | **Contextual**: only this element's relevant sections, advanced collapsed, 6→2 levels | fast editing, no scroll-hunting | ◆ |
| Insert | list + search | **Type-to-insert** (⌘K "hero" → drops hero), **recent/favorites**, **AI-suggest next** | speed; expert flow | ◆ |
| Command palette | 2 surfaces, hardcoded | **One ⌘K, registry-backed, AI-aware** (intent → action) | everything reachable, one muscle memory | ◆ |
| Responsive | per-breakpoint edit | **Edit one, see all breakpoints live** (mini multi-device preview) | catch responsive breaks while editing | ◆ |
| Components | variants exist | **Figma-grade variant props panel** + instance swap + reset-that-works | real component system = real reuse | ◆ |
| Multi-select | basic | **Align/distribute/smart-guides**, copy-paste-styles across selection | pro layout speed | • |
| CMS / dynamic | no front-door | **Dynamic-page builder** (collection → template → per-record publish) | data-driven client sites (blogs, catalogs) | ◆ |
| History | linear | **Named checkpoints** ("before client feedback") + labelled restore | safe experimentation | • |

## J2 · AI — make it real, then make it great

| Feature | Today | Improve to | Why it wins | Pri |
|---|---|---|---|---|
| Whole-site draft | blank stub | **Brief wizard** (industry → pages → tone → assets) → **real editable draft** | the fastest path from nothing to a client draft | ◆ |
| AI on selection | chat only | **Inline actions** ("make modern", "shorten copy", "match brand") on the selected element | edit-AI where the eye is, not in a side chat | ◆ |
| AI copy | none | **Generate + refine copy** in-place (headlines, CTAs, SEO meta) | fills the blank-canvas gap fast | • |
| AI from image | none | **Screenshot/Figma → editable layout** | import a reference, get a start | • |
| Image handling | fake picsum | **Real stock + AI-gen + brand-aware** placeholders | drafts look real, not lorem-grey | ◆ |

## J1 · Onboard — first 5 minutes decide adoption

| Feature | Today | Improve to | Why it wins | Pri |
|---|---|---|---|---|
| First-run | orphan spotlight | **Real coach**: highlight the 6 rail icons once, "start here", dismissible | fixes "kahan jaaun" on day one | ◆ |
| New site | blank/template/fake-AI | **Sample client project** + template gallery front-and-center + real AI path | never a blank scary canvas | ◆ |
| Onboarding checklist | 7 steps, local | **Agency-flavored** ("connect your first client", "set your brand", "send for review") + server-persist | teaches the wedge, not generic steps | • |

## J6 · Ship — make "live" trustworthy

| Feature | Today | Improve to | Why it wins | Pri |
|---|---|---|---|---|
| Publish pipeline | fake steps | **Staging URL → real Lighthouse → preview-before-live → 1-click rollback** | ship with confidence; undo a bad deploy | ◆ |
| Redirects/Headers/Localization | saved-not-live | **Actually enforced** on the live site (or honest beta-label) | saved-but-dead erodes trust | ◆ |
| Forms | in-memory preview | **Real submissions inbox + notifications + spam guard + integrations (Slack/email/webhook)** | leads reach the client, not a void | ◆ |
| Analytics | inject-only | **In-editor mini dashboard** (visits, top pages, form conversions) | the agency shows the client results | • |
| Custom domain | untested | **Guided connect + auto DNS-verify + SSL status** | the last mile that always breaks | ◆ |

## Cross-cutting

| Feature | Improve to | Pri |
|---|---|---|
| Save/conflict | **Real autosave confidence** (never a spurious "someone else edited" for a solo user) + recovery surfaced | ◆ |
| Recovery | **Surface crash-recovery** ("restore unsaved work from 3m ago") on reopen | • |
| Fonts | **Google + custom upload + brand-locked font set** | • |
| Collaboration (if invested) | **Real-time presence + cursors + live comments** (Yjs/CRDT) — ties J5 | bet |

---

## Sequencing (improvements → then screens)
1. **Lock the ★ wedge improvements first** (J5 review page depth + white-label + audit trail; J4 brand-push). These define the product.
2. **Then ◆ per active job** as each job's screens get designed.
3. **• polish** rides along with its screen.

**Next:** improvements agreed → design screens one-by-one (start J5 client review page — wireframes exist at `2026-07-18-j5-signoff-wireframes.md`, now enrich with these improvements before hi-fi).
