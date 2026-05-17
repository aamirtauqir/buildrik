# Localization design brief — A1 day-3 deferred decision

**Status:** DECISION LOCKED 2026-05-18 → `LOC: A,A` (subdirectory URLs + JSON
translations column). Implementation arc unblocked. The `ComingSoonScreen` stub
for the `localization` nav slot stays until backend + middleware + locale
switcher ship.

**Why deferred:** localization is the biggest day-3 item by surface area
(URL routing, page persistence, fallback resolver, runtime middleware).
Wrong pick = rip out tomorrow. Code-author it after the call below.

---

## D-LOC-1 — URL strategy

How a visitor's locale is communicated in the URL. This shapes routing,
SEO, analytics, and how the published-site middleware dispatches.

### A) Subdirectory: `/fr/about`, `/de/about` *(recommended)*

✅ One domain → one Vercel deployment → one DNS cert.
✅ SEO: hreflang tags + canonical URLs work cleanly.
✅ Cheapest to implement — middleware reads first path segment.
✅ Visitors share links naturally; no special domain DNS.
❌ Root `/about` needs an explicit default-locale rule (redirect to
   `/en/about` or serve in default locale without prefix — pick one).
❌ Static export (Vercel) needs all locale routes pre-rendered (or
   ISR with on-demand generation — costs more).

### B) Subdomain: `fr.site.com`, `de.site.com`

✅ Strongest visual separation; easy CDN/cache split per locale.
✅ Useful when locales need different domains for legal/regulatory reasons.
❌ Each subdomain needs its own DNS record + SSL cert.
❌ Vercel deployment maps one project per domain — harder to share assets.
❌ Cookies don't share across subdomains by default.
❌ Most user pain: visitors must explicitly switch domains.

### C) Query string: `?lang=fr`

✅ No routing changes; works on static hosting.
❌ SEO is poor — search engines often treat as duplicate content.
❌ Analytics platforms typically don't auto-split.
❌ Looks like a hack. Won't be taken seriously by users with i18n needs.

**Recommendation: A (subdirectory).** Industry standard. Vercel + Next.js
both support it natively via middleware rewrites. Strategy B is reserved
for genuine multi-region brands; we don't have one. Strategy C is reject.

---

## D-LOC-2 — DB model

How per-locale page content is stored.

### A) Locale JSON column on Page *(recommended for MVP)*

```prisma
model Page {
  id            String   @id
  siteId        String
  defaultLocale String   @default("en")
  blocks        Json     // master content (in defaultLocale)
  translations  Json?    // { "fr": { blocks: [...] }, "de": { blocks: [...] } }
}
```

✅ Single Page row per logical page; easier mental model.
✅ Sub-second to add a new locale (no row creation).
✅ Slug history + page-level redirects already work without changes.
❌ JSON queries less ergonomic than relational ones.
❌ One wide row; risk of becoming bloated (limit ~10 locales reasonable).
❌ Hard to show "translation status" (partial/missing) without parsing JSON.

### B) Per-locale Page rows

```prisma
model Page {
  id            String   @id
  siteId        String
  locale        String   // "en", "fr", "de"
  parentPageId  String?  // points to canonical (default-locale) page
  blocks        Json
  @@unique([siteId, locale, slug])
}
```

✅ Fully relational; "translation status" = `count(rows where locale=...)`.
✅ Each locale can diverge in slug, SEO, etc. (e.g. `/fr/a-propos` vs `/en/about`).
✅ Standard CMS pattern (Strapi, Contentful, Sanity).
❌ Fan-out: 10 locales × 50 pages = 500 rows. Editor needs to keep them in sync.
❌ Add-locale = bulk insert → migration noise on existing sites.
❌ Slug history per-locale gets murky.

**Recommendation: A (JSON column) for MVP.** Migrates trivially: add nullable
`translations` Json column on Page. No row fan-out. If we hit JSON-query
limits in 6 months, the upgrade path to (B) is `INSERT INTO pages SELECT ...`
which is reversible. Most Buildrik sites will have 1-3 locales, not 30 —
JSON works at that scale.

---

## D-LOC-3 — Fallback hierarchy

How a missing translation resolves. **No real choice here — this is settled
industry pattern.**

`fr-FR` requested → check `fr-FR` → fall back to `fr` → fall back to site
default locale (e.g. `en`) → 404 only if default itself missing.

Implementation: middleware resolver returns the first locale in the chain
where `page.translations[locale]` exists.

---

## D-LOC-4 — Editor UX (already partial)

The Localization screen needs a per-locale switcher. Likely shape:

- Top of screen: locale chips (cobalt-active for current). Click to swap.
- Per-block translation overlay on canvas elements.
- "Translation status" sidebar showing which pages are 0% / 50% / 100% translated.

This is the biggest UI work, easily 2-3 days alone. Not in this brief's scope.

---

## What ships when the call is made

Once you pick (A1+A2):
- Migration: `ALTER TABLE pages ADD COLUMN translations Jsonb` (~5 min)
- Site columns: `defaultLocale String @default("en")`, `enabledLocales String[]`
- Middleware: read first path segment, fall back to default-locale routing
- Editor: locale switcher in top bar + per-block translation panel (Phase B+)

ETA from approval: **1 sprint for backend + middleware + locale switcher.**
Per-block translation UI: separate Phase B arc.

---

## Decision request

Reply with `LOC: A,A` to take the recommended path (subdirectory URLs +
JSON translations column). Or specify your preference, e.g. `LOC: B,B` for
subdomains + per-locale rows. Or `LOC: defer` to keep the stub through Phase B.
