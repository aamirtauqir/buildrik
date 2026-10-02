import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeBlocks, sanitizeProjectStyles } from "@/lib/sanitize-blocks";
import { pagesFromTemplate } from "@/server/services/template.service";
import { newPageRoot, copiesForRenamedIds, copyIdKeyedRecord, reidSite, type IdRename } from "@buildrik/shared/content/elementIds";
import { checkSiteRole, getEffectiveSiteRole, PermissionError, siteScopeWhere } from "@/server/services/permission.service";
import type {
  CreateSiteInput,
  ListSitesInput,
  BulkActionInput,
  SaveProjectDataInput,
  CmsBindingsInput,
} from "@buildrik/shared/schemas/sites";
import { filterCmsBindings, MAX_CMS_BINDINGS_CHARS } from "@buildrik/shared/schemas/sites";
import { ANALYTICS_ID_FIELDS, ANALYTICS_ID_SAFE, type AnalyticsProvider } from "@buildrik/shared/schemas/analytics-ids";
import { SITE_SETTINGS_COLUMNS, keepValidJsonOnlySettings, stripColumnBackedSettings } from "@/server/services/site-settings.service";
import { sendSiteTransferredEmail } from "@/server/services/email.service";
import { assertSiteQuota } from "@/server/services/site-quota";
import { hasLiveDeployment, unpublishSite } from "@/server/services/publish.service";
import { slugifyProjectName } from "@/lib/vercel";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** A globally unique Site slug for a new site. Every site-creation path uses
 *  this one: it also skips slugs whose derived Vercel project another site is
 *  pinned to. A name with no usable characters falls back to "site". */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "site";
  const candidates = [base, ...Array.from({ length: 10 }, (_, i) => `${base}-${i + 2}`)];
  // One query for all base-prefixed slugs instead of up to 10 sequential
  // findFirst lookups. A candidate is also unusable when another site is
  // pinned to the Vercel project it derives — it would deploy into that one.
  const rows = await prisma.site.findMany({
    where: {
      OR: [
        { slug: { startsWith: base } },
        { vercelProjectName: { in: candidates.map(slugifyProjectName) } },
      ],
    },
    select: { slug: true, vercelProjectName: true },
  });
  const taken = new Set(rows.map((s) => s.slug));
  const pinned = new Set(rows.map((s) => s.vercelProjectName));
  return (
    candidates.find((c) => !taken.has(c) && !pinned.has(slugifyProjectName(c))) ?? `${base}-${Date.now()}`
  );
}

const SORT_MAP: Record<string, Record<string, string>> = {
  lastEdited: { lastEditedAt: "desc" },
  name: { name: "asc" },
  created: { createdAt: "desc" },
  traffic: { lastEditedAt: "desc" },
  pages: { pages: "desc" },
  published: { lastPublishedAt: "desc" },
};

