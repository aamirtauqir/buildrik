// B6 Components handoff board.
const board=frame(null,'B6 Components / K01–K39 handoff',1440,null,'VERTICAL','bg-panel');page.appendChild(board);board.x=80;board.y=batchY;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Components workspace K01–K39 · design output, not runtime',1392,'Area');
for(const l of [
 'Doors (N1): K01 Add header “Components ›” and K22 Layers instance menu “Go to main component ›”. No rail item is active in the workspace; Back names the origin.',
 'Sections (N2): K02 This site (local + adopted, each once), K03 This page, K04 Component library = accessible items not on this site, Load more after 50, restricted item explained. Rows 40px: name, scope chip, uses, status chip, row menu.',
 'Library revisions: K05 Review update v4→v5 with one conflict choice → K06 applied receipt; Keep current returns unchanged. K07 local changes, Share update as v3 (Admin), K08 Editor sees it disabled with reason.',
 'Create: K09 scope chosen before commit (Component library default), K10 duplicate name is an inline warning with Create enabled, K11 at 100 of 100 Create disabled with reason.',
 'Update from selection (SC-15 class a): K12 → K13 Choose on canvas → K14 source chosen → Return to component review → K15 Update → K16 Undo receipt. Cancel returns unchanged.',
 'K17 Detach all and K18 Delete: no dialog, Undo receipts; K18 links to K19 Recently deleted (30 days, SC-32 bulk bar) → K20 typed permanent delete (Admin). K21 Used on with Locate.',
 'States: K23 offline (server actions need a connection), K24 library load error with Retry, K25 This page empty, K26 200-char name truncation + tooltip, K27 1280×640.',
 'Packages (PKG-01): K28 export blocked by an inaccessible image, K29 ready, K30 Download started. Import K31 file → K32 roots + destination → K33 check before any write (one root blocked) → K34 map styles/CMS → K35 review → K36 importing (close keeps it running) → K37 unknown outcome checks the receipt before retry → K38 receipt with Undo import / Review imported resources → K39 imported but Insert failed.',
 'Deferred to B4 Inspector: Reset to main component confirm (class b), Variant unavailable, breakpoint/state instance overrides (C7). Variant authoring deferred by owner P4.',
 'Not verified: keyboard/focus, screen reader, playback, server revisions (engineering), package validator, persistence.'])text(board,l,1392,'Body');
return await finish();
