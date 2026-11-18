// Read-only native reference and default-state layout audit. No canvas/variable mutations.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const scopes=[['Form','8843:30589'],['Form Admin','9026:17615'],['Fields manager','9024:17458'],['Field refusal','9024:17500'],['Field type chooser','9024:17514'],['Field defaults','9024:17539'],['Field conversion review','9024:17557'],['Remote manager','9026:17446'],['Remote loading','9026:17476'],['Remote saving','9026:17487'],['Remote URL','9026:17498'],['Remote message','9026:17520'],['Remote recipient','9026:17537'],['Remote refusal','9026:17556'],['Remote exit','9026:17570']];
const result={scope:'Bounded native audit of two Form roots, five field dialogs present in the field manifest, and eight remote dialogs. Current authored visibility/geometry only, not all prototype states or browser playback.',scopeInventoryNote:'Requested six field dialogs; manifest contains five distinct field dialog frames. No missing sixth node was inferred or invented.',roots:[],missingRoots:[],nodes:0,visibleNodes:0,instances:0,componentIds:[],missingComponents:[],componentErrors:[],reactionDestinations:[],missingDestinations:[],destinationErrors:[],geometryChecks:0,expectedScrolling:[],clippingCandidates:[],unclippedOverflow:[],geometrySkipped:[],newSavedValueTexts:[],mutatedNodeIds:[],mutatedVariableIds:[]};
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
for(const id of ['9028:17506','9028:17508']){const n=await figma.getNodeByIdAsync(id);result.newSavedValueTexts.push(n?{id,type:n.type,parent:n.parent?.id,visible:n.visible,width:n.width,height:n.height,characters:n.type==='TEXT'?n.characters:null,boundVariable:n.type==='TEXT'?n.boundVariables?.characters:null}:{id,missing:true});}
result.componentIds=[...componentIds];result.referenceSummary={roots:result.roots.length,instances:result.instances,uniqueComponents:componentIds.size,uniqueDestinations:destinationIds.size,missing:result.missingRoots.length+result.missingComponents.length+result.missingDestinations.length,errors:result.componentErrors.length+result.destinationErrors.length};
result.layoutSummary={geometryChecks:result.geometryChecks,expectedScrolling:result.expectedScrolling.length,clippingCandidates:result.clippingCandidates.length,unclippedOverflow:result.unclippedOverflow.length,skippedRotated:result.geometrySkipped.length};
return result;
