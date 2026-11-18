// B6 Brand completion A — token kinds, reusable styles, delete, large reach, Inspector door.
// Prepend continuation-helpers.js with page '3:6'. Design output only.
const B01='203:33565', B02='203:34125';
const navNames=['Colors','Typography','Spacing','Other kinds ›','Type styles · Presets','Classes','Dark mode','Checks · 2','Starters','Import / export'];
let alignNote='instance alignment override applied';
function navItems(r){return r.findAll(n=>n.type==='INSTANCE'&&navNames.includes(n.name)&&n.parent&&n.parent.parent&&n.parent.parent.name==='Brand navigation');}
function fixNav(r,active){for(const n of navItems(r)){if(active!==undefined)n.fills=n.name===active?[paint('accent-subtle')]:[];try{n.primaryAxisAlignItems='MIN';n.paddingLeft=12;}catch(e){alignNote='alignment override refused: '+e.message;}mutations.push(n.id);}}
async function brandPage(code,title,active,heading){
 const r=await clone(B01,'B6-'+code+' · '+title);fixNav(r,active);
 const idr=r.findOne(n=>n.name==='Identity and return');const t=idr.children.find(n=>n.type==='TEXT');t.characters=heading||active.replace(' ›','');t.name=t.characters;
 const body=r.findOne(n=>n.name.startsWith('Brand body'));body.name='Brand body / '+t.characters;for(const c of [...body.children])c.remove();
 return {r,body};
}
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
function row(p,cells,{w=628,divider=true}={}){const r=frame(p,'Row / '+cells[0][0],w,null,'HORIZONTAL',null);r.counterAxisAlignItems='CENTER';r.itemSpacing=12;r.paddingTop=10;r.paddingBottom=10;if(divider)line(r);for(const [v,cw,role,color] of cells)text(r,v,cw,role||'Body',color||'ink');return r;}
function section(p,title,sub,w=628){const s=frame(p,'Section / '+title,w,null,'VERTICAL',null);s.itemSpacing=4;s.paddingTop=8;text(s,title,w,'Panel');if(sub)text(s,sub,w,'Meta','ink-soft');return s;}
function note(p,value,tone='accent',w=628){const n=frame(p,'Note / '+value.slice(0,40),w,null,'HORIZONTAL',tone==='warning'?'warning-tint':tone==='error'?'error-tint':'accent-tint');pad(n,12);for(const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(k,V['radius/md']);text(n,value,w-24,'Body',tone==='warning'?'warning-text':tone==='error'?'error-text':'ink');return n;}

// B21 Typography
const ty=await brandPage('B21','Typography / families and font-size tokens','Typography');
{const s=section(ty.body,'Families','Site fonts available to this site. Uploading files happens in Assets › Fonts.');
 for(const [role,fam] of [['Heading font','Fraunces'],['Body font','Inter']]){const r=frame(ty.body,'Family / '+role,628,null,'HORIZONTAL',null);r.counterAxisAlignItems='CENTER';r.itemSpacing=12;r.paddingTop=8;r.paddingBottom=8;line(r);text(r,role,200,'Label');button(r,fam+'  ▾','secondary',220);}
 const m=button(ty.body,'Manage site fonts ›','link',180);link(m,'200:32519');
 section(ty.body,'Font-size tokens','Core type tokens can’t be removed or renamed.');
 for(const [n,v,u] of [['text-xs','12px','Used by 8'],['text-sm','14px','Used by 64'],['text-base','16px','Used by 120'],['text-lg','20px','Used by 18'],['text-xl','24px','Used by 12'],['text-2xl','32px','Used by 6'],['display','48px','Used by 3']])row(ty.body,[[n,200,'Label'],[v,120,'Value'],[u,284,'Meta','ink-soft']]);}

// B22 Spacing
const sp=await brandPage('B22','Spacing / presets and steps','Spacing');
{const pr=frame(sp.body,'Spacing presets',628,null,'HORIZONTAL',null);pr.itemSpacing=8;pr.counterAxisAlignItems='CENTER';for(const p of ['Compact','Normal','Spacious']){const b=button(pr,p,'secondary',96);if(p==='Normal'){b.fills=[paint('accent-subtle')];b.name='Normal / current preset';}}button(pr,'Reset to defaults','link',140);
 text(sp.body,'Spacing steps can be changed but not renamed or deleted.',628,'Meta','ink-soft');
 for(const [n,v,u] of [['xs','4px','Used by 26'],['sm','8px','Used by 88'],['md','16px','Used by 140'],['lg','24px','Used by 61'],['xl','40px','Used by 22'],['2xl','64px','Used by 9']]){const r=frame(sp.body,'Step / '+n,628,null,'HORIZONTAL',null);r.counterAxisAlignItems='CENTER';r.itemSpacing=12;r.paddingTop=8;r.paddingBottom=8;line(r);text(r,n,120,'Label');input(r,v,120);text(r,u,352,'Meta','ink-soft');}}

// B23 Other kinds list, B24 Radius, B25 invalid radius
const ok=await brandPage('B23','Other kinds / eleven token pages','Other kinds ›','Other kinds');
const rad=await brandPage('B24','Radius / add, rename and delete','Other kinds ›','Radius');
const radBad=await brandPage('B25','Radius / invalid value stays local','Other kinds ›','Radius');
{text(ok.body,'Each kind has its own page. Values use that kind’s validator.',628,'Meta','ink-soft');
 for(const [k,d] of [['Radius','Corner rounding'],['Shadow','Elevation and depth'],['Motion','Durations and easing'],['Border','Border widths'],['Opacity','Transparency steps'],['Z-index','Stacking order'],['Breakpoint','Layout widths for devices'],['Grid','Columns and gutters'],['Sizing','Fixed widths and heights'],['Icon','Icon sizes'],['Imagery','Image ratios and treatments']]){const r=frame(ok.body,'Kind / '+k,628,null,'HORIZONTAL',null);r.counterAxisAlignItems='CENTER';r.itemSpacing=12;r.paddingTop=4;r.paddingBottom=4;line(r);const b=button(r,k+' ›','ghost',180);b.name=k+' ›';try{b.primaryAxisAlignItems='MIN';}catch(e){}text(r,d,436,'Meta','ink-soft');if(k==='Radius')link(b,rad.r.id);}}
for(const [pg,bad] of [[rad,false],[radBad,true]]){
 const crumb=button(pg.body,'‹ Other kinds','link',120);link(crumb,ok.r.id);
 const a=frame(pg.body,'Radius actions',628,null,'HORIZONTAL',null);a.itemSpacing=8;button(a,'+ Add radius','primary',128);
 for(const [n,v,u] of [['radius-sm','4px','Used by 22'],['radius-md','8px','Used by 48'],['radius-lg','16px','Used by 9'],['radius-full','9999px','Used by 14']]){const r=frame(pg.body,'Token / '+n,628,null,'HORIZONTAL',null);r.counterAxisAlignItems='CENTER';r.itemSpacing=12;r.paddingTop=8;r.paddingBottom=8;line(r);text(r,n,160,'Label');const isBad=bad&&n==='radius-md';input(r,isBad?'8 px round':v,140,isBad);text(r,u,240,'Meta','ink-soft');button(r,'⋯','ghost',32).name='More actions / Rename · Delete';
  if(isBad){const e=frame(pg.body,'Field error / radius-md',628,null,'VERTICAL',null);e.paddingLeft=172;text(e,'Use a length such as 8px or 0.5rem. Nothing was changed.',456,'Meta','error-text');}}
 if(bad){const s=pg.r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('SaveStatus'));if(s)status(pg.r,'Brand changes saved');}}

