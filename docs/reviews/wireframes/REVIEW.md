# Wireframe review pass — 2026-06-15

Two-agent review (flow-gap lens + coherence-vs-decided-docs lens) + mechanical
link check, against the 3 source docs (`../2026-06-14-*`). 22 screens + index.

Mechanical: ✅ no dead internal links, ✅ no orphan screens, editor-spine intentionally self-contained.

## P1 — must fix

| # | Screen(s) | Finding | Source |
|---|-----------|---------|--------|
| C1 | `53-settings` | Editor Settings shows **Redirects + site-wide Custom code + site SEO defaults** — these are publishing-infra ops that belong in **Dashboard**. Per-page `<head>` MAY stay. | solutions §3 L84/L86 |
| C2 | `50-pages` | Note says "site-wide SEO defaults live in rail→Settings (editor)" — wrong; site defaults live in **Dashboard**, editor shows effective value **read-only**. | solutions §3 L84 |
| F1 | `editor-spine` (+panels) | Editor has **no exit** to dashboard — brand is a dead label. §8.4 requires brand/"← Site name" → site detail. | flow §8.4 |
| F2 | *(missing)* | **Onboarding role-select** screen (seeds Simple/Pro density) not wireframed — the mechanism the whole Pro-density system depends on. Sign-in jumps straight to dashboard. | solutions §5.2 |
| F3 | `00-signin` | New signup lands on **populated** `10-dashboard`, never `13-first-run` (the activation moment). Needs `hasSites` branch. | flow §3.1 |
| F4 | `02-ai-wizard`, `10-dashboard` | AI **Cancel / abandon-mid-gen** has no destination; no "Generating…/Draft ready" dashboard card for resume. | flow §8.5 |
| F5 | `10/11/12` nav | Dashboard secondary nav (**Domains/Media/Settings/Billing**) all `href="#"`; paywall "Upgrade" CTA has no Billing target. | flow §4.1/§5 |
| F6 | `20-publish`, `12` | Free user pushed into DNS setup (`22`) with **no paywall** first — contradicts "name the limit before they invest effort". | flow §8.8 |

## P2 — worth filling

- `40` vs `41` reach-count asymmetry: 40 omits total ("12 · 4 pages"), 41 shows both ("12 · 31 across 4 pages"). Align 40 to show the total.
- Density toggle wording "Advanced / Simple view" — docs want default **unnamed**, toggle reads "Pro/Advanced".
- `21-preview` → no **Publish** affordance (dead-end forward; must exit then find Publish).
- `20-publish` success "Visit ↗" / `12` "Visit" don't link to `90-published` (trust loop never closes).
- §10 state variants missing on dashboard/content side: `03` no-results, `11` filtered-empty/loading, `12`/`53` loading/permission-denied.
- Delete-site / transfer confirmation referenced (`11` ⋯, `12` danger-zone) but never drawn; `⋯` menu has no open state.
- `50-pages` page context-menu + delete-guard ("linked from 3 pages") + cross-page link-picker (§8.3) not drawn.
- First-publish success vs republish not visually distinct.
- §9 share-link states (share view / password / expired) absent — `90` covers only live + 404.

## P3 — later

- Command palette ⌘K (the "where did X go" resolver, §11.5).
- Mirror "moved → open here" stubs (§11.5 — depends on F5 dashboard screens existing).
- Editor desktop-only small-screen state.
- AI partial-salvage as its own interactive branch (only muted text today).
- AI / Templates / Media / Components / History panel wireframes (only rail icons today).

## Disposition

Fixed this pass (cheap defects in shipped screens): **C1, C2, F1, F4 (wiring), F6 (gate), P2 reach-count, P2 preview→publish, P2 visit→90.**
Next batch (new screens): **F2 onboarding role-select, F5 dashboard ops (Settings/Domains/Billing), delete-confirm, §9 share states, §10 dashboard variants.**
