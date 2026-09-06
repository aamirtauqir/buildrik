/**
 * #1A57DB is one digit off the accent, and it means two different things.
 *
 * A visual pass found a colour swatch rendering saturated blue beside its own
 * label `#1A1A1A` and asked whether the token-binding pass had bound it to the
 * accent. It had not — the fill is `#1a57db` and UNBOUND. It is a hardcoded
 * near-miss of `#1A56DB`, which the conformance sweep had already counted four
 * of without knowing what any of them were for.
 *
 * The four split by ROLE, and the split is why a blanket remap would be wrong:
 *
 *   807:8367  a SWATCH whose whole job is to show the raw value in the label
 *             beside it. It must be `#1A1A1A` — the value — and must never be
 *             token-bound, or it will contradict its own caption again.
 *   the rest  ordinary accent use. `#1A56DB`, bound to color/accent.
 *
 * THAT SPLIT WAS WRONG AND THIS SCRIPT SHIPPED THE ERROR. All three are
 * swatches. Only 807:8367 was checked against its neighbouring label before
 * running; the other two were classified as "the rest" on the strength of the
 * first one being different. 807:8586 happens to caption `#1A56DB`, so accent
 * blue was accidentally correct there. 807:8636 captions `#E2E5F8` — a pale
 * blue — and this script painted it accent and BOUND it, so the chip
 * contradicted its own caption and would follow the accent forever after. It is
 * the exact defect the visual pass had just reported on 807:8367, reintroduced
 * one row down by the fix for it, and it was found only because the same check
 * was finally run on all three instead of one.
 *
 * The rule, stated so it is not re-derived: a swatch equals the value it
 * captions and is NEVER token-bound. Check every candidate against its own
 * label; never classify one from its neighbour.
 *
 * Usage: node scripts/figma/fix-accent-near-miss.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hex=(c)=>[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
const rgb=(h)=>({r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255});
const cols=await figma.variables.getLocalVariablesAsync("COLOR");
const accent=cols.find(v=>v.name==="color/accent")||cols.find(v=>{
  for(const m of Object.values(v.valuesByMode||{})) if(m&&m.r!==undefined&&hex(m)==="1a56db") return true; return false;});
const out=[]; let swatch=0, accented=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    const st=[b];
    while(st.length){
      const n=st.pop();
      const arr=n.fills;
      if(Array.isArray(arr)&&arr.length){
        let touched=false;
        const next=arr.map(p=>{
          if(p.type!=="SOLID"||!p.color||hex(p.color)!=="1a57db") return p;
          touched=true;
          if(n.id==="807:8367"){ swatch++; return {type:"SOLID",color:rgb("1a1a1a")}; }
          accented++;
          const np={type:"SOLID",color:rgb("1a56db")};
          return accent ? figma.variables.setBoundVariableForPaint(np,"color",accent) : np;
        });
        if(touched){
          out.push((${APPLY}?"FIX\\t":"WOULD\\t")+b.id+"\\t"+String(b.name).slice(0,30)+"\\t"+n.id+" \\""+String(n.name).slice(0,18)+"\\"\\t"+
            (n.id==="807:8367"?"swatch -> #1A1A1A (the value it captions)":"accent -> #1A56DB, bound"));
          ${APPLY ? 'n.fills=next;' : ''}
        }
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
    }
  }
}
out.push((${APPLY}?"fixed ":"would fix ")+swatch+" swatch + "+accented+" accent uses of the near-miss #1A57DB");
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fix" : "dry-run fixing") + " the #1A57DB near-miss, by role", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
