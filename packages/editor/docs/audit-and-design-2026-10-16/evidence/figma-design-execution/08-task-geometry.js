await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('3:10'));
const definitions=[
 ['T01 · 1440 / docked Review replaces Inspector',1440,900,'dock'],
 ['T02 · 1281 / Review overlay',1281,768,'overlay'],
 ['T03 · 1279 / Review sheet',1279,768,'sheet'],
 ['T04 · 1279 / Locate collapses to 48px peek',1279,768,'peek']
].slice(START,END);
const frames=[];
for(const [name,w,h,mode]of definitions){
 const s=editor(name,{w,h,inserted:true,edited:true,styled:true,styleTab:true});await Promise.all(pending);pending.length=0;s.root.x=80+(START+frames.length)*2100;s.root.y=2800;
 const body=s.root.findOne(n=>n.name==='Workspace'),center=s.root.findOne(n=>n.name==='Canvas column'),canvas=s.root.findOne(n=>n.name==='Canvas scroll and pan');
 if(s.refs.inspector)s.refs.inspector.root.remove();if(s.refs.inspectorDoor)s.refs.inspectorDoor.remove();
 let task;
 if(mode==='dock')center.resize(740,center.height);
 const oldToolbar=s.refs.toolbar.root;oldToolbar.remove();const usable=mode==='dock'?740:mode==='overlay'?w-340-372:w-340;
 const tb=toolbar(center,usable,{inserted:true});center.insertChild(0,tb.root);canvas.resize(center.width,center.height-tb.root.height);
 s.site.root.remove();s.site=site(canvas,mode==='overlay'?usable:center.width,canvas.height,{inserted:true,edited:true,styled:true});setText(tb.zoom,Math.round(s.site.scale*100)+'%');
 let locate,back,close,expand;
 if(mode==='peek'){
  task=frame('Review task / 48px peek',w-364,48,'HORIZONTAL','bg-panel',canvas);abs(task,12,canvas.height-60);pad(task,8);gap(task,8);edge(task);radius(task);txt(task,'Review · Text located','Label');spacer(task);expand=button(task,'Expand Review','Secondary',136);
 }else{
  const tw=mode==='sheet'?560:360,th=mode==='dock'?h-88:h-112;
  task=frame('Review task / '+mode,tw,th,'VERTICAL','bg-panel',body);edge(task);if(mode!=='dock'){abs(task,w-tw-12,12);radius(task);pending.push(task.setEffectStyleIdAsync(FX.Overlay.id));}
  const header=frame('Task header / scope and return',tw,48,'VERTICAL','bg-panel',task);header.paddingLeft=12;header.paddingRight=12;
  const first=frame('Task title and actions',tw-24,32,'HORIZONTAL',null,header);gap(first,4);first.counterAxisAlignItems='CENTER';txt(first,'Review','Panel');spacer(first);back=button(first,'Back to Inspector','Ghost',152);close=ib(first,'x');txt(header,'Home · Round 2','Meta','ink-soft');
  const scrollBody=frame('Review scroll body',tw,th-96,'VERTICAL','bg-panel',task);pad(scrollBody,12);gap(scrollBody,16);scroll(scrollBody);
  txt(scrollBody,'2 open comments','Label');const card=frame('Synthetic review comment',tw-24,null,'VERTICAL','bg-subtle',scrollBody);pad(card,12);gap(card,12);radius(card,'sm');txt(card,'Text · Home / Hero','Section');txt(card,'Keep the message short and clear.','Body','ink',tw-48);txt(card,'Sample reviewer · Just now','Meta','ink-soft');const actions=frame('Thread actions',tw-48,32,'HORIZONTAL',null,card);gap(actions,8);locate=button(actions,'Locate','Secondary',80);button(actions,'Resolve','Ghost',80);
  const second=frame('Synthetic review comment 2',tw-24,null,'VERTICAL','bg-subtle',scrollBody);pad(second,12);gap(second,8);txt(second,'Headline · Home / Hero','Section');txt(second,'Check the line break on Tablet.','Body','ink',tw-48);
  const footer=frame('Reply composer / pinned',tw,48,'HORIZONTAL','bg-panel',task);pad(footer,8);gap(footer,8);const input=inst('Input/State=Default',footer,tw-100,32);setText(input,'Comment on Home…');button(footer,'Send','Primary',76);
 }
 frames.push({id:s.root.id,name,mode,task:task.id,locate:locate?.id,back:back?.id,close:close?.id,expand:expand?.id,toolbar:tb.root.id,geometry:{width:w,height:h,canvasColumn:center.width,toolbarWidth:usable,toolbarHeight:tb.root.height,taskWidth:task.width,taskHeight:task.height}});
}
await Promise.all(pending);return {createdNodeIds:created,frames};
