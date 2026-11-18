
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const page=figma.currentPage, created=[], mutated=[], states={}, controls={};
const get=id=>figma.getNodeByIdAsync(id), mark=n=>{mutated.push(n.id);return n;};
for(const style of ['Regular','Medium','Semi Bold','Bold'])await figma.loadFontAsync({family:'Inter',style});
const styles=await figma.getLocalTextStylesAsync(), variables=await figma.variables.getLocalVariablesAsync();
const token=id=>variables.find(v=>v.id==='VariableID:8322:'+id);
const paint=id=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',token(id))];
const bind=(n,p,id)=>n.setBoundVariable(p,token(id));
function auto(name,dir='VERTICAL'){const n=figma.createAutoLayout(dir);created.push(n.id);n.name=name;n.fills=[];bind(n,'itemSpacing',814);return n;}
async function textNode(parent,value,width=480,style='ui/13 · row label',color=778){const n=figma.createText();created.push(n.id);n.fontName={family:'Inter',style:'Regular'};await n.setTextStyleIdAsync(styles.find(s=>s.name===style).id);n.characters=value;n.fills=paint(color);parent.appendChild(n);n.resize(width,20);n.textAutoResize='HEIGHT';return n;}
async function button(parent,label,kind='secondary',width=480){const main={primary:'8314:3',secondary:'8314:5',ghost:'8314:7',danger:'8314:9',disabled:'8314:11'}[kind];const n=(await get(main)).createInstance();created.push(n.id);n.name='Action / '+label;parent.appendChild(n);n.resize(width,32);for(const t of n.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters=label;created.push(t.id);}return n;}
async function field(parent,label,value,width=480){await textNode(parent,label,width,'ui/12 · small',780);const n=(await get('8531:318')).createInstance();created.push(n.id);n.name='Field / '+label;parent.appendChild(n);n.resize(width,34);for(const t of n.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters=value;created.push(t.id);}return n;}
const val=(value,type=typeof value==='boolean'?'BOOLEAN':'STRING')=>({type,resolvedType:type,value});
const set=(id,value,type)=>({type:'SET_VARIABLE',variableId:id,variableValue:val(value,type)});
const copy=(dest,src,type='STRING')=>({type:'SET_VARIABLE',variableId:dest,variableValue:{type:'VARIABLE_ALIAS',resolvedType:type,value:{type:'VARIABLE_ALIAS',id:src}}});
const nav=(id,navigation='SWAP')=>({type:'NODE',destinationId:id,navigation,transition:null,resetVideoPosition:false});
const eq=(id,value)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[{type:'VARIABLE_ALIAS',resolvedType:typeof value==='boolean'?'BOOLEAN':'STRING',value:{type:'VARIABLE_ALIAS',id}},val(value)]}});
const cond=(id,value,yes,no=[])=>({type:'CONDITIONAL',conditionalBlocks:[{condition:eq(id,value),actions:yes},{actions:no}]});
async function click(n,actions){mark(n);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);}
async function close(n){await click(n,[{type:'CLOSE'}]);}
async function timeout(n,actions){mark(n);await n.setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:0.8},actions}]);}
async function bindText(n,id){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.setBoundVariable('characters',await figma.variables.getVariableByIdAsync(id));mark(t);}}
let cursor=0;
function position(n){n.x=78000+(cursor%7)*1600;n.y=120+Math.floor(cursor/7)*1200;cursor++;}
async function dialog(key,title,desc,width=560){const n=auto('R30 / '+key);page.appendChild(n);position(n);n.resize(width,300);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(789);bind(n,'cornerRadius',825);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,816);await textNode(n,title,width-48,'ui/20 · heading lg');if(desc)await textNode(n,desc,width-48,'ui/13 · row label',780);states[key]=n;return n;}
async function side(key,title,desc){const root=figma.createFrame();created.push(root.id);root.name='R30 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=[];const p=auto('Task panel / '+title);root.appendChild(p);p.resize(352,920);p.primaryAxisSizingMode='FIXED';p.counterAxisSizingMode='FIXED';p.x=1088;p.y=56;p.fills=paint(789);p.strokes=paint(784);for(const q of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(p,q,814);const h=auto('Panel header','HORIZONTAL');p.appendChild(h);h.resize(318,32);h.counterAxisAlignItems='CENTER';const t=await textNode(h,title,230,'ui/14 · panel title');t.layoutSizingHorizontal='FILL';const b=await button(h,'Close','ghost',64);await close(b);if(desc)await textNode(p,desc,318,'ui/12 · small',780);states[key]=root;return {root,body:p};}
async function notice(parent,title,desc,width=318,tone=794){const n=auto(title);parent.appendChild(n);n.resize(width,80);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(tone);bind(n,'cornerRadius',824);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,813);bind(n,'itemSpacing',812);await textNode(n,title,width-24,'ui/13 · row label medium');await textNode(n,desc,width-24,'ui/12 · small',780);return n;}
async function proto(parent,w=318){await textNode(parent,'Prototype scenario · sample data · no service writes',w,'ui/11 · caption',780);}

