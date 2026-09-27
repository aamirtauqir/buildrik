# Settings P0 Fixes (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the eight critical Settings bugs (SA-01…SA-08) before any Settings redesign, each proven by a failing test first and by a live check after.

**Architecture:** Eight independent fixes on branch `fix/settings-p0` (worktree `~/Desktop/buildrik-worktrees/settings-arch/p0`). They are server-first where the bug is server-side (tRPC router → service → Prisma, per root CLAUDE.md). There are two editor-only fixes (SA-05, SA-08), one migration (SA-06, `Site.vercelProjectName`), one data backfill migration (SA-01), and one new cron route (SA-04). Each task is one commit.

**Tech Stack:** Next 16 dashboard + tRPC 11 + Prisma 5 + Postgres; editor React 18 + Vitest + RTL; server tests in root `__tests__/` (Vitest, Prisma mocked per `__tests__/account-service.test.ts`).

**Spec:** `docs/plans/2026-09-27-settings-architecture-proposal.md` (§7–17 P0 table, decisions D1, PD-5, PD-6).

## Global Constraints

- Data flow: Page → tRPC → Router → Service → Prisma. Routers never touch Prisma; services throw domain errors (`Error("CODE")`), routers translate them to `TRPCError`.
- Shared Zod in `packages/shared/schemas/`. No `../../` imports. No `any`. No new comments on code you didn't write.
- Never stage `packages/editor/src/editor/shell/AquibraStudio.tsx` or `packages/editor/scripts/baselines/ssot.json`. No `git stash`.
- Migrations: at most one per task, named `settings_p0_<topic>`, applied locally with `pnpm prisma migrate dev`. The production apply is the founder's step.
- New cron route ⇒ the founder adds a cPanel cron entry. Record it in the task's commit message and in the final report.
- Commit per task: `fix(settings): SA-0N — <what>` + trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **SA-01 correction (found while planning):** `sites.publish` ships client-rendered page HTML with no server-side sanitizing (`packages/shared/schemas/publish.ts:37`, `app/api/workers/publish/[jobId]/route.ts`), so an EDITOR can already put scripts in published pages through page HTML. The role/plan gate on custom code was never a security boundary. SA-01 is therefore a **source-of-truth** fix (publish reads columns, the JSON copy is dropped), not a security fix. The proposal and the shared doc are corrected in Task 9.

## Review Focus

1. **Existing sites whose SEO/favicon/custom code live only in `projectSettings` JSON** (most rows; `site-settings.service.ts` notes 0/52 had columns): after SA-01 they must publish the same `<head>` as before. Pinned in Task 8 by the backfill test.
2. **Stripe unreachable during a due workspace deletion.** The workspace must NOT be deleted while billing may still run; it retries on the next run. Pinned in Task 7.
3. **A member whose only workspace is deleted** can still sign in (their `User` row survives) and is not left with a dangling membership. Pinned in Task 7 (cascade assertion on `workspaceMember`).
4. **Slug changed on a site published before the fix:** the old Vercel project must stay pinned. Pinned in Task 5 (pin-on-slug-change test).
5. **Vercel down while deleting a site:** the soft delete still lands and the take-down error is logged, not thrown. Pinned in Task 6.

---

### Task 1: SA-02 — `sites.get` stops sending the site password ciphertext

**Files:**
- Modify: `server/services/sites.service.ts:341-346` (`getSite`)
- Test: `__tests__/sites-get-redaction.test.ts` (create)

**Interfaces:**
- Produces: `getSite(siteId)` returns the Site row **without** `publishedPassword`, plus `hasPublishedPassword: boolean`. Callers that read `publishedPassword` off `sites.get`: none in dashboard/editor source (verified: `settings-tab.tsx` reads `hasPublishedPassword` from `settings.get`).

- [ ] **Step 1: Write the failing test** — copy the `vi.mock("@/lib/prisma", …)` block from `__tests__/account-service.test.ts` verbatim, then:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getSite } from "@/server/services/sites.service";

