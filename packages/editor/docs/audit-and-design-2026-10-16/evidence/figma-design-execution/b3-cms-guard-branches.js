const validation=await clone('122:43331','B3-P95 · CMS / validation with About pending');
const field=validation.findOne(n=>n.type==='INSTANCE'&&n.name==='Input / Studio launch — a new chapter');field.setProperties({'Value#4:30':'',State:'Error'});field.name='Title / required error';text(field.parent,'Enter a title before saving.',720,'Meta','error-text');
const vf=validation.findOne(n=>n.name==='Record footer');for(const n of [...vf.children])n.remove();text(vf,'After saving: Open About',360,'Meta','ink-soft');const cancelNav=button(vf,'Cancel navigation','secondary',152);const continueSave=button(vf,'Save and leave','secondary',144);
const discard=await clone('122:43331','B3-P96 · CMS / discard failed, input retained');
const dg=modal(discard,'Leave without saving?','Couldn’t discard the draft for Blog record “Studio launch”. About has not been opened.',{note:'Your input is still here. Try discarding this record again, or keep editing.',actions:[{label:'Keep editing',kind:'primary',width:126},{label:'Retry discard',width:128}]});
const queued=await clone('122:43331','B3-P97 · CMS / queued record does not complete leave');
const qg=modal(queued,'Leave without saving?','Blog record “Studio launch” is queued. We haven’t received confirmation from the server, so About has not been opened.',{note:'Offline — this record will save when you reconnect. Waiting is not confirmation.',actions:[{label:'Keep editing',kind:'primary',width:126}]});status(queued,'Record · Offline, save pending');
const home=await clone('122:43331','B3-P98 · CMS / remembered Home still runs draft guard');
const hg=modal(home,'Leave without saving?','Blog record “Studio launch” has unsaved changes. You asked to open Home in Editor.',{note:'Home is still the remembered canvas page. Returning to it leaves this record form.',actions:[{label:'Keep editing',kind:'primary',width:126},{label:'Discard changes',width:144},{label:'Save and leave',width:146}]});
hg.refs['Keep editing'].parent.layoutMode='VERTICAL';hg.refs['Keep editing'].parent.primaryAxisSizingMode='AUTO';hg.refs['Keep editing'].parent.counterAxisSizingMode='FIXED';for(const n of Object.values(hg.refs))n.resize(432,32);hg.refs['Keep editing'].parent.resize(432,112);
const saved=await clone('94:12846','B3-P99 · About opened / Studio launch save confirmed');
const receipt=frame(saved,'Record-save receipt',580,56,'HORIZONTAL');receipt.layoutPositioning='ABSOLUTE';receipt.x=390;receipt.y=792;pad(receipt,12);text(receipt,'Studio launch saved · Opened About',556,'Body');status(saved,'Page · Saved');
const corrected=await clone(validation.id,'B3-P100 · CMS / corrected title, About still pending');
const cf=corrected.findOne(n=>n.type==='INSTANCE'&&n.name==='Title / required error');cf.setProperties({'Value#4:30':'Studio launch — a new chapter',State:'Default'});for(const t of cf.parent.children.filter(n=>n.type==='TEXT'&&n.characters==='Enter a title before saving.'))t.remove();
link(field,corrected.id);link(cancelNav,'122:43331');
for(const n of corrected.findAllWithCriteria({types:['INSTANCE']})){if(n.name==='Cancel navigation')link(n,'122:43331');if(n.name==='Save and leave')link(n,saved.id);}
link(dg.refs['Keep editing'],'122:43331');link(dg.refs['Retry discard'],'94:12846');
link(hg.refs['Keep editing'],'122:43331');link(hg.refs['Discard changes'],'7:19791');link(hg.refs['Save and leave'],'7:19791');
for(const id of ['122:43331','122:43815']){const r=await figma.getNodeByIdAsync(id);const back=r.findOne(n=>n.name==='Back to Editor · Home');if(back)link(back,home.id);const strip=r.children.find(n=>n.name==='Bottom bar / pages and save status');const h=strip.findAllWithCriteria({types:['INSTANCE']}).find(n=>Object.values(n.componentProperties).some(p=>p.type==='TEXT'&&p.value==='Home'));if(h)link(h,home.id);}
const rejected=await figma.getNodeByIdAsync('122:44343');link(rejected.findOne(n=>n.name==='Retry save'),saved.id);
return await finish();