// B26 Type styles · Presets (read-only catalogue)
const ts=await brandPage('B26','Type styles · Presets / read-only catalogue','Type styles · Presets');
{section(ts.body,'Type styles','Read-only catalogue · built from Typography tokens');
 for(const [n,v] of [['Display','Fraunces · 48/56 · 600'],['Heading 1','Fraunces · 32/40 · 600'],['Heading 2','Fraunces · 24/32 · 600'],['Body','Inter · 16/26 · 400'],['Small','Inter · 14/22 · 400'],['Caption','Inter · 12/18 · 500']])row(ts.body,[[n,200,'Label'],[v,404,'Value','ink-soft']]);
 section(ts.body,'Presets','Read-only catalogue');
 for(const [n,v] of [['Button · primary','primary · radius-md · text-sm'],['Button · secondary','surface · border · radius-md'],['Card','surface · radius-lg · shadow-sm']])row(ts.body,[[n,200,'Label'],[v,404,'Value','ink-soft']]);
 button(ts.body,'Browse section blocks in Add ›','link',240);}

// B27 Classes
const cl=await brandPage('B27','Classes / reusable class list','Classes');
{text(cl.body,'Classes apply a saved set of styles to elements.',628,'Meta','ink-soft');
 for(const [n,u] of [['.eyebrow','Used by 12'],['.card-quiet','Used by 7'],['.muted','Used by 31'],['.full-bleed','Used by 4']]){const r=frame(cl.body,'Class / '+n,628,null,'HORIZONTAL',null);r.counterAxisAlignItems='CENTER';r.itemSpacing=12;r.paddingTop=8;r.paddingBottom=8;line(r);text(r,n,200,'Value');text(r,u,352,'Meta','ink-soft');button(r,'⋯','ghost',32).name='More actions / Rename · Delete';}}

