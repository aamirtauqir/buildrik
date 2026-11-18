// B8 Site settings fixes (compact header, role line, topbar active entry) + Account › Privacy usage-data setting (P25 visible exception).
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
const S=page.children.filter(n=>/^B8-S\d/.test(n.name));let fixed=0;
for(const r of S){const se=r.findOne(n=>n.name==='Site settings / visible labeled entry');if(se)se.fills=[paint('accent-subtle')];
 const rl=r.findOne(n=>n.name==='Role line');if(rl){for(const c of [...rl.children])c.remove();rl.layoutMode='VERTICAL';rl.itemSpacing=2;const role=r.name.includes('Editor')?'Editor':'Admin';text(rl,'Your role: '+role,208,'Meta','ink-soft');const p=button(rl,'Permissions ›','link',100);try{p.primaryAxisAlignItems='MIN';p.paddingLeft=0;}catch(e){}}fixed++;}
{const r=S.find(n=>n.name.startsWith('B8-S21'));const idr=r.findOne(n=>n.name==='Identity and return');const t=idr.children.find(n=>n.type==='TEXT');t.resize(1176-120-168-24,t.height);const ft=r.findOne(n=>n.name==='Settings footer');const tx=ft.children.find(n=>n.type==='TEXT');tx.resize(1224-48-96-136-16,tx.height);}
// S22 Account › Privacy (bounded linked account surface, per user)
async function acct(code,title,on,stateMsg,tone){const r=figma.createFrame();page.appendChild(r);r.name='B8-'+code+' · '+title;r.resize(1440,900);r.x=80+(roots.length%4)*1560;r.y=batchY+Math.floor(roots.length/4)*1060;roots.push(r);r.fills=[paint('bg-app')];r.layoutMode='VERTICAL';
 const top=frame(r,'Dashboard header',1440,56,'HORIZONTAL','bg-panel');top.paddingLeft=24;top.counterAxisAlignItems='CENTER';line(top);text(top,'Buildrick · Account settings',600,'Panel');
 const body=frame(r,'Account body',1440,844,'HORIZONTAL',null);body.paddingLeft=120;body.paddingTop=32;body.itemSpacing=32;const nav=frame(body,'Account nav',200,null,'VERTICAL',null);nav.itemSpacing=2;for(const x of ['Profile','Security','Notifications','Privacy']){const b=button(nav,x,'ghost',200);try{b.primaryAxisAlignItems='MIN';b.paddingLeft=12;}catch(e){}if(x==='Privacy')b.fills=[paint('accent-subtle')];}
 const c=frame(body,'Privacy card',720,null,'VERTICAL','bg-panel');pad(c,20);c.itemSpacing=10;radius(c,'lg');c.strokes=[paint('border')];c.strokeWeight=1;text(c,'Privacy',680,'Dialog');
 const row=frame(c,'Usage data',680,null,'HORIZONTAL',null);row.itemSpacing=12;row.counterAxisAlignItems='CENTER';const col=frame(row,'Text',600,null,'VERTICAL',null);col.itemSpacing=4;text(col,'Share product usage data with Buildrick',600,'Label');text(col,'Helps us see which editor features work and which confuse people. It never includes your site content or your visitors’ data. Applies to your account only.',600,'Meta','ink-soft');
 const sw=frame(row,'Switch / '+(on?'On':'Off'),40,22,'HORIZONTAL',on?'accent':'border-medium');radius(sw,'full');sw.paddingLeft=on?20:2;sw.counterAxisAlignItems='CENTER';const k=frame(sw,'Knob',18,18,'HORIZONTAL','bg-panel');radius(k,'full');
 if(stateMsg){const n=frame(c,'State',680,null,'HORIZONTAL',tone==='error'?'error-tint':'bg-subtle');pad(n,10);radius(n);text(n,stateMsg,660,'Body',tone==='error'?'error-text':'ink-soft');}
 text(c,'Visitor analytics for your published sites are separate: Site settings › Analytics.',680,'Meta','ink-soft');return r;}
await acct('S22','Account › Privacy / usage data on',true,null);
await acct('S23','Account › Privacy / turned off, saved',false,'Saved. Buildrick no longer receives usage data from your account.','info');
await acct('S24','Account › Privacy / couldn’t save, setting unchanged',true,'Couldn’t save your choice — it’s still on. Try again.','error');
await Promise.all(pending);
await (await figma.getNodeByIdAsync(roots[0].id)).screenshot({scale:.6});
return {fixed,...(await finish())};
