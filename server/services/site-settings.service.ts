import { prisma } from "@/lib/prisma";

export async function getSiteSettings(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      metaTitleTemplate: true,
      ogImage: true,
      headCode: true,
      bodyCode: true,
      socialLinks: true,
      publishedPassword: true,
      touchIcon: true,
      workspace: { select: { plan: true } },
    },
  });

  if (!site) throw new Error("SITE_NOT_FOUND");

  const { workspace, ...rest } = site;
  return { ...rest, plan: workspace.plan };
}

export async function updateSiteSettings(
  siteId: string,
  data: {
    name?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaTitleTemplate?: string;
    ogImage?: string | null;
    headCode?: string;
    bodyCode?: string;
    socialLinks?: Record<string, string>;
    publishedPassword?: string | null;
    touchIcon?: string | null;
  }
) {
  if (data.headCode !== undefined || data.bodyCode !== undefined || data.slug) {
    const current = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        slug: true,
        workspace: { select: { plan: true } },
      },
    });

    if (data.headCode !== undefined || data.bodyCode !== undefined) {
      const plan = current?.workspace?.plan ?? "FREE";
      if (plan === "FREE") throw new Error("CUSTOM_CODE_NOT_AVAILABLE");
    }

    if (data.slug && current && current.slug !== data.slug) {
      await prisma.slugHistory.create({
        data: {
          siteId,
          oldSlug: current.slug,
          newSlug: data.slug,
        },
      }).catch(() => {});
    }
  }

  return prisma.site.update({
    where: { id: siteId },
    data,
  });
}
