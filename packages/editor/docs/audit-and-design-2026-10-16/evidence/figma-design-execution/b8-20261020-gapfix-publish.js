// SC-7: Publish in each active resource area's task tray. All fixtures saved.
const origins=[['CMS','254:74075'],['Assets','199:37199'],['Brand','203:33565'],['Components','215:43301'],['Templates','222:43842']];
const entries=[];
async function tray(origin,area,code,title,content,cta){
 const r=await clone(origin,'GAP-PB-'+area+'-'+code+' · '+title);
 const t=frame(r,'Publish task tray / '+area,360,812);t.layoutPositioning='ABSOLUTE';t.x=1080;t.y=56;t.clipsContent=true;t.strokes=[paint('border')];t.strokeWeight=1;
 const h=frame(t,'Task header',360,56,'HORIZONTAL');pad(h,12);h.itemSpacing=8;h.counterAxisAlignItems='CENTER';text(h,'Publish · whole site',276,'Panel');const close=button(h,'Close','ghost',48);
 const body=frame(t,'Task body',360,668);pad(body,16);body.itemSpacing=16;body.clipsContent=true;
 text(body,'Fieldwork Studio',328,'Section');
 for(const [heading,copy]of content){const g=frame(body,heading,328,null);g.itemSpacing=6;text(g,heading,328,'Label');text(g,copy,328,'Body','ink-soft');}
 const f=frame(t,'Task footer',360,88);pad(f,12);f.itemSpacing=8;const action=button(f,cta,code==='pending'?'secondary':'primary',336);text(f,'Privacy policy · Terms of service',336,'Meta','ink-soft');
 link(close,origin);
 return{r,t,body,close,action};
}
for(const [area,id]of origins){
 const ready=await tray(id,area,'ready','Saved changes / checks passed',[
 ['Live release','v12 · fieldwork.studio'],
 ['What will change','Whole site · Home and Work updated. CMS: 4 records. Brand: 2 tokens.'],
 ['Checks','All blocking checks passed · no advisory checks. Site saves confirmed.'],
 ['Approval','Round 2 approved · this saved revision matches the reviewed version.'],
 ['Goes to','fieldwork.studio · production']
 ],'Review and publish');
 const confirm=await clone(ready.r.id,'GAP-PB-'+area+'-confirm · Review whole-site release');
 const cm=modal(confirm,'Publish to fieldwork.studio?','Whole site · Home and Work updated · 4 CMS records · 2 Brand tokens. Saved revision 104 matches approved Round 2.',{width:720,note:'This replaces live v12. Existing password protection stays on. Changes after this check require another review.',actions:[{label:'Cancel',to:ready.r.id},{label:'Publish site',kind:'primary',width:152}]});
 const run=await tray(id,area,'pending','Publishing / same job remains active',[
 ['Publishing to fieldwork.studio…','Step 2 of 5 · building pages. Release has not been confirmed.'],
 ['Keep working','Closing this task does not cancel the publish. Reopen Publish to check this job.']
 ],'Check status');
 const success=await tray(id,area,'success','Published / acknowledged release',[
 ['Published · v13','fieldwork.studio · server confirmed release 13.'],
 ['Included','Home and Work · 4 CMS records · 2 Brand tokens.'],
 ['Return to your task','Closing Publish keeps your '+area+' selection and filters.']
 ],'Done');
 const failure=await tray(id,area,'failed','Publish failed / live v12 unchanged',[
 ['Couldn’t publish','Build failed before deployment. Your saved edits are kept; live v12 remains available.'],
 ['Next step','Review checks and the latest saved revision before trying again.']
 ],'Review and retry');
 const unknown=await tray(id,area,'unknown','Publish status unknown / do not start another',[
 ['Connection to the publish job was lost','The release may still be running. We haven’t confirmed a new live version.'],
 ['Recovery','Check this job before starting another publish.']
 ],'Check status');
 // Return from a running task preserves the job in the topbar.
 const working=await clone(id,'GAP-PB-'+area+'-working · Publish continues while working');
 const wb=working.findOne(n=>n.type==='INSTANCE'&&n.name==='Publish'&&n.parent.name==='Topbar / site scope');
 wb.setProperties({'Label#4:18':'Publishing…'});wb.name='Publishing…';wb.resize(100,32);const flex=working.findOne(n=>n.name==='Flexible space');if(flex)flex.resize(flex.width-18,1);
 link(wb,run.r.id);link(run.close,working.id);
 link(ready.action,confirm.id);link(cm.refs['Publish site'],run.r.id);link(run.action,success.r.id);link(success.action,id);link(failure.action,ready.r.id);link(unknown.action,success.r.id);
 const original=await figma.getNodeByIdAsync(id);
 link(original.findOne(n=>n.type==='INSTANCE'&&n.name==='Publish'&&n.parent.name==='Topbar / site scope'),ready.r.id);
 entries.push({area,origin:id,ready:ready.r.id,confirm:confirm.id,pending:run.r.id,success:success.r.id,failed:failure.r.id,unknown:unknown.r.id,working:working.id});
}
const board=frame(null,'GAP-PB · Resource Publish review / simulated outcomes',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Publish from your current area',1392,'Area');
text(board,'Saved, permitted fixtures only. Whole-site scope; existing approval/protection are kept. Check status follows a known-success service fixture; no automatic success timer and nothing is published. Existing PB01–PB23 retain blocker, stale-review, permission and offline designs. Live site/legal links are visual text only in this bounded prototype.',1392);
for(const e of entries){const row=frame(board,e.area,1392,40,'HORIZONTAL');row.itemSpacing=8;text(row,e.area,180,'Label');for(const k of ['ready','pending','success','failed','unknown'])link(button(row,k,'secondary',160),e[k]);}
return {...await finish(),entries};
