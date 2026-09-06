/**
 * SH-E-11 generalised: the canvas toolbar overflows its own canvas on 24 of the
 * 57 boards that have one — 5 by the whole bar (280px) and 19 by its help group
 * (131px).
 *
 * The code already solved this and the boards preserve the retired behaviour.
 * CanvasFooterToolbar.tsx:120 — "`max-w-full` + `min-w-0` keep it inside the
 * canvas column"; :132 — "It WRAPS rather than scrolls. It was `h-10
 * overflow-x-auto`"; :142-144 ships `tw:flex-wrap … tw:max-w-full tw:min-w-0`.
 * The board frames are `layoutWrap = NO_WRAP` and several are named
 * "Canvas toolbar (floating · scrolls…)", which is the behaviour that was
 * removed.
 *
 * So: clamp each toolbar to its canvas (max-w-full) and let it wrap (flex-wrap),
 * which is what a narrow canvas actually renders. Nothing is resized smaller
 * than the canvas allows, and the internal groups keep their own HUG widths.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
let seen=0, changed=0, renamed=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(b.type!=="FRAME"||!b.children) continue;
    let band=null; for(const c of b.children) if(/middle band/i.test(c.name)) band=c;
    if(!band) continue;
    const canvas=band.children.find(c=>/^canvas$/i.test(c.name));
    if(!canvas) continue;
    const cb=canvas.absoluteBoundingBox;
    const st=[...canvas.children];
    while(st.length){
      const c=st.pop();
      if(CONT.has(c.type)&&c.children) for(const g of c.children) st.push(g);
      if(!/^canvas toolbar/i.test(c.name)) continue;
      seen++;
      const r=c.absoluteBoundingBox;
      const left=Math.round(r.x-cb.x);
      const maxW=Math.round(cb.width)-Math.max(0,left)*2;
      const over=Math.round(r.x+r.width-(cb.x+cb.width));
      const needsWrap=c.layoutWrap!=="WRAP";
      const needsClamp=over>0 && maxW>=200;
      if(!needsWrap&&!needsClamp) continue;
      if(!APPLY){ OUT.push("   "+b.id+" '"+b.name.slice(0,28)+"' toolbar "+c.id+" w="+Math.round(c.width)+" over="+over+(needsWrap?" +wrap":"")+(needsClamp?(" -> "+maxW):"")); changed++; continue; }
      if(needsWrap) c.layoutWrap="WRAP";
      if(needsClamp) c.resize(maxW, c.height);
      if(/scrolls/i.test(c.name)){ c.name=c.name.replace(/scrolls/ig,"wraps"); renamed++; }
      changed++;
    }
  }
}
OUT.push("");
OUT.push((APPLY?"CHANGED ":"WOULD CHANGE ")+changed+" of "+seen+" canvas toolbars"+(APPLY?("   renamed scrolls->wraps: "+renamed):""));
return OUT.join("\\n").slice(0,7000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"wrap":"dry-run wrapping")+" the canvas toolbars to match the shipped flex-wrap",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
