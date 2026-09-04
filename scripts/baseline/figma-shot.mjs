/**
 * Download board screenshots as real PNG files.
 *
 * `get_screenshot` returns a hosted `image_url`, not base64 — which is the
 * whole point: an agent that exports with `exportAsync` + `base64Encode` gets
 * its image silently truncated by the ~20KB MCP transport and ends up with a
 * valid PNG header over incomplete pixels. That happened to a full audit wave
 * (0 of 48 boards screenshotted) before this existed.
 *
 * Usage:  node scripts/baseline/figma-shot.mjs <outDir> <nodeId> [nodeId...]
 * Writes: <outDir>/<node-id>.png   (":" becomes "-")
 */
import { connect, rpc } from "./figma-mcp.mjs";
import fs from "node:fs";
import path from "node:path";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const [outDir, ...ids] = process.argv.slice(2);
if (!outDir || ids.length === 0) {
  console.error("usage: figma-shot.mjs <outDir> <nodeId> [nodeId...]");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });
await connect();

let ok = 0;
for (const id of ids) {
  try {
    const r = await rpc("tools/call", { name: "get_screenshot", arguments: {
      fileKey: FILE_KEY, nodeId: id, clientName: "claude-code",
      clientLanguages: "typescript", clientFrameworks: "react" } }, 1);
    const txt = r?.result?.content?.find((c) => c.type === "text")?.text ?? "";
    const url = JSON.parse(txt).image_url;
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const file = path.join(outDir, id.replace(/:/g, "-") + ".png");
    fs.writeFileSync(file, buf);
    // A truncated download is the failure this script exists to prevent, so
    // check the file is a real PNG and ends with IEND rather than trusting 200.
    const isPng = buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const complete = buf.includes(Buffer.from("IEND"));
    console.log(`${id}\t${buf.length}B\tpng=${isPng}\tcomplete=${complete}\t${file}`);
    if (isPng && complete) ok++;
  } catch (e) {
    console.log(`${id}\tFAILED\t${e.message}`);
  }
}
console.log(`ok ${ok}/${ids.length}`);
