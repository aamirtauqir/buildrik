// Shared native Figma authoring utilities; source values from SC-27.
await Promise.all(['Regular','Medium','Semi Bold','Italic'].map(style=>figma.loadFontAsync({family:'Inter',style})).concat([figma.loadFontAsync({family:'Geist Mono',style:'Regular'})]));
const allVars=await figma.variables.getLocalVariablesAsync();
const V=Object.fromEntries(allVars.map(v=>[v.name,v]));
const ST=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const FX=Object.fromEntries((await figma.getLocalEffectStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const created=[], changed=[], pending=[];
const track=n=>(created.push(n.id),n);
function resolved(v){let val=Object.values(v.valuesByMode)[0];return val&&val.type==='VARIABLE_ALIAS'?resolved(allVars.find(x=>x.id===val.id)):val;} const paint=k=>{const v=V['color/'+k],rgb=resolved(v);return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:rgb.r,g:rgb.g,b:rgb.b}},'color',v);};
function radius(n,key='lg'){for(const f of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(f,V['radius/'+key]);}
function gap(n,v){n.setBoundVariable('itemSpacing',V['spacing/'+v]);}
function pad(n,v){for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])n.setBoundVariable(p,V['spacing/'+v]);}
function frame(name,w,h,dir='VERTICAL',bg='bg-panel',parent){const n=track(figma.createAutoLayout(dir));n.name=name;n.resize(w,h||1);n.primaryAxisSizingMode=dir==='VERTICAL'&&!h?'AUTO':'FIXED';n.counterAxisSizingMode=dir==='HORIZONTAL'&&!h?'AUTO':'FIXED';n.fills=bg?[paint(bg)]:[];n.clipsContent=false;if(parent)parent.appendChild(n);return n;}
function txt(parent,value,role='Body',color='ink',width){const n=track(figma.createText());n.name=value;const s=ST[role];n.fontName=s.fontName;n.fontSize=s.fontSize;n.lineHeight=s.lineHeight;n.fills=[paint(color)];if(parent)parent.appendChild(n);if(width){n.resize(width,20);n.textAutoResize='HEIGHT';}else n.textAutoResize='WIDTH_AND_HEIGHT';n.characters=value;pending.push(n.setTextStyleIdAsync(s.id));return n;}
function fill(n){n.layoutSizingHorizontal='FILL';return n;}
function spacer(parent){const n=frame('Flexible space',1,1,'HORIZONTAL',null,parent);n.layoutSizingHorizontal='FILL';return n;}
function divider(parent,w){const n=track(figma.createRectangle());n.name='Divider';n.resize(w,1);n.fills=[paint('border')];parent.appendChild(n);return n;}
function edge(n){n.strokes=[paint('border')];n.strokeWeight=1;}
function abs(n,x,y){if(n.parent&&'layoutMode'in n.parent&&n.parent.layoutMode!=='NONE')n.layoutPositioning='ABSOLUTE';n.x=x;n.y=y;return n;}
function descendants(n){return [n.id,...n.findAll(()=>true).map(x=>x.id)];}
function rawIcon(svg,name,parent,size=16,color='ink-soft'){const n=track(figma.createNodeFromSvg(svg));n.name=name;n.resize(size,size);if(parent)parent.appendChild(n);for(const c of n.findAll(()=>true)){created.push(c.id);if('strokes' in c&&Array.isArray(c.strokes)&&c.strokes.length)c.strokes=[paint(color)];if('fills' in c&&Array.isArray(c.fills)&&c.fills.length)c.fills=[paint(color)];}return n;}
function component(name,w,h,dir='HORIZONTAL',bg='bg-panel'){const n=track(figma.createComponent());n.name=name;n.layoutMode=dir;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.primaryAxisAlignItems='MIN';n.counterAxisAlignItems='CENTER';n.fills=bg?[paint(bg)]:[];gap(n,8);return n;}
function labelProp(c,t,name='Label'){const key=c.addComponentProperty(name,'TEXT',t.characters);t.componentPropertyReferences={characters:key};return key;}

