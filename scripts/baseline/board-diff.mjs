#!/usr/bin/env node
/**
 * Design board vs the running app — the comparison nothing here was making.
 *
 * Two diffs already existed and neither answers "does the app look like the
 * design":
 *
 *   conformance/diff.mjs   property diff. Compares values the extractor pulled
 *                          out of the board against values measured in the DOM.
 *                          CLAUDE.md is blunt about its limit: the probes went
 *                          silent while an inspector body diverged wholesale
 *                          from its board, because a probe answers only what it
 *                          was asked.
 *   baseline/drift-diff    image diff, but app-vs-app: a stored render of this
 *                          app against the same screen today.
 *
 * This is board-PNG vs live-PNG. It exists to RANK, not to accept: the founder's
 * acceptance test is still the two images side by side, by eye. What it removes
 * is deciding which board to look at next by reading ids in order — 366 active
 * boards, 6 ever measured.
 *
 * Usage:
 *   node board-diff.mjs <boardNodeId> <live.png> [--region x,y,w,h] [--out DIR]
 *
 * --region crops the LIVE capture before comparing, for boards that draw one
 * part of the screen. The drawer is `--region 60,56,320,844`. A 1440-wide board
 * against a 1440-wide capture needs no region.
 *
 * The board PNG comes back from Figma at up to 1024px wide whatever the board's
 * real width, so it is scaled to the comparison width before the pixels are
 * compared. Scaling the SMALLER image up is the honest direction here: it adds
 * no detail the board did not have, and downscaling the live capture instead
 * would hide exactly the fine differences this is meant to surface.
 *
 * Writes board.png, live.png and side-by-side.png into --out so the eye has
 * something to open. That pair IS the acceptance test; this number only says
 * which pair to open first.
 *
 * WHAT THE FIRST MEASUREMENT PROVED — read before trusting a number from this.
 *
 * Board 199:2 (Shell state 2) against today's shell capture, by region:
 * rail 13.32%, topbar 11.64%, drawer 13.49%, canvas 14.30%. Four regions, one
 * narrow band — the same 12.6-14.6% band drift-diff's header already warns
 * says nothing. Opening the side-by-side explains it in one look: the board
 * shows the LAYERS panel with an element selected on a restaurant site, the
 * capture shows the INSERT panel with nothing selected on the E2E fixture.
 * The number was measuring a different state and different sample data.
 *
 * So this does NOT rank design drift out of the box, and ordering 366 boards
 * by it would rank them by how unlike the fixture their sample content is.
 * Two things have to be true first:
 *   1. the capture reproduces the board's state (that is recipe work), and
 *   2. sample data is excluded or neutralised — CLAUDE.md is explicit that
 *      board sample data is never conformed to literally, only its SHAPE.
 * Until both hold, use this per-board with a chrome region and read the image.
 *
 * MEASURED, not asserted. The claim above — that capture fidelity dominates the
 * number — was then tested by capturing 199:2's state deliberately and getting
 * it wrong twice:
 *
 *   full 47.86%   selecting an element to match the board's highlighted layer
 *                 row ALSO opened the inspector, which the board does not show
 *                 (its right panel reads "Select something on the canvas"), and
 *                 the capture had no consent cookie so a cookie banner sat
 *                 across the bottom. Both are the harness, not the product.
 *   full 16.20%   same board, same app, after clearing the selection and
 *                 setting `buildrik_consent`. Drawer 11.59% -> 9.26%.
 *
 * 31.7 points of "drift" was the capture. That is the whole argument for doing
 * recipes before ranking, and it is why this prints a path to an image next to
 * every number.
 *
 * It earns its keep even so: the first run found a real drift the property
 * probes never reported — the board draws "Saved 2m ago" as a green pill and
 * the app draws a dot plus text, and the board's topbar carries none of the
 * eye / comments / issues icons the app puts there. That one turned out to be
 * a founder decision open since 2026-08-06 (see the rail-drawer-rebuild plan,
 * "The save chip"), which reading the component's own board 697:461 sharpened:
 * all six of its variants are tinted pills.
 *
 * @license BSD-3-Clause
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connect, rpc } from "./figma-mcp.mjs";
import { compareImages } from "./image-compare.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const require = createRequire(join(ROOT, "packages", "dashboard", "package.json"));
const sharp = require("sharp");

/* The board manifest lives in the editor package; this tool lives beside the
   Figma client and the image comparator it needs. Reading it by path beats
   moving four files to make one import shorter. */
const MANIFEST = join(ROOT, "packages", "editor", "scripts", "conformance", "boards.json");

const argv = process.argv.slice(2);
const [nodeId, livePath] = argv;
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const regionArg = arg("--region");
const region = regionArg ? regionArg.split(",").map(Number) : null;
const outDir = resolve(arg("--out") ?? join(ROOT, ".board-diff", nodeId?.replace(/[:]/g, "-") ?? "out"));

