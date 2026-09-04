/**
 * Restore the 3 client-footer edges my own swap destroyed.
 *
 * swap-client-chrome.mjs called setReactionsAsync once PER EDGE, and that call
 * replaces the whole array — so a bar with two edges ended with one while the
 * counter happily reported two. It reported 11 replayed; 8 survived. The script
 * is fixed; this repairs the damage.
 *
 * THIS IS A RECONSTRUCTION, NOT A RECOVERY. The exact lost destinations are
 * gone. What is restored is what a pending footer means: it draws both "Request
 * changes" and "✓ Approve", so it must reach both 117:2 (request-changes) and
 * 117:58 (approved). Every surviving pending footer already points at approved,
 * so the missing half is the request-changes edge — inferred from the variant,
 * not recovered from the file.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:6");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const REQUEST = "117:2", APPROVED = "117:58";
const rows = []; let fixed = 0;

for (const b of page.children) {
  if (b.type === "TEXT") continue;
  for (const k of kidsOf(b)) {
    if (k.type !== "INSTANCE" || !/^Sticky footer/i.test(k.name || "")) continue;
    let main = null; try { main = await k.getMainComponentAsync(); } catch (e) {}
    const variant = main ? (main.name.split("=")[1] || "") : "";
    if (variant !== "pending") continue;

    let rs = []; try { rs = k.reactions || []; } catch (e) {}
    const dests = rs.map(r => r.action && r.action.destinationId).filter(Boolean);
    /* Only repair the exact signature of the damage: a pending footer whose ONLY
       edge is the Approve one. A footer with zero edges was never wired, and
       adding some would be inventing navigation rather than restoring it. */
    const isDamaged = dests.length === 1 && dests[0] === APPROVED;
    if (!isDamaged) { rows.push("skip  " + b.name.slice(0,28) + " (edges=" + dests.length + ")"); continue; }
    const want = [REQUEST, APPROVED].filter(d => d !== b.id);
    rows.push("FIX   " + b.name.slice(0,28) + "  restoring the Request-changes edge");
    if (APPLY) {
      const all = want.map(d => ({ trigger: { type: "ON_CLICK" },
        actions: [{ type: "NODE", destinationId: d, navigation: "NAVIGATE",
                    transition: null, preserveScrollPosition: false, resetVideoPosition: false }] }));
      try { await k.setReactionsAsync(all); fixed++; } catch (e) { rows.push("      FAILED " + e.message.slice(0,50)); }
    }
  }
}
return (APPLY ? "APPLIED fixed=" + fixed : "DRY RUN") + "\\n  " + rows.join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Restore" : "Dry-run restoring") + " the pending footers' request-changes edge", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 1000));
