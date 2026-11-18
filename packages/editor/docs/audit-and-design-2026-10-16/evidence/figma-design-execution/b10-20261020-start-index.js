// Prepend continuation-helpers.js with page0:1.
const old=await figma.getNodeByIdAsync('14:2');
await Promise.all(old.findAllWithCriteria({types:['TEXT']}).map(t=>figma.loadFontAsync(t.fontName)));
for(const t of old.findAllWithCriteria({types:['TEXT']})){
 if(t.characters.startsWith('Current visual checkpoint'))t.characters='Current design review · 20 October 2026';
 if(t.characters==='B3 Pages additions and remaining work')t.characters='Current completion scope';
 if(t.characters.startsWith('P44–P83 on 03'))t.characters='Editor, Inspector, CMS, Assets, Brand, Components, Templates, Settings, delivery and recovery now have extended native design states. Current Inspector mapping accounts for all 122 historical rows, with superseded/deferred items explicitly classified. Use the review index below for current entry points. Screens and prototype links are illustrative; individual controls are not an implemented application.';
 if(t.characters.startsWith('Authority: PRODUCT-DESIGN-BRIEF'))t.characters='Authority: PRODUCT-DESIGN-BRIEF → owner decisions → shared contracts → current panels. Current evidence: evidence/figma-design-execution/COMPLETION-2026-10-20.md and current-frame-inventory-2026-10-20.json. B9 first-run remains pending: the user confirmed interviews are not available. Research, keyboard/accessibility playback, real server behavior and application acceptance are not verified.';
 mutations.push(t.id);
}
const board=frame(null,'Current design review index · 2026-10-20',1120,null);page.appendChild(board);board.x=1320;board.y=80;pad(board,24);board.itemSpacing=16;roots.push(board);
text(board,'Start with the task you want to review',1072,'Area');
text(board,'Editable native screens · existing approved file · design only',1072,'Body','ink-soft');
const entries=[
 ['Editor · core editing, Pages and canvas','3:4','Page navigation, draft guards, creation, organization, Layers and guides.'],
 ['Inspector · selected-object controls','3:5','Content, Style, Behavior and Effects; 122-row disposition map, 69 blocks and 120 native routes.'],
 ['CMS · collections and imports','254:74075','Create collection, starter schema, page-per-record option, CSV mapping and partial JSON/CSV results.'],
 ['CMS · stored-value protection','257:51073','Five-record conversion preview, typed data-loss consequences and honest endpoint fallbacks.'],
 ['CMS · Recently deleted','257:54485','Records, fields, collections and sources; exact restore, slug collisions and bulk partial recovery.'],
 ['CMS · Site variables','260:235689','Keys, values, placeholder usages, validation, document save and Undo.'],
 ['Templates · recovery','251:73352','Restore, offline/failure, permanent deletion and partial import recovery.'],
 ['Assets, Brand and Components','3:6','Shared resource management, contextual application, reusable components, imports and packages.'],
 ['Settings · Analytics','245:45159','Provider configuration, verification, saving, errors, permissions and compact viewport.'],
 ['Settings · Security headers','245:47988','Header policies, custom HSTS age, role restrictions, conflict and save feedback.'],
 ['Publish, Review, Issues and Export','3:7','Delivery tasks, external review and owner-specific failures and returns.'],
 ['History, access and recovery','3:8','Presence, conflicts, plans, backups and area-aware Undo.'],
 ['Journey review','3:10','Existing linked core journeys; outcome review boards are outside product UI.']
];
for(const [label,id,desc]of entries){const row=frame(board,label,1072,null);row.itemSpacing=4;const t=text(row,label+' ↗',1072,'Panel','accent');t.setRangeHyperlink(0,t.characters.length,{type:'URL',value:'https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id='+id.replace(':','-')});text(row,desc,1072,'Body','ink-soft');}
text(board,'First run / onboarding · pending interviews',1072,'Panel');text(board,'The First run page intentionally remains empty. Five approved interviews and the associated first-run test are still required. Other screen families can be reviewed independently.',1072,'Body','ink-soft');
text(board,'How to read the results',1072,'Panel');text(board,'DRAWN = editable state exists. REVIEWED = named visual/structural checks passed for that sample. Server outcomes are separate fixtures, not elapsed-time success. No whole-product runtime or accessibility certification is implied. Native links do not substitute for real typing, keyboard, assistive technology or persistence tests.',1072,'Body','ink-soft');
return await finish();
