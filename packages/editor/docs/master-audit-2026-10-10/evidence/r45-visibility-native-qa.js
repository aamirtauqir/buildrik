// Read-only native reference and default-state layout audit. No canvas/variable mutations.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const scopes=[['Heading','8843:16808'],['Image','8843:20467'],['Shared Style','8841:14864'],['Display chooser','8844:264650'],['Refusal','9064:17601'],['Heading review','9064:20058'],['Image review','9064:20114']];
const result={scope:'Bounded R45 native audit of Heading, Image, Shared Style, Display chooser, refusal and two review dialogs. Current authored default visibility/geometry only; no variable changes, prototype-state traversal or browser playback.',scopeInventoryNote:'R45 IDs from r45-visibility-mutation.json plus targeted native IDs; older alternate routes inspected only to determine fixture ownership.',roots:[],missingRoots:[],nodes:0,visibleNodes:0,instances:0,componentIds:[],missingComponents:[],componentErrors:[],reactionDestinations:[],missingDestinations:[],destinationErrors:[],geometryChecks:0,expectedScrolling:[],clippingCandidates:[],unclippedOverflow:[],geometrySkipped:[],selectorRow:null,captions:[],deviceWidthBindings:[],mutatedNodeIds:[],mutatedVariableIds:[]};
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
const variableRefs=new Set();result.missingVariables=[];result.variableErrors=[];
function refs(x){if(!x||typeof x!=='object')return;if(x.type==='VARIABLE_ALIAS'&&typeof x.id==='string')variableRefs.add(x.id);if(x.type==='SET_VARIABLE'&&x.variableId)variableRefs.add(x.variableId);for(const value of Object.values(x))if(value&&typeof value==='object'){if(Array.isArray(value))for(const z of value)refs(z);else refs(value);}}
function flatten(a,out=[]){for(const x of a||[]){out.push(x);if(x.type==='CONDITIONAL')for(const b of x.conditionalBlocks||[])flatten(b.actions,out);}return out;}
function actions(n){return flatten((n.reactions||[]).flatMap(r=>r.actions||[]));}
function aliasName(id){return byId.get(id)?.name||null;}
function dim(n){return {id:n.id,name:n.name,type:n.type,parentId:n.parent?.id,width:n.width,height:n.height,visible:n.visible,horizontal:n.layoutSizingHorizontal,vertical:n.layoutSizingVertical,layoutMode:n.layoutMode,boundVariables:Object.fromEntries(Object.entries(n.boundVariables||{}).filter(([k])=>['visible','width','height','characters'].includes(k))),text:n.type==='TEXT'?n.characters:undefined,textAutoResize:n.type==='TEXT'?n.textAutoResize:undefined};}
for(const id of visited){const n=await figma.getNodeByIdAsync(id);refs(n.boundVariables);if('fills'in n)refs(n.fills);if('strokes'in n)refs(n.strokes);if('effects'in n)refs(n.effects);if('reactions'in n)refs(n.reactions);}
for(const id of variableRefs){try{let v=byId.get(id);if(!v){v=await figma.variables.getVariableByIdAsync(id);if(v)byId.set(id,v);}if(!v)result.missingVariables.push(id);else refs(v.valuesByMode);}catch(e){result.variableErrors.push({id,error:String(e)});}}
result.boundVariableReferences=variableRefs.size;
result.selectedBindings=[];result.tabletGates=[];result.tabletColors=[];result.controlStructure=[];
for(const[name,selected,desktop,tablet,mobile,tabs]of [['heading','8843:17107','8843:16842','9064:20045','8843:16843',['8843:17018','8843:17020']],['image','8843:20778','8843:20501','9064:20101','8843:20502',['8843:20677','8843:20679']]]){
 const n=await figma.getNodeByIdAsync(selected),want=byName.get('r45/visibility/'+name+'/visible').id;result.selectedBindings.push({...dim(n),expectedVisibilityVariable:want,matches:n.boundVariables?.visible?.id===want});
 for(const id of tabs){const x=await figma.getNodeByIdAsync(id),want=byName.get('r45/visibility/'+name+'/normal').id;result.tabletGates.push({id,name:x.name,binding:x.boundVariables?.visible,expected:want,matches:x.boundVariables?.visible?.id===want});}
 for(const[device,id]of [['Desktop',desktop],['Tablet',tablet],['Mobile',mobile]]){const x=await figma.getNodeByIdAsync(id);const writes=actions(x).filter(a=>a.type==='SET_VARIABLE'&&a.variableValue?.resolvedType==='COLOR');result.tabletColors.push({target:name,device,id,name:x.name,fillBindings:x.fills?.map(p=>p.boundVariables||{}),textFillBindings:x.findAll(n=>n.type==='TEXT').map(t=>({id:t.id,bindings:t.fills?.map(p=>p.boundVariables||{})})),colorWrites:writes.map(a=>[a.variableId,a.variableValue.value?.id])});}
}
for(const id of ['9064:17586','8841:14889','9064:17593','8841:14882','8841:14884','8841:15282','8841:15284','9064:20049','9064:20105']){const n=await figma.getNodeByIdAsync(id);result.controlStructure.push(dim(n));}
const conditionVars=['VariableID:8886:17424','VariableID:8886:17426','VariableID:8886:17428','VariableID:8886:17430','VariableID:8886:17432','VariableID:8886:17434'];
function layoutWrites(a,guards=[],out=[]){for(const x of a||[]){if(x.type==='SET_VARIABLE'&&conditionVars.includes(x.variableId))out.push({id:x.variableId,name:aliasName(x.variableId),value:x.variableValue.value,guardedByInactiveFixture:guards.some(g=>JSON.stringify(g).includes(byName.get('r45/visibility/active').id)&&JSON.stringify(g).includes('false'))});if(x.type==='CONDITIONAL')for(const b of x.conditionalBlocks||[])layoutWrites(b.actions,[...guards,b.condition||'else'],out);}return out;}
result.flexGridEligibility=[];for(const id of ['8844:264656','8844:264659']){const n=await figma.getNodeByIdAsync(id);result.flexGridEligibility.push({id,name:n.name,layoutWrites:layoutWrites((n.reactions||[]).flatMap(r=>r.actions||[]))});}
result.alternateRoutes=[];
for(const id of ['8843:17034','8905:18143','8468:244789','8468:244842','8507:2858']){const n=await figma.getNodeByIdAsync(id);if(!n){result.alternateRoutes.push({id,missing:true});continue;}const ancestors=[];let r=n;while(r.parent&&r.parent.type!=='PAGE'){r=r.parent;ancestors.push({id:r.id,name:r.name});}const a=actions(n);result.alternateRoutes.push({id,name:n.name,root:{id:r.id,name:r.name},ancestors,callerWrites:a.filter(x=>x.type==='SET_VARIABLE'&&x.variableId==='VariableID:8841:14860').map(x=>x.variableValue.value),r45WriteNames:[...new Set(a.filter(x=>x.type==='SET_VARIABLE'&&/^r45\/visibility\//.test(aliasName(x.variableId)||'')).map(x=>aliasName(x.variableId)))].slice(0,8),r45WriteCount:a.filter(x=>x.type==='SET_VARIABLE'&&/^r45\/visibility\//.test(aliasName(x.variableId)||'')).length,selectedContext:r.findAll(n=>n.type==='TEXT'&&/selected|heading|image|desktop|mobile|tablet|base|mixed/i.test(n.characters)).slice(0,6).map(t=>({id:t.id,text:t.characters})),selectedNodes:r.findAll(n=>/Selected \/|Selected element|selection/i.test(n.name)).slice(0,6).map(n=>({id:n.id,name:n.name,visibilityBinding:n.boundVariables?.visible}))});}
result.referenceSummary={roots:result.roots.length,nodes:result.nodes,visibleNodes:result.visibleNodes,instances:result.instances,uniqueComponents:componentIds.size,uniqueDestinations:destinationIds.size,referencedVariables:variableRefs.size,missing:result.missingRoots.length+result.missingComponents.length+result.missingDestinations.length+result.missingVariables.length,errors:result.componentErrors.length+result.destinationErrors.length+result.variableErrors.length};result.componentIds=[...componentIds];
result.layoutSummary={geometryChecks:result.geometryChecks,expectedScrolling:result.expectedScrolling.length,clippingCandidates:result.clippingCandidates.length,unclippedOverflow:result.unclippedOverflow.length,skippedRotated:result.geometrySkipped.length};
result.reactionDestinations=result.reactionDestinations.map(n=>n.id);result.caveats=['Current authored default geometry only; no native variable mutation, browser state traversal or provider/source runtime testing.','Tablet tab/color gates are inspected bindings/actions, not newly browser-played interactions.','Older alternate routes are not assigned finite Heading/Image ownership by caller string alone.','Flex/Grid value changes do not establish actual Flex/Grid layout or dependent-control eligibility in this bounded visibility task.'];return result;
