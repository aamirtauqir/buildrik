# Audit 02: AI server side

Date: 2026-10-08 · HEAD `44f5db956` · read-only audit (nothing edited, staged or stashed)

## Scope read

- `server/trpc/routers/ai.ts` (457 lines). Also the AI procedures in `server/trpc/routers/media.ts` (`generateAltText`) and `server/trpc/routers/templates.ts` (`generate.create/status/cancel`).
- `server/services/ai.service.ts` (1392), `ai-actions.service.ts`, `ai-adoption.service.ts`, `ai-generation.service.ts`, `openai.client.ts`, `ollama.client.ts`, `alt-text.service.ts`, `quota.service.ts`, `types.ts`.
- `packages/shared/schemas/ai.ts`, `ai-adoption.ts`, `media.ts` (alt-text schema), `templates.ts` (`generateSiteSchema`).
- `packages/dashboard/app/api/workers/ai-generate/[jobId]/route.ts`, `app/api/cron/ai-job-cleanup/route.ts`, `app/onboarding/ai/*`, `lib/onboarding/ai-input.ts`, `lib/constants/plan-limits.ts`, `server/trpc/trpc.ts` (errorFormatter).
- Editor callers: `services/ai/AiTrpcClient.ts`, `sidebar/tabs/ai/hooks/runPromptOnce.ts`, `useAgentRunner.ts`, `useAiQuota.ts`, `useAutoMilestone.ts`, `useAISummary.ts`, `AltTextService.ts`, `useComposerInit.ts`.

## Env presence (booleans only, values not read)

| File | OPENAI_API_KEY | OLLAMA_BASE_URL | OLLAMA_MODEL | OLLAMA_TIMEOUT_MS | NEXT_PUBLIC_FEATURE_DS_AI | VITE_FEATURE_DS_AI | CRON_SECRET |
|---|---|---|---|---|---|---|---|
| `.env.local` (root) | yes, non-empty | yes, non-empty | yes | no | no | no | yes |
| `packages/dashboard/.env.local` | yes | yes | – | – | no | – | – |
| `.env.production.local` (both) | no | no | – | – | no | – | – |

What this means: in dev, `OLLAMA_BASE_URL` is set, so `resolveModelForUser` forces `"ollama"` for **streamPrompt / componentSchema only**. `content`, `page`, `layout`, `summarize`, `milestoneSuggest`, the onboarding worker and alt-text still call OpenAI directly (see F-07). Dev therefore runs two providers at the same time. DS-AI is off in every env file, so `ai.componentSchema` cannot be reached.

## Tests run

`npx vitest run` filtered by name (19 files: ai-router, ai.service, ai.styleCommands, ai-actions, ai-adoption(+summary), ai-generation-dispatch, ai-summary-transport, templates-generate-role, ai-generate-page-prompt, ai-generate-worker, cron-ai-job-cleanup, onboarding-ai-input, template-ai-*, quota.service(+atomic), site-quota, alt-text.service).

- Run 1: **19 files passed, 200 passed / 3 skipped**.
- Runs 2–3: `__tests__/template-ai-service.test.ts` failed 2 tests. "listTemplates" timed out at the 15s default because the cold dynamic import was slow, and "useTemplate" then failed on a cascading `Cannot access '__vite_ssr_import_4__' before initialization`. With `--testTimeout=60000` all 7 pass. The test is **flaky because of timing**, not an AI bug.
- The 3 skips are `template-ai-components.test.ts` (TONE/CONTENT/IMAGE_OPTIONS, "internal — see 77ea14e4").
- Gaps the suites do not cover: the P2002 first-call race (F-10), unlimited-plan upsert race, alt-text quota (none exists), worker page-type mapping (F-03), friendlyError string matching (F-15).

## Procedure inventory and client callers

