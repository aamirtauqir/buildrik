(()=>{
const cases=[];const rect=s=>{const e=document.querySelector(s);if(!e||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
for(const module of ['Editor','CMS','Assets','Brand','Components','Settings','Pages','Templates','Compare','TimeTravel','Help']){
 iaNavigate(module);const r={module,viewport:[innerWidth,innerHeight],largeText:document.body.classList.contains('text-large'),rootOverflow:document.documentElement.scrollWidth>innerWidth+1,top:rect('.top'),bottom:rect('.bottom'),rail:rect('.rail'),work:rect('#work'),nav:rect('.nav'),detail:rect('.detail'),canvas:rect('.canvas'),canvasToolbar:rect('.canvas-tools'),inspector:rect('.inspector')};r.pass=!r.rootOverflow&&r.work.h>150&&r.work.w>0&&r.bottom.y+r.bottom.h<=innerHeight+1;cases.push(r);
}
iaNavigate('CMS');iaTask('History');cases.push({module:'CMS+History',viewport:[innerWidth,innerHeight],largeText:document.body.classList.contains('text-large'),task:rect('.task'),rootOverflow:document.documentElement.scrollWidth>innerWidth+1,pass:!!rect('.task')&&rect('.task').x>=56&&rect('.task').x+rect('.task').w<=innerWidth+1});
window.iaGeometryCases=[...(window.iaGeometryCases||[]),...cases];return {cases:cases.length,failed:cases.filter(c=>!c.pass),editor:cases[0],resource:cases[2],tray:cases.at(-1)};
})()