// B28 Delete with replacement, B29 delete blocked while usage unknown
const del=await clone(B01,'B6-B28 · Delete color / replace before delete');fixNav(del,'Colors');
{const {d,refs}=modal(del,'Delete border?','border is used in 16 places. Choose a compatible color to use there instead. You can undo this.',{width:480,actions:[{label:'Cancel',width:96},{label:'Replace and delete',width:160}]});
 const pick=frame(d,'Replacement',432,null,'VERTICAL',null);pick.itemSpacing=4;text(pick,'Use instead',432,'Label');button(pick,'text-muted (#6B7280)  ▾','secondary',432).name='Replacement color picker';d.insertChild(2,pick);
 refs['Cancel'].strokes=[paint('accent')];refs['Cancel'].strokeWeight=2;refs['Cancel'].strokeAlign='OUTSIDE';refs['Cancel'].name='Cancel / default and initial focus';link(refs['Cancel'],B01);
 for(const t of refs['Replace and delete'].findAllWithCriteria({types:['TEXT']}))t.fills=[paint('error-text')];}
const blk=await clone(B01,'B6-B29 · Delete blocked / usage unknown');fixNav(blk,'Colors');
{const {d,refs}=modal(blk,'Can’t delete border yet','We can’t count where border is used right now, so deleting it could break pages. Try again in a moment.',{width:480,actions:[{label:'Close',width:96},{label:'Retry count',kind:'primary',width:120}]});link(refs['Close'],B01);}

// B30 Large-reach note on first edit
const lr=await clone(B01,'B6-B30 · Widely used token / first-edit reach note');fixNav(lr,'Colors');
{const card=lr.findOne(n=>n.name==='Token / primary');card.primaryAxisSizingMode='AUTO';const n=note(card,'This changes 42 places across the site, including 30 through aliases.','warning',596);card.insertChild(1,n);const vals=card.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Light'));vals.characters='Light #1E4FD0     Dark #60A5FA';status(lr,'Brand changes applied locally');}

// B31 Inspector door: exact card, return to Inspector row
const ins=await clone(B02,'B6-B31 · Opened from Inspector / Back to Heading');fixNav(ins,'Colors');
{const back=ins.findOne(n=>n.type==='INSTANCE'&&n.name==='‹ Back to Editor · Home');if(back){back.setProperties({'Label#4:18':'‹ Back to Heading'});back.name='‹ Back to Heading / returns to Inspector Color row';}
 const hd=ins.findOne(n=>n.name==='Brand header / return and shared history');const nt=text(hd,'Opened from Inspector › Typography › Color. Back returns to that row with Heading still selected.',1096,'Meta','ink-soft');}

// Wire Brand navigation across all Brand frames (new and existing)
const dest={'Colors':B01,'Typography':ty.r.id,'Spacing':sp.r.id,'Other kinds ›':ok.r.id,'Type styles · Presets':ts.r.id,'Classes':cl.r.id,'Dark mode':'203:37214','Checks · 2':'203:39584','Starters':'203:35546','Import / export':'203:38272'};
const existing=page.children.filter(n=>n.name.startsWith('B6-B')&&!roots.includes(n));
for(const r of [...existing,...roots]){const isRoot=roots.includes(r);for(const n of navItems(r)){if(!isRoot&&n.reactions.length&&n.reactions[0].actions.length)continue;if(dest[n.name]!==r.id)link(n,dest[n.name]);}if(!isRoot)fixNav(r);}
const out=await finish();out.alignNote=alignNote;out.existingNavFrames=existing.length;return out;
