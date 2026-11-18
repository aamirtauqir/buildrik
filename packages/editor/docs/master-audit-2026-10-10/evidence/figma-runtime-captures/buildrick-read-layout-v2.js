/* Read-only DOM capture v2. Evaluate as one expression. No network or DOM writes.
 * Stacking contexts stay atomic; items carry ordered context paths for renderer.
 * CSS 3D/preserve-3d, blend/filter compositing, arbitrary canvas and pseudo layout
 * are explicitly reported rather than presented as exact reconstruction. */
(() => {
 const captureWindow=(win)=>{
  const document=win.document,getComputedStyle=win.getComputedStyle.bind(win),DOMParser=win.DOMParser,XMLSerializer=win.XMLSerializer;
  const {HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLCanvasElement,HTMLImageElement}=win;
  const W=win.innerWidth,H=win.innerHeight,items=[],warnings=[],contexts=[];
  const styles=new WeakMap(),nodes=new WeakMap(),scaleCache=new WeakMap();let sequence=0;
  const st=e=>{if(!styles.has(e))styles.set(e,getComputedStyle(e));return styles.get(e);};
  const num=s=>parseFloat(s)||0,round=n=>Math.round(n*100)/100;
  const rect=r=>({x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height)});
  const warn=(name,reason)=>warnings.push({name,reason});
  const split=s=>{let out=[],start=0,depth=0,quote='';for(let k=0;k<s.length;k++){const c=s[k];if(quote){if(c===quote&&s[k-1]!=='\\')quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='(')depth++;else if(c===')')depth--;else if(c===','&&!depth){out.push(s.slice(start,k).trim());start=k+1;}}out.push(s.slice(start).trim());return out;};
  const visible=(r,s)=>r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<W&&r.top<H&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0;
  function clipFor(e){let q={x:0,y:0,right:W,bottom:H},fixed=st(e).position==='fixed';let p=e.parentElement;
    while(p&&p!==document.documentElement){const s=st(p),r=p.getBoundingClientRect();
      // A transform/filter/contain ancestor establishes a fixed containing block.
      if(fixed&&(s.transform!=='none'||s.filter!=='none'||/paint|layout|strict|content/.test(s.contain)))fixed=false;
      if(!fixed){if(/^(hidden|auto|scroll|clip)$/.test(s.overflowX)){q.x=Math.max(q.x,r.x+p.clientLeft);q.right=Math.min(q.right,r.x+p.clientLeft+p.clientWidth);}if(/^(hidden|auto|scroll|clip)$/.test(s.overflowY)){q.y=Math.max(q.y,r.y+p.clientTop);q.bottom=Math.min(q.bottom,r.y+p.clientTop+p.clientHeight);}}
      if(s.position==='fixed')fixed=true;p=p.parentElement;
    }return q;
  }
  const overlaps=(r,c)=>r.right>c.x&&r.bottom>c.y&&r.left<c.right&&r.top<c.bottom;
  function isContext(e,s){const p=e.parentElement&&st(e.parentElement),flex=p&&/(flex|grid)/.test(p.display);return e===document.body||/^(fixed|sticky)$/.test(s.position)||((s.position!=='static'||flex)&&s.zIndex!=='auto')||Number(s.opacity)<1||s.transform!=='none'||s.perspective!=='none'||s.filter!=='none'||(s.backdropFilter&&s.backdropFilter!=='none')||s.isolation==='isolate'||s.mixBlendMode!=='normal'||(s.clipPath&&s.clipPath!=='none')||/paint|layout|strict|content/.test(s.contain)||/(transform|opacity|filter|perspective)/.test(s.willChange);}
  const topLayer=e=>{try{return e.matches(':modal,:popover-open')||e===document.fullscreenElement;}catch{return false;}};
  function add(n,i,background=false){i.contextId=n.ctx.id;i.domOrder=n.order;i.clip=i.clip||clipFor(n.e);i.source={tag:n.e.tagName.toLowerCase(),id:n.e.id||undefined,testId:n.e.getAttribute('data-testid')||undefined};(background?n.bg:n.fg).push(i);}
  function box(e,s,r,name){return {kind:'box',name,...rect(r),fill:s.backgroundColor,backgroundImage:s.backgroundImage,backgroundSize:s.backgroundSize,backgroundPosition:s.backgroundPosition,backgroundRepeat:s.backgroundRepeat,backgroundOrigin:s.backgroundOrigin,backgroundClip:s.backgroundClip,radius:num(s.borderTopLeftRadius),radii:['TopLeft','TopRight','BottomRight','BottomLeft'].map(k=>num(s['border'+k+'Radius'])),borders:['Top','Right','Bottom','Left'].map(k=>({width:num(s['border'+k+'Width']),color:s['border'+k+'Color'],style:s['border'+k+'Style']})),shadow:s.boxShadow,opacity:1};}
  function decodeSvg(url){const m=url.match(/^url\(["']?(data:image\/svg\+xml[^]*?)["']?\)$/i);if(!m)return null;let data=m[1].replace(/["']$/,'');const comma=data.indexOf(',');if(comma<0)return null;try{const xml=/;base64/i.test(data.slice(0,comma))?atob(data.slice(comma+1)):decodeURIComponent(data.slice(comma+1));const doc=new DOMParser().parseFromString(xml,'image/svg+xml');if(doc.querySelector('parsererror'))return null;doc.querySelectorAll('script,foreignObject').forEach(x=>x.remove());const root=doc.documentElement;const vb=(root.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);return {svg:new XMLSerializer().serializeToString(root),w:num(root.getAttribute('width'))||vb[2]||0,h:num(root.getAttribute('height'))||vb[3]||0};}catch{return null;}}
  function bgSvg(n,s,r,name){const scale=scaleFor(n.e),layers=split(s.backgroundImage||'none'),sizes=split(s.backgroundSize||'auto'),positions=split(s.backgroundPosition||'0% 0%'),repeats=split(s.backgroundRepeat||'repeat');
    for(let k=layers.length-1;k>=0;k--){if(!layers[k].startsWith('url('))continue;const a=decodeSvg(layers[k]);if(!a){warn(name,'Non-SVG/external background image retained as metadata; not fetched.');continue;}const repeat=repeats[k%repeats.length];if(repeat!=='no-repeat'){warn(name,'Repeated SVG background is unsupported; no single fake tile drawn.');continue;}
      const origin=split(s.backgroundOrigin||'padding-box')[k%split(s.backgroundOrigin||'padding-box').length],pl=num(s.paddingLeft)*scale.x,pr=num(s.paddingRight)*scale.x,pt=num(s.paddingTop)*scale.y,pb=num(s.paddingBottom)*scale.y,bl=num(s.borderLeftWidth)*scale.x,br=num(s.borderRightWidth)*scale.x,bt=num(s.borderTopWidth)*scale.y,bb=num(s.borderBottomWidth)*scale.y;
      const area={x:r.x+(origin==='border-box'?0:bl+(origin==='content-box'?pl:0)),y:r.y+(origin==='border-box'?0:bt+(origin==='content-box'?pt:0)),w:r.width-(origin==='border-box'?0:bl+br+(origin==='content-box'?pl+pr:0)),h:r.height-(origin==='border-box'?0:bt+bb+(origin==='content-box'?pt+pb:0))};
      let w=a.w*scale.x,h=a.h*scale.y;const size=sizes[k%sizes.length].split(/\s+/);if(size[0]==='cover'||size[0]==='contain'){const ratio=(size[0]==='cover'?Math.max:Math.min)(area.w/w,area.h/h);w*=ratio;h*=ratio;}else{const dim=(v,d,sc)=>v?.endsWith('%')?num(v)*d/100:num(v)*sc;if(size[0]!=='auto'){w=dim(size[0],area.w,scale.x);h=size[1]&&size[1]!=='auto'?dim(size[1],area.h,scale.y):a.h*w/a.w*scale.y/scale.x;}else if(size[1]&&size[1]!=='auto'){h=dim(size[1],area.h,scale.y);w=a.w*h/a.h*scale.x/scale.y;}}
      if(!(w>0&&h>0)){warn(name,'SVG background has no usable intrinsic/declared dimensions.');continue;}
      const pos=positions[k%positions.length].split(/\s+/);if(pos.length>2){warn(name,'Four-value SVG background position unsupported.');continue;}if(pos.length===1)pos.push('50%');const offset=(v,free,sc)=>v==='center'?free/2:v==='left'||v==='top'?0:v==='right'||v==='bottom'?free:v.endsWith('%')?num(v)*free/100:num(v)*sc;
      const c=clipFor(n.e);add(n,{kind:'svg',name:'CSS background / '+name,x:round(area.x+offset(pos[0],area.w-w,scale.x)),y:round(area.y+offset(pos[1],area.h-h,scale.y)),w:round(w),h:round(h),svg:a.svg,cssBackgroundIndex:k,clip:{x:Math.max(c.x,r.x),y:Math.max(c.y,r.y),right:Math.min(c.right,r.right),bottom:Math.min(c.bottom,r.bottom)}},true);
    }
  }
  function scaleFor(e){if(scaleCache.has(e))return scaleCache.get(e);let sx=1,sy=1;for(let p=e;p;p=p.parentElement){const s=st(p);if(s.transform&&s.transform!=='none'){try{const m=new win.DOMMatrixReadOnly(s.transform);if(Math.abs(m.b)<.0001&&Math.abs(m.c)<.0001){sx*=Math.abs(m.a);sy*=Math.abs(m.d);}else warn(p.id||p.tagName,'Rotated/skewed text uses axis-aligned bounds; visual review required.');}catch{}}const zoom=Number(s.zoom);if(zoom>0){sx*=zoom;sy*=zoom;}}const value={x:sx,y:sy};scaleCache.set(e,value);return value;}
  function textData(e,s,r,text,name){const scale=scaleFor(e);const er=e.getBoundingClientRect(),isEllipsis=s.textOverflow==='ellipsis'&&/^(hidden|clip|auto|scroll)$/.test(s.overflowX)&&s.whiteSpace==='nowrap';let b=rect(r);if(isEllipsis){const scale=e.offsetWidth?er.width/e.offsetWidth:1;const left=er.x+(e.clientLeft+num(s.paddingLeft))*scale;const width=Math.max(1,(e.clientWidth-num(s.paddingLeft)-num(s.paddingRight))*scale);b={...b,x:round(left),w:round(width)};}
    return {kind:'text',name,...b,text,size:num(s.fontSize)*scale.y,singleLine:r.height<num(s.fontSize)*scale.y*1.65,weight:s.fontWeight,fontStyle:s.fontStyle,font:s.fontFamily,color:s.color,lineHeight:num(s.lineHeight)?String(num(s.lineHeight)*scale.y)+'px':s.lineHeight,letterSpacing:num(s.letterSpacing)?String(num(s.letterSpacing)*scale.x)+'px':s.letterSpacing,align:isEllipsis?s.textAlign:'left',sourceTextAlign:s.textAlign,whiteSpace:s.whiteSpace,textOverflow:s.textOverflow,overflowX:s.overflowX,ellipsis:isEllipsis,direction:s.direction,decoration:s.textDecorationLine};
  }
  function canvasModel(e){if(!e.closest('[data-testid="color-picker"]'))return null;const label=e.getAttribute('aria-label'),picker=e.closest('[data-testid="color-picker"]'),hue=picker.querySelector('canvas[aria-label="Hue"]'),shade=picker.querySelector('canvas[aria-label="Shade"]');const knob=hue?.nextElementSibling,cross=shade?.nextElementSibling;
    if(label==='Hue')return {kind:'hue'};if(!knob||!cross||!knob.style.left.endsWith('%')||!cross.style.left.endsWith('%'))return null;
    if(label==='Shade')return {kind:'shade',hueColor:st(knob).backgroundColor};if(label==='Opacity')return {kind:'alpha',hue:num(knob.style.left)*3.6,sat:num(cross.style.left)/100,tile:6,intrinsicWidth:e.width,intrinsicHeight:e.height};return null;
  }
  function walk(e,parent,ctx){if(['SCRIPT','STYLE','NOSCRIPT','NEXTJS-PORTAL'].includes(e.tagName))return null;const s=st(e);let r=e.getBoundingClientRect();if(e===document.body&&(r.width===0||r.height===0))r={x:0,y:0,width:W,height:H,left:0,top:0,right:W,bottom:H};if(s.display==='none'||Number(s.opacity)===0||s.clip==='rect(0px, 0px, 0px, 0px)'||s.clipPath==='inset(50%)')return null;
    const n={e,order:sequence++,parent,children:[],bg:[],fg:[],after:[],ctx,positioned:s.position!=='static',float:s.cssFloat!=='none'};nodes.set(e,n);if(parent)parent.children.push(n);
    if(isContext(e,s)){const c={id:contexts.length,root:n,parent:ctx,children:[],z:s.zIndex==='auto'?0:Number(s.zIndex)||0,order:n.order,opacity:Number(s.opacity),name:e.getAttribute('data-testid')||e.id||e.tagName.toLowerCase(),topLayer:topLayer(e)};contexts.push(c);if(ctx)ctx.children.push(c);n.ctx=c;ctx=c;}
    const name=e.getAttribute('aria-label')||e.getAttribute('data-testid')||e.id||e.tagName.toLowerCase(),c=clipFor(e);const ok=visible(r,s)&&overlaps(r,c);
    if(ok){
      if(s.cssFloat!=='none')warn(name,'Float paint ordering is approximated; visual review required.');if(s.clipPath&&s.clipPath!=='none')warn(name,'CSS clip-path geometry is not reconstructed.');
      if(s.transformStyle==='preserve-3d'||s.mixBlendMode!=='normal'||s.filter!=='none'||(s.backdropFilter&&s.backdropFilter!=='none'))warn(name,'3D/blend/filter compositing not reconstructed; stacking context retained.');
      if(s.backgroundColor!=='rgba(0, 0, 0, 0)'||s.backgroundImage!=='none'||['Top','Right','Bottom','Left'].some(k=>num(s['border'+k+'Width'])))add(n,box(e,s,r,name),true);
      bgSvg(n,s,r,name);
      if(e.tagName.toLowerCase()==='svg'){const clone=e.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width',String(r.width));clone.setAttribute('height',String(r.height));const os=[e,...e.querySelectorAll('*')],cs=[clone,...clone.querySelectorAll('*')];os.forEach((o,k)=>{const v=st(o);for(const key of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-opacity','stroke-opacity','opacity'])cs[k].setAttribute(key,v.getPropertyValue(key));});clone.setAttribute('opacity','1');add(n,{kind:'svg',name,...rect(r),svg:clone.outerHTML});return n;}
      if(e.tagName==='IFRAME'){try{if(e.contentDocument&&e.contentWindow){const sx=r.width/(e.offsetWidth||r.width),sy=r.height/(e.offsetHeight||r.height);add(n,{kind:'iframe-capture',name,x:r.x+e.clientLeft*sx,y:r.y+e.clientTop*sy,w:e.clientWidth*sx,h:e.clientHeight*sy,scaleX:sx,scaleY:sy,data:captureWindow(e.contentWindow)});}else warn(name,'Cross-origin iframe contents unavailable.');}catch(err){warn(name,'Iframe contents unavailable: '+String(err));}}
      if(e instanceof HTMLCanvasElement){const model=canvasModel(e);if(model)add(n,{kind:'canvas-model',name,...rect(r),model,radius:num(s.borderTopLeftRadius)});else warn(name,'Canvas bitmap not extracted; no editable model available.');}
      if(e instanceof HTMLImageElement&&e.currentSrc&&!s.content.startsWith('url('))warn(name,'Raster img requires separately supplied authorized image fill; not fetched.');
      if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement||e instanceof HTMLSelectElement){const val=e instanceof HTMLSelectElement?e.selectedOptions[0]?.textContent:e.value||e.placeholder;if(val&&!['checkbox','radio','file','password'].includes(e.type)){const scale=scaleFor(e),lh=(num(s.lineHeight)||num(s.fontSize)*1.2)*scale.y,pl=(num(s.paddingLeft)+num(s.borderLeftWidth))*scale.x,pt=(num(s.paddingTop)+num(s.borderTopWidth))*scale.y;const tr={x:r.x+pl,y:e instanceof HTMLTextAreaElement?r.y+pt:r.y+(r.height-lh)/2,width:Math.max(1,r.width-pl-(num(s.paddingRight)+num(s.borderRightWidth))*scale.x),height:lh};let ti=textData(e,s,tr,val,'Value / '+name);ti.align=s.textAlign;ti.clip={x:Math.max(c.x,tr.x),y:Math.max(c.y,r.y),right:Math.min(c.right,tr.x+tr.width),bottom:Math.min(c.bottom,r.bottom)};if(!e.value&&e.placeholder)ti.color=getComputedStyle(e,'::placeholder').color;add(n,ti);}}
      const mergeEllipsis=e.children.length===0&&s.textOverflow==='ellipsis'&&/^(hidden|clip|auto|scroll)$/.test(s.overflowX)&&s.whiteSpace==='nowrap';const textNodes=mergeEllipsis?[e]:e.childNodes;for(const node of textNodes){if((node!==e&&node.nodeType!==3)||!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);const tr=range.getBoundingClientRect();if(!visible(tr,s)||!overlaps(tr,c))continue;let text=/^(pre|pre-wrap|break-spaces)$/.test(s.whiteSpace)?node.textContent:node.textContent.replace(/\s+/g,' ');if(s.textTransform==='uppercase')text=text.toUpperCase();if(s.textTransform==='lowercase')text=text.toLowerCase();add(n,textData(e,s,tr,text,text.trim().slice(0,70)));}
      for(const pseudo of ['::before','::after']){const ps=getComputedStyle(e,pseudo);if(!ps.content||ps.content==='none'||ps.content==='normal'||ps.display==='none')continue;
        if(!['""',"''"].includes(ps.content)||!['absolute','fixed'].includes(ps.position)||!ps.width.endsWith('px')||!ps.height.endsWith('px')){warn(name+pseudo,'Generated pseudo content/layout unsupported; not guessed.');continue;}
        let owner=e;while(owner.parentElement&&st(owner).position==='static'&&st(owner).transform==='none')owner=owner.parentElement;const or=ps.position==='fixed'?{x:0,y:0,width:W,height:H}:owner.getBoundingClientRect(),sc=scaleFor(owner);let pw=num(ps.width)*sc.x,ph=num(ps.height)*sc.y;if(!(pw>0&&ph>0))continue;
        const inset=(v,extent,scale)=>v.endsWith('%')?num(v)*extent/100:num(v)*scale;let px=ps.left!=='auto'?or.x+inset(ps.left,or.width,sc.x):ps.right!=='auto'?or.x+or.width-inset(ps.right,or.width,sc.x)-pw:NaN,py=ps.top!=='auto'?or.y+inset(ps.top,or.height,sc.y):ps.bottom!=='auto'?or.y+or.height-inset(ps.bottom,or.height,sc.y)-ph:NaN;
        if(ps.transform!=='none'){try{const m=new win.DOMMatrixReadOnly(ps.transform);if(m.b||m.c||m.a!==1||m.d!==1)throw Error('non-translation');px+=m.e*sc.x;py+=m.f*sc.y;}catch{warn(name+pseudo,'Pseudo transform unsupported');continue;}}
        if(!Number.isFinite(px)||!Number.isFinite(py)){warn(name+pseudo,'Pseudo auto positioning requires layout capture');continue;}
        const pr={x:px,y:py,width:pw,height:ph,right:px+pw,bottom:py+ph,left:px,top:py},pi=box(e,ps,pr,name+pseudo);pi.opacity=Number(ps.opacity);const start=n.bg.length;add(n,pi,true);bgSvg(n,ps,pr,name+pseudo);const emitted=n.bg.splice(start);(pseudo==='::after'?n.after:n.fg).push(...emitted);
      }
    }
    const kids=[...e.children];if(/flex|grid/.test(s.display))kids.sort((a,b)=>(Number(st(a).order)||0)-(Number(st(b).order)||0));for(const child of kids)walk(child,n,ctx);return n;
  }
  const root=walk(document.body,null,null);
  function emit(list){for(const i of list){i.paintOrder=items.length;items.push(i);}}
  // Context descendants are promoted only to their nearest real context. A
  // z:999 child inside z:1 cannot jump over its parent's z:2 sibling.
  function paintContext(c){const positive=c.children.filter(x=>x.z>=0).sort((a,b)=>a.z-b.z||a.order-b.order),negative=c.children.filter(x=>x.z<0).sort((a,b)=>a.z-b.z||a.order-b.order),positioned=[];emit(c.root.bg);negative.forEach(paintContext);
    function flow(n,isRoot=false,force=false){if(n.ctx!==c)return;if(!isRoot&&n.positioned&&!force){positioned.push(n);return;}if(!isRoot)emit(n.bg);emit(n.fg);for(const child of n.children)flow(child);emit(n.after);}
    flow(c.root,true);const zero=positive.filter(x=>x.z===0).map(x=>({order:x.order,context:x}));for(const n of positioned)zero.push({order:n.order,node:n});zero.sort((a,b)=>a.order-b.order);for(let k=0;k<zero.length;k++){const q=zero[k];if(q.context)paintContext(q.context);else{const start=positioned.length;flow(q.node,false,true);for(const n of positioned.slice(start))zero.push({order:n.order,node:n});zero.splice(k+1,zero.length-k-1,...zero.slice(k+1).sort((a,b)=>a.order-b.order));}}
    positive.filter(x=>x.z>0).forEach(paintContext);
  }
  if(root)paintContext(root.ctx);
  const serialContexts=contexts.map(c=>({id:c.id,parentId:c.parent?.id??null,z:c.z,domOrder:c.order,name:c.name,opacity:c.opacity,topLayer:c.topLayer}));if(contexts.some(c=>c.topLayer))warn('document','Browser top-layer order needs manual comparison; DOM context order retained.');
  return {version:2,url:win.location.pathname,viewport:{width:W,height:H},capturedAt:new Date().toISOString(),contexts:serialContexts,warnings,items};
 };
 const data=captureWindow(window),flat=[],allContexts=[],allWarnings=[];
 function merge(d,ox=0,oy=0,sx=1,sy=1,parentId=null,outer={x:0,y:0,right:data.viewport.width,bottom:data.viewport.height}){
  const map=new Map(d.contexts.map(c=>[c.id,allContexts.length+c.id]));
  for(const c of d.contexts)allContexts.push({...c,id:map.get(c.id),parentId:c.parentId===null?parentId:map.get(c.parentId)});
  allWarnings.push(...d.warnings);
  for(const item of d.items){const i={...item,contextId:map.get(item.contextId),x:ox+item.x*sx,y:oy+item.y*sy,w:item.w*sx,h:item.h*sy};const c=item.clip||{x:0,y:0,right:d.viewport.width,bottom:d.viewport.height};i.clip={x:Math.max(outer.x,ox+c.x*sx),y:Math.max(outer.y,oy+c.y*sy),right:Math.min(outer.right,ox+c.right*sx),bottom:Math.min(outer.bottom,oy+c.bottom*sy)};
   if(i.kind==='iframe-capture'){merge(item.data,i.x,i.y,sx*item.scaleX,sy*item.scaleY,i.contextId,{x:Math.max(i.clip.x,i.x),y:Math.max(i.clip.y,i.y),right:Math.min(i.clip.right,i.x+i.w),bottom:Math.min(i.clip.bottom,i.y+i.h)});continue;}
   if(i.size){i.size*=sy;if(parseFloat(i.lineHeight))i.lineHeight=String(parseFloat(i.lineHeight)*sy)+'px';if(parseFloat(i.letterSpacing))i.letterSpacing=String(parseFloat(i.letterSpacing)*sx)+'px';}if(i.radius)i.radius*=Math.min(sx,sy);if(i.radii)i.radii=i.radii.map(v=>v*Math.min(sx,sy));if(i.borders)i.borders=i.borders.map(b=>({...b,width:b.width*Math.min(sx,sy)}));i.paintOrder=flat.length;flat.push(i);
  }
 }
 merge(data);data.items=flat;data.contexts=allContexts;data.warnings=allWarnings;return JSON.stringify(data);
})()
