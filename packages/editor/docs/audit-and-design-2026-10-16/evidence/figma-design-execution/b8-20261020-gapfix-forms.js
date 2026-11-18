// P10 fixed 365-day retention; filter-aware export target, no backend mutation.
const all=[];
async function inbox(id,name,{view='Inbox',form='Contact',count=24,selection=2,notice=''}={}){
 const r=id==='238:13598'&&!name?await figma.getNodeByIdAsync(id):await clone(id,name);
 await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 const w=r.findOne(n=>n.name==='Brand work area');
 for(const c of [...w.children])c.remove();w.itemSpacing=0;
 const h=frame(w,'Form submissions header',1144,64,'HORIZONTAL');pad(h,16);h.itemSpacing=16;h.counterAxisAlignItems='CENTER';
 const back=button(h,'‹ Back to Editor · Home','link',216);text(h,'Form submissions',480,'Panel');
 const body=frame(w,'Submissions content',1144,692);pad(body,24);body.itemSpacing=16;
 text(body,'Live immediately · no publish needed',1096,'Meta','ink-soft');
 const tabs=frame(body,'Submission views',1096,36,'HORIZONTAL');tabs.itemSpacing=8;
 const refs={};for(const v of ['Inbox','Spam','Archived']){refs[v]=button(tabs,v,v===view?'primary':'secondary',112);}
 const f=frame(body,'Filter and export',1096,40,'HORIZONTAL');f.itemSpacing=12;f.counterAxisAlignItems='CENTER';
 refs.form=select(f,'Form: '+form,240);text(f,view+' · '+count+' submissions',416,'Label');refs.export=button(f,'Export CSV','secondary',128);refs.configure=button(f,'Configure in Inspector','secondary',224);
 if(notice)text(body,notice,1096,'Label','success-text');
 text(body,'Submissions · '+form,1096,'Section');
 const people=view==='Spam'?['Taylor Adams']:view==='Archived'?['Alex Chen']:count===22?['A. Okafor']:['Mara Lenz','Jonas Peters','A. Okafor'];
 for(let i=0;i<people.length;i++){const row=frame(body,'Submission / '+people[i],1096,64,'HORIZONTAL');row.itemSpacing=16;row.counterAxisAlignItems='CENTER';row.strokes=[paint('border')];row.strokeWeight=1;pad(row,12);const cb=check(row,'Select '+people[i],i<selection,216);const detail=button(row,people[i]+' · Contact','ghost',240);const summary=frame(row,'Message preview',456,null);text(summary,i===0?'We’d like a quote for our new studio.':'Question about your studio',456);text(summary,'20 Oct · '+view,456,'Meta','ink-soft');if(i===0){refs.detail=detail;refs.select=cb;}}
 const bulk=frame(body,'Selection actions',1096,40,'HORIZONTAL');bulk.itemSpacing=12;text(bulk,selection+' selected',240,'Label');
 refs.delete=button(bulk,'Delete '+selection,selection?'secondary':'disabled',128);
 if(view!=='Inbox')refs.restore=button(bulk,view==='Spam'?'Unspam':'Unarchive',selection?'secondary':'disabled',128);
 text(body,'Showing '+people.length+' of '+count+' · sorted newest first',1096,'Meta','ink-soft');
 const footer=frame(w,'Retention footer',1144,56,'HORIZONTAL');pad(footer,16);text(footer,'Submissions are kept 365 days, then permanently deleted.',1112,'Meta','ink-soft');
 link(back,'245:51515');mutations.push(r.id,w.id);all.push({r,refs,body});return{r,refs,body};
}
const home=await inbox('238:13598','',{});
const spam=await inbox(home.r.id,'GAP-FM01 · Contact / Spam',{view:'Spam',count:3,selection:1});
const archived=await inbox(home.r.id,'GAP-FM02 · Contact / Archived',{view:'Archived',count:7,selection:1});
const unselected=await inbox(home.r.id,'GAP-FM03 · Contact / no selection',{selection:0});
const allforms=await inbox(home.r.id,'GAP-FM04 · All forms / Inbox',{form:'All forms',count:58,selection:0});
const filters=await clone(home.r.id,'GAP-FM05 · Form filter / Contact and All forms');
modal(filters,'Filter submissions','The view and form filters work together. Counts and CSV export follow both filters.',{width:520,actions:[{label:'Cancel',to:home.r.id},{label:'All forms',to:allforms.r.id},{label:'Contact',kind:'primary',to:home.r.id}]});
const detail=await clone(home.r.id,'GAP-FM06 · Mara submission / detail');
modal(detail,'Mara Lenz · Contact','mara@example.com\n20 Oct 2026 · 10:12\n“We’d like a quote for our new studio.”',{width:620,actions:[{label:'Back to submissions',kind:'primary',to:home.r.id}]});
// Replace old consequence dialog, including unsupported retention copy in its background.
const old=await figma.getNodeByIdAsync('238:13898');
await Promise.all(old.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
for(const t of old.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes('Change retention')){t.characters='Submissions are kept 365 days, then permanently deleted.';mutations.push(t.id);}
const oldDialog=old.children.find(n=>n.name==='Modal scrim / background inactive');
const delConfirm=await clone(home.r.id,'GAP-FM07 · Delete 2 submissions permanently / Cancel default');
const dm=modal(delConfirm,'Delete 2 submissions permanently?','Mara Lenz and Jonas Peters will be removed from Contact · Inbox. This cannot be undone.',{width:620,actions:[{label:'Cancel',to:home.r.id},{label:'Delete 2 permanently',kind:'primary',width:192}]});
dm.refs.Cancel.strokes=[paint('accent')];dm.refs.Cancel.strokeWeight=2;
const deleting=await clone(home.r.id,'GAP-FM08 · Delete submissions / pending');
const dp=modal(deleting,'Deleting 2 submissions…','Mara and Jonas remain listed until deletion is confirmed. No Undo is offered for permanent deletion.',{width:620});
const deleted=await inbox(home.r.id,'GAP-FM09 · Delete acknowledged / 22 Contact Inbox submissions',{count:22,selection:0,notice:'2 submissions permanently deleted.'});
const dfail=await clone(home.r.id,'GAP-FM10 · Delete failed / selection kept');
modal(dfail,'Couldn’t delete the submissions','Both submissions are still in Contact · Inbox. Your selection is kept.',{width:620,actions:[{label:'Cancel',to:home.r.id},{label:'Try again',kind:'primary',to:delConfirm.id}]});
link(dm.refs['Delete 2 permanently'],deleting.id);link(button(dp.d,'Check status','secondary',120),deleted.r.id);
// Original S14 remains a valid entry with the same safe Cancel and Delete transitions.
for(const b of old.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&/^(Cancel|Delete 2|Delete)$/.test(n.name)))link(b,b.name==='Cancel'?home.r.id:deleting.id);
const exports=[];
for(const t of [home,spam,archived,allforms]){
 const view=t===spam?'Spam':t===archived?'Archived':'Inbox',form=t===allforms?'All forms':'Contact',count=t===spam?3:t===archived?7:t===allforms?58:24;
 const ep=await clone(t.r.id,'GAP-FM-Export-'+view+'-'+form+' · Preparing CSV');
 const e=modal(ep,'Preparing CSV…',form+' · '+view+' · '+count+' submissions. All matching rows will be exported, including those not selected.',{width:620});
 const done=await clone(t.r.id,'GAP-FM-Export-'+view+'-'+form+' · CSV prepared');
 modal(done,'CSV ready',count+' submissions · '+form+' · '+view+'. Your selection and filters are unchanged.',{width:620,note:'Prototype fixture: no file is downloaded.',actions:[{label:'Back to submissions',kind:'primary',to:t.r.id}]});
 const failed=await clone(t.r.id,'GAP-FM-Export-'+view+'-'+form+' · CSV failed');
 modal(failed,'Couldn’t export submissions','No CSV was created. Your filters and selection are kept.',{width:620,actions:[{label:'Cancel',to:t.r.id},{label:'Try again',kind:'primary',to:ep.id}]});
 link(t.refs.export,ep.id);link(button(e.d,'Check status','secondary',120),done.id);exports.push({view,form,pending:ep.id,success:done.id,failed:failed.id});
}
// Immediate move back to Inbox, with source view kept after acknowledgement.
const moves=[];
for(const t of [spam,archived]){
 const view=t===spam?'Spam':'Archived',verb=t===spam?'Unspam':'Unarchive';
 const run=await clone(t.r.id,'GAP-FM-'+verb+' · Pending');
 const m=modal(run,verb+' submission…','The selected submission stays in '+view+' until the server confirms the move to Inbox.',{width:620});
 const result=await inbox(t.r.id,'GAP-FM-'+verb+' · Acknowledged',{view,count:t===spam?2:6,selection:0,notice:'1 submission moved to Inbox.'});
 // Do not show the acknowledged item again in the source list.
 await Promise.all(pending);pending.length=0;const rr=result.body.findOne(n=>n.name.startsWith('Submission / '));for(const c of [...rr.children])c.remove();text(rr,'The selected submission is now in Inbox.',1000);
 const failed=await clone(t.r.id,'GAP-FM-'+verb+' · Failed');
 modal(failed,'Couldn’t move the submission','The submission is still in '+view+'. Your selection is kept.',{width:620,actions:[{label:'Cancel',to:t.r.id},{label:'Try again',kind:'primary',to:run.id}]});
 link(t.refs.restore,run.id);link(button(m.d,'Check status','secondary',120),result.r.id);moves.push({view,pending:run.id,success:result.r.id,failed:failed.id});
}
// Exact Contact form owner in Inspector, then return to the same Inbox filter.
const configured=await clone('156:716','GAP-FM11 · Contact form / Inspector owner, return to submissions');
const col=configured.findOne(n=>n.name==='Canvas column');
const band=frame(null,'Return to submissions',col.width,40,'HORIZONTAL','accent-tint');col.insertChild(0,band);band.paddingLeft=12;band.counterAxisAlignItems='CENTER';
link(button(band,'‹ Back to submissions · Contact / Inbox','link',340),home.r.id);
const board=frame(null,'GAP-FM · Forms review / simulated server outcomes',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=10;roots.push(board);
text(board,'Form submissions · filter, export, delete and recover',1392,'Area');text(board,'Target design: export follows form + view. Current server export accepts form only; view-aware export needs implementation. Retention is fixed at 365 days. No real export or deletion occurs. Pending Check status uses a known-success fixture; select failures here.',1392);
for(const [label,n]of [['Inbox',home.r],['Spam',spam.r],['Archived',archived.r],['Delete confirm',delConfirm],['Delete pending',deleting],['Delete success',deleted.r],['Delete failed',dfail],['Configure Contact',configured]])link(button(board,label,'secondary',320),n.id);
for(const e of exports){link(button(board,'Export failure · '+e.form+' / '+e.view,'secondary',380),e.failed);}
for(const e of moves)link(button(board,e.view+' move failure','secondary',320),e.failed);
for(const t of all){
 for(const [k,target]of [['Inbox',home],['Spam',spam],['Archived',archived]])if(t.r.id!==target.r.id)link(t.refs[k],target.r.id);
 link(t.refs.form,filters.id);if(t.refs.detail&&t===home)link(t.refs.detail,detail.id);
 if(t===home){link(t.refs.select,unselected.r.id);link(t.refs.delete,delConfirm.id);}
 link(t.refs.configure,configured.id);
}
mutations.push(...home.r.findAll(()=>true).map(n=>n.id));return {...await finish(),exports,moves,entry:home.r.id,configure:configured.id};
