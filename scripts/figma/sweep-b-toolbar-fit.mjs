/**
 * Grow the floating canvas toolbar to the height of its own contents, on all
 * four boards that draw it — VIS-3-30 and its three siblings.
 *
 * The defect: the pill is 760x40 and its chips span y=-8..48, so 56px of content
 * prints 8px proud of a 40px background, top AND bottom. The frame's own name
 * says "wraps when tight", so the second row is intended and the height was
 * never grown for it. VIS-3-30 named one board; the cached SWEEP-FULL shows the
 * identical container defect on three more. Fix all four or the family
 * disagrees with itself.
 *
 * Measured, not replayed. VIS-3-30 supplied literal numbers for one node
 * (40 -> 80, y 740 -> 700, children +16); this computes the same shape from each
 * toolbar's actual content box, because the other three were never measured and
 * a number copied onto a node it was not measured from is how boards drift.
 *
 * Keeps the BOTTOM edge fixed, so the toolbar grows upward into the canvas
 * rather than down over whatever sits beneath it.
 *
 * Usage: node scripts/figma/sweep-b-toolbar-fit.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const PAD = 8;
/* [toolbarId, boardId] — boardId is provenance only; the board is derived. */
const BARS = [
  ["642:2928", "642:2832"],
  ["642:2652", "642:2556"],
  ["807:4330", "807:4299"],
  ["807:6778", "807:6694"],
];
/* [textId, fromSize, toSize, toLeading] — two off-ramp sizes classified as
   chrome by their ancestor chain (a modal header and a modal back glyph),
   not as customer content inside a preview. */
const SIZES = [
  ["1711:8406", 15, 16, 24],
  ["807:7269", 18, 16, 24],
];

