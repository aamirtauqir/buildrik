import { prisma } from "@/lib/prisma";

export async function getSiteSettings(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      slug: true,
      metaTitleTemplate: true,
      headCode: true,
      bodyCode: true,
      socialLinks: true,
    },
  });

  if (!site) throw new Error("SITE_NOT_FOUND");
  return site;
}

export async function updateSiteSettings(
  siteId: string,
  data: {
    name?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaTitleTemplate?: string;
    headCode?: string;
    bodyCode?: string;
    socialLinks?: Record<string, string>;
  }
) {
  return prisma.site.update({
    where: { id: siteId },
    data,
  });
}
