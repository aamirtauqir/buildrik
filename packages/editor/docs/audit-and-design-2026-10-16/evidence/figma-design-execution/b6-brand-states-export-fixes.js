// B6 Brand B2 fixes: compact topbar and bottom bar fill 1280 exactly; add Brand completion handoff board.
const fixed=[];
for(const id of ['212:40091','212:40324','212:40564']){const r=await figma.getNodeByIdAsync(id);
 for(const [barName,flexName] of [['Topbar / site scope','Flexible space'],['Bottom bar / pages and save status','Created page tabs']]){const bar=r.findOne(n=>n.name===barName);const flex=bar.findOne(n=>n.name===flexName);
  const used=bar.children.filter(c=>c.visible&&c.layoutPositioning!=='ABSOLUTE').reduce((s,c)=>s+c.width,0)+bar.itemSpacing*Math.max(0,bar.children.filter(c=>c.visible).length-1)+bar.paddingLeft+bar.paddingRight;
  const delta=1280-used;flex.resize(Math.max(40,flex.width+delta),flex.height);fixed.push({id,barName,delta,bar:bar.width});}}
const board=frame(null,'B6 Brand completion / B21–B53 handoff',1440,null,'VERTICAL','bg-panel');page.appendChild(board);board.x=80;board.y=batchY;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Brand completion B21–B53 · design output, not runtime',1392,'Area');
for(const l of [
 'B21–27 every token kind and reusable-style page: Typography (families + font-size tokens, Manage site fonts › Assets › Fonts A23), Spacing presets/steps, Other kinds list of 11, Radius add/rename/delete with local invalid draft, Type styles · Presets read-only catalogue with Browse section blocks in Add, Classes.',
 'B28–31 delete replaces before delete (Cancel default), delete refused while usage is unknown, first-edit reach note for tokens used in more than 20 places, Inspector Edit token door with ‹ Back to Heading. Cross-page return to the Inspector row is annotated, not prototyped (Figma links stay on one page).',
 'B32–38 From logo or URL ships without AI (owner P3): entry, reading, refused, timed out, preview with Light/Dark locked, applied with restore point and one Undo, offline (URL needs a connection, logo still works). Depends on moving extraction off the dsAi flag.',
 'B39–41 Restore points popover → restored receipt with Undo; Review changes popover with per-change Revert.',
 'B42–47 loading skeleton with history disabled, offline, save failed in status, leave guard after a failed save (Keep editing default), update held is not a permission message, No brand set first run.',
 'B48–49 Export CSS/JSON/Tailwind with dark-value loss stated; import receipt counts equal the dry-run B16 (8 applied, 2 unsupported).',
 'B50 a second preview source asks to discard the current preview (Keep previewing default). B51–53 work area below 1280: navigation and website preview become header toggles.',
 'Not verified: keyboard/focus order, screen reader, real extraction, persistence, prototype playback. Starter names stay placeholder copy until copy review (N8).'])text(board,l,1392,'Body');
return {fixed,...(await finish())};