cursor=40;
const pairs=[], previews={"blank":"8668:12955","template":"8668:13053","about":"8668:13154"};
for(const [kind,id] of Object.entries({"blank":"8663:12975","template":"8663:13173","about":"8663:13368"})){
 const desktop=await get(id);for(const t of desktop.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
 const mobile=desktop.clone();created.push(mobile.id,...mobile.findAll(()=>true).map(n=>n.id));page.appendChild(mobile);mobile.name='R30 / Editor Mobile / '+kind;position(mobile);
 const canvas=mobile.findOne(n=>n.name==='Page canvas / '+kind);canvas.resize(375,692);for(const t of canvas.findAllWithCriteria({types:['TEXT']})){t.resize(311,t.height);t.textAutoResize='HEIGHT';}
 for(const t of mobile.findAllWithCriteria({types:['TEXT']})){if(t.characters==='61% · 1200px · Desktop · Base')t.characters='100% · 375px · Mobile · Base';if(t.characters.includes('/ Desktop · Base · Page canvas'))t.characters=t.characters.replace('Desktop','Mobile');}
 const dt=desktop.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.name==='Action / Mobile');await click(dt,[nav(mobile.id,'NAVIGATE')]);
 const m=mobile.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.name==='Action / Mobile');m.swapComponent(await get('8314:5'));m.name='Action / Mobile';for(const t of m.findAllWithCriteria({types:['TEXT']}))t.characters='Mobile';await m.setReactionsAsync([]);
 const d=mobile.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.name==='Action / Desktop');d.swapComponent(await get('8314:7'));d.name='Action / Desktop';for(const t of d.findAllWithCriteria({types:['TEXT']}))t.characters='Desktop';await click(d,[nav(desktop.id,'NAVIGATE')]);
 const preview=(await get(previews[kind])).clone();created.push(preview.id,...preview.findAll(()=>true).map(n=>n.id));page.appendChild(preview);position(preview);preview.name='R30 / Preview Mobile / '+kind;
 const stage=preview.findOne(n=>n.name==='Canvas stage');const web=stage.children.find(n=>n.visible);web.resize(375,1100);web.x=(1440-375)/2;for(const t of web.findAllWithCriteria({types:['TEXT']})){t.resize(311,t.height);t.textAutoResize='HEIGHT';}
 for(const t of preview.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Desktop page preview')t.characters='Mobile page preview · 375px';
 const p=mobile.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.name==='Action / Preview');await click(p,[nav(preview.id,'OVERLAY')]);
 const build=mobile.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.name==='Workspace navigation');if(build){const b=build.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.findAllWithCriteria({types:['TEXT']}).some(t=>t.characters==='Build'));if(b)await click(b,[set('VariableID:8627:652',mobile.id),nav('8628:12592','NAVIGATE')]);}
 pairs.push({kind,desktop:desktop.id,mobile:mobile.id,preview:preview.id});
}
for(const id of ['I8628:12611;8627:627','I8628:12693;8627:627','I8628:12768;8627:627','I8628:12845;8627:627','I8628:12934;8627:627','I8628:13011;8627:627']){const n=await get(id);await click(n,[...n.reactions[0].actions,...pairs.map(p=>cond('VariableID:8627:652',p.mobile,[nav(p.mobile,'NAVIGATE')]))]);}
const qa=await get('8673:12958');const responsive=await button(qa,'Responsive: reset inherits Desktop 96px','secondary',632);await click(responsive,[set('VariableID:8574:11687','96'),nav('8465:7','NAVIGATE')]);
return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),pairs,responsive:responsive.id,nextCursor:cursor};

