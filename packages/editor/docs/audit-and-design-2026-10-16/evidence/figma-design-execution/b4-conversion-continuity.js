const ids=['170:122442','170:122820','170:123180','170:123569','170:123968'];
const caretMaster=await figma.getNodeByIdAsync('4:84');
for(const id of ids){const r=await figma.getNodeByIdAsync(id);await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 const row=r.findOne(n=>n.name==='Layer / Email');if(row){row.setProperties({'Label#4:70':'Topic'});row.name='Layer / Topic';}
 const target=r.findOne(n=>n.name==='Email / stable child email-01');if(target){target.name='Topic / stable child topic-01';if(id!=='170:123968'){const b=target.findOne(n=>n.name==='Visitor input');b.layoutMode='HORIZONTAL';b.counterAxisAlignItems='CENTER';b.paddingTop=0;b.paddingRight=10;b.itemSpacing=8;b.children[0].resize(432,20);const car=caretMaster.createInstance();b.appendChild(car);car.resize(16,16);car.name='Select disclosure';}}
 const body=r.findOne(n=>n.name==='Inspector scroll / Content'),opts=r.findOne(n=>n.name==='Section / Options');if(opts){const order=[...body.children];order.splice(order.indexOf(opts),1);order.splice(order.findIndex(n=>n.name==='Section / Field')+1,0,opts);for(const c of order)body.appendChild(c);}
 const copy=r.findAllWithCriteria({types:['TEXT']}).find(t=>t.characters.startsWith('The3'));if(copy)copy.characters=copy.characters.replace('The3','The 3');
 mutations.push(r.id,...r.findAll(()=>true).map(n=>n.id));
}
const lossList=await clone('156:716','B4-F36 · Contact form / Email as Text');
const topicList=await clone('170:122820','B4-F37 · Contact form / Topic as Text');
for(const [r,label,dest] of [[lossList,'Email','170:122069'],[topicList,'Topic','170:123968']]){
 const row=r.findOne(n=>n.name==='Field list / Email');const b=row.findOne(n=>n.type==='INSTANCE'&&Object.keys(n.componentProperties||{}).includes('Label#4:18'));
 b.setProperties({'Label#4:18':label});link(b,dest);
 for(const t of row.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes(' · Required'))t.characters='Text · Required';
 const car=r.findOne(n=>n.name==='Select disclosure');if(car)car.remove();
 status(r,'Saving page…');
 const fieldRoot=await figma.getNodeByIdAsync(dest);link(fieldRoot.findOne(n=>n.name==='‹ Contact form'),r.id);
}
return await finish();
