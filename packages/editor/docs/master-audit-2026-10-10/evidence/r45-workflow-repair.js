await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const ids=['8843:16833','8843:20492','8912:17353','8843:16845','8843:20504','8843:17103','8843:20774','9064:17596','9064:17597','9064:17599','9064:17586','8841:15284','8841:14865'];
const nodes={};for(const id of ids)nodes[id]=await figma.getNodeByIdAsync(id);
const mutated=new Set(), mark=n=>{mutated.add(n.id);return n;};
const guarded=['8843:16833','8843:20492','9064:17599'];
const reactions=Object.fromEntries(guarded.map(id=>[id,JSON.stringify(nodes[id].reactions)]));
const widths=Object.fromEntries(['8843:17103','8843:20774'].map(id=>[id,JSON.stringify(nodes[id].boundVariables.width)]));
const fontList=new Map();for(const n of Object.values(nodes)){const ts=n.type==='TEXT'?[n]:('findAllWithCriteria'in n?n.findAllWithCriteria({types:['TEXT']}):[]);for(const t of ts)for(const s of t.getStyledTextSegments(['fontName']))fontList.set(JSON.stringify(s.fontName),s.fontName);}
for(const f of fontList.values())await figma.loadFontAsync(f);
const duplicate=nodes['8912:17353'], sourceText=duplicate.findAllWithCriteria({types:['TEXT']})[0];
for(const id of ['8843:16833','8843:20492']){const n=mark(nodes[id]);n.fills=JSON.parse(JSON.stringify(duplicate.fills));for(const t of n.findAllWithCriteria({types:['TEXT']})){mark(t).fills=JSON.parse(JSON.stringify(sourceText.fills));}}
mark(duplicate).visible=false;
for(const [viewportId,siteId] of [['8843:16845','8843:17103'],['8843:20504','8843:20774']]){
const viewport=mark(nodes[viewportId]),site=mark(nodes[siteId]);
viewport.fills=JSON.parse(JSON.stringify(viewport.parent.fills));
viewport.counterAxisAlignItems='CENTER';
site.strokes=JSON.parse(JSON.stringify(nodes['8843:20492'].parent.strokes));
site.strokeWeight=1;site.strokeAlign='INSIDE';
}
const result=mark(nodes['9064:17596']),helper=mark(nodes['9064:17597']),body=mark(nodes['8841:15284']),panel=mark(nodes['8841:14865']),display=nodes['9064:17586'];
body.insertChild(0,helper);helper.x=0;helper.y=0;
helper.setBoundVariable('visible',await figma.variables.getVariableByIdAsync('VariableID:9064:17499'));
helper.textAutoResize='HEIGHT';helper.resize(318,helper.height);helper.layoutSizingHorizontal='FILL';helper.layoutSizingVertical='HUG';
panel.insertChild(panel.children.indexOf(display)+1,result);result.x=0;result.y=0;
result.layoutSizingHorizontal='FILL';result.layoutSizingVertical='HUG';
result.name='R45 / Visibility status and Undo';
return {createdNodeIds:[],mutatedNodeIds:[...mutated],reactionsPreserved:guarded.every(id=>JSON.stringify(nodes[id].reactions)===reactions[id]),widthBindingsPreserved:Object.keys(widths).every(id=>JSON.stringify(nodes[id].boundVariables.width)===widths[id]),undoParent:nodes['9064:17599'].parent.id,resultParent:result.parent.id,resultVisibility:result.boundVariables.visible,duplicateHidden:!duplicate.visible,viewportFills:['8843:16845','8843:20504'].map(id=>({id,fills:nodes[id].fills}))};
