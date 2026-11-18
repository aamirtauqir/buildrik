const REG={"button-primary":"8314:3","button-secondary":"8314:5","button-ghost":"8314:7","button-danger":"8314:9","button-disabled":"8314:11","property-default":"8316:11","property-inherited":"8316:16","property-mixed":"8316:21","property-disabled":"8316:26"};
// Native Figma design helper only. No application implementation.
const T={ink:'#172033',muted:'#667085',subtle:'#98A2B3',line:'#E4E8EF',control:'#8591A3',bg:'#F4F6F9',panel:'#FFFFFF',blue:'#1A56DB',soft:'#EFF6FF',green:'#087A55',greenSoft:'#ECFDF3',red:'#B42318',redSoft:'#FEF3F2',amber:'#925C00',amberSoft:'#FFFAEB',purple:'#6941C6'};
const M={};let PAGE;
function rgb(h){h=h.replace('#','');return{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255};}
function fill(h){return[{type:'SOLID',color:rgb(h)}];}
async function init(){for(const style of ['Regular','Medium','Semi Bold','Bold'])await figma.loadFontAsync({family:'Inter',style});PAGE=await figma.getNodeByIdAsync('8312:2');await figma.setCurrentPageAsync(PAGE);if(typeof REG!=='undefined')for(const [key,id]of Object.entries(REG))M[key]=await figma.getNodeByIdAsync(id);}
function box(p,name,x,y,w,h,color=T.panel,border=null,r=0){const f=figma.createFrame();p.appendChild(f);f.name=name;f.x=x;f.y=y;f.resize(w,h);f.fills=color?fill(color):[];f.cornerRadius=r;if(border){f.strokes=fill(border);f.strokeWeight=1;}return f;}
function text(p,s,x,y,w=240,size=12,color=T.ink,weight='Regular'){const n=figma.createText();p.appendChild(n);n.name=s.slice(0,80);n.fontName={family:'Inter',style:weight};n.fontSize=size;n.lineHeight={unit:'PERCENT',value:145};n.characters=s;n.resize(w,20);n.textAutoResize='HEIGHT';n.x=x;n.y=y;n.fills=fill(color);return n;}
function rule(p,x,y,w,color=T.line){const n=figma.createRectangle();p.appendChild(n);n.name='Divider';n.x=x;n.y=y;n.resize(w,1);n.fills=fill(color);return n;}
const PATHS={add:'M12 5v14M5 12h14',layers:'m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',pages:'M6 3h8l4 4v14H6V3Zm8 0v5h4',media:'M3 4h18v16H3V4Zm0 12 5-5 4 4 3-3 6 6M8 8h.01',cms:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',brand:'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4c-1-1 0-2 1-2h2a4 4 0 0 0 3-4 9 9 0 0 0-9-8ZM7 9h.01M11 6h.01M16 8h.01M7 14h.01',search:'m20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',chevron:'m8 10 4 4 4-4',close:'m6 6 12 12M6 18 18 6',arrow:'M19 12H5m6-6-6 6 6 6',undo:'M8 5 3 10l5 5M3 10h11a6 6 0 0 1 6 6',redo:'m16 5 5 5-5 5M21 10H10a6 6 0 0 0-6 6',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',check:'m5 12 4 4L19 6',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Z',more:'M5 12h.01M12 12h.01M19 12h.01',desktop:'M3 3h18v13H3V3Zm9 13v5M8 21h8',mobile:'M7 2h10v20H7V2Zm4 17h2',component:'m12 2 10 10-10 10L2 12 12 2Z',type:'M4 5h16M12 5v15M8 20h8',grid:'M3 3h18v18H3V3Zm0 6h18M3 15h18M9 3v18M15 3v18',link:'m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1',settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',history:'M3 12a9 9 0 1 0 3-7M3 3v6h6m3-3v6l4 2',help:'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',warning:'M12 3 1 21h22L12 3Zm0 6v5m0 3h.01',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z'};
function icon(p,name,x,y,size=16,color=T.muted){const path=PATHS[name]||PATHS.more;const n=figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="'+path+'" stroke="'+color+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>');p.appendChild(n);n.name='Icon / '+name;n.resize(size,size);n.x=x;n.y=y;return n;}
function button(p,label,x,y,w=100,kind='secondary',name){let f;if(M['button-'+kind]){f=M['button-'+kind].createInstance();p.appendChild(f);f.x=x;f.y=y;f.resize(w,30);const t=f.findOne(n=>n.type==='TEXT');if(t){t.characters=label;t.resize(w-20,18);t.layoutSizingHorizontal='FILL';}}else{f=box(p,name||label,x,y,w,30,kind==='primary'?T.blue:kind==='ghost'?null:T.panel,kind==='secondary'?T.control:null,6);text(f,label,10,5,w-20,12,kind==='primary'?'#FFFFFF':kind==='danger'?T.red:T.ink,'Medium');}f.name=name||label;return f;}
function iconButton(p,name,x,y,active=false){const f=box(p,'Action / '+name,x,y,28,28,active?T.soft:null,null,5);icon(f,name,6,6,16,active?T.blue:T.muted);return f;}
function pill(p,label,x,y,w=80,tone='blue'){const colors={blue:[T.soft,T.blue],green:[T.greenSoft,T.green],amber:[T.amberSoft,T.amber],red:[T.redSoft,T.red],neutral:[T.bg,T.muted],purple:['#F4F0FF',T.purple]};const c=colors[tone]||colors.blue,f=box(p,label,x,y,w,22,c[0],null,5);text(f,label,7,3,w-14,11,c[1],'Medium');return f;}
function field(p,label,value,x,y,w=128,state='default'){const f=box(p,'Property / '+label,x,y,w,55,null);text(f,label,0,0,w,11,T.muted);const input=box(f,label+' value',0,20,w,30,state==='disabled'?T.bg:T.panel,state==='error'?T.red:state==='focus'?T.blue:T.control,5);text(input,value,9,5,w-20,12,state==='inherited'?T.blue:state==='disabled'?T.subtle:T.ink);return f;}
function section(p,title,y,desc){rule(p,0,y,300);text(p,title,14,y+13,250,12,T.ink,'Semi Bold');icon(p,'chevron',270,y+14,14);if(desc)text(p,desc,14,y+36,272,11,T.muted);return y+(desc?70:42);}
function search(p,placeholder,x,y,w){const f=box(p,'Search / '+placeholder,x,y,w,32,T.panel,T.control,6);icon(f,'search',9,8,16);text(f,placeholder,33,7,w-42,12,T.muted);return f;}
function row(p,label,x,y,w=252,selected=false,glyph='pages',meta=''){const f=box(p,'Row / '+label,x,y,w,32,selected?T.soft:null,null,5);icon(f,glyph,9,8,16,selected?T.blue:T.muted);text(f,label,33,7,w-70,12,selected?T.blue:T.ink,selected?'Medium':'Regular');if(meta)text(f,meta,w-36,8,30,10,T.subtle);return f;}
function note(parent,title,body,x,y,w=1440){const f=box(parent,'Design specification / '+title,x,y,w,108,'#F8FAFC',T.line,8);text(f,title,18,13,w-36,14,T.ink,'Semi Bold');text(f,body,18,39,w-36,12,T.muted);return f;}
function screen(name,x,y,w=1440,h=900){return box(PAGE,name,x,y,w,h,T.bg,null,0);}
function shell(o){const w=o.w||1440,h=o.h||900,f=screen(o.title,o.x||0,o.y||0,w,h);const leftW=o.leftOpen===false?0:280,rightW=o.rightOpen===false?0:300,cx=60+leftW,cw=w-cx-rightW;
const head=box(f,'Application header',0,0,w,56,T.panel);rule(head,0,55,w);icon(head,'arrow',18,20,16);text(head,'Buildrick demo',60,17,170,14,T.ink,'Semi Bold');icon(head,'chevron',195,22,12);if(w>=1200){icon(head,o.save?'warning':'check',240,22,12,o.save?T.amber:T.green);text(head,o.save||'Document saved',258,20,170,11,T.muted);}button(head,'⌘ K',w-406,13,52);button(head,'History',w-346,13,70,'ghost');button(head,'Review',w-270,13,70,'ghost');button(head,'Preview',w-192,13,80);button(head,'Publish',w-104,13,88,'primary');
const rail=box(f,'Primary navigation',0,56,60,h-56,T.panel);const nav=[['add','Add'],['layers','Layers'],['pages','Pages'],['media','Media'],['cms','CMS'],['brand','Brand']];nav.forEach(([i,label],k)=>{const on=(o.left||'Layers')===label,b=box(rail,'Open '+label,7,12+k*54,46,47,on?T.soft:null,null,7);icon(b,i,15,6,17,on?T.blue:T.muted);text(b,label,2,27,42,10,on?T.blue:T.muted,'Medium');});iconButton(rail,'help',16,h-104);rule(f,59,56,1);
let left=null;if(leftW){left=box(f,'Left drawer / '+(o.left||'Layers'),60,56,leftW,h-56,T.panel);text(left,o.left||'Layers',16,16,210,14,T.ink,'Semi Bold');iconButton(left,'close',244,10);search(left,'Search '+(o.left||'layers').toLowerCase(),12,53,256);if((o.left||'Layers')==='Layers'){row(left,'Body',12,99,256,false,'layers');row(left,'Main section',24,133,244,false,'layers');row(left,'Heading',36,167,232,true,'type');row(left,'Paragraph',36,201,232,false,'type');row(left,'Image',36,235,232,false,'media');text(left,'5 elements · Home',16,h-84,248,11,T.muted);}}
const context=box(f,'Page and breakpoint context',cx,56,cw,40,T.panel);text(context,'Home',16,11,65,12,T.ink,'Medium');rule(context,12,38,53,T.blue);text(context,'About',86,11,65,12,T.muted);icon(context,o.device==='Mobile'?'mobile':'desktop',cw-132,12,16,T.muted);text(context,o.device||'Desktop',cw-108,11,80,12);icon(context,'chevron',cw-26,14,12);rule(context,0,39,cw);
const stage=box(f,'Canvas stage',cx,96,cw,h-132,T.bg);
const viewportWidth=o.device==='Mobile'?375:1200,visibleWidth=Math.min(viewportWidth,cw-48),scale=visibleWidth/viewportWidth,pw=viewportWidth,ph=(h-194)/scale;
const paper=box(stage,'Website canvas · '+viewportWidth+' CSS px',Math.round((cw-visibleWidth)/2),28,pw,ph,T.panel,null,1);paper.clipsContent=true;
paper.effects=[{type:'DROP_SHADOW',color:{...rgb('#172033'),a:.07},offset:{x:0,y:3/scale},radius:16/scale,spread:0,visible:true,blendMode:'NORMAL'}];
const mobile=viewportWidth===375,pad=mobile?24:52;
text(paper,'STUDIO NORTH',pad,mobile?26:42,pw-pad*2,mobile?12:19,T.ink,'Semi Bold');
if(!mobile)text(paper,'Work     About     Contact',pw-370,42,330,17,T.muted);
rule(paper,pad,mobile?60:96,pw-pad*2);
const hero=text(paper,'Make space\nfor what matters.',pad,mobile?110:182,pw-pad*2,mobile?32:72,T.ink,'Semi Bold');hero.lineHeight={unit:'PERCENT',value:115};hero.letterSpacing={unit:'PIXELS',value:-.5};
text(paper,'Thoughtful spaces. Simple ideas.\nA clear starting point for your next website.',pad,mobile?220:405,pw-pad*2,mobile?15:23,T.muted);
const action=button(paper,'Explore our work',pad,mobile?306:522,mobile?145:230,'primary');if(!mobile)action.rescale(1.4);
const artwork=box(paper,'Content image placeholder',pad,mobile?372:644,pw-pad*2,mobile?160:250,'#EBEEF3',null,8/scale);icon(artwork,'media',(pw-pad*2)/2-14/scale,60/scale,28/scale,T.subtle);text(artwork,'Image',(pw-pad*2)/2-28/scale,96/scale,80/scale,11/scale,T.muted);
if(o.selected!==false){const sy=hero.y-5,sh=hero.height+10,sel=box(paper,'Selected heading',pad-5,sy,pw-pad*2+10,sh,null,T.blue);sel.strokeWeight=1/scale;sel.clipsContent=false;const badge=pill(paper,o.selected||'Heading',pad-5,sy-23/scale,84);badge.rescale(1/scale);badge.x=pad-5;badge.y=sy-23/scale;for(const [hx,hy]of [[pad-5,sy],[pw-pad+5,sy],[pad-5,sy+sh],[pw-pad+5,sy+sh]])box(paper,'Resize handle',hx-3/scale,hy-3/scale,6/scale,6/scale,T.panel,T.blue,1/scale);}
paper.rescale(scale);
const footer=box(f,'Canvas toolbar',cx,h-36,cw,36,T.panel);rule(footer,0,0,cw);iconButton(footer,'undo',8,4);iconButton(footer,'redo',40,4);button(footer,Math.round(scale*100)+'% ⌄',79,3,74,'ghost');text(footer,viewportWidth+' px · '+(o.device||'Desktop'),cw-166,10,150,11,T.muted);
let right=null,body=null;if(rightW){right=box(f,'Right workspace / '+(o.right||'Inspector'),w-300,56,300,h-56,T.panel);text(right,o.selected||'Heading',14,14,170,14,T.ink,'Semi Bold');button(right,'AI',191,8,35,'ghost','Open selected-element AI');iconButton(right,'more',233,8);iconButton(right,'close',266,8);text(right,'Home / Main section / '+(o.selected||'Heading'),14,43,272,10,T.muted);const tabs=['Style','Content','Effects'];tabs.forEach((s,i)=>{text(right,s,14+i*94,77,80,12,s===(o.active||'Style')?T.blue:T.muted,s===(o.active||'Style')?'Semi Bold':'Regular');if(s===(o.active||'Style'))rule(right,10+i*94,105,86,T.blue);});rule(right,0,106,300);pill(right,o.device||'Desktop',14,117,91,'neutral');pill(right,'Base state',113,117,88,'neutral');body=box(right,'Inspector properties',0,151,300,h-207,T.panel);body.clipsContent=true;body.overflowDirection='VERTICAL';}
return{frame:f,header:head,rail,left,right,body,stage,paper,hero,scale,viewportWidth,footer,cx,cw,w,h};}
function defaultInspector(s){const p=s.body;let y=section(p,'Typography',0);field(p,'Font','Inter',14,y,272);field(p,'Size',s.viewportWidth===375?'32 px':'72 px',14,y+68,130);field(p,'Weight','600 · Semi bold',156,y+68,130);field(p,'Line height','1.15',14,y+136,130);field(p,'Letter spacing','−0.5 px',156,y+136,130);y+=210;y=section(p,'Size',y);field(p,'Width','Fill container',14,y,130);field(p,'Height','Hug content',156,y,130);y+=72;y=section(p,'Spacing',y);field(p,'Margin','0',14,y,130);field(p,'Padding','0',156,y,130);y+=72;y=section(p,'Text color',y);field(p,'Brand token','Text / primary',14,y,272,'inherited');text(p,'Linked to Brand · Edit token ↗',14,y+59,272,11,T.blue);}


/*
Read-only preparation artifact. Root executes this script in use_figma.
Prefix const BUILD_KEYS = ["unlock", ...] to select <=3 variants per call.
No reactions are assigned. Each clone strips copied reactions and is explicitly a finite simulation.
*/
await init();
const SPECS=[
{key:'unlock',source:'8317:247144',name:'P6 IN-14 · Heading unlocked (simulated)'},
{key:'component-actions',source:'8317:246897',name:'P6 IN-15 · Component instance actions'},
{key:'reset-confirm',source:'8317:246897',name:'P6 IN-16 · Reset instance confirmation'},
{key:'reset-result',source:'8317:246897',name:'P6 IN-17 · Instance reset result (simulated)'},
{key:'detach-confirm',source:'8317:246897',name:'P6 IN-18 · Detach instance confirmation'},
{key:'detach-result',source:'8317:246897',name:'P6 IN-19 · Detached container result (simulated)'},
{key:'master',source:'8317:246897',name:'P6 IN-20 · Component master scope (simulated)'},
{key:'image-result',source:'8317:242981',name:'P6 IN-21 · Image replacement result (simulated)'},
{key:'ai-image',source:'8317:242981',name:'P6 IN-AI01 · Image AI · stale example',target:'Project image',callers:['8317:242981','8318:1807']},
{key:'ai-grid',source:'8317:243462',name:'P6 IN-AI02 · Grid AI · stale example',target:'Project grid',callers:['8317:243209','8317:243462']},
{key:'ai-form',source:'8317:246429',name:'P6 IN-AI03 · Form AI · stale example',target:'Contact form',callers:['8317:246429']},
{key:'ai-cms',source:'8317:246658',name:'P6 IN-AI04 · Bound Heading AI · stale example',target:'Heading',callers:['8317:246658']},
{key:'ai-component',source:'8317:246897',name:'P6 IN-AI05 · Instance AI · stale example',target:'Project grid',callers:['8317:246897']},
{key:'ai-heading',source:'8318:1573',name:'P6 IN-AI06 · Heading Effects AI · stale example',target:'Heading',callers:['8318:1573']},
{key:'ai-locked',source:'8317:247144',name:'P6 IN-AI07 · Locked Heading AI · read only',target:'Heading',callers:['8317:247144']},
{key:'ai-mixed',source:'8317:247370',name:'P6 IN-AI08 · Mixed selection AI · scope explanation',target:'3 selected',callers:['8317:247370']}
];
const requested=typeof BUILD_KEYS!=='undefined'?BUILD_KEYS:['unlock','component-actions','reset-confirm'];
if(requested.length>3)throw new Error('Use at most 3 keys per call so the complete created-ID list fits the connector return limit.');
const SOURCE_IDS={
unlock:'8317:247330',instanceActions:'8317:247110',reset:'8317:247119',editMaster:'8317:247108',
replaceImage:'8318:575',mediaUse:'8318:894',fullMediaUse:'8317:287'
};
function getByName(p,name){return p.findOne(n=>n.name===name);}
function right(f){return f.children.find(n=>n.name.startsWith('Right workspace'));}
function bodyOf(f){return right(f).children.find(n=>n.name.startsWith('Inspector properties'));}
async function clearReactions(f){for(const n of [f,...f.findAll(()=>true)])if('reactions'in n&&n.reactions.length)await n.setReactionsAsync([]);}
async function fonts(f){const seen=new Set();for(const n of f.findAll(n=>n.type==='TEXT'))for(const s of n.getStyledTextSegments(['fontName']))seen.add(JSON.stringify(s.fontName));for(const s of seen)await figma.loadFontAsync(JSON.parse(s));}
function replaceText(f,oldValue,newValue){for(const n of f.findAll(n=>n.type==='TEXT'&&n.characters===oldValue)){n.characters=newValue;n.name=newValue;}}
function fields(f,label){return f.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('Property / '+label+' /'));}
function setField(n,value,state){const label=n.findOne(x=>x.type==='TEXT'&&x.name==='Label').characters;if(state)n.swapComponent(M['property-'+state]);const l=n.findOne(x=>x.type==='TEXT'&&x.name==='Label'),v=n.findOne(x=>x.type==='TEXT'&&x.name==='Value');l.characters=label;v.characters=value;n.name='Property / '+label+' / '+(state||'default');}
function group(p,title,y,rows,cap){const g=figma.createAutoLayout('VERTICAL');p.appendChild(g);g.name='Property group / '+title;g.resize(300,10);g.primaryAxisSizingMode='AUTO';g.counterAxisSizingMode='FIXED';g.x=0;g.y=y;g.itemSpacing=3;g.paddingTop=10;g.paddingBottom=12;g.paddingLeft=14;g.paddingRight=14;g.fills=[];const h=text(g,title,0,0,272,12,T.ink,'Semi Bold');h.resize(272,22);for(const [label,value,state='default']of rows){const n=M['property-'+state].createInstance();g.appendChild(n);setField(n,value,state);n.findOne(x=>x.type==='TEXT'&&x.name==='Label').characters=label;n.name='Property / '+label+' / '+state;}if(cap)text(g,cap,0,0,272,11,T.muted);return g;}
function genericGrid(f,padding,isMaster){const p=bodyOf(f);for(const n of [...p.children])n.remove();const c=box(p,isMaster?'Master scope context':'Detached local context',14,0,272,34,T.soft,null,5);text(c,isMaster?'Editing master · Project grid':'Container · local values',10,8,252,11,T.blue);let y=44;for(const [title,rows]of [['Layout',[['Display','Grid'],['Columns','3'],['Gap','24 px']]],['Size',[['Width','Fill container'],['Height','Hug content']]],['Spacing',[['Padding',padding+' px'],['Margin','0 px']]]]){const g=group(p,title,y,rows);y+=g.height+4;}}
function setCanvasPadding(f,pad){const paper=f.findOne(n=>n.name.startsWith('Website canvas'));const p=paper.children.find(n=>n.name.startsWith('Website document'));const scale=paper.width/1200,card=(1152-2*pad-48)/3;const images=p.children.filter(n=>n.name==='Website content / image');const titles=['Quiet spaces','Natural light','Simple living'];images.forEach((n,i)=>{const x=(24+pad+i*(card+24))*scale;n.x=x;n.y=(400+pad)*scale;n.resize(card*scale,220*scale);const t=p.children.find(n=>n.type==='TEXT'&&n.characters===titles[i]);if(t){t.x=x;t.resize(card*scale,t.height);}const descriptions=p.children.filter(n=>n.type==='TEXT'&&n.characters==='Explore the project');if(descriptions[i]){descriptions[i].x=x;descriptions[i].resize(card*scale,descriptions[i].height);}});}
function plainGridIdentity(f){replaceText(f,'Project grid · Instance','Project grid');const row=getByName(f,'Row / Project grid');if(row){const old=getByName(row,'Icon / component');if(old)old.remove();icon(row,'layers',9,8,16,T.blue);}const selection=f.findOne(n=>n.name==='Selection / Project grid · Instance');if(selection)selection.name='Selection / Project grid';}
function backdrop(f){const b=box(f,'Prototype dismiss backdrop',0,0,1440,900,null);return b;}
function dialog(f,kind){const b=box(f,'Prototype modal backdrop',0,0,1440,900,T.ink);b.opacity=.16;const d=box(f,'Dialog / '+kind,500,292,440,276,T.panel,T.line,10);text(d,kind==='reset'?'Reset Project grid?':'Detach Project grid?',24,22,392,18,T.ink,'Semi Bold');button(d,'×',388,14,30,'ghost','Close confirmation');text(d,kind==='reset'?'Remove the local padding override? This instance will follow the master again.':'Keep the current appearance and stop following the master. Future master changes will not affect this container.',24,70,392,13,T.muted);button(d,'Cancel',24,218,184,'secondary','Cancel '+kind);button(d,kind==='reset'?'Reset to master':'Detach instance',224,218,192,kind==='reset'?'primary':'danger','Confirm '+kind);return d;}
const out=[],created=[];
for(const key of requested){
const spec=SPECS.find(x=>x.key===key);if(!spec)throw new Error('Unknown key '+key);
let f=PAGE.children.find(n=>n.name===spec.name);let reused=!!f;
if(!f){
 const source=await figma.getNodeByIdAsync(spec.source);await fonts(source);f=source.clone();PAGE.appendChild(f);f.name=spec.name;const i=SPECS.indexOf(spec);f.x=20000+(i%3)*1600;f.y=Math.floor(i/3)*1100;await clearReactions(f);
 if(key==='unlock'){
  const p=bodyOf(f),status=getByName(p,'Locked status');if(status)status.remove();
  for(const n of p.children)if(n.name.startsWith('Property group /'))n.y-=100;
  for(const n of p.findAll(n=>n.type==='INSTANCE'&&n.name.endsWith('/ disabled'))){const value=n.findOne(x=>x.type==='TEXT'&&x.name==='Value').characters;setField(n,value,'default');}
  replaceText(f,'Heading · Locked','Heading');
  const row=getByName(f,'Row / Heading'),lock=row&&getByName(row,'Icon / lock');if(lock)lock.remove();
  const selected=getByName(f,'Selection / Heading · Locked');if(selected){selected.name='Selection / Heading';selected.strokes=fill(T.blue);const par=selected.parent;for(const [x,y]of [[selected.x,selected.y],[selected.x+selected.width,selected.y],[selected.x,selected.y+selected.height],[selected.x+selected.width,selected.y+selected.height]])box(par,'Resize handle',x-3,y-3,6,6,T.panel,T.blue,1);}
  const badge=getByName(f,'Heading · Locked');if(badge&&badge.type==='FRAME'){badge.name='Heading';badge.fills=fill(T.soft);for(const n of badge.findAll(n=>n.type==='TEXT'))n.fills=fill(T.blue);}
 }
 if(key==='component-actions'){
  backdrop(f);const m=box(f,'Instance actions menu',1180,374,246,116,T.panel,T.line,7);
  button(m,'Reset to master…',8,8,230,'ghost','Instance action / Reset to master');
  button(m,'Detach instance…',8,46,230,'ghost','Instance action / Detach instance');
  text(m,'Project grid instance',16,86,214,11,T.muted);
 }
 if(key==='reset-confirm')dialog(f,'reset');
 if(key==='detach-confirm')dialog(f,'detach');
 if(key==='reset-result'){
  for(const n of fields(f,'Padding'))setField(n,'24 px','inherited');
  replaceText(f,'1 local override. Other values follow the master.','No local overrides. Values follow the master.');
  replaceText(f,'Overrides','Instance values');
  const reset=getByName(f,'Reset to master…');if(reset){const v=reset.findOne(n=>n.type==='TEXT');reset.swapComponent(M['button-disabled']);reset.name='Reset to master / disabled';reset.findOne(n=>n.type==='TEXT').characters='Reset to master';}
  setCanvasPadding(f,24);
 }
 if(key==='detach-result'){genericGrid(f,32,false);plainGridIdentity(f);}
 if(key==='master'){
  genericGrid(f,24,true);plainGridIdentity(f);setCanvasPadding(f,24);
  const c=f.children.find(n=>n.name==='Page and breakpoint context');for(const n of [...c.children])n.remove();
  text(c,'Components / Project grid',16,11,360,12,T.ink,'Medium');button(c,'Back to instance',c.width-164,5,152,'secondary','Back to Project grid instance');
  const crumbs=right(f).children.find(n=>n.type==='TEXT'&&n.characters.startsWith('Home / Main section'));if(crumbs)crumbs.characters='Components / Project grid / Master';
 }
 if(key==='image-result'){const p=getByName(bodyOf(f),'Property group / Image'),n=p.findOne(n=>n.type==='INSTANCE'&&n.name==='Property / Source / default');setField(n,'studio-gradient1.webp','default');}
 if(key.startsWith('ai-')){
  const old=right(f);old.remove();const aiSource=await figma.getNodeByIdAsync('8317:244283');await fonts(aiSource);const ai=aiSource.clone();f.appendChild(ai);ai.x=1140;ai.y=56;await clearReactions(ai);
  replaceText(ai,'AI for Heading','AI for '+spec.target);replaceText(ai,'Regenerate for Heading','Regenerate for '+spec.target);
  replaceText(ai,'Make the headline more concise.','Review the selected element.');replaceText(ai,'Make the heading more concise','Review this selection');
  for(const n of ai.findAll(n=>n.name==='Regenerate for Heading'))n.name='Regenerate for '+spec.target;
  if(key==='ai-locked'){replaceText(ai,'Selection changed','Selection is locked');replaceText(ai,'This proposal targets an earlier selection. Generate a new proposal before applying.','Unlock this element before applying changes.');}
  if(key==='ai-mixed'){replaceText(ai,'Selection changed','Choose one element');replaceText(ai,'This proposal targets an earlier selection. Generate a new proposal before applying.','Select one element to use a targeted AI request.');const regen=ai.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Regenerate for'));if(regen){regen.swapComponent(M['button-disabled']);regen.findOne(n=>n.type==='TEXT').characters='Select one element';regen.name='Regenerate / disabled for mixed scope';}}
 }
 const noteName='Prototype simulation note / '+key;
 const noteText='Finite prototype example. '+(key==='image-result'?'A selected-image result is simulated; no media persistence or upload occurs. Cancel keeps the original source.':key.startsWith('ai-')?'The original selection and canvas are retained. No AI provider request, generated result or apply operation runs. Caller-aware Back returns to the originating inspector.':key==='master'?'Master scope and return navigation are simulated. No master or instance data is changed.':'Confirmation, cancellation and result states are simulated. No document operation, server write or history transaction runs.')+(key==='ai-mixed'?' Single-target guidance is a finite-prototype boundary, not a source-certified restriction on current multi-selection AI.':'')+' Hidden or covered background controls must remain inactive.';
 const n=note(PAGE,noteName,noteText,f.x,f.y+916,1440);n.name=noteName;created.push(f.id,...f.findAll(()=>true).map(n=>n.id),n.id,...n.findAll(()=>true).map(n=>n.id));
}
 const interactive=f.findAll(n=>n.type==='INSTANCE'||/^(Action \/ close|Prototype dismiss|Prototype modal|Style$|Content$|Effects$|Instance action \/)/.test(n.name)).map(n=>({id:n.id,name:n.name,parent:n.parent.name}));
 out.push({key,frameId:f.id,name:f.name,sourceFrameId:spec.source,reused,callerFrames:spec.callers||[spec.source],actions:interactive.filter(n=>/^(Unlock|Reset|Confirm|Cancel|Close|Back|Instance action|Actions|Edit master|Open selected|Apply previous|Regenerate|Select one|Prototype|Action \/ close|Style$|Content$|Effects$)/.test(n.name))});
}
return {createdNodeIds:created,frames:out,sourceIds:SOURCE_IDS,notes:'No reactions assigned. Use existing source IDs and returned clone actions to serialize wiring; clone states are simulations.'};