export async function listSites(
  workspaceId: string,
  userId: string,
  filters: ListSitesInput
) {
  const { page, perPage, status, sort, search, folderId, clientId, createdBy, dateRange, templateUsed, hasCustomDomain, hasTraffic } = filters;
  const skip = (page - 1) * perPage;

  // S-9: a member scoped to specific sites must never see sites outside
  // their grant in the workspace-wide list.
  const scope = await siteScopeWhere(prisma, userId, workspaceId);

  const where: Record<string, unknown> = {
    workspaceId,
    deletedAt: null,
    ...scope,
  };

  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (folderId !== undefined) where.folderId = folderId;
  if (clientId !== undefined) where.clientId = clientId;
  if (createdBy) where.createdBy = createdBy;
  if (dateRange) {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    where.createdAt = { gte: new Date(Date.now() - days * 86400000) };
  }
  if (templateUsed) where.template = templateUsed;
  if (hasCustomDomain === true) where.domains = { some: {} };
  if (hasCustomDomain === false) where.domains = { none: {} };

  const orderBy = SORT_MAP[sort] ?? SORT_MAP.lastEdited;
  const SITE_SELECT = {
    id: true,
    name: true,
    slug: true,
    status: true,
    thumbnail: true,
    pages: true,
    lastEditedAt: true,
    publishedUrl: true,
    createdAt: true,
    createdBy: true,
    template: true,
    folderId: true,
    clientId: true,
    themeLocked: true,
    domains: { take: 1, select: { domain: true, isPrimary: true } },
    analytics: {
      where: { date: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { visitors: true },
    },
  } as const;

  // Regression fix (dashboard tsc, fix): the previous inline object
  // type for `site` mixed named properties with an index signature
  // (`[key: string]: unknown`) as an escape hatch for the rest-spread below.
  // TS's rest-destructuring inference collapses that combination — `...rest`
  // typed as `{}` rather than the named fields — so `enrich`'s return type
  // silently narrowed to just `{ domain, visitors30d }` and every dashboard
  // consumer of `sites.list` (projects page, client detail view, command
  // palette, invite modal, use-template modal) broke on `.id`/`.name`/etc.
  // A precise Prisma-derived payload type has no index signature, so the
  // rest spread keeps its named fields.
  type SiteRow = Prisma.SiteGetPayload<{ select: typeof SITE_SELECT }>;
  const enrich = (site: SiteRow) => {
    const { analytics, domains, ...rest } = site;
    return {
      ...rest,
      domain: domains[0]?.domain ?? null,
      visitors30d: analytics.reduce((sum, a) => sum + a.visitors, 0),
    };
  };

  // visitors30d is a 30-day aggregate, not a column, so it can't be filtered or
  // sorted directly in the Site query. When the request needs it (traffic
  // filter or traffic sort), fetch just the matching ids in DB order, sum
  // visitors per id with one groupBy on siteAnalytics, filter/sort/paginate
  // that id list in memory, then fetch the full payload for only the
  // resulting page (D-11: was one query pulling every matching site's full
  // payload — domains + every analytics row — to reduce() in JS regardless
  // of page).
  if (!hasTraffic && sort !== "traffic") {
    const [total, data] = await Promise.all([
      prisma.site.count({ where }),
      prisma.site.findMany({ where, orderBy, skip, take: perPage, select: SITE_SELECT }),
    ]);
    return { data: data.map(enrich), total, page, totalPages: Math.ceil(total / perPage) };
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const matching = await prisma.site.findMany({ where, orderBy, select: { id: true } });
  const orderedIds = matching.map((s) => s.id);

  const sums = await prisma.siteAnalytics.groupBy({
    by: ["siteId"],
    where: { siteId: { in: orderedIds }, date: { gte: thirtyDaysAgo } },
    _sum: { visitors: true },
  });
  const visitorsById = new Map<string, number>(orderedIds.map((id) => [id, 0]));
  for (const row of sums) visitorsById.set(row.siteId, row._sum.visitors ?? 0);

  let ids = orderedIds;
  if (sort === "traffic") {
    ids = [...ids].sort((a, b) => (visitorsById.get(b) ?? 0) - (visitorsById.get(a) ?? 0));
  }
  if (hasTraffic) {
    ids = ids.filter((id) => {
      const v = visitorsById.get(id) ?? 0;
      switch (hasTraffic) {
        case "none": return v === 0;
        case "1-100": return v >= 1 && v <= 100;
        case "100-1000": return v > 100 && v <= 1000;
        case "1000+": return v > 1000;
        default: return true;
      }
    });
  }

  const pageIds = ids.slice(skip, skip + perPage);
  const pageSites = await prisma.site.findMany({ where: { id: { in: pageIds } }, select: SITE_SELECT });
  const byId = new Map(pageSites.map((s) => [s.id, s]));
  // A page id can go missing between the id query and this fetch (deleted
  // concurrently) — skip it instead of a non-null assertion that would throw
  // on a legitimate race rather than just returning one fewer row.
  const pageRows = pageIds.flatMap((id) => {
    const site = byId.get(id);
    return site ? [enrich(site)] : [];
  });

  return {
    data: pageRows,
    total: ids.length,
    page,
    totalPages: Math.ceil(ids.length / perPage),
  };
}

export async function createSite(
  workspaceId: string,
  userId: string,
  input: CreateSiteInput
) {
  await assertSiteQuota(workspaceId, userId);

  const slug = await generateUniqueSlug(input.name);

  if (input.method === "template" && input.templateId) {
    // Scoped read: global built-ins or this workspace's own templates only.
    // An unscoped findUnique here copied another workspace's PRIVATE template
    // pages into a site the caller owns — the same leak fixed in
    // template.service.ts's three call sites.
    const template = await prisma.template.findFirst({
      where: { id: input.templateId, OR: [{ workspaceId: null }, { workspaceId }] },
    });
    if (!template) throw new Error("TEMPLATE_NOT_FOUND");

    const templatePageCount = ((template.pages ?? []) as unknown[]).length;

    const site = await prisma.$transaction(async (tx) => {
      const created = await tx.site.create({
        data: {
          name: input.name,
          slug,
          status: "DRAFT",
          workspaceId,
          createdBy: userId,
          creationMethod: "TEMPLATE",
          templateId: input.templateId,
          pages: templatePageCount,
          lastEditedAt: new Date(),
        },
      });

      const pageRows = pagesFromTemplate(template, created.id);
      if (pageRows.length > 0) {
        await tx.page.createMany({ data: pageRows });
      }

      await tx.template.update({
        where: { id: input.templateId! },
        data: { usageCount: { increment: 1 } },
      });

      return created;
    });

    return redactSitePassword(site);
  }

  const site = await prisma.$transaction(async (tx) => {
    const created = await tx.site.create({
      data: {
        name: input.name,
        slug,
        status: "DRAFT",
        workspaceId,
        createdBy: userId,
        pages: 1,
        lastEditedAt: new Date(),
      },
    });

    await tx.page.create({
      data: {
        siteId: created.id,
        name: "Home",
        slug: "home",
        position: 0,
        // X-A1: its own root (id unique per page), not [] — every [] page
        // used to load with one shared "root".
        blocks: newPageRoot(`${created.id}:home`),
        isHomePage: true,
      },
    });

    return created;
  });
  return redactSitePassword(site);
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const existing = await prisma.site.findFirst({ where: { slug } });
  return !existing;
}

export async function transferSite(
  siteId: string,
  newOwnerId: string,
  currentUserId: string
) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");
  if (site.createdBy !== currentUserId) throw new Error("NOT_OWNER");

  const currentMember = await prisma.workspaceMember.findFirst({
    where: { userId: currentUserId, workspaceId: site.workspaceId },
    select: { id: true, _count: { select: { sitePermissions: true } } },
  });
  const newOwnerMember = await prisma.workspaceMember.findFirst({
    where: { userId: newOwnerId, workspaceId: site.workspaceId },
  });
  if (!newOwnerMember) throw new Error("MEMBER_NOT_FOUND");

  // A-10: only preserve a SitePermission row for the previous owner when
  // they were ALREADY site-scoped (has other grants). Writing one
  // unconditionally newly scoped a previously-unscoped ("all sites")
  // creator down to just this one transferred site — resolveSiteScope
  // treats any SitePermission row as proof of scoping. Keep an existing
  // override on update instead of stomping it with "EDITOR" every transfer.
  const preserveScope = currentMember && currentMember._count.sitePermissions > 0;

  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: { createdBy: newOwnerId },
    }),
    ...(preserveScope
      ? [
          prisma.sitePermission.upsert({
            where: {
              memberId_siteId: { memberId: currentMember.id, siteId },
            },
            create: {
              memberId: currentMember.id,
              siteId,
              roleOverride: "EDITOR",
              grantedBy: currentUserId,
            },
            update: {},
          }),
        ]
      : []),
  ]);

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: currentUserId }, select: { fullName: true } }),
    prisma.user.findUnique({ where: { id: newOwnerId }, select: { email: true } }),
  ]);
  if (toUser?.email) {
    sendSiteTransferredEmail(
      toUser.email,
      fromUser?.fullName ?? "A team member",
      site.name,
      siteId,
    ).catch(() => {});
  }

  return { success: true };
}

