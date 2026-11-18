const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const bin='/Users/shahg/.claude/skills/gstack/browse/dist/browse';
const env={...process.env,BROWSE_STATE_FILE:'/tmp/buildrick-phase6-persistent/browse.json',BROWSE_PARENT_PID:'0',GSTACK_DISABLE_GPU:'off',BROWSE_START_TIMEOUT:'45000'};
const dir='/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/master-audit-2026-10-10/evidence';
function run(...args){return execFileSync(bin,args,{env,encoding:'utf8',timeout:60000}).trim();}
const out={date:new Date().toISOString(),scope:'Finite Figma prototype only; no production or backend effects.',steps:[]};
run('goto','https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8329-1288&starting-point-node-id=8329%3A1288&hide-ui=1');
run('viewport','1440x900');
const ready=run('js','(async()=>{for(let i=0;i<60;i++){if(document.querySelector("canvas"))return "ready";await new Promise(r=>setTimeout(r,500));}return "not ready";})()');
if(ready!=='ready')throw new Error('Figma canvas did not render: '+ready);
run('js','new Promise(r=>setTimeout(()=>r("render settled"),4000))');
run('screenshot',dir+'/phase6-validation/resume-insertion-start.png');
const steps=[['blank page Add',638,427,'8415-1581'],['cancel Add using close',318,80,'8329-1288'],['reopen Add',638,427,'8415-1581'],['insert Heading',200,243,'8415-1691'],['apply 48 px sample',1290,829,'8415-1801'],['Undo size change',1290,829,'8415-1691'],['Undo insertion',950,76,'8329-1288'],['reopen Add alternate',638,427,'8415-1581'],['insert from guidance',638,427,'8415-1691'],['reapply style sample',1290,829,'8415-1801'],['Undo insertion from styled',950,76,'8329-1288'],['reopen Add for cancel',638,427,'8415-1581'],['Back to blank page',950,76,'8329-1288']];
for(const[label,x,y,expected]of steps){
 const js=`(async()=>{const x=${x},y=${y},e=document.elementFromPoint(x,y);if(!e)throw new Error('Missing click target');for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));await new Promise(r=>setTimeout(r,700));return location.href;})()`;
 const url=run('js',js),pass=new URL(url).searchParams.get('node-id')===expected;
 out.steps.push({label,xy:[x,y],expected,url,pass});
 fs.writeFileSync(dir+'/phase6-insertion-demo-playback.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({label,pass,url}));
 if(!pass)throw new Error('Destination mismatch');
 if(label==='apply 48 px sample')run('screenshot',dir+'/phase6-validation/resume-heading-48.png');
 if(label==='Undo size change')run('screenshot',dir+'/phase6-validation/resume-heading-undo-size.png');
}
run('screenshot',dir+'/phase6-validation/resume-heading-undo-blank.png');
console.log(JSON.stringify({passed:out.steps.length}));
