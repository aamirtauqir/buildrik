// Merge parts/03-G1.md, 03-G2.md, 03-G3.md → 03-gap-matrix.md and print a coverage report.
// Usage: node dump/build-03.mjs   (run from docs/audit-2026-09-21)
import fs from 'node:fs';
const parts = ['G1','G2','G3'].map(g => ({ g, path: `parts/03-${g}.md`, text: fs.existsSync(`parts/03-${g}.md`) ? fs.readFileSync(`parts/03-${g}.md`,'utf8') : '' }));
const codeRows = JSON.parse(fs.readFileSync('dump/code-rows.json','utf8'));
const fams = JSON.parse(fs.readFileSync('dump/figma-families.json','utf8'));
const famBoards = new Map(Object.entries(fams)); // family → [node ids]
const live = JSON.parse(fs.readFileSync('dump/live-all.json','utf8')); const liveById = new Map(live.map(r=>[r.id,r]));
const secNames = Object.fromEntries(fs.readFileSync('dump/sections.txt','utf8').trim().split('\n').map(l=>l.split('|').slice(0,2)));
const boardFam = new Map(); for (const [f, ids] of famBoards) for (const id of ids) boardFam.set(id, f);

// --- split a part into its lettered sections (### A. … ### E.)
function sections(text){
  const out = {}; let cur = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^#{2,3}\s+([A-F])[.)]\s*(.*)/);
    if (m) { cur = m[1]==='F' ? null : m[1]; if (cur) out[cur] = out[cur] || []; continue; }
    if (cur) out[cur].push(line);
  }
  for (const k in out) out[k] = out[k].join('\n').trim();
  return out;
}
// --- extract matrix rows (13-col pipe rows) from section A
function matrixRows(text){
  const rows = [];
  for (const line of text.split('\n')) {
    if (!/^\|/.test(line)) continue;
    const cells = line.split('|').slice(1,-1).map(c=>c.trim());
    if (cells.length < 13) continue;
    if (cells.length >= 14 && /^G[123]-\d{3}$/.test(cells[0])) { cells.splice(0, 2, cells[0] + ' · ' + cells[1]); }
    if (/^(#|Feature)/i.test(cells[0]) || /^-+$/.test(cells[0])) continue;
    if (/^\*\*[^|]+\*\*$/.test(cells[0]) && cells.slice(1).every(c=>c==='')) { rows.push({group: cells[0].replace(/^\*\*(— )?|( —)?\*\*$/g,'')}); continue; }
    rows.push(cells);
  }
  return rows;
}
const ID_RE = /\b(SH|EN|CV|CI|PG|AD|AS|ST|IN|BR)-\d{2,3}\b/g;
const NODE_RE = /\b\d{3,5}:\d{4,6}\b/g;

let md = `# 03 — Gap matrix (Phase 14) + capability depth (Phase 3) + family lenses (Phases 5–7, 10–12)\n\n`;
md += `Generated ${new Date().toISOString().slice(0,10)} by \`dump/build-03.mjs\` from \`parts/03-G1.md\` (shell · collab · review · publish · history · recovery · permissions · preview · issues · onboarding), \`parts/03-G2.md\` (canvas · layers · pages · templates · add · components · AI · inspector), \`parts/03-G3.md\` (assets · CMS · settings · brand · export · commerce). Source rows: \`01-code-inventory.md\` (1,020) and \`02-figma-inventory.md\` (1,098 live boards / 105 families). Gap types: A match · B code-only · C Figma-only (+Phase-9 label) · D partial · E duplicate · F obsolete.\n\n`;

const all = []; const perPart = {};
for (const p of parts) { const s = sections(p.text); p.sec = s; const rows = matrixRows(s.A||''); let grp=''; perPart[p.g]=0; for (const r of rows) { if (r.group) { grp=r.group; continue; } perPart[p.g]++; all.push({g:p.g, grp, cells:r}); } }

all.push({ g:'M', grp:'MERGE-LEVEL', cells:['M-001 · Superseded Layers board still visible on the live page','—','—','4418:80697','Figma: "SUPERSEDED · Layers · expanded (old document, unwired rows) — replaced by SA-fix 6918:74311"; not ARCHIVE-prefixed, not hidden, so it passes the live-board rule; 6 reactions, none from a live opener','F','Stale board discoverable in the Layers section','—','—','P3','hide (`visible=false`) + `ARCHIVE ·` prefix; no clone needed','none','✓ Deprecated'] });
// coverage
// Ownership by agent scope (task prompts, 2026-09-21): G1 = SH, EN, CI-73…87, ST-34…75, ST-92…116; G3 = AS, BR, ST-01…33, ST-76…91, ST-111, ST-115, IN-97…104, IN-107…109; G2 = everything else.
function ownerOf(id){ const [p,nS]=id.split('-'); const n=+nS;
  if (p==='SH'||p==='EN') return 'G1';
  if (p==='CI') return (n>=73&&n<=87)?'G1':'G2';
  if (p==='ST') return ((n>=34&&n<=75)||(n>=92&&n<=116&&n!==111&&n!==115))?'G1':'G3';
  if (p==='AS'||p==='BR') return 'G3';
  if (p==='IN') return ((n>=97&&n<=104)||(n>=107&&n<=109))?'G3':'G2';
  return 'G2'; }
const seenCode = new Map(); const secondary = new Map(); const seenBoards = new Set(); const seenFams = new Set(); const demoted = []; const rowsByBoard = new Map();
const gapCount = {};
for (const {g, cells} of all) {
  const rowId = (cells[0].match(/^G[123]-\d{3}/)||[g])[0];
  // Secondary-cite conventions used by the three agents: "(… ID …)" wrapped, or "ID (qualifier)" — an id directly followed by a parenthesised qualifier (G2: "(keys)", "(door)", "(see G2-091)", "(in G2-024)", "(cite)").
  const qualified = cells[1].match(/\b(SH|EN|CV|CI|PG|AD|AS|ST|IN|BR)-\d{2,3}\s*\([^)]*\)/g) || [];
  let primaryText = cells[1]; for (const q of qualified) primaryText = primaryText.replace(q, ' ');
  primaryText = primaryText.replace(/\([^)]*\)/g,'');
  const secText = qualified.join(' ') + ' ' + (cells[1].match(/\([^)]*\)/g)?.join(' ') || '');
  for (const id of new Set(primaryText.match(ID_RE)||[])) { if (ownerOf(id)!==g) { demoted.push(id+'→'+rowId); secondary.set(id,(secondary.get(id)||[]).concat(rowId)); continue; } seenCode.set(id, (seenCode.get(id)||[]).concat(rowId)); }
  for (const id of new Set(secText.match(ID_RE)||[])) secondary.set(id, (secondary.get(id)||[]).concat(rowId));
  for (const nid of (cells[3].match(NODE_RE)||[])) { if (!liveById.has(nid)) continue; seenBoards.add(nid); if (boardFam.has(nid)) seenFams.add(boardFam.get(nid)); rowsByBoard.set(nid, (rowsByBoard.get(nid)||[]).concat((cells[0].match(/^G[123]-\d{3}/)||[g])[0])); }
  const gt = (cells[5].match(/\b[A-F]\b/)||[/^—/.test(cells[5])?'—':'?'])[0]; gapCount[gt]=(gapCount[gt]||0)+1;
}
// An id whose only cites are qualified/parenthesised has no bare owner: its single secondary cite IS the owner (G2's "pointer rows"). Promote when unique; report when >1.
const promoted = [];
for (const r of codeRows) if (!seenCode.has(r.id) && secondary.has(r.id)) { const cs = [...new Set(secondary.get(r.id))]; if (cs.length===1) { seenCode.set(r.id, cs); secondary.delete(r.id); promoted.push(r.id+'→'+cs[0]); } }
const missingCode = codeRows.filter(r=>!seenCode.has(r.id) && !secondary.has(r.id));
const onlySecondary = codeRows.filter(r=>!seenCode.has(r.id) && secondary.has(r.id));
const dupCode = [...seenCode].filter(([,gs])=>gs.length>1);
const secCount = [...secondary.values()].reduce((a,b)=>a+b.length,0);
const missingFams = [...famBoards.keys()].filter(f=>!seenFams.has(f));
const unknownIds = [...seenCode.keys()].filter(id=>!codeRows.some(r=>r.id===id));