if (!nodeId || !livePath) {
  console.error("usage: board-diff.mjs <boardNodeId> <live.png> [--region x,y,w,h] [--out DIR]");
  process.exit(3);
}
if (!existsSync(livePath)) { console.error(`missing live capture: ${livePath}`); process.exit(3); }

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const board = manifest.boards.find((b) => b.nodeId === nodeId);
if (!board) { console.error(`no board ${nodeId} in ${MANIFEST}`); process.exit(3); }

await connect();
const r = await rpc("tools/call", {
  name: "get_screenshot",
  arguments: { fileKey: manifest.fileKey, nodeId },
}, 1001);
const first = r.result?.content?.[0]?.text;
if (!first) { console.error("get_screenshot returned no content"); process.exit(2); }
let shot;
try { shot = JSON.parse(first); } catch { console.error(`get_screenshot: ${first.slice(0, 200)}`); process.exit(2); }
/* The asset URL is short-lived and is a credential for that image — fetch it
   now, never log it, never write it to a file. */
const png = Buffer.from(await (await fetch(shot.image_url)).arrayBuffer());

mkdirSync(outDir, { recursive: true });
const boardRaw = join(outDir, "board-raw.png");
const boardOut = join(outDir, "board.png");
const liveOut = join(outDir, "live.png");
const sideBySide = join(outDir, "side-by-side.png");
writeFileSync(boardRaw, png);

/* The live capture is cropped to the region first, because that region — not
   the whole frame — is what the board draws. */
const liveMeta = await sharp(livePath).metadata();
let live = sharp(livePath);
if (region) {
  const [x, y, w, h] = region;
  live = live.extract({
    left: x, top: y,
    width: Math.min(w, liveMeta.width - x),
    height: Math.min(h, liveMeta.height - y),
  });
}
await live.png().toFile(liveOut);
const cropMeta = await sharp(liveOut).metadata();

/* Scale the board to its own true size FIRST, then crop it the same way the
   live capture was cropped. Two bugs lived here and both printed a confident
   number:
     · `fit: "fill"` with a width alone stretches width and leaves height
       alone, so a 1440x900 board rendered as 1440x640 and the alignment search
       ran to its ±64px limit.
     · cropping only the live side and resizing the WHOLE board into the crop
       squashed all 1440x900 of the board into a 60x844 strip. The "rail"
       comparison was a squeezed picture of the canvas against the real rail,
       and it reported 18.85%. Looking at the side-by-side is what caught it;
       the number looked perfectly plausible. */
/* A region means one of two different things and the board's own size says
   which. A shell board is a whole 1440-wide screen, so the region names a part
   of it and BOTH sides get cropped. An inspector profile board IS the 300px
   column — it is already the region — so only the live capture is cropped and
   the board is scaled to that crop.

   Getting this wrong is silent in one direction and loud in the other. Cropping
   only the live side squashed a whole 1440x900 board into a 60x844 strip and
   printed 18.85% for it. Cropping both sides when the board IS the region asks
   sharp for a negative width (300 - 1140) and throws, which is how this was
   found. */
const boardIsWholeScreen =
  !region || shot.original_width >= Math.max(region[2] * 1.5, region[0] + region[2] * 0.5);

let boardImg = sharp(boardRaw).resize({
  width: shot.original_width, height: shot.original_height, fit: "fill",
});
if (region && boardIsWholeScreen) {
  const [x, y, w, h] = region;
  boardImg = sharp(await boardImg.png().toBuffer()).extract({
    left: Math.min(x, shot.original_width - 1),
    top: Math.min(y, shot.original_height - 1),
    width: Math.min(w, shot.original_width - x),
    height: Math.min(h, shot.original_height - y),
  });
} else if (region) {
  boardImg = sharp(await boardImg.png().toBuffer())
    .resize({ width: cropMeta.width, height: cropMeta.height, fit: "fill" });
}
await boardImg.png().toFile(boardOut);

const { share, dy, a, b } = await compareImages(boardOut, liveOut, null);

await sharp({
  create: { width: a.width + b.width + 24, height: Math.max(a.height, b.height), channels: 4,
            background: { r: 24, g: 24, b: 27, alpha: 1 } },
})
  .composite([{ input: boardOut, left: 0, top: 0 }, { input: liveOut, left: a.width + 24, top: 0 }])
  .png().toFile(sideBySide);

const shift = dy === 0 ? "" : ` · aligned at dy=${dy}px`;
const where = region ? ` · region ${regionArg}` : "";
console.log(`${nodeId} "${board.name}" [${board.family}]`);
console.log(`  ${(share * 100).toFixed(2)}% differ${shift}${where}`);
console.log(`  board ${shot.original_width}x${shot.original_height} → ${a.width}x${a.height} · live ${liveMeta.width}x${liveMeta.height} → ${b.width}x${b.height}`);
console.log(`  board treated as: ${region ? (boardIsWholeScreen ? "a whole screen (both sides cropped)" : "the region itself (live cropped, board scaled)") : "a whole screen (no region)"}`);
console.log(`  eyes: ${sideBySide}`);
