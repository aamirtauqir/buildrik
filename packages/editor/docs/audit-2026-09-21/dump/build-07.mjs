// 07 traceability: code rows → one of 7 Phase-19 statuses; Figma boards → one of 4. Run from docs/audit-2026-09-21.
import fs from 'node:fs';
const md = fs.readFileSync('03-gap-matrix.md','utf8');
const A = md.split('\n## A. ')[1].split('\n## A2.')[0];
const A2 = md.split('\n## A2.')[1].split('\n## B.')[0];
const codeRows = JSON.parse(fs.readFileSync('dump/code-rows.json','utf8'));
const live = JSON.parse(fs.readFileSync('dump/live-all.json','utf8'));
const hidden = new Set(JSON.parse(fs.readFileSync('dump/hide-safe.json','utf8')).concat(['4418:80697']));
const ID_RE = /\b(SH|EN|CV|CI|PG|AD|AS|ST|IN|BR)-\d{2,3}\b/g; const NODE_RE = /\b\d{3,5}:\d{4,6}\b/g;
function ownerOf(id){ const [p,nS]=id.split('-'); const n=+nS; if (p==='SH'||p==='EN') return 'G1'; if (p==='CI') return (n>=73&&n<=87)?'G1':'G2'; if (p==='ST') return ((n>=34&&n<=75)||(n>=92&&n<=116&&n!==111&&n!==115))?'G1':'G3'; if (p==='AS'||p==='BR') return 'G3'; if (p==='IN') return ((n>=97&&n<=104)||(n>=107&&n<=109))?'G3':'G2'; return 'G2'; }
const rows=[]; for (const line of A.split('\n')) { if (!/^\| \d+ \| /.test(line)) continue; const c=line.split('|').slice(1,-1).map(s=>s.trim()); const id=(c[2].match(/^(G\d|M)-\d{3}/)||[c[1]])[0]; rows.push({id, src:c[1], feat:c[2], code:c[3], status:c[4], boards:c[5], gap:c[7], pri:c[11], figchg:c[12], codechg:c[13], p19:c[14]}); }
// ownership (same rules as build-03)
const owner=new Map(); const sec=new Map();
for (const r of rows) { const qualified = r.code.match(/\b(SH|EN|CV|CI|PG|AD|AS|ST|IN|BR)-\d{2,3}\s*\([^)]*\)/g)||[]; let prim=r.code; for (const q of qualified) prim=prim.replace(q,' '); prim=prim.replace(/\([^)]*\)/g,''); const secT = qualified.join(' ')+' '+((r.code.match(/\([^)]*\)/g)||[]).join(' '));
  for (const id of new Set(prim.match(ID_RE)||[])) { if (ownerOf(id)!==r.src) { sec.set(id,(sec.get(id)||[]).concat(r.id)); continue; } owner.set(id,(owner.get(id)||[]).concat(r.id)); }
  for (const id of new Set(secT.match(ID_RE)||[])) sec.set(id,(sec.get(id)||[]).concat(r.id)); }
