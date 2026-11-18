// Prepend continuation helpers page3:7, grid offset100.
// Bounded destination companions retain the acknowledged setting on return.
const board=await figma.getNodeByIdAsync('277:46436');
const targets={'Overview':'238:9980','General':'277:27105','Languages':'277:25943','Brand ↗':'277:27516','SEO':'238:12118','Domains':'238:12413','Redirects':'238:12721','Access':'277:27321','Analytics':'245:45159','Form submissions':'238:13598','Custom code':'238:14186','Security headers':'245:47988','Danger zone':'238:14472','Back to Editor':'245:51515'};
const nav=r=>r.findOne(n=>n.name==='Settings navigation');
function navDoor(r,label){return label==='Back to Editor'?r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back to Editor')):nav(r)?.children.find(n=>n.name===label);}
function foot(r,msg,kind='disabled'){const f=r.findOne(n=>n.name==='Settings footer');for(const c of [...f.children])c.remove();text(f,msg,848,'Label','ink-soft');return button(f,kind==='pending'?'Saving…':kind==='error'?'Retry save':'Save settings',kind==='pending'?'disabled':kind==='error'?'primary':kind,136);}
function focus(n){n.strokes=[paint('accent')];n.strokeWeight=2;n.strokeAlign='OUTSIDE';n.name+=' / default and initial focus';}
function outcome(name,pendingId,success,failure){const row=frame(board,name,1392,40,'HORIZONTAL');row.itemSpacing=8;row.counterAxisAlignItems='CENTER';text(row,name,540,'Label');for(const [k,id,w]of [['pending',pendingId,160],['Acknowledged → destination',success,240],['failure',failure,160]])link(button(row,k,'secondary',w),id);}
const maps={};const destinations=[];
for(const [owner,saved,ownLabel]of [['Security','277:26371','Security headers'],['Languages','277:25524','Languages']]){
 const map={};for(const [label,id]of Object.entries(targets)){
  if(label===ownLabel){map[label]=saved;continue;}
  if(owner==='Security'&&label==='Brand ↗'){map[label]='277:107940';continue;}
  const r=await clone(id,'GAP-ST-ACK · '+owner+' saved → '+label);map[label]=r.id;destinations.push({owner,label,id:r.id,source:id});
 }
 maps[owner]=map;
 for(const [label,id]of Object.entries(map)){
  const r=await figma.getNodeByIdAsync(id);
  if(nav(r)){for(const [to,tid]of Object.entries(map)){if(to===label)continue;const d=navDoor(r,to);if(d)link(d,tid);}}
  if(label==='Brand ↗'){const b=r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back'));if(b)link(b,saved);}
  if(label==='Back to Editor'){const b=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Site settings');if(b)link(b,saved);}
 }
}
for(const [label,id]of Object.entries(maps.Security)){
 const row=board.findOne(n=>n.name==='Security → '+label);if(row){const b=row.findOne(n=>n.type==='INSTANCE'&&n.name==='Acknowledged → destination');if(b)link(b,id);}
}
// Languages sidebar and Back use the same staged-owner guard, including exact pending intent.
const origin=await figma.getNodeByIdAsync('238:11810');const languageRoutes=[];
const brandDiscard=await clone('277:27516','GAP-ST-LB · Brand after default discarded / exact Languages return');const back=brandDiscard.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back'));link(back,'277:25943');
for(const [label,target]of Object.entries(targets)){
 if(label==='Languages')continue;const d=navDoor(origin,label);if(!d)continue;
 const discardTarget=label==='Brand ↗'?brandDiscard.id:target;
 const guard=await clone(origin.id,'GAP-ST-LG · Languages draft → '+label);
 const busy=await clone(origin.id,'GAP-ST-LW · Saving Languages → '+label);foot(busy,'Saving Deutsch default… destination: '+label,'pending');
 const failed=await clone(origin.id,'GAP-ST-LE · Languages save failed → '+label);foot(failed,'Couldn’t save — Retry · Deutsch draft retained','error');
 const m=modal(guard,'Leave without saving?','Your default language change to Deutsch is unsaved. Continue to '+label+' after saving or discarding this draft.',{width:480,note:'Discard restores the saved English default only. Français stays removed; that locale action was immediate.',actions:[{label:'Discard changes',width:144},{label:'Save and leave',width:128},{label:'Keep editing',kind:'primary',width:120}]});focus(m.refs['Keep editing']);link(m.refs['Keep editing'],origin.id);link(m.refs['Discard changes'],discardTarget);link(m.refs['Save and leave'],busy.id);link(d,guard.id);
 const f=modal(failed,'Couldn’t save Languages','Deutsch remains selected as an unsaved default. Français remains removed. You have not left this screen.',{width:480,note:'Requested destination: '+label+'. Retry keeps this same destination.',actions:[{label:'Keep editing',kind:'primary',width:120},{label:'Retry save and leave',width:180}]});focus(f.refs['Keep editing']);link(f.refs['Keep editing'],origin.id);link(f.refs['Retry save and leave'],busy.id);
 outcome('Languages → '+label,busy.id,maps.Languages[label],failed.id);languageRoutes.push({label,guard:guard.id,pending:busy.id,failure:failed.id,discard:discardTarget,acknowledged:maps.Languages[label]});
}
for(const label of ['Members ↗','Billing ↗','Integrations ↗']){
 const r=await clone(origin.id,'GAP-ST-LORG · Languages draft → '+label);const m=modal(r,'Organization workspace · '+label.replace(' ↗',''),'The named organization page opens in a separate tab. The Deutsch default remains unsaved here; Français remains removed.',{width:480,note:'Design handoff only. No external URL is created or opened by this prototype.',actions:[{label:'Back to Site settings',kind:'primary',width:184}]});link(m.refs['Back to Site settings'],origin.id);link(navDoor(origin,label),r.id);
}
const pm=await clone(origin.id,'GAP-ST-LPM · Languages draft / Permissions return');const m=modal(pm,'Permissions','Your role: Admin. Languages requires Admin access.',{width:480,note:'Owner: Danger zone. Admin: General, Languages, SEO, Domains, Access, Custom code and Security headers. Editor: Redirects, Analytics and Form submissions. Viewer: no Site settings access.',actions:[{label:'Close',kind:'primary',width:96}]});link(m.refs.Close,origin.id);link(nav(origin).findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Permissions')),pm.id);
for(const r of [origin,...page.children.filter(n=>/^GAP-ST/.test(n.name))]){
 await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 for(const t of r.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('The default language is staged. Français was restored'))t.characters=t.characters.replace('The default language is staged.','Default language changes are staged.');
 status(r,'Page content saved');
}
// Larger review board stays clear of all workspace frames.
board.x=28000;board.y=80;
return{...await finish(),acknowledgedMaps:maps,destinations,languageRoutes};
