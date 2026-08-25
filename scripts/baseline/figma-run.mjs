#!/usr/bin/env node
/**
 * Run a `use_figma` script against a Figma file, from any session — including
 * the ones where the Figma MCP tools are absent from the tool registry.
 *
 * Companion to `figma-mcp.mjs` (which owns auth + the plugin-bundle header).
 * Lived in a session scratchpad until 2026-08-25 and died with it, so every
 * Figma write arc re-wrote it. Committed as task 0c of
 * `docs/plans/2026-08-25-editor-flow-walk-arc.md`.
 *
 * Usage:
 *   node scripts/baseline/figma-run.mjs <script.js> "<description>"
 *   FIG_FILE=<key> FIG_OUT=<dir> node scripts/baseline/figma-run.mjs ...
 *
 * The script file is plain JS run inside Figma's plugin sandbox:
 *   - top-level `await` and `return` are available; do NOT wrap in an IIFE
 *   - `process` does NOT exist — bake constants into the file
 *   - `console.log` is discarded; `return` is the only output channel
 *   - it is ATOMIC: a script that throws writes nothing, so retry after a fix
 *   - `resize()` does not scale vector children — use `rescale()`
 *
 * Images returned by `node.screenshot()` are written to FIG_OUT (default /tmp)
 * and their paths printed, because a write is not verified by the write —
 * read the node back and look at it.
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "./figma-mcp.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const FILE = process.env.FIG_FILE || "g4GzQFqzNYz5sosz1QtZXC";
const OUT = process.env.FIG_OUT || "/tmp";

const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error("usage: figma-run.mjs <script.js> [description]");
  process.exit(2);
}
const code = readFileSync(scriptPath, "utf8");
const description = process.argv[3] || "figma script";

await connect();
const res = await rpc(
  "tools/call",
  { name: "use_figma", arguments: { fileKey: FILE, code, description, skillNames: "figma-use" } },
  Math.floor(Math.random() * 1e6)
);

let imgN = 0;
for (const part of res?.result?.content || []) {
  if (part.type === "text") {
    // FIG_FULL=1 for dumps — the default cap keeps an accidental whole-page
    // read from flooding a session's context.
    console.log(process.env.FIG_FULL === "1" ? part.text : part.text.slice(0, 8000));
  } else if (part.type === "image" && part.data) {
    const p = `${OUT}/fig-${Date.now()}-${imgN++}.png`;
    writeFileSync(p, Buffer.from(part.data, "base64"));
    console.log("IMAGE ->", p);
  } else {
    console.log(`[${part.type}]`);
  }
}
if (res?.error) {
  console.log("RPC ERROR:", JSON.stringify(res.error).slice(0, 900));
  process.exit(1);
}
