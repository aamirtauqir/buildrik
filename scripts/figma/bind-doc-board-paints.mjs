/**
 * Bind the documentation boards' paints to colour variables.
 *
 * A conformance sweep measured 87% of the paints on this arc's 22 new boards as
 * unbound raw hex, against 14% file-wide — and 4.1% of their text on a style
 * against 60% file-wide. The values were already corrected onto the token
 * palette; this is the other half, which is what makes a future token change
 * actually reach them.
 *
 * Variables are resolved by NAME first and by VALUE only as a fallback, because
 * a value lookup picks whichever variable happens to hold that hex: white
 * resolved to `color/accent-on` — semantically "text on an accent" — when the
 * board wanted `color/bg-panel`. Same hex, wrong meaning, and a rename or a
 * theme change would have taken the board somewhere absurd.
 *
 * Usage: node scripts/figma/bind-doc-board-paints.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

const BOARDS = [
  "Module Interaction Map · Collections → Publish — measured, hop by hop",
  "Preview · what the sandbox drops (reference)",
  "Inspector · profile · FORM","Inspector · INTERACTIONS · list",
  "Inspector · INTERACTIONS · add-trigger","Inspector · INTERACTIONS · edit",
  "Canvas · drop feedback — anatomy","Canvas · element manipulated — resize · rotate (anatomy)",
  "Canvas · element locked · element hidden (anatomy)",
  "Canvas · empty page — first run · after Start blank (anatomy)",
  "Editor · reopened with unsaved work — anatomy","AI · in-canvas popover — 4 states",
  "AI · publish confirm — idle · busy",
  "[not-implemented] Brand · generate component with AI — the schema has nowhere to go",
  "Components · update-from-selection — confirm · outcomes","Components · delete-confirm (modal)",
  "Content · dynamic-pages","Content · dynamic-pages · no-pattern",
  "Content · dynamic-pages · none-published","Content · dynamic-pages · no-template",
  "Pages · structure","Media · local-only assets",
  "J1 · Completeness Proof","J2 · Completeness Proof","J3-J6 · Completeness Proof",
];

/* hex -> preferred variable name, then any variable holding that value */
const PREFER = {
  "111827":"color/ink", "4b5563":"color/ink-soft", "6b7280":"color/ink-muted",
  "9ca3af":"color/border-strong", "d1d5db":"color/border-medium", "e5e7eb":"color/border",
  "ffffff":"color/bg-panel", "f3f4f6":"color/bg-subtle", "1a56db":"color/accent",
  "ebf5ff":"color/accent-tint", "0e9f6e":"color/success", "057a55":"color/success-text",
  "def7ec":"color/success-tint", "c27803":"color/warning", "723b13":"color/warning-text",
  "fdfdea":"color/warning-tint", "e02424":"color/error", "c81e1e":"color/error-text",
  "fde8e8":"color/error-tint",
};

await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const want=new Set(${JSON.stringify(BOARDS)});
const PREFER=${JSON.stringify(PREFER)};
const cols=await figma.variables.getLocalVariablesAsync("COLOR");
const hex=(c)=>[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
const byName=new Map(cols.map(v=>[v.name,v]));
const byValue=new Map();
for(const v of cols) for(const m of Object.values(v.valuesByMode||{}))
  if(m&&m.r!==undefined && !byValue.has(hex(m))) byValue.set(hex(m),v);
const pick=(h)=>byName.get(PREFER[h]) || byValue.get(h) || null;

let bound=0, already=0, unmatched=new Map(), boards=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(!want.has(b.name)) continue;
    boards++;
    const st=[b];
    while(st.length){
      const n=st.pop();
      for(const key of ["fills","strokes"]){
        const arr=n[key];
        if(!Array.isArray(arr)||!arr.length) continue;
        let touched=false;
        const next=arr.map(p=>{
          if(p.type!=="SOLID"||!p.color) return p;
          if(p.boundVariables&&p.boundVariables.color){ already++; return p; }
          const h=hex(p.color); const v=pick(h);
          if(!v){ unmatched.set(h,(unmatched.get(h)||0)+1); return p; }
          touched=true; bound++;
          return figma.variables.setBoundVariableForPaint(p,"color",v);
        });
        ${APPLY ? 'if(touched) n[key]=next;' : ''}
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
    }
  }
}
const un=[...unmatched.entries()].map(([h,c])=>h+"×"+c).join(" ");
return (${APPLY}?"BOUND":"WOULD BIND")+" "+bound+" paints across "+boards+" boards   already-bound="+already+
  (un?("   NO VARIABLE: "+un):"   (every colour resolved)");
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "bind" : "dry-run binding") + " doc-board paints to colour variables", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500));
