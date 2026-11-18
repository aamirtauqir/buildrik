const queued=await clone('122:43331','B3-P101 · CMS / queued revision retained after cancelling navigation');
const failed=await clone('122:43331','B3-P102 · CMS / failed save retained after cancelling navigation');
const saving=await clone('122:44151','B3-P103 · CMS / saving record before opening About');
function localState(r,label,tone){const t=r.findAllWithCriteria({types:['TEXT']}).find(n=>n.characters==='Record · Unsaved changes');if(t){t.characters=label;t.fills=[paint(tone)];}status(r,label);}
localState(queued,'Record · Offline, save pending','warning-text');
localState(failed,'Record · Couldn’t save — Retry','error-text');
const retryButton=failed.findOne(n=>n.name==='Save record');retryButton.setProperties({'Label#4:18':'Retry save'});retryButton.name='Retry save';
const sg=modal(saving,'Leave without saving?','Blog record “Studio launch” · Saving…',{note:'After a confirmed save: Open About. Keep editing cancels navigation; the save will continue.',actions:[{label:'Keep editing',kind:'primary'}]});status(saving,'Record · Saving…');
const after=await clone('7:19791','B3-P104 · Home opened / Studio launch save confirmed');
const rcp=frame(after,'Record-save receipt',580,56,'HORIZONTAL');rcp.layoutPositioning='ABSOLUTE';rcp.x=390;rcp.y=792;pad(rcp,12);text(rcp,'Studio launch saved · Opened Home',556);status(after,'Page · Saved');
const missing=await clone('122:43331','B3-P105 · CMS / About removed before navigation');
const mg=modal(missing,'About is no longer available','The page you asked to open was removed. Your Blog record draft is still here.',{note:'No different page has been opened. Return to this record before choosing another destination.',actions:[{label:'Keep editing',kind:'primary',to:'122:43331'}]});
const multi=await clone('122:43331','B3-P106 · CMS / second owner failed after settings saved');
localState(multi,'Record · Couldn’t save — Retry','error-text');
const mm=modal(multi,'Leave without saving?','2 of 2 · Blog record “Studio launch” couldn’t be saved. You asked to open About.',{note:'1. About page settings · Saved\n2. Studio launch record · Couldn’t save\n\nKeep editing returns to this record. The confirmed page-settings save stays applied.',actions:[{label:'Keep editing',kind:'primary',width:126},{label:'Retry record save',width:164}]});
const complete=await clone('122:43331','B3-P107 · CMS / late save confirmed, stay on record');
localState(complete,'Record · Saved','ink-soft');const completeSave=complete.findOne(n=>n.name==='Save record');completeSave.swapComponent(masters['4:246']);completeSave.setProperties({'Label#4:18':'Save record'});
const staying=await clone('122:43331','B3-P108 · CMS / navigation cancelled while save continues');
localState(staying,'Record · Saving continues; stay here','ink-soft');
for(const f of [queued,staying])for(const n of f.findAllWithCriteria({types:['INSTANCE']}).filter(n=>Object.keys(n.componentProperties).some(k=>k==='Value#4:30')))n.setProperties({State:'Disabled'});
for(const f of [queued,staying]){const s=f.findOne(n=>n.name==='Save record');s.swapComponent(masters['4:246']);s.setProperties({'Label#4:18':f===queued?'Save pending':'Saving…'});}
link(sg.refs['Keep editing'],staying.id);link(retryButton,complete.id);link(mm.refs['Keep editing'],failed.id);link(mm.refs['Retry record save'],saving.id);
for(const [id,target]of [['122:44343',failed.id],['125:35409',queued.id]]){const f=await figma.getNodeByIdAsync(id);link(f.findOne(n=>n.name==='Keep editing'),target);}
for(const [id,name,target]of [['122:44151','Save and leave',saving.id],['122:44343','Retry save',saving.id],['125:36161','Save and leave',saving.id],['125:35603','Save and leave',after.id]]){const f=await figma.getNodeByIdAsync(id);link(f.findOne(n=>n.name===name),target);}
// Prototype timers illustrate a server-confirmed fixture; they are not product timeout rules.
saving.reactions=[{trigger:{type:'AFTER_TIMEOUT',timeout:1.5},actions:[{type:'NODE',destinationId:'125:35799',navigation:'NAVIGATE',transition:null}]}];
staying.reactions=[{trigger:{type:'AFTER_TIMEOUT',timeout:1.5},actions:[{type:'NODE',destinationId:complete.id,navigation:'NAVIGATE',transition:null}]}];
const p92=await figma.getNodeByIdAsync('122:34115');link(p92.findOne(n=>n.name==='Check result'),'118:33757');
for(const [id,name]of [['122:34465','We can’t check Services yet'],['122:34651','Services is still being created']]){const f=await figma.getNodeByIdAsync(id);const old=f.children.find(n=>n.name===name);if(old){mutations.push(old.id);old.remove();}}
const p89=await figma.getNodeByIdAsync('122:43815');link(await figma.getNodeByIdAsync('122:43999'),'122:43331');const oldMenu=await figma.getNodeByIdAsync('I122:44010;62:1585');oldMenu.reactions=[{trigger:{type:'ON_CLICK'},actions:[]}];mutations.push(oldMenu.id);
return await finish();
