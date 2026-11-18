// Prepend continuation-helpers.js, selecting page 3:10. Editable review copies only.
const suite = [], linksToMap = [];
const HUB_ID = typeof EXISTING_HUB === 'undefined' ? null : EXISTING_HUB;
async function specimen(source, key, title, hint) {
  const src = await figma.getNodeByIdAsync(source);
  if (!src) throw Error('Missing source ' + source);
  await Promise.all(src.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
  const root = frame(page, 'PLAY · '+key+' · '+title, src.width, src.height+96);
  root.x=80+(suite.length%4)*1600; root.y=batchY+Math.floor(suite.length/4)*1160;
  roots.push(root);
  const bar=frame(root,'Prototype controller · outside product',src.width,96,'VERTICAL','bg-subtle');
  pad(bar,12);bar.itemSpacing=8;
  const row=frame(bar,'Prototype navigation',src.width-24,32,'HORIZONTAL',null);
  row.itemSpacing=8;row.counterAxisAlignItems='CENTER';
  const home=button(row,'All journeys','secondary',112);
  text(row,key+' · '+title,Math.max(100,src.width-160),'Label');
  const choices=frame(bar,'Explicit review fixtures',src.width-24,32,'HORIZONTAL',null);
  choices.itemSpacing=8;choices.counterAxisAlignItems='CENTER';
  const caption=text(choices,hint||'Focused prototype · click task controls. No real data is changed.',src.width-40,'Meta','ink-soft');
  const product=src.clone();root.appendChild(product);product.x=0;product.y=96;
  product.layoutSizingHorizontal='FIXED';product.layoutSizingVertical='FIXED';
  product.name='Product screen · '+src.name;
  function walk(a,b) {
    if ('reactions' in b) {
      const rs=a.reactions||[];
      if(rs.some(r=>(r.actions||[]).length))linksToMap.push({node:b,reactions:JSON.parse(JSON.stringify(rs))});
      b.reactions=[];
    }
    if(a.type==='TEXT'&&a.hyperlink)b.hyperlink=null;
    if('children'in a&&'children'in b)for(let i=0;i<a.children.length;i++)walk(a.children[i],b.children[i]);
  }
  walk(src,product);
  const item={source,key,id:root.id,product:product.id,bar:bar.id,choices:choices.id,home:home.id,caption:caption.id,root,p:product,row:choices};
  suite.push(item);return item;
}
function control(item,name) { const n=item.p.findOne(n=>n.name===name)||item.p.findOne(n=>n.type==='INSTANCE'&&n.componentProperties['Label#4:18']?.value===name);if(!n)throw Error('Missing '+name+' in '+item.key);return n; }
function namedLink(item,name,target) {link(control(item,name),target.id||target);}
function fixture(item,label,target,kind='secondary') {
  const cap=item.row.children.find(n=>n.type==='TEXT');
  if(cap)cap.visible=false;
  link(button(item.row,label,kind),target.id||target);
}
function changeText(item,from,to) {
  for(const n of item.p.findAllWithCriteria({types:['TEXT']}))if(n.characters===from){n.characters=to;mutations.push(n.id);}
}
function mapLinks(extra={}) {
  const map={...extra,...Object.fromEntries(suite.map(s=>[s.source,s.id]))};
  for(const item of linksToMap) {
    const reactions=item.reactions.map(r=>({...r,actions:(r.actions||[]).filter(a=>a.type==='NODE'&&map[a.destinationId]).map(a=>({...a,destinationId:map[a.destinationId]}))})).filter(r=>r.actions.length);
    if(reactions.length){item.node.reactions=reactions;linkedIds.add(item.node.id);mutations.push(item.node.id);}
  }
}
async function suiteFinish(hub) {
  for(const s of suite)link(await figma.getNodeByIdAsync(s.home),hub);
  const result=await finish();
  const data={...result,suite:suite.map(({root,p,row,...s})=>s)};
  figma.io.write('native-suite-affected.json',JSON.stringify(data));
  return {frames:result.frames,suite:data.suite,createdNodeCount:result.createdNodeCount||result.createdNodeIds.length,allAffectedNodeIds:'native-suite-affected.json'};
}