/** Every Site row returned to a client goes through this: the stored
 *  published-site password is reversible ciphertext and never leaves the
 *  server; the client gets a flag instead. */
export function redactSitePassword<T extends { publishedPassword: string | null }>(
  site: T,
): Omit<T, "publishedPassword"> & { hasPublishedPassword: boolean } {
  const { publishedPassword, ...rest } = site;
  return { ...rest, hasPublishedPassword: Boolean(publishedPassword) };
}

export async function getSite(siteId: string) {
  const site = await prisma.site.findFirst({
    where: { id: siteId, deletedAt: null },
    include: { folder: true, sourceTemplate: { select: { id: true, name: true } } },
  });
  return site ? redactSitePassword(site) : null;
}

export async function renameSite(siteId: string, name: string) {
  return redactSitePassword(await prisma.site.update({
    where: { id: siteId },
    data: { name, lastEditedAt: new Date() },
  }));
}

/**
 * Assert the caller may edit this site. Callers that write a side effect keyed
 * by siteId BEFORE persisting (e.g. the thumbnail route uploads a blob to a
 * predictable per-site key) must gate on this first, so a non-member can't
 * clobber another site's blob just because the DB write would later fail.
 */
export async function assertSiteEditAccess(userId: string, siteId: string) {
  await checkSiteRole(prisma, userId, siteId, "EDITOR");
}

/**
 * Store a preview thumbnail URL on a site. Written by the editor's best-effort
 * capture at publish/save time (client screenshots the rendered page → Blob →
 * here), so the sites grid and template detail can show a real preview instead
 * of the generated cover. Requires edit access; the capture is non-blocking, so
 * a FORBIDDEN here simply means no thumbnail is stored.
 */
export async function setSiteThumbnail(userId: string, siteId: string, url: string) {
  await checkSiteRole(prisma, userId, siteId, "EDITOR");
  return prisma.site.update({
    where: { id: siteId },
    data: { thumbnail: url },
    select: { id: true, thumbnail: true },
  });
}

/** Setting columns a duplicate does not inherit: its own identity, the
 *  site password (a copy starts ungated, like any new site), and the canonical
 *  URL (the source's address — on the copy it would mark it a duplicate). */
const NOT_DUPLICATED = new Set<string>(["name", "slug", "publishedPassword", "canonicalUrl"]);
/** D2 (founder): custom code is a paid feature, so a copy into a FREE
 *  workspace starts without it. */
const NOT_DUPLICATED_INTO_FREE = new Set<string>([...NOT_DUPLICATED, "headCode", "bodyCode"]);

