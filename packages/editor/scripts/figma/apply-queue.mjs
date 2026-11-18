/** Inspector v4 native-connector queue adapter. Emits one resumable, read-back
 * verified Plugin API job at a time; the caller executes via connected Figma.
 * No credentials or alternate network transport. */
import fs from 'node:fs';
import path from 'node:path';
const dir = path.join(import.meta.dirname, 'inspector-v4');
const [op, name] = process.argv.slice(2);
if (op === 'emit') {
  const common = fs.readFileSync(path.join(dir, 'common.js'), 'utf8');
  const job = fs.readFileSync(path.join(dir, name + '.js'), 'utf8');
  const code = common + '\n' + job;
  new Function('return async function(){' + code + '}');
  console.log(JSON.stringify({fileKey:'g4GzQFqzNYz5sosz1QtZXC',skillNames:'figma-use,figma-generate-design,figma-generate-library',description:'Inspector v4 queue: ' + name,code}));
} else if (op === 'status') {
  console.log(fs.readdirSync(dir).filter(n => n.endsWith('.result.json')));
} else throw new Error('Usage: apply-queue.mjs emit <job> | status');
