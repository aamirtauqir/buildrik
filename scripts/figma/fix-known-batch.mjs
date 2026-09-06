/**
 * The diagnosed-but-unapplied defects, applied in ONE call.
 *
 * Each of these sat in RESUME-QUEUE §3 with its fix already written down and
 * un-applied, because every separate script run costs a Figma call and the
 * account's quota trickles. Batching them is not tidiness: at the observed rate
 * a per-defect script would take days to land five fixes.
 *
 * Every item follows the discipline the earlier failures earned:
 *   MEASURE first  — never act on the queue's prose, act on the live geometry.
 *   FLOOR          — if the measurement does not support the edit, REFUSE and
 *                    say why. A repair that makes the board worse is the one
 *                    outcome worse than leaving it broken (this arc has shipped
 *                    two: a 248x48 paragraph squeezed to 40x256, and a toast
 *                    grown on the wrong frame).
 *   READ BACK      — the write is not the proof. Every item re-fetches and
 *                    reports the value the file now holds.
 *
 * Deliberately NOT in here, and why:
 *   807:8342   which row to compress is a judgement; the floor refused it.
 *   COVER-1-01 30 Settings boards need a header REDESIGN, not a nudge.
 *   VIS-2-24   the defect is per-row and propagates; it needs a component.
 *   FIG-CO-17  retitling the Compare bar is a COPY change, and CLAUDE.md's
 *              precedence gives copy to the board. Founder's call, not a script.
 *
 * Usage: node scripts/figma/fix-known-batch.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const APPLY=${APPLY};
const out=[];
const get=async(id)=>await figma.getNodeByIdAsync(id);
const say=(tag,id,msg)=>out.push(tag+String.fromCharCode(9)+id+String.fromCharCode(9)+msg);

/* ---- 1. VIS-2-21 · 138:153 — annotation sheared through its own glyphs ---- */
try{
  const t=await get("138:153");
  if(!t){ say("MISSING","138:153",""); }
  else{
    let need=-1;
    try{ const c=t.clone(); c.textAutoResize="HEIGHT"; c.resize(t.width, t.height); need=Math.round(c.height); c.remove(); }catch(e){ need=-1; }
    if(need<0) say("REFUSED","138:153","could not measure the wrapped height — not guessing at 34");
    else if(need<=Math.round(t.height)) say("OK-NOOP","138:153","already tall enough ("+Math.round(t.height)+" >= "+need+")");
    else{
      const grow=need-Math.round(t.height);
      say(APPLY?"FIX":"WOULD","138:153","h"+Math.round(t.height)+"->"+need+" (+"+grow+"), siblings below pushed down");
      if(APPLY){
        const par=t.parent, below=(par.children||[]).filter(c=>c.y>t.y);
        const auto=par.layoutMode&&par.layoutMode!=="NONE";
        t.textAutoResize="HEIGHT"; t.resize(t.width, need);
        if(!auto) for(const c of below) c.y=Math.round(c.y)+grow;
        else say("NOTE","138:153","parent is auto-layout; siblings reflow themselves, no y written");
        if(par.height && !auto) par.resize(par.width, Math.round(par.height)+grow);
        const t2=await get("138:153");
        say("VERIFY","138:153","h now "+Math.round(t2.height)+" (wanted "+need+")");
      }
    }
  }
}catch(e){ say("ERROR","138:153",String(e).slice(0,120)); }

/* ---- 2. VIS-2-13 · 306:2161 — a pill drawn on top of a heading ---- */
try{
  const b=await get("306:2161");
  if(!b) say("MISSING","306:2161","");
  else{
    const kids=(b.children||[]).filter(c=>c.visible!==false && String(c.name).indexOf("hotspot/")!==0);
    const pill=kids.find(c=>/pill|preset|badge|chip/i.test(String(c.name)));
    const head=kids.filter(c=>c.type==="TEXT").sort((a,c)=>a.y-c.y)[0];
    if(!pill||!head) say("REFUSED","306:2161","could not identify both the pill and the heading by name/type");
    else{
      const ovX=Math.min(pill.x+pill.width,head.x+head.width)-Math.max(pill.x,head.x);
      const ovY=Math.min(pill.y+pill.height,head.y+head.height)-Math.max(pill.y,head.y);
      if(ovX<=0||ovY<=0) say("OK-NOOP","306:2161","pill "+pill.id+" and heading "+head.id+" no longer intersect");
      else{
        const want=Math.round(head.y+head.height)+8;
        say(APPLY?"FIX":"WOULD","306:2161","pill "+pill.id+" y"+Math.round(pill.y)+"->"+want+" (clears heading "+head.id+" by 8)");
        if(APPLY){
          const auto=b.layoutMode&&b.layoutMode!=="NONE"&&(pill.layoutPositioning||"AUTO")!=="ABSOLUTE";
          if(auto) say("REFUSED","306:2161","board is auto-layout and the pill is AUTO — a y write would be ignored");
          else{ pill.y=want; const p2=await get(pill.id); say("VERIFY","306:2161","pill y now "+Math.round(p2.y)); }
        }
      }
    }
  }
}catch(e){ say("ERROR","306:2161",String(e).slice(0,120)); }

