const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const bin='/Users/shahg/.claude/skills/gstack/browse/dist/browse';
const env={...process.env,BROWSE_STATE_FILE:'/tmp/buildrick-phase6-persistent/browse.json',BROWSE_PARENT_PID:'0',GSTACK_DISABLE_GPU:'off',BROWSE_START_TIMEOUT:'45000'};
const dir='/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/master-audit-2026-10-10/evidence';
function run(...args){return execFileSync(bin,args,{env,encoding:'utf8',timeout:60000}).trim();}
const out={date:new Date().toISOString(),scope:'Finite Figma prototype playback. No service effects.',steps:[]};
function start(id){run('goto','https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id='+id+'&starting-point-node-id='+id.replace('-',':')+'&hide-ui=1');run('viewport','1440x900');const ready=run('js','(async()=>{for(let i=0;i<60;i++){if(document.querySelector("canvas"))return "ready";await new Promise(r=>setTimeout(r,500));}return "not ready";})()');if(ready!=='ready')throw Error(ready);run('js','new Promise(r=>setTimeout(()=>r("settled"),4000))');}
function step(label,x,y,expected,id){if(x==='Escape'){run('press','Escape');run('js','new Promise(r=>setTimeout(()=>r("settled"),700))');}
else run('js',`(async()=>{const x=${x},y=${y},e=document.elementFromPoint(x,y);if(!e)throw Error('Missing click target');for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));await new Promise(r=>setTimeout(r,700));})()`);
const url=run('js','location.href'),pass=new URL(url).searchParams.get('node-id')===expected;out.steps.push({label,sourceNodeId:id,xy:[x,y],expected,url,pass});fs.writeFileSync(dir+'/phase6-closure-final-playback.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({label,pass,url}));if(!pass){run('screenshot',dir+'/phase6-validation/closure-failure.png');throw Error('Destination mismatch');}}
function shot(name){run('screenshot',dir+'/phase6-validation/closure-'+name+'.png');}
start('8317-297');
step('Editor scope disclosure',720,28,'8441-1665');shot('scope-editor');
step('Scope returns same editor',519,552,'8317-297','I8441:1666;8343:249');
start('8377-1674');
step('Collapsed panels scope disclosure',720,28,'8441-1665');
step('Scope Escape retains both collapsed panels','Escape',0,'8377-1674','8441:1665');
start('8387-1701');
step('Applied Brand scope disclosure',720,28,'8441-1698');
step('Scope Escape retains applied token','Escape',0,'8387-1701','8441:1698');
step('Brand applied header return',94,28,'8387-1810','8387:1704');shot('brand-retained');
start('8317-244162');
step('AI Escape returns selected Heading','Escape',0,'8317-297','8317:244162');
start('8318-1310');
step('Export Escape returns site menu','Escape',0,'8318-911','8318:1310');
step('Site menu Escape returns editor','Escape',0,'8317-297','8318:911');
console.log(JSON.stringify({passed:out.steps.length}));