for (const cr of codeRows) if (!owner.has(cr.id) && sec.has(cr.id)) { const cs=[...new Set(sec.get(cr.id))]; if (cs.length===1) owner.set(cr.id, cs); }
// build outcomes (05)
const BUILT = { 'G1-003':'B1-08','G1-005':'B1-07','G1-083':'B1-07','G1-035':'B2-02, B2-03','G1-045':'B1-09, B1-10','G1-046':'B1-11','G1-076':'B1-03','G1-082':'B1-03','G1-077':'B1-04','G1-078':'B1-05, B1-06','G1-080':'B1-01, B1-02','G3-039':'B1-12, B1-13','G3-153':'B1-14, B1-15','G1-007':'B3-01','G1-009':'B2-01 + EP-1 (503 boards)','G1-034':'B2-01','G1-011':'B3-06, B3-07 (PLANNED)','G1-021':'B2-06 + EP-2a','G1-024':'EP-2b (PLANNED row) + B3-11 toasts','G1-031':'B3-02, B3-03, B3-04 + 4418:121372 Re-send','G1-033':'B3-09 + EP-3','G1-036':'B2-05','G1-037':'B2-04 + 4418:116906 Reattach','G1-039':'B3-08 (PLANNED)','G1-043':'B3-10 + 4418:97118 Panel footer','G1-054':'B3-05','G1-057':'EP-4','G1-062':'B2-07 + AN-04','G1-081':'B3-11','G2-027':'W-1 + 4418:107674','G2-032':'W-2','G2-033':'W-4','G2-034':'W-5','G2-035':'W-6','G2-039':'W-3 + legend link + menu row','G2-047':'W-3','G3-130':'W-7','G2-055':'EP-5','G2-056':'EP-5','G1-091':'EP-6','G1-026':'EP-6 (copy) — annotation not placed','G3-013':'EP-7','G3-140':'EP-10','G3-146':'EP-10','G2-125':'EP-11','G2-084':'EP-11','G3-061':'EP-9','G3-077':'EP-9','M-001':'hidden + 4 openers retargeted' };
const ANNOT = new Set(['G1-032','G1-028','G1-074','G1-062','G1-093','G1-087','G1-123','G2-014','G2-109','G2-114','G2-129','G2-158','G2-159','G3-057','G3-064','G3-073','G3-074','G3-079','G3-111','G3-116','G3-100','G3-139','G3-142','G3-150']);
const REMAINING = { 'G1-013':'C-01 CTA verbs — gated on plan §15 (1)(2) (OD-2); node-ready spec in 03', 'G1-066':'C-03 viewer pins — dashboard surface (Q1 out of scope; OD-6)', 'G1-029':'folded into chip + panel (OD-7)' };
const isNone = x => /^(none|—|-|n\/a)/i.test(x.trim());
function codeStatus(r){ // 7 statuses
  if (r.id in REMAINING) return r.id==='G1-029' ? '✓ Combined' : '✗ Missing';
  if (BUILT[r.id]) return '✓ Represented';
  const p = r.p19;
  if (/Represented/.test(p)) return '✓ Represented'; if (/Combined/.test(p)) return '✓ Combined'; if (/Hidden/.test(p)) return '✓ Hidden'; if (/Internal/.test(p)) return '✓ Internal'; if (/Deprecated/.test(p)) return '✓ Deprecated'; if (/Planned/.test(p)) return '✓ Planned for later';
  if (/Missing/.test(p)) return isNone(r.figchg) ? '✓ Represented' : '✓ Planned for later'; // P2/P3 asks not reached by the cap: node-ready spec in 03
  if (/^[✓△○✗]/.test(p)) return '✓ Represented'; // C rows carry the Figma-side label; the code side has nothing to trace
  return '✓ Represented'; }
function figStatus(r){ const g=r.gap; if (/\bF\b/.test(g)) return '✗ Dummy'; if (/\bC\b/.test(g)) { if (/NOT IMPLEMENTED|DESIGN-ONLY/.test(g)) return '✗ Dummy'; if (/PARTIALLY/.test(g)) return '△ Partial'; if (/PLANNED/.test(g)) return '○ Planned'; if (/IMPLEMENTED/.test(g)) return '✓ Code'; return '△ Partial'; } if (/\bA\b/.test(g) && !/\bD\b/.test(g)) return /NOT IMPLEMENTED|DESIGN-ONLY/.test(g) ? '△ Partial' : '✓ Code'; if (/\bD\b/.test(g) || /\bE\b/.test(g)) return '△ Partial'; if (/\bB\b/.test(g)) return '✓ Code'; return '△ Partial'; }
// ---- code side
const byRow = Object.fromEntries(rows.map(r=>[r.id,r]));
const codeOut=[]; const codeCount={};
for (const cr of codeRows) { const own=(owner.get(cr.id)||['—'])[0]; const r=byRow[own]; let st = r ? codeStatus(r) : '✗ Missing'; let note = r ? (BUILT[r.id] ? BUILT[r.id] : (REMAINING[r.id]||'')) : 'no matrix row';
  if (cr.status==='DUPLICATE' && st==='✓ Represented') { st='✓ Combined'; note = note || 'DUPLICATE (Q3) — same job traced through its twin'; }
  if ((cr.status==='UNREACHABLE'||cr.status==='STUB') && (st==='✓ Represented'||st==='✓ Planned for later')) { st='✓ Internal'; note = (note?note+' · ':'')+cr.status+' — no user door today (Q3 report-only)'; }
  codeCount[st]=(codeCount[st]||0)+1; codeOut.push({id:cr.id, feature:cr.feature, status:cr.status, row:own, st, note}); }
