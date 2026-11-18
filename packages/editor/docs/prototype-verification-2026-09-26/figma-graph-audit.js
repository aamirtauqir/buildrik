
const page=await figma.getNodeByIdAsync('4418:45431'); await figma.setCurrentPageAsync(page);
const boards=[];
function collect(n,excluded){excluded=excluded||/^(ARCHIVE|REFERENCE|LIBRARY|FRAGMENT|PROPOSED)/i.test(n.name);if(n.type==='PAGE'||n.type==='SECTION'){for(const c of n.children)collect(c,excluded);}else if(n.type==='FRAME'&&!excluded)boards.push(n);}
collect(page,false);
const ids=new Set(), owner=new Map(), edges=[], rows=[], actionsCount={};
const boardIds=new Set(boards.map(b=>b.id)); const missing=[];const closeFirst=[];
function flat(as,out=[]){for(const a of as||[]){if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks||[])flat(b.actions,out);else out.push(a);}return out;}
for(const b of boards){
 const row={id:b.id,name:b.name,exits:0};rows.push(row);
 function walk(n,visible){ids.add(n.id);owner.set(n.id,b.id);visible=visible&&n.visible!==false;
  if(visible&&'reactions'in n)for(const r of n.reactions||[]){
   const acts=r.actions?.length?r.actions:(r.action?[r.action]:[]);const f=flat(acts);
   if(acts[0]?.type==='CLOSE'&&f.some(a=>a.type==='NODE'))closeFirst.push([b.id,n.id]);
   for(const a of f){actionsCount[a.type]=(actionsCount[a.type]||0)+1;
    if(a.type==='NODE'&&a.destinationId)edges.push({from:b.id,node:n.id,to:a.destinationId,nav:a.navigation});
    if(['CLOSE','BACK','URL'].includes(a.type))row.exits++;
   }
  }
  if('children'in n)for(const c of n.children)walk(c,visible);
 }walk(b,true);
}
const foreign=[...new Set(edges.filter(e=>!ids.has(e.to)).map(e=>e.to))];const external=[];
for(const id of foreign){const n=await figma.getNodeByIdAsync(id);if(!n)missing.push(id);else external.push({id,name:n.name,type:n.type});}
const adj=new Map(boards.map(b=>[b.id,new Set()]));const incoming=new Map();
for(const e of edges){const to=owner.get(e.to)||e.to;adj.get(e.from).add(to);incoming.set(to,(incoming.get(to)||0)+1);}
const starts=(page.flowStartingPoints||[]).map(s=>s.nodeId);
function reach(start){const seen=new Set(start);const q=[...start];for(let i=0;i<q.length;i++)for(const t of adj.get(q[i])||[])if(!seen.has(t)){seen.add(t);q.push(t);}return seen;}
const reachable=reach(starts),latestReach=reach(['7901:196729']);
const live=rows.filter(r=>/^(CURRENT|STATE\s*·)/.test(r.name));
const noIncoming=live.filter(r=>!incoming.has(r.id)&&!starts.includes(r.id));
const noExit=live.filter(r=>!r.exits&&![...adj.get(r.id)].some(t=>t!==r.id));
const latest=await figma.getNodeByIdAsync('7889:196283'); const details=[];
for(const b of latest.children){if(b.type!=='FRAME')continue;
 const bb=b.absoluteBoundingBox; const out={id:b.id,name:b.name,reachableFromHub:latestReach.has(b.id),actions:[]};
 function detail(n,v){v=v&&n.visible!==false;if(!v)return;
 const box=n.absoluteBoundingBox;const x=box?Math.round(box.x-bb.x):0,y=box?Math.round(box.y-bb.y):0;
 if('reactions'in n && !n.id.startsWith('I') && (y>=56||n===b||b.id==='7901:196729'))for(const r of n.reactions||[]){
 const f=flat(r.actions?.length?r.actions:(r.action?[r.action]:[]));
 out.actions.push({id:n.id,name:n.name,xy:[x,y,box?Math.round(box.width):0,box?Math.round(box.height):0],trigger:r.trigger?.type,a:f.map(a=>a.type==='NODE'?[a.navigation,a.destinationId]:[a.type,a.variableId||''])});
 }if('children'in n)for(const c of n.children)detail(c,v);
 }detail(b,true); details.push(out);}
return {counts:{boards:boards.length,live:live.length,nodes:ids.size,edges:edges.length,actions:actionsCount,starts:starts.length,liveReachableFromAnyStart:live.filter(r=>reachable.has(r.id)).length,liveReachableFromLatestHub:live.filter(r=>latestReach.has(r.id)).length},missing,missingEdges:edges.filter(e=>missing.includes(e.to)).slice(0,35),external:external.slice(0,15),closeFirst:closeFirst.slice(0,25),noIncoming:noIncoming.slice(0,35),noExit:noExit.slice(0,25),latest:details};

