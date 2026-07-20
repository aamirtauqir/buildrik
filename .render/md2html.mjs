import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const require = createRequire("/Users/shahg/Desktop/pencil/buildrik/package.json");
const { marked } = require("marked");
marked.setOptions({ gfm: true, breaks: false });
const src = process.argv[2];
const out = src.replace(/\.md$/, ".html");
const title = src.split("/").pop().replace(/\.md$/, "");
const body = marked.parse(readFileSync(src, "utf8"));
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>
:root{--bg:#fff;--fg:#1a1a1a;--muted:#5b6472;--line:#e5e7eb;--accent:#2D6DFF;--code:#f4f6f8;--th:#f8fafc;}
@media (prefers-color-scheme:dark){:root{--bg:#0f1216;--fg:#e6e8eb;--muted:#9aa4b2;--line:#232a33;--accent:#6ea8ff;--code:#161b22;--th:#161b22;}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font:15.5px/1.65 -apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;}
.wrap{max-width:1000px;margin:0 auto;padding:52px 32px 140px;}
h1{font-size:1.9rem;line-height:1.2;margin:.1em 0 .4em;letter-spacing:-.02em}
h2{font-size:1.35rem;margin:2em 0 .6em;padding-top:.7em;border-top:1px solid var(--line);letter-spacing:-.01em}
h3{font-size:1.08rem;margin:1.5em 0 .4em}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code{background:var(--code);padding:.12em .4em;border-radius:4px;font:13px/1.4 "SF Mono",ui-monospace,Menlo,monospace}
pre{background:var(--code);padding:14px 16px;border-radius:8px;overflow-x:auto}pre code{background:none;padding:0}
table{border-collapse:collapse;width:100%;margin:1em 0;font-size:13.5px;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}
th{background:var(--th);font-weight:600;white-space:nowrap}
blockquote{margin:1em 0;padding:.3em 1em;border-left:3px solid var(--accent);color:var(--muted)}
hr{border:0;border-top:1px solid var(--line);margin:2em 0}strong{font-weight:650}del{color:var(--muted)}
</style></head><body><div class="wrap">${body}</div></body></html>`;
writeFileSync(out, page);
console.log("written", out, `${(page.length/1024).toFixed(0)}KB`);
