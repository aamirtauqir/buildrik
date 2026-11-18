// B6 Brand independent-review fixes (P1/P2/P3 of the 2026-10-19 design-qa review).
const by=id=>figma.getNodeByIdAsync(id);
function dis(r,name,label){const b=r.findOne(n=>n.type==='INSTANCE'&&n.name===name);if(!b)return null;b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':label||name});mutations.push(b.id);return b;}
function lbl(b,v){b.setProperties({'Label#4:18':v});b.name=v;mutations.push(b.id);}
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function tip(root,anchor,msg){const t=frame(root,'Tooltip / '+msg,10,null,'HORIZONTAL','ink');t.primaryAxisSizingMode='AUTO';t.layoutPositioning='ABSOLUTE';const a=anchor.absoluteTransform,b=root.absoluteTransform;t.x=a[0][2]-b[0][2];t.y=a[1][2]-b[1][2]+anchor.height+6;t.paddingLeft=8;t.paddingRight=8;t.paddingTop=4;t.paddingBottom=4;radius(t,'md');const x=text(t,msg,10,'Meta','bg-panel');x.textAutoResize='WIDTH_AND_HEIGHT';mutations.push(t.id);return t;}
const brand=page.children.filter(n=>/^B6-B\d+/.test(n.name));
// P1 B43: restore Undo, reason as helper; Restore points disabled
{const r=await by('212:38135');const u=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo');lbl(u,'Undo');const ra=r.findOne(n=>n.name==='Brand actions');const t=ra.children.find(n=>n.type==='TEXT');if(t)t.characters='Restore points need a connection';status(r,'Brand changes applied locally');}
// P1 B38 offline: Restore points disabled + reason; status spec string
{const r=await by('210:38222');dis(r,'Restore points ▾');const ra=r.findOne(n=>n.name==='Brand actions');const t=ra.children.find(n=>n.type==='TEXT');if(t)t.characters='Restore points need a connection';status(r,'Brand changes applied locally');}
// P1 B46 held: Restore points + Review changes disabled; status back to SC-4
{const r=await by('212:38857');dis(r,'Restore points ▾');dis(r,'Review changes');const ra=r.findOne(n=>n.name==='Brand actions');const t=ra.children.find(n=>n.type==='TEXT');if(t)t.characters='Editing is paused while the Brand update is on hold';status(r,'Brand changes saved');}
// B16 reference rows for B49 (read)
const b16=await by('203:38814');const b16text=b16.findOne(n=>n.name.startsWith('Brand body'));const b16rows=b16text?b16text.findAllWithCriteria({types:['TEXT']}).map(t=>t.characters):[];
// P2 B47 empty: Undo disabled with reason, Checks without count, neutral preview
{const r=await by('212:39093');const u=dis(r,'Undo');tip(r,u,'Nothing to undo yet');const ck=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Checks · 2');if(ck)lbl(ck,'Checks');const pv=r.findOne(n=>n.name==='Authored preview');for(const c of pv.children)c.visible=false;pv.layoutMode='VERTICAL';const nt=text(pv,'Your site uses default styles until you choose a brand.',372,'Body','ink-soft');}
// P2 B31: remove pre-edit reach note; annotate back as cross-page
{const r=await by('207:40997');const n=r.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('This changes 42 places'));if(n)n.remove();const o=r.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Opened from Inspector'));if(o)o.characters='Opened from Inspector › Typography › Color. ‹ Back to Heading returns to that row with Heading still selected (cross-page return: annotated, not prototyped).';}
// P2 B42 status last state; B39 starter name
{const r=await by('212:37895');status(r,'Brand changes saved');}
{const r=await by('210:38443');for(const t of r.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Before starter · Fintech calm')t.characters='Before starter · Coastal calm';}
// P2 B41 Revert links, B28 replace link
{const r=await by('210:38897');for(const b of r.findAll(n=>n.type==='INSTANCE'&&n.name==='Revert'))link(b,'203:33565');}
{const r=await by('207:40289');const b=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Replace and delete');if(b)link(b,'203:33565');const p=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Replacement color picker');if(p)try{p.primaryAxisAlignItems='MIN';p.paddingLeft=12;}catch(e){}}
// P2 compact: title first, toggle wording, title width
for(const id of ['212:40091','212:40324','212:40564']){const r=await by(id);const idr=r.findOne(n=>n.name==='Identity and return');const nb=idr.findOne(n=>n.type==='INSTANCE'&&n.name==='Brand navigation');const t=idr.children.find(n=>n.type==='TEXT');if(nb)idr.appendChild(nb);if(t)t.resize(1176-208-160-32,t.height);
 const pt=r.findOne(n=>n.type==='INSTANCE'&&(n.name==='Preview / show website preview'||n.name==='Hide preview'));if(pt){const hide=pt.name==='Hide preview';lbl(pt,hide?'Hide website preview':'Show website preview');pt.resize(176,32);}}
// B53 centre the card
{const r=await by('212:40564');const w=r.findOne(n=>n.name==='Website preview / chrome remains light');if(w&&w.layoutMode!=='NONE')w.counterAxisAlignItems='CENTER';}
// B49 toast centred over body
{const r=await by('212:39590');const t=r.findOne(n=>n.name==='Operation receipt');const body=r.findOne(n=>n.name.startsWith('Brand body'));const bx=body.absoluteTransform[0][2]-r.absoluteTransform[0][2];t.x=bx+(body.width-t.width)/2;}
// Across Brand frames: Colors · 4 title, swatch border, hug back link, remove dead hotspots
let titles=0,sw=0,dead=0,backs=0;
for(const r of brand){const idr=r.findOne(n=>n.name==='Identity and return');if(idr){const t=idr.children.find(n=>n.type==='TEXT');if(t&&t.characters==='Colors'&&r.findOne(n=>n.name==='Token / primary')){t.characters='Colors · 4';titles++;}const back=idr.children.find(n=>n.type==='INSTANCE');if(back){try{back.layoutSizingHorizontal='HUG';backs++;}catch(e){}}}
 for(const s of r.findAll(n=>n.name==='Color swatch')){s.strokes=[paint('border')];s.strokeWeight=1;sw++;}
 for(const n of r.findAll(n=>'reactions'in n&&n.reactions.length&&n.reactions.every(x=>!x.actions||x.actions.length===0||x.actions.every(a=>!a)))){n.reactions=[];dead++;}}
await Promise.all(pending);
return {titles,sw,dead,backs,b16rows,mutatedNodeIds:[...new Set(mutations)].slice(0,200)};
