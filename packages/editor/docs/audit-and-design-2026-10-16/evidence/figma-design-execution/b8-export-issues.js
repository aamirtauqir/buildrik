// B8 Export dialog (P01 §14, T-EX-01–07) and Issues task with exact Fix and return (P12 Issues row, J-F4).
// Prepend continuation-helpers.js with page '3:7'. Design output only; nothing is exported or changed.
const BASE='10:1626';
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
async function settle(){await Promise.all(pending);pending.length=0;}
function left(b){try{b.primaryAxisAlignItems='MIN';b.paddingLeft=0;}catch(e){}return b;}
function dis(b,label){b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':label});b.name=label;}
const TONE={error:['error-tint','error-text'],warning:['warning-tint','warning-text'],info:['bg-subtle','ink'],success:['success-tint','success-text']};
function note(p,msg,tone,w){const [bg,fg]=TONE[tone];const n=frame(p,'Note / '+msg.slice(0,30),w,null,'HORIZONTAL',bg);pad(n,10);radius(n);text(n,msg,w-20,'Body',fg);return n;}
async function ed(code,title){const r=await clone(BASE,'B8-'+code+' · '+title);await settle();status(r,'Saved just now');return r;}
async function exportDlg(code,title,{tab='Preview',state=null,offline=false,free=false}={}){const r=await ed(code,title);if(offline)status(r,'Offline — will save when back online');
 const sc=figma.createRectangle();r.appendChild(sc);sc.name='Modal scrim';sc.layoutPositioning='ABSOLUTE';sc.resize(1440,900);sc.x=0;sc.y=0;sc.fills=[paint('ink')];sc.opacity=.24;
 const d=frame(r,'Export site',720,null,'VERTICAL','bg-panel');d.layoutPositioning='ABSOLUTE';d.x=360;d.y=120;d.itemSpacing=0;radius(d,'xl');pending.push(d.setEffectStyleIdAsync(FX.Overlay.id));
 const h=frame(d,'Header',720,48,'HORIZONTAL',null);h.paddingLeft=24;h.paddingRight=12;h.counterAxisAlignItems='CENTER';line(h);text(h,'Export site',644,'Dialog');button(h,'✕','ghost',32);
 const tb=frame(d,'Tabs',720,40,'HORIZONTAL',null);tb.paddingLeft=24;tb.itemSpacing=4;tb.counterAxisAlignItems='CENTER';line(tb);const tabs={};for(const t of ['Preview','Code','Options']){const b=button(tb,t,'ghost',t.length*7+32);if(t===tab)b.fills=[paint('accent-subtle')];tabs[t]=b;}
 const body=frame(d,'Body',720,420,'VERTICAL',null);pad(body,24);body.itemSpacing=12;body.clipsContent=true;
 const fm=frame(body,'Format',672,null,'HORIZONTAL',null);fm.itemSpacing=16;fm.counterAxisAlignItems='CENTER';text(fm,'Format',60,'Label');for(const [f,on] of [['HTML',false],['ZIP',true],['React',false]])text(fm,(on?'● ':'○ ')+f,80,'Body',on?'accent':'ink');
 if(state==='error'){note(body,'Couldn’t load the export preview.','error',672);button(body,'Retry','primary',88);}
 else if(tab==='Preview'){const pv=frame(body,'Preview',672,300,'VERTICAL',state==='loading'?'bg-subtle':'bg-app');radius(pv,'md');pv.strokes=[paint('border')];pv.strokeWeight=1;pad(pv,24);pv.itemSpacing=8;if(state!=='loading'){text(pv,'fieldwork.',200,'Label');text(pv,'Thoughtful design. Lasting impact.',600,'Area');const g=frame(pv,'Block',620,140,'VERTICAL','bg-subtle');radius(g,'sm');}}
 else if(tab==='Code'){const c=frame(body,'Code',672,280,'VERTICAL','bg-subtle');pad(c,16);radius(c,'md');c.itemSpacing=2;for(const l of ['<!doctype html>','<html lang="en">','<head>','  <meta name="viewport" content="width=device-width, initial-scale=1">','  <link rel="stylesheet" href="styles.css">','</head>','<body>','  <header class="nav">…</header>','  <main>…</main>','</body>','</html>'])text(c,l,640,'Value');button(body,'Copy','secondary',80);}
 else {for(const [k,v] of [['CSS','One stylesheet  ▾'],['Minify','On'],['CSS reset','Include'],['Meta and viewport','Include'],['CMS content','Published records only  ▾']]){const rr=frame(body,'Option / '+k,672,null,'HORIZONTAL',null);rr.itemSpacing=12;rr.paddingTop=6;rr.paddingBottom=6;rr.counterAxisAlignItems='CENTER';line(rr);text(rr,k,200,'Label');text(rr,v,460,'Body');}if(free)note(body,'Custom code isn’t included on the Free plan.','info',672);}
 const ft=frame(d,'Footer',720,56,'HORIZONTAL',null);ft.paddingLeft=24;ft.paddingRight=24;ft.itemSpacing=8;ft.counterAxisAlignItems='CENTER';ft.strokes=[paint('border')];ft.strokeTopWeight=1;ft.strokeBottomWeight=0;ft.strokeLeftWeight=0;ft.strokeRightWeight=0;
 const msg={preparing:'Preparing your export…',ready:'Export ready — fieldwork-studio.zip downloaded',failed:'Export failed — the image studio-night.jpg couldn’t be read. Your options are kept.',offline:'Needs a connection to export. Preview and Code still work.'}[state==='offline'?'offline':state]||'';
 text(ft,msg,720-48-96-136-16,'Body',state==='failed'?'error-text':state==='ready'?'success-text':'ink-soft');const cancel=button(ft,state==='ready'?'Close':'Cancel','secondary',96);const ex=button(ft,state==='failed'?'Try again':state==='preparing'?'Exporting…':'Export',state==='offline'||state==='preparing'?'disabled':'primary',136);return {r,tabs,ex};}
const ex1=await exportDlg('EX01','Export site / Preview tab, ZIP');
const ex2=await exportDlg('EX02','Export site / Code tab with Copy',{tab:'Code'});
const ex3=await exportDlg('EX03','Export site / Options, Free custom-code note',{tab:'Options',free:true});
for(const e of [ex1,ex2,ex3])for(const k of Object.keys(e.tabs)){const target={Preview:ex1,Code:ex2,Options:ex3}[k];if(target!==e)link(e.tabs[k],target.r.id);}
const ex4=await exportDlg('EX04','Export site / preparing, button busy',{state:'preparing'});
const ex5=await exportDlg('EX05','Export site / ready only after the file exists',{state:'ready'});
const ex6=await exportDlg('EX06','Export site / failed with reason, options kept',{state:'failed'});
const ex7=await exportDlg('EX07','Export site / offline, Preview and Code still work',{state:'offline',offline:true});
const ex8=await exportDlg('EX08','Export site / preview failed to load',{state:'error'});
link(ex1.ex,ex4.r.id);
// Issues task (360) and J-F4 walk
async function issues(code,title,rows,{back='‹ Back to Inspector',resolved=false}={}){const r=await ed(code,title);const ins=r.findOne(n=>n.name==='Inspector / selected-object owner');ins.name='Task host / Issues';for(const c of [...ins.children])c.remove();ins.resize(360,812);ins.itemSpacing=0;const col=r.findOne(n=>n.name==='Canvas column');col.resize(740,812);for(const c of col.children)if(c.width===800)c.resize(740,c.height);
 const h=frame(ins,'Task header',360,48,'HORIZONTAL',null);h.paddingLeft=12;h.paddingRight=8;h.counterAxisAlignItems='CENTER';line(h);text(h,'Issues',280,'Panel');button(h,'✕','ghost',32);
 const b=frame(ins,'Task body',360,null,'VERTICAL',null);b.paddingLeft=12;b.paddingRight=12;b.paddingTop=12;b.itemSpacing=8;const refs=[];
 text(b,resolved?'1 blocking issue left':'2 issues block publishing · 3 tips',336,'Label');for(const [sev,t,where] of rows){const rr=frame(b,'Issue / '+t,336,null,'VERTICAL',sev==='✕'?'error-tint':'bg-subtle');pad(rr,10);rr.itemSpacing=4;radius(rr);text(rr,sev+' '+t,316,'Label',sev==='✕'?'error-text':'ink');text(rr,where,316,'Meta','ink-soft');refs.push(left(button(rr,'Fix ›','link',48)));}return {r,refs};}
const ROWS=[['✕','Collection list “Latest posts” has no source','Home › Journal section'],['✕','Button links to a deleted page','Work › Hero › “See projects”'],['!','2 images have no alt text','Home › Hero, About › Team']];
const is1=await issues('IS01','Issues / blocking first, Fix opens the exact target',ROWS);
const is2=await ed('IS02','Fix opened the target / Back to Issues');{const ins=is2.findOne(n=>n.name==='Inspector / selected-object owner');const bar=frame(null,'Return bar',300,36,'HORIZONTAL','accent-tint');ins.insertChild(0,bar);bar.paddingLeft=8;bar.counterAxisAlignItems='CENTER';const bk=left(button(bar,'‹ Back to Issues','link',120));text(bar,'Fixing 1 of 2',160,'Meta','ink-soft');const col=is2.findOne(n=>n.name==='Canvas column');const n=frame(null,'Target note',800,null,'HORIZONTAL','bg-subtle');col.insertChild(1,n);pad(n,8);text(n,'Selected: Journal section › Collection list. Choose a source in Inspector › Content › Source.',780,'Body');link(bk,is1.r.id);}
link(is1.refs[0],is2.id);
const is3=await issues('IS03','Back in Issues / one fixed, list updated',ROWS.slice(1),{resolved:true});
// board
const board=frame(null,'B8 Export and Issues / handoff',1440,null,'VERTICAL','bg-panel');page.appendChild(board);board.x=80;board.y=batchY+Math.ceil((roots.length+1)/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Export EX01–EX08 and Issues IS01–IS03 · design output, nothing exported',1392,'Area');
for(const l of ['Export dialog 720 (T-EX-01–07): tabs Preview · Code · Options; formats HTML · ZIP · React only (no “Soon”); Preparing keeps width and Cancel; Ready only after the file exists; Failed names the reason and keeps options; offline keeps Preview/Code and disables Export with “Needs a connection”; load error with Retry; Free info line only when the site has custom code. Export stays allowed on locked sites.',
 'Issues task (J-F4 start): blocking first, every row names where it is and has Fix ›; Fix selects the exact element and shows “‹ Back to Issues · Fixing 1 of 2”; returning shows the updated list. Continues into Publish PB01→PB02→PB04.',
 'Not verified: real export output, React compatibility, keyboard/focus, playback.'])text(board,l,1392,'Body');
return await finish();