| Procedure | Input schema | Auth | Quota reserve/refund | Provider/model | Client callers | Status |
|---|---|---|---|---|---|---|
| `ai.content` | inline `contentInputSchema` ai.ts:56 | protected (session, no site check) | reserve ai.ts:177 / refund :181 | OpenAI direct, `DEFAULT_MODEL` | `AiTrpcClient.generateContent` ← `shared/utils/openai.ts:91` ← `SeoTab.tsx:12` | live |
| `ai.page` | inline ai.ts:67 | protected | yes | OpenAI direct | **none** | **orphaned** (worker calls `generatePage` directly) |
| `ai.layout` | inline ai.ts:76 | protected | yes | OpenAI direct | **none** | **orphaned** |
| `ai.summarize` | inline ai.ts:81 | protected | yes | OpenAI direct | `AiTrpcClient.summarize` ← `useAISummary.ts:113` | live |
| `ai.milestoneSuggest` | inline ai.ts:105 | protected | yes | OpenAI direct | `AiTrpcClient.suggestMilestone` ← `useAutoMilestone.ts:259` (automatic) | live |
| `ai.quota` | none, output `aiQuotaSchema` | protected | read | – | `useAiQuota.ts:19`, `GenerateBlockScreen` | live |
| `ai.streamPrompt` | inline ai.ts:158 | protected | assertProviderConfigured → reserve → refund on error | `getProvider(resolveModelForUser)` | `runPromptOnce.ts:117` ← `useAgentRunner.ts:206,282` (intent `style-command` / `plan` only) | live; **`intent:"text"` has no caller** |
| `ai.componentSchema` | inline ai.ts:168 | protected | yes | `getProvider` | `useComposerInit.ts:191` (behind `dsAi` flag, which is off everywhere, `as any` cast) | unreachable today |
| `ai.logAdoption` | shared `aiAdoptionInputSchema` | protected + membership check in service | – | – | `adoptionTracker.ts:25` | live |
| `media.generateAltText` | shared `generateAltTextSchema` | protected + owner + `assertMediaWrite` | **none** | OpenAI direct, `DEFAULT_MODEL` | `AltTextService.ts:48` ← `useAltTextAutoTrigger.ts:54` (every upload), `MediaTab.tsx:190` (regenerate) | live |
| `templates.generate.create/status/cancel` | shared `generateSiteSchema`; inline `{jobId}` | protected + EDITOR role (create), workspace-scoped | monthly `aiGenerations` count + 3/hour; **no refund on failure** | OpenAI direct in worker | `onboarding/ai/generating/page.tsx:40-42`, `dashboard/sites/new/page.tsx:51-84` | live |

No client call targets a procedure that does not exist. Every `.ai.*` reference in the editor and dashboard resolves to a real procedure.

---

## Findings

No P0 is confirmed. Several P1s are cost exposure or broken product output.

### P1

**F-01 · Alt-text runs paid vision calls with no quota or rate limit (cost abuse).**
- Evidence: `server/trpc/routers/media.ts:311-327` calls `applyAltTextToAsset` with no `reserveQuota` or rate limiter. `alt-text.service.ts:150` calls OpenAI every time unless alt text already exists, and `force:true` (`media.ts:315`, schema `packages/shared/schemas/media.ts:122-126`) skips even that check. The editor fires it automatically on every image upload (`useAltTextAutoTrigger.ts:54`) and on Regenerate (`MediaTab.tsx:190`).
- Root cause: alt-text moved from Anthropic to OpenAI without joining the quota system that every `ai.*` call uses.
- Expected: one AI unit reserved per call, released on failure. At least a per-user per-minute limiter for `force`.
- Fix: in the router, `reserveQuota(userId, DEFAULT_MODEL)` before `applyAltTextToAsset` and `releaseQuota` in the catch. Reuse `reserveAiUnit`/`safeReleaseQuota` from ai.ts by moving them to quota.service. If uploads must stay free, cap auto-trigger separately.

**F-02 · Raw provider errors (message plus enumerable fields) reach the client from `media.generateAltText`.**
- Evidence: `alt-text.service.ts:66-69` says provider errors are "re-raised as-is for tRPC translation". `media.ts:316-326` only maps ASSET_NOT_FOUND / NOT_IMAGE, and `rethrowPermission` (`media.ts:50-56`) re-throws everything else raw. tRPC wraps it as INTERNAL_SERVER_ERROR and keeps the original message. `server/trpc/trpc.ts:71-79,88-90` then lifts **every enumerable own field of `error.cause`** into `data.cause`. For an OpenAI `APIError` those fields are `status`, `headers`, `request_id`, `error`, `code`, `param` and `type`. The 401 message includes the masked key suffix ("Incorrect API key provided: sk-…abcd").
- This conflicts with the S-8 rule that the ai router follows ("never echo provider raw error text", ai.ts:261).
- UNVERIFIED: the exact field set reaching the browser was not observed live.
- Fix: in `generateAltText` (`media.ts`), catch non-domain errors, log them, and throw `TRPCError({code:"INTERNAL_SERVER_ERROR", message:"Alt text generation failed"})`. Map 429 to TOO_MANY_REQUESTS and "not configured" to PRECONDITION_FAILED.

