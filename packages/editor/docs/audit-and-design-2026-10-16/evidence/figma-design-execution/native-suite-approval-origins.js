// Preserve approval context for early approval and degraded no-preview rounds.
const hub='302:3370';
const main=Object.fromEntries(L3.suite.map(s=>[s.key,s]));
const cases=[
 {key:'F5-EARLY',origin:'307:17295',product:'307:17303',title:'Before any comment',count:0,noPreview:false},
 {key:'F5-OPEN',origin:'307:17572',product:'307:17580',title:'Open comment · no edit yet',count:1,noPreview:false},
 {key:'F5-NOPREVIEW',origin:'310:23367',product:'310:23375',title:'No preview · no comments',count:0,noPreview:true},
 {key:'F5-NOTE',origin:'310:23531',product:'310:23539',title:'No preview · general note',count:1,noPreview:true}
];
const forks=[];
for(const context of cases){
 const start=linksToMap.length,items={};
 for(let n=20;n<=33;n++){
  const src=main['F5.'+n];
  items[n]=await specimen(src.product,context.key+'.'+n,context.title+' · '+src.key);
 }
 const map=Object.fromEntries(Object.entries(items).map(([n,s])=>[main['F5.'+n].id,s.id]));
 map['307:21191']=context.origin;
 for(const item of linksToMap.slice(start)){
  const rs=item.reactions.map(r=>({...r,actions:(r.actions||[]).filter(a=>a.type==='NODE'&&map[a.destinationId]).map(a=>({...a,destinationId:map[a.destinationId]}))})).filter(r=>r.actions.length);
  if(rs.length){item.node.reactions=rs;linkedIds.add(item.node.id);mutations.push(item.node.id);}
 }
 for(const s of Object.values(items)){
  const snap=s.p.findOne(n=>n.name==='Snapshot'),comments=s.p.findOne(n=>n.name==='Comments');
  if(comments){
   for(const c of [...comments.children])c.remove();
   text(comments,'Comments ('+context.count+')',328,'Panel');
   if(context.count){
    text(comments,context.noPreview?'Home · Page-level note · Open':'Home · Logo · Round 3 · Open',328,'Label');
    text(comments,context.noPreview?'Please send a preview so I can review the design.':'Make the logo larger',328,'Body');
   }
   text(comments,'From Round 2 (3) ▸ · may have moved',328,'Meta','ink-soft');
  }
  if(snap){
   if(context.noPreview){for(const c of [...snap.children])c.remove();text(snap,'Preview unavailable for this version.',Math.min(snap.width-80,800),'Area');text(snap,'This round was sent without a visual preview.',Math.min(snap.width-80,800),'Body');}
   else for(const n of [...snap.children])if(n.name.startsWith('Pin ')){if(context.count===0)n.remove();else{for(const t of n.findAllWithCriteria({types:['TEXT']}))t.characters='1';n.fills=[paint('accent')];}}
  }
  if(context.noPreview&&[items[20],items[21]].includes(s)){
   const heading=s.p.findOne(n=>n.type==='TEXT'&&n.characters==='Approve Round 3?');
   if(heading){const dialog=heading.parent;const action=dialog.findOne(n=>n.name==='Actions');const warning=text(dialog,'No preview was available for this round. Continuing records approval without viewing the design. Cancel to ask Fieldwork Studio for a new preview.',dialog.width-48,'Body','warning-text');if(action)dialog.insertChild(dialog.children.indexOf(action),warning);}
  }
 }
 for(const [label,dest]of [['Fixture: approval acknowledged',23],['Fixture: incorrect code',25],['Fixture: expired code',26],['Fixture: approval failed',32]])fixture(items[22],label,items[dest]);
 for(const [label,dest]of [['Fixture: code sent',28],['Fixture: email failed',29],['Fixture: rate limited',30]])fixture(items[27],label,items[dest]);
 fixture(items[20],'Fixture: offline',items[33]);
 fixture(items[21],'Fixture: answered in another tab',items[31]);
 const origin={p:await figma.getNodeByIdAsync(context.product),key:context.key};
 namedLink(origin,'Approve Round 3',items[20]);
 const outcome=await specimen('310:21948',context.key+'.34','Designer · same snapshot approved');
 const body=outcome.p.findOne(n=>n.name==='Task body');for(const c of [...body.children])c.remove();
 text(body,'Lena approved Round 3',336,'Panel');
 text(body,'Atelier Nord · 20 Oct 2026, 12:30 UTC',336,'Meta','ink-soft');
 text(body,context.noPreview?'Approved without a visual preview':'Approval covers the sent 24px Logo snapshot',336,'Label');
 text(body,'No page or CMS edit occurred after this snapshot in this branch. Approval is current.',336,'Body');
 text(body,context.count?'1 open comment · approval does not resolve it':'No current-round comments',336,'Body');
 fixture(items[24],'Switch role: designer sees current approval',outcome);
 fixture(outcome,'Return to approved client review',items[24]);
 forks.push({context:context.key,origin:context.origin,entry:items[20].id,approved:items[24].id,designer:outcome.id});
}
const result=await suiteFinish(hub);
return {...result,forks};
