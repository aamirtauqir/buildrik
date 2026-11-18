// Prepend continuation-helpers.js page3:7. P10 load/error, access, short-height and narrow layout.
async function loadState(code,base,section,error=false){
 const r=await clone(base,'B8-'+code+' · '+section+' / '+(error?'load failed, retry':'loading settings'));
 const host=r.findOne(n=>n.name==='Settings content');for(const c of [...host.children])c.remove();
 text(host,error?'Couldn’t load '+section:'Loading '+section+'…',720,'Panel');
 if(error){text(host,'The settings service did not respond. Your existing configuration has not changed.',720,'Body','ink-soft');link(button(host,'Try again','primary',120),base);}
 else for(let i=0;i<3;i++){const card=frame(host,'Loading placeholder '+i,720,96,'VERTICAL','bg-subtle');pad(card,16);card.itemSpacing=12;for(const width of [160,560]){const bar=figma.createRectangle();card.appendChild(bar);bar.resize(width,12);bar.fills=[paint('border')];bar.cornerRadius=4;}}
 const ft=r.findOne(n=>n.name==='Settings footer');ft.children.find(n=>n.type==='TEXT').characters=error?'Settings unavailable · Retry to continue':'Loading settings…';
 for(const n of ft.children.filter(n=>n.type==='INSTANCE')){n.swapComponent(masters['4:261']);n.setProperties({'Label#4:18':'Save settings'});}
 return r;
}
const anLoad=await loadState('AN13','245:45159','Analytics');
const anError=await loadState('AN14','245:45159','Analytics',true);
const shLoad=await loadState('SH12','245:47988','Security headers');
const shError=await loadState('SH13','245:47988','Security headers',true);
for(const [err,loading] of [[anError,anLoad],[shError,shLoad]])link(err.findOne(n=>n.type==='INSTANCE'&&n.name==='Try again'),loading.id);
function fitBar(bar,width,flexName){
 bar.resize(width,bar.height);const flex=bar.findOne(n=>n.name===flexName);if(!flex)return;
 const visible=bar.children.filter(n=>n.visible);const used=visible.reduce((s,n)=>s+n.width,0)+Math.max(0,visible.length-1)*bar.itemSpacing+bar.paddingLeft+bar.paddingRight;
 flex.resize(Math.max(40,flex.width+width-used),flex.height);
}
async function compact(code,base,title){
 const r=await clone(base,'B8-'+code+' · '+title+' / 1280×640, fixed footer and scrolling form');r.resize(1280,640);
 fitBar(r.findOne(n=>n.name==='Topbar / site scope'),1280,'Flexible space');
 const workspace=r.findOne(n=>n.name==='Workspace');workspace.resize(1280,552);
 const rail=workspace.findOne(n=>n.name==='Rail / permanent tools and areas');rail.resize(56,552);
 const railFlex=rail.findOne(n=>n.name==='Rail flexible space');if(railFlex)railFlex.resize(railFlex.width,Math.max(0,railFlex.height-260));
 r.findOne(n=>n.name==='Settings navigation').visible=false;
 const work=r.findOne(n=>n.name==='Brand work area');work.resize(1224,552);
 const hd=r.findOne(n=>n.name==='Brand header / return and shared history');hd.resize(1224,104);
 const identity=r.findOne(n=>n.name==='Identity and return');identity.resize(1176,32);
 const heading=identity.children.find(n=>n.type==='TEXT');heading.resize(1176-120-192-24,heading.height);
 const nav=button(identity,'Settings navigation','secondary',192);
 const scope=r.findOne(n=>n.name==='Scope');if(scope)scope.resize(1176,32);
 const host=r.findOne(n=>n.name==='Settings content');host.resize(1224,392);host.primaryAxisSizingMode='FIXED';host.clipsContent=true;host.overflowDirection='VERTICAL';
 const footer=r.findOne(n=>n.name==='Settings footer');footer.resize(1224,56);footer.y=496;const footerText=footer.children.find(n=>n.type==='TEXT');footerText.resize(1024,footerText.height);
 fitBar(r.findOne(n=>n.name==='Bottom bar / pages and save status'),1280,'Created page tabs');
 return {r,nav};
}
const anCompact=await compact('AN15','245:45159','Analytics');
const shCompact=await compact('SH14','245:47988','Security headers');
async function navMenu(base,name,other){
 const r=await clone(base.r.id,name);
 const menu=frame(r,'Settings navigation / compact popover',280,null);menu.layoutPositioning='ABSOLUTE';menu.x=1280-304;menu.y=96;pad(menu,12);menu.itemSpacing=4;menu.strokes=[paint('border')];menu.strokeWeight=1;pending.push(menu.setEffectStyleIdAsync(FX.Menu.id));
 text(menu,'Site settings',256,'Panel');link(button(menu,'Analytics','link',256),anCompact.r.id);link(button(menu,'Security headers','link',256),shCompact.r.id);link(button(menu,'Close','secondary',256),base.r.id);link(base.nav,r.id);return r;
}
await navMenu(anCompact,'B8-AN16 · Analytics / compact navigation popover',shCompact.r.id);
await navMenu(shCompact,'B8-SH15 · Security / compact navigation popover',anCompact.r.id);
const access=await clone('245:45159','B8-PM02 · Permissions / checking access');
const m=modal(access,'Permissions','Checking your access…',{width:480,actions:[{label:'Close',kind:'primary',width:96}]});link(m.refs.Close,'245:45159');
const accessError=await clone('245:45159','B8-PM03 · Permissions / access unavailable, retry');
const e=modal(accessError,'Permissions','Couldn’t check your access. Your permissions have not changed.',{width:480,actions:[{label:'Close',width:96},{label:'Try again',kind:'primary',width:112}]});link(e.refs.Close,'245:45159');link(e.refs['Try again'],access.id);
// Read-only means disabled controls, with values retained (not merely reduced opacity).
for(const id of ['245:49024','248:19606']){
 const r=await figma.getNodeByIdAsync(id);const host=r.findOne(n=>n.name==='Settings content');
 for(const n of host.findAllWithCriteria({types:['INSTANCE']}).filter(n=>n.name.startsWith('Input /')||n.name.startsWith('Toggle /'))){if('State'in n.componentProperties){n.setProperties({State:'Disabled'});mutations.push(n.id);}}
}
return await finish();
