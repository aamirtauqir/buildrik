#!/usr/bin/env node
/**
 * Baseline drift diff — how far a stored reference render has moved from today.
 *
 * The baseline file is pinned at meta.pinnedCommit. When the app moves on, a
 * frame drawn from an old render silently stops describing the product; the
 * census cannot see this (it compares ids and widths, not pixels). This does:
 * recapture the same screen with `state` suffixed "__drift" so the stored PNG
 * is never overwritten, then compare the two pixel buffers.
 *
 * Reports the share of differing pixels. Judgement stays with the reader —
 * antialiasing and live data (relative timestamps, counts) move a few tenths
 * of a percent on screens that have not actually changed, which is exactly why
 * this prints a number instead of a verdict.
 *
 * Usage: node drift-diff.mjs <BL-id> <state> [--region x,y,w,h]
 *   (after capturing <state>__drift)
 *
 * --region confines the comparison to one band of the frame. The editor's left
 * drawer is `--region 60,56,320,844`: everything the panel rows are actually
 * about, with the topbar, canvas and inspector left out. Without it every
 * editor row reads ~13% because they all contain the same shell, and the shell
 * is the same in all of them.
 *
 * The comparison itself lives in image-compare.mjs — board-diff.mjs needs the
 * identical tolerance and vertical-alignment handling, and two copies of that
 * would drift apart.
 *
 * @license BSD-3-Clause
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { compareImages } from "./image-compare.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(homedir(), ".gstack", "projects", "aamirtauqir-buildrik", "baseline-shots");

const argv = process.argv.slice(2);
const [id, state] = argv;
const regionArg = argv.includes("--region") ? argv[argv.indexOf("--region") + 1] : null;
const region = regionArg ? regionArg.split(",").map(Number) : null;
if (!id || !state) { console.error("usage: drift-diff.mjs <BL-id> <state>"); process.exit(3); }
const before = join(SHOTS, id, `${state}.png`);
const after = join(SHOTS, id, `${state}__drift.png`);
for (const f of [before, after]) if (!existsSync(f)) { console.error(`missing ${f}`); process.exit(3); }

const { share, dy, a, b } = await compareImages(before, after, region);

const sizeNote = a.width === b.width && a.height === b.height
  ? ""
  : ` · size ${a.width}x${a.height} -> ${b.width}x${b.height}`;
const shift = dy === 0 ? "" : ` · aligned at dy=${dy}px`;
const where = region ? ` · region ${regionArg}` : "";
console.log(`${id} ${state}: ${(share * 100).toFixed(2)}% differ${shift}${where}${sizeNote}`);
