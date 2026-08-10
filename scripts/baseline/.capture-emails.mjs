import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
const require = createRequire(join(process.cwd(), "packages/dashboard/package.json"));
const { chromium } = require("@playwright/test");
const SRC = "/tmp/baseline-emails";
const OUT = join(homedir(), ".gstack/projects/aamirtauqir-buildrik/baseline-shots");
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1 });
const files = readdirSync(SRC).filter(f => f.endsWith(".html")).sort();
let i = 131; const rows = [];
for (const f of files) {
  const p = await c.newPage();
  await p.goto("file://" + join(SRC, f), { waitUntil: "load" });
  await p.waitForTimeout(400);
  const id = `BL-${String(i).padStart(4,"0")}`;
  const dir = join(OUT, id); mkdirSync(dir, { recursive: true });
  const png = join(dir, "default.png");
  await p.screenshot({ path: png, fullPage: true });
  rows.push({ id, template: f.replace(".html",""), sha: createHash("sha256").update(readFileSync(png)).digest("hex").slice(0,16) });
  await p.close(); i++;
}
await b.close();
console.log(JSON.stringify(rows));
