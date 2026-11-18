const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const bin='/Users/shahg/.claude/skills/gstack/browse/dist/browse';
const env={...process.env,BROWSE_STATE_FILE:'/tmp/buildrick-phase6-persistent/browse.json',BROWSE_PARENT_PID:'0',GSTACK_DISABLE_GPU:'off',BROWSE_START_TIMEOUT:'45000'};
const dir='/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/master-audit-2026-10-10/evidence';
const graph=JSON.parse(fs.readFileSync(dir+'/phase6-expansion-actions.json','utf8'));
const spec=JSON.parse(fs.readFileSync(dir+'/phase6-expansion-screen-spec.json','utf8'));
const fieldsMode=process.argv.includes('--fields');
const resultFile=fieldsMode?'phase6-expansion-field-playback.json':'phase6-expansion-playback.json';
const out={date:new Date().toISOString(),scope:'Figma expansion navigation playback only; no external product actions',steps:[]};
function run(...args){return execFileSync(bin,args,{env,encoding:'utf8',timeout:60000}).trim();}
function start(key){const id=spec.roots[key];run('goto','https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id='+id.replace(':','-')+'&starting-point-node-id='+encodeURIComponent(id)+'&hide-ui=1');run('viewport','1440x1000');run('js','(async()=>{for(let i=0;i<60;i++){if(document.querySelector("canvas"))return "ready";await new Promise(r=>setTimeout(r,500));}throw Error("Canvas unavailable");})()');run('js','new Promise(r=>setTimeout(()=>r("settled"),8000))');}
function step(from,label,to){const edge=graph.find(e=>e.key===from&&e.label===label);if(!edge)throw Error('Missing edge '+from+' '+label);const {x,y}=edge;run('js',`(async()=>{const x=${x},y=${y},e=document.elementFromPoint(x,y);if(!e)throw Error('Missing click target');for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));await new Promise(r=>setTimeout(r,700));})()`);const url=run('js',`(async()=>{for(let i=0;i<20;i++){if(new URL(location.href).searchParams.get('node-id')==='${spec.roots[to].replace(':','-')}')return location.href;await new Promise(r=>setTimeout(r,250));}return location.href;})()`);const pass=new URL(url).searchParams.get('node-id')===spec.roots[to].replace(':','-');out.steps.push({from,label,to,source:edge.id,x,y,url,pass});fs.writeFileSync(dir+'/'+resultFile,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({from,label,to,pass}));if(!pass){run('screenshot',dir+'/phase6-validation/expansion-failure.png');throw Error('Destination mismatch');}}
const journeys=[
[['I01','Typography','I02'],['I02','Mobile override','I06'],['I06','Reset font size','I14'],['I14','Undo reset','I06'],['I06','Desktop','I02'],['I02','Class manager','I07'],['I07','Preview shared change','I15'],['I15','Apply class change','I17'],['I17','Undo shared change','I07']],
[['I04','Two columns','I12'],['I12','Undo columns','I04']],
[['I05','Apply 32px padding','I13'],['I13','Undo spacing','I05']],
[['A01','Generate proposal','A03'],['A03','View proposal','A04'],['A04','Apply change','A05'],['A05','Undo AI change','A04'],['A04','Stale scenario','A06'],['A06','Regenerate','A03'],['A03','Cancel generation','A01'],['A01','Change scope','A02'],['A02','Use page scope','A09'],['A09','Plan as agent task','G02']],
[['G01','New task','G02'],['G02','Generate plan','G03'],['G03','Approve & run','G04'],['G04','Review result','G05'],['G05','Review 2 changes','G10'],['G10','Apply selected 2','G13'],['G13','Undo selected edits','G10']],
[['G11','Review audit plan','G14'],['G14','Run audit','G15']],
[['C01','Open comments','C03'],['C03','Open thread','C04'],['C04','Resolve thread','C10'],['C10','Reopen thread','C04']],
[['C01','Connection lost','C07'],['C07','Reconnect · conflict','C08'],['C08','Use server 32px','C12']],
[['C08','Reapply my 24px','C13']],
[['C02','Review invitation','C09'],['C09','Send invitation','C14']],
[['C06','Preview reviewer view','C11'],['C11','Approve version','C15']]
];
const chosen=fieldsMode?[[['I02','Font size','I19'],['I19','Cancel','I02'],['I02','Font size','I19'],['I19','Review change','I15'],['I15','Apply class change','I17']],[['I04','Columns','I12'],['I12','Undo columns','I04']],[['A05','Continue editing','I18'],['I18','Undo AI text change','I02']]]:journeys;
for(const sequence of chosen){start(sequence[0][0]);for(const args of sequence)step(...args);}
console.log(JSON.stringify({passed:out.steps.filter(s=>s.pass).length,total:out.steps.length}));
