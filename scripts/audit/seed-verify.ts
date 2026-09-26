/**
 * Phase 2 (V0) verify-environment seed.
 *
 * Idempotent (upserts by email/slug) seed for the `buildrik_verify` database
 * used by the 2026-09-25 audit-fix runtime verification pass. NEVER point
 * this at DATABASE_URL from .env.local — it must be run with DATABASE_URL
 * overridden to the buildrik_verify connection string:
 *
 *   DATABASE_URL="postgresql://.../buildrik_verify" npx tsx scripts/audit/seed-verify.ts
 *
 * Writes created/updated ids to
 * docs/audits/2026-09-25-full-audit/verify/seed-ids.json.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const prisma = new PrismaClient();

const PASSWORD = "verify-1234";
const OUT_PATH = join(
  process.cwd(),
  "docs/audits/2026-09-25-full-audit/verify/seed-ids.json"
);

function requireVerifyDb() {
  const url = process.env.DATABASE_URL ?? "";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`DATABASE_URL is not a valid URL: ${url}`);
  }
  const host = parsed.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      `Refusing to seed: DATABASE_URL host "${host}" is not localhost. This script only runs against a local Postgres.`
    );
  }
  const dbName = parsed.pathname.replace(/^\//, "");
  if (dbName !== "buildrik_verify") {
    throw new Error(
      `Refusing to seed: DATABASE_URL points at database "${dbName}", not "buildrik_verify". This script must never touch the dev database.`
    );
  }
}

// ---------------------------------------------------------------------------
// Block-tree helpers (real ElementData trees, not opaque HTML strings — the
// point of V0 is verifying the real editor renders real block trees).
// ---------------------------------------------------------------------------

let nodeCounter = 0;
function nid(prefix: string) {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

function heading(text: string, level: "h1" | "h2" = "h1") {
  return {
    id: nid("heading"),
    type: "heading",
    tagName: level,
    content: text,
    contentFormat: "text" as const,
    children: [],
  };
}

function paragraph(text: string) {
  return {
    id: nid("text"),
    type: "text",
    tagName: "p",
    content: text,
    contentFormat: "text" as const,
    children: [],
  };
}

function image(alt: string) {
  return {
    id: nid("image"),
    type: "image",
    tagName: "img",
    attributes: {
      src: "https://placehold.co/800x450",
      alt,
    },
    children: [],
  };
}

function link(text: string, href: string) {
  return {
    id: nid("link"),
    type: "link",
    tagName: "a",
    attributes: { href },
    content: text,
    contentFormat: "text" as const,
    children: [],
  };
}

/** formBlockId links this node to a real FormBlock row created alongside it. */
function formElement(formBlockId: string) {
  return {
    id: nid("form"),
    type: "form",
    tagName: "form",
    attributes: { "data-form-block-id": formBlockId },
    children: [
      {
        id: nid("input"),
        type: "input",
        tagName: "input",
        attributes: { name: "email", type: "email", placeholder: "Email" },
        children: [],
      },
      {
        id: nid("button"),
        type: "button",
        tagName: "button",
        content: "Submit",
        contentFormat: "text" as const,
        children: [],
      },
    ],
  };
}

function slider() {
  return {
    id: nid("slider"),
    type: "slider",
    tagName: "div",
    data: {
      slides: [
        { id: nid("slide"), src: "https://placehold.co/1200x500?text=Slide+1" },
        { id: nid("slide"), src: "https://placehold.co/1200x500?text=Slide+2" },
      ],
    },
    children: [],
  };
}

function section(children: unknown[]) {
  return {
    id: nid("section"),
    type: "section",
    tagName: "section",
    children,
  };
}

function pageRoot(sections: unknown[]) {
  return {
    id: "root",
    type: "container",
    tagName: "div",
    classes: ["buildrick-page-root"],
    children: sections,
  };
}

