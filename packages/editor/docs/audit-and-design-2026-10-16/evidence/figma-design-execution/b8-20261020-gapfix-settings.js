// Prepend continuation helpers with page3:7 and root grid x20000/y80.
// Approved repair: Languages staged save/Undo, Analytics navigation,
// Security dirty destinations, and settings-origin Publish guards/trays.
const routeLedger=[], outcomes=[];
async function settle(){await Promise.all(pending);pending.length=0;}
async function fonts(r){await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));}
const nav=r=>r.findOne(n=>n.name==='Settings navigation');
const host=r=>r.findOne(n=>n.name==='Settings content');
const door=(r,label)=>r.findOne(n=>n.type==='INSTANCE'&&n.name===label);
function focus(n){n.strokes=[paint('accent')];n.strokeWeight=2;n.strokeAlign='OUTSIDE';n.name+=' / default and initial focus';}
function foot(r,msg,kind='disabled'){
 const ft=r.findOne(n=>n.name==='Settings footer');for(const c of [...ft.children])c.remove();
 text(ft,msg,848,'Label',kind==='error'?'error-text':'ink-soft');
 return button(ft,kind==='pending'?'Saving…':kind==='error'?'Retry save':'Save settings',kind==='pending'?'disabled':kind==='error'?'primary':kind,136);
}
function clearToast(r){for(const n of r.children.filter(n=>n.name==='Toast'))n.remove();}
function annotation(r,msg){const t=text(host(r),msg,720,'Meta','ink-soft');return t;}
function locale(r,value,mode){
 const f=r.findOne(n=>n.name==='Field / Default');const i=f.children.find(n=>n.type==='INSTANCE');i.setProperties({'Value#4:30':value+'  ▾'});
 const en=r.findOne(n=>n.name==='Row / English');en.children.filter(n=>n.type==='TEXT')[1].characters=(mode==='saved'&&value==='Deutsch'?'12 pages translated':'Saved default · 12 pages translated');
 const de=r.findOne(n=>n.name==='Row / Deutsch');de.children.filter(n=>n.type==='TEXT')[1].characters=(value==='Deutsch'?(mode==='saved'?'Default · ':'Chosen default · unsaved · '):'')+'10 of 12 pages translated';
 if(value==='Deutsch'){const b=de.findOne(n=>n.type==='INSTANCE');if(b){b.swapComponent(masters['4:261']);b.name='Remove / unavailable while chosen as default';}}
}
const language=await figma.getNodeByIdAsync('238:11810');const security=await figma.getNodeByIdAsync('245:49280');const analytics=await figma.getNodeByIdAsync('245:45159');
for(const r of [language,security,analytics])await fonts(r);
locale(language,'Deutsch','dirty');
annotation(language,'Only the default language is staged. Français was removed immediately. Saving or discarding the default will not restore it. Publishing currently emits the default locale only.');
const saveLanguage=foot(language,'Unsaved default: Deutsch · saved default: English','primary');
const age=security.findOne(n=>n.name==='Field / Max age').children.find(n=>n.type==='INSTANCE');age.setProperties({'Value#4:42':'1 year · 31536000 seconds'});
security.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Existing custom value')).characters='Unsaved choice: 31536000 seconds. Saved custom value: 86400 seconds.';
foot(security,'Unsaved changes · HSTS max age','primary');
const languagePending=await clone(language.id,'GAP-ST-L01 · Languages / saving Deutsch default');clearToast(languagePending);foot(languagePending,'Saving default language…','pending');
const languageSaved=await clone(language.id,'GAP-ST-L02 · Languages / Deutsch acknowledged, Français still removed');clearToast(languageSaved);locale(languageSaved,'Deutsch','saved');foot(languageSaved,'Saved · Deutsch applies on next publish');
const languageFailed=await clone(language.id,'GAP-ST-L03 · Languages / save failure keeps Deutsch draft');clearToast(languageFailed);const retryLang=foot(languageFailed,'Couldn’t save — Retry · Deutsch draft retained','error');annotation(languageFailed,'The server did not save the default language. Français remains removed.');
const languageDiscard=await clone(language.id,'GAP-ST-L04 · Languages / default discarded, immediate removal retained');clearToast(languageDiscard);locale(languageDiscard,'English','saved');foot(languageDiscard,'Saved default: English · Français remains removed');
const languageUndo=await clone(language.id,'GAP-ST-L05 · Français restored / Deutsch draft unchanged');clearToast(languageUndo);foot(languageUndo,'Unsaved default: Deutsch · Français restored immediately','primary');
{const card=languageUndo.findOne(n=>n.name==='Card / Languages');const row=frame(card,'Row / Français',688,48,'HORIZONTAL',null);row.itemSpacing=12;row.counterAxisAlignItems='CENTER';text(row,'Français',240,'Label');text(row,'Restored · 6 of 12 pages translated',436,'Body','ink-soft');card.insertChild(card.children.length-2,row);annotation(languageUndo,'Undo restored only Français. It did not change the staged Deutsch default.');}
link(saveLanguage,languagePending.id);link(retryLang,languagePending.id);link(door(language,'Undo'),languageUndo.id);
const discardLang=button(language.findOne(n=>n.name==='Settings footer'),'Discard','secondary',96);language.findOne(n=>n.name==='Settings footer').children[0].resize(744,20);link(discardLang,languageDiscard.id);
outcomes.push({name:'Languages / default save',pending:languagePending.id,success:languageSaved.id,failure:languageFailed.id});
const securitySaved=await clone(security.id,'GAP-ST-H01 · Security / saved 1-year HSTS acknowledgment');foot(securitySaved,'Saved · applies on next publish');securitySaved.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Unsaved choice:')).characters='Saved max age: 31536000 seconds. Applies on next publish.';
const securityPending=await clone(security.id,'GAP-ST-H02 · Security / saving HSTS without navigation');foot(securityPending,'Saving Security headers…','pending');
const securityFail=await clone(security.id,'GAP-ST-H03 · Security / save failure keeps HSTS draft');const retrySecurity=foot(securityFail,'Couldn’t save — Retry · HSTS draft retained','error');link(retrySecurity,securityPending.id);link(door(security,'Save settings'),securityPending.id);
outcomes.push({name:'Security / footer save',pending:securityPending.id,success:securitySaved.id,failure:securityFail.id});
// Clean target fixtures prevent a section switch from introducing an unrelated draft.
const general=await clone('238:10283','GAP-ST-T01 · General / acknowledged target');foot(general,'Saved · applies on next publish');
const access=await clone('238:13017','GAP-ST-T02 · Access / acknowledged target');foot(access,'Saved · applies on next publish');
const brand=await clone('203:33565','GAP-ST-T03 · Brand / exact settings owner return');const brandBack=brand.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back'));if(brandBack){brandBack.setProperties({'Label#4:18':'‹ Back to Site settings'});brandBack.resize(200,32);link(brandBack,analytics.id);}
const targets={'Overview':'238:9980','General':general.id,'Languages':languageDiscard.id,'Brand ↗':brand.id,'SEO':'238:12118','Domains':'238:12413','Redirects':'238:12721','Access':access.id,'Analytics':analytics.id,'Form submissions':'238:13598','Custom code':'238:14186','Security headers':'245:47988','Danger zone':'238:14472','Back to Editor':'245:51515'};
function navDoor(r,label){return label==='Back to Editor'?r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back to Editor')):nav(r).children.find(n=>n.name===label);}
for(const [label,id]of Object.entries(targets)){if(label==='Analytics')continue;const d=navDoor(analytics,label);if(d)link(d,id);}
// Every Security departure keeps the requested destination fixed.
for(const [label,id]of Object.entries(targets)){
 if(label==='Security headers')continue;const d=navDoor(security,label);if(!d)continue;
 const guard=await clone(security.id,'GAP-ST-G · Security draft → '+label);
 const busy=await clone(security.id,'GAP-ST-W · Saving Security → '+label);foot(busy,'Saving Security headers… destination: '+label,'pending');
 const failed=await clone(security.id,'GAP-ST-E · Security save failed → '+label);foot(failed,'Couldn’t save — Retry · HSTS draft retained','error');
 const m=modal(guard,'Leave without saving?','Your Security headers changes are unsaved. Continue to '+label+' after saving or discarding this draft.',{width:480,note:'Only the HSTS draft is discarded. The saved custom value is 86400 seconds.',actions:[{label:'Discard changes',width:144},{label:'Save and leave',width:128},{label:'Keep editing',kind:'primary',width:120}]});focus(m.refs['Keep editing']);
 link(m.refs['Keep editing'],security.id);link(m.refs['Discard changes'],id);link(m.refs['Save and leave'],busy.id);link(d,guard.id);
 const fail=modal(failed,'Couldn’t save Security headers','Your HSTS choice is still 31536000 seconds. You have not left this screen.',{width:480,note:'Requested destination: '+label+'. Retry uses this same destination.',actions:[{label:'Keep editing',kind:'primary',width:120},{label:'Retry save and leave',width:180}]});focus(fail.refs['Keep editing']);link(fail.refs['Keep editing'],security.id);link(fail.refs['Retry save and leave'],busy.id);
 routeLedger.push({from:security.id,label,target:id,guard:guard.id,pending:busy.id,failure:failed.id});outcomes.push({name:'Security → '+label,pending:busy.id,success:id,failure:failed.id});
}
// Organization pages open separately; the named handoff keeps the exact origin.
for(const origin of [analytics,security])for(const label of ['Members ↗','Billing ↗','Integrations ↗']){
 const r=await clone(origin.id,'GAP-ST-ORG · '+origin.id+' → '+label);const m=modal(r,'Organization workspace · '+label.replace(' ↗',''),'This opens the named organization page in a separate tab. Your Site settings screen and any draft stay here.',{width:480,note:'Design handoff only: no organization URL is created or opened in this prototype.',actions:[{label:'Back to Site settings',kind:'primary',width:184}]});link(m.refs['Back to Site settings'],origin.id);link(navDoor(origin,label),r.id);
}
// Permissions is an inspection layer and does not discard the staged screen.
const pm=await clone(security.id,'GAP-ST-PM · Security draft / Permissions exact return');const perm=modal(pm,'Permissions','Your role: Admin. Security headers require Admin access.',{width:480,note:'Owner: Danger zone. Admin: General, Languages, SEO, Domains, Access, Custom code and Security headers. Editor: Redirects, Analytics and Form submissions. Viewer: no Site settings access.',actions:[{label:'Close',kind:'primary',width:96}]});link(perm.refs.Close,security.id);const pd=nav(security).findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Permissions'));if(pd)link(pd,pm.id);
// The Publish task remains over the current settings screen (SC-7/SC-24).
async function publishTray(origin,title,excluded,returnId){
 const r=await clone(origin,'GAP-ST-PB · '+title);const t=frame(r,'Publish task tray / Site settings',360,812);t.layoutPositioning='ABSOLUTE';t.x=1080;t.y=56;t.clipsContent=true;t.strokes=[paint('border')];
 const h=frame(t,'Task header',360,56,'HORIZONTAL');pad(h,12);h.counterAxisAlignItems='CENTER';text(h,'Publish · whole site',276,'Panel');const close=button(h,'Close','ghost',48);link(close,returnId);
 const body=frame(t,'Task body',360,668);pad(body,16);body.itemSpacing=16;text(body,'Fieldwork Studio',328,'Section');text(body,'Review saved changes',328,'Panel');text(body,excluded?'Excluded: '+excluded+' This draft remains in Site settings.':'Settings save acknowledged. These changes are available for the next publish.',328,'Body','ink-soft');text(body,'Whole site · saved pages and site settings. Existing password protection remains on.',328);text(body,'Checks and approval must match the saved revision before publishing.',328,'Meta','ink-soft');
 const footer=frame(t,'Task footer',360,88);pad(footer,12);const action=button(footer,'Review and publish','primary',336);
 const confirm=await clone(r.id,'GAP-ST-PC · '+title+' / whole-site confirmation');const cm=modal(confirm,'Publish the saved site?','The whole saved site will replace the live release. Existing password protection stays on.',{width:480,note:excluded?'Not included: '+excluded+'. Your unsaved draft remains in Site settings.':'This includes the acknowledged settings save. Publish still requires current blocking checks and approval.',actions:[{label:'Cancel',to:r.id,width:96},{label:'Publish site',kind:'primary',width:144}]});focus(cm.refs.Cancel);
 const run=await clone(r.id,'GAP-ST-PR · '+title+' / publishing pending');const runBody=run.findOne(n=>n.name==='Task body');for(const c of [...runBody.children])c.remove();text(runBody,'Publishing…',328,'Panel');text(runBody,'Waiting for the release result. No new live version has been confirmed.',328);const runAction=run.findOne(n=>n.name==='Task footer').children.find(n=>n.type==='INSTANCE');runAction.swapComponent(masters['4:261']);runAction.setProperties({'Label#4:18':'Publishing…'});
 const working=await clone(origin,'GAP-ST-PW · '+title+' / same publish job while working');const reopen=door(working,'Publish');reopen.setProperties({'Label#4:18':'Publishing…'});reopen.resize(100,32);const flex=working.findOne(n=>n.name==='Flexible space');if(flex)flex.resize(flex.width-18,1);link(reopen,run.id);link(door(run,'Close'),working.id);
 link(action,confirm.id);link(cm.refs['Publish site'],run.id);return{r,confirm,run,working};
}
const publishLedger=[];
for(const [origin,saved,name,exclusion]of [[language,languageSaved,'Languages','default language Deutsch (saved default remains English)'],[security,securitySaved,'Security headers','HSTS max age 31536000 seconds (saved custom value remains 86400 seconds)']]){
 const without=await publishTray(origin.id,name+' / saved version, draft excluded',exclusion,origin.id);
 const included=await publishTray(saved.id,name+' / saved settings included',null,saved.id);
 const guard=await clone(origin.id,'GAP-ST-PG · '+name+' / Save settings first');const m=modal(guard,'Save settings first?','Publish uses saved site settings. Your '+name+' changes are still unsaved.',{width:480,actions:[{label:'Publish without these changes',width:224},{label:'Save and continue',width:160},{label:'Keep editing',kind:'primary',width:120}]});m.d.resize(600,m.d.height);m.d.x=420;for(const t of m.d.children.filter(n=>n.type==='TEXT'))t.resize(552,t.height);m.d.findOne(n=>n.name==='Actions').resize(552,32);focus(m.refs['Keep editing']);
 const busy=await clone(origin.id,'GAP-ST-PS · '+name+' / save before Publish pending');foot(busy,'Saving '+name+' before opening Publish…','pending');
 const failed=await clone(origin.id,'GAP-ST-PF · '+name+' / save before Publish failed');foot(failed,'Couldn’t save — Retry · draft retained','error');const fm=modal(failed,'Couldn’t save '+name,'Your changes remain here. Publish has not opened.',{width:480,actions:[{label:'Keep editing',kind:'primary',width:120},{label:'Retry save and continue',width:192}]});link(fm.refs['Keep editing'],origin.id);link(fm.refs['Retry save and continue'],busy.id);
 link(m.refs['Keep editing'],origin.id);link(m.refs['Publish without these changes'],without.r.id);link(m.refs['Save and continue'],busy.id);link(door(origin,'Publish'),guard.id);link(door(saved,'Publish'),included.r.id);
 outcomes.push({name:name+' → Publish after save',pending:busy.id,success:included.r.id,failure:failed.id});publishLedger.push({owner:origin.id,guard:guard.id,pending:busy.id,failure:failed.id,without:without.r.id,included:included.r.id});
}
const analyticsTray=await publishTray(analytics.id,'Analytics / saved settings included',null,analytics.id);link(door(analytics,'Publish'),analyticsTray.r.id);
const board=frame(null,'GAP-ST · REVIEW ONLY / settings service outcomes',1440,null);page.appendChild(board);board.x=20000;board.y=80+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);text(board,'Approved settings repairs · service outcomes',1392,'Area');text(board,'Review fixtures select the actual response; no timer implies success and no settings are written. Security Save and leave continues to the exact requested destination only after acknowledgment. A failure keeps the HSTS draft. Languages Save/Discard affects only its staged default; locale Undo restores only Français. Organization doors are named handoffs, not live URLs. Publish stays in a task tray over the same settings origin.',1392);for(const o of outcomes){const row=frame(board,o.name,1392,40,'HORIZONTAL');row.itemSpacing=8;row.counterAxisAlignItems='CENTER';text(row,o.name,540,'Label');for(const k of ['pending','success','failure'])link(button(row,k==='success'?'Acknowledged → destination':k,'secondary',k==='success'?240:160),o[k]);}text(board,'Design-only validation: persistence, clipboard, new-tab navigation, keyboard/focus, full prototype playback and publishing remain unrun. Publish pending job has no fabricated outcome; its Close returns to the same settings with Publishing status and a reopen route.',1392,'Meta','ink-soft');
await settle();const res=await finish();return{...res,routeLedger,publishLedger,outcomes,reviewBoard:board.id};
