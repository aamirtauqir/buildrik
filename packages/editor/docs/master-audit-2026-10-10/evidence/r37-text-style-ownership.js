await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren = false;
const changed = new Set(), created = new Set(), variableIds = [], mappings = [];
const get = id => figma.getNodeByIdAsync(id);
const plain = v => JSON.parse(JSON.stringify(v));
async function text(n, value) {
  for (const s of n.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName);
  n.setBoundVariable('characters', null);
  n.characters = value;
  changed.add(n.id);
}
const source = [
  ['text', '8842:14565', '8842:14553', 'VariableID:8842:14567', 'VariableID:8847:16439'],
  ['heading', '8843:17034', '8843:17016', 'VariableID:8843:17036', 'VariableID:8847:16516'],
  ['paragraph', '8843:17332', '8843:17320', 'VariableID:8843:17334', 'VariableID:8847:16593'],
  ['label', '8843:17630', '8843:17618', 'VariableID:8843:17632', 'VariableID:8847:16670'],
];
for (const [type, controlId, styleId, oldId, stateId] of source) {
  const control = await get(controlId), style = await get(styleId);
  const reactions = style.reactions.map(r => ({trigger:plain(r.trigger),actions:plain(r.actions || [r.action])}));
  for (const r of reactions) {
    const action = r.actions.find(a => a.type === 'SET_VARIABLE' && a.variableId === 'VariableID:8841:14935');
    if (!action) throw new Error('Missing typography section state: '+type);
    action.variableValue = {type:'BOOLEAN',resolvedType:'BOOLEAN',value:true};
  }
  await control.setReactionsAsync(reactions);
  control.name = 'Action / Text style → Style'; changed.add(control.id);
  for (const t of control.findAllWithCriteria({types:['TEXT']})) await text(t, 'Edit in Style →');
  const oldVar = await figma.variables.getVariableByIdAsync(oldId);
  const state = await figma.variables.getVariableByIdAsync(stateId);
  for (const mode of Object.keys(state.valuesByMode)) state.setValueForMode(mode, Object.values(oldVar.valuesByMode)[0]);
  variableIds.push(state.id);
  mappings.push({type,control:controlId,styleAction:styleId,canonicalState:stateId});
}
const picker = await get('8844:264727');
const template = await get('8844:264730');
for (const t of template.findAllWithCriteria({types:['TEXT']})) {
  for (const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName);
}
const options = ['Heading 1','Heading 2','Heading 3','Sub-heading','Body large','Body text','Caption','Caption XS','Custom'];
const optionIds=[];
for (const label of options) {
  let button = picker.children.find(n=>n.name==='Action / '+label);
  if (!button) {
    button=template.clone();picker.appendChild(button);created.add(button.id);
    for (const n of button.findAll(()=>true)) created.add(n.id);
  }
  button.name='Action / '+label;changed.add(button.id);
  for (const t of button.findAllWithCriteria({types:['TEXT']})) await text(t,label);
  await button.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[
    {type:'SET_VARIABLE',variableId:'VariableID:8841:14937',variableValue:{type:'STRING',resolvedType:'STRING',value:label}},
    {type:'CLOSE'}
  ]}]);
  picker.insertChild(2+optionIds.length,button);optionIds.push(button.id);
}
await text(await get('8844:264728'),'Text style');
await text(await get('8844:264729'),'Choose a text style for the selected element. Manage shared styles in Brand.');
picker.name='R37 / Style / Text style choices';changed.add(picker.id);
const cancel=await get('8844:264739');picker.appendChild(cancel);changed.add(cancel.id);
await picker.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[{type:'CLOSE'}]}]);
picker.primaryAxisSizingMode='AUTO';
return {createdNodeIds:[...created],mutatedNodeIds:[...changed],mutatedVariableIds:variableIds,mappings,picker:picker.id,options,optionIds,bounds:{width:picker.width,height:picker.height},remaining:'Token size rendering, breakpoint-specific typography, reset/undo and complete validation remain open.'};
