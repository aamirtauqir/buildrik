// Figma authoring record; placeholders are supplied from editor-style-rollout-ledger.json.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const baseline=BASELINE;const changed=[],links=[],styles=[];
const vs=await figma.variables.getLocalVariablesAsync(),V=Object.fromEntries(vs.map(v=>[v.name,v]));
function rgb(v){const x=Object.values(v.valuesByMode)[0];return x?.type==='VARIABLE_ALIAS'?rgb(vs.find(y=>y.id===x.id)):x;}
function paint(k){const v=V['color/'+k],c=rgb(v);return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:c.r,g:c.g,b:c.b}},'color',v);}
function authored(n){let a=n;while(a&&a.type!=='PAGE'){if(a.name.startsWith('Authored viewport'))return true;a=a.parent;}return false;}
async function fonts(n){for(const t of n.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);}
const nav=new Set(['Open page','Manage in CMS','Site SEO defaults','SEO score details','Change in SEO','Recently deleted','Back to Pages','Open About in Editor','Back to SEO','Back to Our story SEO','Back to editor','Back to Inspector','SEO & social','Edit main component','Add colors in Brand','← Back to Brand colors']);
for(const n of figma.currentPage.findAllWithCriteria({types:['INSTANCE']})){
 if(authored(n))continue;
 const master=await n.getMainComponentAsync();const family=master?.parent?.type==='COMPONENT_SET'?master.parent.name:master?.name;
 if(!['Button','IconButton','Search'].includes(family))continue;
 await fonts(n);
 const props=n.componentProperties,state=props.State?.value,label=props['Label#4:18']?.value,w=n.width,h=n.height;
 n.setBoundVariable('cornerRadius',V['radius/sm']);changed.push(n.id);
 if(family==='Button'){
  let style=props.Style.value;
  if(nav.has(label)){n.setProperties({Style:'Link'});n.resize(w,h);style='Link';links.push({id:n.id,label});}
  const protectedSelection=n.fills.some(p=>['VariableID:3:39','VariableID:3:41'].includes(p.boundVariables?.color?.id))||n.parent.name.includes('segmented')||n.parent.name==='Page views';
  if(style==='Link'){
   n.fills=state==='Hover'?[paint('bg-subtle')]:state==='Pressed'?[paint('border')]:[];
   n.strokes=state==='Focus'?[paint('accent')]:[];
   for(const t of n.findAllWithCriteria({types:['TEXT']})){t.fills=[paint(state==='Disabled'?'ink-disabled':state==='Hover'?'accent-hover':state==='Pressed'?'accent-pressed':'accent')];changed.push(t.id);}
  }else if(style==='Secondary'&&!protectedSelection){n.strokes=[paint(state==='Focus'?'accent':state==='Hover'?'border-medium':'border')];}
  else if(style==='Ghost'&&!protectedSelection&&state==='Default'){n.fills=[];}
  styles.push({id:n.id,style});
 }else if(family==='IconButton'&&['Default','Disabled','Focus'].includes(state)){
  const active=n.fills.some(p=>['VariableID:3:39','VariableID:3:41'].includes(p.boundVariables?.color?.id));
  if(!active)n.fills=[];
 }
}
let repaired=0;
for(const n of figma.currentPage.findAllWithCriteria({types:['FRAME','INSTANCE','TEXT','RECTANGLE','VECTOR']})){
 if(authored(n))continue;
 for(const key of ['fills','strokes']){if(!(key in n)||!Array.isArray(n[key]))continue;let dirty=false;
 const paints=n[key].map(p=>{const id=p.boundVariables?.color?.id;if(p.type!=='SOLID'||!id)return p;const v=vs.find(v=>v.id===id);if(!v)return p;const c=rgb(v);if(!c||typeof c.r!=='number'||Math.abs(p.color.r-c.r)+Math.abs(p.color.g-c.g)+Math.abs(p.color.b-c.b)<.0001)return p;dirty=true;return {...p,color:{r:c.r,g:c.g,b:c.b}};});
 if(dirty){if(n.type==='TEXT')for(const s of n.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);n[key]=paints;changed.push(n.id);repaired++;}
 }
}
for(const [id,i] of baseline.snapshots){const n=await figma.getNodeByIdAsync(id);await fonts(n);const data=JSON.parse(baseline.styles[i]);for(const [k,v]of Object.entries(data)){if(k==='cornerRadius')n.setBoundVariable('cornerRadius',null);n[k]=v;}changed.push(n.id);}
return {page:PAGE,createdNodeIds:[],mutatedNodeIds:[...new Set(changed)],links,buttonCount:styles.length,paintFallbacksRepaired:repaired,authoredButtonsRestored:baseline.snapshots.length};
