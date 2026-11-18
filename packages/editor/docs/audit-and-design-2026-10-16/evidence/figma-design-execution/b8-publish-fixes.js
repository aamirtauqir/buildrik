// B8 Publish fixes: body height leaves room for the footer (CTA, reason, legal); topbar verb matches the task where it read “Publish”.
let n=0;for(const r of page.children.filter(x=>/^B8-PB\d/.test(x.name))){const ins=r.findOne(x=>x.name==='Task host / Publish');const body=ins.findOne(x=>x.name==='Task body');const foot=ins.findOne(x=>x.name==='Task footer');body.resize(360,812-48-foot.height);n++;
 const b=r.findOne(x=>x.type==='INSTANCE'&&x.name==='Publish'&&x.parent.name==='Topbar / site scope');if(b){b.setProperties({'Label#4:18':'Publish changes'});b.name='Publish changes';b.resize(130,32);const fs=r.findOne(x=>x.name==='Flexible space');fs.resize(Math.max(40,fs.width-48),1);}}
return {fixed:n};
