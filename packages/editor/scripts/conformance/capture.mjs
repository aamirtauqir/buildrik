/**
 * The harness's agent step, scripted: `get_design_context(nodeId)` → raw-figma/.
 *
 * README calls this "an agent step" because it needs the Figma MCP, which most
 * sessions do not have in their tool list. `scripts/baseline/figma-mcp.mjs` at
 * the repo root talks to the same server over JSON-RPC, so the step can be RUN
 * rather than performed by hand — and run means it can be batched, resumed, and
 * repeated when a board changes.
 *
 * Output is written VERBATIM, because the point of committing raw-figma is that
 * a PR shows the board changing. Nothing is normalised here; that is
 * extract.mjs's job.
 *
 * One call per board — get_design_context has no batch form — so it reports what
 * it spent, and it STOPS on the daily cap rather than burning the remaining
 * boards against a wall.
 *
 * Usage:
 *   node scripts/conformance/capture.mjs <name>=<nodeId> [...]
 *   node scripts/conformance/capture.mjs --from=<file of name=nodeId lines>
 */
import fs from "node:fs";
import path from "node:path";
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const OUT = "scripts/conformance/raw-figma";

const args = process.argv.slice(2);
const fromArg = args.find((a) => a.startsWith("--from="));
const pairs = (fromArg ? fs.readFileSync(fromArg.split("=")[1], "utf8").split("\n") : args)
  .map((s) => s.trim()).filter((s) => s && !s.startsWith("--") && s.includes("="))
  .map((s) => { const i = s.indexOf("="); return [s.slice(0, i), s.slice(i + 1)]; });
if (!pairs.length) { console.error("need <name>=<nodeId> pairs or --from=<file>"); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

await connect();
let ok = 0, skipped = 0, failed = 0, calls = 0;
for (const [name, nodeId] of pairs) {
  const dest = path.join(OUT, `${name}.json`);
  if (fs.existsSync(dest) && !args.includes("--force")) { console.log(`SKIP ${name}`); skipped++; continue; }
  calls++;
  let res;
  try {
    res = await rpc("tools/call", { name: "get_design_context", arguments: {
      fileKey: FILE_KEY, nodeId, clientName: "claude-code",
      clientLanguages: "typescript,javascript", clientFrameworks: "react",
      skillNames: "figma-design-to-code",
    } }, 100 + calls);
  } catch (e) { console.log(`FAIL ${name} ${nodeId} — ${String(e.message).slice(0, 90)}`); failed++; continue; }
  const parts = res.result?.content ?? [];
  const text = parts.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n");
  if (res.result?.isError || /tool call limit/i.test(text)) {
    console.log(`STOP ${name} — ${text.slice(0, 80)}`); failed++; break;
  }
  /* The shape extract.mjs actually reads: a `code` STRING plus `designStyles`.
     Writing the raw content array instead produced "raw file has no `code`
     string — nothing to parse", which is the extractor telling the truth about
     a capture that looked fine on disk. */
  const codeBlock = parts.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const styles = [...codeBlock.matchAll(/^\s*([\w/-]+:\s*(?:Effect|Color|Text|Grid|Paint)\(.*)$/gm)].map((m) => m[1]);
  fs.writeFileSync(dest, JSON.stringify({
    fileKey: FILE_KEY, nodeId, boardName: name,
    fetchedAt: new Date().toISOString(),
    tool: "mcp__plugin_figma_figma__get_design_context",
    note: "Verbatim get_design_context output for this node, captured by scripts/conformance/capture.mjs.",
    designStyles: styles,
    code: codeBlock,
  }, null, 1));
  console.log(`OK   ${name} ${nodeId} ${text.length}b`);
  ok++;
  await new Promise((r) => setTimeout(r, 4500));
}
console.log(`\ncaptured ${ok} · skipped ${skipped} · failed ${failed} · calls ${calls}`);
