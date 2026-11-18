// B7 fixes: CMS stand-ins drop Brand-only header actions; RJ03 message with Open Editor to undo; CL02 editing line fits the Inspector.
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
for(const id of ['232:24328','232:24584']){const r=await figma.getNodeByIdAsync(id);const a=r.findOne(n=>n.name==='Brand actions');if(a)a.visible=false;mutations.push(r.id);}
{const r=await figma.getNodeByIdAsync('232:24584');status(r,'Saved just now');const m=frame(r,'Area undo message',460,48,'HORIZONTAL','bg-panel');m.layoutPositioning='ABSOLUTE';m.x=1440-460-48;m.y=900-32-48-48;m.paddingLeft=16;m.paddingRight=8;m.counterAxisAlignItems='CENTER';m.itemSpacing=8;radius(m,'lg');m.strokes=[paint('border')];m.strokeWeight=1;pending.push(m.setEffectStyleIdAsync(FX.Overlay.id));text(m,'Nothing to undo here.',200,'Body');const b=button(m,'Open Editor to undo','link',170);link(b,'232:24836');}
{const r=await figma.getNodeByIdAsync('232:24328');const u=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo');if(u)link(u,'232:24584');}
{const r=await figma.getNodeByIdAsync('232:19504');const l=r.findOne(n=>n.name==='Editing now line');const ins=r.findOne(n=>n.name==='Inspector / selected-object owner');const id=ins.children[0];l.resize(300,l.height);if(id.layoutMode!=='NONE'){id.primaryAxisSizingMode='AUTO';}mutations.push(l.id);}
await Promise.all(pending);
await (await figma.getNodeByIdAsync('232:24584')).screenshot({scale:.6});
return {mutatedNodeIds:mutations};
