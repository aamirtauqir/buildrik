const TARGETS=[1];
const section=await figma.getNodeByIdAsync('8021:206877');
const boards=section.children.filter(n=>/^\d\d ·/.test(n.name)&&TARGETS.includes(parseInt(n.name)));
const changed=new Set();const mark=n=>changed.add(n.id);
function compactSurface(n,w=n.width,h=24){
  
  if('paddingTop'in n){n.paddingTop=3;n.paddingBottom=3;n.paddingLeft=8;n.paddingRight=8;n.counterAxisAlignItems='CENTER';}
  n.resize(w,h);n.layoutSizingVertical='FIXED';n.cornerRadius=4;fill(n,'flowbite/gray/50');border(n,'color/border');n.effects=[];mark(n);
}
async function quietText(n){for(const t of n.findAllWithCriteria({types:['TEXT']})){t.fontSize=12;t.lineHeight={unit:'PIXELS',value:16};t.textAutoResize='HEIGHT';fill(t,'color/ink-soft');mark(t);}}
for(const b of boards){await fonts(b);const p=b.query('FRAME[name^="Inspector /"]').first();if(!p)continue;
for(const field of p.query('INSTANCE[name^="Field /"]')){
  const label=field.children.find(n=>n.type==='TEXT');const c=field.children.find(n=>n.name==='control');
  field.paddingLeft=12;field.paddingRight=12;field.paddingTop=2;field.paddingBottom=2;field.itemSpacing=8;field.resize(300,28);field.counterAxisAlignItems='CENTER';mark(field);
  if(label){label.fontSize=12;label.lineHeight={unit:'PIXELS',value:16};label.textAutoResize='HEIGHT';label.resize(108,16);label.textAutoResize='HEIGHT';fill(label,'color/ink-muted');mark(label);}
  if(c){if(c.type==='INSTANCE'){compactSurface(c,160);await quietText(c);}else if(c.type==='FRAME'){c.resize(160,24);c.itemSpacing=4;c.counterAxisAlignItems='CENTER';mark(c);const sub=c.children.filter(n=>n.type==='INSTANCE');const swatch=c.children.find(n=>n.name==='swatch');for(const input of sub){compactSurface(input,sub.length===2?78:swatch?140:160);await quietText(input);}if(swatch){swatch.resize(16,16);swatch.cornerRadius=3;if(!field.name.includes('●'))fill(swatch,'color/ink-soft');mark(swatch);}}}
  if(c)for(const icon of c.findAllWithCriteria({types:['INSTANCE']})){if(icon.name==='caret'){icon.resize(12,12);mark(icon);}}
}
for(const group of p.query('FRAME[name^="Segmented /"]')){
 const options=group.children.find(n=>n.type==='FRAME'&&n.name==='Options');if(!options)continue;
 let label=group.children.find(n=>n.type==='TEXT');
 if(!label&&options.children.length===3&&options.children.some(n=>n.type==='INSTANCE'&&n.findAllWithCriteria({types:['TEXT']}).some(t=>t.characters==='Left'))){label=tx(group,'Align',108,12,'color/ink-muted');group.insertChild(0,label);}
 if(!label&&options.children.length===2&&options.children.some(n=>n.type==='INSTANCE'&&n.findAllWithCriteria({types:['TEXT']}).some(t=>t.characters==='Static'))){label=tx(group,'Source',108,12,'color/ink-muted');group.insertChild(0,label);}
 group.layoutMode='HORIZONTAL';group.resize(300,32);group.primaryAxisSizingMode='FIXED';group.counterAxisSizingMode='FIXED';group.paddingLeft=group.paddingRight=12;group.paddingTop=group.paddingBottom=4;group.itemSpacing=8;group.counterAxisAlignItems='CENTER';mark(group);
 const ww=options.children.length===6?204:160;
 if(label){label.resize(276-ww-8,16);label.fontSize=12;label.lineHeight={unit:'PIXELS',value:16};label.textAutoResize='HEIGHT';fill(label,'color/ink-muted');mark(label);}
 options.resize(ww,24);options.primaryAxisSizingMode='FIXED';options.counterAxisSizingMode='FIXED';options.itemSpacing=2;options.paddingLeft=options.paddingRight=2;options.paddingTop=options.paddingBottom=2;fill(options,'color/bg-subtle');options.cornerRadius=4;mark(options);
 const buttons=options.children.filter(n=>n.type==='INSTANCE');const bw=(ww-4-2*(buttons.length-1))/buttons.length;
 for(const button of buttons){const active=button.findAllWithCriteria({types:['TEXT']}).some(t=>t.fills.some(f=>f.type==='SOLID'&&f.color.r>0.95&&f.color.g>0.95&&f.color.b>0.95));button.paddingLeft=button.paddingRight=2;button.paddingTop=button.paddingBottom=2;button.resize(bw,20);button.layoutSizingVertical='FIXED';button.cornerRadius=3;button.effects=[];fill(button,active?'color/bg-panel':null);button.strokes=active?[paint('color/border')]:[];await quietText(button);for(const t of button.findAllWithCriteria({types:['TEXT']}))if(active)fill(t,'color/accent-text');mark(button);}
}
for(const r of p.query('FRAME[name="Action row"]')){r.paddingLeft=r.paddingRight=12;r.paddingTop=r.paddingBottom=2;r.counterAxisAlignItems='MAX';mark(r);for(const button of r.children.filter(n=>n.type==='INSTANCE')){const label=button.findAllWithCriteria({types:['TEXT']})[0]?.characters||'';const compact=/^(Edit text|Open |\+ |Unbind|Reconnect|Group|SEO|Edit master)/.test(label);if(compact){compactSurface(button,160,24);await quietText(button);if(/^(Edit text|Open |\+ |SEO|Edit master)/.test(label)){button.strokes=[];fill(button,null);for(const t of button.findAllWithCriteria({types:['TEXT']}))fill(t,'color/accent-text');}}}}
for(const ctx of p.query('FRAME[name="Style context"]')){ctx.paddingLeft=ctx.paddingRight=12;ctx.paddingTop=ctx.paddingBottom=4;mark(ctx);for(const ch of ctx.children.filter(n=>n.type==='INSTANCE')){ch.paddingTop=ch.paddingBottom=2;ch.resize(ch.width,24);ch.layoutSizingVertical='FIXED';await quietText(ch);mark(ch);}}
for(const n of p.query('FRAME[name^="Checkbox /"]')){n.paddingLeft=n.paddingRight=12;n.paddingTop=n.paddingBottom=3;mark(n);}
for(const t of p.findAllWithCriteria({types:['TEXT']})){if(!t.id.startsWith('I')&&t.fontSize===12&&t.name!=='value'){t.lineHeight={unit:'PIXELS',value:16};mark(t);}}
if(parseInt(b.name)===34){const f=p.query('INSTANCE[name="Field / Width"]').first();if(f){const c=f.children.find(n=>n.name==='control');if(c)border(c,'color/error');}}
const viewport=p.children.find(n=>n.name==='Sections viewport / scroll');if(viewport){const above=p.children.slice(0,p.children.indexOf(viewport)).filter(n=>n.visible).reduce((sum,n)=>sum+n.height,0);viewport.resize(300,812-above);mark(viewport);}
}
const reads=boards.map(b=>{const p=b.query('FRAME[name^="Inspector /"]').first();return {id:b.id,name:b.name,controls:p?p.query('INSTANCE[name^="Field /"]').map(n=>({label:n.name,rowHeight:n.height,control:n.children.filter(c=>c.name==='control').map(c=>({width:c.width,height:c.height}))})):[]};});
if(TARGETS.length===1)await(await figma.getNodeByIdAsync('7993:198767')).screenshot({scale:1.5});
return {createdNodeIds:created,mutatedNodeIds:[...changed,...mutated],boards:reads};