**F-03 · AI onboarding builds every page as the same 8-section "landing" page.**
- Evidence: the wizard sends page names `["Home", "About", "Services", "Contact"]` (`lib/onboarding/ai-input.ts:94`, `onboarding/ai/goal/page.tsx:22,32`). The worker's `asPageType` (`app/api/workers/ai-generate/[jobId]/route.ts:31-37`) only knows landing/portfolio/product/pricing/blog, so **every** name falls back to `"landing"`. `generatePage` (`ai.service.ts:207-239`) then emits nav, hero, logoBar, features, testimonials, pricing, cta and footer for About and Contact as well.
- The page name never reaches the prompt: the user message is `Generate a ${sectionType} section for: ${input.description}` (ai.service.ts:230), with the same description on every page.
- Result: N near-identical pages, and roughly 8×N sequential OpenAI calls (32 for the default 4 pages).
- Expected: each page's sections and copy match its purpose (About, Contact and so on).
- Fix: add page-type mappings for the wizard's `SUGGESTED_PAGES` (about, services, contact and others) to `PAGE_SECTION_ORDER`, and pass the page name into the prompt.

**F-04 · Generated sections are styled only with Tailwind classes, and no Tailwind CSS ships to the canvas or the published site (UNVERIFIED live).**
- Evidence: the prompts demand "Return ONLY valid HTML with inline Tailwind CSS classes" (`ai.service.ts:221`, `:256`, `:293-302`). A grep for tailwind in `packages/editor/src/engine` (export) and `server/services/publish*` finds nothing. The export only links `styles.css` and Google Fonts (`ExportEngine.ts:634,974`, `ExportHelpers.ts:193`). Editor chrome uses the prefixed `tw:` build, which unprefixed classes like `bg-blue-600` cannot match.
- Expected: generated markup renders styled.
- Fix (choose one): (a) ask the model for inline `style=""` / scoped CSS that the sanitizer allows, or (b) compile the used Tailwind classes into the page CSS at worker time. Verify in the live canvas and in a published page.

**F-05 · A failed AI generation still uses up the monthly plan slot (FREE gets 3 per month).**
- Evidence: `ai-generation.service.ts:23-26` counts every job with `status != CANCELLED`, which includes FAILED. A missing key, a provider 5xx or a worker timeout therefore uses a slot. The 3-per-hour throttle (`:30-37`) counts FAILED jobs too.
- Expected: only COMPLETED (or in-flight) jobs count against the monthly limit.
- Fix: count `status: { notIn: ["CANCELLED","FAILED"] }`, or add a `refunded` flag set on failure.

**F-06 · A long generation can be marked FAILED while the worker is still running, and it then later flips to COMPLETED (UNVERIFIED timing).**
- Evidence: `dispatchAIWorker` (`ai-generation.service.ts:100-113`) `await`s the worker POST. The worker sends no response headers until all pages are generated (`route.ts:136-224`). Node's built-in fetch (undici) has a 300s default `headersTimeout`. F-03 makes about 32 sequential calls, and the OpenAI client has no timeout and 2 retries (F-08), so 300s is reachable.
- When the timeout fires, the fetch throws and the catch sets `FAILED "Nothing answered the request"` (`:111-123`). The onboarding page latches on FAILED (`generating/page.tsx:83-85`). The worker carries on, and its final update `status: {not:"CANCELLED"}` (`route.ts:216-219`) overwrites FAILED with COMPLETED. The user is left with a site they were told failed. It uses a site slot, and a retry creates a second one.
- Fix: have the worker answer `202` immediately after the claim and continue in the background. At minimum, make the COMPLETED flip conditional on `status: {in: GENERATING_*}` so a FAILED job is never resurrected. Run the page loop with bounded concurrency.

