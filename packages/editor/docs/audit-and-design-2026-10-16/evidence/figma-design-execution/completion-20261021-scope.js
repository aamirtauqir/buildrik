// Appended to continuation helpers with page = 3:3. Reuses existing foundations.
if(page.children.some(n=>n.name==='Inspector/StyleScope'))throw Error('Scope component already exists');
const c=figma.createComponent();page.appendChild(c);c.name='Inspector/StyleScope';c.layoutMode='VERTICAL';c.resize(300,1);c.primaryAxisSizingMode='AUTO';c.counterAxisSizingMode='FIXED';c.fills=[paint('bg-panel')];pad(c,12);c.setBoundVariable('itemSpacing',V['spacing/8']);c.x=80;c.y=batchY;
c.description='One selector scope used by both Style and Effects. Class chain owns rules at the shown breakpoint and state. Local scope edits only the selected element. Counts describe all matching uses, including locked users. Preserve target, scope and layer when changing tabs. Buttons are reachable by keyboard in implementation; selected mode uses text plus visual state.';
text(c,'Styling',276,'Section');
const sel=button(c,'.hero-heading','secondary',276);sel.name='Selector trigger';
const count=text(c,'1 on this page · 2 on site',276,'Meta','ink-soft');count.name='Usage count';
const modes=frame(c,'Editing scope',276,32,'HORIZONTAL',null);modes.itemSpacing=8;
const shared=button(modes,'Class','secondary',88);shared.name='Class scope';shared.fills=[paint('accent-subtle')];
const local=button(modes,'This element only','ghost',180);local.name='Local scope';
const context=frame(c,'Responsive layer',276,32,'HORIZONTAL',null);context.itemSpacing=8;
button(context,'Desktop','secondary',132).name='Breakpoint';button(context,'Default','secondary',136).name='Authored state';
const hint=text(c,'Changes apply to both uses.',276,'Meta','ink-soft');hint.name='Scope note';
for(const [key,n]of [['Usage',count],['Notice',hint]]){const prop=c.addComponentProperty(key,'TEXT',n.characters);n.componentPropertyReferences={characters:prop};}
roots.push(c);await Promise.all(pending);
const show=frame(page,'Completion · Shared style scope specimen',1012,null);show.x=500;show.y=batchY;pad(show,24);show.itemSpacing=16;roots.push(show);text(show,'Shared styling, explicit scope',964,'Area');const rr=frame(show,'Class and local examples',964,null,'HORIZONTAL',null);rr.itemSpacing=16;const a=c.createInstance();rr.appendChild(a);const b=c.createInstance();rr.appendChild(b);b.findOne(n=>n.name==='Class scope').fills=[];b.findOne(n=>n.name==='Local scope').fills=[paint('accent-subtle')];b.findOne(n=>n.name==='Scope note').characters='Only Hero heading changes. Class values remain.';
return await finish();
