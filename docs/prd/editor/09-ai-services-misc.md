# Editor PRD · Ch.09 — AI surfaces, Services layer, Wizard/Collab/Ecommerce/Animation

> Part of BUILDRIK-PRD-EDITOR v2.0 · reverse-engineered `main` @ `e5624ca1` · 2026-07-07 · paths relative to `packages/editor/src/` · nothing invented, uncertainty `[TBC]`

## 9.1 AI entry surfaces (`ai/`, 10 files)

Global gate `AI_AVAILABLE = true` (`ai/AIAssistantBar.tsx:16`) gates all AI UI.

| Surface | What it does | Reality check |
|---|---|---|
| **AICopilot** (`AICopilot.tsx`) | Chat modal; 6 hardcoded quick actions (Hero/Features/Pricing/Testimonials/CTA/Contact — `:55-104`); keyword-routes input to image/layout/content (`:318-334`); DOMPurify-narrowed HTML preview (`:116-193`) | Real tRPC-backed generation |
| **AIAssistant** (`AIAssistant.tsx`) | 6-tab modal: Content/Layout/Image/Analyze/Colors/A11y (`:159-164`) | Analyze tab = client-side `LayoutAnalyzer`, not AI (`:66-76`) |
| **AIAssistantBar** (`AIAssistantBar.tsx`) | Floating ⌘K bar, Content/Layout modes (`:32,102-115`); layout mode → `composer.elements.importHTMLToActivePage` (`:61-71`) | Legacy path (v1.0 PRD §13-B2); displays credit count from window event `ai-credits-update` (`:24-47`) — client never enforces credits |
| **AccessibilityChecker** (`AccessibilityChecker.tsx:37-179`) | img-alt, empty button/link names, heading order, missing h1, WCAG contrast ≥4.5:1, font <12px | Pure client-side, NOT AI |
| **ColorPalette** (`ColorPalette.tsx:101-142`) | complementary/analogous/triadic/split HSL generation | Pure color-theory math, NOT AI |
| L0 stubs | `AIPageGenerator, AIContentPanel, AICodeEditor` — files not created | `ai/index.ts:24-25` |

