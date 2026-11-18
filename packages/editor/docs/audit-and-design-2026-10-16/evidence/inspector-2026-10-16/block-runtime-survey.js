// Read-only audit of product code. Builds temporary fixtures only in the empty,
// standalone localhost demo. No saved project, server write or publish operation.
(async () => {
  if (location.hostname !== 'localhost' || location.port !== '5050' || location.search)
    throw new Error('This survey requires the standalone localhost:5050 demo.');
  const composer = window.__bkComposer;
  const page = composer?.elements.getActivePage();
  const root = page && composer.elements.getElement(page.root.id);
  if (!root || root.getChildren().length) throw new Error('Requires an empty demo page; existing content will not be changed.');
  const { getBlockDefinitions, insertBlock } = await import('/@fs/Users/shahg/Desktop/pencil/buildrik/packages/editor/src/blocks/blockRegistry.ts');
  const records = [];
  const pause = () => new Promise(resolve => setTimeout(resolve, 100));
  const tree = el => ({id:el.getId(),type:el.getType(),tag:el.getTagName(),attributes:el.toJSON().attributes || {},children:el.getChildren().map(tree)});
  try {
    for (const block of getBlockDefinitions()) {
      const id = insertBlock(composer, block, root.getId());
      const selected = id && composer.elements.getElement(id);
      if (selected) composer.selection.select(selected);
      await pause();
      const inspector = document.querySelector('[data-testid="inspector-panel"]');
      records.push({block_id:block.id,label:block.label,declared_type:block.elementType,returned_id:id || null,roots:root.getChildren().map(tree),inspector_visible:!!inspector,inspector_identity:document.querySelector('[data-testid="inspector-element-name"]')?.textContent || null,inspector_sections:inspector ? [...inspector.querySelectorAll('[data-testid^="inspector-secname-"]')].map(n=>n.textContent) : [],inspector_text:inspector?.innerText || null});
      composer.selection.clear();
      for (const child of [...root.getChildren()]) composer.elements.removeElement(child.getId());
    }
  } finally {
    composer.selection.clear();
    for (const child of [...root.getChildren()]) composer.elements.removeElement(child.getId());
  }
  window.__b69Survey = {date:new Date().toISOString(),scope:'Registry insertion and default selected-root Inspector in empty standalone demo; not Add discoverability, per-control edits, save/reopen, preview or published behavior.',records};
  return {count:records.length,inserted:records.filter(x=>x.returned_id && x.roots.length).length,inspectorVisible:records.filter(x=>x.inspector_visible).length,compoundSiblings:records.filter(x=>x.roots.length>1).map(x=>x.block_id),typeMismatch:records.filter(x=>x.roots.find(r=>r.id===x.returned_id)?.type!==x.declared_type).map(x=>({id:x.block_id,declared:x.declared_type,actual:x.roots.find(r=>r.id===x.returned_id)?.type})),emptyAfter:root.getChildren().length===0};
})()
