import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient, type Prisma } from "@prisma/client";
import { QA_EMAIL } from "./accounts";

/**
 * Brand Part 1a, flows 1 and 2 (spec §5, test 36). Needs a dashboard started
 * with the switch on for the QA workspace (`BRAND_TOKENS_V2=on`, or its id in
 * `BRAND_TOKENS_V2_WORKSPACES`): both flows open a v5 site, which migrates on
 * load only when the server says so. With the switch off the site opens read-only
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

/** The single-file HTML the editor's own Export dialog downloads (Site menu →
 *  Export site… → the default HTML format's primary button). */
async function downloadSingleFileExport(page: Page): Promise<string> {
  await page.getByTestId("site-menu-trigger").click();
  await page.getByTestId("site-menu-export-code").click();
  const primary = page.getByTestId("export-primary");
  await expect(primary).toBeEnabled({ timeout: 30_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), primary.click()]);
  const file = await download.path();
  if (!file) throw new Error("export download has no file");
  return fs.readFileSync(file, "utf8");
}

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

test.describe("Brand Part 1a", () => {
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

    /* The real export: the single-file HTML the editor's Export dialog
       downloads. It is loaded on its own in a fresh page — not the Brand live
       preview, whose staged block (always Dark "auto") sits on top of the
       export and would answer instead of it — with the colour scheme pinned
       both ways, so no prefers-color-scheme block can decide the result. */
    // Brand is a full-page view over the header; leave it for the Site menu.
    await page.getByTestId("brand-back-link").click();
    await expect(page.getByTestId("brand-panel")).toHaveCount(0);
    const exported = await downloadSingleFileExport(page);
    expect(exported).toContain("--buildrick-design-");
    expect(exported).not.toContain("prefers-color-scheme");
    expect(exported).not.toContain("data-bk-staged");

    const exportPage = await page.context().newPage();
    await exportPage.route("**/*", (route) => route.abort());
    for (const colorScheme of ["light", "dark"] as const) {
      await exportPage.emulateMedia({ colorScheme });
      await exportPage.setContent(exported, { waitUntil: "domcontentloaded" });
      const resolved = await exportPage.evaluate((vars) => {
        const out: Record<string, string> = {};
        for (const v of vars) {
          const el = document.createElement("div");
          el.style.color = `var(${v})`;
          document.body.appendChild(el);
          out[v] = getComputedStyle(el).color;
          el.remove();
        }
        return out;
      }, Object.keys(EXPECTED));
      for (const [cssVar, value] of Object.entries(EXPECTED)) expect(resolved[cssVar], `${cssVar} (${colorScheme})`).toBe(value);

      // Canvas = export for the bound elements.
      const exportedButton = await exportPage
        .locator('[data-buildrick-id="e2e-brand-button"]')
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(exportedButton).toBe(await canvasColour(page, "e2e-brand-button", "backgroundColor"));
    }
    await exportPage.close();
  });
});

// ── Parts 1b + 1c ─────────────────────────────────────────────────────────────

type Node = Prisma.InputJsonObject;

/** A custom semantic colour with no dark value — what Dark Auto has to fill. */
const BRAND_X = {
  id: "color-brand-x",
  name: "Brand X",
  kind: "color",
  layer: "semantic",
  modes: { light: { value: "#C2410C" } },
  category: "colors",
  cssVar: "--buildrick-design-color-brand-x",
  type: "color",
  group: "brand",
};

const BUTTON: Node = {
  id: "e2e-brand-button",
  type: "button",
  tagName: "button",
  content: "Book now",
  styles: { color: "#ffffff", "background-color": `var(${PRIMARY_VAR})`, "padding-left": "16px", "padding-right": "16px" },
  children: [],
};
const BRAND_X_HEADING: Node = {
  id: "e2e-brand-heading",
  type: "heading",
  tagName: "h1",
  content: "Brand fixture",
  styles: { color: `var(${BRAND_X.cssVar})` },
  children: [],
};