### P2

**F-07 · Model and provider resolution is split, and the quota bookkeeping lies about the model.**
- `content`, `page`, `layout`, `summarize` and `milestoneSuggest` reserve quota with `resolveModelForUser` (ai.ts:46), which returns `"ollama"` in dev. The services then ignore it and call `getOpenAI()` with the hard-coded `MODEL = DEFAULT_MODEL` (`ai.service.ts:10,183,224,259,376,426`).
- Effects: `AIUsage.model` records the wrong model, tier-based model choice is ignored, and these five bypass the `getProvider` abstraction. They are also a semantic duplicate of `OpenAIProvider.generate` (`openai.client.ts:48-54`).
- The onboarding exemption is intentional (ai.service.ts:3-9), but it is applied to the in-editor procedures too.
- Fix: route these through `getProvider(model).generate` with a system-prompt parameter, and pass the resolved model.

**F-08 · No timeouts and no real abort on OpenAI calls.**
- `getOpenAI()` (`openai.client.ts:18`) uses SDK defaults (10 min timeout, 2 retries). One hung call can hold a subscription, a mutation or a worker for about 30 min.
- `OpenAIProvider.stream` / `OllamaProvider.stream` never pass `signal` to `chat.completions.create` (openai.client.ts:32-36, ollama.client.ts:43-47). They only check `signal.aborted` between chunks, so an unsubscribe does not cancel the upstream request.
- Fix: `new OpenAI({ timeout: 60_000, maxRetries: 1 })`, pass `{ signal }` as the request option, and use a longer timeout only in the worker.

**F-09 · `OLLAMA_TIMEOUT_MS` is not validated, and Ollama env is read at module load.**
- `Number("abc")` gives NaN, which goes straight into the SDK timeout (`ollama.client.ts:21`).
- `OLLAMA_MODEL` is read once at import (`:13`). Not I/O, but it diverges from the lazy-init intent.
- Default model tag `"qwen3.5"`: UNVERIFIED as a real Ollama tag.
- Fix: parse with a fallback, and read env inside `getOllamaClient`.

**F-10 · Quota races and wrong numbers in `reserveQuota` (`quota.service.ts`).**
- (a) First call of the day under concurrency: both `updateMany`s miss, one `create` wins, and the loser hits P2002 and returns `ok:false` (`:108-114`) although count=1 < limit. The legitimate request is told "Daily limit reached".
  - Fix: on P2002, retry the conditional `updateMany` once.
- (b) The unlimited path's `upsert` (`:85-89`) is not atomic in Prisma. A concurrent first call can throw a raw P2002, which `reserveAiUnit` does not catch, so a raw DB error goes to the client.
- (c) `used: limit` is returned on a successful bump (`:99`), which is a wrong value. It is harmless today because only `ok` is read.
- (d) `releaseQuota` refunds *today's* bucket (`:123-129`). A reserve at 23:59 with a release after midnight refunds the wrong day.
- (e) The plan is taken from the user's **oldest ACTIVE membership** (`:48-55`), not from the workspace of the site being edited. A collaborator on a PRO workspace whose first workspace is FREE gets 10 per day.

**F-11 · Silent canned fallbacks, still charged to quota.**
- `suggestMilestone` returns `{suggestedName:"Update", reasoning:"Could not generate…"}` on any JSON parse failure (`ai.service.ts:451-457`) and keeps the quota unit. It is auto-triggered (`useAutoMilestone.ts`), so FREE users lose daily units without asking for anything.
- `parseCommandArray` / `extractValidPlan` return `[]` on unparseable output with no log (`:928-944`, `:1336-1347`). The router reports "No applicable change" and keeps the unit (ai.ts:386-388). Model malformation is invisible in logs.
- `generatePage` stores `""` sections when `content` is null (`:237-238`).
- `milestoneSuggest` parses with `as {…}` and no zod.
- Fix: log raw output on parse failure, and refund when zero valid commands came from an unparseable response. Use `response_format: {type:"json_object"}` / structured outputs for milestone, plan and commands (OpenAI path).