/**
 * SA-01: the source site's setting columns, for the copy's create. The columns
 * are the only source of the settings they back — the copy used to inherit
 * them through the projectSettings JSON, which saves no longer store. NULLs
 * are left out (the column default is NULL, and Prisma takes no raw null for
 * the Json `socialLinks`).
 */
function duplicatedSettingColumns(
  original: Record<string, unknown>,
  destinationPlan: string,
): Partial<Prisma.SiteUncheckedCreateInput> {
  const skip = destinationPlan === "FREE" ? NOT_DUPLICATED_INTO_FREE : NOT_DUPLICATED;
  return Object.fromEntries(
    Object.keys(SITE_SETTINGS_COLUMNS)
      .filter((key) => !skip.has(key) && original[key] !== null)
      .map((key) => [key, original[key]]),
  );
}

export async function duplicateSite(
  siteId: string,
  workspaceId: string,
  userId: string
) {
  const original = await prisma.site.findUnique({ where: { id: siteId } });
  if (!original || original.deletedAt) throw new Error("SITE_NOT_FOUND");

  await assertSiteQuota(workspaceId, userId);

  const destination = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });
  const destinationPlan = destination?.plan ?? "FREE";

  const copyName = `${original.name} (Copy)`;
  const slug = await generateUniqueSlug(copyName);

  const originalPages = await prisma.page.findMany({
    where: { siteId },
    orderBy: { position: "asc" },
  });
  const originalForms = await prisma.formBlock.findMany({ where: { siteId } });

  /* X-A1: legacy pages can share element ids ("root" everywhere), which the
     editor loads as one tree. The copy is written with the editor's own
     deterministic re-id — keyed by the ORIGINAL page id, so the duplicate
     gets exactly the ids the editor gives the original on load — and what is
     keyed by a renamed id (style rules, form blocks, CMS bindings) is copied
     along. */
  const reid = reidSite(originalPages, sanitizeProjectStyles(original.projectStyles));

  // Site + pages + form blocks must be copied atomically — a crash mid-copy
  // previously left an orphan half-built site. The page copy also dropped
  // meta/settings/slugHistory/slugManuallySet/translations and every
  // FormBlock; all are carried now.
  return prisma.$transaction(async (tx) => {
    const newSite = await tx.site.create({
      data: {
        ...duplicatedSettingColumns(original, destinationPlan),
        name: copyName,
        slug,
        status: "DRAFT",
        workspaceId,
        createdBy: userId,
        pages: originalPages.length,
        // S-1 class: the original row's own stored projectStyles could predate
        // sanitization (or have been written by a path that skipped it) — the
        // copy re-runs the same allowlist sanitizer the direct-save path uses
        // (:639) rather than trusting the source row.
        projectStyles: (reid.styles as Prisma.InputJsonValue) ?? undefined,
        projectAssets: (original.projectAssets as Prisma.InputJsonValue) ?? undefined,
        projectSettings: (original.projectSettings as Prisma.InputJsonValue) ?? undefined,
        projectCmsBindings: copyCmsBindings(original.projectCmsBindings, reid.renames),
        lastEditedAt: new Date(),
      },
    });

    if (originalPages.length > 0) {
      await tx.page.createMany({
        data: originalPages.map((p, i) => ({
          siteId: newSite.id,
          name: p.name,
          slug: p.slug,
          position: p.position,
          // M-6: same write-boundary sanitizer as the save path — the source
          // row may predate it, like projectStyles above.
          blocks: sanitizeBlocks(reid.pages[i].blocks ?? []) as Prisma.InputJsonValue,
          isHomePage: p.isHomePage,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          meta: (p.meta as Prisma.InputJsonValue) ?? undefined,
          settings: (p.settings as Prisma.InputJsonValue) ?? undefined,
          slugHistory: (p.slugHistory as Prisma.InputJsonValue) ?? undefined,
          slugManuallySet: p.slugManuallySet,
          translations: (p.translations as Prisma.InputJsonValue) ?? undefined,
        })),
      });
    }

    if (originalForms.length > 0) {
      // FormBlocks reference siteId + pageId; remap to the copies. Pages are
      // unique by (siteId, slug), so map old pageId → slug → new pageId.
      const oldPageIdToSlug = new Map(originalPages.map((p) => [p.id, p.slug]));
      const newPages = await tx.page.findMany({
        where: { siteId: newSite.id },
        select: { id: true, slug: true },
      });
      const slugToNewPageId = new Map(newPages.map((p) => [p.slug, p.id]));
      const copyForm = (f: (typeof originalForms)[number], blockId: string) => {
        const slugForForm = f.pageId ? oldPageIdToSlug.get(f.pageId) : undefined;
        const newPageId = slugForForm ? slugToNewPageId.get(slugForForm) ?? null : null;
        return {
          siteId: newSite.id,
          pageId: newPageId,
          blockId,
          name: f.name,
          fields: f.fields as Prisma.InputJsonValue,
          submitButtonText: f.submitButtonText,
          successMessage: f.successMessage,
          successAction: f.successAction,
          redirectUrl: f.redirectUrl,
          spamProtection: f.spamProtection,
          notifyEmail: f.notifyEmail,
          webhookUrl: f.webhookUrl,
          isActive: f.isActive,
        };
      };
      /* A form row is keyed by (site, element id) — no writer sets pageId — so
         it serves every page carrying that id. The copy's rows sit under the
         copy's siteId (a fresh surrogate id each), where its publish and its
         public form look them up. Each page whose copy of the element was
         re-id'd gets its own row; the original id's row stays for the page
         that kept it. */
      await tx.formBlock.createMany({
        data: [
          ...originalForms.map((f) => copyForm(f, f.blockId)),
          ...copiesForRenamedIds(originalForms, reid.renames).map(({ row, to }) => copyForm(row, to)),
        ],
        // A renamed id that coincides with a kept one must not abort the copy.
        skipDuplicates: true,
      });
    }

    return redactSitePassword(newSite);
  });
}

