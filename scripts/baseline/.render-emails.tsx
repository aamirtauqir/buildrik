import { render } from "@react-email/components";
import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import React from "react";
async function main() {
  const DIR = "packages/dashboard/emails";
  const OUT = "/tmp/baseline-emails";
  mkdirSync(OUT, { recursive: true });
  const files = readdirSync(DIR).filter(f => f.endsWith(".tsx"));
  const results: any[] = [];
  for (const f of files) {
    try {
      const mod = await import(join(process.cwd(), DIR, f));
      const html = await render(React.createElement(mod.default));
      writeFileSync(join(OUT, f.replace(".tsx", ".html")), html);
      results.push({ f, ok: true });
    } catch (e: any) { results.push({ f, ok: false, err: e.message?.slice(0, 80) }); }
  }
  console.log(JSON.stringify(results.filter(r => !r.ok)));
  console.log(`rendered ${results.filter(r => r.ok).length}/${files.length}`);
}
main();
