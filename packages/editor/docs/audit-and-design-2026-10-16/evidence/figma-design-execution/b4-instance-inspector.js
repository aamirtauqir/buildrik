// B4 Inspector instance items moved from B6 — identity details, Reset (class b), Variant unavailable, breakpoint overrides (SC-13), Detach Undo (P13 §9; T-CP-14/15/16).
// Prepend continuation-helpers.js with page '3:5'. Base editor frame cloned from page 3:8. Design output only.
const BASE='10:1626';
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
async function settle(){await Promise.all(pending);pending.length=0;}
function focus(b){b.strokes=[paint('accent')];b.strokeWeight=2;b.strokeAlign='OUTSIDE';b.name=b.name+' / default and initial focus';}
function left(b){try{b.primaryAxisAlignItems='MIN';b.paddingLeft=0;}catch(e){}return b;}
function dis(b,label){b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':label});b.name=label;}
async function inst(code,title,{overrides=3,variant='Default',unavailable=false,tablet=false}={}){const r=await clone(BASE,'B4-'+code+' · '+title);await settle();status(r,'Saved just now');
 const ins=r.findOne(n=>n.name==='Inspector / selected-object owner');const idn=ins.findOne(n=>n.name==='Identity and scope / persistent');for(const c of [...idn.children])c.visible=false;idn.paddingLeft=12;idn.paddingRight=12;idn.paddingTop=10;idn.itemSpacing=6;idn.primaryAxisSizingMode='AUTO';
 text(idn,'◇ Hero card · instance',276,'Panel','accent');text(idn,'Component library · v4'+(tablet?' · Editing Tablet · 2 overrides':''),276,'Meta',tablet?'accent':'ink-soft');
 const vr=frame(idn,'Variant',276,null,'HORIZONTAL',null);vr.itemSpacing=8;vr.counterAxisAlignItems='CENTER';text(vr,'Variant',80,'Label');const vb=button(vr,unavailable?'Variant unavailable  ▾':variant+'  ▾','secondary',188);if(unavailable)for(const t of vb.findAllWithCriteria({types:['TEXT']}))t.fills=[paint('warning-text')];
 if(unavailable)text(idn,'The variant “Dark” was removed from Hero card. Showing the default until you choose another.',276,'Meta','warning-text');
 const a=frame(idn,'Instance actions',276,null,'VERTICAL',null);a.itemSpacing=4;const refs={};refs.edit=left(button(a,'Edit main component ›','link',200));const rs=button(a,overrides?'Reset to main component · '+overrides+' overrides':'Reset to main component','secondary',276);if(!overrides){dis(rs,'Reset to main component');text(a,'No overrides to reset',276,'Meta','ink-soft');}refs.reset=rs;refs.detach=left(button(a,'Detach instance','link',140));
 if(tablet){const sc=ins.findOne(n=>n.name==='Inspector scroll');const sig=frame(null,'Override row',300,null,'VERTICAL','bg-panel');sc.insertChild(0,sig);sig.paddingLeft=12;sig.paddingRight=12;sig.paddingTop=8;sig.itemSpacing=4;text(sig,'Spacing · 2 overrides',276,'Label');const f=frame(sig,'Padding field',276,null,'HORIZONTAL',null);f.itemSpacing=6;f.counterAxisAlignItems='CENTER';text(f,'●',10,'Micro','accent');text(f,'Padding',80,'Label');input(f,'16 px',90);left(button(sig,'Remove Tablet override','link',170));text(sig,'Falls back to Desktop: 24 px',276,'Meta','ink-soft');}
 return {r,refs};}
const i1=await inst('IC01','Instance selected / identity, variant, reset with overrides');
const i2=await inst('IC02','Reset to main component / consequence confirm');{const {refs}=modal(i2.r,'Reset this instance?','Its 3 overrides (including Tablet, Mobile and :hover) will be removed. Content from the main component replaces them.',{width:480,actions:[{label:'Cancel',width:96},{label:'Reset',kind:'primary',width:88}]});focus(refs['Cancel']);link(refs['Cancel'],i1.r.id);}
link(i1.refs.reset,i2.r.id);
await inst('IC03','No overrides / Reset disabled with reason',{overrides:0});
await inst('IC04','Variant unavailable / no silent fallback',{unavailable:true});
await inst('IC05','Tablet override on an instance / three SC-13 signals',{tablet:true});
const i6=await inst('IC06','Detach instance / Undo only, no dialog');{const t=frame(i6.r,'Toast',420,48,'HORIZONTAL','bg-panel');t.layoutPositioning='ABSOLUTE';t.x=340+800-436;t.y=900-96;t.paddingLeft=16;t.paddingRight=8;t.counterAxisAlignItems='CENTER';radius(t,'lg');t.strokes=[paint('border')];t.strokeWeight=1;pending.push(t.setEffectStyleIdAsync(FX.Overlay.id));text(t,'Hero card detached',300,'Body');link(button(t,'Undo','link',80),i1.r.id);}
link(i1.refs.detach,i6.r.id);
const board=frame(null,'B4 Instance inspector / IC01–IC06 handoff',1440,null,'VERTICAL','bg-panel');page.appendChild(board);board.x=80;board.y=batchY+Math.ceil((roots.length+1)/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Instance in the Inspector IC01–IC06 (moved from B6) · design output',1392,'Area');
for(const l of ['IC01 identity details: “◇ Hero card · instance”, scope + version, Variant picker, Edit main component › (opens Components with “‹ Back to Hero card”, K40 pattern), Reset to main component with override count, Detach instance.',
 'IC02 Reset = SC-15 class b naming the 3 overrides incl. breakpoints and :hover, Cancel default; IC03 with no overrides Reset is disabled with reason (T-CP-15). IC04 “Variant unavailable” replaces the silent fallback to variants[0]. IC05 Tablet edit stored as an instance override with the three SC-13 signals and “Remove Tablet override” (needs CP-D2). IC06 Detach = class a Undo toast (T-CP-14).',
 'Variant authoring stays deferred (owner P4). Not verified: runtime overrides, keyboard/focus, playback.'])text(board,l,1392,'Body');
return await finish();
