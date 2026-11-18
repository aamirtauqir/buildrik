// P17 / external client review. Prototype fixtures, no email or approval sent.
const reviewRoots=[];
function findButton(r,name){return r.findOne(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name===name);}
function touch(n){n.resize(n.width,44);return n;}
function externalActions(r){for(const n of r.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.componentProperties['Label#4:18']))touch(n);}
async function dialog(base,code,title,copy,{note='',actions=[],phone=false}={}){
 const r=await clone(base,'GAP-RV-'+code+' · '+title);const m=modal(r,title,copy,{width:phone?r.width:520,note,actions});externalActions(m.d);
 if(phone){pad(m.d,16);for(const t of m.d.children.filter(n=>n.type==='TEXT'))t.resize(r.width-32,t.height);const a=m.d.children.find(n=>n.name==='Actions');a.resize(r.width-32,a.height);a.layoutMode='VERTICAL';a.itemSpacing=8;for(const b of a.children)b.resize(r.width-32,44);m.d.x=0;await Promise.all(pending);m.d.y=r.height-m.d.height;}
 reviewRoots.push(r);return{r,...m};
}
const desktop=await figma.getNodeByIdAsync('237:12304'),phone=await figma.getNodeByIdAsync('237:12609');
await Promise.all([desktop,phone].flatMap(r=>r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName)))));
externalActions(desktop);externalActions(phone);const dd=desktop.findOne(n=>n.name==='Device switch');dd.resize(dd.width,44);const ds=desktop.findOne(n=>n.name==='Snapshot');ds.resize(ds.width,ds.height-12);mutations.push(desktop.id,phone.id);
// Repair phone header and device-row geometry for the external 44px scale.
const ph=phone.children.find(n=>n.name==='Header');ph.itemSpacing=12;ph.children[0].resize(251,ph.children[0].height);ph.children[1].resize(80,ph.children[1].height);ph.paddingLeft=16;ph.paddingRight=16;ph.children[0].resize(251-32,ph.children[0].height);
const pdev=phone.findOne(n=>n.name==='Device switch');pdev.resize(351,44);const psnap=phone.findOne(n=>n.name==='Snapshot');psnap.resize(351,572);
const commentsLabel=findButton(phone,'💬 Comments 3');commentsLabel.setProperties({'Label#4:18':'Comments (3)'});commentsLabel.name='Comments (3)';
// Shared signer/snapshot are repeated on every approval state.
const packages=[];
for(const [device,base,isPhone]of [['Desktop',desktop.id,false],['Phone',phone.id,true]]){
 const copy='Atelier Nord · Round 2 · sent 15 Oct 2026.\nNew menu page · Home, Work, Menu.\nLena Weiss · lena@atelier.example.\nYour approval covers this sent version only.';
 const entry=await dialog(base,device+'-code','Approve Round 2?',copy,{phone:isPhone,note:'Enter the 6-digit code sent to l•••@atelier.example.',actions:[{label:'Cancel',to:base},{label:'Approve Round 2',kind:'disabled',width:176}]});
 const field=input(entry.d,'',isPhone?343:472);field.resize(field.width,44);entry.d.insertChild(entry.d.children.findIndex(n=>n.name==='Actions'),field);
 const resend=touch(button(entry.d,'Send a new code','link',isPhone?343:180));
 const ready=await dialog(base,device+'-ready','Approve Round 2?',copy,{phone:isPhone,note:'Code entered · confirmation is permanent. If you need changes later, reply to Fieldwork Studio.',actions:[{label:'Cancel',to:base},{label:'Approve Round 2',kind:'primary',width:176}]});
 const codeField=input(ready.d,'481 926',isPhone?343:472);codeField.resize(codeField.width,44);ready.d.insertChild(ready.d.children.findIndex(n=>n.name==='Actions'),codeField);
 const pendingApproval=await dialog(base,device+'-pending','Confirming approval…',copy,{phone:isPhone,note:'Waiting for confirmation. Don’t submit another approval.',actions:[]});
 const approved=await clone(base,'GAP-RV-'+device+'-approved · Approval acknowledged');
 const foot=approved.findOne(n=>n.name==='Footer');for(const n of [...foot.children])n.remove();foot.layoutMode='VERTICAL';foot.itemSpacing=4;foot.primaryAxisAlignItems='CENTER';
 text(foot,'Approved · Round 2',approved.width-48,'Label','success-text');text(foot,'Lena Weiss · 20 Oct 2026, 10:30 UTC',approved.width-48,'Meta','ink-soft');
 const receipt=await dialog(approved.id,device+'-receipt','Round 2 approved','Atelier Nord · Fieldwork Studio\nRound 2 · approved 20 Oct 2026, 10:30 UTC\nLena Weiss · lena@atelier.example\nChanges: new menu page\nPages: Home, Work, Menu\nView this review online until 13 Jan 2027.',{phone:isPhone,note:'Approval recorded. To request more changes, reply to Fieldwork Studio. This receipt contains no access token.',actions:[{label:'Return to review',kind:'primary',to:approved.id}]});
 const incorrect=await dialog(base,device+'-incorrect','That code didn’t match',copy,{phone:isPhone,note:'Check all 6 digits and try again. Your approval has not been recorded.',actions:[{label:'Cancel',to:base},{label:'Edit code',kind:'primary',to:entry.r.id}]});
 const wrong=input(incorrect.d,'481 925',isPhone?343:472,true);wrong.resize(wrong.width,44);incorrect.d.insertChild(incorrect.d.children.findIndex(n=>n.name==='Actions'),wrong);
 const expired=await dialog(base,device+'-expired','This code has expired',copy,{phone:isPhone,note:'Request a new code. Approval has not been recorded.',actions:[{label:'Cancel',to:base},{label:'Send a new code',kind:'primary'}]});
 const sending=await dialog(base,device+'-sending','Sending a new code…','The approval is still open. A new code will replace the previous one only after delivery is accepted.',{phone:isPhone,actions:[]});
 const sent=await dialog(base,device+'-sent','New code sent','Check l•••@atelier.example. The previous code no longer works. Round 2 is still awaiting your approval.',{phone:isPhone,actions:[{label:'Enter code',kind:'primary',to:entry.r.id}]});
 const sendfail=await dialog(base,device+'-send-failed','Couldn’t send a new code','Nothing changed. Keep this review open and try again when connected.',{phone:isPhone,actions:[{label:'Cancel',to:entry.r.id},{label:'Try again',kind:'primary',to:sending.r.id}]});
 const rate=await dialog(base,device+'-rate-limit','Too many code attempts','Approval has not been recorded. Wait 60 seconds before entering another code or requesting a new one.',{phone:isPhone,actions:[{label:'Cancel',to:base},{label:'Try again in 60s',kind:'disabled',width:176}]});
 const already=await dialog(base,device+'-already-answered','This round was already answered','Round 2 was answered in another tab or session. Reload the recorded result before taking another action.',{phone:isPhone,actions:[{label:'Reload result',kind:'primary',to:receipt.r.id}]});
 const failure=await dialog(base,device+'-failed','We couldn’t confirm approval',copy,{phone:isPhone,note:'Your code is kept. No approval was recorded. Try again when connected.',actions:[{label:'Cancel',to:base},{label:'Try again',kind:'primary',to:pendingApproval.r.id}]});
 const offline=await dialog(base,device+'-offline','You’re offline',copy,{phone:isPhone,note:'Approval needs a connection. Your code is kept on this screen; no approval is recorded offline.',actions:[{label:'Cancel',to:base},{label:'Approve Round 2',kind:'disabled',width:176}]});
 link(field,ready.r.id);link(resend,sending.r.id);link(ready.refs['Approve Round 2'],pendingApproval.r.id);link(expired.refs['Send a new code'],sending.r.id);
 link(touch(button(pendingApproval.d,'Check status','secondary',isPhone?343:160)),receipt.r.id);
 link(touch(button(sending.d,'Check status','secondary',isPhone?343:160)),sent.r.id);
 if(isPhone){for(const x of [entry,ready,pendingApproval,incorrect,expired,sending,sent,sendfail,rate,already,failure,offline,receipt]){await Promise.all(pending);x.d.y=Math.max(48,x.r.height-x.d.height);}}
 link(findButton(isPhone?phone:desktop,isPhone?'Approve':'Approve Round 2'),entry.r.id);
 packages.push({device,entry:entry.r.id,ready:ready.r.id,pending:pendingApproval.r.id,receipt:receipt.r.id,approved:approved.id,incorrect:incorrect.r.id,expired:expired.r.id,sending:sending.r.id,sent:sent.r.id,sendfail:sendfail.r.id,rate:rate.r.id,already:already.r.id,failure:failure.r.id,offline:offline.r.id});
}
// Old R10 is a real connected entry rather than an orphaned six-digit dialog.
const old=await figma.getNodeByIdAsync('237:12411');await Promise.all(old.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));clearLinks(old);
for(const b of old.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I'))){if(b.name.startsWith('Cancel'))link(b,desktop.id);if(b.name==='Send a new code')link(b,packages[0].sending);if(b.name.startsWith('Input /'))link(b,packages[0].ready);}externalActions(old);mutations.push(old.id);
// Full-height phone comments, Done returns to the same review.
const comments=await clone(phone.id,'GAP-RV-Phone-comments · Full-height comments sheet');
clearLinks(comments);const sheet=frame(comments,'Comments sheet',375,812);sheet.layoutPositioning='ABSOLUTE';sheet.x=0;sheet.y=0;pad(sheet,16);sheet.itemSpacing=16;
const sh=frame(sheet,'Comments header',343,44,'HORIZONTAL');sh.itemSpacing=8;sh.counterAxisAlignItems='CENTER';text(sh,'Comments (3)',239,'Panel');link(touch(button(sh,'Done','secondary',96)),phone.id);
for(const [title,body]of [['1 · Logo','Make the logo larger'],['2 · Hero','Can the photo be warmer?'],['Resolved · Footer','Use the darker footer · Studio: Done']]){const row=frame(sheet,title,343,null);row.itemSpacing=8;text(row,title,343,'Label');text(row,body,343);}
text(sheet,'Round 1 comments are listed separately; their positions may have moved.',343,'Meta','ink-soft');
link(commentsLabel,comments.id);
// Snapshot fit vs 1:1 placement. Native scrolling models panning; touch pinch is specified, not runtime-tested.
const fit=await clone(phone.id,'GAP-RV-Phone-desktop-fit · Desktop snapshot scaled to fit');
const fs=fit.findOne(n=>n.name==='Snapshot');for(const c of [...fs.children])c.remove();fs.layoutMode='NONE';
const sourceSnap=desktop.findOne(n=>n.name==='Snapshot');const scaled=sourceSnap.clone();fs.appendChild(scaled);scaled.name='Desktop snapshot / scaled to fit';scaled.resize(1440,900);scaled.rescale(351/1440);scaled.x=0;scaled.y=0;
const pan=await clone(fit.id,'GAP-RV-Phone-pan · Desktop 1:1 placement, drag to pan');
const pv=pan.findOne(n=>n.name==='Snapshot');for(const c of [...pv.children])c.remove();pv.layoutMode='NONE';pv.clipsContent=true;pv.overflowDirection='BOTH';
const full=sourceSnap.clone();pv.appendChild(full);full.name='Desktop snapshot / 1:1 scroll content';full.resize(1440,900);full.x=0;full.y=0;
const panFooter=pan.findOne(n=>n.name==='Footer');for(const c of [...panFooter.children])c.remove();text(panFooter,'Drag to pan · tap to place a pin',343,'Label');const pa=frame(panFooter,'Placement actions',343,44,'HORIZONTAL');pa.itemSpacing=8;link(touch(button(pa,'Cancel','secondary',167)),fit.id);link(touch(button(pa,'Fit','secondary',168)),fit.id);
const composer=await dialog(fit.id,'Phone-composer','Comment on Home','Desktop snapshot · pin 3 at the selected position.',{phone:true,actions:[{label:'Cancel',to:fit.id},{label:'Send comment',kind:'primary'}]});
const draft=input(composer.d,'Please make this heading smaller.',343);draft.resize(343,80);composer.d.insertChild(composer.d.children.findIndex(n=>n.name==='Actions'),draft);
const sendingComment=await dialog(fit.id,'Phone-comment-pending','Sending comment…','Your draft is kept until the comment is confirmed.',{phone:true});
const commentFail=await dialog(fit.id,'Phone-comment-failed','Comment wasn’t sent','Please make this heading smaller.',{phone:true,note:'Draft kept on this device. Retry sends this same comment once.',actions:[{label:'Keep editing',to:composer.r.id},{label:'Try again',kind:'primary',to:sendingComment.r.id}]});
const posted=await clone(fit.id,'GAP-RV-Phone-comment-posted · Pin 3 acknowledged');
const postedButton=findButton(posted,'Comments (3)');postedButton.setProperties({'Label#4:18':'Comments (4)'});postedButton.name='Comments (4)';
const postedSheet=await clone(comments.id,'GAP-RV-Phone-comment-thread · Posted comment and return');
const psh=postedSheet.findOne(n=>n.name==='Comments sheet');text(psh,'3 · Lena · Home · Desktop',343,'Label');text(psh,'Please make this heading smaller.',343);for(const t of psh.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Comments (3)')t.characters='Comments (4)';
link(findButton(postedSheet,'Done'),posted.id);link(postedButton,postedSheet.id);
const marker=frame(posted.findOne(n=>n.name==='Snapshot'),'Pin 3',28,28,'HORIZONTAL','accent');marker.x=150;marker.y=100;marker.cornerRadius=14;text(marker,'3',20,'Label','bg-panel');
link(pv,composer.r.id);link(composer.refs['Send comment'],sendingComment.r.id);link(touch(button(sendingComment.d,'Check status','secondary',343)),posted.id);
for(const r of [phone,fit,posted]){
 const b=findButton(r,'Desktop');if(b&&r.id!==fit.id)link(b,fit.id);
 const mobile=findButton(r,'Mobile');if(mobile&&r.id!==phone.id)link(mobile,phone.id);
 const c=findButton(r,'＋ Comment');if(c)link(c,r===phone?composer.r.id:pan.id);
 const cm=findButton(r,'Comments (3)');if(cm&&r!==phone)link(cm,comments.id);
}
// Request changes preserves a posted note if resolving the round subsequently fails.
const changes=[];
for(const [device,base,isPhone]of [['Desktop',desktop.id,false],['Phone',phone.id,true]]){
 const form=await dialog(base,device+'-changes','Request changes to Round 2?','Your note will be posted before this round is marked Changes requested.',{phone:isPhone,actions:[{label:'Cancel',to:base},{label:'Request changes',kind:'primary',width:176}]});
 const inp=input(form.d,'Please update the menu prices.',isPhone?343:472);inp.resize(inp.width,60);form.d.insertChild(form.d.children.findIndex(n=>n.name==='Actions'),inp);
 const posting=await dialog(base,device+'-changes-posting','Posting your note…','Please update the menu prices.\nYour draft is kept until the comment is confirmed.',{phone:isPhone});
 const postedNote=await dialog(base,device+'-changes-resolving','Requesting changes…','Your note was posted: “Please update the menu prices.”\nWaiting to mark Round 2 as Changes requested.',{phone:isPhone});
 const failed=await dialog(base,device+'-changes-failed','Your note was posted; the round is still open','“Please update the menu prices.”\nRetry only updates the round status. It won’t post your note again.',{phone:isPhone,actions:[{label:'Back to review',to:base},{label:'Retry status',kind:'primary',to:postedNote.r.id}]});
 const result=await clone(base,'GAP-RV-'+device+'-changes-recorded · Changes requested acknowledged');
 const foot=result.findOne(n=>n.name==='Footer');for(const c of [...foot.children])c.remove();foot.layoutMode='VERTICAL';text(foot,'Changes requested · Round 2',result.width-48,'Label');text(foot,'Lena · “Please update the menu prices.”',result.width-48,'Body');
 const failedNote=await dialog(base,device+'-note-failed','Your note wasn’t posted','“Please update the menu prices.”\nDraft kept. Round 2 is still open.',{phone:isPhone,actions:[{label:'Keep editing',to:form.r.id},{label:'Try again',kind:'primary',to:posting.r.id}]});
 link(form.refs['Request changes'],posting.r.id);link(touch(button(posting.d,'Check status','secondary',isPhone?343:160)),postedNote.r.id);link(touch(button(postedNote.d,'Check status','secondary',isPhone?343:160)),result.id);
 link(findButton(isPhone?phone:desktop,'Request changes'),form.r.id);
 changes.push({device,entry:form.r.id,posting:posting.r.id,resolving:postedNote.r.id,noteFailed:failedNote.r.id,resolveFailed:failed.r.id,result:result.id});
}
// Reflow every phone sheet after final controls have resolved.
await Promise.all(pending);
for(const r of roots.filter(n=>n.width===375)){const d=r.children.find(n=>n.name==='Modal scrim / background inactive');if(d){const box=r.children[r.children.length-1];box.y=Math.max(48,r.height-box.height);}}
// Review harness, not a customer-facing feature.
const board=frame(null,'GAP-RV · Client review fixture index',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Client review · approval, errors and phone placement',1392,'Area');
text(board,'Design fixtures only: input click fills a sample 6-digit code. Check status selects a known-success response; alternate service outcomes are selectable below. No emails, tokens, comments or approvals are sent. Receipt mail content is a token-free target contract; delivered email and OTP services require implementation. Native scroll models 1:1 panning; pinch/keyboard/focus remain implementation acceptance.',1392);
for(const pkg of packages){text(board,pkg.device+' approval',1392,'Section');for(const k of ['entry','ready','pending','receipt','incorrect','expired','rate','already','failure','offline','sendfail'])link(button(board,k,'secondary',340),pkg[k]);}
for(const [label,n]of [['Phone comments',comments],['Desktop fit on phone',fit],['1:1 pan / place / cancel',pan],['Comment composer',composer.r],['Comment send failed',commentFail.r],['Posted comment',posted]])link(button(board,label,'secondary',340),n.id);
for(const x of changes){for(const k of ['entry','posting','noteFailed','resolveFailed','result'])link(button(board,x.device+' changes · '+k,'secondary',340),x[k]);}
return {...await finish(),packages,changes,phone:{comments:comments.id,fit:fit.id,pan:pan.id,composer:composer.r.id,posted:posted.id,commentFailed:commentFail.r.id}};
