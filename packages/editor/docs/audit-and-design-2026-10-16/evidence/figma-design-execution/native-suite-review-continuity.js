// L3 contains the already authored F5 ledger.
const hub='302:3370',extraCreated=[],removedNodeIds=[];
const S={};for(const d of L3.suite)S[d.key]={...d,root:await figma.getNodeByIdAsync(d.id),p:await figma.getNodeByIdAsync(d.product),row:await figma.getNodeByIdAsync(d.choices)};
function replace(s,a,b){for(const t of s.p.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes(a)){t.characters=t.characters.split(a).join(b);mutations.push(t.id);}}
function removeExpiredUndo(s){for(const n of s.p.findAll(n=>n.name==='Undo resolve')){removedNodeIds.push(n.id);n.remove();}}
function track(n){extraCreated.push(n.id,...n.findAll(()=>true).map(x=>x.id));return n;}
// All roles show the same site and snapshot, with a clearly selected Logo in the editor.
function canvas(s,size){
 const scroll=s.p.findOne(n=>n.name==='Canvas scroll and pan');if(!scroll)return;
 for(const c of [...scroll.children]){removedNodeIds.push(c.id);c.remove();}
 const site=frame(scroll,'Atelier Nord · Home · authored Desktop 1440',752,550);site.x=24;site.y=24;pad(site,24);site.itemSpacing=24;
 const nav=frame(site,'Navigation',704,48,'HORIZONTAL',null);nav.itemSpacing=32;nav.counterAxisAlignItems='CENTER';
 const logo=frame(nav,'Logo · stable home-logo',200,32,'HORIZONTAL',null);logo.strokes=[paint('accent')];logo.strokeWeight=1;logo.counterAxisAlignItems='CENTER';
 const t=text(logo,'atelier nord',196,'Label');t.fontSize=size*(752/1440);
 text(nav,'Work       Studio       Contact',440,'Meta','ink-soft');
 const hero=frame(site,'Hero',704,null);hero.itemSpacing=20;
 const heading=text(hero,'Spaces made with patience.',704,'Area');heading.fontSize=40*(752/1440);
 frame(hero,'Interior image placeholder · sent content',397,157,'VERTICAL','bg-subtle');
 text(hero,'Atelier Nord · Architecture and interiors',704,'Body','ink-soft');
 text(site,'Selected: Home / Navigation / Logo',704,'Meta','accent');
 track(site);
 const tree=s.p.findOne(n=>n.name==='Drawer scroll');
 if(tree){for(const c of [...tree.children]){removedNodeIds.push(c.id);c.remove();}for(const label of ['Navigation','Logo','Hero','Selected work','Footer']){const row=masters[label==='Logo'?'4:493':'4:473'].createInstance();tree.appendChild(row);row.setProperties({'Label#4:70':label});row.resize(260,32);track(row);}}
 replace(s,'Hero / Text','Navigation / Logo');
 const top=s.p.findOne(n=>n.name==='Topbar / site scope');
 if(top)for(const t of top.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Fieldwork Studio'){t.characters='Atelier Nord';mutations.push(t.id);}
}
const editedKeys=new Set(['F5.14','F5.15','F5.16','F5.17','F5.18','F5.34','F5.35','F5.36','F5.37']);
for(const s of Object.values(S))canvas(s,editedKeys.has(s.key)?28:24);
for(const s of Object.values(S)){
 replace(s,'New menu page','Navigation and page layout');
 replace(s,'Home, Work, Menu','Home, Work, Contact');
 replace(s,'20 Oct 2026, 10:30 UTC','20 Oct 2026, 12:30 UTC');
 const snap=s.p.findOne(n=>n.name==='Snapshot');
 if(snap){
  for(const t of snap.findAllWithCriteria({types:['TEXT']})){
   if(t.characters==='atelier nord'){t.fontSize=24;mutations.push(t.id);}
   if(t.characters==='Spaces made with patience.'){t.fontSize=40;mutations.push(t.id);}
  }
  const composer=snap.findOne(n=>n.name==='Composer');if(composer){composer.x=90;composer.y=90;mutations.push(composer.id);}
  for(const t of snap.findAllWithCriteria({types:['TEXT']}))if(t.characters==='＋'){t.x=40;t.y=40;mutations.push(t.id);}
 }
}
for(const key of ['F5.01','F5.02','F5.03','F5.04','F5.05','F5.06']){
 const s=S[key];replace(s,'Lena · Logo · Round 3','Lena · Navigation · Round 2');replace(s,'“Make the logo larger”','“Review the navigation spacing”');replace(s,'Resolved · Designer enlarged Logo to 28px.','Resolved · Navigation spacing updated.');removeExpiredUndo(s);
}
// After editing, Locate returns to the 28px Logo; resolving cannot erase the edit.
namedLink(S['F5.15'],'Locate ›',S['F5.14']);
for(const key of ['F5.17']){const n=S[key].p.findOne(n=>n.name==='Locate ›');if(n)link(n,S['F5.14'].id);}
const waiting=await specimen(S['F5.12'].product,'F5.38','Round 3 sent · awaiting client response');
const body=waiting.p.findOne(n=>n.name==='Task body');
for(const c of [...body.children])c.remove();
text(body,'Round 3 sent to Lena Weiss',336,'Panel');text(body,'lena@atelier.example · 20 Oct 2026',336,'Body');
text(body,'Waiting for feedback',336,'Label');text(body,'No comments on Round 3 yet. Approval is pending.',336,'Body');
text(body,'This frozen version shows the 24px Logo.',336,'Meta','ink-soft');
namedLink(S['F5.06'],'Done',waiting);
fixture(waiting,'Switch role: client opens Round 3',S['F5.07']);
// Pending operations always need an explicit, scoped receipt.
const resolveOriginal=await specimen(S['F5.12'].product,'F5.39','Resolve without editing · pending');
const resolvedOriginal=await specimen(S['F5.12'].product,'F5.40','Resolved without changing Logo');
modal(resolveOriginal.p,'Resolving comment…','Logo remains 24px. Resolving this note does not edit the site or approve the round.',{actions:[]});
const rb=resolvedOriginal.p.findOne(n=>n.name==='Task body');
for(const c of [...rb.children])c.remove();
text(rb,'Round 3 · Open',336,'Panel');text(rb,'0 open · 1 resolved',336,'Label');text(rb,'Lena · Logo · “Make the logo larger”',336,'Body');
text(rb,'Resolved without a design edit. Logo remains 24px.',336,'Body','ink-soft');
text(rb,'Approval remains pending.',336,'Label');
namedLink(S['F5.12'],'Resolve',resolveOriginal);
fixture(resolveOriginal,'Fixture: resolve acknowledged',resolvedOriginal);
fixture(resolveOriginal,'Fixture: resolve rejected',S['F5.12']);
const undo=await specimen(S['F5.18'].product,'F5.41','Undo resolve · pending');
modal(undo.p,'Reopening comment…','The 28px Logo edit remains saved. Approval status is unchanged.',{actions:[]});
namedLink(S['F5.18'],'Undo resolve',undo);
fixture(undo,'Fixture: reopen acknowledged',S['F5.15']);
fixture(undo,'Fixture: reopen rejected',S['F5.18']);
for(const key of ['F5.34','F5.35','F5.36','F5.37'])removeExpiredUndo(S[key]);
replace(S['F5.37'],'0 open · 1 resolved','Round 4 · 0 comments');
replace(S['F5.37'],'Lena · Logo · Round 3','From Round 3 · resolved earlier');
replace(S['F5.37'],'Resolved · Designer enlarged Logo to 28px.','Earlier-round note · may have moved. Current Round 4 has no comments.');
// Explicit degraded-send path retains its no-preview consequence.
const noPreview=await specimen(S['F5.05'].product,'F5.42','Sending without a preview');
replace(noPreview,'The frozen preview is ready. Waiting for the review and invitation outcome.','No preview will be included. Waiting for the review and invitation outcome.');
const noPreviewClient=await specimen(S['F5.07'].product,'F5.43','Client · preview unavailable');
const snap=noPreviewClient.p.findOne(n=>n.name==='Snapshot');
for(const c of [...snap.children])c.remove();
text(snap,'Preview unavailable for this version.',Math.min(800,snap.width-80),'Area');
text(snap,'You can leave a general note. Ask Fieldwork Studio to send a new preview before approving the design.',Math.min(800,snap.width-80),'Body');
const failDialog=S['F5.04'].p.findOne(n=>n.name==='We couldn’t render a preview');
const actions=failDialog.findOne(n=>n.name==='Actions');
const degraded=button(actions,'Send without preview','secondary',168);link(degraded,noPreview.id);track(degraded);
fixture(noPreview,'Fixture: no-preview round acknowledged',noPreviewClient);
fixture(noPreview,'Fixture: send rejected',S['F5.04']);
// Model a page-level note when no snapshot position exists.
const generalNote=await specimen(S['F5.08'].product,'F5.44','General note · no preview');
const gn=generalNote.p.findOne(n=>n.name==='Snapshot');
for(const c of [...gn.children])c.remove();
text(gn,'Preview unavailable for this version.',Math.min(800,gn.width-80),'Area');
const note=modal(generalNote.p,'General note on Home','This note has no pin because the preview is unavailable.',{width:560,actions:[{label:'Cancel',to:noPreviewClient.id},{label:'Send note',kind:'primary',to:S['F5.09'].id}]});
const inputRow=input(note.d,'Please send a preview so I can review the design.',512);
const act=note.d.findOne(n=>n.name==='Actions');note.d.appendChild(act);
const add=noPreviewClient.p.findOne(n=>n.name==='＋ Add comment  C');if(add){add.setProperties({'Label#4:18':'＋ General note'});link(add,generalNote.id);}
// Save note as its own context; do not route into the pinned-comment result.
const notePending=await specimen(noPreviewClient.product,'F5.45','Sending general note');
modal(notePending.p,'Sending note…','Your Home page note is kept until confirmation. No pin is attached.',{actions:[]});
const noteAck=await specimen(noPreviewClient.product,'F5.46','General note acknowledged');
const comments=noteAck.p.findOne(n=>n.name==='Comments');for(const c of [...comments.children])c.remove();
text(comments,'Comments (1)',328,'Panel');text(comments,'Home · Page-level note · Open',328,'Label');text(comments,'Please send a preview so I can review the design.',328,'Body');
namedLink(generalNote,'Send note',notePending);
fixture(notePending,'Fixture: note acknowledged',noteAck);fixture(notePending,'Fixture: send failed · draft kept',generalNote);
const result=await suiteFinish(hub);
figma.io.write('native-suite-review-continuity-full.json',JSON.stringify({result,extraCreated,removedNodeIds,mutatedNodeIds:mutations}));
return {...result,extraCreatedCount:extraCreated.length,removedNodeIds,allAffectedNodeIds:'native-suite-review-continuity-full.json'};