/** A v6 site (already migrated): its own tokens are stored over the seed. */
async function seedV6Site(opts: { darkMode?: "auto" | "off"; tokens?: Prisma.InputJsonValue[]; children?: Node[] } = {}): Promise<string> {
  const user = await prisma.user.findFirst({ where: { email: QA_EMAIL }, select: { id: true } });
  if (!user) throw new Error(`No user "${QA_EMAIL}" — seed it before running e2e.`);
  const member = await prisma.workspaceMember.findFirst({ where: { userId: user.id }, select: { workspaceId: true } });
  if (!member) throw new Error(`${QA_EMAIL} has no workspace.`);
  const tag = randomUUID().slice(0, 8);
  const site = await prisma.site.create({
    data: {
      name: `brand-v6-fixture ${tag}`,
      slug: `brand-v6-fixture-${tag}`,
      workspaceId: member.workspaceId,
      createdBy: user.id,
      pages: 1,
      projectSettings: {
        designTokens: opts.tokens ?? [BRAND_X],
        designTokensSchemaVersion: 6,
        darkMode: opts.darkMode ?? "off",
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
        children: opts.children ?? [BRAND_X_HEADING, BUTTON],
      },
    },
  });
  created.push(site.id);
  return site.id;
}

async function savedSettings(siteId: string) {
  const row = await prisma.site.findUnique({ where: { id: siteId }, select: { projectSettings: true } });
  return (row?.projectSettings ?? {}) as { designTokens?: Array<{ id: string; modes?: { light?: { value?: string; alias?: string } } }>; darkMode?: string };
}

/** The saved light literal of a token (aliases followed through the saved
 *  set), or undefined while it is the seed's. */
async function savedLight(siteId: string, id: string): Promise<string | undefined> {
  const saved = (await savedSettings(siteId)).designTokens ?? [];
  let at = id;
  for (let hop = 0; hop < 8; hop++) {
    const light = saved.find((t) => t.id === at)?.modes?.light;
    if (!light) return undefined;
    if (light.value !== undefined) return light.value.toUpperCase();
    at = light.alias ?? "";
  }
  return undefined;
}

/** Brand › a colour token → Change → hex → Apply (the 1a flow's picker). */
async function setColourToken(page: Page, tokenName: string, hex: string) {
  await page.getByText(tokenName, { exact: true }).first().click();
  await page.getByRole("button", { name: "Change", exact: true }).first().click();
  const picker = page.getByRole("dialog").filter({ hasText: "Hex" });
  const field = picker.locator("input[type=text]").first();
  await field.fill(hex);
  await field.press("Enter");
  await picker.getByRole("button", { name: "Apply" }).click();
  await expect(picker).toHaveCount(0);
}

/** Leaves the full-page Brand view (the Site menu sits under it). */
async function leaveBrand(page: Page) {
  await page.getByTestId("brand-back-link").click();
  await expect(page.getByTestId("brand-panel")).toHaveCount(0);
}

async function openAddSearch(page: Page, query: string) {
  const search = page.getByTestId("add-search-input");
  if (!(await search.isVisible())) await page.getByTestId("rail-tab-add").click();
  await search.fill(query);
}

