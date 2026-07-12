# dc Skin — Net-New Screen Specs (extracted from standalone, 2026-07-12)

Source: `~/Downloads/Buildrik Dashboard (standalone).html` rendered DOM. Accent = cobalt `#2D6DFF` (matches app after Phase 0). Brand = **Buildrick**. Sidebar 262px. All routes live under `/dashboard/*`, follow Page→tRPC→Service→Prisma, reuse existing components/tokens. NO purple.

## Build classification
| Screen | Route | Backend | Reuse |
|---|---|---|---|
| Resources | `/dashboard/resources` | none (static) | link-card grid |
| Learn | `/dashboard/learn` | none (static) | course list |
| Marketplace | `/dashboard/marketplace` | static catalog data | search + category filter |
| Apps | `/dashboard/apps` | static catalog + install state | reuse marketplace catalog data |
| Getting started | `/dashboard/getting-started` | existing onboarding state | reuse `DashboardChecklist` / onboarding router |
| All projects | `/dashboard/projects` | existing sites + folder | site folders + counts |
| Libraries & Templates | `/dashboard/libraries` | existing templates | reuse `template-gallery` + theme |
| Plans | `/dashboard/plans` | existing billing | reuse `plan-card`/`plan-comparison` |
| Usage | `/dashboard/usage` | metrics (partial real) | new `usage` router/service |
| Partner program | `/dashboard/partner` | new referral model | new `partner` router/service/schema |

## 1. Resources — `/dashboard/resources`
H1 "Resources" · sub "Docs, guides, brand assets and everything else you need." · grid of 6 link cards:
Documentation ("Guides for building, publishing and managing sites."), API reference ("Endpoints, tokens and webhooks for developers."), Brand kit ("Logos, colors and usage guidelines to download."), Template gallery ("Starter designs for every kind of site."), Changelog ("What's new — features, fixes and improvements."), Community ("Ask questions and share work with other builders."). Each card links out (docs/API → real routes where they exist: API→/dashboard/settings/api-tokens, Template gallery→/dashboard/libraries, Changelog→#).

## 2. Learn — `/dashboard/learn`
H1 "Learn" · sub "Buildrick Academy — courses, tutorials and best practices." · CONTINUE LEARNING card: "Client workflows · Lesson 3 of 6" [Resume]. · "Learning paths" list: Getting started with Buildrick (5 lessons·20 min, Completed), Designing with AI generation (4·16), Custom domains & DNS (3·12, Not started), Client review & sign-off (6·24). Static content.

## 3. Marketplace — `/dashboard/marketplace`
H1 "Marketplace" · sub "Apps, integrations and templates to extend your sites." · search "Search apps & templates…" · category chips: All·Analytics·Commerce·Marketing·Forms·SEO · FEATURED card: Analytics Pro ("Funnels, retention cohorts and real-time dashboards — built for agencies managing many client sites.") [Get Analytics Pro] · app grid: Google Analytics(Analytics)[Connect], Commerce(Commerce)[Install], Mailchimp(Marketing)[Connect], Typeform(Forms)[Install], Search Console(SEO)[Connect], Live Chat(Marketing)[Install]. Static catalog in a shared data module `lib/marketplace-catalog.ts`; client-side search + category filter.

## 4. Apps — `/dashboard/apps`
H1 "Apps" · sub "Extend your sites with first-party and partner apps." · banner "Discover 120+ apps in the marketplace…" [Browse marketplace→/dashboard/marketplace] · cards w/ Installed|Available badge + Open|Install: Analytics(Installed), Forms(Installed), Commerce(Available), SEO Toolkit(Installed), Live Chat(Available), Memberships(Available). Reuse the marketplace catalog data; "installed" derived from a simple set (static or workspace pref).

## 5. Getting started — `/dashboard/getting-started`
H1 "Getting started" · sub "Finish setup to launch your first site." · progress "X of 5 complete · N%" · checklist: Create your workspace, Create your first site, Connect a custom domain [Start], Invite a teammate, Publish your site. Reuse existing onboarding `DashboardChecklist` data (`trpc.onboarding` + `completeDashboardTask`). Wire real task completion from workspace state.

## 6. All projects — `/dashboard/projects`
H1 "All projects" · sub "Group sites into projects for clients and teams." · [New folder][New project] · folder cards: name, "N sites · M published", member avatars, ⋯ menu. Uses site `folderId` grouping + counts from sites service. (Site folders exist in schema — confirm model; if only media folders exist, add a site-folder grouping read.)

## 7. Libraries & Templates — `/dashboard/libraries`
H1 "Libraries & Templates" · sub "Reusable starting points and shared design systems." · tabs Templates|Libraries · Templates grid cards w/ category + [Use]: SaaS Landing(Marketing), Portfolio Grid(Personal), Store Starter(Commerce), Blog & News(Content). Reuse `components/templates/template-gallery`. Libraries tab = shared design systems (reuse theme/DS list).

## 8. Plans — `/dashboard/plans`
H1 "Plans" · sub "Upgrade, downgrade, or switch billing cycle anytime." · toggle Monthly|Yearly −20% · 4 cards: Starter $0 (2 sites, Buildrick subdomain, Community support)[Current], Freelancer $18 Popular (10 sites, Custom domains, Remove Buildrick badge)[Upgrade], Agency $58 (Unlimited sites, Client billing, Priority support)[Upgrade], Enterprise Custom (SSO & SAML, SLA & DPA, Dedicated CSM)[Contact sales]. Reuse `plan-comparison`/`plan-card` + billing router. Route may thin-wrap existing billing plan UI.

## 9. Usage — `/dashboard/usage`
H1 "Usage" · sub "Current billing period · <range>" · [This month] period toggle · 4 metric cards: BANDWIDTH x/100 GB, BUILD MINUTES x/500, FORM SUBMISSIONS x/2k, STORAGE x/10 GB · "Bandwidth over time · last 14 days" chart. New `usage` router+service. Real where available: STORAGE (media assets sum), FORM SUBMISSIONS (submissions count); BANDWIDTH/BUILD MINUTES = best-effort/derived or clearly-labeled estimate (no fake precision). Limits from plan.

## 10. Partner program — `/dashboard/partner`
H1 "Partner program" · sub "Earn commission and perks by referring agencies." · status card: "<Tier> Partner · <pct>% commission · $x of $y to reach <next> (z%)" [Get referral link] · metric cards: REFERRALS (count, +N this month), MRR INFLUENCED ($, +%), PAID OUT ($ lifetime) · table REFERRED|SIGNED UP|PLAN|COMMISSION. New model `Referral` (referrerId, referredEmail, signedUpAt, plan, commissionCents) + referral code on workspace/user. Tier computed from influenced MRR. Payout NOT wired (display-only "Paid out" from a field); flag in code.