/** A site's stored CMS bindings for its copy: every entry kept, plus one per
 *  element id the copy's re-id renamed (the same copy the editor makes on
 *  load — `Composer.importProject`). Null stays unset. */
function copyCmsBindings(stored: Prisma.JsonValue, renames: IdRename[]): Prisma.InputJsonValue | undefined {
  const filtered = filterCmsBindings(stored);
  if (!filtered) return undefined;
  const { field, collection } = filtered;
  return {
    ...(field ? { field: copyIdKeyedRecord(field, renames) } : {}),
    ...(collection ? { collection: copyIdKeyedRecord(collection, renames) } : {}),
  } as Prisma.InputJsonValue;
}

export async function archiveSite(siteId: string) {
  return redactSitePassword(await prisma.site.update({
    where: { id: siteId },
    data: { status: "ARCHIVED" },
  }));
}

export async function unarchiveSite(siteId: string) {
  return redactSitePassword(await prisma.site.update({
    where: { id: siteId },
    data: { status: "DRAFT" },
  }));
}

export async function deleteSite(siteId: string, confirmName: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  if (site.name !== confirmName) {
    throw new Error("NAME_MISMATCH");
  }

  // SA-07: take the live deployment down before soft-deleting. Best-effort —
  // unpublishSite is already best-effort toward Vercel and flips the row to
  // DRAFT, but a delete must still succeed even if that call throws.
  if (hasLiveDeployment(site)) {
    try {
      await unpublishSite(siteId);
    } catch (e: unknown) {
      console.error(`[deleteSite] take-down failed for ${siteId}:`, e instanceof Error ? e.message : e);
    }
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: { deletedAt: now },
    }),
    prisma.shareLink.updateMany({
      where: { siteId },
      data: { isActive: false },
    }),
    prisma.formBlock.updateMany({
      where: { siteId },
      data: { isActive: false },
    }),
  ]);

  return { success: true };
}

/**
 * Editor's `sites.saveProject` router shape — what `composer.exportProject()`
 * produces and what BuildrikSyncProvider.saveProject sends. Translated to
 * SaveProjectDataInput shape and forwarded to consolidated saveProjectData.
 *
 * Phase -1 consolidation: previously this function and saveProjectData(input)
 * coexisted as a duplicate-export TS2323/TS2393 error. Build pipeline
 * silently dropped the conflict; runtime hoisting picked one. Now this is
 * a thin adapter that maps the editor shape → canonical input shape.
 */
export async function saveProjectFromEditor(
  siteId: string,
  projectData: {
    version: string;
    // (expectedLastEditedAt threaded as a separate arg below)
    pages: Array<{
      id: string;
      name: string;
      slug?: string;
      isHome?: boolean;
      root?: unknown;
      settings?: unknown;
      meta?: unknown;
      slugHistory?: unknown;
      slugManuallySet?: boolean;
      seoTitle?: string | null;
      seoDescription?: string | null;
    }>;
    styles: unknown[];
    assets: unknown[];
    metadata?: unknown;
    settings?: unknown;
    dsSchemaVersion?: number;
    cmsBindings?: CmsBindingsInput;
  },
  expectedLastEditedAt?: string,
) {
  // 2026-05-23: array-level cast — Zod's passthrough output type
  // (`objectOutputType<{...},...,"passthrough">`) for the `meta` field
  // structurally diverges from `Record<string, unknown>` because the
  // typed slot `appliedTemplates` wants a specific array shape but
  // Record's index returns `unknown`. Each `p` is already
  // Zod-validated at the tRPC input boundary, so the cast is safe.
  const mappedPages = projectData.pages.map((p, index) => ({
    id: p.id,
    blocks: p.root,
    name: p.name,
    slug: p.slug,
    isHomePage: p.isHome,
    position: index,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    meta: p.meta as Record<string, unknown> | undefined,
    settings: p.settings,
    slugHistory: p.slugHistory as Array<{ fromSlug: string; toSlug: string; changedAt: string }> | undefined,
    slugManuallySet: p.slugManuallySet,
  })) as unknown as SaveProjectDataInput["pages"];
  return saveProjectData({
    siteId,
    pages: mappedPages,
    styles: projectData.styles,
    assets: projectData.assets,
    settings: projectData.settings,
    dsSchemaVersion: projectData.dsSchemaVersion,
    cmsBindings: projectData.cmsBindings,
  }, expectedLastEditedAt);
}