// Live boards no matrix row cites directly → map to the row(s) covering a sibling of the same family + class (clones, launchers, placeholders).
const cls = r => /^CD·/.test(r.n)?'CURRENT':/^SS·/.test(r.n)?'LAUNCHER':/^S·/.test(r.n)?'STATE':'OTHER';
const uncited = live.filter(r=>!seenBoards.has(r.id));
const boardIndex = uncited.map(r => {
  const fam = boardFam.get(r.id); const sibs = (famBoards.get(fam)||[]).filter(id=>id!==r.id && rowsByBoard.has(id));
  const sameSec = sibs.filter(id=>liveById.get(id)?.s===r.s);
  const pick = (sameSec.length?sameSec:sibs).map(id=>rowsByBoard.get(id)).flat();
  const counts = {}; for (const x of pick) counts[x]=(counts[x]||0)+1;
  const best = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k);
  const OVERRIDE = { '4418:98036': ['G1-051','G1-017'], '6887:75796': ['G2-086'], '4418:80697': ['M-001'], '4428:151441': ['G1-120'], '4418:84343': ['G1-120'], '4418:96768': ['G1-120'], '4418:107408': ['G1-120'], '4418:115322': ['G1-120'], '4418:144507': ['G1-120'] };
  return { id:r.id, name:r.n, cls:cls(r), sec: secNames[r.s]||r.s, fam, rows: OVERRIDE[r.id] || best };
});
md += `## Coverage\n\n| Check | Result |\n|---|---|\n`;
md += `| Matrix rows | ${all.length} (G1 ${perPart.G1||0} · G2 ${perPart.G2||0} · G3 ${perPart.G3||0}) |\n`;
md += `| Gap types | ${Object.entries(gapCount).sort().map(([k,v])=>`${k} ${v}`).join(' · ')} |\n`;
md += `| Code rows with a primary (owning) cite | ${seenCode.size} / ${codeRows.length} |\n`;
md += `| Code rows owned by >1 matrix row | ${dupCode.length}${dupCode.length?` — ${dupCode.slice(0,60).map(([id,gs])=>`${id}(${gs.join(',')})`).join(' ')}`:''} |\n`;
md += `| Code rows cited only as a secondary (parenthesised) pointer | ${onlySecondary.length}${onlySecondary.length?` — ${onlySecondary.map(r=>r.id).join(' ')}`:''} |\n`;
md += `| Secondary cross-references (parenthesised \"(cite)\" / \"(→ …)\" pointers, not ownership) | ${secCount} |\n`;
md += `| Qualified single cites promoted to owner (pointer / DUPLICATE-status rows that live inside the owning capability row) | ${promoted.length}${promoted.length?` — ${promoted.join(' ')}`:''} |\n`;
md += `| Cites demoted to secondary by the scope rule (id cited un-parenthesised by a non-owning agent) | ${demoted.length}${demoted.length?` — ${demoted.join(' ')}`:''} |\n`;
md += `| Code rows uncited | ${missingCode.length}${missingCode.length?` — ${missingCode.slice(0,80).map(r=>r.id).join(' ')}${missingCode.length>80?' …':''}`:''} |\n`;
md += `| Unknown code ids cited | ${unknownIds.length}${unknownIds.length?` — ${unknownIds.join(' ')}`:''} |\n`;
md += `| Live Figma boards cited directly in a matrix row | ${seenBoards.size} / ${live.length} |\n`;
md += `| Live boards covered only via a family sibling (see A2) | ${uncited.length} — ${uncited.filter(r=>cls(r)==='LAUNCHER').length} STATES launchers · ${uncited.filter(r=>/\[not-implemented\]/.test(r.n)).length} placeholders · ${uncited.filter(r=>/^SUPERSEDED/.test(r.n)).length} superseded · ${uncited.filter(r=>cls(r)==='CURRENT').length} per-item clones/variants |\n`;
md += `| Figma families touched | ${seenFams.size} / ${famBoards.size} |\n`;
md += `| Figma families untouched | ${missingFams.length}${missingFams.length?` — ${missingFams.join(' · ')}`:''} |\n\n`;

