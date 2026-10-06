import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { QA_EMAIL } from "./accounts";

/**
 * Brand Part 1a, flows 1 and 2 (spec §5, test 36). Needs a dashboard started
 * with `BRAND_TOKENS_V2=on`: both flows open a v5 site, which migrates on load
 * only when the server says so. With the switch off the site opens read-only
 * and `openBrand` fails with "BRAND_TOKENS_V2 is off on the test server".
 *
 * Run LOCALLY ONLY — it seeds sites through this machine's database:
 *   PW_FORCE_LOCAL=1 PW_BASE_URL=http://localhost:<port> \
 *     npx playwright test e2e/brand-tokens.spec.ts --project=chromium
 * `.env.local` holds BrowserStack credentials, and with them the config has
 * only bs-* projects: `--project=chromium` then errors, and a run without
 * `--project` would go to the cloud grid. PW_FORCE_LOCAL=1 keeps the local
 * projects; the guard below fails any bs-* run instead of letting it pass.
 *
 * Each test seeds its own v5 site in the QA workspace (the `custom-colours`
 * migration fixture as its tokens) and deletes it afterwards, so nothing here
 * migrates a site somebody else is using.
 *
 * `fixtures/brand-v5-export-tokens.json` is the v5 colour each var resolved to
 * before migration: v5 emitted every token as `cssVar: value`, so the expected
 * colour is the fixture's own `value` — derived from the stored v5 values, not
 * measured from a v5 build. (Live check, 2026-10-06: three real v5 sites
 * exported with the switch off resolved to their stored values, 54/54 each.)
 */

const SHARED_FIXTURE = path.resolve(__dirname, "..", "..", "shared", "tokens", "__tests__", "__fixtures__", "custom-colours.json");
const EXPECTED: Record<string, string> = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "fixtures", "brand-v5-export-tokens.json"), "utf8"),
);
const PRIMARY_VAR = "--buildrick-design-color-primary";

test.use({ viewport: { width: 1440, height: 900 } });
test.setTimeout(240_000);

const prisma = new PrismaClient();
const created: string[] = [];

async function seedV5Site(): Promise<string> {
  const user = await prisma.user.findFirst({ where: { email: QA_EMAIL }, select: { id: true } });
  if (!user) throw new Error(`No user "${QA_EMAIL}" — seed it before running e2e.`);
  const member = await prisma.workspaceMember.findFirst({ where: { userId: user.id }, select: { workspaceId: true } });
  if (!member) throw new Error(`${QA_EMAIL} has no workspace.`);
  const tag = randomUUID().slice(0, 8);
  const button = {
    id: "e2e-brand-button",
    type: "button",
    tagName: "button",
    content: "Book now",
    styles: { color: "#ffffff", "background-color": `var(${PRIMARY_VAR})`, "padding-left": "16px", "padding-right": "16px" },
    children: [],
  };
  const link = {
    id: "e2e-brand-link",
    type: "link",
    tagName: "a",
    content: "Read more",
    styles: { color: `var(${PRIMARY_VAR})` },
    attributes: { href: "#" },
    children: [],
  };
  const site = await prisma.site.create({
    data: {
      name: `brand-v5-fixture ${tag}`,
      slug: `brand-v5-fixture-${tag}`,
      workspaceId: member.workspaceId,
      createdBy: user.id,
      pages: 1,
      projectSettings: {
        designTokens: JSON.parse(fs.readFileSync(SHARED_FIXTURE, "utf8")),
        designTokensSchemaVersion: 5,
      },
    },
  });
  await prisma.page.create({
    data: {
      siteId: site.id,
      name: "Home",
      slug: "home",
      position: 0,
      isHomePage: true,
      blocks: {
        id: `root-${tag}`,
        type: "container",
        tagName: "div",
        classes: ["buildrick-page-root"],
        styles: {},
        children: [
          { id: "e2e-brand-heading", type: "heading", tagName: "h2", content: "Brand fixture", styles: {}, children: [] },
          button,
          link,
        ],
      },
    },
  });
  created.push(site.id);
  return site.id;
}

/** The QA workspace has a real Vercel connection — nothing here may publish.
 *  Returns the number of publish requests the page attempted (all refused). */
async function blockPublish(page: Page) {
  const hits = { count: 0 };
  await page.route("**/api/trpc/**sites.publish**", (route) => {
    hits.count++;
    return route.fulfill({ status: 403, body: "publish blocked in e2e" });
  });
  return hits;
}

