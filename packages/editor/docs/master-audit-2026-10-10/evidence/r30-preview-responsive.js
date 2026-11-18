
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

cursor=37;
const font=await figma.variables.getVariableByIdAsync('VariableID:8574:11687');
for(const id of ['I8468:244399;8531:512;8531:321','I8468:245463;8531:512;8531:321'])await bindText(await get(id),font.id);
const hint=mark(await get('8468:245460'));for(const s of hint.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);hint.characters='Only the Mobile/Base font-size override was removed. The current Desktop rule now supplies this value.';hint.textAutoResize='HEIGHT';
const previews={};
for(const [mode,editorId] of Object.entries({"blank":"8663:12975","template":"8663:13173","about":"8663:13368"})){
 const editor=await get(editorId), preview=(await get('8539:9339')).clone();created.push(preview.id,...preview.findAll(()=>true).map(n=>n.id));page.appendChild(preview);position(preview);preview.name='R30 / Preview / '+mode;states['Preview '+mode]=preview;
 for(const t of preview.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);if(t.characters==='Studio North / Home')t.characters='Studio North / '+(mode==='about'?'About':'Contact');if(t.characters==='Desktop preview · 1200px')t.characters='Desktop page preview';}
 const stage=preview.findOne(n=>n.name==='Canvas stage');for(const c of stage.children)c.visible=false;
 let canvas;if(mode==='blank'){canvas=auto('Empty page preview');canvas.fills=paint(789);stage.appendChild(canvas);canvas.resize(1200,1100);canvas.primaryAxisSizingMode='FIXED';canvas.counterAxisSizingMode='FIXED';}
 else{canvas=editor.findOne(n=>n.name==='Page canvas / '+mode).clone();created.push(canvas.id,...canvas.findAll(()=>true).map(n=>n.id));stage.appendChild(canvas);canvas.resize(1200,1100);}
 canvas.x=120;canvas.y=24;
 const trigger=editor.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.name==='Action / Preview');await click(trigger,[nav(preview.id,'OVERLAY')]);
 for(const t of editor.findAllWithCriteria({types:['TEXT']})){if(t.characters==='HOME / ELEMENTS')t.characters=(mode==='about'?'ABOUT':'CONTACT')+' / ELEMENTS';if(t.characters.includes('3 pages · Draft site')&&mode!=='about')t.characters='Studio North\n4 pages · Draft site';}mutated.push(editor.id,...editor.findAllWithCriteria({types:['TEXT']}).map(n=>n.id));previews[mode]=preview.id;
}
const published=await get('8539:11837');const exists=await figma.variables.getVariableByIdAsync('VariableID:8662:12974');const card=auto('Published release / sample');published.appendChild(card);card.x=264;card.y=460;card.resize(900,130);card.primaryAxisSizingMode='AUTO';card.counterAxisSizingMode='FIXED';card.fills=paint(799);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(card,p,814);card.setBoundVariable('visible',exists);await textNode(card,'Release 1 · Production · 3 live pages',868,'ui/14 · panel title');await textNode(card,'Authored successful deployment scenario. No external release was made.',868,'ui/12 · small',780);
for(const t of published.findAllWithCriteria({types:['TEXT']})){if(t.characters==='No published versions yet'){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters='Published release history';mark(t);}if(t.characters.startsWith('Publish the site to create')){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters='Completed production releases appear below. This prototype contains an authored success scenario.';mark(t);}}
return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),previews,nextCursor:cursor};

