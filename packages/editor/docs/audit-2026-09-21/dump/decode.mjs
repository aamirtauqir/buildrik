// Expand dictionary-encoded dump pages (live-NNN.json with {D,rows}) into flat rows.
import fs from 'node:fs';
const files = fs.readdirSync('.').filter(f => /^live-\d+\.json$/.test(f)).sort();
const out = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const rows = Array.isArray(j) ? j : j.rows;
  const D = j.D || null;
  for (const r of rows) {
    const x = { ...r, page: f };
    if (D) { x.t = r.t.map(i => typeof i === 'number' ? D[i] : i); x.r = r.r.map(i => typeof i === 'number' ? D[i] : i); }
    out.push(x);
  }
}
fs.writeFileSync('live-all.json', JSON.stringify(out, null, 0));
console.log(files.length, 'pages →', out.length, 'boards');