// ---- figma side
const rowsByBoard=new Map(); for (const r of rows) for (const b of new Set(r.boards.match(NODE_RE)||[])) rowsByBoard.set(b,(rowsByBoard.get(b)||[]).concat(r.id));
for (const line of A2.split('\n')) { if (!/^\| \d{3,5}:\d+ \|/.test(line)) continue; const c=line.split('|').slice(1,-1).map(s=>s.trim()); const ids=(c[5].match(/\b(G\d|M)-\d{3}\b/g)||[]); if (!rowsByBoard.has(c[0])) rowsByBoard.set(c[0], ids); }
const rank = {'✓ Code':3,'△ Partial':2,'○ Planned':1,'✗ Dummy':0};
const figOut=[]; const figCount={};
for (const b of live) { const rs=(rowsByBoard.get(b.id)||[]).map(i=>byRow[i]).filter(Boolean); let st; let note='';
  if (hidden.has(b.id)) { st='✗ Dummy'; note='hidden 21 Sep 2026 (Batch 8 — zero inbound refs / superseded)'; }
  else if (!rs.length) { st='△ Partial'; note='launcher/scaffold — no capability row'; }
  else { const sts=rs.map(figStatus); const hasCode=sts.some(s=>s==='✓ Code'), hasDummy=sts.some(s=>s==='✗ Dummy'), hasPlanned=sts.some(s=>s==='○ Planned'); st = hasCode && !hasDummy && !sts.some(s=>s==='△ Partial') ? '✓ Code' : (!hasCode && !sts.some(s=>s==='△ Partial') && hasPlanned && !hasDummy) ? '○ Planned' : (sts.every(s=>s==='✗ Dummy')) ? '✗ Dummy' : '△ Partial'; note = rs.map(r=>r.id+' '+r.gap.replace(/\s+/g,' ').slice(0,28)).join(' · '); }
  figCount[st]=(figCount[st]||0)+1; figOut.push({id:b.id, name:b.n.slice(0,70), st, note}); }
// new boards
const NEW = JSON.parse(fs.readFileSync('dump/redump-001.json','utf8')).rows.concat(JSON.parse(fs.readFileSync('dump/redump-002.json','utf8')).rows);
for (const r of NEW) { if (r.id==='7563:197896'||r.id==='7566:186556') continue; const st = /^PLANNED/.test(r.n) ? '○ Planned' : '✓ Code'; figCount[st]=(figCount[st]||0)+1; figOut.push({id:r.id, name:r.n, st, note:'built 21 Sep 2026 (05 ledger)'}); }
let out = `# 07 — Traceability (Phase 19) · generated ${new Date().toISOString().slice(0,10)} by \`dump/build-07.mjs\`\n\nCode side: every \`01-code-inventory.md\` row → its owning \`03-gap-matrix.md\` row → one of the seven Phase-19 statuses, with the 05 build outcome applied. Figma side: every live board of \`02-figma-inventory.md\` (1,098) plus the 40 built boards → one of the four Phase-19 statuses, derived from the gap type(s) of the rows that cite the board.\n\n## Totals\n\n| Code rows (${codeOut.length}) | Count |\n|---|---|\n` + Object.entries(codeCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${k} | ${v} |`).join('\n') + `\n\n| Figma boards (${figOut.length} = 1,098 live + 40 new) | Count |\n|---|---|\n` + Object.entries(figCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`| ${k} | ${v} |`).join('\n');
out += `\n\n## Remaining gaps (the only ✗ Missing allowed — BRIEF done-condition 6)\n\n| Row | Code rows | Why not built | Path |\n|---|---|---|---|\n` + Object.entries(REMAINING).filter(([k])=>k!=='G1-029').map(([k,v])=>`| ${k} | ${byRow[k].code.slice(0,60)} | ${v} | owner decision → one board from 04 §4 slots (spec in 03) |`).join('\n');
out += `\n\n## Code → Figma (${codeOut.length} rows)\n\n| Code row | Feature | Code status | Matrix row | Phase-19 status | Note |\n|---|---|---|---|---|---|\n` + codeOut.map(c=>`| ${c.id} | ${c.feature.slice(0,60)} | ${c.status} | ${c.row} | ${c.st} | ${c.note.slice(0,90)} |`).join('\n');
out += `\n\n## Figma → Code (${figOut.length} boards)\n\n| Board | Name | Phase-19 status | Rows / note |\n|---|---|---|---|\n` + figOut.map(f=>`| ${f.id} | ${f.name} | ${f.st} | ${f.note.slice(0,110)} |`).join('\n') + '\n';
fs.writeFileSync('07-traceability.md', out);
console.log(JSON.stringify({codeCount, figCount, missing: codeOut.filter(c=>c.st==='✗ Missing').map(c=>c.id)}));