**F-12 · The `summarize` input schema rejects large diffs that the service would truncate anyway.**
- `changes.max(200)`, `before/after .max(2000)` and `property .max(100)` (ai.ts:92-101), but `summarizeChanges` only uses `slice(0,5)` (`ai.service.ts:366`).
- The editor sends the full `compareResults` untruncated (`useAISummary.ts:113`), so summaries for big versions fail with BAD_REQUEST and show "AI summary unavailable".
- Fix: truncate client-side, or accept and slice server-side.

**F-13 · The edit-command validator duplicates and weakens the shared URL guard.**
- `UNSAFE_HREF = /^\s*(javascript|data|vbscript):/i` (`ai.service.ts:640`) can be bypassed with `"java\tscript:"`. `packages/shared/schemas/element-markup.ts:70-74` `isDangerousUrl` exists for exactly this.
- The allow-lists are self-described as duplicated with the editor (`:546-551`, `:586-589`), which goes against the SSOT rule.
- `isValidEditCommand` passes the model's object through unchanged, so extra keys in `args` survive to the client.
- Mitigation that exists: `sanitizeBlocks` at the save boundary, plus editor re-validation.
- Fix: use `isDangerousUrl` for href and src, and rebuild each command from validated fields.

**F-14 · `PAGE_SECTION_ORDER` contains duplicate and out-of-order sections.**
- portfolio has `footer` twice, with `logoBar` after the first footer (`ai.service.ts:88-97`).
- blog has `cta` twice (`:118-127`).
- pricing puts `logoBar` after `cta` (`:108-117`).
- Fix: dedupe and keep footer last.

**F-15 · Missing-key handling is inconsistent, and the onboarding friendly-message match is broken.**
- Only `streamPrompt` maps to `PRECONDITION_FAILED` (ai.ts:319-327).
- `content`, `layout`, `summarize`, `milestoneSuggest` and `componentSchema` hit the SDK's own "OPENAI_API_KEY missing" throw inside `getOpenAI()` and return a generic INTERNAL_SERVER_ERROR. The quota refund works.
- `generateComponentSchema` skips `assertProviderConfigured`.
- The worker stores `err.message` raw in `job.error` (`route.ts:230-235`), and the UI shows it. That message can be provider text.
- `friendlyError` (`onboarding/ai/generating/page.tsx:19`) matches `"OPENAI_API_KEY"` or `"credentials"`, but `assertProviderConfigured` now throws "AI is not configured: no OpenAI API key on the server." (`ai.service.ts:489`). The friendly copy never shows.
- Fix: one domain error (`AiNotConfiguredError`) translated once. Store a fixed user string in `job.error` and log the raw one.

**F-16 · No burst rate limiting on any AI procedure.**
- Only the daily quota applies. BUSINESS is unlimited (`plan-limits.ts:77`), so there is no throttle at all.
- `createRateLimitedProcedure` exists (`trpc.ts:150`) but is public/IP-keyed and unused here.
- Fix: a per-user per-minute limiter on `ai.*` and `media.generateAltText`.

**F-17 · The model id is hard-coded, and its current availability is UNVERIFIED.**
- `"gpt-4o-mini"` is fixed in `packages/shared/schemas/ai.ts:17,26` and in all three `PLAN_MODELS` tiers (`lib/constants/plan-limits.ts:115-127`).
- It is a real OpenAI id, but an older generation. If OpenAI retires it, every AI path breaks, and fixing that needs a code deploy.
- Fix: an `OPENAI_MODEL` env override (documented in the CLAUDE.md env table) and a smoke check in `check-prod-env.mjs`.

**F-18 · Dead code and dead inputs.**
- `ai.page` and `ai.layout` have no client callers.
- `streamPrompt` `intent:"text"` (the default) is never sent. The client sends `plan` or `style-command` only. The text branch (ai.ts:397-408, raw prompt, no system prompt) is reachable only by fallthrough: a page-scope `style-command` with `elements: []`, or `plan` with element scope. That fallthrough spends a unit on an unconstrained chat reply the editor then ignores.
- `isOpenAIConfigured` (`openai.client.ts:22`), `isOllamaConfigured` (`ollama.client.ts:15`) and `getAiAdoptionSummary` (`ai-adoption.service.ts:54`) have no production callers. `assertProviderConfigured` re-implements the first two.
- `generateSiteSchema.content` is stored in job metadata (`ai-generation.service.ts:45`) and never read by the worker.
- `openai` is listed in `packages/editor/package.json` but nothing in the editor imports it.
- Fix: delete, or reject a fallthrough intent/scope combination with BAD_REQUEST.

