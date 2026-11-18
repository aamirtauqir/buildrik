const board=frame(null,'Approved gap repairs · 20 October 2026',1120,null);page.appendChild(board);board.x=2640;board.y=80;pad(board,24);board.itemSpacing=16;roots.push(board);
text(board,'Review the completed gap repairs',1072,'Area');
text(board,'User-approved fixes · 20 October 2026 · editable Figma design',1072,'Body','ink-soft');
const entries=[
 ['Client Review','276:30862','Six-digit approval, incorrect/expired/rate-limited codes, already-answered recovery, acknowledged receipt, request-changes recovery, phone comments and Desktop/Tablet pin placement.'],
 ['Form submissions','277:392836','Fixed 365-day retention; form + Inbox/Spam/Archived filters; scoped export; permanent deletion; Unspam/Unarchive; exact Inspector returns and updated-count fixtures.'],
 ['Site settings','277:46436','Languages Save and scoped Undo; Analytics destinations; Languages/Security draft guards, exact acknowledged returns and Publish in the same settings area.'],
 ['Publish from resource areas','271:266543','CMS, Assets, Brand, Components and Templates open the Publish tray in place. Closing preserves an active, unknown or acknowledged publish result.'],
 ['CMS recovery','271:257887','Restore as a new record with a new ID and retained original; Admin typed permanent deletion; pending, failure, unknown and acknowledged outcomes.'],
 ['Inspector actions','271:131476','Copy style, Paste style, Save as component and Add interaction. Current class-scope contract, exact selection return, Cancel and Undo are represented.']
];
for(const [label,id,copy]of entries){
 const row=frame(board,label,1072,null);row.itemSpacing=6;const t=text(row,label+' ↗',1072,'Panel','accent');
 t.setRangeHyperlink(0,t.characters.length,{type:'URL',value:'https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id='+id.replace(':','-')});text(row,copy,1072);
}
text(board,'What was checked',1072,'Panel');
text(board,'Independent review separately checked sample geometry, grouping, labels/status and native routes. Corrections were rechecked, including 320px phone and short desktop approval samples. Server outcomes are named review fixtures, not elapsed-time success.',1072);
text(board,'Still pending',1072,'Panel');
text(board,'First run / onboarding waits for the five interviews. Real typing, keyboard/focus, accessibility, service persistence, permissions, actual email/export/publish and full browser playback are not verified. This is design output; no application or live data was changed.',1072,'Body','ink-soft');
text(board,'Future additions or design changes require the user’s permission.',1072,'Label');
const current=await figma.getNodeByIdAsync('262:2');
await Promise.all(current.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
const jump=button(current,'Open approved gap repairs · 20 October','primary',400);link(jump,board.id);mutations.push(current.id,jump.id,...jump.findAll(()=>true).map(n=>n.id));
return await finish();
