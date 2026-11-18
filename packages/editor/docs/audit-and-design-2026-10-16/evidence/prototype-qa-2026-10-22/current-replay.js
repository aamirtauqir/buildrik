(async()=>{const steps=[{"origin": "462:51821", "control": "462:51905", "label": "Reset local override", "to": "462:52099", "x": 1279, "y": 585, "w": 1440, "h": 900}, {"origin": "462:52099", "control": "462:52195", "label": "Prototype scenarios", "to": "415:61494", "x": 1397, "y": 883, "w": 1440, "h": 900}, {"origin": "415:61494", "control": "415:61524", "label": "CF18 \u00b7 Master updated", "to": "415:55850", "x": 968, "y": 226, "w": 1200, "h": 1726}, {"origin": "415:55850", "control": "415:56158", "label": "Back to instance", "to": "462:51821", "x": 1279, "y": 553, "w": 1440, "h": 900}, {"origin": "462:51821", "control": "462:51906", "label": "Inspect heading child", "to": "462:52381", "x": 1279, "y": 617, "w": 1440, "h": 900}, {"origin": "462:52381", "control": "462:52487", "label": "Prototype scenarios", "to": "415:61494", "x": 1397, "y": 883, "w": 1440, "h": 900}],log=[],pause=ms=>new Promise(r=>setTimeout(r,ms));
const cur=()=>new URL(location.href).searchParams.get('node-id')?.replace('-',':');
for(const s of steps){
 if(cur()!==s.origin){log.push({...s,pass:false,actual:cur(),reason:'origin mismatch'});break;}
 await pause(250);
 const viewer=document.querySelector('canvas');if(!viewer)throw Error('No player canvas');
 const r=viewer.getBoundingClientRect(),scale=Math.min(1,r.width/s.w,r.height/s.h);
 const x=r.x+(r.width-s.w*scale)/2+s.x*scale,y=r.y+(r.height-s.h*scale)/2+s.y*scale;
 const target=document.elementFromPoint(x,y);
 if(!target){log.push({...s,pass:false,actual:cur(),reason:'no hit target',clientX:x,clientY:y});break;}
 for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])target.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));
 for(let i=0;i<20&&cur()!==s.to;i++)await pause(100);
 log.push({...s,pass:cur()===s.to,actual:cur(),clientX:x,clientY:y,viewport:[innerWidth,innerHeight],at:Date.now()});
 if(cur()!==s.to)break;
}return JSON.stringify(log);})()