export async function bulkAction(
  workspaceId: string,
  input: BulkActionInput
) {
  const { action, siteIds } = input;

  switch (action) {
    case "archive": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId, deletedAt: null },
        data: { status: "ARCHIVED" },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    case "unarchive": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId, deletedAt: null },
        data: { status: "DRAFT" },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    // publish/unpublish removed — a bulk status-flip never ran the deploy
    // pipeline or the approval gate, so it reported success while the live site
    // was untouched. Publishing is per-site through the real pipeline.
    case "delete": {
      // SA-07: same take-down + link/form deactivation as the single-site
      // delete, applied per id. Best-effort — a take-down failure never blocks
      // the soft-delete.
      const targets = await prisma.site.findMany({
        where: { id: { in: siteIds }, workspaceId, deletedAt: null },
        select: { id: true, status: true, publishedUrl: true },
      });
      await Promise.all(
        targets
          .filter(hasLiveDeployment)
          .map(async (s) => {
            try {
              await unpublishSite(s.id);
            } catch (e: unknown) {
              console.error(`[bulkAction:delete] take-down failed for ${s.id}:`, e instanceof Error ? e.message : e);
            }
          }),
      );
      const targetIds = targets.map((s) => s.id);
      const [result] = await prisma.$transaction([
        prisma.site.updateMany({
          where: { id: { in: targetIds }, workspaceId, deletedAt: null },
          data: { deletedAt: new Date() },
        }),
        prisma.shareLink.updateMany({
          where: { siteId: { in: targetIds } },
          data: { isActive: false },
        }),
        prisma.formBlock.updateMany({
          where: { siteId: { in: targetIds } },
          data: { isActive: false },
        }),
      ]);
      return { succeeded: targetIds.slice(0, result.count), failed: [] };
    }
    default:
      throw new Error("INVALID_ACTION");
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * I-1c: `projectSettings.analytics` with every injection-shaped id emptied
 * (and that provider's `verifiedAt` dropped) — the ids are written into every
 * published page's inline scripts, and `settings` is `z.unknown()` at the save
 * boundary. Deliberately NOT the editor's strict per-provider formats: ids
 * saved under the screen's older, looser rules must survive a save. A safe id
 * is stored trimmed. Lenient: the rest of the settings, and the save, land.
 */
function withValidAnalyticsIds(settings: unknown): unknown {
  if (!isPlainObject(settings) || !isPlainObject(settings.analytics)) return settings;
  const analytics: Record<string, unknown> = { ...settings.analytics };
  for (const provider of Object.keys(ANALYTICS_ID_FIELDS) as AnalyticsProvider[]) {
    const block = analytics[provider];
    if (!isPlainObject(block)) continue;
    const field = ANALYTICS_ID_FIELDS[provider];
    const id = block[field];
    if (id === undefined || id === "") continue;
    if (typeof id === "string" && ANALYTICS_ID_SAFE.test(id.trim())) {
      if (id !== id.trim()) analytics[provider] = { ...block, [field]: id.trim() };
      continue;
    }
    const emptied: Record<string, unknown> = { ...block, [field]: "" };
    delete emptied.verifiedAt;
    analytics[provider] = emptied;
  }
  return { ...settings, analytics };
}

/**
 * Phase -1: canonical project-data persistence path.
 *
 * Writes:
 *   - Per page: blocks, name, slug, position, isHomePage, seoTitle, seoDescription,
 *     meta (Json?), settings (Json?), slugHistory (Json?), slugManuallySet (Boolean).
 *   - Upserts incoming pages by id, deletes pages no longer present.
 *   - Site-level: projectStyles, projectAssets, projectSettings,
 *     projectCmsBindings, lastEditedAt.
 *
 * REGRESSION-1 (codex finding C23): `pages[].meta` was previously dropped on
 * save, breaking applied-template state across reload. Persisting meta is
 * load-bearing for P2 + P9 (template version pinning + applied-template badge).
 */
export async function saveProjectData(input: SaveProjectDataInput, expectedLastEditedAt?: string) {
  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
    select: { deletedAt: true, projectSettings: true },
  });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  const savedAt = new Date();
  // Delete pages not in incoming set (only when caller supplies position
  // for every page — that's how we infer the editor sent a full project
  // snapshot, not a partial blocks update).
  const isFullSnapshot = input.pages.every((p: { position?: number }) => p.position !== undefined);

  // Site-level project artifacts. The style rules' selectors and media
  // queries are written raw into the published stylesheet — same boundary.
  sanitizeProjectStyles(input.styles);
  // SA-01: the column-backed keys live in their Site columns only. BE-1: a
  // JSON-only key that fails its schema keeps the stored value.
  const settings = stripColumnBackedSettings(
    keepValidJsonOnlySettings(withValidAnalyticsIds(input.settings), site.projectSettings),
  );

  // Bad entries were already dropped per entry (cmsBindingsSchema). A map
  // past the size cap is not stored — the save and its pages still land, the
  // previously stored bindings stay.
  let cmsBindings = input.cmsBindings;
  if (cmsBindings && JSON.stringify(cmsBindings).length > MAX_CMS_BINDINGS_CHARS) {
    console.warn(`[saveProjectData] site=${input.siteId} cmsBindings over ${MAX_CMS_BINDINGS_CHARS} chars — not stored`);
    cmsBindings = undefined;
  }

  await prisma.$transaction(async (tx) => {
    /* 61-conflict / A-2: optimistic concurrency as a compare-and-swap, FIRST in
       the transaction. The `lastEditedAt` match is part of the UPDATE's WHERE,
       so a concurrent save holding the same token blocks on the row lock,
       re-evaluates the WHERE against the winner's committed row, matches 0
       rows and lands here — and every page write below rolls back with it. A
       read-then-compare before the transaction (what this was) let both pass.
       The server value is appended so the client can fetch + reload it. The
       check is skipped when expectedLastEditedAt is omitted (non-regressive). */
    const claimed = await tx.site.updateMany({
      where: {
        id: input.siteId,
        deletedAt: null,
        ...(expectedLastEditedAt ? { lastEditedAt: new Date(expectedLastEditedAt) } : {}),
      },
      data: {
        projectStyles:
          input.styles === undefined
            ? undefined
            : ((input.styles as Prisma.InputJsonValue) ?? Prisma.DbNull),
        projectAssets:
          input.assets === undefined
            ? undefined
            : ((input.assets as Prisma.InputJsonValue) ?? Prisma.DbNull),
        projectSettings:
          settings === undefined
            ? undefined
            : ((settings as Prisma.InputJsonValue) ?? Prisma.DbNull),
        dsSchemaVersion: input.dsSchemaVersion,
        // Undefined (an editor build that predates the field) leaves the
        // stored bindings alone; the editor always sends its full map.
        projectCmsBindings: cmsBindings as Prisma.InputJsonValue | undefined,
        lastEditedAt: savedAt,
        ...(isFullSnapshot ? { pages: input.pages.length } : {}),
      },
    });
    if (claimed.count === 0) {
      const current = await tx.site.findUnique({
        where: { id: input.siteId },
        select: { lastEditedAt: true, deletedAt: true },
      });
      if (!current || current.deletedAt) throw new Error("SITE_NOT_FOUND");
      throw new Error(`SAVE_CONFLICT:${current.lastEditedAt.toISOString()}`);
    }

    /* I-2: the page writes below go by id alone (upsert / update where {id}),
       and the caller's role was checked on THIS site only — a page id that
       already lives under another site would overwrite that site's page.
       Refused here, inside the transaction, so nothing of the save lands.
       Not a PermissionError: the router's FORBIDDEN is read by the editor as
       a revoked role (view mode, "no access" copy), which this is not. */
    const foreignPage = await tx.page.findFirst({
      where: { id: { in: input.pages.map((p: { id: string }) => p.id) }, siteId: { not: input.siteId } },
      select: { id: true },
    });
    if (foreignPage) throw new Error("PAGE_NOT_IN_SITE");

    if (isFullSnapshot) {
      const existingPages = await tx.page.findMany({
        where: { siteId: input.siteId },
        select: { id: true },
      });
      /* `[].every(...)` is true, so a save carrying no pages read as a complete
         snapshot of an empty site and deleted every page there was — returning
         { success: true } while it did. One failed project load followed by one
         autosave is enough to produce that request; the editor has nothing to
         send and this boundary treated nothing as "the user removed it all".
         A site that genuinely has no pages is untouched, so a real no-op still
         works; only a delete-everything is refused. */
      if (input.pages.length === 0 && existingPages.length > 0) {
        throw new Error("EMPTY_SNAPSHOT");
      }
      const incomingPageIds = new Set(input.pages.map((p: { id: string }) => p.id));
      const pagesToDelete = existingPages.filter((p) => !incomingPageIds.has(p.id));
      if (pagesToDelete.length > 0) {
        await tx.formBlock.deleteMany({
          where: { pageId: { in: pagesToDelete.map((p) => p.id) } },
        });
        await tx.page.deleteMany({
          where: { id: { in: pagesToDelete.map((p) => p.id) } },
        });
      }
    }

    // Upsert each incoming page.
    for (const [index, page] of input.pages.entries()) {
      // Defense-in-depth: strip XSS from the stored element tree at the write
      // boundary. The editor sanitizes on import/serialize, but a direct API
      // write (bypassing the editor) would otherwise persist hostile blocks.
      sanitizeBlocks(page.blocks);

      const slug =
        page.slug ?? (page.name ? page.name.toLowerCase().replace(/\s+/g, "-") : undefined);

      // Phase -1: persist meta + settings + slugHistory + slugManuallySet
      // (previously silently dropped, breaking applied-template reload).
      const metaJson =
        page.meta === undefined
          ? undefined
          : page.meta === null
            ? Prisma.JsonNull
            : (page.meta as Prisma.InputJsonValue);
      const settingsJson =
        page.settings === undefined
          ? undefined
          : (page.settings as Prisma.InputJsonValue);
      const slugHistoryJson =
        page.slugHistory === undefined
          ? undefined
          : page.slugHistory === null
            ? Prisma.JsonNull
            : (page.slugHistory as Prisma.InputJsonValue);

      const updateData: Prisma.PageUpdateInput = {
        blocks: page.blocks as Prisma.InputJsonValue,
      };
      if (page.name !== undefined) updateData.name = page.name;
      if (slug !== undefined) updateData.slug = slug;
      if (page.position !== undefined) updateData.position = page.position ?? index;
      if (page.isHomePage !== undefined) updateData.isHomePage = page.isHomePage;
      if (page.seoTitle !== undefined) updateData.seoTitle = page.seoTitle;
      if (page.seoDescription !== undefined) updateData.seoDescription = page.seoDescription;
      if (metaJson !== undefined) updateData.meta = metaJson;
      if (settingsJson !== undefined) updateData.settings = settingsJson;
      if (slugHistoryJson !== undefined) updateData.slugHistory = slugHistoryJson;
      if (page.slugManuallySet !== undefined) updateData.slugManuallySet = page.slugManuallySet;

      // Upsert path used when full snapshot (covers new pages); plain update otherwise.
      if (isFullSnapshot && page.name !== undefined && slug !== undefined) {
        await tx.page.upsert({
          where: { id: page.id },
          create: {
            id: page.id,
            siteId: input.siteId,
            name: page.name,
            slug,
            position: page.position ?? index,
            isHomePage: page.isHomePage ?? false,
            blocks: page.blocks as Prisma.InputJsonValue,
            ...(metaJson !== undefined && metaJson !== Prisma.JsonNull
              ? { meta: metaJson }
              : {}),
            ...(settingsJson !== undefined ? { settings: settingsJson } : {}),
            ...(slugHistoryJson !== undefined && slugHistoryJson !== Prisma.JsonNull
              ? { slugHistory: slugHistoryJson }
              : {}),
            ...(page.slugManuallySet !== undefined
              ? { slugManuallySet: page.slugManuallySet }
              : {}),
            ...(page.seoTitle !== undefined ? { seoTitle: page.seoTitle } : {}),
            ...(page.seoDescription !== undefined
              ? { seoDescription: page.seoDescription }
              : {}),
          },
          update: updateData,
        });
      } else {
        await tx.page.update({
          where: { id: page.id },
          data: updateData,
        });
      }
    }
  });

  return { success: true, savedAt };
}

