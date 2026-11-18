// Read-only native reference and default-state layout audit. No canvas/variable mutations.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const scopes=[['Video','8843:22237'],['Shared Style','8841:14864'],['Ratio chooser','8844:265290'],['Refusal','9051:17536'],['Design scenarios','9051:19964'],['Source editor','9055:17502']];
const result={scope:'Bounded native Video/Shared Style/Ratio chooser/refusal/review-fixture/source-dialog audit. Current authored visibility/geometry only; no variable changes, prototype-state traversal or browser playback.',scopeInventoryNote:'R44 IDs reconciled after authoring timeout; final reset/history corrections and source dialog from r44-video-mutation.json and r44-video-source-mutation.json included. Geometry reflects default variable values, not browser session state.',roots:[],missingRoots:[],nodes:0,visibleNodes:0,instances:0,componentIds:[],missingComponents:[],componentErrors:[],reactionDestinations:[],missingDestinations:[],destinationErrors:[],geometryChecks:0,expectedScrolling:[],clippingCandidates:[],unclippedOverflow:[],geometrySkipped:[],selectorRow:null,captions:[],deviceWidthBindings:[],mutatedNodeIds:[],mutatedVariableIds:[]};
result.scrollContainers=[];
const visited=new Set(),componentIds=new Set(),destinationIds=new Set();
function destinations(list,owner){for(const a of list||[]){if(a.type==='NODE'&&a.destinationId)destinationIds.add(a.destinationId);if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks||[])destinations(b.actions,owner);}}
function checkGeometry(parent,child){
 const pb=parent.absoluteBoundingBox,cb=child.absoluteBoundingBox;if(!pb||!cb)return;
 const tol=1,delta={left:Math.max(0,pb.x-cb.x),top:Math.max(0,pb.y-cb.y),right:Math.max(0,cb.x+cb.width-pb.x-pb.width),bottom:Math.max(0,cb.y+cb.height-pb.y-pb.height)};
 result.geometryChecks++;if(!Object.values(delta).some(n=>n>tol))return;
 const scroll=parent.overflowDirection||'NONE',horizontal=scroll==='HORIZONTAL'||scroll==='BOTH',vertical=scroll==='VERTICAL'||scroll==='BOTH';
 const info={parentId:parent.id,parentName:parent.name,childId:child.id,childName:child.name,parentSize:[parent.width,parent.height],childSize:[child.width,child.height],overflow:delta,scroll,clipsContent:parent.clipsContent===true,layoutMode:parent.layoutMode||'NONE',layoutPositioning:child.layoutPositioning||'AUTO'};
 if((delta.left<=tol&&delta.right<=tol||horizontal)&&(delta.top<=tol&&delta.bottom<=tol||vertical))result.expectedScrolling.push(info);
 else if(parent.clipsContent===true)result.clippingCandidates.push(info);
 else result.unclippedOverflow.push(info);
}
async function walk(node,parentVisible=true){
 if(visited.has(node.id))return;visited.add(node.id);result.nodes++;
 const visible=parentVisible&&node.visible!==false&&node.opacity!==0;if(visible)result.visibleNodes++;
 if('overflowDirection'in node&&node.overflowDirection!=='NONE')result.scrollContainers.push({id:node.id,name:node.name,visible,scroll:node.overflowDirection,clipsContent:node.clipsContent,width:node.width,height:node.height});
 if(node.type==='INSTANCE'){
  result.instances++;try{const main=await node.getMainComponentAsync();if(main)componentIds.add(main.id);else result.missingComponents.push({id:node.id,name:node.name});}catch(e){result.componentErrors.push({id:node.id,error:String(e)});}
 }
 if('reactions'in node)for(const r of node.reactions||[])destinations(r.actions||[],node.id);
 if('children'in node)for(const child of node.children){
  if(visible&&child.visible!==false&&child.opacity!==0&&('layoutMode'in node&&node.layoutMode!=='NONE'||node.clipsContent===true)){
   if(Math.abs(node.rotation||0)>0.01||Math.abs(child.rotation||0)>0.01)result.geometrySkipped.push({id:child.id,reason:'rotated bounding box requires visual review'});else checkGeometry(node,child);
  }
  await walk(child,visible);
 }
}
for(const[name,id]of scopes){const root=await figma.getNodeByIdAsync(id);if(!root){result.missingRoots.push({name,id});continue;}result.roots.push({name,id,width:root.width,height:root.height,layoutMode:root.layoutMode,clipsContent:root.clipsContent,scroll:root.overflowDirection});await walk(root);}
for(const id of destinationIds){try{const n=await figma.getNodeByIdAsync(id);if(!n)result.missingDestinations.push(id);else result.reactionDestinations.push({id,type:n.type,name:n.name});}catch(e){result.destinationErrors.push({id,error:String(e)});}}
const variables=await figma.variables.getLocalVariablesAsync(),byId=new Map(variables.map(v=>[v.id,v])),byName=new Map(variables.map(v=>[v.name,v]));
function dimensions(n){return {id:n.id,name:n.name,type:n.type,width:n.width,height:n.height,visible:n.visible,horizontal:n.layoutSizingHorizontal,vertical:n.layoutSizingVertical,layoutMode:n.layoutMode,padding:'paddingLeft'in n?[n.paddingLeft,n.paddingRight,n.paddingTop,n.paddingBottom]:undefined,strokes:n.strokeWeight,boundVariables:n.boundVariables,text:n.type==='TEXT'?n.characters:undefined,textAutoResize:n.type==='TEXT'?n.textAutoResize:undefined};}
result.geometry=[];
for(const id of ['8843:22528','8843:22532','8843:22274','9051:19953','9051:19954','9051:19957','9051:17523','9051:17524','9051:17526','8844:265292','9055:17502','9055:17510','9055:17512','9055:17522']){const n=await figma.getNodeByIdAsync(id);result.geometry.push(n?dimensions(n):{id,missing:true});}
const player=await figma.getNodeByIdAsync('9051:19953');result.playerDefault={width:player.width,height:player.height,expectedWidth:622,expectedHeight:349.875,ratio16by9Matches:Math.abs(player.width*9/16-player.height)<0.1};
result.mobileGeometry='277 width is derived from the authored viewport-minus-98 expression; no Mobile state was executed in this audit. Geometry assertions apply only to the current default state.';
const active=byName.get('r44/video/active').id,raw=byName.get('r44/video/raw').id,height=byName.get('r44/video/height').id;
result.routes={toSharedStyle:0,gated:0,ungated:[],wrongGateExpression:[],nodes:[]};result.oldStateWriters=[];
function scan(actions,nodeId){for(let i=0;i<(actions||[]).length;i++){const a=actions[i];if(a.type==='NODE'&&a.destinationId==='8841:14864'){result.routes.toSharedStyle++;const prev=actions[i-1],gated=prev?.type==='SET_VARIABLE'&&prev.variableId===active;if(gated){result.routes.gated++;const ex=prev.variableValue?.value;if(ex?.expressionFunction!=='EQUALS'||ex.expressionArguments?.[0]?.value?.id!=='VariableID:8841:14860'||ex.expressionArguments?.[1]?.value!=='video-embed')result.routes.wrongGateExpression.push(nodeId);}else result.routes.ungated.push(nodeId);result.routes.nodes.push(nodeId);}if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks||[])scan(b.actions,nodeId);}}
function flatten(actions,out=[]){for(const a of actions||[]){out.push(a);if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks||[])flatten(b.actions,out);}return out;}
const routeCandidates=figma.currentPage.findAll(n=>'reactions'in n&&n.reactions?.some(r=>JSON.stringify(r.actions).includes('"destinationId":"8841:14864"')));
for(const n of routeCandidates)for(const r of n.reactions||[])scan(r.actions,n.id);
result.routes.nodes=[...new Set(result.routes.nodes)];
for(const id of visited){const n=await figma.getNodeByIdAsync(id);const actions=flatten((n.reactions||[]).flatMap(r=>r.actions||[])),writes=actions.filter(a=>a.type==='SET_VARIABLE').map(a=>a.variableId);if(writes.includes('VariableID:8843:22465')&&!writes.includes(raw)&&!writes.includes(height))result.oldStateWriters.push({id,name:n.name,writesOldRatio:true,syncsGeometry:false});}
result.closePersistence=[];
for(const id of ['8841:14864','8841:14868','8841:15383','8843:22522']){const n=await figma.getNodeByIdAsync(id);const actions=flatten((n.reactions||[]).flatMap(r=>r.actions||[]));result.closePersistence.push({id,name:n.name,triggers:(n.reactions||[]).map(r=>r.trigger),actionCount:actions.length,variableWrites:actions.filter(a=>a.type==='SET_VARIABLE').length,closeActions:actions.filter(a=>a.type==='CLOSE').length,ratioWrites:actions.filter(a=>a.type==='SET_VARIABLE'&&a.variableId==='VariableID:8843:22465').length,rawWrites:actions.filter(a=>a.type==='SET_VARIABLE'&&a.variableId===raw).length,heightWrites:actions.filter(a=>a.type==='SET_VARIABLE'&&a.variableId===height).length});}
result.caveats=['Route gating verifies immediate active-variable assignment with caller equals video-embed before every inspected shared Style destination; it does not execute each caller or prove the caller value is initialized correctly in every branch.','Close persistence action counts establish retained live actions; no pre-authoring byte-level snapshot was available to this audit.','Hidden Video Style section defaults were inspected structurally; visible-all-states layout and provider playback remain outside this audit.'];
result.componentIds=[...componentIds];result.referenceSummary={roots:result.roots.length,nodes:result.nodes,visibleNodes:result.visibleNodes,instances:result.instances,uniqueComponents:componentIds.size,uniqueDestinations:destinationIds.size,missing:result.missingRoots.length+result.missingComponents.length+result.missingDestinations.length,errors:result.componentErrors.length+result.destinationErrors.length};
result.layoutSummary={geometryChecks:result.geometryChecks,expectedScrolling:result.expectedScrolling.length,clippingCandidates:result.clippingCandidates.length,unclippedOverflow:result.unclippedOverflow.length,skippedRotated:result.geometrySkipped.length};
result.checkpoint='Final native audit after reset/history corrections and source dialog addition; default-state geometry only.';result.reactionDestinations=result.reactionDestinations.map(n=>n.id);return result;