await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const roots=ROOTS;const removed=[],results=[];
const stacked=await figma.getNodeByIdAsync('80:14400'),ghost=await figma.getNodeByIdAsync('4:268');
const label=n=>n.type==='INSTANCE'?n.componentProperties['Label#4:18']?.value:null;
const descendantsSafe=n=>[n,...(n.children?n.findAll(()=>true):[])];
function mark(n){changed.push(n.id);}
function w(n,value){n.resize(value,n.height);mark(n);}
function group(name,width,parent,bg=null){const n=frame(name,width,0,'VERTICAL',bg,parent);gap(n,4);return n;}
for(const id of roots){
 const root=await figma.getNodeByIdAsync(id),panel=root.children.find(n=>n.name.startsWith('Pages manager'));if(!panel)continue;
 const fonts=new Map();for(const t of panel.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
 if(panel.findOne(n=>n.name==='Pages navigation / pinned')){results.push({root:id,skipped:true});continue;}
 const body=panel.children.find(n=>n.name.startsWith('Pages body')),header=panel.children.find(n=>n.name==='Header'),footer=panel.children.find(n=>n.name==='Manager footer');
 const inner=panel.width-24;
 const search=body.children.find(n=>n.name==='Search'),views=body.children.find(n=>n.name==='Manager views');
 if(search&&views){
  const nav=frame('Pages navigation / pinned',panel.width,92,'VERTICAL','bg-panel');pad(nav,12);nav.setBoundVariable('paddingTop',V['spacing/8']);nav.setBoundVariable('paddingBottom',V['spacing/8']);gap(nav,8);panel.insertChild(panel.children.indexOf(body),nav);nav.appendChild(search);nav.appendChild(views);w(search,inner);w(views,inner);mark(search);mark(views);
  const more=views.children.find(n=>n.type==='INSTANCE'&&n.name==='More page views and actions');
  if(more){header.insertChild(header.children.length-1,more);more.name='More page actions';mark(more);}
  for(const sp of [...views.children,...header.children].filter(n=>n.name==='Flexible space')){removed.push(sp.id);sp.remove();}
  const title=header.children.find(n=>n.type==='TEXT');title.layoutSizingHorizontal='FILL';mark(title);
  views.name='Page views / segmented';views.fills=[paint('bg-subtle')];radius(views,'sm');pad(views,2);gap(views,2);views.resize(inner,36);
  const tabs=views.children.filter(n=>n.type==='INSTANCE');
  for(const tab of tabs){
   const selected=tab.componentProperties.Style?.value==='Secondary';
   tab.setProperties({Style:'Ghost'});tab.resize((inner-8)/3,32);tab.layoutSizingHorizontal='FILL';tab.fills=selected?[paint('bg-panel')]:[];tab.strokes=selected?[paint('border')]:[];radius(tab,'sm');
   for(const t of tab.findAllWithCriteria({types:['TEXT']})){t.fills=[paint(selected?'ink':'ink-soft')];mark(t);}
   mark(tab);
  }
  mark(header);mark(views);
 }
 const original=[...body.children], folderTitle=original.find(n=>n.type==='TEXT'&&n.characters.startsWith('MY FOLDERS'));
 const collectionTitle=original.find(n=>n.type==='TEXT'&&n.characters==='COLLECTION PAGES');
 const legend=original.find(n=>n.type==='TEXT'&&n.characters==='● Unsaved changes');
 if(folderTitle){
  const idx=original.indexOf(folderTitle),list=group('Pages / page list',inner);
  body.insertChild(0,list);
  for(const n of original.slice(0,idx)){if(n===search||n===views)continue;list.appendChild(n);mark(n);}
  if(legend){legend.characters='● marks a page with unsaved changes';legend.name='Page indicator legend';list.appendChild(legend);mark(legend);}
  const folderSection=group('Folders / private organization',inner);
  body.insertChild(body.children.indexOf(folderTitle),folderSection);
  folderSection.appendChild(folderTitle);folderTitle.characters='My folders';folderTitle.name='My folders';mark(folderTitle);
  const privacy=txt(folderSection,'Only visible to you','Meta','ink-soft',inner);
  for(const n of original.slice(idx+1,collectionTitle?original.indexOf(collectionTitle):undefined)){if(n.type==='RECTANGLE'){removed.push(n.id);n.remove();}else {folderSection.appendChild(n);mark(n);}}
 }
 if(collectionTitle){
  const idx=original.indexOf(collectionTitle),collectionRow=original.slice(idx+1).find(n=>n.name==='PageResourceRow');
  const open=original.find(n=>label(n)==='Open collection page'),cms=original.find(n=>label(n)==='Manage in CMS');
  if(collectionRow&&open&&cms){
   const section=group('Collection pages / grouped actions',inner);
   body.insertChild(body.children.indexOf(collectionTitle),section);
   section.appendChild(collectionTitle);collectionTitle.characters='Collection pages';collectionTitle.name='Collection pages';mark(collectionTitle);
   const card=group('Blog post / collection and actions',inner,section,'bg-subtle');pad(card,8);radius(card,'sm');gap(card,8);
   card.appendChild(collectionRow);w(collectionRow,inner-16);
   const actions=frame('Blog post / actions',inner-16,32,'HORIZONTAL',null,card);gap(actions,4);
   actions.appendChild(open);actions.appendChild(cms);
   open.setProperties({'Label#4:18':'Open page',Style:'Secondary'});cms.setProperties({Style:'Ghost'});
   w(open,(inner-20)/2);w(cms,(inner-20)/2);mark(open);mark(cms);
  }
 }
 for(const row of body.findAll(n=>n.type==='INSTANCE'&&n.name==='PageResourceRow')){
  if(row.componentProperties['Status#62:2']?.value==='Hidden from publish'){
   const props=Object.fromEntries(Object.entries(row.componentProperties).filter(([k,v])=>v.type==='TEXT').map(([k,v])=>[k,v.value]));
   const action=row.findOne(n=>n.name==='Page actions'),rx=action?.reactions||[];
   const width=row.width;row.swapComponent(stacked);row.setProperties(props);row.resize(width,56);
   const newAction=row.findOne(n=>n.name==='Page actions');if(newAction&&rx.length)await newAction.setReactionsAsync(rx);
   mark(row);if(newAction)mark(newAction);
  }
 }
 const add=footer?.children.find(n=>label(n)==='+ Add page'),template=footer?.children.find(n=>label(n)==='From template'),folder=footer?.children.find(n=>n.name==='New folder');
 if(add&&template&&folder){
  for(const sp of [...footer.children].filter(n=>n.name==='Flexible space')){removed.push(sp.id);sp.remove();}
  footer.layoutMode='VERTICAL';footer.resize(panel.width,84);pad(footer,8);gap(footer,4);
  add.setProperties({Style:'Primary'});add.resize(panel.width-16,32);add.layoutSizingHorizontal='FILL';mark(add);
  const secondary=frame('Page creation / secondary actions',panel.width-16,32,'HORIZONTAL',null,footer);gap(secondary,4);secondary.appendChild(template);secondary.appendChild(folder);
  const rx=folder.reactions;folder.swapComponent(ghost);folder.setProperties({'Label#4:18':'New folder',Style:'Ghost'});await folder.setReactionsAsync(rx);
  for(const n of [template,folder]){n.resize((panel.width-20)/2,32);n.layoutSizingHorizontal='FILL';mark(n);}
  mark(footer);
 }
 gap(body,12);body.clipsContent=true;body.overflowDirection='VERTICAL';mark(body);mark(panel);
 for(const menu of root.children.filter(n=>n.name==='Page actions menu')){
  if(root.id==='65:17148'){menu.x=56;menu.y=108;}else{const target=body.findOne(n=>n.type==='INSTANCE'&&n.componentProperties['Name#62:0']?.value==='About');if(target){menu.x=56+panel.width;menu.y=target.absoluteTransform[1][2]-root.absoluteTransform[1][2];}}
  mark(menu);
 }
 results.push({root:id,panel:panel.id,width:panel.width,bodyHeight:body.height,footerHeight:footer?.height,collection:!!collectionTitle,legend:legend?.characters});
}
await Promise.all(pending);
return {createdNodeIds:created,mutatedNodeIds:[...new Set(changed)],removedNodeIds:removed,results};
