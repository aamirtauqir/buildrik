/**
 * Fix title/meta pairs that print on top of each other.
 *
 * Found by eye, not by any check: a notification row's timestamp printed
 * straight through the word "enabled". The shape is always the same — a title
 * text node spanning the whole row, and a right-aligned sibling (a timestamp, a
 * count, a tag) with no gutter reserved between them. They collide the moment
 * the title string is long enough, which makes it a LATENT defect: the toast
 * catalog has the identical structure and survives only because its strings
 * happen to be short today.
 *
 * The overlap is with a SIBLING, so every out-of-bounds and parent-overflow
 * check in this repo is blind to it. render-defects.mjs now detects it as
 * OVERPRINT; this repairs it by giving the title the row width minus the meta's
 * width and a 12px gutter, and letting it wrap.
 *
 * IT REFUSES RATHER THAN GUESSES. The first version assumed "leftmost node is
 * the title, rightmost is the meta" and computed the title's new width from the
 * gap between them. That is right for a real title/meta row and wrong for two
 * nodes that start at nearly the same x — there the gap is negative, the width
 * clamps to a floor, and a 248px paragraph becomes 40px wide and 180px tall.
 * It did exactly that to three nodes, recreating the SQUEEZED class the same
 * sweep had just cleared. So there is now a floor: a repair that would take a
 * node below 60% of its width, or below 80px, is REPORTED for human eyes
 * instead of applied. A fixer that can leave the file worse than it found it is
 * not a fixer.
 *
 * Usage: node scripts/figma/fix-overprinting-titles.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

/* pairs as reported by render-defects.mjs OVERPRINT */
const PAIRS = [
  ["164:15","164:17"], ["164:10","164:12"], ["164:30","164:32"],
  ["164:70","164:72"], ["164:65","164:66"], ["164:65","164:67"],
  ["303:2072","303:2074"], ["303:2088","303:2090"],
];

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const PAIRS=${JSON.stringify(PAIRS)};
const out=[]; const done=new Set();
for(const [a,b] of PAIRS){
  if(done.has(a)) continue;
  const t=await figma.getNodeByIdAsync(a), m=await figma.getNodeByIdAsync(b);
  if(!t||!m){ out.push("MISSING\\t"+a+"/"+b); continue; }
  /* whichever starts further left is the title; the other is the meta */
  const title = t.x<=m.x ? t : m;
  const meta  = t.x<=m.x ? m : t;
  const want=Math.round(meta.x - title.x - 12);
  if(Math.round(title.width)<=want){ out.push("ALREADY\\t"+title.id); done.add(a); continue; }
  const floor=Math.max(80, Math.round(title.width*0.6));
  if(want<floor){
    out.push("REFUSED\\t"+title.id+"\\tw"+Math.round(title.width)+" -> "+want+" is below the floor "+floor+
      " — these two start at nearly the same x, so this is not a title/meta row. Needs eyes.");
    done.add(a); continue;
  }
  out.push((${APPLY}?"OK\\t":"WOULD\\t")+title.id+"\\tw"+Math.round(title.width)+" -> "+want+"\\t(meta "+meta.id+" at x"+Math.round(meta.x)+")");
  ${APPLY ? 'await figma.loadFontAsync(title.fontName); title.textAutoResize="HEIGHT"; title.resize(want,title.height);' : ''}
  done.add(a);
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fix" : "dry-run fixing") + " the overprinting title/meta pairs", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
