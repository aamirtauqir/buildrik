// Shared native Figma authoring utilities; source values from SC-27.
await Promise.all(['Regular','Medium','Semi Bold','Italic'].map(style=>figma.loadFontAsync({family:'Inter',style})).concat([figma.loadFontAsync({family:'Geist Mono',style:'Regular'})]));
const allVars=await figma.variables.getLocalVariablesAsync();
const V=Object.fromEntries(allVars.map(v=>[v.name,v]));
const ST=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const FX=Object.fromEntries((await figma.getLocalEffectStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const created=[], changed=[], pending=[];
const track=n=>(created.push(n.id),n);
const paint=k=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',V['color/'+k]);
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

const page=await figma.getNodeByIdAsync('3:4');await figma.setCurrentPageAsync(page);
const ids=['7:20634','4:238','4:253','4:268','4:284','4:310','4:326','4:362','4:414','4:418','4:514','62:1576'];
const M=Object.fromEntries(await Promise.all(ids.map(async id=>[id,await figma.getNodeByIdAsync(id)])));
function instance(id,parent,props,w,h){const n=M[id].createInstance();parent.appendChild(n);if(props)n.setProperties(props);if(w)n.resize(w,h||n.height);created.push(...descendants(n));return n;}
function button(p,label,style='secondary',w){return instance(style==='primary'?'4:238':style==='ghost'?'4:268':'4:253',p,{'Label#4:18':label},w||Math.max(72,label.length*7+24),32);}
function iconButton(p,icon,name){const n=instance('4:284',p,{'Icon#4:24':icon},32,32);n.name=name;return n;}
function input(p,value,w,state='default'){const n=instance('4:310',p,{'Value#4:30':value},w,28);if(state==='error')n.setProperties({State:'Error'});return n;}
function select(p,value,w){return instance('4:362',p,{'Value#4:42':value},w,28);}
function line(p,value,w,role='Meta',color='ink-soft'){return txt(p,value,role,color,w);}
function row(p,name,url,status='',selected=false){const n=instance('62:1576',p,{'Name#62:0':name,'URL#62:1':url,'Status#62:2':status},p.width-p.paddingLeft-p.paddingRight,40);if(selected)n.fills=[paint('accent-subtle')];return n;}
function surface(root,name,w,h,x,y){const n=frame(name,w,h,'VERTICAL','bg-panel',root);abs(n,x,y);edge(n);radius(n,'lg');gap(n,0);pending.push(n.setEffectStyleIdAsync(FX.Overlay.id));return n;}
function header(p,title){const n=frame('Header',p.width,56,'HORIZONTAL',null,p);pad(n,12);gap(n,8);n.counterAxisAlignItems='CENTER';txt(n,title,'Panel');spacer(n);const close=iconButton(n,'4:125','Close '+title);divider(p,p.width);return close;}
function actions(p,labels){const n=frame('Footer',p.width,48,'HORIZONTAL',null,p);pad(n,8);gap(n,8);n.counterAxisAlignItems='CENTER';spacer(n);return labels.map(([label,style])=>button(n,label,style));}
function note(root,msg){const n=surface(root,'Context receipt',470,48,942,108);pad(n,12);line(n,msg,446);}
function shell(name,index){const n=M['7:20634'].clone();page.appendChild(n);n.name=name;n.x=80+(index%4)*1560;n.y=3600+Math.floor(index/4)*1120;for(const c of n.findAll(()=>true)){if('reactions'in c&&c.reactions.length)c.reactions=[];}created.push(...descendants(n));return n;}
function manager(root,mode='default'){const wide=mode==='listings';const p=surface(root,'Pages manager / '+mode,wide?720:560,700,12,156);const close=header(p,mode==='deleted'?'Recently deleted · 1':'Pages · 5');const body=frame('Pages body / one scroll region',p.width,1,'VERTICAL',null,p);pad(body,12);gap(body,8);body.layoutSizingVertical='FILL';body.clipsContent=true;
const search=instance('4:326',body,{'Value#4:36':mode==='empty'?'zzzz':'Search pages…'},p.width-24,32);
const views=frame('Manager views',p.width-24,32,'HORIZONTAL',null,body);gap(views,4);
const nav={};
for(const v of ['Pages','Listings','Structure'])nav[v]=button(views,v,(v==='Listings'&&mode==='listings')||(v==='Structure'&&mode==='structure')||(v==='Pages'&&!['listings','structure'].includes(mode))?'secondary':'ghost');
spacer(views);nav.More=iconButton(views,'4:45','More page views and actions');
const refs={close,search,...nav};
if(mode==='empty'){line(body,'No pages match “zzzz”',p.width-24,'Panel','ink');refs.clear=button(body,'Clear search','secondary');}
else if(mode==='deleted'){line(body,'Deleted pages stay here for 30 days.',p.width-24);const r=row(body,'About','/about','Deleted just now');r.resize(r.width,48);refs.restore=button(body,'Restore','primary');line(body,'Restores the page with its settings and URL.',p.width-24);refs.back=button(body,'Back to Pages','ghost');}
else {
if(wide)line(body,'Page and URL                                      SEO score      Visibility',p.width-24,'Section');
const list=mode==='removed'? [['Home','/','Current'],['Work','/work',''],['Contact','/contact','Hidden']]:[['Home','/','Current'],[mode==='renamed'?'Our story':'About',mode==='renamed'?'/our-story':'/about',''],['Work','/work',''],['Contact','/contact','Hidden']];
for(const [name,url,status] of list){const r=row(body,name,url,wide?(name==='About'?'82 · Indexed':status||'Indexed'):status,name==='Home');if(name==='About'||name==='Our story'){refs.about=r;refs.aboutMenu=r.findOne(n=>n.name==='Page actions');}if(name==='Home')refs.home=r;}
if(mode==='structure')line(body,'Structure follows URLs; folders below are your own grouping.',p.width-24);
line(body,'MY FOLDERS · ONLY YOU SEE THESE',p.width-24,'Section');row(body,'Studio','1 page','Folder');row(body,'Legal','/legal','In Studio');
divider(body,p.width-24);line(body,'COLLECTION PAGES',p.width-24,'Section');row(body,'Blog post','/blog/{slug}','20 pages');refs.collection=button(body,'Open collection page','ghost');refs.cms=button(body,'Manage in CMS','ghost');
line(body,'● Unsaved changes',p.width-24,'Micro');if(mode==='restored')line(body,'About restored. Page settings and URL retained.',p.width-24,'Meta','ink');
}
const foot=frame('Manager footer',p.width,48,'HORIZONTAL',null,p);pad(foot,8);gap(foot,8);foot.counterAxisAlignItems='CENTER';refs.add=button(foot,'+ Add page','secondary');refs.template=button(foot,'From template','ghost');spacer(foot);refs.folder=iconButton(foot,'4:45','New folder');
return {p,body,refs};}
function menu(root,items,x=572,y=260,w=280){const n=surface(root,'Page actions menu',w,1,x,y);pad(n,4);gap(n,0);n.primaryAxisSizingMode='AUTO';const refs={};for(const label of items){const r=instance('4:514',n,{'Label#4:75':label},w-8,32);const icon=r.children.find(c=>c.type==='INSTANCE');if(icon)icon.visible=false;refs[label]=r;}return refs;}
function settings(root,tab='SEO',mode='normal'){const p=surface(root,'About / Page settings / '+tab,720,700,360,112);const close=header(p,(mode==='renamed'?'Our story':'About')+' · Page settings');const tabs=frame('Settings tabs',720,44,'HORIZONTAL',null,p);pad(tabs,8);gap(tabs,4);const refs={close};for(const t of ['SEO','Social','Advanced'])refs[t]=instance(t===tab?'4:418':'4:414',tabs,{'Label#4:52':t},112,28);
const body=frame('Settings body / one scroll region',720,1,'VERTICAL',null,p);pad(body,24);gap(body,12);body.layoutSizingVertical='FILL';body.clipsContent=true;
line(body,'Editing '+(mode==='renamed'?'Our story':'About')+' · Home stays open on the canvas',672);
function field(label,value){const f=frame('Field / '+label,672,0,'VERTICAL',null,body);gap(f,4);line(f,label,672,'Section','ink');return input(f,value,672);}
if(tab==='SEO'){line(body,'Search preview · SEO score 82',672,'Section','ink');const preview=frame('Search result preview',672,92,'VERTICAL','bg-subtle',body);pad(preview,12);gap(preview,4);line(preview,'fieldwork.studio'+(mode==='renamed'?'/our-story':'/about'),648,'Micro');line(preview,'About our studio — Fieldwork',648,'Panel','accent');line(preview,'Independent design, thoughtful work and lasting partnerships.',648);
field('SEO title','About our studio — Fieldwork');field('Description','Independent design, thoughtful work and lasting partnerships.');field('Page URL',mode==='renamed'?'/our-story':'/about');const rr=frame('Search indexing',672,28,'HORIZONTAL',null,body);gap(rr,12);line(rr,'Search indexing',160,'Section','ink');const s=instance('4:362',rr,undefined,240,28);const text=s.findOne(n=>n.type==='TEXT');text.characters='Indexed';created.push(text.id);
if(mode==='renamed'){line(body,'URL changed from /about to /our-story. Add a redirect so old links keep working?',672,'Meta','ink');const r=frame('Redirect offer actions',672,32,'HORIZONTAL',null,body);gap(r,8);refs.redirect=button(r,'Add redirect','secondary');refs.later=button(r,'Later','ghost');}
else refs.defaults=button(body,'Site SEO defaults','ghost');
}else if(tab==='Social'){field('Social title','About our studio — Fieldwork');field('Social description','Independent design, thoughtful work and lasting partnerships.');line(body,'Social image',672,'Section','ink');const sample=frame('Existing social image / authored sample',280,148,'VERTICAL','bg-subtle',body);pad(sample,16);line(sample,'FIELDWORK',248,'Area','ink');line(sample,'Thoughtful design. Lasting impact.',248,'Panel','ink');refs.image=button(body,'Choose image','secondary');}
else{field('Publish visibility','Live');line(body,'Live means this page is included on the next publish.',672);line(body,'Search indexing: Indexed',672,'Section','ink');refs.changeSEO=button(body,'Change in SEO','ghost');field('Follow links','Follow');line(body,'Head code · Pro',672,'Section','ink');const area=frame('Head code / retained draft',672,136,'VERTICAL','bg-subtle',body);pad(area,12);edge(area);radius(area,'sm');line(area,'<!-- Page-specific head code -->',648,'Value','ink-soft');line(body,'Changes apply on the next publish.',672);}
if(mode==='failure')line(body,'Couldn’t save page settings. Your changes are still here.',672,'Meta','error-text');
const [cancel,save]=actions(p,[['Cancel','secondary'],[mode==='failure'?'Retry save':'Save','primary']]);refs.cancel=cancel;refs.save=save;return {p,body,refs};}
function dialog(root,title,body,labels){const p=surface(root,title,480,0,480,288);p.primaryAxisSizingMode='AUTO';pad(p,24);gap(p,16);txt(p,title,'Dialog','ink',432);txt(p,body,'Body','ink-soft',432);const r=frame('Dialog actions',432,32,'HORIZONTAL',null,p);gap(r,8);const refs={};for(const [label,style] of labels)refs[label]=button(r,label,style);return {p,refs};}

// Supply ALLSPECS / START / END from b3-frames.json; construction only, do not rerun on populated file.

const specs=ALLSPECS.slice(START,END);
if(specs.some(([name])=>page.children.some(n=>n.name===name)))throw new Error('Target already exists; inspect before retry');
const out=[];
for(let ix=0;ix<specs.length;ix++){const [name,type]=specs[ix];const root=shell(name,START+ix);let s;const refs={};
if(['manager','menu','rename','removed','deleted','restored','listings','structure','empty','kept'].includes(type)){
s=manager(root,type==='kept'?'default':type);Object.assign(refs,s.refs);
if(type==='menu'){Object.assign(refs,menu(root,['Rename…','Duplicate','Set as homepage','Replace layout with template…','Save as template…','Move up','Move down','Copy link','Page settings…','Delete page']));}
if(type==='rename'){
const r=surface(root,'Rename About / URL decision',508,170,38,302);pad(r,12);gap(r,8);input(r,'Our story',484);line(r,'URL: /about → /our-story?',484,'Meta','ink');const choices=frame('URL choices',484,32,'HORIZONTAL',null,r);gap(choices,8);refs.keep=button(choices,'Keep URL','secondary');refs.update=button(choices,'Update URL','primary');refs.cancelRename=button(r,'Cancel rename','ghost');}
if(type==='removed'){const toast=surface(root,'Deletion receipt',560,52,440,804);pad(toast,8);toast.layoutMode='HORIZONTAL';gap(toast,8);toast.counterAxisAlignItems='CENTER';line(toast,'About deleted',112,'Meta','ink');refs.undo=button(toast,'Undo','secondary');refs.recent=button(toast,'Recently deleted','ghost');}
if(type==='kept'){const r=s.refs.about;r.setProperties({'Name#62:0':'Our story','URL#62:1':'/about'});line(s.body,'Page renamed. URL kept at /about.',536,'Meta','ink');}
}else if(type==='consequence'){
s=manager(root);const d=dialog(root,'Change this live page’s URL?','About is live at /about. Changing it to /our-story can break old links after publishing. You can add a redirect after the change.',[['Cancel','secondary'],['Change URL','primary']]);Object.assign(refs,d.refs);
}else if(type==='guard'){
s=settings(root);const d=dialog(root,'Discard page settings changes?','Your unsaved settings for About will be discarded. The Home canvas and selection stay unchanged.',[['Keep editing','primary'],['Discard changes','secondary']]);Object.assign(refs,d.refs);
}else{
s=settings(root,type==='social'?'Social':type==='advanced'?'Advanced':'SEO',type==='redirect'?'renamed':type==='failure'?'failure':'normal');Object.assign(refs,s.refs);
}
const refIds=Object.fromEntries(Object.entries(refs).map(([k,n])=>[k,n.id]));
out.push({id:root.id,name,type,refs:refIds,surface:s.p.id});
}
await Promise.all(pending);
return {createdNodeIds:[...new Set(created)],frames:out};