/** Loads an exported page on its own (no network) under a colour scheme. */
async function openExport(page: Page, html: string, colorScheme: "light" | "dark") {
  const out = await page.context().newPage();
  await out.route("**/*", (route) => route.abort());
  await out.emulateMedia({ colorScheme });
  await out.setContent(html, { waitUntil: "domcontentloaded" });
  return out;
}

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
/** Relative luminance of an `rgb(...)` string, 0 (black) … 1 (white). */
const luminance = (css: string) => {
  const [r, g, b] = (css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test.describe("Brand Part 1b", () => {
  test("an inserted button follows Primary, and one ⌘Z restores it", async ({ page }) => {
    const siteId = await seedV6Site({ tokens: [] });
    await openEditor(page, siteId);
    await openAddSearch(page, "Button");
    const before = await page.locator(".buildrick-canvas button").count();
    await page.getByRole("button", { name: /^Add Button \(/ }).first().click();
    await expect(page.locator(".buildrick-canvas button")).toHaveCount(before + 1);
    const inserted = page.locator('.buildrick-canvas button:not([data-buildrick-id="e2e-brand-button"])').first();
    expect(await inserted.getAttribute("style")).toContain(`var(${PRIMARY_VAR})`);
    const bg = () => inserted.evaluate((el) => getComputedStyle(el).backgroundColor);
    const was = await bg();

    await openBrand(page);
    await setColourToken(page, "color-primary", "#C2410C");
    await expect.poll(bg).toBe("rgb(194, 65, 12)");
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(bg).toBe(was);
  });

  test("an in-use token asks for a replacement, and the elements follow it", async ({ page }) => {
    const siteId = await seedV6Site();
    await openEditor(page, siteId);
    expect(await canvasColour(page, "e2e-brand-heading", "color")).toBe(rgb("#C2410C"));
    await openBrand(page);
    await page.getByText("color-brand-x", { exact: true }).first().click();
    await page.getByTestId("brand-token-menu").click();
    await page.getByTestId("brand-token-action-delete").click();
    const modal = page.getByTestId("brand-token-replace-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("used by 1 element");
    await expect(modal.getByRole("button", { name: "Replace and delete" })).toBeDisabled();
    if (!(await modal.locator("[data-replace-candidate]").count())) await page.getByTestId("brand-token-replace-field").click();
    await modal.locator('[data-replace-candidate="color-primary"]').click();
    await modal.getByRole("button", { name: "Replace and delete" }).click();
    await expect(modal).toHaveCount(0);

    const primary = await canvasColour(page, "e2e-brand-button", "backgroundColor");
    await expect.poll(() => canvasColour(page, "e2e-brand-heading", "color")).toBe(primary);
    // Saved: the token is gone and the heading points at Primary.
    await expect.poll(async () => (await savedSettings(siteId)).designTokens?.some((t) => t.id === "color-brand-x" && !("replacedBy" in t)), { timeout: 30_000 }).toBe(false);

    await leaveBrand(page);
    const exported = await downloadSingleFileExport(page);
    await page.keyboard.press("Escape");
    const out = await openExport(page, exported, "light");
    expect(await out.locator('[data-buildrick-id="e2e-brand-heading"]').evaluate((el) => getComputedStyle(el).color)).toBe(primary);
    await out.close();

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvasColour(page, "e2e-brand-heading", "color")).toBe(rgb("#C2410C"));
  });

  test("Connect to tokens: preview, apply, and one ⌘Z puts the raw value back", async ({ page }) => {
    const raw: Node = { ...BRAND_X_HEADING, styles: { color: "#C2410C" } };
    const siteId = await seedV6Site({ children: [raw, BUTTON] });
    await openEditor(page, siteId);
    const heading = page.locator('.buildrick-canvas [data-buildrick-id="e2e-brand-heading"]');
    const inline = () => heading.evaluate((el) => el.getAttribute("style") ?? "");
    expect(await inline()).not.toContain("var(");
    const colour = await canvasColour(page, "e2e-brand-heading", "color");

    await openBrand(page);
    await page.getByTestId("brand-colours-connect").click();
    const check = page.getByTestId("brand-connect-check");
    await expect(check).toContainText("#C2410C · 1 element → Brand X");
    // The button's #FFFFFF is a tie (On primary / Raised surface): pick one first.
    const chooser = page.getByTestId("brand-connect-chooser");
    if (await chooser.isVisible()) await chooser.getByRole("button", { name: /^On primary/ }).click();
    await page.getByTestId("brand-connect-preview").click();
    await expect(page.getByTestId("brand-connect-preview-notice")).toBeVisible();
    expect(await inline(), "a preview writes nothing").not.toContain("var(");
    await page.getByTestId("brand-connect-apply").click();
    await expect(page.getByTestId("brand-connect-applied-notice")).toContainText(/Connected \d+ elements?/);

    await expect.poll(inline).toContain(`var(${BRAND_X.cssVar})`);
    expect(await canvasColour(page, "e2e-brand-heading", "color"), "Connect never changes how it looks").toBe(colour);
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(inline).not.toContain("var(");
    expect(await canvasColour(page, "e2e-brand-heading", "color")).toBe(colour);
  });

  test("edits autosave, ⌘Z saves the undo, and Review changes reverts one row", async ({ page }) => {
    const siteId = await seedV6Site();
    await openEditor(page, siteId);
    const primaryBefore = await canvasColour(page, "e2e-brand-button", "backgroundColor");
    await openBrand(page);

    // Autosave: no Save button, the edit reaches the database on its own.
    await setColourToken(page, "color-primary", "#0E7490");
    await expect.poll(() => savedLight(siteId, "color-primary"), { timeout: 30_000 }).toBe("#0E7490");
    // ⌘Z is saved too.
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(primaryBefore);
    await expect.poll(() => savedLight(siteId, "color-primary"), { timeout: 30_000 }).not.toBe("#0E7490");

    // Two more edits, then revert only the Primary one from Review changes.
    await setColourToken(page, "color-primary", "#0F766E");
    await setColourToken(page, "color-brand-x", "#15803D");
    await expect.poll(() => canvasColour(page, "e2e-brand-heading", "color")).toBe(rgb("#15803D"));
    await page.getByTestId("brand-session-edits").click();
    const rows = page.getByTestId("brand-session-edit");
    // The undone first edit is listed stale: ⌘Z, not Revert.
    const stale = rows.and(page.locator("[data-stale]"));
    await expect(stale).toHaveCount(1);
    await expect(stale).toContainText("Changed since — use ⌘Z");
    await expect(stale.getByTestId("brand-session-revert")).toBeDisabled();
    const live = rows.and(page.locator(":not([data-stale])"));
    await expect(live.filter({ hasText: "Brand X" })).toHaveCount(1);
    await expect(live.filter({ hasText: "Primary" })).toHaveCount(1);
    await live.filter({ hasText: "Primary" }).getByTestId("brand-session-revert").click();

    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(primaryBefore);
    expect(await canvasColour(page, "e2e-brand-heading", "color"), "the other row is untouched").toBe(rgb("#15803D"));
    await expect.poll(() => savedLight(siteId, "color-brand-x"), { timeout: 30_000 }).toBe("#15803D");
    await expect.poll(() => savedLight(siteId, "color-primary"), { timeout: 30_000 }).not.toBe("#0F766E");
  });
});

test.describe("Brand Part 1c", () => {
  test("Dark Auto: generate → preview → confirm, one ⌘Z back; the export follows the device", async ({ page }) => {
    const siteId = await seedV6Site();
    await openEditor(page, siteId);
    await openBrand(page);
    await page.getByTestId("brand-row-colour-mode").click();
    const card = page.getByTestId("brand-dark-mode");
    await expect(card).toHaveAttribute("data-dark-mode-state", "off");
    await expect(page.getByTestId("brand-dark-mode-preview-dark"), "Dark preview is disabled while Off").toBeDisabled();

    await page.getByTestId("brand-dark-mode-auto").click();
    const alias = page.getByTestId("brand-dark-alias-color-brand-x");
    await expect(alias).toContainText("Brand X");
    const darkHex = (await alias.getAttribute("data-hex")) ?? "";
    expect(darkHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    await page.getByTestId("brand-dark-mode-preview").click();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    await expect.poll(() => canvasColour(page, "e2e-brand-heading", "color")).toBe(rgb(darkHex));
    expect((await savedSettings(siteId)).darkMode, "a preview saves nothing").toBe("off");

    await page.getByTestId("brand-dark-mode-confirm").click();
    await expect(card).toHaveAttribute("data-dark-mode-state", "auto");
    await expect.poll(async () => (await savedSettings(siteId)).darkMode, { timeout: 30_000 }).toBe("auto");
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId, reason: "dark-auto" } })).toBe(1);

    // The export: light by default, dark page + light text on a dark device.
    await leaveBrand(page);
    const exported = await downloadSingleFileExport(page);
    expect(exported).toContain("prefers-color-scheme");
    const light = await openExport(page, exported, "light");
    const lightBody = await light.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Transparent is the browser's white page.
    if (lightBody !== "rgba(0, 0, 0, 0)") expect(luminance(lightBody), `light page background ${lightBody}`).toBeGreaterThan(0.8);
    await light.close();
    const dark = await openExport(page, exported, "dark");
    const darkPage = await dark.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      text: getComputedStyle(document.body).color,
      heading: getComputedStyle(document.querySelector('[data-buildrick-id="e2e-brand-heading"]')!).color,
    }));
    expect(luminance(darkPage.body), `dark page background ${darkPage.body}`).toBeLessThan(0.1);
    expect(luminance(darkPage.text), `light body text ${darkPage.text}`).toBeGreaterThan(0.5);
    expect(darkPage.heading).toBe(rgb(darkHex));
    await dark.close();
    await page.keyboard.press("Escape");

    await openBrand(page);
    await page.getByTestId("brand-row-colour-mode").click();
    await page.keyboard.press("ControlOrMeta+z");
    await expect(card).toHaveAttribute("data-dark-mode-state", "off");
    await expect.poll(async () => (await savedSettings(siteId)).darkMode, { timeout: 30_000 }).toBe("off");
  });

  test("generator: the picked colour is kept exactly, repaints Primary, one ⌘Z restores it", async ({ page }) => {
    const siteId = await seedV6Site();
    await openEditor(page, siteId);
    const before = await canvasColour(page, "e2e-brand-button", "backgroundColor");
    await openBrand(page);
    await page.getByTestId("brand-generate-scale").click();
    await page.getByTestId("brand-scale-input").fill("#0E7490");
    await page.getByTestId("brand-scale-generate").click();
    const swatches = page.getByTestId("brand-scale-swatches").locator("li");
    await expect(swatches).toHaveCount(11);
    const picked = swatches.and(page.locator("[data-picked]"));
    await expect(picked).toHaveCount(1);
    expect((await picked.getAttribute("data-hex"))?.toUpperCase(), "the picked step is the picked colour, exactly").toBe("#0E7490");
    await expect(page.getByTestId("brand-scale-light")).toContainText("#0E7490 (your colour)");

    await page.getByTestId("brand-scale-preview").click();
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(rgb("#0E7490"));
    await page.getByTestId("brand-scale-confirm").click();
    await expect(page.getByTestId("brand-scale-confirmed")).toBeVisible();
    expect(await canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(rgb("#0E7490"));
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId, reason: "generator" } })).toBe(1);

    // ⌘Z in a focused field is the field's own undo, not the brand's.
    expect(await page.evaluate(() => document.activeElement?.tagName), "focus after Confirm").not.toBe("INPUT");
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(before);
  });

  test("restore point: a generator change is listed and restores after reload; one ⌘Z undoes the restore", async ({ page }) => {
    const siteId = await seedV6Site();
    await openEditor(page, siteId);
    const before = await canvasColour(page, "e2e-brand-button", "backgroundColor");
    await openBrand(page);
    await page.getByTestId("brand-generate-scale").click();
    await page.getByTestId("brand-scale-input").fill("#0E7490");
    await page.getByTestId("brand-scale-generate").click();
    await page.getByTestId("brand-scale-preview").click();
    await page.getByTestId("brand-scale-confirm").click();
    await expect(page.getByTestId("brand-scale-confirmed")).toBeVisible();
    await expect.poll(() => savedLight(siteId, "color-primary"), { timeout: 30_000 }).toBe("#0E7490");

    await page.reload();
    await page.locator("#bk-site-tokens").waitFor({ state: "attached", timeout: 120_000 });
    await page.locator('.buildrick-canvas [data-buildrick-id="e2e-brand-button"]').waitFor({ timeout: 60_000 });
    await page.addStyleTag({ content: "[data-agentation-root]{display:none!important}" });
    expect(await canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(rgb("#0E7490"));

    await openBrand(page);
    await page.getByTestId("brand-restore-points-action").click();
    const row = page.locator('[data-testid^="brand-restore-row-"][data-reason="generator"]');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Generator");
    await row.getByRole("button", { name: "Restore" }).click();
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(before);
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(rgb("#0E7490"));
  });

  test("brand from a logo file: preview, confirm repaints Primary, ⌘Z, and a logo restore point", async ({ page }) => {
    const siteId = await seedV6Site();
    await openEditor(page, siteId);
    const before = await canvasColour(page, "e2e-brand-button", "backgroundColor");
    // A real PNG: mostly teal, a white field.
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 120;
      c.height = 60;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 120, 60);
      ctx.fillStyle = "#0E7490";
      ctx.fillRect(0, 0, 90, 60);
      return c.toDataURL("image/png").split(",")[1];
    });
    await openBrand(page);
    await page.getByTestId("brand-row-starters").click();
    await page.getByTestId("starter-row-from-source").click();
    await page.getByTestId("brand-from-source").locator('input[type="file"]').setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
    const section = page.getByTestId("brand-from-source");
    await expect(section).toHaveAttribute("data-state", "preview");
    const chips = (await page.getByTestId("brand-source-chips").textContent()) ?? "";
    const primary = chips.match(/Primary · (#[0-9A-F]{6})/)?.[1];
    expect(primary, chips).toBeTruthy();
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(rgb(primary!));
    await section.getByRole("button", { name: "Confirm" }).click();
    await expect(section).toHaveAttribute("data-state", "confirmed");
    expect(await canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(rgb(primary!));
    expect(await prisma.siteThemeSnapshot.count({ where: { siteId, reason: "logo" } })).toBe(1);

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvasColour(page, "e2e-brand-button", "backgroundColor")).toBe(before);
    await page.getByTestId("brand-restore-points-action").click();
    await expect(page.locator('[data-testid^="brand-restore-row-"][data-reason="logo"]')).toContainText("Brand from logo");
  });

  test("theme toggle: offered in Add only on Auto; hidden in an Off site's export", async ({ page }) => {
    const auto = await seedV6Site({ darkMode: "auto" });
    await openEditor(page, auto);
    await openAddSearch(page, "Theme toggle");
    await expect(page.getByTestId("insert-theme-toggle-tile")).toBeVisible();
    await page.getByTestId("insert-theme-toggle-tile").getByRole("button", { name: "Add to page" }).click();
    await expect(page.locator(".buildrick-canvas [data-bk-theme-toggle]")).toHaveCount(1);
    const autoHtml = await downloadSingleFileExport(page);
    await page.keyboard.press("Escape");
    const pub = await openExport(page, autoHtml, "light");
    await expect(pub.locator("[data-bk-theme-toggle]")).toBeVisible();
    await pub.locator('[data-bk-tt="dark"]').click();
    await expect.poll(() => pub.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    await pub.close();

    // The insert is autosaved before leaving the Auto site; that saved block
    // is reused below for an Off site that already carries a toggle.
    const findToggle = (n: Node): Node | null => {
      const attrs = (n.attributes ?? {}) as Record<string, string>;
      if (attrs["data-bk-theme-toggle"]) return n;
      for (const c of (n.children as Node[] | undefined) ?? []) {
        const hit = findToggle(c);
        if (hit) return hit;
      }
      return null;
    };
    const storedToggle = async () =>
      findToggle(((await prisma.page.findFirst({ where: { siteId: auto }, select: { blocks: true } }))?.blocks ?? {}) as Node);
    await expect.poll(storedToggle, { timeout: 30_000 }).not.toBeNull();
    const stored = (await storedToggle())!;

    const off = await seedV6Site({ darkMode: "off" });
    await openEditor(page, off);
    await openAddSearch(page, "Theme toggle");
    await expect(page.getByTestId("insert-theme-toggle-tile")).toHaveCount(0);

    const offWithToggle = await seedV6Site({ darkMode: "off", children: [stored, BRAND_X_HEADING, BUTTON] });
    await openEditor(page, offWithToggle);
    const offHtml = await downloadSingleFileExport(page);
    const offPub = await openExport(page, offHtml, "light");
    expect(await offPub.locator("[data-bk-theme-toggle]").evaluate((el) => getComputedStyle(el).display)).toBe("none");
    await offPub.close();
  });
});
