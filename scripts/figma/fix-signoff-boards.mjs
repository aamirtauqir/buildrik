/**
 * Two fixes on the Client sign-off family, from the pass that finally opened it.
 *
 * 1. Five `hotspot/back · …` frames name a transition the product cannot
 *    perform: three dead-link boards claim a path back to A0 (the branch returns
 *    before A0 and never retries), B claims one to A (they are one code branch),
 *    and terminal E claims one to A0 — twice terminal, and A0 only renders while
 *    the client is unidentified. They are invisible 200x34 frames, so every
 *    render reads clean and only the reactions expose them.
 *
 *    They are RENAMED, not deleted, to the file's own `hotspot/state · …`
 *    convention — already used on three sibling boards. A flow audit then reads
 *    them as navigation aids for walking the prototype rather than as product
 *    paths, which is what they actually are.
 *
 * 2. `A0 · identify` draws NO FORM — a form-shaped void between the paragraph
 *    and the button, on the one screen whose entire job is collecting a name and
 *    an email. A prior finding proposed cloning it into a validation-error
 *    state; the clone would have had nothing to be invalid.
 *
 * Usage: node scripts/figma/fix-signoff-boards.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
const BOARDS = ["1339:7200","1339:7207","1339:7214","1340:7162","1340:7174"];

await connect();
const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const rgb=(h)=>({r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255});
const out=[];

/* 1 - rename the five misdescribed back-hotspots */
let renamed=0;
for(const id of ${JSON.stringify(BOARDS)}){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  const st=[b];
  while(st.length){
    const n=st.pop();
    if(String(n.name).indexOf("hotspot/back")===0){
      const want=String(n.name).replace("hotspot/back","hotspot/state");
      out.push((${APPLY}?"RENAME\\t":"WOULD\\t")+n.id+"\\t"+String(n.name).slice(0,44)+" -> hotspot/state");
      ${APPLY ? 'n.name=want;' : ''}
      renamed++;
    }
    if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
  }
}
out.push((${APPLY}?"renamed ":"would rename ")+renamed+" back-hotspots that name a transition the product cannot perform");