async function main() {
  requireVerifyDb();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const ids: Record<string, unknown> = {};

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  async function upsertUser(email: string, fullName: string, opts: { emailVerified?: Date | null } = {}) {
    const emailVerified = opts.emailVerified === undefined ? new Date() : opts.emailVerified;
    return prisma.user.upsert({
      where: { email },
      update: { passwordHash, emailVerified, lastLoginAt: null },
      create: {
        email,
        fullName,
        displayName: fullName.split(" ")[0],
        passwordHash,
        emailVerified,
        lastLoginAt: null,
        provider: "email",
      },
    });
  }

  const owner = await upsertUser("owner@verify.local", "Verify Owner");
  const admin = await upsertUser("admin@verify.local", "Verify Admin");
  const editor = await upsertUser("editor@verify.local", "Verify Editor");
  const viewer = await upsertUser("viewer@verify.local", "Verify Viewer");
  const scoped = await upsertUser("scoped@verify.local", "Verify Scoped");
  const designer = await upsertUser("designer@verify.local", "Verify Designer");
  const outsider = await upsertUser("outsider@verify.local", "Verify Outsider");
  const unverified = await upsertUser("unverified@verify.local", "Verify Unverified", {
    emailVerified: null,
  });

  ids.users = {
    owner: owner.id,
    admin: admin.id,
    editor: editor.id,
    viewer: viewer.id,
    scoped: scoped.id,
    designer: designer.id,
    outsider: outsider.id,
    unverified: unverified.id,
  };

  // -------------------------------------------------------------------------
  // Workspaces
  // -------------------------------------------------------------------------
  const verifyWs = await prisma.workspace.upsert({
    where: { slug: "verify-ws" },
    update: { name: "Verify WS", ownerId: owner.id },
    create: { name: "Verify WS", slug: "verify-ws", ownerId: owner.id, plan: "PRO" },
  });

  const outsiderWs = await prisma.workspace.upsert({
    where: { slug: "outsider-ws" },
    update: { name: "Outsider WS", ownerId: outsider.id },
    create: { name: "Outsider WS", slug: "outsider-ws", ownerId: outsider.id, plan: "FREE" },
  });

  const agencyWs = await prisma.workspace.upsert({
    where: { slug: "agency-ws" },
    update: { name: "Agency WS", ownerId: owner.id, editsRequireApproval: true },
    create: {
      name: "Agency WS",
      slug: "agency-ws",
      ownerId: owner.id,
      plan: "BUSINESS",
      editsRequireApproval: true,
    },
  });

  ids.workspaces = { verifyWs: verifyWs.id, outsiderWs: outsiderWs.id, agencyWs: agencyWs.id };

  async function upsertMember(userId: string, workspaceId: string, role: string) {
    return prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId, workspaceId } },
      update: { role, status: "ACTIVE" },
      create: { userId, workspaceId, role, status: "ACTIVE" },
    });
  }

  await upsertMember(owner.id, verifyWs.id, "OWNER");
  const adminMember = await upsertMember(admin.id, verifyWs.id, "ADMIN");
  const editorMember = await upsertMember(editor.id, verifyWs.id, "EDITOR");
  const viewerMember = await upsertMember(viewer.id, verifyWs.id, "VIEWER");
  const scopedMember = await upsertMember(scoped.id, verifyWs.id, "EDITOR");
  const designerMember = await upsertMember(designer.id, verifyWs.id, "DESIGNER");

  await upsertMember(outsider.id, outsiderWs.id, "OWNER");
  await upsertMember(owner.id, agencyWs.id, "OWNER");

  ids.members = {
    admin: adminMember.id,
    editor: editorMember.id,
    viewer: viewerMember.id,
    scoped: scopedMember.id,
    designer: designerMember.id,
  };

  // Agency layer feature flag on Agency WS.
  await prisma.workspaceFeature.upsert({
    where: { workspaceId_key: { workspaceId: agencyWs.id, key: "agency_layer" } },
    update: { enabled: true },
    create: { workspaceId: agencyWs.id, key: "agency_layer", enabled: true },
  });

  // -------------------------------------------------------------------------
  // Sites + pages
  // -------------------------------------------------------------------------
  async function upsertSite(
    slug: string,
    name: string,
    workspaceId: string,
    createdBy: string
  ) {
    const existing = await prisma.site.findUnique({ where: { slug } });
    if (existing) {
      return prisma.site.update({ where: { slug }, data: { name, workspaceId, createdBy } });
    }
    return prisma.site.create({
      data: { slug, name, workspaceId, createdBy, status: "DRAFT", creationMethod: "BLANK" },
    });
  }

  const s1 = await upsertSite("verify-site-one", "Verify Site One", verifyWs.id, owner.id);
  const s2 = await upsertSite("verify-site-two", "Verify Site Two", verifyWs.id, owner.id);
  const s3 = await upsertSite("verify-site-three", "Verify Site Three", agencyWs.id, owner.id);
  const s4 = await upsertSite("verify-site-four", "Verify Site Four", outsiderWs.id, outsider.id);

  ids.sites = { s1: s1.id, s2: s2.id, s3: s3.id, s4: s4.id };

  // scoped@ gets a SitePermission scoping them to S1 only.
  await prisma.sitePermission.upsert({
    where: { memberId_siteId: { memberId: scopedMember.id, siteId: s1.id } },
    update: { roleOverride: "EDITOR", grantedBy: owner.id, grantedByName: "Verify Owner" },
    create: {
      memberId: scopedMember.id,
      siteId: s1.id,
      roleOverride: "EDITOR",
      grantedBy: owner.id,
      grantedByName: "Verify Owner",
    },
  });

  async function upsertPage(
    siteId: string,
    slug: string,
    name: string,
    position: number,
    isHomePage: boolean,
    blocks: unknown
  ) {
    const existing = await prisma.page.findUnique({ where: { siteId_slug: { siteId, slug } } });
    if (existing) {
      return prisma.page.update({ where: { id: existing.id }, data: { name, position, isHomePage, blocks: blocks as never } });
    }
    return prisma.page.create({
      data: { siteId, slug, name, position, isHomePage, blocks: blocks as never },
    });
  }

  // S1 pages: Home (heading/text/image/link/form/slider), About, Contact.
  const s1HomeFormBlockId = `${s1.id}-home-contact-form`;
  await prisma.formBlock.upsert({
    where: { id: s1HomeFormBlockId },
    update: {},
    create: {
      id: s1HomeFormBlockId,
      siteId: s1.id,
      blockId: "verify-home-form",
      name: "Verify contact form",
      fields: [
        { name: "email", type: "email", label: "Email", required: true },
      ],
    },
  });

  const s1Home = pageRoot([
    section([
      heading("Verify Site One", "h1"),
      paragraph("A seeded site for Phase 2 runtime verification."),
      image("Hero image"),
      link("Learn more", "/about"),
    ]),
    section([heading("Gallery", "h2"), slider()]),
    section([heading("Get in touch", "h2"), formElement(s1HomeFormBlockId)]),
  ]);
  await upsertPage(s1.id, "home", "Home", 0, true, s1Home);

  await upsertPage(
    s1.id,
    "about",
    "About",
    1,
    false,
    pageRoot([section([heading("About", "h1"), paragraph("About Verify Site One."), image("About image"), link("Back home", "/")])])
  );

  await upsertPage(
    s1.id,
    "contact",
    "Contact",
    2,
    false,
    pageRoot([section([heading("Contact", "h1"), paragraph("Reach out to us."), link("Email us", "mailto:hello@verify.local")])])
  );

  // S2 pages: Home, Services.
  await upsertPage(
    s2.id,
    "home",
    "Home",
    0,
    true,
    pageRoot([
      section([
        heading("Verify Site Two", "h1"),
        paragraph("Second seeded site in Verify WS."),
        image("Hero image"),
        link("See services", "/services"),
      ]),
    ])
  );
  await upsertPage(
    s2.id,
    "services",
    "Services",
    1,
    false,
    pageRoot([section([heading("Services", "h1"), paragraph("What we offer."), image("Services image")])])
  );

  // S3 (Agency WS): single page.
  await upsertPage(
    s3.id,
    "home",
    "Home",
    0,
    true,
    pageRoot([section([heading("Verify Site Three", "h1"), paragraph("Agency WS site."), image("Agency hero")])])
  );

  // S4 (Outsider WS): single page.
  await upsertPage(
    s4.id,
    "home",
    "Home",
    0,
    true,
    pageRoot([section([heading("Verify Site Four", "h1"), paragraph("Outsider WS site."), image("Outsider hero")])])
  );

  // -------------------------------------------------------------------------
  // CMS collection + 3 entries on S1
  // -------------------------------------------------------------------------
  const collection = await prisma.cmsCollection.upsert({
    where: { siteId_slug: { siteId: s1.id, slug: "posts" } },
    update: {},
    create: {
      siteId: s1.id,
      name: "Posts",
      slug: "posts",
      description: "Verify blog posts collection",
      fields: [
        { id: "title", name: "Title", type: "text" },
        { id: "body", name: "Body", type: "richtext" },
      ],
    },
  });

  const existingEntries = await prisma.cmsEntry.findMany({ where: { collectionId: collection.id } });
  const entryIds: string[] = existingEntries.map((e) => e.id);
  if (existingEntries.length < 3) {
    for (let i = existingEntries.length; i < 3; i++) {
      const entry = await prisma.cmsEntry.create({
        data: {
          collectionId: collection.id,
          data: { title: `Verify Post ${i + 1}`, body: `<p>Body of verify post ${i + 1}.</p>` },
          status: i === 0 ? "PUBLISHED" : "DRAFT",
        },
      });
      entryIds.push(entry.id);
    }
  }

  ids.cms = { collection: collection.id, entries: entryIds };

  writeOut(ids);
}

function writeOut(ids: Record<string, unknown>) {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(ids, null, 2) + "\n");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(JSON.stringify(ids, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