**Facade** `shared/utils/openai.ts` — name is a lie: delegates entirely to tRPC (`:1-27`). Fns: generateContent/Variations (default 3, skipCache), generateLayout, generateImagePrompt, generateCode, improveContent, translateContent, summarizeContent, generateSEO, streamContent, batchRequests (`:92-332`).
- ⚠ **Image gen is fake** — returns `picsum.photos` placeholder (`:150-157`).
- ⚠ **Streaming is fake** — non-streaming fallback (`:256-276`). (AITab's real streaming lives elsewhere — v1.0 §6 AI.)

**Transport** `services/ai/AiTrpcClient.ts` — mutations `ai.content|page|layout` (`:195-224`). generatePage input: pageType landing/portfolio/product/pricing/blog × style modern/minimal/bold (`:200-215`). No AI job machine here — synchronous mutations; AICopilot's pending/complete/error = local chat UI (`AICopilot.tsx:399`).

## 9.2 Services layer (each service → API)

All dashboard tRPC via `createBuildrikApiClient(DASHBOARD_URL)`, cookies included, superjson (`services/api-client.ts:20-44`).

| Service | Calls | Product-critical behavior |
|---|---|---|
| **BuildrikSyncProvider** | `sites.get`, `pages.list`, `siteDetail.settings.get` (load `:202-206`); `sites.saveProject` + `siteDetail.settings.update` (dual-save `:296-308`); `media.listAssets` limit 200 + `listFolders` (`:368-371`) | Autosave debounce 5000ms; **empty-project data-loss guard** (2026-06-04 fixture-wipe incident, `:447-495`); optimistic concurrency `expectedLastEditedAt` → `SaveConflictError` + window event `buildrik:save-conflict` (`:51-73,313-323`); plan map FREE→starter/PRO→pro/BUSINESS→enterprise (`:186-190`) |
| **AssetUploadService** | `@vercel/blob` client upload → `/api/asset-upload` (`:80-92`); media.createAsset/deleteAsset/createFolder/moveAsset/… (`:151-240`) | Reachability probe treats 400 reachable / 401 unusable (`:107-123`) |
| **AltTextService** | `media.generateAltText` (`:40-49`) | null on failure; `skipped` preserves user text |
| **MediaVersionService** | list/create/restoreAssetVersion (`:34-51`) | plan version-cap enforced server-side |
| **PublishService** | `sites.publish/publishStatus/cancelPublish/get` (`:42-105`) | job states §9.5; Vercel when `VERCEL_TOKEN` else dev simulation (`:36-40`) |
| **ReviewService** | `reviews.submit` (`:20-24`) | "Send for review"; exports `currentSiteId()` (`:13-18`) reused by all sync modules |
| **cmsSync** | cms.collections/entries upsert/delete/list (`:111-228`) | retry queue latest-wins, `online` auto-retry, pending count (`:34-98`) |
| **componentSync** | siteComponents.upsert/delete/list/get (`:50-90`) | agency-shared component masters mirror |
| **versionSync** | siteVersions.create/delete/list/get (`:52-94`) | version-history mirror |
| **templateSync** | userTemplates.upsert/list (`:47-89`) | local cache = localStorage `MY_TEMPLATES` |
| **StockService** | media.searchStockPhotos/Videos (`:57-98`) | unsplash/pexels/pixabay server-proxied; ⚠ header docstring falsely says "stub" (`:4`) — stale |
| **EmailService** | — | ⚠ **sendgrid/mailgun/resend all throw "backend proxy not yet configured"** (`:340-349`); SMTP unsupported in browser; mock in-memory only; custom template renders caller HTML unescaped — XSS surface if untrusted (`:151-157`) |
| **FormSubmissionService** | arbitrary `webhookUrl` POST (`:235-246`) | ⚠ submissions in-memory `Map` only — lost on reload (`:99,119-122`); validation: required/email/phone/number/min/maxLength/pattern (`:155-216`) |
| **GoogleFontsService** | fonts.googleapis.com css2 links (`:148-174`) | 25 hardcoded fallback fonts (`:49-75`) |

## 9.3 Wizard / Collaboration / Ecommerce / Animation — real vs stub

| Module | Verdict | Evidence |
|---|---|---|
| **PageWizard** | ⚠ **"AI" is SIMULATED** — 7 hardcoded steps insert static HTML with fake `setTimeout(800+rand·700)` delays; form inputs (pageType/description/style) **never sent anywhere**; subtitle still claims "AI does the rest" | `wizard/PageWizard.tsx:53-135,230`; catalog `sectionData.ts:20+` |
| **Collaboration UI** | Real components, mock fallbacks: PresenceIndicators shows hardcoded MOCK_USERS ("You","Ana") when disconnected (`PresenceIndicators.tsx:39-43`); ConnectionQuality 3-bar, <100ms good/100-300 fair/>300 poor (`ConnectionQualityIndicator.tsx:83-100`) | engine collab = flag-off, 6 P1s (v1.0 §6) |
| **Ecommerce** | One real modal: CollectionSetupModal — Products collection prompt on e-com block drop (8 fields, optional 3 samples); creation delegated to caller | `CollectionSetupModal.tsx:28,105-118` |
| **AnimationEditor** | Real config UI: 12 entrance/8 attention/5 exit presets, duration/delay/easing/iterations + live CSS preview (`AnimationEditor.tsx:24-66`); ⚠ trigger row (load/scroll/hover/click) REMOVED 2026-05-18 — engine never honored triggers (`:176-180`); TimelineEditor/ScrollTriggerEditor = L0 stubs (`index.ts:11`) | |

## 9.4 Analytics reality

- **sidebarAnalytics = production no-op** — default `noopProvider`, console only under debug flag; "Wire to PostHog/Mixpanel via setProvider when ready" (`sidebarAnalytics.ts:4-44`). 4 call sites: `tab_switch` (`useSidebarState.ts:144`), `element_insert` (`useElementsState.ts:153`), `search` (`SearchBar.tsx:61`), `error` render (`InspectorErrorBoundary.tsx:45`).
- **AI adoption IS real**: `adoptionTracker.ts:42-97` fire-and-forget `ai.logAdoption` — events edit.applied / agent.run (steps planned/applied/skipped/failed + duration) / edit.reverted; privacy: structural only, no prompt text (`:16-20`).

## 9.5 State machines

| Machine | States | Source |
|---|---|---|
| Publish job | QUEUED→BUILDING→DEPLOYING→COMPLETED \| FAILED \| CANCELLED; url only on COMPLETED | `PublishService.ts:28,64-69` |
| Wizard | form → loading → error; per-step pending/generating/done | `PageWizard.tsx:21,26` |
| Collab connection | connected/disconnected/connecting/reconnecting | `PresenceIndicators.tsx:283-297` |
| AI generation | none — synchronous mutations | `AiTrpcClient.ts` |

## 9.6 Enums (values in source)

ContentType ×16 (`AIPromptLibrary.ts:7-23`) · Tone ×12 (`:25-37`) · LayoutStyle ×8 (`:39-47`) · ImageSize ×6 / ImageStyle ×7 / Language ×8 / CodeStyle ×4 (`:49-70`) · AIErrorCode ×9 (`AIErrors.ts:7-16`) · AiAdoptionEvent/Surface (`shared/schemas/ai-adoption.ts:22-33`) · EmailTemplate ×4 / Provider ×5 (`EmailService.ts:16,55`) · FontCategory ×5 (`GoogleFontsService.ts:33`) · StockSource ×3 / Orientation ×3 (`StockService.ts:23-25`) · Harmony ×4 (`ColorPalette.tsx:23`) · A11y severity ×3 (`AccessibilityChecker.tsx:27`) · Animation entrance 12/attention 8/exit 5, easings 7 (`AnimationEditor.tsx:24-66`)

## 9.7 Business rules

| Rule | Value | Source |
|---|---|---|
| AI client rate limit | 30 req / 60s sliding window | `AiTrpcClient.ts:17-18,62` |
| AI retry | max 2, 1s expo backoff; only 5xx/network/408/429 (mutations consume credits, non-idempotent) | `:16,36-53,309-320` |
| AI request queue | concurrency 3, priority-sorted | `:106,134` |
| AI timeout | 30s | `:14` |
| AICache | TTL 5min, 100 entries FIFO | `AICache.ts:16-18,42-52` |
| Adoption caps | commandIds 50, applied 1000, steps 100, durMs 3.6M | `ai-adoption.ts:31-39` |
| Media hydration | 200 assets initial | `BuildrikSyncProvider.ts:369` |
| Credit costs | none client-side — server/host only, editor displays `remaining` | `AIAssistantBar.tsx:24-47` |

## 9.8 Defects / stubs ledger (feeds master §13)

1. Image gen fake (picsum) — `openai.ts:150-157`
2. Streaming fake in facade — `openai.ts:256-276`
3. PageWizard simulated AI, inputs discarded — `PageWizard.tsx:89-135`
4. EmailService cloud providers throw (route `/api/email/send` unimplemented) — `EmailService.ts:340-349`
5. FormSubmissionService in-memory only — `FormSubmissionService.ts:99`
6. sidebarAnalytics no-op — `sidebarAnalytics.ts:4-6`
7. StockService stale "stub" docstring (it works) — `StockService.ts:4`
8. Animation triggers removed (engine ignores) + Timeline/ScrollTrigger L0 — `AnimationEditor.tsx:176-180`, `animation/index.ts:11`
9. Collab MOCK_USERS fallback — `PresenceIndicators.tsx:39-43`
10. L0 stubs: AIPageGenerator/AIContentPanel/AICodeEditor — `ai/index.ts:24-25`
11. EmailService custom template unescaped HTML (XSS if untrusted caller) — `EmailService.ts:151-157`
