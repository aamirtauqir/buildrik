import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const QA_EMAIL = "qa@buildrik.local";
const QA_PASSWORD = "qa-test-1234";

async function main() {
  const passwordHash = await bcrypt.hash(QA_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: QA_EMAIL },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      email: QA_EMAIL,
      fullName: "QA Tester",
      displayName: "qa",
      passwordHash,
      emailVerified: new Date(),
      provider: "email",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "qa-workspace" },
    update: {},
    create: {
      name: "QA Workspace",
      slug: "qa-workspace",
      ownerId: user.id,
      plan: "FREE",
    },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  console.log(`Seeded user ${QA_EMAIL} / ${QA_PASSWORD}`);

  await seedHelpArticles();
}

// Help center was wired end-to-end (search, category tiles, [slug] pages,
// feedback) but the HelpArticle table was never seeded, so every surface was
// empty. Category keys must match HELP_CATEGORIES in shared/schemas/help.ts.
const HELP_ARTICLES: Array<{
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: number;
  content: string;
}> = [
  {
    slug: "getting-started-overview",
    title: "Getting started with Buildrik",
    category: "getting-started",
    excerpt: "Create your first site, pick a starting point, and publish in minutes.",
    readTime: 4,
    content:
      "Welcome to Buildrik. Start from the dashboard by clicking New Site. You can begin from a blank canvas, choose a template, or let AI generate a first draft from a short description. Once the editor opens, add and arrange blocks, edit content inline, and use the inspector on the right to adjust styles. When you're happy, open the Publish panel to push your site live on a buildrik.app subdomain or your own connected domain.",
  },
  {
    slug: "creating-your-first-site",
    title: "Creating your first site",
    category: "getting-started",
    excerpt: "The three ways to start a site and when to use each.",
    readTime: 3,
    content:
      "There are three ways to start: Blank gives you an empty page for full control; Template starts from a professionally designed layout you can customize; AI asks a few questions about your business and drafts pages for you. Templates and AI are the fastest way to a complete site, while Blank suits pixel-perfect custom work. You can always add, remove, or restructure pages later from the Pages panel.",
  },
  {
    slug: "managing-sites-dashboard",
    title: "Managing sites from the dashboard",
    category: "sites",
    excerpt: "Duplicate, archive, rename, and organize your sites.",
    readTime: 3,
    content:
      "The Sites dashboard lists every site in your workspace. Use the menu on each card to rename, duplicate, archive, or delete a site. Archived sites are hidden from the main list but keep all their content and can be restored at any time. Duplicating copies all pages and settings into a new draft so you can experiment without touching the original.",
  },
  {
    slug: "publishing-and-unpublishing",
    title: "Publishing and unpublishing",
    category: "sites",
    excerpt: "How publishing works, pre-publish checks, and taking a site offline.",
    readTime: 4,
    content:
      "Open the Publish panel to run pre-publish checks (pages present, SEO configured, domain status, favicon) and deploy. Your site goes live on a buildrik.app subdomain unless you've connected and verified a custom domain. Republishing redeploys the latest content; the previous version keeps serving until the new deploy is ready. To take a site offline, use Unpublish — your content stays saved as a draft.",
  },
  {
    slug: "inviting-team-members",
    title: "Inviting team members",
    category: "team",
    excerpt: "Send invites and choose the right role for each person.",
    readTime: 3,
    content:
      "Open Team and click Invite Member to send email invitations. Each invite carries a role: Admin can manage the workspace, members, and billing; Editor can build and publish sites; Viewer has read-only access. You can change a member's role later from the member menu, and revoke access or remove a member at any time. Pending invitations can be resent or revoked from the same page.",
  },
  {
    slug: "roles-and-permissions",
    title: "Roles and permissions",
    category: "team",
    excerpt: "What Owner, Admin, Editor, and Viewer can each do.",
    readTime: 3,
    content:
      "Buildrik has four roles. Owner is the workspace creator and has full control including transfer and deletion. Admin manages members, billing, and settings. Editor creates, edits, and publishes sites but can't manage billing or members. Viewer can view content but not change it. Roles are set when you invite someone and can be changed from the member actions menu by an Admin or Owner.",
  },
  {
    slug: "choosing-a-plan",
    title: "Choosing a plan",
    category: "billing",
    excerpt: "Compare Free, Pro, and Business limits.",
    readTime: 3,
    content:
      "Free is for trying Buildrik and small personal sites, with limits on sites, pages, AI generations, and storage. Pro raises every limit and unlocks custom domains, share-link passwords, and longer analytics retention. Business adds the highest limits, unlimited AI generations, and the most team seats. You can see exact limits on the Billing page, which also tracks your current usage against your plan.",
  },
  {
    slug: "managing-billing",
    title: "Managing your subscription",
    category: "billing",
    excerpt: "Invoices, usage, and changing your plan.",
    readTime: 2,
    content:
      "The Billing page shows your current plan, usage against each limit, and your invoice history. Invoices are generated for each billing period and include a downloadable PDF. If you approach a plan limit you'll see a warning so you can upgrade before hitting it. Plan changes take effect according to your billing interval.",
  },
  {
    slug: "connecting-a-domain",
    title: "Connecting a custom domain",
    category: "domains",
    excerpt: "Point your domain at Buildrik and verify DNS.",
    readTime: 5,
    content:
      "On a Pro or Business plan, open a site's Domains settings and add your domain. Buildrik shows the DNS records to add at your registrar — typically an A record for the apex and a CNAME for www. After you add them, verification runs automatically and can take from a few minutes to a few hours depending on DNS propagation. Once verified, your published site serves from the custom domain with SSL provisioned automatically.",
  },
  {
    slug: "dns-and-ssl-troubleshooting",
    title: "DNS and SSL troubleshooting",
    category: "domains",
    excerpt: "What to check when a domain won't verify.",
    readTime: 4,
    content:
      "If a domain stays unverified, confirm the DNS records match exactly what the Domains panel shows, with no extra trailing dots or wrong record types. Propagation can lag, so wait and re-check. Remove conflicting records (such as an old A record pointing elsewhere). SSL is issued after verification succeeds; if it's pending, give it a little more time. If problems persist, disconnect and reconnect the domain to restart the process.",
  },
  {
    slug: "editor-basics",
    title: "Editor basics",
    category: "editor",
    excerpt: "Blocks, the inspector, and inline editing.",
    readTime: 4,
    content:
      "The editor canvas shows your page as visitors will see it. Add blocks from the insert menu, then select any element to edit it. Double-click text to edit it inline. The inspector on the right controls layout, spacing, colors, and typography for the selected element. Changes save automatically. Use undo/redo for quick corrections, and Preview to see the page without editor chrome.",
  },
  {
    slug: "using-the-design-system",
    title: "Working with styles and tokens",
    category: "editor",
    excerpt: "Keep a site consistent with shared design tokens.",
    readTime: 4,
    content:
      "Rather than styling each element by hand, Buildrik lets you define tokens — reusable colors, type scales, and spacing values — and bind elements to them. Update a token once and every element using it updates everywhere. This keeps a site visually consistent and makes global restyles fast. Manage tokens and presets from the Styles section of the editor.",
  },
];

async function seedHelpArticles() {
  for (const a of HELP_ARTICLES) {
    await prisma.helpArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, category: a.category, excerpt: a.excerpt, readTime: a.readTime, content: a.content },
      create: a,
    });
  }
  console.log(`Seeded ${HELP_ARTICLES.length} help articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