const code = `
const APPLY=${APPLY}, PAD=${PAD};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const t=(s,n)=>String(s).replace(/[\\r\\n]+/g," ").slice(0,n||40);
const styles=await figma.getLocalTextStylesAsync();

for(const [id,planBoard] of ${JSON.stringify(BARS)}){
  const f=await figma.getNodeByIdAsync(id);
  if(!f){OUT.push("MISSING\\t"+id);continue;}
  if(!f.children||!f.children.length){OUT.push("NOKIDS\\t"+id);continue;}
  /* An auto-layout frame owns its children's x/y, so VIS-3-30's prescription
     ("shift its children down 16") cannot be applied to it at all. The frame is
     HORIZONTAL with a fixed counter axis, which is exactly why a 56px-tall
     wrapped group centres and prints 8px proud top and bottom. The native fix
     is to let the counter axis HUG and give it the padding, then put the bottom
     edge back where it was. */
  if(f.layoutMode&&f.layoutMode!=="NONE"){
    let y0=Infinity,y1=-Infinity;
    for(const c of f.children){ y0=Math.min(y0,c.y); y1=Math.max(y1,c.y+c.height); }
    const fits0 = Math.round(y0)>=-0.5 && Math.round(y1)<=Math.round(f.height)+0.5;
    OUT.push("BAR-AL\\t"+id+"\\t"+t(f.name,26)+"\\t"+f.layoutMode+"/"+f.counterAxisSizingMode+"\\t"+Math.round(f.width)+"x"+Math.round(f.height)+" @"+Math.round(f.x)+","+Math.round(f.y)+"\\tcontent "+Math.round(y0)+".."+Math.round(y1)+"\\tpadTB="+f.paddingTop+"/"+f.paddingBottom+"\\t"+(fits0?"FITS":"OVERFLOWS"));
    if(fits0||!APPLY) continue;
    const oldBottom0=f.y+f.height, h0=f.height;
    f.paddingTop=Math.max(f.paddingTop,PAD);
    f.paddingBottom=Math.max(f.paddingBottom,PAD);
    f.counterAxisSizingMode="AUTO";
    f.y=Math.round(oldBottom0-f.height);
    const bk=await figma.getNodeByIdAsync(id);
    let c0=Infinity,c1=-Infinity;
    for(const c of bk.children){ c0=Math.min(c0,c.y); c1=Math.max(c1,c.y+c.height); }
    const ins = c0>=-0.5 && c1<=bk.height+0.5;
    let bd0=bk, bo=null;
    while(bd0&&bd0.parent){ if(bd0.parent.type==="SECTION"){bo=bd0;break;} bd0=bd0.parent; }
    let onB=true;
    if(bo&&bo.absoluteBoundingBox){ const bb=bo.absoluteBoundingBox, r=bk.absoluteBoundingBox;
      onB = r.x>=bb.x-0.5 && r.y>=bb.y-0.5 && r.x+r.width<=bb.x+bb.width+0.5 && r.y+r.height<=bb.y+bb.height+0.5; }
    OUT.push((ins&&onB?"OK-BAR\\t":"MISMATCH\\t")+id+"\\t"+h0+" -> "+Math.round(bk.height)+"h @"+Math.round(bk.y)+"\\tcontent "+Math.round(c0)+".."+Math.round(c1)+"\\tinside="+ins+"\\tonBoard="+onB+"\\tboard="+(bo?bo.id:"NONE")+"\\tplanSaid="+planBoard);
    continue;
  }
  if(f.parent&&f.parent.layoutMode&&f.parent.layoutMode!=="NONE"){OUT.push("PARENT-AUTOLAYOUT\\t"+id+"\\t"+f.parent.id);continue;}
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const c of f.children){ x0=Math.min(x0,c.x); y0=Math.min(y0,c.y); x1=Math.max(x1,c.x+c.width); y1=Math.max(y1,c.y+c.height); }
  const needH=Math.round(y1-y0+2*PAD), needW=Math.round(Math.max(f.width, x1-x0+2*PAD));
  const dy=Math.round(PAD-y0), dx=Math.round(x0<PAD?PAD-x0:0);
  const fits = Math.round(y0)>=-0.5 && Math.round(y1)<=Math.round(f.height)+0.5 && Math.round(x0)>=-0.5 && Math.round(x1)<=Math.round(f.width)+0.5;
  OUT.push("BAR\\t"+id+"\\t"+t(f.name,26)+"\\t"+Math.round(f.width)+"x"+Math.round(f.height)+" @"+Math.round(f.x)+","+Math.round(f.y)+"\\tcontent "+Math.round(x0)+".."+Math.round(x1)+" x "+Math.round(y0)+".."+Math.round(y1)+"\\t"+(fits?"FITS":"OVERFLOWS")+"\\twant "+needW+"x"+needH+" dy="+dy+" dx="+dx);
  if(fits){continue;}
  if(!APPLY){continue;}
  const oldBottom=f.y+f.height;
  for(const c of f.children){ c.y=c.y+dy; if(dx) c.x=c.x+dx; }
  f.resize(needW,needH);
  f.y=Math.round(oldBottom-needH);
  const back=await figma.getNodeByIdAsync(id);
  let a0=Infinity,b0=Infinity,a1=-Infinity,b1=-Infinity;
  for(const c of back.children){ a0=Math.min(a0,c.x); b0=Math.min(b0,c.y); a1=Math.max(a1,c.x+c.width); b1=Math.max(b1,c.y+c.height); }
  const inside = b0>=-0.5 && b1<=back.height+0.5 && a0>=-0.5 && a1<=back.width+0.5;
  let bd=back, board=null;
  while(bd&&bd.parent){ if(bd.parent.type==="SECTION"){board=bd;break;} bd=bd.parent; }
  let onBoard=true;
  if(board&&board.absoluteBoundingBox){
    const bb=board.absoluteBoundingBox, r=back.absoluteBoundingBox;
    onBoard = r.x>=bb.x-0.5 && r.y>=bb.y-0.5 && r.x+r.width<=bb.x+bb.width+0.5 && r.y+r.height<=bb.y+bb.height+0.5;
  }
  OUT.push((inside&&onBoard?"OK-BAR\\t":"MISMATCH\\t")+id+"\\tnow "+Math.round(back.width)+"x"+Math.round(back.height)+" @"+Math.round(back.x)+","+Math.round(back.y)+"\\tcontent "+Math.round(b0)+".."+Math.round(b1)+"\\tinside="+inside+"\\tonBoard="+onBoard+"\\tboard="+(board?board.id:"NONE")+"\\tplanSaid="+planBoard);
}

for(const [id,from,to,lead] of ${JSON.stringify(SIZES)}){
  const n=await figma.getNodeByIdAsync(id);
  if(!n||n.type!=="TEXT"){OUT.push("MISSING\\t"+id);continue;}
  if(typeof n.fontSize!=="number"){OUT.push("REFUSED\\t"+id+"\\tmixed");continue;}
  if(n.fontSize!==from){OUT.push("SAME\\t"+id+"\\talready "+n.fontSize);continue;}
  if(!APPLY){OUT.push("WOULD-SIZE\\t"+id+"\\t"+from+" -> "+to);continue;}
  let p=n.parent,inInstance=false;
  while(p&&p.type!=="PAGE"){ if(p.type==="INSTANCE"){inInstance=true;break;} p=p.parent; }
  let b=n,board=null;
  while(b&&b.parent){ if(b.parent.type==="SECTION"){board=b;break;} b=b.parent; }
  await figma.loadFontAsync(n.fontName);
  n.fontSize=to; n.lineHeight={unit:"PIXELS",value:lead};
  if(board&&board.absoluteBoundingBox){
    const bb=board.absoluteBoundingBox, r=n.absoluteBoundingBox;
    if(r.x+r.width>bb.x+bb.width-16){ n.textAutoResize="HEIGHT"; n.resize(Math.max(16,Math.round(bb.x+bb.width-16-r.x)),n.height); }
  }
  const want=styles.find(s=>s.fontName.family===n.fontName.family&&s.fontName.style===n.fontName.style&&s.fontSize===to);
  if(want&&!inInstance&&!n.textStyleId){ try{ await n.setTextStyleIdAsync(want.id); }catch(e){} }
  const back=await figma.getNodeByIdAsync(id);
  OUT.push((back.fontSize===to?"OK-SIZE\\t":"MISMATCH\\t")+id+"\\t"+back.fontSize+"/"+(typeof back.lineHeight==="object"?back.lineHeight.value:"MIX")+(back.textStyleId?" bound":" unbound")+"\\tboard="+(board?board.id:"NONE"));
}
return OUT.join(String.fromCharCode(10)).slice(0,14000);
`;

await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "grow" : "measure") + " the floating canvas toolbar to fit its own two rows on all four boards that draw it, and drain two off-ramp chrome type sizes",
  skillNames: "figma-use" } }, 1);
const txt = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (/tool call limit|Too Many Requests/i.test(txt)) { console.error("FIGMA QUOTA — nothing measured."); process.exit(3); }
console.log(txt || JSON.stringify(r).slice(0, 900));
if (/MISMATCH/.test(txt)) process.exit(2);
