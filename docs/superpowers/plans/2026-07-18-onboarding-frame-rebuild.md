# M2 Onboarding Frame-Parity Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all 24 onboarding gallery frames 1:1 and add the 13 missing state frames (validation/error/loading/empty) on the existing wizard engine, without rewriting the proven plumbing.

**Architecture:** Keep `WizardShell` + `WizardContext` + `onb-*` primitives + tRPC mutations untouched. Re-author each step page's content to match its gallery frame and add missing states as inline component/mutation state (never new routes). Every state uses existing primitives + `--color-onb-*` tokens.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, tRPC 11, Zod, Playwright (e2e), `@buildrik/shared/schemas/onboarding`.

## Global Constraints

Every task's requirements implicitly include these (verbatim from the spec):

- **Accent stays `#2563EB`** (`--color-onb-primary`) — DESIGN.md onboarding scoped exception. Never spread cobalt `#2D6DFF` into onboarding. `.onb-scope` re-points the focus ring.
- **Engine is not rewritten:** `WizardShell`, `WizardContext` (incl. the `saveAndGo` `dataRef` stable-identity fix), `onb-button/field/card/chips/select/back`, `wizard-boot`, `use-onboarding-complete`, and all tRPC mutations are reused as-is.
- **Do not touch** the login→onboarding seam (auth callback `window.location.assign`), the AI image-src rewrite, or server-truth wizard state (`OnboardingState.wizardData`; localStorage is a write-buffer only).
- **No new routes for states** — validation/error/loading/empty are inline states of the step that owns them.
- **Primitives only** — every new state renders through the existing `onb-*` components; no one-off hex or bespoke markup in a frame.
- **Brand text is "Buildrick"** (user-facing). Identifiers `@buildrik/*`, `hideBuildrik`, `BuildrikSync` stay as-is.
- **Pixel source:** the served gallery `http://127.0.0.1:8787/Buildrik%20Onboarding%20(2).html` — read the exact frame before rebuilding each page.
- **Commit per task**, live-verify each rebuilt page against its frame before moving on. No deploy until the user approves the whole rebuild.

## File Structure

Pages rebuilt (content only; routes unchanged):

- `app/onboarding/workspace/page.tsx` — Workspace + 5 states
- `app/onboarding/site/page.tsx` — Project setup / My business / Existing client + 2 states
- `app/onboarding/path/page.tsx` — Path chooser + hover
- `app/onboarding/ai/{basics,goal,brand,generating,preview}/page.tsx` — AI flow
- `app/onboarding/template/{page,preview,selected}.tsx` — Template flow + no-results
- `app/onboarding/blank/page.tsx`, `app/onboarding/ready/page.tsx`

Shared helpers added (small, primitive-level, reused across states):

- `components/onboarding/wizard/onb-banner.tsx` — inline retry/error banner (network errors)
- `components/onboarding/wizard/onb-empty.tsx` — empty-state block (template no-results)

Tests:

- `packages/dashboard/e2e/onboarding.setup.ts` — seed the fixture user's `OnboardingState` incomplete so login lands in the wizard
- `packages/dashboard/e2e/onboarding.spec.ts` — per-flow walkthroughs + state assertions

Not modified: `wizard-shell.tsx`, `wizard-context.tsx`, `wizard-boot.tsx`, `use-onboarding-complete.ts`, the `onb-*` primitives, `app/onboarding/layout.tsx`, `app/onboarding/page.tsx`, any router/service/schema file (unless a validation gap is found — see Task 1).

---

### Task 0: Groundwork — gallery reference + wizard-entry fixture

