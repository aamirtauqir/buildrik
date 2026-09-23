/**
 * Look at the boards. Actually look at them.
 *
 * Every other check in this arc proves a write LANDED: a read-back says the
 * node holds the string that was sent, the invariant scan says nothing overlaps,
 * the queue says 825 rows returned OK. None of that is the same as the board
 * reading correctly, and this file exists because the difference has already
 * cost real defects here — a board named `APPEND to whatever the current name
 * is: "…"` was logged OK, because the read-back matched what was SENT.
 *
 * The repo's own rule (packages/editor/CLAUDE.md, THE LOOP step 3): verification
 * is the board screenshot next to the live screenshot, at 1440x900, by eye. This
 * gets the first half of that pair out of Figma and onto disk as a PNG the
 * session can open.
 *
 * Two things it does NOT do, on purpose:
 *  - it does not judge. It writes files. The looking is the caller's job.
 *  - it does not batch many boards per call. An image is enormous next to a
 *    text reply; two per call is already pushing the response ceiling that has
 *    silently truncated whole-page reads all arc.
 *
 * Prefers the dedicated `get_screenshot` tool and falls back to
 * `use_figma` + `node.screenshot()`. On a response carrying no image at all it
 * dumps the shape it DID get rather than reporting a clean zero — a screenshot
 * run that quietly captures nothing looks exactly like a board that is fine.
 *
 * Usage:
 *   node scripts/figma/shoot-boards.mjs 1779:2/165:2 ...      # <label>/<nodeId>
 *   node scripts/figma/shoot-boards.mjs --out=dir 165:2 165:24
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const FILE = "g4GzQFqzNYz5sosz1QtZXC";
const OUT = (process.argv.find((a) => a.startsWith("--out=")) || "--out=docs/design-jobs/V2-TO-V1/shots").split("=")[1];
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!args.length) { console.error("usage: shoot-boards.mjs <nodeId> [nodeId…] [--out=dir]"); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

await connect();

/* An image can come back as a content item of type "image" (base64 in `data`)
   or as a resource with a blob. Both shapes have been seen from this server, so
   neither is assumed. */
const harvest = (res) => {
  const items = res?.result?.content ?? [];
  const imgs = [];
  const texts = [];
  for (const c of items) {
    if (c.type === "image" && c.data) imgs.push({ b64: c.data, mime: c.mimeType || "image/png" });
    else if (c.type === "resource" && c.resource?.blob) imgs.push({ b64: c.resource.blob, mime: c.resource.mimeType || "image/png" });
    else if (c.type === "text") texts.push(c.text);
  }
  return { imgs, texts };
};

let wrote = 0;
for (const spec of args) {
  const id = spec.includes("/") ? spec.split("/").pop() : spec;
  const label = spec.includes("/") ? spec.split("/")[0] : id;
  const safe = `${label}_${id}`.replace(/[^\w.-]+/g, "-");

  let res = await rpc("tools/call", { name: "get_screenshot",
    arguments: { fileKey: FILE, nodeId: id } }, 1).catch((e) => ({ error: String(e) }));
  let { imgs, texts } = harvest(res);

  if (!imgs.length) {
    /* Fall back to the plugin API's own capture. */
    const code = [
      'const pg=figma.root.children.find(p=>p.id==="1:3");',
      "await figma.setCurrentPageAsync(pg);",
      "const n=await figma.getNodeByIdAsync(" + JSON.stringify(id) + ");",
      'if(!n) return "NOT-FOUND ' + id + '";',
      "await n.screenshot();",
      'return n.id+" "+Math.round(n.width)+"x"+Math.round(n.height)+" "+String(n.name);',
    ].join("\n");
    res = await rpc("tools/call", { name: "use_figma",
      arguments: { fileKey: FILE, code, description: "screenshot " + id, skillNames: "figma-use" } }, 1)
      .catch((e) => ({ error: String(e) }));
    ({ imgs, texts } = harvest(res));
  }

  const joined = texts.join(" ");
  if (/tool call limit/i.test(joined)) { console.error(`${id}: Figma daily tool-call limit — ${wrote} shot(s) written, rest untouched.`); process.exit(2); }

  if (!imgs.length) {
    /* Do NOT report a clean miss. Show what came back so the next run is aimed. */
    const dump = `${OUT}/${safe}.MISS.json`;
    fs.writeFileSync(dump, JSON.stringify(res, null, 1).slice(0, 20000));
    console.log(`${id}  NO IMAGE  text=${JSON.stringify(joined.slice(0, 160))}  shape dumped -> ${dump}`);
    continue;
  }
  imgs.forEach((im, i) => {
    const ext = im.mime.includes("jpeg") ? "jpg" : "png";
    const p = `${OUT}/${safe}${imgs.length > 1 ? "." + i : ""}.${ext}`;
    fs.writeFileSync(p, Buffer.from(im.b64, "base64"));
    const kb = Math.round(fs.statSync(p).size / 1024);
    console.log(`${id}  ${kb} KB  ${joined.slice(0, 70)}  -> ${p}`);
    wrote++;
  });
  await new Promise((r) => setTimeout(r, 4500));
}
console.log(`\n${wrote} image(s) in ${OUT}`);
