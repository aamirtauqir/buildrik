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
const url=run('js','location.href'),pass=new URL(url).searchParams.get('node-id')===expected;out.steps.push({label,sourceNodeId:id,xy:[x,y],expected,url,pass});fs.writeFileSync(dir+'/phase6-closure-playback.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({label,pass,url}));if(!pass){run('screenshot',dir+'/phase6-validation/closure-failure.png');throw Error('Destination mismatch');}}
function shot(name){run('screenshot',dir+'/phase6-validation/closure-'+name+'.png');}
start('8317-245216');
step('Mobile Menu',895,159,'8318-2204','8318:749');shot('mobile-expanded');
step('Mobile Close',895,159,'8317-245216','8318:2270');
step('Mobile reopen',895,159,'8318-2204','8318:749');
step('Expanded preview return',140,76,'8329-1408','8318:2283');
start('8317-242017');
step('Metadata retry',1226,698,'8428-243603','8317:242108');shot('metadata-retry');
step('Keep editing retained draft',1226,698,'8317-242017','8428:243682');
step('Discard review',1226,740,'8334-243230','8317:242110');
step('Guard retry',579,544,'8428-243603','8334:243322');
step('Retry result discard review',1226,740,'8334-243230','8428:243683');
step('Discard and return to Image',861,544,'8317-242981','8334:243324');
start('8329-1288');
step('About us Browse templates',842,427,'8428-243434','8329:1360');shot('about-template');
step('Replace About us guard',1246,549,'8428-243509','8428:243492');shot('about-guard');
step('Back to template preview',720,457,'8428-243434','8428:243581');
step('Reopen replacement guard',1246,549,'8428-243509','8428:243492');
step('Keep About us blank',720,497,'8329-1288','8428:243582');
step('Reopen templates for cancel',842,427,'8428-243434','8329:1360');
step('Return from templates',94,28,'8329-1288','8428:243437');
step('Open insertion Add',638,427,'8415-1581','8329:1359');
step('Insertion Add Escape','Escape',0,'8329-1288','8415:1581');
start('8317-243717');
step('Saved catalog',269,167,'8428-243704','8317:243905');shot('saved-catalog');
step('Elements return',112,167,'8317-243717','8428:243758');
step('Saved reopen',269,167,'8428-243704','8317:243905');
step('Select Project grid',200,243,'8317-246897','8428:243765');
start('8317-297');
step('Home Media manage',30,250,'8432-1646','8317:331');shot('media-management');
step('Media return Heading',94,28,'8317-297','8432:1649');
step('Home CMS',30,301,'8334-1250','8317:335');
step('CMS return Heading',94,28,'8317-297','8334:1253');
console.log(JSON.stringify({passed:out.steps.length}));

