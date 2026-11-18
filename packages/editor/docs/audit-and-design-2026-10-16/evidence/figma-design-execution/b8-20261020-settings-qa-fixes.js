// Prepend continuation-helpers.js page3:7. Fix native control semantics and role/return continuity.
const changed=[], deleted=[];
const settings=page.children.filter(n=>/^B8-(AN|SH|PM|CF|SG|S\d)/.test(n.name));
const toggles=await figma.getNodeByIdAsync('32:1281');
const selects=await figma.getNodeByIdAsync('4:392');
const toggleMaster=s=>toggles.children.find(n=>n.name==='State='+s);
const selectMaster=selects.children.find(n=>n.name==='State=Default');
function noLink(n){if(n&&'reactions'in n){n.reactions=[];changed.push(n.id);}}
function navOf(r){return r.findOne(n=>n.name==='Settings navigation');}
function contentOf(r){return r.findOne(n=>n.name==='Settings content');}
function setRole(r,role){const t=navOf(r).findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Your role:'));if(t){t.characters='Your role: '+role;changed.push(t.id);}}
function setFooter(r,label,kind='disabled'){const ft=r.findOne(n=>n.name==='Settings footer');const t=ft.children.find(n=>n.type==='TEXT');t.characters=label;changed.push(t.id);
 const b=ft.children.find(n=>n.type==='INSTANCE');if(b){b.swapComponent(masters[kind==='primary'?'4:238':'4:261']);b.setProperties({'Label#4:18':'Save settings'});changed.push(b.id);return b;}}
for(const r of settings){
 await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 if(/^B8-(AN|SG)/.test(r.name))setRole(r,'Admin');
 const nav=navOf(r);if(!nav)continue;
 const title=r.findOne(n=>n.name==='Identity and return').children.find(n=>n.type==='TEXT')?.characters;
 for(const b of nav.children)if(b.name===title)noLink(b);
 if(/^B8-(AN|SH|SG)/.test(r.name)){
  for(const n of r.findAllWithCriteria({types:['INSTANCE']})){
   if(n.name.startsWith('Toggle / ')){
    const on=n.name.endsWith('/ on');n.swapComponent(toggleMaster(on?'On':'Off'));n.setProperties({'Label#32:19':'Enabled'});n.resize(104,28);changed.push(n.id);
   }
   if(n.parent.name==='Field / Enable HSTS'){
    n.swapComponent(toggleMaster('On'));n.setProperties({'Label#32:19':'Enabled'});n.resize(484,28);changed.push(n.id);
   }
   if(['Field / X-Frame-Options','Field / Referrer-Policy','Field / Max age'].includes(n.parent.name)){
    const val=n.findAllWithCriteria({types:['TEXT']}).map(t=>t.characters).join('').replace(/\s*▾$/,'');
    n.swapComponent(selectMaster);n.setProperties({'Value#4:42':val});n.resize(484,28);changed.push(n.id);
   }
  }
  if(r.name.startsWith('B8-SH')){
   const host=contentOf(r);const t=text(host,'Restoring a site version leaves this configuration unchanged.',720,'Meta','ink-soft');host.insertChild(0,t);changed.push(t.id);
  }
 }
}
// Read-only navigation cannot switch the same actor into an Admin fixture.
const ro=await figma.getNodeByIdAsync('245:49024');
for(const b of navOf(ro).findAllWithCriteria({types:['INSTANCE']}))noLink(b);
const editorAnalytics=await clone('245:45159','B8-AN12 · Analytics / Editor access, exact role continuation');setRole(editorAnalytics,'Editor');
const editorGeneral=await clone('238:15344','B8-SH10 · General / Editor read-only return');
{const host=contentOf(editorGeneral);for(const c of [...host.children])c.remove();text(host,'Changing General needs Admin access.',720,'Body','ink-soft');
const title=editorGeneral.findOne(n=>n.name==='Identity and return').children.find(n=>n.type==='TEXT');title.characters='General';title.name='General';
for(const b of navOf(editorGeneral).children)if(b.type==='INSTANCE')b.fills=b.name==='General'?[paint('accent-subtle')]:[];
text(host,'Site name',720,'Label');const i=input(host,'Fieldwork Studio',720);i.setProperties({State:'Disabled'});
text(host,'Tagline',720,'Label');const t=input(host,'Independent design studio, Berlin',720);t.setProperties({State:'Disabled'});}
for(const [root,map] of [[ro,{'Analytics':editorAnalytics.id,'General':editorGeneral.id}],[editorAnalytics,{'Security headers':ro.id,'General':editorGeneral.id}],[editorGeneral,{'Analytics':editorAnalytics.id,'Security headers':ro.id}]]){
for(const [label,id]of Object.entries(map)){const b=navOf(root).children.find(n=>n.name===label);if(b)link(b,id);}}
// HSTS preset choices open beside their field, not below the form's scroll boundary.
const menuRoot=await figma.getNodeByIdAsync('245:48243');const menu=menuRoot.findOne(n=>n.name==='Card / Max age choices');
const age=menuRoot.findOne(n=>n.name==='Field / Max age').children.find(n=>n.type==='INSTANCE');
menuRoot.appendChild(menu);menu.layoutPositioning='ABSOLUTE';menu.resize(484,menu.height);menu.x=age.absoluteBoundingBox.x-menuRoot.absoluteBoundingBox.x;menu.y=age.absoluteBoundingBox.y-menuRoot.absoluteBoundingBox.y+32;
menu.strokes=[paint('border')];menu.strokeWeight=1;pending.push(menu.setEffectStyleIdAsync(FX.Overlay.id));
for(const c of menu.children){if(c.type==='TEXT')c.resize(452,c.height);else if(c.type==='INSTANCE')c.resize(452,32);}
changed.push(menu.id,...menu.children.map(n=>n.id));
const preset=await clone('245:49280','B8-SH11 · HSTS / explicit preset change, unsaved');
{const field=preset.findOne(n=>n.name==='Field / Max age').children.find(n=>n.type==='INSTANCE');field.setProperties({'Value#4:42':'1 year · 31536000 seconds'});setFooter(preset,'Unsaved changes · HSTS max age', 'primary');
const help=preset.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Existing custom value'));help.characters='The chosen preset changes max age to 31536000 seconds. Save settings to apply.';}
for(const b of menu.children.filter(n=>n.type==='INSTANCE'))if(b.name.startsWith('1 year'))link(b,preset.id);else if(b.name.startsWith('86400'))link(b,'245:47988');
// Each Permissions view retains its actual role, screen and underlying content.
const permissionTemplate=await figma.getNodeByIdAsync('245:50300');
const pmDialog=permissionTemplate.children.find(n=>n.name==='Permissions');
const pmSources=[...settings.filter(n=>navOf(n)&&!n.name.startsWith('B8-PM')),editorAnalytics,editorGeneral];
for(const origin of pmSources){
 const door=navOf(origin).findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Permissions'));
 if(!door||(!door.reactions.length&&!['245:45159','245:47988','245:49024',editorAnalytics.id,editorGeneral.id].includes(origin.id)))continue;
 const copy=await clone(origin.id,'Permissions return · '+origin.name);
 const role=navOf(origin).findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Your role:'))?.characters.includes('Editor')?'Editor':'Admin';
 const m=modal(copy,'Permissions','Your role: '+role+'. These are minimum roles for changing site settings.',{width:480,actions:[{label:'Close',kind:'primary',width:96}]});
 const body=pmDialog.findOne(n=>n.name==='Minimum roles').clone();m.d.insertChild(2,body);
 for(const t of body.findAllWithCriteria({types:['TEXT']})){if(t.characters==='Editor · You')t.characters=role==='Editor'?'Editor · You':'Editor';if(t.characters==='Admin')t.characters=role==='Admin'?'Admin · You':'Admin';}
 link(m.refs.Close,origin.id);link(door,copy.id);
}
// Keep the original PM specimen truthful as an Editor specimen, with same-role return.
const pmClose=permissionTemplate.findOne(n=>n.type==='INSTANCE'&&n.name==='Close');if(pmClose)link(pmClose,editorAnalytics.id);
// Explicit guard per General departure. Nothing skips a staged draft.
const source=await figma.getNodeByIdAsync('238:10283');
const targetMap={'Languages':'238:11810','SEO':'238:12118','Domains':'238:12413','Redirects':'238:12721','Access':'238:13017','Analytics':'245:45159','Form submissions':'238:13598','Custom code':'238:14186','Security headers':'245:47988','Danger zone':'238:14472'};
for(const [label,id]of Object.entries(targetMap)){
 const door=navOf(source).children.find(n=>n.name===label);if(!door)continue;
 const guard=await clone(source.id,'B8-GUARD · General draft → '+label);
 const busy=await clone(source.id,'B8-SAVING · General draft → '+label);
 const m=modal(guard,'Leave without saving?','Your General changes are unsaved. Continue to '+label+' after saving or discarding them.',{width:480,actions:[{label:'Discard changes',width:144},{label:'Save and leave',width:128},{label:'Keep editing',kind:'primary',width:120}]});
 link(m.refs['Keep editing'],source.id);link(m.refs['Discard changes'],id);link(m.refs['Save and leave'],busy.id);link(door,guard.id);
 const running=modal(busy,'Saving General settings…','Your destination is '+label+'. Wait for the save result; if it fails, your changes stay here.',{width:480,actions:[{label:'Stay in General',width:144}]});link(running.refs['Stay in General'],'238:10586');
}
// Remove old bypass reactions on other dirty fixtures pending their own fixed-destination guards.
for(const id of ['238:10889','238:11192','238:11810','238:13017']){
 const r=await figma.getNodeByIdAsync(id);for(const b of navOf(r).children)if(b.type==='INSTANCE')noLink(b);
}
mutations.push(...changed);
const res=await finish();return {...res,removedNodeIds:deleted};