/* 2 - draw the form A0 is missing */
{
  const b=await figma.getNodeByIdAsync("1339:7162");
  if(!b) out.push("MISSING\\t1339:7162");
  else {
    /* Clear a previous attempt from BOTH places: the first run appended the
       fields to the board while using coordinates relative to the anchor's
       CARD, so they rendered outside the card entirely. Coordinate space, not
       geometry — and only the render showed it. */
    const wipe=(p)=>{ for(const c of [...(p.children||[])]) if(String(c.name).indexOf("a0/")===0) c.remove(); };
    const prior=[];
    const wipeAll=(root)=>{ const q=[root];
      while(q.length){ const n=q.pop();
        if(String(n.name).indexOf("a0/")===0){ n.remove(); continue; }
        if(CONT.has(n.type)&&n.children) for(const c of [...n.children]) q.push(c); } };
    ${APPLY ? 'wipeAll(b);' : ''}
    /* place under the widest text block on the board, above the CTA */
    /* Wipe BEFORE choosing the anchor, and never anchor to our own output. The
       second run picked one of its own field labels as the anchor — the widest
       low text on the board was the thing it had just drawn — and stacked a new
       form below the CTA. Order of operations, and only the render showed it. */
    let anchor=null, cta=null;
    const st=[b];
    while(st.length){ const n=st.pop();
      if(String(n.name).indexOf("a0/")===0) continue;
      if(n.type==="TEXT" && n.width>240 && (!anchor || n.y>anchor.y)) anchor=n;
      if(n.type!=="TEXT" && /btn|button|cta/i.test(String(n.name)) && (!cta || n.y<cta.y)) cta=n;
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
    if(!anchor){ out.push("REFUSED\\t1339:7162\\tno text block to anchor the form to"); }
    else {
      const px=Math.round(anchor.x), top=Math.round(anchor.y+anchor.height)+24;
      /* anchor.x/y are relative to anchor.parent, so the fields must be
         appended THERE — see the wipe() note above. */
      out.push((${APPLY}?"FORM\\t":"WOULD FORM\\t")+"1339:7162\\tanchor "+anchor.id+" -> fields at y"+top+(cta?(", CTA "+cta.id+" at y"+Math.round(cta.y)):", no CTA found"));
      ${APPLY ? `
      const host=anchor.parent;   /* the CARD the anchor lives in, not the board */
      const mk=(s,size,style,color,x,y,w)=>{ const t=figma.createText();
        t.fontName={family:"Inter",style:style}; t.fontSize=size; t.characters=s;
        t.fills=[{type:"SOLID",color:rgb(color)}]; t.textAutoResize="HEIGHT"; t.name="a0/"+s.slice(0,18);
        host.appendChild(t); if(host.layoutMode&&host.layoutMode!=="NONE") t.layoutPositioning="ABSOLUTE";
        t.x=x; t.y=y; t.resize(w,t.height); return t; };
      const box=(x,y,w,h,nm)=>{ const q=figma.createRectangle(); q.resize(w,h);
        q.fills=[{type:"SOLID",color:rgb("ffffff")}]; q.strokes=[{type:"SOLID",color:rgb("d1d5db")}];
        q.strokeWeight=1; q.cornerRadius=8; q.name="a0/"+nm;
        host.appendChild(q); if(host.layoutMode&&host.layoutMode!=="NONE") q.layoutPositioning="ABSOLUTE";
        q.x=x; q.y=y; return q; };
      let y=top;
      for(const lab of ["Your name","The email this link was sent to"]){
        mk(lab,12,"Regular","4b5563",px,y,392); y+=20;
        box(px,y,392,42,"input"); y+=58;
      }
      /* A0 is the IDLE board. A permanent red "Enter the email…" line would be
         its own small lie — the error belongs on the validation-error state
         FIG-N-31 asks for, which is only buildable now that the fields exist.
         The 24px is left as the slot that state will fill. */
      y+=24;
      /* The form is 176px tall and the CTA sat at y236 — writing it without
         making room would have dropped two inputs straight onto the button,
         which is the same mistake three earlier writes in this arc made. */
      /* Idempotent. The first version shifted every node below the CTA by the
         collision distance and re-ran that shift on every apply, so the CTA
         crept 236 -> 316 -> 511 across three runs. Each node now records its
         pre-shift y once, and every later run restores from that record before
         recomputing — so applying twice lands in the same place as applying
         once. A repair that is not idempotent is a repair you can only run
         exactly one time, and nothing enforced that. */
      /* getPluginData is unavailable in this host runtime — only private web
         plugins may use it. getSharedPluginData needs an explicit namespace. */
      const KEY="a0-origY";
      for(const c of (host.children||[])){
        if(String(c.name).indexOf("a0/")===0) continue;
        const rec=c.getSharedPluginData("bk.figmatruth",KEY);
        if(rec) c.y=Number(rec);
      }
      const cta2=cta ? await figma.getNodeByIdAsync(cta.id) : null;
      if(cta2 && cta2.y < y){
        const shift=Math.round(y - cta2.y) + 8;
        for(const c of (host.children||[])){
          if(String(c.name).indexOf("a0/")===0) continue;
          if(c.y >= cta2.y){
            if(!c.getSharedPluginData("bk.figmatruth",KEY)) c.setSharedPluginData("bk.figmatruth",KEY, String(Math.round(c.y)));
            c.y = Math.round(c.y) + shift;
          }
        }
        if(host.height < y + 80) host.resize(host.width, Math.round(y) + 80);
      }
      ` : ''}
    }
  }
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fix" : "dry-run fixing") + " the sign-off back-hotspots and the missing A0 form", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