/* ---- 3. 1704:8361 / 1704:8396 — spacer 20px too tall (the fixer's floor refused
        shifting content; shrinking the spacer ITSELF is the safe move) ---- */
for(const id of ["1704:8361","1704:8396"]){
  try{
    const b=await get(id);
    if(!b){ say("MISSING",id,""); continue; }
    const kids=(b.children||[]).filter(c=>c.visible!==false && String(c.name).indexOf("hotspot/")!==0 && c.height);
    const last=kids.reduce((a,c)=>(c.y+c.height)>(a.y+a.height)?c:a,kids[0]);
    const over=Math.round(last.y+last.height)-812;
    if(over<=2){ say("OK-NOOP",id,"stack ends at "+Math.round(last.y+last.height)+", within 812"); continue; }
    const sp=kids.filter(c=>/spacer/i.test(String(c.name))&&c.height>over).sort((a,c)=>c.height-a.height)[0];
    if(!sp){ say("REFUSED",id,"overruns by "+over+" and no spacer is taller than that"); continue; }
    say(APPLY?"FIX":"WOULD",id,"spacer "+sp.id+" h"+Math.round(sp.height)+"->"+(Math.round(sp.height)-over)+" (absorbs the "+over+")");
    if(APPLY){
      const below=kids.filter(c=>c.y>sp.y);
      const auto=b.layoutMode&&b.layoutMode!=="NONE";
      const stuck=auto?below.filter(c=>(c.layoutPositioning||"AUTO")!=="ABSOLUTE"):[];
      if(stuck.length){ say("REFUSED",id,"auto-layout board, "+stuck.length+" AUTO nodes below — y writes ignored"); continue; }
      sp.resize(sp.width, Math.round(sp.height)-over);
      for(const c of below) c.y=Math.round(c.y)-over;
      const b2=await get(id);
      const k2=(b2.children||[]).filter(c=>c.visible!==false && String(c.name).indexOf("hotspot/")!==0 && c.height);
      const l2=k2.reduce((a,c)=>(c.y+c.height)>(a.y+a.height)?c:a,k2[0]);
      say("VERIFY",id,"stack now ends at "+Math.round(l2.y+l2.height)+" (board 812)");
    }
  }catch(e){ say("ERROR",id,String(e).slice(0,120)); }
}

/* ---- 4. The STOCK pill, fixed ONCE in the component. It is clipped mid-K on
        every board that instances it, so this is the highest-leverage item
        in the queue: one master edit retires ~50 instances. ---- */
try{
  const comps=[];
  for(const p of figma.root.children){
    let found=null;
    try{ found=p.findAll(n=>(n.type==="COMPONENT"||n.type==="COMPONENT_SET")&&/Card\\s*\\/\\s*media/i.test(String(n.name))); }catch(e){ found=[]; }
    for(const f of found) comps.push(f);
  }
  if(!comps.length) say("MISSING","Card / media","no COMPONENT matching 'Card / media' on any page");
  else{
    for(const comp of comps){
      const pills=comp.findAll(n=>n.type==="TEXT"&&/^STOCK$/i.test(String(n.characters||"").trim()));
      if(!pills.length){ say("OK-NOOP",comp.id,"'"+String(comp.name).slice(0,28)+"' has no STOCK label"); continue; }
      for(const t of pills){
        let need=-1;
        try{ const c=t.clone(); c.textAutoResize="WIDTH_AND_HEIGHT"; need=Math.ceil(c.width); c.remove(); }catch(e){ need=-1; }
        if(need<0){ say("REFUSED",t.id,"could not measure the STOCK label's natural width"); continue; }
        const box=t.parent;
        const haveInner=Math.round(t.width);
        if(need<=haveInner){ say("OK-NOOP",t.id,"label already fits ("+haveInner+" >= "+need+")"); continue; }
        say(APPLY?"FIX":"WOULD",t.id,"STOCK label w"+haveInner+"->"+need+"; pill "+(box?box.id+" w"+Math.round(box.width)+"->"+(need+12):"(no parent)"));
        if(APPLY){
          t.textAutoResize="WIDTH_AND_HEIGHT";
          if(box&&box.resize&&(!box.layoutMode||box.layoutMode==="NONE")) box.resize(need+12, box.height);
          const t2=await get(t.id);
          say("VERIFY",t.id,"label w now "+Math.round(t2.width)+" (natural "+need+")");
        }
      }
    }
  }
}catch(e){ say("ERROR","Card / media",String(e).slice(0,140)); }

return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "apply" : "dry-run") + " the batched known-unfixed defects", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500);
console.log(txt);
if (/^ERROR\t/m.test(String(txt))) process.exit(1);