describe("getSite redaction (SA-02)", () => {
  beforeEach(() => vi.clearAllMocks());
  it("never returns publishedPassword, exposes hasPublishedPassword", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue({
      id: "s1", name: "A", publishedPassword: "v1:ciphertext", folder: null, sourceTemplate: null,
    } as never);
    const site = await getSite("s1");
    expect(site).not.toBeNull();
    expect(site).not.toHaveProperty("publishedPassword");
    expect(site?.hasPublishedPassword).toBe(true);
  });
  it("returns null for a missing site", async () => {
    vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
    expect(await getSite("nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `pnpm vitest run __tests__/sites-get-redaction.test.ts`. Expected: FAIL (`publishedPassword` present).
- [ ] **Step 3: Implement**

```ts
export async function getSite(siteId: string) {
  const site = await prisma.site.findFirst({
    where: { id: siteId, deletedAt: null },
    include: { folder: true, sourceTemplate: { select: { id: true, name: true } } },
  });
  if (!site) return null;
  const { publishedPassword, ...rest } = site;
  return { ...rest, hasPublishedPassword: Boolean(publishedPassword) };
}
```

- [ ] **Step 4: Run** the test (PASS), then `pnpm tsc --noEmit -p packages/dashboard` and `npx tsc --noEmit` in `packages/editor`. A type error = a caller that read the field; fix that caller to use `hasPublishedPassword`.
- [ ] **Step 5: Commit** `fix(settings): SA-02 — sites.get no longer returns the site password ciphertext`.

---

### Task 2: SA-03 — enabling 2FA cannot rotate an active secret

**Files:**
- Modify: `server/services/account.service.ts:337-362` (`enable2FA`)
- Modify: `server/trpc/routers/account.ts:117-124` (`twoFactor.enable` error map)
- Test: `__tests__/account-service.test.ts` (add a case)

- [ ] **Step 1: Failing test** (in the existing `describe` for 2FA, or a new one in the same file):

```ts
it("enable2FA refuses when 2FA is already on and writes nothing (SA-03)", async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "a@b.c", twoFactorEnabled: true } as never);
  await expect(enable2FA("u1")).rejects.toThrow("TWO_FACTOR_ALREADY_ENABLED");
  expect(prisma.user.update).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run** `pnpm vitest run __tests__/account-service.test.ts -t SA-03`. Expected: FAIL.
- [ ] **Step 3: Implement** in `enable2FA`: select `twoFactorEnabled` too, then refuse:

```ts
const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, twoFactorEnabled: true } });
if (!user) throw new Error("USER_NOT_FOUND");
if (user.twoFactorEnabled) throw new Error("TWO_FACTOR_ALREADY_ENABLED");
```

Router, inside the existing `catch`, before the generic error:

```ts
if (e instanceof Error && e.message === "TWO_FACTOR_ALREADY_ENABLED")
  throw new TRPCError({ code: "CONFLICT", message: "Two-factor is already on. Turn it off first to set up a new authenticator." });
```

- [ ] **Step 4: Run** the file's tests (all PASS).
- [ ] **Step 5: Commit** `fix(settings): SA-03 — 2FA enable refuses while 2FA is on`.

---

### Task 3: SA-08 — editor General keeps social links it does not show

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx:180-184`
- Test: `packages/editor/src/editor/sidebar/tabs/settings/screens/__tests__/SiteSettingsScreen.socialLinks.test.tsx` (create; mount pattern copied from the nearest existing `SiteSettingsScreen` test in that folder)

- [ ] **Step 1: Failing test.** Seed the composer with `seo.socialLinks = { twitter: "https://x.com/a", instagram: "https://instagram.com/a", youtube: "https://youtube.com/@a", github: "https://github.com/a" }`, render General, change the Twitter field to `https://x.com/b`, trigger the screen's flush (the same way the existing test does — via the registered flush handler), then assert:

```ts
expect(composer.getProjectSettings().seo.socialLinks).toEqual({
  twitter: "https://x.com/b",
  facebook: "",
  linkedin: "",
  instagram: "https://instagram.com/a",
  youtube: "https://youtube.com/@a",
  github: "https://github.com/a",
});
```

(If the screen stores unset fields as `undefined` rather than `""`, match that. The assertion that matters is that instagram/youtube/github survive.)
- [ ] **Step 2: Run** `cd packages/editor && npx vitest run src/editor/sidebar/tabs/settings/screens/__tests__/SiteSettingsScreen.socialLinks.test.tsx`. Expected: FAIL (instagram etc. missing). This also answers the "unverified" flag on SA-08.
- [ ] **Step 3: Implement** — merge instead of replace:

```ts
socialLinks: {
  ...current.seo?.socialLinks,
  twitter: s.twitter,
  facebook: s.facebook,
  linkedin: s.linkedin,
},
```

- [ ] **Step 4: Run** the new test plus `npx vitest run src/editor/sidebar/tabs/settings` (all PASS).
- [ ] **Step 5: Commit** `fix(settings): SA-08 — General save keeps social links it does not show`.

---

### Task 4: SA-05 — stop sending visitors to unpublished locales

**Files:**
- Modify: `packages/editor/src/engine/export/ExportEngine.ts:645-648` and `:980-983` (remove both `localeRedirectSnippet` uses)
- Modify: `packages/editor/src/engine/export/ExportHelpers.ts` (delete `localeRedirectSnippet` — no callers remain; git keeps it for the per-locale publish arc)
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/screens/LocalizationScreen.tsx:~280-300` (remove the Auto-redirect row; keep sending the stored `localeAutoRedirect` value unchanged in the save handler)
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/searchIndex.ts` (remove the "Auto-redirect by browser" entry)
- Test: the existing tests that pin the snippet / toggle / index entry — find them with `grep -rln "localeRedirectSnippet\|locale-auto-redirect\|Auto-redirect by browser" packages/editor/src`, then rewrite them to assert absence

- [ ] **Step 1: Failing test** in the ExportEngine test that covers head output (or a new `ExportEngine.noLocaleRedirect.test.ts`): a project with `localization = { defaultLocale: "en", enabledLocales: ["en","fr"], autoRedirect: true }` exports HTML that does **not** contain `brk-locale-redirect`. Also: LocalizationScreen renders no element with id `locale-auto-redirect`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** the removals listed above.
- [ ] **Step 4: Run** `npx vitest run src/engine/export src/editor/sidebar/tabs/settings` (PASS) and `npx tsc --noEmit` (clean).
- [ ] **Step 5: Commit** `fix(settings): SA-05 — no auto-redirect to unpublished locales; toggle hidden until per-locale publish`.

---

### Task 5: SA-06 — slug is validated and unique, and changing it never moves the live site

**Files:**
- Modify: `prisma/schema.prisma` (`Site`: add `vercelProjectName String?`) + migration `settings_p0_vercel_project_name`
- Modify: `packages/shared/schemas/site-detail.ts:54` (slug rule)
- Modify: `lib/vercel.ts` (add `resolveVercelProjectName`)
- Modify: `server/services/site-settings.service.ts:~192-200` (uniqueness + pin on change)
- Modify: `server/trpc/routers/site-detail.ts:100-135` (map `SLUG_TAKEN`)
- Modify: `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:331`, `server/services/domain.service.ts:200,249`, `server/services/form-submission.service.ts:189` (use the resolver; the worker persists the name after a successful deploy)
- Modify: `packages/dashboard/components/site-detail/settings-tab.tsx` (slug hint copy)
- Test: `__tests__/site-settings-slug.test.ts` (create), `__tests__/vercel-project-name.test.ts` (create)

**Interfaces:**
- Produces: `resolveVercelProjectName(site: { slug: string; vercelProjectName: string | null }): string` in `lib/vercel.ts`, which returns `site.vercelProjectName ?? slugifyProjectName(site.slug)`.

- [ ] **Step 1: Failing tests**

```ts
// __tests__/vercel-project-name.test.ts
import { resolveVercelProjectName, slugifyProjectName } from "@/lib/vercel";
it("prefers the pinned name", () => {
  expect(resolveVercelProjectName({ slug: "new", vercelProjectName: "buildrik-site-old" })).toBe("buildrik-site-old");
});
it("falls back to the slug", () => {
  expect(resolveVercelProjectName({ slug: "new", vercelProjectName: null })).toBe(slugifyProjectName("new"));
});
```

```ts
// __tests__/site-settings-slug.test.ts (prisma mocked as in account-service.test.ts)
import { updateSiteSettingsSchema } from "@buildrik/shared/schemas/site-detail";
it("rejects slugs that are not lowercase-dash", () => {
  expect(updateSiteSettingsSchema.safeParse({ id: "s", slug: "BAD SLUG!!" }).success).toBe(false);
  expect(updateSiteSettingsSchema.safeParse({ id: "s", slug: "good-slug-2" }).success).toBe(true);
});
it("refuses a slug another site uses", async () => {
  vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "a", vercelProjectName: null, deletedAt: null, status: "DRAFT", workspace: { plan: "PRO" } } as never);
  vi.mocked(prisma.site.findFirst).mockResolvedValue({ id: "other" } as never);
  await expect(updateSiteSettings("s1", { slug: "taken" })).rejects.toThrow("SLUG_TAKEN");
});
it("pins the old project name when a published site changes slug", async () => {
  vi.mocked(prisma.site.findUnique).mockResolvedValue({ slug: "old", vercelProjectName: null, deletedAt: null, status: "PUBLISHED", workspace: { plan: "PRO" } } as never);
  vi.mocked(prisma.site.findFirst).mockResolvedValue(null);
  await updateSiteSettings("s1", { slug: "new" });
  expect(prisma.site.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ slug: "new", vercelProjectName: slugifyProjectName("old") }),
  }));
});
```

(Match `updateSiteSettings`'s real signature and its `select` when writing the mock. Read `site-settings.service.ts:130-260` first.)
- [ ] **Step 2: Run** both files. Expected: FAIL.
- [ ] **Step 3: Implement**
  - schema.prisma `Site`: `vercelProjectName String?`, then `pnpm prisma migrate dev --name settings_p0_vercel_project_name`.
  - site-detail.ts slug: `z.string().min(3).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes")`.
  - lib/vercel.ts: add `resolveVercelProjectName` as in Interfaces.
  - site-settings.service.ts: add `slug: true, vercelProjectName: true, status: true` to the `current` select. When `data.slug` differs from `current.slug`: (1) `findFirst({ where: { slug: data.slug, id: { not: siteId } }, select: { id: true } })`, and if found throw `Error("SLUG_TAKEN")`; (2) if `current.vercelProjectName == null && current.status === "PUBLISHED"`, add `vercelProjectName: slugifyProjectName(current.slug)` to the update data. Keep the SlugHistory write.
  - router: `if (e instanceof Error && e.message === "SLUG_TAKEN") throw new TRPCError({ code: "CONFLICT", message: "Another site already uses that URL slug." });`
  - worker `route.ts:331`: `const projectName = resolveVercelProjectName(site);` (add `vercelProjectName` to the site select). After a successful deploy, `if (!site.vercelProjectName) await prisma.site.update({ where: { id: site.id }, data: { vercelProjectName: projectName } })`. This goes through the existing service write helper if the route already uses one; else the route's existing prisma access pattern.
  - domain.service.ts / form-submission.service.ts: replace `slugifyProjectName(x.slug)` with `resolveVercelProjectName(x)`, adding `vercelProjectName` to their selects.
  - settings-tab.tsx slug hint: `"Used in your site's address. Changing it doesn't move your live site."`
- [ ] **Step 4: Run** the new tests + `pnpm vitest run __tests__` (server suite) + dashboard `tsc`. All PASS.
- [ ] **Step 5: Commit** `fix(settings): SA-06 — slug validated + unique; Vercel project name pinned so a slug change never moves the live site`.

---

### Task 6: SA-07 — deleting a site takes it offline and is logged

**Files:**
- Modify: `server/services/sites.service.ts:530-556` (`deleteSite`) and the bulk-delete branch at `:650-656`
- Modify: `server/trpc/routers/sites.ts:172-214` (activity entries)
- Test: `__tests__/sites-delete.test.ts` (create)

- [ ] **Step 1: Failing tests** (prisma + `@/server/services/publish.service` mocked):

```ts
it("unpublishes a published site before soft-deleting (SA-07)", async () => {
  vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", name: "A", deletedAt: null, status: "PUBLISHED" } as never);
  await deleteSite("s1", "A");
  expect(unpublishSite).toHaveBeenCalledWith("s1");
});
it("still soft-deletes when the take-down throws", async () => {
  vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: "s1", name: "A", deletedAt: null, status: "PUBLISHED" } as never);
  vi.mocked(unpublishSite).mockRejectedValue(new Error("vercel down"));
  await expect(deleteSite("s1", "A")).resolves.toEqual({ success: true });
  expect(prisma.$transaction).toHaveBeenCalled();
});
it("bulk delete deactivates share links and forms too", async () => { /* assert shareLink.updateMany + formBlock.updateMany with siteId in ids */ });
```

- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.** In `deleteSite`, after the name check:

```ts
if (site.status === "PUBLISHED") {
  await unpublishSite(siteId).catch((e: unknown) =>
    console.error(`[deleteSite] take-down failed for ${siteId}:`, e instanceof Error ? e.message : e));
}
```

(`unpublishSite` is already best-effort toward Vercel and flips the row to DRAFT.) If importing `publish.service` from `sites.service` creates a cycle, check with `grep -n "sites.service" server/services/publish.service.ts`. If a cycle exists, call `unpublishSite` from the router before `deleteSite` instead, and move the tests to assert the router order. In the bulk branch, run the same take-down per published id, plus the two `updateMany` calls `deleteSite` makes.
Router: after a successful delete, record `site.deleted` with the existing activity helper used by `sites.unpublish` (`sites.ts:546`). Add the label in `activity-log.service.ts` next to `site.unpublished` if labels are enumerated there.
- [ ] **Step 4: Run** the tests + server suite. All PASS.
- [ ] **Step 5: Commit** `fix(settings): SA-07 — site delete takes the deployment down and is logged`.

---

### Task 7: SA-04 — workspace deletion actually happens (PD-5)

**Files:**
- Modify: `server/services/workspace-settings.service.ts` (add `processDueWorkspaceDeletions`)
- Create: `packages/dashboard/app/api/cron/workspace-deletion/route.ts`
- Modify: `packages/dashboard/components/settings/delete-workspace-modal.tsx:42,49` (copy)
- Modify: `server/trpc/routers/account.ts:229-233` (`cancelDelete` → owner only, same check `delete` uses)
- Test: `__tests__/workspace-deletion.test.ts` (create)

**Interfaces:**
- Produces: `processDueWorkspaceDeletions(now: Date): Promise<{ deleted: number; skipped: number }>`.

- [ ] **Step 1: Failing tests** (prisma, `@/server/services/stripe.client`, `@/server/services/publish.service` mocked):

```ts
it("cancels Stripe, unpublishes, then deletes a due workspace", async () => {
  vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }] as never);
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
  vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
  const res = await processDueWorkspaceDeletions(new Date("2026-10-30"));
  expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
  expect(unpublishSite).toHaveBeenCalledWith("s1");
  expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
  expect(res).toEqual({ deleted: 1, skipped: 0 });
});
it("skips (keeps) the workspace when Stripe cancel fails", async () => {
  vi.mocked(stripe.subscriptions.cancel).mockRejectedValue(new Error("stripe down"));
  const res = await processDueWorkspaceDeletions(new Date("2026-10-30"));
  expect(prisma.workspace.delete).not.toHaveBeenCalled();
  expect(res.skipped).toBe(1);
});
it("only selects workspaces whose date has passed", async () => {
  await processDueWorkspaceDeletions(new Date("2026-10-30"));
  expect(prisma.workspace.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { deletionScheduledAt: { lte: new Date("2026-10-30") } },
  }));
});
```

Also a route test mirroring `__tests__/cron-account-deletion.test.ts`: 401 without the cron bearer, 200 + JSON counts with it.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
export async function processDueWorkspaceDeletions(now: Date) {
  const due = await prisma.workspace.findMany({ where: { deletionScheduledAt: { lte: now } }, select: { id: true } });
  let deleted = 0;
  let skipped = 0;
  for (const ws of due) {
    try {
      const sub = await prisma.subscription.findUnique({ where: { workspaceId: ws.id }, select: { stripeSubscriptionId: true } });
      if (sub) await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (e) {
      console.error(`[workspace-deletion] Stripe cancel failed for ${ws.id}; retrying next run:`, e instanceof Error ? e.message : e);
      skipped++;
      continue;
    }
    const published = await prisma.site.findMany({ where: { workspaceId: ws.id, status: "PUBLISHED" }, select: { id: true } });
    for (const s of published) {
      await unpublishSite(s.id).catch((e: unknown) =>
        console.error(`[workspace-deletion] take-down failed for site ${s.id}:`, e instanceof Error ? e.message : e));
    }
    await prisma.workspace.delete({ where: { id: ws.id } });
    deleted++;
  }
  return { deleted, skipped };
}
```

Stripe's `subscriptions.cancel` on an already-cancelled subscription errors with `resource_missing` / status `canceled`. Treat a Stripe error whose `code === "resource_missing"` as success (check `stripe.client.ts` for how other callers detect it). Only `Workspace` rows are deleted; `onDelete: Cascade` removes members, sites, etc. `User` rows are untouched.
Route (copy `account-deletion/route.ts` structure):

```ts
import { type NextRequest } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { processDueWorkspaceDeletions } from "@/server/services/workspace-settings.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;
  return Response.json(await processDueWorkspaceDeletions(new Date()));
}
```

(If the account-deletion route calls Prisma inline instead of a service, still keep this one on the service: the root rule wins.)
Modal copy, replacing lines 42 and 49:
- "Your workspace will be deleted 30 days from now. Until then you can cancel from the dashboard home page."
- "On that date every site is taken offline, the subscription is cancelled, and all sites, forms, members and data are removed for good."

`cancelDelete`: use the same owner check `workspace.delete` uses (`ws.ownerId === ctx.session.user.id`, else `FORBIDDEN` "Only the owner can cancel the deletion.").
- [ ] **Step 4: Run** the tests + server suite + dashboard tests touching the modal (`grep -rln "cannot be undone" packages/dashboard/**/__tests__` and update pinned copy). All PASS.
- [ ] **Step 5: Commit** `fix(settings): SA-04 — scheduled workspace deletion now runs (cron workspace-deletion), honest modal copy, owner-only cancel`. The body says: **founder: add cPanel cron `GET /api/cron/workspace-deletion` daily with the `CRON_SECRET` bearer.**

---

### Task 8: SA-01 — one source of truth for column-backed site settings

**Files:**
- Create: migration `settings_p0_settings_backfill` (SQL only, no schema change)
- Create: `server/services/project-settings.ts`, which holds `stripColumnBackedSettings` (the SSOT list of JSON keys that belong to columns)
- Modify: `server/services/sites.service.ts:~722` (`saveProjectData`: strip before storing)
- Modify: `packages/editor/src/services/BuildrikSyncProvider.ts:~317-347` (load: columns always win; a null column clears the JSON value instead of keeping it)
- Test: `__tests__/project-settings-strip.test.ts` (create), `__tests__/db/settings-backfill.db.test.ts` (create; DB tier, `pnpm test:db`), and the existing BuildrikSyncProvider load test (add a case)

**Interfaces:**
- Produces: `stripColumnBackedSettings(settings: unknown): unknown`. It returns a deep copy without `seo.{siteName,favicon,touchIcon,metaTitle,metaDescription,metaTitleTemplate,defaultOgImage,allowIndexing,robotsTxt,socialLinks,language}`, `customCode.{headScripts,bodyScripts}` or `publishing.publishedPassword`. Non-objects pass through unchanged.

- [ ] **Step 1: Failing tests**

```ts
import { stripColumnBackedSettings } from "@/server/services/project-settings";
it("drops column-backed keys, keeps the rest", () => {
  const out = stripColumnBackedSettings({
    seo: { metaTitle: "T", favicon: "f", twitterHandle: "@a" },
    customCode: { headScripts: "<script src=x>", bodyScripts: "b", globalCss: ".a{}" },
    publishing: { publishedPassword: "p", provider: "vercel" },
    analytics: { ga: { enabled: true, id: "G-ABCDEFGHIJ" } },
  });
  expect(out).toEqual({
    seo: { twitterHandle: "@a" },
    customCode: { globalCss: ".a{}" },
    publishing: { provider: "vercel" },
    analytics: { ga: { enabled: true, id: "G-ABCDEFGHIJ" } },
  });
});
it("passes non-objects through", () => {
  expect(stripColumnBackedSettings(undefined)).toBeUndefined();
  expect(stripColumnBackedSettings(null)).toBeNull();
});
```

Backfill DB test: insert a site with `metaTitle` NULL and `projectSettings.seo.metaTitle = "From JSON"`, and a second site with `metaTitle = "Column"` and JSON `"Stale"`. Run the migration SQL. Assert site 1 → `"From JSON"`, site 2 → `"Column"` (the column is never overwritten). Repeat once for `headCode` ← `customCode.headScripts`.
Sync load test: site columns `{ metaTitle: null }` + JSON `seo.metaTitle = "old"` → the composer's `seo.metaTitle` is `undefined` after load.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement**
  - Backfill SQL. First read the `@map` names in `prisma/schema.prisma` `Site`; the table is `sites`. Write one `UPDATE … SET col = COALESCE(col, "projectSettings" #>> '{seo,<key>}')` per pair: metaTitle, metaDescription, metaTitleTemplate, ogImage←defaultOgImage, favicon, touchIcon, robotsTxt, name←siteName is **skipped** (`name` is NOT NULL and authoritative), headCode←customCode.headScripts, bodyCode←customCode.bodyScripts, allowIndexing←(seo.allowIndexing)::boolean only when the JSON key exists, socialLinks←seo.socialLinks (jsonb) only when the column is null. No publishedPassword backfill (the JSON copy was never enforced; the column is ciphertext).
  - `project-settings.ts`: a structured-clone + `delete` per key path, as the Interfaces list says. `saveProjectData`: `const settings = stripColumnBackedSettings(withValidAnalyticsIds(input.settings));`.
  - BuildrikSyncProvider load (`:317-347`): for every column-backed key, set the composer value from the column; when the column is null, set it to `undefined` (drop the JSON fallback at `:328-329`).
- [ ] **Step 4: Run** the unit tests, `pnpm test:db`, the editor suite (`cd packages/editor && npx vitest run src/services`), and a manual export check. In the running app, a site whose meta title was JSON-only still shows it in Settings › SEO after the backfill, and the exported HTML `<title>` is unchanged.
- [ ] **Step 5: Commit** `fix(settings): SA-01 — column-backed site settings have one source of truth (backfill + strip JSON copy)`.

---

### Task 9: Verify, walk live, correct the docs

**Files:**
- Modify: `docs/plans/2026-09-27-settings-architecture-proposal.md` (SA-01 row: security → source of truth, P1 severity, the Global Constraints evidence)
- Create: `docs/plans/2026-09-27-settings-p0-walkthrough.md` (evidence log)
- Update the shared doc "Buildrick Settings Architecture" (SA-01 row) through the Claude Docs connector

- [ ] **Step 1: Suites.** `pnpm vitest run` (root/server), `cd packages/editor && npx vitest run`, dashboard tests, `npx tsc --noEmit` in both packages, `pnpm run verify:ds`. Revert `packages/editor/scripts/baselines/ssot.json` if `verify:ds` touches it. Record the exit codes. A pre-existing red test that exists on `main` too is recorded as pre-existing (check it in the founder checkout, never by stashing).
- [ ] **Step 2: Live walkthrough** (gstack `/browse`, dashboard on a free port from this worktree, login `qa@buildrik.local`, site `scratchver0000000000000001`), one entry per fix in the walkthrough doc (action → observed → screenshot path):
  - SA-02: `sites.get` response in the network log has no `publishedPassword`.
  - SA-03: with 2FA on, calling `account.twoFactor.enable` returns CONFLICT with the new message.
  - SA-04: set one scratch workspace's `deletionScheduledAt` to the past (SQL, recorded), hit the cron with the bearer, and confirm the row is gone; the modal shows the new copy.
  - SA-05: Settings › Localization has no Auto-redirect row; the exported HTML has no `brk-locale-redirect`.
  - SA-06: dashboard slug `BAD SLUG!!` is refused with the rule text; a taken slug gives "Another site already uses that URL slug."
  - SA-07: deleting a scratch published site (simulation publish) flips it offline and writes the activity entry.
  - SA-08: set instagram in the dashboard, save General in the editor, and instagram is still there.
  - SA-01: a JSON-only meta title shows in Settings › SEO and in the exported `<title>`.
  - Not verifiable locally (record as such): real Vercel take-down, real Stripe cancel.
- [ ] **Step 3: Correct the docs** listed above.
- [ ] **Step 4: Commit** `docs(settings): P0 walkthrough evidence + SA-01 reclassified`.