export async function getProjectData(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
      projectStyles: true,
      projectAssets: true,
      projectSettings: true,
      projectCmsBindings: true,
      dsSchemaVersion: true,
      sitePages: {
        select: {
          id: true,
          name: true,
          slug: true,
          position: true,
          blocks: true,
          isHomePage: true,
          seoTitle: true,
          seoDescription: true,
          // Phase -1: round-trip applied-template state + slug-redirect history.
          meta: true,
          settings: true,
          slugHistory: true,
          slugManuallySet: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  return {
    siteId: site.id,
    name: site.name,
    pages: site.sitePages,
    styles: site.projectStyles ?? [],
    assets: site.projectAssets ?? [],
    settings: site.projectSettings ?? {},
    dsSchemaVersion: site.dsSchemaVersion,
    cmsBindings: site.projectCmsBindings ?? undefined,
  };
}

/**
 * How may this user open the editor for this site? "edit" = EDITOR/DESIGNER+;
 * "view" = a VIEWER member, who gets the editor in read-only view mode (owner
 * ruling 2026-09-24 — it used to 404 them); null = not a member / out of site
 * scope, which the route turns into a 404. Every server write stays role-gated
 * on its own; this only decides what the route renders.
 */
export async function getEditorAccess(
  userId: string,
  siteId: string,
): Promise<"edit" | "view" | null> {
  try {
    const role = await getEffectiveSiteRole(prisma, userId, siteId);
    return role === "VIEWER" ? "view" : "edit";
  } catch (e) {
    // Deny on authorization failure; let real errors (DB, etc.) propagate so
    // an outage is not silently reported as "no access".
    if (e instanceof PermissionError) return null;
    throw e;
  }
}

