/**
 * review-fixture — serve the Review panel a review round so it can be walked.
 *
 * The panel's states (open · resolved · revoked · older round · load error)
 * only exist when the dashboard has an open review round for the site. The
 * standalone editor talks to the dashboard over tRPC, so the honest way to
 * reach those states without a database is to answer those two calls with a
 * fixture and let every other part of the app behave normally.
 *
 * Usage:
 *   node scripts/conformance/review-fixture.mjs --out shot.png [--case open]
 *        [--eval "<js>"] [--key "R"] [--wait 5000]
 *
 * Cases mirror the board names: open · empty · all-resolved · revoked ·
 * older-round · load-error · loading.
 *
 * @license BSD-3-Clause
 */
import { chromium } from "@playwright/test";

const argv = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1] ?? true;
};

const CASE = String(arg("case", "open"));
const out = arg("out");
const settle = Number(arg("wait", 5000));
const key = arg("key", "r");
const evalSrc = arg("eval");

const iso = (daysAgo) => new Date(Date.UTC(2026, 7, 15) - daysAgo * 86_400_000).toISOString();

/* Board 156:2's sample: 12 comments, 9 resolved, round 2 of 3, sent 2d ago by
   Sara. The SHAPE is the contract — these values just make it renderable. */
const comment = (id, body, pageId, status, days) => ({
  id,
  body,
  pageId,
  x: null,
  y: null,
  targetSelector: null,
  status,
  reviewerId: "rev-1",
  reviewer: { name: "Sara" },
  createdAt: iso(days),
});

const OPEN_COMMENTS = [
  comment("c1", "hero photo is too dark", "page-home", "OPEN", 2),
  comment("c2", "wrong phone number", "page-contact", "OPEN", 2),
  comment("c3", "add gluten-free icons", "page-menu", "OPEN", 1),
];
const RESOLVED_COMMENTS = Array.from({ length: 9 }, (_, i) =>
  comment(`r${i}`, `resolved note ${i + 1}`, "page-home", "RESOLVED", 3),
);

const ROUND = {
  id: "round-2",
  status: "SENT",
  invitedEmail: "sara@example.com",
  reviewerName: "Sara",
  revoked: false,
  resolvedAt: null,
  createdAt: iso(2),
  revision: "rev-2",
  roundNumber: 2,
  totalRounds: 3,
  openCommentCount: 3,
};

const CASES = {
  open: { round: ROUND, comments: [...OPEN_COMMENTS, ...RESOLVED_COMMENTS] },
  /* Board 157:221 — the round exists and nothing has come back yet. Distinct
     from `never-sent`, which is a site that was never sent at all. */
  empty: { round: { ...ROUND, openCommentCount: 0 }, comments: [] },
  "never-sent": { round: null, comments: [] },
  "all-resolved": {
    round: { ...ROUND, openCommentCount: 0 },
    comments: RESOLVED_COMMENTS,
  },
  revoked: { round: { ...ROUND, revoked: true }, comments: OPEN_COMMENTS },
  "older-round": {
    round: { ...ROUND, roundNumber: 1, status: "RESOLVED", resolvedAt: iso(4) },
    comments: [...OPEN_COMMENTS, ...RESOLVED_COMMENTS],
  },
  "review-closed": {
    round: { ...ROUND, status: "APPROVED", resolvedAt: iso(1), openCommentCount: 0 },
    comments: RESOLVED_COMMENTS,
  },
  "load-error": { error: true },
  loading: { hang: true },
};

const fixture = CASES[CASE];
if (!fixture) {
  console.error(`unknown case "${CASE}" — have: ${Object.keys(CASES).join(", ")}`);
  process.exit(1);
}

/** One answer per procedure the shell calls on boot. */
function fixtureFor(proc) {
  const name = proc.split("?")[0];
  if (name.startsWith("reviews.currentRound")) return fixture.round;
  if (name.startsWith("comments.list")) return fixture.comments;
  if (name.startsWith("reviews.status")) {
    /* The pill the shell boards draw as "In review · 3 open". */
    return fixture.round && !fixture.round.revoked
      ? { state: "pending", reviewerName: fixture.round.reviewerName, at: fixture.round.createdAt }
      : { state: "none", reviewerName: null, at: null };
  }
  if (name.startsWith("sites.get")) {
    return {
      id: "review-fixture",
      name: "Bella Cucina",
      slug: "bella-cucina",
      status: "DRAFT",
      publishedUrl: null,
      createdAt: iso(30),
      updatedAt: iso(0),
    };
  }
  if (name.startsWith("sites.myRole")) return "OWNER";
  if (name.endsWith("unreadCount")) return 0;
  /* Anything that reads like a collection answers with one — `media.listFolders`
     returned `{}` at first and MediaManager died on `for (const f of folders)`. */
  if (/list/i.test(name)) return [];
  return {};
}

const browser = await chromium.launch({
  args: ["--no-proxy-server", "--proxy-bypass-list=<-loopback>"],
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
/* An error boundary swallows the throw, so pageerror stays empty while the
   editor shows "Something went wrong". React still logs the component stack. */
page.on("console", (m) => {
  if (m.type() === "error") pageErrors.push(`console: ${m.text().slice(0, 500)}`);
});

const seen = [];
await page.route("**/api/trpc/**", async (route) => {
  const url = new URL(route.request().url());
  /* httpBatchLink puts the procedures in the path, comma-separated, in the
     order their results must come back. */
  const procs = decodeURIComponent(url.pathname.split("/api/trpc/")[1] ?? "").split(",");
  seen.push(procs.join(","));

  /* The editor is served from 127.0.0.1:5050 and the dashboard lives on
     another origin, so a fulfilled response without CORS headers is blocked by
     the browser and the panel reports a load failure — which looks exactly
     like the bug you are hunting. */
  const cors = {
    "access-control-allow-origin": route.request().headers().origin ?? "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type, x-trpc-source",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  };
  if (route.request().method() === "OPTIONS") {
    return route.fulfill({ status: 204, headers: cors });
  }

  if (fixture.hang) return; // never fulfilled — the panel stays in its loading state
  if (fixture.error) return route.fulfill({ status: 500, headers: cors, body: "boom" });

  /* The client runs superjson, so every result is wrapped: {json: value}.
     Everything the shell calls gets a SHAPE-correct answer, not null: the
     server never returns null for these (reviews.status alone has four
     early returns, all objects), and answering null crashed the whole editor
     on `reviewStatus.state` — a defect that exists only in the harness. */
  const body = procs.map((p) => ({ result: { data: { json: fixtureFor(p) } } }));
  return route.fulfill({
    status: 200,
    headers: { ...cors, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
});

await page.goto("http://127.0.0.1:5050/?siteId=review-fixture", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".buildrick-canvas", { state: "attached", timeout: 30_000 });
await page.waitForTimeout(2500);

/* The Review tab has no rail button (agency_layer-gated) — its shortcut is the
   way in, same as a user with the flag off would reach it. */
await page.keyboard.press(String(key));
await page.waitForTimeout(settle);

let evalResult;
if (evalSrc) {
  evalResult = await page.evaluate(String(evalSrc));
  await page.waitForTimeout(800);
}

if (out) await page.screenshot({ path: out });
console.log(JSON.stringify({ case: CASE, out, evalResult, trpcCalls: seen, pageErrors }, null, 2));
await browser.close();
