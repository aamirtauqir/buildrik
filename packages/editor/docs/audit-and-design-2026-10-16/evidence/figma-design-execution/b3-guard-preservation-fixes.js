const invalid=await clone('125:35023','B3-P115 · CMS / invalid title retained, navigation cancelled');
const footer=invalid.findOne(n=>n.name==='Record footer');for(const n of [...footer.children])n.remove();const disabled=button(footer,'Save record','disabled',128);button(footer,'Cancel','secondary',88);text(footer,'Enter a title before saving.',360,'Meta','error-text');
const p95=await figma.getNodeByIdAsync('125:35023');link(p95.findOne(n=>n.name==='Cancel navigation'),invalid.id);const s=p95.findOne(n=>n.name==='Save and leave');s.swapComponent(masters['4:261']);s.setProperties({'Label#4:18':'Save and leave'});mutations.push(s.id);
const gone=await clone('122:43331','B3-P116 · CMS / draft retained after About was removed');
for(const f of [gone,await figma.getNodeByIdAsync('126:36751')]){const strip=f.children.find(n=>n.name==='Bottom bar / pages and save status');const tab=strip.findAllWithCriteria({types:['INSTANCE']}).find(n=>Object.values(n.componentProperties).some(p=>p.type==='TEXT'&&p.value==='About'));if(tab){mutations.push(tab.id);tab.remove();}}
const body=gone.findOne(n=>n.name==='Record form / scrolling body');text(body,'About was removed. Your Studio launch draft is retained.',720,'Meta','warning-text');
const p105=await figma.getNodeByIdAsync('126:36751');link(p105.findOne(n=>n.name==='Keep editing'),gone.id);
for(const id of ['126:37330','126:35760']){const f=await figma.getNodeByIdAsync(id);const cancel=f.findOne(n=>n.name==='Cancel');cancel.swapComponent(masters['4:261']);cancel.setProperties({'Label#4:18':'Cancel unavailable'});cancel.resize(156,32);mutations.push(cancel.id);const foot=f.findOne(n=>n.name==='Record footer');text(foot,'This submitted save can’t be cancelled.',400,'Meta','ink-soft');}
return await finish();
