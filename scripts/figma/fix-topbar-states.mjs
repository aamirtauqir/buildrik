/**
 * Use the topbar's designed save/presence states instead of the default.
 *
 * The Topbar component has two INSTANCE_SWAP properties — Save (6 states:
 * saved, saving, unsaved, conflict, offline, error) and Presence (5) — and all
 * 102 instances in the file use the default. So the board named
 * "Shell state 10 · Offline" and the board named "Shell state 11 · Saving →
 * conflict" both read "Saved 2m ago". Nine designed states, zero uses.
 *
 * Two independent audits reached this from different directions: a Shell module
 * pass found "Saved 2m ago" on all twelve full-shell boards including First run
 * — a project that has never been saved — and a chrome-consistency pass found
 * the swap properties untouched at 102/102.
 *
 * Scope is deliberately narrow: only boards whose OWN NAME declares the state.
 * Inferring a save state from a board's contents would be guessing.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };

const saveSet = await figma.getNodeByIdAsync("697:461");
const presSet = await figma.getNodeByIdAsync("692:472");
const saveBy = {}, presBy = {};
for (const c of saveSet.children) saveBy[(c.name.split("=")[1] || "").toLowerCase()] = c.id;
for (const c of presSet.children) presBy[(c.name.split("=")[1] || "").toLowerCase()] = c.id;

/* Name-declared states only. First run is included because a project that has
   never been saved cannot truthfully read "Saved 2m ago". */
const RULES = [
  [/saving\\s*(→|->)\\s*conflict|conflict/i, "conflict"],
  [/\\boffline\\b/i,                          "offline"],
  [/\\bsaving\\b/i,                           "saving"],
  [/\\bunsaved\\b|\\bdirty\\b/i,               "unsaved"],
  [/save-error|save failed|\\bsave-fail/i,    "error"],
  [/first run/i,                             "unsaved"],
];
const rows = []; let changed = 0;
for (const s of page.children) {
  if (s.type !== "SECTION" || /Archive|Library/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    /* Read the WHOLE name. "S1.2e - Offline - Connection restored" matches
       /offline/ and is the RECOVERY state — setting it offline would make the
       board contradict its own title. */
    if (/restored|reconnect|recovered|resolved/i.test(b.name || "")) continue;
    const rule = RULES.find(([re]) => re.test(b.name || ""));
    if (!rule) continue;
    const state = rule[1];
    const target = saveBy[state];
    if (!target) continue;
    const inst = kidsOf(b).find(k => k.type === "INSTANCE" && /topbar/i.test(k.name || ""));
    if (!inst) continue;
    rows.push(b.name.slice(0, 38) + "  ->  Save=" + state);
    if (APPLY) {
      try { inst.setProperties({ "Save#698:0": target }); changed++; } catch (e) { rows.push("   FAILED " + e.message.slice(0,60)); }
    } else changed++;
  }
}
return (APPLY ? "APPLIED " : "DRY RUN ") + "boards=" + changed
  + "\\nsave states available: " + Object.keys(saveBy).join(",")
  + "\\n  " + rows.slice(0, 14).join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Apply" : "Dry-run") + " designed save states on name-declared boards", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300)).slice(0, 1500));
