const page=await figma.getNodeByIdAsync('3:4');await figma.setCurrentPageAsync(page);
const opts=[{}, {add:true}, {add:true,inserted:true},{inserted:true},{inserted:true,edited:true},{inserted:true,edited:true,styled:true,styleTab:true}];
const replaced=[];
for(let i=0;i<6;i++){const root=await figma.getNodeByIdAsync(J[i].id);const old=await figma.getNodeByIdAsync(J[i].site.id);const parent=old.parent;const oldId=old.id;old.remove();const next=site(parent,parent.width,parent.height,opts[i]);replaced.push({frame:root.id,removedSite:oldId,newSite:next.root.id});J[i].site.id=next.root.id;
 for(const n of root.findAllWithCriteria({types:['FRAME']})){if(['Target','Page context','Typography','Layout'].includes(n.name)||n.name.startsWith('Collapsed / ')){gap(n,8);changed.push(n.id);}if(n.name==='Field / Letter spacing'){n.resize(276,40);changed.push(n.id);}}
}
// Explicit controls preserve scope; chrome actions are shared instances.
for(const f of J){const root=await figma.getNodeByIdAsync(f.id);const top=root.findOne(n=>n.name==='Topbar / site scope');if(top){const settings=top.findOne(n=>n.name==='Site settings');const index=top.children.indexOf(settings);const wrap=frame('Site settings / visible labeled entry',140,32,'HORIZONTAL',null);gap(wrap,4);wrap.counterAxisAlignItems='CENTER';top.insertChild(index,wrap);icon('settings',wrap);wrap.appendChild(settings);settings.resize(116,32);f.refs.settings=wrap.id;changed.push(top.id,settings.id);}
 if(f.geometry&&!f.geometry.preview){const zoom=await figma.getNodeByIdAsync(f.refs.toolbar.zoom);setText(zoom,Math.round(f.site.scale*100)+'%');}
}
const links=[];
async function link(id,to,label){const n=await figma.getNodeByIdAsync(id);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:J[to].id,navigation:'NAVIGATE',transition:null,resetScrollPosition:false}]}]);links.push({from:id,to:J[to].id,label});changed.push(id);}
await link(J[0].refs.Add,1,'Open Add');
await link(J[1].refs.insert,2,'Insert Text into named Hero target');
await link(J[2].refs.Layers,3,'Open Layers retaining Text selection');
await link(J[3].refs.inspector.edit,4,'Illustrative committed text edit');
await link(J[4].refs.inspector.Style,5,'Open Style and commit Desktop size 24px');
await link(J[5].refs.toolbar.tablet,6,'Switch to Tablet, preserving Desktop source');
await link(J[6].refs.inspector.size,7,'Illustrative committed Tablet size 20px');
await link(J[7].refs.inspector.reset,8,'Remove Tablet override, resolve Desktop 24px');
await link(J[8].refs.toolbar.undo,9,'Undo removal → Tablet 20px');
await link(J[9].refs.toolbar.redo,8,'Redo removal → inherited Desktop 24px');
await link(J[8].refs.preview,10,'Preview current Tablet draft');
await link(J[10].refs.back,11,'Restore exact editing context');
await link(J[11].refs.preview,10,'Preview again');
page.flowStartingPoints=[{nodeId:J[0].id,name:'J-F1 / Existing site editing journey'}];
await Promise.all(pending);
return {createdNodeIds:[...new Set([...created,...replaced.flatMap(x=>[])])],mutatedNodeIds:changed,replaced,frames:J,links};