**F-19 · Convention violations against CLAUDE.md and AGENTS.md.**
- `ai.ts:17,23,26` imports `../../services/...` (banned `../../`).
- The worker route uses Prisma directly (`route.ts:96-235`), skipping the service layer.
- Stale docs: `media.ts:305` says "via Claude Haiku vision", and `alt-text.service.ts:153` says "waiting on Anthropic".
- `useComposerInit.ts:191` uses an `as any` cast.
- `ai.service.ts` does six jobs in one file: content, page, history, provider, commands and plan.

**F-20 · `CRON_SECRET` missing leaves jobs stuck in QUEUED forever (dev and misconfigured deploys).**
- `checkWorkerAuth` returns **500** when `CRON_SECRET` is unset (`lib/cron-auth.ts:41-45`).
- `dispatchAIWorker` treats only 401 and 404 as "unclaimed" (`ai-generation.service.ts:105`). Its comment claims a missing secret yields 401.
- The reaper cron needs the same secret, so the job never leaves QUEUED.
- Fix: treat 500 with the body "CRON_SECRET is not configured" as unclaimed, or check `process.env.CRON_SECRET` before dispatching.

**F-21 · AI is not gated on site role.**
- `ai.*` procedures take no siteId. Any signed-in user, including a VIEWER or someone with no workspace (who falls back to FREE), gets 10 per day.
- Edits only apply client-side and saving is role-checked, so this is cost exposure only.
- Fix: optional siteId plus `checkSiteRole(…, "EDITOR")`.

**F-22 · Prompt-injection surface is low risk.**
- User text is wrapped in `<request>` (ai.service.ts:924-925, 1246-1247), but a literal `</request>` is not escaped.
- Page element text and token names are interpolated raw.
- Output is allow-list validated, and these are the caller's own data, so the impact is low.

### Things verified OK

- Lazy init: OpenAI and Ollama clients use getter singletons (`openai.client.ts:16-20`, `ollama.client.ts:23-35`). No module-level SDK construction.
- The ai router always refunds on provider error and masks the message (`safeReleaseQuota`, ai.ts:34-40). `streamPrompt` refunds only when nothing was delivered.
- The `streamPrompt` provider-not-configured check runs before the reservation.
- Edit commands: exact-id or page-id scope guard, CSS property allow-list, `url()/expression()/data:` value guard, `<>` text guard, token-type value validation, and asset-URL recall in place of free URLs. Covered by 70 tests in `ai.styleCommands.test.ts`.
- `templates.generate.*` is workspace-scoped (IDOR-safe `getJobStatus`/`cancelJob`), EDITOR-gated on create, and validates the regenerate `siteId` ownership.
- The worker sanitizes model HTML with `sanitizeBlocks`, writes pages atomically, makes ids unique, and is cancel-aware.
- `logAdoption` verifies membership and accepts structural fields only.
- `ai-actions.service` re-checks the site role at execute (the token is not a role grant).

## Suggested fix order

1. F-01 + F-02: put alt-text under quota and mask its errors (small change, closes the cost and leak).
2. F-05 + F-06: refund failed generations and decouple the worker response from the generation time.
3. F-03 + F-04: page-type mapping and a styling strategy for AI-generated sections. Verify in the live canvas and a published site.
4. F-08: client timeouts and abort.
5. F-10a and F-11 logging/refund, then the P2 cleanups.

## Not verified

- No live calls were made to OpenAI or Ollama. Model availability (F-17) and the Ollama tag (F-09) are unverified.
- F-04 (unstyled output) is inferred from code. It was not checked in the canvas or in a published page.
- F-06 timing is inferred from undici defaults and the call count. It was not reproduced.
- The exact `data.cause` payload for an OpenAI error (F-02) was not observed in a browser.
- Whether cPanel actually schedules `/api/cron/ai-job-cleanup` was not checked.