md += `## A. Gap matrix (Phase 14)\n\n| # | Src | Feature (capability) | Code rows | Codebase status | Figma boards | Capability match | Gap type | Current UX problem | Recommended Figma location | Recommended UX pattern | Priority | Required Figma change | Required code change | Phase-19 status |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
let lastGrp=''; all.forEach(({g,grp,cells},i)=>{ if (grp!==lastGrp) { md += `| | | **— ${grp} —** | | | | | | | | | | | | |\n`; lastGrp=grp; } md += `| ${i+1} | ${g} | ${cells.slice(0,13).join(' | ')} |\n`; });

md += `\n## A2. Board → row index for live boards not cited directly\n\nEvery live board in \`02-figma-inventory.md\` must appear once in this file (BRIEF done-condition 3). The ${uncited.length} boards below are covered by the matrix row of a same-family sibling (per-item clones such as "Layers · <element> locked" ×5, zoom-level menu variants, STATES launchers = navigation scaffolding, and \`[not-implemented]\` placeholders). Launchers carry no product capability (G1-120 covers the pattern); \`4418:80697\` is an F row (superseded board still visible — hide).\n\n| Board | Name | Class | Section | Family | Covered by |\n|---|---|---|---|---|---|\n`;
for (const b of boardIndex) md += `| ${b.id} | ${b.name.slice(0,80)} | ${b.cls} | ${b.sec.slice(0,40)} | ${b.fam||'—'} | ${b.rows.join(' · ')||'—'} |\n`;

for (const [letter, title] of [['B','B. Capability-depth tables (Phase 3)'],['C','C. Per-family lens blocks (Phases 5–7, 10–12)'],['D','D. Duplicates (2E) and obsolete (2F)'],['E','E. Owner decisions and UNVERIFIED']]) {
  md += `\n## ${title}\n`;
  for (const p of parts) if (p.sec[letter]) md += `\n### ${p.g}\n\n${p.sec[letter]}\n`;
}
fs.writeFileSync('03-gap-matrix.md', md);
console.log(JSON.stringify({uncitedBoards: boardIndex.map(b=>b.id+'→'+(b.rows.join('/')||'NONE')), promoted, demoted:demoted.length, rows:all.length, perPart, gapCount, codeOwned:seenCode.size, codeUncited:missingCode.length, onlySecondary:onlySecondary.map(r=>r.id), codeDup:dupCode.map(([id,gs])=>id+'('+gs.join(',')+')'), unknownIds, boards:seenBoards.size, famsTouched:seenFams.size, famsMissing:missingFams}, null, 1));
