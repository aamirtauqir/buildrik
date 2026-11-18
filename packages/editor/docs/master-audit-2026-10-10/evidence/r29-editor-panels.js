
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const created=[],mutated=[];const touch=n=>{mutated.push(n.id);return n;};
const get=async id=>await figma.getNodeByIdAsync(id);
for(const id of ['8539:9190','8539:9433','8539:9579','8539:9339','8465:6','8584:12241']){const n=await get(id);const fonts=new Map();for(const t of n.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);for(const f of fonts.values())await figma.loadFontAsync(f);}
await figma.loadFontAsync({family:'Inter',style:'Medium'});
const vars=await figma.variables.getLocalVariablesAsync();const token=id=>vars.find(v=>v.id==='VariableID:8322:'+id);
const paint=id=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',token(id))];
const gap=(n,p,id)=>n.setBoundVariable(p,token(id));
const styles=await figma.getLocalTextStylesAsync();
const mk=(name,dir='VERTICAL')=>{const n=figma.createAutoLayout(dir);n.name=name;n.fills=[];created.push(n.id);return n;};
const txt=async(s,w,style='ui/12 · small',color=780)=>{const t=figma.createText();created.push(t.id);t.fontName={family:'Inter',style:'Regular'};t.characters=s;await t.setTextStyleIdAsync(styles.find(x=>x.name===style).id);t.fills=paint(color);t.resize(w,18);t.textAutoResize='HEIGHT';return t;};
const action=(dest,nav='SWAP')=>({trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:dest,navigation:nav,transition:null,resetVideoPosition:false}]});
const close=async(n)=>{await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'CLOSE'}]}]);touch(n);};
const button=async(label,w)=>{const n=(await get('8314:7')).createInstance();created.push(n.id);n.resize(w,30);for(const t of n.findAllWithCriteria({types:['TEXT']})){t.characters=label;created.push(t.id);}return n;};
const records=[];
for(const spec of [
{root:'8539:9190',panel:'8539:9304',title:'8539:9305',subtitle:'8539:9309',body:'8539:9311',side:'right',name:'History'},
{root:'8539:9433',panel:'8539:9547',title:'8539:9548',subtitle:'8539:9552',body:'8539:9554',side:'right',name:'Publish'},
{root:'8539:9579',panel:'8539:9624',title:'8539:9625',side:'left',name:'Pages'}
]){
 const root=touch(await get(spec.root));root.name='R29 / Editor overlay / '+spec.name;root.fills=[];root.clipsContent=true;
 const panel=touch(await get(spec.panel));
 for(const c of root.children){if(c.id!==panel.id){touch(c).visible=false;}}
 const original=[...panel.children];for(const c of original)touch(c).visible=false;
 panel.layoutMode='VERTICAL';panel.resize(352,920);panel.primaryAxisSizingMode='FIXED';panel.counterAxisSizingMode='FIXED';panel.x=spec.side==='right'?1088:0;panel.y=56;panel.fills=paint(789);panel.strokes=paint(784);panel.strokeWeight=1;gap(panel,'itemSpacing',814);gap(panel,'paddingTop',814);gap(panel,'paddingBottom',814);gap(panel,'paddingLeft',814);gap(panel,'paddingRight',814);
 const head=mk('Panel header / '+spec.name,'HORIZONTAL');panel.appendChild(head);head.resize(320,30);head.layoutSizingHorizontal='FILL';head.counterAxisAlignItems='CENTER';gap(head,'itemSpacing',812);
 const title=touch(await get(spec.title));title.visible=true;head.appendChild(title);title.resize(248,22);title.textAutoResize='HEIGHT';title.layoutSizingHorizontal='FILL';await title.setTextStyleIdAsync(styles.find(x=>x.name==='ui/14 · panel title').id);
 const back=await button('Close',64);head.appendChild(back);await close(back);
 if(spec.subtitle){const sub=touch(await get(spec.subtitle));sub.visible=true;panel.appendChild(sub);sub.characters=spec.name==='Publish'?'Studio North · Current draft':'Studio North · Saved versions';sub.resize(320,18);sub.textAutoResize='HEIGHT';sub.layoutSizingHorizontal='FILL';}
 if(spec.body){
 const body=touch(await get(spec.body));body.visible=true;panel.appendChild(body);body.layoutMode='VERTICAL';body.resize(320,700);body.primaryAxisSizingMode='AUTO';body.counterAxisSizingMode='FIXED';body.layoutSizingHorizontal='FILL';body.fills=[];gap(body,'itemSpacing',814);
 if(spec.name==='History'){const tabs=mk('History sections','HORIZONTAL');body.insertChild(0,tabs);tabs.resize(320,30);tabs.layoutSizingHorizontal='FILL';gap(tabs,'itemSpacing',812);for(const [id,dest] of [['8539:9312','8539:11805'],['8539:9314',null],['8539:9316','8539:11837']]){const old=touch(await get(id));old.visible=false;const label=old.findAllWithCriteria({types:['TEXT']})[0].characters;const b=await button(label,label==='Published'?108:96);tabs.appendChild(b);if(dest)await b.setReactionsAsync([action(dest)]);else b.fills=paint(794);}}
 for(const c of body.children){if(!c.visible||c.name==='History sections')continue;touch(c);c.resize(320,c.height);c.layoutSizingHorizontal='FILL';if(c.type==='TEXT'){c.textAutoResize='HEIGHT';}
 if(c.type==='FRAME'&&c.children.every(t=>t.type==='TEXT')){c.layoutMode='VERTICAL';c.primaryAxisSizingMode='AUTO';gap(c,'paddingTop',813);gap(c,'paddingBottom',813);gap(c,'paddingLeft',813);gap(c,'paddingRight',813);gap(c,'itemSpacing',812);for(const t of c.children){touch(t);t.resize(296,t.height);t.textAutoResize='HEIGHT';t.layoutSizingHorizontal='FILL';}}
 }
 }else{
 const body=mk('Pages / navigation and settings');panel.appendChild(body);body.resize(320,750);body.layoutSizingHorizontal='FILL';body.layoutSizingVertical='FILL';gap(body,'itemSpacing',814);
 for(const id of ['8539:9629','8539:9633','8539:9638','8539:9642','8539:9646','8539:9647','8539:9651','8539:9655','8539:9656']){const c=touch(await get(id));c.visible=true;body.appendChild(c);c.resize(320,c.height);c.layoutSizingHorizontal='FILL';if(c.type==='TEXT')c.textAutoResize='HEIGHT';}
 const add=touch(await get('8539:9657'));add.visible=true;panel.appendChild(add);add.resize(320,30);add.layoutSizingHorizontal='FILL';
 }
 records.push({root:root.id,panel:panel.id,close:back.id});
}
const hist=touch(await get('8539:9325'));hist.findAllWithCriteria({types:['TEXT']})[0].characters='Version details & compare';mutated.push(...hist.findAllWithCriteria({types:['TEXT']}).map(t=>t.id));
const review=touch(await get('8539:9326'));review.findAllWithCriteria({types:['TEXT']})[0].characters='Open Review';mutated.push(...review.findAllWithCriteria({types:['TEXT']}).map(t=>t.id));await review.setReactionsAsync([action('8581:11815')]);
const dest=touch(await get('8539:9560'));dest.resize(320,30);await dest.setReactionsAsync([action('8539:12318')]);
for(const id of ['I8468:633;8314:4','I8584:12322;8314:4']){const n=touch(await get(id));n.characters='Set all sides to 32px';}
const root=touch(await get('8539:9339'));root.name='R29 / Editor / Desktop visual preview';
const stage=touch(await get('8539:9394'));for(const c of root.children)if(c.id!==stage.id)touch(c).visible=false;
const head=mk('Preview header','HORIZONTAL');root.appendChild(head);head.resize(1440,56);head.x=0;head.y=0;head.primaryAxisSizingMode='FIXED';head.counterAxisSizingMode='FIXED';head.counterAxisAlignItems='CENTER';head.fills=paint(789);gap(head,'paddingLeft',814);gap(head,'paddingRight',814);gap(head,'itemSpacing',814);
const back=await button('Back to editor',132);head.appendChild(back);await close(back);
const title=await txt('Studio North / Home',300,'ui/13 · row label medium',778);head.appendChild(title);title.layoutSizingHorizontal='FILL';
head.appendChild(await txt('Desktop preview · 1200px',210));
stage.x=0;stage.y=56;stage.resize(1440,896);stage.clipsContent=true;stage.overflowDirection='VERTICAL';stage.fills=paint(788);const web=touch(await get('8539:9395'));web.x=120;web.y=24;
const foot=mk('Preview capability notice','HORIZONTAL');root.appendChild(foot);foot.x=0;foot.y=952;foot.resize(1440,48);foot.primaryAxisSizingMode='FIXED';foot.counterAxisSizingMode='FIXED';foot.counterAxisAlignItems='CENTER';gap(foot,'paddingLeft',814);foot.fills=paint(789);foot.appendChild(await txt('Visual preview · Scripts and form delivery are not tested here.',1200));
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],panels:records,previewBack:back.id};

