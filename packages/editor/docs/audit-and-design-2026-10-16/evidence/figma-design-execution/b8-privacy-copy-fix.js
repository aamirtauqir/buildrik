// Privacy help line = P25 §6.4 specified text; per-user scope stays a separate line.
let n=0;for(const r of page.children.filter(x=>/^B8-S2[234] /.test(x.name)))for(const t of r.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('Helps us see which editor features')){t.characters='Helps us improve the editor. We never collect your content or your clients’ details. This setting is for your account only.';n++;}
return {updated:n};