async function openEditor(page: Page, siteId: string) {
  await page.goto(`/edit/${siteId}`);
  await page.locator("#bk-site-tokens").waitFor({ state: "attached", timeout: 120_000 });
  await page.locator('.buildrick-canvas [data-buildrick-id="e2e-brand-button"]').waitFor({ timeout: 60_000 });
  // The dev-only feedback toolbar sits over the bottom-right corner and owns a
  // button whose name contains "Change".
  await page.addStyleTag({ content: "[data-agentation-root]{display:none!important}" });
  const tip = page.getByRole("button", { name: /got it/i });
  if (await tip.count()) await tip.first().click();
}

const canvasColour = (page: Page, id: string, prop: "backgroundColor" | "color") =>
  page.evaluate(
    ([elId, p]) => {
      const el = document.querySelector(`.buildrick-canvas [data-buildrick-id="${elId}"]`);
      return el ? getComputedStyle(el)[p as "color"] : null;
    },
    [id, prop] as const,
  );

/** Opens Brand and fails fast when the server's kill switch is off: a v5
 *  site then opens read-only with the paused notice instead of migrating. */
async function openBrand(page: Page) {
  await page.getByTestId("rail-tab-design").click();
  // Fully rendered: the token table lists Primary.
  await expect(page.getByText("color-primary", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  expect(
    await page.getByText("Brand editing is paused", { exact: false }).count(),
    "BRAND_TOKENS_V2 is off on the test server",
  ).toBe(0);
}

test.describe("Brand Part 1a", () => {
  let publishHits: { count: number };

  test.beforeEach(async ({ page }, testInfo) => {
    expect(
      testInfo.project.name.startsWith("bs-"),
      "brand-tokens.spec.ts seeds this machine's database — run it locally with PW_FORCE_LOCAL=1",
    ).toBe(false);
    publishHits = await blockPublish(page);
  });

  test.afterEach(() => {
    expect(publishHits.count, "no sites.publish request may be made").toBe(0);
  });

  test.afterAll(async () => {
    if (created.length) await prisma.site.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  test("changing Primary repaints the canvas and one ⌘Z restores it", async ({ page }) => {
    const siteId = await seedV5Site();
    await openEditor(page, siteId);
    const before = await canvasColour(page, "e2e-brand-button", "backgroundColor");
    expect(before).toBe(EXPECTED[PRIMARY_VAR]);
    expect(await canvasColour(page, "e2e-brand-link", "color")).toBe(EXPECTED[PRIMARY_VAR]);

    await openBrand(page);
    await page.getByText("color-primary", { exact: true }).first().click();
    await page.getByRole("button", { name: "Change", exact: true }).first().click();
    const picker = page.getByRole("dialog").filter({ hasText: "Hex" });
    const hex = picker.locator("input[type=text]").first();
    await hex.fill("#C2410C");
    await hex.press("Enter");
    await picker.getByRole("button", { name: "Apply" }).click();

    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe("rgb(194, 65, 12)");
    await expect.poll(() => canvasColour(page, "e2e-brand-link", "color")).toBe("rgb(194, 65, 12)");

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(before);
    await expect.poll(() => canvasColour(page, "e2e-brand-link", "color")).toBe(before);
  });

  test("a v5 site migrates and its export resolves every colour exactly as before", async ({ page }) => {
    const siteId = await seedV5Site();
    await openEditor(page, siteId);
    await openBrand(page);

    // The migration is saved (with its rollback snapshot) by the first autosave.
    await expect
      .poll(
        async () => {
          const row = await prisma.site.findUnique({ where: { id: siteId }, select: { projectSettings: true } });
          return (row?.projectSettings as { designTokensSchemaVersion?: number } | null)?.designTokensSchemaVersion;
        },
        { timeout: 60_000 },
      )
      .toBe(6);
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId, reason: "migration" } })).toBe(1);

    // The Brand live preview is the export document (`composer.exportHTML`).
    const frame = page.frameLocator('[data-testid="brand-live-preview-frame"] iframe');
    await frame.locator('[data-buildrick-id="e2e-brand-button"]').waitFor({ timeout: 30_000 });
    const exported = await frame.locator("html").evaluate((root) => root.outerHTML);
    expect(exported).not.toContain("prefers-color-scheme");

    const resolve = (vars: string[]) =>
      frame.locator("body").evaluate((body, vs) => {
        const out: Record<string, string> = {};
        for (const v of vs) {
          const el = body.ownerDocument.createElement("div");
          el.style.color = `var(${v})`;
          body.appendChild(el);
          out[v] = getComputedStyle(el).color;
          el.remove();
        }
        return out;
      }, vars);
    const resolved = await resolve(Object.keys(EXPECTED));
    for (const [cssVar, value] of Object.entries(EXPECTED)) expect(resolved[cssVar], cssVar).toBe(value);

    // Canvas = export for the bound elements.
    const exportedButton = await frame
      .locator('[data-buildrick-id="e2e-brand-button"]')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(exportedButton).toBe(await canvasColour(page, "e2e-brand-button", "backgroundColor"));
  });
});