**Files:**
- Create: `packages/dashboard/e2e/onboarding.setup.ts`
- Test: (this task's deliverable is the setup + a smoke assertion)

**Interfaces:**
- Consumes: the magic-link auth pattern from `e2e/auth.setup.ts`; `PrismaClient`; `OnboardingState` model.
- Produces: `e2e/.auth/onboarding.json` storage state whose user is authenticated AND has `OnboardingState.completed = false` (or wizard incomplete), so navigating `/` lands in `/onboarding`.

- [ ] **Step 1: Confirm the gallery renders and enumerate frame anchors**

Run:
```bash
cd ~/Downloads && (python3 -m http.server 8787 --bind 127.0.0.1 &) ; sleep 1
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8787/Buildrik%20Onboarding%20(2).html"
```
Expected: `200`. Open it in the authed Chrome; click each Contents chip; note the 24 frame anchors. This is the reference for every later task.

- [ ] **Step 2: Write the onboarding-entry setup (mint magic link + force wizard-incomplete)**

```ts
// packages/dashboard/e2e/onboarding.setup.ts
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const AUTH_FILE = path.resolve(__dirname, ".auth/onboarding.json");
const EMAIL = process.env.PW_ONB_EMAIL ?? "qa@buildrik.local";

setup("authenticate into an incomplete wizard", async ({ page }) => {
  const prisma = new PrismaClient();
  let token: string;
  try {
    const user = await prisma.user.findFirst({ where: { email: EMAIL }, select: { id: true } });
    if (!user) throw new Error(`No user "${EMAIL}"`);
    // Reset onboarding so the wizard shows.
    await prisma.onboardingState.upsert({
      where: { userId: user.id },
      update: { completed: false, wizardData: {} },
      create: { userId: user.id, completed: false, wizardData: {} },
    });
    token = randomUUID();
    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token: createHash("sha256").update(token).digest("hex"),
        type: "magic_link",
        expires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
  await page.goto(`/auth/callback?token=${token}`);
  await page.waitForURL(/\/onboarding/, { timeout: 90_000 });
  await expect(page.getByText(/Buildrick/i).first()).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
```

Note: confirm the `OnboardingState` model + field names (`completed`, `wizardData`) against `prisma/schema.prisma` before running; adjust the upsert to the real columns.

- [ ] **Step 3: Wire a `setup-onboarding` project in `playwright.config.ts` and an onboarding storageState**

Add a `setup-onboarding` project (testMatch `/onboarding\.setup\.ts/`) and make onboarding specs depend on it + use `e2e/.auth/onboarding.json`. Mirror the existing `setup` project shape.

- [ ] **Step 4: Run the setup**

Run: `PW_NO_SERVER=1 npx playwright test --project=setup-onboarding`
Expected: PASS — lands on `/onboarding`, saves storage state.

- [ ] **Step 5: Commit**

```bash
git add packages/dashboard/e2e/onboarding.setup.ts packages/dashboard/playwright.config.ts
git commit -m "test(onboarding): e2e fixture that lands an authed user in the wizard"
```

---

### Task 1: Workspace step + 5 states

**Files:**
- Modify: `app/onboarding/workspace/page.tsx`
- Create: `components/onboarding/wizard/onb-banner.tsx`
- Test: `packages/dashboard/e2e/onboarding.spec.ts` (workspace block)

**Interfaces:**
- Consumes: `useWizard()` (`data`, `update`, `saveAndGo`, `saving`); `trpc.account.workspace.update`; the onboarding zod schema; `OnbField`, `OnbButton`, `OnbCard` primitives; `WizardShell`.
- Produces: `OnbBanner({ message, onRetry, retrying })` used by every error state hereafter.

- [ ] **Step 1: Read the 6 workspace frames**

Open in the served gallery and record exact copy + layout: **Workspace** (base), **Empty name**, **Name exists**, **Name too long**, **Network error**, **Loading**. Note the field label, placeholder, helper copy, the error message text per state, and the CTA label/spinner.

- [ ] **Step 2: Write the failing e2e for the happy workspace + empty-name state**

```ts
// packages/dashboard/e2e/onboarding.spec.ts
import { test, expect } from "@playwright/test";

test.describe("onboarding · workspace", () => {
  test("empty name blocks + shows inline error", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await page.getByRole("button", { name: /continue|next/i }).click();
    await expect(page.getByText(/enter a (workspace )?name|name is required/i)).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding\/workspace/); // did not advance
  });

  test("valid name advances to path", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await page.getByRole("textbox").first().fill("Acme Studio");
    await page.getByRole("button", { name: /continue|next/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/path/);
  });
});
```

- [ ] **Step 3: Run it — verify it fails**

Run: `PW_NO_SERVER=1 npx playwright test onboarding.spec.ts -g "workspace"`
Expected: FAIL (current copy/behavior differs, or the error text isn't shown).

- [ ] **Step 4: Build `OnbBanner` (the shared error/retry primitive)**

```tsx
// components/onboarding/wizard/onb-banner.tsx
"use client";
export function OnbBanner({ message, onRetry, retrying }: { message: string; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-onb border border-onb-error/40 bg-onb-error/5 px-4 py-3">
      <span className="text-[13px] text-onb-error">{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} disabled={retrying}
          className="text-[13px] font-semibold text-onb-primary disabled:opacity-50">
          {retrying ? "Retrying…" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}
```
(Confirm `--color-onb-error` / `border-onb-error` token names exist in `globals.css`; if the token is `--color-onb-error`, the Tailwind class is `text-onb-error` — verify and match.)

- [ ] **Step 5: Rebuild `workspace/page.tsx` content to the frame + wire the 5 states**

Match the **Workspace** frame layout using `WizardShell` (stepper step 1) + `OnbCard` + `OnbField` + `OnbButton`. State logic (concrete):

```tsx
const { data, update, saveAndGo, saving } = useWizard();
const [touched, setTouched] = useState(false);
const name = data.workspaceName ?? "";
const trimmed = name.trim();
// client validation (Empty name / Name too long frames):
const clientError =
  touched && trimmed.length === 0 ? "Enter a workspace name" :
  trimmed.length > 40 ? "Keep it under 40 characters" : null;

const wsUpdate = trpc.account.workspace.update.useMutation();
const [serverError, setServerError] = useState<string | null>(null);

async function onContinue() {
  setTouched(true);
  if (trimmed.length === 0 || trimmed.length > 40) return;   // Empty / too-long
  setServerError(null);
  try {
    await wsUpdate.mutateAsync({ name: trimmed });           // may throw uniqueness → "Name exists"
    await saveAndGo("/onboarding/path", { workspaceName: trimmed });
  } catch (e) {
    // "Name exists" vs generic Network error — branch on the domain error code:
    setServerError(isNameTakenError(e) ? "That workspace name is taken" : "Something went wrong. Check your connection.");
  }
}
```
Render `OnbField` with `error={clientError}`; below the field render `serverError && (isNetwork ? <OnbBanner message={serverError} onRetry={onContinue} retrying={wsUpdate.isPending} /> : <inline error>)`. The **Loading** frame = `wsUpdate.isPending || saving` → `OnbButton` spinner + disabled. Match each state's exact copy from Step 1.

Add a small helper (same file or `lib`): `isNameTakenError(e)` inspects the tRPC error shape/code; `isNetwork` when there's no domain code. If `account.workspace.update` doesn't surface a uniqueness error today, that's a real gap — add the uniqueness check to the service and a `WORKSPACE_NAME_TAKEN` domain error (separate commit, note it in the task).

- [ ] **Step 6: Run the e2e — verify pass; live-verify vs frames**

Run: `PW_NO_SERVER=1 npx playwright test onboarding.spec.ts -g "workspace"` → PASS.
Then open `/onboarding/workspace` in the authed browser and compare each state (submit empty; type >40 chars; submit a taken name; observe loading) against the gallery frames.

- [ ] **Step 7: Commit**

```bash
git add app/onboarding/workspace/page.tsx components/onboarding/wizard/onb-banner.tsx packages/dashboard/e2e/onboarding.spec.ts
git commit -m "feat(onboarding): rebuild Workspace frame + empty/exists/too-long/network/loading states"
```

---

### Task 2: Site step (Project setup / My business / Existing client) + 2 states

**Files:**
- Modify: `app/onboarding/site/page.tsx`
- Test: `packages/dashboard/e2e/onboarding.spec.ts` (site block)

**Interfaces:**
- Consumes: `useWizard()`; `trpc.sites.create`; `trpc.clients.create` + `clients.assignSite` + `clients.list` (the "Existing client" branch); `OnbField`, `OnbSelect`, `OnbChips`, `OnbButton`, `OnbBanner` (from Task 1).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Read the 5 site frames** — **Project setup**, **My business**, **Existing client**, **Email error**, **Focused error**. Determine whether My-business / Existing-client is a toggle within one screen or a branch; record the toggle control, the client-select, the email field, and the exact error/focused copy.

- [ ] **Step 2: Write the failing e2e (email validation + branch toggle)**

```ts
test.describe("onboarding · site", () => {
  test("invalid client email shows field error", async ({ page }) => {
    await page.goto("/onboarding/site");
    await page.getByRole("button", { name: /existing client|for a client/i }).click();
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByRole("button", { name: /continue|next|create/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
```

- [ ] **Step 3: Run — verify fail.** `... -g "site"` → FAIL.

- [ ] **Step 4: Rebuild `site/page.tsx` to the frames + states**

Match **Project setup** with `WizardShell` (stepper step 2). Toggle between **My business** and **Existing client** with `OnbChips`/segmented control (per the frame). Concrete email validation for the client branch:

```tsx
const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail.trim());
const emailError = emailTouched && !emailValid ? "Enter a valid email" : null; // Email error frame
// Focused error frame = the same error rendered while the field is focused; drive via onBlur/onFocus + emailTouched.
```
"Existing client" uses `clients.list` to populate an `OnbSelect` (or `clients.create` for a new one, then `sites.create` + `assignSite`). "My business" uses `sites.create` directly. On success → `saveAndGo("/onboarding/path", ...)` (or whatever the frame's next arrow points to — confirm from the gallery). Wrap network failures in `OnbBanner` with retry.

- [ ] **Step 5: Run e2e → PASS; live-verify each state vs frames.**

- [ ] **Step 6: Commit**

```bash
git add app/onboarding/site/page.tsx packages/dashboard/e2e/onboarding.spec.ts
git commit -m "feat(onboarding): rebuild Project-setup / My-business / Existing-client frames + email/focused states"
```

---

### Task 3: Path chooser + hover-template state

**Files:**
- Modify: `app/onboarding/path/page.tsx`
- Test: `onboarding.spec.ts` (path block)

**Interfaces:** Consumes `useWizard()`, `saveAndGo`, `OnbCard`, `WizardShell`. Produces nothing new.

- [ ] **Step 1: Read the 2 frames** — **Path chooser** (3 option cards: AI / Template / Blank), **Hover template** (the template card's hover treatment). Record the card copy, icons, and the hover border/shadow delta.

- [ ] **Step 2: Write the failing e2e**

```ts
test("path chooser routes to each flow", async ({ page }) => {
  await page.goto("/onboarding/path");
  await page.getByRole("button", { name: /template/i }).click();
  await expect(page).toHaveURL(/\/onboarding\/template/);
});
```

- [ ] **Step 3: Run — fail.**

- [ ] **Step 4: Rebuild `path/page.tsx`** — 3 `OnbCard` options, each `saveAndGo` to its flow (`/onboarding/ai/basics`, `/onboarding/template`, `/onboarding/blank`). Add the hover state via Tailwind `hover:` classes matching the **Hover template** frame (border/shadow), reduced-motion safe.

- [ ] **Step 5: Run e2e → PASS; live-verify hover vs frame.**

- [ ] **Step 6: Commit** — `feat(onboarding): rebuild Path-chooser + hover-template state`.

---

### Task 4: AI flow (5 frames)

**Files:**
- Modify: `app/onboarding/ai/{basics,goal,brand,generating,preview}/page.tsx`
- Test: `onboarding.spec.ts` (ai block)

**Interfaces:** Consumes `useWizard()`; `trpc.templates.generate.create/status/cancel` (the generation job); `OnbField/OnbChips/OnbSelect/OnbButton/OnbBanner`; `GenerationProgress` (existing). Produces nothing new. **Preserve** the existing generating→poll→preview logic and the `saveAndGo` `dataRef` pattern — do NOT reintroduce a `data`-closured callback (the documented loop bug).

- [ ] **Step 1: Read the 5 frames** — **Business basics**, **Goal & audience**, **Brand style**, **Generating** (loading), **Draft ready**. Record fields/chips per step and the generating + draft-ready layouts.

- [ ] **Step 2: Write the failing e2e (AI happy path, generation mocked/short)**

```ts
test("AI flow: basics → goal → brand → generating → draft ready", async ({ page }) => {
  await page.goto("/onboarding/ai/basics");
  await page.getByRole("textbox").first().fill("A bakery in Lahore");
  await page.getByRole("button", { name: /continue|next/i }).click();
  await expect(page).toHaveURL(/\/onboarding\/ai\/goal/);
  // ...advance goal + brand, then assert generating spinner, then draft-ready preview appears.
});
```
(If generation calls a real model, gate this test behind `PW_ONB_AI` and keep the deterministic steps up to `generating` in CI; assert `draft ready` only when the env allows a real generation.)

- [ ] **Step 3: Run — fail.**

- [ ] **Step 4: Rebuild the 5 AI pages** to their frames using primitives; keep the generation mutation + status poll + cancel exactly as they are (they already carry the loop fix + image-src rewrite). The **Generating** frame = the poll's in-progress state (reuse `GenerationProgress`); **Draft ready** = the completed preview → CTA to editor. Wrap generation failure in `OnbBanner` with retry (re-run `generate.create`).

- [ ] **Step 5: Run e2e → PASS (deterministic portion); live-verify vs frames.**

- [ ] **Step 6: Commit** — `feat(onboarding): rebuild AI-draft flow frames (basics/goal/brand/generating/draft-ready)`.

---

### Task 5: Template flow (Gallery + No results, Preview, Selected)

**Files:**
- Modify: `app/onboarding/template/{page,preview,selected}.tsx`
- Create: `components/onboarding/wizard/onb-empty.tsx`
- Test: `onboarding.spec.ts` (template block)

**Interfaces:** Consumes `trpc.templates.list` + `templates.get`; `useWizard()`; `OnbCard/OnbButton`; `TemplateGallery`/`TemplatePreview` (existing components — reuse). Produces `OnbEmpty({ title, body, action })`.

- [ ] **Step 1: Read the 4 frames** — **Gallery**, **No results** (empty), **Preview**, **Selected**. Record the grid, the search/filter, the empty-state copy + reset action, and the preview/selected layouts.

- [ ] **Step 2: Write the failing e2e (no-results empty state)**

```ts
test("template search with no matches shows empty state", async ({ page }) => {
  await page.goto("/onboarding/template");
  await page.getByRole("searchbox").fill("zzzzznomatch");
  await expect(page.getByText(/no (templates|results)/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /clear|reset/i })).toBeVisible();
});
```

- [ ] **Step 3: Run — fail.**

- [ ] **Step 4: Build `OnbEmpty` + rebuild the 3 template pages**

```tsx
// components/onboarding/wizard/onb-empty.tsx
"use client";
export function OnbEmpty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-[15px] font-semibold text-onb-text">{title}</p>
      <p className="text-[13px] text-onb-muted">{body}</p>
      {action}
    </div>
  );
}
```
Gallery: `templates.list` → grid of `OnbCard`s; when the filtered list is empty render `<OnbEmpty title="No templates found" body="Try a different search." action={<button onClick={reset}>Clear search</button>} />` (match the frame's exact copy). Preview/Selected rebuilt to frames; "Use this template" → `saveAndGo("/onboarding/ready", { templateId })` (confirm next-arrow target from the gallery).

- [ ] **Step 5: Run e2e → PASS; live-verify vs frames.**

- [ ] **Step 6: Commit** — `feat(onboarding): rebuild Template flow frames + no-results empty state`.

---

### Task 6: Blank canvas + Editor ready

**Files:**
- Modify: `app/onboarding/blank/page.tsx`, `app/onboarding/ready/page.tsx`
- Test: `onboarding.spec.ts` (blank block)

**Interfaces:** Consumes `sites.create`; `use-onboarding-complete` (`completeWizard`); `OnbCard/OnbButton`. Produces nothing new.

- [ ] **Step 1: Read the 2 frames** — **Blank canvas**, **Editor ready**. Record copy + the final CTA (to editor/dashboard).

- [ ] **Step 2: Write the failing e2e**

```ts
test("blank path reaches editor-ready", async ({ page }) => {
  await page.goto("/onboarding/blank");
  await page.getByRole("button", { name: /create|start|blank/i }).click();
  await expect(page).toHaveURL(/\/onboarding\/ready/);
  await expect(page.getByRole("button", { name: /open editor|go to editor|dashboard/i })).toBeVisible();
});
```

- [ ] **Step 3: Run — fail.**

- [ ] **Step 4: Rebuild `blank/page.tsx` + `ready/page.tsx`** to their frames; `blank` calls `sites.create({ method: "blank" })` then `saveAndGo("/onboarding/ready")`; `ready` calls `completeWizard` on the final CTA (reuse `use-onboarding-complete` — do not reimplement completion). Keep the existing completion side effects intact.

- [ ] **Step 5: Run e2e → PASS; live-verify vs frames.**

- [ ] **Step 6: Commit** — `feat(onboarding): rebuild Blank-canvas + Editor-ready frames`.

---

### Task 7: Full-flow e2e coverage + tsc/gate pass

**Files:**
- Modify: `packages/dashboard/e2e/onboarding.spec.ts`
- Test: itself

**Interfaces:** Consumes all rebuilt pages + `onboarding.setup.ts` storage state.

- [ ] **Step 1: Add three end-to-end walkthroughs**

One test each for the **AI**, **Template**, and **Blank** full paths (workspace → path → flow → ready), asserting the final CTA renders. Reset `OnboardingState` between them (the setup already seeds incomplete; add a `beforeEach` re-seed if needed via a tiny tRPC/db helper, or navigate fresh).

- [ ] **Step 2: Run the whole onboarding suite**

Run: `PW_NO_SERVER=1 npx playwright test onboarding.spec.ts --reporter=list`
Expected: all green (deterministic portions; AI-generation-gated tests skipped unless `PW_ONB_AI`).

- [ ] **Step 3: Full gates**

Run: `npx tsc --noEmit -p tsconfig.json` (expect clean) and `pnpm gate:ds` (expect no new violations — onboarding is DS-scoped; the `#2563EB` accent is allowed).

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/e2e/onboarding.spec.ts
git commit -m "test(onboarding): full-flow e2e for AI / template / blank paths"
```

---

## Self-Review

**Spec coverage:** Workspace+5 states → Task 1. Site+2 states → Task 2. Path+hover → Task 3. AI 5 frames → Task 4. Template 4 frames + no-results → Task 5. Blank+ready → Task 6. Testing → Tasks 0–7. Engine-preserve + accent + primitives-only + no-new-routes → Global Constraints, enforced per task. All 24 frames + 13 states covered.

**Placeholder scan:** State logic + tests are concrete code. Frame-content steps are reference-driven procedures (open frame X → match with named primitives) — inherent to a visual rebuild, not fabricated markup. Two flagged real gaps to resolve during implementation (own commits): (a) `workspace.update` uniqueness → `WORKSPACE_NAME_TAKEN` domain error if absent; (b) `OnboardingState` field names to verify against `prisma/schema.prisma`.

**Type consistency:** `OnbBanner({message,onRetry,retrying})`, `OnbEmpty({title,body,action})` defined in Tasks 1/5 and consumed consistently. `useWizard()` shape (`data/update/saveAndGo/saving`) matches `wizard-context.tsx`. Mutation names match the tRPC grep.

**Open verification (do first, in Task 0/1):** confirm `OnboardingState` columns, the `onb-error` token/class name, and whether `workspace.update` surfaces a uniqueness error. Each is called out in-task.
