// Read-only native reference and default-state layout audit. No canvas/variable mutations.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const scopes=[['Select','8843:19020'],['Form','8843:30589'],['Form Admin','9026:17615'],['Select options','9035:17710'],['Select details','9035:17756'],['Select refusal','9035:17777'],['Select conversion refusal','9035:17791'],['Select confirmation','9035:17806'],['Form fields manager / four selectors','9024:17458']];
const result={scope:'Bounded native audit of Select, Form and Admin roots, five R43 dialogs, plus the existing Form fields manager containing the four-selector row. Current authored visibility/geometry only; no variable changes, prototype-state traversal or browser playback.',scopeInventoryNote:'Five R43 dialogs verified from r43-select-mutation.json. Existing R42 Form fields manager added specifically to inspect four-selector layout.',roots:[],missingRoots:[],nodes:0,visibleNodes:0,instances:0,componentIds:[],missingComponents:[],componentErrors:[],reactionDestinations:[],missingDestinations:[],destinationErrors:[],geometryChecks:0,expectedScrolling:[],clippingCandidates:[],unclippedOverflow:[],geometrySkipped:[],selectorRow:null,captions:[],deviceWidthBindings:[],mutatedNodeIds:[],mutatedVariableIds:[]};
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
const variables=await figma.variables.getLocalVariablesAsync(),byId=new Map(variables.map(v=>[v.id,v]));
const captionVar=variables.find(v=>v.name==='r43/select/caption');
result.deviceRoutes=[];
function deviceWrites(actions,out){for(const a of actions||[]){if(a.type==='SET_VARIABLE'&&['VariableID:8843:19311','VariableID:8843:30915'].includes(a.variableId))out.push({variableId:a.variableId,value:a.variableValue.value});if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks||[])deviceWrites(b.actions,out);}}
function dimensions(n){return {id:n.id,name:n.name,type:n.type,width:n.width,height:n.height,horizontal:n.layoutSizingHorizontal,vertical:n.layoutSizingVertical,minWidth:n.minWidth,maxWidth:n.maxWidth,padding:'paddingLeft'in n?[n.paddingLeft,n.paddingRight,n.paddingTop,n.paddingBottom]:undefined,text:n.type==='TEXT'?n.characters:undefined,textAutoResize:n.type==='TEXT'?n.textAutoResize:undefined,boundCharacters:n.type==='TEXT'?n.boundVariables?.characters:undefined};}
const row=await figma.getNodeByIdAsync('9024:17469');result.selectorRow=row?{...dimensions(row),layoutMode:row.layoutMode,itemSpacing:row.itemSpacing,children:row.children.map(n=>({...dimensions(n),texts:n.type==='TEXT'?[]:n.findAll(c=>c.type==='TEXT').map(dimensions)}))}:{missing:true};
for(const id of visited){const n=await figma.getNodeByIdAsync(id);if(n.type==='TEXT'&&['Desktop','Mobile'].includes(n.characters)){const writes=[];for(const r of n.parent?.reactions||[])deviceWrites(r.actions,writes);if(writes.length)result.deviceRoutes.push({nodeId:n.parent.id,label:n.characters,writes});}if(n.type==='TEXT'&&n.boundVariables?.characters?.id===captionVar?.id){const ancestors=[];let p=n.parent;while(p&&p.type!=='PAGE'&&ancestors.length<4){ancestors.push(dimensions(p));p=p.parent;}result.captions.push({...dimensions(n),ancestors});}if(n.boundVariables?.width){const v=byId.get(n.boundVariables.width.id);if(v&&/viewport/.test(v.name))result.deviceWidthBindings.push({node:dimensions(n),variable:{id:v.id,name:v.name,values:v.valuesByMode}});}}
result.mobileWidthLimit='Mobile widths are not executed or measured in this read-only audit. Width bindings, FILL/HUG and text wrapping metadata are recorded; current default geometry does not establish every caption/default combination fits after switching devices.';

result.componentIds=[...componentIds];result.referenceSummary={roots:result.roots.length,instances:result.instances,uniqueComponents:componentIds.size,uniqueDestinations:destinationIds.size,missing:result.missingRoots.length+result.missingComponents.length+result.missingDestinations.length,errors:result.componentErrors.length+result.destinationErrors.length};
result.layoutSummary={geometryChecks:result.geometryChecks,expectedScrolling:result.expectedScrolling.length,clippingCandidates:result.clippingCandidates.length,unclippedOverflow:result.unclippedOverflow.length,skippedRotated:result.geometrySkipped.length};
return result;
