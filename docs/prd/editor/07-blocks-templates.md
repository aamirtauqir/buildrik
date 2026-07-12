# Editor PRD · Ch.07 — Blocks & Templates

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · base `packages/editor/src/`

## 7.1 Block architecture

Block config = static object (`BlockData` + elementType + optional `build()`), not React component (`blocks/types.ts:24`, `shared/types/block.ts:15`). Content = HTML string | ElementData tree | build() (precedence: build > content, `blockRegistry.ts:220-223`). **Registry SSOT: 63 configs** (`blockRegistry.ts:96-182`).

## 7.2 Inventory (63 registered)

- **Basic ×11**: container, text, heading, paragraph, button, link, list, divider, row, column, spacer (`blocks/Basic/*`)
- **Media ×9**: image (**deliberately src-less** — regression-tested so `element:needs-asset` picker fires, `Image.tsx:13-23`, `Image.regression.test.ts`), video, audio, svg, lottie, icon (build), gallery, video-embed, map-embed
- **Layout ×5**: section, 2/3-columns, grid, flex (builders `blocks/builders.ts:61-116`)
- **Forms ×16**: form, input, textarea, select, checkbox/radio (elementType `input`), file, date, time, email, password, number, range, color, label (elementType `text`), submit — all static HTML, no per-field schemas
- **Sections ×5**: hero (**ONLY config with attributes schema**: title/subtitle/buttonText/URL/bgImage/bgColor/textAlign/height — ⚠ omits overlay/overlayColor present in React props, `HeroSection.tsx:8-19,120-133`), features (props: columns 2|3|4, variant cards|icons|list), footer, navbar, cta (static)
- **Components ×13**: card, slider (slides/autoplay/dots/arrows), testimonials (columns 1-3, variants ×3), pricing (3 default tiers $9/$29/$99 "Popular"), progress, countdown, accordion, social-icons (size/variant/color), stack/switch/tabs/modal/table (build fns; tabs = proper tablist roles, `Tabs.tsx:12-105`)
- **Ecommerce ×4**: product-card/detail (CMS `data-bind` attrs), product-grid (`data-cms-collection="products"` template), cart-button (`data-checkout`) — ⚠ NOT in build-tab catalog

**⚠ Defined-not-registered**: `contactFormBlockConfig` exported from 2 index files but absent from blockDefinitions — unreachable (`ContactForm.tsx:349-362`).

## 7.3 Forms — three implementations + server

A. Registry blocks = inert HTML. B. **ContactForm React** (6 default fields, required+email regex validation, ⚠ **catch swallows errors silently** `ContactForm.tsx:126-127`). C. **Inspector FormConfig** (`shared/forms/FormSettingsSection.tsx:54-172`): enable → `formId form-${Date.now()}`, action submit|webhook|email, success/error messages, redirect. D. **Public endpoint** `POST /api/public/forms/[siteId]/[formBlockId]`: rate 10/60s per ip+form, body ≤256KB, ≤100 fields, value ≤10k chars, honeypot; errors 404/402(limit)/429 (`route.ts:6-57`, `shared/schemas/forms.ts:5-11`).

## 7.4 Templates

- **Full-page ×18** (`TemplateLibrary.tsx:55-185`): blank, contact-1, landing-1, pricing-1, portfolio-1, business-1 + 12 section-templates. ⚠ id `hero-split` reused across tabs — React key collision possible.
- **Section quick-insert ×11** (`SectionTemplates.tsx:42-144`); ⚠ SectionType enum includes `content` but no template/tab uses it (`:31`).
- **Apply pipeline**: `applyTemplate` = transaction → `importHTMLToActivePage` (`templateActions.ts:4-11`); ⚠ artificial 500ms loading delay (`TemplateLibrary.tsx:269-276`).
- **My Templates**: localStorage only; `useTemplateManager` composer path wired-but-unused ("future when formats unified", `:202-204`); rename local-only; SaveTemplate html prop unused; thumbnail XSS guard (`:26-34`).
- L0 stubs: TemplateCard, TemplateSelector (`templates/index.ts:6`).

## 7.5 Rules

Insert validates `canNestElement` (`blockRegistry.ts:214-217`); HTML sanitized pre-insert (`:189,226-233`); media blocks with no src → auto-switch to assets tab + `element:needs-asset`; build-tab catalog = 53 elements/6 categories (ecommerce excluded).

## 7.6 Defects (feeds §13)

1. contact-form unreachable (unregistered)
2. Navigation category = empty stub dir, yet catalog "navigation" borrows from Sections (`Navigation/index.ts:1-6`, `catalog.ts:384-416`)
3. **Brand-name chaos**: "Aquibra"/"dudo"/"buildrick"/"buildrik"/BizPro mixed — Hero attr default "Welcome to dudo" vs HTML "Welcome to Aquibra" (`HeroSection.tsx:22,115,121`)
4. Two CSS-var prefixes in blocks (`--buildrick-*` vs `--bd-*` in Tabs build, `Tabs.tsx:35-85`)
5. Hardcoded "2024" footer year ×3 (stale, `Footer.tsx:18` etc.)
6. Hero attributes schema incomplete vs props; stray blank JSX attrs ×3
7. ContactForm + localStorage errors swallowed silently
