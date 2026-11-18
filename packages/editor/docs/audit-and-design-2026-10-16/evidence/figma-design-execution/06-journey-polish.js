await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('3:4'));
for(let i=0;i<J.length;i++){
 const f=J[i];if(f.geometry.preview)continue;
 const old=await figma.getNodeByIdAsync(f.refs.toolbar.root);const parent=old.parent;const index=parent.children.indexOf(old);old.remove();
 const o={inserted:i>1,tablet:i>5};const t=toolbar(parent,parent.width,o);parent.insertChild(index,t.root);f.refs.toolbar=Object.fromEntries(Object.entries(t).map(([k,v])=>[k,v.id]));setText(t.zoom,Math.round(f.site.scale*100)+'%');
 if(i===7||i===9){const root=await figma.getNodeByIdAsync(f.id);const fieldNode=root.findOne(n=>n.name==='Line height = 30');if(fieldNode){setText(fieldNode,'36');fieldNode.name='Line height = 36';}const siteRoot=await figma.getNodeByIdAsync(f.site.id);const selected=siteRoot.findOne(n=>n.name==='Good design makes room for what matters.');selected.lineHeight={unit:'PIXELS',value:36*f.site.scale};changed.push(selected.id);}
}
const targets=[[0,'Add',1],[1,'insert',2],[2,'Layers',3],[3,'inspector.edit',4],[4,'inspector.Style',5],[5,'toolbar.tablet',6],[6,'inspector.size',7],[7,'inspector.reset',8],[8,'toolbar.undo',9],[9,'toolbar.redo',8],[8,'preview',10],[10,'back',11],[11,'preview',10]];
const links=[];for(const[from,path,to]of targets){const id=path.split('.').reduce((a,k)=>a[k],J[from].refs);const n=await figma.getNodeByIdAsync(id);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:J[to].id,navigation:'NAVIGATE',transition:null,resetScrollPosition:false}]}]);changed.push(id);links.push({from:id,to:J[to].id,action:path});}
await Promise.all(pending);
return {createdNodeIds:created,mutatedNodeIds:changed,frames:J,links};
