await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const roots=figma.currentPage.children.filter(n=>n.type==='FRAME'&&!n.name.includes('handoff'));
const result=[];
for(const root of roots){
 const canvas=root.findOne(n=>n.name==='Canvas scroll and pan');
 const tb=root.findOne(n=>n.name.startsWith('Canvas toolbar /'));
 if(tb){const fit=tb.findOne(n=>n.type==='INSTANCE'&&n.name==='Fit');const old=tb.findOne(n=>n.type==='INSTANCE'&&/^\d+%$/.test(n.name));if(fit&&old){const parent=fit.parent,index=parent.children.indexOf(fit);const value=old.findOne(n=>n.type==='TEXT').characters;fit.remove();old.remove();const split=frame('Zoom / Fit ↔ 100% and menu',84,32,'HORIZONTAL','bg-panel');gap(split,0);edge(split);radius(split);parent.insertChild(index,split);const main=button(split,value,'Ghost',52);main.name='Zoom / toggle Fit ↔ 100%';const t=main.findOne(n=>n.type==='TEXT');pending.push(t.setTextStyleIdAsync(ST.Value.id));const menu=ib(split,'chevron-down');menu.name='Zoom / options menu';changed.push(tb.id);}
 const width=tb.findOne(n=>n.type==='INSTANCE'&&n.name==='Input/State=Default');if(width)pending.push(width.findOne(n=>n.type==='TEXT').setTextStyleIdAsync(ST.Value.id));
 }
 const selected=root.findOne(n=>n.name==='Text / stable object text-hero-01');
 const isMulti=root.name.startsWith('C03');
 if(selected&&canvas&&!isMulti){
  // Existing corner handles remain. Add midpoint handles at screen-size geometry.
  for(const[x,y]of[[selected.width/2,0],[selected.width/2,selected.height],[0,selected.height/2],[selected.width,selected.height/2]]){
   const hit=frame('Resize hit area 12px / midpoint',12,12,'HORIZONTAL',null,selected);abs(hit,x-6,y-6);const dot=track(figma.createRectangle());dot.name='Resize handle 8px';dot.resize(8,8);dot.fills=[paint('bg-panel')];dot.strokes=[paint('accent')];hit.appendChild(dot);abs(dot,2,2);
  }
  const sb=selected.absoluteBoundingBox,cb=canvas.absoluteBoundingBox;const bar=frame('Selection toolbar / single',120,32,'HORIZONTAL','bg-panel',canvas);pad(bar,0);gap(bar,8);radius(bar,'sm');edge(bar);abs(bar,Math.max(8,sb.x-cb.x+sb.width-120),Math.max(8,sb.y-cb.y-40));
  for(const[name,ic]of[['Duplicate','copy'],['Delete','trash-2'],['More','ellipsis']]){const b=ib(bar,ic);b.name=name;}
 }
 for(const row of root.findAllWithCriteria({types:['FRAME']}).filter(n=>n.name==='Field / Font size')){
  const mark=row.children.find(n=>n.type==='ELLIPSE');if(mark){mark.remove();const label=row.children.find(n=>n.type==='TEXT');const wrap=frame('Overridden property label',88,32,'HORIZONTAL',null);gap(wrap,4);wrap.counterAxisAlignItems='CENTER';row.insertChild(0,wrap);const dot=track(figma.createEllipse());dot.name='Tablet override indicator';dot.resize(4,4);dot.fills=[paint('accent')];wrap.appendChild(dot);wrap.appendChild(label);label.resize(80,20);label.textAutoResize='HEIGHT';changed.push(row.id,label.id);}
 }
 if(isMulti){
  const bc=tb.findOne(n=>n.name==='Selection ancestry');const t=bc.findOne(n=>n.type==='TEXT');t.characters='Hero · 2 elements';changed.push(t.id);
  const font=root.findOne(n=>n.name==='Font = Mixed');setText(font,'Inter');font.name='Font = Inter';pending.push(font.findOne(n=>n.type==='TEXT').setTextStyleIdAsync(ST.Body.id));
  const line=root.findOne(n=>n.name==='Line height = 36');setText(line,'Mixed');line.name='Line height = Mixed';pending.push(line.findOne(n=>n.type==='TEXT').setTextStyleIdAsync(ST.Mixed.id));
  const extra=root.findOne(n=>n.name==='Mixed boolean and swatch');if(extra)extra.remove();
  const color=root.findOne(n=>n.name==='Field / Color');const input=color.findOne(n=>n.type==='INSTANCE');input.paddingLeft=32;const sw=track(figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M0 0H16L0 16Z" fill="#111827"/><path d="M16 0V16H0Z" fill="#4B5563"/></svg>'));sw.name='Mixed color / diagonal';color.appendChild(sw);abs(sw,104,8);
  const box=root.findOne(n=>n.name==='Combined bounds / Headline + Text / no resize handles'),actions=root.findOne(n=>n.name==='Multi-selection actions');const b=box.absoluteBoundingBox,c=canvas.absoluteBoundingBox;actions.x=b.x-c.x+Math.max(0,b.width-actions.width);actions.y=b.y-c.y-48;changed.push(actions.id,input.id);
 }
 result.push({id:root.id,name:root.name,selectionHandles:root.findAll(n=>n.name.startsWith('Resize hit area')).length,singleToolbar:root.findAll(n=>n.name==='Selection toolbar / single').length});
}
await Promise.all(pending);
return {createdNodeIds:created,mutatedNodeIds:changed,frames:result};
