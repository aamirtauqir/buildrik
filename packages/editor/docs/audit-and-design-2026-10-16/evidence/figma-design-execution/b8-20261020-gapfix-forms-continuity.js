// Context fixtures keep view, form, selection and acknowledged mutations on return.
const states={}, contexts={
 base:{Contact:[24,3,7],'All forms':[58,9,17],notice:''},
 deleted:{Contact:[22,3,7],'All forms':[56,9,17],notice:'2 submissions permanently deleted.'},
 unspam:{Contact:[25,2,7],'All forms':[59,8,17],notice:'1 submission moved from Spam to Inbox.'},
 unarchive:{Contact:[25,3,6],'All forms':[59,9,16],notice:'1 submission moved from Archived to Inbox.'},
 deleteSpam:{Contact:[24,2,7],'All forms':[58,8,17],notice:'1 spam submission permanently deleted.'},
 deleteArchive:{Contact:[24,3,6],'All forms':[58,9,16],notice:'1 archived submission permanently deleted.'}
};
const reused={
 'base|Contact|Inbox':'238:13598','base|Contact|Spam':'272:21156','base|Contact|Archived':'272:21455','base|All forms|Inbox':'272:22068',
 'deleted|Contact|Inbox':'272:23475','unspam|Contact|Spam':'272:27440','unarchive|Contact|Archived':'272:28228'
};
const views=['Inbox','Spam','Archived'];
for(const [ctx,data]of Object.entries(contexts))for(const form of ['Contact','All forms'])for(let i=0;i<3;i++){
 const view=views[i],key=[ctx,form,view].join('|'),old=reused[key],selection=ctx==='base'&&form==='Contact'?(view==='Inbox'?2:1):0;
 const t=await inbox(old||'238:13598',old?'':'GAP-FMC-'+ctx+'-'+form+'-'+view,{view,form,count:data[form][i],selection,notice:data.notice});
 // Preserve each surviving submission's own message.
 for(const row of t.body.children.filter(n=>n.name.startsWith('Submission / '))){
  const name=row.name.replace('Submission / ','');const copy=row.findOne(n=>n.type==='TEXT'&&/quote|Question about/.test(n.characters));
  if(copy)copy.characters=name==='Mara Lenz'?'We’d like a quote for our new studio.':name==='A. Okafor'?'Question about your studio':name==='Jonas Peters'?'Question about your studio':'Please share more information.';
 }
 if(ctx==='unspam'&&view==='Spam'||ctx==='deleteSpam'&&view==='Spam'||ctx==='unarchive'&&view==='Archived'||ctx==='deleteArchive'&&view==='Archived'){
  const row=t.body.findOne(n=>n.name.startsWith('Submission / '));await Promise.all(pending);pending.length=0;
  for(const c of [...row.children])c.remove();text(row,view==='Spam'?'Jordan · remaining spam submission':'Sam · remaining archived submission',1000);t.refs.detail=null;t.refs.select=null;
 }
 if((ctx==='unspam'||ctx==='unarchive')&&view==='Inbox'){
  const moved=frame(t.body,'Moved submission',1096,40,'HORIZONTAL');text(moved,(ctx==='unspam'?'Taylor Adams':'Alex Chen')+' · Contact · moved to Inbox',1096);t.body.insertChild(5,moved);
 }
 states[key]={...t,ctx,form,view,count:data[form][i],selection};
}
const fixtureIndex=[];
for(const [key,t]of Object.entries(states)){
 for(const view of views){const dest=states[[t.ctx,t.form,view].join('|')];if(dest.r.id!==t.r.id)link(t.refs[view],dest.r.id);}
 const filter=await clone(t.r.id,'GAP-FMC-Filter-'+key);
 modal(filter,'Filter submissions',t.view+' view is kept. Change the form to update counts and CSV scope.',{width:520,actions:[{label:'Cancel',to:t.r.id},{label:'All forms',to:states[[t.ctx,'All forms',t.view].join('|')].r.id},{label:'Contact',kind:'primary',to:states[[t.ctx,'Contact',t.view].join('|')].r.id}]});
 link(t.refs.form,filter.id);
 // Export is independent of row selection.
 const ep=await clone(t.r.id,'GAP-FMC-Export-pending-'+key);
 const em=modal(ep,'Preparing CSV…',t.form+' · '+t.view+' · '+t.count+' submissions. Export includes every matching row, including unselected rows.',{width:620});
 const ok=await clone(t.r.id,'GAP-FMC-Export-ready-'+key);
 modal(ok,'CSV ready',t.count+' submissions · '+t.form+' · '+t.view+'. Your filters and selection are kept.',{width:620,note:'Design fixture: no actual file is downloaded.',actions:[{label:'Back to submissions',kind:'primary',to:t.r.id}]});
 const fail=await clone(t.r.id,'GAP-FMC-Export-failed-'+key);
 modal(fail,'Couldn’t export submissions','No CSV was created. Your '+t.form+' / '+t.view+' filter and selection are kept.',{width:620,actions:[{label:'Cancel',to:t.r.id},{label:'Try again',kind:'primary',to:ep.id}]});
 link(t.refs.export,ep.id);link(button(em.d,'Check status','secondary',128),ok.id);
 fixtureIndex.push({key,root:t.r.id,filter:filter.id,exportPending:ep.id,exportReady:ok.id,exportFailed:fail.id});
 if(t.form==='Contact'){
  const config=await clone('156:716','GAP-FMC-Configure-'+key);
  const col=config.findOne(n=>n.name==='Canvas column'),viewport=[...col.children].sort((a,b)=>b.height-a.height)[0];viewport.resize(viewport.width,viewport.height-40);
  const band=frame(null,'Return to submissions',col.width,40,'HORIZONTAL','accent-tint');col.insertChild(0,band);band.paddingLeft=12;band.counterAxisAlignItems='CENTER';
  link(button(band,'‹ Back to submissions · Contact / '+t.view,'link',380),t.r.id);link(t.refs.configure,config.id);
 }else{
  t.refs.configure.swapComponent(masters['4:261']);t.refs.configure.setProperties({'Label#4:18':'Choose a form to configure'});
  text(t.body,'Select a single form before configuring it in Inspector.',1096,'Meta','ink-soft');
 }
 if(t.ctx==='base'&&t.form==='Contact'){
  const dst=t.view==='Inbox'?'deleted':t.view==='Spam'?'deleteSpam':'deleteArchive';
  const confirm=await clone(t.r.id,'GAP-FMC-Delete-confirm-'+key);
  const cm=modal(confirm,'Delete '+t.selection+' submissions permanently?',(t.view==='Inbox'?'Mara Lenz and Jonas Peters':t.view==='Spam'?'Taylor Adams':'Alex Chen')+' will be removed from Contact · '+t.view+'. This cannot be undone.',{width:620,actions:[{label:'Cancel',to:t.r.id},{label:'Delete permanently',kind:'primary',width:184}]});
  cm.refs.Cancel.strokes=[paint('accent')];cm.refs.Cancel.strokeWeight=2;
  const run=await clone(t.r.id,'GAP-FMC-Delete-pending-'+key);const pm=modal(run,'Deleting submissions…','The selected submissions remain until the server confirms removal.',{width:620});
  const failDelete=await clone(t.r.id,'GAP-FMC-Delete-failed-'+key);modal(failDelete,'Couldn’t delete submissions','Nothing was removed. Your selection and filters are kept.',{width:620,actions:[{label:'Cancel',to:t.r.id},{label:'Try again',kind:'primary',to:confirm.id}]});
  link(t.refs.delete,confirm.id);link(cm.refs['Delete permanently'],run.id);link(button(pm.d,'Check status','secondary',128),states[[dst,'Contact',t.view].join('|')].r.id);
  fixtureIndex.push({key,deleteConfirm:confirm.id,deletePending:run.id,deleteFailed:failDelete.id});
 }
 if(t.ctx==='base'&&t.form==='Contact'&&t.view!=='Inbox'){
  const dst=t.view==='Spam'?'unspam':'unarchive',run=await figma.getNodeByIdAsync(t.view==='Spam'?'272:27190':'272:27978');
  link(t.refs.restore,run.id);
 }
}
// Preserve no-selection Inbox export and Configure origins without resetting selection.
const unselected=await figma.getNodeByIdAsync('272:21754');
for(const n of unselected.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name==='Export CSV')){
 const ep=await clone(unselected.id,'GAP-FMC-No-selection-export');const m=modal(ep,'CSV ready','24 submissions · Contact · Inbox. No selection is required.',{width:620,note:'Prototype fixture: no download occurs.',actions:[{label:'Back to submissions',kind:'primary',to:unselected.id}]});link(n,ep.id);
}
const board=frame(null,'GAP-FMC · Context preservation review',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=10;roots.push(board);text(board,'Forms · filters and results stay in context',1392,'Area');
text(board,'Each row is a separate acknowledged dataset fixture. Filters retain form + view; post-delete and post-move navigation retains updated counts. Return from Configure restores its exact origin. Export is filter-aware target design, not existing backend functionality. These are finite prototype fixtures; combined successive mutations and service behavior remain implementation tests.',1392);
for(const [ctx]of Object.entries(contexts)){const row=frame(board,ctx,1392,40,'HORIZONTAL');row.itemSpacing=8;text(row,ctx,180,'Label');for(const view of views)link(button(row,'Contact / '+view,'secondary',224),states[[ctx,'Contact',view].join('|')].r.id);}
for(const f of fixtureIndex.filter(x=>x.deleteFailed))link(button(board,'Deletion failure · '+f.key,'secondary',440),f.deleteFailed);
for(const t of Object.values(states))mutations.push(...[t.r,...t.r.findAll(()=>true)].map(n=>n.id));
const ledger=await finish();figma.io.write('forms-continuity-full-ids.json',JSON.stringify(ledger));return {createdNodeIds:roots.map(n=>n.id),mutatedNodeIds:Object.values(states).map(t=>t.r.id),allAffectedNodeIds:'forms-continuity-full-ids.json',frameCount:roots.length,contexts:fixtureIndex,board:board.id};
