// PG-G01–04/12; representative Blog schema, existing owner and draft contracts.
const root=await clone('7:19791','B3-P88 · CMS / Studio launch draft');
const workspace=root.children.find(n=>n.name==='Workspace');
for(const n of [...workspace.children])if(!n.name.startsWith('Rail'))n.remove();
const rail=workspace.children[0];
const railItems=rail.findAllWithCriteria({types:['INSTANCE']}).filter(i=>Object.keys(i.componentProperties).some(k=>k==='Label#4:60'));
for(const i of railItems){const name=i.componentProperties['Label#4:60'].value;i.setProperties({State:name==='CMS'?'Active':'Default'});}
const nav=frame(workspace,'CMS navigation',240,812);pad(nav,16);nav.setBoundVariable('itemSpacing',V['spacing/12']);
text(nav,'CMS',208,'Panel');text(nav,'Collections',208,'Section');button(nav,'Blog · 20 records','secondary',208);button(nav,'Team · 6 records','ghost',208);text(nav,'Data',208,'Section');for(const s of ['Sources','Site variables','Conditions index'])button(nav,s,'ghost',208);text(nav,'Recovery',208,'Section');button(nav,'Recently deleted','link',208);
const main=frame(workspace,'CMS / record work area',1144,812);
const head=frame(main,'Area header',1144,56,'HORIZONTAL');pad(head,12);head.setBoundVariable('itemSpacing',V['spacing/12']);const back=button(head,'Back to Editor · Home','link',204);text(head,'Blog',260,'Area');
const tabs=frame(main,'Collection tabs',1144,44,'HORIZONTAL');pad(tabs,4);for(const t of ['Records','Fields','Dynamic pages','Collection settings'])button(tabs,t,t==='Records'?'secondary':'ghost',t.length*7+28);
const content=frame(main,'Record form / scrolling body',1144,648);pad(content,24);content.setBoundVariable('itemSpacing',V['spacing/16']);content.clipsContent=true;content.overflowDirection='VERTICAL';
const sub=frame(content,'Record identity',1096,40,'HORIZONTAL',null);text(sub,'Blog › Studio launch',700,'Panel');button(sub,'Form','secondary',72);button(sub,'Preview','ghost',80);
text(content,'Record · Unsaved changes',720,'Meta','warning-text');
function field(label,value){const f=frame(content,label,720,null,'VERTICAL',null);f.setBoundVariable('itemSpacing',V['spacing/4']);text(f,label,720,'Label');return input(f,value,720);}
const title=field('Title *','Studio launch — a new chapter');field('Slug *','studio-launch');field('Summary','A look at the work and people behind our new studio.');
const b=frame(content,'Article body',720,136,'VERTICAL','bg-subtle');pad(b,12);text(b,'Body',696,'Label');text(b,'Today we open our doors to a new chapter.\n\nOur team brings strategy, identity and digital design together.',696);
text(content,'Published · Included in the next site publish',720,'Label');text(content,'Eligible for publishing. Saving this record does not publish the site.',720,'Meta','ink-soft');
const footer=frame(main,'Record footer',1144,64,'HORIZONTAL');pad(footer,16);footer.setBoundVariable('itemSpacing',V['spacing/8']);const save=button(footer,'Save record','primary',128),cancel=button(footer,'Cancel','secondary',88);
status(root,'Page · Saved');
const over=await clone(root.id,'B3-P89 · CMS / Pages opened without losing draft');
const old=await figma.getNodeByIdAsync('63:6393');const manager=old.children.find(n=>n.name.startsWith('Pages manager')).clone();over.appendChild(manager);manager.layoutPositioning='ABSOLUTE';manager.x=56;manager.y=56;clearLinks(manager);
const guard=await clone(root.id,'B3-P90 · CMS / fixed About navigation guard');
const g=modal(guard,'Leave without saving?','Blog record “Studio launch” has unsaved changes. You asked to open About.',{note:'Only this record’s draft is affected. Your Home page remains unchanged.',actions:[{label:'Keep editing',kind:'primary',width:126},{label:'Discard changes',width:144},{label:'Save and leave',width:146}]});
g.refs['Keep editing'].parent.layoutMode='VERTICAL';g.refs['Keep editing'].parent.primaryAxisSizingMode='AUTO';g.refs['Keep editing'].parent.counterAxisSizingMode='FIXED';for(const n of Object.values(g.refs)){n.resize(432,32);}g.refs['Keep editing'].parent.resize(432,112);
const fail=await clone(root.id,'B3-P91 · CMS / save rejected, About still pending');
const fg=modal(fail,'Leave without saving?','Couldn’t save Blog record “Studio launch”. Your changes are kept; About has not been opened.',{note:'The server could not save this record. Retry uses the same record and draft.',actions:[{label:'Keep editing',kind:'primary',width:126},{label:'Retry save',width:106}]});status(fail,'Record · Couldn’t save');
link(g.refs['Keep editing'],root.id);link(g.refs['Discard changes'],'94:12846');link(g.refs['Save and leave'],fail.id);link(fg.refs['Keep editing'],root.id);link(fg.refs['Retry save'],'94:12846');
const pageRail=root.findAllWithCriteria({types:['INSTANCE']}).find(n=>Object.values(n.componentProperties).some(p=>p.type==='TEXT'&&p.value==='Pages'));if(pageRail)link(pageRail,over.id);
const close=manager.findOne(n=>n.name==='Close Pages'||n.name==='Close');if(close)link(close,root.id);
const about=manager.findAllWithCriteria({types:['INSTANCE']}).find(n=>Object.values(n.componentProperties).some(p=>p.type==='TEXT'&&p.value==='About'));if(about)link(about,guard.id);
for(const f of [root,over]){const strip=f.children.find(n=>n.name==='Bottom bar / pages and save status');const aboutTab=strip.findAllWithCriteria({types:['INSTANCE']}).find(n=>Object.values(n.componentProperties).some(p=>p.type==='TEXT'&&p.value==='About'));if(aboutTab)link(aboutTab,guard.id);}
link(back,'7:19791');
return await finish();
