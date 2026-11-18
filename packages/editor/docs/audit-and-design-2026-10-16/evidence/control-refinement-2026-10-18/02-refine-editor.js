await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const page=figma.currentPage;
const M=Object.fromEntries(await Promise.all(Object.entries({...C,...N}).filter(([k])=>!k.startsWith('State=')).map(async([k,id])=>[k,await figma.getNodeByIdAsync(id)])));
function inst(key,p,w,h){const n=track(M[key].createInstance());p.appendChild(n);if(w||h)n.resize(w||n.width,h||n.height);return n;}
function value(n,v,key='Value'){const k=Object.keys(n.componentProperties||{}).find(k=>k.split('#')[0]===key);if(k)n.setProperties({[k]:v});else{const t=n.findOne(x=>x.type==='TEXT');if(t){t.characters=v;changed.push(t.id);}}return n;}
function ico(name,p,size=16){return inst('Icon/'+name,p,size,size);}
function row(p,label,v,type='Input'){const r=inst('FieldRow',p,276,32);r.name='Field / '+label;value(r,label,'Label');const c=r.findOne(n=>n.type==='INSTANCE');c.swapComponent(M[type+'/State=Default']||M[type]);c.resize(180,32);value(c,v);return r;}
const processed=[],removed=[];
for(const root of page.children.filter(n=>n.type==='FRAME'&&n.width>=700)){
 const ins=root.findOne(n=>n.type==='FRAME'&&n.name==='Inspector / selected-object owner');
 for(const f of root.findAll(n=>n.type==='FRAME'&&['Topbar / site scope','History and viewport','Page context','Target'].includes(n.name))){f.counterAxisAlignItems='CENTER';changed.push(f.id);}
 for(const icon of root.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('Icon/'))){for(const child of icon.children){if(Math.abs(child.width-icon.width)>.1){child.rescale(icon.width/child.width);changed.push(child.id);}}}
 const list=root.findOne(n=>n.type==='FRAME'&&n.name==='Drawer scroll');
 if(list){list.paddingLeft=12;list.paddingRight=12;gap(list,0);for(const n of list.children){if('resize'in n&&n.type!=='TEXT')n.resize(260,n.height);if(n.type==='INSTANCE'&&n.name.startsWith('Layer / ')){const label=n.name.slice(8);if(['Eyebrow','Headline','Text','Explore our work'].includes(label)){const first=n.findOne(x=>x.type==='INSTANCE'&&x.name==='Icon/chevron-right');if(first){first.opacity=0;changed.push(first.id);}}}changed.push(n.id);}changed.push(list.id);}
 if(!ins)continue;
 const body=ins.findOne(n=>n.type==='FRAME'&&n.name==='Inspector scroll');
 const identity=ins.findOne(n=>n.type==='FRAME'&&n.name==='Identity and scope / persistent');
 const tabrow=ins.findOne(n=>n.type==='FRAME'&&n.name==='Inspector tabs');if(tabrow){tabrow.counterAxisAlignItems='CENTER';changed.push(tabrow.id);}
 const type=identity?.findOne(n=>n.type==='TEXT');const isHero=type&&type.characters==='Hero';
 if(identity&&!identity.findOne(n=>n.name==='Authored element state')){
  identity.resize(300,112);const context=frame('Authored element state',276,32,'HORIZONTAL',null,identity);gap(context,8);txt(context,'State','Meta','ink-soft',88);value(inst('Select/State=Default',context,180,32),'Default');
  if(body)body.resize(300,ins.height-153);changed.push(identity.id,body.id);
 }
 if(!body)continue;
 for(const s of body.children.filter(n=>n.type==='FRAME'&&n.name.startsWith('Section / '))){const head=s.children[0];if(head&&head.type==='FRAME'){head.resize(276,32);head.counterAxisAlignItems='CENTER';gap(head,8);for(const ic of head.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('Icon/'))){ic.resize(12,12);for(const ch of ic.children)if(ch.width!==12)ch.rescale(12/ch.width);}changed.push(head.id);}changed.push(s.id);}
 const ty=body.findOne(n=>n.type==='FRAME'&&n.name==='Section / Typography');
 if(ty){
  if(!ty.findOne(n=>n.name==='Field / Font-size token')){const fr=row(ty,'Font-size token','Custom','Select');fr.resize(276,40);const label=fr.children[0];label.resize(88,40);label.textAutoResize='HEIGHT';ty.insertChild(1,fr);}
  const alignment=ty.children.find(n=>n.type==='FRAME'&&n.name==='Alignment');
  if(alignment&&!alignment.findOne(n=>n.type==='INSTANCE'&&n.name==='Segments')){for(const x of [...alignment.children].slice(1)){removed.push(x.id);x.remove();}gap(alignment,8);alignment.counterAxisAlignItems='CENTER';const l=alignment.children[0];l.resize(88,20);inst('Segments',alignment,180,32);changed.push(alignment.id,l.id);}
  const col=ty.findOne(n=>n.type==='FRAME'&&n.name==='Field / Color');
  if(col){const c=col.findOne(n=>n.type==='INSTANCE');if(c){const text=c.findOne(n=>n.type==='TEXT')?.characters||'#4B5563';c.swapComponent(M.ColorControl);c.resize(180,32);value(c,text);changed.push(c.id);}}
 }
 const layout=body.findOne(n=>n.type==='FRAME'&&n.name==='Section / Layout');
 if(layout){layout.name='Section / Size';const title=layout.children[0].findOne(n=>n.type==='TEXT');title.characters='Size';changed.push(layout.id,title.id);
  const display=layout.findOne(n=>n.type==='FRAME'&&n.name==='Field / Display');if(display){const s=frame('Section / Placement',300,null,'VERTICAL','bg-panel',body);pad(s,12);gap(s,8);const h=inst('PropertyGroup',s);value(h,'Placement','Label');s.appendChild(display);body.insertChild(0,s);const d=divider(body,300);body.insertChild(1,d);changed.push(display.id);}
 }
 if(isHero){const content=body.findOne(n=>n.type==='FRAME'&&n.name==='Section / Text content');if(content){content.name='Section / Container content';const head=content.children[0];const t=head.findOne(n=>n.type==='TEXT');t.characters='Container content';changed.push(t.id);for(const n of [...content.children].slice(1)){removed.push(n.id);n.remove();}txt(content,'Content is inside this container’s children. Select a child on the canvas or in Layers to edit it.','Body','ink-soft',276);const summary=frame('Child summary',276,32,'HORIZONTAL','bg-subtle',content);pad(summary,8);ico('layers',summary);txt(summary,'3 child elements','Meta','ink-soft');}
  const tag=body.findOne(n=>n.type==='FRAME'&&n.name==='Field / Tag');if(tag){const c=tag.findOne(n=>n.type==='INSTANCE');value(c,'Section');changed.push(c.id);}
  const id=body.findOne(n=>n.type==='FRAME'&&n.name==='Field / ID');if(id){const c=id.findOne(n=>n.type==='INSTANCE');value(c,'hero');changed.push(c.id);}
 }
 // Keep header source copy concrete without implying that content is responsive.
 if(identity){const scope=identity.children.find(n=>n.type==='TEXT');if(scope){if(scope.characters==='Desktop · All breakpoints')scope.characters='Editing Desktop · Default state';changed.push(scope.id);}}
 processed.push(root.id);
}
await Promise.all(pending);
return {createdNodeIds:created,mutatedNodeIds:[...new Set(changed)],removedNodeIds:removed,processedFrames:processed,status:'Refined in place; prototype target IDs retained for existing controls'};
