const {execFileSync}=require('node:child_process');
const env={...process.env,BROWSE_STATE_FILE:'/tmp/buildrick-current-flow-walk/browse.json',GSTACK_DISABLE_GPU:'off',BROWSE_PARENT_PID:'0',BROWSE_START_TIMEOUT:'45000'};
const args=process.argv.slice(2);
if(args[0]==='walk'){
 const fs=require('node:fs'),path=require('node:path');
 const steps=JSON.parse(fs.readFileSync(args[1],'utf8')),out=[];
 const run=(...a)=>execFileSync('/Users/shahg/.claude/skills/gstack/browse/dist/browse',a,{env,encoding:'utf8',timeout:60000}).trim();
 run('viewport','1440x1000');
 for(const s of steps){
  if(s.goto){try{run('goto','https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id='+s.goto.replace(':','-')+'&starting-point-node-id='+encodeURIComponent(s.goto)+'&hide-ui=1');}catch(e){if(!String(e).includes('Timeout'))throw e;}run('js','new Promise(r=>setTimeout(()=>r("settled"),8000))');}
  if(s.x!==undefined){const x=s.x,y=s.y;run('js',`(async()=>{const x=${x},y=${y},e=document.elementFromPoint(x,y);for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));await new Promise(r=>setTimeout(r,800));return location.href;})()`);}
  if(s.press)run('press',s.press);
  if(s.wait)run('js',`new Promise(r=>setTimeout(()=>r('settled'),${s.wait}))`);
  const url=run('url');
  if(s.shot)run('screenshot',path.join(__dirname,s.shot));
  const row={...s,url,verification:s.expected?(new URL(url).searchParams.get('node-id')===s.expected.replace(':','-')?'URL_MATCH':'URL_MISMATCH'):'VISUAL_REVIEW_REQUIRED'};out.push(row);
  fs.writeFileSync(args[1]+'.receipt.json',JSON.stringify(out,null,2));console.log(JSON.stringify(row));
 }
 process.exit(0);
}
if(args[0]==='tap'){
 const x=Number(args[1]),y=Number(args[2]);
 args.splice(0,args.length,'js',`(async()=>{const x=${x},y=${y},e=document.elementFromPoint(x,y);for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));await new Promise(r=>setTimeout(r,700));return location.href;})()`);
}
process.stdout.write(execFileSync('/Users/shahg/.claude/skills/gstack/browse/dist/browse',args,{env,encoding:'utf8',timeout:60000}));
