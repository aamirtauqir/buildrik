// B6 Components fixes 2: row columns sum to the 776px list width (name 190, status 142).
let n=0;const over=[];
for(const id of ['215:43588','215:43978','215:44300','215:44647','215:45056','215:45456','215:45851','215:46247','215:46667','215:47088']){const r=await figma.getNodeByIdAsync(id);
 for(const row of r.findAll(x=>x.type==='FRAME'&&x.name.startsWith('Row / '))){const name=row.children.find(c=>c.type==='TEXT');if(name)name.resize(190,name.height);const st=row.children.find(c=>c.name==='Status');if(st)st.resize(142,24);n++;
  const used=row.children.reduce((s,c)=>s+c.width,0)+row.itemSpacing*(row.children.length-1)+row.paddingLeft+row.paddingRight;if(used>row.width+0.5)over.push(row.id+':'+used);}}
return {rows:n,over};
