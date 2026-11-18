const hub='302:3370';
const origin=await specimen('237:10534','F5.01','Designer · send next review round');
const send=await specimen('237:10534','F5.02','Send Round 3');
const render=await specimen('237:10534','F5.03','Preparing frozen preview');
const renderFail=await specimen('237:10534','F5.04','Preview failed · nothing sent');
const submit=await specimen('237:10534','F5.05','Sending review');
const sent=await specimen('237:10534','F5.06','Round 3 sent');
const client=await specimen('237:12304','F5.07','Client · frozen Round 3');
const compose=await specimen('237:12354','F5.08','Client comment draft');
const post=await specimen('237:12354','F5.09','Sending client comment');
const postFail=await specimen('237:12354','F5.10','Comment failed · draft retained');
const posted=await specimen('237:12304','F5.11','Client comment acknowledged');
const designer=await specimen('237:8258','F5.12','Designer · comment on Logo');
const locate=await specimen('237:9422','F5.13','Logo located · 24px');
const edited=await specimen('237:9422','F5.14','Logo enlarged · 28px');
const returnReview=await specimen('237:8258','F5.15','Return to the same comment');
const resolving=await specimen('237:8258','F5.16','Resolving comment');
const resolveFail=await specimen('237:8258','F5.17','Resolve failed · comment still open');
const resolved=await specimen('237:8258','F5.18','Resolved · approval unchanged');
const clientResolved=await specimen('237:12304','F5.19','Client · resolved note on frozen snapshot');
const approvals=[];
for(const [source,key,title]of [
 ['276:28306','F5.20','Approval code entry'],['276:28376','F5.21','Approval code entered'],['276:28444','F5.22','Approval pending'],['276:28558','F5.23','Approval receipt'],['276:28504','F5.24','Round 3 approved'],
 ['276:28616','F5.25','Incorrect code'],['276:28687','F5.26','Expired code'],['276:28752','F5.27','Sending new code'],['276:28811','F5.28','New code sent'],['276:28873','F5.29','Code email failed'],['276:28938','F5.30','Code rate limited'],['276:29002','F5.31','Already answered'],['276:29064','F5.32','Approval failed'],['276:29130','F5.33','Approval offline']
])approvals.push(await specimen(source,key,title));
const stale=await specimen('237:8258','F5.34','Approved · edited since sent snapshot');
const fresh=await specimen('237:10534','F5.35','Request fresh Round 4');
const freshPending=await specimen('237:10534','F5.36','Sending fresh Round 4');
const freshSent=await specimen('237:8258','F5.37','Round 4 sent · approval pending');
mapLinks({'237:12304':clientResolved.id});
const by=Object.fromEntries(suite.map(s=>[s.key,s]));
function replaceAnywhere(s,from,to) {for(const t of s.p.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes(from)){t.characters=t.characters.split(from).join(to);mutations.push(t.id);}}
function designerTask(s,{round=3,state='Opened by Lena',open=true,staleState=false,next=false}={}){
 const task=s.p.findOne(n=>n.name==='Task host / Review');if(!task)return;
 const body=task.findOne(n=>n.name==='Task body');for(const c of [...body.children])c.remove();
 body.itemSpacing=12;
 const card=frame(body,'Current review round',336,null,'VERTICAL','bg-subtle');pad(card,12);card.itemSpacing=8;
 text(card,state,312,'Label',staleState?'warning-text':'ink');
 text(card,'Atelier Nord · Round '+round,312,'Label');
 text(card,'Lena Weiss · lena@atelier.example',312,'Meta','ink-soft');
 text(card,'Sent 20 Oct 2026 · link ends 18 Jan 2027',312,'Meta','ink-soft');
 text(card,staleState?'Logo changed after the sent snapshot. Approval covers the 24px logo only.':'Frozen snapshot · Logo 24px. Later edits do not change this round.',312,'Body');
 text(body,open?'1 open · 0 resolved':'0 open · 1 resolved',336,'Label');
 text(body,'Home',336,'Meta','ink-soft');
 const comment=frame(body,'Comment · Logo on Home',336,null);comment.itemSpacing=8;
 text(comment,'Lena · Logo · Round 3',336,'Label');text(comment,'“Make the logo larger”',336,'Body');
 const actions=frame(comment,'Comment actions',336,null,'HORIZONTAL',null);actions.itemSpacing=8;
 if(open){link(button(actions,'Locate ›','link',96),locate.id);const resolve=button(actions,'Resolve','secondary',112);if(s!==resolving)link(resolve,resolving.id);}
 else {text(comment,'Resolved · Designer enlarged Logo to 28px.',336,'Meta','success-text');link(button(comment,'Undo resolve','secondary',136),returnReview.id);}
 if(staleState){const b=button(body,'Request fresh review','primary',220);if(s!==fresh)link(b,fresh.id);}
 const ft=task.findOne(n=>n.name==='Task footer');
 for(const c of [...ft.children])c.remove();ft.resize(360,48);ft.layoutMode='HORIZONTAL';ft.paddingLeft=12;ft.counterAxisAlignItems='CENTER';
 if(next){const b=button(ft,'Send Round 3 to Lena','primary',220);if(s!==send)link(b,send.id);}
 else text(ft,staleState?'Approval is stale':'Resolving a comment does not approve the round.',336,'Meta','ink-soft');
 const title=task.findOne(n=>n.name==='Task header');
 for(const t of title.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes('Round '))t.characters='Atelier Nord · Round '+round;
}
for(const s of [origin,send,render,renderFail,submit,sent])designerTask(s,{round:2,state:'Changes requested · ready for next round',open:false,next:true});
for(const s of [designer,returnReview,resolving,resolveFail])designerTask(s);
designerTask(resolved,{open:false,state:'Comment resolved · round still open'});
designerTask(stale,{open:false,state:'Lena approved Round 3 · edited since',staleState:true});
designerTask(fresh,{open:false,state:'Lena approved Round 3 · edited since',staleState:true});
designerTask(freshPending,{open:false,state:'Lena approved Round 3 · edited since',staleState:true});
designerTask(freshSent,{round:4,open:false,state:'Round 4 sent · waiting for client'});
// Round 4 is a fresh snapshot and a separate approval.
replaceAnywhere(freshSent,'Frozen snapshot · Logo 24px. Later edits do not change this round.','Frozen snapshot · Logo 28px. Round 3 approval does not approve Round 4.');
function sendDialog(s,round,to,cancelTo) {
 const m=modal(s.p,'Send Round '+round+' for review','Send a frozen snapshot of Atelier Nord to your client. This replaces the previous review link.',{width:560,actions:[{label:'Cancel',to:cancelTo.id},{label:'Send for review',kind:'primary',width:160,to:to.id}]});
 const actions=m.d.children[m.d.children.length-1];m.d.children.length;
 const fields=frame(m.d,'Review details',512,null);fields.itemSpacing=8;
 text(fields,'Client email',512,'Label');input(fields,'lena@atelier.example',512);
 text(fields,'What changed?',512,'Label');input(fields,round===3?'Navigation and page layout':'Logo enlarged from 24px to 28px',512);
 text(fields,'Note to Lena',512,'Label');input(fields,'Please review the latest design.',512);
 m.d.appendChild(actions);return m;
}
sendDialog(send,3,render,origin);sendDialog(fresh,4,freshPending,stale);
modal(render.p,'Preparing the review preview…','Creating the frozen Round 3 snapshot. Nothing has been sent yet.',{actions:[]});
modal(renderFail.p,'We couldn’t render a preview','Your client would see no pages. Nothing was sent. Your email and note are kept.',{width:560,actions:[{label:'Cancel',to:send.id},{label:'Try again',kind:'primary',to:render.id}]});
modal(submit.p,'Sending Round 3…','The frozen preview is ready. Waiting for the review and invitation outcome.',{actions:[]});
modal(sent.p,'Round 3 sent','Review created for lena@atelier.example. The invitation was accepted for delivery. Approval is still pending.',{actions:[{label:'Done',to:designer.id}]});
modal(freshPending.p,'Sending Round 4…','Creating a fresh snapshot with the 28px Logo. Round 3 approval stays attached to its original snapshot.',{actions:[]});
fixture(render,'Fixture: preview ready',submit);fixture(render,'Fixture: preview failed',renderFail);
fixture(submit,'Fixture: round + invite acknowledged',sent);
fixture(submit,'Fixture: request rejected',send);
fixture(sent,'Switch role: open client review',client);
fixture(freshPending,'Fixture: Round 4 acknowledged',freshSent);
fixture(freshPending,'Fixture: send rejected · draft kept',fresh);
function clientScreen(s,{comment=false,resolvedNote=false,approved=false}={}){
 replaceAnywhere(s,'Round 2','Round 3');replaceAnywhere(s,'sent 15 Oct','sent 20 Oct');replaceAnywhere(s,'15 Oct 2026','20 Oct 2026');replaceAnywhere(s,'13 Jan 2027','18 Jan 2027');replaceAnywhere(s,'new menu page','Navigation and page layout');
 const snap=s.p.findOne(n=>n.name==='Snapshot');
 if(snap)for(const n of [...snap.children])if(/^Pin /.test(n.name))n.remove();
 const comments=s.p.findOne(n=>n.name==='Comments');
 if(comments){
  for(const n of [...comments.children])n.remove();
  text(comments,comment?'Comments (1)':'Comments (0)',328,'Panel');
  if(comment){text(comments,'① Make the logo larger',328,'Label');text(comments,'Home · Logo · Round 3 · '+(resolvedNote?'Resolved':'Open'),328,'Meta','ink-soft');if(resolvedNote)text(comments,'Studio: Logo enlarged to 28px in the draft.',328,'Body');}
  text(comments,'From Round 2 (3) ▸ · may have moved',328,'Meta','ink-soft');
  text(comments,'This preview is the sent snapshot. Later draft edits are not shown.',328,'Body','ink-soft');
 }
 if(comment&&snap){
  const pin=frame(snap,'Pin 1 · Logo',24,24,'HORIZONTAL',resolvedNote?'bg-panel':'accent');pin.layoutPositioning='ABSOLUTE';pin.x=24;pin.y=24;pin.counterAxisAlignItems='CENTER';pin.primaryAxisAlignItems='CENTER';text(pin,resolvedNote?'✓':'1',16,'Micro',resolvedNote?'accent':'bg-panel');
 }
 const app=s.p.findOne(n=>n.type==='INSTANCE'&&n.name==='Approve Round 2');if(app){app.setProperties({'Label#4:18':'Approve Round 3'});app.name='Approve Round 3';}
 const add=s.p.findOne(n=>n.name==='＋ Add comment  C');if(add&&!approved&&s!==compose)link(add,compose.id);
}
clientScreen(client);clientScreen(compose);clientScreen(post);clientScreen(postFail);clientScreen(posted,{comment:true});clientScreen(clientResolved,{comment:true,resolvedNote:true});
for(const s of approvals)clientScreen(s,{comment:true,resolvedNote:true,approved:['F5.23','F5.24'].includes(s.key)});
// Keep the new comment content and captured position consistent.
for(const s of [compose,post,postFail]){
 const field=s.p.findOne(n=>n.type==='INSTANCE'&&n.componentProperties['Value#4:30']?.value==='The headline feels too big on this image');
 if(field)field.setProperties({'Value#4:30':'Make the logo larger'});
}
namedLink(compose,'Cancel',client);namedLink(compose,'Send ⌘↵',post);
modal(post.p,'Sending comment…','Your comment and Logo position are kept until the server confirms it.',{actions:[]});
modal(postFail.p,'Comment wasn’t sent','“Make the logo larger” is kept at the Logo position.',{actions:[{label:'Keep editing',to:compose.id},{label:'Try again',kind:'primary',to:post.id}]});
fixture(post,'Fixture: comment acknowledged',posted);fixture(post,'Fixture: comment rejected',postFail);
fixture(posted,'Switch role: designer opens Review',designer);
fixture(resolved,'Switch role: client reloads Round 3',clientResolved);
function logoEditor(s,size,to){
 replaceAnywhere(s,'Hero / Text','Navigation / Logo');
 replaceAnywhere(s,'Editing Desktop · Default state','Logo · Desktop · Default');
 const ins=s.p.findOne(n=>n.name==='Inspector / selected-object owner');
 for(const c of [...ins.children])c.remove();ins.itemSpacing=0;
 const body=frame(ins,'Logo Inspector',300,780);pad(body,12);body.itemSpacing=12;
 text(body,'Logo',276,'Panel');text(body,'Home › Navigation › Logo',276,'Meta','ink-soft');
 text(body,'Style · Desktop · Default',276,'Label');
 text(body,'Typography',276,'Label');text(body,'Inter · Regular',276,'Body');
 text(body,'Font size (px)',276,'Meta','ink-soft');
 const value=input(body,String(size),276);if(size===24)link(value,edited.id);
 text(body,'Local Desktop value. Tablet and Mobile inherit unless overridden.',276,'Body','ink-soft');
 link(button(body,'‹ Back to Review','link',180),to.id);
 if(size===28)link(button(body,'Undo logo size','secondary',160),locate.id);
 const oldBack=s.p.findOne(n=>n.name==='Comment located band')?.findOne(n=>n.name==='‹ Back to Review');if(oldBack)link(oldBack,to.id);
 const brand=s.p.findOne(n=>n.type==='TEXT'&&n.characters==='fieldwork.');
 if(brand){brand.characters='atelier nord';brand.fontSize=size;brand.fills=[paint('ink')];}
 const tree=s.p.findOne(n=>n.name==='Drawer scroll');
 if(tree){for(const c of [...tree.children])c.remove();for(const label of ['Navigation','Logo','Hero','Selected work','Footer']){const row=masters[label==='Logo'?'4:493':'4:473'].createInstance();tree.appendChild(row);row.setProperties({'Label#4:70':label});row.resize(260,32);}}
 status(s.p,size===28?'Page saved · edited since Round 3 snapshot':'Page saved · reviewing Round 3 comment');
}
logoEditor(locate,24,designer);logoEditor(edited,28,returnReview);
modal(resolving.p,'Resolving comment…','Lena’s Logo comment stays open until confirmation. This does not approve the round.',{actions:[]});
modal(resolveFail.p,'Couldn’t resolve this comment','The Logo edit is saved. The comment remains open.',{actions:[{label:'Back to Review',to:returnReview.id},{label:'Try again',kind:'primary',to:resolving.id}]});
fixture(resolving,'Fixture: resolve acknowledged',resolved);fixture(resolving,'Fixture: resolve rejected',resolveFail);
namedLink(clientResolved,'Approve Round 3',by['F5.20']);
namedLink(posted,'Approve Round 3',by['F5.20']);
// Native controls never pretend a successful network response; outcomes are explicit fixtures.
for(const [k,options]of [
 ['F5.22',[['Fixture: approval acknowledged','F5.23'],['Fixture: incorrect code','F5.25'],['Fixture: expired code','F5.26'],['Fixture: approval failed','F5.32']]],
 ['F5.27',[['Fixture: code sent','F5.28'],['Fixture: email failed','F5.29'],['Fixture: rate limited','F5.30']]]
]){
 const s=by[k];const check=s.p.findOne(n=>n.name==='Check status');if(check){check.reactions=[];linkedIds.delete(check.id);}
 for(const [label,target]of options)fixture(s,label,by[target]);
}
fixture(by['F5.20'],'Fixture: offline',''+by['F5.33'].id);
fixture(by['F5.21'],'Fixture: answered in another tab',by['F5.31']);
fixture(by['F5.24'],'Switch role: designer sees stale approval',stale);
// Update approval button properties as well as free-standing text.
for(const s of approvals)for(const n of s.p.findAllWithCriteria({types:['INSTANCE']})){
 const label=n.componentProperties['Label#4:18']?.value;
 if(typeof label==='string'&&label.includes('Round 2'))n.setProperties({'Label#4:18':label.replaceAll('Round 2','Round 3')});
}
link(await figma.getNodeByIdAsync('302:3391'),origin.id);
page.flowStartingPoints=[...page.flowStartingPoints,{nodeId:origin.id,name:'F5 · Review, comment, resolve and approve'}];mutations.push(page.id);
return await suiteFinish(hub);
