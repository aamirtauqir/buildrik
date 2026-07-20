import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const QA_EMAIL = "qa@buildrik.local";
const QA_PASSWORD = "qa-test-1234";

// A SECOND e2e account, for the onboarding fixture only.
//
// auth.setup.ts needs a user past the wizard; onboarding.setup.ts needs one
// inside it, and resets OnboardingState to get there. Both Playwright setup
// projects run concurrently, so while they shared one account they wrote the
// same row in opposite directions and whichever lost took its dependents with
// it — 81 tests skipped, silently, depending on who won the race.
//
// Self-provisioning alone does not fix that; it makes both fixtures write, so
// they race harder. They need separate accounts AND to own their own state.
const QA_ONB_EMAIL = "qa-onboarding@buildrik.local";

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

  // The onboarding fixture's own account. Its OnboardingState is deliberately
  // NOT seeded — onboarding.setup.ts upserts the state it needs on each run.
  const onbUser = await prisma.user.upsert({
    where: { email: QA_ONB_EMAIL },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      email: QA_ONB_EMAIL,
      fullName: "QA Onboarding Tester",
      displayName: "qa-onb",
      passwordHash,
      emailVerified: new Date(),
      provider: "email",
    },
  });

  const onbWorkspace = await prisma.workspace.upsert({
    where: { slug: "qa-onboarding-workspace" },
    update: {},
    create: {
      name: "QA Onboarding Workspace",
      slug: "qa-onboarding-workspace",
      ownerId: onbUser.id,
      plan: "FREE",
    },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: onbUser.id, workspaceId: onbWorkspace.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      userId: onbUser.id,
      workspaceId: onbWorkspace.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  console.log(`Seeded user ${QA_EMAIL} / ${QA_PASSWORD}`);
  console.log(`Seeded user ${QA_ONB_EMAIL} / ${QA_PASSWORD} (onboarding fixture)`);

  await seedHelpArticles();
  await seedTemplates();
}

// The Template gallery (templates.list → listTemplates(isActive)) was wired but
// never seeded, so the gallery was empty out-of-box — the editor-5features design
// review's #1 sin ("No items found" instead of real starter templates). These are
// real multi-page scaffolds in the canonical Page.blocks shape (a buildrick-page-root
// container wrapping <section> nodes — same shape the AI worker emits), so picking
// one creates a valid, non-broken site. Idempotent by slug. This is the safe,
// additive half of F2; collapsing the editor's hardcoded SITE_TEMPLATES into this
// model + rewiring TemplatesTab to read the server is the destructive half, left
// for a supervised migration (both reviewers flagged regression risk to useTemplate).

type SeedSection = { type: string; html: string };

/** Build a valid Page.blocks root from HTML sections (mirrors the AI worker). */
function pageBlocks(sections: SeedSection[]) {
  return {
    id: "root",
    type: "container",
    tagName: "div",
    classes: ["buildrick-page-root"],
    children: sections.map((sec, i) => ({
      id: `seed-${sec.type}-${i}`,
      type: "container",
      tagName: "section",
      classes: [`section-${sec.type}`],
      content: sec.html,
      children: [],
    })),
  };
}

type SeedPage = { name: string; slug: string; isHomePage?: boolean; sections: SeedSection[] };
type SeedTemplate = {
  slug: string;
  name: string;
  category: string;
  description: string;
  difficulty: string;
  pages: SeedPage[];
};

const SEED_TEMPLATES: SeedTemplate[] = [
  {
    slug: "studio-portfolio",
    name: "Studio Portfolio",
    category: "PORTFOLIO",
    difficulty: "BEGINNER",
    description: "A clean multi-page portfolio for designers, studios, and freelancers.",
    pages: [
      { name: "Home", slug: "home", isHomePage: true, sections: [
        { type: "hero", html: "<h1>Work that speaks for itself</h1><p>Selected projects from a studio that cares about the details.</p><a href='/work'>View work</a>" },
        { type: "featured", html: "<h2>Featured</h2><p>Three recent projects, hand-picked.</p>" },
        { type: "cta", html: "<h2>Have a project in mind?</h2><a href='/contact'>Start a conversation</a>" },
      ] },
      { name: "Work", slug: "work", sections: [
        { type: "gallery", html: "<h1>Work</h1><p>A selection of recent engagements.</p>" },
      ] },
      { name: "About", slug: "about", sections: [
        { type: "about", html: "<h1>About</h1><p>We are a small team focused on thoughtful, durable design.</p>" },
      ] },
      { name: "Contact", slug: "contact", sections: [
        { type: "contact", html: "<h1>Contact</h1><p>Tell us about your project.</p>" },
      ] },
    ],
  },
  {
    slug: "local-business",
    name: "Local Business",
    category: "BUSINESS",
    difficulty: "BEGINNER",
    description: "A straightforward site for a local service business: home, services, and contact.",
    pages: [
      { name: "Home", slug: "home", isHomePage: true, sections: [
        { type: "hero", html: "<h1>Trusted service in your neighborhood</h1><p>Reliable, friendly, and on time.</p><a href='/contact'>Get a quote</a>" },
        { type: "services", html: "<h2>What we do</h2><p>A short list of the services you offer.</p>" },
        { type: "proof", html: "<h2>What customers say</h2><p>Add a couple of short testimonials here.</p>" },
      ] },
      { name: "Services", slug: "services", sections: [
        { type: "services", html: "<h1>Services</h1><p>Describe each service and what's included.</p>" },
      ] },
      { name: "Contact", slug: "contact", sections: [
        { type: "contact", html: "<h1>Get in touch</h1><p>Phone, email, and hours.</p>" },
      ] },
    ],
  },
  {
    slug: "agency",
    name: "Agency",
    category: "AGENCY",
    difficulty: "INTERMEDIATE",
    description: "A multi-page agency site with services and case studies, built for client work.",
    pages: [
      { name: "Home", slug: "home", isHomePage: true, sections: [
        { type: "hero", html: "<h1>We build brands that grow</h1><p>Strategy, design, and delivery under one roof.</p><a href='/contact'>Work with us</a>" },
        { type: "services", html: "<h2>Capabilities</h2><p>Branding, web, and campaigns.</p>" },
        { type: "clients", html: "<h2>Selected clients</h2><p>Add client logos or names here.</p>" },
      ] },
      { name: "Services", slug: "services", sections: [
        { type: "services", html: "<h1>Services</h1><p>Outline your engagement model and offerings.</p>" },
      ] },
      { name: "Case Studies", slug: "case-studies", sections: [
        { type: "work", html: "<h1>Case studies</h1><p>Show the results you delivered for clients.</p>" },
      ] },
      { name: "Contact", slug: "contact", sections: [
        { type: "contact", html: "<h1>Start a project</h1><p>Tell us about your goals.</p>" },
      ] },
    ],
  },
  {
    slug: "bistro",
    name: "Bistro",
    category: "RESTAURANT",
    difficulty: "BEGINNER",
    description: "A warm restaurant site with a menu and reservations.",
    pages: [
      { name: "Home", slug: "home", isHomePage: true, sections: [
        { type: "hero", html: "<h1>Seasonal food, made with care</h1><p>Open for lunch and dinner.</p><a href='/reservations'>Reserve a table</a>" },
        { type: "highlights", html: "<h2>This week</h2><p>Feature a few seasonal dishes.</p>" },
      ] },
      { name: "Menu", slug: "menu", sections: [
        { type: "menu", html: "<h1>Menu</h1><p>List your courses and prices.</p>" },
      ] },
      { name: "Reservations", slug: "reservations", sections: [
        { type: "contact", html: "<h1>Reservations</h1><p>Hours, location, and booking details.</p>" },
      ] },
    ],
  },
];

async function seedTemplates() {
  for (const t of SEED_TEMPLATES) {
    const pages = t.pages.map((p, i) => ({
      name: p.name,
      slug: p.slug,
      position: i,
      isHomePage: p.isHomePage ?? i === 0,
      blocks: pageBlocks(p.sections),
    }));
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: { name: t.name, category: t.category, description: t.description, difficulty: t.difficulty, pages, isActive: true },
      create: { slug: t.slug, name: t.name, category: t.category, description: t.description, difficulty: t.difficulty, pages, isActive: true },
    });
  }
  console.log(`Seeded ${SEED_TEMPLATES.length} starter templates`);
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
    title: "Getting started with Buildrick",
    category: "getting-started",
    excerpt: "Create your first site, pick a starting point, and publish in minutes.",
    readTime: 4,
    content:
      "Welcome to Buildrick. Start from the dashboard by clicking New Site. You can begin from a blank canvas, choose a template, or let AI generate a first draft from a short description. Once the editor opens, add and arrange blocks, edit content inline, and use the inspector on the right to adjust styles. When you're happy, open the Publish panel to deploy it to your connected Vercel account, on your own domain.",
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
      "Open the Publish panel to run pre-publish checks (pages present, SEO configured, domain status, favicon) and deploy. Your site deploys into the Vercel account you connected in Settings › Integrations — publishing is blocked until that connection exists. Republishing redeploys the latest content; the previous version keeps serving until the new deploy is ready. To take a site offline, use Unpublish — your content stays saved as a draft.",
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
      "Buildrick has four roles. Owner is the workspace creator and has full control including transfer and deletion. Admin manages members, billing, and settings. Editor creates, edits, and publishes sites but can't manage billing or members. Viewer can view content but not change it. Roles are set when you invite someone and can be changed from the member actions menu by an Admin or Owner.",
  },
  {
    slug: "choosing-a-plan",
    title: "Choosing a plan",
    category: "billing",
    excerpt: "Compare Free, Pro, and Business limits.",
    readTime: 3,
    content:
      "Free is for trying Buildrick and small personal sites, with limits on sites, pages, AI generations, and storage. Pro raises every limit and unlocks custom domains, share-link passwords, and longer analytics retention. Business adds the highest limits, unlimited AI generations, and the most team seats. You can see exact limits on the Billing page, which also tracks your current usage against your plan.",
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
    excerpt: "Point your domain at Buildrick and verify DNS.",
    readTime: 5,
    content:
      "On a Pro or Business plan, open a site's Domains settings and add your domain. Buildrick shows the DNS records to add at your registrar — typically an A record for the apex and a CNAME for www. After you add them, verification runs automatically and can take from a few minutes to a few hours depending on DNS propagation. Once verified, your published site serves from the custom domain with SSL provisioned automatically.",
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
      "Rather than styling each element by hand, Buildrick lets you define tokens — reusable colors, type scales, and spacing values — and bind elements to them. Update a token once and every element using it updates everywhere. This keeps a site visually consistent and makes global restyles fast. Manage tokens and presets from the Styles section of the editor.",
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
