#!/usr/bin/env node
/**
 * Cache Figma screenshots for a list of node ids, skipping any already on disk.
 * One node = one Figma call (the daily cap is 200, shared). get_screenshot
 * returns a short-lived URL, not bytes — fetch it immediately.
 *
 * Usage: node scripts/figma/clone-shots.mjs <outDir> <nodeId> [<nodeId> ...]
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import path from "node:path";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const [outDir, ...ids] = process.argv.slice(2);
if (!outDir || ids.length === 0) {
  console.error("usage: clone-shots.mjs <outDir> <nodeId>...");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });
await connect();
let spent = 0;
for (const id of ids) {
  const file = path.join(outDir, `${id.replace(":", "-")}.png`);
  if (fs.existsSync(file)) {
    console.log("skip", id);
    continue;
  }
  const r = await rpc(
    "tools/call",
    { name: "get_screenshot", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", nodeId: id } },
    100 + spent,
  );
  spent++;
  const text = (r?.result?.content || []).map((c) => c.text || "").join("\n");
  const url = text.match(/https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^\s"')]+/)?.[0];
  if (!url) {
    console.error("no url for", id, text.slice(0, 200));
    if (/limit/i.test(text)) break;
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error("fetch failed", id, res.status);
    continue;
  }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log("wrote", file);
}
console.log("figma calls spent:", spent);
