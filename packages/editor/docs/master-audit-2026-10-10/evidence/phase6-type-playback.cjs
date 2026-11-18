const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const dir=__dirname;
const data=JSON.parse(fs.readFileSync(path.join(dir,'phase6-type-integration.json'),'utf8'));
const byKey=Object.fromEntries(data.screens.map(s=>[s.key,s.id]));
const bin='/Users/shahg/.claude/skills/gstack/browse/dist/browse';
const env={...process.env,BROWSE_STATE_FILE:'/tmp/buildrick-type-qa/browse.json',BROWSE_PARENT_PID:'0',GSTACK_DISABLE_GPU:'off',BROWSE_START_TIMEOUT:'45000'};
const run=(...args)=>execFileSync(bin,args,{env,encoding:'utf8',timeout:60000}).trim();
const result={date:new Date().toISOString(),scope:'Authored Figma transitions, no backend operations',steps:[]};
run('viewport','1440x1000');
if(!process.argv.includes('--resume'))run('goto','https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8507-2799&starting-point-node-id=8507%3A2799&hide-ui=1');
for(let i=0;i<3;i++)run('js','new Promise(r=>setTimeout(()=>r("settled"),10000))');
const steps=[['T01','Use descriptive alt','T02'],['T02','Undo alt text','T01'],['T01','View email field','T03'],['T03','Make field required','T04'],['T04','Undo required','T03'],['T03','Form submission settings','T05'],['T05','Review redirect','T06'],['T06','Cancel redirect','T05'],['T05','Project collection','T07'],['T07','Show 2 items','T08'],['T08','Undo limit','T07'],['T07','View component instance','T09'],['T09','Review reset','T10'],['T10','Cancel reset','T09'],['T09','Review reset','T10'],['T10','Reset this instance','T11'],['T11','Undo reset','T09'],['T09','View project image','T01']];
for(const [from,label,to] of steps){
 const edge=data.edges.find(e=>e.from===byKey[from]&&e.label===label);
 if(!edge)throw Error('Missing edge '+from+' '+label);
 const {x,y}=edge;
 run('js',`(()=>{const x=${x},y=${y},e=document.elementFromPoint(x,y);if(!e)throw Error('No target');for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));return e.tagName;})()`);
 const expected=byKey[to].replace(':','-');
 const url=run('js',`(async()=>{for(let i=0;i<40;i++){if(new URL(location.href).searchParams.get('node-id')==='${expected}')return location.href;await new Promise(r=>setTimeout(r,250));}return location.href;})()`);
 const pass=new URL(url).searchParams.get('node-id')===expected;
 result.steps.push({from,label,to,x,y,pass,url});
 fs.writeFileSync(path.join(dir,'phase6-type-playback.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({from,label,to,pass}));
 if(!pass){run('screenshot',path.join(dir,'phase6-type-playback-failure.png'));throw Error('Destination mismatch');}
}
run('screenshot',path.join(dir,'phase6-type-playback-final.png'));
console.log(JSON.stringify({passed:result.steps.filter(s=>s.pass).length,total:result.steps.length}));
