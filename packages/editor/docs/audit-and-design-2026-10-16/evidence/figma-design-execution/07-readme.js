const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
if(page.children.length)throw new Error('Read me already exists');
const board=frame('Start here / first design checkpoint',1120,null);board.x=80;board.y=80;pad(board,48);gap(board,24);
txt(board,'Buildrick','Area');txt(board,'An editor that keeps the task in context.','Dialog');
txt(board,'First visual checkpoint · B0–B2 · 18 October 2026','Label','accent');
txt(board,'Proposed design from approved source documents. Editable native layers and shared components. Application behavior is not runtime verified.','Body','ink-soft',1024);
divider(board,1024);
const nav=frame('Review routes',1024,null,'VERTICAL',null,board);gap(nav,12);
for(const[label,id,detail]of[
 ['01 / Start the editing journey','7:18654','Open an existing site → Add Text → Layers → Content → Style → Tablet override → reset → Undo/Redo → Preview → exact return.'],
 ['02 / Inspect foundations','3:101','Light chrome · semantic color aliases · Inter + Geist Mono · approved geometry.'],
 ['03 / Review component states','4:656','Shared components, variants and editable Lucide vectors. Construction masters are separate from the review specimen.'],
 ['04 / Review failure and recovery','10:2199','Locked/stale insertion, Mixed, pending/failed save, focus restoration and narrow target visibility.'],
 ['05 / Check responsive layouts','11:2','1024, 1280, 1366, 1440 and 1920 widths; short height; threshold samples.']
]){const card=frame(label,1024,null,'VERTICAL','bg-subtle',nav);pad(card,16);gap(card,8);radius(card,'sm');const t=txt(card,label,'Panel');t.hyperlink={type:'URL',value:'https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id='+id.replace(':','-')};txt(card,detail,'Body','ink-soft',992);}
txt(board,'How to review the prototype','Panel');
txt(board,'Start at J-F1.01 in Present mode. Follow Add → Text → Layers → text field → Style → Tablet → Font size → Remove Tablet override → Undo → Redo → Preview → Back to editor. A click on an editing field advances to an illustrative committed state. It does not type, save or execute undo.','Body','ink-soft',1024);
txt(board,'What stays consistent','Panel');
txt(board,'Site settings owns site-wide work. Rail owns tools and resource areas. Inspector edits the selected object. Canvas toolbar owns breakpoint and view. Bottom bar owns Pages and save status. All J-F1 frames refer to Home and stable object text-hero-01.','Body','ink-soft',1024);
txt(board,'Reading status honestly','Panel');
txt(board,'REPRESENTED = visible in these frames. DESIGN REVIEW = heuristic visual/structural inspection. RUNTIME VERIFIED requires implementation and browser evidence; no such claim is made here. A frame is not complete coverage of its whole module.','Body','ink-soft',1024);
txt(board,'Remaining work and gates','Panel');
txt(board,'B3–B8 expand complete controls, resource areas and delivery flows. B9 first-run design waits for the five interviews. The separate five-user core-loop test waits for review/publish paths. No interviews, user tests, outreach, publish, deployment or application changes have been performed.','Body','ink-soft',1024);
txt(board,'Sources and open questions','Panel');
txt(board,'Authority: PRODUCT-DESIGN-BRIEF → owner decisions → shared contracts → current panels → SC-27 design system. P05’s amended toolbar rule wins over P12’s old estimate. Focus mode exits through Show panels; special Inspector-door semantics remain separately unresolved. Execution ledgers and audit evidence live under docs/audit-and-design-2026-10-16/evidence/figma-design-execution/.','Body','ink-soft',1024);
await Promise.all(pending);
return {createdNodeIds:created,readmeFrame:board.id,width:board.width,height:board.height};
